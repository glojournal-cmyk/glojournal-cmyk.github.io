/* Shared, bank-scoped marking. Existing assessment rubrics remain unchanged. */
(() => {
  const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[μµ]/g,'u').replace(/[−–]/g,'-').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
  const test=(pattern,text)=>new RegExp(pattern,'i').test(text);

  // Exact spellings and real grammatical variants, never fuzzy edit-distance matching.
  const KEYWORD_WORDS = new Set(('no not never cannot can t doesn doesn’t don isn aren without prevents preventing avoid avoids avoiding prevent prevents provides provide providing supplies supply supplying selectively permeable entry exit absorbs absorb absorbed absorbing absorption active activities activity allows allow allowing angle angled atp aerobic axon axons bacteria bacterial bacterium beat beats beating biconcave bind binds binding blood branch branches branched bubble bubbles capillaries capillary carries carry carrying cell cells cellulose central change changes changing chloroplast chloroplasts chromosome chromosomes clear clearer close closer coat coats collapse collapsing companion connect connects connected connecting connection connections contraction contractions contract contracts contracting control controls controlling controlled cover coverslip coverslips cytoplasm dark dead deform deforms deformation diameter diffusion diffuse diffuses diffusing digest digests digestion diploid direction directions distinguish distinguishes distinguishing dna electrical electricity elongate elongated end ends energy enter enters entering enzyme enzymes epidermis epidermal extra fast faster fertilise fertilises fertilisation fertilize fertilizes fertilization filament filaments flagellum flagella flexible flexibility flow flows flowing focus focusing focussing forceps function functions genetic gently glass goblet haemoglobin hemoglobin hair hairs haploid high higher hollow hold holds holding impulse impulses improve improves improved increase increases increased increasing insulate insulates insulated insulating insulation iodine ion ions label labels labelled labeled large larger length lengths light lignin line lines living locate locates locating long longer low lower lowering magnification magnify magnifies magnifying membrane membranes methylene microscope microscopes mineral minerals mitochondria mitochondrion movement movements move moves moving mucus myelin myelinated myosin narrow needle nerve nerves neurone neurones neuron neurons nucleus nuclei objective objectives observed observe observes observing onion onions organ organs osmosis out outline outlines overlap overlapping overlaps oxygen particle particles pathogen pathogens peel peels peeled peeling pencil permanent phloem photosynthesis photosynthesise photosynthesises photosynthesize photosynthesizes photosynthetic plate plates pore pores power prevent prevents preventing projection projections propel propels propelling protein proteins quick quicker rapid rapidly red reduce reduces reduced reducing regulate regulates regulating release releases released releasing reinforce reinforces resolution resolving resolved respiration restores restore restoring ribosome ribosomes rigid rigidity root roots room safe safely safety secrete secretes secreting secretion see seen separate separated separation shade shaded shading shape shapes shorten shortens shortening short shorter signal signals single sieve skeletal skeleton skin slide slides sliding small smaller smooth source sources space spaces specimen specimens speed speeds speeding stain stains staining stage stages straight strengthen strengthens strengthening strength structure structures substance substances sucrose sugar sugars support supports supporting surface surfaces swim swims swimming tail tails thin thinner throat tissue tissues title titles translocation transmit transmits transmitting transmitted transmission transport transports transporting tube tubes underlined underline underground uncrossed unshaded uptake upwards upward vacuole vacuoles vessel vessels view volume wall walls water wide wider width without').split(/\s+/));
  const CONCEPTS = {
    '003': [['control|regulat|selectiv','enter|entry|exit|leav|movement|pass|in and out|into|out of|permeable']],
    '002': [['aerobic respiration'], ['releas|provid|suppl','energy|atp']],
    '010': [['flagell|tail','propel|swim|mov'], ['mitochondri','energy|respir|atp']],
    '017': [['respir|releas|provid|suppl','energy|atp'], ['energy|atp','contract|shorten']],
    '025': [['large|increas|greater','surface area'], ['water','mineral|ion','absorb|absorp|uptake']],
    '027': [['active transport'], ['respir|releas|provid|suppl','energy|atp']],
    '031': [['strength|reinforc'], ['prevent|resist|stop','collaps']],
    '035': [['respir|releas|provid|suppl','energy|atp'], ['active|loading','sugar|sucrose|transport']],
    '060': [['field of view|fov','width|diameter'], ['cell','length|size']]
  };
  function keywordGroups(q,p,i){return CONCEPTS[q.id?.slice(-3)]?.[i]||p.allOf||[];}
  function exactMatches(pattern,text,q){
    const words=new Set((q.prompt+' '+q.modelAnswer+' '+(q.answer?.points||[]).map(p=>p.label).join(' ')).toLowerCase().match(/[a-z]+/g)||[]);
    const found=[];
    for(const match of text.matchAll(new RegExp(pattern,'gi'))){
      // A regex stem may recognise inflections, but cannot recognise a misspelt word.
      if(match.index>0&&/[a-z]/i.test(text[match.index-1])&&/^[a-z]/i.test(match[0]))continue;
      const start=match.index,end=start+match[0].length;
      const tokens=[...text.matchAll(/[a-z]+/gi)].filter(t=>t.index<end&&t.index+t[0].length>start);
      if(tokens.every(t=>words.has(t[0])||KEYWORD_WORDS.has(t[0])))found.push(match);
    }
    return found;
  }

  function quantities(value){
    const text=normalize(value).replace(/micro\s*met(?:re|er)s?\b/g,'um').replace(/milli\s*met(?:re|er)s?\b/g,'mm').replace(/nano\s*met(?:re|er)s?\b/g,'nm');
    const result=[],re=/([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\s*e\s*[+-]?\d+)?)(?:\s*[x×*]\s*10\s*\^\s*([+-]?\d+))?\s*(?:(u\s*m|mm|nm|cm|metres?|meters?|m\b)(?![a-z]))?/gi;
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
      pointResults=points.map((p,i)=>{
        if(p.numericResult||p.numericUnit||p.distinctPool)return false;
        const groups=keywordGroups(q,p,i);
        const matches=text=>groups.length>0&&groups.every(pattern=>exactMatches(pattern,text,q).length>0);
        if(!matches(response)||(p.rejectPatterns||[]).some(pattern=>test(pattern,response)))return false;
        const matching=clauses.filter(matches);
        // Scope negation to each required idea. A later "do not shade" must
        // not cancel an earlier "clear single lines" when punctuation is omitted.
        const positive=text=>p.allowNegative||groups.every(pattern=>{
          for(const match of exactMatches(pattern,text,q)){
            const prefix=text.slice(0,match.index).replace(/\bnot just\b/gi,'');
            const local=prefix.split(/[.;\n]|\b(?:but|however|whereas|this|therefore|so)\b/i).at(-1);
            if(!/\b(?:no|not|never|cannot|can't|doesn't|don't|isn't|aren't)\b(?:\W+\w+){0,6}\W*$/i.test(local))return true;
          }
          return false;
        });
        return matching.length?matching.some(positive):positive(response);
      });
      const plantPatterns=['cellulose|cell wall','chloroplast','(permanent|large|central).{0,20}vacuole|vacuole'];
      const plantHits=plantPatterns.filter(pattern=>exactMatches(pattern,response,q).length>0).length;
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
