'use strict';
// Classification loop: list unlabeled comments → Claude labels them → merge labels → manager reviews low-confidence ones.
const { CmoError, loadProject } = require('./io');
const { format } = require('./i18n');
const { ELEMENTS } = require('./adkar');
const { unlabeledComments } = require('./sentiment');
const { scrub } = require('./privacy');
const { findWave, settings } = require('./status');
const { writeValidated } = require('./store');

function comments(dir, wave, { limit = 50, offset = 0 } = {}) {
  const data = loadProject(dir);
  const w = findWave(data.waves, wave);
  const list = unlabeledComments(w.responses, data.bank, w.labels);
  return { wave, total: list.length, offset, items: list.slice(offset, offset + limit), themes: (data.bank && data.bank.themes) || [], elements: ELEMENTS };
}

function commentTexts(w, bank) {
  const open = ((bank && bank.questions) || []).filter((q) => q.type === 'open').map((q) => q.id);
  const map = new Map();
  for (const r of w.responses)
    for (const q of open) {
      const v = r.answers && r.answers[q];
      if (typeof v === 'string' && v.trim()) map.set(`${r.key}:${q}`, { text: scrub(v.trim()), group: r.group });
    }
  return map;
}

function addLabels(dir, wave, input, { reviewed = false } = {}) {
  const data = loadProject(dir);
  const w = findWave(data.waves, wave);
  const texts = commentTexts(w, data.bank);
  const themes = new Set(((data.bank && data.bank.themes) || []).map((t) => t.id));
  const list = Array.isArray(input) ? input : (input && input.labels) || [];
  const errors = [];
  const warnings = [];
  const err = (code, params) => errors.push({ code, message: format(code, params) });
  const F = `surveys/${wave}/sentiment.json`;
  for (const l of list) {
    if (!texts.has(l.id)) err('LABEL_UNKNOWN_ID', { id: l.id, wave });
    if (![-1, 0, 1].includes(l.sentiment)) err('ENUM_INVALID', { file: F, field: `${l.id}.sentiment`, allowed: '-1, 0, 1' });
    if (l.adkar !== undefined && l.adkar !== null && !ELEMENTS.includes(l.adkar)) err('ENUM_INVALID', { file: F, field: `${l.id}.adkar`, allowed: ELEMENTS.join(', ') });
    if (!Array.isArray(l.themes)) err('ENUM_INVALID', { file: F, field: `${l.id}.themes`, allowed: 'array' });
    else for (const t of l.themes) if (themes.size && !themes.has(t)) warnings.push({ code: 'UNKNOWN_THEME', message: format('UNKNOWN_THEME', { id: l.id, theme: t }) });
  }
  if (errors.length) throw new CmoError('VALIDATION_FAILED', { count: errors.length }, F, errors);

  const existing = new Map(((w.labels && w.labels.labels) || []).map((l) => [l.id, l]));
  let added = 0;
  let updated = 0;
  for (const l of list) {
    const isReviewed = reviewed || Boolean(l.reviewed);
    const label = {
      id: l.id,
      sentiment: l.sentiment,
      themes: l.themes,
      adkar: l.adkar ?? null,
      confidence: isReviewed && l.confidence === undefined ? 1 : l.confidence ?? 0.5,
      reviewed: isReviewed,
    };
    if (existing.has(l.id)) updated++;
    else added++;
    existing.set(l.id, label);
  }
  const v = writeValidated(dir, { [F]: { schemaVersion: 1, labels: [...existing.values()] } });
  return { wave, added, updated, warnings, validationWarnings: v.warnings };
}

function reviewQueue(dir, wave) {
  const data = loadProject(dir);
  const w = findWave(data.waves, wave);
  const threshold = settings(data.project).th.confidence;
  const texts = commentTexts(w, data.bank);
  const items = ((w.labels && w.labels.labels) || [])
    .filter((l) => !l.reviewed && (l.confidence ?? 0) < threshold)
    .map((l) => ({ ...l, text: (texts.get(l.id) || {}).text || '', group: (texts.get(l.id) || {}).group || null }));
  return { wave, threshold, items };
}

module.exports = { comments, addLabels, reviewQueue };
