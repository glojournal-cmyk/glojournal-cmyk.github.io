// Daily vocabulary uses taught word/phrase concepts, never grammar or comprehension tasks.
export function vocabularyQuestion(q, subject) {
  const prefix = subject === 'french' ? 'fr' : subject === 'latin' ? 'la' : '';
  return !!prefix && q?.status !== 'disabled' && q?.formal !== false &&
    String(q?.conceptId || '').startsWith(`${prefix}-y8-concept-vocab-`) &&
    ['typed_exact','typed_equivalent','controlled_translation','spelling_restore','mc_single'].includes(q.format) &&
    Array.isArray(q.answer?.accepted) && q.answer.accepted.length > 0;
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

export function selectDailyVocabulary({subject, items = [], day, ledger = {}, reviews = {}, spellingDue = {}, legacyVocabulary = [], size = 30}) {
  const words = new Map(), byId = new Map();
  for (const q of items) {
    if (!vocabularyQuestion(q, subject)) continue;
    byId.set(q.id, q.conceptId);
    if (!words.has(q.conceptId)) words.set(q.conceptId, []);
    words.get(q.conceptId).push(q);
  }
  // Old dictation/Vocabulary IDs differ from topic-bank question IDs. Match the taught
  // word, so an existing iPad's mistakes survive the move to the daily topic bank.
  const wordConcepts = new Map(), aliases = new Map();
  for (const [concept, variants] of words) for (const q of variants) {
    for (const term of [q.stimulus?.text,...q.answer.accepted]) {
      const key = wordKey(term);
      if (!key) continue;
      if (!wordConcepts.has(key)) wordConcepts.set(key,new Set());
      wordConcepts.get(key).add(concept);
    }
  }
  for (const row of legacyVocabulary) {
    if (Number(row.year ?? 8) > 8) continue;
    const term = subject === 'french' ? row.french : row.latin;
    aliases.set(row.id,[...(wordConcepts.get(wordKey(term)) || [])]);
  }
  const conceptsFor = id => byId.has(id) ? [byId.get(id)] : aliases.get(id) || [];
  const latest = new Map(), dueDates = new Map();
  const remember = (concept, date, correct, due) => {
    const before = latest.get(concept);
    if (!before || date >= before.date) {
      latest.set(concept,{date,correct,due});
      if (due) dueDates.set(concept,due);
    }
  };
  const failedOn = review => review.last || new Date(Date.parse(`${review.due}T12:00:00Z`)-2*86400000).toISOString().slice(0,10);
  for (const [id, review] of Object.entries(reviews)) for (const concept of conceptsFor(id)) {
    if (review?.due) remember(concept,(review.wrong ? failedOn(review) : review.last || '')+(review.lastAt ? 'T'+review.lastAt : ''),review.wrong !== true,review.due);
  }
  for (const [id, review] of Object.entries(spellingDue)) for (const concept of conceptsFor(id)) {
    if (review?.wrong && review.due) remember(concept,failedOn(review)+(review.lastAt ? 'T'+review.lastAt : ''),false,review.due);
  }
  const credited = new Set(), recent = new Set(), encounters = new Map();
  for (const [date, subjects] of Object.entries(ledger).sort(([a],[b]) => a.localeCompare(b))) {
    if (date > day) continue;
    const successful = new Set();
    for (const [id, correct] of Object.entries(subjects?.[subject]?.items || {})) {
      for (const concept of conceptsFor(id)) {
        const due = latest.get(concept)?.due || new Date(Date.parse(`${date}T12:00:00Z`)+2*86400000).toISOString().slice(0,10);
        if (!latest.has(concept) || date > latest.get(concept).date) remember(concept,date,!!correct,due);
        if (!correct) continue;
        successful.add(concept);
        if (date === day) credited.add(concept);
        else if (dayDistance(day, date) <= 2) recent.add(concept);
      }
    }
    for (const concept of successful) encounters.set(concept, (encounters.get(concept) || 0) + 1);
  }
  const rows = [];
  for (const [concept, variants] of words) {
    if (credited.has(concept)) continue;
    const last = latest.get(concept), wrong = last?.correct === false;
    const dueDate = wrong ? last.due : dueDates.get(concept);
    const due = !!dueDate && dueDate <= day;
    // A mistake waits for its spaced-review date instead of immediately repeating.
    if (wrong && !due) continue;
    const typed = variants.filter(q => q.format !== 'mc_single');
    const choices = [...(typed.length ? typed : variants)].sort((a,b) => a.id.localeCompare(b.id));
    const question = choices[hash(`${day}:${subject}:${concept}:direction`) % choices.length];
    rows.push({concept, question, due, wrong, recent:recent.has(concept), encounters:encounters.get(concept)||0,
      order:hash(`${day}:${subject}:${concept}:rotation`)});
  }
  const rank = (a,b) => Number(a.recent)-Number(b.recent) || a.encounters-b.encounters || a.order-b.order || a.concept.localeCompare(b.concept);
  const selected = [], used = new Set();
  const take = (candidates, count, bucket) => {
    for (const row of candidates.sort(rank)) {
      if (selected.length >= size || count <= 0) break;
      if (used.has(row.concept)) continue;
      used.add(row.concept);
      selected.push({...row.question, _dailyBucket:bucket, _dailyVocab:subject, _dailyYear8:true,
        _adaptiveRank:selected.length, _adaptiveBucket:bucket});
      count--;
    }
  };
  // Mistakes have priority over routine reviews, even when answered in the other direction.
  take(rows.filter(row => row.due && row.wrong), Math.min(10,size), 'vocabulary-error-review');
  take(rows.filter(row => row.due && !row.wrong), Math.min(6,size-selected.length), 'vocabulary-spaced-due');
  take(rows.filter(row => !row.due && !row.recent), size-selected.length, 'vocabulary-rotation');
  take(rows.filter(row => !row.wrong && !row.recent), size-selected.length, 'vocabulary-due-refill');
  // A small exhausted bank can repeat recent words, but never the same word twice in a set.
  take(rows.filter(row => !row.wrong), size-selected.length, 'vocabulary-small-bank-refill');
  return selected;
}
