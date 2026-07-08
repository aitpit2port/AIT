Gold Map Access Fix
===================

Modified files:
1) Dashboard_Full.html
2) egypt_mines_map.html
3) README_MAP_ACCESS.txt

Gold map permission:
- The dashboard now accepts either column name:
  goldmap
  or
  page_goldmap

Recommended column name for consistency with the existing permissions sheet:
  page_goldmap

Allowed values:
TRUE / 1 / yes / checked checkbox.

After replacing the files:
1) Refresh the browser with Ctrl+F5.
2) Log out and log in again so the auth session reloads the latest permissions.
3) Open Dashboard_Full.html#goldmap if you want to test the page directly.
