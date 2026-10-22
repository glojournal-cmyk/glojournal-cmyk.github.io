import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const script=readFileSync('assets/gloria-auto-backup-20261022.js','utf8');
const home=readFileSync('index.html','utf8');
const page=readFileSync('cloud-backup.html','utf8');
test('auto backup loads without any write or restore to learner progress',()=>{
 assert.match(home,/startAutomaticBackup\(\)/);
 assert.match(script,/readCurrentProgress\(\)/);
 assert.doesNotMatch(script,/\.setState\(|localStorage\.setItem\(|localStorage\.removeItem\(/);
});
test('user enrollment is opt-in and removable without cloud delete',()=>{
 assert.match(script,/export async function enrollAutoBackup/);
 assert.match(script,/export async function disableAutoBackup/);
 assert.match(page,/id="enroll"/);
 assert.match(page,/id="disable"/);
 assert.doesNotMatch(script,/\/v1\/delete|\/v1\/purge/);
});
test('server upload token is not embedded in public application sources',()=>{
 assert.doesNotMatch(script,/CLOUDFLARE_API_TOKEN|BACKUP_TOKEN_SHA256/);
 assert.doesNotMatch(page,/CLOUDFLARE_API_TOKEN/);
});
