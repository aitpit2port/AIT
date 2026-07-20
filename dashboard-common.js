(function(){
  'use strict';
  var CANONICAL_API_URL = 'https://script.google.com/macros/s/AKfycbxfl8DMsgy__jtquMmQX0-RByrW2qIL45nzH8imv-slUdUkJm8XwTJjsz6gphtua-LJiw/exec';
  var LEGACY_API_URLS = ['https://script.google.com/macros/s/AKfycbxFJroZzKQT1N0c70ktzFISQkWIkT7w_pyi7eAFxuDPx88icN-WvT2IGkrJ8W-Lt1uz/exec'];
  var query = new URLSearchParams(window.location.search || '');
  var EMBEDDED = query.get('embedded') === '1' || window.parent !== window;
  document.documentElement.classList.toggle('ait-embedded', EMBEDDED);
  document.documentElement.setAttribute('data-embedded', EMBEDDED ? 'true' : 'false');
  function safeGet(store, key) { try { return store && store.getItem ? (store.getItem(key) || '') : ''; } catch (e) { return ''; } }
  function safeSet(store, key, value) { try { if (store && store.setItem) { store.setItem(key, value); return true; } } catch (e) {} return false; }
  var queryApi = String(query.get('api') || '').trim();
  var storedApi = String(safeGet(window.localStorage, 'ait_api_url') || '').trim();
  if (!queryApi && (!storedApi || LEGACY_API_URLS.indexOf(storedApi) >= 0)) storedApi = CANONICAL_API_URL;
  var resolved = queryApi || storedApi || CANONICAL_API_URL;
  safeSet(window.localStorage, 'ait_api_url', resolved);
  window.AIT_CONFIG = Object.freeze({
    apiUrl: resolved,
    canonicalApiUrl: CANONICAL_API_URL,
    apiVersion: '2026-07-dashboard-fix-2-correct-api'
  });

  // Mobile browsers can evict or block one storage mechanism. Keep the session
  // available through localStorage, sessionStorage and a short first-party cookie.
  var SESSION_KEY = 'ait_auth_session';
  var SESSION_BRIDGE_PREFIX = 'AIT_SESSION::';
  function readNavigationBridge() {
    try {
      var current = String(window.name || '');
      if (current.indexOf(SESSION_BRIDGE_PREFIX) !== 0) return '';
      window.name = '';
      return decodeURIComponent(current.slice(SESSION_BRIDGE_PREFIX.length));
    } catch (e) { return ''; }
  }
  function storageGet(store, key) { try { return store.getItem(key); } catch (e) { return ''; } }
  function storageSet(store, key, value) { try { store.setItem(key, value); return true; } catch (e) { return false; } }
  function storageRemove(store, key) { try { store.removeItem(key); } catch (e) {} }
  function cookieGet(key) {
    try {
      var match = document.cookie.match(new RegExp('(?:^|; )' + key.replace(/[.$?*|{}()\[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : '';
    } catch (e) { return ''; }
  }
  function cookieSet(key, value) {
    try { document.cookie = key + '=' + encodeURIComponent(value) + '; path=/; max-age=86400; SameSite=Lax; Secure'; } catch (e) {}
  }
  function cookieRemove(key) {
    try { document.cookie = key + '=; path=/; max-age=0; SameSite=Lax; Secure'; } catch (e) {}
  }
  window.AITSession = Object.freeze({
    get: function () {
      var raw = readNavigationBridge() || storageGet(window.localStorage, SESSION_KEY) || storageGet(window.sessionStorage, SESSION_KEY) || cookieGet(SESSION_KEY);
      if (!raw) return null;
      try {
        var value = JSON.parse(raw);
        if (value && value.token) {
          storageSet(window.localStorage, SESSION_KEY, raw);
          storageSet(window.sessionStorage, SESSION_KEY, raw);
          return value;
        }
      } catch (e) {}
      return null;
    },
    set: function (value) {
      var raw = JSON.stringify(value || {});
      storageSet(window.localStorage, SESSION_KEY, raw);
      storageSet(window.sessionStorage, SESSION_KEY, raw);
      cookieSet(SESSION_KEY, raw);
      return value;
    },
    bridge: function (value) {
      try { window.name = SESSION_BRIDGE_PREFIX + encodeURIComponent(JSON.stringify(value || {})); return true; } catch (e) { return false; }
    },
    clear: function () {
      try { if (String(window.name || '').indexOf(SESSION_BRIDGE_PREFIX) === 0) window.name = ''; } catch (e) {}
      storageRemove(window.localStorage, SESSION_KEY);
      storageRemove(window.sessionStorage, SESSION_KEY);
      cookieRemove(SESSION_KEY);
    }
  });
  // Unify theme preference between the shell and all embedded dashboards.
  var themeKeys = ['ait_dashboard_theme','ait_shell_theme','ait_theme','ait_prod_theme','ait_eq_theme'];
  var nativeSetItem = (window.Storage && Storage.prototype && Storage.prototype.setItem) ? Storage.prototype.setItem : null;
  if (nativeSetItem) {
    try {
      Storage.prototype.setItem = function(key, value) {
        nativeSetItem.call(this, key, value);
        if (themeKeys.indexOf(String(key)) >= 0) {
          for (var ti = 0; ti < themeKeys.length; ti++) {
            if (themeKeys[ti] !== key) { try { nativeSetItem.call(this, themeKeys[ti], value); } catch (e) {} }
          }
          document.documentElement.setAttribute('data-theme', value);
        }
      };
    } catch (e) {}
  }
  var theme = safeGet(window.localStorage,'ait_dashboard_theme') || safeGet(window.localStorage,'ait_shell_theme') || safeGet(window.localStorage,'ait_theme') || safeGet(window.localStorage,'ait_prod_theme') || safeGet(window.localStorage,'ait_eq_theme') || 'dark';
  themeKeys.forEach(function(k){ if (nativeSetItem) { try { nativeSetItem.call(window.localStorage, k, theme); } catch (e) {} } else safeSet(window.localStorage,k,theme); });
  document.documentElement.setAttribute('data-theme', theme);
  window.addEventListener('storage', function(e){
    if (themeKeys.indexOf(e.key) >= 0 && e.newValue) document.documentElement.setAttribute('data-theme', e.newValue);
  });

  // Use the login mark as the browser-tab icon on every page.
  if (!document.querySelector('link[rel~="icon"]')) {
    var icon = document.createElement('link');
    icon.rel = 'icon';
    icon.type = 'image/svg+xml';
    icon.href = 'ait-logo.svg';
    document.head.appendChild(icon);
  }
  var viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) viewport.setAttribute('content', 'width=device-width,initial-scale=1,viewport-fit=cover');

  function setViewportHeight() {
    var height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--ait-vh', Math.max(320, height) + 'px');
  }
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', setViewportHeight, { passive: true });


  function setEmbeddedMode(value) {
    EMBEDDED = !!value;
    document.documentElement.classList.toggle('ait-embedded', EMBEDDED);
    document.documentElement.setAttribute('data-embedded', EMBEDDED ? 'true' : 'false');
    if (document.body) document.body.classList.toggle('ait-embedded', EMBEDDED);
  }
  window.addEventListener('message', function (event) {
    var data = event && event.data ? event.data : {};
    if (!data.cmd) return;
    if (data.cmd === 'setEmbedded') setEmbeddedMode(data.value);
    if (data.cmd === 'setTheme' && data.value) {
      document.documentElement.setAttribute('data-theme', data.value);
      try { localStorage.setItem('ait_theme', data.value); } catch (e) {}
      var themeBtn = document.getElementById('themeBtn');
      if (themeBtn) themeBtn.textContent = data.value === 'dark' ? '🌙' : '☀️';
    }
    if (data.cmd === 'setLang' && data.value) {
      try {
        if (typeof window.setLang === 'function') window.setLang(data.value);
        else {
          document.documentElement.lang = data.value;
          document.documentElement.dir = data.value === 'ar' ? 'rtl' : 'ltr';
        }
      } catch (e) {}
    }
  });

  function installPageBrand() {
    if (EMBEDDED) return;
    if (document.querySelector('.app > .sidebar') || document.getElementById('loginForm')) return;
    var bar = document.querySelector('.topbar, .header, .page-header');
    if (!bar || bar.querySelector('.ait-inline-brand')) return;
    var existing = bar.querySelector('.brand .logo, .logo, .brand-mark, .app-logo');
    if (existing) {
      existing.classList.add('ait-existing-brand');
      existing.innerHTML = '<img src="ait-logo.svg" alt="AIT">';
      return;
    }
    var brand = document.createElement('div');
    brand.className = 'ait-inline-brand';
    brand.setAttribute('aria-label', 'AIT');
    brand.innerHTML = '<img src="ait-logo.svg" alt="AIT">';
    bar.insertBefore(brand, bar.firstChild);
  }

  function textOf(selector) {
    var node = document.querySelector(selector);
    return node ? String(node.textContent || '').trim() : '';
  }
  function updateDecisionStrip(strip) {
    var rtl = document.documentElement.dir === 'rtl';
    var rows = textOf('#sCount') || textOf('#tableCount') || '—';
    var updated = textOf('#lastUpdate') || (rtl ? 'غير متاح' : 'Not available');
    var critical = document.querySelectorAll('.pill.bad,.badge.bad,.risk.high,.status.bad').length;
    var pending = document.querySelectorAll('.pill.warn,.badge.warn,.risk.medium,.status.warn').length;
    try {
      if (typeof PAGE !== 'undefined' && PAGE.module === 'timeline' && typeof FILTERED !== 'undefined') {
        critical = FILTERED.filter(function(r){return /delay|overdue|blocked|critical/i.test(String(r.status||r.task_status||''));}).length;
        pending = FILTERED.filter(function(r){return !/done|complete|completed|closed/i.test(String(r.status||r.task_status||''));}).length;
      }
    } catch (e) {}
    strip.innerHTML =
      '<div class="ait-decision-title"><span>' + (rtl ? 'ملخص القرار' : 'Decision snapshot') + '</span><small>' + (rtl ? 'يتحدث تلقائيًا حسب الفلاتر' : 'Updates with your filters') + '</small></div>' +
      '<div class="ait-decision-metric"><b>' + rows + '</b><span>' + (rtl ? 'نطاق البيانات' : 'Data scope') + '</span></div>' +
      '<div class="ait-decision-metric danger"><b>' + critical + '</b><span>' + (rtl ? 'حالات حرجة ظاهرة' : 'Visible critical items') + '</span></div>' +
      '<div class="ait-decision-metric warning"><b>' + pending + '</b><span>' + (rtl ? 'قيد المتابعة' : 'Needs follow-up') + '</span></div>' +
      '<div class="ait-decision-metric updated"><b>' + updated + '</b><span>' + (rtl ? 'آخر تحديث' : 'Last update') + '</span></div>';
  }
  function installDecisionStrip() {
    var grid = document.querySelector('main.content > .kpi-grid, .content > .kpi-grid');
    if (!grid || document.querySelector('.ait-decision-strip')) return;
    var strip = document.createElement('section');
    strip.className = 'ait-decision-strip';
    strip.setAttribute('aria-live', 'polite');
    grid.insertAdjacentElement('afterend', strip);
    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () { scheduled = false; updateDecisionStrip(strip); });
    });
    ['#sCount','#tableCount','#lastUpdate','#tBody'].forEach(function (sel) {
      var node = document.querySelector(sel);
      if (node) observer.observe(node, { childList: true, subtree: true, characterData: true });
    });
    updateDecisionStrip(strip);
  }

  // The generic dashboard template originally paired domain-specific labels
  // with generic record counters. Calculate each management KPI from matching
  // business fields so a label never presents an unrelated number.
  function installSemanticKpis() {
    try {
      if (typeof PAGE === 'undefined' || typeof FILTERED === 'undefined' || typeof window.computeKPIs !== 'function') return;
      var moduleName = String(PAGE.module || '');
      var supported = ['exec','performance','budget','expenses','cost','cashflow','risks','vendors','approvals','timeline','mines','spareparts'];
      if (supported.indexOf(moduleName) < 0) return;
      var fallback = window.computeKPIs;
      function rawValue(row, keys) {
        for (var i = 0; i < keys.length; i++) {
          var value = row && row[keys[i]];
          if (value !== undefined && value !== null && value !== '') return value;
        }
        return null;
      }
      function numberValue(value) {
        if (value === null || value === undefined || value === '') return null;
        var parsed = parseFloat(String(value).replace(/,/g, '').replace(/[^0-9.\-]/g, ''));
        return isNaN(parsed) ? null : parsed;
      }
      function sum(rows, keys, predicate) {
        var total = 0, found = false;
        rows.forEach(function (row) {
          if (predicate && !predicate(row)) return;
          var value = numberValue(rawValue(row, keys));
          if (value !== null) { total += value; found = true; }
        });
        return found ? total : null;
      }
      function average(rows, keys, predicate) {
        var total = 0, count = 0;
        rows.forEach(function (row) {
          if (predicate && !predicate(row)) return;
          var value = numberValue(rawValue(row, keys));
          if (value !== null) { total += value; count++; }
        });
        return count ? total / count : null;
      }
      function text(row) { return Object.keys(row || {}).map(function (key) { return row[key]; }).join(' '); }
      function matches(re) { return function (row) { return re.test(text(row)); }; }
      function count(rows, re) { return rows.filter(matches(re)).length; }
      function distinct(rows, keys, predicate) {
        var values = {};
        rows.forEach(function (row) {
          if (predicate && !predicate(row)) return;
          var value = rawValue(row, keys);
          if (value !== null && String(value).trim()) values[String(value).trim()] = true;
        });
        return Object.keys(values).length;
      }
      function latest(rows) {
        var dates = rows.map(function (row) { return rawValue(row, ['date','Date','updated_at','last_update','created_at','due_date','month','Month','Timestamp']); }).filter(Boolean).map(String).sort();
        return dates.length ? dates[dates.length - 1].slice(0, 19) : '—';
      }
      function money(value) { return value === null ? '—' : (typeof fmt === 'function' ? fmt(value) : String(Math.round(value))); }
      function pct(value) { return value === null || !isFinite(value) ? '—' : (Math.round(value * 10) / 10) + '%'; }
      function item(value, note) { return { v: value === null ? '—' : value, n: note || 'visible filtered data' }; }
      window.computeKPIs = function () {
        try {
          var rows = FILTERED || [];
          var done = matches(/approved|paid|done|closed|complete|completed|pass|accepted/i);
          var pending = matches(/pending|open|progress|waiting|review|قيد|معلق/i);
          var bad = matches(/rejected|overdue|delayed|high|fail|black|risk|critical|blocked/i);
          var out, total, spent, inflow, outflow, opening, completed;
          if (moduleName === 'budget') {
            total = sum(rows, ['budget','total_budget','allocated_budget','allocation','planned','plan_amount']);
            var committed = sum(rows, ['committed','commitment','committed_amount','po_value']);
            spent = sum(rows, ['spent','actual','actual_amount','expenses','paid_amount','amount']);
            var remaining = sum(rows, ['remaining','balance','remaining_budget']);
            if (remaining === null && total !== null && spent !== null) remaining = total - spent;
            var variance = sum(rows, ['variance','budget_variance']);
            if (variance === null) variance = remaining;
            out = [item(money(total),'allocated'),item(money(committed),'committed'),item(money(spent),'actual spend'),item(money(remaining),'available balance'),item(money(variance),'budget variance'),item(total ? pct((spent || 0) / total * 100) : '—','spent / budget'),item(distinct(rows,['category','department','cost_center']),'budget groups'),item(latest(rows),'latest record')];
          } else if (moduleName === 'expenses') {
            total = sum(rows,['amount','Amount','total','expense','cost','invoice_amount']);
            var paid = sum(rows,['amount','Amount','total','expense','cost','invoice_amount'],done);
            var pendingAmount = sum(rows,['amount','Amount','total','expense','cost','invoice_amount'],pending);
            var overdueAmount = sum(rows,['amount','Amount','total','expense','cost','invoice_amount'],bad);
            out=[item(money(total),'registered value'),item(money(paid),'paid value'),item(money(pendingAmount),'pending value'),item(money(overdueAmount),'overdue / issue value'),item(rows.length?money(total/rows.length):'—','per record'),item(distinct(rows,['vendor','supplier','Contractor_Name','vendor_name']),'unique vendors'),item(count(rows,/this month|current month/i)||distinct(rows,['month','Month']),'period coverage'),item(latest(rows),'latest record')];
          } else if (moduleName === 'cost') {
            total=sum(rows,['total_cost','cost','amount','Amount','value']);var tons=sum(rows,['tonnage','tons','qty_ton','quantity_ton','production_ton']);
            out=[item(money(total),'all cost items'),item(total!==null&&tons?money(total/tons):money(average(rows,['cost_per_ton','unit_cost'])),'weighted where possible'),item(money(sum(rows,['mining_cost','mine_cost'])),'mining'),item(money(sum(rows,['crushing_cost','processing_cost'])),'processing'),item(money(sum(rows,['transport_cost','logistics_cost'])),'logistics'),item(money(sum(rows,['port_cost','port_fees'])),'port'),item(money(sum(rows,['variance','cost_variance'])),'plan vs actual'),item(latest(rows),'latest record')];
          } else if (moduleName === 'cashflow') {
            opening=sum(rows,['opening_cash','opening_balance']);inflow=sum(rows,['inflow','cash_in','receipts','credit','collections']);outflow=sum(rows,['outflow','cash_out','payments','debit']);var net=(inflow===null&&outflow===null)?null:(inflow||0)-(outflow||0);var closing=sum(rows,['closing_cash','closing_balance']);if(closing===null&&opening!==null&&net!==null)closing=opening+net;
            out=[item(money(opening),'opening balance'),item(money(inflow),'cash received'),item(money(outflow),'cash paid'),item(money(net),'inflows − outflows'),item(money(closing),'calculated / reported'),item(money(sum(rows,['forecast','forecast_balance'])),'forecast balance'),item(money(sum(rows,['collections','collection_amount','receipts'])),'collections'),item(latest(rows),'latest record')];
          } else if (moduleName === 'risks') {
            var open=count(rows,/open|active|pending|progress/i);var high=count(rows,/high|critical|severe|عالي|حرج/i);var medium=count(rows,/medium|moderate|متوسط/i);var low=count(rows,/low|minor|منخفض/i);var closed=count(rows,/closed|resolved|mitigated|complete/i);
            out=[item(open||Math.max(0,rows.length-closed),'currently open'),item(high,'high / critical'),item(medium,'medium'),item(low,'low'),item(count(rows,/overdue|late|delayed/i),'late actions'),item(closed,'closed / mitigated'),item(money(average(rows,['risk_score','score','severity_score'])),'average score'),item(latest(rows),'latest record')];
          } else if (moduleName === 'vendors') {
            out=[item(distinct(rows,['vendor','vendor_name','supplier','Contractor_Name','name'])||rows.length,'unique records'),item(count(rows,/contractor|مقاول/i),'contractors'),item(count(rows,/supplier|vendor|مورد/i),'suppliers'),item(rows.filter(function(r){return !!rawValue(r,['bank','bank_name','iban','account_number','swift']);}).length,'bank details present'),item(rows.filter(function(r){return !rawValue(r,['phone','mobile','email','contact','contact_person']);}).length,'contact data missing'),item(count(rows,/active|enabled|approved/i),'active'),item(distinct(rows,['category','type','vendor_type']),'categories'),item(latest(rows),'latest record')];
          } else if (moduleName === 'approvals') {
            out=[item(rows.length,'all requests'),item(count(rows,/approved|accepted/i),'approved'),item(count(rows,/pending|waiting|review|open/i),'pending'),item(count(rows,/rejected|declined/i),'rejected'),item(count(rows,/overdue|late|delayed/i),'overdue'),item(money(average(rows,['days','cycle_days','approval_days','duration_days'])),'average cycle days'),item(distinct(rows,['approver','approved_by','manager','owner']),'unique approvers'),item(latest(rows),'latest record')];
          } else if (moduleName === 'timeline') {
            var tasks=rows.filter(function(r){return !(r.is_summary===true||String(r.is_summary).toLowerCase()==='true');});
            if(!tasks.length)tasks=rows;
            completed=tasks.filter(function(r){return /done|complete|completed|closed/i.test(String(rawValue(r,['status','task_status'])||''))||numberValue(rawValue(r,['completion_pct','progress_pct','completion','progress','pct_of_task_complete']))>=99.5;}).length;
            var progress=tasks.filter(function(r){var p=numberValue(rawValue(r,['completion_pct','progress_pct','completion','progress','pct_of_task_complete']))||0;return p>0&&p<99.5;}).length,now=new Date(),soon=new Date(now.getTime()+14*86400000),overdue=0,upcoming=0,critical=0;
            tasks.forEach(function(r){var dueRaw=rawValue(r,['due_date','planned_finish','end_date','deadline']),due=dueRaw?new Date(dueRaw):null,p=numberValue(rawValue(r,['completion_pct','progress_pct','completion','progress','pct_of_task_complete']))||0,isDone=p>=99.5||/done|complete|completed|closed/i.test(String(rawValue(r,['status','task_status'])||''));if(due&&!isNaN(due)){if(due<now&&!isDone)overdue++;if(due>=now&&due<=soon&&!isDone)upcoming++;}if(/true|critical|high priority|مسار حرج/i.test(String(rawValue(r,['priority','critical_path','is_critical'])||'')))critical++;});
            var health=average(tasks,['completion_pct','progress_pct','completion','progress','pct_of_task_complete']);
            var dataDate=tasks.length?rawValue(tasks[0],['data_date','schedule_date']):null;
            out=[item(tasks.length,'work packages / tasks'),item(completed,'completed'),item(progress,'in progress'),item(overdue||count(tasks,/delay|late|overdue|blocked/i),'past due'),item(upcoming,'due within 14 days'),item(critical,'critical activities'),item(pct(health),'average task progress'),item(dataDate||latest(tasks),'schedule data date')];
          } else if (moduleName === 'mines') {
            var mineKeys=['mine','mine_name','Mine','project','location'];var activeMine=matches(/active|operating|production|مفعل|نشط/i);
            out=[item(distinct(rows,mineKeys)||rows.length,'unique mines'),item(distinct(rows,mineKeys,activeMine),'active mines'),item(money(sum(rows,['tonnage','tons','quantity_ton','production_ton','qty'])),'total tons'),item(pct(average(rows,['fe','fe_pct','avg_fe_pct','Fe'])), 'average grade'),item(distinct(rows,['zone','area','pit','block']),'active zones'),item(distinct(rows,['lot','lot_id','lot_no','batch']),'lots'),item(distinct(rows,['sample','sample_id','sample_no']),'samples'),item(latest(rows),'latest record')];
          } else if (moduleName === 'spareparts') {
            var closingStock=sum(rows,['closing_stock','balance','stock_balance','on_hand']);var lowStock=rows.filter(function(r){var q=numberValue(rawValue(r,['closing_stock','balance','stock_balance','on_hand'])),min=numberValue(rawValue(r,['minimum_stock','min_stock','reorder_level']));return q!==null&&min!==null&&q<=min;}).length;
            out=[item(distinct(rows,['item','Item','item_code','sku','part_number'])||rows.length,'unique items'),item(money(sum(rows,['received','received_qty','qty_in'])),'received quantity'),item(money(sum(rows,['delivered','issued','delivered_qty','qty_out'])),'delivered quantity'),item(money(sum(rows,['returned','returned_qty'])),'returned quantity'),item(money(closingStock),'on-hand quantity'),item(lowStock,'at / below minimum'),item(distinct(rows,['category','item_category','group']),'categories'),item(latest(rows),'latest record')];
          } else if (moduleName === 'performance') {
            out=[item(pct(average(rows,['kpi_score','score','performance_score'])),'average KPI'),item(pct(average(rows,['production_rate','production_pct'])),'production'),item(pct(average(rows,['quality_rate','quality_pct','pass_rate'])),'quality'),item(pct(average(rows,['on_time_rate','on_time_pct'])),'schedule'),item(money(average(rows,['cost_index','cost_performance_index'])),'cost index'),item(money(average(rows,['risk_index','risk_score'])),'risk index'),item(pct(average(rows,['efficiency','efficiency_pct'])),'efficiency'),item(latest(rows),'latest record')];
          } else if (moduleName === 'exec') {
            out=[item(distinct(rows,['lot','lot_id','lot_no','batch']),'unique lots'),item(distinct(rows,['sample','sample_id','sample_no']),'unique samples'),item(pct(average(rows,['fe','fe_pct','avg_fe_pct','Fe'])),'average grade'),item(pct(average(rows,['pass_rate','quality_rate','quality_pct'])),'quality pass'),item(money(sum(rows,['mine_tonnage','tonnage','tons','production_ton'])),'mine tons'),item(money(sum(rows,['at_port','port_tonnage','port_qty'])),'port tons'),item(distinct(rows,['mine','mine_name','Mine'],matches(/active|operating|production/i)),'active mines'),item(latest(rows),'latest record')];
          }
          return out || fallback();
        } catch (e) { return fallback(); }
      };
    } catch (e) {}
  }

  function installTimelineExperience() {
    try {
      if (typeof PAGE === 'undefined' || String(PAGE.module || '') !== 'timeline') return;
      var oldGrid = document.querySelector('main.content > .grid3, .content > .grid3');
      if (!oldGrid) return;
      oldGrid.className = 'ait-timeline-layout';
      oldGrid.innerHTML =
        '<section class="card ait-gantt-card">' +
          '<div class="card-head"><div><h3>Project schedule &amp; critical path</h3><span>Progress is shown inside each activity bar</span></div><span id="aitGanttRange">—</span></div>' +
          '<div class="ait-gantt-scroll"><div class="ait-gantt-board">' +
            '<div class="ait-gantt-axis"><span>Activity / owner</span><div id="aitGanttScale"></div><span>Status</span></div>' +
            '<div id="aitGanttRows"></div>' +
          '</div></div>' +
        '</section>' +
        '<aside class="ait-timeline-rail">' +
          '<section class="card ait-health-card"><div class="card-head"><h3>Schedule health</h3><span id="aitHealthLabel">—</span></div><div id="aitScheduleHealth"></div></section>' +
          '<section class="card ait-actions-card"><div class="card-head"><h3>Priority actions</h3><span>Owner &amp; due date</span></div><div id="aitTimelineActions"></div></section>' +
        '</aside><div hidden><span id="hChart1"></span><span id="hChart2"></span><span id="hChart3"></span><span id="sChart1"></span><span id="sChart2"></span><span id="sChart3"></span></div>';
      function escText(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];}); }
      function first(row,keys,fallback){for(var i=0;i<keys.length;i++){var v=row&&row[keys[i]];if(v!==undefined&&v!==null&&v!=='')return v;}return fallback||'';}
      function parseDate(value){if(!value)return null;var d=new Date(value);return isNaN(d)?null:d;}
      function day(value){var d=value instanceof Date?value:parseDate(value);return d?d.toISOString().slice(0,10):'—';}
      function statusClass(value){value=String(value||'').toLowerCase();if(/delay|overdue|blocked|critical/.test(value))return 'danger';if(/progress|started|active/.test(value))return 'progress';if(/done|complete|closed/.test(value))return 'done';return 'upcoming';}
      window.AIT_renderTimeline = function(rows) {
        rows = Array.isArray(rows) ? rows.slice() : [];
        function bool(v){return v===true||/^(true|1|yes|y|critical)$/i.test(String(v||''));}
        function pctValue(v){var n=parseFloat(String(v==null?'':v).replace(/,/g,'').replace(/[^0-9.\-]/g,''));if(isNaN(n))return 0;if(n>0&&n<=1)n*=100;return Math.max(0,Math.min(100,n));}
        function computedStatus(status,progress,due){var s=String(status||'').trim();if(s)return s;if(progress>=99.5)return 'Completed';var now=new Date();if(due&&due<now)return 'Overdue';if(progress>0)return 'In Progress';return 'Not Started';}
        var normalized = rows.map(function(r,index){
          var start=parseDate(first(r,['start_date','planned_start','date','Date']));
          var due=parseDate(first(r,['due_date','planned_finish','end_date','deadline']));
          if(!start&&due)start=new Date(due.getTime()-5*86400000);
          if(!due&&start)due=new Date(start.getTime()+5*86400000);
          var progress=pctValue(first(r,['completion_pct','pct_of_task_complete','progress_pct','completion','progress'],0));
          var summary=bool(first(r,['is_summary','summary'],false));
          var wbs=first(r,['wbs_number','wbs','WBS_NUMBER'],'');
          var task=first(r,['task_title','task','milestone','activity','name','TASK_TITLE'],'Activity '+(index+1));
          var owner=first(r,['task_owner','owner','responsible','assigned_to','department','TASK_OWNER'],summary?'—':'Unassigned');
          var status=computedStatus(first(r,['status','task_status','schedule_status'],''),progress,due);
          var critical=bool(first(r,['critical_path','priority','is_critical'],false))||/critical/i.test(String(first(r,['priority'],'')));
          return{raw:r,index:index,order:parseFloat(first(r,['source_row','order','row'],index+1))||index+1,start:start,due:due,wbs:wbs,task:task,owner:owner,status:status,critical:critical,progress:progress,summary:summary,phase:first(r,['phase','category'],'')};
        }).filter(function(x){return String(x.task||'').trim()!=='';});
        normalized.sort(function(a,b){return a.order-b.order;});
        var dated=normalized.filter(function(x){return x.start&&x.due;}),min=dated.length?new Date(Math.min.apply(null,dated.map(function(x){return x.start.getTime();}))):new Date(),max=dated.length?new Date(Math.max.apply(null,dated.map(function(x){return x.due.getTime();}))):new Date(Date.now()+30*86400000);
        if(max<=min)max=new Date(min.getTime()+30*86400000);
        var span=Math.max(86400000,max-min),mid=new Date(min.getTime()+span/2);
        document.getElementById('aitGanttRange').textContent=day(min)+' → '+day(max);
        document.getElementById('aitGanttScale').innerHTML='<span>'+day(min)+'</span><span>'+day(mid)+'</span><span>'+day(max)+'</span>';
        var phases=normalized.filter(function(x){return x.summary;});
        var tasks=normalized.filter(function(x){return !x.summary;});
        var shown=(phases.length?normalized:tasks).slice(0,18);
        document.getElementById('aitGanttRows').innerHTML=shown.map(function(x){
          var left=x.start?Math.max(0,Math.min(96,(x.start-min)/span*100)):0;
          var width=x.start&&x.due?Math.max(4,Math.min(100-left,(x.due-x.start)/span*100)):18;
          var cls=statusClass(x.status),critical=x.critical;
          if(x.summary){
            return '<div class="ait-gantt-row ait-gantt-summary"><div class="ait-gantt-task"><b>'+escText((x.wbs?x.wbs+' · ':'')+x.task)+'</b><span>Project phase</span></div><div class="ait-gantt-track"><div class="ait-gantt-bar phase" style="left:'+left.toFixed(2)+'%;width:'+width.toFixed(2)+'%"><i style="width:'+x.progress+'%"></i><span>'+Math.round(x.progress)+'%</span></div></div><div class="ait-gantt-status"><span class="pill">Phase</span><small>'+day(x.due)+'</small></div></div>';
          }
          return '<div class="ait-gantt-row"><div class="ait-gantt-task"><b>'+escText((x.wbs?x.wbs+' · ':'')+x.task)+'</b><span>'+escText(x.owner)+(critical?' · Critical path':'')+'</span></div><div class="ait-gantt-track"><div class="ait-gantt-bar '+cls+'" style="left:'+left.toFixed(2)+'%;width:'+width.toFixed(2)+'%"><i style="width:'+x.progress+'%"></i><span>'+Math.round(x.progress)+'%</span></div></div><div class="ait-gantt-status"><span class="pill '+(cls==='danger'?'bad':cls==='progress'?'warn':cls==='done'?'good':'')+'">'+escText(x.status)+'</span><small>'+day(x.due)+'</small></div></div>';
        }).join('') || '<div class="empty">No scheduled activities found.</div>';
        if(normalized.length>shown.length){document.getElementById('aitGanttRows').insertAdjacentHTML('beforeend','<div class="ait-gantt-more">Showing 18 of '+normalized.length+' rows. Use the detailed table below for the full schedule.</div>');}
        var metricRows=tasks.length?tasks:normalized;
        var completed=metricRows.filter(function(x){return x.progress>=99.5||/done|complete|closed/i.test(x.status);}).length;
        var delayed=metricRows.filter(function(x){return /delay|overdue|blocked/i.test(x.status);}).length;
        var critical=metricRows.filter(function(x){return x.critical;}).length;
        var avg=metricRows.length?metricRows.reduce(function(s,x){return s+x.progress;},0)/metricRows.length:0;
        var health=Math.max(0,Math.min(100,avg-(delayed/Math.max(1,metricRows.length))*30));
        document.getElementById('aitHealthLabel').textContent=health>=75?'On track':health>=50?'Needs attention':'At risk';
        document.getElementById('aitScheduleHealth').innerHTML='<div class="ait-health-wrap"><div class="ait-health-ring" style="--health:'+health.toFixed(1)+'"><b>'+Math.round(health)+'%</b><span>health</span></div><div class="ait-health-metrics"><div><b>'+completed+'</b><span>completed</span></div><div><b>'+delayed+'</b><span>overdue</span></div><div><b>'+critical+'</b><span>critical</span></div><div><b>'+Math.round(avg)+'%</b><span>avg progress</span></div></div></div>';
        var now=new Date(),actions=metricRows.filter(function(x){return x.progress<99.5&&!/done|complete|closed/i.test(x.status);}).sort(function(a,b){var ar=/delay|overdue|blocked/i.test(a.status)?0:a.critical?1:2,br=/delay|overdue|blocked/i.test(b.status)?0:b.critical?1:2;if(ar!==br)return ar-br;return (a.due?a.due.getTime():Infinity)-(b.due?b.due.getTime():Infinity);}).slice(0,7);
        document.getElementById('aitTimelineActions').innerHTML=actions.map(function(x){var overdue=x.due&&x.due<now,cls=overdue||/delay|overdue|blocked/i.test(x.status)?'danger':x.critical?'warning':'normal';return '<div class="ait-action '+cls+'"><span></span><div><b>'+escText((x.wbs?x.wbs+' · ':'')+x.task)+'</b><small>'+escText(x.owner)+' · '+(overdue?'Overdue ': 'Due ')+day(x.due)+'</small></div><em>'+Math.round(x.progress)+'%</em></div>';}).join('') || '<div class="empty">No open actions.</div>';
      };
    } catch (e) {}
  }

  function installSemanticChartsAndTables() {
    try {
      if (typeof PAGE === 'undefined' || typeof FILTERED === 'undefined' || typeof window.renderCharts !== 'function' || typeof window.mkChart !== 'function') return;
      var moduleName = String(PAGE.module || '');
      var supported = ['mines','timeline','budget','expenses','cost','cashflow','vendors','approvals','spareparts','risks'];
      if (supported.indexOf(moduleName) < 0) return;
      var palette = ['#fd480e','#22c55e','#38bdf8','#f59e0b','#a78bfa','#ef4444','#14b8a6','#ec4899'];
      function raw(row, keys) {
        for (var i = 0; i < keys.length; i++) {
          var value = row && row[keys[i]];
          if (value !== undefined && value !== null && value !== '') return value;
        }
        return '';
      }
      function n(value) {
        var parsed = parseFloat(String(value == null ? '' : value).replace(/,/g,'').replace(/[^0-9.\-]/g,''));
        return isNaN(parsed) ? 0 : parsed;
      }
      function date(row) { return String(raw(row,['date','Date','month','Month','created_at','due_date','updated_at','Timestamp']) || '').slice(0,10); }
      function label(row, keys, fallback) { return String(raw(row,keys) || fallback || 'Other').trim(); }
      function status(row) { return label(row,['status','payment_status','approval_status','task_status','risk_status','vendor_status'],'Unknown'); }
      function groupSum(rows, labelKeys, valueKeys) {
        var out = {};
        rows.forEach(function(row){var k=label(row,labelKeys,'Other');out[k]=(out[k]||0)+n(raw(row,valueKeys));});
        return out;
      }
      function groupCount(rows, keys, valueFn) {
        var out = {};
        rows.forEach(function(row){var k=valueFn?valueFn(row):label(row,keys,'Other');out[k]=(out[k]||0)+1;});
        return out;
      }
      function groupAverage(rows, labelKeys, valueKeys) {
        var sums={}, counts={};
        rows.forEach(function(row){var k=label(row,labelKeys,'Other'),v=n(raw(row,valueKeys));sums[k]=(sums[k]||0)+v;counts[k]=(counts[k]||0)+1;});
        var out={};Object.keys(sums).forEach(function(k){out[k]=counts[k]?sums[k]/counts[k]:0;});return out;
      }
      function sortedKeys(map, max) { return Object.keys(map).sort(function(a,b){return map[b]-map[a];}).slice(0,max||12); }
      function chronological(map) { return Object.keys(map).sort().slice(-18); }
      function values(map, keys) { return keys.map(function(k){return map[k]||0;}); }
      function chart(id,type,map,datasetLabel,color,legend,max) {
        var keys = type === 'line' ? chronological(map) : sortedKeys(map,max);
        if (!keys.length) keys=['No data'];
        var data = keys[0] === 'No data' ? [0] : values(map,keys);
        var ds={label:datasetLabel,data:data,borderColor:color||palette[0],backgroundColor:type==='line'?(color||palette[0])+'22':(type==='doughnut'?palette.map(function(c){return c+'dd';}):(color||palette[0])+'d9'),borderRadius:type==='bar'?7:0,tension:.35,fill:type==='line',pointRadius:3};
        mkChart(id,type,keys,[ds],{legend:legend !== false});
        return keys[0] === 'No data' ? 0 : keys.length;
      }
      function setMeta(a,b,c){document.getElementById('sChart1').textContent=a;document.getElementById('sChart2').textContent=b;document.getElementById('sChart3').textContent=c;}
      window.renderCharts = function() {
        var rows = FILTERED || [], a={},b={},c={},keys,days;
        if (moduleName === 'mines') {
          a=groupSum(rows,['mine','mine_name','Mine','project'],['tonnage','tons','production_ton','quantity_ton','qty']);
          b=groupAverage(rows,['mine','mine_name','Mine','project'],['avg_fe_pct','fe_pct','Fe','fe']);
          c=groupCount(rows,[],status);
          chart('c1','bar',a,'Tonnage','#fd480e',false,10);chart('c2','bar',b,'Average Fe %','#22c55e',false,10);chart('c3','doughnut',c,'Mine Status',null,true,10);setMeta(Object.keys(a).length+' mines','weighted quality',Object.keys(c).length+' statuses');
        } else if (moduleName === 'timeline') {
          if (typeof window.AIT_renderTimeline === 'function') window.AIT_renderTimeline(rows);
        } else if (moduleName === 'budget') {
          a=groupSum(rows,['category','department','cost_center'],['budget','total_budget','allocated_budget','allocation']);
          var actual=groupSum(rows,['category','department','cost_center'],['spent','actual','actual_amount','amount']);keys=sortedKeys(a,10);mkChart('c1','bar',keys,[{label:'Budget',data:values(a,keys),backgroundColor:'#38bdf8cc',borderRadius:7},{label:'Actual',data:values(actual,keys),backgroundColor:'#fd480edd',borderRadius:7}],{legend:true});
          b=actual;c={};rows.forEach(function(r){var d=String(raw(r,['month','Month'])||date(r).slice(0,7)).slice(0,7);if(d)c[d]=(c[d]||0)+n(raw(r,['spent','actual','amount']));});
          chart('c2','doughnut',b,'Spending',null,true,10);chart('c3','line',c,'Monthly Burn','#fd480e',false);setMeta(keys.length+' budget groups',Object.keys(b).length+' categories',Object.keys(c).length+' months');
        } else if (moduleName === 'expenses') {
          a=groupSum(rows,['category','department','expense_type'],['amount','expense','invoice_amount','total','cost']);
          b={};rows.forEach(function(r){var s=status(r);b[s]=(b[s]||0)+n(raw(r,['amount','expense','invoice_amount','total','cost']));});
          c={};rows.forEach(function(r){var d=String(raw(r,['month','Month'])||date(r).slice(0,7)).slice(0,7);if(d)c[d]=(c[d]||0)+n(raw(r,['amount','expense','invoice_amount','total','cost']));});
          chart('c1','bar',a,'Expenses','#fd480e',false,10);chart('c2','doughnut',b,'Payment Status',null,true,10);chart('c3','line',c,'Monthly Expenses','#f59e0b',false);setMeta(Object.keys(a).length+' cost groups',Object.keys(b).length+' payment statuses',Object.keys(c).length+' months');
        } else if (moduleName === 'cost') {
          a=groupAverage(rows,['mine','mine_name','project'],['cost_per_ton','unit_cost']);
          b={Mining:0,Crushing:0,Transport:0,Port:0};rows.forEach(function(r){b.Mining+=n(raw(r,['mining_cost','mine_cost']));b.Crushing+=n(raw(r,['crushing_cost','processing_cost']));b.Transport+=n(raw(r,['transport_cost','logistics_cost']));b.Port+=n(raw(r,['port_cost','port_fees']));});
          c={};rows.forEach(function(r){var d=date(r);if(d)c[d]=(c[d]||0)+n(raw(r,['total_cost','cost','amount']));});
          chart('c1','bar',a,'Cost / Ton','#38bdf8',false,10);chart('c2','doughnut',b,'Cost Breakdown',null,true,10);chart('c3','line',c,'Total Cost','#a78bfa',false);setMeta(Object.keys(a).length+' mines','4 cost components',Object.keys(c).length+' dates');
        } else if (moduleName === 'cashflow') {
          var inflow={},outflow={};rows.forEach(function(r){var d=String(raw(r,['month','Month'])||date(r).slice(0,7)).slice(0,7);if(!d)return;inflow[d]=(inflow[d]||0)+n(raw(r,['inflow','cash_in','receipts','collections']));outflow[d]=(outflow[d]||0)+n(raw(r,['outflow','cash_out','payments']));});keys=chronological(Object.assign({},inflow,outflow));mkChart('c1','line',keys,[{label:'Inflows',data:values(inflow,keys),borderColor:'#22c55e',backgroundColor:'#22c55e22',fill:true,tension:.35},{label:'Outflows',data:values(outflow,keys),borderColor:'#ef4444',backgroundColor:'#ef444422',fill:true,tension:.35}],{legend:true});
          mkChart('c2','bar',keys,[{label:'Inflows',data:values(inflow,keys),backgroundColor:'#22c55ecc',borderRadius:7},{label:'Outflows',data:values(outflow,keys),backgroundColor:'#ef4444cc',borderRadius:7}],{legend:true});
          c=groupAverage(rows,['month','Month','date','Date'],['closing_cash','closing_balance','forecast_balance']);chart('c3','line',c,'Closing Balance','#38bdf8',false);setMeta(keys.length+' forecast periods','cash movement',Object.keys(c).length+' balances');
        } else if (moduleName === 'vendors') {
          a=groupCount(rows,['vendor_type','type','source_type']);
          b={Contact:0,'Bank Data':0,Email:0};rows.forEach(function(r){if(raw(r,['phone','mobile','contact','contact_person']))b.Contact++;if(raw(r,['bank','bank_name','iban','account_number']))b['Bank Data']++;if(raw(r,['email']))b.Email++;});
          c={};rows.forEach(function(r){var d=String(raw(r,['month','Month'])||date(r).slice(0,7)).slice(0,7);if(d)c[d]=(c[d]||0)+1;});
          chart('c1','doughnut',a,'Vendor Type',null,true,10);chart('c2','bar',b,'Complete Records','#22c55e',false,10);chart('c3','line',c,'New Vendors','#38bdf8',false);setMeta(rows.length+' vendors','data completeness',Object.keys(c).length+' periods');
        } else if (moduleName === 'approvals') {
          a=groupCount(rows,[],status);b=groupCount(rows,['department','category','request_department']);c=groupAverage(rows,['date','Date','month','Month'],['approval_days','cycle_days','duration_days','days']);
          chart('c1','doughnut',a,'Approval Status',null,true,10);chart('c2','bar',b,'Requests','#38bdf8',false,10);chart('c3','line',c,'Average Cycle Days','#f59e0b',false);setMeta(rows.length+' requests',Object.keys(b).length+' departments',Object.keys(c).length+' periods');
        } else if (moduleName === 'spareparts') {
          a=groupSum(rows,['category','item_category','group'],['closing_stock','stock_balance','on_hand']);
          b={Received:0,Delivered:0,Returned:0};rows.forEach(function(r){b.Received+=n(raw(r,['received','received_qty','qty_in']));b.Delivered+=n(raw(r,['delivered','delivered_qty','issued','qty_out']));b.Returned+=n(raw(r,['returned','returned_qty']));});
          c={};rows.forEach(function(r){var d=date(r);if(d)c[d]=(c[d]||0)+n(raw(r,['closing_stock','stock_balance','on_hand']));});
          chart('c1','bar',a,'Closing Stock','#38bdf8',false,10);chart('c2','doughnut',b,'Stock Movement',null,true,10);chart('c3','line',c,'Stock Balance','#22c55e',false);setMeta(Object.keys(a).length+' stock groups','movement quantities',Object.keys(c).length+' dates');
        } else if (moduleName === 'risks') {
          a=groupCount(rows,['severity','risk_level','priority']);b=groupCount(rows,['area','department','category','risk_area']);c=groupAverage(rows,['date','Date','month','Month'],['risk_score','severity_score','score']);
          chart('c1','doughnut',a,'Risk Severity',null,true,10);chart('c2','bar',b,'Risk Count','#ef4444',false,10);chart('c3','line',c,'Average Risk Score','#f59e0b',false);setMeta(rows.length+' risks',Object.keys(b).length+' risk areas',Object.keys(c).length+' periods');
        }
      };
      var tableColumns = {
        mines:['mine','mine_name','status','zone','tonnage','production_ton','avg_fe_pct','lots','samples','updated_at','date'],
        timeline:['wbs_number','task_title','task_owner','phase','status','start_date','due_date','duration_days','completion_pct','critical_path'],
        budget:['category','department','budget','committed','spent','remaining','variance','status','date','notes'],
        expenses:['date','category','vendor','invoice_number','amount','payment_status','status','due_date','department','notes'],
        cost:['date','mine','category','total_cost','cost_per_ton','mining_cost','crushing_cost','transport_cost','port_cost','variance'],
        cashflow:['date','month','opening_cash','inflow','outflow','net_cash','closing_cash','forecast_balance','collections','status'],
        vendors:['vendor_name','vendor','vendor_type','category','contact_person','phone','email','bank_name','iban','status'],
        approvals:['date','request_id','department','category','amount','approver','status','approval_days','due_date','notes'],
        spareparts:['date','item_code','item','category','received_qty','delivered_qty','returned_qty','closing_stock','minimum_stock','status'],
        risks:['date','risk_id','category','area','severity','risk_score','status','owner','due_date','notes']
      };
      var fallbackPick = window.pickKeys;
      window.pickKeys = function(rows) {
        var preferred=tableColumns[moduleName]||[],all=[];(rows||[]).slice(0,80).forEach(function(r){Object.keys(r||{}).forEach(function(k){if(all.indexOf(k)<0)all.push(k);});});
        var chosen=preferred.filter(function(k){return all.indexOf(k)>=0;});
        return chosen.concat(all.filter(function(k){return chosen.indexOf(k)<0;})).slice(0,10) || fallbackPick(rows);
      };
    } catch (e) {}
  }
  function bootEnhancements() {
    setEmbeddedMode(EMBEDDED);
    if (document.getElementById('loginForm')) document.body.classList.add('ait-auth-page');
    document.body.classList.toggle('ait-touch', matchMedia('(pointer:coarse)').matches);
    installPageBrand();
    installSemanticKpis();
    installTimelineExperience();
    installSemanticChartsAndTables();
    installDecisionStrip();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootEnhancements);
  else bootEnhancements();
})();
