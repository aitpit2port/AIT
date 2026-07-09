// ============================================================
// AIT Dashboard — pages/performance.js
// Page: Monthly Performance
// TO EDIT filters: change PAGE_FILTERS['performance'] below
// TO EDIT charts:  change chartsPerformance() below
// TO EDIT KPIs:    change renderPerformance() below
// ============================================================

// ── Page configuration ────────────────────────────────────────
// Edit THIS to change what filters appear on this page:
PAGE_FILTER_CFG['performance'] = [];

// ── Render + Charts ───────────────────────────────────────────
renderPerformance(){let x=LIVE.performance,by=x.by_project||[];return kpis(x.kpis)+`<div class="grid g2">${card('Budget vs Actual by Project',chartBox('c_perfBvA','small'))}${card('Budget Utilization by Project',chartBox('c_perfUtil','small'))}</div><div class="grid g2">${card('Financial Summary',`<div class="list">${Object.entries(x.financial_summary||{}).map(([k,v])=>`<div class="list-row"><b>${esc(t(k.replaceAll('_',' ').toUpperCase()))}</b><span>${typeof v==='number'?fmt(v):esc(v)}</span></div>`).join('')}</div>`)}${card('Project Performance',table([{label:'Project'},{label:'Budget',num:1},{label:'Actual',num:1},{label:'Status'}],by.map(r=>row([r.project,{text:fmt(r.budget),num:1},{text:fmt(r.actual),num:1},{html:badge((r.util_pct||0)>100?'Over Budget':(r.util_pct||0)>85?'At Risk':'On Track')}]))))}</div>`}

chartsPerformance(){let by=LIVE.performance.by_project||[];ch('c_perfBvA','bar',by.map(r=>r.project),[{label:'Budget',data:by.map(r=>r.budget),backgroundColor:'#38bdf8cc'},{label:'Actual',data:by.map(r=>r.actual),backgroundColor:'#fd480ecc'}]);ch('c_perfUtil','doughnut',by.map(r=>r.project),[{label:'Budget Utilization',data:by.map(r=>r.util_pct||0),backgroundColor:PAL}])}

// Register in R[] and C[] maps
if(typeof R !== 'undefined') R['performance'] = renderPerformance;
if(typeof C !== 'undefined') C['performance'] = chartsPerformance;
