(() => {
  const VERSION='20260927-schoolstyle1';
  const BASE_PATH='/assessment/chemistry-school-1.json';
  const ADDON_PATH=`/assessment/chemistry-school-style-20260927.json?v=${VERSION}`;
  const originalFetch=window.fetch.bind(window);
  const calculationConcepts={
    'chem-schoolstyle-201':'chem-rf-calc-direct',
    'chem-schoolstyle-204':'chem-rf-calc-direct',
    'chem-schoolstyle-205':'chem-rf-calc-direct',
    'chem-schoolstyle-212':'chem-rf-calc-direct',
    'chem-schoolstyle-217':'chem-rf-calc-direct',
    'chem-schoolstyle-219':'chem-rf-calc-spot-distance'
  };
  const diagramMap={
    'setup.svg':'setup-v2-20260927.svg',
    'inks.svg':'inks-v2-20260927.svg',
    'rf.svg':'rf-v2-20260927.svg',
    'solvents.svg':'solvents-v2-20260927.svg',
    'teacher-style.svg':'teacher-style-v2-20260927.svg'
  };

  window.fetch=async function(input,init){
    let url;
    try{url=new URL(typeof input==='string'?input:input.url,location.href)}catch{return originalFetch(input,init)}
    if(url.pathname!==BASE_PATH)return originalFetch(input,init);

    const [baseRes,addonRes]=await Promise.all([
      originalFetch(input,init),
      originalFetch(ADDON_PATH,{cache:'no-store'})
    ]);
    if(!baseRes.ok)return baseRes;
    const base=await baseRes.json();
    const addon=addonRes.ok?await addonRes.json():{questions:[]};
    const baseQuestions=(base.questions||[]).map(q=>q.diagram&&diagramMap[q.diagram]?{...q,diagram:diagramMap[q.diagram]}:q);
    const merged={...base,questions:[...baseQuestions,...(addon.questions||[]).map(q=>calculationConcepts[q.id]?{...q,conceptId:calculationConcepts[q.id]}:q)]};
    return new Response(JSON.stringify(merged),{status:200,statusText:'OK',headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  };

  document.addEventListener('DOMContentLoaded',()=>{
    try{
      const chemistry=PAPERS.find(p=>p.id==='chemistry');
      if(chemistry){
        chemistry.subtitle='Periodic Table, separation, chromatography, Rf and school-style data questions';
        chemistry.groups={
          'Periodic table':4,
          'Separation':4,
          'RP6 method':4,
          'RP6 errors':2,
          'Chromatogram':4,
          'Rf':9,
          'Solvents':1,
          'RP6':2
        };
        cards();
      }
    }catch(e){console.warn('Chemistry school-style enhancement could not initialise',e)}
  });
})();
