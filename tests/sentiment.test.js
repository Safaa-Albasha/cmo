'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { analyzeWave, unlabeledComments } = require('../engine/sentiment');

const bank = { questions: [{ id: 'O1', type: 'open' }, { id: 'O2', type: 'open' }, { id: 'A1', type: 'likert', element: 'awareness' }] };
const keys = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6'];
const responses = keys.map((k, i) => ({ key: k, group: i < 5 ? 'FIN' : 'IT', answers: { A1: 3, O1: `comment ${k} mail ${k}@x.com`, O2: i === 0 ? 'second' : '' } }));
const labels = {
  labels: [
    { id: 'k1:O1', sentiment: -1, themes: ['job-security'], adkar: 'desire', confidence: 0.9 },
    { id: 'k2:O1', sentiment: -1, themes: ['job-security', 'skills-gap'], adkar: 'desire', confidence: 0.8 },
    { id: 'k3:O1', sentiment: 1, themes: ['productivity'], adkar: null, confidence: 0.95 },
    { id: 'k4:O1', sentiment: 0, themes: ['skills-gap'], adkar: 'knowledge', confidence: 0.75 },
    { id: 'k5:O1', sentiment: 1, themes: ['productivity'], adkar: null, confidence: 0.5 },
    { id: 'k6:O1', sentiment: -1, themes: ['trust'], adkar: 'ability', confidence: 0.4, reviewed: true },
  ],
};

test('aggregation with confidence filter and review', () => {
  const s = analyzeWave(responses, labels, { confidence: 0.7, minGroupSize: 5 });
  assert.deepStrictEqual(
    [s.overall.n, s.overall.positive, s.overall.neutral, s.overall.negative, s.overall.net],
    [5, 20, 20, 60, -40]
  );
  assert.deepStrictEqual([s.overall.pendingReview, s.overall.reviewed, s.overall.total], [1, 1, 6]);
  assert.deepStrictEqual(s.overall.themes[0], { theme: 'job-security', count: 2, share: 40, net: -100 });
  assert.deepStrictEqual(s.overall.themes.map((t) => t.theme), ['job-security', 'skills-gap', 'productivity', 'trust']);
  assert.deepStrictEqual(s.overall.adkar, { desire: 2, knowledge: 1, ability: 1 });
  assert.strictEqual(s.groups.FIN.n, 4);
  assert.strictEqual(s.groups.FIN.net, -25);
  assert.deepStrictEqual(s.groups.IT, { respondents: 1, suppressed: true });
});

test('unlabeled comments are listed scrubbed', () => {
  const u = unlabeledComments(responses, bank, labels);
  assert.deepStrictEqual(u, [{ id: 'k1:O2', group: 'FIN', question: 'O2', text: 'second' }]);
  const all = unlabeledComments(responses, bank, null);
  assert.strictEqual(all.length, 7);
  assert.strictEqual(all[0].text, 'comment k1 mail [email]');
});
