// Only independent word meanings, spellings and dictionary entries count as Daily Vocab.
// Grammar transformations, sentences and comprehension belong to their own subject practice.
function directionOf(q) {
  const d=String(q?.stimulus?.direction||'').toLowerCase(),p=String(q?.prompt||'').toLowerCase();
  if(d.includes('english') && /english\s*(?:→|->|to)\s*(?:french|latin)/.test(d))return 'toForeign';
  if(/(?:french|latin)\s*(?:→|->|to)\s*english/.test(d))return 'toEnglish';
  if(/translate into (?:french|latin)|write the (?:french|latin) entry|write the (?:french|latin) word/.test(p) ||
     /-e2l$|-e2f$|-from-english$/.test(q.id||''))return 'toForeign';
  if(/translate into english|english meaning|best english meaning/.test(p) ||
     /-l2e$|-f2e$|-to-english$/.test(q.id||''))return 'toEnglish';
  return null;
}
function isHeadword(q,subject) {
  const dir=directionOf(q),terms=q?.answer?.accepted||[],stim=String(q?.stimulus?.text||'').trim();
  if(!stim||!terms.length)return false;
  const foreign=String(dir==='toForeign'?terms[0]:stim).trim();
  if(!foreign || /[.!?;:\n]/.test(foreign))return false;
  const pieces=foreign.split(/\s+/);
  if(pieces.length>(subject==='french'?3:3))return false;
  // French determiner + noun and Latin dictionary forms are vocabulary,
  // but subject/verb clauses are not.
  if(/^(?:je|j'|tu|il|elle|nous|vous|ils|elles)\b/i.test(foreign) && pieces.length>1)return false;
  if(subject==='french' && pieces.length>1 && !/^(?:(?:un|une|le|la|les|l['’]|des|du|de|mon|ma|mes|son|sa|ses)\s*)?[a-zàâäçéèêëîïôöùûüÿœæ'’-]+$/i.test(foreign))return false;
  if(/^(?:ego|tu|ille|illa|nos|vos)\b/i.test(foreign) && pieces.length>1)return false;
  const english=String(dir==='toForeign'?stim:terms[0]).trim();
  if(!english || /[!?;\n]/.test(english) || english.split(/\s+/).length>6)return false;
  if(/^(?:i|we|you|he|she|they)\s+(?:am|is|are|was|were|have|has|had|will|would|can|could|do|does|did|went|want|like|love)\b/i.test(english))return false;
  return true;
}
export function vocabularyQuestion(q, subject) {
  const prefix=subject==='french'?'fr':subject==='latin'?'la':'';
  return !!prefix && q?.status!=='disabled' && q?.formal!==false &&
    String(q?.conceptId||'').startsWith(`${prefix}-y8-concept-vocab-`) &&
    ['typed_exact','typed_equivalent','controlled_translation'].includes(q.format) &&
    Array.isArray(q.answer?.accepted) && q.answer.accepted.length>0 && isHeadword(q,subject);
}

function hash(text) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0;
  return value;
}

function dayDistance(today, before) {
  return (Date.parse(`${today}T12:00:00Z`) - Date.parse(`${before}T12:00:00Z`)) / 86400000;
}

const wordKey = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[’‘]/g,"'").toLowerCase().replace(/\([^)]*\)/g,'').replace(/[^a-z0-9' ]/g,'').replace(/\s+/g,' ').trim();

export function selectDailyVocabulary({subject, items = [], year9Items = [], day, seed = day,
  ledger = {}, reviews = {}, spellingDue = {}, seenCorrect = {}, legacyVocabulary = [], size = 30,
  topicLearning = {}}) {
  const words = new Map(), byId = new Map();
  for (const q of [...items,...year9Items]) {
    const year9 = Number(q.year)===9 && String(q.conceptId||'').startsWith(
      (subject==='french'?'fr':'la')+'-y9-concept-vocab-');
    if (!(year9 || vocabularyQuestion(q,subject)) || (!year9 && topicLearning[q.topicId]===false))continue;
    byId.set(q.id,q.conceptId);
    if (!words.has(q.conceptId))words.set(q.conceptId,[]);
    words.get(q.conceptId).push(q);
  }
  // Keep legacy word-to-question history, including results saved on older iPads.
  const wordConcepts = new Map(), aliases = new Map();
  for(const [concept,variants] of words)for(const q of variants){
    for(const term of [q.stimulus?.text,...q.answer.accepted]){
      const key=wordKey(term);
      if(!key)continue;
      if(!wordConcepts.has(key))wordConcepts.set(key,new Set());
      wordConcepts.get(key).add(concept);
    }
  }
  for(const row of legacyVocabulary){
    if(Number(row.year??8)>8)continue;
    const term=subject==='french'?row.french:row.latin;
    aliases.set(row.id,[...(wordConcepts.get(wordKey(term))||[])]);
  }
  const conceptsFor=id=>byId.has(id)?[byId.get(id)]:aliases.get(id)||[];
  const latest=new Map(),dueDates=new Map();
  const remember=(concept,date,correct,due)=>{
    const before=latest.get(concept);
    if(!before||date>=before.date){
      latest.set(concept,{date,correct,due});
      if(due)dueDates.set(concept,due);
    }
  };
  const failedOn=review=>review.last||new Date(Date.parse(`${review.due}T12:00:00Z`)-2*86400000).toISOString().slice(0,10);
  for(const [id,review] of Object.entries(reviews))for(const concept of conceptsFor(id)){
    if(review?.due)remember(concept,(review.wrong?failedOn(review):review.last||'')+
      (review.lastAt?'T'+review.lastAt:''),review.wrong!==true,review.due);
  }
  for(const [id,review] of Object.entries(spellingDue))for(const concept of conceptsFor(id)){
    if(review?.wrong&&review.due)remember(concept,failedOn(review)+
      (review.lastAt?'T'+review.lastAt:''),false,review.due);
  }
  const credited=new Set(),recent=new Set(),encounters=new Map();
  for(const [date,subjects] of Object.entries(ledger).sort(([a],[b])=>a.localeCompare(b))){
    if(date>day)continue;
    const successful=new Set();
    for(const [id,correct] of Object.entries(subjects?.[subject]?.items||{})){
      for(const concept of conceptsFor(id)){
        const due=latest.get(concept)?.due||new Date(Date.parse(`${date}T12:00:00Z`)+2*86400000).toISOString().slice(0,10);
        if(!latest.has(concept)||date>latest.get(concept).date)remember(concept,date,!!correct,due);
        if(!correct)continue;
        successful.add(concept);
        if(date===day)credited.add(concept);
        else if(dayDistance(day,date)<=2)recent.add(concept);
      }
    }
    for(const concept of successful)encounters.set(concept,(encounters.get(concept)||0)+1);
  }
  // A completed *word*, not a direction-specific question, moves to the next
  // pass. Keep Year 7–8 and Year 9 as independent word-pool cycles.
  // seenCorrect is the existing persistent per-question correct count, so a
  // refreshed device retains the cycle; historical dated ledgers are a fallback.
  const rows=[];
  for(const [concept,variants] of words){
    const last=latest.get(concept);
    const correctInQuestions=variants.reduce((sum,q)=>sum+Math.max(0,Number(seenCorrect[q.id])||0),0);
    const correctInDaily=encounters.get(concept)||0;
    const correctTimes=Math.max(correctInQuestions,correctInDaily,last?.correct?1:0);
    const dueDate=last?.due||dueDates.get(concept);
    rows.push({concept,variants,correctTimes,due:!!dueDate&&dueDate<=day,
      wrong:last?.correct===false,recent:recent.has(concept),
      year9:concept.includes('-y9-concept-vocab-'),
      order:hash(`${seed}:${subject}:${concept}:rotation`)});
  }
  const year9Target=Math.min(3,size),selected=[],used=new Set();
  // Only repeat a successfully recalled word when the remaining pool in that
  // year is insufficient to fill the quota. Unanswered and wrong words lead.
  const rank=(a,b)=>a.correctTimes-b.correctTimes ||
    Number(!(a.wrong&&a.due))-Number(!(b.wrong&&b.due)) ||
    Number(a.recent)-Number(b.recent) || a.order-b.order ||
    a.concept.localeCompare(b.concept);
  function choose(pool,quota,prefix){
    const ordered=[...pool].sort(rank),result=[];
    for(const row of ordered){
      if(result.length>=quota || selected.length+result.length>=size)break;
      if(used.has(row.concept))continue;
      used.add(row.concept);
      const groupCycle=Math.min(...pool.map(x=>x.correctTimes));
      const bucket=row.wrong&&row.due?'vocabulary-error-review':
        row.correctTimes>groupCycle?'vocabulary-next-cycle':
        row.correctTimes===0?'vocabulary-first-cycle':'vocabulary-cycle-review';
      result.push({...row,bucket:prefix+bucket});
    }
    return result;
  }
  const y9=rows.filter(r=>r.year9),y8=rows.filter(r=>!r.year9);
  const selectedY9=choose(y9,year9Target,'year9-');
  // Ensure a 30-word session can still fill both quotas if the eligible bank is
  // small: return only real, distinct words, never fabricated questions.
  selected.push(...selectedY9);
  const selectedY8=choose(y8,size-selected.length,'');
  selected.push(...selectedY8);
  // Keep the order of cycle tiers (all still-unanswered words before old
  // successes); the hash makes each tier and each fresh session random.
  selected.sort((a,b)=>a.correctTimes-b.correctTimes ||
    hash(`${seed}:position:${a.concept}`)-hash(`${seed}:position:${b.concept}`) ||
    a.concept.localeCompare(b.concept));
  const directionCounts={toEnglish:0,toForeign:0};
  return selected.map((row,i)=>{
    const choices=row.variants.filter(q=>q.format!=='mc_single');
    const variants=choices.length?choices:row.variants;
    const preferred=directionCounts.toEnglish<=directionCounts.toForeign?'toEnglish':'toForeign';
    const oriented=variants.filter(q=>directionOf(q)===preferred);
    const alternatives=oriented.length?oriented:variants;
    const q=alternatives[hash(`${seed}:${row.concept}:direction`)%alternatives.length];
    const actual=directionOf(q);if(actual)directionCounts[actual]++;
    return {...q,_dailyBucket:row.bucket,_previousSeen:row.encounters,_dailyVocab:subject,
      _dailyYear8:true,_dailyYear9:row.year9,_adaptiveRank:i,_adaptiveBucket:row.bucket};
  });
}
