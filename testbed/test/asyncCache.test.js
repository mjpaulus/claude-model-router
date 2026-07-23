import test from 'node:test';
import assert from 'node:assert';
import { setTimeout as sleep } from 'node:timers/promises';
import { createCache } from '../src/asyncCache.js';

test('dedupes concurrent calls for the same key', async () => {
  let calls = 0;
  const cache = createCache(async (k) => { calls++; return k.toUpperCase(); }, 1000);
  const [a, b] = await Promise.all([cache.get('x'), cache.get('x')]);
  assert.equal(a, 'X');
  assert.equal(b, 'X');
  assert.equal(calls, 1);
});

test('entries expire after ttl and are refetched', async () => {
  let calls = 0;
  const cache = createCache(async () => ++calls, 20);
  assert.equal(await cache.get('k'), 1);
  await sleep(40);
  assert.equal(await cache.get('k'), 2, 'expected refetch after ttl elapsed');
});

test('a rejected fetch is not cached — next get retries', async () => {
  let calls = 0;
  const cache = createCache(async () => {
    calls++;
    if (calls === 1) throw new Error('network down');
    return 'recovered';
  }, 1000);

  await assert.rejects(() => cache.get('k'), /network down/);
  assert.equal(await cache.get('k'), 'recovered', 'expected retry after rejection');
});
