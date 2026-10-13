'use strict';
// Import timed process runs (before/after AI) into samples/<process>.json.
const { CmoError, loadProject } = require('./io');
const { format } = require('./i18n');
const { readTable, findColumn, norm, toNumber, toDate } = require('./table');
const { writeValidated } = require('./store');

const F = {
  process: ['process', 'process id', 'process name', 'العملية'],
  phase: ['phase', 'stage', 'before/after', 'المرحلة', 'قبل/بعد'],
  minutes: ['minutes', 'time (minutes)', 'duration (minutes)', 'time', 'الوقت (دقائق)', 'المدة (دقائق)', 'الوقت', 'المدة'],
  errors: ['any errors', 'errors', 'error', 'had errors', 'هل حدث خطأ', 'أخطاء', 'خطأ'],
  date: ['date', 'timestamp', 'التاريخ', 'الطابع الزمني'],
};
const PHASE = new Map([
  ...['before', 'baseline', 'without ai', 'قبل', 'قبل الذكاء الاصطناعي'].map((x) => [x, 'before']),
  ...['after', 'with ai', 'بعد', 'بعد الذكاء الاصطناعي'].map((x) => [x, 'after']),
]);
const YES = ['yes', 'true', 'نعم', 'y'];
const NO = ['no', 'false', 'لا', 'n'];

const firstKnown = (raw, map) => {
  for (const part of [raw, ...String(raw).split(' / ')]) {
    const v = map.get(norm(part));
    if (v !== undefined) return v;
  }
  return undefined;
};

function errorsValue(raw) {
  if (raw === undefined || String(raw).trim() === '') return undefined;
  const n = toNumber(raw);
  if (n !== undefined) return n;
  const parts = [raw, ...String(raw).split(' / ')].map(norm);
  if (parts.some((p) => YES.includes(p))) return 1;
  if (parts.some((p) => NO.includes(p))) return 0;
  return undefined;
}

function importSamples(dir, { from, sheet, write = false, replace = false, dateFormat = 'dmy' } = {}) {
  if (!from) throw new CmoError('ARG_MISSING', { arg: 'from' });
  const data = loadProject(dir);
  const procs = (data.processes && data.processes.processes) || [];
  const procMap = new Map();
  for (const p of procs) for (const l of [p.id, p.name, ...String(p.name || '').split(' / ')]) if (l) procMap.set(norm(l), p.id);
  const { headers, rows } = readTable(from, { sheet });
  const col = Object.fromEntries(Object.keys(F).map((k) => [k, findColumn(headers, F[k])]));
  for (const k of ['process', 'phase', 'minutes']) if (!col[k]) throw new CmoError('FIELD_REQUIRED', { file: from, field: k });

  const warnings = [];
  const added = {};
  rows.forEach((row, i) => {
    const rowNo = i + 2;
    const id = firstKnown(row[col.process], procMap);
    if (!id) return warnings.push({ code: 'PROCESS_UNKNOWN', row: rowNo, message: format('PROCESS_UNKNOWN', { row: rowNo, value: row[col.process] }) });
    const phase = firstKnown(row[col.phase], PHASE);
    const minutes = toNumber(row[col.minutes]);
    if (!phase || !(minutes > 0))
      return warnings.push({ code: 'UNMAPPED_VALUE', row: rowNo, message: format('UNMAPPED_VALUE', { row: rowNo, value: `${row[col.phase]} / ${row[col.minutes]}`, question: 'phase/minutes' }) });
    const s = { phase, minutes };
    const e = col.errors ? errorsValue(row[col.errors]) : undefined;
    if (e !== undefined) s.errors = e;
    const d = col.date ? toDate(row[col.date], dateFormat) : undefined;
    if (d) s.date = d;
    (added[id] = added[id] || []).push(s);
  });

  const counts = Object.fromEntries(Object.entries(added).map(([id, list]) => [id, { before: list.filter((s) => s.phase === 'before').length, after: list.filter((s) => s.phase === 'after').length }]));
  const result = { file: from, counts, warnings };
  if (!write) return { action: 'preview', ...result };
  const files = {};
  for (const [id, list] of Object.entries(added)) files[`samples/${id}.json`] = { schemaVersion: 1, samples: (replace ? [] : data.samples[id] || []).concat(list) };
  const w = writeValidated(dir, files);
  return { action: 'written', ...result, validationWarnings: w.warnings };
}

module.exports = { importSamples };
