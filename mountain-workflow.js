(function(){
'use strict';
const JOBS=['مدير مشروع','مدير الجودة','مدير الصيانة','مدير الموقع','مدير إنتاج','مسؤول الحسابات','مدير تشغيل','مشرف صيانة','فني صيانة','فني تشغيل كسارة','فني لحام','علاقات عامة','غفير','أمن','متابعة إنتاج المعدات وساعات التشغيل','مندوب مشتريات','سائق'];
const RESIDENCES=['الموقع','شقة 1','شقة 2','شقة 3','القصير'];
const ACTIONS=[['','اختر الحالة'],['on_site','ذهاب إلى الموقع'],['work_from_camp','يعمل من السكن'],['rotation_leave','إجازة دورية'],['annual','إجازة سنوية'],['mission','مأمورية'],['rest','راحة'],['absent','غياب'],['sick_leave','إجازة مرضية'],['camp_no_work','سكن فقط']];
const LEAVE_ACTIONS=['rotation_leave','annual','rest','absent','sick_leave'];
const ABSENCE_META={rotation_leave:{status:'leave',label:'إجازة دورية',css:'rotation'},annual:{status:'leave',label:'إجازة سنوية',css:'annual'},mission:{status:'mission',label:'مأمورية',css:'mission'},rest:{status:'rest',label:'راحة',css:'rest'},absent:{status:'absent',label:'غياب',css:'absent'},sick_leave:{status:'sick_leave',label:'إجازة مرضية',css:'sick'}};
const ABSENCE_TYPES=[['rotation_leave','إجازة دورية'],['annual','إجازة سنوية'],['mission','مأمورية'],['rest','راحة'],['absent','غياب'],['sick_leave','إجازة مرضية']];
let WDATA={employees:[],vehicles:[],tasks:[],plans:[],vehicle_plans:[],leaves:[],missions:[],departments:[],route_points:[]};
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
    missions:Array.isArray(value.missions)?value.missions:[],
    departments:Array.isArray(value.departments)?value.departments:[],
    route_points:Array.isArray(value.route_points)?value.route_points:splitList(value.settings&&value.settings.vehicle_route_point_options),
    settings:value.settings||{},lastUpdated:value.lastUpdated||''
  };
}
function dashboardWorkflow(){
  const d=data();
  return d&&d.workflow&&Array.isArray(d.workflow.employees)?normalizeWorkflow(d.workflow):null;
}
function hasWorkflow(value){return !!(value&&Array.isArray(value.employees)&&(value.employees.length||value.lastUpdated))}
function renderPane(name){if(name==='people')renderPeople();else if(name==='vehicles')renderVehicles();else if(name==='leaves')renderLeaves();else if(name==='tasks')renderWorkflowTasks();if(window.MountainI18n)window.MountainI18n.apply()}
function renderWorkflow(name='people'){renderPane(name)}
function showWorkflowLoading(){
  ['w-pane-people','w-pane-vehicles','w-pane-leaves','w-pane-tasks'].forEach(id=>{const el=$(id);if(el)el.innerHTML='<div class="workflow-compact-state"><span class="workflow-spinner"></span><b>جارٍ تحميل البيانات...</b><small>يتم تحميل الجزء المطلوب فقط</small></div>'});
}
function showWorkflowError(message){const pane=document.querySelector('.workflow-pane.active')||$('w-pane-people');if(!pane)return;pane.innerHTML='<div class="workflow-compact-state error"><b>تعذر تحميل البيانات</b><small>'+esc(message||'')+'</small><button class="btn primary" id="workflowRetry">إعادة المحاولة</button></div>';const retry=$('workflowRetry');if(retry)retry.onclick=()=>{showWorkflowLoading();loadWorkflow(true).then(()=>renderPane(document.querySelector('[data-wtab].active')?.dataset.wtab||'people')).catch(e=>showWorkflowError(e.message))};}
function open(initialPane='people',afterLoad){
  const modal=$('inputModal');
  modal.classList.add('workflow-modal','show');
  $('modalTitle').textContent='الإدخال والتشغيل اليومي';
  $('modalActions').innerHTML='<div id="workflowSaveFeedback" class="save-feedback"></div><button class="btn ghost" id="workflowClose">إغلاق</button>';
  $('modalBody').innerHTML='<div class="workflow-shell"><div class="workflow-tabs"><button class="workflow-tab active" data-wtab="people">الأفراد والمهام</button><button class="workflow-tab" data-wtab="vehicles">السيارات المتاحة</button><button class="workflow-tab" data-wtab="leaves">الحالات والإجازات</button><button class="workflow-tab task-close-tab" data-wtab="tasks">إغلاق مهام الخروج</button></div><section class="workflow-pane active" id="w-pane-people"></section><section class="workflow-pane" id="w-pane-vehicles"></section><section class="workflow-pane" id="w-pane-leaves"></section><section class="workflow-pane" id="w-pane-tasks"></section></div>';
  $('workflowClose').onclick=()=>{modal.classList.remove('show','workflow-modal')};
  document.querySelectorAll('[data-wtab]').forEach(b=>b.onclick=()=>switchPane(b.dataset.wtab));
  const snapshot=dashboardWorkflow();
  if(snapshot){WDATA=snapshot;workflowLoadedAt=Date.now();switchPane(initialPane);if(typeof afterLoad==='function')afterLoad();return Promise.resolve(WDATA)}
  if(hasWorkflow(WDATA)&&Date.now()-workflowLoadedAt<WORKFLOW_CACHE_MS){switchPane(initialPane);if(typeof afterLoad==='function')afterLoad();return Promise.resolve(WDATA)}
  showWorkflowLoading();switchPane(initialPane,true);
  return loadWorkflow(false).then(()=>{switchPane(initialPane);if(typeof afterLoad==='function')afterLoad();return WDATA}).catch(e=>{feedback(e.message,false);showWorkflowError(e.message);return WDATA});
}
function switchPane(n,skipRender=false){if(!skipRender)renderPane(n);document.querySelectorAll('[data-wtab]').forEach(b=>b.classList.toggle('active',b.dataset.wtab===n));document.querySelectorAll('.workflow-pane').forEach(p=>p.classList.toggle('active',p.id==='w-pane-'+n))}
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
async function refreshWorkflowFromDashboard(){
  try{await MountainCore.loadData(true,'summary',true);const snapshot=dashboardWorkflow();if(snapshot){WDATA=snapshot;workflowLoadedAt=Date.now();return WDATA}}catch(e){}
  return loadWorkflow(true);
}
function currentStatus(e){return String(e.current_status||e.status||'camp_no_work')}
function eligibleEmployees(){return WDATA.employees.filter(e=>!['on_site','leave','sick_leave','mission','rest','absent'].includes(currentStatus(e)))}
function addDate(value,days){const d=new Date(String(value||MountainCore.today()).slice(0,10)+'T12:00:00');d.setDate(d.getDate()+Number(days||0));return d.toISOString().slice(0,10)}
function absenceMeta(type){return ABSENCE_META[type]||{status:'leave',label:'إجازة',css:'leave'}}
function absenceTypeOptions(selected,includeMission=true){return ABSENCE_TYPES.filter(x=>includeMission||x[0]!=='mission').map(x=>'<option value="'+x[0]+'" '+(selected===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')}
function rangesOverlap(startA,endA,startB,endB){return !!(startA&&endA&&startB&&endB&&String(startA)<=String(endB)&&String(startB)<=String(endA))}
function duplicateAbsence(employeeId,start,end,excludeLeaveId='',excludeMissionId=''){
  const invalid=['cancelled','canceled','rejected','completed'];
  const leave=(WDATA.leaves||[]).find(item=>String(item.employee_id)===String(employeeId)&&String(item.leave_id||'')!==String(excludeLeaveId||'')&&!item.actual_return_date&&!invalid.includes(String(item.status||'').toLowerCase())&&rangesOverlap(start,end,item.start_date,item.end_date||item.return_date||item.expected_return_date||item.start_date));
  if(leave)return {kind:'leave',label:absenceMeta(String(leave.leave_type||'annual')).label,start:leave.start_date,end:leave.end_date||leave.return_date||leave.expected_return_date};
  const mission=(WDATA.missions||[]).find(item=>String(item.employee_id)===String(employeeId)&&String(item.mission_id||'')!==String(excludeMissionId||'')&&!invalid.includes(String(item.status||'approved').toLowerCase())&&rangesOverlap(start,end,item.start_date,item.end_date||item.start_date));
  if(mission)return {kind:'mission',label:'مأمورية',start:mission.start_date,end:mission.end_date||mission.start_date};
  return null;
}
function duplicateMessage(item){return 'يوجد بالفعل '+item.label+' مسجلة لنفس الموظف خلال الفترة من '+item.start+' إلى '+item.end+'. لا يمكن تكرار الحالة في نفس اليوم.'}
function actionOptions(sel){return ACTIONS.map(x=>'<option value="'+x[0]+'" '+(sel===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')}
function renderPeople(){
  const emps=eligibleEmployees();
  const vehicleOptions=registeredVehicles().filter(v=>String(v.vehicle_status||'available')==='available').map(v=>'<option value="'+esc(v.vehicle_id)+'">'+esc(vehicleLabel(v))+'</option>').join('');
  const coverOptions=WDATA.employees.map(e=>'<option value="'+esc(e.employee_id)+'">'+esc(e.employee_name)+'</option>').join('');
  const today=MountainCore.today();
  $('w-pane-people').innerHTML=
    '<div class="workflow-topline">'+
      '<div class="field workflow-date"><label>تاريخ الحركة والمهام</label><input class="input" type="date" id="workflowDate" value="'+today+'"></div>'+
      '<button class="btn primary" id="addWorkflowEmployee">＋ إضافة موظف جديد</button>'+
    '</div>'+
    '<div class="status-legend" aria-label="ألوان الحالات">'+
      '<span class="status-key rotation-key"><i></i> إجازة دورية</span>'+
      '<span class="status-key annual-key"><i></i> إجازة سنوية</span>'+
      '<span class="status-key mission-key"><i></i> مأمورية</span>'+
      '<span class="status-key rest-key"><i></i> راحة</span>'+
      '<span class="status-key absent-key"><i></i> غياب</span>'+
      '<span class="status-key sick-key"><i></i> إجازة مرضية</span>'+
    '</div>'+
    '<div id="blockedTaskBanner"></div>'+
    '<div class="employee-plan-list">'+
      (emps.length?emps.map(e=>
        '<div class="employee-plan-row" data-plan-employee="'+esc(e.employee_id||e.id)+'">'+
          '<div class="person"><b>'+esc(e.employee_name||e.name)+'</b><small>'+esc((e.job_title||'—')+' · '+(e.department||'—')+' · '+(e.current_residence_location||'السكن'))+'</small><span class="plan-status-badge hidden"></span><button type="button" class="btn ghost compact edit-employee-from-people" data-employee-id="'+esc(e.employee_id||e.id)+'" style="margin-top:8px">تعديل بيانات الموظف</button></div>'+
          '<select class="select plan-action" aria-label="اختيار حالة الموظف">'+actionOptions('')+'</select>'+
          '<div class="plan-details">'+
            '<textarea class="textarea plan-task hidden" placeholder="اكتب المهمة المطلوبة بالتفصيل"></textarea>'+
            '<div class="leave-fields hidden">'+
              '<div class="absence-guidance"></div>'+
              '<div class="field"><label>تاريخ البداية</label><input class="input plan-leave-start" type="date" value="'+today+'"></div>'+
              '<div class="field"><label>تاريخ العودة</label><input class="input plan-leave-end" type="date" value="'+today+'"></div>'+
              '<div class="field leave-support-only"><label>البديل أثناء الحالة</label><select class="select plan-leave-cover"><option value="">اختر البديل</option>'+coverOptions+'</select></div>'+
              '<div class="field leave-support-only"><label>السكن عند العودة</label><select class="select plan-leave-residence">'+RESIDENCES.map(x=>'<option>'+x+'</option>').join('')+'</select></div>'+
              '<div class="field sick-only hidden"><label>مرجع التقرير الطبي</label><input class="input plan-medical-ref" placeholder="رقم التقرير أو اسم المستند"></div>'+
            '</div>'+
            '<div class="mission-fields hidden">'+
              '<div class="field"><label>جهة أو مكان المأمورية</label><input class="input plan-mission-destination" placeholder="مثال: القصير، الغردقة، مورد المعدات"></div>'+
              '<div class="field"><label>تاريخ العودة المتوقع</label><input class="input plan-mission-end" type="date" value="'+today+'"></div>'+
              '<div class="field mission-responsible-field"><label>المسؤول أو الجهة المتابع معها</label><input class="input plan-mission-responsible" placeholder="اختياري"></div>'+
            '</div>'+
          '</div>'+
          '<select class="select plan-vehicle hidden"><option value="">بدون سيارة محددة</option>'+vehicleOptions+'</select>'+
        '</div>'
      ).join(''):'<div class="empty">لا يوجد موظفون متاحون في السكن حاليًا.</div>')+
    '</div>'+
    '<div class="workflow-topline" style="margin-top:16px"><span></span><button class="btn primary" id="savePeoplePlan">حفظ الحركة والحالات في Google Sheets</button></div>';

  document.querySelectorAll('.plan-action').forEach(s=>s.onchange=()=>syncPlanRow(s.closest('.employee-plan-row')));
  document.querySelectorAll('.plan-leave-start').forEach(input=>input.onchange=()=>syncPlanLeaveFields(input.closest('.employee-plan-row')));
  $('workflowDate').onchange=()=>{
    const selectedDate=$('workflowDate').value;
    document.querySelectorAll('.plan-mission-end').forEach(i=>{if(!i.value||i.value<selectedDate)i.value=selectedDate});
    document.querySelectorAll('[data-plan-employee]').forEach(row=>{const start=row.querySelector('.plan-leave-start');if(start&&!start.value)start.value=selectedDate;syncPlanLeaveFields(row)});
  };
  $('addWorkflowEmployee').onclick=()=>openEmployeeModal();
  document.querySelectorAll('.edit-employee-from-people').forEach(button=>button.onclick=()=>{
    const employee=(WDATA.employees||[]).find(item=>String(item.employee_id||item.id)===String(button.dataset.employeeId));
    if(employee)openEmployeeModal(employee);
  });
  $('savePeoplePlan').onclick=savePeoplePlan;
  showBlocked();
}
function syncPlanLeaveFields(row){
  if(!row)return;
  const type=row.querySelector('.plan-action').value;
  if(!LEAVE_ACTIONS.includes(type))return;
  const meta=absenceMeta(type),start=row.querySelector('.plan-leave-start'),end=row.querySelector('.plan-leave-end');
  const isSick=type==='sick_leave',needsSupport=['rotation_leave','annual','sick_leave'].includes(type);
  row.querySelectorAll('.sick-only').forEach(el=>el.classList.toggle('hidden',!isSick));
  row.querySelectorAll('.leave-support-only').forEach(el=>el.classList.toggle('hidden',!needsSupport));
  const notes={rotation_leave:'إجازة دورية يحدد المدير مدتها حسب نظام الموظف وظروف العمل.',annual:'إجازة سنوية مستقلة.',rest:'راحة مسجلة، ويمكن استخدامها للراحة الأسبوعية مثل يوم الجمعة.',absent:'غياب عن العمل، ويجب كتابة سبب الغياب.',sick_leave:'إجازة مرضية، ويمكن تسجيل مرجع التقرير الطبي.'};
  const guide=row.querySelector('.absence-guidance');if(guide){guide.textContent=notes[type]||meta.label;guide.className='absence-guidance status-'+meta.css}
  if(!start.value)start.value=$('workflowDate').value||MountainCore.today();
  if(!end.value||end.value<start.value)end.value=start.value;
}
function syncPlanRow(row){
  const a=row.querySelector('.plan-action').value,meta=absenceMeta(a),isLeave=LEAVE_ACTIONS.includes(a);
  const t=row.querySelector('.plan-task'),v=row.querySelector('.plan-vehicle'),m=row.querySelector('.mission-fields'),l=row.querySelector('.leave-fields');
  const select=row.querySelector('.plan-action'),badge=row.querySelector('.plan-status-badge');
  t.classList.toggle('hidden',!['on_site','work_from_camp','mission','rest','absent','sick_leave'].includes(a));
  v.classList.toggle('hidden',!['on_site','mission'].includes(a));
  m.classList.toggle('hidden',a!=='mission');
  l.classList.toggle('hidden',!isLeave);
  ['rotation','annual','mission','rest','absent','sick'].forEach(css=>{row.classList.remove('status-'+css);select.classList.remove('status-'+css)});
  badge.className='plan-status-badge hidden';badge.textContent='';
  if(isLeave||a==='mission'){
    row.classList.add('status-'+meta.css);select.classList.add('status-'+meta.css);
    badge.className='plan-status-badge status-'+meta.css;badge.textContent=meta.label;
  }
  if(isLeave)syncPlanLeaveFields(row);
  if(a==='mission'){
    const end=row.querySelector('.plan-mission-end');if(!end.value||end.value<$('workflowDate').value)end.value=$('workflowDate').value;
  }
  if(a==='work_from_camp')t.placeholder='اكتب العمل المطلوب منه من السكن';
  else if(a==='mission')t.placeholder='اكتب سبب المأمورية والمطلوب تنفيذه بالتفصيل';
  else if(a==='absent')t.placeholder='اكتب سبب الغياب';
  else if(a==='sick_leave')t.placeholder='اكتب سبب المرض أو ملاحظات الإجازة المرضية';
  else if(a==='rest')t.placeholder='اكتب ملاحظات الراحة إن وجدت';
  else t.placeholder='اكتب المطلوب منه عند دخوله الموقع';
}
function showBlocked(){const ids=new Set((WDATA.tasks||[]).filter(t=>String(t.task_status||'open')!=='completed').map(t=>String(t.employee_id)));const banner=$('blockedTaskBanner');const rows=[...document.querySelectorAll('[data-plan-employee]')];let count=0;rows.forEach(r=>{if(ids.has(String(r.dataset.planEmployee))){r.classList.add('ineligible');r.querySelector('.plan-action').disabled=true;count++}});banner.innerHTML=count?'<div class="blocked-banner">يوجد '+count+' موظف لديهم مهام قديمة مفتوحة. لا يمكن إضافة مهام جديدة لهم قبل كتابة ما تم وإغلاق أو تحديث المهمة القديمة.</div>':''}
async function savePeoplePlan(){
  const saveButton=$('savePeoplePlan');
  try{
    const date=$('workflowDate').value,records=[],leaveRecords=[];
    document.querySelectorAll('[data-plan-employee]').forEach(r=>{
      const status=r.querySelector('.plan-action').value;
      if(!status||r.classList.contains('ineligible'))return;
      const task=r.querySelector('.plan-task').value.trim();
      if(LEAVE_ACTIONS.includes(status)){
        const start=r.querySelector('.plan-leave-start').value||date,end=r.querySelector('.plan-leave-end').value;
        if(!start||!end||end<start)throw new Error('حدد تاريخ بداية وعودة صحيحًا للحالة.');
        if(status==='absent'&&!task)throw new Error('اكتب سبب الغياب.');
        const label=absenceMeta(status).label;
        leaveRecords.push({
          employee_id:r.dataset.planEmployee,leave_type:status,type:status,
          start_date:start,end_date:end,return_date:end,expected_return_date:end,status:'approved',
          reason:task||label,notes:'تم تسجيل '+label+' من شاشة الإدخال اليومي',
          medical_document_ref:status==='sick_leave'?r.querySelector('.plan-medical-ref').value.trim():'',
          coverage_employee_id:r.querySelector('.plan-leave-cover').value,return_residence:r.querySelector('.plan-leave-residence').value
        });
        return;
      }
      if(['on_site','work_from_camp','mission'].includes(status)&&!task)throw new Error('اكتب المهمة أو تفاصيل المأمورية لكل موظف تم اختياره.');
      const destination=r.querySelector('.plan-mission-destination').value.trim(),missionEnd=r.querySelector('.plan-mission-end').value,responsible=r.querySelector('.plan-mission-responsible').value.trim();
      if(status==='mission'&&!destination)throw new Error('اكتب جهة أو مكان المأمورية.');
      if(status==='mission'&&(!missionEnd||missionEnd<date))throw new Error('تاريخ عودة المأمورية يجب أن يساوي تاريخ بدايتها أو يكون بعده.');
      records.push({employee_id:r.dataset.planEmployee,plan_date:date,planned_status:status,task_description:task,vehicle_id:r.querySelector('.plan-vehicle').value,mission_destination:destination,mission_end_date:missionEnd,mission_responsible_person:responsible});
    });
    if(!records.length&&!leaveRecords.length)throw new Error('اختر حالة لموظف واحد على الأقل.');
    if(saveButton)saveButton.disabled=true;
    MountainCore.showLoader('جارٍ الحفظ في Google Sheets...');
    const savedLeaves=[];
    for(const leave of leaveRecords){const result=await call('saveleave',leave);savedLeaves.push(Object.assign({},leave,(result&&result.leave)||{}))}
    if(records.length)await call('saveworkflowplan',{date,records});
    const newStatusByEmployee={};
    records.forEach(record=>{newStatusByEmployee[String(record.employee_id)]=record.planned_status});
    leaveRecords.forEach(record=>{newStatusByEmployee[String(record.employee_id)]=absenceMeta(record.leave_type).status});
    WDATA.employees=(WDATA.employees||[]).map(employee=>{const status=newStatusByEmployee[String(employee.employee_id||employee.id)];return status?Object.assign({},employee,{current_status:status,status:status}):employee});
    savedLeaves.forEach(leave=>{const index=(WDATA.leaves||[]).findIndex(item=>String(item.leave_id||'')===String(leave.leave_id||'')||(String(item.employee_id)===String(leave.employee_id)&&!item.actual_return_date));if(index>=0)WDATA.leaves[index]=Object.assign({},WDATA.leaves[index],leave);else WDATA.leaves=[leave].concat(WDATA.leaves||[])});
    workflowLoadedAt=Date.now();renderPeople();renderLeaves();
    const parts=[];if(leaveRecords.length)parts.push(leaveRecords.length+' حالة إجازة/راحة/غياب');if(records.length)parts.push(records.length+' حركة أو مأمورية');
    feedback('تم حفظ '+parts.join(' و ')+' بنجاح. تم تحديث قائمة الموظفين والحالات مباشرة.',true);
    refreshWorkflowFromDashboard().then(()=>{if($('w-pane-people'))renderPeople();if($('w-pane-leaves'))renderLeaves()});
  }catch(e){feedback(e.message,false)}finally{if(saveButton)saveButton.disabled=false;MountainCore.hideLoader()}
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
function openEmployeeModal(employee){
  const editing=!!(employee&&employee.employee_id);
  const current=employee||{};
  const cars=registeredVehicles();
  const selectedDepartments=splitList(current.department);
  const selectedVehicleIds=splitList(current.drives_vehicle_ids).map(String);
  const currentResidence=String(current.current_residence_location||'الموقع');
  const currentExpense=Number(current.daily_residence_expense||(current.expense_rate&&current.expense_rate.camp_daily_rate)||0);
  const canDrive=current.is_driver===true||String(current.is_driver).toLowerCase()==='true'||String(current.is_driver)==='1';
  const layer=document.createElement('div');
  layer.className='mini-modal-layer';
  layer.innerHTML=
    '<div class="mini-modal-card employee-modal-card">'+
      '<div class="mini-modal-head"><div><h3>'+(editing?'تعديل بيانات الموظف':'إضافة موظف جديد')+'</h3><p>'+(editing?'عدّل البيانات ثم اضغط حفظ التعديلات.':'سجّل البيانات الأساسية وصلاحيات القيادة.')+'</p></div><button class="btn ghost" data-close>✕</button></div>'+
      '<div class="inline-fields">'+
        '<div class="field"><label>اسم الموظف</label><input class="input" id="newEmpName" autocomplete="name" placeholder="الاسم بالكامل" value="'+esc(current.employee_name||'')+'"></div>'+
        '<div class="field"><label>رقم التليفون</label><input class="input" id="newEmpPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01xxxxxxxxx" value="'+esc(current.phone||'')+'"></div>'+
        '<div class="field"><label>الوظيفة</label><select class="select" id="newEmpJob">'+JOBS.map(x=>'<option '+(String(current.job_title||JOBS[0])===x?'selected':'')+'>'+x+'</option>').join('')+'</select></div>'+
        '<div class="field"><label>مكان السكن</label><select class="select" id="newEmpResidence">'+RESIDENCES.map(x=>'<option '+(currentResidence===x?'selected':'')+'>'+x+'</option>').join('')+'</select></div>'+
        '<div class="field hidden" id="newEmpDailyExpenseWrap"><label>المصروف اليومي في الشقة (جنيه)</label><input class="input" id="newEmpDailyExpense" type="number" min="0" step="0.01" inputmode="decimal" placeholder="مثال: 150" value="'+(currentExpense||'')+'"></div>'+
        '<div class="field"><label>هل يمكنه قيادة سيارة؟</label><select class="select" id="newEmpDriver"><option value="false" '+(!canDrive?'selected':'')+'>لا</option><option value="true" '+(canDrive?'selected':'')+'>نعم</option></select></div>'+
      '</div>'+
      '<div class="field department-selection">'+
        '<div class="selection-heading"><label>الأقسام المتاحة للموظف</label><label class="select-all-row"><input type="checkbox" id="selectAllDepartments"> اختيار كل الأقسام</label></div>'+
        '<div class="multi-checks" id="departmentChecks">'+departments().map(x=>'<label><input type="checkbox" data-new-dept value="'+esc(x)+'" '+(selectedDepartments.includes(x)?'checked':'')+'> '+esc(x)+'</label>').join('')+'</div>'+
      '</div>'+
      '<div class="field hidden" id="newEmpVehiclesWrap">'+
        '<label>السيارات المسجلة المتاحة له للقيادة</label>'+
        (cars.length?'<div class="multi-checks">'+cars.map(v=>'<label><input type="checkbox" data-new-car value="'+esc(v.vehicle_id)+'" '+(selectedVehicleIds.includes(String(v.vehicle_id))?'checked':'')+'> <span>'+esc(vehicleLabel(v))+'</span></label>').join('')+'</div>':'<div class="empty-inline">لا توجد سيارات مسجلة حاليًا. أضف السيارة أولًا من تبويب السيارات.</div>')+
      '</div>'+
      '<div class="workflow-topline modal-save-row"><span id="employeeModalFeedback" class="save-feedback"></span><button class="btn primary" id="saveNewEmployee">'+(editing?'حفظ التعديلات':'حفظ الموظف')+'</button></div>'+
    '</div>';
  document.body.appendChild(layer);
  layer.querySelector('[data-close]').onclick=()=>layer.remove();
  const apartmentSelected=()=>/^شقة\s*[123]$/.test(String($('newEmpResidence').value||'').replace(/رقم/g,'').replace(/\s+/g,' ').trim());
  const syncDailyExpense=()=>{$('newEmpDailyExpenseWrap').classList.toggle('hidden',!apartmentSelected());if(!apartmentSelected())$('newEmpDailyExpense').value=''};
  const syncDriverCars=()=>{$('newEmpVehiclesWrap').classList.toggle('hidden',$('newEmpDriver').value!=='true')};
  const deptBoxes=()=>[...layer.querySelectorAll('[data-new-dept]')];
  const syncDepartmentSelectAll=()=>{const boxes=deptBoxes(),checked=boxes.filter(x=>x.checked).length;$('selectAllDepartments').checked=boxes.length>0&&checked===boxes.length;$('selectAllDepartments').indeterminate=checked>0&&checked<boxes.length};
  $('selectAllDepartments').onchange=()=>deptBoxes().forEach(box=>box.checked=$('selectAllDepartments').checked);
  deptBoxes().forEach(box=>box.onchange=syncDepartmentSelectAll);
  $('newEmpResidence').onchange=syncDailyExpense;
  $('newEmpDriver').onchange=syncDriverCars;
  syncDailyExpense();syncDriverCars();syncDepartmentSelectAll();
  $('saveNewEmployee').onclick=async()=>{
    const feedbackEl=$('employeeModalFeedback'),saveButton=$('saveNewEmployee');
    try{
      const name=$('newEmpName').value.trim(),phone=$('newEmpPhone').value.trim();
      const deps=deptBoxes().filter(x=>x.checked).map(x=>x.value);
      if(!name)throw new Error('اكتب اسم الموظف.');
      if(!phone)throw new Error('اكتب رقم تليفون الموظف.');
      if(!deps.length)throw new Error('اختر قسمًا واحدًا على الأقل أو اضغط اختيار كل الأقسام.');
      if(apartmentSelected()&&$('newEmpDailyExpense').value==='')throw new Error('اكتب المصروف اليومي للموظف في الشقة.');
      const canDriveNow=$('newEmpDriver').value==='true';
      const selectedCarIds=canDriveNow?[...layer.querySelectorAll('[data-new-car]:checked')].map(x=>x.value):[];
      const selectedCarNames=cars.filter(v=>selectedCarIds.includes(String(v.vehicle_id))).map(vehicleLabel);
      const mineId=current.mine_id||defaultMineForNewEmployee();
      const payload={
        employee_name:name,phone:phone,job_title:$('newEmpJob').value,department:deps.join(' | '),mine_id:mineId,mine_name:current.mine_name||mineId,mine_ids:current.mine_ids||mineId,
        current_residence_location:$('newEmpResidence').value,daily_residence_expense:apartmentSelected()?Number($('newEmpDailyExpense').value||0):0,daily_expense_currency:'EGP',
        expense_rate:apartmentSelected()?{camp_daily_rate:Number($('newEmpDailyExpense').value||0),currency:'EGP',effective_from:(window.MountainCore&&MountainCore.today?MountainCore.today():new Date().toISOString().slice(0,10)),notes:'Daily apartment expense set from employee form'}:{},
        is_driver:canDriveNow,drives_vehicle_ids:selectedCarIds.join('|'),drives_vehicle_names:selectedCarNames.join('|'),active:current.active===undefined?true:current.active
      };
      if(editing)payload.employee_id=current.employee_id;
      feedbackEl.textContent=editing?'جارٍ حفظ التعديلات...':'جارٍ حفظ الموظف...';feedbackEl.className='save-feedback';
      saveButton.disabled=true;
      const result=await call('saveemployee',payload);
      const savedEmployee=Object.assign({},current,payload,(result&&result.employee)||{}, {current_status:current.current_status||'camp_no_work',status:current.status||'camp_no_work'});
      upsertLocalEmployee(savedEmployee);
      layer.remove();
      renderPeople();
      renderLeaves();
      feedback(editing?'تم تعديل بيانات الموظف بنجاح.':'تم حفظ الموظف بنجاح، وظهر الآن ضمن الموظفين المتاحين في السكن.',true);
      refreshWorkflowFromDashboard().then(()=>{
        if(!(WDATA.employees||[]).some(e=>String(e.employee_id)===String(savedEmployee.employee_id)))upsertLocalEmployee(savedEmployee);
        if($('w-pane-people'))renderPeople();
        if($('w-pane-leaves'))renderLeaves();
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
    await refreshWorkflowFromDashboard();renderVehicles();
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
      refreshWorkflowFromDashboard().then(()=>{if($('w-pane-vehicles'))renderVehicles()})
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

function renderLeaves(){
  const emps=(WDATA.employees||[]).slice().sort((a,b)=>String(a.department||'').localeCompare(String(b.department||''),'ar'));
  const vehicleOptions=registeredVehicles().map(v=>'<option value="'+esc(v.vehicle_id)+'">'+esc(vehicleLabel(v))+'</option>').join('');
  const today=MountainCore.today();
  const typeOptions=absenceTypeOptions('rotation_leave',true);
  $('w-pane-leaves').innerHTML='<div class="workflow-topline"><div><h3>إدارة الحالات والإجازات والعودة</h3><p>اختر نوع الحالة ومدة البداية والعودة حسب نظام كل موظف وظروف العمل.</p></div></div><div class="leave-workflow-list">'+(emps.length?emps.map(e=>{
    const leave=(WDATA.leaves||[]).find(l=>String(l.employee_id)===String(e.employee_id)&&!l.actual_return_date&&!['cancelled','canceled','rejected','completed'].includes(String(l.status||'').toLowerCase()));
    const mission=(WDATA.missions||[]).find(m=>String(m.employee_id)===String(e.employee_id)&&!['cancelled','canceled','rejected','completed'].includes(String(m.status||'approved').toLowerCase())&&(!m.end_date||String(m.end_date)>=today));
    const active=leave||mission,activeType=leave?String(leave.leave_type||'annual'):(mission?'mission':''),meta=activeType?absenceMeta(activeType):null;
    const days=e.current_cycle_start?Math.max(0,Math.floor((new Date()-new Date(e.current_cycle_start))/86400000)):0;
    let activeText='في العمل منذ '+days+' يوم';
    if(leave){
      activeText='<span class="active-absence-label status-'+meta.css+'">'+esc(meta.label)+' من '+esc(leave.start_date)+' إلى '+esc(leave.end_date)+'</span>';
    }else if(mission){activeText='<span class="active-absence-label status-mission">مأمورية من '+esc(mission.start_date)+' إلى '+esc(mission.end_date)+(mission.destination?' — '+esc(mission.destination):'')+'</span>'}
    const activeFields=leave
      ?'<div class="field"><label>نوع الحالة الحالية</label><select class="select active-leave-type status-select-'+meta.css+'">'+absenceTypeOptions(activeType,false)+'</select></div><div class="field"><label>تاريخ بداية الحالة</label><input class="input active-leave-start" type="date" value="'+esc(leave.start_date)+'"></div><div class="field"><label>تاريخ نهاية الحالة</label><input class="input active-leave-end" type="date" value="'+esc(leave.end_date||leave.return_date||leave.expected_return_date)+'"></div><div class="field"><label>تعديل الحالة</label><button class="btn ghost save-active-leave" data-leave-id="'+esc(leave.leave_id)+'">حفظ تعديل النوع والتاريخ</button></div><div class="field"><label>تاريخ الحضور الفعلي</label><input class="input leave-return" type="date" value="'+esc(leave.return_date||leave.expected_return_date||leave.end_date)+'"></div><div class="field"><label>تأكيد انتهاء الحالة</label><button class="btn primary confirm-return status-button-'+meta.css+'" data-leave-id="'+esc(leave.leave_id)+'">تأكيد العودة من '+esc(meta.label)+'</button></div>'
      :mission
        ?'<div class="field"><label>تاريخ انتهاء المأمورية الفعلي</label><input class="input mission-return" type="date" value="'+esc(mission.end_date||today)+'"></div><div class="field"><label>تأكيد انتهاء المأمورية</label><button class="btn primary confirm-mission-return status-button-mission" data-mission-id="'+esc(mission.mission_id)+'">تأكيد العودة من المأمورية</button></div>'
        :'<div class="field"><label>نوع الحالة</label><select class="select absence-type">'+typeOptions+'</select></div><div class="field"><label>تاريخ البداية</label><input class="input absence-start" type="date" value="'+today+'"></div><div class="field"><label>تاريخ العودة</label><input class="input absence-end" type="date" value="'+today+'"></div><div class="field leave-only"><label>البديل أثناء الحالة</label><select class="select leave-cover"><option value="">اختر البديل</option>'+WDATA.employees.filter(x=>x.employee_id!==e.employee_id).map(x=>'<option value="'+esc(x.employee_id)+'">'+esc(x.employee_name)+'</option>').join('')+'</select></div><div class="field leave-only"><label>مكان السكن عند العودة</label><select class="select leave-residence">'+RESIDENCES.map(x=>'<option>'+x+'</option>').join('')+'</select></div><div class="field mission-only hidden"><label>جهة أو مكان المأمورية</label><input class="input mission-destination" placeholder="مثال: القصير، الغردقة، مورد معدات"></div><div class="field mission-only hidden"><label>المسؤول أو الجهة المتابع معها</label><input class="input mission-responsible" placeholder="اختياري"></div><div class="field mission-only hidden"><label>تفاصيل المأمورية والمطلوب</label><textarea class="textarea mission-notes" placeholder="اكتب سبب المأمورية والأعمال المطلوبة"></textarea></div><div class="field mission-only hidden"><label>السيارة المستخدمة</label><select class="select mission-vehicle"><option value="">بدون سيارة محددة</option>'+vehicleOptions+'</select></div><div class="field sick-only hidden"><label>مرجع التقرير الطبي</label><input class="input absence-medical-ref" placeholder="رقم التقرير أو اسم المستند"></div><div class="field absence-reason-field"><label>السبب أو الملاحظات</label><textarea class="textarea absence-reason" placeholder="اكتب السبب أو أي ملاحظات مهمة"></textarea></div><div class="absence-type-note"></div><button class="btn primary save-absence">تسجيل الحالة</button>';
    return '<div class="leave-person-card" data-leave-emp="'+esc(e.employee_id)+'"><div class="workflow-topline"><div><b>'+esc(e.employee_name)+'</b><div>'+esc(e.department||'—')+' · '+esc(e.job_title||'—')+'</div></div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span>'+activeText+'</span><button type="button" class="btn ghost compact edit-employee-from-leaves" data-employee-id="'+esc(e.employee_id)+'">تعديل بيانات الموظف</button></div></div><div class="inline-fields">'+activeFields+'</div></div>';
  }).join(''):'<div class="empty">لا يوجد موظفون مسجلون حاليًا.</div>')+'</div>';
  document.querySelectorAll('.absence-type').forEach(select=>{select.onchange=()=>syncAbsenceType(select.closest('[data-leave-emp]'));syncAbsenceType(select.closest('[data-leave-emp]'))});
  document.querySelectorAll('.absence-start').forEach(input=>input.onchange=()=>syncAbsenceType(input.closest('[data-leave-emp]')));
  document.querySelectorAll('.save-absence').forEach(button=>button.onclick=()=>saveAbsence(button.closest('[data-leave-emp]')));
  document.querySelectorAll('.active-leave-type').forEach(select=>select.onchange=()=>{const meta=absenceMeta(select.value);select.className='select active-leave-type status-select-'+meta.css});
  document.querySelectorAll('.save-active-leave').forEach(button=>button.onclick=()=>saveActiveLeave(button));
  document.querySelectorAll('.confirm-return').forEach(button=>button.onclick=()=>confirmReturn(button));
  document.querySelectorAll('.confirm-mission-return').forEach(button=>button.onclick=()=>confirmMissionReturn(button));
  document.querySelectorAll('.edit-employee-from-leaves').forEach(button=>button.onclick=()=>{const employee=(WDATA.employees||[]).find(item=>String(item.employee_id||item.id)===String(button.dataset.employeeId));if(employee)openEmployeeModal(employee)});
}
function syncAbsenceType(card){
  if(!card)return;
  const select=card.querySelector('.absence-type');if(!select)return;
  const type=select.value,meta=absenceMeta(type),mission=type==='mission',sick=type==='sick_leave',support=['rotation_leave','annual','sick_leave'].includes(type);
  card.querySelectorAll('.leave-only').forEach(el=>el.classList.toggle('hidden',mission||!support));
  card.querySelectorAll('.mission-only').forEach(el=>el.classList.toggle('hidden',!mission));
  card.querySelectorAll('.sick-only').forEach(el=>el.classList.toggle('hidden',!sick));
  const start=card.querySelector('.absence-start'),end=card.querySelector('.absence-end');
  if(start&&!start.value)start.value=MountainCore.today();
  if(start&&end&&(!end.value||end.value<start.value))end.value=start.value;
  const button=card.querySelector('.save-absence');
  if(button){button.textContent='تسجيل '+meta.label;button.className='btn primary save-absence status-button-'+meta.css}
  select.className='select absence-type status-select-'+meta.css;
  const notes={rotation_leave:'حدد المدة يدويًا حسب نظام الموظف وظروف العمل.',annual:'إجازة سنوية مستقلة.',mission:'سجّل الجهة والأعمال المطلوبة والمسؤول والسيارة.',rest:'يمكن استخدامها للراحة الأسبوعية مثل يوم الجمعة أو لأي راحة يحددها المدير.',absent:'يجب كتابة سبب الغياب.',sick_leave:'يمكن تسجيل مرجع التقرير الطبي.'};
  const note=card.querySelector('.absence-type-note');if(note){note.textContent=notes[type]||'';note.className='absence-type-note status-'+meta.css}
}
async function saveAbsence(card){
  const button=card.querySelector('.save-absence');
  try{
    const emp=card.dataset.leaveEmp,type=card.querySelector('.absence-type').value,start=card.querySelector('.absence-start').value,end=card.querySelector('.absence-end').value,reason=card.querySelector('.absence-reason').value.trim();
    if(!start||!end||end<start)throw new Error('حدد تاريخ بداية وعودة صحيحًا.');
    if(type==='absent'&&!reason)throw new Error('اكتب سبب الغياب.');
    const duplicate=duplicateAbsence(emp,start,end);
    if(duplicate)throw new Error(duplicateMessage(duplicate));
    button.disabled=true;button.textContent='جارٍ الحفظ...';
    if(type==='mission'){
      const destination=card.querySelector('.mission-destination').value.trim(),notes=card.querySelector('.mission-notes').value.trim();
      if(!destination)throw new Error('اكتب جهة أو مكان المأمورية.');if(!notes)throw new Error('اكتب تفاصيل المأمورية والأعمال المطلوبة.');
      const result=await call('savemission',{employee_id:emp,start_date:start,end_date:end,destination:destination,responsible_person:card.querySelector('.mission-responsible').value.trim(),vehicle_id:card.querySelector('.mission-vehicle').value,notes:notes,status:'approved'});
      const saved=Object.assign({employee_id:emp,start_date:start,end_date:end,destination:destination,notes:notes,status:'approved'},(result&&result.mission)||{});
      WDATA.missions=[saved].concat((WDATA.missions||[]).filter(item=>String(item.mission_id||'')!==String(saved.mission_id||'')&&String(item.employee_id)!==String(emp)));
      WDATA.employees=(WDATA.employees||[]).map(item=>String(item.employee_id)===String(emp)?Object.assign({},item,{current_status:'mission',status:'mission'}):item);
      feedback('تم تسجيل المأمورية بنجاح وتحديث حالة الموظف مباشرة.',true);
    }else{
      const payload={employee_id:emp,leave_type:type,type:type,start_date:start,end_date:end,return_date:end,expected_return_date:end,status:'approved',reason:reason||absenceMeta(type).label,notes:reason,medical_document_ref:type==='sick_leave'?card.querySelector('.absence-medical-ref').value.trim():'',coverage_employee_id:card.querySelector('.leave-cover')?card.querySelector('.leave-cover').value:'',return_residence:card.querySelector('.leave-residence')?card.querySelector('.leave-residence').value:''};
      const result=await call('saveleave',payload),saved=Object.assign({},payload,(result&&result.leave)||{}),meta=absenceMeta(type);
      WDATA.leaves=[saved].concat((WDATA.leaves||[]).filter(item=>String(item.leave_id||'')!==String(saved.leave_id||'')&&String(item.employee_id)!==String(emp)));
      WDATA.employees=(WDATA.employees||[]).map(item=>String(item.employee_id)===String(emp)?Object.assign({},item,{current_status:meta.status,status:meta.status}):item);
      feedback('تم تسجيل '+meta.label+' بنجاح وتحديث حالة الموظف مباشرة.',true);
    }
    renderLeaves();renderPeople();
  }catch(e){feedback(e.message,false);if(button){button.disabled=false;syncAbsenceType(card)}}
}
async function saveActiveLeave(btn){
  const card=btn.closest('[data-leave-emp]');
  try{
    const leaveId=btn.dataset.leaveId,employeeId=card.dataset.leaveEmp;
    const current=(WDATA.leaves||[]).find(item=>String(item.leave_id||'')===String(leaveId));
    if(!current)throw new Error('تعذر العثور على سجل الحالة الحالية.');
    const type=card.querySelector('.active-leave-type').value,start=card.querySelector('.active-leave-start').value,end=card.querySelector('.active-leave-end').value;
    if(!start||!end||end<start)throw new Error('حدد تاريخ بداية ونهاية صحيحًا.');
    const duplicate=duplicateAbsence(employeeId,start,end,leaveId,'');
    if(duplicate)throw new Error(duplicateMessage(duplicate));
    btn.disabled=true;btn.textContent='جارٍ حفظ التعديل...';
    const payload=Object.assign({},current,{leave_id:leaveId,employee_id:employeeId,leave_type:type,type:type,start_date:start,end_date:end,return_date:end,expected_return_date:end,status:current.status||'approved'});
    delete payload._row;
    const result=await call('saveleave',payload),saved=Object.assign({},payload,(result&&result.leave)||{});
    WDATA.leaves=(WDATA.leaves||[]).map(item=>String(item.leave_id||'')===String(leaveId)?saved:item);
    WDATA.employees=(WDATA.employees||[]).map(item=>String(item.employee_id)===String(employeeId)?Object.assign({},item,{current_status:absenceMeta(type).status,status:absenceMeta(type).status}):item);
    feedback('تم تعديل الحالة إلى '+absenceMeta(type).label+' بنجاح.',true);
    renderLeaves();renderPeople();
  }catch(e){feedback(e.message,false);btn.disabled=false;btn.textContent='حفظ تعديل النوع والتاريخ'}
}

async function confirmReturn(btn){
  try{
    const card=btn.closest('[data-leave-emp]'),date=card.querySelector('.leave-return').value||MountainCore.today();
    btn.disabled=true;btn.textContent='جارٍ التأكيد...';
    await call('confirmleavereturn',{leave_id:btn.dataset.leaveId,employee_id:card.dataset.leaveEmp,actual_return_date:date});
    WDATA.leaves=(WDATA.leaves||[]).filter(item=>String(item.leave_id)!==String(btn.dataset.leaveId));
    WDATA.employees=(WDATA.employees||[]).map(item=>String(item.employee_id)===String(card.dataset.leaveEmp)?Object.assign({},item,{current_status:'camp_no_work',status:'camp_no_work'}):item);
    renderLeaves();renderPeople();switchPane('people');feedback('تم تأكيد عودة الموظف ونقله إلى صفحة الأفراد والمهام.',true);
  }catch(e){feedback(e.message,false);btn.disabled=false;btn.textContent='تأكيد العودة'}
}
async function confirmMissionReturn(btn){
  try{
    const card=btn.closest('[data-leave-emp]'),date=card.querySelector('.mission-return').value||MountainCore.today();
    btn.disabled=true;btn.textContent='جارٍ التأكيد...';
    await call('confirmmissionreturn',{mission_id:btn.dataset.missionId,employee_id:card.dataset.leaveEmp,actual_return_date:date});
    WDATA.missions=(WDATA.missions||[]).filter(item=>String(item.mission_id)!==String(btn.dataset.missionId));
    WDATA.employees=(WDATA.employees||[]).map(item=>String(item.employee_id)===String(card.dataset.leaveEmp)?Object.assign({},item,{current_status:'camp_no_work',status:'camp_no_work'}):item);
    feedback('تم تأكيد انتهاء المأمورية وعودة الموظف إلى قائمة المتاحين.',true);renderLeaves();renderPeople();
  }catch(e){feedback(e.message,false);btn.disabled=false;btn.textContent='تأكيد العودة من المأمورية'}
}

function reportDepartmentLabel(value){
  const values=unique(splitList(value));
  return values.length?values.join(' / '):'غير محدد';
}
function reportDate(tasks){
  const raw=(tasks||[]).map(task=>task.plan_date).find(Boolean)||($('workflowDate')&&$('workflowDate').value)||MountainCore.today();
  const date=new Date(String(raw).slice(0,10)+'T12:00:00');
  if(Number.isNaN(date.getTime()))return String(raw||'—');
  try{return date.toLocaleDateString('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}catch(_){return String(raw||'—')}
}
function openReportTasks(tasks){
  return (tasks||[]).filter(task=>String(task.task_status||'open').toLowerCase()!=='completed');
}
function buildProfessionalEntryPlanReport(tasks){
  const rows=openReportTasks(tasks);
  const departmentsMap=new Map();
  rows.forEach(task=>{
    const department=reportDepartmentLabel(task.department);
    const description=String(task.task_description||'مهمة غير موضحة').trim()||'مهمة غير موضحة';
    const employee=String(task.employee_name||'غير محدد').trim()||'غير محدد';
    if(!departmentsMap.has(department))departmentsMap.set(department,new Map());
    const taskMap=departmentsMap.get(department);
    if(!taskMap.has(description))taskMap.set(description,[]);
    taskMap.get(description).push(employee);
  });
  const lines=[
    'السلام عليكم ورحمة الله وبركاته،',
    'تحية طيبة وبعد،',
    '',
    'خطة الأعمال المطلوبة لدخول الموقع',
    'التاريخ: '+reportDate(rows),
    '',
    'يرجى التكرم بالاطلاع على توزيع الأعمال والمسؤوليات التالية:'
  ];
  if(!rows.length){
    lines.push('','لا توجد أعمال مفتوحة مسجلة في الخطة الحالية.');
  }else{
    departmentsMap.forEach((taskMap,department)=>{
      lines.push('','━━━━━━━━━━━━━━━━━━━━','القسم: '+department,'','الأعمال المطلوبة:');
      let index=1;
      taskMap.forEach((employees,description)=>{
        const names=unique(employees);
        lines.push(index+'. '+description,'   المسؤول'+(names.length>1?'ون':'')+' عن التنفيذ: '+names.join('، '));
        index++;
      });
    });
  }
  lines.push('','يرجى من جميع الزملاء الالتزام بالأعمال المكلفين بها، وإبلاغ المسؤول المباشر فورًا بأي معوقات تؤثر على التنفيذ.','','مع خالص التحية والتقدير.');
  return lines.join('\n');
}
function buildProfessionalExitReport(tasks){
  const rows=(tasks||[]).filter(task=>task&&task.employee_name);
  const departmentsMap=new Map();
  rows.forEach(task=>{
    const department=reportDepartmentLabel(task.department);
    if(!departmentsMap.has(department))departmentsMap.set(department,[]);
    departmentsMap.get(department).push(task);
  });
  const statusLabel=status=>{
    const value=String(status||'').toLowerCase();
    if(value==='completed')return 'تم الإنجاز بالكامل';
    if(value==='blocked')return 'متوقفة على معوق';
    return 'تم تنفيذ جزء منها وما زالت مستمرة';
  };
  const lines=[
    'السلام عليكم ورحمة الله وبركاته،',
    'تحية طيبة وبعد،',
    '',
    'تقرير متابعة الأعمال بعد الخروج من الموقع',
    'التاريخ: '+reportDate(rows),
    '',
    'فيما يلي موقف الأعمال المكلف بها فريق العمل:'
  ];
  if(!rows.length){
    lines.push('','لا توجد مهام مسجلة لإعداد التقرير.');
  }else{
    departmentsMap.forEach((departmentTasks,department)=>{
      lines.push('','━━━━━━━━━━━━━━━━━━━━','القسم: '+department);
      departmentTasks.forEach((task,index)=>{
        lines.push(
          '',
          (index+1)+'. العمل المطلوب: '+String(task.task_description||'—'),
          '   المسؤول عن التنفيذ: '+String(task.employee_name||'—'),
          '   ما تم تنفيذه: '+String(task.progress_notes||'لم يتم تسجيل تحديث حتى الآن'),
          '   حالة العمل: '+statusLabel(task.task_status)
        );
        if(task.blocker_details)lines.push('   المعوقات أو المطلوب للاستكمال: '+String(task.blocker_details));
      });
    });
  }
  lines.push('','يرجى مراجعة الأعمال المتبقية واتخاذ اللازم لاستكمالها في الموعد المحدد.','','مع خالص التحية والتقدير.');
  return lines.join('\n');
}

function renderWorkflowTasks(){
  const pane=$('w-pane-tasks');
  if(!pane)return;
  const allTasks=(WDATA.tasks||[]).filter(task=>String(task.task_status||'open').toLowerCase()!=='completed');
  const departments=unique(allTasks.map(task=>task.department).filter(Boolean));
  pane.innerHTML=
    '<div class="workflow-topline workflow-task-heading">'+
      '<div><h3>تسجيل ما تم بعد الخروج من الجبل</h3><p>اكتب نتيجة كل مهمة قبل تكليف نفس الموظف بمهمة جديدة. لو المهمة متوقفة، اكتب ما تم وسبب التوقف وما المطلوب لاستكمالها.</p></div>'+
      '<div class="workflow-task-actions"><button class="btn ghost" type="button" id="workflowCopyEntryPlan">نسخ بلان الدخول</button><button class="btn primary" type="button" id="workflowCopyExitReport">نسخ تقرير الخروج</button></div>'+
    '</div>'+
    '<div class="workflow-task-filter"><div class="field"><label>القسم</label><select class="select" id="workflowTaskDepartment"><option value="">كل الأقسام</option>'+departments.map(dep=>'<option value="'+esc(dep)+'">'+esc(dep)+'</option>').join('')+'</select></div><span class="workflow-task-count" id="workflowTaskCount"></span></div>'+
    '<div class="workflow-task-list" id="workflowTaskList"></div>';

  const draw=()=>{
    const department=$('workflowTaskDepartment').value;
    const tasks=allTasks.filter(task=>!department||String(task.department)===department);
    $('workflowTaskCount').textContent=tasks.length+' مهمة مفتوحة';
    $('workflowTaskList').innerHTML=tasks.length?tasks.map(task=>{
      const status=String(task.task_status||'in_progress').toLowerCase();
      const selectedStatus=status==='blocked'?'blocked':'in_progress';
      return '<article class="workflow-task-card" data-workflow-task="'+esc(task.task_id)+'">'+
        '<div class="workflow-task-meta"><div><b>'+esc(task.employee_name||'—')+'</b><span>'+esc(task.department||'—')+' · '+esc(task.plan_date||'—')+'</span></div><span class="workflow-task-state">مهمة مفتوحة</span></div>'+
        '<div class="workflow-task-description"><label>المهمة المطلوبة</label><p>'+esc(task.task_description||'—')+'</p></div>'+
        '<div class="workflow-task-form">'+
          '<div class="field task-progress-field"><label>ما تم عمله فعليًا *</label><textarea class="textarea workflow-task-progress" placeholder="مثال: تم فحص المعدة وتغيير الجزء التالف...">'+esc(task.progress_notes||'')+'</textarea></div>'+
          '<div class="field"><label>حالة المهمة</label><select class="select workflow-task-status"><option value="completed">تم إنجازها بالكامل</option><option value="in_progress" '+(selectedStatus==='in_progress'?'selected':'')+'>تم تنفيذ جزء منها ومستمر</option><option value="blocked" '+(selectedStatus==='blocked'?'selected':'')+'>متوقفة على شيء</option></select></div>'+
          '<div class="field workflow-task-blocker-field '+(selectedStatus==='blocked'?'':'hidden')+'"><label>متوقفة على ماذا؟ *</label><textarea class="textarea workflow-task-blocker" placeholder="اكتب سبب التوقف وما المطلوب لاستكمال المهمة">'+esc(task.blocker_details||'')+'</textarea></div>'+
        '</div>'+
        '<div class="workflow-task-save-row"><button class="btn primary workflow-save-task" type="button">حفظ تحديث المهمة</button></div>'+
      '</article>';
    }).join(''):'<div class="empty workflow-task-empty">لا توجد مهام مفتوحة. كل المهام تم تحديثها أو إغلاقها.</div>';

    document.querySelectorAll('#workflowTaskList .workflow-task-status').forEach(select=>select.onchange=()=>{
      const card=select.closest('[data-workflow-task]');
      card.querySelector('.workflow-task-blocker-field').classList.toggle('hidden',select.value!=='blocked');
    });
    document.querySelectorAll('#workflowTaskList .workflow-save-task').forEach(button=>button.onclick=()=>closeWorkflowTaskCard(button.closest('[data-workflow-task]')));
  };
  $('workflowTaskDepartment').onchange=draw;
  $('workflowCopyEntryPlan').onclick=()=>copyText(buildProfessionalEntryPlanReport(allTasks),'تم نسخ تقرير خطة الدخول بشكل احترافي');
  $('workflowCopyExitReport').onclick=()=>copyText(buildProfessionalExitReport(allTasks),'تم نسخ تقرير الخروج بشكل احترافي');
  draw();
}

async function closeWorkflowTaskCard(card){
  const button=card.querySelector('.workflow-save-task');
  try{
    const taskId=card.dataset.workflowTask;
    const progress=card.querySelector('.workflow-task-progress').value.trim();
    const status=card.querySelector('.workflow-task-status').value;
    const blocker=card.querySelector('.workflow-task-blocker').value.trim();
    if(!progress)throw new Error('اكتب ما تم عمله فعليًا في المهمة.');
    if(status==='blocked'&&!blocker)throw new Error('اكتب سبب توقف المهمة وما المطلوب لاستكمالها.');
    button.disabled=true;button.textContent='جارٍ الحفظ...';
    await call('closetask',{task_id:taskId,progress_notes:progress,task_status:status,blocker_details:blocker});
    WDATA.tasks=(WDATA.tasks||[]).map(task=>String(task.task_id)===String(taskId)?Object.assign({},task,{progress_notes:progress,task_status:status,blocker_details:blocker}):task);
    feedback(status==='completed'?'تم إنجاز المهمة وإغلاقها بنجاح.':'تم حفظ ما تم في المهمة، وستظل مفتوحة للمتابعة.',true);
    renderWorkflowTasks();
    renderPeople();
    refreshWorkflowFromDashboard().then(()=>{
      if($('w-pane-tasks'))renderWorkflowTasks();
      if($('w-pane-people'))renderPeople();
      renderTaskPage();
    });
  }catch(error){feedback(error.message,false);button.disabled=false;button.textContent='حفظ تحديث المهمة'}
}

async function loadTasks(){const snapshot=dashboardWorkflow();if(snapshot){WDATA=snapshot;renderTaskPage()}try{await loadWorkflow(!snapshot);renderTaskPage()}catch(e){if(!snapshot&&$('openTasksBody'))$('openTasksBody').innerHTML='<tr><td colspan="8" class="empty">'+esc(e.message)+'</td></tr>'}}
function renderTaskPage(){if(!$('openTasksBody'))return;const deps=[...new Set((WDATA.tasks||[]).map(t=>t.department).filter(Boolean))];$('taskDepartmentFilter').innerHTML='<option value="">كل الأقسام</option>'+deps.map(x=>'<option>'+esc(x)+'</option>').join('');const render=()=>{const dep=$('taskDepartmentFilter').value,rows=(WDATA.tasks||[]).filter(t=>!dep||t.department===dep).filter(t=>String(t.task_status||'open')!=='completed');$('openTaskCount').textContent=rows.length+' مهمة مفتوحة';$('openTasksBody').innerHTML=rows.length?rows.map(t=>'<tr data-task="'+esc(t.task_id)+'"><td>'+esc(t.plan_date)+'</td><td><b>'+esc(t.employee_name)+'</b></td><td>'+esc(t.department)+'</td><td>'+esc(t.task_description)+'</td><td><textarea class="textarea task-progress" placeholder="اكتب ما تم عمله">'+esc(t.progress_notes||'')+'</textarea></td><td><select class="select task-status-select"><option value="completed">تم بالكامل</option><option value="blocked">متوقفة على شيء</option><option value="in_progress">تم جزء منها ومستمر</option></select></td><td><textarea class="textarea task-blocker" placeholder="سبب التوقف أو المطلوب لاستكمالها"></textarea></td><td><button class="btn primary save-task-close">حفظ</button></td></tr>').join(''):'<tr><td colspan="8" class="empty">لا توجد مهام مفتوحة.</td></tr>';document.querySelectorAll('.save-task-close').forEach(b=>b.onclick=()=>closeTaskRow(b.closest('tr')))};$('taskDepartmentFilter').onchange=render;render();$('copyEntryPlan').onclick=()=>copyText(buildProfessionalEntryPlanReport(WDATA.tasks||[]),'تم نسخ تقرير خطة الدخول بشكل احترافي');$('copyExitReport').onclick=()=>copyText(buildProfessionalExitReport(WDATA.tasks||[]),'تم نسخ تقرير الخروج بشكل احترافي')}
async function closeTaskRow(row){try{const progress=row.querySelector('.task-progress').value.trim(),status=row.querySelector('.task-status-select').value,blocker=row.querySelector('.task-blocker').value.trim();if(!progress)throw new Error('يجب كتابة ما تم عمله.');if(status==='blocked'&&!blocker)throw new Error('اكتب سبب توقف المهمة وما المطلوب لاستكمالها.');await call('closetask',{task_id:row.dataset.task,progress_notes:progress,task_status:status,blocker_details:blocker});MountainCore.toast('تم تحديث المهمة في Google Sheets.');await loadTasks()}catch(e){MountainCore.toast(e.message,true)}}
function copyText(text,msg){navigator.clipboard.writeText(text||'').then(()=>MountainCore.toast(msg)).catch(()=>MountainCore.toast('تعذر النسخ',true))}
function openQuick(op){const perm=MountainCore.perm,allowed=(op==='site_entry'&&(perm('manage_employees')||perm('record_team')))||(op==='leave'&&perm('manage_leaves'))||(op==='employee'&&perm('manage_employees'))||(op==='company_vehicle'&&perm('manage_vehicles'));if(!allowed){MountainCore.toast('لا توجد صلاحية لفتح هذا الإجراء.',true);return}if(op==='site_entry')return open('people');if(op==='leave')return open('leaves');if(op==='employee')return open('people',openEmployeeModal);if(op==='company_vehicle')return open('vehicles',()=>openVehicleModal())}
function bind(){const btn=$('inputBtn');if(btn)btn.onclick=()=>open('people');document.querySelectorAll('[data-quick-op]').forEach(b=>b.onclick=()=>openQuick(b.dataset.quickOp));document.querySelectorAll('.tab-btn').forEach(b=>{if(b.dataset.tab==='tasks')b.addEventListener('click',loadTasks)})}
function invalidate(){workflowLoadedAt=0;workflowRequest=null}
window.MountainWorkflow={open:open,openQuick:openQuick,invalidate:invalidate};
document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,700));
})();