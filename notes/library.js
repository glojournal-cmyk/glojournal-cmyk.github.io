(() => {
 'use strict';
 const API='https://gloria-notes-public.glo-journal.workers.dev';
 const $=id=>document.getElementById(id);
 const SUBJECTS=[
   ['latin','Latin'],['french','French'],['english','English'],['maths','Maths'],
   ['biology','Biology'],['chemistry','Chemistry'],['physics','Physics'],['mixed','Mixed subjects']
 ];
 const YEAR_NAMES={year9:'Year 9',summer:'Summer Revision / Year 8'};
 const READER_RECENT_KEY='gloria:notes:recent:v1';
 let notes=[],available=new Set(),workerReady=false,year='year9',subject=null;
 const node=(tag,cls,text)=>{
   const el=document.createElement(tag);if(cls)el.className=cls;
   if(text!==undefined)el.textContent=String(text);
   return el;
 };
 const mb=n=>n>=1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
 const isSiteNote=n=>n.delivery==='site'&&typeof n.url==='string'&&
   /^\/notes\/pdf\/year9\/latin\/Year9_Latin_Vocabulary_Chapter_[1-6]\.pdf$/.test(n.url);
 const isAvailable=n=>isSiteNote(n)||(workerReady&&available.has(n.key));
 function subjectName(slug){return SUBJECTS.find(x=>x[0]===slug)?.[1]||slug;}
 function imageFor(y,s){
   // One fixed set of seven user-selected Option E banners for both years.
   return s==='mixed'?'/art/study-rpg/y8-english.jpg':
     '/notes/images/option-e/'+s+'.svg';
 }
 function cleanRoute(){
   const path=decodeURIComponent(location.hash.slice(1)).split('/').filter(Boolean);
   const nextYear=['year9','summer'].includes(path[0])?path[0]:'year9';
   const nextSubject=SUBJECTS.some(s=>s[0]===path[1])?path[1]:null;
   year=nextYear;subject=nextSubject;
 }
 function goto(y,s=null){
   const target='#'+y+(s?'/'+s:'');
   if(location.hash!==target)location.hash=target;
   else {cleanRoute();render();}
 }
 function status(){
   const n=notes.filter(isAvailable).length;
   const siteCount=notes.filter(isSiteNote).length;
   $('status').textContent=workerReady
     ? n+' / '+notes.length+' Notes available · Cloudflare + site PDFs'
     : siteCount
       ? siteCount+' chapter PDFs available · Checking other cloud notes'
       : 'Notes catalog loaded · Checking Cloudflare availability';
   $('status').classList.toggle('offline',!workerReady&&!siteCount);
 }
 function subjectCard(slug,title,yearNotes){
   const entries=yearNotes.filter(n=>n.subject===slug);
   const ready=entries.filter(isAvailable).length;
   const card=node('button','subject-card'+(slug==='maths'?' maths-card':''));
   card.type='button';
   card.dataset.subject=slug;
   card.disabled=entries.length===0;
   const art=node('img','subject-art');
   art.src=imageFor(year,slug);art.alt='';
   art.loading='eager';art.decoding='async';
   art.addEventListener('error',()=>{
     // Keep subject card functional if any image asset fails to load.
     if(art.dataset.fallback)return;
     art.dataset.fallback='1';art.src=slug==='maths'?'/assets/math-study/maths-cover.svg':'/art/subjects/'+(slug==='mixed'?'english':slug)+'.jpg';
   });
   const body=node('div','subject-body');
   body.append(node('h2',null,title));
   const stats=node('div','subject-stats');
   stats.append(node('span','stat-line',entries.length+' '+(entries.length===1?'Note':'Notes')));
   stats.append(node('span','stat-line ready-line',workerReady||entries.some(isSiteNote)?ready+' available':'Checking cloud…'));
   body.append(stats);
   body.append(node('span','card-arrow','›'));
   card.setAttribute('aria-label',YEAR_NAMES[year]+' '+title+': '+entries.length+' notes'+(entries.length?' — open subject':' — no notes yet'));
   if(entries.length)card.addEventListener('click',()=>goto(year,slug));
   card.append(body,art);
   return card;
 }
 function renderSubjects(){
   $('subjectScreen').hidden=false;
   $('detailScreen').hidden=true;
   const yearNotes=notes.filter(n=>n.period===year);
   const fragment=document.createDocumentFragment();
   const shown=SUBJECTS.filter(([slug])=>(slug!=='maths'||year==='year9') &&
     (slug!=='mixed'||yearNotes.some(n=>n.subject==='mixed')));
   for(const [slug,title] of shown)fragment.append(subjectCard(slug,title,yearNotes));
   $('subjectGrid').replaceChildren(fragment);
 }
 function noteRow(note){
   const ready=isAvailable(note);
   const btn=node('button','note-row'+(ready?' ready':' unavailable'));
   btn.type='button';btn.disabled=!ready;
   btn.setAttribute('aria-label',note.title+' — '+(ready?'Read PDF':'Awaiting upload'));
   btn.append(node('span','row-icon','▤'));
   const main=node('span','row-main');
   main.append(node('span','row-name',note.title));
   main.append(node('span','row-meta','PDF · '+mb(note.sizeBytes)));
   btn.append(main,node('span','row-action',ready?'Read PDF →':workerReady?'Awaiting upload':'Unavailable'));
   if(ready)btn.addEventListener('click',()=>openDoc(note));
   return btn;
 }
 function renderDetail(){
   $('subjectScreen').hidden=true;
   $('detailScreen').hidden=false;
   $('detailYear').textContent=YEAR_NAMES[year];
   $('detailTitle').textContent=subjectName(subject)+' Notes';
   const all=notes.filter(n=>n.period===year&&n.subject===subject);
   const search=$('noteSearch').value.trim().toLowerCase();
   const shown=all.filter(n=>!search||[n.title,n.filename].some(v=>v.toLowerCase().includes(search)));
   shown.sort((a,b)=>Number(isAvailable(b))-Number(isAvailable(a))||
     a.title.localeCompare(b.title,undefined,{numeric:true}));
   const ready=all.filter(isAvailable).length;
   $('detailCount').textContent=workerReady||all.some(isSiteNote)?ready+' available / '+all.length+' Notes':all.length+' Notes';
   const fragment=document.createDocumentFragment();
   for(const note of shown)fragment.append(noteRow(note));
   $('noteList').replaceChildren(fragment);
   $('empty').hidden=shown.length!==0;
   $('empty').textContent=search?'No matching Notes. Try a different search.':'No Image Notes for this subject yet.';
 }
 function render(){
   $('yearSelect').value=year;
   if(subject)renderDetail();else renderSubjects();
   status();
 }
 function openDoc(note){
   if(!isAvailable(note))return;
   const url=isSiteNote(note)?note.url:API+'/pdf?'+new URLSearchParams({key:note.key});
   try {
     const recent=JSON.parse(localStorage.getItem(READER_RECENT_KEY)||'[]');
     const ids=[note.id,...(Array.isArray(recent)?recent:[]).filter(v=>v!==note.id)].slice(0,12);
     localStorage.setItem(READER_RECENT_KEY,JSON.stringify(ids));
   }catch{}
   $('viewerTitle').textContent=note.title;
   $('openTab').href=url;
   $('pdfFrame').src=url;
   $('viewer').hidden=false;
   document.body.classList.add('reader-open');
 }
 function closeDoc(){
   $('viewer').hidden=true;
   $('pdfFrame').src='about:blank';
   document.body.classList.remove('reader-open');
 }
 $('yearSelect').addEventListener('change',value=>{
   $('noteSearch').value='';
   goto($('yearSelect').value);
 });
 $('backSubjects').addEventListener('click',()=>{
   $('noteSearch').value='';
   goto(year);
 });
 $('noteSearch').addEventListener('input',()=>{if(subject)renderDetail()});
 $('closeReader').addEventListener('click',closeDoc);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('viewer').hidden)closeDoc()});
 window.addEventListener('hashchange',()=>{
   if(!$('viewer').hidden)closeDoc();
   $('noteSearch').value='';cleanRoute();render();
 });
 cleanRoute();
 (async()=>{
   try{
     const response=await fetch('/notes/catalog.json?v=20261023-latinvocab1',{cache:'no-cache'});
     if(!response.ok)throw Error('Notes index HTTP '+response.status);
     const manifest=await response.json();
     notes=Array.isArray(manifest.notes)?manifest.notes.filter(n=>n&&n.id&&n.key&&n.title&&n.subject&&n.period):[];
     render();
     try {
       const controller=new AbortController();
       const timer=setTimeout(()=>controller.abort(),9000);
       const response=await fetch(API+'/catalog',{signal:controller.signal,cache:'no-cache'});
       clearTimeout(timer);
       if(!response.ok)throw Error('Cloudflare catalog HTTP '+response.status);
       const listing=await response.json();
       available=new Set((listing.files||[]).map(x=>x.key));
       workerReady=true;
     }catch(e){console.info('Gloria Notes cloud availability unavailable:',e.message)}
     render();
   }catch(e){
     $('status').classList.add('offline');
     $('status').textContent='Notes catalogue unavailable. Please refresh the page.';
     console.warn(e);
   }
 })();
})();
