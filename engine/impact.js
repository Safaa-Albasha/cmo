'use strict';
const { sum, pct } = require('./util');

function analyzeImpact(groupsDoc) {
  const gs = (groupsDoc && groupsDoc.groups) || [];
  const totalHeadcount = sum(gs.map((g) => Number(g.headcount) || 0));
  const byLevel = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const g of gs) if (byLevel[g.impactLevel] !== undefined) byLevel[g.impactLevel] += Number(g.headcount) || 0;
  const counts = {};
  for (const g of gs) for (const a of g.aspects || []) counts[a] = (counts[a] || 0) + 1;
  return {
    totalHeadcount,
    byLevel,
    highImpactShare: pct(byLevel[4] + byLevel[5], totalHeadcount),
    aspects: Object.entries(counts)
      .map(([aspect, groups]) => ({ aspect, groups }))
      .sort((a, b) => b.groups - a.groups || a.aspect.localeCompare(b.aspect)),
    groups: gs
      .map((g) => ({ id: g.id, name: g.name, headcount: g.headcount ?? null, impactLevel: g.impactLevel ?? null, load: (Number(g.impactLevel) || 0) * (Number(g.headcount) || 0), aspects: g.aspects || [] }))
      .sort((a, b) => b.load - a.load),
  };
}

module.exports = { analyzeImpact };
