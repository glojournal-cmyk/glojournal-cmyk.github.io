import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const topic=JSON.parse(readFileSync('content/topics/fr-y8-s05-town-time-and-aller.json','utf8'));
const source=topic.questions.find(q=>q.id==='fr-y8-src-fr-05-0602-au-centre-commercial');
const reverse=topic.questions.find(q=>q.id==='fr-y8-src-fr-05-0601-to-the-shopping-centre');
const phrases=['at the shopping centre','at the shopping center',
 'to the shopping centre','to the shopping center'];
const norm=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9 ']/g,'').replace(/\s+/g,' ').trim();
const markFrom=path=>{
 const src=readFileSync(path,'utf8');
 const start=src.indexOf('function A(e)'),end=src.indexOf('function re(e)');
 assert.ok(start>=0&&end>start,path+': parser marker missing');
 const context=vm.createContext({d:norm,a:norm,x:s=>s.normalize('NFC').trim().replace(/\s+/g,' ')});
 vm.runInContext(src.slice(start,end),context);
 return (q,response)=>context.B(q,response,'french');
};

test('the taught standalone French chunk is ambiguous in English without a verb',()=>{
 assert.equal(source.prompt.split('\n').at(-1),'au centre commercial');
 assert.equal(source.format,'controlled_translation');
 assert.deepEqual(source.answer.accepted,phrases.slice().reverse().reverse().map(s=>s));
 assert.equal(reverse.answer.accepted[0],'au centre commercial');
 assert.ok(source.feedback.short.includes('at the shopping centre'));
 assert.ok(source.feedback.short.includes('to the shopping centre'));
});

for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
 test(path+' credits context-valid British/American at/to forms',()=>{
  const mark=markFrom(path);
  for(const input of ['At the shopping center',...phrases,
    '  AT THE SHOPPING CENTRE.  ']){
   const result=mark(source,input);
   assert.equal(result.ok,true,input+' '+JSON.stringify(result));
   assert.equal(result.score,1,input);
  }
  for(const wrong of ['shopping centre','at the school','to the hospital',
    'at the town centre','the commercial centre']) {
   assert.equal(mark(source,wrong).ok,false,'incorrect concept '+wrong);
  }
  assert.equal(mark(reverse,'au centre commercial').ok,true);
  assert.equal(mark(reverse,'au parc').ok,false);
 });
}
