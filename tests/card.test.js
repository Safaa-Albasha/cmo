'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadProject } = require('../engine/io');
const { status } = require('../engine/status');
const card = require('../engine/card');
const { run } = require('../engine/cli');

const EXDIR = path.join(__dirname, '..', 'examples', 'ai-adoption', '.cmo');
const TODAY = '2026-10-15';

test('card numbers equal the status output', () => {
  const d = loadProject(EXDIR);
  const st = status(d, { today: TODAY });
  const c = card.buildCard(d, { today: TODAY, approvals: [] });
  assert.strictEqual(c.readiness.score, st.readiness.latest.overall.score);
  assert.strictEqual(c.readiness.delta, st.compare.readiness.score.delta);
  assert.strictEqual(c.reach.pct, st.adoption.latest.overall.reach);
  assert.strictEqual(c.value.hoursPerMonth, st.value.totals.hoursPerMonth);
  assert.strictEqual(c.value.roiPct, st.value.totals.roiPct);
  assert.deepStrictEqual(c.name, { ar: 'تبنّي الذكاء الاصطناعي في شركة النخبة', en: 'AI Adoption at Al Nukhba Co.' });
});

test('value evidence: confirmed / preliminary / estimate', () => {
  const proc = (v, status) => ({ valuePerMonth: v, evidence: { status } });
  assert.strictEqual(card.valueEvidence({ processes: [proc(90, 'confirmed'), proc(10, 'estimate')], totals: { measuredValueShare: 90 } }), 'confirmed');
  assert.strictEqual(card.valueEvidence({ processes: [proc(50, 'confirmed'), proc(50, 'inconclusive')], totals: { measuredValueShare: 100 } }), 'preliminary');
  assert.strictEqual(card.valueEvidence({ processes: [proc(50, 'estimate')], totals: { measuredValueShare: 0 } }), 'estimate');
  assert.strictEqual(card.valueEvidence({ processes: [], totals: {} }), 'estimate');
});

test('the ask: pending approval first, then barrier gap, then overdue work, else none', () => {
  const st = { groups: [{ id: 'FIN', name: 'المالية / Finance' }], plan: { gaps: [{ group: 'FIN', barrier: 'knowledge' }], overdue: [{ id: 'A1', title: { ar: 'ورشة', en: 'Workshop' } }] } };
  const ap = [{ id: 'APR-3', status: 'pending', title: { ar: 'إضافة نشاط', en: 'Add activity' } }, { id: 'APR-4', status: 'pending', title: 'X' }, { id: 'APR-1', status: 'approved' }];
  assert.deepStrictEqual(card.pickAsk(st, ap).en, 'Decision needed: Add activity (+1 more pending)');
  assert.match(card.pickAsk(st, []).ar, /المعرفة/);
  assert.match(card.pickAsk({ ...st, plan: { gaps: [], overdue: st.plan.overdue } }, []).en, /overdue activity: Workshop/);
  assert.strictEqual(card.pickAsk({ groups: [], plan: { gaps: [], overdue: [] } }, []).source, 'none');
});

test('every value figure on the card carries its evidence badge', () => {
  const c = card.buildCard(loadProject(EXDIR), { today: TODAY, approvals: [] });
  for (const lang of ['ar', 'en']) {
    const html = card.renderCard(c, lang);
    assert.strictEqual((html.match(/class="ev confirmed"/g) || []).length, 2); // hours tile + value line
    assert.doesNotMatch(html, /__[A-Z_]+__/);
    assert.match(html, new RegExp(`dir="${lang === 'ar' ? 'rtl' : 'ltr'}"`));
  }
});

test('the spoken script stays short and uses only engine numbers', () => {
  const c = card.buildCard(loadProject(EXDIR), { today: TODAY, approvals: [] });
  const s = card.script(c);
  for (const t of [s.ar, s.en]) assert.ok(t.split(/\s+/).length <= 150);
  assert.match(s.en, /69\.5 out of 100/);
  assert.match(s.en, /1,001 hours a month/);
  assert.doesNotMatch(s.en + s.ar, /✔/);
});

test('cli report --format card writes the card and the brief', () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-card-')), '.cmo');
  fs.cpSync(EXDIR, dir, { recursive: true });
  const r = run(['report', '--format', 'card', '--dir', dir, '--today', TODAY, '--lang', 'en']);
  assert.strictEqual(r.code, 0);
  assert.strictEqual(path.basename(r.out.path), '2026-10-15-sponsor-card.html');
  assert.strictEqual(path.basename(r.out.brief), '2026-10-15-sponsor-brief.md');
  assert.match(fs.readFileSync(r.out.brief, 'utf8'), /## العربية[\s\S]*## English/);
});
