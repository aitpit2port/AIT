// ============================================================
// AIT Dashboard — pages/timeline.js
// Page: Project Timeline / Gantt
// TO EDIT filters: change PAGE_FILTERS['timeline'] below
// TO EDIT charts:  change chartsTimeline() below
// TO EDIT KPIs:    change renderTimeline() below
// ============================================================

// ── Page configuration ────────────────────────────────────────
// Edit THIS to change what filters appear on this page:
PAGE_FILTER_CFG['timeline'] = ["tl_owner", "tl_status"];

// ── Render + Charts ───────────────────────────────────────────
renderTimeline(){let x=LIVE.timeline;return kpis(x.kpis)+`<div class="grid g21">${card('Project Timeline (Gantt)',chartBox('c_gantt','tall'))}${card('Tasks by Status',chartBox('c_tlStatus','small')+bars(Object.entries(x.by_status||{}).map(([category,amount])=>({category,amount})),'category','amount'))}</div>${card('Task Details',table([{label:'WBS'},{label:'Task / Phase'},{label:'Owner'},{label:'Start'},{label:'Due'},{label:'Complete'},{label:'Status'},{label:'Delay'}],(x.tasks||[]).filter(pass).slice(0,50).map(r=>row([r.wbs,r.title,r.owner,r.start,r.due,{text:(r.complete||0)+'%'},{html:badge(r.status)},r.delay]))))}`}

chartsTimeline(){let x=LIVE.timeline,t=(x.gantt||[]).slice(0,18);ch('c_gantt','bar',t.map(r=>r.phase),[{label:'Duration',data:t.map(r=>Math.max(1,(new Date(r.end)-new Date(r.start))/864e5)),backgroundColor:t.map(r=>String(r.status).includes('Delayed')?'#ef4444cc':String(r.status).includes('Completed')?'#22c55ecc':'#fd480ecc')}],{indexAxis:'y',legend:false});ch('c_tlStatus','doughnut',Object.keys(x.by_status||{}),[{label:'Tasks',data:Object.values(x.by_status||{}),backgroundColor:PAL}])}

// Register in R[] and C[] maps
if(typeof R !== 'undefined') R['timeline'] = renderTimeline;
if(typeof C !== 'undefined') C['timeline'] = chartsTimeline;
