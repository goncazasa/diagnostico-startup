const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const script = path.join(__dirname, 'check-documentation.mjs');
const check = files => spawnSync(process.execPath, [script, '--files', files.join(',')], { encoding: 'utf8' });

test('allows an implementation change when its commit also updates documentation', () => {
  const result = check(['src/validacion-expertos/app.js', 'CHANGELOG.md']);
  assert.equal(result.status, 0, result.stderr);
});

test('rejects an implementation-only commit before it can be created', () => {
  const result = check(['api/submit.mjs']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /documentaci/i);
});

test('allows a documentation-only commit', () => {
  const result = check(['docs/ARQUITECTURA-Y-OPERACION.md']);
  assert.equal(result.status, 0, result.stderr);
});
