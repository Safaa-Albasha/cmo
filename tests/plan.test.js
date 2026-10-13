'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { analyzePlan } = require('../engine/plan');

const plan = {
  activities: [
    { id: 'A', phase: 'prepare', kotterStep: 1, adkar: ['awareness'], lever: 'sponsorship', status: 'done' },
    { id: 'B', phase: 'prepare', kotterStep: 2, adkar: [], lever: 'sponsorship', status: 'in-progress', due: '2026-03-01', owner: 'COO' },
    { id: 'C', phase: 'manage', kotterStep: 5, adkar: ['knowledge'], lever: 'training', status: 'planned', due: '2026-09-01', groups: ['FIN'] },
    { id: 'D', phase: 'manage', kotterStep: 5, adkar: ['desire'], lever: 'coaching', status: 'done' },
    { id: 'E', phase: 'sustain', kotterStep: 8, adkar: ['reinforcement'], lever: 'reinforcement', status: 'cancelled' },
  ],
};

test('progress by phase, Kotter step, ADKAR and lever', () => {
  const r = analyzePlan(plan, { today: '2026-04-01', barriers: {} });
  assert.deepStrictEqual([r.total, r.done, r.percentDone], [4, 2, 50]);
  assert.deepStrictEqual(r.phases.prepare, { total: 2, done: 1, inProgress: 1, percentDone: 50 });
  assert.strictEqual(r.phases.sustain.percentDone, null);
  assert.deepStrictEqual(r.kotter.map((k) => k.status), ['done', 'in-progress', 'missing', 'missing', 'in-progress', 'missing', 'missing', 'missing']);
  assert.deepStrictEqual(r.adkar.knowledge, { activities: 1, done: 0 });
  assert.strictEqual(r.levers.training, 1);
  assert.deepStrictEqual(r.overdue.map((o) => o.id), ['B']);
});

test('barrier points without open activities become gaps', () => {
  const r = analyzePlan(plan, { today: '2026-04-01', barriers: { FIN: 'knowledge', OPS: 'knowledge', HR: 'desire', IT: null } });
  assert.deepStrictEqual(r.gaps, [
    { group: 'OPS', barrier: 'knowledge', suggestedLevers: ['training', 'governance'] },
    { group: 'HR', barrier: 'desire', suggestedLevers: ['sponsorship', 'coaching'] },
  ]);
});
