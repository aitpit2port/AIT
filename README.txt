AIT Equipment loading fix

Files included:
- Frontend/equipment.html

What changed:
- Reads module=production first because fact_equipment_daily is returned inside production payload.
- Falls back to module=equipment only if production has no rows.
- Adds visible slow-API/timeout diagnostics instead of leaving the loading spinner forever.
- Avoids rendering charts before data is loaded.
- Handles Chart.js CDN failure with a visible message instead of freezing.

Install:
1. Upload Frontend/equipment.html to GitHub Pages replacing the current file.
2. Commit and wait for Pages deploy.
3. Hard refresh the browser with Ctrl+Shift+R.
4. If data still does not show, open Apps Script and run manualSyncProduction(), then redeploy Apps Script as a new version.
