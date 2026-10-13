'use strict';
// Survey files for Google Forms (Apps Script) and Microsoft Forms (Quick Import .docx).
// Every item title starts with [QUESTION_ID] so exported columns map back exactly.
const { createZip } = require('./zip');

const OPTION_LABELS = {
  staff: { ar: 'موظف', en: 'Staff' },
  manager: { ar: 'مدير', en: 'Manager' },
  executive: { ar: 'تنفيذي', en: 'Executive' },
  never: { ar: 'أبدًا', en: 'Never' },
  monthly: { ar: 'شهريًا', en: 'Monthly' },
  weekly: { ar: 'أسبوعيًا', en: 'Weekly' },
  daily: { ar: 'يوميًا', en: 'Daily' },
};
const INTRO = {
  ar: 'هذا الاستبيان سري: لا نجمع الأسماء، والنتائج تُعرض على مستوى الأقسام فقط (5 أشخاص على الأقل). يستغرق 3 دقائق.',
  en: 'Confidential: no names are collected and results are reported by department only (at least 5 people). Takes 3 minutes.',
};

const both = (t) => (t && t.ar && t.en ? `${t.ar} / ${t.en}` : (t && (t.ar || t.en)) || '');
const optionText = (bank, v) => both((bank.optionLabels && bank.optionLabels[v]) || OPTION_LABELS[v] || { ar: v, en: v });
const scaleText = (bank, n) => `${n} - ${both(bank.scale[String(n)])}`;

function surveyItems(bank, groups, questionIds) {
  return (bank.questions || [])
    .filter((q) => !questionIds || questionIds.includes(q.id))
    .map((q) => {
      const title = `[${q.id}] ${both(q.text)}`;
      if (q.type === 'group') return { id: q.id, kind: 'dropdown', title, options: groups.map((g) => g.name), required: true };
      if (q.type === 'choice') return { id: q.id, kind: 'choice', title, options: (q.options || []).map((o) => optionText(bank, o)), required: false };
      if (q.type === 'likert')
        return { id: q.id, kind: 'scale', title, options: [1, 2, 3, 4, 5].map((n) => scaleText(bank, n)), low: both(bank.scale['1']), high: both(bank.scale['5']), required: true };
      return { id: q.id, kind: 'text', title, options: [], required: false };
    });
}

const J = (v) => JSON.stringify(v);

function googleAppsScript(title, items) {
  const lines = [
    '// Paste into https://script.google.com (New project), then Run ▶ createSurvey and allow access.',
    '// Creates an anonymous Google Form and a linked responses sheet; links appear in View ▶ Logs.',
    'function createSurvey() {',
    `  var form = FormApp.create(${J(title)});`,
    `  form.setDescription(${J(both(INTRO))});`,
    '  form.setCollectEmail(false);',
    '  form.setProgressBar(true);',
  ];
  for (const it of items) {
    if (it.kind === 'dropdown') lines.push(`  form.addListItem().setTitle(${J(it.title)}).setChoiceValues(${J(it.options)}).setRequired(${it.required});`);
    else if (it.kind === 'choice') lines.push(`  form.addMultipleChoiceItem().setTitle(${J(it.title)}).setChoiceValues(${J(it.options)}).setRequired(${it.required});`);
    else if (it.kind === 'scale') lines.push(`  form.addScaleItem().setTitle(${J(it.title)}).setBounds(1, 5).setLabels(${J(it.low)}, ${J(it.high)}).setRequired(${it.required});`);
    else lines.push(`  form.addParagraphTextItem().setTitle(${J(it.title)}).setRequired(false);`);
  }
  lines.push(
    `  var sheet = SpreadsheetApp.create(${J(title + ' — responses')});`,
    '  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());',
    "  Logger.log('Share with employees: ' + form.getPublishedUrl());",
    "  Logger.log('Edit form: ' + form.getEditUrl());",
    "  Logger.log('Responses sheet: ' + sheet.getUrl());",
    '}'
  );
  return lines.join('\n') + '\n';
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const para = (text, bold) =>
  `<w:p><w:pPr><w:bidi/></w:pPr><w:r><w:rPr>${bold ? '<w:b/>' : ''}<w:rtl/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;

// Quick Import reads numbered questions with lettered options; text questions have no options.
function msFormsDocx(title, items) {
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const body = [para(title, true), para(both(INTRO))];
  items.forEach((it, i) => {
    body.push(para(`${i + 1}. ${it.title}`));
    it.options.forEach((o, k) => body.push(para(`${LETTERS[k] || k + 1}. ${o}`)));
  });
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  return createZip({
    '[Content_Types].xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}"><w:body>${body.join('')}<w:sectPr/></w:body></w:document>`,
  });
}

function markdown(title, items) {
  const out = [`# ${title}`, '', both(INTRO), ''];
  items.forEach((it, i) => {
    out.push(`${i + 1}. ${it.title}${it.required ? ' *' : ''}`);
    for (const o of it.options) out.push(`   - ${o}`);
    if (it.kind === 'text') out.push('   - (نص حر / free text)');
  });
  return out.join('\n') + '\n';
}

module.exports = { OPTION_LABELS, both, optionText, scaleText, surveyItems, googleAppsScript, msFormsDocx, markdown };
