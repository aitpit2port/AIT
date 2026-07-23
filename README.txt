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







MOUNTAIN ENTRY - GOOGLE SHEETS SAVE FIX
========================================

What was fixed
--------------
1. Large employee/vehicle payloads are no longer sent in one long GET URL.
   The browser stages large payloads in safe chunks, then commits the save.
2. Employee data remains successfully saved even if optional login-account,
   expense-rate, or vehicle-driver linking fails afterward.
3. Vehicle data remains successfully saved even if employee-driver linking
   fails afterward.
4. Successful responses now include the exact spreadsheet name and target
   sheet name, so you can verify where the row was written.
5. A diagnosestorage endpoint was added.

Target sheets
-------------
Employees: mountain_employees
Vehicles: mountain_vehicles
Daily status: mountain_daily_entries
Leaves: mountain_leaves

Installation
------------
1. Replace the current frontend files with:
   mountain-entry.html
   mountain-entry.css
   mountain-entry.js
   mountain-entry-i18n.js

2. Replace the Mountain Entry Apps Script module with:
   MountainEntry-v5-save-fix.gs

3. In Apps Script run once:
   setupMountainEntrySystem()

4. Run and inspect logs:
   diagnoseMountainEntryStorage()
   Make sure configured_id and active_id match the spreadsheet you expect.

5. Deploy a NEW Web App version. Updating code without creating a new
   deployment version can leave the website using the old backend.

6. Refresh the dashboard with Ctrl+F5 and test creating one employee and one
   vehicle.

Important
---------
The configured DASHBOARD_ID in 00_Config.gs must match the spreadsheet bound
to the Apps Script project. The backend intentionally throws a clear error if
they do not match, to prevent writing to the wrong spreadsheet.
