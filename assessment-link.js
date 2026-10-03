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
  if(!location.pathname.startsWith('/pet')) import('/pet/pet-care-global.js?v=20261003-holidays-fix').catch(()=>{});
  const icon='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="size-4" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>';
  const assessmentUrl='/assessment/?v=20260926-v3';
  function add(){
    if(location.pathname.startsWith('/assessment'))return;
    document.querySelectorAll('nav').forEach(nav=>{
      if(nav.querySelector('a[href="/study"]')&&!nav.querySelector('a[href^="/assessment"]')){
        const a=document.createElement('a');a.href=assessmentUrl;a.innerHTML=icon+'<span>Assessments</span>';
        const sample=nav.querySelector('a[href="/study"]');a.className=sample.className.replace(/bg-card\s+text-(?:ink|navy)(?:\s+shadow-sm)?/g,"text-card/75 hover:bg-white/10").replace(/bg-sage\s+text-navy/g,"text-muted").replace(/\bactive\b/g,"");
        a.setAttribute('aria-label','School assessments and long tests');sample.after(a);
        if(nav.classList.contains('grid'))nav.style.gridTemplateColumns='repeat(7,minmax(0,1fr))';
      }
    });
    if(location.pathname==='/'&&!document.getElementById('school-assessment-home')){
      const main=document.querySelector('main');if(!main)return;
      const card=document.createElement('a');card.id='school-assessment-home';card.href=assessmentUrl;
      card.setAttribute('aria-label','Open school assessments and long tests');
      card.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 20px;padding:18px 22px;border-radius:22px;background:#1A3148;color:#fffdf8;text-decoration:none;box-shadow:0 0 0 1px rgba(196,164,106,.45),0 8px 22px rgba(48,36,20,.08);min-height:84px';
      card.innerHTML='<span style="display:flex;align-items:center;gap:16px">'+icon+'<span><strong style="display:block;font-family:Cormorant Garamond,serif;font-size:22px;line-height:1.25">School assessments</strong><span style="display:block;margin-top:4px;font-size:14px;opacity:.86">Track school tests \u00b7 45-minute practice papers</span></span></span><span aria-hidden="true" style="font-size:28px">\u2192</span>';
      card.querySelector('svg').style.cssText='width:30px;height:30px;flex-shrink:0';
      main.prepend(card);
    }
  }
  add();
  document.addEventListener('DOMContentLoaded', add);
  new MutationObserver(add).observe(document.documentElement, {childList:true, subtree:true});
})();
