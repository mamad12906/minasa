# دليل نشر تحديثات تطبيق الموبايل

## الإعداد لأول مرة (على السيرفر)

### 1. إنشاء مجلد التحديثات على السيرفر
```bash
ssh root@173.249.26.242
mkdir -p /opt/minasa-server/updates
```

### 2. التأكد من أن السيرفر يعمل بأحدث كود
```bash
cd /opt/minasa-server
git pull
npm install
pm2 restart minasa-server
```

## نشر تحديث جديد

### الطريقة 1: السكريبت التلقائي (الأسهل)
```
# على Windows
scripts\publish-mobile-update.bat
```

السكريبت يطلب منك:
- رقم الإصدار (مثل `1.0.1`)
- version code (رقم صحيح، مثل `2`)
- هل التحديث إجباري؟
- ملاحظات الإصدار

ثم يرفع APK و version.json للسيرفر تلقائياً.

### الطريقة 2: يدوياً

#### الخطوة 1: بناء APK
```bash
cd C:\Users\asus\MinasaFlutter
flutter build apk --release
```

#### الخطوة 2: نسخ APK للسيرفر
```bash
scp build/app/outputs/flutter-apk/app-release.apk root@173.249.26.242:/opt/minasa-server/updates/minasa-1.0.1.apk
```

#### الخطوة 3: تحديث version.json على السيرفر
```bash
ssh root@173.249.26.242
cat > /opt/minasa-server/updates/version.json << 'EOF'
{
  "version": "1.0.1",
  "versionCode": 2,
  "apkFile": "minasa-1.0.1.apk",
  "releaseNotes": "تحسينات وإصلاحات جديدة",
  "mandatory": false,
  "releaseDate": "2026-04-14"
}
EOF
```

## كيف يعمل النظام؟

1. **التطبيق يتحقق تلقائياً** من التحديثات بعد 3 ثواني من بدء التشغيل
2. **يقارن** الإصدار الحالي بالإصدار على السيرفر
3. إذا كان هناك إصدار جديد → **يعرض Dialog** للمستخدم
4. المستخدم يضغط "تحديث الآن" → **ينزل APK** مع progress bar
5. عند اكتمال التنزيل → **Android يعرض شاشة التثبيت**
6. المستخدم يضغط "تثبيت" → **التطبيق يتحدث!**

## ملاحظات مهمة

### قبل نشر الإصدار:
- ارفع version في `pubspec.yaml`:
  ```yaml
  version: 1.0.1+2  # version+buildNumber
  ```
- اختبر التطبيق محلياً قبل النشر

### التحديث الإجباري (mandatory):
- إذا كان `mandatory: true` → المستخدم **لا يقدر يرفض** التحديث
- استخدمها فقط للتحديثات الأمنية الحرجة

### العودة لإصدار قديم (Rollback):
إذا ظهرت مشكلة في الإصدار الجديد:
```bash
ssh root@173.249.26.242
# عدّل version.json ليشير للإصدار القديم
vim /opt/minasa-server/updates/version.json
```

### سجل الإصدارات:
احتفظ بـ APKs القديمة في `/opt/minasa-server/updates/` للرجوع إليها.
