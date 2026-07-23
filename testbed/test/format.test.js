import test from 'node:test';
import assert from 'node:assert';
import { formatDuration } from '../src/format.js';

test('formats seconds', () => {
  assert.equal(formatDuration(5000), '5s');
});

test('formats minutes and seconds', () => {
  assert.equal(formatDuration(125000), '2m 5s');
});

test('formats hours, minutes, seconds', () => {
  assert.equal(formatDuration(3725000), '1h 2m 5s');
});

test('omits zero units in the middle', () => {
  assert.equal(formatDuration(3605000), '1h 5s');
});

test('sub-second durations round down to 0s', () => {
  assert.equal(formatDuration(400), '0s');
});

test('throws on negative input', () => {
  assert.throws(() => formatDuration(-1), /negative/i);
});
