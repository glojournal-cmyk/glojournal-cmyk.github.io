import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {diagnoseTaskQuestionEligibility,diagnoseDailyCapacity} from '../src/lib/daily/question-eligibility-diagnostics-20261026.mjs';
const read=n=>JSON.parse(fs.readFileSync('content/topics/'+n+'.json','utf8'));
const day='2026-10-26';
const task=(id,questions,target=20,mode='mastery')=>({id,subject:'biology',year:8,target,mode,questions});
test('BER with 20 enabled entries is only 11-eligible after nine historical successes',()=>{
 const bank=read('bio-y8-ber');
 const solved=Object.fromEntries(bank.questions.slice(0,9).map(q=>[q.id,1]));
 const r=diagnoseTaskQuestionEligibility(task('ber',bank.questions),bank.questions,{seenCorrect:solved,today:day},day);
 assert.equal(r.nominal,20);assert.equal(r.eligible,11);assert.equal(r.shortage,9);
 assert.equal(r.reasons.previously_correct,9);
});
test('same-day two 15-question tasks cannot double claim one 20-question topic',()=>{
 const questions=read('bio-y8-correlation').questions;
 const t=[task('a',questions,15,'standard'),task('b',questions,15,'standard')];
 const r=diagnoseDailyCapacity(t,{today:day},day);
 assert.equal(r.requested,30);assert.equal(r.assigned,19);assert.equal(r.shortfall,11);
 // Of 20 nominal questions, one chart-display item is deliberately formal:false.
 assert.equal(new Set(r.assignments.flatMap(row=>row.questionIds)).size,19);
});
test('retention with zero historical questions never silently becomes new-questions practice',()=>{
 const qs=read('bio-y8-continuous-variation').questions;
 const r=diagnoseTaskQuestionEligibility(task('retention',qs,10,'retention'),qs,{today:day},day);
 assert.equal(r.eligible,0);assert.equal(r.shortage,10);
 assert.equal(r.reasons.no_prior_attempt,19); // One enabled bank question is deliberately formal:false.
 assert.equal(r.reasons.disabled_preview_or_informal,1);
});
test('retention admits ONLY previously marked questions from an earlier date',()=>{
 const qs=read('bio-y8-continuous-variation').questions;
 const log=qs.slice(0,8).map(q=>({questionId:q.id,day:'2026-10-24',correct:true,formal:true}));
 log.push({questionId:qs[8].id,day,correct:false,formal:true});
 const r=diagnoseTaskQuestionEligibility(task('retention',qs,10,'retention'),qs,{today:day,formalAttemptLog:log},day);
 assert.equal(r.eligible,8);assert.equal(r.shortage,2);
});
test('review due date excludes not-yet-due questions',()=>{
 const q=read('bio-y8-correlation').questions[0];
 const r=diagnoseTaskQuestionEligibility(task('due',[q],1,'due'),[q],{
 today:day,formalAttemptLog:[{questionId:q.id,day:'2026-10-22',correct:false,formal:true}],
 reviews:{[q.id]:{due:'2026-10-29'}}
 },day);
 assert.equal(r.eligible,0);assert.equal(r.reasons.not_due,1);
});
test('GCSE one-, two-, three-mark candidate counts show explicit missing tiers',()=>{
 const q=JSON.parse(fs.readFileSync('content/exam-practice/gcse-20261024.json','utf8')).questions
  .map(x=>({...x,status:'enabled',format:x.kind}));
 const tasks=[1,2,3].map(m=>({id:'gcse-'+m,target:1,mode:'standard',requiredMarks:m,questions:q}));
 const report=diagnoseDailyCapacity(tasks,{today:day},day);
 assert.equal(report.rows[0].eligible,0);assert.equal(report.rows[1].eligible,0);
 assert.ok(report.rows[2].eligible>0);assert.equal(report.shortfall,2);
});

test('correct answers cannot be reallocated to make two partly completed Standard tasks look finished',()=>{
 const qs=read('bio-y8-correlation').questions;
 const formal=qs.filter(q=>q.status==='enabled'&&q.formal!==false&&!q._repair);
 const solved=Object.fromEntries(formal.slice(0,8).map(q=>[q.id,1]));
 const tasks=[task('standard-one',qs,10,'standard'),task('standard-two',qs,10,'standard')];
 const r=diagnoseDailyCapacity(tasks,{today:day,seenCorrect:solved},day);
 assert.equal(r.requested,20);
 assert.equal(r.assigned,formal.length-8);
 assert.equal(r.shortfall,20-(formal.length-8));
 assert.ok(r.rows.every(row=>row.allocatedShortfall>=0));
 const credited=new Set(Object.keys(solved));
 assert.ok(r.assignments.flatMap(row=>row.questionIds).every(id=>!credited.has(id)));
 assert.equal(new Set(r.assignments.flatMap(row=>row.questionIds)).size,r.assigned);
});
test('no previously correct questions are resurrected after a fresh bank is exhausted',()=>{
 const qs=read('bio-y8-ber').questions;
 const solved=Object.fromEntries(qs.map(q=>[q.id,1]));
 const r=diagnoseDailyCapacity([task('mastery',qs,20) ],{today:day,seenCorrect:solved},day);
 assert.equal(r.status,'PARTIAL_READY');
 assert.equal(r.assigned,0);assert.equal(r.shortfall,20);
 assert.deepEqual(r.assignments[0].questionIds,[]);
});
