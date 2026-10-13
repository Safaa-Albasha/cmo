---
name: value-measurement
description: Measure business value of AI before and after — choosing processes, baseline estimates vs timed samples, the timing form, statistical evidence (Welch t-test), hours/value/ROI/payback, and honest reporting. Use for /cmo:value and value reports.
user-invocable: false
---

# Value measurement / قياس الأثر على العمل

## Choose processes
3–7 processes per programme: frequent (high monthly volume), time-consuming, measurable start/end, owned by a named person, AI clearly applicable. Mix departments.

## Register (`processes.json`, controlled)
```json
{ "id": "PR6", "name": "إعداد محضر الاجتماع / Meeting minutes", "group": "HR", "owner": "HR BP",
  "frequencyPerMonth": 80, "hourlyCost": 95,
  "baseline": { "minutes": 45, "errorRate": 10 }, "after": { "minutes": 15, "errorRate": 5 } }
```
`hourlyCost` = loaded cost per hour in the project currency (ask finance; label it as an assumption). Estimates are 🟡.

## Measure (🟢)
1. `timing-form` generates a Forms questionnaire (process, before/with AI, minutes, errors).
2. Collect ≥ 5 runs before and ≥ 5 after per process (10+ is better), from several people, normal workload.
3. Import with `import --type samples`.

## Evidence (engine)
- `confirmed` ✔: both sides ≥ 5 samples and Welch p < 0.05 — show the 95% CI of minutes saved.
- `inconclusive`: enough samples, difference not significant — say so; it may have no effect or need more data.
- `preliminary`: some samples but < 5 on a side.
- `estimate`: no samples.
Report p-values < 0.001 as "< 0.001".

## Money
hours/month = minutes saved × frequency ÷ 60; value = hours × hourly cost. ROI = (value − monthly cost) ÷ monthly cost, monthly cost = licences + one-time investment ÷ amortisation months; payback = one-time ÷ (value − licences).

## Honesty rules
Saved time is capacity, not cash, unless redeployed — say this in reports. Negative results (slower process) are shown, not hidden. Separate measured from estimated value (`measuredValueShare`).
