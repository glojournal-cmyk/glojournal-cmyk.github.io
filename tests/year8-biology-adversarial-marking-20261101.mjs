import assert from 'node:assert/strict';
import fs from 'node:fs';
const bundles=['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js'];
const qids=[
 ['bio-y8-practical-conclusions','bio-y8-practical-conclusions-20261101-covered-leaf','The covered part definitely made starch because the cover let light through.',0],
 ['bio-y8-practical-conclusions','bio-y8-practical-conclusions-20261101-controlled-variables','It is fine to change the temperature and carbon dioxide too, because they never affect photosynthesis.',0],
 ['bio-y8-limiting-factors','bio-y8-limiting-factors-20261101-plateau-explanation','At the plateau light is still the only limiting factor and extra light always increases the rate.',0],
 ['bio-y8-limiting-factors','bio-y8-limiting-factors-20261101-independence-bubble-volume-limitation','Every bubble has exactly the same volume so counting bubbles is more accurate than gas volume.',0],
 ['bio-y8-limiting-factors','bio-y8-limiting-factors-20261101-independence-plateau-inference','Yes, the flat line alone proves temperature must be the limiting factor, with no need for other tests.',0],
 ['bio-y8-nutrition-labels','bio-y8-nutrition-labels-20261101-sugar-comparison','Food A contains less sugar. Food A has 6 g; food B has 13.5 g.',0],
 ['bio-y8-correlation','bio-y8-correlation-20261101-small-sample','Larger hand span causes extra height, and four pupils are enough to prove the same is true for everyone.',0]
];
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
const keep=value=>String(value??'').normalize('NFC').trim().replace(/\s+/g,' ');
const findings=[];
for(const path of bundles){
 const source=fs.readFileSync(path,'utf8'),from=source.indexOf('function A(e){'),to=source.indexOf('function V(e){',from);
 assert.ok(from>0&&to>from,'real scorer extract missing '+path);
 const grade=new Function('a','d','x',source.slice(from,to)+';return B;')(normalize,normalize,keep);
 for(const [topicId,id,response,allowed] of qids){
  const q=JSON.parse(fs.readFileSync('content/topics/'+topicId+'.json','utf8')).questions.find(q=>q.id===id);
  assert.ok(q,'missing adversarial question '+id);
  const result=grade(q,response,'biology',{});
  const pointValues=result.pointResults||[];
  findings.push({bundle:path,question:id,studentResponse:response,score:result.score,total:result.total,pointResults:pointValues,allowed});
 }
}
const flagged=findings.filter(x=>x.score>x.allowed);
fs.mkdirSync('test-results',{recursive:true});
fs.writeFileSync('test-results/year8-biology-adversarial-marking-20261101.json',JSON.stringify({checks:findings.length,flagged:flagged.length,findings},null,2)+'\n');
console.log('YEAR8_BIOLOGY_ADVERSARIAL_MARKING',JSON.stringify({checks:findings.length,flagged:flagged.length,flags:flagged.slice(0,15)}));
if(flagged.length)process.exitCode=1;
