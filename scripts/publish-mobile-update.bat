@echo off
REM ═══════════════════════════════════════════════════════════════
REM  Publish Mobile Update Script
REM  ينشر تحديث جديد لتطبيق الموبايل على سيرفر Contabo
REM ═══════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

REM إعدادات السيرفر (غيّرها حسب بياناتك)
set SERVER_USER=root
set SERVER_HOST=173.249.26.242
set SERVER_PATH=/opt/minasa-server/updates
set APK_PATH=C:\Users\asus\MinasaFlutter\build\app\outputs\flutter-apk\app-release.apk

REM اطلب معلومات الإصدار
set /p VERSION="أدخل رقم الإصدار الجديد (مثل 1.0.1): "
set /p VERSION_CODE="أدخل version code (رقم صحيح، مثل 2): "
set /p MANDATORY="هل التحديث إجباري؟ (y/n): "
set /p RELEASE_NOTES="أدخل ملاحظات الإصدار (ما الجديد؟): "

if "%MANDATORY%"=="y" (
    set MANDATORY_JSON=true
) else (
    set MANDATORY_JSON=false
)

REM احصل على التاريخ الحالي
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TODAY=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%

REM أنشئ ملف version.json محلياً
echo {> version.json
echo   "version": "%VERSION%",>> version.json
echo   "versionCode": %VERSION_CODE%,>> version.json
echo   "apkFile": "minasa-%VERSION%.apk",>> version.json
echo   "releaseNotes": "%RELEASE_NOTES%",>> version.json
echo   "mandatory": %MANDATORY_JSON%,>> version.json
echo   "releaseDate": "%TODAY%">> version.json
echo }>> version.json

echo.
echo ══════════════════════════════════════
echo  Publishing version %VERSION%
echo ══════════════════════════════════════
echo.
echo  APK: %APK_PATH%
echo  Target: %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%
echo.
echo  version.json:
type version.json
echo.
echo.

set /p CONFIRM="هل تريد المتابعة؟ (y/n): "
if not "%CONFIRM%"=="y" (
    del version.json
    echo تم الإلغاء.
    exit /b 1
)

REM ارفع الملفات للسيرفر
echo.
echo [1/3] رفع APK...
scp "%APK_PATH%" %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/minasa-%VERSION%.apk
if errorlevel 1 (
    echo فشل رفع APK!
    del version.json
    exit /b 1
)

echo [2/3] رفع version.json...
scp version.json %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/version.json
if errorlevel 1 (
    echo فشل رفع version.json!
    del version.json
    exit /b 1
)

echo [3/3] تنظيف...
del version.json

echo.
echo ══════════════════════════════════════
echo  ✓ تم النشر بنجاح!
echo ══════════════════════════════════════
echo  الإصدار %VERSION% متاح الآن للمستخدمين
echo  سيصلهم إشعار التحديث عند فتح التطبيق
echo.
pause
