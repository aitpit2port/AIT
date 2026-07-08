AIT Pit2Port - Fix Pack

المشاكل التي تم إصلاحها:
1) توحيد رابط الـ API عبر ?api= أو localStorage بدل روابط ثابتة متضاربة.
2) استبدال AppsScript_Code.gs القديم بباك إند موحد يدعم auth/token/modules/sync.
3) إصلاح logout في Dashboard_Full.html ليستخدم نفس API_URL الحالي.
4) السماح بفتح Gold Map لمن لديه صلاحية mines.
5) إصلاح shared.js الذي كان يحتوي duplicate declaration ويؤدي إلى SyntaxError.
6) إضافة مجلد AppsScript_Modules لمن يريد رفع الملفات منفصلة داخل Apps Script.

التركيب:
- ارفع AppsScript_Code.gs بالكامل على Google Apps Script أو ارفع ملفات AppsScript_Modules بالترتيب.
- اعمل Deploy Web App جديد.
- افتح auth.html?api=YOUR_WEB_APP_URL مرة واحدة أو عدل DEFAULT_API_URL داخل الملفات.
- شغل setupAuthUsers ثم manualSync أو manualSyncProduction حسب الحاجة.
