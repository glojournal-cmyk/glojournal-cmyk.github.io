import fs from 'node:fs';
import assert from 'node:assert/strict';
import {gradeLatinOctober} from '../assets/latin-october-native-grade.js';
import {directoryGroups,topicKinds} from '../assets/topic-directory-data-20261003.js';
const bank=JSON.parse(fs.readFileSync('assessment/latin-oct17-20261017.json'));
const cat=JSON.parse(fs.readFileSync('content/catalog.json'));
const topics=cat.topics.filter(t=>t.sourceId==='latin-oct17-teaching-pack');assert.equal(topics.length,8);
const packs=topics.map(t=>JSON.parse(fs.readFileSync(`content/topics/${t.topicId}.json`)));
const all=packs.flatMap(p=>p.questions);assert.equal(all.length,274);assert.equal(new Set(all.map(q=>q.id)).size,274);
for(const p of packs){const meta=topics.find(t=>t.topicId===p.topicId);assert.equal(meta.enabled,p.questions.length);assert.equal(p.year,9);assert(p.note.summary.length>=3);assert(p.note.quickCheck.length>=3);for(const section of p.note.additionalSourceSections)assert(section.heading&&section.body)}
for(const q of all){const original=bank.questions.find(r=>r.id===q.id);assert.deepEqual(q.latinOctober,original);assert.equal(q.topicId,'la-y9-oct17-'+original.topicId);assert.equal(q.answer.totalMarks,original.marks);assert.deepEqual(q.answer.markPoints,original.markingScheme.points.map(p=>p.label));for(const value of q.answer.accepted){const result=gradeLatinOctober(q,value);assert(result.ok,q.id);assert.equal(result.score,original.marks);assert.equal(result.total,original.marks)}assert(!gradeLatinOctober(q,'not '+q.answer.accepted[0]).ok);if(original.passageId){const passage=bank.passages[original.passageId];for(const line of passage.lines)assert(q.stimulus.text.includes(line));assert(q.stimulus.text.includes('Vocabulary:'))}}
const groups=directoryGroups(topics,{query:'October'});assert.equal(groups.length,3);assert.equal(groups.find(g=>g.name==='October lessons · Six topics').topics.length,6);assert.equal(groups.reduce((n,g)=>n+g.enabled,0),274);
for(const t of topics.filter(t=>/horse|creusa|journey/.test(t.topicId)))assert(topicKinds(t).includes('reading'));
const open=all.find(q=>q.latinOctober.type==='evidence');assert(gradeLatinOctober(open,'A valid alternative requires rubric review').needsReview);
const form=all.find(q=>q.latinOctober.type==='form');assert(!gradeLatinOctober(form,'wrong form').needsReview);assert(!gradeLatinOctober(form,'wrong form').ok);
const regular=all.find(q=>q.latinOctober.modelAnswer==='Romani vias aedificare poterant.');assert(gradeLatinOctober(regular,'Romani poterant vias aedificare').ok);assert(!gradeLatinOctober(regular,'Romani possunt vias aedificare').ok);
const session=fs.readFileSync('assets/quiz-session-y8fix-20260920.js','utf8');assert(session.includes('if(e.latinOctober)return gradeLatinOctober(e,t)'));assert(session.includes('if(n.needsReview){K({...n,given:t,needsReview:true});return}'));assert(session.includes('formal:false,selfAssessed:true'));
console.log('LATIN_STUDY_NATIVE_QA passed: 8 catalog topics / 6 lesson topics; all 274 questions and rubrics intact; native grade variants, strict morphology, pending review and no self-assessed formal credit.');
