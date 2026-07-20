(function () {
  'use strict';

  var FALLBACK_API = 'https://script.google.com/macros/s/AKfycbxfl8DMsgy__jtquMmQX0-RByrW2qIL45nzH8imv-slUdUkJm8XwTJjsz6gphtua-LJiw/exec';
  var COLORS = ['#ff5a1f','#38bdf8','#22c55e','#f59e0b','#a78bfa','#2dd4bf','#ef4444','#ec4899','#84cc16','#f97316','#06b6d4','#8b5cf6','#eab308','#14b8a6','#fb7185','#60a5fa'];
  var DEFAULT_STAGES = [
    { key:'lot_before_crusher_ton', label:'Before Crusher / Zone', ar:'قبل الكسارة من الزون' },
    { key:'lot_after_crusher_ton', label:'After Crusher', ar:'بعد الكسارة' },
    { key:'lot_mine_store_ton', label:'Mine Store', ar:'مخزن المنجم' },
    { key:'lot_general_store_ton', label:'General Store', ar:'المخزن العام' },
    { key:'lot_factory_ton', label:'Factory', ar:'المصنع' },
    { key:'lot_factory_store_ton', label:'Factory Store', ar:'مخزن المصنع' },
    { key:'lot_port_stockpile_ton', label:'Port Stockpile', ar:'تشوين الميناء' }
  ];

  var TEXT = {
    ar: {
      loadingTitle:'جار تحميل بيانات الإنتاج', loadingHint:'يتم الاتصال بمصدر البيانات والتحقق من السجلات…', syncing:'جار مزامنة بيانات الإنتاج…',
      pageTitle:'الإنتاج واللوطات والمعدات', pageSubtitle:'متابعة الإنتاج اليومي، حركة اللوطات، وكفاءة تشغيل المعدات من شاشة واحدة', connecting:'جار الاتصال…', connected:'متصل', connectionFailed:'تعذر الاتصال',
      exportExcel:'تصدير Excel', refresh:'مزامنة وتحديث', filtersTitle:'فلاتر العرض', filtersToggle:'إظهار / إخفاء الفلاتر', mine:'المنجم', zone:'الموقع / الزون', stage:'مرحلة اللوط', equipment:'المعدة', equipmentClass:'تصنيف المعدة', fromDate:'من تاريخ', toDate:'إلى تاريخ', searchLabel:'بحث', searchPlaceholder:'ابحث باسم اللوط أو المعدة أو المقاول', resetFilters:'مسح الفلاتر',
      tabOverview:'نظرة عامة', tabEquipment:'المعدات', tabLots:'اللوطات', selectedPeriod:'الفترة المختارة', productionTrend:'اتجاه الإنتاج وساعات التشغيل', productionTrendHint:'الطن والمتر المكعب وصافي ساعات التشغيل يومًا بيوم', managementView:'ملخص إداري', decisionSummary:'مؤشرات تحتاج متابعة', lotMovement:'حركة اللوطات', stageFlow:'الكميات عبر مراحل الإنتاج', stageFlowHint:'إجمالي الكمية المسجلة في كل مرحلة مع عدد اللوطات الموجودة حاليًا', equipmentHealth:'تشغيل المعدات', hoursComposition:'صافي التشغيل والتوقف اليومي', minePerformance:'أداء المناجم', stockByMine:'المخزون الحالي حسب المنجم', qualityIndicator:'مؤشر الجودة', feByMine:'متوسط Fe% المرجح حسب المنجم',
      excavators:'الحفارات', excavatorDailyTons:'إنتاج كل حفار يوميًا بالطن', excavatorDailyM3:'إنتاج كل حفار يوميًا بالمتر المكعب', excavatorDailyHours:'عدد ساعات تشغيل كل حفار يوميًا', oneLinePerEquipment:'كل خط يمثل معدة مستقلة ويتأثر بجميع الفلاتر', netHoursFallback:'يستخدم صافي الساعات، وإن لم تتوفر يستخدم إجمالي ساعات التشغيل', efficiency:'الكفاءة', productivityByEquipment:'إنتاجية المعدات طن / ساعة', productionMix:'مزيج الإنتاج', productionByClass:'الإنتاج حسب نوع المعدة', equipmentSummaryEyebrow:'ملخص المعدات', equipmentOutputTitle:'الإنتاج حسب ساعات التشغيل', equipmentOutputHint:'معدل الساعة = إجمالي الإنتاج ÷ ساعات التشغيل الفعلية', dailyLog:'السجل اليومي', equipmentLogTitle:'تفاصيل تشغيل وإنتاج المعدات', rowsPerPage:'صفوف الصفحة', currentPosition:'الوضع الحالي', fullStageChart:'مقارنة كميات مراحل الإنتاج', stageDistribution:'توزيع اللوطات حسب المرحلة الحالية', variance:'الفروقات', lossByTransition:'الفاقد بين مراحل الإنتاج', lotLog:'سجل اللوطات', lotsTableTitle:'تفاصيل اللوطات ومراحلها الحالية',
      allMines:'كل المناجم', allZones:'كل المواقع', allStages:'كل المراحل', allEquipment:'كل المعدات', allClasses:'كل التصنيفات', excavator:'حفار', loader:'لودر', other:'أخرى',
      rows:'صف', lots:'لوط', equipmentRows:'سجل معدات', noData:'لا توجد بيانات مطابقة للفلاتر الحالية', noChartData:'لا توجد بيانات محسوبة لهذا الرسم', noEquipmentData:'لا توجد بيانات معدات مطابقة للفلاتر الحالية', noLotsData:'لا توجد لوطات مطابقة للفلاتر الحالية',
      productionTons:'إنتاج الفترة', productionM3:'حجم الإنتاج', netHours:'صافي ساعات التشغيل', productivity:'الإنتاجية', activeEquipment:'المعدات النشطة', downtime:'ساعات التوقف', currentStock:'المخزون الحالي', totalLoss:'إجمالي الفاقد', today:'اليوم', grossHours:'إجمالي الساعات', equipmentCount:'معدة', lotCount:'لوط', lossRate:'نسبة الفاقد',
      topEquipment:'أعلى معدة إنتاجًا', highestDowntime:'أعلى معدة توقفًا', bestProductivity:'أفضل إنتاجية', portReady:'لوطات وصلت للميناء', noOperationalData:'لا توجد بيانات تشغيل كافية لإصدار مؤشرات متابعة.',
      tons:'طن', cubicMeters:'م³', hours:'ساعة', tonPerHour:'طن/ساعة', total:'الإجمالي', page:'صفحة', of:'من', previous:'السابق', next:'التالي',
      equipmentName:'المعدة', operatingHours:'ساعات التشغيل', hourlyRateM3:'معدل الساعة (م³)', hourlyRateTons:'معدل الساعة (طن)', totalProductionM3:'إجمالي الإنتاج (م³)', totalProductionTons:'إجمالي الإنتاج (طن)',
      date:'التاريخ', shift:'الوردية', batch:'اللوط', equipmentType:'نوع المعدة', class:'التصنيف', contractor:'المقاول', operator:'المشغل', grossOperatingHours:'إجمالي التشغيل', downtimeHours:'ساعات التوقف', breakdownHours:'ساعات الأعطال', productionTon:'الإنتاج طن', volumeM3:'الإنتاج م³', operationArea:'منطقة العمل', approval:'الاعتماد', notes:'ملاحظات', currentStage:'المرحلة الحالية', currentQty:'الكمية الحالية', beforeCrusher:'قبل الكسارة', afterCrusher:'بعد الكسارة', mineStore:'مخزن المنجم', generalStore:'المخزن العام', factory:'المصنع', factoryStore:'مخزن المصنع', portStockpile:'تشوين الميناء', avgFe:'متوسط Fe%', loss:'الفاقد', lossPct:'نسبة الفاقد',
      exportReady:'تم تجهيز ملف Excel حسب الفلاتر الحالية.', exportMissing:'مكتبة Excel غير متاحة أو لا توجد بيانات للتصدير.', dataLoaded:'تم تحميل البيانات بنجاح.', dataSynced:'تمت المزامنة وتحديث الصفحة.', staleRequest:'تم تجاهل استجابة قديمة.', errorTitle:'تعذر تحميل صفحة الإنتاج', retryHint:'تحقق من رابط Apps Script وصلاحية المستخدم ثم أعد المحاولة.',
      scopeAll:'عرض جميع البيانات', filtersActive:'فلاتر نشطة', lastUpdate:'آخر تحديث', showingAllExcavators:'يتم عرض جميع الحفارات', displayedEquipment:'معدات معروضة',
      stageBeforeCrusher:'قبل الكسارة', stageAfterCrusher:'بعد الكسارة', stageMineStore:'إلى مخزن المنجم', stageGeneralStore:'إلى المخزن العام', stageFactory:'إلى المصنع', stageFactoryStore:'إلى مخزن المصنع', stagePort:'إلى الميناء'
    },
    en: {
      loadingTitle:'Loading production data', loadingHint:'Connecting to the data source and validating records…', syncing:'Synchronizing production data…',
      pageTitle:'Production, Lots & Equipment', pageSubtitle:'Daily production, lot movement and equipment efficiency in one view', connecting:'Connecting…', connected:'Connected', connectionFailed:'Connection failed',
      exportExcel:'Export Excel', refresh:'Sync & refresh', filtersTitle:'View filters', filtersToggle:'Show / hide filters', mine:'Mine', zone:'Location / zone', stage:'Lot stage', equipment:'Equipment', equipmentClass:'Equipment class', fromDate:'From date', toDate:'To date', searchLabel:'Search', searchPlaceholder:'Search lot, equipment or contractor', resetFilters:'Reset filters',
      tabOverview:'Overview', tabEquipment:'Equipment', tabLots:'Lots', selectedPeriod:'Selected period', productionTrend:'Production and operating-hours trend', productionTrendHint:'Tons, cubic meters and net operating hours by day', managementView:'Management view', decisionSummary:'Items requiring attention', lotMovement:'Lot movement', stageFlow:'Quantities across production stages', stageFlowHint:'Total recorded quantity per stage and lots currently at each stage', equipmentHealth:'Equipment operation', hoursComposition:'Net operation and downtime by day', minePerformance:'Mine performance', stockByMine:'Current stock by mine', qualityIndicator:'Quality indicator', feByMine:'Weighted average Fe% by mine',
      excavators:'Excavators', excavatorDailyTons:'Daily production by excavator — tons', excavatorDailyM3:'Daily production by excavator — m³', excavatorDailyHours:'Daily operating hours by excavator', oneLinePerEquipment:'Each line represents one equipment item and follows all filters', netHoursFallback:'Uses net hours, or gross operating hours when net hours are unavailable', efficiency:'Efficiency', productivityByEquipment:'Equipment productivity — tons/hour', productionMix:'Production mix', productionByClass:'Production by equipment class', equipmentSummaryEyebrow:'Equipment summary', equipmentOutputTitle:'Output by operating hours', equipmentOutputHint:'Hourly rate = total production ÷ actual operating hours', dailyLog:'Daily log', equipmentLogTitle:'Equipment operation and production details', rowsPerPage:'Rows per page', currentPosition:'Current position', fullStageChart:'Production stage quantity comparison', stageDistribution:'Lots by current stage', variance:'Variance', lossByTransition:'Loss between production stages', lotLog:'Lot log', lotsTableTitle:'Lot details and current stage',
      allMines:'All mines', allZones:'All locations', allStages:'All stages', allEquipment:'All equipment', allClasses:'All classes', excavator:'Excavator', loader:'Loader', other:'Other',
      rows:'rows', lots:'lots', equipmentRows:'equipment rows', noData:'No data match the current filters', noChartData:'No calculated data for this chart', noEquipmentData:'No equipment data match the current filters', noLotsData:'No lots match the current filters',
      productionTons:'Period production', productionM3:'Production volume', netHours:'Net operating hours', productivity:'Productivity', activeEquipment:'Active equipment', downtime:'Downtime hours', currentStock:'Current stock', totalLoss:'Total loss', today:'Today', grossHours:'Gross hours', equipmentCount:'equipment', lotCount:'lots', lossRate:'Loss rate',
      topEquipment:'Top production equipment', highestDowntime:'Highest downtime', bestProductivity:'Best productivity', portReady:'Port-ready lots', noOperationalData:'There is not enough operational data to produce attention indicators.',
      tons:'tons', cubicMeters:'m³', hours:'hours', tonPerHour:'t/h', total:'Total', page:'Page', of:'of', previous:'Previous', next:'Next',
      equipmentName:'Equipment', operatingHours:'Operating hours', hourlyRateM3:'Hourly rate (m³)', hourlyRateTons:'Hourly rate (tons)', totalProductionM3:'Total production (m³)', totalProductionTons:'Total production (tons)',
      date:'Date', shift:'Shift', batch:'Batch', equipmentType:'Equipment type', class:'Class', contractor:'Contractor', operator:'Operator', grossOperatingHours:'Gross hours', downtimeHours:'Downtime', breakdownHours:'Breakdown', productionTon:'Production tons', volumeM3:'Production m³', operationArea:'Operation area', approval:'Approval', notes:'Notes', currentStage:'Current stage', currentQty:'Current quantity', beforeCrusher:'Before crusher', afterCrusher:'After crusher', mineStore:'Mine store', generalStore:'General store', factory:'Factory', factoryStore:'Factory store', portStockpile:'Port stockpile', avgFe:'Average Fe%', loss:'Loss', lossPct:'Loss %',
      exportReady:'Excel file prepared using the current filters.', exportMissing:'Excel library is unavailable or there is no data to export.', dataLoaded:'Data loaded successfully.', dataSynced:'Data synchronized and refreshed.', staleRequest:'An older response was ignored.', errorTitle:'Could not load the production page', retryHint:'Check the Apps Script URL and user permissions, then try again.',
      scopeAll:'Showing all data', filtersActive:'active filters', lastUpdate:'Last update', showingAllExcavators:'All excavators are displayed', displayedEquipment:'equipment displayed',
      stageBeforeCrusher:'Before crusher', stageAfterCrusher:'After crusher', stageMineStore:'To mine store', stageGeneralStore:'To general store', stageFactory:'To factory', stageFactoryStore:'To factory store', stagePort:'To port'
    }
  };

  var EQUIPMENT_OUTPUT_COLUMNS = [
    ['equipment','equipmentName',false],['operating_hours','operatingHours',true],['hourly_rate_m3','hourlyRateM3',true],['hourly_rate_ton','hourlyRateTons',true],['total_production_m3','totalProductionM3',true],['total_production_ton','totalProductionTons',true]
  ];
  var EQUIPMENT_LOG_COLUMNS = [
    ['date','date',false],['mine','mine',false],['zone','zone',false],['shift','shift',false],['equipment_name','equipmentName',false],['equipment_type','equipmentType',false],['equipment_class','class',false],['contractor_name','contractor',false],['operator_name','operator',false],['operating_hours','grossOperatingHours',true],['net_operating_hours','netHours',true],['downtime_hours','downtimeHours',true],['breakdown_hours','breakdownHours',true],['production_ton','productionTon',true],['calculated_volume_m3','volumeM3',true],['productivity_ton_per_hour','productivity',true],['operation_area','operationArea',false],['approval_status','approval',false],['notes','notes',false]
  ];
  var LOT_COLUMNS = [
    ['date','date',false],['mine','mine',false],['zone','zone',false],['batch','batch',false],['stage','currentStage',false],['current_qty_ton','currentQty',true],['lot_before_crusher_ton','beforeCrusher',true],['lot_after_crusher_ton','afterCrusher',true],['lot_mine_store_ton','mineStore',true],['lot_general_store_ton','generalStore',true],['lot_factory_ton','factory',true],['lot_factory_store_ton','factoryStore',true],['lot_port_stockpile_ton','portStockpile',true],['avg_fe_pct','avgFe',true],['loss_total_ton','loss',true],['loss_pct','lossPct',true]
  ];

  var state = {
    lang: safeStorageGet('ait_lang') || 'ar',
    theme: safeStorageGet('ait_theme') || safeStorageGet('ait_dashboard_theme') || 'dark',
    lots: [], equipment: [], filteredLots: [], filteredEquipment: [], stages: DEFAULT_STAGES.slice(),
    payload: {}, charts: {}, activeTab: safeStorageGet('ait_production_tab') || 'overview',
    equipmentPage: 1, lotsPage: 1, equipmentPageSize: 50, lotsPageSize: 50,
    requestVersion: 0, hiddenAlert: false
  };
  if (['overview','equipment','lots'].indexOf(state.activeTab) < 0) state.activeTab = 'overview';

  function el(id) { return document.getElementById(id); }
  function t(key) { return (TEXT[state.lang] && TEXT[state.lang][key]) || TEXT.en[key] || key; }
  function safeStorageGet(key) { try { return localStorage.getItem(key) || ''; } catch (e) { return ''; } }
  function safeStorageSet(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function num(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    var parsed = parseFloat(String(value).replace(/,/g,'').replace(/%/g,'').replace(/[^0-9.\-]/g,''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function formatNumber(value, digits) {
    var n = num(value); var maximum = typeof digits === 'number' ? digits : 0;
    return new Intl.NumberFormat(state.lang === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: maximum, minimumFractionDigits: 0 }).format(n);
  }
  function formatCompact(value, digits) {
    var n = num(value); var abs = Math.abs(n); var suffix = '';
    if (abs >= 1000000) { n /= 1000000; suffix = 'M'; }
    else if (abs >= 1000) { n /= 1000; suffix = 'K'; }
    return formatNumber(n, typeof digits === 'number' ? digits : 1) + suffix;
  }
  function date10(value) {
    if (!value) return '';
    if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString().slice(0,10);
    var s = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
    var serial = parseFloat(s);
    if (!isNaN(serial) && serial > 20000 && serial < 90000) {
      var serialDate = new Date(Math.round((serial - 25569) * 86400000));
      return isNaN(serialDate.getTime()) ? '' : serialDate.toISOString().slice(0,10);
    }
    var d = new Date(s); return isNaN(d.getTime()) ? '' : d.toISOString().slice(0,10);
  }
  function todayCairo() {
    try { return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0,10); }
  }
  function unique(values) {
    var seen = {}; var output = [];
    (values || []).forEach(function (value) { var s = String(value == null ? '' : value).trim(); if (s && !seen[s]) { seen[s] = true; output.push(s); } });
    return output.sort(function (a,b) { return a.localeCompare(b, state.lang === 'ar' ? 'ar' : 'en'); });
  }
  function sum(rows, getter) { return (rows || []).reduce(function (total,row) { return total + num(typeof getter === 'function' ? getter(row) : row[getter]); },0); }
  function rowProductionTon(row) { return num(row.production_ton) || num(row.calculated_production_ton) || num(row.source_production_ton) || num(row.actual_production_ton); }
  function rowVolumeM3(row) { return num(row.calculated_volume_m3) || num(row.volume_m3); }
  function effectiveHours(row) { return num(row.net_operating_hours) || num(row.operating_hours); }
  function equipmentClass(row) {
    var explicit = String(row.equipment_class || '').trim().toLowerCase();
    var text = (explicit + ' ' + String(row.equipment_type || '') + ' ' + String(row.equipment_name || '')).toLowerCase();
    if (/excavator|حفار|باكلين/.test(text)) return 'excavator';
    if (/loader|لودر/.test(text)) return 'loader';
    return explicit || 'other';
  }
  function stageLabel(stage) { return state.lang === 'ar' ? (stage.ar || stage.label || stage.key) : (stage.label || stage.ar || stage.key); }
  function stageNameFromKey(key) {
    var stage = state.stages.find(function (item) { return item.key === key; });
    return stage ? stageLabel(stage) : (key || '—');
  }
  function apiUrl() { return (window.AIT_CONFIG && window.AIT_CONFIG.apiUrl) || safeStorageGet('ait_api_url') || FALLBACK_API; }
  function authToken() {
    try { if (window.AITSession && window.AITSession.get) { var session = window.AITSession.get(); if (session && session.token) return session.token; } } catch (e) {}
    try { var raw = JSON.parse(safeStorageGet('ait_auth_session') || 'null'); return raw && raw.token ? raw.token : ''; } catch (e2) { return ''; }
  }

  function jsonp(action) {
    if (window.PRODUCTION_TEST_PAYLOAD) return Promise.resolve(window.PRODUCTION_TEST_PAYLOAD);
    return new Promise(function (resolve,reject) {
      var callback = 'ait_prod_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      var script = document.createElement('script'); var completed = false;
      var timer = setTimeout(function () { finish(); reject(new Error('Request timed out after 60 seconds')); },60000);
      function finish() { if (completed) return; completed = true; clearTimeout(timer); try { delete window[callback]; } catch (e) { window[callback] = undefined; } if (script.parentNode) script.parentNode.removeChild(script); }
      window[callback] = function (data) { finish(); resolve(data); };
      script.onerror = function () { finish(); reject(new Error('Could not reach Apps Script')); };
      var token = authToken();
      script.src = apiUrl() + '?module=production&action=' + encodeURIComponent(action) + '&callback=' + encodeURIComponent(callback) + '&t=' + Date.now() + (token ? '&token=' + encodeURIComponent(token) : '');
      document.body.appendChild(script);
    });
  }

  function setLoading(visible, message) {
    el('pageLoading').classList.toggle('hidden', !visible);
    if (message) el('loadingMessage').textContent = message;
  }
  function setConnection(type, text) {
    var dots = [el('connectionDot'),el('footerDot')];
    dots.forEach(function (dot) { if (!dot) return; dot.className = 'status-dot ' + (type === 'live' ? 'status-live' : type === 'error' ? 'status-error' : 'status-pending'); });
    el('connectionText').textContent = text;
    el('footerStatus').textContent = text;
  }
  function showToast(type, title, message) {
    var node = document.createElement('div'); node.className = 'toast ' + type;
    node.innerHTML = '<span class="status-dot ' + (type === 'error' ? 'status-error' : 'status-live') + '"></span><div><b>' + escapeHtml(title) + '</b><p>' + escapeHtml(message || '') + '</p></div>';
    el('toastRegion').appendChild(node);
    setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); },4200);
  }
  function showAlert(title,message) {
    if (state.hiddenAlert) return;
    el('alertTitle').textContent = title; el('alertMessage').textContent = message; el('alertBanner').classList.remove('hidden');
  }
  function hideAlert() { state.hiddenAlert = true; el('alertBanner').classList.add('hidden'); }

  async function loadData(action) {
    var version = ++state.requestVersion; var syncing = action === 'sync';
    setLoading(true, syncing ? t('syncing') : t('loadingHint'));
    setConnection('pending', syncing ? t('syncing') : t('connecting'));
    var refreshButton = el('refreshButton'); refreshButton.disabled = true; refreshButton.querySelector('.button-icon').classList.add('spinning');
    try {
      var response = await jsonp(action || 'data');
      if (version !== state.requestVersion) { showToast('success',t('staleRequest'),''); return; }
      if (!response || response.error || response.ok === false) throw new Error((response && response.message) || 'API returned an error');
      state.payload = response.production || {};
      state.lots = Array.isArray(state.payload.lots) ? state.payload.lots : (Array.isArray(state.payload.rows) ? state.payload.rows : []);
      var equipmentPayload = state.payload.equipment || {};
      state.equipment = Array.isArray(equipmentPayload.daily_rows) ? equipmentPayload.daily_rows : (Array.isArray(equipmentPayload.rows) ? equipmentPayload.rows : (Array.isArray(state.payload.equipment_daily) ? state.payload.equipment_daily : []));
      state.stages = Array.isArray(state.payload.stage_types) && state.payload.stage_types.length ? state.payload.stage_types : DEFAULT_STAGES.slice();
      populateFilters(); applyFilters(true);
      var updated = response.lastUpdated || response.generated_at || state.payload.lastUpdated || '—';
      el('lastUpdated').textContent = t('lastUpdate') + ': ' + updated;
      setConnection('live', t('connected'));
      el('footerCount').textContent = state.filteredLots.length + ' ' + t('lots') + ' · ' + state.filteredEquipment.length + ' ' + t('equipmentRows');
      if (state.payload.message) showAlert(t('decisionSummary'),state.payload.message);
      showToast('success', syncing ? t('dataSynced') : t('dataLoaded'), state.filteredLots.length + ' ' + t('lots') + ' · ' + state.filteredEquipment.length + ' ' + t('equipmentRows'));
    } catch (error) {
      console.error(error); state.lots = []; state.equipment = []; state.filteredLots = []; state.filteredEquipment = [];
      renderAll(); setConnection('error',t('connectionFailed')); showAlert(t('errorTitle'), (error && error.message ? error.message + '. ' : '') + t('retryHint'));
      showToast('error',t('errorTitle'),error && error.message ? error.message : t('retryHint'));
    } finally {
      if (version === state.requestVersion) {
        setLoading(false);
        refreshButton.disabled = false;
        refreshButton.querySelector('.button-icon').classList.remove('spinning');
      }
    }
  }

  function populateSelect(selectId, values, allLabel, currentValue) {
    var select = el(selectId); var current = currentValue || select.value || 'all';
    select.innerHTML = '<option value="all">' + escapeHtml(allLabel) + '</option>' + values.map(function (value) { return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>'; }).join('');
    if (values.indexOf(current) >= 0 || current === 'all') select.value = current;
  }
  function populateFilters() {
    var current = { mine:el('mineFilter').value, zone:el('zoneFilter').value, stage:el('stageFilter').value, equipment:el('equipmentFilter').value, cls:el('classFilter').value };
    populateSelect('mineFilter', unique(state.lots.map(function (r) { return r.mine; }).concat(state.equipment.map(function (r) { return r.mine; }))), t('allMines'), current.mine);
    populateSelect('zoneFilter', unique(state.lots.map(function (r) { return r.zone; }).concat(state.equipment.map(function (r) { return r.zone; }))), t('allZones'), current.zone);
    var stageSelect = el('stageFilter'); stageSelect.innerHTML = '<option value="all">' + escapeHtml(t('allStages')) + '</option>' + state.stages.map(function (stage) { return '<option value="' + escapeHtml(stage.key) + '">' + escapeHtml(stageLabel(stage)) + '</option>'; }).join(''); if (state.stages.some(function (s) { return s.key === current.stage; })) stageSelect.value = current.stage;
    populateSelect('equipmentFilter', unique(state.equipment.map(function (r) { return r.equipment_name || r.equipment_id; })), t('allEquipment'), current.equipment);
    var classes = unique(state.equipment.map(equipmentClass)); var classSelect = el('classFilter');
    classSelect.innerHTML = '<option value="all">' + escapeHtml(t('allClasses')) + '</option>' + classes.map(function (value) { return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value === 'excavator' ? t('excavator') : value === 'loader' ? t('loader') : t('other')) + '</option>'; }).join(''); if (classes.indexOf(current.cls) >= 0) classSelect.value = current.cls;
  }
  function filterValues() {
    return { mine:el('mineFilter').value, zone:el('zoneFilter').value, stage:el('stageFilter').value, equipment:el('equipmentFilter').value, cls:el('classFilter').value, from:el('fromFilter').value, to:el('toFilter').value, search:el('searchFilter').value.trim().toLowerCase() };
  }
  function matchesSearch(row, keys, term) {
    if (!term) return true;
    return keys.map(function (key) { return row[key]; }).join(' ').toLowerCase().indexOf(term) >= 0;
  }
  function applyFilters(resetPages) {
    var f = filterValues();
    state.filteredLots = state.lots.filter(function (row) {
      if (f.mine !== 'all' && String(row.mine || '') !== f.mine) return false;
      if (f.zone !== 'all' && String(row.zone || '') !== f.zone) return false;
      if (f.stage !== 'all' && String(row.stage_key || '') !== f.stage) return false;
      var d = date10(row.date); if (f.from && d && d < f.from) return false; if (f.to && d && d > f.to) return false;
      return matchesSearch(row,['batch','lot_id','mine','zone','material','stage','current_stage'],f.search);
    });
    state.filteredEquipment = state.equipment.filter(function (row) {
      if (f.mine !== 'all' && String(row.mine || '') !== f.mine) return false;
      if (f.zone !== 'all' && String(row.zone || '') !== f.zone) return false;
      if (f.equipment !== 'all' && String(row.equipment_name || row.equipment_id || '') !== f.equipment) return false;
      if (f.cls !== 'all' && equipmentClass(row) !== f.cls) return false;
      var d = date10(row.date); if (f.from && d && d < f.from) return false; if (f.to && d && d > f.to) return false;
      return matchesSearch(row,['batch','mine','zone','equipment_id','equipment_name','equipment_type','contractor_name','operator_name','approval_status','notes'],f.search);
    });
    if (resetPages) { state.equipmentPage = 1; state.lotsPage = 1; }
    renderAll();
  }
  function resetFilters() {
    ['mineFilter','zoneFilter','stageFilter','equipmentFilter','classFilter'].forEach(function (id) { el(id).value = 'all'; });
    ['fromFilter','toFilter','searchFilter'].forEach(function (id) { el(id).value = ''; });
    applyFilters(true);
  }

  function equipmentTotals(rows) {
    var total = { production:0, volume:0, netHours:0, grossHours:0, downtime:0, breakdown:0, equipmentCount:0 };
    var equipment = {};
    rows.forEach(function (row) { total.production += rowProductionTon(row); total.volume += rowVolumeM3(row); total.netHours += effectiveHours(row); total.grossHours += num(row.operating_hours); total.downtime += num(row.downtime_hours); total.breakdown += num(row.breakdown_hours); equipment[row.equipment_id || row.equipment_name || 'Unknown'] = true; });
    total.equipmentCount = Object.keys(equipment).length; total.productivity = total.netHours ? total.production / total.netHours : 0; return total;
  }
  function lotTotals(rows) {
    var total = { lots:rows.length, currentStock:0, loss:0, beforeCrusher:0, completed:0, avgFe:0, mines:0, zones:0 }; var feSum = 0, feWeight = 0; var mines={},zones={};
    state.stages.forEach(function (stage) { total[stage.key] = 0; });
    rows.forEach(function (row) {
      state.stages.forEach(function (stage) { total[stage.key] += num(row[stage.key]); });
      total.currentStock += num(row.current_qty_ton); total.loss += num(row.loss_total_ton); total.beforeCrusher += num(row.lot_before_crusher_ton);
      if (String(row.stage_key) === 'lot_port_stockpile_ton') total.completed++;
      var fe = num(row.avg_fe_pct), weight = num(row.current_qty_ton || row.lot_before_crusher_ton || 1); if (fe > 0) { feSum += fe * (weight || 1); feWeight += weight || 1; }
      if (row.mine) mines[row.mine] = true; if (row.zone) zones[row.zone] = true;
    });
    total.avgFe = feWeight ? feSum / feWeight : 0; total.lossPct = total.beforeCrusher ? total.loss / total.beforeCrusher * 100 : 0; total.mines = Object.keys(mines).length; total.zones = Object.keys(zones).length; return total;
  }
  function groupEquipment(rows) {
    var map = {};
    rows.forEach(function (row) {
      var id = String(row.equipment_id || row.equipment_name || 'Unknown');
      if (!map[id]) map[id] = { id:id, name:row.equipment_name || id, type:row.equipment_type || '', cls:equipmentClass(row), contractor:row.contractor_name || '', mine:row.mine || '', production:0, volume:0, netHours:0, grossHours:0, downtime:0, breakdown:0, lastDate:'' };
      var x = map[id]; x.production += rowProductionTon(row); x.volume += rowVolumeM3(row); x.netHours += effectiveHours(row); x.grossHours += num(row.operating_hours); x.downtime += num(row.downtime_hours); x.breakdown += num(row.breakdown_hours); var d = date10(row.date); if (d > x.lastDate) x.lastDate = d;
    });
    return Object.keys(map).map(function (id) { var x = map[id]; x.productivity = x.netHours ? x.production / x.netHours : 0; return x; }).sort(function (a,b) { return b.production - a.production || b.netHours - a.netHours; });
  }
  function equipmentOutputRows() {
    return groupEquipment(state.filteredEquipment).map(function (x) { return { equipment:x.name, operating_hours:x.netHours || x.grossHours, hourly_rate_m3:(x.netHours || x.grossHours) ? x.volume / (x.netHours || x.grossHours) : 0, hourly_rate_ton:(x.netHours || x.grossHours) ? x.production / (x.netHours || x.grossHours) : 0, total_production_m3:x.volume, total_production_ton:x.production }; });
  }
  function dailyEquipment(rows) {
    var map = {};
    rows.forEach(function (row) { var d = date10(row.date); if (!d) return; if (!map[d]) map[d] = { date:d, tons:0, m3:0, netHours:0, downtime:0, breakdown:0 }; map[d].tons += rowProductionTon(row); map[d].m3 += rowVolumeM3(row); map[d].netHours += effectiveHours(row); map[d].downtime += num(row.downtime_hours); map[d].breakdown += num(row.breakdown_hours); });
    return Object.keys(map).sort().map(function (d) { return map[d]; });
  }
  function minesSummary(rows) {
    var map = {};
    rows.forEach(function (row) { var mine = row.mine || 'Unknown'; if (!map[mine]) map[mine] = { mine:mine, stock:0, loss:0, feSum:0, feWeight:0, lots:0 }; var x=map[mine]; x.stock += num(row.current_qty_ton); x.loss += num(row.loss_total_ton); x.lots++; var fe=num(row.avg_fe_pct),w=num(row.current_qty_ton || row.lot_before_crusher_ton || 1); if(fe>0){x.feSum+=fe*(w||1);x.feWeight+=(w||1);} });
    return Object.keys(map).map(function (mine) { var x=map[mine]; x.avgFe=x.feWeight?x.feSum/x.feWeight:0; return x; }).sort(function(a,b){return b.stock-a.stock;});
  }
  function excavatorSeries() {
    var rows = state.filteredEquipment.filter(function (row) { return equipmentClass(row) === 'excavator'; }); var dates = unique(rows.map(function (r) { return date10(r.date); })); var map = {};
    rows.forEach(function (row) { var id=String(row.equipment_id || row.equipment_name || 'Unknown'),d=date10(row.date); if(!d)return; if(!map[id])map[id]={id:id,name:row.equipment_name||id,values:{},total:0}; if(!map[id].values[d])map[id].values[d]={tons:0,m3:0,hours:0}; map[id].values[d].tons+=rowProductionTon(row); map[id].values[d].m3+=rowVolumeM3(row); map[id].values[d].hours+=effectiveHours(row); map[id].total+=rowProductionTon(row); });
    return { dates:dates, equipment:Object.keys(map).map(function(id){return map[id];}).sort(function(a,b){return b.total-a.total;}) };
  }

  function renderI18n() {
    document.documentElement.lang = state.lang; document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(function (node) { node.textContent = t(node.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (node) { node.setAttribute('placeholder',t(node.getAttribute('data-i18n-placeholder'))); });
    el('languageButton').textContent = state.lang === 'ar' ? 'EN' : 'AR'; el('themeButton').textContent = state.theme === 'dark' ? '☾' : '☀';
  }
  function renderScope() {
    var f=filterValues(), active=[];
    [['mine',f.mine,'all'],['zone',f.zone,'all'],['stage',f.stage,'all'],['equipment',f.equipment,'all'],['equipmentClass',f.cls,'all'],['fromDate',f.from,''],['toDate',f.to,''],['searchLabel',f.search,'']].forEach(function (item) { if (item[1] && item[1] !== item[2]) active.push({label:t(item[0]),value:item[0]==='stage'?stageNameFromKey(item[1]):item[0]==='equipmentClass'?(item[1]==='excavator'?t('excavator'):item[1]==='loader'?t('loader'):t('other')):item[1]}); });
    el('scopeSummary').textContent = active.length ? active.length + ' ' + t('filtersActive') + ' · ' + state.filteredLots.length + ' ' + t('lots') + ' · ' + state.filteredEquipment.length + ' ' + t('equipmentRows') : t('scopeAll') + ' · ' + state.filteredLots.length + ' ' + t('lots') + ' · ' + state.filteredEquipment.length + ' ' + t('equipmentRows');
    el('activeFilterChips').innerHTML = active.map(function (x) { return '<span class="filter-chip"><span>' + escapeHtml(x.label) + '</span><b>' + escapeHtml(x.value) + '</b></span>'; }).join('');
    el('footerCount').textContent = state.filteredLots.length + ' ' + t('lots') + ' · ' + state.filteredEquipment.length + ' ' + t('equipmentRows');
  }
  function renderKpis() {
    var eq = equipmentTotals(state.filteredEquipment), lots=lotTotals(state.filteredLots), today=todayCairo(),todayEq=equipmentTotals(state.filteredEquipment.filter(function(r){return date10(r.date)===today;}));
    var cards=[
      {icon:'▰',label:t('productionTons'),value:formatCompact(eq.production,1)+' '+t('tons'),note:t('today')+': '+formatCompact(todayEq.production,1)+' '+t('tons'),color:'var(--prod-orange)'},
      {icon:'◇',label:t('productionM3'),value:formatCompact(eq.volume,1)+' '+t('cubicMeters'),note:formatNumber(eq.equipmentCount)+' '+t('equipmentCount'),color:'var(--prod-blue)'},
      {icon:'◷',label:t('netHours'),value:formatNumber(eq.netHours,1)+' '+t('hours'),note:t('grossHours')+': '+formatNumber(eq.grossHours,1),color:'var(--prod-green)'},
      {icon:'↗',label:t('productivity'),value:formatNumber(eq.productivity,2)+' '+t('tonPerHour'),note:formatNumber(eq.production,0)+' ÷ '+formatNumber(eq.netHours,1),color:'var(--prod-cyan)'},
      {icon:'⚙',label:t('activeEquipment'),value:formatNumber(eq.equipmentCount),note:state.filteredEquipment.length+' '+t('equipmentRows'),color:'var(--prod-purple)'},
      {icon:'Ⅱ',label:t('downtime'),value:formatNumber(eq.downtime,1)+' '+t('hours'),note:formatNumber(eq.breakdown,1)+' '+t('breakdownHours'),color:'var(--prod-yellow)'},
      {icon:'▦',label:t('currentStock'),value:formatCompact(lots.currentStock,1)+' '+t('tons'),note:lots.lots+' '+t('lotCount')+' · '+lots.mines+' '+t('mine'),color:'var(--prod-blue)'},
      {icon:'!',label:t('totalLoss'),value:formatCompact(lots.loss,1)+' '+t('tons'),note:t('lossRate')+': '+formatNumber(lots.lossPct,1)+'%',color:'var(--prod-red)'}
    ];
    el('kpiGrid').innerHTML=cards.map(function(c){return '<article class="kpi-card" style="--kpi-accent:'+c.color+'"><div class="kpi-label"><span>'+c.icon+'</span><span>'+escapeHtml(c.label)+'</span></div><div class="kpi-value">'+escapeHtml(c.value)+'</div><div class="kpi-note">'+escapeHtml(c.note)+'</div></article>';}).join('');
  }
  function renderDecisionList() {
    var groups=groupEquipment(state.filteredEquipment), lots=lotTotals(state.filteredLots); if(!groups.length){el('decisionList').innerHTML='<div class="decision-item"><span class="decision-icon">i</span><div><b>'+escapeHtml(t('noOperationalData'))+'</b></div></div>';return;}
    var top=groups[0], downtime=groups.slice().sort(function(a,b){return b.downtime-a.downtime;})[0], productive=groups.filter(function(x){return x.netHours>0;}).sort(function(a,b){return b.productivity-a.productivity;})[0];
    var items=[
      {icon:'↗',color:'var(--prod-green)',title:t('topEquipment'),text:(top?top.name:'—')+' · '+formatNumber(top?top.production:0,1)+' '+t('tons')},
      {icon:'Ⅱ',color:'var(--prod-yellow)',title:t('highestDowntime'),text:(downtime?downtime.name:'—')+' · '+formatNumber(downtime?downtime.downtime:0,1)+' '+t('hours')},
      {icon:'◆',color:'var(--prod-blue)',title:t('bestProductivity'),text:(productive?productive.name:'—')+' · '+formatNumber(productive?productive.productivity:0,2)+' '+t('tonPerHour')},
      {icon:'✓',color:'var(--prod-purple)',title:t('portReady'),text:lots.completed+' / '+lots.lots+' '+t('lots')}
    ];
    el('decisionList').innerHTML=items.map(function(x){return '<div class="decision-item" style="--decision-color:'+x.color+'"><span class="decision-icon">'+x.icon+'</span><div><b>'+escapeHtml(x.title)+'</b><p><strong>'+escapeHtml(x.text)+'</strong></p></div></div>';}).join('');
  }
  function renderStageFlow() {
    var totals=lotTotals(state.filteredLots), counts={}; state.filteredLots.forEach(function(r){counts[r.stage_key]=(counts[r.stage_key]||0)+1;}); var max=Math.max.apply(null,state.stages.map(function(s){return totals[s.key]||0;}).concat([1]));
    el('stageFlow').innerHTML=state.stages.map(function(stage){var qty=totals[stage.key]||0,pct=Math.max(2,Math.min(100,qty/max*100));return '<div class="stage-card"><span>'+escapeHtml(stageLabel(stage))+'</span><b>'+formatCompact(qty,1)+' '+escapeHtml(t('tons'))+'</b><small>'+formatNumber(counts[stage.key]||0)+' '+escapeHtml(t('lots'))+'</small><div class="stage-progress"><i style="width:'+pct+'%"></i></div></div>';}).join('');
  }

  var noDataPlugin={id:'productionNoData',afterDraw:function(chart,args,opts){var values=[];(chart.data.datasets||[]).forEach(function(ds){(ds.data||[]).forEach(function(v){values.push(num(v));});});if(values.some(function(v){return Math.abs(v)>0.000001;}))return;var area=chart.chartArea;if(!area)return;var ctx=chart.ctx;ctx.save();ctx.fillStyle=cssVar('--prod-muted');ctx.font='700 12px '+getComputedStyle(document.body).fontFamily;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText((opts&&opts.text)||t('noChartData'),(area.left+area.right)/2,(area.top+area.bottom)/2);ctx.restore();}};
  function ensureChartPlugin(){if(window.Chart&&!Chart.registry.plugins.get('productionNoData'))Chart.register(noDataPlugin);}
  function cssVar(name){return getComputedStyle(document.documentElement).getPropertyValue(name).trim();}
  function chartBase(options){var mobile=window.matchMedia('(max-width:760px)').matches, text=cssVar('--prod-muted'),grid=cssVar('--prod-line');return {responsive:true,maintainAspectRatio:false,animation:{duration:250},interaction:{mode:'index',intersect:false},plugins:{legend:{display:options.legend!==false,position:'bottom',labels:{color:text,usePointStyle:true,boxWidth:8,padding:mobile?9:13,font:{size:mobile?9:10}}},tooltip:{backgroundColor:state.theme==='dark'?'#07111f':'#fff',titleColor:cssVar('--prod-orange'),bodyColor:cssVar('--prod-text'),borderColor:cssVar('--prod-line-strong'),borderWidth:1,padding:10},productionNoData:{text:t('noChartData')}},scales:options.noScale?{}:{x:{stacked:!!options.stacked,grid:{display:false},ticks:{color:text,maxTicksLimit:mobile?6:12,maxRotation:mobile?50:25,font:{size:mobile?8:10}}},y:{stacked:!!options.stacked,beginAtZero:true,grid:{color:grid},ticks:{color:text,maxTicksLimit:7,font:{size:mobile?8:10},callback:function(v){return formatCompact(v,1);}}}}};}
  function destroyChart(id){if(state.charts[id]){state.charts[id].destroy();delete state.charts[id];}}
  function makeChart(id,config){if(!window.Chart)return;ensureChartPlugin();destroyChart(id);var canvas=el(id);if(!canvas)return;state.charts[id]=new Chart(canvas.getContext('2d'),config);}
  function renderCustomLegend(canvasId,items){var canvas=el(canvasId);if(!canvas)return;var old=canvas.parentElement.querySelector('.chart-custom-legend');if(old)old.remove();if(!items.length)return;var legend=document.createElement('div');legend.className='chart-custom-legend';legend.style.cssText='display:flex;gap:6px;overflow:auto;padding:7px 2px 0;scrollbar-width:thin';legend.innerHTML=items.map(function(item){return '<span style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap;font-size:9.5px;color:var(--prod-muted)"><i style="width:9px;height:9px;border-radius:50%;background:'+item.color+'"></i>'+escapeHtml(item.label)+'</span>';}).join('');canvas.parentElement.appendChild(legend);}
  function seriesColor(index,total){ if(index<COLORS.length)return COLORS[index]; var hue=Math.round((index*360/Math.max(total,1)+17)%360); return 'hsl('+hue+' 72% 55%)'; }
  function lineDatasets(series,metric){return series.equipment.map(function(eq,index){var color=seriesColor(index,series.equipment.length);return {label:eq.name,data:series.dates.map(function(d){return num((eq.values[d]||{})[metric]);}),borderColor:color,backgroundColor:color,pointRadius:2,pointHoverRadius:5,borderWidth:2,tension:.28,spanGaps:true,fill:false};});}

  function renderOverviewCharts(){
    var daily=dailyEquipment(state.filteredEquipment),labels=daily.map(function(x){return x.date;}),options=chartBase({legend:true});options.scales.yProduction={beginAtZero:true,position:'left',grid:{color:cssVar('--prod-line')},ticks:{color:cssVar('--prod-muted'),callback:function(v){return formatCompact(v,1);}}};options.scales.yHours={beginAtZero:true,position:'right',grid:{drawOnChartArea:false},ticks:{color:cssVar('--prod-muted'),callback:function(v){return formatNumber(v,1)+'h';}}};delete options.scales.y;
    makeChart('productionTrendChart',{type:'bar',data:{labels:labels,datasets:[{type:'bar',label:t('productionTons'),data:daily.map(function(x){return x.tons;}),backgroundColor:'rgba(255,90,31,.72)',borderRadius:6,yAxisID:'yProduction'},{type:'line',label:t('productionM3'),data:daily.map(function(x){return x.m3;}),borderColor:cssVar('--prod-blue'),backgroundColor:'rgba(56,189,248,.12)',fill:false,tension:.3,pointRadius:2,yAxisID:'yProduction'},{type:'line',label:t('netHours'),data:daily.map(function(x){return x.netHours;}),borderColor:cssVar('--prod-green'),backgroundColor:cssVar('--prod-green'),fill:false,tension:.3,pointRadius:2,yAxisID:'yHours'}]},options:options});
    var eq=equipmentTotals(state.filteredEquipment);el('trendMetric').textContent=formatNumber(eq.production,1)+' '+t('tons')+' · '+formatNumber(eq.netHours,1)+' '+t('hours');
    makeChart('hoursCompositionChart',{type:'bar',data:{labels:labels,datasets:[{label:t('netHours'),data:daily.map(function(x){return x.netHours;}),backgroundColor:'rgba(34,197,94,.72)',borderRadius:5},{label:t('downtimeHours'),data:daily.map(function(x){return x.downtime;}),backgroundColor:'rgba(245,158,11,.72)',borderRadius:5},{label:t('breakdownHours'),data:daily.map(function(x){return x.breakdown;}),backgroundColor:'rgba(239,68,68,.72)',borderRadius:5}]},options:chartBase({stacked:true})});
    var mines=minesSummary(state.filteredLots).slice(0,15);
    var stockOptions=chartBase({legend:false});stockOptions.indexAxis='y';
    makeChart('stockByMineChart',{type:'bar',data:{labels:mines.map(function(x){return x.mine;}),datasets:[{label:t('currentStock'),data:mines.map(function(x){return x.stock;}),backgroundColor:'rgba(56,189,248,.72)',borderRadius:6}]},options:stockOptions});
    makeChart('feByMineChart',{type:'bar',data:{labels:mines.map(function(x){return x.mine;}),datasets:[{label:t('avgFe'),data:mines.map(function(x){return x.avgFe;}),backgroundColor:mines.map(function(x){return x.avgFe>=55?'#22c55e':x.avgFe>=37?'#f59e0b':'#ef4444';}),borderRadius:6}]},options:chartBase({legend:false})});
  }
  function renderEquipmentCharts(){
    var series=excavatorSeries(),tons=lineDatasets(series,'tons'),m3=lineDatasets(series,'m3'),hours=lineDatasets(series,'hours'),legendItems=series.equipment.map(function(eq,i){return{label:eq.name,color:seriesColor(i,series.equipment.length)};});
    [
      ['excavatorTonsChart',tons,'excavatorTonMetric',sum(state.filteredEquipment.filter(function(r){return equipmentClass(r)==='excavator';}),rowProductionTon),t('tons')],
      ['excavatorM3Chart',m3,'excavatorM3Metric',sum(state.filteredEquipment.filter(function(r){return equipmentClass(r)==='excavator';}),rowVolumeM3),t('cubicMeters')],
      ['excavatorHoursChart',hours,'excavatorHoursMetric',sum(state.filteredEquipment.filter(function(r){return equipmentClass(r)==='excavator';}),effectiveHours),t('hours')]
    ].forEach(function(item){var opts=chartBase({legend:series.equipment.length<=8});makeChart(item[0],{type:'line',data:{labels:series.dates,datasets:item[1]},options:opts});el(item[2]).textContent=formatNumber(item[3],1)+' '+item[4]+' · '+series.equipment.length+' '+t('displayedEquipment');if(series.equipment.length>8)renderCustomLegend(item[0],legendItems);});
    var groups=groupEquipment(state.filteredEquipment).slice(0,20),prodOpts=chartBase({legend:false});prodOpts.indexAxis='y';
    makeChart('equipmentProductivityChart',{type:'bar',data:{labels:groups.map(function(x){return x.name;}),datasets:[{label:t('productivity'),data:groups.map(function(x){return x.productivity;}),backgroundColor:'rgba(45,212,191,.75)',borderRadius:5}]},options:prodOpts});
    var classMap={};state.filteredEquipment.forEach(function(r){var c=equipmentClass(r);classMap[c]=(classMap[c]||0)+rowProductionTon(r);});var classes=Object.keys(classMap);
    makeChart('productionByClassChart',{type:'doughnut',data:{labels:classes.map(function(c){return c==='excavator'?t('excavator'):c==='loader'?t('loader'):t('other');}),datasets:[{data:classes.map(function(c){return classMap[c];}),backgroundColor:COLORS.slice(0,classes.length),borderWidth:0}]},options:chartBase({noScale:true,legend:true})});
  }
  function renderLotsCharts(){
    var lots=lotTotals(state.filteredLots),labels=state.stages.map(stageLabel),values=state.stages.map(function(s){return lots[s.key]||0;});
    makeChart('stageQuantityChart',{type:'bar',data:{labels:labels,datasets:[{label:t('tons'),data:values,backgroundColor:COLORS.slice(0,labels.length),borderRadius:7}]},options:chartBase({legend:false})});el('lotStageMetric').textContent=formatNumber(lots.currentStock,1)+' '+t('tons')+' · '+lots.lots+' '+t('lots');
    var counts=state.stages.map(function(s){return state.filteredLots.filter(function(r){return r.stage_key===s.key;}).length;});
    makeChart('stageDistributionChart',{type:'doughnut',data:{labels:labels,datasets:[{data:counts,backgroundColor:COLORS.slice(0,labels.length),borderWidth:0}]},options:chartBase({noScale:true,legend:true})});
    var losses=[['loss_crusher','stageAfterCrusher'],['loss_after_crusher_to_mine_store','stageMineStore'],['loss_mine_store_to_general_store','stageGeneralStore'],['loss_general_store_to_factory','stageFactory'],['loss_factory_to_factory_store','stageFactoryStore'],['loss_factory_store_to_port','stagePort']];
    var lossOptions=chartBase({legend:false});lossOptions.indexAxis='y';makeChart('lossTransitionChart',{type:'bar',data:{labels:losses.map(function(x){return t(x[1]);}),datasets:[{label:t('loss'),data:losses.map(function(x){return sum(state.filteredLots,x[0]);}),backgroundColor:'rgba(239,68,68,.72)',borderRadius:6}]},options:lossOptions});
  }

  function numericCell(key,value){var digits=/productivity|hourly_rate|loss_pct|avg_fe/.test(key)?2:/hours|m3/.test(key)?1:0;return formatNumber(value,digits);}
  function badge(value){var text=String(value||'—'),cls=/approved|complete|done|pass|مقبول|معتمد/i.test(text)?'success':/pending|review|waiting|معلق|قيد/i.test(text)?'warn':/reject|fail|error|مرفوض/i.test(text)?'bad':'';return '<span class="status-pill '+cls+'">'+escapeHtml(text)+'</span>';}
  function renderHead(targetId,columns){el(targetId).innerHTML='<tr>'+columns.map(function(c){return '<th>'+escapeHtml(t(c[1]))+'</th>';}).join('')+'</tr>';}
  function renderEquipmentOutput(){
    var rows=equipmentOutputRows(),total=rows.reduce(function(a,r){a.operating_hours+=r.operating_hours;a.total_production_m3+=r.total_production_m3;a.total_production_ton+=r.total_production_ton;return a;},{equipment:t('total'),operating_hours:0,total_production_m3:0,total_production_ton:0,hourly_rate_m3:0,hourly_rate_ton:0});total.hourly_rate_m3=total.operating_hours?total.total_production_m3/total.operating_hours:0;total.hourly_rate_ton=total.operating_hours?total.total_production_ton/total.operating_hours:0;
    renderHead('equipmentOutputHead',EQUIPMENT_OUTPUT_COLUMNS);el('equipmentOutputCount').textContent=rows.length+' '+t('equipmentCount');
    el('equipmentOutputBody').innerHTML=rows.length?rows.map(function(r){return '<tr>'+EQUIPMENT_OUTPUT_COLUMNS.map(function(c){return '<td class="'+(c[2]?'numeric':'')+'">'+(c[2]?numericCell(c[0],r[c[0]]):escapeHtml(r[c[0]]||'—'))+'</td>';}).join('')+'</tr>';}).join(''):'<tr class="empty-row"><td colspan="6">'+escapeHtml(t('noEquipmentData'))+'</td></tr>';
    el('equipmentOutputFoot').innerHTML=rows.length?'<tr>'+EQUIPMENT_OUTPUT_COLUMNS.map(function(c){return '<td class="'+(c[2]?'numeric':'')+'">'+(c[2]?numericCell(c[0],total[c[0]]):escapeHtml(total[c[0]]))+'</td>';}).join('')+'</tr>':'';
  }
  function renderPaginatedTable(config){
    renderHead(config.headId,config.columns);var count=config.rows.length,pageSize=config.pageSize,pageCount=Math.max(1,Math.ceil(count/pageSize)),page=Math.min(config.page,pageCount),start=(page-1)*pageSize,rows=config.rows.slice(start,start+pageSize);config.setPage(page);el(config.countId).textContent=count+' '+config.countLabel;
    el(config.bodyId).innerHTML=rows.length?rows.map(function(row){return '<tr>'+config.columns.map(function(c){var value=c[0]==='production_ton'?rowProductionTon(row):c[0]==='calculated_volume_m3'?rowVolumeM3(row):c[0]==='productivity_ton_per_hour'?(effectiveHours(row)?rowProductionTon(row)/effectiveHours(row):0):c[0]==='stage'?(row.stage||row.current_stage||stageNameFromKey(row.stage_key)):row[c[0]];var rendered=c[0]==='approval_status'||c[0]==='stage'?badge(value):c[2]?numericCell(c[0],value):escapeHtml(c[0]==='date'?date10(value):(value||'—'));return '<td class="'+(c[2]?'numeric':'')+'">'+rendered+'</td>';}).join('')+'</tr>';}).join(''):'<tr class="empty-row"><td colspan="'+config.columns.length+'">'+escapeHtml(config.emptyText)+'</td></tr>';
    renderPagination(config.paginationId,page,pageCount,config.onPage);
  }
  function renderPagination(targetId,page,pageCount,onPage){var html='<button type="button" data-page="'+(page-1)+'" '+(page<=1?'disabled':'')+' aria-label="'+escapeHtml(t('previous'))+'">‹</button>';var first=Math.max(1,page-2),last=Math.min(pageCount,page+2);if(first>1)html+='<button type="button" data-page="1">1</button><span>…</span>';for(var i=first;i<=last;i++)html+='<button type="button" data-page="'+i+'" class="'+(i===page?'active':'')+'">'+i+'</button>';if(last<pageCount)html+='<span>…</span><button type="button" data-page="'+pageCount+'">'+pageCount+'</button>';html+='<button type="button" data-page="'+(page+1)+'" '+(page>=pageCount?'disabled':'')+' aria-label="'+escapeHtml(t('next'))+'">›</button><span>'+escapeHtml(t('page'))+' '+page+' '+escapeHtml(t('of'))+' '+pageCount+'</span>';var node=el(targetId);node.innerHTML=html;node.querySelectorAll('button[data-page]').forEach(function(button){button.addEventListener('click',function(){var target=Number(button.getAttribute('data-page'));if(target>=1&&target<=pageCount)onPage(target);});});}
  function renderTables(){
    renderEquipmentOutput();
    renderPaginatedTable({headId:'equipmentLogHead',bodyId:'equipmentLogBody',paginationId:'equipmentPagination',countId:'equipmentRowsCount',rows:state.filteredEquipment,columns:EQUIPMENT_LOG_COLUMNS,page:state.equipmentPage,pageSize:state.equipmentPageSize,countLabel:t('rows'),emptyText:t('noEquipmentData'),setPage:function(p){state.equipmentPage=p;},onPage:function(p){state.equipmentPage=p;renderTables();el('panel-equipment').scrollIntoView({behavior:'smooth',block:'start'});}});
    renderPaginatedTable({headId:'lotsLogHead',bodyId:'lotsLogBody',paginationId:'lotsPagination',countId:'lotsRowsCount',rows:state.filteredLots,columns:LOT_COLUMNS,page:state.lotsPage,pageSize:state.lotsPageSize,countLabel:t('lots'),emptyText:t('noLotsData'),setPage:function(p){state.lotsPage=p;},onPage:function(p){state.lotsPage=p;renderTables();el('panel-lots').scrollIntoView({behavior:'smooth',block:'start'});}});
  }
  function renderCurrentTab(){
    Object.keys(state.charts).forEach(function(id){destroyChart(id);});
    if(state.activeTab==='overview')renderOverviewCharts();else if(state.activeTab==='equipment')renderEquipmentCharts();else renderLotsCharts();
  }
  function renderTabs(){document.querySelectorAll('.section-tab').forEach(function(btn){var active=btn.getAttribute('data-tab')===state.activeTab;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',active?'true':'false');});document.querySelectorAll('.tab-panel').forEach(function(panel){var active=panel.getAttribute('data-panel')===state.activeTab;panel.classList.toggle('active',active);panel.hidden=!active;});}
  function renderAll(){renderI18n();renderScope();renderKpis();renderDecisionList();renderStageFlow();renderTabs();renderTables();requestAnimationFrame(renderCurrentTab);}

  function setLanguage(lang){state.lang=lang==='en'?'en':'ar';safeStorageSet('ait_lang',state.lang);populateFilters();renderAll();}
  function toggleLanguage(){setLanguage(state.lang==='ar'?'en':'ar');}
  function setTheme(theme){state.theme=theme==='light'?'light':'dark';document.documentElement.setAttribute('data-theme',state.theme);['ait_theme','ait_dashboard_theme','ait_shell_theme','ait_prod_theme'].forEach(function(k){safeStorageSet(k,state.theme);});renderI18n();requestAnimationFrame(renderCurrentTab);}
  function toggleTheme(){setTheme(state.theme==='dark'?'light':'dark');}
  function setTab(tab){if(['overview','equipment','lots'].indexOf(tab)<0)return;state.activeTab=tab;safeStorageSet('ait_production_tab',tab);renderTabs();requestAnimationFrame(renderCurrentTab);}

  function exportExcel(){
    if(!window.XLSX||(!state.filteredLots.length&&!state.filteredEquipment.length)){showToast('error',t('exportMissing'),'');return;}
    var workbook=XLSX.utils.book_new(),eq=equipmentTotals(state.filteredEquipment),lots=lotTotals(state.filteredLots),summary=[
      [t('productionTons'),eq.production],[t('productionM3'),eq.volume],[t('netHours'),eq.netHours],[t('productivity'),eq.productivity],[t('activeEquipment'),eq.equipmentCount],[t('downtime'),eq.downtime],[t('currentStock'),lots.currentStock],[t('totalLoss'),lots.loss],[t('lossRate'),lots.lossPct+'%']
    ];
    var summarySheet=XLSX.utils.aoa_to_sheet([[t('pageTitle'),''],[t('lastUpdate'),el('lastUpdated').textContent],[],[t('filtersTitle'),el('scopeSummary').textContent],[],['KPI','Value']].concat(summary));summarySheet['!cols']=[{wch:30},{wch:24}];XLSX.utils.book_append_sheet(workbook,summarySheet,'Summary');
    if(state.filteredEquipment.length){var output=equipmentOutputRows().map(function(row){var o={};EQUIPMENT_OUTPUT_COLUMNS.forEach(function(c){o[t(c[1])]=row[c[0]];});return o;});var outputSheet=XLSX.utils.json_to_sheet(output);outputSheet['!cols']=EQUIPMENT_OUTPUT_COLUMNS.map(function(c,i){return{wch:i===0?28:20};});XLSX.utils.book_append_sheet(workbook,outputSheet,'Equipment Output');var eqRows=state.filteredEquipment.map(function(row){var o={};EQUIPMENT_LOG_COLUMNS.forEach(function(c){var value=c[0]==='production_ton'?rowProductionTon(row):c[0]==='calculated_volume_m3'?rowVolumeM3(row):c[0]==='productivity_ton_per_hour'?(effectiveHours(row)?rowProductionTon(row)/effectiveHours(row):0):row[c[0]];o[t(c[1])]=value==null?'':value;});return o;});var eqSheet=XLSX.utils.json_to_sheet(eqRows);eqSheet['!cols']=EQUIPMENT_LOG_COLUMNS.map(function(){return{wch:18};});XLSX.utils.book_append_sheet(workbook,eqSheet,'Equipment Daily');}
    if(state.filteredLots.length){var lotRows=state.filteredLots.map(function(row){var o={};LOT_COLUMNS.forEach(function(c){var value=c[0]==='stage'?(row.stage||row.current_stage||stageNameFromKey(row.stage_key)):row[c[0]];o[t(c[1])]=value==null?'':value;});return o;});var lotSheet=XLSX.utils.json_to_sheet(lotRows);lotSheet['!cols']=LOT_COLUMNS.map(function(){return{wch:18};});XLSX.utils.book_append_sheet(workbook,lotSheet,'Production Lots');}
    XLSX.writeFile(workbook,'AIT_Production_Lots_Equipment_'+todayCairo()+'.xlsx');showToast('success',t('exportReady'),'');
  }

  function bindEvents(){
    ['mineFilter','zoneFilter','stageFilter','equipmentFilter','classFilter','fromFilter','toFilter'].forEach(function(id){el(id).addEventListener('change',function(){applyFilters(true);});});
    var searchTimer;el('searchFilter').addEventListener('input',function(){clearTimeout(searchTimer);searchTimer=setTimeout(function(){applyFilters(true);},180);});
    el('resetFiltersButton').addEventListener('click',resetFilters);el('refreshButton').addEventListener('click',function(){loadData('sync');});el('exportButton').addEventListener('click',exportExcel);el('languageButton').addEventListener('click',toggleLanguage);el('themeButton').addEventListener('click',toggleTheme);el('dismissAlert').addEventListener('click',hideAlert);
    el('filterToggle').addEventListener('click',function(){var fields=el('filterFields'),collapsed=fields.classList.toggle('collapsed');el('filterToggle').setAttribute('aria-expanded',collapsed?'false':'true');});
    document.querySelectorAll('.section-tab').forEach(function(btn){btn.addEventListener('click',function(){setTab(btn.getAttribute('data-tab'));});});
    el('equipmentPageSize').addEventListener('change',function(){state.equipmentPageSize=Number(this.value)||50;state.equipmentPage=1;renderTables();});el('lotsPageSize').addEventListener('change',function(){state.lotsPageSize=Number(this.value)||50;state.lotsPage=1;renderTables();});
    var resizeTimer;window.addEventListener('resize',function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(renderCurrentTab,180);},{passive:true});
    document.addEventListener('visibilitychange',function(){if(!document.hidden&&Date.now()-(state.lastAutoRefresh||0)>30*60*1000){state.lastAutoRefresh=Date.now();loadData('data');}});
    var observer=new MutationObserver(function(mutations){mutations.forEach(function(m){if(m.attributeName==='data-theme'){var value=document.documentElement.getAttribute('data-theme');if(value&&value!==state.theme){state.theme=value;renderI18n();requestAnimationFrame(renderCurrentTab);}}});});observer.observe(document.documentElement,{attributes:true});
  }

  function init(){
    state.theme=document.documentElement.getAttribute('data-theme')||state.theme;setTheme(state.theme);renderI18n();bindEvents();renderAll();loadData('data');
    setInterval(function(){if(!document.hidden)loadData('data');},30*60*1000);
  }

  window.setLang=setLanguage;
  window.addEventListener('DOMContentLoaded',init);
})();
