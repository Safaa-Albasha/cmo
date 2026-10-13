'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { analyzeSnapshot, trend } = require('../engine/adoption');

const snap = {
  date: '2026-03-31',
  tools: [
    { tool: 'copilot', groups: [
      { group: 'FIN', licensed: 40, activated: 30, activeWeekly: 20, avgActiveDays: 2, avgFeatures: 3, powerUsers: 4, retained30d: 24 },
      { group: 'LEGAL', licensed: 3, activated: 3, activeWeekly: 3, avgActiveDays: 4, avgFeatures: 5, powerUsers: 2, retained30d: 3 },
    ] },
    { tool: 'claude', groups: [
      { group: 'FIN', licensed: 10, activated: 10, activeWeekly: 5, avgActiveDays: 4, avgFeatures: 1, powerUsers: 3, retained30d: 6 },
    ] },
  ],
};

test('group, tool and overall metrics', () => {
  const a = analyzeSnapshot(snap, { minGroupSize: 5 });
  assert.deepStrictEqual(a.groups.FIN, {
    licensed: 50, activated: 40, activeWeekly: 25, powerUsers: 7,
    activation: 80, reach: 50, retention: 75, powerShare: 14, frequency: 2.4, depth: 2.6, suppressed: false,
  });
  assert.deepStrictEqual(a.groups.LEGAL, { licensed: 3, suppressed: true });
  assert.strictEqual(a.tools.claude.reach, 50);
  assert.strictEqual(a.overall.licensed, 53);
  assert.strictEqual(a.overall.reach, 52.8);
  assert.strictEqual(a.date, '2026-03-31');
});

test('trend over snapshots', () => {
  const t = trend([snap, { date: '2026-04-30', tools: [{ tool: 'copilot', groups: [{ group: 'FIN', licensed: 40, activated: 40, activeWeekly: 30, avgActiveDays: 3, avgFeatures: 3, powerUsers: 10, retained30d: 35 }] }] }]);
  assert.deepStrictEqual(t.map((x) => [x.date, x.reach]), [['2026-03-31', 52.8], ['2026-04-30', 75]]);
});
