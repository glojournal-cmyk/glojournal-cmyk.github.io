import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const candidates=[
 {q:5,a:2,b:1,c:2,answer:16,outlier:65536,option:'D'},
 {q:6,a:3,b:2,c:3,answer:8,outlier:134217728,option:'D'},
 {q:7,a:4,b:3,c:4,answer:4,outlier:274877906944,option:'B'},
 {q:8,a:5,b:4,c:5,answer:2,outlier:562949953421312,option:'E'}
];
test('four original 005-008 large wrong choices are reconstructable by loss of negative exponent',()=>{
 assert.equal(candidates.length,4);
 for(const row of candidates){
  const correctExponent=2*(2*row.a-3*row.b)+row.c;
  const mistakenExponent=2*(2*row.a+3*row.b)+row.c;
  assert.equal(2**correctExponent,row.answer,'Original correct Q'+row.q);
  assert.equal(2**mistakenExponent,row.outlier,'Original wrong option Q'+row.q);
  assert.ok(mistakenExponent>correctExponent);
  assert.ok(['B','D','E'].includes(row.option));
 }
});
test('review is never misrepresented as grade/teacher/device approval',()=>{
 const report=fs.readFileSync(
  'qa-reports/daily-v3-maths-indices-005-008-source-distractors-20261122.md','utf8');
 for(const id of ['005','006','007','008'])
  assert.ok(report.includes('LUX-MATH-Y9-INDICES-'+id));
 assert.match(report,/NOT ACADEMIC QA APPROVED/);
 assert.match(report,/No source 200-bank JSON, answer key, student credit/);
 assert.match(report,/one common idea/);
});
