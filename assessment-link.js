if(!/^\/(pet|assessment)(\/|$)/.test(location.pathname)) import('/assets/star-map-gallery-20261004.js?v=20261007-loading2').catch(console.error);
if(!/^\/(pet|assessment)(\/|$)/.test(location.pathname)) import('/assets/memory-stars-20261004.js?v=20261007-loading2').catch(console.error);
if(!/^\/(pet|assessment)(\/|$)/.test(location.pathname)) import('/assets/daily-task-presentation-20261004.js?v=1').catch(console.error);
if(!/^\/(pet|assessment)(\/|$)/.test(location.pathname)) import('/assets/companion-experience-20261004.js?v=20261007-loading2').catch(console.error);
import('/assets/ipad-experience-20261004.js?v=20261007-loading2').catch(console.error);
if(!location.pathname.startsWith('/assessment')) import('/assets/school-revision-home-20261004.js?v=20261007-loading2').catch(error=>console.error('School revision panel could not load',error));
(() => {
  if (!document.querySelector('link[href*="lux-theme.css"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/lux-theme.css?v=20261003-cardlayout1';
    document.head.appendChild(l);
  }
  if (!document.querySelector('script[src*="lux-theme.js"]')) {
    const s = document.createElement('script');
    s.src = '/lux-theme.js?v=20261003-cardlayout1';
    s.defer = true;
    document.head.appendChild(s);
  }
})();
(()=>{
  import('/pet/evolution-art-fix.js?v=20260927-evolution3').catch(()=>{});
  if(!location.pathname.startsWith('/pet')) import('/pet/pet-care-global.js?v=20261007-loading2').catch(()=>{});
  const icon='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="size-4" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>';
  const assessmentUrl='/assessment/?v=20260926-v3';
  function add(){
    if((location.pathname==='/'||location.pathname.startsWith('/scholar')||location.pathname.endsWith('/progress/'))&&!document.getElementById('parent-weekly-entry')){const main=document.querySelector('main');if(main){const link=document.createElement('a');link.id='parent-weekly-entry';link.href='/progress/weekly/';link.textContent='Parent weekly summary · practice, independent answers & delayed checks';link.style.cssText='display:block;padding:16px;margin:0 0 18px;border:1px solid #d4c6ac;border-radius:14px;background:#fffaf0;color:#173e50';main.prepend(link)}}

    const entryPath=location.pathname.replace(/\/$/, '') || '/';
    const existing=document.getElementById('subject-directory-entry');
    if(entryPath!=='/'&&entryPath!=='/study')existing?.remove();
    if((entryPath==='/'||entryPath==='/study')&&!existing){
      const main=document.querySelector('main');
      if(main){
        const panel=document.createElement('section');panel.id='subject-directory-entry';
        panel.setAttribute('aria-label','Browse subject topics and notes');
        panel.style.cssText='margin:0 0 20px;padding:20px;border:1px solid #d4c6ac;border-radius:22px;background:#fffaf0;color:#1a3148';
        const title=document.createElement('h2');title.textContent='Browse subjects';title.style.cssText='margin:0 0 5px;font-family:Cormorant Garamond,Georgia,serif;font-size:27px;line-height:1.2';panel.appendChild(title);
        const hint=document.createElement('p');hint.textContent='Choose a subject to find notes and practise by topic.';hint.style.cssText='margin:0 0 14px;font-size:14px;color:#637064';panel.appendChild(hint);
        const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px';
        for(const [id,name]of [['latin','Latin'],['french','French'],['biology','Biology'],['chemistry','Chemistry'],['physics','Physics'],['english','English']]){
          const link=document.createElement('a');link.href='/study/'+id+'/';link.setAttribute('aria-label',name+' topics and notes');
          link.style.cssText='display:flex;flex-direction:column;justify-content:center;gap:3px;min-height:64px;padding:12px 16px;border:1px solid #c9d2be;border-radius:15px;background:#edf0e6;color:#1a3148;text-decoration:none';
          const nameText=document.createElement('strong');nameText.textContent=name;nameText.style.cssText='font-size:17px';
          const label=document.createElement('span');label.textContent='Topics & notes →';label.style.cssText='font-size:12px';link.append(nameText,label);grid.appendChild(link);
        }
        panel.appendChild(grid);main.prepend(panel);
      }
    }
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
