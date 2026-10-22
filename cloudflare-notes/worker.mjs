// Public read-only PDF delivery for the distinct Notes bucket only.
// Never bind the encrypted backup bucket. No POST/PUT/DELETE endpoint.
const SITE = 'https://glojournal-cmyk.github.io';
function headers(extra={}) {return {
  'Access-Control-Allow-Origin':SITE,
  'Access-Control-Allow-Methods':'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers':'Range, If-None-Match',
  'Access-Control-Expose-Headers':'Content-Range, Accept-Ranges, Content-Length, ETag',
  'X-Content-Type-Options':'nosniff',...extra};}
function json(value,status=200){return new Response(JSON.stringify(value),{
  status,headers:headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'public,max-age=60'})});}
const safeKey = key => typeof key==='string' &&
  /^(summer|year9)\/(french|latin|biology|chemistry|english|physics|maths|mixed)\/[a-zA-Z0-9_(). -]+\.pdf$/i.test(key) &&
  key.length<300 && !key.includes('..');
export default {
 async fetch(request,env){
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:headers()});
  if(!['GET','HEAD'].includes(request.method)) return json({error:'read-only'},405);
  const u=new URL(request.url);
  if(u.pathname==='/health') return json({ok:true,service:'gloria-notes-readonly'});
  if(u.pathname==='/catalog'){
    let cursor,seen=0;const files=[];
    do{
      const page=await env.NOTES.list({limit:500,...(cursor?{cursor}:{})});
      for(const o of page.objects||[])if(safeKey(o.key)){
        files.push({key:o.key,size:o.size,uploaded:o.uploaded?.toISOString?.()||null});
        seen++;
      }
      cursor=page.truncated?page.cursor:undefined;
    }while(cursor && seen<5000);
    return json({files,readOnly:true});
  }
  if(u.pathname!== '/pdf')return json({error:'not-found'},404);
  const key=u.searchParams.get('key');
  if(!safeKey(key))return json({error:'invalid-key'},400);
  const range=request.headers.get('Range');
  let obj;
  if(request.method==='HEAD'){
    const meta=await env.NOTES.head(key);
    if(!meta)return json({error:'not-found'},404);
    return new Response(null,{status:200,headers:headers({
      'Content-Type':'application/pdf','Content-Length':String(meta.size),
      'Content-Disposition':'inline','Accept-Ranges':'bytes',
      'Cache-Control':'public,max-age=3600'})});
  }
  obj=await env.NOTES.get(key,range?{range:request.headers}:{});
  if(!obj)return json({error:'not-found'},404);
  const h=headers({'Content-Type':'application/pdf','Content-Disposition':'inline',
    'Accept-Ranges':'bytes','Cache-Control':'public,max-age=3600',
    'ETag':obj.httpEtag});
  const ranged=!!(obj.range && range);
  if(ranged){
    const offset=obj.range.offset??0;
    const length=obj.range.length??obj.size-offset;
    h['Content-Range']='bytes '+offset+'-'+(offset+length-1)+'/'+obj.size;
    h['Content-Length']=String(length);
  }else h['Content-Length']=String(obj.size);
  return new Response(obj.body,{status:ranged?206:200,headers:h});
 }
};