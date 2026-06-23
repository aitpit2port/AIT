// ============================================================
// AIT Dashboard — pages/risks.js
// Page: Risk & Alerts
// TO EDIT filters: change PAGE_FILTERS['risks'] below
// TO EDIT charts:  change chartsRisks() below
// TO EDIT KPIs:    change renderRisks() below
// ============================================================

// ── Page configuration ────────────────────────────────────────
// Edit THIS to change what filters appear on this page:
PAGE_FILTER_CFG['risks'] = ["sev"];

// ── Render + Charts ───────────────────────────────────────────
renderRisks(){let x=LIVE.risks,a=x.alerts||x.register||[];return kpis(x.kpis)+`<div class="grid g2">${card('Alerts by Severity',chartBox('c_riskSev','small'))}${card('Alerts by Type',chartBox('c_riskType','small'))}</div>${card('Active Alerts & Notifications',table([{label:'Type'},{label:'Category'},{label:'Issue'},{label:'Due'},{label:'Amount',num:1},{label:'Severity'},{label:'Status'}],a.filter(pass).slice(0,60).map(r=>row([r.type,r.category,r.issue,r.date||r.due_date,{text:fmt(r.amount),num:1},{html:badge(r.severity)},{html:badge(r.status)}]))))}`}

chartsRisks(){let a=LIVE.risks.alerts||[],sev={},typ={};a.forEach(r=>{sev[r.severity]=(sev[r.severity]||0)+1;typ[r.type]=(typ[r.type]||0)+1});ch('c_riskSev','doughnut',Object.keys(sev),[{label:'Alerts',data:Object.values(sev),backgroundColor:PAL}]);ch('c_riskType','bar',Object.keys(typ),[{label:'Alerts',data:Object.values(typ),backgroundColor:'#fd480ecc'}],{legend:false})}

// Register in R[] and C[] maps
if(typeof R !== 'undefined') R['risks'] = renderRisks;
if(typeof C !== 'undefined') C['risks'] = chartsRisks;
