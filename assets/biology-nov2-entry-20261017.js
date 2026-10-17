(() => {
  if(!/^\/study\/biology(?:\/|$)/.test(location.pathname)||location.pathname.startsWith('/study/biology/nov2'))return;
  const params=new URLSearchParams(location.search);
  if(params.has('daily')||params.has('dailyId')||params.has('task')||params.has('recover'))return;
  if(!document.querySelector('link[data-bio-nov2-style]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/assets/biology-nov2-20261017.css?v=1&ux=20261013-corrections2';css.dataset.bioNov2Style='';document.head.append(css);}
  function add(){
    const main=document.querySelector('main');if(!main)return;
    let entry=document.getElementById('biology-nov2-entry');
    if(!entry){entry=document.createElement('section');entry.id='biology-nov2-entry';entry.className='nov2-entry';entry.setAttribute('aria-label','2 November Biology revision');entry.innerHTML='<strong>2 November assessment · Specialised cells &amp; RP1</strong><span>84 questions · short answers, practical reasoning, biological drawing and calculations.</span><a href="/assessment/biology-nov2/practice/">Start topic practice →</a><a href="/assessment/?paper=biology-nov2">Take the timed assessment →</a><a href="/assessment/biology-nov2/notes.pdf">Read illustrated notes →</a>';main.prepend(entry);}
    // Keep an existing answer screen focused when the earlier cell practice is active.
    entry.hidden=!!main.querySelector('[data-biology-question]');
  }
  add();document.addEventListener('DOMContentLoaded',add);
  new MutationObserver(add).observe(document.documentElement,{subtree:true,childList:true});
})();
