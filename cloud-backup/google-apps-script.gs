/**
 * Gloria encrypted backup mail bridge.
 * Create a standalone Google Apps Script under the *owner's* Google account:
 * https://script.google.com/ . Deploy as Web app:
 *   Execute as: Me; Access: Anyone (required for Worker-to-Worker calls).
 *
 * SECURITY: Even though deployment URL is public, a request is rejected unless
 * HMAC-SHA256 authenticates its timestamp, ciphertext and digest using a secret
 * stored ONLY in Script Properties. Fixed recipient. No raw answers are sent:
 * attachment is the device-encrypted JSON envelope.
 *
 * Never paste secrets into this code or into the public GitHub repository.
 */
const GLORIA_RECIPIENT = 'glo.journal@gmail.com';
const GLORIA_WINDOW_MS = 5 * 60 * 1000;
const GLORIA_MAX_B64_CHARS = 6 * 1024 * 1024;

function gloriaHex_(array) {
  return array.map(function (n) {
    return ('0' + ((n + 256) % 256).toString(16)).slice(-2);
  }).join('');
}
function gloriaEqual_(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; ++i) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
function gloriaText_(result) {
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  try {
    const config = PropertiesService.getScriptProperties();
    const secret = config.getProperty('GLORIA_BACKUP_HMAC_SECRET');
    if (!secret || secret.length < 40) return gloriaText_({ok:false,error:'not-configured'});
    if (!e || !e.postData || String(e.postData.contents || '').length > GLORIA_MAX_B64_CHARS + 2048)
      return gloriaText_({ok:false,error:'invalid-request'});
    const req = JSON.parse(e.postData.contents);
    const time = Number(req.ts);
    if (!Number.isSafeInteger(time) || Math.abs(Date.now() - time) > GLORIA_WINDOW_MS)
      return gloriaText_({ok:false,error:'expired'});
    if (!/^[0-9a-f]{64}$/.test(req.digest || '') ||
        !/^[A-Za-z0-9+/=]+$/.test(req.attachment || '') ||
        req.attachment.length > GLORIA_MAX_B64_CHARS ||
        !/^[0-9a-f]{64}$/.test(req.signature || ''))
      return gloriaText_({ok:false,error:'invalid-format'});
    const signed = String(req.ts) + '\n' + req.digest + '\n' + req.attachment;
    const expected = gloriaHex_(Utilities.computeHmacSha256Signature(signed, secret));
    if (!gloriaEqual_(req.signature, expected))
      return gloriaText_({ok:false,error:'unauthorized'});
    // Parsed attachment must be a Gloria ENCRYPTED envelope, never plaintext.
    const json = Utilities.newBlob(Utilities.base64Decode(req.attachment)).getDataAsString('UTF-8');
    const envelope = JSON.parse(json);
    if (envelope.format !== 'gloria-encrypted-v1' || envelope.version !== 1 ||
        !/^[0-9a-f]{64}$/.test(envelope.contentSha256 || '') ||
        envelope.contentSha256 !== req.digest ||
        typeof envelope.ciphertext !== 'string' || envelope.ciphertext.length < 24)
      return gloriaText_({ok:false,error:'invalid-backup'});
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) return gloriaText_({ok:false,error:'busy'});
    try {
      const last = config.getProperty('GLORIA_LAST_EMAILED_DIGEST');
      if (last === req.digest) return gloriaText_({ok:true,digest:req.digest,duplicate:true});
      // Send ONLY an encrypted JSON attachment, no recovery key.
      const file = Utilities.newBlob(json, 'application/json',
        'gloria-encrypted-' + req.digest.slice(0,16) + '.json');
      MailApp.sendEmail({
        to: GLORIA_RECIPIENT,
        subject: 'Gloria encrypted study backup · ' + req.digest.slice(0,12),
        body: 'A new encrypted Gloria progress backup is attached. Store its recovery key separately. Backup SHA-256: ' + req.digest +
          '. Confirm this attachment is in Gmail before relying on email for recovery.',
        attachments: [file],
        name: 'Gloria Backup'
      });
      // Best-effort dedupe; a failure after Gmail submission can cause a retry.
      config.setProperty('GLORIA_LAST_EMAILED_DIGEST', req.digest);
      return gloriaText_({ok:true,digest:req.digest});
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    // Avoid exposing sensitive payloads or stack traces to unauthenticated callers.
    console.error('Gloria mail bridge failure category', String(err && err.name || 'Error'));
    return gloriaText_({ok:false,error:'delivery-failed'});
  }
}
