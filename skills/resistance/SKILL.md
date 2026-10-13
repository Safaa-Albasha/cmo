---
name: resistance
description: Resistance workspace — detect resistance signals by group from ADKAR, sentiment and usage, show the resistance log, propose entries, interventions and manager guides. Use for "resistance", "who is pushing back", "why adoption is low in a department". المقاومة.
---

# Resistance / المقاومة

Write in `project.language`. Use `cmo:resistance-manager` or follow its instructions, `resistance-management` and `privacy`.

1. `node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" status --dir .cmo` → `resistance` (open/monitoring/resolved, by root cause and group), `people.latest`, `adoption`, `plan.gaps`.
2. Show signals per group: barrier point, net sentiment and dominant negative theme, reach/retention trend, open log entries.
3. For new signals propose log entries (`add` on `resistance.json`); for improved groups propose `update` to monitoring/resolved with the evidence.
4. Interventions → proposed plan activities; offer a manager guide for the group (`manager-coaching`).
5. Group level only — never individuals.
