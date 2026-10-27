import test from 'node:test';
import assert from 'node:assert/strict';
import {auditV2Year9Topic,summarizeV2Year9Staging} from '../src/garden-v2/year9-staging-audit.mjs';
const makeTopic=(code)=>({schema:'garden-v2-year9-mastery-staging-v1',topicCode:code,year:9,publicationStatus:'draft_not_live',questions:Array.from({length:30},(_,i)=>({sourceQuestionId:code+'.'+String(i+1).padStart(2,'0'),prompt:'Question '+code+' '+i,maxMarks:2,markPointCount:2,markScheme:['method','answer'],format:'constructed_response',markingMode:'manual_rubric',status:code==='M4'&&i===28?'blocked_academic_error':'needs_academic_review'}))});
test('all 33 draft topic groups pass staging structure while remaining unavailable for play',()=>{
 const topics=Object.entries({M:5,C:6,B:6,P:7,F:7,L:2}).flatMap(([prefix,n])=>Array.from({length:n},(_,i)=>makeTopic(prefix+(i+1))));
 const result=summarizeV2Year9Staging(topics);
 assert.deepEqual(result.errors,[]);
 assert.equal(result.questionCount,990);
 assert.equal(result.topicCount,33);
 assert.ok(topics.every(t=>t.publicationStatus==='draft_not_live'));
});
test('detect missing rubric and unapproved enabled question',()=>{
 const topic=makeTopic('B1');topic.questions[0].markScheme=['answer'];
 topic.questions[1].status='enabled';
 const a=auditV2Year9Topic(topic);
 assert.equal(a.ok,false);
 assert.ok(a.errors.some(x=>x.startsWith('rubric:')));
 assert.ok(a.errors.some(x=>x.startsWith('status:')));
});
test('cannot accidentally remove M4.29 block in collection summary',()=>{
 const topics=Object.entries({M:5,C:6,B:6,P:7,F:7,L:2}).flatMap(([p,n])=>Array.from({length:n},(_,i)=>makeTopic(p+(i+1))));
 topics.find(t=>t.topicCode==='M4').questions[28].status='needs_academic_review';
 assert.ok(summarizeV2Year9Staging(topics).errors.includes('m4_29_not_blocked'));
});
