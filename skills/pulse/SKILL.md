---
name: pulse
description: Analyse a survey wave end to end — classify open comments (sentiment, themes, ADKAR stage), let the change manager review low-confidence ones, then report ADKAR barrier points, sentiment, adoption link and resistance signals with recommended actions and baseline comparison. Use after importing a wave: "analyse the survey", "pulse results", "what are people saying". تحليل الجولة.
---

# Pulse analysis / تحليل الجولة

Write in `project.language`. Default wave: latest (`--wave latest`).

## 1. Classify comments (Claude labels, engine counts)
Loop until `total` is 0:

```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" comments --dir .cmo --wave <wave> --limit 50
```

For each item decide:
- `sentiment`: 1 positive / 0 neutral or mixed / −1 negative about the AI change.
- `themes`: 1–3 ids from `themes` (job-security, trust, privacy, skills-gap, workload, manager-support, policy-clarity, governance, productivity, tool-quality). Use only listed ids.
- `adkar`: the stage the comment reveals, or null — not knowing *why* → awareness; *not wanting* / fear / no benefit → desire; *not knowing how* / unclear rules → knowledge; *can't do it* / no time / tool fails → ability; *no recognition* / old habits return → reinforcement.
- `confidence` 0–1: lower for sarcasm, mixed language, very short or ambiguous text (< 0.7 goes to the manager for review).

Write a batch to `.cmo/drafts/labels-<wave>-<n>.json` as `[{ "id", "sentiment", "themes", "adkar", "confidence" }]` and load it:

```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" label --dir .cmo --wave <wave> --file .cmo/drafts/labels-<wave>-<n>.json
```

Comments are already scrubbed of emails/phones/links; never try to identify a person.

## 2. Manager review
```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" review --dir .cmo --wave <wave>
```
Show up to 10 items at a time (text, your label). The manager confirms or corrects; save corrections with `label … --reviewed` (confirmed items too, so they leave the queue).

## 3. Analysis
```bash
node "${CLAUDE_PLUGIN_ROOT}/engine/cli.js" status --dir .cmo --wave <wave>
```
Report (numbers only from output):
- ADKAR per group: scores, **barrier point**, change vs baseline (`compare.people`). Interpret sequentially: fix the first weak stage before later ones.
- Sentiment: net, % negative, top themes with net per group; 2–3 representative scrubbed quotes from the review/queue texts (never from groups shown as suppressed).
- Adoption link: groups with low desire and low reach; groups with high desire but low ability (enablement gap).
- **Resistance signals:** groups where barrier is desire/awareness and net sentiment < 0, or reach fell since the previous snapshot.
- **Recommended actions** per barrier: awareness → sponsor/leader messages on *why*; desire → personal benefit stories, address fears (job security) openly, champions; knowledge → role-based training, clear AI policy, prompt library; ability → hands-on workshops, time allocation, office hours; reinforcement → recognition, KPIs, manager follow-up.
- Pending items: unlabeled/pending review counts.

Suppressed groups (< minimum size) are never reported individually.
