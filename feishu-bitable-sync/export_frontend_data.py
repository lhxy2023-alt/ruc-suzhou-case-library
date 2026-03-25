#!/usr/bin/env python3
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

ARTICLE_SEED = [
    {
        "id": "article-1",
        "title": "26Fall 人大中法金融学生，为什么越来越适合双线申请？",
        "category": "申请策略",
        "summary": "从绩点、语言和实习节奏看，单押统考的风险正在变高，双线路径更稳。",
        "publishDate": "2026-03-18",
        "readTime": "5 分钟",
    },
    {
        "id": "article-2",
        "title": "国际汉教方向怎么判断：考研优先，还是先做海外申请？",
        "category": "项目解读",
        "summary": "拆分不想考数学、想保留体制内机会、想尽快上岸三种常见诉求。",
        "publishDate": "2026-03-15",
        "readTime": "4 分钟",
    },
    {
        "id": "article-3",
        "title": "港新保底不是降级，而是控制 431 冲刺失败的系统风险",
        "category": "保底逻辑",
        "summary": "用过往案例解释什么情况下港新保底最有价值，什么情况下反而没必要。",
        "publishDate": "2026-03-11",
        "readTime": "6 分钟",
    },
    {
        "id": "article-4",
        "title": "中外合办背景申请 AI / 计算机，招生官到底看什么？",
        "category": "技术申请",
        "summary": "课程、项目、科研、语言和推荐信的权重拆解，适合转码和 AI 学生。",
        "publishDate": "2026-03-08",
        "readTime": "7 分钟",
    },
    {
        "id": "article-5",
        "title": "25Fall 录取复盘：人大中法商科案例最常见的三类失分点",
        "category": "复盘",
        "summary": "文书叙事松散、实习没有结果导向、语言准备拖延，仍然是最常见问题。",
        "publishDate": "2026-03-05",
        "readTime": "5 分钟",
    },
]

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
    "detail.contactButtonTextWithoutCard": "咨询入口待接入",
    "detail.studentCardTitle": "学生名片",
    "detail.studentCardDescription": "这部分保留为留白说明与后续联系入口，不重复展示案例主信息。",
    "articles.sectionTitle": "乐湖专访",
    "articles.sectionDescription": "后续用于承接 i乐湖 公众号内的学员专访内容。",
}

SCHOOL_DISPLAY_MAP = {
    "人大中法": "中法学院",
    "中国人民大学财政金融学院": "财政金融学院",
    "中央财经大学": "中央财经大学",
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


def build_student_card(student_name, row):
    if not is_enabled(row.get("是否展示学生名片"), default=False):
        return None
    custom_copy = normalize_scalar(row.get("学生名片简介"))
    copy = custom_copy or STUDENT_CARD_TEMPLATES[hash_text(student_name) % len(STUDENT_CARD_TEMPLATES)]
    return {
        "copy": copy,
        "contactLabel": "咨询该同学",
    }


def build_score_list(item):
    return [value for value in [item.get("ielts"), item.get("toefl"), item.get("greGmat")] if value]


def build_language_score_text(item):
    return " / ".join(build_score_list(item)) or None


def build_detail_sections(item):
    sections = [
        {"label": "录取学校", "value": item.get("offerSchool")},
        {"label": "录取专业", "value": item.get("offerProgram")},
        {"label": "本科院校", "value": item.get("undergradSchoolLabel")},
        {"label": "本科专业", "value": item.get("undergradMajor")},
        {"label": "绩点或均分", "value": item.get("gpa")},
        {"label": "语言成绩与标化", "value": item.get("languageScoreText")},
        {"label": "申请轮次", "value": item.get("applicationRound")},
        {"label": "录取时间", "value": item.get("admissionAt")},
        {"label": "实习", "value": item.get("internships")},
        {"label": "科研", "value": item.get("research")},
        {"label": "最终去向", "value": item.get("finalDestination")},
        {"label": "备注", "value": item.get("notes")},
    ]
    return [section for section in sections if section["value"]]


def slugify(value):
    base = re.sub(r"[^a-zA-Z0-9]+", "-", (value or "").strip()).strip("-").lower()
    return base or "item"


def build_case_item(record, index):
    fields = record.get("fields", {})
    season = normalize_scalar(fields.get("申请季")) or "未标注"
    student_name = normalize_scalar(fields.get("匿名展示名")) or normalize_scalar(fields.get("学生姓名")) or "匿名同学"
    offer_school = normalize_scalar(fields.get("录取学校") or fields.get("录取院校")) or "未填写院校"
    offer_program = normalize_scalar(fields.get("录取专业")) or "未填写专业"
    undergrad_school = normalize_scalar(fields.get("本科院校") or fields.get("本科学校")) or "未知院校"
    item = {
        "id": normalize_scalar(fields.get("案例ID")) or f"{slugify(season)}-{index:03d}",
        "recordId": record.get("record_id"),
        "applicationSeason": season,
        "seasonKey": slugify(season),
        "sourceRow": index,
        "studentNameMasked": student_name,
        "undergradSchool": undergrad_school,
        "undergradSchoolLabel": SCHOOL_DISPLAY_MAP.get(undergrad_school, undergrad_school),
        "undergradMajor": normalize_scalar(fields.get("本科专业")),
        "gpa": normalize_scalar(fields.get("GPA/均分")),
        "ielts": normalize_scalar(fields.get("雅思")),
        "toefl": normalize_scalar(fields.get("托福")),
        "greGmat": normalize_scalar(fields.get("GRE/GMAT")),
        "offerSchool": offer_school,
        "offerProgram": offer_program,
        "offerRegion": normalize_scalar(fields.get("录取国家/地区")) or "其他",
        "description": normalize_scalar(fields.get("案例说明/项目说明")),
        "internships": normalize_scalar(fields.get("实习经历")),
        "research": normalize_scalar(fields.get("科研经历")),
        "applicationRound": normalize_scalar(fields.get("申请轮次")),
        "admissionAt": normalize_scalar(fields.get("录取时间")),
        "notes": normalize_scalar(fields.get("备注")),
        "finalDestination": normalize_scalar(fields.get("最终去向说明")),
        "sortOrder": int(normalize_scalar(fields.get("排序权重")) or 0),
        "isPinned": normalize_bool(fields.get("置顶标记")),
        "displayTags": [tag.strip() for tag in (normalize_scalar(fields.get("标签")) or "").split("/") if tag.strip()],
        "studentCard": build_student_card(student_name, fields),
    }
    item["scoreList"] = build_score_list(item)
    item["languageScoreText"] = build_language_score_text(item)
    item["listTitle"] = f"{offer_school}{offer_program}offer"
    item["logoText"] = offer_school[:2]
    item["detailSections"] = build_detail_sections(item)
    item["searchText"] = " ".join(
        str(value)
        for value in [
            item.get("applicationSeason"),
            item.get("studentNameMasked"),
            item.get("undergradSchool"),
            item.get("undergradSchoolLabel"),
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
        return ["全部", *values]

    sections = []
    school_order = []
    seen_schools = set()
    for item in cases:
        school = item.get("undergradSchool")
        if school and school not in seen_schools:
            seen_schools.add(school)
            school_order.append(school)
    for school in school_order:
        majors = ["全部"]
        seen_majors = set()
        for item in cases:
            if item.get("undergradSchool") != school:
                continue
            major = item.get("undergradMajor")
            if major and major not in seen_majors:
                seen_majors.add(major)
                majors.append(major)
        sections.append(
            {
                "title": next((item.get("undergradSchoolLabel") for item in cases if item.get("undergradSchool") == school), school),
                "schoolValue": school,
                "field": "undergradMajor",
                "options": majors,
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
            "label": "院校专业",
            "field": "undergradMajor",
            "sections": sections,
        },
        {
            "id": "region",
            "label": "国家（地区）",
            "field": "offerRegion",
            "options": unique_values("offerRegion"),
        },
    ]


def build_page_config(records):
    config = dict(DEFAULT_PAGE_CONFIG)
    for row in records:
        fields = row.get("fields", {})
        key = normalize_scalar(fields.get("config_key"))
        if not key:
            continue
        enabled = normalize_scalar(fields.get("enabled"))
        if enabled is not None and not normalize_bool(enabled):
            continue
        value = normalize_scalar(fields.get("config_value"))
        config[key] = value or config.get(key, "")
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


def main():
    cfg = json.loads(CONFIG_PATH.read_text())
    token = get_tenant_access_token(cfg["base_url"], cfg["app_id"], cfg["app_secret"])
    tables = {item["name"]: item["table_id"] for item in list_tables(cfg["base_url"], token, cfg["app_token"])}

    offer_table_id = tables.get("offer表")
    page_table_id = tables.get("页面配置表")
    if not offer_table_id or not page_table_id:
        raise SystemExit("缺少 offer表 或 页面配置表")

    offer_records = list_records(cfg["base_url"], token, cfg["app_token"], offer_table_id)
    page_records = list_records(cfg["base_url"], token, cfg["app_token"], page_table_id)

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
        cases.append(build_case_item(record, index))

    cases = sort_cases(cases)
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
