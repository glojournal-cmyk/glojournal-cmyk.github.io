import archiveIndex from './archives/gloria-zip1.json' with {type:'json'};
// Public read-only PDF delivery for Notes bucket only. Never bind private backups.
// In addition to individual R2 PDFs, a single ZIP_STORED archive can serve 25 page-image PDFs
// via independent byte-range requests. Importer has NO write methods or secrets.
const SITE='https://glojournal-cmyk.github.io';
const archived=new Map(archiveIndex.entries.map(e=>[e.key,e]));
const safeKey=key=>typeof key==='string' &&
 /^(summer|year9)\/(french|latin|biology|chemistry|english|physics|maths|mixed)\/[a-zA-Z0-9_(). -]+\.pdf$/i.test(key) &&
 key.length<300&&!key.includes('..');
function headers(extra={}){return {
 'Access-Control-Allow-Origin':SITE,
 'Access-Control-Allow-Methods':'GET, HEAD, OPTIONS',
 'Access-Control-Allow-Headers':'Range, If-None-Match',
 'Access-Control-Expose-Headers':'Content-Range, Accept-Ranges, Content-Length, ETag',
 'X-Content-Type-Options':'nosniff',...extra};}
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:headers({
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'public,max-age=60'})});}
const pdfHeaders=extra=>headers({'Content-Type':'application/pdf',
 'Content-Disposition':'inline','Accept-Ranges':'bytes',
 'Cache-Control':'public,max-age=3600',...extra});
async function availableArchive(env){
 const obj=await env.NOTES.head(archiveIndex.archiveKey);
 // No PDF is shown as available unless exactly the expected single ZIP object is present.
 return obj && obj.size===archiveIndex.archiveBytes?obj:null;
}
function subRange(header,size){
 if(!header)return {offset:0,length:size,partial:false};
 const m=/^bytes=(\d*)-(\d*)$/.exec(header.trim());
 if(!m||(!m[1]&&!m[2]))return null;
 let first,last;
 if(!m[1]){const suffix=Number(m[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)return null;
  first=Math.max(0,size-suffix);last=size-1;
 }else{
  first=Number(m[1]);last=m[2]?Number(m[2]):size-1;
  if(!Number.isSafeInteger(first)||!Number.isSafeInteger(last))return null;
  if(first>=size||last<first)return null;last=Math.min(last,size-1);
 }
 return {offset:first,length:last-first+1,partial:true};
}
async function archivedPDF(request,env,key){
 const entry=archived.get(key);
 if(!entry)return json({error:'not-found'},404);
 const meta=await availableArchive(env);
 if(!meta)return json({error:'not-found'},404);
 if(request.method==='HEAD')return new Response(null,{status:200,
  headers:pdfHeaders({'Content-Length':String(entry.size)})});
 const range=subRange(request.headers.get('Range'),entry.size);
 if(!range)return new Response(null,{status:416,
  headers:headers({'Content-Range':'bytes */'+entry.size,'Accept-Ranges':'bytes'})});
 const part=await env.NOTES.get(archiveIndex.archiveKey,{range:{
  offset:entry.start+range.offset,length:range.length}});
 if(!part||!part.body)return json({error:'archive-unavailable'},503);
 const h=pdfHeaders({'Content-Length':String(range.length)});
 if(range.partial)h['Content-Range']='bytes '+range.offset+'-'+(range.offset+range.length-1)+'/'+entry.size;
 return new Response(part.body,{status:range.partial?206:200,headers:h});
}
export default {
 async fetch(request,env){
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:headers()});
  if(!['GET','HEAD'].includes(request.method))return json({error:'read-only'},405);
  const url=new URL(request.url);
  if(url.pathname==='/health')return json({ok:true,service:'gloria-notes-readonly'});
  if(url.pathname==='/catalog'){
   let cursor;const list=new Map();
   do{
    const page=await env.NOTES.list({limit:500,...(cursor?{cursor}:{})});
    for(const o of page.objects||[])if(safeKey(o.key)&&list.size<5000)
      list.set(o.key,{key:o.key,size:o.size,uploaded:o.uploaded?.toISOString?.()||null});
    cursor=page.truncated?page.cursor:undefined;
   }while(cursor&&list.size<5000);
   const archive=await availableArchive(env);
   if(archive)for(const e of archived.values()){
    if(!list.has(e.key))list.set(e.key,{key:e.key,size:e.size,
      uploaded:archive.uploaded?.toISOString?.()||null,source:'verified-zip-store'});
   }
   return json({files:[...list.values()],readOnly:true});
  }
  if(url.pathname!=='/pdf')return json({error:'not-found'},404);
  const key=url.searchParams.get('key');
  if(!safeKey(key))return json({error:'invalid-key'},400);
  const range=request.headers.get('Range');
  if(request.method==='HEAD'){
   const meta=await env.NOTES.head(key);
   if(!meta)return archivedPDF(request,env,key);
   return new Response(null,{status:200,headers:pdfHeaders({'Content-Length':String(meta.size)})});
  }
  const obj=await env.NOTES.get(key,range?{range:request.headers}:{});
  if(!obj)return archivedPDF(request,env,key);
  const h=pdfHeaders({'ETag':obj.httpEtag});
  const ranged=!!(obj.range&&range);
  if(ranged){
    const offset=obj.range.offset??0;
    const length=obj.range.length??obj.size-offset;
    h['Content-Range']='bytes '+offset+'-'+(offset+length-1)+'/'+obj.size;
    h['Content-Length']=String(length);
  }else h['Content-Length']=String(obj.size);
  return new Response(obj.body,{status:ranged?206:200,headers:h});
 }
};
