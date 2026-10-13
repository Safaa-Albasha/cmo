---
name: org-readiness
description: Judge organisational readiness for AI adoption — the engine's composite readiness score per group plus qualitative factors (change saturation, past change history, leadership alignment, data/tool readiness). Use in assessment and when explaining readiness RAG.
user-invocable: false
---

# Organisational readiness / الجاهزية المؤسسية

## Quantitative (engine)
`readiness` per group 0–100 = ADKAR average (50%) + net sentiment (20%) + adoption reach (30%), weights in `project.json.weights`; RAG ≥ 70 green, ≥ 50 amber (configurable). Missing parts are re-weighted — say which parts were available.

## Qualitative checklist (ask the change manager)
- **Change saturation:** other major changes hitting the same groups in the next 6 months?
- **History:** how did the last technology rollout go? Trust in leadership promises?
- **Leadership alignment:** do executives use AI themselves and say the same message?
- **Middle managers:** willing to coach and protect practice time?
- **Data & tools readiness:** licences provisioned, SSO, data classification, approved use cases, acceptable-use policy?
- **Capacity:** time available for training during peak periods (month-end, Ramadan, audits)?

Summarise as: strengths, risks, readiness actions (each a proposed plan activity).
