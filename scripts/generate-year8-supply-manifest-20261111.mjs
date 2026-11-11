// Run after editing Year 8 questions:
//   node scripts/generate-year8-supply-manifest-20261111.mjs
// Source-of-truth: enabled formal topic JSON, never learner answers.
import fs from 'node:fs';
const dir='content/topics',dest='assets/year8-question-supply-manifest-20261111.js';
const files=fs.readdirSync(dir).filter(f=>/^(bio|chem|phys|fr|la)-y8.*\.json$/.test(f)).sort();
const supply={};
for(const file of files){
 const doc=JSON.parse(fs.readFileSync(dir+'/'+file,'utf8'));
 if(Number(doc.year)!==8||doc.status==='disabled'||doc.status==='preview')continue;
 const groups=new Map();
 for(const question of doc.questions||[]){
  if(!question?.id||question.status==='disabled'||question.status==='preview'||
     question.status==='draft'||question.preview===true||
     question.formal===false||question._repair)continue;
  const concept=String(question.conceptId||question.id);
  if(!groups.has(concept))groups.set(concept,[]);
  groups.get(concept).push(String(question.id));
 }
 if(groups.size)supply[doc.topicId]=[doc.subject,[...groups.values()]];
}
const source='/* Source-backed Year 8 concept inventory. Regenerate after editing source topic JSON.\n'+
 ' * Each group holds the original question IDs of ONE concept. No learner data.\n'+
 ' */\nexport const year8SupplyGroups={\n'+
 Object.entries(supply).map(([id,source])=>' '+JSON.stringify(id)+':'+JSON.stringify(source)+',').join('\n')+
 '\n};\n';
fs.writeFileSync(dest,source);
console.log(JSON.stringify({file:dest,topics:Object.keys(supply).length,
 concepts:Object.values(supply).reduce((n,row)=>n+row[1].length,0),
 originalQuestionIds:Object.values(supply).reduce((n,row)=>n+row[1].reduce((m,g)=>m+g.length,0),0)}));
