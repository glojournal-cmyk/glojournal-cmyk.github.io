import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const runtime=readFileSync(new URL('../assets/index-BLVOhKhN.js',import.meta.url),'utf8');
const from=runtime.indexOf('function recordDailyVocabAttempt(');
const until=runtime.indexOf('function patchedRecordSpelling(',from);
assert.ok(from>0&&until>from,'test must exercise original live Recovery recording function');
const source=runtime.slice(from,until);

const today='2026-10-30',missed='2026-10-29';
function create({date=missed,baseline=0,priorProof=null}={}){
 const tasks=[{id:'french-vocab',target:30,progress:baseline,done:false},
  ...Array.from({length:9},(_,i)=>({id:'other-'+i,target:1,progress:1,done:true}))];
 let current={today,dailyVocabByDay:{[today]:{french:{items:{'today-safe':true}}}},
  dailyLog:{[date]:{date,tasks,done:9,total:10,complete:false}},
  recoveryVocabByDay:priorProof?{[date]:{french:priorProof}}:{},
  recoveryAwarded:{},recoveryTaskByDay:{}};
 const receipts=[],awards=[];
 const store={getState(){return current;},setState(patch){current={...current,...patch};}};
 const window={location:{search:'?recover='+date}};
 const findRecoveryVocabSource=(state,key,subject)=>{
  const all=state.dailyLog?.[key]?.tasks||[];
  return {task:all.find(x=>x.id===subject+'-vocab'),tasks:all};
 };
 const fn=new Function('store','todayKey','window','findRecoveryVocabSource',
   'saveRecoveryReceipt','originalAward','scheduleNormalizeState',
   'originalBumpDaily','dailyVocabTotal','URLSearchParams','Date',
   source+';return recordDailyVocabAttempt;')(
    store,()=>today,window,findRecoveryVocabSource,x=>receipts.push(x),
    (...args)=>awards.push(args),()=>{},()=>{},()=>{},URLSearchParams,Date);
 return {record:(id,correct=true,concept=id)=>fn('french',id,correct,{},concept),
  state:()=>current,receipts,awards};
}
test('new 48h Recovery requires 35 distinct correct concepts, not the old 30',()=>{
 const s=create();
 for(let i=0;i<34;i++)s.record('q'+i);
 assert.equal(s.state().recoveryVocabByDay[missed].french.totalNeeded,35);
 assert.equal(s.state().recoveryVocabByDay[missed].french.completed,false);
 assert.equal(s.awards.length,0);
 assert.equal(s.state().dailyLog[missed].tasks[0].progress,0);
 s.record('q-variant-duplicate',true,'q0');
 assert.equal(s.state().recoveryVocabByDay[missed].french.completed,false,
  'same vocabulary concept from different question cannot earn another Recovery credit');
 s.record('q34');
 assert.equal(s.state().recoveryVocabByDay[missed].french.completed,true);
 assert.equal(s.state().dailyLog[missed].tasks[0].progress,30);
 assert.equal(s.state().dailyLog[missed].tasks[0].done,true);
 assert.equal(s.awards.length,1);
 assert.equal(s.state().dailyVocabByDay[today].french.items['today-safe'],true);
 assert.equal(Object.keys(s.state().dailyVocabByDay[today].french.items).length,1,
  'yesterday Recovery must not credit today's vocabulary');
 s.record('q34',true,'q34');
 assert.equal(s.awards.length,1,'replay never duplicates XP');
});
test('a partly finished missed-day vocab task requires only remaining 30 plus five correct',()=>{
 const s=create({baseline:28});
 for(let i=0;i<6;i++)s.record('next'+i);
 assert.equal(s.state().recoveryVocabByDay[missed].french.totalNeeded,7);
 assert.equal(s.state().recoveryVocabByDay[missed].french.completed,false);
 s.record('next6');
 assert.equal(s.state().recoveryVocabByDay[missed].french.completed,true);
 assert.equal(s.awards.length,1);
});
test('saved legacy 30-answer Recovery target is not retroactively increased',()=>{
 const s=create({priorProof:{originalCount:0,totalNeeded:30,items:{},completed:false}});
 for(let i=0;i<30;i++)s.record('old'+i);
 assert.equal(s.state().recoveryVocabByDay[missed].french.totalNeeded,30);
 assert.equal(s.state().recoveryVocabByDay[missed].french.completed,true);
 assert.equal(s.awards.length,1);
});
test('recovery date outside 48-hour window is rejected without any progress or awards',()=>{
 const s=create({date:'2026-10-26'});
 const before=JSON.stringify(s.state());
 s.record('late');
 assert.equal(JSON.stringify(s.state()),before);
 assert.equal(s.awards.length,0);
});
test('wrong answers are stored but never count toward 35-correct Recovery threshold',()=>{
 const s=create();
 for(let i=0;i<34;i++)s.record('q'+i);
 s.record('wrong-answer',false);
 assert.equal(s.state().recoveryVocabByDay[missed].french.completed,false);
 s.record('wrong-answer',true);
 assert.equal(s.state().recoveryVocabByDay[missed].french.completed,true);
 assert.equal(s.awards.length,1);
});
