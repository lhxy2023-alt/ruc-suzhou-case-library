#!/usr/bin/env python3
import json, time, random, subprocess
from pathlib import Path

CFG = json.loads(Path('feishu-bitable-sync/config.json').read_text())
BASE = CFG['base_url']
APP_TOKEN = CFG['app_token']
APP_ID = CFG['app_id']
APP_SECRET = CFG['app_secret']
SEASON_DATA = json.loads(Path('feishu-bitable-sync/data/rebuilt-offers.json').read_text())

TARGET_TABLE_NAME = 'offer表'
FIELDS = [
    '案例ID', '申请季', '学生姓名', '本科学校', '本科专业', 'GPA/均分', '雅思', '托福', 'GRE/GMAT',
    '录取院校', '录取专业', '案例说明/项目说明', '宣传完成情况', '备注'
]

def curl_json(method, url, headers=None, data=None, retries=8):
    headers = headers or {}
    cmd = ['curl', '-sS', '-X', method, url]
    for k, v in headers.items():
        cmd += ['-H', f'{k}: {v}']
    if data is not None:
        cmd += ['-H', 'Content-Type: application/json; charset=utf-8', '--data', json.dumps(data, ensure_ascii=False)]
    last = None
    for i in range(retries):
        p = subprocess.run(cmd, capture_output=True, text=True)
        if p.returncode == 0:
            try:
                obj = json.loads(p.stdout)
                if isinstance(obj, dict) and obj.get('code') not in (None, 0):
                    last = RuntimeError(f"api error code={obj.get('code')} msg={obj.get('msg')} body={p.stdout[:500]}")
                else:
                    return obj
            except Exception as e:
                last = RuntimeError(f'json decode failed: {e}; stdout={p.stdout[:500]} stderr={p.stderr[:500]}')
        else:
            last = RuntimeError(p.stderr or p.stdout)
        time.sleep((2 ** min(i, 4)) * 0.8 + random.random())
    raise last

def get_token():
    r = curl_json('POST', f'{BASE}/auth/v3/tenant_access_token/internal', data={'app_id': APP_ID, 'app_secret': APP_SECRET})
    return r['tenant_access_token']

def api(method, path, token, data=None):
    return curl_json(method, f'{BASE}{path}', headers={'Authorization': f'Bearer {token}'}, data=data)

def list_tables(token):
    return api('GET', f'/bitable/v1/apps/{APP_TOKEN}/tables?page_size=100', token)['data']['items']

def list_fields(token, table_id):
    return api('GET', f'/bitable/v1/apps/{APP_TOKEN}/tables/{table_id}/fields?page_size=200', token)['data']['items']

def create_field(token, table_id, name):
    return api('POST', f'/bitable/v1/apps/{APP_TOKEN}/tables/{table_id}/fields', token, {'field_name': name, 'type': 1})

def list_records(token, table_id):
    out = []
    page_token = ''
    while True:
        suffix = f'&page_token={page_token}' if page_token else ''
        r = api('GET', f'/bitable/v1/apps/{APP_TOKEN}/tables/{table_id}/records?page_size=500{suffix}', token)
        data = r['data']
        out.extend(data.get('items') or [])
        if not data.get('has_more'):
            break
        page_token = data.get('page_token')
    return out

def batch_delete(token, table_id, record_ids):
    for i in range(0, len(record_ids), 500):
        chunk = record_ids[i:i+500]
        api('POST', f'/bitable/v1/apps/{APP_TOKEN}/tables/{table_id}/records/batch_delete', token, {'records': chunk})

def batch_create(token, table_id, rows):
    for i in range(0, len(rows), 500):
        chunk = rows[i:i+500]
        api('POST', f'/bitable/v1/apps/{APP_TOKEN}/tables/{table_id}/records/batch_create', token, {'records': [{'fields': r} for r in chunk]})

def build_main_rows():
    rows = []
    for season in ['24fall', '25fall', '26fall']:
        for idx, row in enumerate(SEASON_DATA[season], start=1):
            fields = {
                '案例ID': f'{season}_{idx:03d}',
                '申请季': season,
            }
            for key in ['学生姓名', '本科学校', '本科专业', 'GPA/均分', '雅思', '托福', 'GRE/GMAT', '录取院校', '录取专业', '案例说明/项目说明', '宣传完成情况', '备注']:
                if row.get(key) is not None:
                    fields[key] = str(row[key])
            rows.append(fields)
    return rows

def main():
    token = get_token()
    tables = {t['name']: t['table_id'] for t in list_tables(token)}
    if TARGET_TABLE_NAME not in tables:
        raise SystemExit(f'未找到目标表: {TARGET_TABLE_NAME}')
    table_id = tables[TARGET_TABLE_NAME]
    existing = {f['field_name'] for f in list_fields(token, table_id)}
    for field in FIELDS:
        if field not in existing:
            create_field(token, table_id, field)
    recs = list_records(token, table_id)
    if recs:
        batch_delete(token, table_id, [r['record_id'] for r in recs])
    rows = build_main_rows()
    batch_create(token, table_id, rows)
    final_recs = list_records(token, table_id)
    sample = []
    for x in final_recs[:10]:
        f = x.get('fields', {})
        sample.append({k: f.get(k) for k in ['案例ID', '申请季', '学生姓名', '录取院校', '录取专业']})
    print(json.dumps({'total': len(final_recs), 'sample': sample}, ensure_ascii=False))

if __name__ == '__main__':
    main()
