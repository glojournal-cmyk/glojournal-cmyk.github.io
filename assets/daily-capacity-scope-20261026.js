// Reviewed subject/year curriculum families; original question topic IDs stay intact.
// Do not use alphabetical catalog unit numbers as pedagogical equivalence.
const families = {
  "latin:8:nominals": [
    "la-y8-accusative-forms",
    "la-y8-adjective-agreement",
    "la-y8-case-and-grammar-role",
    "la-y8-case-functions",
    "la-y8-case-role-introduction",
    "la-y8-declension-recognition",
    "la-y8-genitive-phrases",
    "la-y8-ille-plural",
    "la-y8-ille-singular",
    "la-y8-nouns-and-dictionary-entries",
    "la-y8-nouns-with-genitives",
    "la-y8-personal-pronouns",
    "la-y8-possessives",
    "la-y8-vocative"
  ],
  "latin:8:reading-translation": [
    "la-y8-choose-the-complete-translation",
    "la-y8-choose-the-exact-latin",
    "la-y8-choose-the-set-text-translation",
    "la-y8-complete-comprehension",
    "la-y8-english-latin",
    "la-y8-latin-english",
    "la-y8-production-method",
    "la-y8-research-questions",
    "la-y8-restore-the-sentence",
    "la-y8-restore-the-set-text",
    "la-y8-set-text-comprehension",
    "la-y8-set-text-grammar",
    "la-y8-set-text-translation",
    "la-y8-test-style-production",
    "la-y8-test-style-translation",
    "la-y8-translation-method",
    "la-y8-whole-passage-understanding"
  ],
  "latin:8:vocabulary": [
    "la-y8-core-verbs",
    "la-y8-miscellaneous-words",
    "la-y8-stage-1-vocabulary",
    "la-y8-stage-10-vocabulary",
    "la-y8-stage-11-vocabulary",
    "la-y8-stage-12-vocabulary",
    "la-y8-stage-2-vocabulary",
    "la-y8-stage-3-vocabulary",
    "la-y8-stage-4-vocabulary",
    "la-y8-stage-5-vocabulary",
    "la-y8-stage-6-vocabulary",
    "la-y8-stage-7-vocabulary",
    "la-y8-stage-8-vocabulary",
    "la-y8-stage-9-vocabulary"
  ],
  "latin:8:verbs": [
    "la-y8-find-the-finite-verb",
    "la-y8-finite-verb-control",
    "la-y8-perfect-cues",
    "la-y8-perfect-patterns",
    "la-y8-person-and-number",
    "la-y8-pluperfect-recognition",
    "la-y8-present-person-and-number",
    "la-y8-restore-the-exact-verb",
    "la-y8-set-text-verb-meaning",
    "la-y8-set-text-verb-tense",
    "la-y8-tense-in-context",
    "la-y8-tense-meaning",
    "la-y8-tense-purpose",
    "la-y8-tense-recognition",
    "la-y8-tense-recognition-from-models"
  ],
  "latin:8:places-prepositions": [
    "la-y8-map-locations",
    "la-y8-photo-prepositions",
    "la-y8-preposition-dictionary-entries",
    "la-y8-prepositions",
    "la-y8-why-each-place-matters"
  ],
  "latin:9:nominals": [
    "la-y9-s01-adjective-declensions",
    "la-y9-s01-case-functions",
    "la-y9-s01-is-ea-id",
    "la-y9-s01-noun-declensions",
    "la-y9-s01-personal-pronouns",
    "la-y9-s01-possessives"
  ],
  "latin:9:reading-translation": [
    "la-y9-s01-infinitives-imperatives",
    "la-y9-20260919-chapter-3-part-i",
    "la-y9-20260919-chapter-3-part-ii",
    "la-y9-20260919-chapter-4-part-i",
    "la-y9-20260919-chapter-4-part-ii",
    "la-y9-20260919-chapter-5-part-i",
    "la-y9-20260919-chapter-5-part-ii",
    "la-y9-20260919-chapter-6-part-i",
    "la-y9-20260919-chapter-6-part-ii",
    "la-y9-20260919-chapters-1-and-2-revision",
    "la-y9-20260919-dictionary-skills",
    "la-y9-20260919-numbers"
  ],
  "latin:9:verbs": [
    "la-y9-s01-irregular-verbs",
    "la-y9-s01-regular-verbs"
  ],
  "french:8:communication": [
    "fr-y8-s01-quick-rules",
    "fr-y8-s02-weather-activities-and-opinions",
    "fr-y8-s03-home-family-and-descriptions",
    "fr-y8-s04-food-drink-and-restaurants",
    "fr-y8-s05-town-time-and-aller",
    "fr-y8-s09-model-answers-and-sentence-building",
    "fr-y8-s10-accuracy-traps",
    "fr-y8-s11-master-vocabulary",
    "fr-y8-s12-ks3-extension-irregular-verbs",
    "fr-y8-s17-unit-3-overview",
    "fr-y8-s18-school-descriptions",
    "fr-y8-s19-subjects-opinions-and-reasons",
    "fr-y8-s20-school-activities",
    "fr-y8-s22-high-scoring-structures",
    "fr-y8-s23-targeted-practice",
    "fr-y8-s24-numbers-and-age",
    "fr-y8-s25-classroom-objects",
    "fr-y8-s27-teacher-targets-extension-structures",
    "fr-y8-s28-french-speaking-school-life-reading",
    "fr-y8-s29-mixed-assessment",
    "fr-y8-s30-supplementary-teacher-vocabulary",
    "fr-y8-s32-accuracy-repair"
  ],
  "french:8:present": [
    "fr-y8-s06-present-tense",
    "fr-y8-s13-reflexives-and-routine",
    "fr-y8-s16-daily-routine-toolkit",
    "fr-y8-s21-reflexives-and-negatives",
    "fr-y8-s31-regular-present-patterns"
  ],
  "french:8:past-tense": [
    "fr-y8-s07-passe-compose",
    "fr-y8-s08-expanded-past-participle-bank",
    "fr-y8-s26-passe-compose-activity-bank"
  ],
  "french:9:communication": [
    "fr-y9-u1-paris-travel",
    "fr-y9-u1-recent-event-postcard",
    "fr-y9-u2-leisure-time",
    "fr-y9-u2-comparatives-superlatives",
    "fr-y9-u3-personal-family-friends",
    "fr-y9-u3-adjectives-social-daily-life",
    "fr-y9-u3-authentic-spoken",
    "fr-y9-u4-five-tense-synthesis",
    "fr-y9-a1-five-tense-checkpoint",
    "fr-y9-a2-postcard-practice",
    "fr-y9-a3-speaking-conversation-rehearsal",
    "fr-y9-a4-end-of-year-mixed-checkpoint",
    "fr-y9-a5-listening-rehearsal",
    "fr-y9-20260919-pronunciation",
    "fr-y9-20260919-song-worksheet-vocabulary",
    "fr-y9-20260919-unit-1-cafe-and-restaurant",
    "fr-y9-20260919-unit-1-holidays-and-opinions",
    "fr-y9-20260919-unit-1-places-and-activities",
    "fr-y9-20260919-unit-2-leisure-and-reasons",
    "fr-y9-20260919-unit-3-esther-chez-eugenie",
    "fr-y9-20260919-unit-3-esther-la-famille",
    "fr-y9-20260919-useful-language-and-connectors"
  ],
  "french:9:past-tense": [
    "fr-y9-u1-perfect-tense",
    "fr-y9-u1-perfect-negatives",
    "fr-y9-u2-imperfect",
    "fr-y9-u2-past-present-change",
    "fr-y9-u2-perfect-vs-imperfect",
    "fr-y9-20260919-irregular-past-participles",
    "fr-y9-20260919-perfect-tense-and-agreement",
    "fr-y9-20260919-unit-2-childhood-and-imperfect"
  ],
  "french:9:culture": [
    "fr-y9-u2-revolution-marie-antoinette",
    "fr-y9-20260919-francophone-culture"
  ],
  "english:9:general": [
    "eng-y9-u1-dystopian-genre",
    "eng-y9-u1-dystopian-writing",
    "eng-y9-u2-othello-iago",
    "eng-y9-u2-analysis-argument",
    "eng-y9-u3-northanger-gothic",
    "eng-y9-u3-northanger-essay",
    "eng-y9-u4-journalism-rhetoric",
    "eng-y9-u5-ww1-poetry"
  ],
  "biology:8:nutrition": [
    "bio-y8-balanced-diet",
    "bio-y8-ber",
    "bio-y8-digestion-absorption",
    "bio-y8-energy-bmi",
    "bio-y8-enzymes-gut",
    "bio-y8-fats-cholesterol",
    "bio-y8-food-tests",
    "bio-y8-nutrition-labels"
  ],
  "biology:8:ecology": [
    "bio-y8-binomial-naming",
    "bio-y8-classification",
    "bio-y8-competition",
    "bio-y8-ecology-terms",
    "bio-y8-food-chains-webs",
    "bio-y8-pollutants-indicators",
    "bio-y8-predator-prey-adaptations",
    "bio-y8-pyramids-energy"
  ],
  "biology:8:inheritance": [
    "bio-y8-continuous-variation",
    "bio-y8-correlation",
    "bio-y8-dna-genes",
    "bio-y8-dna-structure",
    "bio-y8-fertilisation-inheritance",
    "bio-y8-genetic-disorders",
    "bio-y8-natural-selection",
    "bio-y8-punnett-squares",
    "bio-y8-variation-mutation"
  ],
  "biology:8:health": [
    "bio-y8-drugs-alcohol",
    "bio-y8-smoking-health"
  ],
  "biology:8:scientific-method": [
    "bio-y8-graphs-calculations",
    "bio-y8-practical-conclusions",
    "bio-y8-variables-quality",
    "bio-y8-mixed-exam"
  ],
  "biology:8:photosynthesis": [
    "bio-y8-leaf-structure",
    "bio-y8-light-colour-practical",
    "bio-y8-limiting-factors",
    "bio-y8-minerals-greenhouse",
    "bio-y8-photosynthesis-glucose",
    "bio-y8-starch-evidence"
  ],
  "biology:9:cells-microscopy": [
    "bio-y9-b1",
    "bio-y9-b2",
    "bio-y9-b3",
    "bio-y9-school-20260927-01",
    "bio-y9-school-20260927-02",
    "bio-y9-school-20260927-03",
    "bio-y9-school-20260927-04"
  ],
  "biology:9:transport": [
    "bio-y9-b10",
    "bio-y9-b8",
    "bio-y9-b9"
  ],
  "biology:9:respiration": [
    "bio-y9-b11",
    "bio-y9-b12",
    "bio-y9-b13"
  ],
  "biology:9:photosynthesis": [
    "bio-y9-b14",
    "bio-y9-b15",
    "bio-y9-b16"
  ],
  "biology:9:microbiology": [
    "bio-y9-b4",
    "bio-y9-school-20260927-05",
    "bio-y9-school-20260927-06"
  ],
  "biology:9:inheritance": [
    "bio-y9-b5",
    "bio-y9-b6",
    "bio-y9-b7"
  ],
  "chemistry:8:acids": [
    "chem-y8-acids-indicators-ph",
    "chem-y8-neutralisation-salts"
  ],
  "chemistry:8:scientific-method": [
    "chem-y8-chemical-analysis",
    "chem-y8-working-scientifically"
  ],
  "chemistry:8:formulae": [
    "chem-y8-conservation-equations",
    "chem-y8-formulae-valency"
  ],
  "chemistry:8:metals": [
    "chem-y8-metals-reactions",
    "chem-y8-reactivity-displacement-rusting"
  ],
  "chemistry:9:atomic-elements": [
    "chem-y9-c1",
    "chem-y9-c2",
    "chem-y9-c5",
    "chem-y9-c6"
  ],
  "chemistry:9:organic": [
    "chem-y9-c10",
    "chem-y9-c11",
    "chem-y9-c12",
    "chem-y9-c8",
    "chem-y9-c9"
  ],
  "chemistry:9:rates": [
    "chem-y9-c13",
    "chem-y9-c14"
  ],
  "chemistry:9:atmosphere": [
    "chem-y9-c15",
    "chem-y9-c16",
    "chem-y9-c17"
  ],
  "chemistry:9:separation": [
    "chem-y9-c3",
    "chem-y9-c4"
  ],
  "chemistry:9:equations": [
    "chem-y9-c7"
  ],
  "physics:8:electricity-magnetism": [
    "phys-y8-circuits-current-voltage",
    "phys-y8-electromagnets",
    "phys-y8-magnets-domains",
    "phys-y8-resistance-series-parallel"
  ],
  "physics:8:light": [
    "phys-y8-colour-eye",
    "phys-y8-light-reflection-refraction"
  ],
  "physics:8:energy": [
    "phys-y8-energy-stores-transfers",
    "phys-y8-power-efficiency"
  ],
  "physics:8:mechanics": [
    "phys-y8-forces-newton-motion",
    "phys-y8-moments-levers",
    "phys-y8-pressure-density-fluids",
    "phys-y8-speed-time-graphs"
  ],
  "physics:8:space": [
    "phys-y8-universe-stars-gravity"
  ],
  "physics:9:particle-thermal": [
    "phys-y9-p1",
    "phys-y9-p10",
    "phys-y9-p11",
    "phys-y9-p12",
    "phys-y9-p2",
    "phys-y9-p3",
    "phys-y9-p4",
    "phys-y9-p5",
    "phys-y9-p6",
    "phys-y9-p7",
    "phys-y9-p9"
  ],
  "physics:9:energy": [
    "phys-y9-p13",
    "phys-y9-p14",
    "phys-y9-p15",
    "phys-y9-p18",
    "phys-y9-p8"
  ],
  "physics:9:springs": [
    "phys-y9-p16",
    "phys-y9-p17"
  ],
  "french:9:future": [
    "fr-y9-20260919-future-and-time-frames",
    "fr-y9-20260919-unit-1-weather-and-future",
    "fr-y9-20260919-unit-3-esther-le-futur",
    "fr-y9-oct17-future-tense-holidays",
    "fr-y9-oct17-future-tense-holidays-vocabulary",
    "fr-y9-oct17-future-tense-holidays-reading-translation"
  ],
  "french:9:present": [
    "fr-y9-20260919-present-and-reflexive-verbs"
  ]
};
const familyByTopic = new Map(Object.entries(families).flatMap(([key,ids])=>ids.map(id=>[id,key])));
export function compatibleDailyTopic(assigned,actual){
 return !assigned || assigned===actual || (familyByTopic.has(assigned)&&familyByTopic.get(assigned)===familyByTopic.get(actual));
}
export function dailyTopicPool(topics,assigned){
 const rows=(topics||[]).filter(t=>compatibleDailyTopic(assigned,t.topicId)&&t.status!=='disabled'&&t.status!=='preview'&&t.gated!==true);
 rows.sort((a,b)=>Number(b.topicId===assigned)-Number(a.topicId===assigned));
 return rows.some(t=>t.topicId===assigned)?rows:[{topicId:assigned},...rows];
}
