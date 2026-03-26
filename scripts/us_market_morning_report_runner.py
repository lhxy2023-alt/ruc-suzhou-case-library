#!/usr/bin/env python3
from __future__ import annotations
import json, subprocess, sys, urllib.request, urllib.error, uuid
from datetime import datetime, timezone
from pathlib import Path

import requests

WORKSPACE = Path('/Users/taofangzheng/.openclaw/workspace')
STATE_DIR = WORKSPACE / 'tmp' / 'us-market-morning'
STATE_DIR.mkdir(parents=True, exist_ok=True)
PENDING_PATH = STATE_DIR / 'pending.json'
DOC_TOKEN = 'IufodF5R3o1QgKxSTm8cmVt5nko'
FEISHU_TO = 'ou_0df2af8a7fece7c45f0ff62122efa38f'
FEISHU_ACCOUNT = 'default'
CHANNEL = 'feishu'
TITLE = '美股早消息'
OPENCLAW_CONFIG = Path.home() / '.openclaw' / 'openclaw.json'


def shanghai_now():
    from datetime import timedelta
    return datetime.now(timezone(timedelta(hours=8)))


def today_key():
    return shanghai_now().strftime('%Y-%m-%d')


def has_network() -> bool:
    urls = [
        'https://www.google.com/generate_204',
        'https://www.apple.com/library/test/success.html',
        'https://www.baidu.com/'
    ]
    for url in urls:
        try:
            with urllib.request.urlopen(url, timeout=8) as r:
                if getattr(r, 'status', 200) < 500:
                    return True
        except Exception:
            continue
    return False


def run(cmd: list[str], check=True) -> str:
    p = subprocess.run(cmd, capture_output=True, text=True)
    if check and p.returncode != 0:
        raise RuntimeError(f"command failed: {' '.join(cmd)}\nstdout:\n{p.stdout}\nstderr:\n{p.stderr}")
    return (p.stdout or p.stderr or '').strip()


def write_pending(reason: str):
    payload = {
        'date': today_key(),
        'pending': True,
        'reason': reason,
        'updatedAt': shanghai_now().isoformat()
    }
    PENDING_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')


def clear_pending():
    if PENDING_PATH.exists():
        PENDING_PATH.unlink()


def load_pending() -> dict | None:
    if not PENDING_PATH.exists():
        return None
    try:
        return json.loads(PENDING_PATH.read_text(encoding='utf-8'))
    except Exception:
        return None


def load_feishu_credentials() -> tuple[str, str]:
    cfg = json.loads(OPENCLAW_CONFIG.read_text(encoding='utf-8'))
    account = cfg['channels']['feishu']['accounts'][FEISHU_ACCOUNT]
    return account['appId'], account['appSecret']


def get_tenant_access_token() -> str:
    app_id, app_secret = load_feishu_credentials()
    resp = requests.post(
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
        json={'app_id': app_id, 'app_secret': app_secret},
        timeout=20,
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get('code') != 0:
        raise RuntimeError(f"failed to get tenant access token: {data}")
    return data['tenant_access_token']


def feishu_request(method: str, url: str, *, token: str, json_body: dict | None = None) -> dict:
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json; charset=utf-8',
    }
    resp = requests.request(method, url, headers=headers, json=json_body, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if data.get('code') != 0:
        raise RuntimeError(f'feishu api failed: {data}')
    return data


def write_doc(markdown: str):
    token = get_tenant_access_token()
    base = 'https://open.feishu.cn/open-apis'
    children_resp = feishu_request(
        'GET',
        f'{base}/docx/v1/documents/{DOC_TOKEN}/blocks/{DOC_TOKEN}/children?document_revision_id=-1&page_size=500',
        token=token,
    )
    items = children_resp.get('data', {}).get('items', [])
    if items:
        feishu_request(
            'DELETE',
            f'{base}/docx/v1/documents/{DOC_TOKEN}/blocks/{DOC_TOKEN}/children/batch_delete?document_revision_id=-1',
            token=token,
            json_body={'start_index': 0, 'end_index': len(items) - 1},
        )
    convert_resp = feishu_request(
        'POST',
        f'{base}/docx/v1/documents/blocks/convert',
        token=token,
        json_body={'content_type': 'markdown', 'content': markdown},
    )
    block_data = convert_resp['data']
    feishu_request(
        'POST',
        f'{base}/docx/v1/documents/{DOC_TOKEN}/blocks/{DOC_TOKEN}/descendant?document_revision_id=-1&client_token={uuid.uuid4()}',
        token=token,
        json_body={
            'index': 0,
            'children_id': block_data['first_level_block_ids'],
            'descendants': block_data['blocks'],
        },
    )


def notify(text: str):
    try:
        token = get_tenant_access_token()
        feishu_request(
            'POST',
            f'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id',
            token=token,
            json_body={
                'receive_id': FEISHU_TO,
                'msg_type': 'text',
                'content': json.dumps({'text': text}, ensure_ascii=False),
            },
        )
    except Exception as e:
        print(f'NOTIFY_FAILED: {e}')


def build_report_via_agent() -> str:
    prompt = (
        '请产出一份《美股早消息》的 Markdown 正文，用中文、简洁、可决策。'
        '结构必须严格为：\n'
        '# 美股早消息\n\n'
        '更新时间（北京时间）：...\n\n'
        '## A. 指数ETF（VOO/QQQ）\n'
        '分别包含【表现/走势】【原因/消息】【一句话结论】\n\n'
        '## B. 半导体ETF（SMH）\n'
        '包含【表现/走势】【原因/消息】【一句话结论】\n\n'
        '## C. 个股跟踪（NVDA、TSLA、MSFT、META、SNDK、COIN、INTU）\n'
        '每个标的都包含【表现/走势】【原因/消息】【一句话结论】。'
        '若个股无明确新增消息，直接写“无新增重大消息，以市场/板块驱动为主”。'
        '尽量基于公开网络信息，避免堆砌链接，不要输出多余解释。'
    )
    out = run([
        'openclaw', 'agent',
        '--agent', 'main',
        '--message', prompt
    ])
    return out.strip()


def summarize(markdown: str) -> str:
    lines = [ln.strip() for ln in markdown.splitlines() if ln.strip()]
    picks = []
    for ln in lines:
        if any(k in ln for k in ['VOO', 'QQQ', 'SMH', 'NVDA', 'TSLA', 'MSFT', 'META', 'SNDK', 'COIN', 'INTU']):
            picks.append(ln)
        if len(picks) >= 5:
            break
    return '；'.join(picks)[:220] if picks else '已完成更新，请查看飞书文档。'


def run_main(mode: str):
    if not has_network():
        write_pending('8:00时无网络，待联网后自动补跑')
        print('NO_NETWORK_PENDING')
        return
    markdown = build_report_via_agent()
    write_doc(markdown)
    brief = summarize(markdown)
    prefix = '【自动补发】' if mode == 'catchup' else ''
    notify(f'{prefix}《美股早消息》已更新。{brief}')
    clear_pending()
    print('OK')


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'scheduled'
    pending = load_pending()
    if mode == 'catchup':
        if not pending or pending.get('date') != today_key() or not pending.get('pending'):
            print('NO_PENDING')
            return
    try:
        run_main(mode)
    except Exception as e:
        write_pending(f'执行失败，待补跑：{e}')
        try:
            notify(f'《美股早消息》执行失败：{e}')
        except Exception:
            pass
        raise


if __name__ == '__main__':
    main()
