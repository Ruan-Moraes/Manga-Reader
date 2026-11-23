import { constants, createCipheriv, createDecipheriv, generateKeyPairSync, privateDecrypt, publicEncrypt, randomBytes } from 'node:crypto';
import { lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const aad = Buffer.from('toonlira-test-settings-v1', 'utf8');
const maxPlain = 32768;
function regular(path, privateFile = false) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || (privateFile && (stat.mode & 0o777) !== 0o600)) throw Error('Invalid input file');
  return readFileSync(path);
}
function decode(text, max) {
  if (typeof text !== 'string' || text.length > max * 2 || !/^[A-Za-z0-9+/]*={0,2}$/.test(text)) throw Error('Invalid encoding');
  const result = Buffer.from(text, 'base64');
  if (!result.length || result.length > max || result.toString('base64') !== text) throw Error('Invalid encoding');
  return result;
}
export function generateKeys() {
  return generateKeyPairSync('rsa', { modulusLength: 3072, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
}
export function sealSettings(plaintext, publicKey) {
  if (!Buffer.isBuffer(plaintext) || !plaintext.length || plaintext.length > maxPlain) throw Error('Invalid settings');
  const key = randomBytes(32); const iv = randomBytes(12);
  try {
    const cipher = createCipheriv('aes-256-gcm', key, iv); cipher.setAAD(aad);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const wrapped = publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, key);
    return JSON.stringify({ version: 1, key: wrapped.toString('base64'), iv: iv.toString('base64'), ciphertext: ciphertext.toString('base64'), tag: cipher.getAuthTag().toString('base64') });
  } finally { key.fill(0); }
}
export function openSettings(envelope, privateKey) {
  if (typeof envelope !== 'string' || envelope.length > 65536) throw Error('Invalid envelope');
  const value = JSON.parse(envelope);
  if (!value || value.version !== 1 || Object.keys(value).sort().join(',') !== 'ciphertext,iv,key,tag,version') throw Error('Invalid envelope');
  const wrapped = decode(value.key, 512); const iv = decode(value.iv, 12); const tag = decode(value.tag, 16); const ciphertext = decode(value.ciphertext, maxPlain);
  if (iv.length !== 12 || tag.length !== 16 || wrapped.length !== 384) throw Error('Invalid envelope');
  const key = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, wrapped);
  try {
    if (key.length !== 32) throw Error('Invalid key');
    const cipher = createDecipheriv('aes-256-gcm', key, iv); cipher.setAAD(aad); cipher.setAuthTag(tag);
    return Buffer.concat([cipher.update(ciphertext), cipher.final()]);
  } finally { key.fill(0); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.umask(0o077);
    const [mode, first, second, third] = process.argv.slice(2);
    if (mode === 'generate' && first && second && !third) {
      const pair = generateKeys();
      writeFileSync(first, pair.privateKey, { flag: 'wx', mode: 0o600 });
      writeFileSync(second, pair.publicKey, { flag: 'wx', mode: 0o600 });
    } else if (mode === 'seal' && first && second && third) {
      const plain = regular(second, true);
      try { writeFileSync(third, sealSettings(plain, regular(first)), { flag: 'wx', mode: 0o600 }); }
      finally { plain.fill(0); }
    } else if (mode === 'open' && first && second && third) {
      const plain = openSettings(regular(second).toString('utf8'), regular(first, true));
      try { writeFileSync(third, plain, { flag: 'wx', mode: 0o600 }); }
      finally { plain.fill(0); }
    } else throw Error('Invalid arguments');
    process.stdout.write('settings-operation-complete\n');
  } catch {
    process.stderr.write('settings-operation-failed\n');
    process.exitCode = 1;
  }
}
