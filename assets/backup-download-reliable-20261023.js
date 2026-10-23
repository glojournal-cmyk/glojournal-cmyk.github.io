/* Backup export must not depend on optional OS Web Share permission.
   Starts a native browser download synchronously from a user action.
   The return value means requested, never proof that Files contains it. */
export function requestJsonDownload(data, filename, browser={}) {
  if(typeof data!=="string" || !data.length)throw Error("Backup is empty");
  const doc=browser.document||document;
  const urlApi=browser.URL||URL;
  const BlobType=browser.Blob||Blob;
  const after=browser.setTimeout||setTimeout;
  const blob=new BlobType([data],{type:"application/json"});
  const url=urlApi.createObjectURL(blob);
  try{
    const link=doc.createElement("a");
    link.href=url;link.download=filename;
    doc.body.append(link);
    link.click();
    link.remove();
  }catch(error){
    urlApi.revokeObjectURL(url);
    throw error;
  }
  after(()=>urlApi.revokeObjectURL(url),60000);
  return true;
}
export function nextAutoBackupDelay(lastAttemptAt, now=Date.now(), intervalMs=15000){
  // Reschedule instead of discarding a rapid follow-up completion event.
  return Math.max(300,Math.max(0,lastAttemptAt+intervalMs-now)+200);
}
export function verifiedDailyDone(state){
 const date=state?.today;
 if(!date)return false;
 if(state.dailyCompleteAwarded?.[date]===true)return true;
 const tasks=state?.daily;
 return Array.isArray(tasks)&&tasks.length===10&&tasks.every(t=>
   Number(t?.target)>0&&Number(t?.progress)>=Number(t?.target));
}
