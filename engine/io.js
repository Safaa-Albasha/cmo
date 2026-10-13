'use strict';
const fs = require('fs');
const path = require('path');

class CmoError extends Error {
  constructor(code, params = {}, filePath = null, details = null) {
    super(code);
    this.code = code;
    this.params = params;
    this.path = filePath;
    this.details = details;
  }
}

function readJson(dir, rel, { optional = false } = {}) {
  const p = path.join(dir, rel);
  if (!fs.existsSync(p)) {
    if (optional) return null;
    throw new CmoError('FILE_MISSING', { file: rel }, rel);
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
  } catch (e) {
    throw new CmoError('JSON_INVALID', { file: rel, detail: e.message }, rel);
  }
}

function writeJson(dir, rel, data) {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

const listJson = (dir, sub) => {
  const d = path.join(dir, sub);
  return fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.json')).sort() : [];
};

function loadWaves(dir) {
  const s = path.join(dir, 'surveys');
  if (!fs.existsSync(s)) return [];
  return fs
    .readdirSync(s, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(s, e.name, 'meta.json')))
    .map((e) => {
      const rel = `surveys/${e.name}`;
      const responses = readJson(dir, `${rel}/responses.json`, { optional: true });
      return {
        id: e.name,
        meta: readJson(dir, `${rel}/meta.json`),
        responses: responses ? responses.responses || [] : [],
        labels: readJson(dir, `${rel}/sentiment.json`, { optional: true }),
      };
    })
    .sort((a, b) => String(a.meta.date || '').localeCompare(String(b.meta.date || '')) || a.id.localeCompare(b.id));
}

function loadProject(dir) {
  const opt = (f) => readJson(dir, f, { optional: true });
  return {
    project: readJson(dir, 'project.json'),
    groups: opt('groups.json'),
    plan: opt('plan.json'),
    sponsors: opt('sponsors.json'),
    bank: opt('surveys/bank.json'),
    waves: loadWaves(dir),
    usage: listJson(dir, 'usage').map((f) => ({ ...readJson(dir, `usage/${f}`), date: f.slice(0, 10), file: `usage/${f}` })),
    processes: opt('processes.json'),
    samples: Object.fromEntries(listJson(dir, 'samples').map((f) => [f.slice(0, -5), (readJson(dir, `samples/${f}`).samples || [])])),
    resistance: opt('resistance.json'),
  };
}

module.exports = { CmoError, readJson, writeJson, loadProject };
