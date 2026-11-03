// Temporary, conservative Year 8 Mastery preflight.
// Counts checked against the actual enabled, formal source questions on
// 2026-11-03; multiple question formats with the same conceptId count ONCE.
// Do not infer pupil-specific remaining availability from these totals.
export const verifiedYear8MasteryConcepts=Object.freeze({
 'la-y8-nouns-and-dictionary-entries':{concepts:35,independent:35},
 'la-y8-nouns-with-genitives':{concepts:35,independent:35},
 'la-y8-core-verbs':{concepts:33,independent:33},
 'fr-y8-s02-weather-activities-and-opinions':{concepts:106,independent:106},
 'fr-y8-s03-home-family-and-descriptions':{concepts:79,independent:79},
 'fr-y8-s07-passe-compose':{concepts:61,independent:61},
 'fr-y8-s25-classroom-objects':{concepts:59,independent:59},
 'bio-y8-food-tests':{concepts:125,independent:58},
 'chem-y8-working-scientifically':{concepts:27,independent:11}
});
// Seven Year 8 Chemistry and twelve Year 8 Physics topics still have only
// nine independent concepts. Physics Energy stores now has nineteen after
// source QA, sufficient for Standard but NOT for twenty-concept Mastery.
export function canAssignVerifiedYear8Mastery(topicId){
 const row=verifiedYear8MasteryConcepts[String(topicId||'')];
 return !!row&&row.concepts>=25&&row.independent>=3;
}

/** Source-reverified concept totals for all 21 enabled Year 8 Physics/Chemistry packs.
 * These are not the number of question ID variants. 2026-11-03.
 * Unlisted science packs are conservatively not certifiable until audited.
 */
export const verifiedYear8ScienceStandardConcepts=Object.freeze({
 "chem-y8-acids-indicators-ph":9,
 "chem-y8-chemical-analysis":9,
 "chem-y8-conservation-equations":9,
 "chem-y8-formulae-valency":9,
 "chem-y8-metals-reactions":9,
 "chem-y8-neutralisation-salts":9,
 "chem-y8-reactivity-displacement-rusting":9,
 "chem-y8-working-scientifically":27,
 "phys-y8-circuits-current-voltage":9,
 "phys-y8-colour-eye":9,
 "phys-y8-electromagnets":9,
 "phys-y8-energy-stores-transfers":19,
 "phys-y8-forces-newton-motion":9,
 "phys-y8-light-reflection-refraction":9,
 "phys-y8-magnets-domains":9,
 "phys-y8-moments-levers":9,
 "phys-y8-power-efficiency":9,
 "phys-y8-pressure-density-fluids":9,
 "phys-y8-resistance-series-parallel":9,
 "phys-y8-speed-time-graphs":9,
 "phys-y8-universe-stars-gravity":9,
});
// Independent concept source audit of all 115 Year 8 topics with >=15
// enabled questions (Latin 31, French 30, Biology 33, Chemistry 8, Physics
// 13). These nine Latin/Biology topics contain fewer than ten distinct
// assessable concepts despite their question-ID counts.
export const verifiedYear8OtherShortConcepts=Object.freeze({
 "la-y8-adjective-agreement":6,
 "la-y8-miscellaneous-words":7,
 "bio-y8-dna-structure":8,
 "bio-y8-fats-cholesterol":9,
 "bio-y8-genetic-disorders":7,
 "bio-y8-limiting-factors":8,
 "bio-y8-nutrition-labels":8,
 "bio-y8-practical-conclusions":8,
 "bio-y8-punnett-squares":8,
});
export function canAssignVerifiedYear8Standard(topicId,minimum=10){
 const id=String(topicId||'');
 if(Object.prototype.hasOwnProperty.call(verifiedYear8OtherShortConcepts,id))
   return verifiedYear8OtherShortConcepts[id]>=minimum;
 if(/^((phys|chem)-y8-)/.test(id)){
   const concepts=verifiedYear8ScienceStandardConcepts[id];
   return Number.isInteger(concepts)&&concepts>=minimum;
 }
 return true;
}
