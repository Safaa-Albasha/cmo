'use strict';
const { mean, round } = require('./util');
const { isSuppressed } = require('./privacy');

const ELEMENTS = ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement'];

function itemMap(bank) {
  const m = {};
  for (const q of (bank && bank.questions) || []) if (q.type === 'likert' && ELEMENTS.includes(q.element)) m[q.id] = q.element;
  return m;
}

function respondentScores(answers, map) {
  const acc = {};
  for (const [qid, el] of Object.entries(map)) {
    const v = answers[qid];
    if (typeof v === 'number' && v >= 1 && v <= 5) (acc[el] = acc[el] || []).push(v);
  }
  return Object.fromEntries(ELEMENTS.map((el) => [el, acc[el] ? mean(acc[el]) : null]));
}

// ADKAR is sequential: the barrier point is the first element below the threshold.
function barrierOf(scores, threshold) {
  for (const el of ELEMENTS) {
    if (scores[el] === null || scores[el] === undefined) return null;
    if (scores[el] < threshold) return el;
  }
  return null;
}

function summarize(rows, threshold) {
  const scores = {};
  for (const el of ELEMENTS) scores[el] = round(mean(rows.map((r) => r.scores[el]).filter((x) => x !== null)), 2);
  const barrierDistribution = {};
  for (const r of rows) {
    const b = barrierOf(r.scores, threshold) || 'none';
    barrierDistribution[b] = (barrierDistribution[b] || 0) + 1;
  }
  const present = ELEMENTS.map((e) => scores[e]).filter((x) => x !== null);
  return { n: rows.length, scores, barrier: barrierOf(scores, threshold), average: round(mean(present), 2), barrierDistribution };
}

function analyzeWave(responses, bank, { threshold = 3, minGroupSize = 5 } = {}) {
  const map = itemMap(bank);
  const rows = responses
    .map((r) => ({ group: r.group, scores: respondentScores(r.answers || {}, map) }))
    .filter((r) => ELEMENTS.some((e) => r.scores[e] !== null));
  const groups = {};
  for (const g of [...new Set(rows.map((r) => r.group))]) {
    const rs = rows.filter((r) => r.group === g);
    groups[g] = isSuppressed(rs.length, minGroupSize) ? { n: rs.length, suppressed: true } : { ...summarize(rs, threshold), suppressed: false };
  }
  return { overall: summarize(rows, threshold), groups };
}

module.exports = { ELEMENTS, itemMap, barrierOf, analyzeWave };
