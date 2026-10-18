import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const bank=JSON.parse(fs.readFileSync('assessment/biology-nov2-20261017.json','utf8'));
const diagramQuestions=bank.questions.filter(q=>q.diagram);
assert.equal(diagramQuestions.length,9,'Eight new diagrams plus the original biological drawing comparison');
assert.equal(new Set(diagramQuestions.map(q=>q.diagram)).size,9,'each image question needs its own diagram');
const required=[
 'bio-nov2-onion-epidermis.svg','bio-nov2-sperm.svg',
 'bio-nov2-neurone.svg','bio-nov2-red-cell.svg',
 'bio-nov2-ciliated-airway.svg','bio-nov2-root-hair.svg',
 'bio-nov2-xylem.svg','bio-nov2-coverslip.svg'
];
for(const name of required){
  const q=diagramQuestions.find(q=>q.diagram===name);
  assert(q?.prompt&&q?.diagramAlt&&q?.modelAnswer&&q.marks>0,name+' wired to marking scheme');
  const svg=fs.readFileSync(path.join('assessment/diagrams',name),'utf8');
  assert(svg.startsWith('<svg ')&&svg.includes('</svg>'),name+' readable SVG');
  assert(svg.includes('<title')&&svg.includes('<desc'),name+' accessible image metadata');
  assert(svg.length>500&&svg.length<25000,name+' nonempty and efficient');
}
const practice=fs.readFileSync('assets/biology-nov2-practice-20261017.js','utf8');
assert(practice.includes('q.diagram?')&&practice.includes('/assessment/diagrams/'),'practice embeds selected diagram');
const assessment=fs.readFileSync('assessment/app-v2.js','utf8');
assert(assessment.includes('diagram'),'the timed assessment must support diagram questions');
console.log('BIOLOGY_NOV2_DIAGRAM_QA '+JSON.stringify({date:bank.assessmentDate,questions:bank.questions.length,newDiagrams:8,totalImageQuestions:9,accessibleDiagrams:true,markSchemesRetained:true}));
