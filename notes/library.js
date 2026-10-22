(() => {
  'use strict';
  const API = 'https://gloria-notes-public.glo-journal.workers.dev';
  const $ = id => document.getElementById(id);
  const safeRead = key => {try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}};
  const save = (key,val) => {try{localStorage.setItem(key,JSON.stringify(val))}catch{}};
  const favKey='gloria:notes:favourites:v1',recentKey='gloria:notes:recent:v1';
  let notes=[],available=new Set(),workerReady=false,period='all',subject='all',query='';
  let favourites=new Set(safeRead(favKey));
  const label = s => ({french:'French',latin:'Latin',biology:'Biology',chemistry:'Chemistry',
    english:'English',maths:'Maths',physics:'Physics',mixed:'Mixed'}[s]||s);
  const size = n => n>=1024*1024?(n/(1024*1024)).toFixed(1)+' MB':Math.round(n/1024)+' KB';
  function node(tag,cls,value) {
    const el=document.createElement(tag); if(cls)el.className=cls;
    if(value!==undefined)el.textContent=String(value);return el;
  }
  function state(){
    const published=notes.filter(n=>available.has(n.key)).length;
    const s=$('status'); s.className='status '+(workerReady&&published?'ok':'warn');
    if(!workerReady) s.textContent='Library index ready. PDF cloud reader is not available yet; uploads are still being prepared.';
    else if(!published) s.textContent=notes.length+' notes catalogued · No PDFs uploaded to Cloudflare yet.';
    else s.textContent=published+' PDF'+(published===1?'':'s')+' available to read · '+(notes.length-published)+' awaiting upload.';
  }
  function openDoc(note){
    if(!available.has(note.key)) return;
    const url=API+'/pdf?'+new URLSearchParams({key:note.key});
    const recent=[note.id,...safeRead(recentKey).filter(x=>x!==note.id)].slice(0,12);
    save(recentKey,recent);
    $('viewerTitle').textContent=note.title;
    $('openTab').href=url;
    $('pdfFrame').src=url;
    $('viewer').hidden=false;
    document.body.style.overflow='hidden';
  }
  function closeDoc(){
    $('viewer').hidden=true;$('pdfFrame').src='about:blank';
    document.body.style.overflow='';
  }
  function card(note){
    const article=node('article','note');const tags=node('div','tags');
    tags.append(node('span','tag',note.period==='year9'?'Year 9':'Summer / Year 8'));
    tags.append(node('span','tag',label(note.subject)));
    article.append(tags);
    const heart=node('button','fav'+(favourites.has(note.id)?' saved':''),favourites.has(note.id)?'★':'☆');
    heart.type='button';heart.setAttribute('aria-label','Save '+note.title+' to favourites');
    heart.setAttribute('aria-pressed',String(favourites.has(note.id)));
    heart.addEventListener('click',()=>{
      if(favourites.has(note.id))favourites.delete(note.id);else favourites.add(note.id);
      save(favKey,[...favourites]);render();
    });
    article.append(heart);
    article.append(node('h3',null,note.title));
    article.append(node('div','meta',size(note.sizeBytes)+' · PDF · Library saved '+note.dateAdded));
    const actions=node('div','actions');const button=node('button','open',available.has(note.key)?'Read PDF →':'Awaiting PDF');
    button.type='button';button.disabled=!available.has(note.key);
    if(!button.disabled) button.addEventListener('click',()=>openDoc(note));
    actions.append(button);
    if(!available.has(note.key))actions.append(node('span','pending','Not uploaded yet'));
    article.append(actions);return article;
  }
  function render(){
    const q=query.trim().toLowerCase();
    let filtered=notes.filter(n=>
      (period==='all'||period==='favourites'&&favourites.has(n.id)||n.period===period) &&
      (subject==='all'||n.subject===subject) &&
      (!q||[n.title,n.filename,n.subject,n.period].some(v=>v.toLowerCase().includes(q)))
    );
    filtered.sort((a,b)=> Number(available.has(b.key))-Number(available.has(a.key)) ||
      (a.period===b.period?0:a.period==='year9'?-1:1) ||
      a.title.localeCompare(b.title));
    $('heading').textContent=period==='favourites'?'Your favourites':'Browse Notes';
    $('count').textContent=filtered.length+' files';
    const frag=document.createDocumentFragment();for(const n of filtered)frag.append(card(n));
    $('cards').replaceChildren(frag);$('empty').hidden=!!filtered.length;
    for(const btn of document.querySelectorAll('[data-period]')){
      btn.classList.toggle('active',btn.dataset.period===period);
      btn.setAttribute('aria-pressed',String(btn.dataset.period===period));
    }
    state();
  }
  $('closeReader').addEventListener('click',closeDoc);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('viewer').hidden)closeDoc()});
  $('search').addEventListener('input',e=>{query=e.target.value;render()});
  $('subject').addEventListener('change',e=>{subject=e.target.value;render()});
  for(const button of document.querySelectorAll('[data-period]'))
    button.addEventListener('click',()=>{period=button.dataset.period;render()});
  (async()=>{
    try{
      const response=await fetch('/notes/catalog.json?v=20261022-01',{cache:'no-cache'});
      if(!response.ok)throw Error('Library index HTTP '+response.status);
      const manifest=await response.json();
      notes=Array.isArray(manifest.notes)?manifest.notes.filter(n=>n&&n.id&&n.key&&n.title):[];
      render();
      try{
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),9000);
        const response=await fetch(API+'/catalog',{signal:controller.signal,cache:'no-cache'});
        clearTimeout(timer);
        if(!response.ok)throw Error('R2 catalog HTTP '+response.status);
        const listing=await response.json();
        available=new Set((listing.files||[]).map(o=>o.key));
        workerReady=true;
      }catch(e){console.info('Gloria Notes reader not connected:',e.message)}
      render();
    }catch(error){
      $('status').className='status warn';
      $('status').textContent='Notes catalog could not load. Please refresh this page.';
      console.warn(error);
    }
  })();
})();