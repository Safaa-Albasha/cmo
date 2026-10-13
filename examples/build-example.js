#!/usr/bin/env node
'use strict';
// Builds examples/ai-adoption/.cmo deterministically: a fictional 400-person company
// rolling out Microsoft 365 Copilot and Claude. Re-run after changing the scenario.
const fs = require('fs');
const path = require('path');
const { pseudonym } = require('../engine/privacy');
const { addDays } = require('../engine/util');

const OUT = path.join(__dirname, 'ai-adoption', '.cmo');
const SALT = 'example-salt-not-secret';
const TPL = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'templates', 'ai-adoption', f), 'utf8'));

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261013);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r2 = (v) => Math.round(v * 100) / 100;

const write = (rel, data) => {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
};

const GROUPS = [
  { id: 'FIN', name: 'المالية / Finance', headcount: 60, impactLevel: 4 },
  { id: 'HR', name: 'الموارد البشرية / Human Resources', headcount: 40, impactLevel: 3 },
  { id: 'OPS', name: 'العمليات وخدمة العملاء / Operations & Customer Service', headcount: 150, impactLevel: 5 },
  { id: 'SALES', name: 'المبيعات / Sales', headcount: 100, impactLevel: 4 },
  { id: 'IT', name: 'تقنية المعلومات / IT', headcount: 45, impactLevel: 2 },
  { id: 'LEGAL', name: 'الشؤون القانونية / Legal', headcount: 4, impactLevel: 3 },
];

// ADKAR means [A, D, K, Ab, R] per wave.
const PROFILE = {
  FIN: [[3.4, 2.4, 2.6, 2.3, 2.2], [3.8, 2.8, 3.2, 2.9, 2.6], [4.1, 3.4, 3.7, 3.4, 3.1]],
  HR: [[3.9, 3.5, 2.7, 2.5, 2.4], [4.1, 3.8, 3.4, 3.1, 2.9], [4.3, 4.0, 3.8, 3.6, 3.3]],
  OPS: [[2.6, 2.9, 2.4, 2.2, 2.1], [3.3, 3.1, 2.9, 2.7, 2.5], [3.9, 3.5, 3.4, 3.2, 3.0]],
  SALES: [[3.6, 3.7, 2.9, 2.6, 2.5], [3.9, 3.9, 3.4, 3.2, 2.9], [4.2, 4.1, 3.8, 3.7, 3.4]],
  IT: [[4.3, 4.2, 3.8, 3.6, 3.2], [4.4, 4.3, 4.1, 4.0, 3.6], [4.5, 4.4, 4.3, 4.2, 3.9]],
  LEGAL: [[3, 3, 3, 3, 3], [3.2, 3.2, 3.2, 3.2, 3.2], [3.5, 3.5, 3.5, 3.5, 3.5]],
};
const ITEMS = [['A1', 'A2'], ['D1', 'D2'], ['K1', 'K2'], ['AB1', 'AB2'], ['R1', 'R2']];
const ELEMENTS = ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement'];
const WAVES = [
  { id: 'baseline', type: 'baseline', date: '2026-03-01', rate: 0.6 },
  { id: 'pulse-1', type: 'pulse', date: '2026-05-01', rate: 0.55 },
  { id: 'pulse-2', type: 'pulse', date: '2026-07-01', rate: 0.5 },
];

// Comment pool: [ar, en, sentiment, themes, adkar].
const COMMENTS = [
  ['أخاف أن يأخذ الذكاء الاصطناعي جزءًا من وظيفتي', 'I worry AI will take part of my job', -1, ['job-security'], 'desire'],
  ['لا أعرف ما المسموح إدخاله من بيانات العملاء', "I don't know which customer data I'm allowed to enter", -1, ['policy-clarity', 'privacy'], 'knowledge'],
  ['التدريب كان سريعًا ولم يكفِ لأتعلم', 'The training was too short for me to learn', -1, ['skills-gap'], 'knowledge'],
  ['النتائج أحيانًا غير دقيقة وأحتاج وقتًا للمراجعة', 'Results are sometimes inaccurate and need review time', -1, ['trust', 'workload'], 'ability'],
  ['لا يوجد وقت لتجربة الأداة مع ضغط العمل', 'No time to try the tool with this workload', -1, ['workload'], 'ability'],
  ['مديري لا يهتم إن استخدمناها أو لا', "My manager doesn't care whether we use it", -1, ['manager-support'], 'reinforcement'],
  ['وفرت ساعات في كتابة التقارير', 'It saved me hours writing reports', 1, ['productivity'], null],
  ['أحتاج أمثلة جاهزة خاصة بعملنا', 'I need ready examples specific to our work', 0, ['skills-gap'], 'knowledge'],
  ['سفير القسم ساعدني كثيرًا', 'Our department champion helped me a lot', 1, ['manager-support'], 'ability'],
  ['الأداة سهلة وصرت أستخدمها يوميًا', 'The tool is easy and I use it daily now', 1, ['tool-quality', 'productivity'], null],
  ['أريد سياسة واضحة مكتوبة', 'I want a clear written policy', 0, ['policy-clarity', 'governance'], 'knowledge'],
  ['الردود على العملاء صارت أسرع', 'Replies to customers became faster', 1, ['productivity'], null],
];
// Theme weights per group (index into COMMENTS), shifting more positive each wave.
const NEG = { FIN: [0, 0, 3, 1], HR: [2, 7, 10], OPS: [4, 3, 2, 0], SALES: [7, 5], IT: [3, 10], LEGAL: [1, 10] };
const POS = [6, 8, 9, 11];

const project = {
  schemaVersion: 1,
  name: 'تبنّي الذكاء الاصطناعي في شركة النخبة / AI Adoption at Al Nukhba Co.',
  type: 'ai-adoption',
  description: 'Rollout of Microsoft 365 Copilot and Claude to 400 employees',
  language: 'ar',
  currency: 'SAR',
  startDate: '2026-02-01',
  endDate: '2026-12-31',
  sponsor: 'الرئيس التنفيذي للعمليات / COO',
  changeManager: 'سارة / Sara',
  privacy: { minGroupSize: 5 },
  thresholds: { barrier: 3, confidence: 0.7, readinessGreen: 70, readinessAmber: 50 },
  weights: { adkar: 0.5, sentiment: 0.2, adoption: 0.3 },
  tools: [
    { id: 'copilot', name: 'Microsoft 365 Copilot', licenses: 320, costPerLicensePerMonth: 113 },
    { id: 'claude', name: 'Claude Team', licenses: 90, costPerLicensePerMonth: 113 },
  ],
  investment: { oneTime: 180000, amortizationMonths: 12 },
};

write('project.json', project);
write('groups.json', { schemaVersion: 1, groups: GROUPS });
write('plan.json', TPL('plan.json'));
write('surveys/bank.json', TPL('bank.json'));
write('sponsors.json', { schemaVersion: 1, sponsor: { name: project.sponsor }, coalition: [], champions: [] });
write('resistance.json', { schemaVersion: 1, entries: [] });
write('approvals.json', { schemaVersion: 1, approvals: [] });
write('decisions.json', { schemaVersion: 1, decisions: [] });

// Employees with stable pseudonymous keys across waves.
const employees = [];
for (const g of GROUPS) for (let i = 0; i < g.headcount; i++) employees.push({ key: pseudonym(`${g.id.toLowerCase()}${i}@nukhba.example`, SALT), group: g.id, lang: rnd() < 0.7 ? 'ar' : 'en' });

WAVES.forEach((w, wi) => {
  const responses = [];
  const labels = [];
  for (const e of employees) {
    if (rnd() > w.rate && e.group !== 'LEGAL') continue;
    const prof = PROFILE[e.group][wi];
    const answers = { GROUP: e.group, ROLE: rnd() < 0.15 ? 'manager' : 'staff' };
    ITEMS.forEach((pair, k) => pair.forEach((q) => (answers[q] = clamp(Math.round(prof[k] + (rnd() + rnd() - 1) * 1.2), 1, 5))));
    answers.T1 = clamp(Math.round(prof[2] + (rnd() - 0.5)), 1, 5);
    answers.P1 = clamp(Math.round(prof[2] + (rnd() - 0.5)), 1, 5);
    answers.USE = pick(wi === 0 ? ['never', 'never', 'monthly', 'weekly'] : wi === 1 ? ['never', 'monthly', 'weekly', 'weekly'] : ['monthly', 'weekly', 'daily', 'daily']);
    if (rnd() < 0.5) {
      const positive = rnd() < 0.25 + wi * 0.2;
      const c = COMMENTS[positive ? pick(POS) : pick(NEG[e.group])];
      answers.O1 = e.lang === 'ar' ? c[0] : c[1];
      const confidence = r2(0.55 + rnd() * 0.43);
      labels.push({ id: `${e.key}:O1`, sentiment: c[2], themes: c[3], adkar: c[4], confidence, reviewed: confidence < 0.7 && rnd() < 0.5 });
    }
    responses.push({ key: e.key, group: e.group, role: answers.ROLE, answers });
  }
  write(`surveys/${w.id}/meta.json`, { schemaVersion: 1, type: w.type, date: w.date, questions: Object.keys(responses[0].answers) });
  write(`surveys/${w.id}/responses.json`, { schemaVersion: 1, responses });
  // Leave the last 15 comments of the latest wave unlabeled to show the classification queue.
  write(`surveys/${w.id}/sentiment.json`, { schemaVersion: 1, labels: wi === WAVES.length - 1 ? labels.slice(0, -15) : labels });
});

// Monthly usage snapshots, February–July.
const LIC = { FIN: { copilot: 50, claude: 10 }, HR: { copilot: 35 }, OPS: { copilot: 120 }, SALES: { copilot: 80, claude: 20 }, IT: { copilot: 30, claude: 45 }, LEGAL: { copilot: 3 } };
const REACH = { FIN: [0.15, 0.62], HR: [0.25, 0.7], OPS: [0.1, 0.58], SALES: [0.3, 0.78], IT: [0.55, 0.9], LEGAL: [0.3, 0.6] };
const ends = ['2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30', '2026-07-31'];
ends.forEach((date, m) => {
  const f = m / (ends.length - 1);
  const tools = ['copilot', 'claude'].map((tool) => ({
    tool,
    groups: GROUPS.filter((g) => LIC[g.id][tool]).map((g) => {
      const licensed = LIC[g.id][tool];
      const reach = REACH[g.id][0] + (REACH[g.id][1] - REACH[g.id][0]) * f;
      const activeWeekly = Math.round(licensed * reach);
      const activated = Math.min(licensed, Math.round(activeWeekly * (1.35 - 0.2 * f)));
      return {
        group: g.id,
        licensed,
        activated,
        activeWeekly,
        avgActiveDays: r2(1.4 + 2.2 * f + rnd() * 0.3),
        avgFeatures: r2(1.5 + 2.5 * f + rnd() * 0.4),
        powerUsers: Math.round(activeWeekly * (0.1 + 0.3 * f)),
        retained30d: Math.round(activated * (0.55 + 0.3 * f)),
      };
    }),
  }));
  write(`usage/${date}.json`, { schemaVersion: 1, tools });
});

// Processes: estimates + timed samples.
write('processes.json', {
  schemaVersion: 1,
  processes: [
    { id: 'PR1', name: 'تقرير المبيعات الشهري / Monthly sales report', group: 'SALES', owner: 'Sales ops', frequencyPerMonth: 40, hourlyCost: 120, baseline: { minutes: 360, errorRate: 12 }, after: { minutes: 90, errorRate: 6 } },
    { id: 'PR2', name: 'الرد على استفسار عميل / Customer inquiry reply', group: 'OPS', owner: 'Service lead', frequencyPerMonth: 3000, hourlyCost: 60, baseline: { minutes: 25, errorRate: 8 }, after: { minutes: 9, errorRate: 5 } },
    { id: 'PR3', name: 'مطابقة الفواتير / Invoice reconciliation', group: 'FIN', owner: 'AP lead', frequencyPerMonth: 400, hourlyCost: 110, baseline: { minutes: 18, errorRate: 4 }, after: { minutes: 11, errorRate: 3 } },
    { id: 'PR4', name: 'صياغة الوصف الوظيفي / Job description drafting', group: 'HR', owner: 'HR BP', frequencyPerMonth: 15, hourlyCost: 100, baseline: { minutes: 120 }, after: { minutes: 40 } },
    { id: 'PR5', name: 'ملخص مراجعة الكود / Code review summary', group: 'IT', owner: 'Eng manager', frequencyPerMonth: 200, hourlyCost: 150, baseline: { minutes: 30 }, after: { minutes: 26 } },
  ],
});
const samples = (spec) =>
  spec.flatMap(([phase, n, m, sd, err]) =>
    Array.from({ length: n }, (_, i) => ({ phase, minutes: r2(Math.max(1, m + (rnd() + rnd() + rnd() - 1.5) * sd)), errors: rnd() < err ? 1 : 0, date: addDays(phase === 'before' ? '2026-02-02' : '2026-06-01', i * 2) }))
  );
write('samples/PR1.json', { schemaVersion: 1, samples: samples([['before', 8, 350, 40, 0.12], ['after', 8, 95, 20, 0.05]]) });
write('samples/PR2.json', { schemaVersion: 1, samples: samples([['before', 12, 24, 6, 0.08], ['after', 12, 8.5, 3, 0.04]]) });
write('samples/PR3.json', { schemaVersion: 1, samples: samples([['before', 6, 18, 4, 0.05], ['after', 3, 11, 2, 0.03]]) });
write('samples/PR5.json', { schemaVersion: 1, samples: samples([['before', 6, 30, 12, 0], ['after', 6, 26, 12, 0]]) });
for (const d of ['drafts', 'reports']) {
  fs.mkdirSync(path.join(OUT, d), { recursive: true });
  fs.writeFileSync(path.join(OUT, d, '.gitkeep'), '');
}
console.log('example written to', OUT);
