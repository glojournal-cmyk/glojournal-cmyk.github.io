(() => {
  'use strict';
  const API = 'https://gloria-notes-public.glo-journal.workers.dev';
  const $ = id => document.getElementById(id);
  const safeRead = key => {try {return JSON.parse(localStorage.getItem(key)||'[]')} catch {return []}};
  const save = (key,value) => {try {localStorage.setItem(key,JSON.stringify(value))} catch {}};
  const recentKey = 'gloria:notes:recent:v1';
  const YEAR_ORDER = ['year9','summer'];
  const SUBJECT_ORDER = ['maths','biology','chemistry','physics','french','latin','english','mixed'];
  const SUBJECT_LABELS = {
    maths:'Maths',biology:'Biology',chemistry:'Chemistry',physics:'Physics',
    french:'French',latin:'Latin',english:'English',mixed:'Mixed subjects'
  };
  const YEAR_LABELS = {year9:'Year 9',summer:'Summer Revision · Year 8'};
  let notes = [], available = new Set(), workerReady = false;
  let period = 'all', subject = 'all', query = '';
  function node(tag,cls,value) {
    const element = document.createElement(tag);
    if(cls)element.className=cls;
    if(value!==undefined)element.textContent=String(value);
    return element;
  }
  const size = n => n >= 1024*1024 ? (n/(1024*1024)).toFixed(1)+' MB' : Math.round(n/1024)+' KB';
  const orderedSubjects = entries => {
    const keys = [...new Set(entries.map(n=>n.subject))];
    return keys.sort((a,b)=>SUBJECT_ORDER.indexOf(a)-SUBJECT_ORDER.indexOf(b));
  };
  function status() {
    const published = notes.filter(n=>available.has(n.key)).length;
    const message = $('status');
    message.className='status '+(workerReady?'ok':'warn');
    if(!workerReady)message.textContent='Showing the PDF catalogue. Cloud availability cannot be checked right now; try reloading.';
    else message.textContent=published+' of '+notes.length+' PDFs ready in Cloudflare R2 · '+(notes.length-published)+' awaiting upload.';
  }
  function openDoc(note) {
    if(!workerReady || !available.has(note.key))return;
    const url=API+'/pdf?'+new URLSearchParams({key:note.key});
    const recent=[note.id,...safeRead(recentKey).filter(x=>x!==note.id)].slice(0,12);
    save(recentKey,recent);
    $('viewerTitle').textContent=note.title;
    $('openTab').href=url;
    $('pdfFrame').src=url;
    $('viewer').hidden=false;
    document.body.style.overflow='hidden';
  }
  function closeDoc() {
    $('viewer').hidden=true;
    $('pdfFrame').src='about:blank';
    document.body.style.overflow='';
  }
  function noteRow(note) {
    const ready=workerReady && available.has(note.key);
    const button=node('button','note-row'+(ready?' ready':' unavailable'));
    button.type='button';
    button.disabled=!ready;
    button.setAttribute('aria-label',note.title+' — '+(ready?'Read PDF':'Not yet available in Cloudflare'));
    const fileIcon=node('span','row-icon','▤');
    fileIcon.setAttribute('aria-hidden','true');
    const main=node('span','row-main');
    main.append(node('span','row-name',note.title));
    main.append(node('span','row-meta','PDF · '+size(note.sizeBytes)));
    const action=node('span','row-action',ready?'Read PDF  →':workerReady?'Awaiting upload':'Cloud unavailable');
    main.setAttribute('title',note.filename);
    button.append(fileIcon,main,action);
    if(ready)button.addEventListener('click',()=>openDoc(note));
    return button;
  }
  function subjectSection(kind,schoolYear,entries) {
    const section=node('section','subject-group');
    section.dataset.subject=kind;
    section.dataset.period=schoolYear;
    section.setAttribute('aria-label',(SUBJECT_LABELS[kind]||kind)+' notes');
    const title=node('div','subject-heading');
    title.append(node('h4',null,SUBJECT_LABELS[kind]||kind));
    const published=entries.filter(n=>available.has(n.key)).length;
    title.append(node('span','subject-count',workerReady ? published+' ready / '+entries.length : entries.length+' notes'));
    const list=node('div','note-list');
    entries.sort((a,b)=>Number(available.has(b.key))-Number(available.has(a.key)) ||
      a.title.localeCompare(b.title,undefined,{numeric:true}));
    for(const note of entries)list.append(noteRow(note));
    section.append(title,list);
    return section;
  }
  function yearSection(year,entries) {
    const yearGroup=node('section','year-group');
    yearGroup.dataset.period=year;
    yearGroup.setAttribute('aria-label',YEAR_LABELS[year]);
    const header=node('div','year-heading');
    header.append(node('h3',null,YEAR_LABELS[year]));
    header.append(node('span','year-count',entries.length+' notes'));
    yearGroup.append(header);
    for(const kind of orderedSubjects(entries)){
      yearGroup.append(subjectSection(kind,year,entries.filter(n=>n.subject===kind)));
    }
    return yearGroup;
  }
  function render() {
    const q=query.trim().toLowerCase();
    const filtered=notes.filter(n=>
      (period==='all'||n.period===period) &&
      (subject==='all'||n.subject===subject) &&
      (!q||[n.title,n.filename,n.subject,n.period].some(v=>v.toLowerCase().includes(q)))
    );
    $('heading').textContent=period==='all'?'Notes by year & subject':YEAR_LABELS[period]+' Notes';
    $('count').textContent=filtered.length+' notes';
    const fragment=document.createDocumentFragment();
    for(const year of YEAR_ORDER) {
      const entries=filtered.filter(n=>n.period===year);
      if(entries.length)fragment.append(yearSection(year,entries));
    }
    $('noteGroups').replaceChildren(fragment);
    $('empty').hidden=filtered.length!==0;
    for(const button of document.querySelectorAll('.segments button[data-period]')){
      button.classList.toggle('active',button.dataset.period===period);
      button.setAttribute('aria-pressed',String(button.dataset.period===period));
    }
    status();
  }
  $('closeReader').addEventListener('click',closeDoc);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('viewer').hidden)closeDoc()});
  $('search').addEventListener('input',e=>{query=e.target.value;render()});
  $('subject').addEventListener('change',e=>{subject=e.target.value;render()});
  for(const button of document.querySelectorAll('.segments button[data-period]'))
    button.addEventListener('click',()=>{period=button.dataset.period;render()});
  (async()=>{
    try {
      const response=await fetch('/notes/catalog.json?v=20261023-02',{cache:'no-cache'});
      if(!response.ok)throw Error('Library index HTTP '+response.status);
      const manifest=await response.json();
      notes=Array.isArray(manifest.notes)?manifest.notes.filter(n=>n&&n.id&&n.key&&n.title&&n.subject&&n.period):[];
      render();
      try {
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),9000);
        const response=await fetch(API+'/catalog',{signal:controller.signal,cache:'no-cache'});
        clearTimeout(timer);
        if(!response.ok)throw Error('R2 catalog HTTP '+response.status);
        const listing=await response.json();
        available=new Set((listing.files||[]).map(o=>o.key));
        workerReady=true;
      } catch(e) {console.info('Gloria Notes cloud availability check failed:',e.message)}
      render();
    } catch(error) {
      $('status').className='status warn';
      $('status').textContent='Notes index could not load. Please refresh this page.';
      console.warn(error);
    }
  })();
})();
