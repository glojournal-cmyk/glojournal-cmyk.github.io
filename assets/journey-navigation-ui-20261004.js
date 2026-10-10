import './mission-complete-v2-core-20261010.js?v=20261010-mission-v2';
import {dailyTaskGuidance} from "./daily-task-guidance-20261004.js?v=20261010-chem-marking1";
import './journey-navigation-20261004.js?v=20261010-chem-marking1';
import {i as interop,n as factory} from './jsx-runtime-Cltr0gcK.js';
import {C as store} from './index-BLVOhKhN.js?v=20261010-chem-marking1';
const R=interop(factory()),h=R.createElement,J=globalThis.LuxJourney;
const linkStyle={display:'inline-flex',alignItems:'center',minHeight:44,padding:'10px 18px',marginTop:12,borderRadius:24,background:'#173e50',color:'#fffdf6',textDecoration:'none'};
function useJourney(){const daily=store(s=>s.daily),today=store(s=>s.today),[revision,setRevision]=R.useState(0);R.useEffect(()=>{const update=()=>setRevision(n=>n+1);window.addEventListener('storage',update);window.addEventListener('scholar:session-saved',update);return()=>{window.removeEventListener('storage',update);window.removeEventListener('scholar:session-saved',update)}},[]);return {daily,today,revision}}
export function ResumeStudy(){const state=useJourney(),resume=J.resumeCandidates(state)[0],next=state.today===J.day()?(state.daily||[]).find(t=>t.progress<t.target&&J.safeHref(t.href)):null;return h('div',{'aria-label':'Continue saved study'},h('p',{className:'text-xs font-semibold tracking-[0.18em] text-navy uppercase'},resume?'Continue saved study':'Continue today’s journey'),h('p',{className:'mt-1 font-display text-2xl font-semibold'},resume?.title||next?.title||'Choose your next practice'),h('p',{className:'mt-1 text-sm text-muted'},resume?`Question ${resume.index+1} / ${resume.total} · your answers and place are saved.`:next?`${next.progress} / ${next.target} · next unfinished daily task.`:'No unfinished practice is saved on this device.'),h('a',{href:resume?.href||J.navigationHref(next?.href)||'/study/',style:linkStyle},resume?'Resume saved practice':next?'Start next task':'Browse subjects'))}
export function DailyNext({taskId,planDate}){
 const state=useJourney();
 const [skipAnimation,setSkipAnimation]=R.useState(false);
 const [celebrating,setCelebrating]=R.useState(false);
 const [checkCount,setCheckCount]=R.useState(0);
 // Read the persisted copy independently. A successful React state update
 // is NOT proof that the iPad actually stored the daily-task credit.
 const live=store.getState(),mission=globalThis.LuxMissionCompleteV2;
 const result=mission?.verify(live,location.href,taskId,planDate,J,
   typeof localStorage!=='undefined'?localStorage:null);
 const data=result?.data;
 const verified=!!result?.verified;
 const complete=verified&&result.state==='complete';
 const unfinished=verified&&result.state==='in-progress';
 const nextOK=complete&&mission?.isValidNext(data,J);
 const allComplete=complete&&data.total>0&&data.completed===data.total;
 const validDaily=!!data && (!planDate||planDate===J.day());
 const sessionKey=validDaily?'lux-mission-celebrated:'+live.today+':'+data.task.id:'';
 R.useEffect(()=>{
   if(!complete||!sessionKey||skipAnimation)return;
   let firstTime=true;
   try{
    if(sessionStorage.getItem(sessionKey))firstTime=false;
    else sessionStorage.setItem(sessionKey,'1');
   }catch{firstTime=false}
   if(!firstTime)return;
   setCelebrating(true);
   const finishAnimation=window.setTimeout(()=>setCelebrating(false),1600);
   if(store.getState()?.sound===true && typeof window!=='undefined' && window.AudioContext
     && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
    try{
     const context=new window.AudioContext(),osc=context.createOscillator(),
       gain=context.createGain(),now=context.currentTime;
     osc.type='sine';osc.frequency.setValueAtTime(740,now);
     osc.frequency.exponentialRampToValueAtTime(980,now+.14);
     gain.gain.setValueAtTime(.0001,now);
     gain.gain.exponentialRampToValueAtTime(.035,now+.02);
     gain.gain.exponentialRampToValueAtTime(.0001,now+.32);
     osc.connect(gain).connect(context.destination);
     osc.start(now);osc.stop(now+.34);
     osc.onended=()=>context.close().catch(()=>{});
    }catch{}
   }
   return ()=>window.clearTimeout(finishAnimation);
 },[complete,sessionKey,skipAnimation]);
 R.useEffect(()=>{
  if(complete)document.querySelector('[aria-label="Daily task progress"]')?.scrollIntoView({
   block:'start',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'
  });
 },[complete,sessionKey]);
 if(!validDaily)return null;
 const total=Math.max(0,Number(data.total)||0),completed=Math.min(total,Number(data.completed)||0);
 const remaining=Math.max(0,Number(data.remaining)||0);
 const heading=complete?'Mission Complete!':unfinished?'Practice saved · keep going':'Progress not verified yet';
 const sub=complete?'Saved and counted towards today’s tasks':
   unfinished?'Your progress is safely saved. The task still needs more answers.':
   'Your finished practice is on this page, but the saved daily credit could not be confirmed.';
 const title=data.task.title||'Today’s task';
 const href=nextOK?data.next.href:allComplete?'/':unfinished?J.navigationHref(data.task.href):'/';
 const action=nextOK?'Next mission · '+data.next.title:allComplete?'All tasks complete · return home':
   unfinished?'Continue this task':'Return to today’s journey';
 const stars=Array.from({length:total},(_,i)=>h('span',{
  key:i,className:i<completed?'is-lit':'',
  'aria-label':i<completed?'Task '+(i+1)+' counted':'Task '+(i+1)+' remaining'
 },i<completed?'✦':'✧'));
 return h('section',{
   'aria-label':'Daily task progress',role:'status',
   className:'lux-mission-v2'+(complete?' is-complete':!verified?' is-unverified':'')+
     (celebrating&&!skipAnimation?' is-celebrating':''),
   'data-mission-save-status':verified?'verified':'unverified',
   'data-mission-count':completed,
   'data-mission-task':data.task.id
  },
  h('p',{className:'lux-mission-eyebrow-v2'},'TODAY’S QUEST · '+title),
  h('h2',null,heading),
  h('p',{className:'lux-mission-message-v2'},sub),
  h('div',{className:'lux-mission-track-head-v2'},
    h('span',null,'Today’s Journey'),
    h('strong',null,String(completed)+' / '+String(total)+' tasks')
  ),
  h('progress',{'aria-label':'Today’s completed tasks',value:completed,max:Math.max(1,total)}),
  h('div',{className:'lux-mission-stars-v2','aria-label':completed+' of '+total+' quests complete'},...stars),
  h('p',{className:'lux-mission-save-v2'},h('span',{'aria-hidden':'true'},verified?'✓':'!'),
   verified?('Progress saved on this device · '+Math.min(Number(data.task.progress)||0,Number(data.task.target)||0)+
    ' / '+data.task.target+' for this mission'):
   'Save not verified. Keep this page open and check Backup history before leaving.'
  ),
  unfinished?h('p',{className:'lux-mission-message-v2'},remaining+' more needed to complete this mission.'):null,
  verified?h('a',{href:href||'/',className:'lux-mission-cta-v2'},
    action+' →'):h('button',{type:'button',className:'lux-mission-cta-v2',
     onClick:()=>setCheckCount(n=>n+1),'aria-label':'Check saved progress again'},
     'Check saved progress again'),
  h('div',{className:'lux-mission-subactions-v2'},
   h('a',{href:'/scholar/'},'Wardrobe & rewards'),
   h('a',{href:'/'},'Today’s journey'),
   celebrating&&!skipAnimation?h('button',{type:'button',
      onClick:()=>{setSkipAnimation(true);setCelebrating(false)}},'Skip animation'):null
  )
 );
}

export function ResumeAction(){const state=useJourney(),resume=J.resumeCandidates(state)[0],next=state.today===J.day()?(state.daily||[]).find(t=>t.progress<t.target&&J.safeHref(t.href)):null;return h('a',{href:resume?.href||J.navigationHref(next?.href)||'/study/','aria-label':resume?`Continue ${resume.title} · Question ${resume.index+1} / ${resume.total}`:next?`Start next task · ${next.title}`:'Browse subjects',className:'flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-2xl bg-navy px-2 py-3 text-card',style:{textAlign:'center'}},h('span',{className:'font-display text-lg leading-none'},resume?'Continue':next?'Next task':'Practise'),h('span',{className:'text-sm'},resume?.title||next?.title||'Browse subjects'),resume&&h('span',{className:'text-sm'},`Question ${resume.index+1} / ${resume.total}`))}

export function DailyTaskRow({task,daily}) {
 const info=dailyTaskGuidance(task,daily),done=info.remaining===0;
 return h('li',null,h('a',{href:J.navigationHref(task.href)||'/study/',className:'block rounded-lg p-2 hover:bg-sage'},
  h('div',{className:'flex items-center justify-between text-sm'},h('span',{className:'font-medium'},`${done?'✓ ':''}${task.id==='study-session'?'Daily study total':task.title}`),h('span',{className:'text-muted tabular-nums'},`${Math.min(task.progress,task.target)}/${task.target}`)),
  h('progress',{value:Math.min(task.progress,task.target),max:task.target,'aria-label':task.title,style:{display:'block',width:'100%',height:6,marginTop:6,accentColor:'#526b53'}}),
  h('p',{style:{margin:'8px 0 0',fontSize:13,lineHeight:1.45,color:'#53665d'}},info.rule),
  h('p',{style:{margin:'4px 0 0',fontSize:12,color:done?'#286354':'#183447'}},done?'Complete for today':`${info.remaining} ${info.unit} remaining`),
  info.shared.length?h('p',{style:{margin:'4px 0 0',fontSize:12,lineHeight:1.45,color:'#53665d'}},`Eligible answers also count towards: ${info.shared.join(' · ')}. Each task keeps its own target.`):null));
}
