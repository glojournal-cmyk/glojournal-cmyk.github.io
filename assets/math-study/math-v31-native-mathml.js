// Native MathML for Maths V3.1's TeX subset.
// No network, dynamic macros or code execution. Unsupported input fails closed.
const escapeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const row=parts=>'<mrow>'+parts.join('')+'</mrow>';
const mo=x=>'<mo>'+escapeText(x)+'</mo>',mi=x=>'<mi>'+escapeText(x)+'</mi>',mn=x=>'<mn>'+escapeText(x)+'</mn>';
const symbols=Object.freeze({times:'×',div:'÷',ne:'≠',neq:'≠',ge:'≥',geq:'≥',le:'≤',leq:'≤',cdot:'·',pm:'±',pi:'π',infty:'∞'});
export function latexMathML(latex){
 if(typeof latex!=='string'||!latex.trim()||latex.length>3000)throw Error('Invalid Maths formula');
 let i=0,ops=0;
 const err=msg=>{throw Error('Unsupported Maths formula: '+msg+' at '+i)};
 const spaces=()=>{while(i<latex.length&&/\s/.test(latex[i]))i++};
 const exact=s=>latex.slice(i,i+s.length)===s;
 function group(){spaces();if(latex[i]!=='{')err('expected brace');i++;
   const inner=sequence('}');if(latex[i]!=='}')err('unclosed brace');i++;return inner}
 function one(){spaces();if(i>=latex.length)err('empty exponent');return latex[i]==='{'?group():atom()}
 function cases(){
  const stop='\\end{cases}',end=latex.indexOf(stop,i);
  if(end===-1)err('unclosed cases');
  const body=latex.slice(i,end);i=end+stop.length;
  const rows=body.split('\\\\');
  if(rows.length<1||rows.length>6)err('invalid number of equations');
  const cells=rows.map(line=>{
    if(!line.trim())err('empty equation');
    return '<mtr><mtd>'+latexMathML(line.trim()).replace(/^<math[^>]*>|<\/math>$/g,'')+'</mtd></mtr>';
  }).join('');
  return '<mrow><mo>{</mo><mtable columnalign="left">'+cells+'</mtable></mrow>';
 }
 function command(){
  i++;let cmd='';
  while(i<latex.length&&/[a-zA-Z]/.test(latex[i]))cmd+=latex[i++];
  if(!cmd){
    const ch=latex[i++];
    if(ch==='%'||ch==='{'||ch==='}'||ch==='$')return mo(ch);
    if(ch==='\\')return mo(' ');
    err('unknown escape');
  }
  if(cmd==='left'||cmd==='right')return '';
  if(cmd==='dfrac'||cmd==='frac')return '<mfrac>'+group()+group()+'</mfrac>';
  if(cmd==='sqrt')return '<msqrt>'+group()+'</msqrt>';
  if(cmd==='mathrm')return '<mstyle mathvariant="normal">'+group()+'</mstyle>';
  if(cmd==='begin'){
    if(!exact('{cases}'))err('unsupported environment');
    i+='{cases}'.length;return cases();
  }
  if(Object.hasOwn(symbols,cmd))return mo(symbols[cmd]);
  err('unknown macro '+cmd);
 }
 function atom(){
  spaces();if(++ops>4000)err('too many tokens');
  const c=latex[i];if(!c)err('unexpected end');
  if(c==='\\')return command();
  if(c==='{')return group();
  if(/[0-9]/.test(c)||c==='.'&&/[0-9]/.test(latex[i+1])){
    let value='';while(i<latex.length&&/[0-9.]/.test(latex[i]))value+=latex[i++];
    if(!/^\d+(\.\d+)?$/.test(value))err('bad number');return mn(value);
  }
  if(/[a-zA-Z]/.test(c)){i++;return mi(c)}
  if('()+-=,<>[]|:;/%*'.includes(c)){i++;return mo(c)}
  if(c==='−'||c==='×'||c==='÷'||c==='≤'||c==='≥'||c==='≠'){i++;return mo(c)}
  if(c==='£'){i++;return '<mtext>£</mtext>'}
  if(c==='&'||c==='#')err('unsafe symbol');
  err('unrecognized character');
 }
 function sequence(until=null){
  const parts=[];
  while(i<latex.length){
   spaces();if(i>=latex.length)break;
   if(until&&latex[i]===until)break;
   if(latex[i]==='}')err('unexpected brace');
   if(latex[i]==='^'||latex[i]==='_')err('dangling index');
   let node=atom();if(!node)continue;
   while(i<latex.length){
     spaces();if(latex[i]!=='^'&&latex[i]!=='_')break;
     const mode=latex[i++],argument=one();
     node=mode==='^'?'<msup>'+node+argument+'</msup>':'<msub>'+node+argument+'</msub>';
   }
   parts.push(node);
  }
  return row(parts);
 }
 const math=sequence();spaces();if(i!==latex.length)err('trailing input');
 return '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">'+math+'</math>';
}
export function mathsRichTextHTML(source){
 if(typeof source!=='string'||source.length>9000)throw Error('Maths text too long');
 const parts=source.split('$');if(parts.length%2!==1)throw Error('Unpaired Maths delimiter');
 const html=[];
 for(let i=0;i<parts.length;i++){
  const part=parts[i];
  if(i%2===0){html.push('<span>'+escapeText(part.replace(/\*\*/g,''))+'</span>');continue;}
  // Original source uses "cm$^3$" and "m$^3=...$"; attach units.
  if(part.startsWith('^')&&i>0){
   const match=parts[i-1].match(/(cm|mm|km|m)$/);
   if(!match)throw Error('Orphan unit exponent');
   const unit=match[1],last=html.pop();
   html.push(last.slice(0,-(unit.length+7))+'</span>');
   html.push(latexMathML('\\mathrm{'+unit+'}'+part));
  } else html.push(latexMathML(part));
 }
 return html.join('');
}
export function mathsOptionHTML(option){
 if(!option||!['A','B','C','D','E','F'].includes(option.id))
   throw Error('Unknown answer option');
 return latexMathML(option.latex);
}
