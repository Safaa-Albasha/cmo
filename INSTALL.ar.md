<div dir="rtl">

# دليل التنزيل والتركيب: CMO لـ Claude

[English](INSTALL.md)

يستغرق التركيب حوالي **15 دقيقة**، ولا يحتاج خبرة برمجية. ستكتب بعض الأوامر في **الطرفية**:
- **في Windows:** افتح قائمة "ابدأ"، واكتب **PowerShell** أو **Terminal**، ثم افتحه.
- **في Mac:** افتح تطبيق **Terminal**.

## ما تحتاجه
| | |
|---|---|
| اشتراك Claude | Pro أو Max أو Team أو Enterprise، أو حساب Claude Console |
| Node.js الإصدار 18 أو أحدث | مجاني، والخطوة 1 تشرح تثبيته |
| Google Forms أو Microsoft Forms | للاستبيانات، وغالبًا هو متوفر عندك |
| صلاحية تقارير الاستخدام (اختياري) | من مركز إدارة Microsoft 365، أو لوحة إدارة أداة الذكاء الاصطناعي |

## الخطوة 1: تثبيت Node.js
1. نزّل نسخة **LTS** من https://nodejs.org وثبّتها.
2. أغلق الطرفية وافتحها من جديد.
3. تأكد من نجاح التثبيت:

```bash
node --version
```

يجب أن يظهر v18 أو أعلى.

## الخطوة 2: تثبيت Claude Code
**في Windows** (داخل PowerShell):
```powershell
irm https://claude.ai/install.ps1 | iex
```
**في Mac أو Linux:**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```
بعد التثبيت شغّل `claude` مرة واحدة، وسجّل الدخول من المتصفح، ثم اكتب `/exit`. وإذا كان Claude Code مثبتًا عندك مسبقًا، فتجاوز هذه الخطوة.

## الخطوة 3: تركيب الـ plugin
```bash
claude plugin marketplace add Safaa-Albasha/cmo
```
```bash
claude plugin install cmo@cmo
```
أو اكتب الأمرين من داخل Claude Code: `/plugin marketplace add Safaa-Albasha/cmo` ثم `/plugin install cmo@cmo`.

بعدها **أعد تشغيل Claude Code**. وللتأكد شغّل `claude plugin list`، يجب أن يظهر `cmo` في القائمة.

## الخطوة 4: أول مشروع تغيير
1. أنشئ مجلدًا، مثلًا `Documents/تبني-الذكاء-الاصطناعي`.
2. افتح الطرفية داخله. في Windows: اضغط بالزر الأيمن داخل المجلد، ثم اختر **Open in Terminal**.
3. شغّل `claude`.
4. اكتب `/cmo:setup`. يفحص Node ويشرح طرق الربط.
5. اكتب `/cmo:new`، وأجب عن الأسئلة.
6. بعدها نفّذ بالترتيب: `/cmo:assess`، ثم `/cmo:survey` (الجولة الأساسية)، ثم `/cmo:value`، ثم `/cmo:plan`.

**تريد التجربة قبل البدء بمشروعك؟**
1. من https://github.com/Safaa-Albasha/cmo اضغط **Code** ثم **Download ZIP**، وفك الضغط.
2. انسخ مجلد `examples/ai-adoption` إلى أي مكان على جهازك.
3. افتحه في Claude Code، وشغّل `/cmo:status`.
4. لرؤية التقرير الجاهز، افتح `examples/sample-report-ai-adoption.html` في المتصفح.

## الخطوة 5: الاستبيانات في Forms
يكتب الأمر `/cmo:survey` ثلاثة ملفات في المجلد `.cmo/drafts/`. اختر طريقة النموذج الذي تستخدمه:

**Microsoft Forms:**
1. ادخل forms.office.com، واختر **Quick import**.
2. ارفع الملف `survey-<wave>-msforms.docx`.
3. راجع الأسئلة، وأوقف تسجيل الأسماء من الإعدادات.
4. شارك رابط النموذج مع الموظفين.
5. بعد جمع الإجابات: من **Responses** اختر **Open in Excel**، ثم استخدم `/cmo:import`.

**Google Forms:**
1. ادخل script.google.com، واختر **New project**.
2. الصق محتوى الملف `survey-<wave>-google.gs`.
3. اضغط **Run** على `createSurvey`، ثم اسمح بالصلاحيات.
4. تظهر الروابط في السجل: رابط النموذج، ورابط جدول الردود.
5. بعد جمع الإجابات: نزّل الجدول بصيغة CSV، ثم استخدم `/cmo:import`.

> **مهم:** لا تحذف الرموز الموجودة في عناوين الأسئلة، مثل `[A1]`. هي التي تربط الإجابات بالأسئلة بدقة.

## الخطوة 6 (اختيارية): بيانات الاستخدام
- **Microsoft 365 Copilot:**
  1. من مركز الإدارة: Reports ثم Usage ثم Microsoft 365 Copilot، ثم صدّر التقرير.
  2. صدّر أيضًا ملف أقسام الموظفين (الإيميل والقسم)، لأن التقرير لا يحتوي القسم.
  3. استورد الملفين عبر `/cmo:import` مع الخيار `--roster`.
- **Claude أو ChatGPT Enterprise أو Gemini:** صدّر التحليلات من لوحة الإدارة، لكل مستخدم أو لكل قسم.

**لا تُحفظ هوية أي مستخدم**، فقط مجاميع الأقسام.

## احتفظ بنسخة من ملف التشفير
ملف `.cmo/.salt` هو الذي يجعل المشاركين مجهولي الهوية، ويسمح في نفس الوقت بمقارنة إجاباتهم بين الجولات. وهو مستثنى من Git عمدًا. **احتفظ بنسخة احتياطية منه** مع ملفات مشروعك، **ولا تشاركه مع أحد**.

## Claude Desktop (Cowork)
الـ plugins التي تضيفها لحساب Claude تتزامن تلقائيًا مع تطبيق Claude على سطح المكتب. في Cowork افتح مجلد المشروع وشغّل `/cmo:setup`:
- **إذا ظهر أن Node.js متوفر:** كل شيء يعمل هناك أيضًا.
- **إذا لم يكن متوفرًا:** استخدم Claude Code للحسابات.

## التحديث والإزالة
للتحديث:
```bash
claude plugin marketplace update cmo
```
```bash
claude plugin update cmo@cmo
```
للإزالة:
```bash
claude plugin uninstall cmo@cmo
```
الإزالة لا تحذف بيانات مجلد `.cmo` أبدًا.

## حل المشاكل الشائعة
| المشكلة | الحل |
|---|---|
| `node` غير معروف | أعد تثبيت Node.js، ثم أغلق الطرفية وافتحها من جديد |
| الأوامر `/cmo:...` لا تظهر | أعد تشغيل Claude Code. تأكد أن `claude plugin list` يعرض cmo، وإلا شغّل `claude plugin enable cmo@cmo` |
| الاستيراد لا يتعرّف على القسم | أسماء الأقسام في الملف يجب أن تطابق الأسماء في `groups.json`، بالعربي أو الإنجليزي. صحّحها، ثم أعد المعاينة |
| مجموعة تظهر "مخفية للخصوصية" | فيها أقل من 5 أشخاص. هذا متعمّد |
| تظهر نافذة تأكيد عند الموافقة | الحارس يتأكد أن القرار قرارك أنت. هذا متعمّد |
| رسالة "ملف التشفير مفقود" | استرجع `.cmo/.salt` من النسخة الاحتياطية. بدونه لا يمكن ربط الإجابات الجديدة بالجولات السابقة |

**تحتاج مساعدة؟** افتح Issue على https://github.com/Safaa-Albasha/cmo/issues

</div>
