# AI Compare

تطبيق Next.js لمقارنة مخرجات عدة نماذج ذكاء اصطناعي جنبًا إلى جنب بنفس الـ prompt، مع بث مباشر للنتائج (streaming) من مزودات مختلفة.

## المزايا الحالية

- إرسال prompt واحد وعرض الردود في عدة لوحات مقارنة.
- اختيار النماذج بشكل ديناميكي من الواجهة.
- دعم البث المباشر (SSE) لنتائج كل نموذج.
- دعم مزودين حاليًا:
  - Google Gemini
  - Mistral

## المتطلبات

- Node.js 20+
- pnpm 10+

## التشغيل محليًا

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

ثم افتح:

- `http://localhost:3000`

## متغيرات البيئة

يجب تعريف المفاتيح التالية في `.env.local`:

- `GOOGLE_GENERATIVE_AI_API_KEY`
- `MISTRAL_API_KEY`

> ملاحظة: إذا كان نموذج تابع لمزود بدون مفتاح صالح، سيعيد الـ API خطأ JSON واضح.

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## بنية المشروع (مختصر)

- `app/api/chat/route.ts`: نقطة الـ API للبث المباشر وتوجيه الطلب حسب المزود.
- `components/multi-chat.tsx`: إدارة الواجهة الرئيسية للمقارنة.
- `components/model-response-panel.tsx`: لوحة بث/عرض نتيجة كل نموذج.
- `lib/models.ts`: قائمة النماذج المتاحة افتراضيًا.

## خارطة الطريق المقترحة

### أولوية عالية

- توحيد تجربة التطوير: ESLint v9 + إعداد lint ثابت.
- توثيق أفضل للتشغيل والإعداد والنشر.
- ملف `.env.example` واضح.

### أولوية متوسطة

- حفظ سجل المقارنات (history).
- إضافة تقييم تلقائي أو تصويت للمخرجات.
- اختبارات API أساسية (validation + streaming behavior).

### أولوية النشر

- CI عبر GitHub Actions لتشغيل lint/build تلقائيًا.
- تحسين صفحة العرض العامة للمشروع على GitHub.
