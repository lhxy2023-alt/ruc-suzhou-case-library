#!/usr/bin/env python3
import json
import random
import re
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
CONFIG_PATH = WORKSPACE / "feishu-bitable-sync" / "config.json"

PAGE_CONFIG_ROWS = [
    {"config_key": "home.heroEyebrow", "config_name": "首页眉标题", "page": "home", "config_value": "i乐湖", "enabled": "是", "remark": "首页品牌短标签"},
    {"config_key": "home.heroTitle", "config_name": "首页主标题", "page": "home", "config_value": "i乐湖案例库", "enabled": "是", "remark": "首页主标题"},
    {"config_key": "home.searchPlaceholder", "config_name": "首页搜索提示", "page": "home", "config_value": "搜索学校、专业、成绩、国家（地区）", "enabled": "是", "remark": "搜索框占位文案"},
    {"config_key": "home.contactTitle", "config_name": "首页联系标题", "page": "home", "config_value": "联系我们", "enabled": "是", "remark": "首页底部浮窗标题"},
    {"config_key": "home.contactDescription", "config_name": "首页联系说明", "page": "home", "config_value": "想了解案例匹配、申请规划或合作方式，可直接联系顾问。", "enabled": "是", "remark": "首页底部浮窗说明"},
    {"config_key": "home.contactButtonText", "config_name": "首页联系按钮", "page": "home", "config_value": "立即联系", "enabled": "是", "remark": "首页按钮文案"},
    {"config_key": "detail.contactTitle", "config_name": "详情咨询标题", "page": "detail", "config_value": "案例咨询", "enabled": "是", "remark": "详情页浮窗标题"},
    {"config_key": "detail.contactDescriptionWithCard", "config_name": "详情页有名片说明", "page": "detail", "config_value": "可继续了解申请节奏与准备重点", "enabled": "是", "remark": "有学生名片时展示"},
    {"config_key": "detail.contactDescriptionWithoutCard", "config_name": "详情页无名片说明", "page": "detail", "config_value": "咨询入口与二维码后续接入", "enabled": "是", "remark": "无学生名片时展示"},
    {"config_key": "detail.contactButtonTextWithCard", "config_name": "详情页有名片按钮", "page": "detail", "config_value": "立即咨询", "enabled": "是", "remark": "有学生名片时展示"},
    {"config_key": "detail.contactButtonTextWithoutCard", "config_name": "详情页无名片按钮", "page": "detail", "config_value": "咨询入口待接入", "enabled": "是", "remark": "无学生名片时展示"},
    {"config_key": "detail.studentCardTitle", "config_name": "学生名片标题", "page": "detail", "config_value": "学生名片", "enabled": "是", "remark": "名片模块标题"},
    {"config_key": "detail.studentCardDescription", "config_name": "学生名片说明", "page": "detail", "config_value": "这部分保留为留白说明与后续联系入口，不重复展示案例主信息。", "enabled": "是", "remark": "名片模块说明"},
    {"config_key": "articles.sectionTitle", "config_name": "专访区标题", "page": "articles", "config_value": "乐湖专访", "enabled": "是", "remark": "专访页标题"},
    {"config_key": "articles.sectionDescription", "config_name": "专访区说明", "page": "articles", "config_value": "后续用于承接 i乐湖 公众号内的学员专访内容。", "enabled": "是", "remark": "专访页说明"},
]

REGION_MAP = {
    "香港": "中国香港",
    "香港大学": "中国香港",
    "香港中文大学": "中国香港",
    "香港中文大学深圳校区": "中国内地",
    "香港科技大学": "中国香港",
    "香港城市大学": "中国香港",
    "香港理工大学": "中国香港",
    "新加坡": "新加坡",
    "新加坡国立大学": "新加坡",
    "南洋理工大学": "新加坡",
    "英国": "英国",
    "华威大学": "英国",
    "伦敦政治经济学院": "英国",
    "伦敦国王学院KCL": "英国",
    "剑桥大学": "英国",
    "帝国理工学院": "英国",
    "美国": "美国",
    "哥伦比亚大学": "美国",
    "康奈尔大学": "美国",
    "杜克大学": "美国",
    "纽约大学": "美国",
    "芝加哥大学": "美国",
    "法国": "法国",
    "ESSEC": "法国",
    "ESCP": "法国",
    "意大利": "意大利",
    "博科尼大学": "意大利",
    "澳大利亚": "澳大利亚",
    "墨尔本大学": "澳大利亚",
    "悉尼大学": "澳大利亚",
    "澳国立": "澳大利亚",
}

SEASON_BUCKETS = ["24fall", "25fall", "26fall"]
ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def http_json(url, method="GET", headers=None, payload=None, retries=5):
    last_error = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url=url, method=method)
            for k, v in (headers or {}).items():
                req.add_header(k, v)
            data = None
            if payload is not None:
                data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
                req.add_header("Content-Type", "application/json; charset=utf-8")
            with urllib.request.urlopen(req, data=data) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                if body.get("code") not in (None, 0):
                    raise RuntimeError(body)
                return body
        except Exception as error:
            last_error = error
            if attempt == retries - 1:
                raise
            time.sleep((2 ** attempt) * 0.5 + random.random() * 0.5)
    raise last_error


def normalize_scalar(value):
    if value is None:
        return None
    if isinstance(value, list):
        return " / ".join(str(x) for x in value if x)
    if isinstance(value, dict):
        return value.get("text") or value.get("name") or value.get("value") or json.dumps(value, ensure_ascii=False)
    text = str(value).strip()
    return text or None


def get_token(cfg):
    return http_json(
        f"{cfg['base_url']}/auth/v3/tenant_access_token/internal",
        method="POST",
        payload={"app_id": cfg["app_id"], "app_secret": cfg["app_secret"]},
    )["tenant_access_token"]


def api(cfg, token, path, method="GET", payload=None):
    return http_json(
        f"{cfg['base_url']}{path}",
        method=method,
        headers={"Authorization": f"Bearer {token}"},
        payload=payload,
    )


def list_tables(cfg, token):
    return api(cfg, token, f"/bitable/v1/apps/{cfg['app_token']}/tables?page_size=100")["data"]["items"]


def list_records(cfg, token, table_id):
    out = []
    page_token = None
    while True:
        params = {"page_size": 500}
        if page_token:
            params["page_token"] = page_token
        query = urllib.parse.urlencode(params)
        res = api(cfg, token, f"/bitable/v1/apps/{cfg['app_token']}/tables/{table_id}/records?{query}")
        data = res["data"]
        out.extend(data.get("items") or [])
        if not data.get("has_more"):
            break
        page_token = data.get("page_token")
    return out


def batch_create(cfg, token, table_id, rows):
    for i in range(0, len(rows), 500):
        chunk = rows[i:i+500]
        api(
            cfg,
            token,
            f"/bitable/v1/apps/{cfg['app_token']}/tables/{table_id}/records/batch_create",
            method="POST",
            payload={"records": [{"fields": row} for row in chunk]},
        )


def batch_update(cfg, token, table_id, rows):
    for i in range(0, len(rows), 500):
        chunk = rows[i:i+500]
        api(
            cfg,
            token,
            f"/bitable/v1/apps/{cfg['app_token']}/tables/{table_id}/records/batch_update",
            method="POST",
            payload={"records": chunk},
        )


def infer_region(school):
    school = normalize_scalar(school) or ""
    for key, value in REGION_MAP.items():
        if key in school:
            return value
    return "其他"


def season_rank(season):
    try:
        return SEASON_BUCKETS.index((season or "").lower())
    except ValueError:
        return len(SEASON_BUCKETS)


def build_alias_map(records):
    grouped = defaultdict(list)
    for item in records:
        fields = item.get("fields", {})
        season = normalize_scalar(fields.get("申请季")) or ""
        student_name = normalize_scalar(fields.get("学生姓名"))
        if not student_name:
            continue
        grouped[(season.lower(), student_name)].append(item)

    alias_map = {}
    ordered_keys = sorted(grouped.keys(), key=lambda x: (season_rank(x[0]), x[0], x[1]))
    for idx, key in enumerate(ordered_keys):
        alias_map[key] = f"{ALPHABET[idx % len(ALPHABET)]}同学"
    return alias_map


def bootstrap_page_config(cfg, token, table_id):
    records = list_records(cfg, token, table_id)
    existing = {}
    for item in records:
        fields = item.get("fields", {})
        key = normalize_scalar(fields.get("config_key"))
        if key:
            existing[key] = item["record_id"]

    to_create, to_update = [], []
    for row in PAGE_CONFIG_ROWS:
        record_id = existing.get(row["config_key"])
        if record_id:
            to_update.append({"record_id": record_id, "fields": row})
        else:
            to_create.append(row)

    if to_create:
        batch_create(cfg, token, table_id, to_create)
    if to_update:
        batch_update(cfg, token, table_id, to_update)

    return {"created": len(to_create), "updated": len(to_update)}


def bootstrap_offer_fields(cfg, token, table_id):
    records = list_records(cfg, token, table_id)
    alias_map = build_alias_map(records)
    updates = []

    for item in records:
        fields = item.get("fields", {})
        season = normalize_scalar(fields.get("申请季")) or ""
        student_name = normalize_scalar(fields.get("学生姓名"))
        offer_school = normalize_scalar(fields.get("录取学校")) or normalize_scalar(fields.get("录取院校"))
        patch = {}

        if normalize_scalar(fields.get("是否前台展示")) is None:
            has_minimum_content = bool(
                normalize_scalar(fields.get("案例ID"))
                or offer_school
                or normalize_scalar(fields.get("录取专业"))
            )
            if has_minimum_content:
                patch["是否前台展示"] = "是"

        if normalize_scalar(fields.get("匿名展示名")) is None and student_name:
            alias = alias_map.get((season.lower(), student_name))
            if alias:
                patch["匿名展示名"] = alias

        if normalize_scalar(fields.get("录取国家/地区")) is None and offer_school:
            patch["录取国家/地区"] = infer_region(offer_school)

        if normalize_scalar(fields.get("排序权重")) is None:
            patch["排序权重"] = "0"

        if normalize_scalar(fields.get("是否展示学生名片")) is None:
            patch["是否展示学生名片"] = "否"

        if patch:
            updates.append({"record_id": item["record_id"], "fields": patch})

    if updates:
        batch_update(cfg, token, table_id, updates)

    return {"updated": len(updates)}


def main():
    cfg = json.loads(CONFIG_PATH.read_text())
    token = get_token(cfg)
    tables = {item["name"]: item["table_id"] for item in list_tables(cfg, token)}
    offer_table_id = tables["offer表"]
    page_table_id = tables["页面配置表"]

    page_result = bootstrap_page_config(cfg, token, page_table_id)
    offer_result = bootstrap_offer_fields(cfg, token, offer_table_id)

    print(json.dumps({
        "pageConfig": page_result,
        "offerTable": offer_result,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
