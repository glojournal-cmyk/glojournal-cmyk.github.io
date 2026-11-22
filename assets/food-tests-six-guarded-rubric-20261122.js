// QA-only: targeted one- or two-point rubrics for six Year 8 Food Tests items.
// Do not apply to other science or language questions. Limited rule-based
// checks; independent Academic QA is required before any approval/deployment.
export const FOOD_TESTS_GUARDED_IDS = Object.freeze([
 "bio-y8-food-tests-iodine-solution-explain",
 "bio-y8-food-tests-application-20261025-biuret-control",
 "bio-y8-food-tests-application-20261025-fair-amount",
 "bio-y8-food-tests-application-20261025-sugar-strength",
 "bio-y8-food-tests-application-20261025-temperature-safety",
 "bio-y8-food-tests-application-20261025-positive-protein-negative-fat"
]);
const re=(s,p)=>p.test(s);
const normal=s=>String(s??"").normalize("NFKC").toLowerCase().replace(/[’‘]/g,"'").replace(/[–—]/g,"-").replace(/\s+/g," ").trim();
export function scoreFoodTestsGuarded(id,response){
 if(!FOOD_TESTS_GUARDED_IDS.includes(id))return null;
 const s=normal(response),cs=s.split(/[.!?;\n]/).map(x=>x.trim()).filter(Boolean);
 let p=[];
 switch(id){
 case "bio-y8-food-tests-iodine-solution-explain":{
  const contradict=re(s,/\biodine\b[^.!?;\n]{0,80}\b(?:test(?:s)?|detect(?:s)?|reagent|used\s+for|for)\b[^.!?;\n]{0,48}\b(?:protein|sugar|fat|lipid)\b/)
   ||re(s,/\biodine\b[^.!?;\n]{0,60}\b(?:not|never|cannot|can't|doesn't|does not)\b[^.!?;\n]{0,30}\bstarch\b/);
  const starchRole=re(s,/\b(?:test(?:s|ed|ing)?|detect(?:s|ed|ing)?|check(?:s|ed|ing)?|identif(?:y|ies)|reagent|indicat(?:e|es)|used\s+to|for)\b[^.!?;\n]{0,55}\bstarch\b/)
   ||re(s,/\bstarch\b[^.!?;\n]{0,50}\b(?:test|detected|identified|present)\b/);
  p=[starchRole&&!contradict];break;
 }
 case "bio-y8-food-tests-application-20261025-biuret-control":{
  const wrong=re(s,/\b(?:protein(?:\s+solution)?|albumin|egg)\b[^.!?;\n]{0,40}\bnegative\s+control\b/)
   ||re(s,/\bwater\b[^.!?;\n]{0,35}\bpositive\s+control\b/);
  const negativeWater=re(s,/\bwater\b[^.!?;\n]{0,40}\bnegative\s+control\b/)
   ||re(s,/\bnegative\s+control\b[^.!?;\n]{0,40}\bwater\b/);
  const waterControl=re(s,/\bwater\b[^.!?;\n]{0,40}\bcontrol\b/)
   ||re(s,/\bcontrol\b[^.!?;\n]{0,40}\bwater\b/);
  const expectsPurple=re(s,/\b(?:water|negative\s+control)\b[^.!?;\n]{0,45}\b(?:should|will|must|ought\s+to)\b[^.!?;\n]{0,12}\b(?:turn|stay|remain|be)\b[^.!?;\n]{0,18}\b(?:purple|lilac|violet)\b/);
  const expectedBlue=re(s,/\b(?:stay|stays|remain|remains|remaining|still|unchanged|should|will)\b[^.!?;\n]{0,22}\b(?:blue|unchanged)\b/)
   ||re(s,/\bblue\b[^.!?;\n]{0,25}\b(?:unchanged|remains|stays)\b/);
  const checksContamination=re(s,/\b(?:contaminat(?:ion|ed|e)|check(?:s|ing)?\s+(?:for\s+)?(?:purity|contamination)|uncontaminated)\b/);
  p=[negativeWater&&!wrong, (expectedBlue||checksContamination)&&(waterControl||re(s,/\bwater\b/))&&!wrong&&!expectsPurple];break;
 }
 case "bio-y8-food-tests-application-20261025-fair-amount":{
  const wrong=cs.some(c=>re(c,/\b(?:different|unequal|varying|very\s+different)\b[^.!?;\n]{0,55}\b(?:mass(?:es)?|amounts?|quantit(?:y|ies))\b[^.!?;\n]{0,55}\b(?:fairer|fair|valid|better|accurate)\b/));
  const controlled=re(s,/\b(?:mass(?:es)?|amounts?|quantit(?:y|ies)|bread\s+samples?)\b[^.!?;\n]{0,55}\b(?:control(?:led)?\s+variable|kept\s+(?:the\s+)?same|equal|identical|constant|fixed)\b/)
   ||re(s,/\b(?:equal|same|identical|constant|fixed|control(?:led)?)\b[^.!?;\n]{0,50}\b(?:mass(?:es)?|amounts?|quantit(?:y|ies)|bread)\b/);
  const fair=re(s,/\b(?:different|unequal|varying|vary|change(?:d)?)\b[^.!?;\n]{0,55}\b(?:mass(?:es)?|amounts?|quantit(?:y|ies))\b[^.!?;\n]{0,65}\b(?:unfair|unreliable|not\s+fair|not\s+valid|invalid|cannot\s+compare)\b/)
   ||re(s,/\b(?:equal|same|identical|constant|fixed)\b[^.!?;\n]{0,48}\b(?:mass(?:es)?|amounts?|quantit(?:y|ies)|bread)\b[^.!?;\n]{0,65}\b(?:fair|valid|reliable|compar(?:e|ison|able))\b/);
  p=[controlled&&!wrong,fair&&!wrong];break;
 }
 case "bio-y8-food-tests-application-20261025-sugar-strength":{
  const red=re(s,/\bbrick[- ]?red\b/),green=re(s,/\bgreen\b/);
  const backwards=re(s,/\bgreen\b[^.!?;\n]{0,75}\b(?:more|higher|greater|stronger|larger|concentrated)\b[^.!?;\n]{0,85}\bbrick[- ]?red\b/)
   ||re(s,/\bbrick[- ]?red\b[^.!?;\n]{0,75}\b(?:less|lower|weaker)\b[^.!?;\n]{0,85}\bgreen\b/);
  const comparison=re(s,/\bbrick[- ]?red\b[^.!?;\n]{0,70}\b(?:greater|higher|more|stronger|larger)\b[^.!?;\n]{0,85}\b(?:green|reducing\s+sugar|sugar)\b/)
   ||re(s,/\bgreen\b[^.!?;\n]{0,65}\b(?:less|lower|weaker)\b[^.!?;\n]{0,80}\bbrick[- ]?red\b/);
  const approximate=re(s,/\b(?:approximate|rough(?:ly)?|estimated?|estimate|qualitative|not\s+(?:an?\s+)?exact|rather\s+than\s+(?:an?\s+)?exact|cannot\s+(?:give|determine|measure)\s+(?:an?\s+)?exact)\b/);
  const falseExact=re(s,/\b(?:measures?|gives?|reports?|represents?)\b[^.!?;\n]{0,40}\b(?:an?\s+)?exact\b/)
    ||re(s,/\bcolou?r(?:s)?\b[^.!?;\n]{0,45}\bexact\b[^.!?;\n]{0,30}\b(?:amounts?|concentrations?)\b/);
  p=[red&&green&&comparison&&!backwards,approximate&&(!falseExact||re(s,/\b(?:not|rather\s+than)\b[^.!?;\n]{0,23}\bexact\b/))];break;
 }
 case "bio-y8-food-tests-application-20261025-temperature-safety":{
  const flameWrong=cs.some(c=>re(c,/\b(?:direct(?:ly)?|over|with|hold)\b[^.!?;\n]{0,30}\b(?:flame|bunsen)\b[^.!?;\n]{0,65}\b(?:safer|safe|more\s+even|more\s+controlled|better|uniform)\b/)
   ||re(c,/\b(?:flame|bunsen)\b[^.!?;\n]{0,65}\b(?:safer|safe|more\s+even|more\s+controlled|better|uniform)\b/));
  const bath=re(s,/\b(?:water[\s-]?bath|hot[- ]water\s+bath|indirect\s+heat(?:ing)?)\b/);
  const even=re(s,/\b(?:even(?:ly)?|controlled|uniform(?:ly)?|consistent(?:ly)?|steady|gentle|regulated|more\s+uniformly)\b[^.!?;\n]{0,45}\b(?:heat(?:s|ing)?|warm(?:s|ing)?)\b/)
   ||re(s,/\b(?:heat(?:s|ing)?|warm(?:s|ing)?)\b[^.!?;\n]{0,45}\b(?:even(?:ly)?|uniform(?:ly)?|controlled|consistently|more\s+uniformly)\b/);
  const safer=re(s,/\b(?:less|lower(?:s|ed)?|reduc(?:e|es|ed|ing)|avoid(?:s|ed)?|prevent(?:s|ed)?)\b[^.!?;\n]{0,75}\b(?:risk|splash(?:ing)?|overheat(?:ing)?|burn(?:s)?)\b/)
   ||re(s,/\b(?:risk|splash(?:ing)?|overheat(?:ing)?)\b[^.!?;\n]{0,50}\b(?:lower|less|reduced|avoided|prevented)\b/);
  p=[bath&&even&&!flameWrong,bath&&safer&&!flameWrong];break;
 }
 case "bio-y8-food-tests-application-20261025-positive-protein-negative-fat":{
  const purple=re(s,/\b(?:purple|lilac|violet)\b/),biuret=re(s,/\bbiuret\b/);
  const proteinWrong=re(s,/\bproteins?\b[^.!?;\n]{0,30}\b(?:absent|negative|not\s+(?:present|detected)|missing)\b/)
   ||re(s,/\b(?:no|not|without)\s+proteins?\b/);
  const proteinTrue=re(s,/\bproteins?\b[^.!?;\n]{0,35}\b(?:present|positive|detected|found|contain(?:s|ed)?)\b/)
   ||re(s,/\b(?:positive|detect(?:s|ed)?|found|indicat(?:e|es)|show(?:s|ed)?|means?|proves?|contains?)\b[^.!?;\n]{0,45}\bproteins?\b/);
  const fatNotDetected=re(s,/\b(?:fats?|lipids?)\b[^.!?;\n]{0,30}\b(?:not\s+(?:detected|found|present)|absent|negative|undetected|were\s+not\s+found)\b/)
   ||re(s,/\b(?:no|not)\s+(?:fats?|lipids?)\b/)
   ||re(s,/\b(?:did\s+not|does\s+not|no)\s+(?:detect|show|find)\b[^.!?;\n]{0,35}\b(?:fats?|lipids?)\b/)
   ||re(s,/\b(?:fats?|lipids?)\s+(?:was|were|is)\s+not\s+(?:detected|present|found)\b/);
  const noEmulsion=re(s,/\b(?:no|not|lack(?:s|ed)?\s+of|absence\s+of|without)\b[^.!?;\n]{0,30}\b(?:cloudy|white|milky)\b[^.!?;\n]{0,25}\bemulsion\b/)
   ||re(s,/\b(?:clear|transparent)\b[^.!?;\n]{0,25}\bemulsion\b/);
  const fatWrong=(re(s,/\b(?:fats?|lipids?)\b[^.!?;\n]{0,30}\b(?:present|positive|detected|confirmed)\b/)
    ||re(s,/\b(?:confirm(?:s|ed)?|proves?|indicates?)\b[^.!?;\n]{0,35}\b(?:fats?|lipids?)\b/))
   &&!fatNotDetected;
  p=[purple&&biuret&&proteinTrue&&!proteinWrong,noEmulsion&&fatNotDetected&&!fatWrong];break;
 }
 }
 const score=p.filter(Boolean).length,total=p.length;
 return {score,total,ok:score===total,pointResults:p,errorKind:score===total?"none":score>0?"partial":"wrong"};
}
