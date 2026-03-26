#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
import uuid
from pathlib import Path
from typing import Any

import requests

OPENCLAW_CONFIG = Path.home() / '.openclaw' / 'openclaw.json'
BASE = 'https://open.feishu.cn/open-apis'
DEFAULT_OWNER_OPEN_ID = 'ou_0df2af8a7fece7c45f0ff62122efa38f'


def load_account(account_id: str) -> dict[str, Any]:
    cfg = json.loads(OPENCLAW_CONFIG.read_text(encoding='utf-8'))
    accounts = cfg['channels']['feishu']['accounts']
    if account_id not in accounts:
        raise SystemExit(f'Unknown feishu accountId: {account_id}')
    return accounts[account_id]


def get_token(account_id: str) -> str:
    acc = load_account(account_id)
    resp = requests.post(
        f'{BASE}/auth/v3/tenant_access_token/internal',
        json={'app_id': acc['appId'], 'app_secret': acc['appSecret']},
        timeout=20,
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get('code') != 0:
        raise SystemExit(f'Get token failed: {data}')
    return data['tenant_access_token']


def api(method: str, path: str, token: str, *, body: dict[str, Any] | None = None) -> dict[str, Any]:
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json; charset=utf-8',
    }
    resp = requests.request(method, f'{BASE}{path}', headers=headers, json=body, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if data.get('code') != 0:
        raise SystemExit(f'API failed {path}: {json.dumps(data, ensure_ascii=False)}')
    return data


def grant_doc_permission(doc_token: str, token: str, owner_open_id: str) -> None:
    api('POST', f'/drive/v1/permissions/{doc_token}/members?type=docx', token, body={
        'type': 'user',
        'member_type': 'openid',
        'member_id': owner_open_id,
        'perm': 'full_access',
        'need_notification': False,
    })


def grant_bitable_permission(app_token: str, token: str, owner_open_id: str) -> None:
    api('POST', f'/drive/v1/permissions/{app_token}/members?type=bitable', token, body={
        'type': 'user',
        'member_type': 'openid',
        'member_id': owner_open_id,
        'perm': 'full_access',
        'need_notification': False,
    })


def write_doc(account_id: str, title: str, markdown: str, owner_open_id: str) -> dict[str, Any]:
    token = get_token(account_id)
    create = api('POST', '/docx/v1/documents', token, body={'folder_token': '', 'title': title})
    doc_token = create['data']['document']['document_id']
    children = api('GET', f'/docx/v1/documents/{doc_token}/blocks/{doc_token}/children?document_revision_id=-1&page_size=500', token)
    items = children.get('data', {}).get('items', [])
    if items:
        api('DELETE', f'/docx/v1/documents/{doc_token}/blocks/{doc_token}/children/batch_delete?document_revision_id=-1', token, body={
            'start_index': 0,
            'end_index': len(items) - 1,
        })
    converted = api('POST', '/docx/v1/documents/blocks/convert', token, body={
        'content_type': 'markdown',
        'content': markdown,
    })
    api('POST', f'/docx/v1/documents/{doc_token}/blocks/{doc_token}/descendant?document_revision_id=-1&client_token={uuid.uuid4()}', token, body={
        'index': 0,
        'children_id': converted['data']['first_level_block_ids'],
        'descendants': converted['data']['blocks'],
    })
    grant_doc_permission(doc_token, token, owner_open_id)
    return {
        'kind': 'docx',
        'accountId': account_id,
        'doc_token': doc_token,
        'url': f'https://jcnrrmayyxzf.feishu.cn/docx/{doc_token}',
        'title': title,
    }


def create_bitable(account_id: str, name: str, owner_open_id: str) -> dict[str, Any]:
    token = get_token(account_id)
    create = api('POST', '/bitable/v1/apps', token, body={'name': name})
    app_token = create['data']['app']['app_token']
    grant_bitable_permission(app_token, token, owner_open_id)
    return {
        'kind': 'bitable',
        'accountId': account_id,
        'app_token': app_token,
        'url': f'https://jcnrrmayyxzf.feishu.cn/base/{app_token}',
        'name': name,
    }


def edit_existing_bitable(account_id: str, app_token: str, table_name: str, owner_open_id: str) -> dict[str, Any]:
    token = get_token(account_id)
    create_table = api('POST', f'/bitable/v1/apps/{app_token}/tables', token, body={
        'table': {'name': table_name}
    })
    table_id = create_table['data']['table_id']
    field_defs = [
        {'field_name': '测试文本', 'type': 1},
        {'field_name': '测试数字', 'type': 2},
        {'field_name': '测试单选', 'type': 3, 'property': {'options': [{'name': '正常'}, {'name': '待确认'}]}},
    ]
    created_fields = []
    for field in field_defs:
        resp = api('POST', f'/bitable/v1/apps/{app_token}/tables/{table_id}/fields', token, body=field)
        created_fields.append(resp.get('data', {}))
    api('POST', f'/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create', token, body={
        'records': [
            {'fields': {'测试文本': '第一行测试', '测试数字': 1, '测试单选': '正常'}},
            {'fields': {'测试文本': '第二行测试', '测试数字': 2, '测试单选': '待确认'}},
        ]
    })
    try:
        grant_bitable_permission(app_token, token, owner_open_id)
    except Exception:
        pass
    return {
        'kind': 'bitable-edit-existing',
        'accountId': account_id,
        'app_token': app_token,
        'table_id': table_id,
        'url': f'https://jcnrrmayyxzf.feishu.cn/base/{app_token}?table={table_id}',
        'table_name': table_name,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description='Shared Feishu OpenAPI writer for docs and bitables')
    sub = parser.add_subparsers(dest='cmd', required=True)

    p_doc = sub.add_parser('doc')
    p_doc.add_argument('--account-id', required=True)
    p_doc.add_argument('--title', required=True)
    p_doc.add_argument('--markdown-file')
    p_doc.add_argument('--markdown')
    p_doc.add_argument('--owner-open-id', default=DEFAULT_OWNER_OPEN_ID)

    p_bitable = sub.add_parser('bitable')
    p_bitable.add_argument('--account-id', required=True)
    p_bitable.add_argument('--name', required=True)
    p_bitable.add_argument('--owner-open-id', default=DEFAULT_OWNER_OPEN_ID)

    p_existing = sub.add_parser('bitable-existing')
    p_existing.add_argument('--account-id', required=True)
    p_existing.add_argument('--app-token', required=True)
    p_existing.add_argument('--table-name', required=True)
    p_existing.add_argument('--owner-open-id', default=DEFAULT_OWNER_OPEN_ID)

    args = parser.parse_args()

    if args.cmd == 'doc':
        markdown = args.markdown
        if args.markdown_file:
            markdown = Path(args.markdown_file).read_text(encoding='utf-8')
        if markdown is None:
            raise SystemExit('Provide --markdown or --markdown-file')
        result = write_doc(args.account_id, args.title, markdown, args.owner_open_id)
    elif args.cmd == 'bitable':
        result = create_bitable(args.account_id, args.name, args.owner_open_id)
    elif args.cmd == 'bitable-existing':
        result = edit_existing_bitable(args.account_id, args.app_token, args.table_name, args.owner_open_id)
    else:
        raise SystemExit(f'Unknown command: {args.cmd}')

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
