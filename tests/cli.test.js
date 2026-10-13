'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { run } = require('../engine/cli');

const EX = path.join(__dirname, '..', 'examples', 'ai-adoption', '.cmo');

test('status, adkar, sentiment, adoption, value, validate on the example', () => {
  const s = run(['status', '--dir', EX]);
  assert.strictEqual(s.code, 0, JSON.stringify(s.out));
  assert.ok(s.out.readiness.latest.overall.score > 0);
  assert.strictEqual(run(['adkar', '--dir', EX, '--wave', 'baseline']).code, 0);
  assert.strictEqual(run(['sentiment', '--dir', EX]).code, 0);
  assert.strictEqual(run(['adoption', '--dir', EX]).out.snapshots.length, 6);
  assert.strictEqual(run(['value', '--dir', EX]).out.processes.length, 5);
  assert.strictEqual(run(['validate', '--dir', EX]).out.ok, true);
});

test('errors are bilingual', () => {
  const r = run(['adkar', '--dir', EX, '--wave', 'nope']);
  assert.strictEqual(r.code, 1);
  assert.strictEqual(r.out.error.code, 'WAVE_NOT_FOUND');
  assert.ok(r.out.error.message_ar.includes('nope'));
  assert.strictEqual(run(['zzz']).out.error.code, 'UNKNOWN_COMMAND');
});

test('init through a real process', () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  const cli = path.join(__dirname, '..', 'engine', 'cli.js');
  const out = JSON.parse(
    execFileSync(process.execPath, [cli, 'init', '--dir', dir, '--name', 'مشروع', '--type', 'ai-adoption', '--language', 'ar', '--currency', 'KWD', '--start', '2026-01-01', '--end', '2026-06-30'], { encoding: 'utf8' })
  );
  assert.ok(out.files.includes('project.json'));
  const st = JSON.parse(execFileSync(process.execPath, [cli, 'status', '--dir', dir], { encoding: 'utf8' }));
  assert.strictEqual(st.project.currency, 'KWD');
});
