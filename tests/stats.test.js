'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { tTwoSidedP, tCritical, welch } = require('../engine/stats');
const { round } = require('../engine/util');

test('Student t helpers', () => {
  assert.strictEqual(round(tTwoSidedP(0, 8), 6), 1);
  assert.strictEqual(round(tCritical(8), 3), 2.306);
  assert.strictEqual(round(tCritical(30), 3), 2.042);
  assert.strictEqual(round(tTwoSidedP(2.306, 8), 3), 0.05);
});

test('Welch test against a hand-computed example', () => {
  const w = welch([10, 12, 11, 13, 12], [7, 8, 6, 9, 7]);
  assert.strictEqual(round(w.diff, 4), 4.2);
  assert.strictEqual(round(w.t, 4), 5.8244);
  assert.strictEqual(round(w.df, 4), 8);
  assert.ok(w.p > 0.0002 && w.p < 0.0006, String(w.p));
  assert.deepStrictEqual(w.ci.map((x) => round(x, 2)), [2.54, 5.86]);
});

test('Welch edge cases', () => {
  assert.strictEqual(welch([1], [2, 3]), null);
  const same = welch([5, 5, 5], [5, 5, 5]);
  assert.deepStrictEqual([same.diff, same.p], [0, 1]);
});
