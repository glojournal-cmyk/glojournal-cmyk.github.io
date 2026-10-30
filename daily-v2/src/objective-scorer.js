/* Daily V2 deterministic OBJECTIVE answer preview — staging only.
 * It is not a production grade, saved answer, certification or XP receipt.
 * Never infer marks for numerical working, free text or ambiguous rubrics.
 */
import {fingerprintDailyV2Source} from './bank-adapter.js';
import {inspectDailyV2AnswerShape} from './source-answer.js';
const ok=x=>{if(!x)throw Error('DailyV2 objective score: invalid source or response');};
const text=x=>String(x).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const keys=x=>Object.keys(x);
const same=(a,b)=>text(a)===text(b);
const markCount=(answer,n)=>{
 const ceiling=answer.totalMarks===undefined?n:answer.totalMarks;
 return Number.isInteger(ceiling)&&ceiling===n&&n>0;
};
function preview(topic,question,result){
 return {questionId:question.id,sourceFingerprint:fingerprintDailyV2Source(topic,question),
  sourceAnswerMode:question.answer.mode,
  // Neither a complete objective match nor a partial score authorises
  // progression, XP, MP, or a production marking service.
  status:result.status||'staging-preview',releaseGrade:false,ledgerEligible:false,
  ...result};
}
function assignmentScore(answer,response,mode){
 ok(obj(response),'mapping response required');
 const expected=new Map();
 if(mode==='pair_map'){
  for(const pair of answer.pairs){
   ok(typeof pair.left==='string'&&typeof pair.right==='string'&&pair.left.trim()&&pair.right.trim());
   const token=text(pair.left);
   ok(!expected.has(token));
   expected.set(token,pair.right.split(/\s+\/\s+/).map(text));
  }
 }else{
  for(const [category,items] of Object.entries(answer.categories)){
   ok(typeof category==='string'&&category.trim());
   for(const item of items){
    const token=text(item);ok(token&&!expected.has(token));
    expected.set(token,[text(category)]);
   }
  }
 }
 const n=expected.size;
 if(!markCount(answer,n))return {status:'review-required',reviewRequired:true,marksEarned:null,
  marksPossible:answer.totalMarks??n,reason:'rubric count does not equal independently countable items'};
 const assignments=new Map();
 for(const [key,value] of Object.entries(response)){
  ok((typeof key==='string')&&(typeof value==='string'||typeof value==='number'));
  const token=text(key);ok(token&&!assignments.has(token));
  assignments.set(token,text(value));
 }
 if([...assignments.keys()].some(x=>!expected.has(x)))
  return {status:'review-required',reviewRequired:true,marksEarned:null,marksPossible:n,
   reason:'response contains an unassigned extra label'};
 let earned=0;
 for(const [token,accepted] of expected){
  if(assignments.has(token)&&accepted.includes(assignments.get(token)))earned++;
 }
 return {marksPossible:n,marksEarned:earned,correct:earned===n,reviewRequired:false,
  scoring:'one point per correct independent assignment'};
}
function unorderedScore(answer,response){
 let items;
 if(Array.isArray(response))items=response;
 else if(typeof response==='string'){
  // Delimit list entries only, never split "fatty acids and glycerol" phrases.
  const terms=answer.requiredGroups.flatMap(g=>g.alternatives);
  const separator=terms.some(t=>/\sand\s/i.test(t))?/[,\n;]+|(?<!\s)\s+\/\s+(?!\s)/:/[,\n;]+|\s+\/\s+|\s+and\s+/i;
  items=response.split(separator).map(t=>t.trim()).filter(Boolean);
 }else throw Error('DailyV2 objective score: unordered answer must be array or delimited text');
 ok(items.every(x=>typeof x==='string'&&x.trim()));
 const groups=answer.requiredGroups.map(g=>g.alternatives.map(text));
 const n=groups.length;
 if(!markCount(answer,n))return {status:'review-required',reviewRequired:true,marksEarned:null,
  marksPossible:answer.totalMarks??n,reason:'group rubric ceiling differs from group count'};
 if(items.length>n)return {status:'review-required',reviewRequired:true,
  marksEarned:null,marksPossible:n,reason:'additional answer elements require review'};
 // Maximum bipartite matching guarantees a synonym cannot earn two mark points.
 // Identical submitted terms cannot independently satisfy two overlapping
 // rubric groups (e.g. "glucose, glucose" is one concept, not two credits).
 const given=[...new Set(items.map(text))],occupied=new Map();
 function canMatch(group,visited){
  for(let i=0;i<given.length;i++){
   if(visited.has(i)||!groups[group].includes(given[i]))continue;
   visited.add(i);
   if(!occupied.has(i)||canMatch(occupied.get(i),visited)){
    occupied.set(i,group);return true;
   }
  }
  return false;
 }
 let earned=0;
 for(let i=0;i<n;i++)if(canMatch(i,new Set()))earned++;
 return {marksPossible:n,marksEarned:earned,correct:earned===n&&items.length===n,
  reviewRequired:false,scoring:'unique matched required groups, order independent'};
}
function numericScore(answer,response){
 ok(typeof response==='string'||(obj(response)&&typeof response.value==='number'));
 let value,unit='';
 if(typeof response==='string'){
  const match=response.trim().match(/^([+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:e[+-]?\d+)?)(?:\s*(.*))?$/i);
  if(!match)return {status:'review-required',reviewRequired:true,marksEarned:null,
   marksPossible:answer.totalMarks??1,reason:'cannot safely parse numeric answer and units'};
  value=Number(match[1].replace(/,/g,''));unit=match[2]||'';
 }else {value=response.value;unit=response.unit??'';}
 ok(Number.isFinite(value)&&typeof unit==='string');
 const tolerance=answer.tolerance??0;
 // IEEE-754 rounding must not reject exactly the published tolerance edge.
 // Never relax exact (tolerance=0) answers or grant large-number slack.
 const roundingSlack=tolerance>0?Math.min(tolerance*1e-9,
  Number.EPSILON*4*Math.max(1,Math.abs(value),Math.abs(answer.value))):0;
 const valueCorrect=Math.abs(value-answer.value)<=tolerance+roundingSlack;
 const units=answer.units||[];
 const unitCorrect=units.length?units.some(u=>same(u,unit)):!text(unit);
 const ceiling=answer.totalMarks??1;
 ok(Number.isInteger(ceiling)&&ceiling>0);
 if(valueCorrect&&unitCorrect)
  return {marksPossible:ceiling,marksEarned:ceiling,correct:true,reviewRequired:false,
   scoring:'exact numeric value within source tolerance and approved units'};
 // A multi-mark calculation may still earn working or unit marks. Never
 // fabricate a partial score from the final numerical value alone.
 return {status:'review-required',reviewRequired:true,marksEarned:null,
  marksPossible:ceiling,correct:null,reason:'incorrect or incomplete final numeric answer may require working marks'};
}
export function previewDailyV2ObjectiveScore({topic,question,response}={}){
 ok(obj(topic)&&obj(question)&&typeof topic.topicId==='string'&&question.topicId===topic.topicId);
 ok(typeof question.id==='string'&&question.id.trim());
 const shape=inspectDailyV2AnswerShape(question.answer);
 ok(shape.structuredEvidence);
 const mode=question.answer.mode;
 let result;
 if(mode==='numeric')result=numericScore(question.answer,response);
 else if(mode==='pair_map'||mode==='category_map')
  result=assignmentScore(question.answer,response,mode);
 else if(mode==='unordered_required_groups')
  result=unorderedScore(question.answer,response);
 else throw Error('DailyV2 objective score: unsupported or semantic answer mode');
 return preview(topic,question,result);
}
