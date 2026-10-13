'use strict';
const { round } = require('./util');
const { scrub, isSuppressed } = require('./privacy');

function summarize(ls) {
  const n = ls.length;
  const pos = ls.filter((l) => l.sentiment > 0).length;
  const neg = ls.filter((l) => l.sentiment < 0).length;
  const share = (x) => (n ? round((x / n) * 100, 1) : null);
  const themes = {};
  for (const l of ls)
    for (const t of l.themes || []) {
      const x = (themes[t] = themes[t] || { theme: t, count: 0, pos: 0, neg: 0 });
      x.count++;
      if (l.sentiment > 0) x.pos++;
      if (l.sentiment < 0) x.neg++;
    }
  const adkar = {};
  for (const l of ls) if (l.adkar) adkar[l.adkar] = (adkar[l.adkar] || 0) + 1;
  return {
    n,
    positive: share(pos),
    neutral: share(n - pos - neg),
    negative: share(neg),
    net: share(pos - neg),
    themes: Object.values(themes)
      .map((x) => ({ theme: x.theme, count: x.count, share: share(x.count), net: round(((x.pos - x.neg) / x.count) * 100, 1) }))
      .sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme)),
    adkar,
  };
}

function analyzeWave(responses, labelsDoc, { confidence = 0.7, minGroupSize = 5 } = {}) {
  const groupOf = Object.fromEntries(responses.map((r) => [r.key, r.group]));
  const labels = (labelsDoc && labelsDoc.labels) || [];
  const used = [];
  let pendingReview = 0;
  for (const l of labels) {
    if (l.reviewed || (l.confidence ?? 0) >= confidence) used.push({ ...l, group: groupOf[String(l.id).split(':')[0]] ?? null });
    else pendingReview++;
  }
  const groups = {};
  for (const g of [...new Set(responses.map((r) => r.group))]) {
    const respondents = responses.filter((r) => r.group === g).length;
    groups[g] = isSuppressed(respondents, minGroupSize)
      ? { respondents, suppressed: true }
      : { ...summarize(used.filter((l) => l.group === g)), respondents, suppressed: false };
  }
  return { overall: { ...summarize(used), pendingReview, reviewed: labels.filter((l) => l.reviewed).length, total: labels.length }, groups };
}

// Open-ended answers that have no label yet, scrubbed, ready for classification.
function unlabeledComments(responses, bank, labelsDoc) {
  const open = ((bank && bank.questions) || []).filter((q) => q.type === 'open').map((q) => q.id);
  const done = new Set(((labelsDoc && labelsDoc.labels) || []).map((l) => l.id));
  const out = [];
  for (const r of responses)
    for (const q of open) {
      const v = r.answers && r.answers[q];
      if (typeof v === 'string' && v.trim() && !done.has(`${r.key}:${q}`)) out.push({ id: `${r.key}:${q}`, group: r.group, question: q, text: scrub(v.trim()) });
    }
  return out;
}

module.exports = { analyzeWave, unlabeledComments };
