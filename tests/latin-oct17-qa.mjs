import fs from 'node:fs';
import assert from 'node:assert/strict';
import {modelMatch,selectQuestions} from '../assets/latin-oct17-bank.js';
const b=JSON.parse(fs.readFileSync('assessment/latin-oct17-20261017.json','utf8'));
assert.equal(b.questions.length,274);assert.equal(b.questions.filter(q=>!q.optional).length,182);
assert.equal(new Set(b.questions.map(q=>q.id)).size,b.questions.length);
for(const t of b.topics)assert.equal(t.count,b.questions.filter(q=>q.topicId===t.id).length);
for(const q of b.questions){assert(q.prompt&&q.modelAnswer&&q.explanation&&q.sourceIds.length,q.id);assert.equal(q.marks,q.markingScheme.points.reduce((n,p)=>n+p.marks,0));assert(q.answer.accepted.length);assert(modelMatch(q,q.modelAnswer),q.id+' model must score');assert(modelMatch(q,'  '+q.modelAnswer.toUpperCase()+'!  '),q.id+' harmless normalization');assert(!modelMatch(q,'not '+q.modelAnswer),q.id+' added contradiction');if(q.passageId)assert(b.passages[q.passageId],q.id)}
for(let n=0;n<500;n++){const set=selectQuestions(b,'all',10);assert.equal(set.length,10);assert.equal(new Set(set.map(q=>q.id)).size,10);assert.equal(new Set(set.map(q=>q.topicId)).size,7);assert(!set.some(q=>q.optional));const next=selectQuestions(b,'all',10,set.map(q=>q.id));assert(!next.some(q=>set.some(p=>p.id===q.id)));}
assert.equal(selectQuestions(b,'support',10).filter(q=>q.optional).length,10);
const q=b.questions.find(q=>q.modelAnswer==='Romani vias aedificare poterant.');assert(modelMatch(q,'Poterant Romani aedificare vias'));assert(!modelMatch(q,'Romani vias aedificare possunt'));assert(!modelMatch(q,'Romani vias non aedificare poterant'));assert(!modelMatch(q,'Romani via aedificare poterant'));
const grammar=b.questions.find(q=>q.modelAnswer==='laeta'&&q.prompt.includes('feminine ablative singular'));assert(modelMatch(grammar,'laetā'));assert(!modelMatch(grammar,'laetae'));
for(const text of ['Neuter plural nominative or accusative.','Neuter singular dative or ablative.','Masculine nominative plural or masculine genitive singular.'])assert(b.questions.some(q=>q.modelAnswer===text));
assert.equal(b.questions.filter(q=>q.topicId==='vocabulary'&&q.type==='vocabulary').length,24);assert.equal(b.questions.filter(q=>q.topicId==='support').length,92);
console.log('LATIN_OCT17_QA: 274 complete questions; 500 balanced non-repeating selections; all models, normalization, Latin word order, ambiguity and negative cases passed.');
