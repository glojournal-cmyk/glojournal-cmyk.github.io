import test from 'node:test';
import assert from 'node:assert/strict';
import worker, {sendDailyEmail, validEnvelope} from '../worker.mjs';

test('scheduled mailer does not claim success with an empty R2 bucket', async () => {
  const reads = [];
  const env = {
    BACKUPS: {get: async (key) => {reads.push(key); return null;}},
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AbCdEfGhIjKlMnOpQrStUvWxYz_12345/exec',
    GOOGLE_APPS_SCRIPT_HMAC_SECRET: 'x'.repeat(48),
  };
  const result = await sendDailyEmail(env, async () => {throw Error('unexpected email send');});
  assert.deepEqual(result, {sent:false, reason:'no uploaded backup'});
  assert.deepEqual(reads, ['meta/latest.json']);
});

test('missing mail config cannot send', async () => {
  const result = await sendDailyEmail({BACKUPS:{get:async()=>null}});
  assert.deepEqual(result,{sent:false,reason:'gmail not configured'});
});

test('public root remains unauthorized', async () => {
  const response = await worker.fetch(new Request('https://example.workers.dev/'), {BACKUP_TOKEN_SHA256:'f'.repeat(64)});
  assert.equal(response.status,401);
  assert.deepEqual(await response.json(),{error:'Unauthorized'});
});

test('status and download reject unauthenticated requests', async () => {
  for(const path of ['/v1/status','/v1/download?key=backups/2026-10-22/example.json']){
    const response = await worker.fetch(new Request('https://example.workers.dev'+path),{BACKUP_TOKEN_SHA256:'f'.repeat(64)});
    assert.equal(response.status,401);
  }
});

test('malformed backup envelope cannot pass validation', () => {
  assert.equal(validEnvelope({format:'gloria-encrypted-v1',version:1}),false);
});
