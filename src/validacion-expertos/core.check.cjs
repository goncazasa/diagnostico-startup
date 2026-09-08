const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createModel, createRepository } = require('./core.js');

const instrument = {
  version: '2.1.0',
  dimensions: [{ id: 'D1', name: 'Equipo' }, { id: 'D2', name: 'Mercado' }],
  items: [{ id: 'T1', dim: 'D1' }, { id: 'T2', dim: 'D1' }, { id: 'PM1', dim: 'D2' }]
};
const model = createModel(instrument);
const fresh = () => { const s = model.createState('response-test-01', '2026-09-04T10:00:00.000Z'); s.profile.email = 'experto@example.org'; return s; };
function memory() {
  const values = new Map();
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
}

test('an untouched response reports pending, never complete', () => {
  assert.deepEqual(model.summary(fresh()), { complete: 0, partial: 0, skipped: 0, pending: 5, total: 5, resolved: 0 });
});
test('relevance completes a record while usability remains optional', () => {
  const state = fresh();
  state.items.T1.relevance = 4;
  assert.equal(model.status(state, 'T1'), 'complete');
  state.items.T1.usability = 3;
  assert.equal(model.status(state, 'T1'), 'complete');
});
test('omitting every dimension reports omissions, not answered items', () => {
  const state = fresh();
  state.dimensions.D1.skipReason = 'experience';
  state.dimensions.D2.skipReason = 'experience';
  assert.deepEqual(model.summary(state), { complete: 0, partial: 0, skipped: 5, pending: 0, total: 5, resolved: 5 });
});
test('export suppresses stale scores beneath an omitted dimension without erasing the local draft', () => {
  const state = fresh();
  state.consent = true;
  state.items.T1.relevance = 4;
  state.items.T1.usability = 4;
  state.dimensions.D1.skipReason = 'experience';
  const payload = model.exportPayload(state, '2026-09-04T11:00:00.000Z');
  assert.equal(payload.response.items.T1.relevance, null);
  assert.equal(payload.response.items.T1.usability, null);
  assert.equal(payload.response.items.T1.skipReason, 'dimension');
  assert.equal(state.items.T1.relevance, 4);
});
test('editing after download invalidates the current export', () => {
  const state = fresh();
  state.consent = true;
  const downloaded = model.markExport(state);
  assert.equal(model.hasCurrentExport(downloaded), true);
  const edited = model.edit(downloaded, ['items', 'T1', 'comment'], 'Nueva evidencia');
  assert.equal(model.hasCurrentExport(edited), false);
  assert.equal(edited.items.T1.comment, 'Nueva evidencia');
});
test('editing persists immediately and survives a reload without navigation', () => {
  const repository = createRepository(memory(), 'test');
  const edited = model.edit(fresh(), ['items', 'T1', 'comment'], 'Texto sin salir de la página');
  assert.equal(repository.save(edited).ok, true);
  const restored = model.validateState(repository.load().value);
  assert.equal(restored.items.T1.comment, 'Texto sin salir de la página');
});
test('storage failure is observable rather than reported as saved', () => {
  const repository = createRepository({ setItem() { throw new Error('quota'); }, getItem() { throw new Error('denied'); } }, 'test');
  assert.equal(repository.save(fresh()).ok, false);
  assert.equal(repository.load().ok, false);
});
test('corrupt storage cannot silently become a successful restoration', () => {
  const repository = createRepository({ getItem: () => '{oops', setItem() {} }, 'test');
  assert.equal(repository.load().ok, false);
});
test('export and import preserve response identity, unicode, comments and ratings', () => {
  const state = fresh();
  state.consent = true;
  state.items.T1.comment = 'Revisión: <script> & "caja" — financiación';
  state.items.T1.relevance = 3;
  const restored = model.importPayload(model.exportPayload(state));
  assert.equal(restored.responseId, 'response-test-01');
  assert.equal(restored.items.T1.relevance, 3);
  assert.equal(restored.items.T1.comment, state.items.T1.comment);
});
test('invalid scales, schema, missing records and excessive text are rejected on import', () => {
  for (const mutate of [s => { s.items.T1.relevance = 7; }, s => { s.schemaVersion = '1.4'; }, s => { delete s.items.T1; }, s => { s.profile.sectors = 'x'.repeat(6001); }, s => { s.profile.years = '-1'; }]) {
    const state = fresh(); mutate(state);
    assert.throws(() => model.validateState(state));
  }
});
test('prototype keys and unknown edit paths cannot modify state', () => {
  assert.throws(() => model.edit(fresh(), ['__proto__', 'polluted'], true));
  assert.throws(() => model.edit(fresh(), ['items', 'missing', 'relevance'], 4));
});
test('instrument cannot be visited without consent and the initial view cannot be rewritten after sealing', () => {
  let state = fresh();
  assert.equal(model.canVisit(state, 3), false);
  state.consent = true;
  assert.equal(model.canVisit(state, 1), true);
  assert.equal(model.canVisit(state, 3), false);
  state = model.edit(state, ['initial', 'text'], 'Clientes y ejecución');
  state = model.sealInitial(state);
  assert.equal(model.canVisit(state, 3), true);
  assert.throws(() => model.edit(state, ['initial', 'text'], 'Una idea posterior'));
  state.consent = false;
  assert.equal(model.canVisit(state, 3), false);
});
test('export needs consent, but deliberately permits incomplete questionnaires', () => {
  assert.throws(() => model.exportPayload(fresh()));
  const state = fresh(); state.consent = true;
  const payload = model.exportPayload(state);
  assert.equal(payload.summary.pending, 5);
  assert.equal(payload.response.items.T1.relevance, null);
});

test('V1.6 does not relabel a V1.5 response as if it had assessed the revised anchors', () => {
  const current = createModel(require('./instrument.js'));
  const previous = current.createState('previous-response');
  previous.schemaVersion = 'expert-validation/1.5';
  previous.instrumentVersion = '1.5.0';
  assert.throws(() => current.validateState(previous), /versión/);
});
