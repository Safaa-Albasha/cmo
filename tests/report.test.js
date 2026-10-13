'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadProject } = require('../engine/io');
const { buildReportData, renderHtml, writeReport } = require('../engine/report');
const { whatIf } = require('../engine/value');
const { run } = require('../engine/cli');

const EX = path.join(__dirname, '..', 'examples', 'ai-adoption', '.cmo');
const dataFromHtml = (html) => JSON.parse(html.match(/<script id="pmo-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);

test('what-if scales value with reach and licence cost', () => {
  const base = { valuePerMonth: 1000, reach: 50, oneTime: 1200, licenseMonthly: 200, amortizationMonths: 12 };
  assert.deepStrictEqual(whatIf(base, { targetReach: 50 }), { valuePerMonth: 1000, monthlyCost: 300, roiPct: 233.3, paybackMonths: 1.5 });
  assert.deepStrictEqual(whatIf(base, { targetReach: 100 }), { valuePerMonth: 2000, monthlyCost: 300, roiPct: 566.7, paybackMonths: 0.7 });
  assert.strictEqual(whatIf(base, { targetReach: 50, licenseFactor: 2 }).monthlyCost, 500);
});

test('report data from the example', () => {
  const r = buildReportData(loadProject(EX), { today: '2026-10-13' });
  for (const k of ['journey', 'adkar', 'sentiment', 'adoption', 'value', 'compare', 'impact', 'resistance']) assert.ok(r.sections[k], k);
  assert.strictEqual(r.meta.latestWave, 'pulse-2');
  assert.strictEqual(r.sections.adkar.groups.find((g) => g.id === 'LEGAL').suppressed, true);
  assert.strictEqual(r.sections.adkar.groups.find((g) => g.id === 'FIN').baselineAverage !== null, true);
  assert.strictEqual(r.sections.sentiment.trend.length, 3);
  assert.deepStrictEqual(r.sections.journey.overdue.map((o) => o.id), ['S01']);
  assert.strictEqual(r.sections.value.whatIf.reach, r.sections.adoption.latest.overall.reach);
  assert.strictEqual(r.sections.resistance.entries.length, 3);
  assert.deepStrictEqual(r.omitted, []);
});

test('narrative quotes are scrubbed and HTML is safe', () => {
  const evil = '</script><img src=x onerror=alert(1)>';
  const r = buildReportData(loadProject(EX), { today: '2026-10-13', lang: 'en', narrative: { summary: { ar: 'م', en: evil }, quotes: ['اتصل بي 0551234567 أو a@b.com'] } });
  assert.strictEqual(r.narrative.quotes[0].ar, 'اتصل بي [phone] أو [email]');
  const html = renderHtml(r);
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(!html.includes('</script><img'));
  assert.match(html, /function whatIf/);
  assert.strictEqual(dataFromHtml(html).narrative.summary.en, evil);
});

test('writeReport and CLI', () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  fs.cpSync(EX, dir, { recursive: true });
  const w = writeReport(dir, { today: '2026-10-13' });
  assert.strictEqual(path.basename(w.path), '2026-10-13-change-report.html');
  const nf = path.join(path.dirname(dir), 'n.json');
  fs.writeFileSync(nf, JSON.stringify({ summary: 'ملخص' }));
  const r = run(['report', '--dir', dir, '--lang', 'en', '--today', '2026-10-13', '--narrative', nf, '--out', path.join(path.dirname(dir), 'r.html')]);
  assert.strictEqual(r.code, 0, JSON.stringify(r.out));
  assert.strictEqual(dataFromHtml(fs.readFileSync(r.out.path, 'utf8')).meta.lang, 'en');
});
