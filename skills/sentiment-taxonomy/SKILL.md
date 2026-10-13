---
name: sentiment-taxonomy
description: Definitions and examples for classifying change comments — sentiment, the AI-adoption theme set, ADKAR stage and confidence calibration (Arabic, English, dialects). Use when labelling comments in /cmo:pulse or reviewing labels.
user-invocable: false
---

# Sentiment taxonomy / تصنيف التعليقات

## Sentiment (toward the AI change)
- **1 positive:** benefit, enthusiasm, support ("وفرت ساعات", "love it").
- **0 neutral/mixed:** requests, suggestions, balanced views ("أحتاج أمثلة", "good but slow").
- **−1 negative:** fear, frustration, rejection, distrust.
A request phrased as a complaint ("why is there no training?!") is −1; a calm request is 0.

## Themes (ids)
| id | Arabic | Includes |
|---|---|---|
| job-security | الخوف على الوظيفة | replacement fears, role changes |
| trust | الثقة بالدقة | errors, hallucinations, verification burden |
| privacy | خصوصية البيانات | customer/sensitive data, confidentiality |
| skills-gap | نقص المهارات | don't know how, need training/examples |
| workload | ضغط العمل والوقت | no time to learn, saved time filled with more work |
| manager-support | دعم المدير | manager attitude, encouragement or lack of it |
| policy-clarity | وضوح الاستخدام المسموح | what's allowed, rules unclear |
| governance | الحوكمة والمخاطر | compliance, risk, approvals |
| productivity | الإنتاجية والفائدة | time saved, better output |
| tool-quality | جودة الأداة وسهولتها | usability, access, performance, language support |
Use 1–3 themes; only listed ids.

## ADKAR stage (or null)
awareness: "why are we doing this" · desire: fear, unwillingness, no benefit · knowledge: how-to, rules unclear · ability: can't apply, no time, tool issues · reinforcement: no recognition, reverting, manager indifference. Pure praise → null.

## Confidence
0.9+ clear single meaning · 0.7–0.9 clear but short or slightly mixed · < 0.7 sarcasm, mixed languages with contradicting parts, very short ("ok"), unclear referent → goes to the change manager for review.

Never infer identity, gender, age or department beyond the group already attached.
