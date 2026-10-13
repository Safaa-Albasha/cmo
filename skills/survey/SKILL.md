---
name: survey
description: Prepare a survey wave (baseline or pulse) from the bilingual AI-adoption question bank and generate it for Microsoft Forms (Quick Import Word file) or Google Forms (Apps Script that creates the form). Use for "create a survey", "baseline survey", "pulse survey", "ADKAR survey". إعداد الاستبيان.
---

# Survey wave / جولة استبيان

Write in `project.language`. One question at a time.

1. Check groups exist: `node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" status --dir .cmo` → `groups`. None → help the user add impacted groups to `.cmo/groups.json` (`{ "id": "FIN", "name": "المالية / Finance", "headcount": 60, "impactLevel": 4 }`) first.
2. Ask: wave type (**baseline** before launch, or **pulse** later), wave id (e.g. `baseline`, `pulse-1`), date. Pulse waves keep the same questions as the baseline so results compare.
3. Create and generate:

```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" wave --dir .cmo --id <wave> --type <baseline|pulse> --date <YYYY-MM-DD>
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" survey --dir .cmo --wave <wave>
```

4. Explain the files in `.cmo/drafts/`:
   - **Microsoft Forms:** open forms.office.com → *Quick import* → upload `survey-<wave>-msforms.docx` → review the questions (Likert items come as choice questions 1–5; set the department question to *Dropdown* if it imports as choice) → turn off *Record name* (Settings) → share the link.
   - **Google Forms:** open script.google.com → New project → paste `survey-<wave>-google.gs` → Run `createSurvey` → allow access → links appear in *Execution log* (form link to share, edit link, responses sheet).
   - `survey-<wave>.md` — readable copy for review or manual creation.
5. Remind: do not edit the `[ID]` prefixes in question titles — they let `/cmo:import` map answers exactly. Never add a name or employee-number question. Aim for ≥ 5 respondents per group (smaller groups are hidden in reports).
