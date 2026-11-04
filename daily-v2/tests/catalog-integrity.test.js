import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditDailyV2CatalogIntegrity} from '../src/catalog-integrity.js';
const filenames=[
 'existing-latin-y8-priority.json','existing-french-y8-top13.json',
 'existing-biology-y8-top14.json','existing-chemistry-y8.json',
 'existing-physics-y8.json',
 ...[1,2,3,4,5].map(n=>'existing-latin-y8-rest-'+n+'.json'),
 ...[1,2].map(n=>'existing-french-y8-rest-'+n+'.json'),
 ...[1,2].map(n=>'existing-biology-y8-rest-'+n+'.json')
];
const parse=(file)=>JSON.parse(readFileSync(new URL(file,import.meta.url),'utf8'));
const catalog=()=>parse('../../content/catalog.json');
const sourceRows=()=>filenames.flatMap(name=>parse('../audit/'+name).rows);
test('all 153 real Year 8 topic source snapshots were inspected once',()=>{
 const result=auditDailyV2CatalogIntegrity({catalog:catalog(),sourceRows:sourceRows()});
 assert.equal(result.topicsExpected,153);
 assert.equal(result.topicsWithSnapshots,153);
 assert.deepEqual(result.missing,[]);
 assert.deepEqual(result.duplicates,[]);
 assert.deepEqual(result.invalid,[]);
});
test('source-audited eligible count and catalog count are not silently conflated',()=>{
 const result=auditDailyV2CatalogIntegrity({catalog:catalog(),sourceRows:sourceRows()});
 assert.equal(result.actualEligibleLoaded,8918);
 assert.equal(result.nominalCatalogEnabled,8829);
 assert.equal(result.status,'requires-reconciliation');
 assert.equal(result.mayUseCatalogCountsForDailyPlanning,false);
});
test('known Biology food-tests 33 vs 143 anomaly appears in output',()=>{
 const result=auditDailyV2CatalogIntegrity({catalog:catalog(),sourceRows:sourceRows()});
 const one=result.mismatches.find(t=>t.topicId==='bio-y8-food-tests');
 assert.ok(one);
 assert.equal(one.catalogEnabled,33);
 assert.equal(one.loadedEligible,143);
 assert.equal(one.delta,110);
});
test('all current 16 source/catalog drift cases are explicitly enumerated',()=>{
 const result=auditDailyV2CatalogIntegrity({catalog:catalog(),sourceRows:sourceRows()});
 assert.equal(result.mismatches.length,16);
 assert.ok(result.mismatches.some(t=>t.topicId==='phys-y8-power-efficiency'&&t.delta===-3));
});
test('a missing source snapshot blocks count-complete certification',()=>{
 const rows=sourceRows().filter(t=>t.topicId!=='bio-y8-food-tests');
 const result=auditDailyV2CatalogIntegrity({catalog:catalog(),sourceRows:rows});
 assert.equal(result.topicsWithSnapshots,152);
 assert.ok(result.missing.includes('bio-y8-food-tests'));
});
test('duplicated source snapshot cannot be counted twice',()=>{
 const rows=sourceRows();rows.push({...rows[0]});
 const result=auditDailyV2CatalogIntegrity({catalog:catalog(),sourceRows:rows});
 assert.equal(result.duplicates.length,1);
 assert.equal(result.actualEligibleLoaded,8918);
});
test('unverified source rows with missing blob SHA fail closed',()=>{
 const rows=sourceRows();rows[0]={...rows[0],sha:''};
 const result=auditDailyV2CatalogIntegrity({catalog:catalog(),sourceRows:rows});
 assert.equal(result.invalid.length,1);
 assert.equal(result.status,'requires-reconciliation');
});
test('even aligned count metadata never proves item quality or authorises planner supply',()=>{
 const fake={topics:[{subject:'chemistry',year:8,topicId:'test',status:'enabled',enabled:20}]};
 const report=auditDailyV2CatalogIntegrity({catalog:fake,sourceRows:[{topicId:'test',n:20,sha:'actual-blob'}]});
 assert.equal(report.status,'source-counts-aligned');
 assert.equal(report.mayUseCatalogCountsForDailyPlanning,false);
 assert.equal(report.masteryCurriculumCertified,false);
});
