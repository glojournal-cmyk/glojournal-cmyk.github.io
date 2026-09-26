(()=>{
  const icon='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide size-4" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3.5h6M9 9h6M9 13h6M9 17h3"/><path d="m14 17 1.5 1.5L18 16"/></svg>';
  function add(){
    if(location.pathname.startsWith('/assessment'))return;
    document.querySelectorAll('nav').forEach(nav=>{
      if(nav.querySelector('a[href="/study"]')&&!nav.querySelector('a[href="/assessment"]')){
        const a=document.createElement('a');a.href='/assessment';a.innerHTML=icon+'<span>Assessments</span>';
        const sample=nav.querySelector('a[href="/study"]');a.className=sample.className;
        a.setAttribute('aria-label','School assessments and long tests');sample.after(a);
        if(nav.classList.contains('grid'))nav.style.gridTemplateColumns='repeat(6,minmax(0,1fr))';
      }
    });
    if(location.pathname==='/'&&!document.getElementById('school-assessment-home')){
      const main=document.querySelector('main');if(!main)return;
      const card=document.createElement('a');card.id='school-assessment-home';card.href='/assessment/';
      card.setAttribute('aria-label','Open school assessments and long tests');
      card.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 20px;padding:18px 22px;border-radius:22px;background:#12384d;color:#fff;text-decoration:none;box-shadow:0 7px 20px #17304a25;min-height:84px';
      card.innerHTML='<span style="display:flex;align-items:center;gap:16px">'+icon+'<span><strong style="display:block;font-size:20px;line-height:1.25">School assessments</strong><span style="display:block;margin-top:4px;font-size:15px;opacity:.86">Track school tests · 45-minute practice papers</span></span></span><span aria-hidden="true" style="font-size:28px">→</span>';
      card.querySelector('svg').style.cssText='width:30px;height:30px;flex-shrink:0';
      main.prepend(card);
    }
  }
  add();document.addEventListener('DOMContentLoaded',add);setTimeout(add,1200);
})();
