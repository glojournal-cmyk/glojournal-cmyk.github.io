import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const topics=JSON.parse(read('assets/math-study/topics.json'));
assert.equal(topics.length,5);let ids=new Set(),marks=0,diagrams=0;
const graphs=JSON.parse(read('assets/math-study/graphs.json'));
for(const t of topics){let q=JSON.parse(read('assets/math-study/'+t.id+'.json'));assert.equal(q.questions.length,100);assert.equal(q.subject,'maths');assert.equal(q.year,9);let skill=0,exam=0;for(let x of q.questions){assert.ok(x.id&&!ids.has(x.id));ids.add(x.id);marks+=x.marks;assert.ok(x.prompt&&x.solution);assert.equal(x.markPoints.length,x.marks);if(x.track==='skill')skill++;else exam++;if(x.diagramAsset){assert.ok(graphs[x.diagramAsset]);diagrams++}}assert.equal(skill,60);assert.equal(exam,40)}
assert.equal(ids.size,500);assert.equal(marks,1546);assert.equal(diagrams,30);
for(const p of ['study/maths/index.html','study/maths/learn/index.html','study/maths/practise/index.html','study/maths/progress/index.html'])assert.match(read(p),/maths-app\.js/);
const app=read('assets/math-study/maths-app.js');for(const name of ['Home','Study','Play','Garden','Pet','Assessment','Scholar'])assert.ok(app.includes("'"+name+"'"));
assert.doesNotMatch(read('assets/daily-curriculum-20261004.js'),/progressionSubjects\s*=\s*\[[^\]]*maths/);

const outfits=JSON.parse(read('assets/math-study/outfits.json')).outfits;
assert.ok(Object.keys(outfits).length>=82,'All currently equipped Wardrobe outfits must be known to Maths');
for(const [id,url] of Object.entries(outfits)){
  assert.ok(url.startsWith('/art/'),'Unexpected art path for '+id);
  assert.ok(fs.existsSync(url.split('?')[0].slice(1)),'Missing equipped artwork: '+id+' -> '+url);
}
assert.ok(outfits['medical-01-forensic-pathologist']&&outfits['medical-10-medical-student']);
assert.doesNotMatch(app,/import\(['"]\/assets\/index-BLVOhKhN\.js/,'Maths pages must never hydrate the existing React app router');

console.log('PASS Year9 Maths: 500 questions, 1546 marks, 30 charts, 4 routes, 82 outfit assets, 7 nav buttons, Daily excluded');