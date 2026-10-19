/**
 * Physics Practice: score science concepts, not punctuation or filler words.
 * No fuzzy edit-distance/spellchecking is used: misspelled key terms do not count.
 * Calculations, diagram labels, spelling restores and MC stay with the existing scorer.
 */
const STOP = new Set([
  "a","an","the","is","are","was","were","be","been","being","of","at","by",
  "in","on","to","for","with","that","which","where","when","its","it","this",
  "those","these","there","their","from","into","as","and","but","while",
  "through","per","each","one","around","or","therefore","state","claim"
]);
const ALIAS = {
  pascals:"pascal",newtons:"newton",joules:"joule",watts:"watt",poles:"pole",charges:"charge",particles:"particle",forces:"force",fields:"field",
  lines:"line",rays:"ray",stores:"store",transfers:"transfer",angles:"angle",
  magnets:"magnet",materials:"material",positions:"position",directions:"direction",
  systems:"system",currents:"current",volts:"volt",amperes:"ampere",amps:"ampere",
  flows:"flow",flowing:"flow",moves:"move",moving:"move",travels:"travel",
  travelling:"travel",increases:"increase",increased:"increase",decreases:"decrease",
  decreased:"decrease",repels:"repel",repelled:"repel",attracts:"attract",
  attracted:"attract",reflects:"reflect",reflected:"reflect",vibrates:"vibrate",
  vibrating:"vibrate",aligned:"align",aligns:"align",arranged:"arrange",
  experiences:"experience",produces:"produce",becomes:"become",measured:"measure",
  measures:"measure",electrically:"electrical",mechanically:"mechanical",
  slower:"slow",faster:"fast",stronger:"strong",weaker:"weak",breaks:"break",
  wrong:"incorrect",false:"incorrect",equals:"equal"
};
const CONTRAST = [
  ["increase","decrease"],["repel","attract"],["north","south"],["like","unlike"],
  ["high","low"],["strong","weak"],["more","less"],["open","closed"],
  ["above","below"],["positive","negative"],["parallel","series"],
  ["reflect","refract"],["greater","smaller"]
];

function words(value) {
  const text = String(value ?? "").normalize("NFKC").toLowerCase()
    .replace(/[’‘]/g,"'").replace(/(\w)'s\b/g,"$1")
    .replace(/\bcan't\b|\bcannot\b|\bdoesn't\b|\bdon't\b/g,"not").replace(/=/g," equals ");
  return (text.match(/[a-z]+|\d+(?:\.\d+)?/g)||[])
    .map(w => ALIAS[w]||w).filter(w => !STOP.has(w));
}

function presentation(value) {
  return String(value ?? "").normalize("NFKC").toLowerCase()
    .replace(/[’‘]/g,"'").replace(/\b(a|an|the)\b/g," ")
    .replace(/[.,;:!?]/g," ").replace(/\s+/g," ").trim();
}

function slashAlternatives(value) {
  const alternatives=[String(value??"")];
  for(let i=0;i<alternatives.length && alternatives.length<16;i++){
    const found=alternatives[i].match(/\b([a-z]+)\/([a-z]+)\b/i);
    if(!found)continue;
    alternatives.push(alternatives[i].replace(found[0],found[1]));
    alternatives.push(alternatives[i].replace(found[0],found[2]));
    alternatives.splice(i,1);i--;
  }
  return alternatives;
}

function phraseHit(point,response) {
  const clauses=String(response??"").split(/[;\n]|\.(?!\d)/).map(s=>s.trim()).filter(Boolean);
  return slashAlternatives(point).some(expectedText => clauses.some(clause => {
    if(presentation(expectedText)===presentation(clause))return true;
    // Mathematical relationships cannot be discarded as mere punctuation.
    if(/[=<>/×÷]/.test(expectedText)) {
      const norm=s=>presentation(s).replace(/\b(?:is equal to|equals?)\b/g,"=").replace(/\b(?:divided by|per)\b/g,"/").replace(/\s*([=<>/×÷])\s*/g,"$1");
      return norm(expectedText)===norm(clause);
    }
    const expected=words(expectedText),actual=words(clause);
    if(!expected.length||!actual.length)return false;
    const needed=new Set(expected),given=new Set(actual);
    if([...needed].some(word=>!given.has(word)))return false;
    if(!needed.has("not")&&given.has("not"))return false;
    for(const [a,b] of CONTRAST) {
      if((given.has(a)&&!needed.has(a)&&needed.has(b))||
         (given.has(b)&&!needed.has(b)&&needed.has(a)))return false;
    }
    // Require both correct pairings, not just the words like/unlike/repel/attract.
    if(needed.has("like")&&needed.has("unlike")&&needed.has("repel")&&needed.has("attract")){
      const t=actual.join(" ");
      if(!/\blike\b(?:\s+\w+){0,3}\s+repel\b/.test(t)||
         !/\bunlike\b(?:\s+\w+){0,3}\s+attract\b/.test(t))return false;
    }
    // Changing the association between two contrary changes is wrong.
    if((needed.has("increase")&&needed.has("decrease"))||
       (needed.has("north")&&needed.has("south"))){
      const distinct=arr=>arr.filter(w=>["increase","decrease","north","south"].includes(w));
      if(distinct(expected).join("|")!==distinct(actual).join("|"))return false;
    }
    return true;
  }));
}

function shortHit(answer,response) {
  const accepted=[...(answer.accepted||[]),answer.modelAnswer].filter(x=>typeof x==="string"&&x.trim());
  return accepted.some(expected => {
    // Original answer must always pass, including full name plus symbol (volts (V)).
    if(presentation(expected)===presentation(response))return true;
    let input=String(response),template=expected;
    const symbols={A:"amperes",V:"volts",N:"newtons",Pa:"pascals",W:"watts",J:"joules"};
    for(const [symbol,word] of Object.entries(symbols))if(expected.includes("("+symbol+")")){
      input=input.replace(new RegExp("\\b"+symbol+"\\b","g"),word);
      template=template.replace("("+symbol+")","");
    }
    if(presentation(template)===presentation(input))return true;
    const choices=template.match(/^any\s+(two|three|four|five|six)\s+of\s+(.+?)\.?$/i);
    if(choices){
      const need={two:2,three:3,four:4,five:5,six:6}[choices[1].toLowerCase()];
      const options=choices[2].replace(/\s+and\s+/gi,",").split(",").map(x=>x.trim()).filter(Boolean);
      const actual=words(input),allowed=new Set(options.flatMap(words).concat(["energy","store"]));
      if(actual.some(w=>!allowed.has(w)))return false;
      return options.filter(option=>words(option).every(w=>actual.includes(w))).length>=need;
    }
    if(template.includes(";"))return template.split(";").every(part=>phraseHit(part,input));
    return phraseHit(template,input);
  });
}

/** @returns {null|{ok:boolean,score:number,total:number,accentOnly:boolean,errorKind:string,model:string,pointResults?:boolean[]}} */
export function gradePhysicsAnswer(question,response,model) {
  const answer=question?.answer||{},format=question?.format||"";
  if(answer.markPoints?.length &&
      ["mark_points","typed_short","extended_response","practical_design"].includes(format)){
    let points=answer.markPoints.map((point,i)=>
      [point,...(answer.markPointAlternatives?.[i]||[])].some(p=>phraseHit(p,response)));
    let score=points.filter(Boolean).length;
    let ok=score >= (answer.requireFullMarks ? points.length : Math.max(1,Math.ceil(points.length*.7)));
    if(presentation(model)===presentation(response)){
      points=points.map(()=>true);score=points.length;ok=true;
    }
    return {ok,score,total:points.length,accentOnly:false,
      errorKind:ok?"none":score?"partial":"wrong",model,pointResults:points};
  }
  if(format==="typed_short" && !answer.requiredGroups?.length &&
      (answer.accepted?.length||answer.modelAnswer)){
    const ok=shortHit(answer,response);
    return {ok,score:Number(ok),total:1,accentOnly:false,
      errorKind:ok?"none":"wrong",model};
  }
  return null;
}
