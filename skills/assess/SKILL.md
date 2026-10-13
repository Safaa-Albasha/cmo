---
name: assess
description: Change assessment — define the change, map impacted groups and their impact level/aspects, judge readiness and people-side risk, and produce an assessment report with proposed groups and first plan actions. Use at the start of a change or when scope changes. تقييم التغيير.
---

# Change assessment / تقييم التغيير

Write in `project.language`. Use the `change-strategist` agent (`cmo:change-strategist`) or follow its instructions and the skills `change-impact`, `org-readiness`, `change-risk`.

1. `node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" status --dir .cmo` and `impact --dir .cmo` for what exists.
2. Interview one question at a time: the change and why now; tools and licences; who is affected (groups, headcount); what changes for each group (aspects); sponsor and coalition; other changes in the same period; past rollout experience; timeline.
3. Propose groups (`add`/`update` on `groups.json`) and project settings (`set` on `project.json`: `tools`, `investment`) — see `approval-protocol`.
4. Rate change characteristics and organisational attributes (`change-risk`) and the readiness checklist (`org-readiness`).
5. Write `.cmo/reports/assessment-<date>.md`: change definition, impact table (group, headcount, level, aspects), % highly impacted, readiness strengths/risks, risk level, top 5 recommended actions.
6. List APR ids → `/cmo:approvals`; next: `/cmo:survey` (baseline) and `/cmo:plan`.
