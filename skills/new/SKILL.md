---
name: new
description: Create a change-management project (.cmo/) — AI-adoption template with question bank and Prosci/Kotter plan, Arabic or English. Use when the user wants to start a change, AI rollout or adoption programme. إنشاء مشروع تغيير.
---

# New change project / مشروع تغيير جديد

Reply in the user's language, one question at a time.

1. If `.cmo/project.json` exists, say so and offer `/cmo:status`.
2. Ask:
   - Change name and one-line description (e.g. «تبنّي Microsoft 365 Copilot في الشركة»).
   - Type: **ai-adoption** (ready question bank, sentiment themes and a 17-activity Prosci/Kotter plan) or **generic**.
   - Report language `ar` / `en`.
   - Currency — open question chosen by the change manager (ISO code recommended, e.g. SAR, AED, KWD, USD; any label accepted).
   - Start and end dates (YYYY-MM-DD).
   - Time zone — default **Asia/Dubai**; ask only if the team is elsewhere (IANA name, e.g. Asia/Riyadh, Asia/Kuwait, Europe/London). "Today" for overdue work, reports and reminders is the date in this zone.
   - Sponsor and change manager names (optional).
3. Confirm, then run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" init --dir .cmo --name "<name>" --type <ai-adoption|generic> --language <ar|en> --currency <CUR> --start <date> --end <date> --timezone <Area/City> --sponsor "<sponsor>" --cm "<change manager>" --description "<description>"
```

4. On `error` show the message in the project language. On success explain next steps:
   - add impacted groups (`groups.json`) and AI tools/licences and one-time investment (`project.json`);
   - run a **baseline survey** before launch (later: `/cmo:survey`);
   - register 3–5 key processes with their current time (later: `/cmo:value`);
   - `.cmo/.salt` is private and git-ignored — it protects respondent anonymity; do not share it.

Never invent numbers.
