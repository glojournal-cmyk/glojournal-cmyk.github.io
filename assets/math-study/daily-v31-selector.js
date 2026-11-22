// Maths V3.1: deterministic, academic-QA-gated, read-only daily selector.
import {verifiedSourceSystemKeyForMathsId} from './math-v311-original-system-collisions.js';
import {mathsOriginalGradeDemandDecision} from './math-v311-grade-demand-gate.js';
const TOPICS=['math-y9-indices','math-y9-standard-form','math-y9-changing-subject','math-y9-straight-line-graphs','math-y9-simultaneous-equations'];
const BANDS={G7:4,G8:4,'G8-9':2};
const PAIRS=[['G7','G7'],['G7','G8'],['G7','G8-9'],['G8','G8'],['G8','G8-9'],['G8-9','G8-9']];
const dateOf=x=>String(x||'').slice(0,10);
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
const valid=q=>typeof q?.conceptFamilyId==='string'&&q.conceptFamilyId.trim()&&q?.subject==='maths'&&Number(q.year)===9&&TOPICS.includes(q.topicId)&&Object.hasOwn(BANDS,q.difficultyTarget)&&q.academicQA==='approved'&&q.taughtVerified===true&&q.mathDailyEnabled===true&&q.renderRequired===true&&q.qaSourceStatus!=='BLOCKED_FOR_LIVE_IMPORT'&&mathsOriginalGradeDemandDecision(q).ok&&Array.isArray(q.options)&&q.options.length===6&&q.templateId&&q.id;

/* Pure assignment selection; NEVER writes XP, MP, Recovery, saved data.
   history=[{date,questionIds,templateIds}], earliest to latest.
   No repeated source question IDs across the approved fresh bank.
   Minimise previous-day template reuse; no template duplicates within a day.
   Never substitute an unapproved question on shortage. */
export function selectMathsV31Daily({approvedQuestions=[],day,history=[]}={}){
  const date=dateOf(day),issues=[];
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date!==day)issues.push('invalid-local-date');
  if(!Array.isArray(approvedQuestions)||!approvedQuestions.length)issues.push('empty-approved-bank');
  if(issues.length)return {ready:false,questions:[],issues};
  const rows=approvedQuestions.filter(valid);
  const used=new Set(),usedOriginalSystems=new Set(),lastSeen=new Map(),uses=new Map(),previous=new Set();
  const lastFamily=new Map(),familyUses=new Map(),previousFamilies=new Set();
  for(const h of history||[]){
    if(!h||dateOf(h.date)>=date)continue;
    for(const id of h.questionIds||[]){
      used.add(id);
      const system=verifiedSourceSystemKeyForMathsId(id);
      if(system)usedOriginalSystems.add(system);
    }
    for(const family of h.conceptFamilyIds||[]){
      if(!family)continue;
      familyUses.set(family,(familyUses.get(family)||0)+1);
      if(!lastFamily.has(family)||lastFamily.get(family)<h.date)lastFamily.set(family,h.date);
    }
    for(const template of h.templateIds||[]){
      if(!template)continue;
      uses.set(template,(uses.get(template)||0)+1);
      if(!lastSeen.has(template)||lastSeen.get(template)<h.date)lastSeen.set(template,h.date);
    }
  }
  const prev=new Date(date+'T12:00:00Z');prev.setUTCDate(prev.getUTCDate()-1);
  for(const [template,seen]of lastSeen)if(dateOf(seen)===prev.toISOString().slice(0,10))previous.add(template);
  for(const [family,seen]of lastFamily)if(dateOf(seen)===prev.toISOString().slice(0,10))previousFamilies.add(family);
  const value=q=>{
    const t=q.templateId,last=lastSeen.get(t);
    const distance=last?Math.round((Date.parse(date)-Date.parse(dateOf(last)))/86400000):99;
    const family=q.conceptFamilyId, familyLast=lastFamily.get(family);
    const familyDistance=familyLast?Math.round((Date.parse(date)-Date.parse(dateOf(familyLast)))/86400000):99;
    return (previousFamilies.has(family)?20000:0)+(familyDistance<4?(4-familyDistance)*200:0)+(familyUses.get(family)||0)*6+
      (previous.has(t)?10000:0)+(distance<4?(4-distance)*100:0)+(uses.get(t)||0)*3+
      (hash(date+':'+q.id)%997)/997;
  };
  const possibilities=TOPICS.map(topic=>{
    const pool=rows.filter(q=>q.topicId===topic&&!used.has(q.id)&&
      !usedOriginalSystems.has(verifiedSourceSystemKeyForMathsId(q.id))),choices=[];
    for(const pair of PAIRS){
      const picked=[];let cost=0;
      for(const grade of pair){
        const available=pool.filter(q=>q.difficultyTarget===grade&&
          !picked.some(p=>p.id===q.id||p.templateId===q.templateId||p.conceptFamilyId===q.conceptFamilyId||
            (verifiedSourceSystemKeyForMathsId(q.id)!==null&&
             verifiedSourceSystemKeyForMathsId(q.id)===verifiedSourceSystemKeyForMathsId(p.id))));
        available.sort((a,b)=>value(a)-value(b)||a.id.localeCompare(b.id));
        if(!available.length)break;
        picked.push(available[0]);cost+=value(available[0]);
      }
      if(picked.length===2)choices.push({
        questions:picked,cost,counts:[
          pair.filter(x=>x==='G7').length,
          pair.filter(x=>x==='G8').length,
          pair.filter(x=>x==='G8-9').length
        ]
      });
    }
    return choices;
  });
  if(possibilities.some(p=>p.length===0))return {ready:false,questions:[],
    issues:['insufficient-fresh-approved-topic:'+TOPICS[possibilities.findIndex(p=>!p.length)]]};
  let states=new Map([['0|0|0',{cost:0,questions:[],templates:[],families:[],sourceSystems:[]}]]);
  for(const choices of possibilities){
    const next=new Map();
    for(const [key,state]of states){
      const counts=key.split('|').map(Number);
      for(const option of choices){
        const totals=counts.map((n,i)=>n+option.counts[i]);
        if(totals[0]>4||totals[1]>4||totals[2]>2||
          option.questions.some(q=>state.templates.includes(q.templateId)||state.families.includes(q.conceptFamilyId)||
            (verifiedSourceSystemKeyForMathsId(q.id)!==null&&
             state.sourceSystems.includes(verifiedSourceSystemKeyForMathsId(q.id)))))continue;
        const k=totals.join('|'),cost=state.cost+option.cost,prior=next.get(k);
        if(!prior||cost<prior.cost)next.set(k,{
          cost,questions:[...state.questions,...option.questions],
          templates:[...state.templates,...option.questions.map(q=>q.templateId)],
          families:[...state.families,...option.questions.map(q=>q.conceptFamilyId)],
          sourceSystems:[...state.sourceSystems,...option.questions.map(q=>verifiedSourceSystemKeyForMathsId(q.id)).filter(Boolean)]
        });
      }
    }
    states=next;
    if(!states.size)return {ready:false,questions:[],issues:['topic-grade-constraints-exhausted']};
  }
  const chosen=states.get('4|4|2');
  if(!chosen||chosen.questions.length!==10)return {ready:false,questions:[],issues:['no-valid-4-4-2-selection']};
  const questions=chosen.questions;
  const exactSystems=questions.map(q=>verifiedSourceSystemKeyForMathsId(q.id)).filter(Boolean);
  if(new Set(exactSystems).size!==exactSystems.length||
     new Set(questions.map(q=>q.id)).size!==10||
     new Set(questions.map(q=>q.templateId)).size!==10||
     new Set(questions.map(q=>q.conceptFamilyId)).size!==10)
    return {ready:false,questions:[],issues:['repeated-id-or-template']};
  return {ready:true,questions,issues:[],diagnostics:{
    previousDayTemplateRepeats:questions.filter(q=>previous.has(q.templateId)).length,
    previousDayConceptFamilyRepeats:questions.filter(q=>previousFamilies.has(q.conceptFamilyId)).length,
    bandCounts:Object.fromEntries(Object.keys(BANDS).map(b=>[b,questions.filter(q=>q.difficultyTarget===b).length])),
    topics:Object.fromEntries(TOPICS.map(t=>[t,questions.filter(q=>q.topicId===t).length]))
  }};
}
