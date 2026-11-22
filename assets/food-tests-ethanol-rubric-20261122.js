// Targeted, reviewable 2-mark rubric. All other science questions keep their scorer.
// No content approval or Daily credit policy is implied by this function.
export function scoreFoodTestsEthanolSafety(response){
 const s=String(response??"").normalize("NFKC").toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g," ").trim();
 const safety=(/\b(?:ethanol|alcohol|it)\b.{0,65}\b(?:flammable|inflammable|combustible|fire hazard|fire risk|catch(?:es)? fire|ignite|ignites|burns?)\b/.test(s)
   ||/\b(?:ethanol|alcohol)\b.{0,50}\b(?:burn|burns|ignites|ignite)\b/.test(s))
  && !/\b(?:ethanol|alcohol|it)\s+(?:is|was|are)\s+not\s+flammable\b/.test(s)
  && !/\b(?:ethanol|alcohol|it)\s+(?:cannot|can't|can not|does not)\s+(?:ignite|burn|catch fire)\b/.test(s);
 const contradiction=/\b(?:without|not|never|no|don't|do not)\s+(?:\w+\s+){0,3}?(?:shake|shaking|shook|mix|mixing|mixed|stir|stirring|swirl|swirling)\b/.test(s)
  ||(/\b(?:heat|heating|heated|warm|warming|warmed|boil|boiling|boiled)\s+(?:up\s+)?(?:the\s+)?(?:ethanol|alcohol)\b/.test(s)
  && !/\b(?:no|not|never|don't|does not|without|must not|should not)\s+(?:\w+\s+){0,2}?(?:heat|heating|heated|warm|warming|warmed|boil|boiling|boiled)\s+(?:the\s+)?(?:ethanol|alcohol)\b/.test(s))
  ||/\bwater\b.{0,25}\b(?:before|then|first|followed by)\b.{0,25}\b(?:ethanol|alcohol)\b|\b(?:add|adding)\s+(?:the\s+)?water\s+first\b/.test(s)
  ||/\b(?:mix|mixed|mixing|add|added|adding)\s+(?:the\s+)?(?:ethanol and water|water and ethanol)\b/.test(s);
 const clauses=s.split(/[.!?;\n]/).map(x=>x.trim()).filter(Boolean);
 const hasAct=clauses.some(clause=>
  (/\b(?:shake|shaking|shook|mix|mixed|mixing|stir|stirring|swirl|swirling)\b.{0,70}\b(?:ethanol|alcohol)\b|\b(?:ethanol|alcohol)\b.{0,70}\b(?:shake|shaking|shook|mix|mixed|mixing|stir|stirring|swirl|swirling)\b/.test(clause))
  && /\b(?:sample|food|extract|mixture)\b/.test(clause));
 const actionPos=s.search(/\b(?:shake|shaking|shook|mix|mixed|mixing|stir|stirring|swirl|swirling)\b[^.!?;\n]{0,70}\b(?:ethanol|alcohol)\b|\b(?:ethanol|alcohol)\b[^.!?;\n]{0,70}\b(?:shake|shaking|shook|mix|mixed|mixing|stir|stirring|swirl|swirling)\b/);
 const waterPos=s.search(/\b(?:add|adding|added|pour|pouring)\s+(?:in\s+)?(?:some\s+)?(?:the\s+)?water\b|\bwater\s+(?:(?:is|was|should be|will be)\s+)?(?:then\s+)?added\b/);
 const procedure=hasAct&&actionPos>=0&&waterPos>actionPos&&!contradiction;
 const pointResults=[!!safety,!!procedure];
 const score=pointResults.filter(Boolean).length;
 return {score,total:2,ok:score===2,pointResults,errorKind:score===2?"none":score===1?"partial":"wrong"};
}
