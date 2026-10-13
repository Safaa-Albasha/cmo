---
name: approvals
description: Review and decide pending change-programme proposals (plan activities, groups, sponsors and champions, processes and baselines, resistance log, project settings) — approve, reject or edit; every decision is logged. Use for "approvals", "pending decisions". الموافقات.
---

# Approvals / الموافقات

Write in `project.language`.

1. ```bash
   node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" approvals --dir .cmo
   ```
   Empty → nothing pending.
2. Show each as a card: **ID · title** (agent) · why · impact · change (file, before → after, only changed fields).
3. Ask the change manager to decide (AskUserQuestion, up to 4 per question): Approve ✅ / Reject ❌ / Edit ✏️; optional note on rejections.
4. Approver name: `changeManager` in project.json, else ask once.
5. Apply — one id or a batch with the same decision:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" apply --dir .cmo --id <APR-id> --decision <approve|reject> --by "<name>" --note "<note>"
   node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" apply --dir .cmo --ids APR-0003,APR-0004 --decision approve --by "<name>"
   ```
   Claude Code asks for confirmation on every `apply` (CMO guard) — tell the user before the first one.
6. Edit: write the corrected proposal (`propose --file`), then reject the original with note `superseded by <id>`.
7. `PROPOSAL_STALE` → data changed; reject and re-propose. `VALIDATION_FAILED` → show `details`.
8. Summary table: id, title, decision, by. Never apply what the user did not decide.
