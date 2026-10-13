---
name: value
description: Business value of AI — register processes and baselines, generate the timing form, import samples, and report time saved, value, ROI, payback and statistical evidence before vs after. Use for "ROI", "what did we save", "process before/after", "value report". قيمة الأثر.
---

# Business value / الأثر على العمل

Write in `project.language`. Use `cmo:value-analyst` or follow its instructions and `value-measurement`.

1. ```bash
   node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" value --dir .cmo
   ```
2. No processes → help choose 3–7 (frequent, time-consuming, measurable) and propose them (`add` on `processes.json`) with frequency, hourly cost (ask; mark as assumption) and baseline estimate minutes. Licences/investment missing → propose `set` on `project.json` (`tools`, `investment`).
3. Timing evidence: `timing-form --dir .cmo` → explain Forms setup (same as surveys) → collect ≥ 5 runs before and after per process → `/cmo:import` samples.
4. Report per process: before → after minutes (🟢 measured / 🟡 estimate), saved, %, hours/month, value/month, evidence (✔ confirmed with 95% CI, inconclusive, preliminary, estimate; p < 0.001 shown as "< 0.001"). Totals: hours/month, value/month, monthly cost, ROI %, payback months, measured share.
5. Be explicit: saved time is capacity unless redeployed; show slower processes honestly.
