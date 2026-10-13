'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { comments, addLabels, reviewQueue } = require('../engine/labels');
const { readJson } = require('../engine/io');

function copy() {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  fs.cpSync(path.join(__dirname, '..', 'examples', 'ai-adoption', '.cmo'), dir, { recursive: true });
  return dir;
}

test('queue lists unlabeled comments with themes and elements', () => {
  const c = comments(copy(), 'pulse-2', { limit: 10 });
  assert.strictEqual(c.total, 15);
  assert.strictEqual(c.items.length, 10);
  assert.match(c.items[0].id, /^r_[0-9a-f]{12}:O1$/);
  assert.ok(c.themes.some((t) => t.id === 'job-security'));
  assert.deepStrictEqual(c.elements, ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement']);
});

test('addLabels validates, merges and clears the queue', () => {
  const dir = copy();
  const q = comments(dir, 'pulse-2', { limit: 100 }).items;
  assert.throws(
    () => addLabels(dir, 'pulse-2', [{ id: 'nope:O1', sentiment: 0, themes: [], confidence: 0.9 }, { id: q[0].id, sentiment: 3, themes: [], confidence: 0.9 }]),
    (e) => e.code === 'VALIDATION_FAILED' && e.details.map((d) => d.code).sort().join() === 'ENUM_INVALID,LABEL_UNKNOWN_ID'
  );
  const r = addLabels(dir, 'pulse-2', q.map((c) => ({ id: c.id, sentiment: 1, themes: ['productivity', 'made-up'], adkar: null, confidence: 0.9 })));
  assert.deepStrictEqual([r.added, r.updated], [15, 0]);
  assert.strictEqual(r.warnings.filter((w) => w.code === 'UNKNOWN_THEME').length, 15);
  assert.strictEqual(comments(dir, 'pulse-2').total, 0);
});

test('review queue and reviewed corrections', () => {
  const dir = copy();
  const rq = reviewQueue(dir, 'pulse-2');
  assert.ok(rq.items.length > 0);
  assert.ok(rq.items.every((i) => i.confidence < 0.7 && !i.reviewed && typeof i.text === 'string'));
  const first = rq.items[0];
  const r = addLabels(dir, 'pulse-2', [{ id: first.id, sentiment: -1, themes: ['trust'], adkar: 'ability' }], { reviewed: true });
  assert.deepStrictEqual([r.added, r.updated], [0, 1]);
  const saved = readJson(dir, 'surveys/pulse-2/sentiment.json').labels.find((l) => l.id === first.id);
  assert.deepStrictEqual([saved.sentiment, saved.reviewed, saved.confidence], [-1, true, 1]);
  assert.strictEqual(reviewQueue(dir, 'pulse-2').items.length, rq.items.length - 1);
});
