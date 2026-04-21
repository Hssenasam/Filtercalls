import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, validatePasswordPolicy, verifyPassword } from './password.ts';

test('password policy enforces length and complexity', () => {
  assert.equal(validatePasswordPolicy('short1'), 'Password must be at least 10 characters long');
  assert.equal(validatePasswordPolicy('longpassword'), 'Password must contain at least one letter and one digit');
  assert.equal(validatePasswordPolicy('CorrectHorse9!'), null);
});

test('password hash/verify via pbkdf2', async () => {
  const hash = await hashPassword('CorrectHorse9!');
  assert.equal(await verifyPassword('CorrectHorse9!', hash), true);
  assert.equal(await verifyPassword('WrongHorse9!', hash), false);
});
