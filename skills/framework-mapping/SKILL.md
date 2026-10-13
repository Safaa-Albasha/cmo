---
name: framework-mapping
description: How the three frameworks combine in one plan — Prosci phases as backbone, Kotter steps as leadership work inside phases, ADKAR targets per activity and group, levers as the means. Use when building or reviewing a plan or explaining the method.
user-invocable: false
---

# Framework mapping / دمج الأطر

```
Phase (Prosci)        Kotter steps (leadership)        ADKAR focus (people)        Main levers
Prepare approach  →   1 urgency · 2 coalition · 3 vision   Awareness              sponsorship, assessment, governance
Manage change     →   4 communicate · 5 empower · 6 wins   Desire → Knowledge → Ability   communications, training, coaching, resistance
Sustain outcomes  →   7 accelerate · 8 anchor              Reinforcement          reinforcement, assessment
```

Every activity in `plan.json` carries:
- `phase` — when (Prosci)
- `kotterStep` — which leadership step it advances (null for operational tasks like surveys)
- `adkar` — which individual stage(s) it moves
- `lever` — the means
- `groups` — who (empty = everyone)

Checks before approving a plan:
1. Each Kotter step 1–8 has at least one activity (`plan.kotter[].status` ≠ missing).
2. Each ADKAR element has activities; interventions follow the sequence.
3. Every group's current barrier point has an open activity (`plan.gaps` empty).
4. Each phase has an exit measure (baseline captured; adoption target; value report).
5. Owners and due dates set; overdue items reviewed (`plan.overdue`).
