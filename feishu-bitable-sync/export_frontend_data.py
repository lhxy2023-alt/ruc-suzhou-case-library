#!/usr/bin/env python3
import argparse
import json
import random
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
CONFIG_PATH = WORKSPACE / "feishu-bitable-sync" / "config.json"
OUTPUT_DIR = WORKSPACE / "ruc-suzhou-case-library" / "src" / "data" / "generated"
OUTPUT_FILE = OUTPUT_DIR / "frontendData.js"
LOCAL_SNAPSHOT_PATH = WORKSPACE / "feishu-bitable-sync" / "data" / "rebuilt-offers.json"

ARTICLE_SEED = []


def build_placeholder_qr_data_url(label):
    svg = f"""
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
      <rect width="320" height="320" rx="28" fill="#fffdfb"/>
      <rect x="26" y="26" width="268" height="268" rx="20" fill="#ffffff" stroke="#dcc8bf" stroke-width="8"/>
      <path d="M56 56h54v54H56zM210 56h54v54h-54zM56 210h54v54H56z" fill="#241a17"/>
      <path d="M72 72h22v22H72zM226 72h22v22h-22zM72 226h22v22H72z" fill="#fffdfb"/>
      <path d="M140 62h20v20h-20zM170 62h18v18h-18zM140 94h18v18h-18zM166 98h14v14h-14zM194 96h16v16h-16zM136 132h16v16h-16zM164 130h22v22h-22zM196 132h16v16h-16zM134 166h18v18h-18zM164 166h14v14h-14zM194 164h20v20h-20zM138 194h20v20h-20zM170 194h16v16h-16zM198 196h14v14h-14zM226 166h22v22h-22zM228 198h18v18h-18zM164 228h20v20h-20zM194 228h18v18h-18z" fill="#241a17"/>
      <text x="160" y="292" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="#8f2625">{label}</text>
    </svg>
    """.strip()
    return f"data:image/svg+xml;charset=UTF-8,{urllib.parse.quote(svg)}"


DEFAULT_WECHAT_QR = build_placeholder_qr_data_url("微信二维码待替换")
DEFAULT_WENJUANXING_QR = build_placeholder_qr_data_url("问卷星二维码待替换")

DEFAULT_PAGE_CONFIG = {
    "home.heroEyebrow": "i乐湖",
    "home.heroTitle": "i乐湖案例库",
    "home.searchPlaceholder": "搜索学校、专业、成绩、国家（地区）",
    "home.contactTitle": "联系我们",
    "home.contactDescription": "想了解案例匹配、申请规划或合作方式，可直接联系顾问。",
    "home.contactButtonText": "立即联系",
    "detail.contactTitle": "案例咨询",
    "detail.contactDescriptionWithCard": "可继续了解申请节奏与准备重点",
    "detail.contactDescriptionWithoutCard": "咨询入口与二维码后续接入",
    "detail.contactButtonTextWithCard": "立即咨询",
    "detail.contactButtonTextWithoutCard": "立即咨询",
    "detail.studentCardTitle": "学生名片",
    "detail.studentCardDescription": "这部分保留为留白说明与后续联系入口，不重复展示案例主信息。",
    "articles.sectionTitle": "乐湖专访",
    "articles.sectionDescription": "后续用于承接 i乐湖 公众号内的学员专访内容。",
    "contact.modalTitle": "联系顾问",
    "contact.modalDescription": "可扫码添加微信，或填写问卷星表单。",
    "contact.wechatQrLabel": "微信二维码",
    "contact.wechatQrImage": DEFAULT_WECHAT_QR,
    "contact.formQrLabel": "问卷星二维码",
    "contact.formQrImage": DEFAULT_WENJUANXING_QR,
}

COLLEGE_DISPLAY_MAP = {
    "人大中法": "中法",
    "中法学院": "中法",
    "中国人民大学中法学院": "中法",
    "中国人民大学（苏州校区）中法学院": "中法",
    "中国人民大学财政金融学院": "财政金融",
    "财政金融学院": "财政金融",
    "中央财经大学": "中央财经",
}

STUDENT_CARD_TEMPLATES = [
    "可交流选校定位、申请节奏与不同项目之间的取舍思路。",
    "愿意分享背景准备、文书推进与拿到 offer 之后的真实体验。",
    "可继续聊申请规划、时间安排以及准备过程中踩过的坑。",
]


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
                return json.loads(resp.read().decode("utf-8"))
        except Exception as error:
            last_error = error
            if attempt == retries - 1:
                raise
            time.sleep((2 ** attempt) * 0.6 + random.random() * 0.5)
    raise last_error


def get_tenant_access_token(base_url, app_id, app_secret):
    res = http_json(
        f"{base_url}/auth/v3/tenant_access_token/internal",
        method="POST",
        payload={"app_id": app_id, "app_secret": app_secret},
    )
    if res.get("code") != 0:
        raise RuntimeError(f"get tenant_access_token failed: {res}")
    return res["tenant_access_token"]


def list_tables(base_url, token, app_token):
    res = http_json(
        f"{base_url}/bitable/v1/apps/{app_token}/tables?page_size=100",
        headers={"Authorization": f"Bearer {token}"},
    )
    return res.get("data", {}).get("items", [])


def list_records(base_url, token, app_token, table_id):
    items = []
    page_token = None
    while True:
        params = {"page_size": 500}
        if page_token:
            params["page_token"] = page_token
        query = urllib.parse.urlencode(params)
        res = http_json(
            f"{base_url}/bitable/v1/apps/{app_token}/tables/{table_id}/records?{query}",
            headers={"Authorization": f"Bearer {token}"},
        )
        data = res.get("data", {})
        items.extend(data.get("items", []) or [])
        if not data.get("has_more"):
            break
        page_token = data.get("page_token")
    return items


def normalize_scalar(value):
    if value is None:
        return None
    if isinstance(value, list):
        chunks = []
        for item in value:
            if isinstance(item, dict):
                chunks.append(item.get("text") or item.get("name") or item.get("value") or json.dumps(item, ensure_ascii=False))
            else:
                chunks.append(str(item))
        return " / ".join(x for x in chunks if x)
    if isinstance(value, dict):
        return value.get("text") or value.get("name") or value.get("value") or json.dumps(value, ensure_ascii=False)
    return str(value).strip()


def first_non_empty(fields, *names):
    for name in names:
        value = normalize_scalar(fields.get(name))
        if value:
            return value
    return None


def first_present_field(fields, *names):
    for name in names:
        value = normalize_scalar(fields.get(name))
        if value:
            return {"label": name, "value": value}
    return None


def normalize_bool(value):
    text = (normalize_scalar(value) or "").strip().lower()
    return text in {"1", "true", "yes", "y", "是", "开启", "open", "on"}


def is_enabled(value, default=False):
    text = normalize_scalar(value)
    if text is None or text == "":
        return default
    return normalize_bool(text)


def hash_text(value):
    return sum(ord(ch) for ch in value)


def normalize_region(value):
    region = (normalize_scalar(value) or "").strip()
    return {
        "中国香港": "香港",
        "中国澳门": "澳门",
        "中国内地": "内地",
    }.get(region, region or None)


def normalize_college_label(value):
    text = (normalize_scalar(value) or "").strip()
    if not text:
        return None
    if text in COLLEGE_DISPLAY_MAP:
        return COLLEGE_DISPLAY_MAP[text]
    if text.endswith("学院") and len(text) <= 8:
        return text[:-2]
    return text


def parse_display_tags(value):
    text = (normalize_scalar(value) or "").strip()
    if not text:
        return []
    if "#" in text:
        tags = [chunk.strip() for chunk in re.findall(r"#([^#]+)", text) if chunk.strip()]
        if tags:
            return tags
    return [chunk.strip() for chunk in re.split(r"[／/\n]+", text) if chunk.strip()]


def strip_trailing_offer(value):
    text = (normalize_scalar(value) or "").strip()
    if not text:
        return None
    return re.sub(r"\s*offer\s*$", "", text, flags=re.IGNORECASE).strip()


def build_offer_title(offer_school, offer_program):
    parts = [strip_trailing_offer(offer_school), strip_trailing_offer(offer_program)]
    return " ".join(part for part in parts if part)


def build_logo_text(value):
    text = re.sub(r"\s+", "", normalize_scalar(value) or "")
    return text[:2] or "录取"


def build_student_card(row, anonymous_mode):
    if anonymous_mode:
        return None
    if not is_enabled(first_non_empty(row, "是否展示学生名片"), default=False):
        return None
    student_seed = first_non_empty(
        row,
        "学生标识",
        "学生（后台真名）",
        "学生姓名（内部）",
        "学生姓名",
        "匿名展示名",
    ) or "student"
    custom_copy = first_non_empty(row, "学生名片简介")
    copy = custom_copy or STUDENT_CARD_TEMPLATES[hash_text(student_seed) % len(STUDENT_CARD_TEMPLATES)]
    return {
        "copy": copy,
        "contactLabel": "与我咨询",
    }


def build_score_list(item):
    return [value for value in [item.get("ielts"), item.get("toefl"), item.get("greGmat")] if value]


def normalize_prefixed_score(value, prefix):
    normalized = normalize_scalar(value)
    if not normalized:
        return None
    if normalized.startswith(prefix):
        return normalized
    return f"{prefix}{normalized}"


def normalize_gre_gmat_score(value):
    normalized = normalize_scalar(value)
    if not normalized:
        return None
    upper = normalized.upper()
    if upper.startswith("GRE") or upper.startswith("GMAT"):
        return upper
    digits_match = re.search(r"\d+", normalized)
    if not digits_match:
        return normalized
    digits = digits_match.group(0)
    return f"{'GRE' if int(digits) < 400 else 'GMAT'}{digits}"


def build_language_score_text(item):
    return " / ".join(build_score_list(item)) or None


def build_detail_sections(fields):
    sections = [
        first_present_field(fields, "录取学校", "录取院校"),
        first_present_field(fields, "录取专业"),
        first_present_field(fields, "本科学院", "本科院校", "本科学校"),
        first_present_field(fields, "本科专业"),
        first_present_field(fields, "GPA/均分"),
        first_present_field(fields, "雅思"),
        first_present_field(fields, "托福"),
        first_present_field(fields, "GRE/GMAT", "GMAT/GRE"),
        first_present_field(fields, "申请时间"),
        first_present_field(fields, "申请轮次"),
        first_present_field(fields, "录取时间"),
        first_present_field(fields, "实习经历", "实习"),
        first_present_field(fields, "科研经历", "科研"),
        first_present_field(fields, "最终去向说明", "最终去向"),
        first_present_field(fields, "备注"),
    ]
    return [section for section in sections if section]


def slugify(value):
    base = re.sub(r"[^a-zA-Z0-9]+", "-", (value or "").strip()).strip("-").lower()
    return base or "item"


def build_case_item(record, index, school_logo_map=None):
    fields = record.get("fields", {})
    school_logo_map = school_logo_map or {}
    season = first_non_empty(fields, "申请季") or "未标注"
    student_display_name = first_non_empty(fields, "学生姓名", "匿名展示名", "对外匿名名") or "匿名"
    internal_student_name = first_non_empty(fields, "学生（后台真名）", "学生姓名（内部）", "学生姓名（后台真名）", "学生真实姓名")
    anonymous_mode = student_display_name == "匿名"
    offer_school = first_non_empty(fields, "录取学校", "录取院校") or "未填写院校"
    offer_program = first_non_empty(fields, "录取专业") or "未填写专业"
    undergrad_college = first_non_empty(fields, "本科学院", "本科院校", "本科学校") or "未知学院"
    raw_region = first_non_empty(fields, "录取国家/地区", "录取地区", "国家（地区）")
    display_tags = parse_display_tags(first_non_empty(fields, "标签", "展示标签"))
    is_final_offer = is_enabled(first_non_empty(fields, "最终选择标记", "最终录取标记", "最终去向标记"), default=False)
    if anonymous_mode:
        is_final_offer = False
    item = {
        "id": normalize_scalar(fields.get("案例ID")) or f"{slugify(season)}-{index:03d}",
        "recordId": record.get("record_id"),
        "applicationSeason": season,
        "seasonKey": slugify(season),
        "sourceRow": index,
        "studentDisplayName": student_display_name,
        "studentNameMasked": student_display_name,
        "anonymousMode": anonymous_mode,
        "internalStudentName": internal_student_name,
        "studentKey": first_non_empty(fields, "学生标识") or internal_student_name or student_display_name,
        "undergradCollege": undergrad_college,
        "undergradCollegeLabel": normalize_college_label(undergrad_college) or undergrad_college,
        "undergradMajor": normalize_scalar(fields.get("本科专业")),
        "gpa": normalize_scalar(fields.get("GPA/均分")),
        "ielts": normalize_prefixed_score(first_non_empty(fields, "雅思", "语言成绩"), "雅思"),
        "toefl": normalize_prefixed_score(first_non_empty(fields, "托福"), "托福"),
        "greGmat": normalize_gre_gmat_score(first_non_empty(fields, "GRE/GMAT", "GMAT/GRE")),
        "offerSchool": offer_school,
        "offerProgram": offer_program,
        "schoolLogoUrl": school_logo_map.get(offer_school),
        "offerRegion": normalize_region(raw_region) or "其他",
        "description": first_non_empty(fields, "案例说明/项目说明", "案例说明"),
        "internships": first_non_empty(fields, "实习经历", "实习"),
        "research": first_non_empty(fields, "科研经历", "科研"),
        "applicationRound": first_non_empty(fields, "申请轮次"),
        "applicationAt": first_non_empty(fields, "申请时间"),
        "admissionAt": first_non_empty(fields, "录取时间"),
        "notes": first_non_empty(fields, "备注"),
        "finalDestination": first_non_empty(fields, "最终去向说明", "最终去向"),
        "isFinalOffer": is_final_offer,
        "sortOrder": int(normalize_scalar(fields.get("排序权重")) or 0),
        "isPinned": normalize_bool(fields.get("置顶标记")),
        "displayTags": display_tags,
        "studentCard": build_student_card(fields, anonymous_mode),
    }
    item["scoreList"] = build_score_list(item)
    item["languageScoreText"] = build_language_score_text(item)
    item["tags"] = [{"label": season, "type": "season"}, *({"label": tag, "type": "default"} for tag in display_tags)]
    item["listTitle"] = build_offer_title(offer_school, offer_program)
    item["logoText"] = build_logo_text(offer_school)
    item["detailSections"] = build_detail_sections(fields)
    item["searchText"] = " ".join(
        str(value)
        for value in [
            item.get("applicationSeason"),
            item.get("studentDisplayName"),
            item.get("undergradCollege"),
            item.get("undergradCollegeLabel"),
            item.get("undergradMajor"),
            item.get("gpa"),
            item.get("ielts"),
            item.get("toefl"),
            item.get("greGmat"),
            item.get("offerSchool"),
            item.get("offerProgram"),
            item.get("offerRegion"),
            item.get("description"),
            item.get("notes"),
            item.get("finalDestination"),
            *item.get("displayTags", []),
        ]
        if value
    )
    return item


def apply_student_card_visibility(cases):
    groups = {}
    for item in cases:
        key = item.get("studentKey") or item.get("internalStudentName") or item.get("studentDisplayName")
        if not key:
            continue
        groups.setdefault(key, []).append(item)

    for group in groups.values():
        shared_card = next((item.get("studentCard") for item in group if item.get("studentCard")), None)
        if not shared_card:
            continue
        for item in group:
            if not item.get("anonymousMode"):
                item["studentCard"] = shared_card

    return cases


def sort_cases(items):
    return sorted(
        items,
        key=lambda item: (
            0 if item.get("isPinned") else 1,
            -item.get("sortOrder", 0),
            item.get("applicationSeason") or "",
            item.get("id") or "",
        ),
    )


def build_filter_groups(cases):
    def unique_values(key):
        values = []
        seen = set()
        for item in cases:
            value = item.get(key)
            if value and value not in seen:
                seen.add(value)
                values.append(value)
        return ["不限", *values]

    colleges = []
    seen_colleges = set()
    for item in cases:
        college = item.get("undergradCollege")
        if not college or college in seen_colleges:
            continue
        seen_colleges.add(college)
        majors = []
        seen_majors = set()
        for current in cases:
            if current.get("undergradCollege") != college:
                continue
            major = current.get("undergradMajor")
            if major and major not in seen_majors:
                seen_majors.add(major)
                majors.append(major)
        colleges.append(
            {
                "value": college,
                "label": next((item.get("undergradCollegeLabel") for item in cases if item.get("undergradCollege") == college), college),
                "majors": majors,
            }
        )

    return [
        {
            "id": "season",
            "label": "申请季",
            "field": "applicationSeason",
            "options": unique_values("applicationSeason"),
        },
        {
            "id": "program",
            "label": "学院专业",
            "field": "undergradCollege",
            "colleges": colleges,
        },
        {
            "id": "region",
            "label": "国家（地区）",
            "field": "offerRegions",
            "multiple": True,
            "options": [value for value in unique_values("offerRegion") if value != "不限"],
        },
    ]


def build_school_logo_map(records):
    mapping = {}
    for row in records:
        fields = row.get("fields", {})
        school_name = first_non_empty(fields, "学校名称")
        logo_url = first_non_empty(fields, "校徽图片URL")
        if school_name and logo_url:
            mapping[school_name] = logo_url
    return mapping


def build_page_config(records):
    config = dict(DEFAULT_PAGE_CONFIG)
    aliases = {
        "contact.wenjuanxingQrLabel": "contact.formQrLabel",
        "contact.wenjuanxingQrImage": "contact.formQrImage",
    }
    for row in records:
        fields = row.get("fields", {})
        key = normalize_scalar(fields.get("config_key"))
        if not key:
            continue
        enabled = normalize_scalar(fields.get("enabled"))
        if enabled is not None and not normalize_bool(enabled):
            continue
        value = normalize_scalar(fields.get("config_value"))
        target_key = aliases.get(key, key)
        config[target_key] = value or config.get(target_key, "")
    return config


def render_module(cases, filter_groups, page_config):
    header = "// Auto-generated by feishu-bitable-sync/export_frontend_data.py. Do not edit manually.\n"
    body = (
        f"export const cases = {json.dumps(cases, ensure_ascii=False, indent=2)};\n\n"
        f"export const filterGroups = {json.dumps(filter_groups, ensure_ascii=False, indent=2)};\n\n"
        f"export const pageConfig = {json.dumps(page_config, ensure_ascii=False, indent=2)};\n\n"
        f"export const articles = {json.dumps(ARTICLE_SEED, ensure_ascii=False, indent=2)};\n"
    )
    return header + body


def load_local_snapshot_records():
    payload = json.loads(LOCAL_SNAPSHOT_PATH.read_text())
    records = []
    for season, rows in payload.items():
        for index, row in enumerate(rows, start=1):
            fields = dict(row)
            fields.setdefault("申请季", season)
            records.append(
                {
                    "record_id": f"local-{slugify(season)}-{index:03d}",
                    "fields": fields,
                }
            )
    return records


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--from-local-snapshot",
        action="store_true",
        help="Export from feishu-bitable-sync/data/rebuilt-offers.json instead of live Feishu data.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    if args.from_local_snapshot:
        offer_records = load_local_snapshot_records()
        page_records = []
        school_records = []
    else:
        cfg = json.loads(CONFIG_PATH.read_text())
        token = get_tenant_access_token(cfg["base_url"], cfg["app_id"], cfg["app_secret"])
        tables = {item["name"]: item["table_id"] for item in list_tables(cfg["base_url"], token, cfg["app_token"])}

        offer_table_id = tables.get("offer表")
        page_table_id = tables.get("页面配置表")
        school_table_id = tables.get("学校表")
        if not offer_table_id or not page_table_id:
            raise SystemExit("缺少 offer表 或 页面配置表")

        offer_records = list_records(cfg["base_url"], token, cfg["app_token"], offer_table_id)
        page_records = list_records(cfg["base_url"], token, cfg["app_token"], page_table_id)
        school_records = list_records(cfg["base_url"], token, cfg["app_token"], school_table_id) if school_table_id else []

    school_logo_map = build_school_logo_map(school_records)

    cases = []
    for index, record in enumerate(offer_records, start=1):
        fields = record.get("fields", {})
        has_minimum_content = bool(
            normalize_scalar(fields.get("案例ID"))
            or normalize_scalar(fields.get("录取学校"))
            or normalize_scalar(fields.get("录取院校"))
            or normalize_scalar(fields.get("录取专业"))
        )
        if not is_enabled(fields.get("是否前台展示"), default=has_minimum_content):
            continue
        cases.append(build_case_item(record, index, school_logo_map))

    cases = apply_student_card_visibility(sort_cases(cases))
    filter_groups = build_filter_groups(cases)
    page_config = build_page_config(page_records)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(render_module(cases, filter_groups, page_config))

    print(json.dumps({
        "cases": len(cases),
        "filterGroups": len(filter_groups),
        "pageConfigKeys": len(page_config),
        "output": str(OUTPUT_FILE.relative_to(WORKSPACE)),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
