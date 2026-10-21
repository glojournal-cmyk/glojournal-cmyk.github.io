// Vocabulary only: Year 9 terms aligned to the current school Year 9 banks.
// Latin headwords and meanings are from la-y9-s01 regular/irregular verb and adjective exercises.
// French entries are from the existing Year 9 curriculum-aligned French revision list.
const LATIN_YEAR9 = [
  ['audio','hear','la-y9-s01-regular-verbs'],
  ['moneo','warn','la-y9-s01-regular-verbs'],
  ['porto','carry','la-y9-s01-regular-verbs'],
  ['traho','drag','la-y9-s01-regular-verbs'],
  ['eo','go','la-y9-s01-irregular-verbs'],
  ['possum','be able','la-y9-s01-irregular-verbs'],
  ['sum','be','la-y9-s01-irregular-verbs'],
  ['fortis','brave','la-y9-s01-adjective-declensions'],
  ['ingens','huge','la-y9-s01-adjective-declensions'],
  ['laetus','happy','la-y9-s01-adjective-declensions'],
  ['pulcher','beautiful','la-y9-s01-adjective-declensions']
];
const normal = t => String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[’‘]/g,"'").replace(/[^a-z' ]/g,' ').replace(/\s+/g,' ').trim();
// One French headword, or an article plus a single headword; never a clause.
export function frenchHeadword(term) {
  const t=String(term||'').trim();
  if(/[.!?;:\n]/.test(t) || /^(?:je|j'|tu|il|elle|nous|vous|ils|elles)\b/i.test(t))return false;
  return /^(?:(?:un|une|le|la|les|l'|des)\s*)?[a-zàâäçéèêëîïôöùûüÿœæ'-]+$/i.test(t);
}
const frAnswers = source => String(source||'').split(/\s*\/\s*/).map(x=>x.trim()).filter(Boolean);
function question({subject,term,english,topicId,id},toEnglish) {
  const target=subject==='french'?'French':'Latin',direction=toEnglish?`${target} → English`:`English → ${target}`;
  const glossary=toEnglish?frAnswers(english):[term];
  return {
    id:`daily-${subject}-y9-${id}-${toEnglish?'to-english':'from-english'}`,
    conceptId:`${subject==='french'?'fr':'la'}-y9-concept-vocab-${id}`,
    topicId,topic:'Year 9 vocabulary',year:9,status:'enabled',formal:true,preview:false,ordinary:true,
    format:'typed_exact',difficulty:2,
    prompt:toEnglish?`VOCAB — Give the English meaning of this ${target} word.`:`VOCAB — Write the ${target} word for this English meaning.`,
    stimulus:{text:toEnglish?term:english,direction},
    answer:{mode:'exact_or_equivalent',accepted:glossary,normalization:subject==='french'?
      {ignoreCase:true,ignoreExtraWhitespace:true,normalizeApostrophes:true,ignoreTerminalPunctuation:true,
       ignoreFrenchDiacriticsForScore:true,showAccentFeedback:true}:undefined},
    task:{label:'VOCAB',instruction:'Type the vocabulary answer; no sentence translation.'},
    feedback:{short:`${term} → ${english}. Year 9 vocabulary.`,steps:[`Learn the word: ${term} = ${english}.`],
      commonError:'Check the exact headword and spelling.',remember:`${term} ↔ ${english}`}
  };
}
export function year9DailyVocabulary(subject, frenchRows=[]) {
  const rows=subject==='latin'
    ? LATIN_YEAR9.map(([term,english,topicId],i)=>({term,english,topicId,id:`la-${i+1}`}))
    : subject==='french'
      ? frenchRows.filter(r=>r?.year===9&&r.spelling!==false&&r.topic==='Paris & travel'&&
          frenchHeadword(r.french)&&r.english&&!/[!?]/.test(r.english))
        .map(r=>({term:r.french,english:r.english,topicId:'fr-y9-20260919-unit-1-holidays-and-opinions',id:r.id}))
      : [];
  const unique=new Map();
  for(const row of rows)if(!unique.has(normal(row.term)))unique.set(normal(row.term),row);
  return [...unique.values()].flatMap(row=>[question({subject,...row},true),question({subject,...row},false)]);
}
