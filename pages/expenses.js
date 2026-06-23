// ============================================================
// AIT Dashboard — pages/expenses.js
// Page: Expenses & Payment Plan
// TO EDIT filters: change PAGE_FILTERS['expenses'] below
// TO EDIT charts:  change chartsExpenses() below
// TO EDIT KPIs:    change renderExpenses() below
// ============================================================

// ── Page configuration ────────────────────────────────────────
// Edit THIS to change what filters appear on this page:
PAGE_FILTER_CFG['expenses'] = ["category", "month", "method", "exp_status"];

// ── Render + Charts ───────────────────────────────────────────
renderExpenses(){let x=LIVE.expenses,log=fp(x.log||[]).filter(pass);return kpis(x.kpis)+`<div class="grid g2">${card('Monthly Spending Trend',chartBox('c_expTrend','small'))}${card('Paid vs Pending by Month',chartBox('c_expPaid','small'))}</div><div class="grid g2">${card('Spend by Category',chartBox('c_expCat','small'))}${card('Payment Methods',chartBox('c_expMethod','small'))}</div>${card('Expense Log',table([{label:'Date'},{label:'Category'},{label:'Vendor'},{label:'Project'},{label:'Amount',num:1},{label:'Method'},{label:'Status'},{label:'Notes'}],log.slice(0,90).map(r=>row([r.date,r.category,r.vendor,r.project,{text:fmt(r.amount),num:1},r.method,{html:badge(r.status)},r.comments]))))}`}

chartsExpenses(){let x=LIVE.expenses;ch('c_expTrend','line',x.monthly_trend.map(r=>r.month),[{label:'Actual',data:x.monthly_trend.map(r=>r.actual),fill:true,backgroundColor:'#fd480e33'}]);ch('c_expPaid','bar',x.paid_vs_pending.map(r=>r.month),[{label:'Paid',data:x.paid_vs_pending.map(r=>r.paid),backgroundColor:'#22c55ecc'},{label:'Pending',data:x.paid_vs_pending.map(r=>r.pending),backgroundColor:'#f59e0bcc'}]);ch('c_expCat','doughnut',x.by_category.map(r=>r.category),[{label:'Amount',data:x.by_category.map(r=>r.amount),backgroundColor:PAL}]);ch('c_expMethod','doughnut',x.by_method.map(r=>r.method),[{label:'Amount',data:x.by_method.map(r=>r.amount),backgroundColor:PAL}])}

// Register in R[] and C[] maps
if(typeof R !== 'undefined') R['expenses'] = renderExpenses;
if(typeof C !== 'undefined') C['expenses'] = chartsExpenses;
