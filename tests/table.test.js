'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseCsv, readXlsx, readTable, findColumn, norm, toNumber, toDate } = require('../engine/table');
const { createZip } = require('../engine/zip');

function xlsx(rows) {
  const cell = (v, r, c) => `<c r="${String.fromCharCode(65 + c)}${r}" t="inlineStr"><is><t>${v}</t></is></c>`;
  const sheet = rows.map((row, i) => `<row r="${i + 1}">${row.map((v, c) => cell(v, i + 1, c)).join('')}</row>`).join('');
  return createZip({
    'xl/workbook.xml': '<workbook><sheets><sheet name="Form1" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': `<worksheet><sheetData>${sheet}</sheetData></worksheet>`,
  });
}

test('csv with quotes and BOM', () => {
  assert.deepStrictEqual(parseCsv('﻿a,b\n"x, y","1"\n'), [['a', 'b'], ['x, y', '1']]);
});

test('xlsx inline strings', () => {
  assert.deepStrictEqual(readXlsx(xlsx([['ID', 'Name'], ['1', 'سارة']])), [['ID', 'Name'], ['1', 'سارة']]);
});

test('readTable from csv, xlsx, json; bad extension', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-t-'));
  fs.writeFileSync(path.join(d, 'a.csv'), 'h1,h2\n1,2\n');
  fs.writeFileSync(path.join(d, 'a.xlsx'), xlsx([['h1'], ['x']]));
  fs.writeFileSync(path.join(d, 'a.json'), JSON.stringify([{ h1: 'j', h2: null }]));
  fs.writeFileSync(path.join(d, 'a.xls'), 'x');
  assert.deepStrictEqual(readTable(path.join(d, 'a.csv')).rows, [{ h1: '1', h2: '2' }]);
  assert.deepStrictEqual(readTable(path.join(d, 'a.xlsx')).rows, [{ h1: 'x' }]);
  assert.deepStrictEqual(readTable(path.join(d, 'a.json')).rows, [{ h1: 'j', h2: '' }]);
  assert.throws(() => readTable(path.join(d, 'a.xls')), (e) => e.code === 'IMPORT_FORMAT');
});

test('findColumn handles [ID] prefixes and bilingual titles', () => {
  const headers = ['Timestamp', '[PROCESS] العملية / Process', 'الوقت (دقائق)'];
  assert.strictEqual(findColumn(headers, ['process']), '[PROCESS] العملية / Process');
  assert.strictEqual(findColumn(headers, ['minutes', 'الوقت (دقائق)']), 'الوقت (دقائق)');
  assert.strictEqual(findColumn(headers, ['nope']), null);
  assert.strictEqual(norm('  Hello   World؟ '), 'hello world');
});

test('value parsers', () => {
  assert.strictEqual(toNumber('1,250.5'), 1250.5);
  assert.strictEqual(toNumber('٤٥'), 45);
  assert.strictEqual(toNumber('abc'), undefined);
  assert.strictEqual(toDate('2026-07-28T10:00:00Z'), '2026-07-28');
  assert.strictEqual(toDate('28/07/2026'), '2026-07-28');
  assert.strictEqual(toDate('7/28/2026', 'mdy'), '2026-07-28');
  assert.strictEqual(toDate('46231'), '2026-07-28');
  assert.strictEqual(toDate(''), undefined);
});
