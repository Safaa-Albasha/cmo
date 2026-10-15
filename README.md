# cmo — AI-adoption Change Management Office for Claude

[العربية](README.ar.md) · [Install guide](INSTALL.md)

A Claude Code plugin that helps a change manager **plan, run and prove** an AI-adoption change (Microsoft 365 Copilot, Claude, ChatGPT Enterprise, Gemini…). It combines the Prosci 3-phase process, Kotter's 8 steps and ADKAR, and measures three layers before and after:

1. **People:** ADKAR scores, barrier points and sentiment, from Google Forms / Microsoft Forms surveys.
2. **Adoption:** actual usage from admin usage reports — reach, activation, frequency, retention.
3. **Business value:** process time before vs after, hours and money saved, ROI, payback, with statistical evidence (Welch t-test).

Arabic and English throughout. The currency is chosen by the change manager.

- **Numbers are never guessed.** Claude classifies comments and writes narrative; a zero-dependency engine computes every figure.
- **Privacy is built into the code.**
  - Names and emails are used only to make salted pseudonyms, then dropped.
  - Comments are scrubbed of emails, phone numbers and links.
  - Groups under 5 people are never reported.
  - A hook blocks any access to the anonymity salt.
  - **Privacy promise sheet:** a bilingual one-page statement for employees and the works council, generated from your settings; every survey opens with its summary.
- **Reminders when you open the project:** one line of what is due (survey, usage data, comments, approvals, overdue plan work). Silent when all is up to date. Dates follow the project's time zone (default Asia/Dubai).
- **You decide.** Agents propose; plan, groups, sponsors, processes and the resistance log change only through your approvals. Every decision is logged.
- **Interactive report** — one offline HTML file that is both a dashboard and a full-screen presentation.

> Requires Node.js 18+. Prosci® and ADKAR® are trademarks of Prosci, Inc.; Kotter's 8-Step Process is © Kotter, Inc. This plugin is not affiliated with or endorsed by either; its content is original and inspired by these frameworks.

## Install

```bash
claude plugin marketplace add Safaa-Albasha/cmo
claude plugin install cmo@cmo
```

Restart Claude Code, open a folder for your change programme and run `/cmo:setup`. Step-by-step guide: [INSTALL.md](INSTALL.md).

## Typical journey

1. `/cmo:new` — the change, its type (AI adoption template), language, currency and dates.
2. `/cmo:assess` — impacted groups, impact level, readiness, risk.
3. `/cmo:survey` — **baseline** survey → Microsoft Forms (Quick Import file) or Google Forms (Apps Script).
4. `/cmo:value` — register 3–7 key processes with their current time; timing form for real measurements.
5. `/cmo:plan` — Prosci × Kotter × ADKAR plan; approve it in `/cmo:approvals`.
6. Run the change. Then:
   - every 6–8 weeks, a pulse survey with `/cmo:survey`, then `/cmo:import`, then `/cmo:pulse`;
   - monthly, import usage reports with `/cmo:import`.
7. `/cmo:status` any time; `/cmo:report` for the steering committee.

Try it first on the example: copy `examples/ai-adoption` somewhere, open it in Claude Code and run `/cmo:status`. Ready-made report: `examples/sample-report-ai-adoption.html`.

## Commands

| Command | What it does |
|---|---|
| `/cmo:setup` | health check (Node, project, salt), connections |
| `/cmo:new` | create the change project (`.cmo/`) |
| `/cmo:assess` | impact, readiness, people-side risk |
| `/cmo:plan` | plan coverage (phases, Kotter steps, ADKAR), overdue, **gaps between barrier points and open activities**, proposals |
| `/cmo:survey` | baseline/pulse waves; Microsoft Forms and Google Forms files; privacy promise sheet |
| `/cmo:import` | survey responses, AI usage reports (+ roster), timing samples |
| `/cmo:pulse` | classify comments, manager review, wave analysis and actions |
| `/cmo:value` | processes, before/after, ROI, payback, evidence |
| `/cmo:resistance` | resistance signals and log |
| `/cmo:status` | readiness, ADKAR, sentiment, adoption, value, plan |
| `/cmo:report` | interactive report and presentation; one-screen **sponsor card** + 60-second script (`--format card`) |
| `/cmo:link-pmo` | **preview** of the PMO ↔ CMO bridge (readiness gate for go-live); records your interest |
| `/cmo:approvals` | decide proposals; decision log |

**Agents:** cmo-lead · change-strategist · sponsor-coach · survey-designer · sentiment-analyst · adoption-analyst · value-analyst · resistance-manager · enablement-lead · comms-lead · reporter.

## How measurements work

| Measure | Definition |
|---|---|
| ADKAR element | mean of its two Likert items (1–5) per group |
| Barrier point | first element below 3.0 in A→D→K→A→R order (ADKAR is sequential) |
| Net sentiment | % positive − % negative comments (−100…+100); low-confidence labels go to manager review first |
| Reach | weekly active ÷ licensed |
| Readiness | ADKAR 50% + sentiment 20% + reach 30% (configurable), 0–100, 🟢 ≥ 70 · 🟡 ≥ 50 |
| Time saved | baseline − after minutes (🟢 measured samples or 🟡 estimate) × monthly frequency |
| Evidence | ✔ confirmed when ≥ 5 samples each side and Welch p < 0.05; inconclusive; preliminary; estimate |
| ROI | (value − monthly cost) ÷ monthly cost; monthly cost = licences + one-time investment ÷ amortisation months |

Saved time is capacity: it becomes financial savings only when redeployed. Slower processes are shown, not hidden.

## Data (`.cmo/`)

**Controlled (change only through approval):**
- `project.json` (incl. `timezone`, default `Asia/Dubai`, and reminder `cadence`)
- `groups.json`
- `plan.json`
- `sponsors.json`
- `processes.json`
- `resistance.json`

**Free (written directly):**
- `surveys/<wave>/` — meta, responses, sentiment labels
- `usage/<date>.json`
- `samples/<process>.json`
- `drafts/` and `reports/`

**Engine only:**
- `approvals.json`
- `decisions.json`

**Private:** `.salt`. It is git-ignored, never readable by Claude, and you must back it up so pseudonyms stay comparable across waves.

## Claude Desktop (Cowork)

Skills, commands, agents and hooks are supported in Cowork. The calculation engine needs Node.js in the environment where Claude runs. Run `/cmo:setup` in Cowork: if Node is available, everything works; if not, use Claude Code for the numbers (and please report it).

## Development

```bash
cd plugins/cmo && node --test          # 104 tests
node examples/build-example.js         # regenerate the example
```

MIT © 2026 Safaa Albasha
