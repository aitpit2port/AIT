// ============================================================
// AIT Dashboard — pages/cost.js
// Page: Cost Analysis
// TO EDIT filters: change PAGE_FILTERS['cost'] below
// TO EDIT charts:  change chartsCost() below
// TO EDIT KPIs:    change renderCost() below
// ============================================================

// ── Page configuration ────────────────────────────────────────
// Edit THIS to change what filters appear on this page:
PAGE_FILTER_CFG['cost'] = ["category"];

// ── Render + Charts ───────────────────────────────────────────
renderCost(){let x=LIVE.cost;return kpis(x.kpis)+`<div class="grid g2">${card('Actual vs Budget by Category',chartBox('c_costAvB'))}${card('Top 10 Spend Items',chartBox('c_costTop'))}</div><div class="grid g2">${card('Monthly Spending Trend',chartBox('c_costTrend','small'))}${card('Spend by Cost Center',bars(x.by_cost_center||[],'center','amount'))}</div>`}

chartsCost(){let x=LIVE.cost,av=x.actual_vs_budget||[],top=x.top10||[];ch('c_costAvB','bar',av.slice(0,12).map(r=>r.category),[{label:'Budget',data:av.slice(0,12).map(r=>r.budget),backgroundColor:'#38bdf8cc'},{label:'Actual',data:av.slice(0,12).map(r=>r.actual),backgroundColor:'#fd480ecc'}]);ch('c_costTop','bar',top.map(r=>r.item||r.category),[{label:'Amount',data:top.map(r=>r.amount),backgroundColor:'#fd480ecc'}],{indexAxis:'y',legend:false});ch('c_costTrend','line',(x.spend_trend||[]).map(r=>r.month),[{label:'Actual',data:(x.spend_trend||[]).map(r=>r.amount||r.actual),fill:true,backgroundColor:'#fd480e33'}])}

// Register in R[] and C[] maps
if(typeof R !== 'undefined') R['cost'] = renderCost;
if(typeof C !== 'undefined') C['cost'] = chartsCost;
