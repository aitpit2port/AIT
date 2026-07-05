AIT Equipment Page - Data + Arabic/English Fix

Modified files only:
- AppsScript/01_Router.gs
- AppsScript/40_AuthPage.gs
- Frontend/Dashboard_Full.html
- Frontend/equipment.html

What changed:
1) equipment.html is now bilingual: English / Arabic toggle.
2) equipment.html no longer depends only on module=equipment.
   It first tries module=equipment, then automatically falls back to module=production.
3) Dashboard_Full.html now passes the current Apps Script API URL to the iframe using ?api=...
   This prevents the equipment page from calling an old Web App deployment URL.
4) Added clearer empty-data message telling you to run manualSyncProduction() if fact_equipment_daily is empty.
5) Added manualSyncEquipment() alias in 01_Router.gs. It runs the production sync because equipment data comes from fact_equipment_daily.

Install:
1) Replace AppsScript/01_Router.gs and AppsScript/40_AuthPage.gs in Apps Script.
2) Run manualSyncProduction() or manualSyncEquipment() from Apps Script.
3) Deploy > Manage deployments > Edit > New version > Deploy.
4) Upload Frontend/Dashboard_Full.html and Frontend/equipment.html to GitHub Pages.
5) Hard refresh the browser: Ctrl + Shift + R.

If the page is still empty:
- Open AIT Dashboard Google Sheet and confirm fact_equipment_daily has rows.
- Confirm you are opening Dashboard_Full.html and not equipment.html directly without a token.
- Confirm auth_users has page_equipment=true or page_production=true for the logged-in user.
