'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { loadProject } = require('../engine/io');
const { validate } = require('../engine/validate');
const { status } = require('../engine/status');

const d = loadProject(path.join(__dirname, '..', 'examples', 'ai-adoption', '.cmo'));
const s = status(d);

test('example is valid and complete', () => {
  assert.strictEqual(validate(d).ok, true);
  assert.deepStrictEqual(s.notes, []);
  assert.strictEqual(s.waves.count, 3);
  assert.deepStrictEqual([s.waves.baseline, s.waves.latest], ['baseline', 'pulse-2']);
});

test('story: barriers, improvement, privacy', () => {
  assert.strictEqual(s.people.baseline.adkar.groups.FIN.barrier, 'desire');
  assert.strictEqual(s.people.baseline.adkar.groups.OPS.barrier, 'awareness');
  assert.ok(s.compare.people.desire.delta > 0.5);
  assert.ok(s.compare.people.net.delta > 0);
  assert.ok(s.compare.adoption.reach.delta > 30);
  assert.ok(s.compare.readiness.score.delta > 10);
  assert.strictEqual(s.people.latest.adkar.groups.LEGAL.suppressed, true);
  assert.strictEqual(s.adoption.latest.groups.LEGAL.suppressed, true);
  assert.strictEqual(s.readiness.latest.groups.LEGAL.suppressed, true);
  assert.strictEqual(s.pending.unlabeled, 15);
});

test('story: business value evidence', () => {
  const ev = Object.fromEntries(s.value.processes.map((p) => [p.id, p.evidence.status]));
  assert.deepStrictEqual(ev, { PR1: 'confirmed', PR2: 'confirmed', PR3: 'preliminary', PR4: 'estimate', PR5: 'inconclusive' });
  assert.ok(s.value.totals.hoursPerMonth > 800);
  assert.ok(s.value.totals.roiPct > 0);
});

test('no names or emails stored in responses', () => {
  const raw = JSON.stringify(d.waves.map((w) => w.responses));
  assert.ok(!/@/.test(raw));
  assert.ok(!/nukhba/.test(raw));
});
