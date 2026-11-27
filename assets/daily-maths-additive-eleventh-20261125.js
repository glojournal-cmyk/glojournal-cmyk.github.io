// Staged additive Maths planner: never replaces a legacy task or mutates a dated record.
// Not wired into production until signed content, date-aware persistence and WebKit gates pass.
import {validateMathQuestion,mathsEvidence} from './daily-tasks-v3-20261122.js';
import {selectMathsV31Daily} from './math-study/daily-v31-selector.js';
const validDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d);
const ids=ts=>ts.map(t=>t?.id);
const unique=xs=>new Set(xs).size===xs.length;
export function appendApprovedMathsDaily(state,legacy,manifest={},activationDay=null){
 const day=state?.today;
 if(!validDay(day)||!validDay(activationDay)||day<activationDay||!Array.isArray(legacy))return legacy;
 const saved=(state.daily||[]).filter(t=>t?.planDate===day);
 const historic=state.dailyLog?.[day];
 // An already-issued dated plan, even one with zero progress, is immutable in size.
 // Reconciliation of a valid saved Maths assignment is a separate runtime concern.
 if(saved.length||historic?.tasks?.length||(state.formalAttemptLog||[]).some(a=>a?.day===day&&a?.dailyTaskId))return legacy;
 if(legacy.length!==10||!unique(ids(legacy))||ids(legacy).some(id=>!id||id==='maths-daily')||
    legacy.some(t=>t.planDate!==day||Number(t.progress)>0||t.done===true))return legacy;
 if(manifest.mathsRuntimeReady!==true)return legacy;
 const bank=(Array.isArray(manifest.maths)?manifest.maths:[]).filter(q=>validateMathQuestion(q).valid);
 const history=Object.entries(state.dailyLog||{}).flatMap(([date,row])=>{
  const t=(row?.tasks||[]).find(x=>x?.id==='maths-daily');
  return t?.approvedQuestionIds?.length?[{date,questionIds:t.approvedQuestionIds,
   templateIds:Object.values(t.approvedTemplateByQuestion||{}),
   conceptFamilyIds:Object.values(t.approvedConceptByQuestion||{})}]:[];
 });
 const selection=selectMathsV31Daily({approvedQuestions:bank,day,history});
 const qs=selection.questions||[];
 if(!selection.ready||qs.length!==10||!unique(qs.map(q=>q.id)))return legacy;
 const task={id:'maths-daily',title:'Year 9 Higher Maths MCQ',target:10,progress:0,done:false,
  detail:'10 approved six-option questions; 9/10 correct to clear.',
  href:'/study/maths/daily/',xp:15,assignedSubject:'maths',assignedYear:9,
  planDate:day,dailyV3:true,planVersion:3,
  approvedQuestionIds:qs.map(q=>q.id),
  approvedConceptByQuestion:Object.fromEntries(qs.map(q=>[q.id,q.conceptFamilyId])),
  approvedTemplateByQuestion:Object.fromEntries(qs.map(q=>[q.id,q.templateId])),
  approvedCorrectOptionByQuestion:Object.fromEntries(qs.map(q=>[q.id,q.correctOptionId]))};
 const evidence=mathsEvidence([],day,task);
 return [...legacy,{...task,mathsEvidence:evidence}];
}
