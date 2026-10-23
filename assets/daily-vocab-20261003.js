import {LATIN_BOOKLET_GROUPS} from './latin-vocabulary-booklet-20261023.js';
// Only independent word meanings, spellings and dictionary entries count as Daily Vocab.
// Grammar transformations, sentences and comprehension belong to their own subject practice.
function directionOf(q) {
  const d=String(q?.stimulus?.direction||'').toLowerCase(),p=String(q?.prompt||'').toLowerCase();
  if(d.includes('english') && /english\s*(?:→|->|to)\s*(?:french|latin)/.test(d))return 'toForeign';
  if(/(?:french|latin)\s*(?:→|->|to)\s*english/.test(d))return 'toEnglish';
  if(/translate into (?:french|latin)|write the (?:french|latin) entry|write the (?:french|latin) word|write the (?:exact )?latin form|write the (?:exact )?french form/.test(p) ||
     /-e2l$|-e2f$|-from-english$/.test(q.id||''))return 'toForeign';
  if(/translate into english|english meaning|best english meaning/.test(p) ||
     /-l2e$|-f2e$|-to-english$/.test(q.id||''))return 'toEnglish';
  return null;
}
function isHeadword(q,subject) {
  const dir=directionOf(q),terms=q?.answer?.accepted||[],stim=String(q?.stimulus?.text||'').trim();
  if(!terms.length||!stim)return false;
  // A taught word or compact dictionary/idiomatic chunk is vocabulary.
  // Do not silently remove useful multiword lexical items such as "près de"
  // or "faire du vélo"; still exclude full-sentence translation exercises.
  const foreign=String(dir==='toForeign'?terms[0]:stim).trim();
  if(!foreign||/[!?;:\n]|[.]$/.test(foreign)||foreign.split(/\s+/).length>6)return false;
  if(subject==='french' &&
    /^(?:je\b|j['’]|tu\b|elle\b|nous\b|vous\b|ils\b|elles\b)/i.test(foreign))return false;
  if(subject==='french' && /^il\s/i.test(foreign) &&
    !/^il\s+(?:fait|y\s+a|pleut|neige|gèle)\b/i.test(foreign))return false;
  if(subject==='latin' && /^(?:ego|tu|nos|vos)\s/i.test(foreign))return false;
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
  const words=new Map(),byId=new Map(),year8Terms=new Set();
  const add=(q,year9=false)=>{
    if(!q?.id||!Array.isArray(q.answer?.accepted)||!q.answer.accepted.length)return;
    const dir=directionOf(q);
    const term=String(q._vocabTerm||((dir==='toForeign')?q.answer.accepted[0]:q.stimulus?.text)||'').trim();
    const key=wordKey(term);
    if(!key)return;
    // A lexical item counts once, even if another Year 8 topic tests it
    // under a different conceptId or in the opposite translation direction.
    if(year9&&year8Terms.has(key))return;
    const concept=`${subject}-${year9?'y9':'y8'}-vocab-${key}`;
    if(!words.has(concept))words.set(concept,[]);
    if(!words.get(concept).some(x=>x.id===q.id))words.get(concept).push(q);
    byId.set(q.id,concept);
    if(!year9)year8Terms.add(key);
  };
  for(const q of items){
    if(!vocabularyQuestion(q,subject)||topicLearning[q.topicId]===false)continue;
    add(q,false);
  }
  // Include the entire existing Year 7–8 learner word bank, not just words
  // which already happen to have a matching enabled curriculum question.
  // Keep historic question IDs and their saved learning records untouched.
  for(const row of legacyVocabulary){
    if(Number(row.year??8)>8)continue;
    const foreign=String((subject==='french'?row.french:row.latin)||'').trim();
    if(!foreign||year8Terms.has(wordKey(foreign)))continue;
    const meaning=String(row.english||'').trim();
    if(!meaning)continue;
    const id='daily-'+subject+'-legacy-'+String(row.id);
    const q={
      id,conceptId:(subject==='french'?'fr':'la')+'-y8-concept-vocab-legacy-'+String(row.id),
      topicId:'daily-'+subject+'-legacy',topic:'Year 7–8 vocabulary',year:8,
      status:'enabled',formal:true,format:'typed_exact',
      prompt:'VOCAB — Give the English meaning of this '+(subject==='french'?'French':'Latin')+' word.',
      stimulus:{text:foreign,direction:(subject==='french'?'French':'Latin')+' → English'},
      answer:{mode:'exact_or_equivalent',accepted:[meaning,...(row.extra||[])].filter(Boolean)},
      feedback:{short:foreign+' means '+meaning+'.',steps:[foreign+' → '+meaning+'.'],remember:foreign+' ↔ '+meaning},
      task:{label:'VOCAB',instruction:'Translate the learned word or short phrase.'}
    };
    if(isHeadword(q,subject))add(q,false);
  }
  // Chapter 1–2 revision + the separate Numbers page belong to the older
  // pool, never to the daily quota of three new Year 9 words. Booklet variants
  // join old word concepts so existing iPad successes are NOT reset.
  if(subject==='latin')for(const book of LATIN_BOOKLET_GROUPS){
    if(!book.chapters.some(c=>c===1||c===2||c==='Numbers'))continue;
    const word=book.headword,latin=book.entries.join(' / ');
    const meanings=book.english.join('; ');
    const key=wordKey(word);
    const englishHint=book.accepted.find(x=>x.length<50&&!/[;,()]/.test(x))||meanings;
    for(const toEnglish of [true,false]){
      const id='daily-latin-booklet-y8-'+key+'-'+(toEnglish?'to-english':'from-english');
      const acceptedLatin=word==='a/ab'?['a','ab','a/ab']:
        word==='e/ex'?['e','ex','e/ex']:[word];
      const q={
        id,conceptId:'la-y8-concept-vocab-booklet-'+key,
        topicId:'daily-latin-booklet-chapter-1-2-numbers',topic:'Year 7–8 Latin vocabulary',
        year:8,status:'enabled',formal:true,format:'typed_exact',
        _vocabTerm:word,_bookletCanonical:true,_bookletChapters:book.chapters,
        _bookletEntries:book.entries,
        prompt:toEnglish?'VOCAB — Give the English meaning of this Latin word.':
          'VOCAB — Write the Latin word for this English meaning.',
        stimulus:{text:toEnglish?word:englishHint,
          direction:toEnglish?'Latin → English':'English → Latin'},
        answer:{mode:'exact_or_equivalent',accepted:toEnglish?book.accepted:acceptedLatin},
        feedback:{short:latin+' → '+meanings+'.',
          steps:[latin+' = '+meanings+'.'],remember:latin+' ↔ '+meanings},
        task:{label:'VOCAB',instruction:'Translate the learned Latin word.'}
      };
      if(isHeadword(q,'latin'))add(q,false);
    }
  }
  for(const q of year9Items){
    const year9=Number(q.year)===9&&String(q.conceptId||'').startsWith(
      (subject==='french'?'fr':'la')+'-y9-concept-vocab-');
    if(year9&&q.status!=='disabled'&&q.formal!==false&&isHeadword(q,subject))add(q,true);
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
      year9:concept.includes('-y9-vocab-'),
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
    // The textbook's complete gloss takes precedence over old abbreviated
    // meanings, while the earlier question IDs remain in history/rotation.
    const sourceVariants=row.variants.some(q=>q._bookletCanonical)
      ? row.variants.filter(q=>q._bookletCanonical):row.variants;
    const choices=sourceVariants.filter(q=>q.format!=='mc_single');
    const variants=choices.length?choices:sourceVariants;
    const preferred=directionCounts.toEnglish<=directionCounts.toForeign?'toEnglish':'toForeign';
    const oriented=variants.filter(q=>directionOf(q)===preferred);
    const alternatives=oriented.length?oriented:variants;
    const q=alternatives[hash(`${seed}:${row.concept}:direction`)%alternatives.length];
    const actual=directionOf(q);if(actual)directionCounts[actual]++;
    return {...q,_dailyBucket:row.bucket,_previousSeen:row.encounters,_dailyVocab:subject,
      _dailyYear8:!row.year9,_dailyYear9:row.year9,_adaptiveRank:i,_adaptiveBucket:row.bucket};
  });
}
