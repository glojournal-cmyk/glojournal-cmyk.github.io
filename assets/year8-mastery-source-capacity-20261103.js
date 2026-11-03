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
 'bio-y8-food-tests':{concepts:125,independent:58}
});
// Source-reverified Chemistry (8 topics) and Physics (13 topics) each have
// only NINE independent concept families, despite 32-35 question variants.
// They remain available in Standard, review and free practice, but not in a
// 20-distinct-question Year 8 Mastery until independent content is added.
export function canAssignVerifiedYear8Mastery(topicId){
 const row=verifiedYear8MasteryConcepts[String(topicId||'')];
 return !!row&&row.concepts>=25&&row.independent>=3;
}
