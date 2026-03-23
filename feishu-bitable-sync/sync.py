#!/usr/bin/env python3
import argparse
import json
import sys
import urllib.request
import urllib.error
from pathlib import Path


def http_json(url, method="GET", headers=None, payload=None):
    req = urllib.request.Request(url=url, method=method)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        req.add_header("Content-Type", "application/json; charset=utf-8")
    try:
        with urllib.request.urlopen(req, data=data) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {body}")


def get_tenant_access_token(base_url, app_id, app_secret):
    url = f"{base_url}/auth/v3/tenant_access_token/internal"
    payload = {"app_id": app_id, "app_secret": app_secret}
    res = http_json(url, method="POST", payload=payload)
    if res.get("code") != 0:
        raise RuntimeError(f"get tenant_access_token failed: {res}")
    return res["tenant_access_token"]


def list_fields(base_url, token, app_token, table_id):
    url = f"{base_url}/bitable/v1/apps/{app_token}/tables/{table_id}/fields?page_size=500"
    res = http_json(url, headers={"Authorization": f"Bearer {token}"})
    if res.get("code") != 0:
        raise RuntimeError(f"list fields failed: {res}")
    return res.get("data", {}).get("items", [])


def list_records(base_url, token, app_token, table_id, field_names=None):
    url = f"{base_url}/bitable/v1/apps/{app_token}/tables/{table_id}/records?page_size=500"
    # Some Bitable endpoints are picky about field_names encoding; omit filtering for robustness.
    res = http_json(url, headers={"Authorization": f"Bearer {token}"})
    if res.get("code") != 0:
        raise RuntimeError(f"list records failed: {res}")
    return res.get("data", {}).get("items") or []


def create_field(base_url, token, app_token, table_id, field_name, field_type=1, property=None):
    url = f"{base_url}/bitable/v1/apps/{app_token}/tables/{table_id}/fields"
    payload = {"field_name": field_name, "type": field_type}
    if property is not None:
        payload["property"] = property
    res = http_json(url, method="POST", headers={"Authorization": f"Bearer {token}"}, payload=payload)
    if res.get("code") != 0:
        raise RuntimeError(f"create field failed: {res}")
    return res


def create_record(base_url, token, app_token, table_id, fields):
    url = f"{base_url}/bitable/v1/apps/{app_token}/tables/{table_id}/records"
    res = http_json(url, method="POST", headers={"Authorization": f"Bearer {token}"}, payload={"fields": fields})
    if res.get("code") != 0:
        raise RuntimeError(f"create record failed: {res}")
    return res


def update_record(base_url, token, app_token, table_id, record_id, fields):
    url = f"{base_url}/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}"
    res = http_json(url, method="PUT", headers={"Authorization": f"Bearer {token}"}, payload={"fields": fields})
    if res.get("code") != 0:
        raise RuntimeError(f"update record failed: {res}")
    return res


def normalize_record(record, field_mapping):
    result = {}
    for feishu_field, source_key in field_mapping.items():
        value = record.get(source_key)
        if value is None:
            continue
        result[feishu_field] = value
    return result


def load_json(path):
    return json.loads(Path(path).read_text())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--data", required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--ensure-fields", action="store_true")
    args = parser.parse_args()

    cfg = load_json(args.config)
    rows = load_json(args.data)

    required = ["app_id", "app_secret", "app_token", "table_id", "unique_key_field", "field_mapping"]
    missing = [k for k in required if not cfg.get(k)]
    if missing:
        raise SystemExit(f"missing config fields: {', '.join(missing)}")

    token = get_tenant_access_token(cfg["base_url"], cfg["app_id"], cfg["app_secret"])
    fields = list_fields(cfg["base_url"], token, cfg["app_token"], cfg["table_id"])
    field_names = {f['field_name'] for f in fields}

    if args.ensure_fields:
        missing_fields = [name for name in cfg["field_mapping"].keys() if name not in field_names]
        for name in missing_fields:
            create_field(cfg["base_url"], token, cfg["app_token"], cfg["table_id"], name, field_type=1)
            print(f"created field: {name}")
        fields = list_fields(cfg["base_url"], token, cfg["app_token"], cfg["table_id"])
        field_names = {f['field_name'] for f in fields}

    unique_field = cfg["unique_key_field"]
    if unique_field not in field_names:
        raise SystemExit(f"unique key field not found in table: {unique_field}")

    existing = list_records(cfg["base_url"], token, cfg["app_token"], cfg["table_id"], field_names=[unique_field])
    existing_by_key = {}
    for item in existing:
        fields_obj = item.get("fields", {})
        key = fields_obj.get(unique_field)
        if key is not None:
            existing_by_key[str(key)] = item["record_id"]

    to_create = []
    to_update = []
    source_key_name = cfg["field_mapping"][unique_field]

    for row in rows:
        normalized = normalize_record(row, cfg["field_mapping"])
        unique_val = row.get(source_key_name)
        if unique_val is None:
            print(f"skip row without unique key: {row}", file=sys.stderr)
            continue
        if unique_field not in normalized:
            normalized[unique_field] = unique_val
        record_id = existing_by_key.get(str(unique_val))
        if record_id:
            to_update.append((record_id, normalized))
        else:
            to_create.append(normalized)

    print(f"dry_run={args.dry_run} create={len(to_create)} update={len(to_update)}")

    if args.dry_run:
        if to_create:
            print("sample create:", json.dumps(to_create[0], ensure_ascii=False, indent=2))
        if to_update:
            print("sample update:", json.dumps(to_update[0][1], ensure_ascii=False, indent=2))
        return

    for fields_obj in to_create:
        create_record(cfg["base_url"], token, cfg["app_token"], cfg["table_id"], fields_obj)
    for record_id, fields_obj in to_update:
        update_record(cfg["base_url"], token, cfg["app_token"], cfg["table_id"], record_id, fields_obj)

    print("sync complete")


if __name__ == "__main__":
    main()
