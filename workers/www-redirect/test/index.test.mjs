import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRedirectUrl,
  handleRequest,
  redirectStatus,
} from '../src/index.mjs';

test('buildRedirectUrl pins the apex host and preserves path and query', () => {
  assert.equal(
    buildRedirectUrl('https://www.worldcupmusicatlas.com/timeline/?team=Japan&year=2026'),
    'https://worldcupmusicatlas.com/timeline/?team=Japan&year=2026',
  );
  assert.equal(
    buildRedirectUrl('https://www.worldcupmusicatlas.com/'),
    'https://worldcupmusicatlas.com/',
  );
  assert.equal(
    buildRedirectUrl('https://www.worldcupmusicatlas.com//example.com/trick?x=1'),
    'https://worldcupmusicatlas.com//example.com/trick?x=1',
  );
});

test('GET and HEAD use 301 while state-changing methods preserve method with 308', () => {
  assert.equal(redirectStatus('GET'), 301);
  assert.equal(redirectStatus('HEAD'), 301);
  assert.equal(redirectStatus('POST'), 308);
});

test('handleRequest returns an empty permanent redirect response', async () => {
  const response = handleRequest(
    new Request('https://www.worldcupmusicatlas.com/api/comments?song=1', {
      method: 'POST',
    }),
  );

  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get('location'),
    'https://worldcupmusicatlas.com/api/comments?song=1',
  );
  assert.equal(await response.text(), '');
});
