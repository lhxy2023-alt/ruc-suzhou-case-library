# 学习记录

## [LRN-20260326-001] correction

**Logged**: 2026-03-25T16:48:00Z
**Priority**: medium
**Status**: pending
**Area**: docs

### Summary
When identifying university logos from a single image, do not over-trust a quick visual guess when similar European business school logos exist.

### Details
The user corrected a logo identification: I said the logo was ESSEC Business School, but the correct school was 欧洲高等商学院 (European Business School / EBS). For one-off logo checks without stable OCR or image-model support, I should ask for confirmation or phrase it as tentative instead of asserting.

### Suggested Action
For single-logo identifications under uncertainty: (1) state low confidence, (2) offer top candidate(s), or (3) ask the user to confirm before updating any data.

### Metadata
- Source: user_feedback
- Related Files: none
- Tags: correction, logo-identification, feishu-base

---

## [LRN-20260326-002] best_practice

**Logged**: 2026-03-26T04:20:00Z
**Priority**: high
**Status**: pending
**Area**: config

### Summary
OpenClaw memory_search cannot reuse openai-codex OAuth; restore semantic recall by configuring a supported embedding provider such as openai with memorySearch.remote.apiKey.

### Details
Source-level debugging confirmed that the current OpenClaw memory_search embedding path does not support the `openai-codex` provider or OAuth reuse from the chat model. The supported memory providers are a fixed set including `openai`, `local`, `gemini`, `voyage`, `mistral`, `ollama`, and `auto`; the default OpenAI embedding model is `text-embedding-3-small`; and the config path explicitly expects `agents.defaults.memorySearch.remote.apiKey`. This means chat can work through `openai-codex/gpt-5.4` with OAuth while memory_search still fails or behaves inconsistently unless a real embedding provider is configured separately. In this case, switching memory_search to `openai` and setting `agents.defaults.memorySearch.remote.apiKey` restored `memory status --deep` to `Embeddings: ready` and made both the `memory_search` tool and `openclaw memory search` return stable results again.

### Suggested Action
When memory_search is flaky or unavailable, first verify whether the issue is provider/auth-chain mismatch before blaming indexing. If the user is on openai-codex OAuth chat, do not assume memory_search can reuse that auth. Prefer one of: (1) configure `agents.defaults.memorySearch.provider openai` plus `memorySearch.remote.apiKey`, (2) switch to another supported remote embedding provider, or (3) move to local/ollama embeddings.

### Metadata
- Source: conversation
- Related Files: /Users/taofangzheng/.openclaw/openclaw.json
- Tags: memory_search, openclaw, oauth, openai, embeddings, config
- See Also: LRN-20260326-001
- Pattern-Key: openclaw.memory-search.oauth-vs-embeddings
- Recurrence-Count: 1
- First-Seen: 2026-03-26
- Last-Seen: 2026-03-26

---

## [LRN-20260326-001] correction

**Logged**: 2026-03-26T06:10:00Z
**Priority**: high
**Status**: pending
**Area**: config

### Summary
Do not claim Feishu doc writing is unavailable just because no first-class feishu_doc tool appears in the session tool list.

### Details
The user corrected that Feishu doc writing had worked repeatedly in prior sessions. Investigation showed the Feishu plugin is loaded, `channels.feishu.tools.doc=true`, and `openclaw status` reports `feishu_doc: Registered feishu_doc, feishu_app_scopes`. The real issue is that plugin-backed skills/tools may be available through the gateway runtime even when they are not exposed as a first-class developer tool in the current outer harness listing. I incorrectly concluded the capability was unavailable instead of checking gateway/plugin state first.

### Suggested Action
When Feishu doc actions are expected to exist, first verify plugin/runtime status with `openclaw status` and config checks before telling the user the capability is unavailable. Treat missing first-class tool exposure and missing runtime capability as different problems. Persist a rule that new sessions for main/growth/sales should assume Feishu doc capability is intended to be present and must be verified at config/runtime level before denying.

### Metadata
- Source: user_feedback
- Related Files: /Users/taofangzheng/.openclaw/openclaw.json
- Tags: feishu, docx, tool-exposure, runtime-capability
- Pattern-Key: feishu.doc.exposure-vs-runtime
- Recurrence-Count: 1
- First-Seen: 2026-03-26
- Last-Seen: 2026-03-26

---
