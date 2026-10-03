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

export function selectDailyVocabulary({subject, items = [], day, ledger = {}, reviews = {}, size = 30}) {
  const words = new Map(), byId = new Map();
  for (const q of items) {
    if (!vocabularyQuestion(q, subject)) continue;
    byId.set(q.id, q.conceptId);
    if (!words.has(q.conceptId)) words.set(q.conceptId, []);
    words.get(q.conceptId).push(q);
  }
  const credited = new Set(), recent = new Set(), encounters = new Map();
  for (const [date, subjects] of Object.entries(ledger)) {
    if (date > day) continue;
    const successful = new Set();
    for (const [id, correct] of Object.entries(subjects?.[subject]?.items || {})) {
      const concept = byId.get(id);
      if (!concept || !correct) continue;
      successful.add(concept);
      if (date === day) credited.add(concept);
      else if (dayDistance(day, date) <= 2) recent.add(concept);
    }
    for (const concept of successful) encounters.set(concept, (encounters.get(concept) || 0) + 1);
  }
  const rows = [];
  for (const [concept, variants] of words) {
    if (credited.has(concept)) continue;
    const due = variants.some(q => reviews[q.id]?.due && reviews[q.id].due <= day);
    const typed = variants.filter(q => q.format !== 'mc_single');
    const choices = [...(typed.length ? typed : variants)].sort((a,b) => a.id.localeCompare(b.id));
    const question = choices[hash(`${day}:${subject}:${concept}:direction`) % choices.length];
    rows.push({concept, question, due, recent:recent.has(concept), encounters:encounters.get(concept)||0,
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
  // At most six scheduled words first; the rest prioritise fresh or less-seen vocabulary.
  take(rows.filter(row => row.due), Math.min(6,size), 'vocabulary-spaced-due');
  take(rows.filter(row => !row.due && !row.recent), size-selected.length, 'vocabulary-rotation');
  take(rows.filter(row => !row.recent), size-selected.length, 'vocabulary-due-refill');
  // A small exhausted bank can repeat recent words, but never the same word twice in a set.
  take(rows, size-selected.length, 'vocabulary-small-bank-refill');
  return selected;
}
