// ============================================================
// AIT Dashboard — pages/vendors.js
// Page: Vendor & Procurement
// TO EDIT filters: change PAGE_FILTERS['vendors'] below
// TO EDIT charts:  change chartsVendors() below
// TO EDIT KPIs:    change renderVendors() below
// ============================================================

// ── Page configuration ────────────────────────────────────────
// Edit THIS to change what filters appear on this page:
PAGE_FILTER_CFG['vendors'] = [];

// ── Render + Charts ───────────────────────────────────────────
renderVendors(){let x=LIVE.vendors;return kpis(x.kpis)+`<div class="grid g2">${card('Spend by Category',chartBox('c_vCat','small'))}${card('Equipment Status',chartBox('c_vEquip','small'))}</div>${card('Top Vendors by Spend',table([{label:'Vendor'},{label:'Category'},{label:'Amount',num:1},{label:'Total',num:1}],(x.top_vendors||[]).slice(0,40).map(r=>row([r.name,r.category,{text:fmt(r.commitments||r.amount||r.total_spend),num:1},{text:r.count||r.transactions||'',num:1}]))))}${card('Equipment Master',table([{label:'ID'},{label:'Type'},{label:'Vendor'},{label:'Amount',num:1},{label:'Project'},{label:'Status'}],(x.equipment_master||[]).slice(0,60).map(r=>row([r.id,r.type,r.contractor||r.vendor,{text:fmt(r.monthly_rate||r.rate),num:1},r.project,{html:badge(r.status)}]))))}`}

chartsVendors(){let x=LIVE.vendors,s=x.equipment_status_summary||{};ch('c_vCat','doughnut',(x.spend_by_category||[]).map(r=>r.category),[{label:'Amount',data:(x.spend_by_category||[]).map(r=>r.amount),backgroundColor:PAL}]);ch('c_vEquip','doughnut',Object.keys(s),[{label:'Equipment',data:Object.values(s),backgroundColor:PAL}])}

// Register in R[] and C[] maps
if(typeof R !== 'undefined') R['vendors'] = renderVendors;
if(typeof C !== 'undefined') C['vendors'] = chartsVendors;
