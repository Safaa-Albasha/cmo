'use strict';
// Privacy promise: what we tell employees, built only from project settings and the rules the engine enforces.
// Every sentence here must stay true of the code in privacy.js, responses.js, forms.js and status.js.
const fs = require('fs');
const path = require('path');
const { loadProject } = require('./io');
const { settings } = require('./status');

const TEMPLATE = path.join(__dirname, '..', 'templates', 'privacy-sheet.html');

// Arabic counted noun: 3–10 take the plural (5 أشخاص), 11+ the singular accusative (11 شخصًا).
const arCount = (n, plural, singular) => `${n} ${n >= 3 && n <= 10 ? plural : singular}`;
const arPeople = (n) => arCount(n, 'أشخاص', 'شخصًا');
const arMinutes = (n) => (n === 2 ? 'دقيقتين' : arCount(n, 'دقائق', 'دقيقة'));

// Rough answering time: closed items ~10 s, open comments ~60 s; at least 2 minutes.
function estimateMinutes(bank, questionIds) {
  const qs = ((bank && bank.questions) || []).filter((q) => !questionIds || questionIds.includes(q.id));
  if (!qs.length) return null;
  const seconds = qs.reduce((s, q) => s + (q.type === 'open' ? 60 : 10), 0);
  return Math.max(2, Math.ceil(seconds / 60));
}

function facts(project, bank, questionIds) {
  const qs = ((bank && bank.questions) || []).filter((q) => !questionIds || questionIds.includes(q.id));
  return {
    programme: project.name || '',
    changeManager: project.changeManager || null,
    minGroupSize: settings(project).min,
    asksRole: qs.some((q) => q.id === 'ROLE'),
    hasComments: qs.some((q) => q.type === 'open'),
    minutes: estimateMinutes(bank, questionIds),
  };
}

// One short paragraph for the top of every survey and form.
function intro(project, { minutes = null, comments = true } = {}) {
  const min = settings(project || {}).min;
  const t = {
    ar: `هذا الاستبيان سري: لا نسأل عن اسمك، والنتائج تُعرض على مستوى المجموعات فقط، ولا تُعرض نتائج أي مجموعة فيها أقل من ${arPeople(min)}.`,
    en: `Confidential: we do not ask your name, results are shown by group only, and no group with fewer than ${min} people is ever shown.`,
  };
  if (comments) {
    t.ar += ' تُحذف الإيميلات وأرقام الهواتف والروابط والأسماء من التعليقات.';
    t.en += ' Emails, phone numbers, links and names are removed from comments.';
  }
  if (minutes) {
    t.ar += ` يستغرق حوالي ${arMinutes(minutes)}.`;
    t.en += ` Takes about ${minutes} minutes.`;
  }
  return t;
}

function sections(f) {
  const min = f.minGroupSize;
  const out = [
    {
      ar: ['ماذا نجمع', [
        `مجموعتك (القسم أو الفريق)${f.asksRole ? '، ودورك (موظف أو مدير أو تنفيذي)' : ''}.`,
        'إجاباتك على عبارات من 1 إلى 5.',
        ...(f.hasComments ? ['تعليقاتك المكتوبة، إن أردت أن تكتب.'] : []),
        'لا نسأل عن اسمك أو إيميلك، ونموذج Google لا يجمع الإيميل.',
      ]],
      en: ['What we collect', [
        `Your group (department or team)${f.asksRole ? ' and your role (staff, manager or executive)' : ''}.`,
        'Your answers to statements on a 1–5 scale.',
        ...(f.hasComments ? ['Your written comments, if you choose to write any.'] : []),
        'We do not ask for your name or email, and the Google form does not collect emails.',
      ]],
    },
    {
      ar: ['إذا سجّل النظام اسمك أو إيميلك', [
        'بعض أنظمة النماذج تسجّل الاسم أو الإيميل تلقائيًا. نستخدمه مرة واحدة فقط لتكوين رمز مستعار مشفّر بمفتاح سري، حتى لا تُحسب إجابتك مرتين، ولحذف اسمك من تعليقاتك.',
        'بعدها يُحذف الاسم والإيميل ولا يُحفظان في أي ملف.',
        'المفتاح السري محفوظ لدى فريق البرنامج فقط، ولا يستطيع المساعد الذكي قراءته.',
      ]],
      en: ['If the form system records your name or email', [
        'Some form systems record names or emails automatically. We use them once, only to create an encrypted pseudonym with a secret key (so your answers are not counted twice) and to remove your name from your comments.',
        'The name and email are then dropped and never saved in any file.',
        'The secret key stays with the programme team only; the AI assistant is blocked from reading it.',
      ]],
    },
    {
      ar: ['كيف تُعرض النتائج', [
        'على مستوى المجموعات فقط، ولا تُعرض إجابات أي شخص بمفرده.',
        `أي مجموعة فيها أقل من ${arPeople(min)} لا تُعرض نتائجها في أي رقم أو تقرير.`,
        'بيانات استخدام أدوات الذكاء الاصطناعي تُعرض كإجماليات للمجموعات فقط، ولا نعرض من يستخدم ومن لا يستخدم.',
      ]],
      en: ['How results are shown', [
        'By group only — no one\'s individual answers are ever shown.',
        `Any group with fewer than ${min} people is hidden from every figure and report.`,
        'AI-tool usage data is shown as group totals only; we never list who is or is not using the tools.',
      ]],
    },
  ];
  if (f.hasComments) {
    out.push({
      ar: ['التعليقات', [
        'قبل حفظ أي تعليق تُحذف منه الإيميلات وأرقام الهواتف (بالأرقام العربية أو الإنجليزية) والروابط واسمك.',
        'إذا اقتُبس تعليق في تقرير، يمر بنفس التنظيف مرة أخرى.',
      ]],
      en: ['Comments', [
        'Before any comment is saved, emails, phone numbers (Arabic or Western digits), links and your name are removed.',
        'If a comment is quoted in a report, it goes through the same cleaning again.',
      ]],
    });
  }
  out.push({
    ar: ['من يرى ماذا', [
      `فريق إدارة التغيير${f.changeManager ? ` (${f.changeManager})` : ''} يرى النتائج على مستوى المجموعات ليخطط للدعم والتدريب.`,
      'التقارير التي تُشارك مع المديرين والرعاة تحتوي نتائج المجموعات فقط.',
      'الهدف تحسين الدعم المقدّم لك، وليس تقييم أداء أي شخص.',
    ]],
    en: ['Who sees what', [
      `The change management team${f.changeManager ? ` (${f.changeManager})` : ''} sees group-level results to plan support and training.`,
      'Reports shared with managers and sponsors contain group-level results only.',
      'The purpose is to improve the support you get, not to evaluate anyone\'s performance.',
    ]],
  });
  return out;
}

function markdown(f) {
  const lines = [`# وعد الخصوصية / Privacy promise — ${f.programme}`, ''];
  for (const lang of ['ar', 'en']) {
    lines.push(lang === 'ar' ? '## العربية' : '## English', '');
    for (const s of sections(f)) {
      const [h, items] = s[lang];
      lines.push(`### ${h}`, '', ...items.map((x) => `- ${x}`), '');
    }
  }
  return lines.join('\n');
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function html(f) {
  const col = (lang) =>
    sections(f)
      .map((s) => `<section><h2>${esc(s[lang][0])}</h2><ul>${s[lang][1].map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`)
      .join('');
  return fs
    .readFileSync(TEMPLATE, 'utf8')
    .split('__TITLE__').join(esc(f.programme))
    .split('__MIN_AR__').join(arPeople(f.minGroupSize))
    .split('__MIN__').join(String(f.minGroupSize))
    .replace('__AR__', col('ar'))
    .replace('__EN__', col('en'));
}

function writeSheet(dir) {
  const data = loadProject(dir);
  const f = facts(data.project, data.bank);
  const base = path.join(dir, 'drafts', 'privacy-sheet');
  fs.mkdirSync(path.dirname(base), { recursive: true });
  const files = [`${base}.md`, `${base}.html`];
  fs.writeFileSync(files[0], markdown(f), 'utf8');
  fs.writeFileSync(files[1], html(f), 'utf8');
  return { minGroupSize: f.minGroupSize, files };
}

module.exports = { arPeople, estimateMinutes, facts, intro, sections, markdown, html, writeSheet };
