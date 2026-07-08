AIT Gold Blocks Map integration

Added page key: goldmap
Dashboard menu title: Gold Blocks Map
File: egypt_mines_map.html

Access control:
- Add a column named goldmap in the auth_users sheet.
- Set TRUE / 1 / yes for users allowed to see the Gold Blocks Map.
- Leave empty / FALSE / 0 / no for users who must not see it.

The map is also protected when opened directly: it requires a valid dashboard token and goldmap permission.
