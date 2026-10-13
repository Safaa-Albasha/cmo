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
  SALT_MISSING: { en: 'Privacy salt .cmo/.salt is missing — recreate it with init or restore it from backup', ar: 'ملف الخصوصية ‎.cmo/.salt مفقود؛ أعد إنشاءه بـ init أو استرجعه من النسخة الاحتياطية' },
  IMPORT_FORMAT: { en: 'Cannot import {file}: use .csv, .xlsx or .json (save .xls as .xlsx or .csv)', ar: 'لا يمكن استيراد {file}: استخدم ‎.csv أو ‎.xlsx أو ‎.json (احفظ ‎.xls بصيغة ‎.xlsx أو ‎.csv)' },
  IMPORT_SHEET: { en: 'Sheet "{sheet}" not found. Sheets: {sheets}', ar: 'الورقة "{sheet}" غير موجودة. الأوراق: {sheets}' },
  WAVE_EXISTS: { en: 'Survey wave "{wave}" already exists', ar: 'جولة الاستبيان "{wave}" موجودة مسبقًا' },
  GROUPS_REQUIRED: { en: 'Add impacted groups to groups.json before generating a survey', ar: 'أضف المجموعات المتأثرة في groups.json قبل توليد الاستبيان' },
  NO_GROUP_COLUMN: { en: 'No department/group column found (expected the [GROUP] question)', ar: 'لم يُعثر على عمود القسم/المجموعة (المتوقع سؤال [GROUP])' },
  UNMAPPED_GROUP: { en: 'Row {row}: department "{value}" does not match any group', ar: 'الصف {row}: القسم "{value}" لا يطابق أي مجموعة' },
  UNMAPPED_VALUE: { en: 'Row {row}: value "{value}" for {question} was not recognised', ar: 'الصف {row}: القيمة "{value}" للسؤال {question} غير مفهومة' },
  LABEL_UNKNOWN_ID: { en: 'Label "{id}" does not match any comment in wave {wave}', ar: 'التصنيف "{id}" لا يطابق أي تعليق في الجولة {wave}' },
  UNKNOWN_THEME: { en: 'Label "{id}": theme "{theme}" is not in the theme list', ar: 'التصنيف "{id}": المحور "{theme}" غير موجود في قائمة المحاور' },
  PROCESS_UNKNOWN: { en: 'Row {row}: process "{value}" is not in processes.json', ar: 'الصف {row}: العملية "{value}" غير موجودة في processes.json' },
  IMPORT_MODE: { en: 'Usage file not recognised: need per-user columns (user + last activity date) or per-group columns (group + licensed)', ar: 'ملف الاستخدام غير مفهوم: يلزم أعمدة لكل مستخدم (المستخدم وتاريخ آخر نشاط) أو لكل مجموعة (المجموعة وعدد المرخّص لهم)' },
  ROSTER_REQUIRED: { en: 'This usage report has no department column — pass --roster <file with user and department>', ar: 'تقرير الاستخدام لا يحتوي عمود القسم؛ أضف ‎--roster بملف فيه المستخدم والقسم' },
  OP_INVALID: { en: 'Unknown operation "{op}". Use add, update or set', ar: 'عملية غير معروفة "{op}". استخدم add أو update أو set' },
  FILE_NOT_ALLOWED: { en: 'Operation "{op}" is not allowed on {file}', ar: 'العملية "{op}" غير مسموحة على {file}' },
  ITEM_NOT_FOUND: { en: '{file}: no item with id "{id}"', ar: '{file}: لا يوجد عنصر بالمعرّف "{id}"' },
  APPROVAL_RESOLVED: { en: 'Approval {id} is already {status}', ar: 'طلب الموافقة {id} تمت معالجته مسبقًا ({status})' },
  PROPOSAL_STALE: { en: 'Approval {id} is stale: the data changed since it was proposed. Reject it and propose again', ar: 'طلب الموافقة {id} قديم: تغيّرت البيانات بعد اقتراحه. ارفضه واقترحه من جديد' },
  PROCESSES_REQUIRED: { en: 'Register processes in processes.json before generating the timing form', ar: 'سجّل العمليات في processes.json قبل توليد نموذج قياس الوقت' },
  GUARD_DENY_FILE: { en: 'CMO guard: {file} is a controlled record. Propose the change (engine propose) and approve it with /cmo:approvals', ar: 'حارس CMO: الملف {file} سجل محمي. اقترح التغيير (engine propose) ووافق عليه عبر /cmo:approvals' },
  GUARD_DENY_SHELL: { en: 'CMO guard: shell commands may not modify or delete controlled .cmo records. Use the engine and /cmo:approvals', ar: 'حارس CMO: لا يُسمح لأوامر الطرفية بتعديل أو حذف سجلات .cmo المحمية. استخدم المحرّك و/cmo:approvals' },
  GUARD_DENY_SECRET: { en: 'CMO guard: .cmo/.salt protects respondent anonymity and must not be read, copied or changed', ar: 'حارس CMO: الملف ‎.cmo/.salt يحمي سرية المشاركين ولا يجوز قراءته أو نسخه أو تغييره' },
  GUARD_ASK_APPLY: { en: 'CMO approval: confirm that the change manager decided this ({cmd})', ar: 'موافقة CMO: أكّد أن مدير التغيير اتخذ هذا القرار ({cmd})' },
  GUARD_ASK_MCP: { en: 'CMO: {tool} writes to or sends via an external tool. Confirm before it runs', ar: 'CMO: الأداة {tool} تكتب أو ترسل عبر نظام خارجي. أكّد قبل التنفيذ' },
};

function format(code, params = {}) {
  const m = MESSAGES[code] || { en: code, ar: code };
  const fill = (t) => t.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
  return { en: fill(m.en), ar: fill(m.ar) };
}

module.exports = { MESSAGES, format };
