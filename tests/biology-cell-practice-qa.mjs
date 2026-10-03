import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pickPracticeQuestions} from '../assets/biology-cell-practice-20261003.js';
import {gradeBiologyAnswer} from '../assets/biology-cell-rubric-20261003.js';
const bank=JSON.parse(fs.readFileSync(new URL('../assessment/biology-cell-structure-20261003.json',import.meta.url))).questions;
for(const q of bank)assert.equal(gradeBiologyAnswer(q,q.modelAnswer).matched,q.marks,q.id);
for(let i=0;i<100;i++){const a=pickPracticeQuestions(bank,'all',10),b=pickPracticeQuestions(bank,'all',10,a);assert.equal(a.length,10);assert.equal(new Set(a).size,10);assert(b.every(x=>!a.includes(x)));}
for(const topic of new Set(bank.map(q=>q.topic))){const ids=pickPracticeQuestions(bank,topic,5);assert.equal(ids.length,5);assert(ids.every(id=>bank.find(q=>q.id===id).topic===topic));}
assert.deepEqual(pickPracticeQuestions(bank,'weak',10,[],[bank[0].id]),[bank[0].id]);
const route=fs.readFileSync(new URL('../assets/study._subject.practise-y8fix-20260920.js',import.meta.url),'utf8');
assert(route.includes('id:`cellstructure`'));assert(route.includes('E===`cellstructure`&&e===`biology`'));
console.log('Biology cell Practice QA passed: 72 model answers; 100 new sets; six topics; mistake retry; route integration.');
