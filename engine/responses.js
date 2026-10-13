'use strict';
// Import Google Forms / Microsoft Forms exports into surveys/<wave>/responses.json.
// Identity columns only feed the salted key and name scrubbing; they are never stored.
const fs = require('fs');
const path = require('path');
const { CmoError, loadProject } = require('./io');
const { format } = require('./i18n');
const { pseudonym, scrub } = require('./privacy');
const { readTable, norm, toWestern } = require('./table');
const { findWave } = require('./status');
const { optionText, scaleText, both } = require('./forms');
const { writeValidated } = require('./store');

const IDENTITY = ['email', 'e-mail', 'email address', 'البريد', 'البريد الإلكتروني', 'name', 'full name', 'الاسم', 'responder', 'respondent', 'username', 'user', 'المستخدم', 'upn'];
const META = ['id', 'timestamp', 'start time', 'completion time', 'last modified time', 'الطابع الزمني', 'وقت البدء', 'وقت الانتهاء', 'وقت الإكمال'];

function readSalt(dir) {
  const p = path.join(dir, '.salt');
  if (!fs.existsSync(p)) throw new CmoError('SALT_MISSING');
  return fs.readFileSync(p, 'utf8').trim();
}

function mapColumns(headers, bank) {
  const ids = new Set(bank.questions.map((q) => q.id));
  const byText = new Map();
  for (const q of bank.questions) for (const t of [q.text && q.text.ar, q.text && q.text.en, both(q.text)]) if (t) byText.set(norm(t), q.id);
  return headers.map((h) => {
    const m = String(h).match(/\[([A-Za-z0-9_-]+)\]/);
    if (m && ids.has(m[1])) return { header: h, role: 'question', id: m[1] };
    const n = norm(h);
    if (byText.has(n)) return { header: h, role: 'question', id: byText.get(n) };
    if (IDENTITY.includes(n)) return { header: h, role: 'identity' };
    if (META.includes(n)) return { header: h, role: 'meta' };
    return { header: h, role: null };
  });
}

function labelMap(entries) {
  const m = new Map();
  for (const [value, labels] of entries) for (const l of labels) if (l) m.set(norm(l), value);
  return m;
}

function parsers(bank, groups) {
  const scale = bank.scale || {};
  const likertMap = labelMap([1, 2, 3, 4, 5].map((n) => [n, [scale[n] && scale[n].ar, scale[n] && scale[n].en, scale[n] && both(scale[n]), scaleText(bank, n)]]));
  const groupMap = labelMap(groups.map((g) => [g.id, [g.id, g.name, ...String(g.name || '').split(' / ')]]));
  const choiceMaps = {};
  for (const q of bank.questions.filter((x) => x.type === 'choice'))
    choiceMaps[q.id] = labelMap((q.options || []).map((o) => [o, [o, optionText(bank, o), ...optionText(bank, o).split(' / ')]]));
  return {
    likert(raw) {
      const s = toWestern(raw).trim();
      const lead = s.match(/^([1-5])(?!\d)/);
      return lead ? Number(lead[1]) : likertMap.get(norm(s));
    },
    group: (raw) => groupMap.get(norm(raw)),
    choice: (qid, raw) => choiceMaps[qid] && choiceMaps[qid].get(norm(raw)),
  };
}

function importResponses(dir, { from, wave, sheet, write = false } = {}) {
  if (!from) throw new CmoError('ARG_MISSING', { arg: 'from' });
  const data = loadProject(dir);
  findWave(data.waves, wave);
  if (!data.bank) throw new CmoError('FILE_MISSING', { file: 'surveys/bank.json' });
  const salt = readSalt(dir);
  const groups = (data.groups && data.groups.groups) || [];
  const { headers, rows } = readTable(from, { sheet });
  const cols = mapColumns(headers, data.bank);
  const qById = new Map(data.bank.questions.map((q) => [q.id, q]));
  const questionCols = cols.filter((c) => c.role === 'question');
  if (!questionCols.some((c) => qById.get(c.id).type === 'group')) throw new CmoError('NO_GROUP_COLUMN');
  const parse = parsers(data.bank, groups);
  const warnings = [];
  const warn = (code, params) => warnings.push({ code, ...params, message: format(code, params) });
  const out = new Map();

  rows.forEach((row, i) => {
    const rowNo = i + 2;
    const identity = cols.filter((c) => c.role === 'identity').map((c) => String(row[c.header] || '').trim()).filter(Boolean);
    const names = identity.filter((x) => !x.includes('@') && x.toLowerCase() !== 'anonymous').flatMap((n) => [n, ...n.split(/\s+/)]);
    const meta = cols.filter((c) => c.role === 'meta').map((c) => row[c.header]).filter(Boolean);
    const answers = {};
    let group = null;
    for (const c of questionCols) {
      const q = qById.get(c.id);
      const raw = row[c.header];
      if (raw === undefined || String(raw).trim() === '') continue;
      if (q.type === 'group') {
        group = parse.group(raw) || null;
        if (!group) warn('UNMAPPED_GROUP', { row: rowNo, value: raw });
        else answers[q.id] = group;
      } else if (q.type === 'likert') {
        const v = parse.likert(raw);
        if (v === undefined) warn('UNMAPPED_VALUE', { row: rowNo, value: raw, question: q.id });
        else answers[q.id] = v;
      } else if (q.type === 'choice') {
        const v = parse.choice(q.id, raw);
        if (v === undefined) warn('UNMAPPED_VALUE', { row: rowNo, value: raw, question: q.id });
        else answers[q.id] = v;
      } else answers[q.id] = scrub(String(raw).trim(), names);
    }
    if (!group) return;
    const email = identity.find((x) => x.includes('@'));
    const key = pseudonym(email || `${wave}|${rowNo}|${meta.join('|')}`, salt);
    out.set(key, { key, group, role: answers.ROLE ?? null, answers });
  });

  const responses = [...out.values()];
  const counts = {};
  for (const r of responses) counts[r.group] = (counts[r.group] || 0) + 1;
  const mapped = new Set(questionCols.map((c) => c.id));
  const result = {
    wave,
    file: from,
    mapping: cols.map((c) => ({ header: c.header, role: c.role, id: c.id || null, stored: c.role === 'question' })),
    unmappedHeaders: cols.filter((c) => !c.role).map((c) => c.header),
    missingQuestions: (findWave(data.waves, wave).meta.questions || []).filter((id) => !mapped.has(id)),
    count: responses.length,
    groups: counts,
    warnings: warnings.slice(0, 50),
    warningCount: warnings.length,
  };
  if (!write) return { action: 'preview', ...result };
  const w = writeValidated(dir, {
    [`surveys/${wave}/responses.json`]: { schemaVersion: 1, importedAt: new Date().toISOString(), source: path.basename(from), responses },
  });
  return { action: 'written', ...result, validationWarnings: w.warnings };
}

module.exports = { importResponses, mapColumns, readSalt };
