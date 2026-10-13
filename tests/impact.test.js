'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { analyzeImpact } = require('../engine/impact');

test('impact load, levels and aspects', () => {
  const r = analyzeImpact({
    groups: [
      { id: 'A', name: 'a', headcount: 60, impactLevel: 4, aspects: ['processes', 'skills'] },
      { id: 'B', name: 'b', headcount: 40, impactLevel: 2, aspects: ['skills'] },
      { id: 'C', name: 'c', headcount: 100, impactLevel: 5 },
    ],
  });
  assert.strictEqual(r.totalHeadcount, 200);
  assert.deepStrictEqual(r.byLevel, { 1: 0, 2: 40, 3: 0, 4: 60, 5: 100 });
  assert.strictEqual(r.highImpactShare, 80);
  assert.deepStrictEqual(r.aspects, [{ aspect: 'skills', groups: 2 }, { aspect: 'processes', groups: 1 }]);
  assert.deepStrictEqual(r.groups.map((g) => [g.id, g.load]), [['C', 500], ['A', 240], ['B', 80]]);
});
