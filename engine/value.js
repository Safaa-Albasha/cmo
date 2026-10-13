'use strict';
const { mean, round, sum } = require('./util');
const { welch } = require('./stats');

const MIN_SAMPLES = 5;

function phaseSide(samples, phase, estimate) {
  const runs = samples.filter((s) => s.phase === phase && Number(s.minutes) > 0);
  if (runs.length) {
    const withErrors = runs.filter((s) => s.errors !== undefined && s.errors !== null);
    return {
      minutes: mean(runs.map((s) => Number(s.minutes))),
      source: 'measured',
      n: runs.length,
      runs: runs.map((s) => Number(s.minutes)),
      errorRate: withErrors.length ? (withErrors.filter((s) => Number(s.errors) > 0).length / withErrors.length) * 100 : estimate ? estimate.errorRate ?? null : null,
    };
  }
  if (estimate && estimate.minutes > 0) return { minutes: estimate.minutes, source: 'estimate', n: 0, runs: [], errorRate: estimate.errorRate ?? null };
  return { minutes: null, source: 'none', n: 0, runs: [], errorRate: null };
}

function analyzeProcess(p, samples = []) {
  const b = phaseSide(samples, 'before', p.baseline);
  const a = phaseSide(samples, 'after', p.after);
  let evidence = { status: 'estimate', nBefore: b.n, nAfter: a.n };
  if (b.n >= MIN_SAMPLES && a.n >= MIN_SAMPLES) {
    const w = welch(b.runs, a.runs);
    evidence = {
      status: w.p < 0.05 ? 'confirmed' : 'inconclusive',
      p: round(w.p, 4),
      t: round(w.t, 3),
      df: round(w.df, 2),
      ci: [round(w.ci[0], 2), round(w.ci[1], 2)],
      nBefore: b.n,
      nAfter: a.n,
    };
  } else if (b.n || a.n) evidence = { status: 'preliminary', nBefore: b.n, nAfter: a.n };

  const saved = b.minutes !== null && a.minutes !== null ? b.minutes - a.minutes : null;
  const hours = saved === null ? null : (saved * (Number(p.frequencyPerMonth) || 0)) / 60;
  return {
    id: p.id,
    name: p.name,
    group: p.group || null,
    frequencyPerMonth: p.frequencyPerMonth,
    hourlyCost: p.hourlyCost,
    before: { minutes: round(b.minutes, 1), source: b.source },
    after: { minutes: round(a.minutes, 1), source: a.source },
    savedMinutes: round(saved, 1),
    improvementPct: saved === null || !b.minutes ? null : round((saved / b.minutes) * 100, 1),
    hoursPerMonth: round(hours, 1),
    valuePerMonth: hours === null ? null : round(hours * (Number(p.hourlyCost) || 0), 2),
    errorRate: { before: round(b.errorRate, 1), after: round(a.errorRate, 1) },
    evidence,
  };
}

function analyze(processesDoc, samplesById, project) {
  const processes = ((processesDoc && processesDoc.processes) || []).map((p) => analyzeProcess(p, (samplesById && samplesById[p.id]) || []));
  const value = sum(processes.map((p) => p.valuePerMonth || 0));
  const hours = sum(processes.map((p) => p.hoursPerMonth || 0));
  const licenseMonthly = sum(((project && project.tools) || []).map((t) => (Number(t.licenses) || 0) * (Number(t.costPerLicensePerMonth) || 0)));
  const inv = (project && project.investment) || {};
  const oneTime = Number(inv.oneTime) || 0;
  const amortizedMonthly = oneTime / (Number(inv.amortizationMonths) || 12);
  const monthlyCost = licenseMonthly + amortizedMonthly;
  const netMonthly = value - licenseMonthly;
  const measured = sum(
    processes.filter((p) => p.before.source === 'measured' && p.after.source === 'measured').map((p) => p.valuePerMonth || 0)
  );
  return {
    processes,
    totals: {
      hoursPerMonth: round(hours, 1),
      valuePerMonth: round(value, 2),
      licenseMonthly: round(licenseMonthly, 2),
      amortizedMonthly: round(amortizedMonthly, 2),
      monthlyCost: round(monthlyCost, 2),
      roiPct: monthlyCost > 0 ? round(((value - monthlyCost) / monthlyCost) * 100, 1) : null,
      netMonthlyBenefit: round(netMonthly, 2),
      paybackMonths: oneTime === 0 ? 0 : netMonthly > 0 ? round(oneTime / netMonthly, 1) : null,
      measuredValueShare: value > 0 ? round((measured / value) * 100, 1) : null,
    },
  };
}

module.exports = { MIN_SAMPLES, analyzeProcess, analyze };
