// Recovery drafts and replay links are scoped to their original date.
export function recoveryDate(search){const date=new URLSearchParams(search).get('recover');return /^\d{4}-\d{2}-\d{2}$/.test(date||'')?date:null}
export function recoveryTask(id,search){const date=recoveryDate(search);return date?String(id||'vocab')+':recover:'+date:id}
export function legacyRecoveryMatches(saved,search){
 const target=recoveryDate(search);let date=null;
 try{date=recoveryDate(new URL(saved?.href||'/', 'https://local.invalid').search)}catch{}
 return target===date;
}
export function recoveryReplay(href,now=Date.now()){
 const url=new URL(href,'https://local.invalid');
 url.searchParams.set('redo',String(now));return url.pathname+url.search;
}
