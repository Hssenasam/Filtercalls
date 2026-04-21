const commonPasswords = new Set([
  '123456','password','123456789','12345678','12345','111111','1234567','sunshine','qwerty','iloveyou','princess','admin','welcome','666666','abc123','football','123123','monkey','654321','!@#$%^&*','charlie','aa123456','donald','password1','qwerty123','letmein','whatever','dragon','baseball','trustno1','superman','hello','freedom','master','michael','login','starwars','passw0rd','zaq1zaq1','qazwsx','solo','1q2w3e4r','ashley','mustang','121212','bailey','shadow','access','flower','hottie','loveme','696969','cheese','computer','nicole','jessica','pepper','hunter','buster','jordan','harley','ranger','cookie','ginger','summer','tigger','maggie','corvette','jennifer','thomas','killer','george','amanda','wizard','joshua','matthew','michelle','daniel','andrew','joshua1','secret','asdfgh','pokemon','mynoob','soccer','killer1','hello123','whatever1','test1234','internet','service','qwertyuiop','11111111','987654321','1qaz2wsx','pass1234','admin123','welcome1','monkey1','football1','changeme','temporary','newpassword'
]);

import { secureEquals } from './api-key.ts';
const b64url = (bytes: Uint8Array) => {
  let str = '';
  bytes.forEach((b) => {
    str += String.fromCharCode(b);
  });
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const fromB64url = (text: string) => {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=');
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (c) => c.charCodeAt(0));
};

const utf8 = (v: string) => new TextEncoder().encode(v);
const concatBytes = (a: Uint8Array, b: Uint8Array) => {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
};

const iterativeSha256 = async (password: string, salt: Uint8Array, iterations: number) => {
  let current = concatBytes(utf8(password), salt);
  for (let i = 0; i < iterations; i += 1) {
    current = new Uint8Array(await crypto.subtle.digest('SHA-256', current));
  }
  return current;
};

export const validatePasswordPolicy = (password: string) => {
  if (password.length < 10) return 'Password must be at least 10 characters long';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain at least one letter and one digit';
  if (commonPasswords.has(password.toLowerCase())) return 'Password is too common';
  return null;
};

export const hashPassword = async (password: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  try {
    const baseKey = await crypto.subtle.importKey('raw', utf8(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' }, baseKey, 256);
    return `pbkdf2$210000$${b64url(salt)}$${b64url(new Uint8Array(bits))}`;
  } catch {
    const iterations = 120000;
    const raw = await iterativeSha256(password, salt, iterations);
    return `sha256i$${iterations}$${b64url(salt)}$${b64url(raw)}`;
  }
};

export const verifyPassword = async (password: string, passwordHash: string) => {
  const [algorithm, iterationsRaw, saltRaw, hashRaw] = passwordHash.split('$');
  if (!['pbkdf2', 'sha256i'].includes(algorithm)) return false;
  const iterations = Number(iterationsRaw);
  if (!iterations || !saltRaw || !hashRaw) return false;
  const salt = fromB64url(saltRaw);

  if (algorithm === 'sha256i') {
    const raw = await iterativeSha256(password, salt, iterations);
    return secureEquals(b64url(raw), hashRaw);
  }

  try {
    const baseKey = await crypto.subtle.importKey('raw', utf8(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, baseKey, 256);
    return secureEquals(b64url(new Uint8Array(bits)), hashRaw);
  } catch {
    const raw = await iterativeSha256(password, salt, iterations);
    return secureEquals(b64url(raw), hashRaw);
  }
};
