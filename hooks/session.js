#!/usr/bin/env node
'use strict';
// SessionStart: one line of what is due in this change project (overdue survey, stale usage data,
// approvals, comments, plan work). Silent when nothing is due, outside a .cmo project, or on any error.
const fs = require('fs');
const path = require('path');

function message(cwd) {
  const dir = path.join(cwd, '.cmo');
  if (!fs.existsSync(path.join(dir, 'project.json'))) return null;
  const { loadProject } = require('../engine/io');
  const { validate } = require('../engine/validate');
  const { nudges } = require('../engine/nudges');
  const data = loadProject(dir);
  if (!validate(data).ok) return { ar: 'CMO · في ملفات المشروع أخطاء ← /cmo:setup', en: 'CMO · project files have errors → /cmo:setup' };
  return nudges(dir, data).line;
}

function main(raw) {
  let input = {};
  try {
    input = raw ? JSON.parse(raw) : {};
  } catch {}
  let line = null;
  try {
    line = message(input.cwd || process.cwd());
  } catch {
    return '';
  }
  if (!line) return '';
  const text = `${line.ar}\n${line.en}`;
  return JSON.stringify({ systemMessage: text, hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text } });
}

if (require.main === module) {
  let raw = '';
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => {
    const out = main(raw);
    if (out) process.stdout.write(out + '\n');
  });
}

module.exports = { main, message };
