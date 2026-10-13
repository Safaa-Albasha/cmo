---
name: survey-design
description: Good practice for change surveys — when to run baseline and pulse waves, keeping questions comparable, response rates, anonymity, adding custom questions to the bank. Use when planning survey waves or editing the question bank.
user-invocable: false
---

# Survey design / تصميم الاستبيانات

## Cadence
- **Baseline** before any launch communication (or within the first week).
- **Pulses** every 6–8 weeks during *manage*, quarterly during *sustain*.
- Keep the same core items across waves (comparability); add at most 2 wave-specific questions.

## Question bank (`surveys/bank.json`)
Ten ADKAR items (two per element), two AI-specific items (trust, privacy), usage frequency, two open questions, department and role. Custom items: unique `id`, `type` (`likert` with `element` or `category`, `choice` with `options`, `open`), bilingual `text`. Never add name, employee ID, age, or other identifying questions.

## Response quality
- Target ≥ 50% response and ≥ 5 per group; announce via sponsor + managers; 3–5 minutes max.
- State anonymity clearly (the generated forms include it).
- Close the loop: share results and actions within 2 weeks of each wave — it raises the next response rate.

## Interpreting
Differences of < 0.2 on a 1–5 scale between waves are noise for small groups; look for consistent movement across items and alignment with usage data.
