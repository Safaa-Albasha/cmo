---
name: approval-protocol
description: Shared rules for every CMO agent — engine commands, what an agent may do alone, what needs the change manager's approval, and how to submit proposals. Load before changing any change-project record.
user-invocable: false
---

# Approval protocol / بروتوكول الموافقات

## Engine
```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" <command> --dir .cmo [options]
```
If `${CLAUDE_PLUGIN_ROOT}` is not expanded, find the engine with Glob `**/cmo/engine/cli.js` under `~/.claude/plugins/`.

Read: `validate` · `status [--wave]` · `adkar --wave` · `sentiment --wave` · `adoption` · `value` · `plan [--today]` · `impact` · `approvals [--status]` · `decisions`
Survey/import: `wave` · `survey` · `timing-form` · `import --type responses|usage|samples` · `comments` · `label` · `review`
Governance: `propose --json '<json>' | --file <path>` · `apply` (change manager only, via `/cmo:approvals`)

Errors return `{"error":{"code","message_ar","message_en","details"}}` — relay in the project language.

## Autonomy
| Level | Examples |
|---|---|
| 🟢 automatic | compute, analyse, draft (`.cmo/drafts/`), reports (`.cmo/reports/`), create waves and survey files, import data (after preview confirmation), classify comments |
| 🟡 approval | plan activities, impacted groups, sponsors/coalition/champions, process register & baselines, resistance log, project settings (currency, weights, thresholds, tools, investment), sending any message or writing to external tools |
| 🔴 never | delete records, identify or guess who wrote a comment, read `.cmo/.salt`, report groups below the minimum size, invent numbers |

Controlled files (guard blocks direct edits): `project.json`, `groups.json`, `plan.json`, `sponsors.json`, `processes.json`, `resistance.json`, `approvals.json`, `decisions.json`.

## Proposal
```json
{
  "agent": "change-strategist",
  "title": "إضافة جلسات سفراء لقسم المالية",
  "rationale": "نقطة العائق في المالية عند الرغبة (2.4) وأبرز محور الخوف على الوظيفة",
  "impact": "يستهدف عنصر الرغبة لـ 60 موظفًا؛ لا تكلفة إضافية",
  "operation": { "op": "add", "file": "plan.json", "item": { "id": "M08", "phase": "manage", "kotterStep": 5, "adkar": ["desire"], "lever": "coaching", "groups": ["FIN"], "status": "planned", "owner": "Finance champion", "start": "2026-11-01", "due": "2026-11-30", "title": { "ar": "جلسات سفراء للمالية", "en": "Champion sessions for Finance" } } }
}
```

| op | fields | for |
|---|---|---|
| `add` | `file`, `item` (unique `id`), optional `collection` | activity (`plan.json`), group (`groups.json`), process (`processes.json`), resistance entry (`resistance.json`), coalition member / champion (`sponsors.json`, `collection: "coalition"|"champions"`) |
| `update` | `file`, `id`, `changes`, optional `collection` | status/dates/owner of activities, re-score a group, close a resistance entry, change a process baseline |
| `set` | `file` (`project.json` or `sponsors.json`), `path`, `value` | currency, tools, investment, thresholds, weights, sponsor |

Activity fields: `phase` prepare|manage|sustain · `kotterStep` 1–8 or null · `adkar` [elements] · `lever` sponsorship|communications|training|coaching|resistance|reinforcement|assessment|governance · `status` planned|in-progress|done|cancelled · `groups` [ids] (empty = all) · `start`/`due` dates · `owner` · `title {ar,en}`.

Quote JSON safely: write it to `.cmo/drafts/proposal-<name>.json` and use `propose --file`. One decision per proposal; title/rationale/impact in the project language. Tell the user the APR ids → `/cmo:approvals`.
