'use strict';
// Import AI-tool usage reports into usage/<date>.json — never stores user identities.
const { CmoError, loadProject, readJson } = require('./io');
const { readTable, findColumn, norm, toNumber, toDate } = require('./table');
const { daysBetween, isDate, round } = require('./util');
const { writeValidated } = require('./store');

const F = {
  group: ['group', 'department', 'dept', 'القسم', 'الإدارة', 'المجموعة'],
  tool: ['tool', 'product', 'الأداة'],
  licensed: ['licensed', 'licenses', 'licensed users', 'المرخص لهم', 'المرخّص لهم'],
  activated: ['activated', 'activated users', 'enabled users', 'المفعلون', 'المفعّلون'],
  activeWeekly: ['weekly active users', 'active weekly', 'weekly active', 'active users', 'النشطون أسبوعيا', 'النشطون أسبوعيًا', 'النشطون'],
  avgActiveDays: ['average active days per week', 'avg active days', 'active days per week', 'متوسط أيام الاستخدام'],
  avgFeatures: ['average features', 'avg features', 'features used', 'متوسط الميزات'],
  powerUsers: ['power users', 'المستخدمون المتقدمون'],
  retained30d: ['retained 30d', 'retained users', 'retained', 'المستمرون'],
  user: ['user principal name', 'upn', 'email', 'e-mail', 'user', 'username', 'البريد', 'البريد الإلكتروني', 'المستخدم'],
  lastActivity: ['last activity date (utc)', 'last activity date', 'last activity', 'last active date', 'last active', 'آخر نشاط', 'تاريخ آخر نشاط'],
  activeDays: ['active days', 'days active', 'active days (last 28 days)', 'أيام النشاط'],
};

function groupResolver(groups) {
  const m = new Map();
  for (const g of groups) for (const l of [g.id, g.name, ...String(g.name || '').split(' / ')]) if (l) m.set(norm(l), g.id);
  return (v) => m.get(norm(v || ''));
}

function perUser(headers, rows, { date, rosterFile, resolve, dateFormat }) {
  const userCol = findColumn(headers, F.user);
  const lastCol = findColumn(headers, F.lastActivity);
  const daysCol = findColumn(headers, F.activeDays);
  const deptCol = findColumn(headers, F.group);
  const featureCols = headers.filter((h) => h !== lastCol && /(last activity date|آخر نشاط)/i.test(h));
  let roster = null;
  if (!deptCol) {
    if (!rosterFile) throw new CmoError('ROSTER_REQUIRED');
    const r = readTable(rosterFile);
    const ru = findColumn(r.headers, F.user);
    const rg = findColumn(r.headers, F.group);
    roster = new Map(r.rows.map((x) => [String(x[ru] || '').trim().toLowerCase(), resolve(x[rg])]));
  }
  const acc = {};
  let unmappedUsers = 0;
  for (const row of rows) {
    const user = String(row[userCol] || '').trim().toLowerCase();
    if (!user) continue;
    const group = deptCol ? resolve(row[deptCol]) : roster.get(user);
    if (!group) {
      unmappedUsers++;
      continue;
    }
    const a = (acc[group] = acc[group] || { licensed: 0, activated: 0, activeWeekly: 0, retained30d: 0, powerUsers: 0, daysSum: 0, daysN: 0, featSum: 0 });
    a.licensed++;
    const last = toDate(row[lastCol], dateFormat);
    if (!last) continue;
    a.activated++;
    const age = daysBetween(last, date);
    const days = daysCol ? toNumber(row[daysCol]) : undefined;
    const feats = featureCols.filter((h) => {
      const d = toDate(row[h], dateFormat);
      const ago = d ? daysBetween(d, date) : -1;
      return ago >= 0 && ago <= 27;
    }).length;
    if (age >= 0 && age <= 29) a.retained30d++;
    if (age >= 0 && age <= 6) {
      a.activeWeekly++;
      a.featSum += feats;
      if (days !== undefined) {
        a.daysSum += days / 4;
        a.daysN++;
      }
      if (days !== undefined ? days / 4 >= 4 : feats >= 3) a.powerUsers++;
    }
  }
  const groups = Object.entries(acc).map(([group, a]) => ({
    group,
    licensed: a.licensed,
    activated: a.activated,
    activeWeekly: a.activeWeekly,
    avgActiveDays: a.daysN ? round(a.daysSum / a.daysN, 2) : null,
    avgFeatures: featureCols.length && a.activeWeekly ? round(a.featSum / a.activeWeekly, 2) : null,
    powerUsers: a.powerUsers,
    retained30d: a.retained30d,
  }));
  return { groups, unmappedUsers, featureColumns: featureCols.length };
}

function aggregated(headers, rows, { resolve }) {
  const col = Object.fromEntries(Object.keys(F).map((k) => [k, findColumn(headers, F[k])]));
  const groups = [];
  const unmapped = [];
  for (const row of rows) {
    const group = resolve(row[col.group]);
    if (!group) {
      unmapped.push(row[col.group]);
      continue;
    }
    const n = (k) => (col[k] ? toNumber(row[col[k]]) ?? null : null);
    groups.push({ group, licensed: n('licensed'), activated: n('activated'), activeWeekly: n('activeWeekly'), avgActiveDays: n('avgActiveDays'), avgFeatures: n('avgFeatures'), powerUsers: n('powerUsers'), retained30d: n('retained30d') });
  }
  return { groups, unmappedUsers: 0, unmappedGroups: unmapped };
}

function importUsage(dir, { from, date, tool, roster, sheet, write = false, dateFormat = 'dmy' } = {}) {
  if (!from) throw new CmoError('ARG_MISSING', { arg: 'from' });
  if (!tool) throw new CmoError('ARG_MISSING', { arg: 'tool' });
  if (!isDate(date)) throw new CmoError('ARG_MISSING', { arg: 'date' });
  const data = loadProject(dir);
  const resolve = groupResolver((data.groups && data.groups.groups) || []);
  const { headers, rows } = readTable(from, { sheet });
  let mode;
  let res;
  if (findColumn(headers, F.group) && findColumn(headers, F.licensed)) {
    mode = 'aggregated';
    res = aggregated(headers, rows, { resolve });
  } else if (findColumn(headers, F.user) && findColumn(headers, F.lastActivity)) {
    mode = 'per-user';
    res = perUser(headers, rows, { date, rosterFile: roster, resolve, dateFormat });
  } else throw new CmoError('IMPORT_MODE');

  const result = { mode, tool, date, ...res };
  if (!write) return { action: 'preview', ...result };
  const rel = `usage/${date}.json`;
  const snap = readJson(dir, rel, { optional: true }) || { schemaVersion: 1, tools: [] };
  snap.tools = (snap.tools || []).filter((t) => t.tool !== tool).concat([{ tool, groups: res.groups }]);
  const w = writeValidated(dir, { [rel]: snap });
  return { action: 'written', ...result, path: rel, validationWarnings: w.warnings };
}

module.exports = { importUsage };
