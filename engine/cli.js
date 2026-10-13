#!/usr/bin/env node
'use strict';
const path = require('path');
const { CmoError, loadProject, readJson } = require('./io');
const approvals = require('./approvals');
const { analyzeImpact } = require('./impact');
const { writeReport } = require('./report');
const { format } = require('./i18n');
const { validate } = require('./validate');
const { status, settings, findWave, waveMetrics } = require('./status');
const adoption = require('./adoption');
const value = require('./value');
const { createProject } = require('./init');
const fs = require('fs');
const { createWave, generateSurvey, generateTimingForm } = require('./survey');
const { importResponses } = require('./responses');
const { importUsage } = require('./usage');
const { importSamples } = require('./samples');
const labels = require('./labels');

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const opts = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (!a.startsWith('--')) continue;
    const next = rest[i + 1];
    opts[a.slice(2)] = next !== undefined && !next.startsWith('--') ? rest[++i] : true;
  }
  return { cmd, opts };
}

function loadValid(dir) {
  const data = loadProject(dir);
  const v = validate(data);
  if (!v.ok) throw new CmoError('VALIDATION_FAILED', { count: v.errors.length }, null, v.errors);
  return data;
}

// --wave accepts an id, "baseline" (first baseline wave) or "latest".
function pickWave(d, sel) {
  if (typeof sel !== 'string' || sel === 'latest') {
    if (!d.waves.length) throw new CmoError('WAVE_NOT_FOUND', { wave: 'latest', waves: '-' });
    return d.waves[d.waves.length - 1];
  }
  if (sel === 'baseline') return d.waves.find((w) => w.meta.type === 'baseline') || findWave(d.waves, sel);
  return findWave(d.waves, sel);
}

const pickWaveId = (dir, sel) => pickWave(loadProject(dir), sel).id;

const str = (v) => (typeof v === 'string' ? v : undefined);

const COMMANDS = {
  validate: (dir) => validate(loadProject(dir)),
  status: (dir, o) => status(loadValid(dir), { wave: str(o.wave) }),
  adkar: (dir, o) => {
    const d = loadValid(dir);
    const m = waveMetrics(d, pickWave(d, o.wave), settings(d.project));
    return { wave: m.id, date: m.date, ...m.adkar };
  },
  sentiment: (dir, o) => {
    const d = loadValid(dir);
    const m = waveMetrics(d, pickWave(d, o.wave), settings(d.project));
    return { wave: m.id, date: m.date, unlabeled: m.unlabeled, ...m.sentiment };
  },
  adoption: (dir) => {
    const d = loadValid(dir);
    const min = settings(d.project).min;
    return { snapshots: d.usage.map((u) => adoption.analyzeSnapshot(u, { minGroupSize: min })), trend: adoption.trend(d.usage) };
  },
  value: (dir) => {
    const d = loadValid(dir);
    return value.analyze(d.processes, d.samples, d.project);
  },
  wave: (dir, o) => createWave(dir, { wave: str(o.id), type: str(o.type), date: str(o.date), questions: str(o.questions) ? o.questions.split(',') : undefined }),
  survey: (dir, o) => generateSurvey(dir, { wave: str(o.wave) }),
  import: (dir, o) => {
    const fn = IMPORTS[o.type];
    if (!fn) throw new CmoError('ENUM_INVALID', { file: 'import', field: 'type', allowed: Object.keys(IMPORTS).join(', ') });
    return fn(dir, { ...o, from: str(o.from) ? path.resolve(o.from) : undefined });
  },
  comments: (dir, o) => labels.comments(dir, pickWaveId(dir, o.wave), { limit: Number(o.limit) || 50, offset: Number(o.offset) || 0 }),
  label: (dir, o) => labels.addLabels(dir, pickWaveId(dir, o.wave), readJsonArg(o), { reviewed: o.reviewed === true }),
  review: (dir, o) => labels.reviewQueue(dir, pickWaveId(dir, o.wave)),
  propose: (dir, o) => approvals.propose(dir, readJsonArg(o)),
  approvals: (dir, o) => approvals.list(dir, str(o.status) || 'pending'),
  apply: (dir, o) => {
    const opts = { by: str(o.by) || null, note: str(o.note) || null };
    if (str(o.ids)) {
      const results = o.ids.split(',').map((s) => s.trim()).filter(Boolean).map((id) => {
        try {
          return { id, ok: true, decision: approvals.apply(dir, id, o.decision, opts).decision };
        } catch (e) {
          if (!(e instanceof CmoError)) throw e;
          const m = format(e.code, e.params);
          return { id, ok: false, error: { code: e.code, message_en: m.en, message_ar: m.ar } };
        }
      });
      return { results };
    }
    if (!str(o.id)) throw new CmoError('ARG_MISSING', { arg: 'id' });
    return approvals.apply(dir, o.id, o.decision, opts);
  },
  decisions: (dir) => {
    const doc = readJson(dir, 'decisions.json', { optional: true });
    return doc ? doc.decisions : [];
  },
  plan: (dir, o) => status(loadValid(dir), { today: str(o.today) }).plan,
  impact: (dir) => analyzeImpact(loadValid(dir).groups),
  'timing-form': (dir) => generateTimingForm(dir),
  report: (dir, o) =>
    writeReport(dir, { wave: str(o.wave), lang: str(o.lang), today: str(o.today), narrativeFile: str(o.narrative) ? path.resolve(o.narrative) : null, out: str(o.out) ? path.resolve(o.out) : undefined }),
  init: (dir, o) =>
    createProject(dir, {
      name: str(o.name),
      type: str(o.type) || 'ai-adoption',
      language: str(o.language),
      currency: str(o.currency),
      startDate: str(o.start),
      endDate: str(o.end),
      sponsor: str(o.sponsor),
      changeManager: str(o.cm),
      description: str(o.description),
    }),
};

function readJsonArg(o) {
  try {
    if (typeof o.json === 'string') return JSON.parse(o.json);
    if (typeof o.file === 'string') return JSON.parse(fs.readFileSync(o.file, 'utf8').replace(/^﻿/, ''));
  } catch (e) {
    throw new CmoError('JSON_INVALID', { file: o.file || '--json', detail: e.message });
  }
  throw new CmoError('ARG_MISSING', { arg: 'file | --json' });
}

const IMPORTS = {
  responses: (dir, o) => importResponses(dir, { from: o.from, wave: str(o.wave), sheet: str(o.sheet), write: o.write === true }),
  usage: (dir, o) =>
    importUsage(dir, { from: o.from, date: str(o.date), tool: str(o.tool), roster: o.roster ? path.resolve(o.roster) : undefined, sheet: str(o.sheet), write: o.write === true, dateFormat: o['date-format'] === 'mdy' ? 'mdy' : 'dmy' }),
  samples: (dir, o) => importSamples(dir, { from: o.from, sheet: str(o.sheet), write: o.write === true, replace: o.replace === true, dateFormat: o['date-format'] === 'mdy' ? 'mdy' : 'dmy' }),
};

function run(argv) {
  try {
    const { cmd, opts } = parseArgs(argv);
    const fn = COMMANDS[cmd];
    if (!fn) throw new CmoError('UNKNOWN_COMMAND', { cmd: cmd || '', commands: Object.keys(COMMANDS).join(', ') });
    const dir = path.resolve(typeof opts.dir === 'string' ? opts.dir : '.cmo');
    return { code: 0, out: fn(dir, opts) };
  } catch (e) {
    if (!(e instanceof CmoError)) throw e;
    const m = format(e.code, e.params);
    return { code: 1, out: { error: { code: e.code, message_en: m.en, message_ar: m.ar, path: e.path, details: e.details } } };
  }
}

if (require.main === module) {
  const r = run(process.argv.slice(2));
  process.stdout.write(JSON.stringify(r.out, null, 2) + '\n');
  process.exitCode = r.code;
}

module.exports = { run, parseArgs };
