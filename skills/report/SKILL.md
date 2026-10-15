---
name: report
description: Build the interactive change report — one offline HTML file that is a dashboard and a full-screen presentation, Arabic/English — with readiness, Prosci/Kotter journey, ADKAR heat map with barrier points, sentiment by group and over waves, adoption funnel and trend, business value with evidence and payback curve, before/after table, impact, resistance and decisions, plus what-if sliders. Use for "report", "steering committee", "presentation", "dashboard". التقرير التفاعلي.
---

# Interactive change report / التقرير التفاعلي

Write in `project.language` unless the audience needs the other language.

1. `node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" status --dir .cmo` — on `error` relay it and stop.
2. Ask (one question): audience and language (e.g. steering committee in Arabic).
3. Write the narrative to `.cmo/drafts/narrative.json` (text only — every number in the report comes from the engine):

```json
{
  "summary": { "ar": "…", "en": "…" },
  "highlights": [ { "ar": "…", "en": "…" } ],
  "recommendations": [ { "ar": "…", "en": "…" } ],
  "decisions": [ { "ar": "…", "en": "…" } ],
  "quotes": [ { "ar": "…", "en": "…" } ]
}
```
   - Any number, wave id, group or process name must be copied exactly from engine output.
   - `quotes`: 2–3 short, already-scrubbed comments from non-suppressed groups, without identifying details (`privacy`); the engine scrubs again.
   - `decisions`: only items not already pending as APR ids (those are listed automatically).

4. Build:
```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" report --dir .cmo --lang <ar|en> --narrative .cmo/drafts/narrative.json [--today YYYY-MM-DD]
```
   Output `path` (`.cmo/reports/<date>-change-report.html`), `sections`, `omitted` (mention reasons).
5. Tell the user: open in any browser (offline); **عرض / Present** for slides (arrows, Esc); language and theme buttons; **Print / PDF**; what-if sliders (active use %, licence cost) recompute value, ROI and payback with the engine's own formula.
6. Sending to stakeholders is 🟡: prepare text and recipients, confirm first.

## Sponsor card (60 seconds) / ملخص الراعي
For a sponsor who has one minute, or between steering committees:
```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" report --format card --dir .cmo [--lang ar|en] [--today YYYY-MM-DD]
```
- `.cmo/reports/<date>-sponsor-card.html` — one screen: readiness, weekly use, hours saved/month, value/ROI/payback, and **one ask**. Every value figure carries its evidence badge (statistically confirmed ≥ 80% of value from confirmed processes · preliminary ≥ 50% measured · estimate). Screenshot it or print to PDF to share on WhatsApp/Teams.
- `.cmo/reports/<date>-sponsor-brief.md` — the same as a ~60-second spoken script in Arabic and English (≤ 150 words each).
- The ask is chosen by the engine: first pending approval → a barrier point with no open activity → an overdue activity → "no decision needed".
- Do not reword numbers or drop the evidence label when passing it on; never present an estimate as a saving. Sending is 🟡.
