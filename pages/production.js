// ============================================================
// AIT Dashboard — pages/production.js
// Page: Production / Lots
// TO EDIT filters: change PAGE_FILTERS['production'] below
// TO EDIT charts:  change chartsProduction() below
// TO EDIT KPIs:    change renderProduction() below
// ============================================================

// ── Page configuration ────────────────────────────────────────
// Edit THIS to change what filters appear on this page:
PAGE_FILTER_CFG['production'] = ["mine", "material"];

// ── Render + Charts ───────────────────────────────────────────
renderProduction(){
  let x=LIVE.production;
  const lotsF=(x.lots||[]).filter(pass);
  const totalTon=lotsF.reduce((s,r)=>s+Number(r.qty_ton||0),0);
  const feV=lotsF.map(r=>Number(r.avg_fe||0)).filter(v=>v>0);
  const avgFe=feV.length?+(feV.reduce((a,b)=>a+b,0)/feV.length).toFixed(1):0;
  const mines=new Set(lotsF.map(r=>r.mine)).size;
  const batches=new Set(lotsF.map(r=>r.batch)).size;
  const latest=lotsF.slice(-1)[0];
  const lk=[
    {label:'TOTAL LOTS',value:lotsF.length,note:batches+' batches'},
    {label:'TOTAL TONNAGE',value:totalTon,fmt:'currency',note:'Tons'},
    {label:'AVG FE%',value:avgFe,note:'Weighted avg'},
    {label:'MINES ACTIVE',value:mines,note:'In filtered view'},
    {label:'LATEST LOT',value:latest?(latest.updated||latest.date||'—'):'—',note:''},
  ];
  return kpis(lk)+
    `<div class="grid g2">${card('Tonnage by Mine',chartBox('c_prodTons','small'))}${card('Avg Fe% by Mine',chartBox('c_prodFe','small'))}</div>`+
    card('Production Lots Log',table(
      [{label:'Date'},{label:'Mine'},{label:'Material'},{label:'Batch'},{label:'Qty (Ton)',num:1},{label:'Avg Fe%',num:1}],
      lotsF.map(r=>row([r.updated||r.date,r.mine,r.material,r.batch,{text:fmt(r.qty_ton),num:1},{text:Number(r.avg_fe||0).toFixed(2),num:1}]))
    ));
}

chartsProduction(){
  const lots=(LIVE.production?.lots||[]).filter(pass);
  const mm={};
  lots.forEach(r=>{if(!mm[r.mine])mm[r.mine]={t:0,fs:0,n:0};mm[r.mine].t+=Number(r.qty_ton||0);mm[r.mine].fs+=Number(r.avg_fe||0);mm[r.mine].n++;});
  const by=Object.keys(mm).map(m=>({mine:m,qty_ton:mm[m].t,avg_fe:mm[m].n?+(mm[m].fs/mm[m].n).toFixed(2):0}));
  ch('c_prodTons','bar',by.map(r=>r.mine),[{label:'Qty (Ton)',data:by.map(r=>r.qty_ton),backgroundColor:'#fd480ecc'}]);
  ch('c_prodFe','bar',by.map(r=>r.mine),[{label:'Avg Fe%',data:by.map(r=>r.avg_fe),backgroundColor:'#38bdf8cc'}]);
}

// Register in R[] and C[] maps
if(typeof R !== 'undefined') R['production'] = renderProduction;
if(typeof C !== 'undefined') C['production'] = chartsProduction;
