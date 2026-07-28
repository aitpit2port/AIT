(function(){
'use strict';
const $=id=>document.getElementById(id);
function updateToday(){
  const el=$('todayLabel');
  if(!el)return;
  const ar=(document.documentElement.lang||'ar').toLowerCase().startsWith('ar');
  el.textContent=new Intl.DateTimeFormat(ar?'ar-EG':'en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
}
function activeFilterCount(){
  const ids=['mineFilter','departmentFilter','jobFilter','employeeFilter','statusFilter','vehicleFilter','searchFilter'];
  return ids.reduce((n,id)=>n+(($(id)&&String($(id).value||'').trim())?1:0),0);
}
function updateFilterBadge(){
  const badge=$('activeFilterCount');
  if(!badge)return;
  const n=activeFilterCount();
  badge.textContent=n?String(n):'0';
  badge.classList.toggle('has-filters',n>0);
}
function setAdvanced(open){
  const box=$('advancedFilters');
  const btn=$('filterToggleBtn');
  if(!box||!btn)return;
  box.hidden=!open;
  btn.setAttribute('aria-expanded',String(open));
  const label=btn.querySelector('[data-toggle-label]');
  if(label){const ar=(document.documentElement.lang||'ar').toLowerCase().startsWith('ar');label.textContent=open?(ar?'إخفاء الفلاتر الإضافية':'Hide additional filters'):(ar?'إظهار الفلاتر الإضافية':'Show additional filters');}
  try{localStorage.setItem('ait_advanced_filters',open?'1':'0')}catch(e){}
}
function init(){
  updateToday();
  const btn=$('filterToggleBtn');
  let stored=false;
  try{stored=localStorage.getItem('ait_advanced_filters')==='1'}catch(e){}
  setAdvanced(stored);
  if(btn)btn.addEventListener('click',()=>setAdvanced(btn.getAttribute('aria-expanded')!=='true'));
  ['mineFilter','departmentFilter','jobFilter','employeeFilter','statusFilter','vehicleFilter','searchFilter'].forEach(id=>{
    const el=$(id);if(!el)return;
    el.addEventListener(el.tagName==='INPUT'?'input':'change',updateFilterBadge);
  });
  const clear=$('clearFilters');if(clear)clear.addEventListener('click',()=>setTimeout(updateFilterBadge,0));
  updateFilterBadge();
  const observer=new MutationObserver(()=>{updateToday();const btn=$('filterToggleBtn');if(btn)setAdvanced(btn.getAttribute('aria-expanded')==='true');});
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
