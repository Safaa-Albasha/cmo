---
name: change-impact
description: Assess how much the change affects each group — impact level 1–5 and impacted aspects (processes, systems/tools, roles, skills, behaviours, performance measures, reporting lines, data handling) — and maintain groups.json. Use for impact assessment and prioritising groups.
user-invocable: false
---

# Change impact assessment / تقييم أثر التغيير

## Per group (`groups.json → groups[]`, controlled)
```json
{ "id": "OPS", "name": "العمليات / Operations", "headcount": 150, "impactLevel": 5,
  "aspects": ["processes", "systems-tools", "performance-measures", "skills"],
  "currentState": "", "futureState": "" }
```

## Aspects (use these ids)
`processes` · `systems-tools` · `job-roles` · `skills` · `behaviors` · `performance-measures` · `reporting-lines` · `data-handling`

## Impact level
| Level | Meaning for AI adoption |
|---|---|
| 1 | Optional use, no workflow change |
| 2 | Occasional use in a few tasks |
| 3 | Regular use in core tasks; some new skills |
| 4 | Core processes redesigned around AI; new skills and measures |
| 5 | Role content changes substantially; performance measures and staffing affected |

## Steps
1. Interview group leads (one question at a time) about current vs future state.
2. Score level and aspects; record what changes in each aspect in `currentState`/`futureState`.
3. Engine `impact`: total headcount, % highly impacted (level ≥ 4), ranking by load (level × headcount), aspect frequency.
4. High-load groups get earlier sponsor attention, more coaching and champions; propose group changes via `approval-protocol`.
