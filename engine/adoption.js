'use strict';
const { sum, pct, round } = require('./util');
const { isSuppressed } = require('./privacy');

function aggregate(rows) {
  const s = (k) => sum(rows.map((r) => Number(r[k]) || 0));
  const licensed = s('licensed');
  const activated = s('activated');
  const activeWeekly = s('activeWeekly');
  const powerUsers = s('powerUsers');
  // Weighted by weekly active users; rows without the value are left out, never counted as zero.
  const wavg = (k) => {
    const rs = rows.filter((r) => r[k] !== null && r[k] !== undefined && Number(r.activeWeekly) > 0);
    const w = sum(rs.map((r) => Number(r.activeWeekly)));
    return w ? sum(rs.map((r) => Number(r[k]) * Number(r.activeWeekly))) / w : null;
  };
  return {
    licensed,
    activated,
    activeWeekly,
    powerUsers,
    activation: pct(activated, licensed),
    reach: pct(activeWeekly, licensed),
    retention: pct(s('retained30d'), activated),
    powerShare: pct(powerUsers, licensed),
    frequency: round(wavg('avgActiveDays'), 2),
    depth: round(wavg('avgFeatures'), 2),
  };
}

function analyzeSnapshot(snap, { minGroupSize = 5 } = {}) {
  const rows = [];
  const tools = {};
  for (const t of snap.tools || []) {
    tools[t.tool] = aggregate(t.groups || []);
    for (const g of t.groups || []) rows.push(g);
  }
  const groups = {};
  for (const id of [...new Set(rows.map((r) => r.group))]) {
    const a = aggregate(rows.filter((r) => r.group === id));
    groups[id] = isSuppressed(a.licensed, minGroupSize) ? { licensed: a.licensed, suppressed: true } : { ...a, suppressed: false };
  }
  return { date: snap.date || null, overall: aggregate(rows), tools, groups };
}

function trend(snaps) {
  return snaps.map((s) => {
    const o = analyzeSnapshot(s).overall;
    return { date: s.date || null, reach: o.reach, activation: o.activation, frequency: o.frequency, retention: o.retention };
  });
}

module.exports = { analyzeSnapshot, trend };
