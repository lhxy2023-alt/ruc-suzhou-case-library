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
