import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadCandidateSources,selectPreview,audit} from '../scripts/year8-latin-composite-audit-20261101.mjs';
const m=JSON.parse(fs.readFileSync('content/year8-latin-composites-20261101.json','utf8'));
const sources=loadCandidateSources(m),rows=audit(m,sources);
assert.equal(m.year,8);
assert.equal(m.subject,'latin');
assert.equal(m.mode,'standalone-preview-no-progress-no-xp-no-mastery-credit');
assert.equal(m.groups.length,4);
assert.ok(m.groups.every(g=>g.learnerTaughtCheck===true));
const excluded=m.excludedUntilEvidence.map(x=>x.topicId);
assert.ok(excluded.includes('la-y8-pluperfect-recognition'));
assert.ok(!m.groups.some(g=>g.sourceTopics.some(t=>excluded.includes(t))));
for(const group of m.groups){
 const one=selectPreview(group,sources,{limit:15});
 assert.equal(one.filled,15,group.id);
 assert.equal(new Set(one.questionRefs.map(q=>q.id)).size,15,'no repeated IDs '+group.id);
 assert.equal(new Set(one.questionRefs.map(q=>q.conceptId)).size,15,'no repeated concepts '+group.id);
 assert.ok(one.questionRefs.every(q=>group.sourceTopics.includes(q.topicId)),'wrong source '+group.id);
 const two=selectPreview(group,sources,{limit:15,excludedIds:one.questionRefs.map(q=>q.id),
            excludedConcepts:one.questionRefs.map(q=>q.conceptId)});
 assert.equal(two.questionRefs.some(q=>one.questionRefs.some(old=>old.id===q.id)),false,'historical correct ID repeated '+group.id);
 assert.equal(two.questionRefs.some(q=>one.questionRefs.some(old=>old.conceptId===q.conceptId)),false,'historical correct concept repeated '+group.id);
 const blocked=selectPreview(group,sources,{limit:15,excludedIds:Object.values(sources).flat().map(q=>q.id)});
 assert.equal(blocked.filled,0,'exhausted source must NOT fake completion '+group.id);
 assert.equal(blocked.shortfall,15,group.id);
}
console.log('PASS: four source-preserving Year 8 Latin synthetic preview composites; no automatic Daily/Mastery rewards.');
console.table(rows.map(x=>({group:x.id,original:x.sourceEligible,independent:x.independentlyAnswered,concepts:x.uniqueSourceConcepts,preview:x.samplePreviewFilled})));
