// ============================================================
// AIT Dashboard — pages/exec.js
// Page: Executive Summary
// TO EDIT filters: change PAGE_FILTERS['exec'] below
// TO EDIT charts:  change chartsExec() below
// TO EDIT KPIs:    change renderExec() below
// ============================================================

// ── Page configuration ────────────────────────────────────────
// Edit THIS to change what filters appear on this page:
PAGE_FILTER_CFG['exec'] = [];

// ── Render + Charts ───────────────────────────────────────────
renderExec(){let x=LIVE.exec;return kpis(x.kpis)+`<div class="grid g3">${card('Expense Distribution by Category',chartBox('c_expDist','small'))}${card('Budget vs Actual by Category',chartBox('c_bva','small'))}${card('Monthly Spending Trend',chartBox('c_month','small'))}</div><div class="grid g2">${card('Paid vs Pending by Month',chartBox('c_paid','small'))}${card('Budget Utilization % by Category',bars(x.util_by_cat,'category','util'))}</div><div class="grid g2">${card('Top 5 Cost Centers by Expenses',bars(x.top_cost_centers,'center','amount'))}${card('Top 5 Vendors by Expenses',bars(x.top_vendors,'name','commitments'))}</div><div class="grid g21">${card('Top Alerts & Notifications',table([{label:'Type'},{label:'Category'},{label:'Issue'},{label:'Due'},{label:'Amount',num:1},{label:'Severity'},{label:'Status'}],(x.alerts||[]).slice(0,8).map(r=>row([r.type,r.category,r.issue,r.date,{text:fmt(r.amount),num:1},{html:badge(r.severity)},{html:badge(r.status)}]))))}${card('Project Overall Status',`<div style="text-align:center;padding:12px"><div style="font-size:54px;color:var(--green)">✓</div><h2>${t('On Track')}</h2><p class="muted">${LANG==='ar'?'المشروع يعمل ضمن مؤشرات مقبولة مع متابعة بنود التجاوز.':'The project is performing within acceptable parameters with monitored overruns.'}</p></div>`)}</div>`}

chartsExec(){let x=LIVE.exec;ch('c_expDist','doughnut',x.expense_dist.map(r=>r.category),[{label:'Amount',data:x.expense_dist.map(r=>r.amount),backgroundColor:PAL}]);ch('c_bva','bar',x.budget_vs_actual.slice(0,10).map(r=>r.category),[{label:'Budget',data:x.budget_vs_actual.slice(0,10).map(r=>r.budget),backgroundColor:'#38bdf8cc'},{label:'Actual',data:x.budget_vs_actual.slice(0,10).map(r=>r.actual),backgroundColor:'#fd480ecc'}]);ch('c_month','line',x.monthly_trend.map(r=>r.month),[{label:'Actual',data:x.monthly_trend.map(r=>r.actual),fill:true,backgroundColor:'#fd480e33'}]);ch('c_paid','bar',x.paid_vs_pending.map(r=>r.month),[{label:'Paid',data:x.paid_vs_pending.map(r=>r.paid),backgroundColor:'#22c55ecc'},{label:'Pending',data:x.paid_vs_pending.map(r=>r.pending),backgroundColor:'#f59e0bcc'}])}

// Register in R[] and C[] maps
if(typeof R !== 'undefined') R['exec'] = renderExec;
if(typeof C !== 'undefined') C['exec'] = chartsExec;
