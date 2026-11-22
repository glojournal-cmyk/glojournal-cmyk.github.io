import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {latexMathML,mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';
const rows=JSON.parse(fs.readFileSync('qa-staging/math-v31-original-sample10.json','utf8')).questions;
test('All 10 original reviewer stems, 60 options and worked lines convert without external services',()=>{
 let checked=0;
 for(const q of rows){
  const stem=mathsRichTextHTML(q.stem);
  assert.match(stem,/<math /,q.id);assert.doesNotMatch(stem,/<script|<iframe|https?:\/\/\//i,q.id);
  checked++;
  for(const o of q.options){
   const result=mathsOptionHTML(o);
   assert.match(result,/^<math /,q.id+': '+o.id);
   assert.doesNotMatch(result,/\\dfrac|\\sqrt|\\begin/,q.id+': '+o.id);checked++;
  }
  for(const step of q.workedSolutionSteps){
   assert.ok(mathsRichTextHTML(step).length>0);checked++;
  }
 }
 assert.ok(checked>=90);
});
test('offline native MathML supports fractions, nested radicals, indexes, cases, percentages and source unit notation',()=>{
 const expressions=[
  '\\dfrac{2^{n+3}\\times 4^{-1}}{\\sqrt{2^{2n}}}',
  '\\frac{3}{4x+1}',
  '\\mathrm{cm}^{3}',
  '\\begin{cases}2x+3y=7\\\\3x-2y=4\\end{cases}',
  '2\\ge 1','x\\ne 0','25\\%'
 ];
 for(const s of expressions)assert.match(latexMathML(s),/<math /,s);
 assert.match(latexMathML(expressions[0]),/<mfrac>/);
 assert.match(latexMathML(expressions[0]),/<msqrt>/);
 assert.match(latexMathML(expressions[0]),/<msup>/);
 assert.match(latexMathML(expressions[3]),/<mtable/);
 for(const source of [
  'The volume is $2\\times10^{4}$ cm$^3$.',
  'Convert $2\\times10^{-3}$ m$^3=2\\times10^{3}$ cm$^3$.',
  'Density is $3\\times10^{2}$ g/cm$^3$.'
 ])assert.match(mathsRichTextHTML(source),/<msup>/);
});
test('renderer rejects malformed or unsafe source instead of showing raw TeX',()=>{
 for(const bad of [
  '\\evilcommand{1}','\\input{any}','\\begin{array}{c}1\\end{array}',
  '\\frac{1}','\\sqrt{','x^','x_','{1'
 ])assert.throws(()=>latexMathML(bad),/Unsupported|Invalid/);
 assert.throws(()=>mathsRichTextHTML('Question $x^2'),/Unpaired/);
 assert.throws(()=>mathsRichTextHTML('Area is $^3$.'),/Orphan/);
 const safe=mathsRichTextHTML('Make $x$ the subject <script>alert(1)</script>.');
 assert.doesNotMatch(safe,/<script>/);assert.match(safe,/&lt;script&gt;/);
 assert.throws(()=>mathsOptionHTML({id:'G',latex:'2'}),/Unknown answer/);
});
