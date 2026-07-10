(function(){
  'use strict';
  var CANONICAL_API_URL = 'https://script.google.com/macros/s/AKfycbxFJroZzKQT1N0c70ktzFISQkWIkT7w_pyi7eAFxuDPx88icN-WvT2IGkrJ8W-Lt1uz/exec';
  var LEGACY_API_URLS = ['https://script.google.com/macros/s/AKfycbxfl8DMsgy__jtquMmQX0-RByrW2qIL45nzH8imv-slUdUkJm8XwTJjsz6gphtua-LJiw/exec'];
  var query = new URLSearchParams(window.location.search || '');
  var queryApi = String(query.get('api') || '').trim();
  var storedApi = String(localStorage.getItem('ait_api_url') || '').trim();
  if (!queryApi && (!storedApi || LEGACY_API_URLS.indexOf(storedApi) >= 0)) storedApi = CANONICAL_API_URL;
  var resolved = queryApi || storedApi || CANONICAL_API_URL;
  localStorage.setItem('ait_api_url', resolved);
  window.AIT_CONFIG = Object.freeze({
    apiUrl: resolved,
    canonicalApiUrl: CANONICAL_API_URL,
    apiVersion: '2026-07-dashboard-fix-1'
  });
  // Unify theme preference between the shell and all embedded dashboards.
  var themeKeys = ['ait_dashboard_theme','ait_shell_theme','ait_theme','ait_prod_theme','ait_eq_theme'];
  var nativeSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    nativeSetItem.call(this, key, value);
    if (themeKeys.indexOf(String(key)) >= 0) {
      for (var ti = 0; ti < themeKeys.length; ti++) {
        if (themeKeys[ti] !== key) nativeSetItem.call(this, themeKeys[ti], value);
      }
      document.documentElement.setAttribute('data-theme', value);
    }
  };
  var theme = localStorage.getItem('ait_dashboard_theme') || localStorage.getItem('ait_shell_theme') || localStorage.getItem('ait_theme') || localStorage.getItem('ait_prod_theme') || localStorage.getItem('ait_eq_theme') || 'dark';
  themeKeys.forEach(function(k){ nativeSetItem.call(localStorage, k, theme); });
  document.documentElement.setAttribute('data-theme', theme);
  window.addEventListener('storage', function(e){
    if (['ait_dashboard_theme','ait_shell_theme','ait_theme','ait_prod_theme','ait_eq_theme'].indexOf(e.key) >= 0 && e.newValue) document.documentElement.setAttribute('data-theme', e.newValue);
  });
})();
