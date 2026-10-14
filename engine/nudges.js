'use strict';
// What is due now: overdue survey waves, stale usage data, pending approvals and comments, overdue plan work, uncovered barrier points.
// Read-only; "today" is the calendar date in the project's time zone.
const approvals = require('./approvals');
const util = require('./util');
const { status, settings } = require('./status');

const CADENCE = { pulseDays: 60, usageDays: 35 };

function cadence(project) {
  return { ...CADENCE, ...(project.cadence || {}) };
}

// Arabic counting: 1 → "<one>", 2 → "<two>", 3–10 → "n <plural>", 11+ → "n <accusative singular>".
const ar = (n, [one, two, plural, acc]) => (n === 1 ? one : n === 2 ? two : `${n} ${n <= 10 ? plural : acc}`);
const en = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const DAYS = ['يوم واحد', 'يومين', 'أيام', 'يومًا'];

const TEXT = {
  'baseline-missing': () => ({ ar: 'لا يوجد استبيان أساسي بعد ← /cmo:survey', en: 'no baseline survey yet → /cmo:survey' }),
  'pulse-due': (x) => ({ ar: `آخر استبيان قبل ${ar(x.days, DAYS)} ← /cmo:survey`, en: `last survey was ${en(x.days, 'day', 'days')} ago → /cmo:survey` }),
  'usage-missing': () => ({ ar: 'لا توجد بيانات استخدام بعد ← /cmo:import', en: 'no usage data yet → /cmo:import' }),
  'usage-stale': (x) => ({ ar: `عمر بيانات الاستخدام ${ar(x.days, DAYS)} ← /cmo:import`, en: `usage data is ${en(x.days, 'day', 'days')} old → /cmo:import` }),
  'comments-pending': (x) => ({
    ar: `${ar(x.count, ['تعليق واحد', 'تعليقان', 'تعليقات', 'تعليقًا'])} بانتظار التصنيف أو المراجعة ← /cmo:pulse`,
    en: `${en(x.count, 'comment', 'comments')} to classify or review → /cmo:pulse`,
  }),
  approvals: (x) => ({
    ar: `${ar(x.count, ['موافقة واحدة', 'موافقتان', 'موافقات', 'موافقة'])} بانتظارك ← /cmo:approvals`,
    en: `${en(x.count, 'approval', 'approvals')} waiting → /cmo:approvals`,
  }),
  'plan-overdue': (x) => ({
    ar: `أنشطة متأخرة في الخطة: ${x.count} ← /cmo:plan`,
    en: `${en(x.count, 'plan activity', 'plan activities')} overdue → /cmo:plan`,
  }),
  'barrier-gaps': (x) => ({
    ar: `${ar(x.count, ['مجموعة واحدة', 'مجموعتان', 'مجموعات', 'مجموعة'])} عندها نقطة عائق بلا نشاط ← /cmo:plan`,
    en: `${en(x.count, 'group has', 'groups have')} a barrier point with no open activity → /cmo:plan`,
  }),
};

function nudges(dir, data, { today } = {}) {
  const p = data.project;
  const tz = settings(p).timezone;
  const day = today || util.today(tz);
  const c = cadence(p);
  const started = !p.startDate || day >= p.startDate;
  const st = status(data, { today: day });
  const items = [];
  const add = (type, extra = {}) => items.push({ type, ...extra, ...TEXT[type](extra) });

  const waves = st.waves.list;
  if (!waves.length) {
    if (started) add('baseline-missing');
  } else {
    const days = util.daysBetween(waves[waves.length - 1].date, day);
    if (days > c.pulseDays) add('pulse-due', { days, wave: waves[waves.length - 1].id });
  }

  const usage = data.usage || [];
  if (usage.length) {
    const days = util.daysBetween(usage[usage.length - 1].date, day);
    if (days > c.usageDays) add('usage-stale', { days, date: usage[usage.length - 1].date });
  } else if ((p.tools || []).length && p.startDate && util.daysBetween(p.startDate, day) > c.usageDays) add('usage-missing');

  const comments = st.pending ? (st.pending.unlabeled || 0) + (st.pending.pendingReview || 0) : 0;
  if (comments) add('comments-pending', { count: comments });

  const pendingApprovals = approvals.list(dir).length;
  if (pendingApprovals) add('approvals', { count: pendingApprovals });

  if (st.plan && st.plan.overdue.length) add('plan-overdue', { count: st.plan.overdue.length });
  if (st.plan && st.plan.gaps.length) add('barrier-gaps', { count: st.plan.gaps.length });

  const line = items.length
    ? { ar: `CMO · ${items.map((x) => x.ar).join(' · ')}`, en: `CMO · ${items.map((x) => x.en).join(' · ')}` }
    : null;
  return { today: day, timezone: tz, cadence: c, items, line };
}

module.exports = { CADENCE, cadence, nudges, ar };
