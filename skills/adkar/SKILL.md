---
name: adkar
description: Interpret ADKAR (Awareness, Desire, Knowledge, Ability, Reinforcement) scores and barrier points from the engine and choose the right interventions per stage. Use when analysing survey results, planning interventions or explaining why adoption stalls.
user-invocable: false
---

# ADKAR / مراحل التغيير الفردي

Inspired by the Prosci ADKAR® Model (trademark of Prosci, Inc.). Survey items in this plugin are original.

## Reading engine output
- Element score = mean of its Likert items (1–5) per group per wave.
- **Barrier point** = first element below the threshold (default 3.0) in order A → D → K → A → R. The model is sequential: interventions for later elements fail while an earlier one is weak.
- `barrierDistribution` = how many respondents stall at each element — a group can pass on average while a large minority is stuck.

## What each barrier means and what works
| Barrier | Typical signals | Interventions (lever) |
|---|---|---|
| Awareness الوعي | "why are we doing this?", rumours | sponsor messages on *why now* and risks of not changing; leader town halls; FAQ (sponsorship, communications) |
| Desire الرغبة | fear for jobs, "not my job", no personal benefit | sponsor commitment on roles; personal benefit stories from peers; champions; address fears openly; involve skeptics in use-case design (sponsorship, coaching, resistance) |
| Knowledge المعرفة | "don't know how", unclear allowed use | role-based training; prompt library; clear AI policy; examples per department (training, governance) |
| Ability القدرة | no time, tool fails, can't apply | hands-on workshops on real tasks; protected practice time; office hours; champion pairing; fix tool access (coaching, training) |
| Reinforcement التعزيز | old habits return, no recognition | recognition; KPIs; manager follow-up; share wins; remove old workflows (reinforcement) |

## Rules
- Report barriers per group, not just overall.
- Compare to baseline with `compare.people`; a rising element with a falling later one often means progress moved the bottleneck.
- Never prescribe more training when the barrier is Awareness or Desire.
