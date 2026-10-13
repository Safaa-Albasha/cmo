#!/usr/bin/env node
'use strict';
// PreToolUse guard for change projects: controlled .cmo records only change via approvals,
// the privacy salt is never exposed, and external writes need confirmation.
const fs = require('fs');
const path = require('path');
const { PROTECTED } = require('../engine/approvals');
const { format } = require('../engine/i18n');

const SECRETS = ['.salt'];
const EDIT_TOOLS = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit'];
const SHELL_TOOLS = ['Bash', 'PowerShell'];
const MCP_WRITE = /(create|update|send|post|delete|remove|add|edit|write|transition|comment|reply|forward|upload|move|assign|publish|share)/i;
const SHELL_WRITE = /(>|\brm\b|\brmdir\b|\bdel\b|\bmv\b|\bcp\b|\bmove\b|\bcopy\b|sed\s+-i|\btee\b|\btruncate\b|Set-Content|Add-Content|Out-File|Clear-Content|Remove-Item|Move-Item|Copy-Item|New-Item|writeFileSync)/i;
const SHELL_DELETE = /(\brm\b|\brmdir\b|\bdel\b|\brd\b|Remove-Item)/i;
const APPLY = /cli\.js["']?\s+apply\b/;

const both = (code, params) => {
  const m = format(code, params);
  return `${m.ar}\n${m.en}`;
};

function rel(cwd, p) {
  if (!p) return null;
  const r = path.relative(path.join(cwd, '.cmo'), path.resolve(cwd, p));
  if (!r || r.startsWith('..') || path.isAbsolute(r)) return null;
  return r.split(path.sep).join('/');
}

function decide(input) {
  const cwd = input.cwd || process.cwd();
  if (!fs.existsSync(path.join(cwd, '.cmo', 'project.json'))) return null;
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};

  if (tool === 'Read') {
    const r = rel(cwd, ti.file_path);
    return r && SECRETS.includes(r) ? { decision: 'deny', reason: both('GUARD_DENY_SECRET') } : null;
  }
  if (EDIT_TOOLS.includes(tool)) {
    const r = rel(cwd, ti.file_path || ti.notebook_path);
    if (r && SECRETS.includes(r)) return { decision: 'deny', reason: both('GUARD_DENY_SECRET') };
    return r && PROTECTED.includes(r) ? { decision: 'deny', reason: both('GUARD_DENY_FILE', { file: r }) } : null;
  }
  if (SHELL_TOOLS.includes(tool)) {
    const c = ti.command || '';
    if (APPLY.test(c)) return { decision: 'ask', reason: both('GUARD_ASK_APPLY', { cmd: c.slice(c.search(APPLY)) }) };
    if (/\.salt\b/.test(c) && !/cli\.js/.test(c)) return { decision: 'deny', reason: both('GUARD_DENY_SECRET') };
    if (!/\.cmo/.test(c) || /cli\.js/.test(c)) return null;
    const touches = PROTECTED.some((f) => c.includes(f)) || SHELL_DELETE.test(c);
    return touches && SHELL_WRITE.test(c) ? { decision: 'deny', reason: both('GUARD_DENY_SHELL') } : null;
  }
  if (tool.startsWith('mcp__') && MCP_WRITE.test(tool.split('__').pop())) return { decision: 'ask', reason: both('GUARD_ASK_MCP', { tool }) };
  return null;
}

function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (raw += d));
  process.stdin.on('end', () => {
    let r = null;
    try {
      r = decide(JSON.parse(raw || '{}'));
    } catch {
      r = null;
    }
    if (r) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: r.decision, permissionDecisionReason: r.reason } }));
  });
}

if (require.main === module) main();

module.exports = { decide };
