'use strict';
// Plan analytics: Prosci phases × Kotter steps × ADKAR targets, overdue work, and gaps between
// survey barrier points and open activities.
const { ELEMENTS } = require('./adkar');
const { round } = require('./util');

const PHASES = ['prepare', 'manage', 'sustain'];
const LEVERS = ['sponsorship', 'communications', 'training', 'coaching', 'resistance', 'reinforcement', 'assessment', 'governance'];
const STATUSES = ['planned', 'in-progress', 'done', 'cancelled'];
const SUGGEST = {
  awareness: ['sponsorship', 'communications'],
  desire: ['sponsorship', 'coaching'],
  knowledge: ['training', 'governance'],
  ability: ['coaching', 'training'],
  reinforcement: ['reinforcement'],
};

const share = (done, total) => (total ? round((done / total) * 100, 1) : null);
const isDone = (a) => a.status === 'done';

function analyzePlan(planDoc, { today, barriers = {} } = {}) {
  const acts = ((planDoc && planDoc.activities) || []).filter((a) => a.status !== 'cancelled');
  const phases = Object.fromEntries(
    PHASES.map((p) => {
      const l = acts.filter((a) => a.phase === p);
      const d = l.filter(isDone).length;
      return [p, { total: l.length, done: d, inProgress: l.filter((a) => a.status === 'in-progress').length, percentDone: share(d, l.length) }];
    })
  );
  const kotter = [1, 2, 3, 4, 5, 6, 7, 8].map((step) => {
    const l = acts.filter((a) => a.kotterStep === step);
    const d = l.filter(isDone).length;
    const ip = l.filter((a) => a.status === 'in-progress').length;
    return { step, activities: l.length, done: d, status: !l.length ? 'missing' : d === l.length ? 'done' : d || ip ? 'in-progress' : 'planned' };
  });
  const adkar = Object.fromEntries(
    ELEMENTS.map((e) => {
      const l = acts.filter((a) => (a.adkar || []).includes(e));
      return [e, { activities: l.length, done: l.filter(isDone).length }];
    })
  );
  const levers = Object.fromEntries(LEVERS.map((lv) => [lv, acts.filter((a) => a.lever === lv).length]));
  const overdue = today
    ? acts.filter((a) => a.due && a.due < today && !isDone(a)).map((a) => ({ id: a.id, title: a.title || null, due: a.due, owner: a.owner || null, status: a.status }))
    : [];
  const gaps = [];
  for (const [group, barrier] of Object.entries(barriers)) {
    if (!barrier) continue;
    const open = acts.filter((a) => !isDone(a) && (a.adkar || []).includes(barrier) && (!a.groups || !a.groups.length || a.groups.includes(group)));
    if (!open.length) gaps.push({ group, barrier, suggestedLevers: SUGGEST[barrier] });
  }
  const done = acts.filter(isDone).length;
  return { total: acts.length, done, percentDone: share(done, acts.length), phases, kotter, adkar, levers, overdue, gaps };
}

module.exports = { PHASES, LEVERS, STATUSES, analyzePlan };
