# Changelog

## 1.1.0 — 2026-10-14

- **Privacy promise sheet** (`privacy-sheet`, also written by `survey`): a bilingual one-page statement for employees and the works council, generated only from the project settings and the rules the engine enforces. It covers what is collected, the minimum group size, how names and emails are dropped after making pseudonyms, comment cleaning, and who sees what. Offline HTML (print and dark mode) plus Markdown.
- Every survey and timing form now opens with the short version of the promise, with an estimated answering time.
- **Session reminders:** a SessionStart hook prints one bilingual line of what is due — survey wave overdue, usage data old, comments to classify or review, approvals pending, plan activities overdue, barrier points with no open activity — and nothing when all is up to date or outside a `.cmo/` project. Also `nudges` in the engine. Cadence in `project.json` `cadence` (`pulseDays` 60, `usageDays` 35 by default).
- **Time zone:** `project.json` `timezone` (IANA, default `Asia/Dubai`; `init --timezone`). "Today" for overdue work, reports and reminders is the date in that zone, not UTC — previously work in the UAE between midnight and 4 a.m. counted as the day before. The report footer shows that date.
- **Fix:** the survey intro said "at least 5 people" even when `privacy.minGroupSize` was set to another value; it now uses the configured size. Arabic counted nouns agree with the number (5 أشخاص, 12 شخصًا).

## 1.0.1 — 2026-10-13

- Example project includes its (public, fictional) privacy salt so imports work when trying the example.

## 1.0.0 — 2026-10-13

First release.

- **Engine** (Node.js, zero dependencies): ADKAR element scores and barrier points; sentiment aggregation with confidence/review queue; AI adoption metrics (activation, reach, frequency, depth, retention, power users, trend); business value (time saved, hours and value per month, ROI, payback) with Welch t-test evidence; composite readiness; baseline-vs-latest comparison; plan analytics (Prosci phases, Kotter steps, ADKAR coverage, overdue, barrier-point gaps); change impact; resistance summary.
- **Privacy in code:** salted pseudonyms, identity columns dropped after use, comment scrubbing (emails, phones incl. Arabic digits, links, respondent names), small-group suppression, guard blocks any access to `.cmo/.salt`.
- **Surveys:** bilingual AI-adoption question bank; Microsoft Forms Quick Import `.docx` and Google Forms Apps Script generators with `[ID]`-tagged items; process timing form.
- **Import:** Forms responses (CSV/XLSX/JSON, Arabic/English labels and digits), usage reports (per user + roster, or per group), timing samples; preview first, validated writes with rollback.
- **Governance:** proposals (`add`, `update`, `set`; multi-collection sponsors), approval queue with stale check, batch decisions, decision log, PreToolUse guard.
- **Agents (11)** and **knowledge skills (21)**; commands `setup`, `new`, `assess`, `plan`, `survey`, `import`, `pulse`, `value`, `resistance`, `status`, `report`, `approvals`.
- **Interactive report:** offline HTML dashboard + presentation, AR/EN, dark mode, print; ADKAR heat map, sentiment by group and waves, adoption funnel/trend, value with evidence and payback curve, before/after, what-if sliders using the engine formula.
- Example: 400-employee AI-adoption programme (3 waves, 6 usage months, 5 processes) and sample report.
