'use strict';
// Interactive change report: engine numbers + optional agent narrative embedded in templates/report.html.
const fs = require('fs');
const path = require('path');
const { CmoError, loadProject, readJson } = require('./io');
const { validate } = require('./validate');
const { status, settings, waveMetrics } = require('./status');
const util = require('./util');
const value = require('./value');
const { scrub } = require('./privacy');

const TEMPLATE = path.join(__dirname, '..', 'templates', 'report.html');
const UI_STRINGS = path.join(__dirname, '..', 'templates', 'report-i18n.json');
// Engine functions reused by the report's what-if controls (one formula for both).
const EMBED = [util.round, value.whatIf].map((f) => f.toString()).join('\n');

function bilingual(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return { ar: v, en: v };
  return { ar: v.ar ?? v.en ?? '', en: v.en ?? v.ar ?? '' };
}

function normalizeNarrative(n) {
  if (!n) return null;
  const list = (x) => (Array.isArray(x) ? x : []).map(bilingual);
  return {
    summary: bilingual(n.summary),
    highlights: list(n.highlights),
    recommendations: list(n.recommendations),
    decisions: list(n.decisions),
    // Quotes come from the agent; scrub again as a safety net.
    quotes: list(n.quotes).map((q) => ({ ar: scrub(q.ar), en: scrub(q.en) })),
  };
}

function buildReportData(data, { wave, lang, narrative, today } = {}) {
  const todayStr = today || new Date().toISOString().slice(0, 10);
  const st = status(data, { wave, today: todayStr });
  const p = data.project;
  const cfg = settings(p);
  const latestW = st.waves.latest ? data.waves.find((w) => w.id === st.waves.latest) : null;
  const r = {
    meta: {
      name: p.name,
      type: p.type,
      lang: lang || p.language,
      currency: p.currency,
      sponsor: p.sponsor || null,
      changeManager: p.changeManager || null,
      latestWave: st.waves.latest,
      baselineWave: st.waves.baseline,
      latestDate: latestW ? latestW.meta.date : null,
      usageDate: st.adoption.latest ? st.adoption.latest.date : null,
      today: todayStr,
      minGroupSize: cfg.min,
      generatedAt: new Date().toISOString(),
    },
    groups: st.groups,
    themes: (data.bank && data.bank.themes) || [],
    status: { readiness: st.readiness, compare: st.compare, notes: st.notes },
    sections: {},
    omitted: [],
    narrative: normalizeNarrative(narrative),
  };
  const omit = (section, reason) => r.omitted.push({ section, reason });

  if (st.plan) {
    const horizon = util.addDays(todayStr, 30);
    const upcoming = ((data.plan && data.plan.activities) || [])
      .filter((a) => !['done', 'cancelled'].includes(a.status) && a.due && a.due >= todayStr && a.due <= horizon)
      .sort((a, b) => (a.due < b.due ? -1 : 1))
      .map((a) => ({ id: a.id, title: a.title || null, owner: a.owner || null, due: a.due }));
    r.sections.journey = { ...st.plan, upcoming };
  } else omit('journey', 'NO_DATA');

  if (st.people.latest) {
    const L = st.people.latest.adkar;
    const B = st.people.baseline ? st.people.baseline.adkar : null;
    const ids = st.groups.length ? st.groups.map((g) => g.id) : Object.keys(L.groups);
    r.sections.adkar = {
      overall: { ...L.overall, baselineAverage: B ? B.overall.average : null },
      groups: ids
        .filter((id) => L.groups[id])
        .map((id) => {
          const g = L.groups[id];
          if (g.suppressed) return { id, suppressed: true, n: g.n };
          const b = B && B.groups[id] && !B.groups[id].suppressed ? B.groups[id] : null;
          return { id, suppressed: false, n: g.n, scores: g.scores, barrier: g.barrier, average: g.average, baselineAverage: b ? b.average : null };
        }),
    };
    const trend = data.waves.map((w) => {
      const m = waveMetrics(data, w, cfg);
      return { id: w.id, date: w.meta.date, net: m.sentiment.overall.net, negative: m.sentiment.overall.negative, adkarAverage: m.adkar.overall.average, respondents: w.responses.length };
    });
    r.sections.sentiment = { latest: st.people.latest.sentiment, baseline: st.people.baseline ? st.people.baseline.sentiment : null, trend };
  } else {
    omit('adkar', 'NO_SURVEY');
    omit('sentiment', 'NO_SURVEY');
  }

  if (st.adoption.latest) r.sections.adoption = { latest: st.adoption.latest, first: st.adoption.first, trend: st.adoption.trend };
  else omit('adoption', 'NO_USAGE');

  if (st.value) {
    const inv = p.investment || {};
    r.sections.value = {
      ...st.value,
      whatIf: { reach: st.adoption.latest ? st.adoption.latest.overall.reach : null, oneTime: Number(inv.oneTime) || 0, amortizationMonths: Number(inv.amortizationMonths) || 12 },
    };
  } else omit('value', 'NO_PROCESSES');

  if (st.compare.people || st.compare.adoption) r.sections.compare = st.compare;
  if (st.impact && st.impact.groups.length) r.sections.impact = st.impact;

  const entries = (data.resistance && data.resistance.entries) || [];
  if (entries.length)
    r.sections.resistance = {
      summary: st.resistance,
      entries: entries.map((e) => ({ id: e.id, group: e.group || null, rootCause: e.rootCause || null, signal: e.signal || null, intervention: e.intervention || null, owner: e.owner || null, status: e.status || 'open' })),
    };
  else omit('resistance', 'NO_DATA');

  const pending = ((data.approvals && data.approvals.approvals) || []).filter((a) => a.status === 'pending');
  const decisions = ((data.decisions && data.decisions.decisions) || []).slice(-10).reverse();
  if (pending.length || decisions.length)
    r.sections.governance = {
      pending: pending.map((a) => ({ id: a.id, title: a.title, agent: a.agent, impact: a.impact })),
      decisions: decisions.map((d) => ({ id: d.id, decision: d.decision, by: d.by, at: d.at, title: d.title })),
    };
  return r;
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// JSON inside <script>: escape "<" (no "</script>" breakout) and JS line separators.
const safeJson = (o) => JSON.stringify(o).replace(/[<\u2028\u2029]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

function renderHtml(r) {
  const ui = JSON.parse(fs.readFileSync(UI_STRINGS, 'utf8'));
  return fs
    .readFileSync(TEMPLATE, 'utf8')
    .split('__PMO_TITLE__').join(escapeHtml(r.meta.name))
    .split('__PMO_LANG__').join(r.meta.lang)
    .split('__PMO_DIR__').join(r.meta.lang === 'ar' ? 'rtl' : 'ltr')
    .split('/*__PMO_ENGINE__*/').join(EMBED)
    .split('__PMO_UI__').join(safeJson(ui))
    .split('__PMO_DATA__').join(safeJson(r));
}

function readNarrative(file) {
  if (!file) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  } catch (e) {
    throw new CmoError('JSON_INVALID', { file, detail: e.message });
  }
}

function writeReport(dir, { wave, lang, narrativeFile, out, today } = {}) {
  const data = loadProject(dir);
  const v = validate(data);
  if (!v.ok) throw new CmoError('VALIDATION_FAILED', { count: v.errors.length }, null, v.errors);
  const extras = { approvals: readJson(dir, 'approvals.json', { optional: true }), decisions: readJson(dir, 'decisions.json', { optional: true }) };
  const r = buildReportData({ ...data, ...extras }, { wave, lang, today, narrative: readNarrative(narrativeFile) });
  const target = out || path.join(dir, 'reports', `${r.meta.today}-change-report.html`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, renderHtml(r), 'utf8');
  return { path: target, latestWave: r.meta.latestWave, lang: r.meta.lang, sections: Object.keys(r.sections), omitted: r.omitted };
}

module.exports = { buildReportData, renderHtml, writeReport };
