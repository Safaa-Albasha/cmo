'use strict';
const fs = require('fs');
const path = require('path');
const { CmoError } = require('./io');
const { unzip } = require('./zip');
const { addDays, isDate } = require('./util');

function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const count = (ch) => firstLine.split(ch).length - 1;
  const delim = [',', ';', '\t'].reduce((best, ch) => (count(ch) > count(best) ? ch : best), ',');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

const decodeXml = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([\w:]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

const textOf = (xml) => decodeXml([...xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(''));

function colIndex(ref) {
  let n = 0;
  for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function readXlsx(buf, sheetName) {
  const raw = unzip(buf);
  const files = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v.toString('utf8')]));
  const sheets = [...(files['xl/workbook.xml'] || '').matchAll(/<sheet\b[^>]*>/g)].map((m) => attrs(m[0]));
  const rels = Object.fromEntries(
    [...(files['xl/_rels/workbook.xml.rels'] || '').matchAll(/<Relationship\b[^>]*>/g)].map((m) => {
      const a = attrs(m[0]);
      return [a.Id, a.Target];
    })
  );
  const sheet = sheetName ? sheets.find((s) => s.name === sheetName) : sheets[0];
  if (sheetName && !sheet) throw new CmoError('IMPORT_SHEET', { sheet: sheetName, sheets: sheets.map((s) => s.name).join(', ') });
  const target = (sheet && rels[sheet['r:id']] ? rels[sheet['r:id']] : 'worksheets/sheet1.xml').replace(/^\/?xl\//, '');
  const xml = files['xl/' + target];
  if (!xml) throw new CmoError('IMPORT_FORMAT', { file: 'xlsx (sheet not found)' });
  const shared = [...(files['xl/sharedStrings.xml'] || '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]));
  const rows = [];
  for (const rm of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cm of rm[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const a = attrs(cm[1]);
      const inner = cm[2] || '';
      const v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      let val = '';
      if (a.t === 's') val = shared[Number(v)] ?? '';
      else if (a.t === 'inlineStr') val = textOf(inner);
      else if (v !== undefined) val = decodeXml(v);
      row[colIndex(a.r)] = val;
    }
    rows[Number(attrs(rm[1]).r) - 1] = Array.from(row, (x) => x ?? '');
  }
  const width = Math.max(0, ...rows.filter(Boolean).map((r) => r.length));
  return rows
    .filter(Boolean)
    .map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''))
    .filter((r) => r.some((v) => v !== ''));
}

function readTable(file, { sheet } = {}) {
  if (!fs.existsSync(file)) throw new CmoError('FILE_MISSING', { file }, file);
  const ext = path.extname(file).toLowerCase();
  let grid;
  if (['.csv', '.tsv', '.txt'].includes(ext)) grid = parseCsv(fs.readFileSync(file, 'utf8'));
  else if (ext === '.xlsx') grid = readXlsx(fs.readFileSync(file), sheet);
  else if (ext === '.json') {
    let j;
    try {
      j = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
    } catch (e) {
      throw new CmoError('JSON_INVALID', { file, detail: e.message });
    }
    const list = Array.isArray(j) ? j : j.rows || j.items || j.data || [];
    const headers = [...new Set(list.flatMap((o) => Object.keys(o)))];
    return { headers, rows: list.map((o) => Object.fromEntries(headers.map((h) => [h, o[h] === null || o[h] === undefined ? '' : String(o[h])]))) };
  } else throw new CmoError('IMPORT_FORMAT', { file });
  if (!grid.length) return { headers: [], rows: [] };
  const headers = grid[0].map((h) => String(h).trim());
  return { headers, rows: grid.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, String(r[i] ?? '').trim()]))) };
}

const AR_DIGITS = /[٠-٩]/g;
const toWestern = (s) => String(s).replace(AR_DIGITS, (d) => String(d.charCodeAt(0) - 0x0660));

const norm = (s) =>
  toWestern(s)
    .toLowerCase()
    .replace(/[:_؟?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// A header matches when the whole title, the title without "[ID]", or one side of "ar / en" equals a synonym.
function headerForms(h) {
  const noId = String(h).replace(/\[[^\]]*\]/g, '');
  return [h, noId, ...noId.split(' / ')].map(norm).filter(Boolean);
}

function findColumn(headers, synonyms) {
  const syn = new Set(synonyms.map(norm));
  return headers.find((h) => headerForms(h).some((f) => syn.has(f))) || null;
}

function toNumber(v) {
  if (v === undefined || v === null) return undefined;
  const s = toWestern(v);
  if (!/\d/.test(s)) return undefined;
  const n = Number(s.replace(/[,\s%]/g, '').replace(/[^\d.+-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function toDate(v, fmt = 'dmy') {
  if (v === undefined || v === null || String(v).trim() === '') return undefined;
  const s = toWestern(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{5}(\.\d+)?$/.test(s)) return addDays('1899-12-30', Math.floor(Number(s)));
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (!m) return undefined;
  let [a, b, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 100) y += 2000;
  let [d, mo] = fmt === 'mdy' ? [b, a] : [a, b];
  if (mo > 12 && d <= 12) [d, mo] = [mo, d];
  const out = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return isDate(out) ? out : undefined;
}

module.exports = { parseCsv, readXlsx, readTable, norm, headerForms, findColumn, toNumber, toDate, toWestern };
