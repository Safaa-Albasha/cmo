'use strict';
const fs = require('fs');
const path = require('path');
const { CmoError, writeJson, loadProject } = require('./io');
const { isDate } = require('./util');
const { findWave } = require('./status');
const forms = require('./forms');

const TYPES = ['baseline', 'pulse'];

function createWave(dir, { wave, type, date, questions }) {
  if (!wave) throw new CmoError('ARG_MISSING', { arg: 'wave' });
  if (!TYPES.includes(type)) throw new CmoError('ENUM_INVALID', { file: 'wave', field: 'type', allowed: TYPES.join(', ') });
  if (!isDate(date)) throw new CmoError('DATE_INVALID', { file: 'wave', field: 'date' });
  if (fs.existsSync(path.join(dir, 'surveys', wave, 'meta.json'))) throw new CmoError('WAVE_EXISTS', { wave });
  const data = loadProject(dir);
  const ids = questions && questions.length ? questions : ((data.bank && data.bank.questions) || []).map((q) => q.id);
  writeJson(dir, `surveys/${wave}/meta.json`, { schemaVersion: 1, type, date, questions: ids });
  return { wave, type, date, questions: ids.length };
}

function generateSurvey(dir, { wave }) {
  const data = loadProject(dir);
  const w = findWave(data.waves, wave);
  const groups = (data.groups && data.groups.groups) || [];
  if (!groups.length) throw new CmoError('GROUPS_REQUIRED');
  const items = forms.surveyItems(data.bank, groups, w.meta.questions);
  const title = `${data.project.name} — ${wave}`;
  const base = path.join(dir, 'drafts', `survey-${wave}`);
  fs.mkdirSync(path.dirname(base), { recursive: true });
  const files = [`${base}-google.gs`, `${base}-msforms.docx`, `${base}.md`];
  fs.writeFileSync(files[0], forms.googleAppsScript(title, items), 'utf8');
  fs.writeFileSync(files[1], forms.msFormsDocx(title, items));
  fs.writeFileSync(files[2], forms.markdown(title, items), 'utf8');
  return { wave, items: items.length, files };
}

function generateTimingForm(dir) {
  const data = loadProject(dir);
  const procs = (data.processes && data.processes.processes) || [];
  if (!procs.length) throw new CmoError('PROCESSES_REQUIRED');
  const items = [
    { id: 'PROCESS', kind: 'dropdown', title: '[PROCESS] العملية / Process', options: procs.map((p) => p.name), required: true },
    { id: 'PHASE', kind: 'choice', title: '[PHASE] المرحلة / Phase', options: ['قبل الذكاء الاصطناعي / Before AI', 'بعد الذكاء الاصطناعي / With AI'], required: true },
    { id: 'MINUTES', kind: 'number', title: '[MINUTES] الوقت (دقائق) / Minutes', options: [], required: true },
    { id: 'ERRORS', kind: 'choice', title: '[ERRORS] هل حدث خطأ؟ / Any errors?', options: ['نعم / Yes', 'لا / No'], required: false },
  ];
  const title = `${data.project.name} — قياس وقت العمليات / Process timing`;
  const base = path.join(dir, 'drafts', 'timing-form');
  fs.mkdirSync(path.dirname(base), { recursive: true });
  const files = [`${base}-google.gs`, `${base}-msforms.docx`, `${base}.md`];
  fs.writeFileSync(files[0], forms.googleAppsScript(title, items), 'utf8');
  fs.writeFileSync(files[1], forms.msFormsDocx(title, items));
  fs.writeFileSync(files[2], forms.markdown(title, items), 'utf8');
  return { processes: procs.length, files };
}

module.exports = { createWave, generateSurvey, generateTimingForm };
