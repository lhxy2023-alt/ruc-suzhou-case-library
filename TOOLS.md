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

**Common Operations:**
```bash
browser-use open https://example.com
browser-use state
browser-use close
browser-use doctor
```

---

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
