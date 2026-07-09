// ============================================================
// AIT Dashboard — pages/mines.js
// Page: Mines Map
// TO EDIT filters: change PAGE_FILTERS['mines'] below
// TO EDIT charts:  change chartsMines() below
// TO EDIT KPIs:    change renderMines() below
// ============================================================

// ── Page configuration ────────────────────────────────────────
// Edit THIS to change what filters appear on this page:
PAGE_FILTER_CFG['mines'] = [];

// ── Render + Charts ───────────────────────────────────────────
renderMines(){let x=LIVE.mines;return kpis(x.kpis)+`<div class="grid g2">${card('Registered Mines',chartBox('c_minesQty'))}${card('Total Qty',chartBox('c_minesMat'))}</div>${card('Mines Map',table([{label:'Mine'},{label:'Category'},{label:'Project'},{label:'Amount',num:1},{label:'Status'},{label:'Owner'}],(x.list||[]).slice(0,80).map(r=>row([r.name,r.material,r.gov,{text:fmt(r.qty_ton),num:1},{html:badge(r.status)},r.owner]))))}`}

// Register in R[] and C[] maps
if(typeof R !== 'undefined') R['mines'] = renderMines;
if(typeof C !== 'undefined') C['mines'] = chartsMines;

function chartsMines(){}
