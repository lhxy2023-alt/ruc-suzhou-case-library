# TOOLS.md - Tool Configuration & Notes

> Document tool-specific configurations, gotchas, and credentials here.

---

## Credentials Location

All credentials stored in `.credentials/` (gitignored):
- `example-api.txt` — Example API key

---

## browser-use

**Status:** ✅ Working

**Configuration:**
```bash
# Installed via uv tool
uv tool install browser-use
browser-use install
```

**Gotchas:**
- This machine exports global proxy vars (`HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY`)
- `browser-use` CDP connection to local Chromium can fail unless localhost bypasses the proxy
- Patched wrappers in `~/.local/bin/{browser-use,browser,browseruse,bu}` to set:
  - `NO_PROXY=localhost,127.0.0.1,::1`
  - `no_proxy=localhost,127.0.0.1,::1`
- If `uv tool install --reinstall browser-use` is run later, re-apply the wrapper patch if CDP failures return
- Google sign-in / account-chooser flows may block browser automation with “This browser or app may not be secure”; when that happens, complete the sensitive login/admin confirmation step manually in a normal browser session

**Common Operations:**
```bash
browser-use open https://example.com
browser-use state
browser-use close
browser-use doctor
```

---

## Feishu plugin tools

**Status:** ✅ Working

**Important runtime rule:**
- Do **not** assume Feishu document capability is unavailable just because the current outer session tool list does not explicitly show `feishu_doc`.
- In this environment, Feishu doc/drive/perm/wiki/bitable abilities may be available through the OpenClaw gateway runtime/plugin layer even when they are not surfaced as first-class outer-harness tools.
- Before telling the user that Feishu doc writing is unavailable, first verify runtime/plugin state with `openclaw status` and config checks (especially `channels.feishu.tools.doc`).
- This rule applies across refreshed sessions and across agents, including **乐湖总控 / 乐湖增长 / 乐湖销售**.

**Current expected capability:**
- `channels.feishu.tools.doc = true`
- Feishu plugin should register `feishu_doc`, `feishu_drive`, `feishu_perm`, `feishu_wiki`, and related tools at runtime.
- Default behavior expectation: when the user asks to create/write a Feishu doc, treat it as a supported capability unless runtime checks prove otherwise.

## Feishu Doc / Bitable API standard path (workspace-standard)

**Status:** ✅ Verified working in this workspace

For Feishu documents and Feishu bitable/base in this workspace, the standard path is now:

1. Generate the document body / table data in the agent session
2. Use a workspace script to call **Feishu OpenAPI directly**
3. Add user permission via **Drive permissions API**

**Do not prioritize direct session tool exposure first** for these tasks unless the user explicitly asks to test direct tools.

### Feishu Docx verified working sequence
```bash
POST /open-apis/auth/v3/tenant_access_token/internal
POST /open-apis/docx/v1/documents
GET  /open-apis/docx/v1/documents/{doc_token}/blocks/{doc_token}/children
DELETE /open-apis/docx/v1/documents/{doc_token}/blocks/{doc_token}/children/batch_delete
POST /open-apis/docx/v1/documents/blocks/convert   # content_type=markdown
POST /open-apis/docx/v1/documents/{doc_token}/blocks/{doc_token}/descendant
POST /open-apis/drive/v1/permissions/{doc_token}/members?type=docx
```

### Feishu Bitable verified working sequence
```bash
POST /open-apis/auth/v3/tenant_access_token/internal
POST /open-apis/bitable/v1/apps
POST /open-apis/drive/v1/permissions/{app_token}/members?type=bitable
```

### Feishu Bitable verified editing sequence for an existing user-provided base
```bash
# 1) parse app_token from the user-provided Feishu base URL
POST /open-apis/auth/v3/tenant_access_token/internal
POST /open-apis/bitable/v1/apps/{app_token}/tables
POST /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields
POST /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create
```

**Verified payload details:**
```json
{
  "field_name": "测试文本",
  "type": 1
}
```

```json
{
  "field_name": "测试数字",
  "type": 2
}
```

```json
{
  "field_name": "测试单选",
  "type": 3,
  "property": {
    "options": [
      {"name": "正常"},
      {"name": "待确认"}
    ]
  }
}
```

**Verified existing-base success example:**
- base app_token: `RaubbCK5NagOFzsG7qXcKgt2nyc`
- child table created: `API测试子表格`
- records inserted successfully

**Credential source:**
```bash
~/.openclaw/openclaw.json
channels.feishu.accounts.default.appId
channels.feishu.accounts.default.appSecret
```

**Known-good permission payload for 陶方正 full_access:**
```json
{
  "type": "user",
  "member_type": "openid",
  "member_id": "ou_0df2af8a7fece7c45f0ff62122efa38f",
  "perm": "full_access",
  "need_notification": false
}
```

**Known-good permission endpoints:**
```bash
POST /open-apis/drive/v1/permissions/{doc_token}/members?type=docx
POST /open-apis/drive/v1/permissions/{app_token}/members?type=bitable
```

**Important distinction:**
- "Current session does not expose `feishu_doc` / `feishu_bitable`" ≠ "This environment cannot write Feishu docs / bitables"
- In this workspace, the **OpenAPI path is the default standard path** for **乐湖总控 / 乐湖增长 / 乐湖销售**.

## feishu-bitable-sync

**Status:** ✅ Important shared tool

**Location:**
```bash
feishu-bitable-sync/
```

**Role:**
- Workspace-level shared tool for **agent writing to Feishu Bitable / syncing Feishu Base data**
- Should be treated as a default capability support directory for all agents, including future agents created later

**Use it for:**
```bash
- 写入飞书多维表格
- 同步 Feishu Base 数据
- 导出前台数据给案例库/前台项目
- 重建案例表、offer 表或相关后台数据
```

**Boundary:**
- It is a shared tool engineering directory, not a normal frontend business project
- Do not casually delete, relocate, or refactor it during workspace cleanup
- If future reorganization is needed, preserve cross-agent usability first

**Known Files:**
```bash
feishu-bitable-sync/sync.py
feishu-bitable-sync/export_frontend_data.py
feishu-bitable-sync/rebuild_offer_tables.py
feishu-bitable-sync/retry_rebuild_offer_tables.py
feishu-bitable-sync/bootstrap_case_backend.py
```

**Config Notes:**
- Sensitive config belongs in `feishu-bitable-sync/config.json` and should not be committed
- Existing ignore rule already covers `feishu-bitable-sync/config.json`

## Writing Preferences

[Document any preferences about writing style, voice, etc.]

---

## What Goes Here

- Tool configurations and settings
- Credential locations (not the credentials themselves!)
- Gotchas and workarounds discovered
- Common commands and patterns
- Integration notes

## Why Separate?

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

---

*Add whatever helps you do your job. This is your cheat sheet.*
