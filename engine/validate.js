'use strict';
const { isDate, parseDate } = require('./util');
const { format } = require('./i18n');
const { ELEMENTS } = require('./adkar');
const { PHASES: PLAN_PHASES, LEVERS, STATUSES } = require('./plan');
const RESISTANCE_STATUS = ['open', 'monitoring', 'resolved'];

const TYPES = ['ai-adoption', 'generic'];
const LANGS = ['ar', 'en'];
const WAVE_TYPES = ['baseline', 'pulse'];
const PHASES = ['before', 'after'];
const isNum = (v, min = -Infinity, max = Infinity) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const BIG = Number.MAX_SAFE_INTEGER;

function validate(data) {
  const errors = [];
  const warnings = [];
  const push = (list) => (code, params) => list.push({ code, path: params.file || null, message: format(code, params) });
  const err = push(errors);
  const warn = push(warnings);
  const range = (file, field, v, min, max) => {
    if (v !== undefined && v !== null && !isNum(v, min, max)) err('NUMBER_RANGE', { file, field, min, max });
  };
  const dupes = (file, list) => {
    const seen = new Set();
    for (const x of list) {
      if (seen.has(x.id)) err('ID_DUPLICATE', { file, id: x.id });
      seen.add(x.id);
    }
  };

  const p = data.project || {};
  const F = 'project.json';
  for (const f of ['name', 'type', 'language', 'currency', 'startDate', 'endDate'])
    if (p[f] === undefined || p[f] === '') err('FIELD_REQUIRED', { file: F, field: f });
  if (p.type && !TYPES.includes(p.type)) err('ENUM_INVALID', { file: F, field: 'type', allowed: TYPES.join(', ') });
  if (p.language && !LANGS.includes(p.language)) err('ENUM_INVALID', { file: F, field: 'language', allowed: LANGS.join(', ') });
  if (p.currency !== undefined && p.currency !== '' && (typeof p.currency !== 'string' || p.currency.trim().length > 20))
    err('CURRENCY_INVALID', { file: F });
  for (const f of ['startDate', 'endDate']) if (p[f] && !isDate(p[f])) err('DATE_INVALID', { file: F, field: f });
  if (isDate(p.startDate) && isDate(p.endDate) && parseDate(p.startDate) > parseDate(p.endDate))
    err('DATE_ORDER', { file: F, start: 'startDate', end: 'endDate' });
  range(F, 'privacy.minGroupSize', p.privacy && p.privacy.minGroupSize, 3, 1000);
  for (const t of p.tools || []) {
    range(F, `tools.${t.id}.licenses`, t.licenses, 0, BIG);
    range(F, `tools.${t.id}.costPerLicensePerMonth`, t.costPerLicensePerMonth, 0, BIG);
  }

  const groups = (data.groups && data.groups.groups) || [];
  dupes('groups.json', groups);
  for (const g of groups) {
    range('groups.json', `${g.id}.headcount`, g.headcount, 0, BIG);
    range('groups.json', `${g.id}.impactLevel`, g.impactLevel, 1, 5);
  }
  const groupIds = new Set(groups.map((g) => g.id));
  const questions = new Map(((data.bank && data.bank.questions) || []).map((q) => [q.id, q]));

  for (const w of data.waves || []) {
    const WF = `surveys/${w.id}`;
    if (!WAVE_TYPES.includes(w.meta.type)) err('ENUM_INVALID', { file: `${WF}/meta.json`, field: 'type', allowed: WAVE_TYPES.join(', ') });
    if (!isDate(w.meta.date)) err('DATE_INVALID', { file: `${WF}/meta.json`, field: 'date' });
    const unknownGroups = new Set();
    for (const r of w.responses) {
      if (groups.length && !groupIds.has(r.group)) unknownGroups.add(r.group);
      for (const [qid, v] of Object.entries(r.answers || {})) {
        const q = questions.get(qid);
        if (!q) {
          if (questions.size) warn('UNKNOWN_QUESTION', { file: `${WF}/responses.json`, id: qid });
          continue;
        }
        if (q.type === 'likert' && v !== null && v !== '') range(`${WF}/responses.json`, `${r.key}.${qid}`, v, 1, 5);
      }
    }
    for (const g of unknownGroups) warn('UNKNOWN_GROUP', { file: `${WF}/responses.json`, group: g });
    for (const l of (w.labels && w.labels.labels) || []) {
      if (![-1, 0, 1].includes(l.sentiment)) err('ENUM_INVALID', { file: `${WF}/sentiment.json`, field: `${l.id}.sentiment`, allowed: '-1, 0, 1' });
      range(`${WF}/sentiment.json`, `${l.id}.confidence`, l.confidence, 0, 1);
    }
  }

  for (const u of data.usage || []) {
    for (const t of u.tools || [])
      for (const g of t.groups || []) {
        for (const k of ['licensed', 'activated', 'activeWeekly', 'powerUsers', 'retained30d'])
          range(u.file, `${g.group}.${t.tool}.${k}`, g[k], 0, BIG);
        range(u.file, `${g.group}.${t.tool}.avgActiveDays`, g.avgActiveDays, 0, 7);
        const pairs = [['activated', 'licensed'], ['activeWeekly', 'activated'], ['powerUsers', 'activeWeekly']];
        for (const [a, b] of pairs)
          if (isNum(g[a]) && isNum(g[b]) && g[a] > g[b]) warn('USAGE_INCONSISTENT', { file: u.file, group: g.group, tool: t.tool, a, av: g[a], b, bv: g[b] });
      }
  }

  const procs = (data.processes && data.processes.processes) || [];
  dupes('processes.json', procs);
  for (const pr of procs) {
    range('processes.json', `${pr.id}.frequencyPerMonth`, pr.frequencyPerMonth, 0, BIG);
    range('processes.json', `${pr.id}.hourlyCost`, pr.hourlyCost, 0, BIG);
    range('processes.json', `${pr.id}.baseline.minutes`, pr.baseline && pr.baseline.minutes, 0, BIG);
    range('processes.json', `${pr.id}.after.minutes`, pr.after && pr.after.minutes, 0, BIG);
  }
  for (const [id, list] of Object.entries(data.samples || {}))
    for (const s of list) {
      if (!PHASES.includes(s.phase)) err('ENUM_INVALID', { file: `samples/${id}.json`, field: 'phase', allowed: PHASES.join(', ') });
      range(`samples/${id}.json`, 'minutes', s.minutes, 0, BIG);
    }

  for (const g of groups) if (g.aspects !== undefined && !Array.isArray(g.aspects)) err('ENUM_INVALID', { file: 'groups.json', field: `${g.id}.aspects`, allowed: 'array' });

  const acts = (data.plan && data.plan.activities) || [];
  dupes('plan.json', acts);
  for (const a of acts) {
    const P = 'plan.json';
    if (!PLAN_PHASES.includes(a.phase)) err('ENUM_INVALID', { file: P, field: `${a.id}.phase`, allowed: PLAN_PHASES.join(', ') });
    if (a.kotterStep !== null && a.kotterStep !== undefined) range(P, `${a.id}.kotterStep`, a.kotterStep, 1, 8);
    if ((a.adkar || []).some((e) => !ELEMENTS.includes(e))) err('ENUM_INVALID', { file: P, field: `${a.id}.adkar`, allowed: ELEMENTS.join(', ') });
    if (a.lever && !LEVERS.includes(a.lever)) err('ENUM_INVALID', { file: P, field: `${a.id}.lever`, allowed: LEVERS.join(', ') });
    if (a.status && !STATUSES.includes(a.status)) err('ENUM_INVALID', { file: P, field: `${a.id}.status`, allowed: STATUSES.join(', ') });
    for (const f of ['start', 'due']) if (a[f] && !isDate(a[f])) err('DATE_INVALID', { file: P, field: `${a.id}.${f}` });
    for (const g of a.groups || []) if (groups.length && !groupIds.has(g)) warn('UNKNOWN_GROUP', { file: P, group: g });
  }

  const entries = (data.resistance && data.resistance.entries) || [];
  dupes('resistance.json', entries);
  for (const e of entries) {
    if (e.rootCause && !ELEMENTS.includes(e.rootCause)) err('ENUM_INVALID', { file: 'resistance.json', field: `${e.id}.rootCause`, allowed: ELEMENTS.join(', ') });
    if (e.status && !RESISTANCE_STATUS.includes(e.status)) err('ENUM_INVALID', { file: 'resistance.json', field: `${e.id}.status`, allowed: RESISTANCE_STATUS.join(', ') });
    if (e.group && groups.length && !groupIds.has(e.group)) warn('UNKNOWN_GROUP', { file: 'resistance.json', group: e.group });
  }
  for (const k of ['coalition', 'champions']) dupes('sponsors.json', (data.sponsors && data.sponsors[k]) || []);

  return { ok: errors.length === 0, errors, warnings };
}

module.exports = { validate };
