// ============================================================
// AIT Dashboard — pages/budget.js
// Page: Budget Overview
// TO EDIT filters: change PAGE_FILTERS['budget'] below
// TO EDIT charts:  change chartsBudget() below
// TO EDIT KPIs:    change renderBudget() below
// ============================================================

// ── Page configuration ────────────────────────────────────────
// Edit THIS to change what filters appear on this page:
PAGE_FILTER_CFG['budget'] = ["category"];

// ── Render + Charts ───────────────────────────────────────────
renderBudget(){let x=LIVE.budget;return kpis(x.kpis)+`<div class="grid g2">${card('Budget vs Actual by Category',chartBox('c_budCat'))}${card('Budget Allocation by Category',chartBox('c_budAlloc'))}</div><div class="grid g2">${card('Budget Utilization % by Category',bars(x.by_category,'category','util'))}${card('Budget Notes & Status',`<div class="list">${(x.notes||[]).map(n=>`<div class="list-row"><b>${esc(t(n.text))}</b></div>`).join('')}</div>`)}</div>${card('Detailed Budget Summary',table([{label:'Category'},{label:'Budget',num:1},{label:'Actual',num:1},{label:'Remaining',num:1},{label:'Variance',num:1},{label:'Status'}],(x.by_category||[]).filter(pass).map(r=>row([r.category,{text:fmt(r.budget),num:1},{text:fmt(r.actual),num:1},{text:fmt(r.remaining),num:1},{text:fmt(r.variance),num:1},{html:badge(r.status)}]))))}`}

chartsBudget(){let a=LIVE.budget.by_category.slice(0,12);ch('c_budCat','bar',a.map(r=>r.category),[{label:'Budget',data:a.map(r=>r.budget),backgroundColor:'#38bdf8cc'},{label:'Actual',data:a.map(r=>r.actual),backgroundColor:'#fd480ecc'}]);ch('c_budAlloc','doughnut',LIVE.budget.allocation_pct.slice(0,10).map(r=>r.category),[{label:'Budget',data:LIVE.budget.allocation_pct.slice(0,10).map(r=>r.pct),backgroundColor:PAL}])}

// Register in R[] and C[] maps
if(typeof R !== 'undefined') R['budget'] = renderBudget;
if(typeof C !== 'undefined') C['budget'] = chartsBudget;
