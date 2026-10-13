#!/usr/bin/env node
'use strict';
const path = require('path');
const { CmoError, loadProject } = require('./io');
const { format } = require('./i18n');
const { validate } = require('./validate');
const { status, settings, findWave, waveMetrics } = require('./status');
const adoption = require('./adoption');
const value = require('./value');
const { createProject } = require('./init');

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
