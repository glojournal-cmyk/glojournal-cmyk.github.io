// Synthetic, read-only 30-day Mastery capacity stress test using 11 real bank files.
// NOT a simulation of this learner's actual state; no live scoring, storage, or full Daily 163-task engine.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {proposeTwoMasteryTopics} from '../src/lib/daily/mastery-capacity-picker-20261026.mjs';

const filenames=[
 'la-y8-case-role-introduction','bio-y8-mixed-exam','bio-y8-continuous-variation',
 'bio-y8-correlation','bio-y8-ber','bio-y8-dna-structure',
 'bio-y8-fats-cholesterol','bio-y8-genetic-disorders','bio-y8-nutrition-labels',
 'bio-y8-practical-conclusions','bio-y8-punnett-squares'
];
const pools=filenames.map((name,i)=>{
 const bank=JSON.parse(fs.readFileSync('content/topics/'+name+'.json','utf8'));
 return {topicId:bank.topicId,subject:bank.subject,year:bank.year,status:bank.status,
  taught:true,priority:filenames.length-i,questions:bank.questions};
});
const formalCount=pools.flatMap(p=>p.questions).filter(q=>q.status==='enabled'&&q.formal!==false&&!q._repair).length;
const dateOf=i=>new Date(Date.UTC(2026,9,26+i)).toISOString().slice(0,10);

test('30 successive dates preserve each prior success, never invent 20/20 on an exhausted Mastery pool',()=>{
 const seenCorrect={},used=new Set(),trace=[];
 for(let i=0;i<30;i++){
  const date=dateOf(i);
  const out=proposeTwoMasteryTopics(pools,{today:date,seenCorrect},date);
  if(out.status==='FULL_READY'){
   assert.equal(out.assignments.length,2);
   const ids=out.assignments.flatMap(a=>a.questionIds);
   assert.equal(ids.length,40,'both Mastery tasks must contain 20 questions');
   assert.equal(new Set(ids).size,40,'no duplicate questions within a day');
   for(const id of ids){
    assert.ok(!used.has(id),'past correct question repeated on a later date: '+id);
    used.add(id);seenCorrect[id]=1;
   }
   trace.push({date,status:out.status,assigned:40});
  } else {
   assert.ok(['NOT_READY','NEEDS_REVIEW'].includes(out.status),'must not invent completion');
   assert.equal(out.assignments,undefined,'no made-up completed assignment');
   trace.push({date,status:out.status,assigned:0,reason:out.reason});
  }
 }
 const fullDays=trace.filter(x=>x.status==='FULL_READY').length;
 const shortages=trace.filter(x=>x.status!=='FULL_READY').length;
 assert.equal(trace.length,30);
 assert.ok(fullDays>=1,'a new mock learner should initially have sufficient work');
 assert.ok(fullDays<=Math.floor(formalCount/40),'finite bank cannot support unlimited unique 40-question days');
 assert.ok(shortages>0,'these eleven finite topic banks cannot cover 30 days without repetitions');
 assert.equal(used.size,40*fullDays);
 console.log('SYNTHETIC_30_DAY_MASTERY '+JSON.stringify({days:30,sourceTopicFiles:pools.length,
  possibleFormalIDs:formalCount,fullDays,shortageDays:shortages,firstShortage:trace.find(x=>x.status!=='FULL_READY')?.date,
  caveat:'Not learner-specific, not all ten Daily tasks, not proof of real iPad grading or 163-slot release readiness'}));
});
