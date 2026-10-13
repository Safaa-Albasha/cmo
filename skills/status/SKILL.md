---
name: status
description: Show change-programme status — readiness 🟢🟡🔴 per group, ADKAR scores and barrier points, sentiment and top themes, AI adoption (reach, frequency, retention) and business value (hours saved, ROI, evidence), with baseline-vs-latest comparison. Use for "how is the change going", "adoption status", "ADKAR", "ROI". حالة التغيير.
---

# Change status / حالة التغيير

1. Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" status --dir .cmo
```

2. On `error`: `FILE_MISSING` project.json → offer `/cmo:new`; `VALIDATION_FAILED` → list `details` in the project language.
3. Write in `project.language`, numbers only from the output (never compute):
   - **Readiness** overall and per group (`readiness.latest`), with change since baseline (`compare.readiness`). Suppressed groups: "fewer than 5 people — hidden for privacy".
   - **People (ADKAR):** latest element scores, barrier point per group (`people.latest.adkar.groups[g].barrier`) and what it means (e.g. barrier at *desire* → focus on why/benefit, not more training). Deltas from `compare.people`.
   - **Sentiment:** net, % negative, top 3 themes with their net; `pending` comments to classify/review.
   - **Adoption:** reach, activation, frequency, retention now vs first snapshot (`compare.adoption`).
   - **Business value:** hours saved/month, value/month in project currency, ROI %, payback months; per process mark 🟢 measured / 🟡 estimate and evidence (`confirmed` ✔, `inconclusive`, `preliminary`, `estimate`).
   - **What to do next:** 3 actions tied to the barrier points and top negative themes.
   - Mention `notes` (missing data) plainly.
4. Glossary: Awareness الوعي · Desire الرغبة · Knowledge المعرفة · Ability القدرة · Reinforcement التعزيز · barrier point نقطة العائق · net sentiment صافي المشاعر · reach نسبة الاستخدام النشط · readiness الجاهزية · payback فترة الاسترداد.

Do not modify files.
