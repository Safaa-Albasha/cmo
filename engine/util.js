'use strict';
const DAY = 86400000;

function parseDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return NaN;
  return Date.parse(s + 'T00:00:00Z');
}

function isDate(s) {
  const t = parseDate(s);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === s;
}

function addDays(s, n) {
  return new Date(parseDate(s) + n * DAY).toISOString().slice(0, 10);
}

function round(n, d = 2) {
  if (n === null || n === undefined || !Number.isFinite(n)) return null;
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / DAY);
}

const sum = (a) => a.reduce((x, y) => x + y, 0);
const mean = (a) => (a.length ? sum(a) / a.length : null);

function variance(a) {
  if (a.length < 2) return null;
  const m = mean(a);
  return sum(a.map((x) => (x - m) ** 2)) / (a.length - 1);
}

const pct = (n, d) => (d > 0 ? round((n / d) * 100, 1) : null);

module.exports = { DAY, parseDate, isDate, addDays, daysBetween, round, sum, mean, variance, pct };
