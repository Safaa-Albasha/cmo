# cmo — AI-adoption Change Management Office / مكتب إدارة التغيير لتبنّي الذكاء الاصطناعي

Claude Code plugin to plan, run and prove AI-adoption change: Prosci 3-phase process with Kotter's 8 steps, ADKAR measurement, sentiment analysis, adoption metrics and business value (before/after, ROI). Arabic & English.

plugin لـ Claude Code لتخطيط تغيير تبنّي الذكاء الاصطناعي وتنفيذه وإثبات أثره.

| Command | |
|---|---|
| `/cmo:new` | create a change project / إنشاء مشروع تغيير |
| `/cmo:assess` | impact, readiness, risk / تقييم التغيير |
| `/cmo:plan` | Prosci × Kotter × ADKAR plan, gaps, overdue / الخطة |
| `/cmo:survey` | baseline & pulse surveys for Microsoft/Google Forms / الاستبيان |
| `/cmo:import` | responses, usage reports, timing samples / الاستيراد |
| `/cmo:pulse` | classify comments, analyse a wave / تحليل الجولة |
| `/cmo:value` | processes, before/after, ROI, evidence / الأثر على العمل |
| `/cmo:resistance` | resistance signals and log / المقاومة |
| `/cmo:status` | readiness, ADKAR, sentiment, adoption, value / الحالة |
| `/cmo:approvals` | decide proposals; decision log / الموافقات |

**Agents / الوكلاء:** cmo-lead · change-strategist · sponsor-coach · survey-designer · sentiment-analyst · adoption-analyst · value-analyst · resistance-manager · enablement-lead · comms-lead · reporter

**Governance & privacy:** controlled records change only through approved proposals (decision log); a hook blocks direct edits and any access to the anonymity salt; groups under 5 people are never reported.

Requires Node.js 18+. Prosci® and ADKAR® are trademarks of Prosci, Inc.; Kotter's 8-Step Process is © Kotter, Inc. This plugin is not affiliated with or endorsed by either; its content is original and inspired by these public frameworks.
