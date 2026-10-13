---
name: adoption-metrics
description: Interpret AI-tool adoption metrics from the engine — activation, reach, frequency, depth, retention, power users, funnel and trend — and link them to ADKAR. Use when analysing usage data.
user-invocable: false
---

# Adoption metrics / مؤشرات التبنّي

| Metric | Definition | Healthy target (typical, adjust per org) |
|---|---|---|
| Activation · التفعيل | activated ÷ licensed | ≥ 85% by month 2 |
| Reach · الاستخدام النشط | weekly active ÷ licensed | ≥ 60% by month 4 |
| Frequency · التكرار | avg active days/week among active users | ≥ 3 |
| Depth · العمق | avg features/apps used | rising over time |
| Retention · الاستمرارية | active in last 30 days ÷ activated | ≥ 80% |
| Power users | ≥ 4 days/week ÷ licensed | 15–30% (future champions) |

## Reading
- Funnel licensed → activated → weekly active → power users shows where people drop: activation gap = access/awareness; reach gap = desire/ability; frequency gap = habit/reinforcement.
- Licence-based: a person with two tools counts twice in totals — say so if tools overlap.
- Link to ADKAR: low desire + low reach → motivation problem (not training); high desire + low ability + low frequency → enablement problem; high reach + low reinforcement → risk of decay, watch retention.
- Trends matter more than one snapshot; compare first vs latest (`compare.adoption`) and month-to-month (`adoption.trend`).
- Never list individual users.
