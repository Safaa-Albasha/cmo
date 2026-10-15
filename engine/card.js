'use strict';
// Sponsor card: one screen (readiness, reach, hours saved with evidence, one ask) and a 60-second spoken script.
// Every number comes from status(); the text only fills fixed slots.
const fs = require('fs');
const path = require('path');
const { CmoError, loadProject, readJson } = require('./io');
const { validate } = require('./validate');
const { status, settings } = require('./status');
const util = require('./util');

const TEMPLATE = path.join(__dirname, '..', 'templates', 'card.html');

const RAG = { green: { ar: 'أخضر', en: 'green' }, amber: { ar: 'أصفر', en: 'amber' }, red: { ar: 'أحمر', en: 'red' } };
const ELEMENT = {
  awareness: { ar: 'الوعي', en: 'Awareness' },
  desire: { ar: 'الرغبة', en: 'Desire' },
  knowledge: { ar: 'المعرفة', en: 'Knowledge' },
  ability: { ar: 'القدرة', en: 'Ability' },
  reinforcement: { ar: 'التعزيز', en: 'Reinforcement' },
};
const SPOKEN = {
  confirmed: { ar: 'مؤكد إحصائيًا', en: 'statistically confirmed' },
  preliminary: { ar: 'نتيجة أولية', en: 'preliminary' },
  estimate: { ar: 'تقدير', en: 'an estimate' },
};
const EVIDENCE = {
  confirmed: { ar: 'مؤكد إحصائيًا ✔', en: 'statistically confirmed ✔' },
  preliminary: { ar: 'نتيجة أولية', en: 'preliminary' },
  estimate: { ar: 'تقدير', en: 'estimate' },
};

// Value evidence for the card: confirmed when ≥ 80% of monthly value comes from processes with confirmed evidence,
// preliminary when ≥ 50% is measured (timed samples), otherwise estimate.
function valueEvidence(val) {
  const procs = (val && val.processes) || [];
  const total = util.sum(procs.map((p) => Math.max(0, p.valuePerMonth || 0)));
  if (!total) return 'estimate';
  const confirmed = util.sum(procs.filter((p) => p.evidence && p.evidence.status === 'confirmed').map((p) => Math.max(0, p.valuePerMonth || 0)));
  if ((confirmed / total) * 100 >= 80) return 'confirmed';
  if ((val.totals.measuredValueShare || 0) >= 50) return 'preliminary';
  return 'estimate';
}

// "عربي / English" names → the part for each language.
function localName(name) {
  const parts = String(name || '').split(' / ');
  return parts.length === 2 ? { ar: parts[0].trim(), en: parts[1].trim() } : { ar: name || '', en: name || '' };
}

const groupName = (groups, id) => {
  const g = groups.find((x) => x.id === id);
  return g && g.name ? g.name : id;
};

function pickAsk(st, approvals) {
  const pending = (approvals || []).filter((a) => a.status === 'pending');
  if (pending.length) {
    const t = pending[0].title || pending[0].id;
    const title = typeof t === 'string' ? { ar: t, en: t } : { ar: t.ar || t.en, en: t.en || t.ar };
    const more = pending.length - 1;
    return {
      source: 'approval',
      id: pending[0].id,
      ar: `قرار مطلوب: ${title.ar}${more ? ` (وقرارات أخرى معلّقة: ${more})` : ''}`,
      en: `Decision needed: ${title.en}${more ? ` (+${more} more pending)` : ''}`,
    };
  }
  const gap = st.plan && st.plan.gaps[0];
  if (gap) {
    const g = groupName(st.groups, gap.group);
    const e = ELEMENT[gap.barrier] || { ar: gap.barrier, en: gap.barrier };
    return { source: 'gap', group: gap.group, ar: `اعتماد نشاط لمجموعة ${g} لمعالجة عائق ${e.ar}`, en: `Back an activity for ${g} to address its ${e.en} barrier` };
  }
  const late = st.plan && st.plan.overdue[0];
  if (late) {
    const t = late.title && typeof late.title === 'object' ? late.title : { ar: late.title || late.id, en: late.title || late.id };
    return { source: 'overdue', id: late.id, ar: `دعم إنجاز نشاط متأخر: ${t.ar || t.en}`, en: `Help unblock an overdue activity: ${t.en || t.ar}` };
  }
  return { source: 'none', ar: 'لا يوجد قرار مطلوب هذا الشهر؛ استمر في الرعاية الظاهرة', en: 'No decision needed this month; keep your sponsorship visible' };
}

function buildCard(data, { today, approvals } = {}) {
  const p = data.project;
  const day = today || util.today(settings(p).timezone);
  const st = status(data, { today: day });
  const r = st.readiness.latest && st.readiness.latest.overall;
  const reach = st.adoption.latest ? st.adoption.latest.overall.reach : null;
  const t = st.value && st.value.totals;
  return {
    name: localName(p.name),
    currency: p.currency,
    today: day,
    usageDate: st.adoption.latest ? st.adoption.latest.date : null,
    latestWave: st.waves.latest,
    readiness: r && r.score !== null && r.score !== undefined ? { score: r.score, rag: r.rag, delta: st.compare.readiness ? st.compare.readiness.score.delta : null } : null,
    reach: reach !== null && reach !== undefined ? { pct: reach, delta: st.compare.adoption ? st.compare.adoption.reach.delta : null } : null,
    value: t ? { hoursPerMonth: t.hoursPerMonth, valuePerMonth: t.valuePerMonth, roiPct: t.roiPct, paybackMonths: t.paybackMonths, evidence: valueEvidence(st.value) } : null,
    ask: pickAsk(st, approvals),
  };
}

const num = (n, d = 0) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 }));
const signed = (n, d = 1) => (n === null || n === undefined ? '' : `${n > 0 ? '+' : n < 0 ? '−' : '±'}${num(Math.abs(n), d)}`);

function script(c) {
  const ar = [`ملخص برنامج ${c.name.ar} حتى ${c.today}.`];
  const en = [`Update on ${c.name.en}, as of ${c.today}.`];
  if (c.readiness) {
    const d = c.readiness.delta;
    ar.push(`الجاهزية ${num(c.readiness.score, 1)} من 100، والمؤشر ${RAG[c.readiness.rag].ar}${d !== null ? `، بتغيّر ${signed(d)} نقطة منذ البداية` : ''}.`);
    en.push(`Readiness is ${num(c.readiness.score, 1)} out of 100, ${RAG[c.readiness.rag].en}${d !== null ? `, ${signed(d)} points since the start` : ''}.`);
  }
  if (c.reach) {
    ar.push(`${num(c.reach.pct, 1)}٪ من المرخّص لهم يستخدمون الأدوات أسبوعيًا.`);
    en.push(`${num(c.reach.pct, 1)}% of licensed staff use the tools every week.`);
  }
  if (c.value) {
    const ev = SPOKEN[c.value.evidence];
    ar.push(`الوقت الموفّر ${num(c.value.hoursPerMonth)} ساعة شهريًا، بقيمة ${num(c.value.valuePerMonth)} ${c.currency}، والعائد ${num(c.value.roiPct, 1)}٪ (${ev.ar}).`);
    en.push(`Time saved is ${num(c.value.hoursPerMonth)} hours a month, worth ${num(c.value.valuePerMonth)} ${c.currency}, a return of ${num(c.value.roiPct, 1)}% (${ev.en}).`);
  }
  ar.push(`المطلوب منك: ${c.ask.ar}.`);
  en.push(`What I need from you: ${c.ask.en}.`);
  return { ar: ar.join(' '), en: en.join(' ') };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const L = {
  ar: { title: 'ملخص للراعي', readiness: 'الجاهزية', of100: 'من 100', reach: 'الاستخدام الأسبوعي', ofLicensed: 'من المرخّص لهم', hours: 'ساعات موفّرة شهريًا', value: 'القيمة الشهرية', roi: 'العائد', payback: 'الاسترداد', months: 'شهر', ask: 'المطلوب منك', pts: 'نقطة', since: 'منذ البداية', asOf: 'حتى', usage: 'بيانات الاستخدام', noData: 'لا توجد بيانات بعد' },
  en: { title: 'Sponsor brief', readiness: 'Readiness', of100: 'out of 100', reach: 'Weekly use', ofLicensed: 'of licensed staff', hours: 'Hours saved / month', value: 'Value / month', roi: 'ROI', payback: 'Payback', months: 'months', ask: 'What I need from you', pts: 'pts', since: 'since start', asOf: 'as of', usage: 'usage data', noData: 'No data yet' },
};

function renderCard(c, lang) {
  const l = L[lang];
  const tile = (label, big, sub, cls = '') => `<div class="tile ${cls}"><div class="label">${esc(label)}</div><div class="big">${big}</div><div class="sub">${sub}</div></div>`;
  const tiles = [
    c.readiness
      ? tile(l.readiness, `${num(c.readiness.score, 1)}<small> ${esc(l.of100)}</small>`, `<span class="rag ${c.readiness.rag}">${esc(RAG[c.readiness.rag][lang])}</span>${c.readiness.delta !== null ? ` · ${esc(signed(c.readiness.delta))} ${esc(l.since)}` : ''}`)
      : tile(l.readiness, '—', esc(l.noData)),
    c.reach
      ? tile(l.reach, `${num(c.reach.pct, 1)}%`, `${esc(l.ofLicensed)}${c.reach.delta !== null ? ` · ${esc(signed(c.reach.delta))} ${esc(l.pts)} ${esc(l.since)}` : ''}`)
      : tile(l.reach, '—', esc(l.noData)),
    c.value
      ? tile(l.hours, num(c.value.hoursPerMonth), `<span class="ev ${c.value.evidence}">${esc(EVIDENCE[c.value.evidence][lang])}</span>`)
      : tile(l.hours, '—', esc(l.noData)),
  ].join('');
  const valueLine = c.value
    ? `<p class="value">${esc(l.value)}: <b>${num(c.value.valuePerMonth)} ${esc(c.currency)}</b> · ${esc(l.roi)}: <b>${num(c.value.roiPct, 1)}%</b>${c.value.paybackMonths !== null && c.value.paybackMonths !== undefined ? ` · ${esc(l.payback)}: <b>${num(c.value.paybackMonths, 1)} ${esc(l.months)}</b>` : ''} <span class="ev ${c.value.evidence}">${esc(EVIDENCE[c.value.evidence][lang])}</span></p>`
    : '';
  const ltr = (x) => `<span dir="ltr">${esc(x)}</span>`;
  const foot = `${esc(l.asOf)} ${ltr(c.today)}${c.usageDate ? ` · ${esc(l.usage)} ${ltr(c.usageDate)}` : ''}`;
  return fs
    .readFileSync(TEMPLATE, 'utf8')
    .split('__LANG__').join(lang)
    .split('__DIR__').join(lang === 'ar' ? 'rtl' : 'ltr')
    .split('__TITLE__').join(esc(l.title))
    .split('__NAME__').join(esc(c.name[lang]))
    .replace('__TILES__', tiles)
    .replace('__VALUE__', valueLine)
    .replace('__ASK_LABEL__', esc(l.ask))
    .replace('__ASK__', esc(c.ask[lang]))
    .replace('__FOOT__', foot);
}

function writeCard(dir, { today, lang, out } = {}) {
  const data = loadProject(dir);
  const v = validate(data);
  if (!v.ok) throw new CmoError('VALIDATION_FAILED', { count: v.errors.length }, null, v.errors);
  const ap = readJson(dir, 'approvals.json', { optional: true });
  const c = buildCard(data, { today, approvals: ap ? ap.approvals : [] });
  const language = lang === 'ar' || lang === 'en' ? lang : data.project.language;
  const target = out || path.join(dir, 'reports', `${c.today}-sponsor-card.html`);
  const brief = target.replace(/-card\.html$|\.html$/, '') + '-brief.md';
  const s = script(c);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, renderCard(c, language), 'utf8');
  fs.writeFileSync(brief, `# ${L.ar.title} / ${L.en.title} — ${c.name.ar} / ${c.name.en} · ${c.today}\n\n## العربية\n\n${s.ar}\n\n## English\n\n${s.en}\n`, 'utf8');
  return { path: target, brief, lang: language, card: c, words: { ar: s.ar.split(/\s+/).length, en: s.en.split(/\s+/).length } };
}

module.exports = { localName, valueEvidence, pickAsk, buildCard, script, renderCard, writeCard };
