// ============================================================
// AIT Dashboard — shared.js
// Loaded by every page. Contains: API, auth, render engine,
// shared helpers, filters, chart builder.
// TO EDIT: only change this file for cross-page fixes.
// ============================================================

const DEFAULT_API_URL='https://script.google.com/macros/s/AKfycbxfl8DMsgy__jtquMmQX0-RByrW2qIL45nzH8imv-slUdUkJm8XwTJjsz6gphtua-LJiw/exec';
const __apiQs=new URLSearchParams(location.search);
const API_URL=__apiQs.get('api')||localStorage.getItem('ait_api_url')||DEFAULT_API_URL;
if(__apiQs.get('api')) localStorage.setItem('ait_api_url',__apiQs.get('api'));
const USER_EMAIL_KEY='ait_dashboard_user_email';
const USER_SESSION_KEY='ait_dashboard_auth_session_v2';
const ALL_PAGE_KEYS=['exec','timeline','budget','expenses','cost','cashflow','risks','vendors','approvals','performance','production','equipment','samples','quality','mines','spareparts','auth'];
function apiRequest(action,params={}){
  return new Promise((resolve,reject)=>{
    const cb='aitJsonp_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const qs=new URLSearchParams(Object.assign({},params,{action:action,callback:cb,t:Date.now()}));
    const sc=document.createElement('script');let done=false;
    const cleanup=()=>{if(sc.parentNode)sc.parentNode.removeChild(sc);try{delete window[cb]}catch(e){window[cb]=undefined}};
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('timeout'))},45000);
    window[cb]=data=>{if(done)return;done=true;clearTimeout(timer);cleanup();resolve(data)};
    sc.onerror=()=>{if(done)return;done=true;clearTimeout(timer);cleanup();reject(new Error('jsonp_error'))};
    sc.src=API_URL+'?'+qs.toString();document.body.appendChild(sc);
  });
}

function getAuthToken(){try{const s=JSON.parse(localStorage.getItem('ait_auth_session')||'null');return s&&s.token?s.token:'';}catch(e){return '';}}
function saveBackendSession(res,email){try{localStorage.setItem('ait_auth_session',JSON.stringify({token:res.token||'',user:res.user||{},loginAt:new Date().toISOString()}));}catch(e){}}
function apiModuleAction(module,action,params={}){return apiRequest(action,Object.assign({module},params));}
function authToLegacyUser(res){const u=(res&&res.user)||{};return{active:!!(res&&res.ok),email:u.email||'',name:u.username||u.email||'',role:(u.allowed_pages||[]).includes('auth')?'admin':'viewer',pages:u.allowed_pages||Object.keys(u.pages||{}).filter(k=>u.pages[k]),canExcel:!!u.can_export,canPdf:!!u.can_export};}

function normalizeEmail(v){return String(v||'').trim().toLowerCase()}
function getQueryEmail(){try{return normalizeEmail(new URLSearchParams(location.search).get('email'))}catch(e){return ''}}
function getSavedEmail(){return normalizeEmail(localStorage.getItem(USER_EMAIL_KEY)||'')}
function setSavedEmail(email){email=normalizeEmail(email);if(email)localStorage.setItem(USER_EMAIL_KEY,email);return email}
function clearSavedEmail(){localStorage.removeItem(USER_EMAIL_KEY);sessionStorage.removeItem(USER_SESSION_KEY)}
function getUserEmail(required){return getQueryEmail()||getSavedEmail()||(window.USER_EMAIL||'')||'';}
function readAuthSession(){try{const raw=sessionStorage.getItem(USER_SESSION_KEY);return raw?JSON.parse(raw):null}catch(e){return null}}
function saveAuthSession(auth,email){try{sessionStorage.setItem(USER_SESSION_KEY,JSON.stringify({email:normalizeEmail(email),name:auth.name||email,role:auth.role||'viewer',pages:auth.pages||[],canExcel:!!auth.canExcel,canPdf:!!auth.canPdf,active:!!auth.active}))}catch(e){}}
function showLoginScreen(){
  const el=document.getElementById('ait-login-overlay');
  if(el){el.style.cssText='display:flex;position:fixed;inset:0;z-index:9999;width:100vw;height:100vh;';el.setAttribute('aria-hidden','false');}
  const ld=document.getElementById('loading');if(ld)ld.classList.add('hide');
}
function hideLoginScreen(){
  const el=document.getElementById('ait-login-overlay');if(!el)return;
  el.style.transition='opacity .4s ease';el.style.opacity='0';
  setTimeout(()=>{el.style.display='none';el.style.opacity='';el.setAttribute('aria-hidden','true');},400);
}
function showDashboardLoading(text){
  const l=document.getElementById('loading'); if(!l)return;
  const p=l.querySelector('p'); if(p&&text)p.textContent=text;
  l.style.display='grid'; l.classList.remove('hide');
}
function hideDashboardLoading(){const l=document.getElementById('loading');if(l){l.classList.add('hide');setTimeout(()=>{l.style.display='none'},250);}}
function setLoginBusy(isBusy,msg){
  const btn=document.getElementById('login-btn'), err=document.getElementById('login-err'), sub=document.querySelector('#ait-login-overlay .lp-sub');
  if(btn){btn.disabled=!!isBusy;btn.textContent=isBusy?(LANG==='ar'?'جارٍ التحميل...':'Loading...'):(LANG==='ar'?'دخول':'Sign In');}
  if(sub)sub.textContent=msg||(LANG==='ar'?'سجّل الدخول للوصول إلى لوحة التحكم':'Sign in to access your dashboard');
  if(err&&!isBusy)err.textContent='';
}
function normalizePages(pages){
  if(!pages)return [];
  if(typeof pages==='string')pages=pages.split(/[|,;]/).map(x=>x.trim()).filter(Boolean);
  if(!Array.isArray(pages))return [];
  const aliases={
    'executive summary':'exec','project timeline':'timeline','project timeline / gantt':'timeline','timeline':'timeline','gantt':'timeline',
    'budget overview':'budget','budget':'budget','expenses & payment plan':'expenses','expenses':'expenses','expense':'expenses',
    'cost analysis':'cost','cost':'cost','cash flow forecast':'cashflow','cashflow':'cashflow','cash flow':'cashflow',
    'risk & alerts':'risks','risks':'risks','risk':'risks','vendor & procurement':'vendors','vendors':'vendors','procurement':'vendors',
    'monthly performance':'performance','monthly performance report':'performance','performance':'performance','production / lots':'production','production':'production','lots':'production',
    'quality / samples':'quality','quality':'quality','samples':'quality','mines map':'mines','mines':'mines','approval workflow':'approvals','approvals':'approvals'
  };
  const out=[];
  pages.forEach(x=>{
    const raw=String(x||'').trim(); if(!raw)return;
    const key=aliases[raw.toLowerCase()]||raw;
    if(ALL_PAGE_KEYS.includes(key)&&!out.includes(key))out.push(key);
  });
  return out;
}
function isAdminRole(role){return String(role||'').toLowerCase()==='admin'}
function applyAuth(auth,email){
  auth=auth||{}; email=normalizeEmail(email||auth.email||'');
  const role=auth.role||'viewer';
  let pages=normalizePages(auth.pages||[]);
  if(isAdminRole(role)&&!pages.length)pages=ALL_PAGE_KEYS.slice();
  if(!pages.length)pages=['exec'];
  if(typeof PAGES!=='undefined'){
    PAGES.length=0; ALL_PAGE_KEYS.forEach(p=>{if(pages.includes(p))PAGES.push(p)});
    if(!PAGES.length)PAGES.push('exec');
    if(!PAGES.includes(CURRENT))CURRENT=PAGES[0];
  }
  window.USER_ROLE=role; window.USER_EXCEL=!!auth.canExcel||isAdminRole(role); window.USER_PDF=!!auth.canPdf||isAdminRole(role);
  window.USER_NAME=auth.name||email; window.USER_EMAIL=email;
  const exBtn=document.getElementById('excelBtn'), pdBtn=document.getElementById('pdfBtn');
  if(exBtn)exBtn.style.display=window.USER_EXCEL?'':'none';
  if(pdBtn)pdBtn.style.display=window.USER_PDF?'':'none';
}
async function doLogin(){
  const emailEl=document.getElementById('login-email'),passEl=document.getElementById('login-pass'),errEl=document.getElementById('login-err'),btn=document.getElementById('login-btn');
  const email=normalizeEmail(emailEl.value||''),pass=(passEl.value||'').trim();
  errEl.textContent='';
  if(!email){errEl.textContent=LANG==='ar'?'أدخل الإيميل':'Enter your email';return;}
  // Password validation is server-side only
  setLoginBusy(true,LANG==='ar'?'جارٍ التحقق من الإيميل وكلمة المرور...':'Checking email and password...');
  try{
    const res=await apiModuleAction('auth','login',{identifier:email,password:pass});
    const auth=authToLegacyUser(res);
    if(!auth||auth.error||!auth.active){errEl.textContent=(auth&&auth.message)||(LANG==='ar'?'الإيميل أو كلمة المرور غير صحيحة أو الحساب موقوف':'Invalid email/password or inactive account');setLoginBusy(false);return;}
    window.USER_PASS=pass; setSavedEmail(email); applyAuth(auth,email); saveAuthSession(auth,email); saveBackendSession(res,email);
    setLoginBusy(true,LANG==='ar'?'تم التحقق — جارٍ تحميل بيانات الداشبورد من الشيت...':'Verified — loading dashboard data from the sheet...');
    render();
    await refreshData({silent:true});
    hideLoginScreen();
    hideDashboardLoading();
    render();
  }catch(e){console.error(e);errEl.textContent=LANG==='ar'?'خطأ في الاتصال بسيرفر الصلاحيات أو تحميل البيانات':'Connection error with permissions server or dashboard data';setLoginBusy(false);}
}
function doLogout(){
  clearSavedEmail(); window.USER_PASS=''; window.USER_ROLE=''; window.USER_NAME=''; window.USER_EMAIL='';
  PAGES.length=0; ALL_PAGE_KEYS.forEach(p=>PAGES.push(p)); CURRENT='exec';
  showLoginScreen();
  const em=document.getElementById('login-email'),ps=document.getElementById('login-pass'),er=document.getElementById('login-err');
  if(em)em.value=''; if(ps)ps.value=''; if(er)er.textContent='';
  render();
}
async function verifyUserEmail(email){
  email=normalizeEmail(email||getSavedEmail());
  if(!email)throw new Error('EMAIL_REQUIRED');
  if(window.USER_PASS){
    const res=await apiModuleAction('auth','login',{identifier:email,password:window.USER_PASS||''});
    const auth=authToLegacyUser(res);
    if(!auth||auth.error||!auth.active){clearSavedEmail();showLoginScreen();throw new Error((auth&&auth.message)||'ACCESS_DENIED')}
    applyAuth(auth,email); saveAuthSession(auth,email); return auth;
  }
  const sess=readAuthSession();
  if(sess&&normalizeEmail(sess.email)===email&&sess.active){applyAuth(sess,email);return sess;}
  showLoginScreen();throw new Error('LOGIN_REQUIRED');
}
let LIVE=JSON.parse(document.getElementById('embedded-data').textContent), LANG=localStorage.getItem('ait_lang')||'en', CURRENT='exec', PROJECT='all', FILTERS={}, CHARTS={};
const PAGES=['exec','timeline','budget','expenses','cost','cashflow','risks','vendors','approvals','performance','production','equipment','samples','quality','mines','spareparts'], ICONS={exec:'OV',timeline:'TL',budget:'BD',expenses:'EX',cost:'CA',cashflow:'CF',risks:'RK',vendors:'VD',performance:'PR',production:'PD',quality:'QL',mines:'MP',admin:'US'};
const META={exec:['Executive Summary','Overview of project financial performance and key indicators','الملخص التنفيذي','نظرة عامة على الأداء المالي ومؤشرات المشروع الرئيسية'],timeline:['Project Timeline / Gantt','Schedule progress, milestones, delay and ownership','الجدول الزمني / جانت','متابعة الجدول الزمني والمعالم والتأخير والمسؤوليات'],budget:['Budget Overview','Budget allocation, actual spend and utilization control','نظرة عامة على الميزانية','توزيع الميزانية والمصروف الفعلي ونسب الاستخدام'],expenses:['Expenses & Payment Plan','Expense log, paid / pending payments and overdue items','المصروفات وخطة السداد','سجل المصروفات والمدفوع والمعلق والمتأخرات'],cost:['Cost Analysis','Cost centers, top spend items and overrun analysis','تحليل التكلفة','مراكز التكلفة وأعلى بنود الصرف وتحليل التجاوزات'],cashflow:['Cash Flow Forecast','Upcoming payments and six-month cash-out forecast','توقعات التدفق النقدي','المدفوعات القادمة وتوقعات الصرف لستة أشهر'],risks:['Risk & Alerts','Active alerts, severity distribution and overdue risks','المخاطر والتنبيهات','التنبيهات النشطة وتوزيع الخطورة والمخاطر المتأخرة'],vendors:['Vendor & Procurement','Vendors, contractors, equipment and procurement indicators','الموردون والمشتريات','الموردون والمقاولون والمعدات ومؤشرات التوريد'],performance:['Monthly Performance Report','Monthly financial performance and project status','تقرير الأداء الشهري','الأداء المالي الشهري وحالة المشاريع'],production:['Production / Lots','Lots inventory, mine quantities and quality production view','الإنتاج / اللوطات','مخزون اللوطات وكميات المناجم ومؤشرات الإنتاج'],quality:['Quality / Samples','Sample quality, Fe trend and pass / reject analysis','الجودة / العينات','تحليل العينات واتجاه الحديد والقبول والرفض'],mines:['Mines Map','Registered mines, quantities, materials and ownership data','خريطة المناجم','المناجم المسجلة والكميات والخامات وبيانات الملكية'],admin:['User Permissions','Manage user access and page permissions','إدارة المستخدمين','إدارة صلاحيات الوصول للصفحات']};
const D={'Executive Control Center':'مركز التحكم التنفيذي','Project / Site':'المشروع / الموقع','All Projects':'كل المشاريع','Refresh Data':'تحديث البيانات','Refresh':'تحديث','Excel':'إكسل','PDF':'PDF','All amounts are in EGP':'كل المبالغ بالجنيه المصري','Data as of':'آخر تحديث','Filters':'الفلاتر','Clear Filters':'مسح الفلاتر','All':'الكل','Status':'الحالة','Category':'البند','Amount':'المبلغ','Actual':'الفعلي','Budget':'الميزانية','Remaining':'المتبقي','Variance':'الفارق','Project':'المشروع','Vendor':'المورد','Date':'التاريخ','Notes':'ملاحظات','Owner':'المسؤول','Start':'البداية','Due':'الاستحقاق','Complete':'الإنجاز','Delay':'التأخير','Priority':'الأولوية','Severity':'الخطورة','Issue':'المشكلة','Type':'النوع','Method':'طريقة الدفع','Payee':'المستفيد','Month':'الشهر','Open':'مفتوح','Overdue':'متأخر','Paid':'مدفوع','Pending':'معلق','Scheduled':'مجدول','Completed':'مكتمل','In Progress':'جارٍ التنفيذ','Delayed':'متأخر','Planned':'مخطط','On Track':'على المسار','At Risk':'تحت المراقبة','Off Track':'خارج المسار','Over Budget':'تجاوز الميزانية','Unbudgeted':'غير مدرج بالميزانية','Critical':'حرج','High':'مرتفع','Medium':'متوسط','Low':'منخفض','Healthy':'سليم','Active':'نشط','Expired':'منتهي','Expiring Soon':'قارب الانتهاء','Total':'الإجمالي','Pass':'مقبول','Reject':'مرفوض','TOTAL BUDGET':'إجمالي الميزانية','ACTUAL SPEND':'المصروف الفعلي','REMAINING BUDGET':'المتبقي من الميزانية','OVER BUDGET':'تجاوز الميزانية','PAID TO DATE':'المدفوع حتى الآن','PENDING PAYMENTS':'مدفوعات معلقة','BUDGET UTILIZATION':'استخدام الميزانية','OVERDUE / ALERTS':'المتأخرات / التنبيهات','TOTAL TASKS':'إجمالي المهام','COMPLETED':'مكتمل','IN PROGRESS':'جارٍ التنفيذ','DELAYED':'متأخر','PLANNED':'مخطط','OVERALL COMPLETION':'نسبة الإنجاز الكلية','BUDGET VARIANCE':'فارق الميزانية','OVER BUDGET ITEMS':'بنود متجاوزة','TOTAL TRANSACTIONS':'إجمالي العمليات','TOTAL BUDGET LINES':'بنود الميزانية','REGISTERED MINES':'المناجم المسجلة','TOTAL QTY (TON/MONTH)':'إجمالي الكمية طن / شهر','Expense Distribution by Category':'توزيع المصروفات حسب البند','Budget vs Actual by Category':'الميزانية مقابل الفعلي حسب البند','Monthly Spending Trend':'اتجاه الصرف الشهري','Paid vs Pending by Month':'المدفوع مقابل المعلق شهريًا','Budget Utilization % by Category':'نسبة استخدام الميزانية حسب البند','Top 5 Vendors by Expenses':'أعلى 5 موردين حسب المصروفات','Top 5 Cost Centers by Expenses':'أعلى 5 مراكز تكلفة حسب المصروفات','Top Alerts & Notifications':'أهم التنبيهات والإشعارات','Project Overall Status':'الحالة العامة للمشروع','Project Timeline (Gantt)':'الجدول الزمني للمشروع (جانت)','Task Details':'تفاصيل المهام','Tasks by Status':'المهام حسب الحالة','Budget Allocation by Category':'توزيع الميزانية حسب البند','Budget Notes & Status':'ملاحظات وحالة الميزانية','Detailed Budget Summary':'ملخص الميزانية التفصيلي','Spend by Category':'الصرف حسب البند','Payment Methods':'طرق الدفع','Expense Log':'سجل المصروفات','Actual vs Budget by Category':'الفعلي مقابل الميزانية حسب البند','Top 10 Spend Items':'أعلى 10 بنود صرف','Spend by Cost Center':'الصرف حسب مركز التكلفة','6-Month Cash Out Forecast':'توقعات الصرف النقدي 6 أشهر','Cash Out by Category':'الصرف النقدي حسب البند','Upcoming Payments':'المدفوعات القادمة','Account Transfers Log':'سجل تحويلات الحساب','Alerts by Severity':'التنبيهات حسب الخطورة','Alerts by Type':'التنبيهات حسب النوع','Active Alerts & Notifications':'التنبيهات والإشعارات النشطة','Top Vendors by Spend':'أعلى الموردين حسب الصرف','Equipment Master':'سجل المعدات','Equipment Status':'حالة المعدات','Budget vs Actual by Project':'الميزانية مقابل الفعلي حسب المشروع','Budget Utilization by Project':'استخدام الميزانية حسب المشروع','Financial Summary':'الملخص المالي','Project Performance':'أداء المشروع','Tons by Mine':'الأطنان حسب المنجم','Avg Fe% by Mine (Lots)':'متوسط الحديد حسب المنجم','Lot Inventory':'مخزون اللوطات','Pass / Reject by Mine':'القبول / الرفض حسب المنجم','Daily Avg Fe% Trend':'اتجاه متوسط الحديد اليومي','Element Levels — By Batch & By Day':'نسب العناصر حسب اللوط واليوم','Full Sample Data — All Mines & Batches':'بيانات العينات الكاملة — كل المناجم واللوطات','Mines Map':'خريطة المناجم','Registered Mines':'المناجم المسجلة','Total Qty':'إجمالي الكمية','Equipment Leasing':'تأجير المعدات','Maintenance':'الصيانة','Tools & Equipment':'الأدوات والمعدات','CAPEX / Setup':'تجهيزات / استثمارات','Site Services':'خدمات الموقع','Management Support':'دعم الإدارة','Equipment Purchasing':'شراء المعدات','Water for Road Preparation':'مياه تجهيز الطريق','Manpower':'عمالة','Security Services':'خدمات أمن','Fixed':'ثابتة','Site Services Management':'إدارة خدمات الموقع','HSE':'السلامة والصحة المهنية','Temporary Staffing':'عمالة مؤقتة','Transportation':'نقل','Utilities':'مرافق','Transport Services':'خدمات النقل','Contractors':'مقاولون','Accommodation':'إقامة','Fuel Expense':'وقود','Other / Unmapped':'أخرى / غير مصنفة','April':'أبريل','May':'مايو','June':'يونيو','July':'يوليو','August':'أغسطس','September':'سبتمبر','October':'أكتوبر','November':'نوفمبر','December':'ديسمبر','January':'يناير','February':'فبراير','March':'مارس'};
function t(x){if(x==null)return '—';let s=String(x);return LANG==='ar'?(D[s]||s):s}function esc(s){return String(s??'—').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}function fmt(v){let n=Number(v)||0,a=Math.abs(n);if(a>=1e9)return(n/1e9).toFixed(2)+'B';if(a>=1e6)return(n/1e6).toFixed(2)+'M';if(a>=1e3)return(n/1e3).toFixed(0)+'K';return n.toLocaleString('en-EG',{maximumFractionDigits:0})}function badge(s){let k=String(s||'').toLowerCase(),c=k.includes('critical')||k.includes('over')||k.includes('reject')||k.includes('delayed')||k.includes('expired')?'red':k.includes('high')||k.includes('risk')||k.includes('pending')||k.includes('overdue')?'orange':k.includes('complete')||k.includes('track')||k.includes('paid')||k.includes('pass')||k.includes('active')?'green':k.includes('medium')?'blue':'purple';return `<span class="badge ${c}">${esc(t(s))}</span>`}
function row(cells){return '<tr>'+cells.map(c=>`<td class="${c&&c.num?'num':''}">${c&&c.html?c.html:esc(t(c&&'text'in Object(c)?c.text:c))}</td>`).join('')+'</tr>'}function table(headers,rows){return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th class="${h.num?'num':''}">${t(h.label||h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${headers.length}" class="muted">${LANG==='ar'?'لا توجد بيانات':'No data'}</td></tr>`}</tbody></table></div>`}function card(title,body){return `<div class="card"><div class="card-head"><h3>${esc(t(title))}</h3></div><div class="card-body">${body}</div></div>`}function chartBox(id,cls=''){return `<div class="chart ${cls}"><canvas id="${id}"></canvas></div>`}function kpis(k){return `<div class="kpis ${k.length>4?'big':''}">${(k||[]).map((x,i)=>`<div class="kpi"><div class="kpi-top"><span class="kpi-ico">${['↗','▣','◈','●','◆','■','▲','✓'][i%8]}</span><span>${esc(t(x.label))}</span></div><div class="kpi-val">${x.fmt==='currency'?fmt(x.value):x.fmt==='percent'?(Number(x.value)||0).toFixed(1)+'%':(typeof x.value==='number'?fmt(x.value):esc(t(x.value)))}</div><div class="kpi-note">${esc(t(x.note||'Live KPI'))}</div></div>`).join('')}</div>`}function bars(items,label,value){let max=Math.max(...(items||[]).map(x=>Number(x[value])||0),1);return `<div class="list">${(items||[]).slice(0,10).map(r=>{let v=Number(r[value])||0;return `<div class="list-row"><div><b>${esc(t(r[label]||r.category||r.name||r.center||'—'))}</b><div class="muted">${fmt(v)} EGP</div></div><div class="bar"><span style="width:${Math.min(v/max*100,100)}%"></span></div></div>`}).join('')}</div>`}
function layout(){document.documentElement.dir='ltr';document.documentElement.dataset.theme='dark';document.body.classList.toggle('ar',LANG==='ar');langBtn.textContent=langBtn2.textContent=LANG==='ar'?'EN':'AR';eyebrow.textContent=t('Executive Control Center');projectLabel.textContent=t('Project / Site');excelBtn.textContent=t('Excel');pdfBtn.textContent=t('PDF');refreshBtn.textContent=t('Refresh Data');refreshSide.innerHTML='<span class="txt">'+t('Refresh')+'</span>';footAmounts.textContent=t('All amounts are in EGP');footUpdate.textContent=t('Data as of')+' '+(LIVE.lastUpdated||'—')}function nav(){
  navEl=document.getElementById('nav');
  navEl.innerHTML=PAGES.map(p=>
    `<div class="nav-item ${p===CURRENT?'active':''}" onclick="goPage('${p}')">
      <span class="nav-icon">${ICONS[p]}</span>
      <span class="nav-label">${esc(LANG==='ar'?META[p][2]:META[p][0])}</span>
    </div>`
  ).join('');
  if(window.USER_ROLE==='admin'||window.USER_ROLE==='Admin'){
    navEl.innerHTML+=`<div class="nav-item ${'admin'===CURRENT?'active':''}" onclick="goPage('admin');adminLoadUsers()" style="margin-top:8px;border-top:1px solid #1b2d44;padding-top:8px">
      <span class="nav-icon">US</span><span class="nav-label">${LANG==='ar'?'إدارة المستخدمين':'User Permissions'}</span></div>`;
  }
  navEl.innerHTML+=`<div onclick="doLogout()" style="padding:8px 14px;cursor:pointer;color:#8892a4;font-size:12px;display:flex;align-items:center;gap:8px;border-top:1px solid #1b2d44;margin-top:12px" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#8892a4'">
    <span>🚪</span><span class="nav-label">${LANG==='ar'?'تسجيل الخروج':'Logout'} ${window.USER_NAME?'('+window.USER_NAME+')':''}</span></div>`;
}

function ch(id,type,labels,datasets,opts={}){
  let el=document.getElementById(id);if(!el||!window.Chart)return;
  labels=(labels||[]).map(t);
  datasets=(datasets||[]).map((d,i)=>({...d,label:t(d.label||''),borderColor:d.borderColor||PAL[i%PAL.length],backgroundColor:d.backgroundColor||PAL[i%PAL.length]+'cc',borderWidth:d.borderWidth||2,tension:.35,borderRadius:8}));
  const fk=(typeof CHART_FILTER_KEY!=='undefined')?CHART_FILTER_KEY[id]:null;
  CHARTS[id]=new Chart(el,{type,data:{labels,datasets},options:{
    responsive:true,maintainAspectRatio:false,
    plugins:{
      legend:{display:opts.legend??true,labels:{color:'#b8c7df',boxWidth:12,font:{size:11}}},
      tooltip:{backgroundColor:'#07101f',borderColor:'#fd480e',borderWidth:1,titleColor:'#ffb294',bodyColor:'#eef4ff',padding:12}
    },
    scales:(type==='doughnut'||type==='pie')?{}:{
      x:{grid:{color:'rgba(148,163,184,.12)'},ticks:{color:'#9fb0c9',maxRotation:35}},
      y:{grid:{color:'rgba(148,163,184,.12)'},ticks:{color:'#9fb0c9',callback:v=>fmt(v)}}
    },
    onClick:fk?(evt,els)=>{if(!els.length)return;const lbl=labels[els[0].index];FILTERS[fk]=(FILTERS[fk]===lbl)?'all':lbl;render();}:undefined,
    onHover:fk?(evt,els)=>{el.style.cursor=els.length?'pointer':'default';}:undefined,
    ...opts
  }});
}
function renderExec(){let x=LIVE.exec;return kpis(x.kpis)+`<div class="grid g3">${card('Expense Distribution by Category',chartBox('c_expDist','small'))}${card('Budget vs Actual by Category',chartBox('c_bva','small'))}${card('Monthly Spending Trend',chartBox('c_month','small'))}</div><div class="grid g2">${card('Paid vs Pending by Month',chartBox('c_paid','small'))}${card('Budget Utilization % by Category',bars(x.util_by_cat,'category','util'))}</div><div class="grid g2">${card('Top 5 Cost Centers by Expenses',bars(x.top_cost_centers,'center','amount'))}${card('Top 5 Vendors by Expenses',bars(x.top_vendors,'name','commitments'))}</div><div class="grid g21">${card('Top Alerts & Notifications',table([{label:'Type'},{label:'Category'},{label:'Issue'},{label:'Due'},{label:'Amount',num:1},{label:'Severity'},{label:'Status'}],(x.alerts||[]).slice(0,8).map(r=>row([r.type,r.category,r.issue,r.date,{text:fmt(r.amount),num:1},{html:badge(r.severity)},{html:badge(r.status)}]))))}${card('Project Overall Status',`<div style="text-align:center;padding:12px"><div style="font-size:54px;color:var(--green)">✓</div><h2>${t('On Track')}</h2><p class="muted">${LANG==='ar'?'المشروع يعمل ضمن مؤشرات مقبولة مع متابعة بنود التجاوز.':'The project is performing within acceptable parameters with monitored overruns.'}</p></div>`)}</div>`}function chartsExec(){let x=LIVE.exec;ch('c_expDist','doughnut',x.expense_dist.map(r=>r.category),[{label:'Amount',data:x.expense_dist.map(r=>r.amount),backgroundColor:PAL}]);ch('c_bva','bar',x.budget_vs_actual.slice(0,10).map(r=>r.category),[{label:'Budget',data:x.budget_vs_actual.slice(0,10).map(r=>r.budget),backgroundColor:'#38bdf8cc'},{label:'Actual',data:x.budget_vs_actual.slice(0,10).map(r=>r.actual),backgroundColor:'#fd480ecc'}]);ch('c_month','line',x.monthly_trend.map(r=>r.month),[{label:'Actual',data:x.monthly_trend.map(r=>r.actual),fill:true,backgroundColor:'#fd480e33'}]);ch('c_paid','bar',x.paid_vs_pending.map(r=>r.month),[{label:'Paid',data:x.paid_vs_pending.map(r=>r.paid),backgroundColor:'#22c55ecc'},{label:'Pending',data:x.paid_vs_pending.map(r=>r.pending),backgroundColor:'#f59e0bcc'}])}
function renderTimeline(){let x=LIVE.timeline;return kpis(x.kpis)+`<div class="grid g21">${card('Project Timeline (Gantt)',chartBox('c_gantt','tall'))}${card('Tasks by Status',chartBox('c_tlStatus','small')+bars(Object.entries(x.by_status||{}).map(([category,amount])=>({category,amount})),'category','amount'))}</div>${card('Task Details',table([{label:'WBS'},{label:'Task / Phase'},{label:'Owner'},{label:'Start'},{label:'Due'},{label:'Complete'},{label:'Status'},{label:'Delay'}],(x.tasks||[]).filter(pass).slice(0,50).map(r=>row([r.wbs,r.title,r.owner,r.start,r.due,{text:(r.complete||0)+'%'},{html:badge(r.status)},r.delay]))))}`}function chartsTimeline(){let x=LIVE.timeline,t=(x.gantt||[]).slice(0,18);ch('c_gantt','bar',t.map(r=>r.phase),[{label:'Duration',data:t.map(r=>Math.max(1,(new Date(r.end)-new Date(r.start))/864e5)),backgroundColor:t.map(r=>String(r.status).includes('Delayed')?'#ef4444cc':String(r.status).includes('Completed')?'#22c55ecc':'#fd480ecc')}],{indexAxis:'y',legend:false});ch('c_tlStatus','doughnut',Object.keys(x.by_status||{}),[{label:'Tasks',data:Object.values(x.by_status||{}),backgroundColor:PAL}])}
function renderBudget(){let x=LIVE.budget;return kpis(x.kpis)+`<div class="grid g2">${card('Budget vs Actual by Category',chartBox('c_budCat'))}${card('Budget Allocation by Category',chartBox('c_budAlloc'))}</div><div class="grid g2">${card('Budget Utilization % by Category',bars(x.by_category,'category','util'))}${card('Budget Notes & Status',`<div class="list">${(x.notes||[]).map(n=>`<div class="list-row"><b>${esc(t(n.text))}</b></div>`).join('')}</div>`)}</div>${card('Detailed Budget Summary',table([{label:'Category'},{label:'Budget',num:1},{label:'Actual',num:1},{label:'Remaining',num:1},{label:'Variance',num:1},{label:'Status'}],(x.by_category||[]).filter(pass).map(r=>row([r.category,{text:fmt(r.budget),num:1},{text:fmt(r.actual),num:1},{text:fmt(r.remaining),num:1},{text:fmt(r.variance),num:1},{html:badge(r.status)}]))))}`}function chartsBudget(){let a=LIVE.budget.by_category.slice(0,12);ch('c_budCat','bar',a.map(r=>r.category),[{label:'Budget',data:a.map(r=>r.budget),backgroundColor:'#38bdf8cc'},{label:'Actual',data:a.map(r=>r.actual),backgroundColor:'#fd480ecc'}]);ch('c_budAlloc','doughnut',LIVE.budget.allocation_pct.slice(0,10).map(r=>r.category),[{label:'Budget',data:LIVE.budget.allocation_pct.slice(0,10).map(r=>r.pct),backgroundColor:PAL}])}
function renderExpenses(){let x=LIVE.expenses,log=fp(x.log||[]).filter(pass);return kpis(x.kpis)+`<div class="grid g2">${card('Monthly Spending Trend',chartBox('c_expTrend','small'))}${card('Paid vs Pending by Month',chartBox('c_expPaid','small'))}</div><div class="grid g2">${card('Spend by Category',chartBox('c_expCat','small'))}${card('Payment Methods',chartBox('c_expMethod','small'))}</div>${card('Expense Log',table([{label:'Date'},{label:'Category'},{label:'Vendor'},{label:'Project'},{label:'Amount',num:1},{label:'Method'},{label:'Status'},{label:'Notes'}],log.slice(0,90).map(r=>row([r.date,r.category,r.vendor,r.project,{text:fmt(r.amount),num:1},r.method,{html:badge(r.status)},r.comments]))))}`}function chartsExpenses(){let x=LIVE.expenses;ch('c_expTrend','line',x.monthly_trend.map(r=>r.month),[{label:'Actual',data:x.monthly_trend.map(r=>r.actual),fill:true,backgroundColor:'#fd480e33'}]);ch('c_expPaid','bar',x.paid_vs_pending.map(r=>r.month),[{label:'Paid',data:x.paid_vs_pending.map(r=>r.paid),backgroundColor:'#22c55ecc'},{label:'Pending',data:x.paid_vs_pending.map(r=>r.pending),backgroundColor:'#f59e0bcc'}]);ch('c_expCat','doughnut',x.by_category.map(r=>r.category),[{label:'Amount',data:x.by_category.map(r=>r.amount),backgroundColor:PAL}]);ch('c_expMethod','doughnut',x.by_method.map(r=>r.method),[{label:'Amount',data:x.by_method.map(r=>r.amount),backgroundColor:PAL}])}
function renderCost(){let x=LIVE.cost;return kpis(x.kpis)+`<div class="grid g2">${card('Actual vs Budget by Category',chartBox('c_costAvB'))}${card('Top 10 Spend Items',chartBox('c_costTop'))}</div><div class="grid g2">${card('Monthly Spending Trend',chartBox('c_costTrend','small'))}${card('Spend by Cost Center',bars(x.by_cost_center||[],'center','amount'))}</div>`}function chartsCost(){let x=LIVE.cost,av=x.actual_vs_budget||[],top=x.top10||[];ch('c_costAvB','bar',av.slice(0,12).map(r=>r.category),[{label:'Budget',data:av.slice(0,12).map(r=>r.budget),backgroundColor:'#38bdf8cc'},{label:'Actual',data:av.slice(0,12).map(r=>r.actual),backgroundColor:'#fd480ecc'}]);ch('c_costTop','bar',top.map(r=>r.item||r.category),[{label:'Amount',data:top.map(r=>r.amount),backgroundColor:'#fd480ecc'}],{indexAxis:'y',legend:false});ch('c_costTrend','line',(x.spend_trend||[]).map(r=>r.month),[{label:'Actual',data:(x.spend_trend||[]).map(r=>r.amount||r.actual),fill:true,backgroundColor:'#fd480e33'}])}
function renderCashflow(){let x=LIVE.cashflow;return kpis(x.kpis)+card('6-Month Cash Out Forecast',chartBox('c_cfForecast'))+`<div class="grid g2">${card('Cash Out by Category',chartBox('c_cfCat','small'))}${card('Upcoming Payments',table([{label:'Due'},{label:'Payee'},{label:'Category'},{label:'Amount',num:1},{label:'Priority'}],(x.upcoming_payments||[]).slice(0,30).map(r=>row([r.due_date||r.date,r.payee,r.category,{text:fmt(r.amount),num:1},{html:badge(r.priority)}]))))}</div>${card('Account Transfers Log',table([{label:'Date'},{label:'Month'},{label:'Project'},{label:'Amount',num:1}],(x.transfers_log||[]).slice(0,40).map(r=>row([r.date,r.month,r.project,{text:fmt(r.amount),num:1}]))))}`}function chartsCashflow(){let x=LIVE.cashflow;ch('c_cfForecast','bar',(x.forecast_6m||[]).map(r=>r.month),[{label:'Cash Out',data:(x.forecast_6m||[]).map(r=>r.amount||r.cash_out),backgroundColor:'#fd480ecc'}]);ch('c_cfCat','doughnut',(x.cash_out_by_category||[]).map(r=>r.category),[{label:'Amount',data:(x.cash_out_by_category||[]).map(r=>r.amount),backgroundColor:PAL}])}
function renderRisks(){let x=LIVE.risks,a=x.alerts||x.register||[];return kpis(x.kpis)+`<div class="grid g2">${card('Alerts by Severity',chartBox('c_riskSev','small'))}${card('Alerts by Type',chartBox('c_riskType','small'))}</div>${card('Active Alerts & Notifications',table([{label:'Type'},{label:'Category'},{label:'Issue'},{label:'Due'},{label:'Amount',num:1},{label:'Severity'},{label:'Status'}],a.filter(pass).slice(0,60).map(r=>row([r.type,r.category,r.issue,r.date||r.due_date,{text:fmt(r.amount),num:1},{html:badge(r.severity)},{html:badge(r.status)}]))))}`}function chartsRisks(){let a=LIVE.risks.alerts||[],sev={},typ={};a.forEach(r=>{sev[r.severity]=(sev[r.severity]||0)+1;typ[r.type]=(typ[r.type]||0)+1});ch('c_riskSev','doughnut',Object.keys(sev),[{label:'Alerts',data:Object.values(sev),backgroundColor:PAL}]);ch('c_riskType','bar',Object.keys(typ),[{label:'Alerts',data:Object.values(typ),backgroundColor:'#fd480ecc'}],{legend:false})}
function renderVendors(){let x=LIVE.vendors;return kpis(x.kpis)+`<div class="grid g2">${card('Spend by Category',chartBox('c_vCat','small'))}${card('Equipment Status',chartBox('c_vEquip','small'))}</div>${card('Top Vendors by Spend',table([{label:'Vendor'},{label:'Category'},{label:'Amount',num:1},{label:'Total',num:1}],(x.top_vendors||[]).slice(0,40).map(r=>row([r.name,r.category,{text:fmt(r.commitments||r.amount||r.total_spend),num:1},{text:r.count||r.transactions||'',num:1}]))))}${card('Equipment Master',table([{label:'ID'},{label:'Type'},{label:'Vendor'},{label:'Amount',num:1},{label:'Project'},{label:'Status'}],(x.equipment_master||[]).slice(0,60).map(r=>row([r.id,r.type,r.contractor||r.vendor,{text:fmt(r.monthly_rate||r.rate),num:1},r.project,{html:badge(r.status)}]))))}`}function chartsVendors(){let x=LIVE.vendors,s=x.equipment_status_summary||{};ch('c_vCat','doughnut',(x.spend_by_category||[]).map(r=>r.category),[{label:'Amount',data:(x.spend_by_category||[]).map(r=>r.amount),backgroundColor:PAL}]);ch('c_vEquip','doughnut',Object.keys(s),[{label:'Equipment',data:Object.values(s),backgroundColor:PAL}])}
function renderPerformance(){let x=LIVE.performance,by=x.by_project||[];return kpis(x.kpis)+`<div class="grid g2">${card('Budget vs Actual by Project',chartBox('c_perfBvA','small'))}${card('Budget Utilization by Project',chartBox('c_perfUtil','small'))}</div><div class="grid g2">${card('Financial Summary',`<div class="list">${Object.entries(x.financial_summary||{}).map(([k,v])=>`<div class="list-row"><b>${esc(t(k.replaceAll('_',' ').toUpperCase()))}</b><span>${typeof v==='number'?fmt(v):esc(v)}</span></div>`).join('')}</div>`)}${card('Project Performance',table([{label:'Project'},{label:'Budget',num:1},{label:'Actual',num:1},{label:'Status'}],by.map(r=>row([r.project,{text:fmt(r.budget),num:1},{text:fmt(r.actual),num:1},{html:badge((r.util_pct||0)>100?'Over Budget':(r.util_pct||0)>85?'At Risk':'On Track')}]))))}</div>`}function chartsPerformance(){let by=LIVE.performance.by_project||[];ch('c_perfBvA','bar',by.map(r=>r.project),[{label:'Budget',data:by.map(r=>r.budget),backgroundColor:'#38bdf8cc'},{label:'Actual',data:by.map(r=>r.actual),backgroundColor:'#fd480ecc'}]);ch('c_perfUtil','doughnut',by.map(r=>r.project),[{label:'Budget Utilization',data:by.map(r=>r.util_pct||0),backgroundColor:PAL}])}
function renderProduction(){
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
function chartsProduction(){
  const lots=(LIVE.production?.lots||[]).filter(pass);
  const mm={};
  lots.forEach(r=>{if(!mm[r.mine])mm[r.mine]={t:0,fs:0,n:0};mm[r.mine].t+=Number(r.qty_ton||0);mm[r.mine].fs+=Number(r.avg_fe||0);mm[r.mine].n++;});
  const by=Object.keys(mm).map(m=>({mine:m,qty_ton:mm[m].t,avg_fe:mm[m].n?+(mm[m].fs/mm[m].n).toFixed(2):0}));
  ch('c_prodTons','bar',by.map(r=>r.mine),[{label:'Qty (Ton)',data:by.map(r=>r.qty_ton),backgroundColor:'#fd480ecc'}]);
  ch('c_prodFe','bar',by.map(r=>r.mine),[{label:'Avg Fe%',data:by.map(r=>r.avg_fe),backgroundColor:'#38bdf8cc'}]);
}
function renderQuality(){
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
function chartsQuality(){
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
function renderMines(){let x=LIVE.mines;return kpis(x.kpis)+`<div class="grid g2">${card('Registered Mines',chartBox('c_minesQty'))}${card('Total Qty',chartBox('c_minesMat'))}</div>${card('Mines Map',table([{label:'Mine'},{label:'Category'},{label:'Project'},{label:'Amount',num:1},{label:'Status'},{label:'Owner'}],(x.list||[]).slice(0,80).map(r=>row([r.name,r.material,r.gov,{text:fmt(r.qty_ton),num:1},{html:badge(r.status)},r.owner]))))}`}function chartsMines(){let list=LIVE.mines.list||[],m={};list.forEach(r=>m[r.material]=(m[r.material]||0)+(r.qty_ton||0));ch('c_minesQty','bar',list.slice(0,12).map(r=>r.name),[{label:'Total Qty',data:list.slice(0,12).map(r=>r.qty_ton),backgroundColor:'#fd480ecc'}]);ch('c_minesMat','doughnut',Object.keys(m),[{label:'Qty',data:Object.values(m),backgroundColor:PAL}])}
function renderAdmin(){
  const ALL_PAGES_LIST=['exec','timeline','budget','expenses','cost','cashflow','risks','vendors','approvals','performance','production','quality','mines'];
  const PAGE_LABELS={
    exec:'Executive Summary',timeline:'Project Timeline',budget:'Budget Overview',
    expenses:'Expenses & Payments',cost:'Cost Analysis',cashflow:'Cash Flow',
    risks:'Risk & Alerts',vendors:'Vendor & Procurement',approvals:'Approval Workflow',
    performance:'Monthly Performance',production:'Production / Lots',
    quality:'Quality / Samples',mines:'Mines Map'
  };
  const perms=LIVE.permissions||[];
  const isAr=LANG==='ar';

  const headerStyle=`style="background:#0d1b2a;color:#fd480e;font-size:11px;font-weight:700;padding:8px 12px;text-align:center;border:1px solid #1e3048;white-space:nowrap"`;
  const thUser=`style="background:#0d1b2a;color:#fd480e;font-size:11px;font-weight:700;padding:8px 14px;border:1px solid #1e3048;white-space:nowrap"`;

  const pageHeaders=ALL_PAGES_LIST.map(p=>`<th ${headerStyle}>${PAGE_LABELS[p]}</th>`).join('');

  const rows=perms.map((u,i)=>{
    const bg=i%2===0?'#0d1117':'#111827';
    const activeDot=u.active?'<span style="color:#22c55e;font-size:16px">●</span>':'<span style="color:#ef4444;font-size:16px">○</span>';
    const pageCells=ALL_PAGES_LIST.map(p=>{
      const has=(u.pages||[]).includes(p);
      return `<td style="text-align:center;background:${bg};border:1px solid #1e3048;padding:6px">
        <span style="color:${has?'#22c55e':'#374151'};font-size:18px">${has?'✓':'○'}</span>
      </td>`;
    }).join('');
    return `<tr>
      <td style="background:${bg};border:1px solid #1e3048;padding:8px 12px;color:#e8ecf2;font-size:12px;white-space:nowrap">${u.email||'—'}</td>
      <td style="background:${bg};border:1px solid #1e3048;padding:8px 12px;color:#8892a4;font-size:12px">${u.name||'—'}</td>
      <td style="background:${bg};border:1px solid #1e3048;padding:8px 12px;text-align:center">
        <span style="background:#1b2d44;color:#fd480e;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700">${u.role||'—'}</span>
      </td>
      <td style="background:${bg};border:1px solid #1e3048;padding:8px 12px;text-align:center">${activeDot}</td>
      <td style="background:${bg};border:1px solid #1e3048;padding:8px 12px;text-align:center">
        <span style="color:${u.canExcel?'#22c55e':'#374151'};font-size:16px">${u.canExcel?'✓':'○'}</span>
      </td>
      <td style="background:${bg};border:1px solid #1e3048;padding:8px 12px;text-align:center">
        <span style="color:${u.canPdf?'#22c55e':'#374151'};font-size:16px">${u.canPdf?'✓':'○'}</span>
      </td>
      ${pageCells}
    </tr>`;
  }).join('');

  const notice=perms.length===0
    ?`<div style="padding:40px;text-align:center;color:#8892a4">
        <div style="font-size:32px;margin-bottom:12px">🔒</div>
        <div style="font-size:14px">${isAr?'لا توجد بيانات صلاحيات. تأكد من وجود شيت Permissions في الداشبورد.':'No permissions data. Make sure the Permissions sheet exists in the Dashboard spreadsheet.'}</div>
        <div style="margin-top:12px;font-size:12px;color:#6b7280">${isAr?'شغّل setupPermissionsSheet() في Apps Script لإنشاء الشيت.':'Run setupPermissionsSheet() in Apps Script to create the sheet.'}</div>
      </div>` : '';

  return `
  <div style="padding:0 0 24px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div>
        <div style="font-size:13px;font-weight:700;color:#e8ecf2">${isAr?'إدارة صلاحيات المستخدمين':'User Permissions Management'}</div>
        <div style="font-size:11px;color:#8892a4;margin-top:2px">${isAr?'لتعديل الصلاحيات، عدّل شيت Permissions في Google Sheets مباشرة':'To edit permissions, update the Permissions sheet in Google Sheets directly'}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="background:#0d1b2a;border:1px solid #1e3048;border-radius:6px;padding:5px 12px;font-size:11px;color:#8892a4">${perms.length} ${isAr?'مستخدم':'users'}</span>
        <button onclick="refreshData()" style="background:#fd480e;color:#fff;border:none;border-radius:6px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer">${isAr?'تحديث':'Refresh'}</button>
      </div>
    </div>

    ${notice}

    ${perms.length>0?`
    <div style="overflow-x:auto;border-radius:10px;border:1px solid #1e3048">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr>
            <th ${thUser}>${isAr?'البريد الإلكتروني':'Email'}</th>
            <th ${thUser}>${isAr?'الاسم':'Name'}</th>
            <th ${headerStyle}>${isAr?'الدور':'Role'}</th>
            <th ${headerStyle}>${isAr?'نشط':'Active'}</th>
            <th ${headerStyle}>Excel</th>
            <th ${headerStyle}>PDF</th>
            ${pageHeaders}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="margin-top:10px;font-size:11px;color:#6b7280;display:flex;gap:16px;flex-wrap:wrap">
      <span><span style="color:#22c55e">✓</span> ${isAr?'مسموح':'Allowed'}</span>
      <span><span style="color:#374151">○</span> ${isAr?'محظور':'Not allowed'}</span>
      <span><span style="color:#22c55e">●</span> ${isAr?'نشط':'Active'}</span>
      <span><span style="color:#ef4444">○</span> ${isAr?'موقوف':'Suspended'}</span>
    </div>
    `:''}
  </div>`;
}


// ── Admin Panel JS Functions ──────────────────────────────────
window.ADMIN_USERS=[];
function adminSetField(ri,field,val){if(!window.ADMIN_USERS[ri])window.ADMIN_USERS[ri]={pages:[]};window.ADMIN_USERS[ri][field]=val;}
function adminSetPagePerm(ri,pageKey,val){
  if(!window.ADMIN_USERS[ri])window.ADMIN_USERS[ri]={pages:[]};
  const u=window.ADMIN_USERS[ri];if(!u.pages)u.pages=[];
  if(val&&!u.pages.includes(pageKey))u.pages.push(pageKey);
  if(!val)u.pages=u.pages.filter(p=>p!==pageKey);
}
function adminAddRow(){
  window.ADMIN_USERS.push({email:'',password:'',name:'',role:'viewer',active:true,canExcel:false,canPdf:false,pages:['exec']});
  render();
}
async function adminLoadUsers(){
  const email=getSavedEmail();if(!email)return;
  try{
    const res=await apiRequest('getUsers',{email,password:window.USER_PASS||''});
    if(res&&res.users){
      window.ADMIN_USERS=res.users;render();
      const st=document.getElementById('admin-status');
      if(st){st.style.color='#22c55e';st.textContent='✓ '+(LANG==='ar'?'تم تحميل المستخدمين':'Users loaded')+' ('+res.users.length+')';}
    }
  }catch(e){console.error('adminLoadUsers:',e);}
}
async function adminSaveAll(){
  const email=getSavedEmail();if(!email)return;
  const st=document.getElementById('admin-status');
  if(st){st.style.color='#f59e0b';st.textContent=LANG==='ar'?'جارٍ الحفظ...':'Saving...';}
  try{
    const res=await apiRequest('saveUsers',{email,password:window.USER_PASS||'',users:JSON.stringify(window.ADMIN_USERS)});
    if(st){
      if(res&&res.ok){st.style.color='#22c55e';st.textContent='✓ '+(LANG==='ar'?'تم الحفظ بنجاح':'Saved successfully')+' — '+new Date().toLocaleTimeString();}
      else{st.style.color='#ef4444';st.textContent='✗ '+(res?.message||'Save failed');}
    }
  }catch(e){if(st){st.style.color='#ef4444';st.textContent='✗ Connection error';}}
}

const R={exec:renderExec,timeline:renderTimeline,budget:renderBudget,expenses:renderExpenses,cost:renderCost,cashflow:renderCashflow,risks:renderRisks,vendors:renderVendors,performance:renderPerformance,production:renderProduction,quality:renderQuality,mines:renderMines,admin:renderAdmin}, C={exec:chartsExec,timeline:chartsTimeline,budget:chartsBudget,expenses:chartsExpenses,cost:chartsCost,cashflow:chartsCashflow,risks:chartsRisks,vendors:chartsVendors,performance:chartsPerformance,production:chartsProduction,quality:chartsQuality,mines:chartsMines,admin:()=>{}};


// ============================================================
// FILTERS STATE & HELPER FUNCTIONS (injected)
// ============================================================
// FILTERS is already declared with the global dashboard state above.

const PAGE_FILTER_CFG = {
  exec:[],
  timeline:['tl_owner','tl_status'],
  budget:['category'],
  expenses:['category','month','method','exp_status'],
  cost:['category'],
  cashflow:[],
  risks:['sev'],
  vendors:[],
  performance:[],
  production:['mine','material'],
  quality:['mine','material'],
  mines:[],
  admin:[],
};

const CHART_FILTER_KEY = {
  c_qMine:'mine', c_qDaily:'month',
  c_prodTons:'mine', c_prodFe:'mine',
  c_expCat:'category', c_bva:'category', c_budCat:'category',
  c_riskSev:'sev', c_tlStatus:'tl_status',
};

function pass(r){
  if(!r) return false;
  if(FILTERS.category   &&FILTERS.category!=='all'   &&r.category!==FILTERS.category   &&(r.material||'').toLowerCase()!==(FILTERS.category||'').toLowerCase()) return false;
  if(FILTERS.exp_status &&FILTERS.exp_status!=='all' &&r.status!==FILTERS.exp_status)   return false;
  if(FILTERS.tl_status  &&FILTERS.tl_status!=='all'  &&r.status!==FILTERS.tl_status)    return false;
  if(FILTERS.tl_owner   &&FILTERS.tl_owner!=='all'   &&r.owner!==FILTERS.tl_owner)      return false;
  if(FILTERS.sev        &&FILTERS.sev!=='all'         &&r.severity!==FILTERS.sev)        return false;
  if(FILTERS.mine       &&FILTERS.mine!=='all'        &&r.mine!==FILTERS.mine)            return false;
  if(FILTERS.material   &&FILTERS.material!=='all'    &&(r.material||'').toLowerCase()!==(FILTERS.material||'').toLowerCase()) return false;
  if(FILTERS.month      &&FILTERS.month!=='all'       &&!(r.date||'').startsWith(FILTERS.month)) return false;
  if(FILTERS.method     &&FILTERS.method!=='all'      &&r.method!==FILTERS.method)        return false;
  return true;
}

function projects(){
  const sel=document.getElementById('projectSelect');
  if(!sel) return;
  const projs=[...new Set([
    ...(LIVE.expenses?.log||[]).map(r=>r.project||''),
    ...(LIVE.budget?.by_category||[]).map(r=>r.project||''),
    ...(LIVE.timeline?.tasks||[]).map(r=>r.project||''),
  ].filter(Boolean))].sort();
  const cur=sel.value||PROJECT;
  sel.innerHTML=`<option value="all">${LANG==='ar'?'كل المشاريع':'All Projects'}</option>`
    +projs.map(p=>`<option value="${esc(p)}"${cur===p?' selected':''}>${esc(p)}</option>`).join('');
  sel.value=cur;
}

function filters(){
  const el=document.getElementById('filters');
  if(!el) return;
  const keys=PAGE_FILTER_CFG[CURRENT]||[];
  if(!keys.length){el.innerHTML='';return;}
  const expLog=LIVE.expenses?.log||[];
  const qualS=LIVE.quality?.samples||[];
  const prodL=LIVE.production?.lots||[];
  const tlT=LIVE.timeline?.tasks||[];
  const budC=(LIVE.budget?.by_category||[]).map(r=>r.category).filter(Boolean);
  const mines=[...new Set((CURRENT==='quality'?qualS:prodL).map(r=>r.mine||''))].filter(Boolean).sort();
  const mats=[...new Set([...(LIVE.production?.material_types||[]),...(LIVE.quality?.material_types||[])])].filter(Boolean).sort();
  const months=[...new Set(expLog.map(r=>(r.date||'').substring(0,7)).filter(Boolean))].sort();
  const methods=[...new Set(expLog.map(r=>r.method||'').filter(Boolean))].sort();
  const expC=[...new Set(expLog.map(r=>r.category||'').filter(Boolean))].sort();
  const cats=CURRENT==='expenses'?expC:[...new Set([...expC,...budC])].filter(Boolean).sort();
  const owners=[...new Set(tlT.map(t=>t.owner||'').filter(Boolean))].sort();
  const s=(label,key,opts)=>{
    const cur=FILTERS[key]||'all';
    return `<span class="label">${label}</span><div class="field"><select onchange="FILTERS['${key}']=this.value;render()"><option value="all">All</option>${opts.map(o=>`<option value="${esc(o)}"${cur===o?' selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
  };
  const any=Object.values(FILTERS).some(v=>v&&v!=='all');
  let out=`<span class="label">${LANG==='ar'?'الفلاتر':'Filters'}</span>`;
  if(keys.includes('category'))   out+=s(LANG==='ar'?'البند':'Category',    'category',  cats);
  if(keys.includes('month'))      out+=s(LANG==='ar'?'الشهر':'Month',       'month',     months);
  if(keys.includes('method'))     out+=s(LANG==='ar'?'الطريقة':'Method',    'method',    methods);
  if(keys.includes('exp_status')) out+=s(LANG==='ar'?'الحالة':'Status',     'exp_status',['Paid','Scheduled','Overdue','Review']);
  if(keys.includes('tl_owner'))   out+=s(LANG==='ar'?'المسؤول':'Owner',     'tl_owner',  owners);
  if(keys.includes('tl_status'))  out+=s(LANG==='ar'?'الحالة':'Status',     'tl_status', ['Completed','In Progress','Delayed','Planned']);
  if(keys.includes('sev'))        out+=s(LANG==='ar'?'الخطورة':'Severity',  'sev',       ['Critical','High','Medium','Low']);
  if(keys.includes('mine'))       out+=s(LANG==='ar'?'المنجم':'Mine',       'mine',      mines);
  if(keys.includes('material'))   out+=s(LANG==='ar'?'المادة':'Material',   'material',  mats);
  out+=`<button class="btn${any?' btn-warn':''}" onclick="FILTERS={};render()">${any?'✕ ':''}${LANG==='ar'?'مسح الفلاتر':'Clear Filters'}${any?' ('+Object.values(FILTERS).filter(v=>v&&v!=='all').length+')':''}</button>`;
  el.innerHTML=out;
}

function destroy(){
  Object.values(CHARTS).forEach(c=>{try{c.destroy()}catch(e){}});
  CHARTS={};
}



function render(){
  layout();nav();projects();filters();destroy();
  let m=META[CURRENT]||['','','',''];
  if(pageTitle) pageTitle.textContent=LANG==='ar'?m[2]:m[0];
  if(pageSub)   pageSub.textContent  =LANG==='ar'?m[3]:m[1];
  // If page script not loaded yet, load it first then render
  if(typeof R==='undefined'||!R[CURRENT]){
    window.AIT.loadPage(CURRENT).then(()=>render()).catch(e=>console.error(e));
    return;
  }
  try{
    if(pages) pages.innerHTML=`<div class="page active" id="page-${CURRENT}">${R[CURRENT]()}</div>`;
  }catch(e){ console.error('Render error:',e); }
  setTimeout(()=>{
    try{ if(typeof C!=='undefined'&&C[CURRENT]) C[CURRENT](); }
    catch(e){ console.error(e); toast(LANG==='ar'?'خطأ في رسم أحد المخططات':'Chart render error'); }
  },20);
}function goPage(p){CURRENT=p;render()}function setProject(v){PROJECT=v;render()}function toggleLang(){LANG=LANG==='ar'?'en':'ar';localStorage.setItem('ait_lang',LANG);render()}function toast(msg){let el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3000)}async function refreshData(options={}){let silent=!!options.silent;let old=refreshBtn.textContent;refreshBtn.textContent=LANG==='ar'?'جاري التحديث...':'Refreshing...';refreshBtn.disabled=true;try{const token=getAuthToken();const pageMap={quality:'samples',samples:'samples'};for(const p of PAGES){const moduleName=pageMap[p]||p;try{let fresh=await apiRequest('data',{module:moduleName,token});if(fresh&&fresh.error)throw new Error(fresh.message||fresh.error);if(fresh&&fresh[moduleName])LIVE[p]=fresh[moduleName];else if(fresh&&fresh[p])LIVE[p]=fresh[p];else if(moduleName==='samples'&&fresh&&fresh.quality)LIVE[p]=fresh.quality;else if(fresh&&Array.isArray(fresh.rows))LIVE[p]={rows:fresh.rows,items:fresh.rows,count:fresh.count||fresh.rows.length};if(fresh&&fresh.lastUpdated)LIVE.lastUpdated=fresh.lastUpdated;}catch(inner){console.warn('Refresh skipped',p,inner)}}if(!silent)toast(LANG==='ar'?'تم تحديث البيانات بنجاح':'Data refreshed successfully')}catch(e){if(!silent)toast((LANG==='ar'?'تعذر التحديث: ':'Refresh failed: ')+(e.message||e));console.error(e);throw e}finally{refreshBtn.textContent=old;refreshBtn.disabled=false;render()}}function changeDashboardUser(){localStorage.removeItem(USER_EMAIL_KEY);let email=getUserEmail(true);if(email)toast((LANG==='ar'?'تم حفظ الإيميل: ':'Saved email: ')+email)}function exportExcel(){if(!window.USER_EXCEL){toast(LANG==='ar'?'ليست لديك صلاحية تحميل Excel':'You do not have Excel export permission');return;}let wb=XLSX.utils.book_new();Object.entries(LIVE).forEach(([k,v])=>{if(v&&typeof v==='object'&&!Array.isArray(v)){Object.entries(v).forEach(([sk,arr])=>{if(Array.isArray(arr)&&arr.length&&typeof arr[0]==='object')XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(arr),(k+'_'+sk).slice(0,31))})}});XLSX.writeFile(wb,'AIT_Dashboard_Data.xlsx')}function exportPDF(){if(!window.USER_PDF){toast(LANG==='ar'?'ليست لديك صلاحية تحميل PDF':'You do not have PDF export permission');return;}window.print()}// DOMContentLoaded is handled by index.html boot script
// shared.js only provides the functionswindow.addEventListener('error',e=>{console.error(e.error||e.message);toast(LANG==='ar'?'تم منع توقف الداشبورد بسبب خطأ':'A runtime issue was caught')});


// ── Dynamic page loader ────────────────────────────────────────
window.AIT = window.AIT || {};

window.AIT.loadPage = function(pageKey) {
  return new Promise((resolve, reject) => {
    // Check cache
    if (window.AIT._pageCache && window.AIT._pageCache[pageKey]) {
      resolve(); return;
    }
    const s = document.createElement('script');
    s.src = `pages/${pageKey}.js?v=${Date.now()}`;
    s.onload = () => {
      window.AIT._pageCache = window.AIT._pageCache || {};
      window.AIT._pageCache[pageKey] = true;
      resolve();
    };
    s.onerror = () => reject(new Error('Failed to load page: ' + pageKey));
    document.head.appendChild(s);
  });
};

// Override goPage to lazy-load page scripts
window.goPage = function(p) {
  CURRENT = p;
  history.replaceState(null, '', '#' + p);
  // Update nav active state immediately
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === p);
  });
  // Load page script then render
  window.AIT.loadPage(p)
    .then(() => render())
    .catch(e => { console.error(e); });
};
