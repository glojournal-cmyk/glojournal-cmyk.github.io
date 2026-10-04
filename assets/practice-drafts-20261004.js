(function(root){
 const KEY='lux-practice-drafts-v1';
 function all(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}}
 function key(subject,year,size,topic,daily,mode){const u=new URL(location.href);return JSON.stringify([subject,year,size,topic||'',daily||'',mode||u.searchParams.get('mode')||'standard',u.searchParams.get('task')||'',u.searchParams.get('scope')||'',daily?new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London'}).format(new Date()):''])}
 function read(key){const d=all()[key];return d?.version===1&&Date.now()-d.savedAt<7*86400000&&Array.isArray(d.base)&&d.base.length&&Number.isInteger(d.j)&&d.j>=0&&d.j<d.base.length+(d.rr?.length||0)&&!d.ce?d:null}
 function clear(key){try{const x=all();delete x[key];localStorage.setItem(KEY,JSON.stringify(x));return true}catch{return false}}
 function save(key,d){try{const x=all();for(const k of Object.keys(x))if(Date.now()-x[k].savedAt>7*86400000)delete x[k];if(d.ce)delete x[key];else x[key]={...d,version:1,savedAt:Date.now()};localStorage.setItem(KEY,JSON.stringify(x));return true}catch{return false}}
 root.LuxPracticeDrafts={key,read,save,clear};
})(globalThis);
