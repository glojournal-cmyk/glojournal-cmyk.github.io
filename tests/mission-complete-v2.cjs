'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=p=>fs.readFileSync(path.join(root,p),'utf8');
const day='2026-10-10';
function fixture(){
 const storage=new Map(),read={getItem:k=>storage.get(k)??null};
 const globals=vm.createContext({});
 vm.runInContext(source('assets/mission-complete-v2-core-20261010.js'),globals);
 const core=globals.LuxMissionCompleteV2;
 const task=(id,progress,target=10)=>({id,title:id,href:'/study/latin/practise/?daily=1&task='+id,
   progress,target});
 const make=(p=10,q=0,xp=50)=>({today:day,xp,daily:[task('latin-vocab',p),task('french-vocab',q)]});
 const journey={
   day:()=>day,
   withReviewCredits:s=>s,
   safeHref:href=>/^\/(?:study|assessment|garden|play)\//.test(href),
   completion(s,_href,id){
     if(s.today!==day)return null;
     const t=s.daily.find(x=>x.id===id);if(!t)return null;
     const next=s.daily.find(x=>x.id!==id && x.progress<x.target);
     return {task:t,done:t.progress>=t.target,completed:s.daily.filter(x=>x.progress>=x.target).length,
       total:s.daily.length,next,remaining:Math.max(0,t.target-t.progress)};
   }
 };
 const save=s=>storage.set('lux-scholar-garden-v1',JSON.stringify({state:s,version:10}));
 const verify=(state,planDate=day)=>core.verify(state,'/study/latin/practise/?daily=1',
   'latin-vocab',planDate,journey,read);
 return {core,storage,save,verify,make,journey};
}
test('mission complete requires a written and verified daily credit, not just memory',()=>{
 const f=fixture(),state=f.make(10,0,50);
 assert.equal(f.verify(state).verified,false);
 assert.equal(f.verify(state).state,'unverified');
 f.save(f.make(9,0,50));
 assert.equal(f.verify(state).verified,false);
 f.save(state);
 const result=f.verify(state);
 assert.equal(result.state,'complete');
 assert.equal(result.verified,true);
 assert.equal(result.data.completed,1);
 assert.equal(f.core.isValidNext(result.data,f.journey),true);
 assert.equal(result.data.next.id,'french-vocab');
});
test('a failed/partial save, damaged JSON and stale day never claim completion',()=>{
 const f=fixture(),s=f.make(10,0,70);
 f.storage.set('lux-scholar-garden-v1','broken json');
 assert.equal(f.verify(s).state,'unverified');
 f.save(f.make(10,0,50)); // XP from memory is not persisted
 assert.equal(f.verify(s).verified,false);
 f.save({...s,today:'2026-10-09'});
 assert.equal(f.verify(s).verified,false);
 f.save(s);
 assert.equal(f.verify(s,'2026-10-09').state,'expired');
});
test('partial target credit stays in-progress with a correct remaining count',()=>{
 const f=fixture(),s=f.make(4,0,45);
 f.save(s);const a=f.verify(s);
 assert.equal(a.state,'in-progress');
 assert.equal(a.verified,true);
 assert.equal(a.data.remaining,6);
});
test('next mission must be validated, not just chosen from a duplicated or completed task',()=>{
 const f=fixture(),s=f.make(10,0,50);f.save(s);
 const d=f.verify(s).data;
 assert.equal(f.core.isValidNext(d,f.journey),true);
 assert.equal(f.core.isValidNext({...d,next:{...d.next,id:d.task.id}},f.journey),false);
 assert.equal(f.core.isValidNext({...d,next:{...d.next,progress:10}},f.journey),false);
 assert.equal(f.core.isValidNext({...d,next:{...d.next,href:'https://bad.example'}} ,f.journey),false);
 assert.equal(f.core.isValidNext({...d,next:null},f.journey),false);
});
test('reward readout uses XP already earned and does not write any new XP',()=>{
 const f=fixture();
 assert.equal(f.core.rewardLabel(21.7),'+21 XP');
 assert.equal(f.core.rewardLabel(0),'No additional XP');
 assert.equal(f.core.rewardLabel(-2),'No additional XP');
 assert.equal(f.storage.size,0);
 const helper=source('assets/mission-complete-v2-core-20261010.js');
 const ui=source('assets/journey-navigation-ui-20261004.js');
 const result=source('assets/session-reflection-20261004.js');
 assert.doesNotMatch(helper,/\.setItem\s*\(/);
 assert.doesNotMatch(ui,/\.award\s*\(|\.bumpDaily\s*\(|\.setState\s*\(/);
 assert.doesNotMatch(result,/\.award\s*\(|\.bumpDaily\s*\(|\.setState\s*\(/);
 assert.match(ui,/data-mission-save-status/);
 assert.match(result,/data-session-xp/);
});
test('all six school subject practice routes include mission styling and updated app',()=>{
 for(const subject of ['latin','french','biology','chemistry','physics','english']){
  const html=source('study/'+subject+'/practise/index.html');
  assert.match(html,/mission-complete-v2-20261010\.css/);
  assert.match(html,/index-BLVOhKhN\.js\?v=20261010-chem-marking1/);
 }
 const home=source('index.html');
 assert.doesNotMatch(home,/mission-complete-v2-20261010\.css/,'Home unaffected');
 const bundle=source('assets/index-BLVOhKhN.core.js');
 assert.match(bundle,/study\._subject\.practise-D_PWgUd7\.js\?v=20261010-mission-v2/);
 assert.match(source('assets/quiz-session-y8fix-20260920.js'),
   /session-reflection-20261004\.js\?v=20261010-mission-v2/);
 assert.match(source('assets/quiz-session-rWAnuDVj.js'),
   /journey-navigation-ui-20261004\.js\?v=20261010-mission-v2/);
});
