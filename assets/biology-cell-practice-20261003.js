import {SessionResult,ReviewProgress} from "./session-reflection-20261004.js?v=20261004-reflection2";
import "./practice-evidence-bridge-20261004.js?v=20261004-reflection2";
import "./learning-feedback-20261003.js?v=20261004-reflection2";
const {buildCorrection,selectTransferQuestion}=globalThis.LuxLearningFeedback;
import {i as interop,n as reactFactory} from './jsx-runtime-Cltr0gcK.js';
import {gradeBiologyAnswer} from './biology-cell-rubric-20261003.js';
const R=interop(reactFactory()),h=R.createElement,KEY='scholar-biology-cell-practice-v1';
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
export function pickPracticeQuestions(bank,topic,size,previous=[],weak=[]){
 const pool=bank.filter(q=>(topic==='all'||topic==='weak'||q.topic===topic)&&(topic!=='weak'||weak.includes(q.id)));
 const shuffle=items=>items.map(q=>({q,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.q);
 return [...shuffle(pool.filter(q=>!previous.includes(q.id))),...shuffle(pool.filter(q=>previous.includes(q.id)))].slice(0,size).map(q=>q.id);
}
export function BiologyCellPractice({onSessionActive}={}){
 const [resumed,setResumed]=R.useState(()=>!!read().ids?.length),[bank,setBank]=R.useState(null),[error,setError]=R.useState(''),[state,setState]=R.useState(read),[topic,setTopic]=R.useState('all'),[size,setSize]=R.useState(10),[saveError,setSaveError]=R.useState(false),[settingsOpen,setSettingsOpen]=R.useState(()=>!read().ids?.length),[referencesOpen,setReferencesOpen]=R.useState(false);
 R.useEffect(()=>{onSessionActive?.(!!state.ids?.length&&(state.index||0)<state.ids.length)},[state.ids,state.index,onSessionActive]);
 R.useEffect(()=>{let live=true;fetch('/assessment/biology-cell-structure-20261003.json?v=20261004-reflection2').then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(live)setBank(d.questions)}).catch(()=>{if(live)setError('Could not load the question bank. Reload this page to try again.')});return()=>{live=false}},[]);
 R.useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify({...state,savedAt:Date.now()}));setSaveError(false)}catch{setSaveError(true)}},[state]);
 if(error)return h('p',{role:'alert'},error);
 if(!bank)return h('p',{role:'status'},'Loading the 72 cell structure questions…');
 const topics=[...new Set(bank.map(q=>q.topic))],weak=Object.entries(state.history||{}).filter(([,v])=>v.credit<1).map(([id])=>id),ids=state.ids||[],index=state.index||0,q=bank.find(q=>q.id===ids[index]),entry=q?state.answers?.[q.id]:null,finished=ids.length>0&&index>=ids.length;
 function start(){setResumed(false);setSettingsOpen(false);setReferencesOpen(false);const chosen=pickPracticeQuestions(bank,topic,size,ids,weak);if(!chosen.length)return;setState(s=>({...s,ids:chosen,index:0,answers:{},transferOf:{},reviewHistory:Object.fromEntries(Object.entries(s.history||{}).map(([id,row])=>[id,{...row,wrong:row.credit<1,lastWrong:row.lastWrong||(row.credit<1&&row.at?new Date(row.at).toISOString().slice(0,10):null),lastErrorKind:row.lastErrorKind||(row.credit<1?'partial':null)}])),sessionTopic:topic}));}
 function answer(value){setState(s=>({...s,answers:{...s.answers,[q.id]:{value}}}));}
 function check(event){event.preventDefault();if(!entry?.value?.trim()||entry.checked)return;const result=gradeBiologyAnswer(q,entry.value),at=new Date().toISOString(),evidence={eventId:at+":"+q.id,at,questionId:q.id,subject:"biology",year:9,topicTitle:q.topic,source:"biology-cell",correct:result.credit>=.999,credit:result.credit,earnedMarks:result.matched,marks:q.marks,repair:!!state.transferOf?.[q.id]};setState(s=>({...s,practiceEvidence:globalThis.LuxPracticeBridge.appendEvidence(s.practiceEvidence,evidence),answers:{...s.answers,[q.id]:{...entry,checked:true,result}},history:{...s.history,[q.id]:{credit:result.credit,at:Date.now(),lastWrong:result.credit<1?at.slice(0,10):s.history?.[q.id]?.lastWrong,lastErrorKind:result.credit<1?"partial":s.history?.[q.id]?.lastErrorKind}}}));}
 const correction=entry?.checked?buildCorrection(q,{...entry.result,given:entry.value,model:q.modelAnswer},'biology'):null,transfer=entry?.checked&&entry.result.credit<1?selectTransferQuestion(q,bank,ids):null;
 const labelStyle={display:'block',marginBottom:6},buttonStyle={padding:'10px 18px',borderRadius:12,border:'1px solid #b8c9b8',background:'#173e50',color:'white',cursor:'pointer'},cardStyle={padding:24,borderRadius:18,border:'1px solid #c9d2c5',background:'#fffdf6'};
 return h('section',{'aria-label':'Cell structure practice',style:cardStyle},
 h('h2',{className:'font-display text-3xl font-semibold'},'AQA 4.1.1 · Cell structure practice'),
 h('p',{style:{margin:'8px 0 16px'}},'72 short-answer questions · immediate feedback · 6 topics. Scientific wording can vary: compare equivalent explanations with the mark-point checklist.'),
 h('details',{open:settingsOpen,onToggle:e=>setSettingsOpen(e.currentTarget.open),'data-biology-settings':true,style:{marginTop:12}},
 h('summary',{style:{cursor:'pointer',minHeight:44,padding:'12px 0',fontWeight:600}},'Practice settings · topic & question count'),
 h('div',{style:{display:'flex',gap:16,flexWrap:'wrap',alignItems:'end'}},
 h('label',null,h('span',{style:labelStyle},'Practice topic'),h('select',{value:topic,onChange:e=>setTopic(e.target.value),style:{padding:10,maxWidth:'100%'}},h('option',{value:'all'},'All six topics'),...topics.map(t=>h('option',{key:t,value:t},t)),h('option',{value:'weak'},`Retry mistakes from this practice (${weak.length})`))),
 h('label',null,h('span',{style:labelStyle},'Questions'),h('select',{value:size,onChange:e=>setSize(Number(e.target.value)),style:{padding:10}},...[5,10,15].map(n=>h('option',{key:n,value:n},String(n))))),
 h('button',{type:'button',onClick:start,disabled:topic==='weak'&&!weak.length,style:buttonStyle},ids.length?'Start a new set':'Start practice')),
 h('p',{style:{fontSize:13,marginTop:10}},'New sets prioritise questions outside the previous set. Answers and your place save automatically on this device. This practice does not award formal mastery.')),
 saveError&&h('p',{role:'alert'},'Your browser could not save this practice. Keep this page open to retain your answers.'),
 resumed&&q&&h('p',{role:'status'},`Resumed saved cell practice · question ${index+1} of ${ids.length}. Your answer and feedback are preserved.`),
 q&&h('form',{'data-biology-question':true,onSubmit:check,style:{marginTop:24}},
 h('p',null,`Question ${index+1} / ${ids.length} · ${q.topic} · ${q.marks} marks`),
 h('h3',{style:{fontSize:20,fontWeight:600,margin:'10px 0'}},q.prompt),
 h(ReviewProgress,{question:{...q,_repair:!!state.transferOf?.[q.id]},previous:state.reviewHistory?.[state.transferOf?.[q.id]||q.id],current:null,checked:entry?.checked?{ok:entry.result.credit>=.999}:null,today:new Date().toISOString().slice(0,10)}),
 state.transferOf?.[q.id]&&h('p',{style:{fontSize:13,color:'#274d43'}},'Same idea, different question · demonstrate that you can apply the correction.'),
 q.diagram&&h('img',{src:'/assessment/diagrams/'+q.diagram,alt:q.diagramAlt||'Biology diagram for this question',style:{width:'100%',maxHeight:440,objectFit:'contain',marginBottom:16}}),
 h('label',null,h('span',{style:labelStyle},'Your answer'),h('textarea',{value:entry?.value||'',onChange:e=>answer(e.target.value),disabled:!!entry?.checked,rows:5,style:{width:'100%',padding:12,border:'1px solid #9caf9e',borderRadius:10},required:true})),
 !entry?.checked?h('button',{type:'submit',style:{...buttonStyle,marginTop:12},disabled:!entry?.value?.trim()},'Check answer'):
 h('div',{role:'status',style:{marginTop:16,padding:16,background:'#eef3e9',borderRadius:12}},
 h('strong',null,`${entry.result.matched} / ${q.marks} marks · ${entry.result.status}`),
 correction.reason&&h('p',{style:{marginTop:8}},correction.reason),
 h('ul',{style:{margin:'12px 0',paddingLeft:20}},...q.answer.points.map((p,i)=>h('li',{key:i},`${entry.result.pointResults[i]?'✓ Awarded':'○ Missing'}: ${entry.result.pointLabels?.[i]||p.label}`))),
 h('p',null,h('strong',null,'Suggested answer: '),q.modelAnswer),h('p',{style:{marginTop:8}},h('strong',null,'Hint: '),q.hint),
 transfer&&h('button',{type:'button',style:{...buttonStyle,marginTop:12,marginRight:8},onClick:()=>setState(s=>({...s,ids:[...s.ids.slice(0,index+1),transfer.id,...s.ids.slice(index+1)],index:index+1,transferOf:{...s.transferOf,[transfer.id]:q.id}}))},'Try a different question on this idea'),
 h('button',{type:'button',style:{...buttonStyle,marginTop:16},onClick:()=>setState(s=>({...s,index:index+1}))},index===ids.length-1?'Finish practice':'Next question'))),
 finished&&h(SessionResult,{score:{firstPassCorrect:ids.reduce((n,id)=>n+(state.answers?.[id]?.result?.matched||0),0),percentage:Math.round(100*ids.reduce((n,id)=>n+(state.answers?.[id]?.result?.matched||0),0)/Math.max(1,ids.reduce((n,id)=>n+(bank.find(q=>q.id===id)?.marks||0),0)))},formalCount:ids.reduce((n,id)=>n+(bank.find(q=>q.id===id)?.marks||0),0),errors:{partial:ids.filter(id=>state.answers?.[id]?.result?.credit<1).length},marks:true,onAgain:()=>{setSettingsOpen(true);document.querySelector('[data-biology-settings]')?.scrollIntoView({block:'start'})},backHref:'/study/biology/'}),
 h('details',{'data-biology-references':true,open:referencesOpen,onToggle:e=>setReferencesOpen(e.currentTarget.open),style:{marginTop:24,borderTop:'1px solid #c9d2c5'}},
 h('summary',{style:{cursor:'pointer',minHeight:44,padding:'14px 0',fontWeight:600}},'Reference materials · official AQA papers & revision guide'),
 h(OfficialPaperPractice),
 h('p',{style:{marginTop:20}},h('a',{href:'/assessment/biology-cell-structure/'},'Revision guide & full question bank'), ' · ',h('a',{href:'/assessment/?subject=biology'},'Take the timed assessment'))));
}

function OfficialPaperPractice(){
 const sets=[
  {year:2022,questions:'03.1–03.5',pages:'14–17',marks:14,focus:'Onion-cell microscopy: risk assessment, slide preparation, magnification calculation, scientific drawing and electron microscopy.'},
  {year:2022,questions:'01.1–01.3 and 04.5',pages:'3 and 21',marks:6,focus:'Organelle functions, cells without chloroplasts and cell differentiation.'},
  {year:2023,questions:'03.3–03.7',pages:'14–15',marks:8,focus:'Aseptic technique, incubation temperature, a control disc and comparing inhibition zones.'},
  {year:2023,questions:'05.2 only',pages:'24–25',marks:3,focus:'Comparing a eukaryotic protist with a prokaryotic cell. Use Figure 7; size is excluded in this question.'}
 ];
 const url=(year,type)=>`https://filestore.aqa.org.uk/sample-papers-and-mark-schemes/${year}/june/AQA-84611H-${type}-JUN${String(year).slice(2)}.PDF`;
 return h('section',{style:{marginTop:28,borderTop:'1px solid #c9d2c5',paddingTop:20},'aria-label':'Official AQA past-paper practice'},
 h('h3',{className:'font-display text-2xl font-semibold'},'Official AQA past-paper practice'),
 h('p',{style:{margin:'8px 0 16px'}},'These are actual AQA 8461/1H questions, linked to the original papers. Answer the selected parts on paper, then use the official mark scheme. They are separate from the 72 original app questions and are not automatically marked here.'),
 ...sets.map(set=>h('article',{key:set.year+set.questions,style:{padding:16,marginBottom:12,background:'#f0f3e9',borderRadius:12}},
 h('h4',{style:{fontWeight:600}},`June ${set.year} · Paper 1 Higher · Q${set.questions} · ${set.marks} marks`),
 h('p',{style:{margin:'6px 0'}},set.focus),h('p',null,`Printed paper pages ${set.pages}. Only do the listed subquestions for this cell-structure revision.`),
 h('a',{href:url(set.year,'QP')+`#page=${set.pages.split('–')[0].split(' ')[0]}`,target:'_blank',rel:'noopener noreferrer',style:{display:'inline-block',marginTop:8,textDecoration:'underline'}},'Open official question paper'),
 h('details',{style:{marginTop:10}},h('summary',{style:{cursor:'pointer'}},'Finished? Open the official mark scheme'),h('a',{href:url(set.year,'MS'),target:'_blank',rel:'noopener noreferrer',style:{textDecoration:'underline'}},`AQA June ${set.year} mark scheme · find the same question numbers`)))));
}
