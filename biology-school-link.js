(()=>{
  if(location.pathname!=='/study/biology/learn'&&location.pathname!=='/study/biology/learn/')return;
  function add(){
    const main=document.querySelector('main');
    if(!main||document.getElementById('biology-school-notes-link'))return;
    const a=document.createElement('a');a.id='biology-school-notes-link';a.href='/study/biology/school-notes/';
    a.style.cssText='display:block;max-width:1050px;margin:18px auto;padding:20px 24px;border:1px solid #c4d5c6;border-radius:18px;background:#edf3e9;color:#14394d;text-decoration:none;box-shadow:0 5px 16px #223d3c10';
    a.innerHTML='<strong style="display:block;font-size:20px">Year 9 school notes · Cells and practical biology</strong><span style="display:block;margin-top:4px">Cell structure, scale, microscopy, specialised cells, bacteria and aseptic technique →</span>';
    main.prepend(a);
  }
  add();document.addEventListener('DOMContentLoaded',add);new MutationObserver(add).observe(document.documentElement,{childList:true,subtree:true});
})();
