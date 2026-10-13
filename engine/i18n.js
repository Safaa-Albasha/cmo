'use strict';

const MESSAGES = {
  FILE_MISSING: { en: 'Required file is missing: {file}', ar: 'ملف مطلوب غير موجود: {file}' },
  JSON_INVALID: { en: 'File {file} is not valid JSON: {detail}', ar: 'الملف {file} ليس JSON صالحًا: {detail}' },
  FIELD_REQUIRED: { en: '{file}: field "{field}" is required', ar: '{file}: الحقل "{field}" مطلوب' },
  ENUM_INVALID: { en: '{file}: "{field}" must be one of: {allowed}', ar: '{file}: قيمة "{field}" يجب أن تكون إحدى: {allowed}' },
  DATE_INVALID: { en: '{file}: "{field}" must be a valid date YYYY-MM-DD', ar: '{file}: "{field}" يجب أن يكون تاريخًا صحيحًا بصيغة YYYY-MM-DD' },
  DATE_ORDER: { en: '{file}: "{start}" must be on or before "{end}"', ar: '{file}: "{start}" يجب أن يكون في أو قبل "{end}"' },
  NUMBER_RANGE: { en: '{file}: "{field}" must be a number between {min} and {max}', ar: '{file}: "{field}" يجب أن يكون رقمًا بين {min} و{max}' },
  ID_DUPLICATE: { en: '{file}: duplicate id "{id}"', ar: '{file}: المعرّف "{id}" مكرر' },
  CURRENCY_INVALID: { en: '{file}: "currency" must be a short text (max 20 characters), e.g. SAR, KWD, USD or a label', ar: '{file}: "currency" يجب أن يكون نصًا قصيرًا (20 حرفًا كحد أقصى)، مثل SAR أو KWD أو USD أو تسمية' },
  UNKNOWN_GROUP: { en: '{file}: group "{group}" is not in groups.json', ar: '{file}: المجموعة "{group}" غير موجودة في groups.json' },
  UNKNOWN_QUESTION: { en: '{file}: question "{id}" is not in the question bank', ar: '{file}: السؤال "{id}" غير موجود في بنك الأسئلة' },
  USAGE_INCONSISTENT: { en: '{file}: {group}/{tool}: {a} ({av}) is greater than {b} ({bv})', ar: '{file}: {group}/{tool}: قيمة {a} ({av}) أكبر من {b} ({bv})' },
  VALIDATION_FAILED: { en: 'Project data has {count} error(s); run validate for details', ar: 'بيانات المشروع فيها {count} خطأ؛ شغّل validate للتفاصيل' },
  PROJECT_EXISTS: { en: 'A change project already exists in {dir}', ar: 'يوجد مشروع تغيير مسبقًا في {dir}' },
  ARG_MISSING: { en: 'Missing argument --{arg}', ar: 'المعامل --{arg} مفقود' },
  UNKNOWN_COMMAND: { en: 'Unknown command "{cmd}". Available: {commands}', ar: 'أمر غير معروف "{cmd}". الأوامر المتاحة: {commands}' },
  WAVE_NOT_FOUND: { en: 'Survey wave "{wave}" not found. Waves: {waves}', ar: 'جولة الاستبيان "{wave}" غير موجودة. الجولات: {waves}' },
  NO_SURVEY: { en: 'No survey waves yet — ADKAR and sentiment are not available', ar: 'لا توجد جولات استبيان بعد، فلا يتوفر ADKAR ولا تحليل المشاعر' },
  NO_BASELINE: { en: 'Only one survey wave — before/after comparison needs a baseline and a later wave', ar: 'توجد جولة استبيان واحدة فقط؛ المقارنة قبل وبعد تحتاج جولة أساسية وجولة لاحقة' },
  NO_USAGE: { en: 'No usage snapshots yet — adoption metrics are not available', ar: 'لا توجد لقطات استخدام بعد، فلا تتوفر مؤشرات التبنّي' },
  NO_PROCESSES: { en: 'No processes registered — business value is not available', ar: 'لا توجد عمليات مسجلة، فلا تتوفر قيمة الأثر على العمل' },
  UNLABELED_COMMENTS: { en: '{count} comment(s) in wave {wave} are not classified yet', ar: '{count} تعليق في الجولة {wave} لم يُصنَّف بعد' },
  PENDING_REVIEW: { en: '{count} low-confidence label(s) in wave {wave} wait for review', ar: '{count} تصنيف منخفض الثقة في الجولة {wave} بانتظار المراجعة' },
};

function format(code, params = {}) {
  const m = MESSAGES[code] || { en: code, ar: code };
  const fill = (t) => t.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
  return { en: fill(m.en), ar: fill(m.ar) };
}

module.exports = { MESSAGES, format };
