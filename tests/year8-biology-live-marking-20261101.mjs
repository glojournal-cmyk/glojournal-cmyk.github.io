import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const bundles=['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js'];
const ids=['bio-y8-ber','bio-y8-continuous-variation','bio-y8-correlation','bio-y8-mixed-exam',
  'bio-y8-nutrition-labels','bio-y8-practical-conclusions','bio-y8-limiting-factors'];
const source=p=>fs.readFileSync(p,'utf8');
function fullGrader(p){
 const c=source(p),start=c.indexOf('function A(e){'),end=c.indexOf('function V(e){',start);
 assert.ok(start>0&&end>start,'Cannot extract actual scorer in '+p);
 const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
   .toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
 const keep=value=>String(value??'').normalize('NFC').trim().replace(/\s+/g,' ');
 return new Function('a','d','x',c.slice(start,end)+';return B;')(normalize,normalize,keep);
}
const allGraders=bundles.map(p=>({path:p,grade:fullGrader(p)})),failures=[],softWarnings=[];
const fail=(id,msg,ctx)=>failures.push({id,issue:msg,ctx});
const note=(id,msg,ctx)=>softWarnings.push({id,issue:msg,ctx});
let newlyAuthored=0,calcCount=0,rubrics=0,typed=0,checks=0;
for(const id of ids){
 const p='content/topics/'+id+'.json',bank=JSON.parse(source(p));
 const original=JSON.parse(execFileSync('git',['show','origin/main:'+p],{encoding:'utf8',maxBuffer:5000000}));
 assert.deepEqual(bank.questions.slice(0,original.questions.length),original.questions,'legacy items changed '+id);
 for(const q of bank.questions.slice(original.questions.length)){
  newlyAuthored++;
  for(const {path,grade} of allGraders){
    try{
     if(q.format==='calculation'&&typeof q.answer?.value==='number'){
       const a=q.answer,u=a.units||[];
       const expected=a.value+' '+u[0],result=grade(q,expected,'biology',{});
       checks++;if(!result.ok||result.score!==1)fail(q.id,'canonical numeric not accepted',{path,expected,result});
       for(const unit of u){
        const alias=a.value+' '+unit,g=grade(q,alias,'biology',{});
        checks++;if(!g.ok||g.score!==1)fail(q.id,'advertised numeric unit rejected',{path,alias,g});
       }
       const wrong=(a.value+(Number(a.tolerance)||0)+1)+' '+u[0],bad=grade(q,wrong,'biology',{});
       checks++;if(bad.ok)fail(q.id,'wrong numerical value accepted',{path,wrong,bad});
       if(!u.includes('kg')&&!u.includes('kJ')) {
         const mismatched=grade(q,a.value+' kg','biology',{});
         checks++;if(mismatched.ok)fail(q.id,'unlisted wrong unit accepted',{path,mismatched});
       }
       calcCount++;
     }else if(q.answer?.markPoints?.length){
       const a=q.answer,model=a.modelAnswer||a.markPoints.join('. ');
       const g=grade(q,model,'biology',{});
       checks++;if(g.score!==a.markPoints.length)fail(q.id,'model rubric cannot earn full points',{path,model,score:g.score,total:a.markPoints.length});
       for(const point of a.markPoints){
        const one=grade(q,point,'biology',{});
        checks++;if(one.score<1)note(q.id,'single published mark point not independently recognised',{path,point,score:one.score});
       }
       rubrics++;
     }else if(q.answer?.accepted?.length){
       for(const accepted of q.answer.accepted){
         const g=grade(q,accepted,'biology',{});
         checks++;if(!g.ok)fail(q.id,'listed acceptable answer rejected by actual scorer',{path,accepted,g});
       }
       typed++;
     }else fail(q.id,'unhandled answer mode',{path,mode:q.answer?.mode,format:q.format});
    }catch(e){fail(q.id,'grader threw',{path,error:String(e)});}
  }
 }
}
const report={bundles:bundles.length,topics:ids.length,newRecords:newlyAuthored,checks,calcCount,rubrics,typed,
 failures,softWarnings,meaning:'Static scorer replay of model/accepted/wrong numerical answers; NOT full natural-language semantic certification'};
fs.mkdirSync('test-results',{recursive:true});
fs.writeFileSync('test-results/year8-biology-live-marking-20261101.json',JSON.stringify(report,null,2)+'\n');
console.log('YEAR8_BIOLOGY_LIVE_MARKING',JSON.stringify({...report,failures:failures.slice(0,15),softWarnings:softWarnings.slice(0,15)}));
if(failures.length)process.exitCode=1;
