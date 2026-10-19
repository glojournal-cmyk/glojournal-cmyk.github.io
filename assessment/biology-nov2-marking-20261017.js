/* Shared, bank-scoped marking. Existing assessment rubrics remain unchanged. */
(() => {
  const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[μµ]/g,'u').replace(/[−–]/g,'-').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
  const test=(pattern,text)=>new RegExp(pattern,'i').test(text);
  function quantities(value){
    const text=normalize(value).replace(/micro\s*met(?:re|er)s?/g,'um').replace(/milli\s*met(?:re|er)s?/g,'mm').replace(/nano\s*met(?:re|er)s?/g,'nm');
    const result=[],re=/([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\s*e\s*[+-]?\d+)?)(?:\s*[x×*]\s*10\s*\^\s*([+-]?\d+))?\s*(u\s*m|mm|nm|cm|metres?|meters?|m\b)?/gi;
    let match;
    while((match=re.exec(text))){
      const number=Number(match[1].replace(/\s/g,''))*10**Number(match[2]||0);
      if(Number.isFinite(number))result.push({value:number,unit:(match[3]||'').replace(/\s/g,'').replace(/metres?|meters?/,'m')});
    }
    return result;
  }
  function grade(q,value){
    const response=normalize(value),points=q.answer?.points||[];
    let pointResults=points.map(()=>false);
    if(response){
      const clauses=response.split(/[.;\n]|\bbut\b/i).filter(Boolean);
      pointResults=points.map(p=>{
        if(p.numericResult||p.numericUnit||p.distinctPool)return false;
        const matches=text=>(p.allOf||[]).length>0&&p.allOf.every(pattern=>test(pattern,text));
        if(!matches(response)||(p.rejectPatterns||[]).some(pattern=>test(pattern,response)))return false;
        const matching=clauses.filter(matches);
        // Scope negation to each required idea. A later "do not shade" must
        // not cancel an earlier "clear single lines" when punctuation is omitted.
        const positive=text=>p.allowNegative||(p.allOf||[]).every(pattern=>{
          const re=new RegExp(pattern,'gi');
          for(const match of text.matchAll(re)){
            const prefix=text.slice(0,match.index).replace(/\bnot just\b/gi,'');
            const local=prefix.split(/[.;\n]|\b(?:but|however|whereas|this|therefore|so)\b/i).at(-1);
            if(!/\b(?:no|not|never|cannot|can't|doesn't|don't|isn't|aren't)\b(?:\W+\w+){0,6}\W*$/i.test(local))return true;
          }
          return false;
        });
        return matching.length?matching.some(positive):positive(response);
      });
      const plantPatterns=['cellulose|cell wall','chloroplast','(permanent|large|central).{0,20}vacuole|vacuole'];
      const plantHits=plantPatterns.filter(pattern=>test(pattern,response)).length;
      let plantIndex=0;
      points.forEach((p,i)=>{if(p.distinctPool==='plant')pointResults[i]=plantIndex++<plantHits;});
      if(q.answer.numeric){
        const target=q.answer.numeric,last=quantities(response).at(-1),expected=normalize(target.unit),factors={m:1,cm:.01,mm:.001,um:.000001,nm:.000000001};
        const bare=last&&!last.unit,compatible=last&&(last.unit===expected||expected&&factors[last.unit]&&factors[expected]);
        const converted=compatible&&expected?last.value*(factors[last.unit]/factors[expected]):last?.value;
        const correct=!!last&&(bare||compatible)&&Math.abs(converted-target.value)<=target.tolerance;
        points.forEach((p,i)=>{
          if(p.numericResult)pointResults[i]=correct;
          else if(p.numericUnit)pointResults[i]=correct&&last.unit===expected;
          // A correct final answer implies a correct method; wrong units still lose the unit mark.
          else if(correct)pointResults[i]=true;
        });
      }
    }
    const matched=pointResults.filter(Boolean).length,total=points.length,credit=total?matched/total:0;
    return {matched,total,credit,pointResults,pointLabels:points.map(p=>p.label),status:credit===1?'Correct':credit>0?'Partly correct':'Incorrect'};
  }
  function select(questions,{topic='all',size=10,previous=[],weak=[]}={}){
    const pool=questions.filter(q=>topic==='weak'?weak.includes(q.id):topic==='all'||q.topic===topic);
    const shuffle=items=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
    return [...shuffle(pool.filter(q=>!previous.includes(q.id))),...shuffle(pool.filter(q=>previous.includes(q.id)))].slice(0,size).sort((a,b)=>a.difficulty-b.difficulty);
  }
  globalThis.LuxBiologyNov2={grade,select,quantities};
  // The timed Assessment page loads this after its legacy marking patches.
  if(typeof mark==='function'){
    const previous=mark;
    mark=function(q,value){return q.assessmentId==='biology-nov2'?grade(q,value):previous(q,value);};
  }
})();
