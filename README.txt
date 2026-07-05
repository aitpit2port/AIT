AIT modified files only
=======================

Replace only these files in your current project.

AppsScript:
- 01_Router.gs: JSONP router + server-side token/page permission checks.
- 10_SamplesPage.gs: header-based samples sync, safer dates/elements, auto-sync when fact sheet is empty.
- 30_DataSourcesPages.gs: reads IDs from 00_Config.gs, no wrong first-sheet fallback, no auth override.
- 40_AuthPage.gs: real session tokens, fixed empty checkbox rows in auth_users, safe header migration.

Frontend:
- Dashboard_Full.html: passes token to iframe pages and open-new links, better mobile shell.
- auth.html: redirects existing sessions.
- index.html: redirects to secure shell instead of bypassing login.
- generic dashboard pages: rebuilt with consistent UI/UX, tokenized API calls, search/date/category/mine filters, error states.
- production.html and samples.html: tokenized API calls.
- spareparts.html: corrected from budget module to spareparts module.
- egypt_mines_map.html: unified API URL and JSONP loading.

After replacing Apps Script files: Deploy > Manage deployments > Edit > New version > Deploy.
