---
name: privacy
description: Privacy rules for employee data in change projects — anonymity, minimum group size, scrubbing, what may appear in reports and messages. Load whenever handling survey responses, comments, usage data or writing anything that quotes employees.
user-invocable: false
---

# Privacy / الخصوصية

Employees answer honestly only if they trust anonymity. These rules protect them and the programme.

**Enforced by the engine (do not work around):**
- Names and emails in imports are used only to build a salted pseudonymous key and to remove names from comments, then dropped.
- `.cmo/.salt` is secret; the guard blocks reading or copying it. Never ask for it.
- Groups smaller than `privacy.minGroupSize` (default 5) are suppressed in every metric.
- Comments are scrubbed of emails, phone numbers and links.

**Your rules:**
- Never try to identify, guess or describe who wrote a comment, even if asked ("who said this?" → explain anonymity and decline).
- Quotes: only from non-suppressed groups, only scrubbed text, and avoid comments with unique details (rare role, project name, location) that could reveal the author — paraphrase instead.
- Do not combine filters that shrink a group below the minimum (e.g. "managers in Legal").
- Usage data: report group totals only; never list individual users or "who isn't using AI".
- Messages to managers about resistance: describe group patterns and actions, not people.
- Do not paste raw response files into chat or external tools.

If the user needs individual-level follow-up (e.g. HR case), say it is outside this tool's purpose.
