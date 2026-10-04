import {i as interop,n as factory} from './jsx-runtime-Cltr0gcK.js';
const R=interop(factory()),h=R.createElement;
const errorLabels={ending:'Ending or agreement',spelling:'Spelling',partial:'Missing mark points',blank:'Incomplete answer',wrong:'Meaning or concept',case:'Case choice',tense:'Tense choice',vocabulary:'Vocabulary recall','verb-ending':'Verb ending','person-number':'Person or number',translation:'Translation','grammar/concept':'Grammar or concept',incomplete:'Incomplete answer'};
export function captureReviewHistory(items,state,saved){if(saved)return saved;const ids=new Set(items.map(q=>q.id));return Object.fromEntries(Object.entries({...state.reviews,...state.spellingDue}).filter(([id])=>ids.has(id)).map(([id,row])=>[id,{...row}]));}
export function reviewProgress(question,previous,current,checked,today){
 if(!previous?.wrong&&!previous?.lastWrong&&!previous?.lastErrorKind&&!question?._repair)return null;
 const repair=!!question._repair,recognition=question.format==='mc_single';
 const outcome=!checked?'Try from memory before checking.':!checked.ok?'Not yet secure · another review is needed.':repair?'Correct in repair practice · independent recall still needs checking.':recognition?'Recognised correctly · typed recall still needs checking.':'Answered independently this time.';
 const due=current?.due&&current.due>today?current.due:null;
 return {reason:errorLabels[previous?.lastErrorKind]||errorLabels[previous?.errorType]||(question._repair?'An earlier answer in this session needed correction.':'The earlier answer was not fully correct; no detailed error was saved.'),lastWrong:previous?.lastWrong||null,outcome,next:due?`Next scheduled review: ${formatReviewDate(due)}.`:checked?'No automatic review date is scheduled yet.':'The next review date appears after you answer.'};
}
export function formatReviewDate(day){const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(day||'');return match?`${match[3]}/${match[2]}/${match[1]}`:day;}
export function ReviewProgress({question,previous,current,checked,today}){const info=reviewProgress(question,previous,current,checked,today);return !info?null:h('aside',{'aria-label':'Your review progress',className:'rounded-xl bg-sage/60 p-4 text-sm'},h('p',{className:'font-semibold'},'Your review progress'),h('p',{className:'mt-1'},`Last time${info.lastWrong?' · '+formatReviewDate(info.lastWrong):''}: ${info.reason}`),h('p',{className:'mt-2 font-medium'},info.outcome),h('p',{className:'mt-1 text-muted'},info.next));}
export function improvementPoints(coach,errors){const repairs=(coach?.cards||[]).filter(c=>c.kind==='repair');const points=repairs.map(c=>({title:c.title,detail:c.detail}));for(const [kind,count] of Object.entries(errors||{}).filter(([k,v])=>v>0&&k!=='none'&&k!=='accent').sort((a,b)=>b[1]-a[1])){if(points.length>=3)break;points.push({title:`${errorLabels[kind]||'Answer accuracy'} · ${count} to revisit`,detail:'Cover the model answer and try a fresh question from memory.'});}return points.slice(0,3);}
// Compare first attempts with the snapshot taken before this set began.
export function sessionGains(items=[],log=[],history={}){
 const questions=new Map(items.map(q=>[q.id,q])),seen=new Set(),prior=new Set(),recovered=new Set(),recognised=new Set(),repairs=new Set();let independentCorrect=0;
 const recallFormats=new Set(['typed_exact','typed_rubric','typed_equivalent','typed_short','controlled_translation','mark_points','calculation','extended_response','unordered_set','practical_design','listen_type','short_answer','dictation']);
 for(const row of log){
  const id=row.questionId,q=questions.get(id);if(!id||!q)continue;
  if(row.repair||q._repair){if(row.correct)repairs.add(row.repairOf||q._repairOf||id);continue;}
  if(row.formal===false||seen.has(id))continue;seen.add(id);
  const before=history[id],wasWrong=!!(before?.wrong||before?.lastWrong||before?.lastErrorKind||before?.errorType||(Number.isFinite(before?.credit)&&before.credit<1));
  if(wasWrong)prior.add(id);
  if(!row.correct)continue;
  const independent=recallFormats.has(q.format)&&!row.assisted;
  if(independent)independentCorrect++;
  if(wasWrong){if(independent)recovered.add(id);else recognised.add(id);}
 }
 const lines=[];
 if(recovered.size)lines.push(`You independently answered ${recovered.size} previously missed ${recovered.size===1?'question':'questions'} correctly this time.`);
 else if(independentCorrect)lines.push(`${independentCorrect} ${independentCorrect===1?'answer':'answers'} correct independently on the first attempt in this set.`);
 if(recognised.size)lines.push(`${recognised.size} previous ${recognised.size===1?'mistake':'mistakes'} answered correctly with answer choices or prompts; independent recall still needs checking.`);
 if(repairs.size)lines.push(`${repairs.size} ${repairs.size===1?'answer':'answers'} corrected in repair practice, counted separately from independent recall.`);
 if(!lines.length)lines.push(prior.size?'You revisited earlier mistakes. Keep practising before counting them as secure.':'This set is recorded. A later review will check what you remember.');
 return {recoveredIds:[...recovered],recovered:recovered.size,recognised:recognised.size,repaired:repairs.size,independentCorrect,priorAttempted:prior.size,lines:lines.slice(0,3)};
}
export function ProgressSummary({gains}){return gains?h('aside',{'aria-label':'Your progress this session','data-memory-recovered-ids':JSON.stringify(gains.recoveredIds||[]),className:'mt-4 rounded-xl bg-sage/60 p-4'},h('h2',{className:'font-display text-xl font-semibold'},'Your progress this session'),...gains.lines.map((line,i)=>h('p',{key:i,className:'mt-2 text-base'},line))):null;}
export function SessionResult({score,formalCount,coach,errors,daily,backHref,nextHref,onAgain,marks=false,gains}){const points=improvementPoints(coach,errors);return h('section',{'aria-label':'Session result'},
 h('h1',{className:'font-display text-3xl font-semibold'},marks?'Practice complete':'Session complete'),
 h('p',{className:'mt-3 text-2xl font-semibold'},marks?`${score.firstPassCorrect} / ${formalCount} marks · ${score.percentage}%`:`${score.firstPassCorrect} / ${formalCount} first-pass correct · ${Math.round(100*score.firstPassCorrect/Math.max(1,formalCount))}%`),
 score.repairedCorrect?h('p',{className:'mt-1 text-sm text-muted'},`Session score after repairs: ${score.percentage}% · ${score.repairedCorrect} repaired · +${score.repairPoints} session points`):null,
 h('div',{className:'mt-4'},daily),
 h(ProgressSummary,{gains}),
 points.length?h('div',{className:'mt-4'},h('h2',{className:'font-display text-xl font-semibold'},'Focus on next'),h('ul',{className:'mt-2 space-y-2'},...points.map((p,i)=>h('li',{key:i,className:'rounded-xl bg-sage/50 p-3'},h('p',{className:'font-medium'},p.title),h('p',{className:'mt-1 text-sm text-muted'},p.detail))))):h('p',{className:'mt-4 rounded-xl bg-sage/50 p-3 text-sm'},'No missed answers in this set. A later review will check what you still remember.'),
 marks&&onAgain?h('button',{type:'button',onClick:onAgain,className:'mt-4 min-h-11 rounded-full bg-navy px-5 text-card'},'Choose the next practice set'):null,
 !daily&&nextHref?h('a',{href:nextHref,className:'mt-4 inline-flex min-h-11 items-center rounded-full bg-navy px-5 text-card'},marks?'Start another set':'Continue practice'):null,
 h('details',{className:'mt-5 border-t border-line pt-3'},h('summary',{className:'min-h-11 cursor-pointer py-2 font-medium'},'Detailed results & skill analysis'),
 h('p',{className:'mt-2 text-sm text-muted'},marks?'These marks are practice feedback. This practice does not award formal mastery.':'Repairs earn half-credit in the session score and do not raise formal mastery.'),
 h('div',{className:'mt-3 grid gap-2 sm:grid-cols-2'},...(coach?.depthSummary||[]).map(d=>h('p',{key:d.depth,className:'rounded-lg bg-sage/50 p-3'},`${d.label}: ${d.correct} / ${d.attempted} formal correct`))),
 ...(coach?.cards||[]).map(c=>h('div',{key:c.skill,className:'mt-3 rounded-lg border border-line p-3'},h('p',{className:'font-medium'},c.title),h('p',{className:'mt-1 text-sm text-muted'},c.detail))),
 h('div',{className:'mt-4 flex flex-wrap gap-3'},backHref&&h('a',{href:backHref,className:'inline-flex min-h-11 items-center underline'},'Return to subject'),onAgain&&h('button',{type:'button',onClick:onAgain,className:'min-h-11 underline'},'Practise again'))));}
