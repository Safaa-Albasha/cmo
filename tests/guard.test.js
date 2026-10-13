'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { decide } = require('../hooks/guard');

const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-g-'));
fs.mkdirSync(path.join(cwd, '.cmo'));
fs.writeFileSync(path.join(cwd, '.cmo', 'project.json'), '{}');
const plain = fs.mkdtempSync(path.join(os.tmpdir(), 'plain-'));
const d = (tool_name, tool_input, dir = cwd) => decide({ cwd: dir, tool_name, tool_input });

test('controlled records', () => {
  assert.strictEqual(d('Write', { file_path: path.join(cwd, '.cmo', 'plan.json') }).decision, 'deny');
  assert.strictEqual(d('Edit', { file_path: '.cmo/groups.json' }).decision, 'deny');
  assert.strictEqual(d('Write', { file_path: '.cmo/surveys/baseline/sentiment.json' }), null);
  assert.strictEqual(d('Write', { file_path: '.cmo/plan.json' }, plain), null);
});

test('salt is never read, copied or changed', () => {
  assert.strictEqual(d('Read', { file_path: path.join(cwd, '.cmo', '.salt') }).decision, 'deny');
  assert.strictEqual(d('Write', { file_path: '.cmo/.salt' }).decision, 'deny');
  assert.strictEqual(d('Bash', { command: 'cat .cmo/.salt' }).decision, 'deny');
  assert.strictEqual(d('PowerShell', { command: 'Get-Content .cmo\\.salt' }).decision, 'deny');
  assert.strictEqual(d('Read', { file_path: '.cmo/plan.json' }), null);
});

test('shell and external tools', () => {
  assert.strictEqual(d('Bash', { command: 'node "/p/engine/cli.js" apply --dir .cmo --ids APR-0001 --decision approve --by S' }).decision, 'ask');
  assert.strictEqual(d('Bash', { command: 'rm -rf .cmo' }).decision, 'deny');
  assert.strictEqual(d('Bash', { command: 'echo x > .cmo/resistance.json' }).decision, 'deny');
  assert.strictEqual(d('Bash', { command: 'node /p/engine/cli.js status --dir .cmo' }), null);
  assert.strictEqual(d('mcp__slack__slack_send_message', {}).decision, 'ask');
  assert.strictEqual(d('mcp__google__read_sheet', {}), null);
});

test('hook process output', () => {
  const out = execFileSync(process.execPath, [path.join(__dirname, '..', 'hooks', 'guard.js')], {
    input: JSON.stringify({ cwd, tool_name: 'Read', tool_input: { file_path: '.cmo/.salt' } }),
    encoding: 'utf8',
  });
  assert.strictEqual(JSON.parse(out).hookSpecificOutput.permissionDecision, 'deny');
});
