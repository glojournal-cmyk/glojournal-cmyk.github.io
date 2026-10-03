import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {vocabularyQuestion,selectDailyVocabulary} from '../assets/daily-vocab-20261003.js';
const core=fs.readFileSync('assets/index-BLVOhKhN.core.js','utf8');
function array(name){const start=core.indexOf(name+'=[')+name.length+1;let depth=0,quote=null,escape=false;for(let i=start;i<core.length;i++){const c=core[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;}else if(['"',"'",'`'].includes(c))quote=c;else if(c==='[')depth++;else if(c===']'&&--depth===0)return vm.runInNewContext(core.slice(start,i+1));}throw Error('Missing array '+name);}
const french=array('WS'),latin=array('XS');
const norm=v=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").toLowerCase().replace(/[^a-z0-9 ']/g,'').replace(/\s+/g,' ').trim();
const stageWords=[
'canis coquus est filius hortus in laborat mater pater sedet servus via',
'amicus ancilla cena cibus dominus dormit intrat laetus laudat mercator quoque salutat',
'ad bibit circumspectat clamat ecce et exit exspectat ianua iratus leo magnus navis non portat respondet ridet salve surgit taberna videt vinum',
'agit cur e ego eheu habet inquit pecunia perterritus quaerit quis reddit sed tu vocat',
'adest ambulat audit clamor currit femina hodie iuvenis meus multus optimus petit puella senex spectat stat turba ubi urbs venit',
'abest cubiculum emit ferociter festinat fortis libertus olim parvus per postquam quod res scribit subito superat tum tuus vendit',
'conspicit cum facit heri ingens intellegit lacrimat mortuus narrat necat nihil omnis parat prope rogat tacite tamen terret',
'consumit ducit eum facile ferox gladius hic nuntius pes porta puer pugnat saepe sanguis silva statim totus'];
let total=0;
for(const [i,line] of stageWords.entries()){
 const pack=JSON.parse(fs.readFileSync(`content/topics/la-y8-stage-${i+1}-vocabulary.json`));
 for(const word of line.split(' ')){
  total++;assert.ok(pack.note.mustMemoriseVocabulary.some(v=>v.term.split(' (')[0].split(', ').some(x=>norm(x)===word)),'Latin note '+word);
  assert.ok(latin.some(v=>norm(v.latin)===word),'Latin vocabulary bank '+word);
  assert.ok(pack.questions.some(q=>vocabularyQuestion(q,'latin')&&q.stimulus?.text.split(' (')[0].split(', ').some(x=>norm(x)===word)),'Latin daily bank '+word);
 }
}
assert.equal(total,135);
const pack=JSON.parse(fs.readFileSync('content/topics/fr-y8-s02-weather-activities-and-opinions.json'));
assert.equal(pack.note.mustMemoriseVocabulary.length,75);
for(const row of pack.note.mustMemoriseVocabulary){
 assert.ok(!row.term.includes(' / '),'Combined French alternatives in notes: '+row.term);
 assert.ok(french.some(v=>norm(v.french)===norm(row.term)),'French vocabulary bank '+row.term);
 assert.ok(pack.questions.some(q=>vocabularyQuestion(q,'french')&&[q.stimulus?.text,...q.answer.accepted].some(v=>norm(v)===norm(row.term))),'French daily bank '+row.term);
}
const quiz=fs.readFileSync('assets/quiz-session-rWAnuDVj.js','utf8');
const context=vm.createContext({d:norm,a:norm,x:s=>s.normalize('NFC').trim().replace(/\s+/g,' ')});
vm.runInContext(quiz.slice(quiz.indexOf('function A(e)'),quiz.indexOf('function re(e)')),context);
const newQuestions=pack.questions.filter(q=>q.id.startsWith('fr-y7-foundation-'));
assert.equal(newQuestions.length,50);
for(const q of newQuestions){
 assert.ok(vocabularyQuestion(q,'french'),q.id+' excluded from daily');
 for(const answer of q.answer.accepted)assert.equal(context.B(q,norm(answer),'french').ok,true,q.id+': accent-free '+answer);
 assert.equal(context.B(q,'completely unrelated answer','french').ok,false,q.id);
}
const masculine=newQuestions.find(q=>q.stimulus.text==='sweet (masculine)');
assert.equal(context.B(masculine,'sucree','french').ok,false,'Wrong gender must not receive a mark');
const funny=newQuestions.find(q=>q.stimulus.text==='funny');
for(const word of ['marrant','amusant','rigolo'])assert.equal(context.B(funny,word,'french').ok,true);
const daily=selectDailyVocabulary({subject:'french',items:pack.questions,day:'2026-10-03'});
assert.equal(new Set(daily.map(q=>q.conceptId)).size,daily.length);
assert.equal(new Set(french.map(v=>v.id)).size,french.length);
assert.equal(new Set(latin.map(v=>v.id)).size,latin.length);
const dictationContext=vm.createContext({f:latin,c:french,g:[],FY9:[],GQS:()=>[]});
vm.runInContext(quiz.slice(quiz.indexOf('function D('),quiz.indexOf('function O(')),dictationContext);
const dictation=dictationContext.D('french',8,'all');
assert.ok(dictation.find(v=>v.answer==='marrant').extra.includes('rigolo'),'Dictation loses synonym alternatives');
assert.ok(fs.readFileSync('assets/session._kind-WQJEPsST.js','utf8').includes('[x.french,...x.extra??[]]'),'Legacy daily synonym marking missing');
console.log('YEAR7_VOCABULARY_COMPLETENESS passed: 135 Latin entries, 75 French entries, enabled daily coverage, 50 new questions, accents, gender and synonym marking.');
