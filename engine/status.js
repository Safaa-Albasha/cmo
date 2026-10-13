'use strict';
const adkar = require('./adkar');
const sentiment = require('./sentiment');
const adoption = require('./adoption');
const value = require('./value');
const readiness = require('./readiness');
const { compareFields } = require('./compare');
const { CmoError } = require('./io');

const DEFAULTS = { barrier: 3, confidence: 0.7, readinessGreen: 70, readinessAmber: 50 };
const WEIGHTS = { adkar: 0.5, sentiment: 0.2, adoption: 0.3 };

function settings(project) {
  const th = { ...DEFAULTS, ...(project.thresholds || {}) };
  return {
    th,
    weights: { ...WEIGHTS, ...(project.weights || {}) },
    min: (project.privacy && project.privacy.minGroupSize) || 5,
    rag: { green: th.readinessGreen, amber: th.readinessAmber },
  };
}

function findWave(waves, id) {
  const w = waves.find((x) => x.id === id);
  if (!w) throw new CmoError('WAVE_NOT_FOUND', { wave: id, waves: waves.map((x) => x.id).join(', ') || '-' });
  return w;
}

function waveMetrics(data, w, cfg) {
  return {
    id: w.id,
    date: w.meta.date,
    type: w.meta.type,
    respondents: w.responses.length,
    adkar: adkar.analyzeWave(w.responses, data.bank, { threshold: cfg.th.barrier, minGroupSize: cfg.min }),
    sentiment: sentiment.analyzeWave(w.responses, w.labels, { confidence: cfg.th.confidence, minGroupSize: cfg.min }),
    unlabeled: sentiment.unlabeledComments(w.responses, data.bank, w.labels).length,
  };
}

function readinessFor(people, usage, groupIds, cfg) {
  const groups = {};
  for (const g of groupIds) {
    const a = people && people.adkar.groups[g];
    const s = people && people.sentiment.groups[g];
    const u = usage && usage.groups[g];
    const suppressed = Boolean((a && a.suppressed) || (s && s.suppressed) || (u && u.suppressed));
    if (suppressed) {
      groups[g] = { score: null, rag: null, suppressed: true };
      continue;
    }
    const sc = readiness.score({ adkarAverage: a ? a.average : null, net: s ? s.net : null, reach: u ? u.reach : null }, cfg.weights);
    groups[g] = { score: sc, rag: readiness.rag(sc, cfg.rag), suppressed: false };
  }
  const o = readiness.score(
    { adkarAverage: people ? people.adkar.overall.average : null, net: people ? people.sentiment.overall.net : null, reach: usage ? usage.overall.reach : null },
    cfg.weights
  );
  return { overall: { score: o, rag: readiness.rag(o, cfg.rag) }, groups };
}

const flatPeople = (m) =>
  m ? { adkarAverage: m.adkar.overall.average, ...m.adkar.overall.scores, net: m.sentiment.overall.net, negative: m.sentiment.overall.negative } : null;

function status(data, { wave } = {}) {
  const p = data.project;
  const cfg = settings(p);
  const notes = [];
  const waves = data.waves || [];
  const latestWave = wave ? findWave(waves, wave) : waves[waves.length - 1] || null;
  const baselineWave = waves.find((w) => w.meta.type === 'baseline') || waves[0] || null;
  const latest = latestWave ? waveMetrics(data, latestWave, cfg) : null;
  const baseline = baselineWave && baselineWave !== latestWave ? waveMetrics(data, baselineWave, cfg) : null;
  if (!latest) notes.push('NO_SURVEY');
  else if (!baseline) notes.push('NO_BASELINE');

  const snaps = (data.usage || []).map((u) => adoption.analyzeSnapshot(u, { minGroupSize: cfg.min }));
  const firstUsage = snaps[0] || null;
  const lastUsage = snaps[snaps.length - 1] || null;
  if (!lastUsage) notes.push('NO_USAGE');

  const hasProcesses = data.processes && (data.processes.processes || []).length;
  if (!hasProcesses) notes.push('NO_PROCESSES');
  const val = hasProcesses ? value.analyze(data.processes, data.samples, p) : null;

  const groupList = ((data.groups && data.groups.groups) || []).map((g) => ({ id: g.id, name: g.name, headcount: g.headcount ?? null }));
  const ids = groupList.length ? groupList.map((g) => g.id) : [...new Set(latest ? latestWave.responses.map((r) => r.group) : [])];
  const readinessNow = readinessFor(latest, lastUsage, ids, cfg);
  const readinessBefore = baseline || (firstUsage && firstUsage !== lastUsage) ? readinessFor(baseline, firstUsage, ids, cfg) : null;

  const peopleFields = ['adkarAverage', 'awareness', 'desire', 'knowledge', 'ability', 'reinforcement', 'net', 'negative'];
  const usageFields = ['reach', 'activation', 'frequency', 'depth', 'retention'];
  return {
    project: { name: p.name, type: p.type, language: p.language, currency: p.currency, startDate: p.startDate, endDate: p.endDate },
    groups: groupList,
    waves: { count: waves.length, baseline: baseline ? baseline.id : latest ? latest.id : null, latest: latest ? latest.id : null, list: waves.map((w) => ({ id: w.id, type: w.meta.type, date: w.meta.date, respondents: w.responses.length })) },
    people: { baseline, latest },
    adoption: { first: firstUsage, latest: lastUsage, trend: adoption.trend(data.usage || []) },
    value: val,
    readiness: { latest: readinessNow, baseline: readinessBefore },
    compare: {
      people: baseline && latest ? compareFields(flatPeople(baseline), flatPeople(latest), peopleFields) : null,
      adoption: firstUsage && lastUsage && firstUsage !== lastUsage ? compareFields(firstUsage.overall, lastUsage.overall, usageFields) : null,
      readiness: readinessBefore ? compareFields({ score: readinessBefore.overall.score }, { score: readinessNow.overall.score }, ['score']) : null,
    },
    pending: latest ? { unlabeled: latest.unlabeled, pendingReview: latest.sentiment.overall.pendingReview } : null,
    notes,
  };
}

module.exports = { status, settings, findWave, waveMetrics };
