// ============================================================
// AIT Dashboard — pages/cashflow.js
// Page: Cash Flow Forecast
// TO EDIT filters: change PAGE_FILTERS['cashflow'] below
// TO EDIT charts:  change chartsCashflow() below
// TO EDIT KPIs:    change renderCashflow() below
// ============================================================

// ── Page configuration ────────────────────────────────────────
// Edit THIS to change what filters appear on this page:
PAGE_FILTER_CFG['cashflow'] = [];

// ── Render + Charts ───────────────────────────────────────────
renderCashflow(){let x=LIVE.cashflow;return kpis(x.kpis)+card('6-Month Cash Out Forecast',chartBox('c_cfForecast'))+`<div class="grid g2">${card('Cash Out by Category',chartBox('c_cfCat','small'))}${card('Upcoming Payments',table([{label:'Due'},{label:'Payee'},{label:'Category'},{label:'Amount',num:1},{label:'Priority'}],(x.upcoming_payments||[]).slice(0,30).map(r=>row([r.due_date||r.date,r.payee,r.category,{text:fmt(r.amount),num:1},{html:badge(r.priority)}]))))}</div>${card('Account Transfers Log',table([{label:'Date'},{label:'Month'},{label:'Project'},{label:'Amount',num:1}],(x.transfers_log||[]).slice(0,40).map(r=>row([r.date,r.month,r.project,{text:fmt(r.amount),num:1}]))))}`}

chartsCashflow(){let x=LIVE.cashflow;ch('c_cfForecast','bar',(x.forecast_6m||[]).map(r=>r.month),[{label:'Cash Out',data:(x.forecast_6m||[]).map(r=>r.amount||r.cash_out),backgroundColor:'#fd480ecc'}]);ch('c_cfCat','doughnut',(x.cash_out_by_category||[]).map(r=>r.category),[{label:'Amount',data:(x.cash_out_by_category||[]).map(r=>r.amount),backgroundColor:PAL}])}

// Register in R[] and C[] maps
if(typeof R !== 'undefined') R['cashflow'] = renderCashflow;
if(typeof C !== 'undefined') C['cashflow'] = chartsCashflow;
