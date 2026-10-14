---
name: setup
description: First-time setup and health check for the CMO plugin — checks Node.js (the calculation engine), the change project and its privacy salt, and explains how to connect Google Forms/Sheets, Microsoft Forms/OneDrive and AI usage reports. Also the check to run in Claude Desktop (Cowork). Use when installing, "setup", "is it working", "connect forms". الإعداد والفحص.
---

# Setup / الإعداد

Reply in the user's language.

1. Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" doctor --dir .cmo
```
2. Interpret:
   - Command fails because `node` is not found, or `node.ok` false → the engine needs **Node.js 18+**. In Claude Code: install from https://nodejs.org (LTS) and restart. **In Claude Desktop (Cowork):** tell the user the engine cannot run in this environment yet; skills still explain methods, but numbers require Claude Code — and ask them to report the result (it decides the Cowork version).
   - `project.exists` false → offer `/cmo:new`.
   - `project.valid` false → run `validate` and help fix (messages in the project language).
   - `project.salt` false on an existing project → warn: anonymous keys cannot be created; restore `.cmo/.salt` from backup (it is git-ignored on purpose). Never print or recreate it over existing data without the user understanding that new keys will not match old waves.
   - `pendingApprovals` > 0 → `/cmo:approvals`.
   - **Session reminders:** when Claude Code opens a folder with `.cmo/`, a SessionStart hook shows one bilingual line of what is due (overdue survey, old usage data, comments to review, approvals, overdue plan work, barrier points with no activity), and nothing when all is up to date. Same check on demand: `nudges --dir .cmo`. Timing comes from `project.json`: `timezone` (default Asia/Dubai) and `cadence` `{ "pulseDays": 60, "usageDays": 35 }` (7–365) — change them with a `set` proposal (`approval-protocol`).
3. Connections (all optional — files always work):
   - **Google Forms / Sheets:** `/cmo:survey` makes an Apps Script that creates the form and a responses sheet. To read the sheet directly, connect Google Drive in claude.ai → Settings → Connectors; otherwise download CSV and `/cmo:import`.
   - **Microsoft Forms / OneDrive:** Quick Import file from `/cmo:survey`; export responses to Excel and `/cmo:import`, or connect Microsoft 365 in claude.ai Connectors.
   - **AI usage:** Microsoft 365 admin center → Reports → Usage → Copilot (export) plus a roster (email, department); Claude/ChatGPT/Gemini admin analytics exports.
4. Summarise what is ready and the next step (`/cmo:new` → `/cmo:assess` → `/cmo:survey` baseline).
