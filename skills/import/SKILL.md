---
name: import
description: Import survey responses (Microsoft Forms Excel / Google Forms CSV or Sheets), AI-tool usage reports (Microsoft 365 Copilot, Claude, ChatGPT Enterprise, Gemini) or process timing samples into the change project — anonymised, previewed first. Use for "import responses", "load the Forms export", "import Copilot usage", "import timings". استيراد.
---

# Import / الاستيراد

Write in `project.language`. Always preview first, confirm with the user, then rerun with `--write`.

## Survey responses
```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" import --dir .cmo --type responses --wave <wave> --from "<file.xlsx|csv>"
```
Show: `mapping` (identity columns are **dropped**, used only for the anonymous key and to remove names from comments), `missingQuestions`, `count` per group (`groups`), warnings (unknown departments or answers). If departments do not match, fix group names in `groups.json` or the file, then preview again. Google Sheets via connector: read the responses sheet, save it as CSV in `.cmo/drafts/`, import that file.

## Usage reports
```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" import --dir .cmo --type usage --tool <copilot|claude|chatgpt|gemini> --date <report date> --from "<file>" [--roster "<email,department file>"]
```
- Microsoft 365 Copilot: admin center → Reports → Usage → Microsoft 365 Copilot → export (one row per user). It has no department column → ask for a roster export (email + department, e.g. from Entra ID/HR) and pass `--roster`. Users not in the roster are counted in `unmappedUsers`.
- A per-group summary (Department, Licensed, Activated, Weekly active users…) imports without a roster.
- No user identity is stored; only group totals.

## Process timings
```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" import --dir .cmo --type samples --from "<file>" [--replace]
```
Columns: process (id or name), phase (before/after, قبل/بعد), minutes, optional errors (yes/no) and date.

After writing: run `/cmo:status` or `/cmo:pulse`. `VALIDATION_FAILED` → nothing was changed; show `details`.
