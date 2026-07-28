(function(){
'use strict';
const JOBS=['مدير مشروع','مدير الجودة','مدير الصيانة','مدير الموقع','مدير إنتاج','مسؤول الحسابات','مدير تشغيل','مشرف صيانة','فني صيانة','فني تشغيل كسارة','فني لحام','علاقات عامة','غفير','أمن','متابعة إنتاج المعدات وساعات التشغيل','مندوب مشتريات','سائق'];
const RESIDENCES=['الموقع','شقة 1','شقة 2','شقة 3','القصير'];
const ACTIONS=[['','اختر الحالة'],['on_site','ذهاب إلى الموقع'],['work_from_camp','يعمل من السكن'],['leave','إجازة'],['mission','مأمورية'],['camp_no_work','سكن فقط']];
let WDATA={employees:[],vehicles:[],tasks:[],plans:[],vehicle_plans:[],leaves:[],departments:[],route_points:[]};
let workflowLoadedAt=0,workflowRequest=null;
const WORKFLOW_CACHE_MS=60000;
const USER_VEHICLE_MARKER='[AIT_USER_VEHICLE]';
const $=id=>document.getElementById(id), esc=v=>window.MountainCore?MountainCore.esc(v):String(v||'');
function data(){return MountainCore.getData()||{filters:{employees:[]},vehicles:[]}}
async function call(action,payload){return MountainCore.payloadApi(action,payload||{})}
function normalizeWorkflow(source){
  const value=source||{};
  return {
    employees:Array.isArray(value.employees)?value.employees:[],
    vehicles:Array.isArray(value.vehicles)?value.vehicles:[],
    tasks:Array.isArray(value.tasks)?value.tasks:[],
    plans:Array.isArray(value.plans)?value.plans:[],
    vehicle_plans:Array.isArray(value.vehicle_plans)?value.vehicle_plans:[],
    leaves:Array.isArray(value.leaves)?value.leaves:[],
    departments:Array.isArray(value.departments)?value.departments:[],
    route_points:Array.isArray(value.route_points)?value.route_points:splitList(value.settings&&value.settings.vehicle_route_point_options),
    settings:value.settings||{},lastUpdated:value.lastUpdated||''
  };
}
function dashboardWorkflow(){
  const d=data();
  return d&&d.workflow&&Array.isArray(d.workflow.employees)?normalizeWorkflow(d.workflow):null;
}
function hasWorkflow(value){return !!(value&&Array.isArray(value.employees)&&value.employees.length)}
function renderWorkflow(){renderPeople();renderVehicles();renderLeaves();if(window.MountainI18n)window.MountainI18n.apply()}
function showWorkflowLoading(){
  ['w-pane-people','w-pane-vehicles','w-pane-leaves'].forEach(id=>{const el=$(id);if(el)el.innerHTML='<div class="empty">جارٍ تحميل البيانات الحالية...</div>'});
}
function open(initialPane='people',afterLoad){
  const modal=$('inputModal');
  modal.classList.add('workflow-modal','show');
  $('modalTitle').textContent='الإدخال والتشغيل اليومي';
  $('modalActions').innerHTML='<div id="workflowSaveFeedback" class="save-feedback"></div><button class="btn ghost" id="workflowClose">إغلاق</button>';
  $('modalBody').innerHTML='<div class="workflow-shell"><div class="workflow-tabs"><button class="workflow-tab active" data-wtab="people">الأفراد والمهام</button><button class="workflow-tab" data-wtab="vehicles">السيارات المتاحة</button><button class="workflow-tab" data-wtab="leaves">الإجازات</button></div><section class="workflow-pane active" id="w-pane-people"></section><section class="workflow-pane" id="w-pane-vehicles"></section><section class="workflow-pane" id="w-pane-leaves"></section></div>';
  $('workflowClose').onclick=()=>{modal.classList.remove('show','workflow-modal')};
  document.querySelectorAll('[data-wtab]').forEach(b=>b.onclick=()=>switchPane(b.dataset.wtab));
  const snapshot=dashboardWorkflow();
  if(snapshot){WDATA=snapshot;workflowLoadedAt=Date.now();renderWorkflow();switchPane(initialPane);if(typeof afterLoad==='function')afterLoad();return Promise.resolve(WDATA)}
  if(hasWorkflow(WDATA)&&Date.now()-workflowLoadedAt<WORKFLOW_CACHE_MS){renderWorkflow();switchPane(initialPane);if(typeof afterLoad==='function')afterLoad();return Promise.resolve(WDATA)}
  showWorkflowLoading();switchPane(initialPane);
  return loadWorkflow(true).then(()=>{renderWorkflow();switchPane(initialPane);if(typeof afterLoad==='function')afterLoad();return WDATA}).catch(e=>feedback(e.message,false));
}
function switchPane(n){document.querySelectorAll('[data-wtab]').forEach(b=>b.classList.toggle('active',b.dataset.wtab===n));document.querySelectorAll('.workflow-pane').forEach(p=>p.classList.toggle('active',p.id==='w-pane-'+n))}
async function loadWorkflow(force=false){
  const snapshot=!force&&dashboardWorkflow();
  if(snapshot){WDATA=snapshot;workflowLoadedAt=Date.now();return WDATA}
  if(!force&&hasWorkflow(WDATA)&&Date.now()-workflowLoadedAt<WORKFLOW_CACHE_MS)return WDATA;
  if(workflowRequest)return workflowRequest;
  workflowRequest=MountainCore.api('workflowdashboard',{date:MountainCore.today()}).then(result=>{
    WDATA=normalizeWorkflow(result);workflowLoadedAt=Date.now();return WDATA;
  }).catch(error=>{
    const snapshotFallback=dashboardWorkflow();
    if(snapshotFallback){WDATA=snapshotFallback;workflowLoadedAt=Date.now();return WDATA}
    throw error;
  }).finally(()=>{workflowRequest=null});
  return workflowRequest;
}
function currentStatus(e){return String(e.current_status||e.status||'camp_no_work')}
function eligibleEmployees(){return WDATA.employees.filter(e=>!['on_site','leave','sick_leave','mission'].includes(currentStatus(e)))}
function actionOptions(sel){return ACTIONS.map(x=>'<option value="'+x[0]+'" '+(sel===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')}
function renderPeople(){
  const emps=eligibleEmployees();
  const vehicleOptions=registeredVehicles().filter(v=>String(v.vehicle_status||'available')==='available').map(v=>'<option value="'+esc(v.vehicle_id)+'">'+esc(vehicleLabel(v))+'</option>').join('');
  const coverOptions=WDATA.employees.map(e=>'<option value="'+esc(e.employee_id)+'">'+esc(e.employee_name)+'</option>').join('');
  $('w-pane-people').innerHTML=
    '<div class="workflow-topline">'+
      '<div class="field workflow-date"><label>تاريخ الحركة والمهام</label><input class="input" type="date" id="workflowDate" value="'+MountainCore.today()+'"></div>'+
      '<button class="btn primary" id="addWorkflowEmployee">＋ إضافة موظف جديد</button>'+
    '</div>'+
    '<div class="status-legend" aria-label="ألوان الحالات">'+
      '<span class="status-key leave-key"><i></i> الإجازة باللون الأخضر</span>'+
      '<span class="status-key mission-key"><i></i> المأمورية باللون البنفسجي</span>'+
    '</div>'+
    '<div id="blockedTaskBanner"></div>'+
    '<div class="employee-plan-list">'+
      (emps.length?emps.map(e=>
        '<div class="employee-plan-row" data-plan-employee="'+esc(e.employee_id||e.id)+'">'+
          '<div class="person"><b>'+esc(e.employee_name||e.name)+'</b><small>'+esc((e.job_title||'—')+' · '+(e.department||'—')+' · '+(e.current_residence_location||'السكن'))+'</small><span class="plan-status-badge hidden"></span></div>'+
          '<select class="select plan-action" aria-label="اختيار حالة الموظف">'+actionOptions('')+'</select>'+
          '<div class="plan-details">'+
            '<textarea class="textarea plan-task hidden" placeholder="اكتب المهمة المطلوبة بالتفصيل"></textarea>'+
            '<div class="leave-fields hidden">'+
              '<div class="field"><label>تاريخ بداية الإجازة</label><input class="input plan-leave-start" type="date" value="'+MountainCore.today()+'"></div>'+
              '<div class="field"><label>تاريخ العودة</label><input class="input plan-leave-end" type="date" value="'+MountainCore.today()+'"></div>'+
              '<div class="field"><label>البديل أثناء الإجازة</label><select class="select plan-leave-cover"><option value="">اختر البديل</option>'+coverOptions+'</select></div>'+
              '<div class="field"><label>السكن عند العودة</label><select class="select plan-leave-residence">'+RESIDENCES.map(x=>'<option>'+x+'</option>').join('')+'</select></div>'+
            '</div>'+
            '<div class="mission-fields hidden">'+
              '<div class="field"><label>جهة أو مكان المأمورية</label><input class="input plan-mission-destination" placeholder="مثال: القصير، الغردقة، مورد المعدات"></div>'+
              '<div class="field"><label>تاريخ العودة المتوقع</label><input class="input plan-mission-end" type="date" value="'+MountainCore.today()+'"></div>'+
              '<div class="field mission-responsible-field"><label>المسؤول أو الجهة المتابع معها</label><input class="input plan-mission-responsible" placeholder="اختياري"></div>'+
            '</div>'+
          '</div>'+
          '<select class="select plan-vehicle hidden"><option value="">بدون سيارة محددة</option>'+vehicleOptions+'</select>'+
        '</div>'
      ).join(''):'<div class="empty">لا يوجد موظفون متاحون في السكن حاليًا.</div>')+
    '</div>'+
    '<div class="workflow-topline" style="margin-top:16px"><span></span><button class="btn primary" id="savePeoplePlan">حفظ الحركة والحالات في Google Sheets</button></div>';

  document.querySelectorAll('.plan-action').forEach(s=>s.onchange=()=>syncPlanRow(s.closest('.employee-plan-row')));
  document.querySelectorAll('.plan-leave-start').forEach(i=>i.onchange=()=>{
    const row=i.closest('.employee-plan-row'),end=row.querySelector('.plan-leave-end');
    if(!end.value||end.value<i.value)end.value=i.value;
  });
  $('workflowDate').onchange=()=>{
    const selectedDate=$('workflowDate').value;
    document.querySelectorAll('.plan-mission-end').forEach(i=>{if(!i.value||i.value<selectedDate)i.value=selectedDate});
    document.querySelectorAll('.plan-leave-start').forEach(i=>{if(!i.value)i.value=selectedDate});
    document.querySelectorAll('.plan-leave-end').forEach(i=>{const start=i.closest('.employee-plan-row').querySelector('.plan-leave-start').value||selectedDate;if(!i.value||i.value<start)i.value=start});
  };
  $('addWorkflowEmployee').onclick=openEmployeeModal;
  $('savePeoplePlan').onclick=savePeoplePlan;
  showBlocked();
}
function syncPlanRow(row){
  const a=row.querySelector('.plan-action').value;
  const t=row.querySelector('.plan-task'),v=row.querySelector('.plan-vehicle'),m=row.querySelector('.mission-fields'),l=row.querySelector('.leave-fields');
  const select=row.querySelector('.plan-action'),badge=row.querySelector('.plan-status-badge');
  t.classList.toggle('hidden',!['on_site','work_from_camp','mission'].includes(a));
  v.classList.toggle('hidden',!['on_site','mission'].includes(a));
  m.classList.toggle('hidden',a!=='mission');
  l.classList.toggle('hidden',a!=='leave');
  row.classList.remove('status-leave','status-mission');
  select.classList.remove('status-leave','status-mission');
  badge.className='plan-status-badge hidden';
  badge.textContent='';
  if(a==='leave'){
    row.classList.add('status-leave');select.classList.add('status-leave');
    badge.className='plan-status-badge status-leave';badge.textContent='إجازة';
    const start=row.querySelector('.plan-leave-start'),end=row.querySelector('.plan-leave-end'),date=$('workflowDate').value;
    if(!start.value)start.value=date;
    if(!end.value||end.value<start.value)end.value=start.value;
  }else if(a==='mission'){
    row.classList.add('status-mission');select.classList.add('status-mission');
    badge.className='plan-status-badge status-mission';badge.textContent='مأمورية';
    const end=row.querySelector('.plan-mission-end');
    if(!end.value||end.value<$('workflowDate').value)end.value=$('workflowDate').value;
  }
  if(a==='work_from_camp')t.placeholder='اكتب العمل المطلوب منه من السكن';
  else if(a==='mission')t.placeholder='اكتب سبب المأمورية والمطلوب تنفيذه بالتفصيل';
  else t.placeholder='اكتب المطلوب منه عند دخوله الموقع';
}
function showBlocked(){const ids=new Set((WDATA.tasks||[]).filter(t=>String(t.task_status||'open')!=='completed').map(t=>String(t.employee_id)));const banner=$('blockedTaskBanner');const rows=[...document.querySelectorAll('[data-plan-employee]')];let count=0;rows.forEach(r=>{if(ids.has(String(r.dataset.planEmployee))){r.classList.add('ineligible');r.querySelector('.plan-action').disabled=true;count++}});banner.innerHTML=count?'<div class="blocked-banner">يوجد '+count+' موظف لديهم مهام قديمة مفتوحة. لا يمكن إضافة مهام جديدة لهم قبل كتابة ما تم وإغلاق أو تحديث المهمة القديمة.</div>':''}
async function savePeoplePlan(){
  try{
    const date=$('workflowDate').value,records=[],leaveRecords=[];
    document.querySelectorAll('[data-plan-employee]').forEach(r=>{
      const status=r.querySelector('.plan-action').value;
      if(!status||r.classList.contains('ineligible'))return;
      if(status==='leave'){
        const start=r.querySelector('.plan-leave-start').value||date;
        const end=r.querySelector('.plan-leave-end').value;
        if(!start||!end||end<start)throw new Error('حدد تاريخ بداية وعودة صحيحًا للإجازة.');
        leaveRecords.push({
          employee_id:r.dataset.planEmployee,
          leave_type:'annual',
          start_date:start,
          end_date:end,
          return_date:end,
          expected_return_date:end,
          status:'approved',
          reason:'إجازة',
          notes:'تم تسجيل الإجازة من شاشة الإدخال اليومي',
          coverage_employee_id:r.querySelector('.plan-leave-cover').value,
          return_residence:r.querySelector('.plan-leave-residence').value
        });
        return;
      }
      const task=r.querySelector('.plan-task').value.trim();
      if(['on_site','work_from_camp','mission'].includes(status)&&!task)throw new Error('اكتب المهمة أو تفاصيل المأمورية لكل موظف تم اختياره.');
      const destination=r.querySelector('.plan-mission-destination').value.trim(),missionEnd=r.querySelector('.plan-mission-end').value,responsible=r.querySelector('.plan-mission-responsible').value.trim();
      if(status==='mission'&&!destination)throw new Error('اكتب جهة أو مكان المأمورية.');
      if(status==='mission'&&(!missionEnd||missionEnd<date))throw new Error('تاريخ عودة المأمورية يجب أن يساوي تاريخ بدايتها أو يكون بعده.');
      records.push({employee_id:r.dataset.planEmployee,plan_date:date,planned_status:status,task_description:task,vehicle_id:r.querySelector('.plan-vehicle').value,mission_destination:destination,mission_end_date:missionEnd,mission_responsible_person:responsible});
    });
    if(!records.length&&!leaveRecords.length)throw new Error('اختر حالة لموظف واحد على الأقل.');
    MountainCore.showLoader('جارٍ الحفظ في Google Sheets...');
    for(const leave of leaveRecords)await call('saveleave',leave);
    if(records.length)await call('saveworkflowplan',{date,records});
    const parts=[];
    if(leaveRecords.length)parts.push(leaveRecords.length+' إجازة');
    if(records.length)parts.push(records.length+' حركة أو مأمورية');
    feedback('تم حفظ '+parts.join(' و ')+' بنجاح في Google Sheets.',true);
    await loadWorkflow(true);renderPeople();MountainCore.loadData(true);
  }catch(e){feedback(e.message,false)}finally{MountainCore.hideLoader()}
}
function feedback(msg,ok){const el=$('workflowSaveFeedback');if(!el)return;el.textContent=msg;el.className='save-feedback '+(ok?'success':'error')}
function splitList(value){
  if(Array.isArray(value)) return value.map(x=>String(x||'').trim()).filter(Boolean);
  return String(value||'').split(/[|,،]/).map(x=>x.trim()).filter(Boolean);
}
function unique(values){
  const seen=new Set();
  return values.filter(value=>{const key=String(value||'').trim().toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true});
}
function departments(){
  const fallback=['الإدارة','الجودة','الصيانة','الإنتاج','التشغيل','الحسابات','الأمن','المشتريات','العلاقات العامة'];
  const values=[];
  (WDATA.departments||[]).forEach(x=>values.push(...splitList(x)));
  (WDATA.employees||[]).forEach(e=>values.push(...splitList(e.department)));
  return unique(values.length?values:fallback);
}
function defaultMineForNewEmployee(){
  const d=data()||{};
  const candidates=[];
  const add=value=>{
    if(Array.isArray(value))value.forEach(add);
    else if(value&&typeof value==='object')add(value.id||value.value||value.name||value.mine_id||value.mine_name);
    else if(String(value||'').trim())candidates.push(String(value).trim());
  };
  add(d.scope&&d.scope.mines);
  add(d.filters&&d.filters.mines);
  (WDATA.employees||[]).forEach(e=>add(e.mine_id||e.mine_name));
  return unique(candidates)[0]||'المنجم الرئيسي';
}
function upsertLocalEmployee(employee){
  if(!employee||!employee.employee_id)return;
  const row=Object.assign({current_status:'camp_no_work',status:'camp_no_work'},employee);
  if(!row.current_residence_location)row.current_residence_location='السكن';
  const index=(WDATA.employees||[]).findIndex(e=>String(e.employee_id)===String(row.employee_id));
  if(index>=0)WDATA.employees[index]=Object.assign({},WDATA.employees[index],row);
  else WDATA.employees=[row].concat(WDATA.employees||[]);
  WDATA.departments=unique((WDATA.departments||[]).concat(splitList(row.department)));
}

function normalizeRoutePoint(value){
  const text=String(value||'').trim();
  const aliases={
    'شقة رقم 1':'شقة 1','شقة رقم 2':'شقة 2','شقة رقم 3':'شقة 3',
    'نقطة تجميع':'نقطة تجميع القصير','نقطة تجمع':'نقطة تجميع القصير','نقطة تجمع القصير':'نقطة تجميع القصير'
  };
  return aliases[text]||text;
}
function routePoints(){
  const defaults=['شقة 1','شقة 2','شقة 3','نقطة تجميع القصير','بداية دخول الجبل'];
  const source=(WDATA.route_points&&WDATA.route_points.length)?WDATA.route_points:defaults;
  return unique(source.map(normalizeRoutePoint).concat(defaults));
}
function isUserRegisteredVehicle(v){
  return String((v&&v.notes)||'').includes(USER_VEHICLE_MARKER) || v.user_registered===true || String(v.user_registered||'').toLowerCase()==='true';
}
function registeredVehicles(){
  return (WDATA.vehicles||[]).filter(v=>{
    const active=v.active===undefined||v.active===true||String(v.active).toLowerCase()==='true'||String(v.active)==='1';
    const hasRegisteredNumber=!!String(v.plate_number||'').trim();
    return active&&hasRegisteredNumber&&isUserRegisteredVehicle(v)&&String(v.vehicle_status||'available').toLowerCase()!=='inactive';
  });
}
function vehicleLabel(v){
  return unique([v.vehicle_name,v.vehicle_type||v.vehicle_brand,v.plate_number].map(x=>String(x||'').trim())).join(' — ')||String(v.vehicle_id||'سيارة');
}
function vehiclePlateKey(v){
  return String((v&&v.plate_number)||'').trim().toLowerCase().replace(/[\s\-_/\\.]+/g,'');
}
function vehicleDuplicateCount(v){
  const key=vehiclePlateKey(v);
  if(!key)return 1;
  return registeredVehicles().filter(x=>vehiclePlateKey(x)===key).length;
}
function driverEmployees(){
  return (WDATA.employees||[]).filter(e=>{
    const active=e.active===undefined||e.active===true||String(e.active).toLowerCase()==='true'||String(e.active)==='1';
    const driver=e.is_driver===true||String(e.is_driver).toLowerCase()==='true'||String(e.is_driver)==='1'||/سائق/.test(String(e.job_title||''));
    return active&&driver;
  });
}
function routeOptionMarkup(selected){
  return '<option value="">اختر نقطة المسار</option>'+routePoints().map(point=>'<option value="'+esc(point)+'" '+(String(selected||'')===point?'selected':'')+'>'+esc(point)+'</option>').join('');
}
function routeBuilderMarkup(values){
  const initial=splitList(values).map(normalizeRoutePoint);
  return '<div class="ordered-route-builder" data-route-builder><div class="route-step-list"></div><button class="btn ghost add-route-step" type="button">＋ إضافة نقطة للمسار</button></div><script type="application/json" class="route-initial-values">'+JSON.stringify(initial.length?initial:['']).replace(/</g,'\\u003c')+'</script>';
}
function addRouteStep(builder,value){
  const list=builder.querySelector('.route-step-list');
  const row=document.createElement('div');
  row.className='route-step-row';
  row.innerHTML='<span class="route-step-number"></span><select class="select route-step-select">'+routeOptionMarkup(value)+'</select><button class="route-step-remove" type="button" title="حذف النقطة">✕</button>';
  row.querySelector('.route-step-remove').onclick=()=>{row.remove();if(!list.children.length)addRouteStep(builder,'');renumberRouteSteps(builder)};
  list.appendChild(row);
  renumberRouteSteps(builder);
}
function renumberRouteSteps(builder){
  builder.querySelectorAll('.route-step-row').forEach((row,index)=>{row.querySelector('.route-step-number').textContent=String(index+1)});
}
function bindRouteBuilder(builder){
  if(!builder||builder.dataset.bound==='true')return;
  builder.dataset.bound='true';
  let initial=[''];
  const script=builder.nextElementSibling&&builder.nextElementSibling.classList.contains('route-initial-values')?builder.nextElementSibling:null;
  if(script){try{initial=JSON.parse(script.textContent||'[]')}catch(e){initial=['']}script.remove()}
  (initial.length?initial:['']).forEach(value=>addRouteStep(builder,value));
  builder.querySelector('.add-route-step').onclick=()=>addRouteStep(builder,'');
}
function bindAllRouteBuilders(root){
  (root||document).querySelectorAll('[data-route-builder]').forEach(bindRouteBuilder);
}
function getRouteValues(builder){
  return [...builder.querySelectorAll('.route-step-select')].map(select=>select.value.trim()).filter(Boolean);
}
function refreshRouteBuilder(builder){
  if(!builder)return;
  const values=getRouteValues(builder);
  builder.querySelectorAll('.route-step-select').forEach((select,index)=>{select.innerHTML=routeOptionMarkup(values[index]||'')});
}
function openEmployeeModal(){
  const cars=registeredVehicles();
  const layer=document.createElement('div');
  layer.className='mini-modal-layer';
  layer.innerHTML=
    '<div class="mini-modal-card employee-modal-card">'+
      '<div class="mini-modal-head"><div><h3>إضافة موظف جديد</h3><p>سجّل البيانات الأساسية وصلاحيات القيادة.</p></div><button class="btn ghost" data-close>✕</button></div>'+
      '<div class="inline-fields">'+
        '<div class="field"><label>اسم الموظف</label><input class="input" id="newEmpName" autocomplete="name" placeholder="الاسم بالكامل"></div>'+
        '<div class="field"><label>رقم التليفون</label><input class="input" id="newEmpPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01xxxxxxxxx"></div>'+
        '<div class="field"><label>الوظيفة</label><select class="select" id="newEmpJob">'+JOBS.map(x=>'<option>'+x+'</option>').join('')+'</select></div>'+
        '<div class="field"><label>مكان السكن</label><select class="select" id="newEmpResidence">'+RESIDENCES.map(x=>'<option>'+x+'</option>').join('')+'</select></div>'+
        '<div class="field hidden" id="newEmpDailyExpenseWrap"><label>المصروف اليومي في الشقة (جنيه)</label><input class="input" id="newEmpDailyExpense" type="number" min="0" step="0.01" inputmode="decimal" placeholder="مثال: 150"></div>'+
        '<div class="field"><label>هل يمكنه قيادة سيارة؟</label><select class="select" id="newEmpDriver"><option value="false">لا</option><option value="true">نعم</option></select></div>'+
      '</div>'+
      '<div class="field department-selection">'+
        '<div class="selection-heading"><label>الأقسام المتاحة للموظف</label><label class="select-all-row"><input type="checkbox" id="selectAllDepartments"> اختيار كل الأقسام</label></div>'+
        '<div class="multi-checks" id="departmentChecks">'+departments().map(x=>'<label><input type="checkbox" data-new-dept value="'+esc(x)+'"> '+esc(x)+'</label>').join('')+'</div>'+
      '</div>'+
      '<div class="field hidden" id="newEmpVehiclesWrap">'+
        '<label>السيارات المسجلة المتاحة له للقيادة</label>'+
        (cars.length?'<div class="multi-checks">'+cars.map(v=>'<label><input type="checkbox" data-new-car value="'+esc(v.vehicle_id)+'"> <span>'+esc(vehicleLabel(v))+'</span></label>').join('')+'</div>':'<div class="empty-inline">لا توجد سيارات مسجلة حاليًا. أضف السيارة أولًا من تبويب السيارات.</div>')+
      '</div>'+
      '<div class="workflow-topline modal-save-row"><span id="employeeModalFeedback" class="save-feedback"></span><button class="btn primary" id="saveNewEmployee">حفظ الموظف</button></div>'+
    '</div>';
  document.body.appendChild(layer);
  layer.querySelector('[data-close]').onclick=()=>layer.remove();
  const apartmentSelected=()=>/^شقة\s*[123]$/.test(String($('newEmpResidence').value||'').replace(/رقم/g,'').replace(/\s+/g,' ').trim());
  const syncDailyExpense=()=>{$('newEmpDailyExpenseWrap').classList.toggle('hidden',!apartmentSelected());if(!apartmentSelected())$('newEmpDailyExpense').value=''};
  const syncDriverCars=()=>{$('newEmpVehiclesWrap').classList.toggle('hidden',$('newEmpDriver').value!=='true')};
  const deptBoxes=()=>[...layer.querySelectorAll('[data-new-dept]')];
  $('selectAllDepartments').onchange=()=>deptBoxes().forEach(box=>box.checked=$('selectAllDepartments').checked);
  deptBoxes().forEach(box=>box.onchange=()=>{const boxes=deptBoxes(),checked=boxes.filter(x=>x.checked).length;$('selectAllDepartments').checked=checked===boxes.length;$('selectAllDepartments').indeterminate=checked>0&&checked<boxes.length});
  $('newEmpResidence').onchange=syncDailyExpense;
  $('newEmpDriver').onchange=syncDriverCars;
  syncDailyExpense();syncDriverCars();
  $('saveNewEmployee').onclick=async()=>{
    const feedbackEl=$('employeeModalFeedback'),saveButton=$('saveNewEmployee');
    try{
      const name=$('newEmpName').value.trim(),phone=$('newEmpPhone').value.trim();
      const deps=deptBoxes().filter(x=>x.checked).map(x=>x.value);
      if(!name)throw new Error('اكتب اسم الموظف.');
      if(!phone)throw new Error('اكتب رقم تليفون الموظف.');
      if(!deps.length)throw new Error('اختر قسمًا واحدًا على الأقل أو اضغط اختيار كل الأقسام.');
      if(apartmentSelected()&&$('newEmpDailyExpense').value==='')throw new Error('اكتب المصروف اليومي للموظف في الشقة.');
      const canDrive=$('newEmpDriver').value==='true';
      const selectedCarIds=canDrive?[...layer.querySelectorAll('[data-new-car]:checked')].map(x=>x.value):[];
      const selectedCarNames=cars.filter(v=>selectedCarIds.includes(String(v.vehicle_id))).map(vehicleLabel);
      const mineId=defaultMineForNewEmployee();
      const payload={
        employee_name:name,phone:phone,job_title:$('newEmpJob').value,department:deps.join(' | '),mine_id:mineId,mine_name:mineId,mine_ids:mineId,
        current_residence_location:$('newEmpResidence').value,daily_residence_expense:apartmentSelected()?Number($('newEmpDailyExpense').value||0):0,daily_expense_currency:'EGP',
        expense_rate:apartmentSelected()?{camp_daily_rate:Number($('newEmpDailyExpense').value||0),currency:'EGP',effective_from:(window.MountainCore&&MountainCore.today?MountainCore.today():new Date().toISOString().slice(0,10)),notes:'Daily apartment expense set during employee creation'}:{},
        is_driver:canDrive,drives_vehicle_ids:selectedCarIds.join('|'),drives_vehicle_names:selectedCarNames.join('|'),active:true
      };
      feedbackEl.textContent='جارٍ حفظ الموظف...';feedbackEl.className='save-feedback';
      saveButton.disabled=true;
      const result=await call('saveemployee',payload);
      const savedEmployee=Object.assign({},payload,(result&&result.employee)||{}, {current_status:'camp_no_work',status:'camp_no_work'});
      upsertLocalEmployee(savedEmployee);
      layer.remove();
      renderPeople();
      feedback('تم حفظ الموظف بنجاح، وظهر الآن ضمن الموظفين المتاحين في السكن.',true);
      Promise.allSettled([MountainCore.loadData(true),loadWorkflow(true)]).then(()=>{
        if(!(WDATA.employees||[]).some(e=>String(e.employee_id)===String(savedEmployee.employee_id)))upsertLocalEmployee(savedEmployee);
        if($('w-pane-people'))renderPeople();
      });
    }catch(e){feedbackEl.textContent=e.message;feedbackEl.className='save-feedback error';if(saveButton)saveButton.disabled=false}
  };
}
function renderVehicles(){
  const pane=$('w-pane-vehicles'),vehicles=registeredVehicles();
  pane.innerHTML=
    '<div class="workflow-topline">'+
      '<div><h3>السيارات المتاحة وخطوط السير</h3><p>كل خطوة في المسار قائمة مستقلة، وترتيبها هو نفس ترتيب مرور السيارة.</p></div>'+
      '<div class="vehicle-toolbar"><div class="field workflow-date"><label>تاريخ خطة السيارات</label><input class="input" type="date" id="vehiclePlanDate" value="'+MountainCore.today()+'"></div><button class="btn ghost" id="manageRoutePoints">⚙ إدارة نقاط التجمع</button><button class="btn primary" id="addVehicleWorkflow">＋ إضافة سيارة جديدة</button></div>'+
    '</div>'+
    '<div class="route-source-note">مصدر جميع قوائم نقاط التجمع واحد. أضف أو عدّل النقاط من زر <b>إدارة نقاط التجمع</b>. يمكنك حذف أي سجل سيارة مكرر مباشرة من زر الحذف الأحمر.</div>'+
    '<div class="vehicle-workflow-grid">'+(vehicles.length?vehicles.map(v=>vehicleCard(v)).join(''):'<div class="empty">لا توجد سيارات مسجلة.</div>')+'</div>';
  $('addVehicleWorkflow').onclick=()=>openVehicleModal();
  $('manageRoutePoints').onclick=()=>openRoutePointsModal(()=>renderVehicles());
  bindAllRouteBuilders(pane);
  document.querySelectorAll('[data-save-vehicle-plan]').forEach(b=>b.onclick=()=>saveVehiclePlan(b.dataset.saveVehiclePlan));
  document.querySelectorAll('[data-edit-vehicle-workflow]').forEach(b=>b.onclick=()=>openVehicleModal(b.dataset.editVehicleWorkflow));
  document.querySelectorAll('[data-delete-vehicle-workflow]').forEach(b=>b.onclick=()=>deleteVehicleRecord(b.dataset.deleteVehicleWorkflow,b));
}
function planForVehicle(v){
  const date=$('vehiclePlanDate')?$('vehiclePlanDate').value:MountainCore.today();
  return (WDATA.vehicle_plans||WDATA.plans||[]).find(p=>String(p.vehicle_id)===String(v.vehicle_id)&&String(p.plan_date||'')===date)||{};
}
function driverOptionsForVehicle(v,selected){
  const allowed=splitList(v.allowed_driver_ids);
  let drivers=driverEmployees();
  if(allowed.length)drivers=drivers.filter(e=>allowed.includes(String(e.employee_id)));
  return '<option value="">اختر السائق</option>'+drivers.map(e=>'<option value="'+esc(e.employee_id)+'" '+(String(selected||'')===String(e.employee_id)?'selected':'')+'>'+esc(e.employee_name)+'</option>').join('');
}
function vehicleCard(v){
  const plan=planForVehicle(v),selectedDriver=plan.driver_id||v.current_driver_id||'';
  const route=plan.route_points||v.route_points||'';
  const available=plan.available===undefined?String(v.vehicle_status||'available')==='available':(plan.available===true||String(plan.available).toLowerCase()==='true');
  const duplicateCount=vehicleDuplicateCount(v),duplicateBadge=duplicateCount>1?'<span class="duplicate-vehicle-badge">مكررة '+duplicateCount+' مرات</span>':'';
  return '<div class="vehicle-workflow-card" data-vehicle-card="'+esc(v.vehicle_id)+'">'+
    '<div class="workflow-topline"><div><div class="vehicle-title-line"><b>'+esc(vehicleLabel(v))+'</b>'+duplicateBadge+'</div><div>السائقون المسموح لهم: '+esc(v.allowed_driver_names||'غير محدد')+'</div><small class="vehicle-record-id">رقم السجل: '+esc(v.vehicle_id||'—')+'</small></div><label class="availability-toggle"><input type="checkbox" class="vehicle-available" '+(available?'checked':'')+'> متاحة اليوم</label></div>'+
    '<div class="field"><label>السائق</label><select class="select vehicle-driver">'+driverOptionsForVehicle(v,selectedDriver)+'</select></div>'+
    '<div class="field"><label>خط السير بالترتيب</label>'+routeBuilderMarkup(route)+'</div>'+
    '<div class="workflow-topline vehicle-card-actions"><button class="btn danger" data-delete-vehicle-workflow="'+esc(v.vehicle_id)+'">حذف السيارة</button><div class="vehicle-card-main-actions"><button class="btn ghost" data-edit-vehicle-workflow="'+esc(v.vehicle_id)+'">تعديل بيانات السيارة</button><button class="btn primary" data-save-vehicle-plan="'+esc(v.vehicle_id)+'">حفظ الإتاحة والمسار</button></div></div>'+
  '</div>';
}
async function saveVehiclePlan(id){
  try{
    const c=document.querySelector('[data-vehicle-card="'+CSS.escape(id)+'"]');
    const route=getRouteValues(c.querySelector('[data-route-builder]'));
    await call('savevehicleplan',{plan_date:$('vehiclePlanDate')?$('vehiclePlanDate').value:MountainCore.today(),vehicle_id:id,available:c.querySelector('.vehicle-available').checked,driver_id:c.querySelector('.vehicle-driver').value,route_points:route.join('|')});
    feedback('تم حفظ حالة السيارة وخط السير بالترتيب.',true)
  }catch(e){feedback(e.message,false)}
}
async function deleteVehicleRecord(id,button){
  const v=(WDATA.vehicles||[]).find(x=>String(x.vehicle_id)===String(id));
  if(!v)return feedback('تعذر العثور على سجل السيارة.',false);
  const label=vehicleLabel(v),duplicateCount=vehicleDuplicateCount(v);
  const message='هل تريد حذف «'+label+'» من السيارات الظاهرة؟'+(duplicateCount>1?'\nهذه السيارة مكررة '+duplicateCount+' مرات، وسيتم حذف هذا السجل فقط.':'')+'\nلن تظهر السيارة في القوائم الحالية، مع الاحتفاظ بالسجلات القديمة.';
  if(!window.confirm(message))return;
  try{
    if(button){button.disabled=true;button.textContent='جارٍ الحذف...'}
    await call('deletevehicle',{vehicle_id:id});
    feedback('تم حذف سجل السيارة من القائمة الحالية بنجاح.',true);
    await loadWorkflow(true);renderVehicles();
    MountainCore.loadData(true);
  }catch(e){feedback(e.message||'تعذر حذف السيارة.',false);if(button){button.disabled=false;button.textContent='حذف السيارة'}}
}
function openVehicleModal(id){
  const v=registeredVehicles().find(x=>String(x.vehicle_id)===String(id))||{};
  const allowedIds=splitList(v.allowed_driver_ids);
  const drivers=driverEmployees();
  const layer=document.createElement('div');
  layer.className='mini-modal-layer';
  layer.innerHTML=
    '<div class="mini-modal-card vehicle-modal-card">'+
      '<div class="mini-modal-head"><div><h3>'+(id?'تعديل سيارة':'إضافة سيارة جديدة')+'</h3><p>حدد بيانات السيارة والسائقين وخط السير خطوة بخطوة.</p></div><button class="btn ghost" data-close>✕</button></div>'+
      '<div class="inline-fields">'+
        '<div class="field"><label>نوع السيارة</label><input class="input" id="wvType" value="'+esc(v.vehicle_type||v.vehicle_brand||'')+'" placeholder="مثال: تويوتا هايس"></div>'+
        '<div class="field"><label>رقم السيارة</label><input class="input" id="wvPlate" value="'+esc(v.plate_number||'')+'" placeholder="رقم اللوحة"></div>'+
        '<div class="field"><label>اسم السيارة</label><input class="input" id="wvName" value="'+esc(v.vehicle_name||'')+'" placeholder="اسم مختصر يظهر في النظام"></div>'+
        '<div class="field"><label>عدد الركاب المسموح</label><input class="input" id="wvCapacity" type="number" min="1" value="'+esc(v.capacity_passengers||4)+'"></div>'+
      '</div>'+
      '<div class="field"><div class="selection-heading"><label>النقاط بالترتيب</label><button class="btn ghost compact" type="button" id="managePointsFromVehicle">⚙ إدارة النقاط</button></div>'+routeBuilderMarkup(v.route_points||'')+'</div>'+
      '<div class="field"><label>السائقون المسموح لهم بقيادتها</label>'+
        (drivers.length?'<div class="multi-checks">'+drivers.map(e=>'<label><input type="checkbox" data-wv-driver value="'+esc(e.employee_id)+'" '+(allowedIds.includes(String(e.employee_id))?'checked':'')+'> '+esc(e.employee_name)+'</label>').join('')+'</div>':'<div class="empty-inline">لا يوجد موظفون مسجلون بصلاحية قيادة. فعّل القيادة للموظف أولًا.</div>')+
      '</div>'+
      '<div class="workflow-topline modal-save-row"><span id="vehicleModalFeedback" class="save-feedback"></span><div class="vehicle-modal-actions">'+(id?'<button class="btn danger" id="deleteWorkflowVehicle">حذف السيارة</button>':'')+'<button class="btn primary" id="saveWorkflowVehicle">حفظ السيارة</button></div></div>'+
    '</div>';
  document.body.appendChild(layer);
  layer.querySelector('[data-close]').onclick=()=>layer.remove();
  const builder=layer.querySelector('[data-route-builder]');bindRouteBuilder(builder);
  $('managePointsFromVehicle').onclick=()=>openRoutePointsModal(()=>refreshRouteBuilder(builder));
  if(id&&$('deleteWorkflowVehicle'))$('deleteWorkflowVehicle').onclick=()=>deleteVehicleRecord(id,$('deleteWorkflowVehicle')).then(()=>{if(!registeredVehicles().some(x=>String(x.vehicle_id)===String(id)))layer.remove()});
  $('saveWorkflowVehicle').onclick=async()=>{
    const feedbackEl=$('vehicleModalFeedback');
    try{
      const type=$('wvType').value.trim(),plate=$('wvPlate').value.trim(),name=$('wvName').value.trim();
      if(!type)throw new Error('اكتب نوع السيارة.');
      if(!plate)throw new Error('اكتب رقم السيارة.');
      const plateKey=vehiclePlateKey({plate_number:plate});
      const duplicate=registeredVehicles().find(x=>String(x.vehicle_id)!==String(id||'')&&vehiclePlateKey(x)===plateKey);
      if(duplicate)throw new Error('رقم السيارة مسجل بالفعل باسم «'+vehicleLabel(duplicate)+'». احذف السجل المكرر أو عدّل السجل الحالي بدل إنشاء نسخة جديدة.');
      const route=getRouteValues(builder);
      if(!route.length)throw new Error('اختر نقطة واحدة على الأقل في خط السير.');
      const selectedDrivers=[...layer.querySelectorAll('[data-wv-driver]:checked')].map(x=>x.value);
      const selectedNames=drivers.filter(e=>selectedDrivers.includes(String(e.employee_id))).map(e=>e.employee_name);
      feedbackEl.textContent='جارٍ حفظ السيارة...';feedbackEl.className='save-feedback';
      const result=await call('savevehicle',{vehicle_id:id||'',vehicle_type:type,vehicle_brand:type,plate_number:plate,vehicle_name:name||type+' '+plate,allowed_driver_ids:selectedDrivers.join('|'),allowed_driver_names:selectedNames.join('|'),route_points:route.join('|'),vehicle_status:'available',active:true,capacity_passengers:Number($('wvCapacity').value||4),notes:USER_VEHICLE_MARKER});
      if(result&&result.vehicle){
        const index=(WDATA.vehicles||[]).findIndex(x=>String(x.vehicle_id)===String(result.vehicle.vehicle_id));
        if(index>=0)WDATA.vehicles[index]=result.vehicle;else WDATA.vehicles=[result.vehicle].concat(WDATA.vehicles||[]);
      }
      feedbackEl.textContent='تم حفظ السيارة وخط السير بنجاح.';feedbackEl.className='save-feedback success';
      renderVehicles();setTimeout(()=>layer.remove(),350);
      Promise.allSettled([loadWorkflow(true),MountainCore.loadData(true)]).then(()=>{if($('w-pane-vehicles'))renderVehicles()})
    }catch(e){feedbackEl.textContent=e.message;feedbackEl.className='save-feedback error'}
  };
}
function openRoutePointsModal(onSaved){
  const layer=document.createElement('div');
  layer.className='mini-modal-layer route-points-layer';
  layer.innerHTML=
    '<div class="mini-modal-card route-points-card">'+
      '<div class="mini-modal-head"><div><h3>إدارة نقاط التجمع والمسار</h3><p>أي نقطة تضيفها هنا ستظهر تلقائيًا في جميع قوائم مسارات السيارات.</p></div><button class="btn ghost" data-close>✕</button></div>'+
      '<div id="routePointEditor" class="route-point-editor"></div>'+
      '<button class="btn ghost" id="addMasterRoutePoint" type="button">＋ إضافة نقطة جديدة</button>'+
      '<div class="workflow-topline modal-save-row"><span id="routePointsFeedback" class="save-feedback"></span><button class="btn primary" id="saveMasterRoutePoints">حفظ قائمة النقاط</button></div>'+
    '</div>';
  document.body.appendChild(layer);
  layer.querySelector('[data-close]').onclick=()=>layer.remove();
  const editor=$('routePointEditor');
  const addInput=value=>{
    const row=document.createElement('div');row.className='route-point-editor-row';
    row.innerHTML='<span class="route-point-order"></span><input class="input route-point-name" value="'+esc(value||'')+'" placeholder="اسم نقطة التجمع"><button class="route-step-remove" type="button">✕</button>';
    row.querySelector('.route-step-remove').onclick=()=>{row.remove();numberRows();if(!editor.children.length)addInput('')};editor.appendChild(row);numberRows();
  };
  const numberRows=()=>[...editor.children].forEach((row,index)=>row.querySelector('.route-point-order').textContent=String(index+1));
  routePoints().forEach(addInput);
  $('addMasterRoutePoint').onclick=()=>{addInput('');editor.lastElementChild.querySelector('input').focus()};
  $('saveMasterRoutePoints').onclick=async()=>{
    const feedbackEl=$('routePointsFeedback');
    try{
      const points=unique([...editor.querySelectorAll('.route-point-name')].map(i=>normalizeRoutePoint(i.value)).filter(Boolean));
      if(!points.length)throw new Error('أضف نقطة واحدة على الأقل.');
      feedbackEl.textContent='جارٍ حفظ النقاط...';feedbackEl.className='save-feedback';
      await call('savelookupoptions',{kind:'route_point',options:points});
      WDATA.route_points=points;
      feedbackEl.textContent='تم حفظ النقاط وستظهر في جميع القوائم.';feedbackEl.className='save-feedback success';
      if(typeof onSaved==='function')onSaved(points);
      setTimeout(()=>layer.remove(),650)
    }catch(e){feedbackEl.textContent=e.message;feedbackEl.className='save-feedback error'}
  };
}

function renderLeaves(){const emps=WDATA.employees.slice().sort((a,b)=>String(a.department||'').localeCompare(String(b.department||''),'ar'));$('w-pane-leaves').innerHTML='<div class="workflow-topline"><div><h3>إدارة الإجازات والعودة</h3><p>الموظفون مرتبون حسب الأقسام، ويمكن تحديد البديل وتأكيد العودة والسكن.</p></div></div><div class="leave-workflow-list">'+emps.map(e=>{const leave=(WDATA.leaves||[]).find(l=>String(l.employee_id)===String(e.employee_id)&&!l.actual_return_date);const days=e.current_cycle_start?Math.max(0,Math.floor((new Date()-new Date(e.current_cycle_start))/86400000)):0;return '<div class="leave-person-card" data-leave-emp="'+esc(e.employee_id)+'"><div class="workflow-topline"><div><b>'+esc(e.employee_name)+'</b><div>'+esc(e.department||'—')+' · '+esc(e.job_title||'—')+'</div></div><span>'+(leave?'إجازة من '+esc(leave.start_date)+' إلى '+esc(leave.end_date):'في العمل منذ '+days+' يوم')+'</span></div><div class="inline-fields">'+(leave?'<div class="field"><label>تعديل تاريخ العودة</label><input class="input leave-return" type="date" value="'+esc(leave.return_date||leave.expected_return_date||leave.end_date)+'"></div><div class="field"><label>تأكيد الحضور</label><button class="btn primary confirm-return" data-leave-id="'+esc(leave.leave_id)+'">تأكيد العودة</button></div>':'<div class="field"><label>تاريخ الذهاب</label><input class="input leave-start" type="date"></div><div class="field"><label>تاريخ العودة</label><input class="input leave-end" type="date"></div><div class="field"><label>البديل أثناء الإجازة</label><select class="select leave-cover"><option value="">اختر البديل</option>'+WDATA.employees.filter(x=>x.employee_id!==e.employee_id).map(x=>'<option value="'+esc(x.employee_id)+'">'+esc(x.employee_name)+'</option>').join('')+'</select></div><div class="field"><label>مكان السكن عند العودة</label><select class="select leave-residence">'+RESIDENCES.map(x=>'<option>'+x+'</option>').join('')+'</select></div><button class="btn primary save-leave">إضافة الإجازة</button>')+'</div></div>'}).join('')+'</div>';document.querySelectorAll('.save-leave').forEach(b=>b.onclick=()=>saveLeave(b.closest('[data-leave-emp]')));document.querySelectorAll('.confirm-return').forEach(b=>b.onclick=()=>confirmReturn(b))}
async function saveLeave(card){try{const emp=card.dataset.leaveEmp,start=card.querySelector('.leave-start').value,end=card.querySelector('.leave-end').value;if(!start||!end)throw new Error('حدد تاريخ الذهاب والعودة.');await call('saveleave',{employee_id:emp,leave_type:'rotation_leave',start_date:start,end_date:end,return_date:end,status:'approved',reason:'إجازة دورية',coverage_employee_id:card.querySelector('.leave-cover').value,return_residence:card.querySelector('.leave-residence').value});feedback('تم حفظ الإجازة والبديل.',true);await loadWorkflow(true);renderLeaves()}catch(e){feedback(e.message,false)}}
async function confirmReturn(btn){try{const card=btn.closest('[data-leave-emp]');await call('confirmleavereturn',{leave_id:btn.dataset.leaveId,employee_id:card.dataset.leaveEmp,actual_return_date:card.querySelector('.leave-return').value||MountainCore.today()});feedback('تم تأكيد عودة الموظف وظهوره في صفحة المهام.',true);await loadWorkflow(true);renderLeaves()}catch(e){feedback(e.message,false)}}
async function loadTasks(){const snapshot=dashboardWorkflow();if(snapshot){WDATA=snapshot;renderTaskPage()}try{await loadWorkflow(!snapshot);renderTaskPage()}catch(e){if(!snapshot&&$('openTasksBody'))$('openTasksBody').innerHTML='<tr><td colspan="8" class="empty">'+esc(e.message)+'</td></tr>'}}
function renderTaskPage(){if(!$('openTasksBody'))return;const deps=[...new Set((WDATA.tasks||[]).map(t=>t.department).filter(Boolean))];$('taskDepartmentFilter').innerHTML='<option value="">كل الأقسام</option>'+deps.map(x=>'<option>'+esc(x)+'</option>').join('');const render=()=>{const dep=$('taskDepartmentFilter').value,rows=(WDATA.tasks||[]).filter(t=>!dep||t.department===dep).filter(t=>String(t.task_status||'open')!=='completed');$('openTaskCount').textContent=rows.length+' مهمة مفتوحة';$('openTasksBody').innerHTML=rows.length?rows.map(t=>'<tr data-task="'+esc(t.task_id)+'"><td>'+esc(t.plan_date)+'</td><td><b>'+esc(t.employee_name)+'</b></td><td>'+esc(t.department)+'</td><td>'+esc(t.task_description)+'</td><td><textarea class="textarea task-progress" placeholder="اكتب ما تم عمله">'+esc(t.progress_notes||'')+'</textarea></td><td><select class="select task-status-select"><option value="completed">تم بالكامل</option><option value="blocked">متوقفة على شيء</option><option value="in_progress">تم جزء منها ومستمر</option></select></td><td><textarea class="textarea task-blocker" placeholder="سبب التوقف أو المطلوب لاستكمالها"></textarea></td><td><button class="btn primary save-task-close">حفظ</button></td></tr>').join(''):'<tr><td colspan="8" class="empty">لا توجد مهام مفتوحة.</td></tr>';document.querySelectorAll('.save-task-close').forEach(b=>b.onclick=()=>closeTaskRow(b.closest('tr')))};$('taskDepartmentFilter').onchange=render;render();$('copyEntryPlan').onclick=()=>copyText((WDATA.tasks||[]).map(t=>t.employee_name+' — '+t.task_description).join('\n'),'تم نسخ بلان الدخول');$('copyExitReport').onclick=()=>copyText((WDATA.tasks||[]).map(t=>t.employee_name+' — '+(t.progress_notes||'لم يتم تحديثها')+' — '+(t.blocker_details||'')).join('\n'),'تم نسخ تقرير الخروج')}
async function closeTaskRow(row){try{const progress=row.querySelector('.task-progress').value.trim(),status=row.querySelector('.task-status-select').value,blocker=row.querySelector('.task-blocker').value.trim();if(!progress)throw new Error('يجب كتابة ما تم عمله.');if(status==='blocked'&&!blocker)throw new Error('اكتب سبب توقف المهمة وما المطلوب لاستكمالها.');await call('closetask',{task_id:row.dataset.task,progress_notes:progress,task_status:status,blocker_details:blocker});MountainCore.toast('تم تحديث المهمة في Google Sheets.');await loadTasks()}catch(e){MountainCore.toast(e.message,true)}}
function copyText(text,msg){navigator.clipboard.writeText(text||'').then(()=>MountainCore.toast(msg)).catch(()=>MountainCore.toast('تعذر النسخ',true))}
function openQuick(op){const perm=MountainCore.perm,allowed=(op==='site_entry'&&(perm('manage_employees')||perm('record_team')))||(op==='leave'&&perm('manage_leaves'))||(op==='employee'&&perm('manage_employees'))||(op==='company_vehicle'&&perm('manage_vehicles'));if(!allowed){MountainCore.toast('لا توجد صلاحية لفتح هذا الإجراء.',true);return}if(op==='site_entry')return open('people');if(op==='leave')return open('leaves');if(op==='employee')return open('people',openEmployeeModal);if(op==='company_vehicle')return open('vehicles',()=>openVehicleModal())}
function bind(){const btn=$('inputBtn');if(btn)btn.onclick=()=>open('people');document.querySelectorAll('[data-quick-op]').forEach(b=>b.onclick=()=>openQuick(b.dataset.quickOp));document.querySelectorAll('.tab-btn').forEach(b=>{if(b.dataset.tab==='tasks')b.addEventListener('click',loadTasks)})}
window.MountainWorkflow={open:open,openQuick:openQuick};
document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,700));
})();