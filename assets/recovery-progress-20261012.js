import {recoveryReplay} from './recovery-session-20261012.js?ux=20261013-corrections2';
import {i as interop,n as factory} from './jsx-runtime-Cltr0gcK.js?ux=20261013-corrections2';
import {C as store} from './index-BLVOhKhN.js?v=20261018-vocab6&ux=20261013-corrections2';
const R=interop(factory()),h=R.createElement;
const labels={'study-session':'Focused study','adaptive-focus':'Subject focus',
 'y8-practise':'Foundation practice','y8-mastery':'Mastery review',
 'year8-long-review':'Year 8 practice + mastery','mistake-review':'Previous mistakes'};
export function RecoveryProgress({subject,date}){
 const taskId=new URLSearchParams(location.search).get('task')||subject+'-vocab';
 const isVocab=taskId==='french-vocab'||taskId==='latin-vocab';
 const proof=store(s=>isVocab?s.recoveryVocabByDay?.[date]?.[subject]:s.recoveryTaskByDay?.[date]?.[taskId]);
 const day=store(s=>s.dailyLog?.[date]);
 const historical=day?.tasks?.find(t=>t.id===taskId);
 const baseline=Math.max(0,Number(proof?.originalCount??(historical?.progress||0))||0);
 const target=Math.max(1,Number(proof?.totalNeeded)||Math.max(1,(Number(historical?.target)||(isVocab?30:1))-baseline));
 const answers=isVocab||taskId==='mistake-review'
  ?Object.values(proof?.items||{}).filter(Boolean).length:Object.keys(proof?.items||{}).length;
 const count=Math.min(target,answers);
 const done=proof?.completed===true||historical?.done===true;
 const remaining=Math.max(0,target-count);
 const href=recoveryReplay(location.href);
 const otherId=taskId==='study-session'?'adaptive-focus':taskId==='adaptive-focus'?'study-session':null;
 const other=day?.tasks?.find(t=>t.id===otherId);
 return h('section',{'aria-label':'Recovery progress',role:'status',style:{padding:16,border:'1px solid #c6b485',borderRadius:16}},
  h('h2',null,(done?'Recovery complete · ':'Recovery · ')+date),
  h('p',null,labels[taskId]||(isVocab?subject+' vocabulary':taskId)),
  h('p',null,done?'Credited to '+date+' · today’s tasks remain separate':count+' / '+target+' marked answers · '+remaining+' more needed for '+date),
  other?h('p',null,(labels[otherId]||otherId)+': '+(other.progress||0)+' / '+other.target+(other.done?' ✓':'')):null,
  !done&&remaining>0?h('a',{href,style:{display:'inline-flex',minHeight:44,alignItems:'center',marginRight:16}},'Continue recovery · '+remaining+' remaining'):null,
  h('a',{href:'/',style:{display:'inline-flex',minHeight:44,alignItems:'center'}},'Choose another recovery date →'));
}
