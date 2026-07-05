AIT Equipment No-Data Fix
=========================

Files included:
- AppsScript/20_ProductionPage.gs
- Frontend/equipment.html

Why equipment page showed no useful data:
1) fact_equipment_daily had rows, but equipment names/types were blank because the source Equipment sheet has duplicated header names like "Equipment".
   The old buildHeaderMap() kept the LAST duplicated header, so sync read the summary block instead of the daily operation table.
2) Production tons and m3 can still be zero if the Equipment sheet has no direct production values and Lots rows do not match by date/zone/batch.

Install:
1) Replace Apps Script file: 20_ProductionPage.gs
2) Run manualSyncProduction() in Apps Script.
3) Confirm AIT Dashboard -> fact_equipment_daily now has equipment_id/equipment_name/equipment_type populated.
4) Deploy Apps Script: Deploy -> Manage deployments -> Edit -> New version -> Deploy.
5) Replace frontend file: equipment.html on GitHub Pages.
6) Hard refresh browser: Ctrl + Shift + R.

Note:
The page now shows a clear bilingual data-quality message if operating hours exist but production ton/m3 is not calculable yet.
