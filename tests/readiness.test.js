'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { score, rag } = require('../engine/readiness');
const { compareFields } = require('../engine/compare');

const W = { adkar: 0.5, sentiment: 0.2, adoption: 0.3 };

test('composite readiness re-weights missing parts', () => {
  assert.strictEqual(score({ adkarAverage: 4, net: 20, reach: 60 }, W), 67.5);
  assert.strictEqual(score({ adkarAverage: 4, net: null, reach: null }, W), 75);
  assert.strictEqual(score({ adkarAverage: null, net: null, reach: null }, W), null);
});

test('rag thresholds', () => {
  const th = { green: 70, amber: 50 };
  assert.deepStrictEqual([rag(70, th), rag(69.9, th), rag(49, th), rag(null, th)], ['green', 'amber', 'red', null]);
});

test('compareFields', () => {
  assert.deepStrictEqual(compareFields({ a: 1, b: null }, { a: 3.5, b: 2 }, ['a', 'b', 'c']), {
    a: { before: 1, after: 3.5, delta: 2.5 },
    b: { before: null, after: 2, delta: null },
    c: { before: null, after: null, delta: null },
  });
});
