// Targeted, reviewable 2-mark rubric. All other science questions keep their scorer.
// No content approval or Daily credit policy is implied by this function.
export function scoreFoodTestsEthanolSafety(response){
 const s=String(response??"").normalize("NFKC").toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g," ").trim();
 let safety=(/\b(?:ethanol|alcohol|it)\b.{0,65}\b(?:flammable|inflammable|combustible|fire hazard|fire risk|catch(?:es)? fire|ignite|ignites|burns?)\b/.test(s)
   ||/\b(?:ethanol|alcohol)\b.{0,50}\b(?:burn|burns|ignites|ignite)\b/.test(s))
  && !/\b(?:ethanol|alcohol|it)\s+(?:is|was|are)\s+not\s+flammable\b/.test(s)
  && !/\b(?:ethanol|alcohol|it)\s+(?:cannot|can't|can not|does not)\s+(?:ignite|burn|catch fire)\b/.test(s);
 // A negated safety claim is not a positive safety explanation.
 const deniesFire=/\b(?:ethanol|alcohol|it)\b[^.!?;\n]{0,45}\b(?:(?:is|was|are)\s+(?:not\s+|non[-\s]?)(?:highly\s+|very\s+)?flammable|(?:isn't|isnt|wasn't|wasnt|aren't|arent)\s+(?:highly\s+|very\s+)?flammable|non[-\s]?flammable|(?:cannot|can't|cant|can not|doesn't|doesnt|does not)\s+(?:ignite|burn|catch fire))\b/.test(s);
 if(deniesFire)safety=false;
 const clauses=s.split(/[.!?;\n]/).map(x=>x.trim()).filter(Boolean);
 const hasAct=clauses.some(clause=>
  (/\b(?:shake|shaken|shaking|shook|mix|mixed|mixing|stir|stirring|swirl|swirling)\b.{0,70}\b(?:ethanol|alcohol)\b|\b(?:ethanol|alcohol)\b.{0,70}\b(?:shake|shaken|shaking|shook|mix|mixed|mixing|stir|stirring|swirl|swirling)\b/.test(clause))
  && /\b(?:sample|food|extract|mixture)\b/.test(clause));
 const actionPos=s.search(/\b(?:shake|shaken|shaking|shook|mix|mixed|mixing|stir|stirring|swirl|swirling)\b[^.!?;\n]{0,70}\b(?:ethanol|alcohol)\b|\b(?:ethanol|alcohol)\b[^.!?;\n]{0,70}\b(?:shake|shaken|shaking|shook|mix|mixed|mixing|stir|stirring|swirl|swirling)\b/);
 const waterPos=s.search(/\b(?:add|adding|added|pour|pouring)\s+(?:in\s+)?(?:some\s+)?(?:the\s+)?water\b|\bwater\s+(?:(?:is|was|should be|will be)\s+)?(?:then\s+)?added\b/);
 // Passive order is legitimate: water was added AFTER the sample
 // had been shaken with ethanol, even when "water" occurs first in the prose.
 const waterAddedAfter=/\bwater\b[^.!?;\n]{0,35}\b(?:added|poured|introduced)\s+after\b[^.!?;\n]{0,85}\b(?:shaken|shake|shook|mixed|mix|stirred)\b[^.!?;\n]{0,50}\b(?:ethanol|alcohol)\b/.test(s);
 const warningAgainstPremix=/\b(?:do not|don't|never|avoid|without)\s+(?:first\s+)?(?:mix|mixing|premix|pre-mix|shake|shaking)\s+(?:the\s+)?(?:ethanol|alcohol)\s+(?:and|with)\s+water\b/;
 const otherNegatedProcedure=clauses.some(clause=>
   /\b(?:without|not|never|no|don't|do not)\s+(?:\w+\s+){0,3}?(?:shake|shaken|shaking|shook|mix|mixing|mixed|stir|stirring|swirl|swirling)\b/.test(clause)
   && !warningAgainstPremix.test(clause));
 const unsafePremix=clauses.some(clause=>
   /\b(?:mix|mixed|mixing|add|added|adding)\s+(?:the\s+)?(?:ethanol and water|water and ethanol)\b/.test(clause)
   && !warningAgainstPremix.test(clause));
 // Do not let "water is then added. Alcohol is flammable" look like
 // "water then ethanol": sequencing must stay within a clause.
 const reversedOrder=clauses.some(clause=>
   /\bwater\b[^.!?;\n]{0,28}\b(?:before|then|first|followed by)\b[^.!?;\n]{0,30}\b(?:ethanol|alcohol)\b|\b(?:add|adding)\s+(?:the\s+)?water\s+first\b/.test(clause));
 const unsafeHeating=clauses.some(clause=>{
   const active=/\b(?:heat|heating|heated|warm|warming|warmed|boil|boiling|boiled)\s+(?:up\s+)?(?:the\s+)?(?:ethanol|alcohol)\b/g;
   const passive=/\b(?:ethanol|alcohol)\b[^.!?;\n]{0,25}\b(?:is|was|must be|should be|will be)\s+(?:heated|warmed|boiled)\b/g;
   for(const regex of [active,passive]){
     let match;while((match=regex.exec(clause))){
       const before=clause.slice(Math.max(0,match.index-35),match.index);
       const phrase=match[0];
       const negated=/\b(?:no|not|never|don't|does not|without|must not|should not|need not)\s+(?:\w+\s+){0,3}$/.test(before)
         ||/\b(?:not|never|without)\b/.test(phrase);
       if(!negated)return true;
     }
   }
   return false;
 });
 const procedure=hasAct&&actionPos>=0&&(waterPos>actionPos||waterAddedAfter)
   &&!otherNegatedProcedure&&!unsafePremix&&!reversedOrder&&!unsafeHeating;
 const pointResults=[!!safety,!!procedure];
 const score=pointResults.filter(Boolean).length;
 return {score,total:2,ok:score===2,pointResults,errorKind:score===2?"none":score===1?"partial":"wrong"};
}
