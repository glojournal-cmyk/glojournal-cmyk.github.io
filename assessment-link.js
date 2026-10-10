if(!/^\/(pet|assessment)(\/|$)/.test(location.pathname)) import('/assets/star-map-gallery-20261004.js?v=20261010-chem-marking1').catch(console.error);
if(!/^\/(pet|assessment)(\/|$)/.test(location.pathname)) import('/assets/memory-stars-20261004.js?v=20261010-chem-marking1').catch(console.error);
if(!/^\/(pet|assessment)(\/|$)/.test(location.pathname)) import('/assets/daily-task-presentation-20261004.js?v=20261008-close2').catch(console.error);
if(!/^\/(pet|assessment)(\/|$)/.test(location.pathname)) import('/assets/companion-experience-20261004.js?v=20261009-pet-hd1').catch(console.error);
import('/assets/ipad-experience-20261004.js?v=20261008-accent1').catch(console.error);
if(!/^\/(pet|assessment)(\/|$)/.test(location.pathname)) import('/assets/school-revision-home-20261004.js?v=20261010-chem-marking1').catch(error=>console.error('School revision panel could not load',error));
(() => {
  if (!document.querySelector('link[href*="lux-theme.css"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/lux-theme.css?v=20261003-cardlayout1';
    document.head.appendChild(l);
  }
  if (!document.querySelector('script[src*="lux-theme.js"]')) {
    const s = document.createElement('script');
    s.src = '/lux-theme.js?v=20261008-desk1';
    s.defer = true;
    document.head.appendChild(s);
  }
})();
(()=>{
  import('/pet/evolution-art-fix.js?v=20260927-evolution3').catch(()=>{});
  if(!location.pathname.startsWith('/pet')) import('/pet/pet-care-global.js?v=20261010-chem-marking1').catch(()=>{});
  const icon='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="size-4" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>';
  const assessmentUrl='/assessment/?v=20260926-v3';
  function add(){
    if((location.pathname==='/'||location.pathname.startsWith('/scholar')||location.pathname.endsWith('/progress/'))&&!document.getElementById('parent-weekly-entry')){const main=document.querySelector('main');if(main){const link=document.createElement('a');link.id='parent-weekly-entry';link.href='/progress/weekly/';link.textContent='Parent weekly summary · practice, independent answers & delayed checks';link.style.cssText='display:block;padding:16px;margin:0 0 18px;border:1px solid #d4c6ac;border-radius:14px;background:#fffaf0;color:#173e50';main.append(link)}}

    // The Study page already has a complete six-subject library and the Home
    // now links to it. Never prepend a second directory above the Scholar,
    // selected pet or current quest; doing so hides the actual game on arrival.
    document.getElementById('subject-directory-entry')?.remove();
    if(location.pathname.startsWith('/assessment'))return;
    document.querySelectorAll('nav').forEach(nav=>{
      if(nav.querySelector('a[href="/study"]')&&!nav.querySelector('a[href^="/assessment"]')){
        const a=document.createElement('a');a.href=assessmentUrl;a.innerHTML=icon+'<span>Assessments</span>';
        const sample=nav.querySelector('a[href="/study"]');a.className=sample.className.replace(/bg-card\s+text-(?:ink|navy)(?:\s+shadow-sm)?/g,"text-card/75 hover:bg-white/10").replace(/bg-sage\s+text-navy/g,"text-muted").replace(/\bactive\b/g,"");
        a.setAttribute('aria-label','School assessments and long tests');sample.after(a);
        if(nav.classList.contains('grid'))nav.style.gridTemplateColumns='repeat(7,minmax(0,1fr))';
      }
    });

  }
  add();
  document.addEventListener('DOMContentLoaded', add);
  new MutationObserver(add).observe(document.documentElement, {childList:true, subtree:true});
})();
