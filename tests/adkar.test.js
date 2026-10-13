'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { ELEMENTS, analyzeWave, barrierOf } = require('../engine/adkar');

const bank = {
  questions: [
    { id: 'A1', type: 'likert', element: 'awareness' },
    { id: 'A2', type: 'likert', element: 'awareness' },
    { id: 'D1', type: 'likert', element: 'desire' },
    { id: 'K1', type: 'likert', element: 'knowledge' },
    { id: 'AB1', type: 'likert', element: 'ability' },
    { id: 'R1', type: 'likert', element: 'reinforcement' },
    { id: 'T1', type: 'likert', category: 'trust' },
    { id: 'O1', type: 'open' },
  ],
};
const r = (key, group, a) => ({ key, group, answers: { A1: a[0], A2: a[1], D1: a[2], K1: a[3], AB1: a[4], R1: a[5], T1: 1, O1: 'x' } });
const responses = [
  r('k1', 'FIN', [4, 5, 2, 3, 3, 3]),
  r('k2', 'FIN', [4, 3, 2, 4, 2, 2]),
  r('k3', 'FIN', [5, 5, 3, 3, 3, 3]),
  r('k4', 'FIN', [3, 3, 4, 2, 2, 2]),
  r('k5', 'FIN', [4, 4, 3, 3, 3, 4]),
  r('k6', 'IT', [5, 5, 5, 5, 5, 5]),
];

test('barrierOf finds the first element below threshold', () => {
  assert.strictEqual(barrierOf({ awareness: 4, desire: 2.5, knowledge: 2, ability: 3, reinforcement: 3 }, 3), 'desire');
  assert.strictEqual(barrierOf({ awareness: 4, desire: null, knowledge: 3, ability: 3, reinforcement: 3 }, 3), null);
  assert.deepStrictEqual(ELEMENTS, ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement']);
});

test('group scores, barrier point, distribution and suppression', () => {
  const w = analyzeWave(responses, bank, { threshold: 3, minGroupSize: 5 });
  const fin = w.groups.FIN;
  assert.strictEqual(fin.n, 5);
  assert.deepStrictEqual(fin.scores, { awareness: 4, desire: 2.8, knowledge: 3, ability: 2.6, reinforcement: 2.8 });
  assert.strictEqual(fin.barrier, 'desire');
  assert.strictEqual(fin.average, 3.04);
  assert.deepStrictEqual(fin.barrierDistribution, { desire: 2, knowledge: 1, none: 2 });
  assert.deepStrictEqual(w.groups.IT, { n: 1, suppressed: true });
  assert.strictEqual(w.overall.n, 6);
  assert.strictEqual(w.overall.scores.desire, 3.17);
});
