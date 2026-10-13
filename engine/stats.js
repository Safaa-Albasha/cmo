'use strict';
const { mean, variance } = require('./util');

// log Gamma (Lanczos approximation, Numerical Recipes).
function lgamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const ci of c) ser += ci / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

// Continued fraction for the incomplete beta function.
function betacf(a, b, x) {
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-14) break;
  }
  return h;
}

// Regularized incomplete beta I_x(a, b).
function ibeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

// Two-sided p-value of Student's t with df degrees of freedom.
function tTwoSidedP(t, df) {
  return ibeta(df / (df + t * t), df / 2, 0.5);
}

// Critical t for a two-sided confidence level (bisection).
function tCritical(df, conf = 0.95) {
  const alpha = 1 - conf;
  let lo = 0;
  let hi = 1000;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (tTwoSidedP(mid, df) > alpha) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// Welch's unequal-variance t-test; diff = mean(before) − mean(after).
function welch(before, after) {
  if (before.length < 2 || after.length < 2) return null;
  const s1 = variance(before) / before.length;
  const s2 = variance(after) / after.length;
  const se = Math.sqrt(s1 + s2);
  const diff = mean(before) - mean(after);
  if (se === 0) return { diff, t: null, df: null, p: diff === 0 ? 1 : 0, ci: [diff, diff] };
  const t = diff / se;
  const df = (s1 + s2) ** 2 / (s1 ** 2 / (before.length - 1) + s2 ** 2 / (after.length - 1));
  const tc = tCritical(df);
  return { diff, t, df, p: tTwoSidedP(t, df), ci: [diff - tc * se, diff + tc * se] };
}

module.exports = { ibeta, tTwoSidedP, tCritical, welch };
