---
name: plan
description: Review and build the change plan — progress by Prosci phase, Kotter step coverage, ADKAR coverage, overdue activities and gaps between survey barrier points and open activities — and propose new or updated activities for approval. Use for "the plan", "what's missing", "update activity status". خطة التغيير.
---

# Change plan / خطة التغيير

Write in `project.language`. Use `cmo:change-strategist` or follow its instructions with `framework-mapping`, `kotter-8`, `adkar`, `prosci-phases`.

1. ```bash
   node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" plan --dir .cmo --today <YYYY-MM-DD>
   ```
2. Show:
   - % done overall and per phase (prepare/manage/sustain);
   - Kotter steps 1–8 as ✅ done / 🔄 in progress / ⏳ planned / ❌ missing;
   - ADKAR coverage (activities and done per element);
   - **overdue** activities (owner, due);
   - **gaps**: groups whose barrier point has no open activity, with suggested levers.
3. Ask what the user wants: close gaps · update statuses/dates · add activities · review the whole plan.
4. Each change is a proposal (`add`/`update` on `plan.json`) with phase, kotterStep, adkar, lever, groups, owner, start, due and a bilingual title (`approval-protocol`). Group several status updates as separate proposals and suggest one batch approval.
5. List APR ids → `/cmo:approvals`.
