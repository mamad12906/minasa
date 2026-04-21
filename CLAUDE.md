# قواعد العمل

هذا المستودع يحوي **سيرفر الهاتف فقط** ([server/](server/)). تطبيق الهاتف (Flutter) منفصل في `c:\Users\asus\MinasaFlutter\` ولا يُرفع هنا.

## عند أي تعديل على السيرفر
1. عدّل الملفات في [server/](server/)
2. **انتظر موافقة المستخدم** قبل الرفع
3. عند الموافقة:
   - `git push origin master`
   - SSH للـ VPS: `cd /root/minasa && git pull --ff-only && cd server && npm install --omit=dev && pm2 restart minasa`

## عند نشر تحديث APK للهاتف
1. ارفع `MinasaFlutter/pubspec.yaml` (version + versionCode)
2. `flutter build apk --release --dart-define=API_KEY=… --dart-define=SERVER_URL=…`
3. `scp` الـ APK إلى `/opt/minasa-server/updates/minasa-<VERSION>.apk`
4. حدّث `/opt/minasa-server/updates/version.json`
5. لا إعادة تشغيل لازمة — الـ endpoint يقرأ `version.json` كل طلب

## لا تفعل تلقائياً
- لا ترفع للـ GitHub بدون إذن
- لا تعمل `git pull` أو `pm2 restart` على الـ VPS بدون إذن
- لا تبني/ترفع APK جديد بدون إذن
