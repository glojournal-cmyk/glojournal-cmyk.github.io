(()=>{
  function add(){
    if(location.pathname.startsWith('/assessment'))return;
    document.querySelectorAll('nav').forEach(nav=>{
      if(nav.querySelector('a[href="/study"]')&&!nav.querySelector('a[href="/assessment"]')){
        const a=document.createElement('a');a.href='/assessment';a.textContent='Assessments';
        const sample=nav.querySelector('a[href="/study"]');a.className=sample.className;
        a.setAttribute('aria-label','School assessments and long tests');sample.after(a);
      }
    });
    if(location.pathname==='/'&&!document.getElementById('school-assessment-home')){
      const main=document.querySelector('main');if(!main)return;
      const card=document.createElement('a');card.id='school-assessment-home';card.href='/assessment/';
      card.setAttribute('aria-label','Open school assessments and long tests');
      card.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 20px;padding:18px 22px;border-radius:22px;background:#12384d;color:#fff;text-decoration:none;box-shadow:0 7px 20px #17304a25;min-height:84px';
      card.innerHTML='<span><strong style="display:block;font-size:20px;line-height:1.25">School assessments</strong><span style="display:block;margin-top:4px;font-size:15px;opacity:.86">Track school tests · 45-minute practice papers</span></span><span aria-hidden="true" style="font-size:28px">→</span>';
      main.prepend(card);
    }
  }
  add();document.addEventListener('DOMContentLoaded',add);setTimeout(add,1200);
})();
