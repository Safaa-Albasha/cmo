---
name: link-pmo
description: Preview of the PMO ↔ CMO bridge — people readiness as a go/no-go gate and risk in the pmo plugin, and pmo go-live milestones turned into change activities. Not built yet; explains the idea, checks whether a .pmo project sits next to .cmo, asks three questions and records the answers locally. Use for "link with PMO", "go-live gate", "connect cmo and pmo", "ربط مع PMO".
---

# PMO ↔ CMO bridge (preview) / جسر PMO ↔ CMO (معاينة)

Write in `project.language`. **This feature is not built yet.** Say so first, in one line, then explain and collect interest. Do not change any `.cmo` or `.pmo` record.

1. Explain the idea in 4 lines:
   - The technical rollout lives in `pmo` (schedule, go-live milestones); the people side lives in `cmo`.
   - **Readiness gate:** each group's readiness (🟢🟡🔴), barrier point and open gaps go to pmo as a go/no-go input and a people-side risk — proposed through pmo's own approvals.
   - **Milestones → activities:** pmo go-live milestones propose matching Prosci *manage* activities in the cmo plan — through cmo approvals.
   - Each plugin only reads files the other exports; neither writes the other's records, and both keep working alone.
2. Check: does a `.pmo/project.json` exist next to `.cmo/` (same folder or parent)? Say what you found.
3. Ask, one at a time:
   1. Where does your technical rollout plan live today? (pmo plugin · Jira · MS Project · Excel · other)
   2. Would a readiness gate before each go-live change your decisions? (yes / maybe / no — why)
   3. Which direction matters more: readiness → PMO, or milestones → change plan?
4. Append the answers with today's date (project time zone) to `.cmo/drafts/link-pmo-interest.md`:
   ```markdown
   ## <YYYY-MM-DD>
   - .pmo found: yes|no
   - Rollout plan lives in: …
   - Gate would change decisions: …
   - Direction that matters more: …
   ```
5. Thank the user; say the answers decide whether and how the bridge is built, and offer what exists today: `/cmo:status` readiness by group, and the sponsor card (`report --format card`) to bring into a go-live meeting.
