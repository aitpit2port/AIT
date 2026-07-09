// ============================================================
// AIT Dashboard — pages/quality.js
// Page: Quality / Samples
// TO EDIT filters: change PAGE_FILTERS['quality'] below
// TO EDIT charts:  change chartsQuality() below
// TO EDIT KPIs:    change renderQuality() below
// ============================================================

// ── Page configuration ────────────────────────────────────────
// Edit THIS to change what filters appear on this page:
PAGE_FILTER_CFG['quality'] = ["mine", "material"];

// ── Render + Charts ───────────────────────────────────────────
renderQuality(){
  let x=LIVE.quality;
  const sAll=(x.samples||[]).filter(pass);
  const feV=sAll.map(r=>Number(r.Fe||r.fe||0)).filter(v=>v>0);
  const graded=sAll.filter(r=>r.grade||r.result);
  const passed=graded.filter(r=>r.grade==='pass'||r.result==='Pass');
  const rejected=graded.filter(r=>r.grade==='rej'||r.result==='Reject');
  const avgFe=feV.length?+(feV.reduce((a,b)=>a+b,0)/feV.length).toFixed(1):0;
  const minFe=feV.length?+Math.min(...feV).toFixed(1):0;
  const maxFe=feV.length?+Math.max(...feV).toFixed(1):0;
  const passRate=graded.length?+(passed.length/graded.length*100).toFixed(1):0;
  const mines=new Set(sAll.map(r=>r.mine)).size;
  const batches=new Set(sAll.map(r=>r.batch)).size;
  const latest=sAll.slice(-1)[0];
  const latestDate=latest?(latest.date||latest.updated||'—'):'—';
  const daysSince=latest?Math.floor((new Date()-new Date(String(latestDate).slice(0,10)))/86400000):null;
  const lk=[
    {label:'TOTAL SAMPLES',value:sAll.length,note:batches+' batches'},
    {label:'AVG FE%',value:avgFe,note:'Live KPI'},
    {label:'FE% RANGE',value:minFe+' – '+maxFe,note:'Min – Max'},
    {label:'PASS RATE',value:passRate+'%',note:passed.length+' of '+graded.length+' graded'},
    {label:'PASSED',value:passed.length,note:passRate+'% of graded'},
    {label:'REJECTED',value:rejected.length,note:(100-passRate).toFixed(1)+'% of graded'},
    {label:'MINES SAMPLED',value:mines,note:'14 registered'},
    {label:'LATEST SAMPLE',value:latestDate,note:daysSince===0?'0 days ago':daysSince===1?'1 day ago':(daysSince!==null?daysSince+' days ago':'')},
  ];
  const ekeys=sAll.length?Object.keys(sAll[0]).filter(k=>!['date','mine','material','zone','batch','grade','threshold','result','status','updated','material_match'].includes(k)&&sAll.some(r=>Number(r[k])>0)):[];
  return kpis(lk)+
    `<div class="grid g2">${card('Pass / Reject by Mine',chartBox('c_qMine','small'))}${card('Daily Avg Fe% Trend',chartBox('c_qDaily','small'))}</div>`+
    card('Element Levels — By Batch & By Day ('+ekeys.length+' elements)',chartBox('c_qElem'))+
    card('Full Sample Data — All Mines & Batches',table(
      [{label:'Date'},{label:'Mine'},{label:'Material'},{label:'Type'},{label:'Fe',num:1},{label:'Status'}],
      sAll.map(r=>row([r.date||r.updated,r.mine,r.material,r.batch,
        {text:Number(r.Fe||r.fe||0).toFixed(2),num:1},
        {html:badge(r.grade==='pass'?'Pass':r.grade==='rej'?'Reject':(r.result||r.status||''))}
      ]))
    ));
}

chartsQuality(){
  let x=LIVE.quality;
  let samples=(x.samples||[]).filter(pass);
  // by_mine from filtered samples
  const mm={};
  samples.forEach(r=>{if(!mm[r.mine])mm[r.mine]={s:0,n:0};mm[r.mine].s+=Number(r.Fe||r.fe||0);mm[r.mine].n++;});
  const by=Object.keys(mm).map(m=>({mine:m,avg_fe:mm[m].n?+(mm[m].s/mm[m].n).toFixed(2):0}));
  ch('c_qMine','bar',by.map(r=>r.mine),[{label:'Avg Fe%',data:by.map(r=>r.avg_fe),backgroundColor:by.map(r=>r.avg_fe>=55?'#22c55ecc':'#fd480ecc')}]);
  // Daily trend
  const daily={};
  samples.forEach(r=>{const day=String(r.date||r.updated||'').slice(0,10),fe=Number(r.Fe||r.fe||0);if(day&&fe){(daily[day]=daily[day]||[]).push(fe);}});
  const days=Object.keys(daily).sort().slice(-30);
  ch('c_qDaily','line',days,[{label:'Avg Fe%',data:days.map(d=>+(daily[d].reduce((a,b)=>a+b,0)/daily[d].length).toFixed(2)),fill:true,backgroundColor:'#fd480e22',borderColor:'#fd480e'}]);
  // ALL elements
  const recent=samples.slice(-50);
  const ekeys=samples.length?Object.keys(samples[0]).filter(k=>!['date','mine','material','zone','batch','grade','threshold','result','status','updated','material_match'].includes(k)&&samples.some(r=>Number(r[k])>0)):[];
  const els=ekeys.length?ekeys:(x.available_elements||['Fe','Al2O3','SiO2','CaO','MgO']);
  ch('c_qElem','line',recent.map((r,i)=>r.batch||String(i+1)),els.map((e,i)=>({label:e,data:recent.map(r=>Number(r[e]||0)),borderColor:PAL[i%PAL.length],backgroundColor:PAL[i%PAL.length]+'11',fill:false,pointRadius:2,borderWidth:1.5})),{legend:true});
}

// Register in R[] and C[] maps
if(typeof R !== 'undefined') R['quality'] = renderQuality;
if(typeof C !== 'undefined') C['quality'] = chartsQuality;
