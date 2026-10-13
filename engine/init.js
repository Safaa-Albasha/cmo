'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { CmoError, writeJson } = require('./io');
const { validate } = require('./validate');

const REQUIRED = ['name', 'type', 'language', 'currency', 'startDate', 'endDate'];
const TEMPLATES = path.join(__dirname, '..', 'templates');

function createProject(dir, o) {
  for (const k of REQUIRED) if (!o[k]) throw new CmoError('ARG_MISSING', { arg: k });
  if (fs.existsSync(path.join(dir, 'project.json'))) throw new CmoError('PROJECT_EXISTS', { dir });
  const tpl = (f) => JSON.parse(fs.readFileSync(path.join(TEMPLATES, 'ai-adoption', f), 'utf8'));

  const project = {
    schemaVersion: 1,
    name: o.name,
    type: o.type,
    description: o.description || '',
    language: o.language,
    currency: o.currency,
    startDate: o.startDate,
    endDate: o.endDate,
    sponsor: o.sponsor || '',
    changeManager: o.changeManager || '',
    privacy: { minGroupSize: 5 },
    thresholds: { barrier: 3, confidence: 0.7, readinessGreen: 70, readinessAmber: 50 },
    weights: { adkar: 0.5, sentiment: 0.2, adoption: 0.3 },
    tools: [],
    investment: { oneTime: 0, amortizationMonths: 12 },
  };
  const files = {
    'project.json': project,
    'groups.json': { schemaVersion: 1, groups: [] },
    'plan.json': o.type === 'ai-adoption' ? tpl('plan.json') : { schemaVersion: 1, activities: [] },
    'sponsors.json': { schemaVersion: 1, sponsor: { name: o.sponsor || '' }, coalition: [], champions: [] },
    'surveys/bank.json': tpl('bank.json'),
    'processes.json': { schemaVersion: 1, processes: [] },
    'resistance.json': { schemaVersion: 1, entries: [] },
    'approvals.json': { schemaVersion: 1, approvals: [] },
    'decisions.json': { schemaVersion: 1, decisions: [] },
  };
  const v = validate({ project, groups: files['groups.json'], bank: files['surveys/bank.json'], waves: [], usage: [], processes: files['processes.json'], samples: {} });
  if (!v.ok) throw new CmoError('VALIDATION_FAILED', { count: v.errors.length }, null, v.errors);

  for (const [rel, data] of Object.entries(files)) writeJson(dir, rel, data);
  for (const d of ['usage', 'samples', 'drafts', 'reports']) {
    fs.mkdirSync(path.join(dir, d), { recursive: true });
    fs.writeFileSync(path.join(dir, d, '.gitkeep'), '');
  }
  // Salt for pseudonymous respondent keys: private, never committed.
  fs.writeFileSync(path.join(dir, '.salt'), crypto.randomBytes(16).toString('hex'));
  fs.writeFileSync(path.join(dir, '.gitignore'), '.salt\n');
  return { dir, files: Object.keys(files) };
}

module.exports = { createProject };
