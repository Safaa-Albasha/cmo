'use strict';
const { round } = require('./util');

function compareFields(before, after, fields) {
  const out = {};
  for (const f of fields) {
    const b = before && before[f] !== undefined ? before[f] : null;
    const a = after && after[f] !== undefined ? after[f] : null;
    out[f] = { before: b, after: a, delta: b === null || a === null ? null : round(a - b, 2) };
  }
  return out;
}

module.exports = { compareFields };
