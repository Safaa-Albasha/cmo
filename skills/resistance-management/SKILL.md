---
name: resistance-management
description: Detect resistance from data (barrier points, negative themes, falling usage), find the ADKAR root cause, choose interventions and track them in resistance.json. Use for resistance analysis and the resistance log.
user-invocable: false
---

# Resistance management / إدارة المقاومة

Resistance is information: it tells you which ADKAR stage is missing for a group.

## Signals (engine data, group level)
- Barrier at awareness or desire **and** net sentiment < 0.
- Reach or retention falling between usage snapshots.
- A negative theme with share ≥ 25% of a group's comments (job security, workload, trust, manager support).
- Plan gap: barrier with no open activity (`plan.gaps`).

## Root cause → intervention
| Root cause | Interventions |
|---|---|
| awareness | sponsor explains why; managers repeat; Q&A |
| desire | address the specific fear (roles, workload); peer stories; involve resisters in pilots; sponsor commitment |
| knowledge | targeted training; clear policy; examples |
| ability | time, support, tool fixes, workload rebalancing |
| reinforcement | recognition, KPIs, manager follow-up, remove old path |

## Log (`resistance.json → entries[]`, controlled)
`{ "id": "RS-4", "group": "OPS", "rootCause": "reinforcement", "signal": "…", "intervention": "…", "owner": "…", "status": "open|monitoring|resolved", "opened": "YYYY-MM-DD" }`
New entry → `add` proposal; status change → `update`. Resolve only when the next pulse/usage shows improvement.

Never target individuals; resistance is tracked per group (`privacy`).
