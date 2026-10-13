'use strict';
const { round, sum } = require('./util');

// 0–100 composite; weights are re-normalised over the parts that have data.
function score({ adkarAverage, net, reach }, weights) {
  const parts = [];
  if (adkarAverage !== null && adkarAverage !== undefined) parts.push([weights.adkar, ((adkarAverage - 1) / 4) * 100]);
  if (net !== null && net !== undefined) parts.push([weights.sentiment, (net + 100) / 2]);
  if (reach !== null && reach !== undefined) parts.push([weights.adoption, reach]);
  const w = sum(parts.map((p) => p[0]));
  return w ? round(sum(parts.map(([a, b]) => a * b)) / w, 1) : null;
}

function rag(v, th) {
  if (v === null || v === undefined) return null;
  return v >= th.green ? 'green' : v >= th.amber ? 'amber' : 'red';
}

module.exports = { score, rag };
