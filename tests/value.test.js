'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { analyzeProcess, analyze } = require('../engine/value');

const est = { id: 'P1', name: 'JD drafting', group: 'HR', frequencyPerMonth: 30, hourlyCost: 100, baseline: { minutes: 120, errorRate: 10 }, after: { minutes: 40, errorRate: 5 } };

test('estimate-only process', () => {
  const r = analyzeProcess(est, []);
  assert.deepStrictEqual(
    [r.before.minutes, r.before.source, r.after.minutes, r.savedMinutes, r.improvementPct, r.hoursPerMonth, r.valuePerMonth],
    [120, 'estimate', 40, 80, 66.7, 40, 4000]
  );
  assert.deepStrictEqual(r.errorRate, { before: 10, after: 5 });
  assert.deepStrictEqual(r.evidence, { status: 'estimate', nBefore: 0, nAfter: 0 });
});

test('measured process with significant improvement', () => {
  const samples = [10, 12, 11, 13, 12].map((m) => ({ phase: 'before', minutes: m, errors: m > 12 ? 1 : 0 }))
    .concat([7, 8, 6, 9, 7].map((m) => ({ phase: 'after', minutes: m, errors: 0 })));
  const r = analyzeProcess({ ...est, frequencyPerMonth: 600, hourlyCost: 50 }, samples);
  assert.deepStrictEqual([r.before.minutes, r.before.source, r.after.minutes, r.after.source], [11.6, 'measured', 7.4, 'measured']);
  assert.strictEqual(r.hoursPerMonth, 42);
  assert.strictEqual(r.valuePerMonth, 2100);
  assert.strictEqual(r.evidence.status, 'confirmed');
  assert.deepStrictEqual(r.evidence.ci, [2.54, 5.86]);
  assert.deepStrictEqual(r.errorRate, { before: 20, after: 0 });
});

test('few samples are preliminary; missing after has no savings', () => {
  const r = analyzeProcess(est, [{ phase: 'before', minutes: 100 }, { phase: 'before', minutes: 110 }]);
  assert.strictEqual(r.evidence.status, 'preliminary');
  assert.strictEqual(r.before.minutes, 105);
  const n = analyzeProcess({ ...est, after: null }, []);
  assert.strictEqual(n.savedMinutes, null);
  assert.strictEqual(n.after.source, 'none');
});

test('totals, ROI and payback', () => {
  const project = { tools: [{ id: 'copilot', licenses: 10, costPerLicensePerMonth: 100 }], investment: { oneTime: 12000, amortizationMonths: 12 } };
  const v = analyze({ processes: [est] }, {}, project);
  assert.deepStrictEqual(v.totals, {
    hoursPerMonth: 40, valuePerMonth: 4000, licenseMonthly: 1000, amortizedMonthly: 1000, monthlyCost: 2000,
    roiPct: 100, netMonthlyBenefit: 3000, paybackMonths: 4, measuredValueShare: 0,
  });
});
