import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mistakeReviewTask,retainMistakeReview} from '../assets/mistake-review-plan-20261003.js';
import {selectDailyVocabulary} from '../assets/daily-vocab-20261003.js';
const fixed=retainMistakeReview({old:{subject:'latin',topicId:'la-y8-topic',wrong:true,lastWrong:'2026-10-01'}},'old','2026-10-03');
assert.equal(mistakeReviewTask({today:'2026-10-04',reviews:fixed}).reviewQuestionIds.length,0);
assert.deepEqual(mistakeReviewTask({today:'2026-10-10',reviews:fixed}).reviewQuestionIds,['old']);
assert.equal(mistakeReviewTask({today:'2026-10-11',reviews:retainMistakeReview(fixed,'old','2026-10-10')}).reviewQuestionIds.length,0);
assert.deepEqual(mistakeReviewTask({today:'2026-10-05',reviews:{old:{...fixed.old,wrong:true,lastWrong:'2026-10-04',due:'2026-10-06'}}}).reviewQuestionIds,['old']);
const items=['learned','unlearned'].map(topic=>({id:topic,topicId:topic,conceptId:'fr-y8-concept-vocab-'+topic,format:'typed_exact',answer:{accepted:['mot']}}));
assert.deepEqual(selectDailyVocabulary({subject:'french',day:'2026-10-03',items,topicLearning:{unlearned:false}}).map(q=>q.id),['learned']);
// Backup rotation and quota behaviour now live in the async IndexedDB vault.
// Do not exercise the former synchronous localStorage implementation here:
// the dedicated node:test suites execute the current production backup code.
const backup=fs.readFileSync('assets/daily-progress-save.js','utf8');
const vault=fs.readFileSync('assets/backup-vault-20261011.js','utf8');
assert.match(backup,/await readBackup\(AUTO_KEY\)/);
assert.match(backup,/await putBackup\(PREVIOUS_KEY,previous\)/);
assert.match(backup,/await putBackup\(AUTO_KEY,saved\)/);
assert.match(vault,/tx\.oncomplete/);
assert.match(vault,/again\.data!==saved\.data/);
const tracker=fs.readFileSync('assessment/app-v2.js','utf8');
const block=tracker.slice(tracker.indexOf('const SCHOOL_ASSESSMENTS='),tracker.indexOf('function tracker()'));
await import('../assets/school-revision-data-20261004.js');
const schools=new Function(block+';return SCHOOL_ASSESSMENTS;')();
assert.equal(schools.length,3);const schoolIds=new Set(JSON.parse(fs.readFileSync('content/school-update-20260926/delta.json','utf8')).topics.map(t=>t.topicId));for(const x of schools)for(const id of x.topics)assert.ok(fs.existsSync('content/topics/'+id+'.json')||schoolIds.has(id),id);
console.log('Priority four state QA passed: first-day mistakes, seven-day follow-up, learned-only vocabulary, vault backup hooks (covered by dedicated async regression), and every tracker topic exists.');
