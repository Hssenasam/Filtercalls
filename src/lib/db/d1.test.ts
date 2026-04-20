import test from 'node:test';
import assert from 'node:assert/strict';
import { getD1 } from './d1.ts';

const createDb = () => ({
  prepare: () => ({
    bind: () => ({
      async first() {
        return null;
      },
      async all() {
        return { results: [] };
      },
      async run() {
        return {};
      }
    })
  })
});

test('getD1 resolves DB from global env container when direct global binding is absent', () => {
  const globalRef = globalThis as unknown as { DB?: unknown; env?: { DB?: unknown } };
  const previousGlobal = globalRef.DB;
  const previousEnvContainer = globalRef.env;
  const db = createDb();

  delete globalRef.DB;
  globalRef.env = { DB: db };

  assert.equal(getD1(), db);

  if (previousGlobal === undefined) delete globalRef.DB;
  else globalRef.DB = previousGlobal;
  if (previousEnvContainer === undefined) delete globalRef.env;
  else globalRef.env = previousEnvContainer;
});

test('getD1 resolves DB from runtime env container binding', () => {
  const globalRef = globalThis as unknown as { __env__?: { DB?: unknown } };
  const previousEnvContainer = globalRef.__env__;
  const previousProcessEnv = process.env.DB;
  const db = createDb();

  delete process.env.DB;
  globalRef.__env__ = { DB: db };

  assert.equal(getD1(), db);

  if (previousEnvContainer === undefined) delete globalRef.__env__;
  else globalRef.__env__ = previousEnvContainer;
  if (previousProcessEnv === undefined) delete process.env.DB;
  else process.env.DB = previousProcessEnv;
});
