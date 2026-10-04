/* Shared school dates and a read-only revision planner. */
(() => {
  const topic = (id, label, groups) => ({id, label, groups});
  const schoolAssessments = [
    {id:'school-chemistry-20261005', subject:'Chemistry', date:'2026-10-05', dateKind:'week',
      dateLabel:'Week beginning 5 October 2026 · exact lesson date to be confirmed',
      title:'Atoms, separating mixtures and chromatography', paperId:'chemistry',
      scope:'C1.1 Atoms · C1.3 Separating Mixtures · C2.1 History of the Periodic Table · RP6 Chromatography and Rf',
      notes:'Revise atomic structure, separation methods, the development of the periodic table, chromatography method and Rf calculations.',
      revisionTopics:[topic('chem-y9-c5','Atoms',['Atoms']),topic('chem-y9-c3','Separating mixtures',['Separation']),topic('chem-y9-c1','History of the periodic table',['Periodic table']),topic('chem-y9-c4','Chromatography and Rf',['RP6 method','RP6 errors','Chromatogram','Rf','Solvents','RP6'])]},
    {id:'school-french-20261008', subject:'French', date:'2026-10-08', dateKind:'day', dateLabel:'8 October 2026',
      title:'Unit 1 vocabulary · Une visite en France', paperId:'french',
      scope:'Core phrases · intensifiers · descriptive and positive adjectives · pronouns · transport',
      notes:'Practise vocabulary recall and spelling, then try the school vocabulary paper. Accents are shown in the model answers but are optional for scoring.',
      revisionTopics:[topic('fr-y9-20260919-unit-1-holidays-and-opinions','Holidays, opinions and descriptions',['Core phrases','Intensifiers','Descriptive adjectives','Positive adjectives','Pronouns']),topic('fr-y9-u1-paris-travel','Travel and transport',['Transport'])]},
    {id:'school-biology-20261116', subject:'Biology', date:'2026-11-16', dateKind:'week',
      dateLabel:'Week beginning 16 November 2026 · exact lesson date to be confirmed',
      title:'First GCSE Biology assessment · AQA 4.1.1 Cell structure', paperId:'biology-cell-structure',
      scope:'Eukaryotes and prokaryotes · animal and plant cells · cell specialisation · cell differentiation · microscopy · culturing microorganisms',
      notes:'AQA 4.1.1 Cell structure. Revise diagrams, magnification and practical reasoning. Practice paper: 45 minutes, 60 marks; pass 51/60.',
      revisionTopics:[topic('bio-y9-b1','Cell structure',['Eukaryotes and prokaryotes','Animal and plant cells']),topic('bio-y9-b2','Cell specialisation and differentiation',['Cell specialisation','Cell differentiation']),topic('bio-y9-b3','Microscopy',['Microscopy']),topic('bio-y9-b4','Culturing microorganisms',['Culturing microorganisms'])]}
  ].map(x => ({...x, topics:x.revisionTopics.map(t=>t.id)}));
  const subjects = new Set(['French','Latin','Chemistry','Biology','Physics','English','Maths','Other']);
  function londonDay(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');
  }
  function validDay(day) {
    return typeof day==='string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day+'T12:00:00Z').toISOString().slice(0,10)===day;
  }
  function shiftDay(day,n) { const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+n);return date.toISOString().slice(0,10); }
  function daysBetween(today,date) { return Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000); }
  function topicHref(subject,topic,action='practise') {
    if(!subjects.has(subject)||!topic)return '/assessment/?tab=tracker';
    return '/study/'+subject.toLowerCase()+'/'+action+'?year=9&topic='+encodeURIComponent(topic)+(action==='practise'?'&mode=standard':'');
  }
  function paperHref(paperId) {return '/assessment/?paper='+encodeURIComponent(paperId)+'&v=20261004-focus1';}
  function buildRevisionPlan(garden={},assessment={},today=londonDay(),topicLearning={}) {
    if(!validDay(today))today=londonDay();
    const hidden=new Set(Array.isArray(assessment.hiddenSchoolAssessments)?assessment.hiddenSchoolAssessments:[]);
    const custom=(Array.isArray(assessment.tracker)?assessment.tracker:[]).filter(x=>x&&subjects.has(x.subject)&&validDay(x.date)).map(x=>({...x,revisionTopics:[],dateKind:'day',dateLabel:x.date,custom:true}));
    const rows=[...schoolAssessments.filter(x=>!hidden.has(x.id)),...custom].map(x=>{
      const endDate=x.dateKind==='week'?shiftDay(x.date,6):x.date;
      const complete=x.status==='Completed';
      const phase=complete?'completed':today>endDate?'past':today>=x.date?'current':'upcoming';
      const results=(Array.isArray(assessment.results)?assessment.results:[]).filter(r=>r&&x.paperId&&r.paperId===x.paperId);
      const latest=results.at(-1);
      const evidence=Array.isArray(latest?.revisionEvidence)?latest.revisionEvidence:[];
      const revisionTopics=x.revisionTopics.map(t=>{
        const stat=garden.topicStats?.[t.id]||{},attempted=Math.max(0,Number(stat.attempted)||0),correct=Math.max(0,Math.min(attempted,Number(stat.correct)||0));
        const mistakes=Object.values(garden.reviews||{}).filter(r=>r?.topicId===t.id&&!r.repair&&r.wrong===true).length;
        const lost=evidence.filter(e=>t.groups.includes(e.topic)&&Number.isFinite(e.credit)&&e.credit<1).reduce((sum,e)=>sum+(1-e.credit)*(Number(e.marks)||1),0);
        const state=topicLearning[t.id]===false?'not-taught':lost>0||mistakes>0||(attempted>=2&&correct/attempted<0.85)?'needs-review':attempted===0?'unchecked':stat.state==='mastered'?'mastered':'practising';
        return {...t,state,attempted,accuracy:attempted?Math.round(correct/attempted*100):null,mistakes,lost,practiceHref:topicHref(x.subject,t.id),notesHref:topicHref(x.subject,t.id,'learn')};
      });
      const candidates=revisionTopics.filter(t=>t.state!=='not-taught');
      const rank={'needs-review':0,'unchecked':1,'practising':2,'mastered':3};
      candidates.sort((a,b)=>rank[a.state]-rank[b.state]||b.lost-a.lost||b.mistakes-a.mistakes);
      const focus=candidates[0]||null;
      return {...x,endDate,phase,days:daysBetween(today,x.date),latest,revisionTopics,focus,paperHref:x.paperId?paperHref(x.paperId):'/assessment/?tab=tracker'};
    });
    const active=rows.filter(x=>x.phase==='current'||x.phase==='upcoming').sort((a,b)=>a.date.localeCompare(b.date)||a.subject.localeCompare(b.subject));
    const past=rows.filter(x=>x.phase==='past'||x.phase==='completed').sort((a,b)=>b.date.localeCompare(a.date));
    const next=active.find(x=>x.focus)||active[0]||null;
    const suggestion=next?{assessment:next,topic:next.focus,
      reason:next.focus?.state==='needs-review'?'Your saved answers show this topic needs another try.':next.focus?.state==='unchecked'?'No topic practice is recorded yet. Check the basics first.':next.focus?.state==='mastered'?'The topic is mastered in app practice. Check the whole range with a timed paper.':next.focus?'Build confidence with an independent set of questions.':'Open the tracker to review the teacher’s range.',
      href:next.focus?.state==='mastered'?next.paperHref:next.focus?.practiceHref||'/assessment/?tab=tracker'}:null;
    return {today,active,past,suggestion};
  }
  globalThis.LuxSchoolRevision={schoolAssessments,londonDay,buildRevisionPlan,topicHref,paperHref};
})();
