#!/usr/bin/env python3
import json, re, urllib.request, urllib.error
from pathlib import Path
from collections import defaultdict

CFG = json.loads(Path('feishu-bitable-sync/config.json').read_text())
BASE = CFG['base_url']
APP_TOKEN = CFG['app_token']
LEGACY = Path('/Users/taofangzheng/.openclaw/media/inbound/gzipSnapshot.json')

FIELDS = [
    '学生姓名', '本科学校', '本科专业', 'GPA/均分', '雅思', '托福', 'GRE/GMAT',
    '录取院校', '录取专业', '案例说明/项目说明', '宣传完成情况', '备注'
]


def call(url, method='GET', payload=None, token=None):
    data = None
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    if payload is not None:
        data = json.dumps(payload).encode()
        headers['Content-Type'] = 'application/json; charset=utf-8'
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def get_token():
    return call(f"{BASE}/auth/v3/tenant_access_token/internal", 'POST', {
        'app_id': CFG['app_id'], 'app_secret': CFG['app_secret']
    })['tenant_access_token']


def rich_text(cell):
    if not cell:
        return None
    v = cell.get('value') if isinstance(cell, dict) else cell
    if v is None:
        return None
    if isinstance(v, list):
        s = ''.join((x.get('text') if isinstance(x, dict) else str(x)) for x in v)
        return s.strip() or None
    return str(v).strip() or None


def option_text(field_def, cell):
    if not cell:
        return None
    raw = cell.get('value') if isinstance(cell, dict) else cell
    if raw is None:
        return None
    opts = {o.get('id'): o.get('name') for o in (field_def.get('property') or {}).get('options', [])}
    if isinstance(raw, list):
        vals = [opts.get(x, x) for x in raw]
        vals = [v for v in vals if v]
        return ' / '.join(vals) if vals else None
    return opts.get(raw, raw)


def cell_text(field_def, cell):
    t = field_def.get('type')
    if t == 1:
        return rich_text(cell)
    if t in (3, 4):
        return option_text(field_def, cell)
    if t == 18:
        if not cell:
            return None
        return cell.get('value')
    return rich_text(cell)


def normalize_school(s):
    if not s:
        return None
    s = s.strip()
    if s == '中国人民大学中法学院':
        return '人大中法'
    return s


def parse_scores(raw):
    raw = (raw or '').strip()
    if not raw or raw.lower() == 'a':
        return None, None, None
    text = raw.replace('（', '(').replace('）', ')').replace(' ', '')
    ielts = None
    toefl = None
    gregmat = None

    m = re.search(r'托福\s*(\d{2,3})', text, re.I)
    if m:
        toefl = f'托福{m.group(1)}'
    m = re.search(r'雅思\s*([0-9](?:\.[0-9])?(?:\([0-9](?:\.[0-9])?\))?)', text, re.I)
    if m:
        ielts = f'雅思{m.group(1)}'

    if not ielts:
        m = re.search(r'([5-9](?:\.[0-9])?(?:\([0-9](?:\.[0-9])?\))?)', text)
        if m:
            ielts = f'雅思{m.group(1)}'

    if not toefl:
        nums = [int(x) for x in re.findall(r'(?<![0-9])(\d{2,3})(?![0-9])', text)]
        candidates = [n for n in nums if 90 <= n <= 120]
        if candidates and '托福' in raw:
            toefl = f'托福{candidates[0]}'

    m = re.search(r'(?:gre|gmat)\s*(\d{3})', text, re.I)
    if m:
        kind = 'GRE' if 'gre' in m.group(0).lower() else 'GMAT'
        gregmat = f'{kind}{m.group(1)}'
    if not gregmat:
        nums = [int(x) for x in re.findall(r'(?<![0-9])(\d{3})(?![0-9])', text)]
        nums = [n for n in nums if n > 120]
        if nums:
            n = nums[-1]
            gregmat = ('GRE' if n < 400 else 'GMAT') + str(n)
    return ielts, toefl, gregmat


def build_rows():
    arr = json.loads(LEGACY.read_text())
    result = {'24fall': [], '25fall': [], '26fall': []}
    for item in arr:
        s = item['schema']
        table_id = s['data']['table']['meta']['id']
        season = s['tableMap'][table_id]['name'].split()[0].lower()
        fmap = s['data']['table']['fieldMap']
        recs = s['data']['recordMap']

        if season in ('25fall', '26fall'):
            parents = {}
            children = defaultdict(list)
            for rid, rv in recs.items():
                row = {}
                parent_ids = None
                for fid, cell in rv.items():
                    fd = fmap[fid]
                    val = cell_text(fd, cell)
                    row[fd['name']] = val
                    if fd['type'] == 18 and val:
                        parent_ids = val
                if (row.get('姓名') or '').strip():
                    parents[rid] = row
                elif parent_ids:
                    for pid in parent_ids:
                        children[pid].append(row)
            for rid, prow in parents.items():
                for crow in children.get(rid, []):
                    score_raw = prow.get('标化') or crow.get('标化') or prow.get('标化成绩') or crow.get('标化成绩')
                    ielts, toefl, gregmat = parse_scores(score_raw)
                    result[season].append({
                        '学生姓名': (prow.get('姓名') or '').replace('✔', '').replace('✅', '').strip() or None,
                        '本科学校': normalize_school(prow.get('本科院校')),
                        '本科专业': prow.get('本科专业'),
                        'GPA/均分': prow.get('GPA/均分') or prow.get('均分|GPA'),
                        '雅思': ielts,
                        '托福': toefl,
                        'GRE/GMAT': gregmat,
                        '录取院校': crow.get('录取院校') or prow.get('录取院校'),
                        '录取专业': crow.get('录取专业') or prow.get('录取专业'),
                        '案例说明/项目说明': prow.get('案例说明/项目说明') or crow.get('案例说明/项目说明'),
                        '宣传完成情况': prow.get('宣传完成情况') or crow.get('宣传完成情况'),
                        '备注': None,
                    })
        else:
            for rid, rowv in recs.items():
                row = {}
                for fid, cell in rowv.items():
                    fd = fmap[fid]
                    row[fd['name']] = cell_text(fd, cell)
                ielts, toefl, gregmat = parse_scores(row.get('标化成绩'))
                result[season].append({
                    '学生姓名': None,
                    '本科学校': normalize_school(row.get('申请人本科层级') or row.get('本科院校')),
                    '本科专业': row.get('本科专业'),
                    'GPA/均分': row.get('均分|GPA') or row.get('GPA/均分'),
                    '雅思': ielts,
                    '托福': toefl,
                    'GRE/GMAT': gregmat,
                    '录取院校': row.get('录取院校'),
                    '录取专业': row.get('录取专业'),
                    '案例说明/项目说明': row.get('案例说明/项目说明'),
                    '宣传完成情况': row.get('宣传完成情况'),
                    '备注': None,
                })
    return result


def list_tables(token):
    return call(f"{BASE}/bitable/v1/apps/{APP_TOKEN}/tables?page_size=100", token=token)['data']['items']


def create_table(token, name):
    return call(f"{BASE}/bitable/v1/apps/{APP_TOKEN}/tables", 'POST', {'table': {'name': name}}, token)['data']['table_id']


def delete_table(token, table_id):
    return call(f"{BASE}/bitable/v1/apps/{APP_TOKEN}/tables/{table_id}", 'DELETE', token=token)


def list_fields(token, table_id):
    return call(f"{BASE}/bitable/v1/apps/{APP_TOKEN}/tables/{table_id}/fields?page_size=100", token=token)['data']['items']


def create_field(token, table_id, field_name):
    return call(f"{BASE}/bitable/v1/apps/{APP_TOKEN}/tables/{table_id}/fields", 'POST', {'field_name': field_name, 'type': 1}, token)


def list_records(token, table_id):
    return call(f"{BASE}/bitable/v1/apps/{APP_TOKEN}/tables/{table_id}/records?page_size=500", token=token)['data']['items'] or []


def delete_record(token, table_id, record_id):
    return call(f"{BASE}/bitable/v1/apps/{APP_TOKEN}/tables/{table_id}/records/{record_id}", 'DELETE', token=token)


def create_record(token, table_id, fields):
    return call(f"{BASE}/bitable/v1/apps/{APP_TOKEN}/tables/{table_id}/records", 'POST', {'fields': fields}, token)


def ensure_field_schema(token, table_id):
    existing = {f['field_name'] for f in list_fields(token, table_id)}
    for f in FIELDS:
        if f not in existing:
            create_field(token, table_id, f)


def main():
    token = get_token()
    rows = build_rows()
    Path('feishu-bitable-sync/data/rebuilt-offers.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2))

    tables = {t['name']: t['table_id'] for t in list_tables(token)}
    # create missing target tables
    for name in ['24fall', '25fall', '26fall']:
        if name not in tables:
            tables[name] = create_table(token, name)
    # delete old generic table if still present
    if 'Table' in tables:
        delete_table(token, tables['Table'])
        tables.pop('Table', None)
    # ensure only target tables remain for writing
    for name in ['24fall', '25fall', '26fall']:
        ensure_field_schema(token, tables[name])
        for rec in list_records(token, tables[name]):
            delete_record(token, tables[name], rec['record_id'])
        for idx, row in enumerate(rows[name], start=1):
            payload = {'多行文本': str(idx)}
            for k,v in row.items():
                if v is not None:
                    payload[k] = str(v)
            create_record(token, tables[name], payload)
        print(name, 'imported', len(rows[name]), 'records')
    print('done', tables)

if __name__ == '__main__':
    main()
