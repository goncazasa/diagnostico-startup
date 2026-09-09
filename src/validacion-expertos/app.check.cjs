const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let jsdomPath = process.env.VALIDATION_JSDOM;
if (!jsdomPath) { try { jsdomPath = require.resolve('jsdom'); } catch { jsdomPath = path.join(process.env.TEMP || '', 'codex-expert-validation-qa/node_modules/jsdom'); } }
const { JSDOM } = require(jsdomPath);
const root = __dirname;
function boot(saved, denyStorage = false) {
  const html = process.env.VALIDATION_USE_BUILD !== '0' ? fs.readFileSync(path.resolve(root, '../..', 'public/index.html'), 'utf8') : fs.readFileSync(path.join(root, 'shell.html'), 'utf8')
    .replace('/*__INSTRUMENT__*/', () => fs.readFileSync(path.join(root, 'instrument.js'), 'utf8'))
    .replace('/*__CORE__*/', () => fs.readFileSync(path.join(root, 'core.js'), 'utf8'))
    .replace('/*__APP__*/', () => fs.readFileSync(path.join(root, 'app.js'), 'utf8'));
  const errors = [];
  const dom = new JSDOM(html, { url: 'https://validation.test/', runScripts: 'dangerously', beforeParse(window) {
    window.scrollTo = () => {};
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.confirm = () => true;
    window.URL.createObjectURL = blob => { window.downloadBlob = blob; return 'blob:test'; };
    window.URL.revokeObjectURL = () => {};
    window.HTMLAnchorElement.prototype.click = function () {};
    if (saved) window.localStorage.setItem('startup-expert-validation-v2.2', saved);
    if (denyStorage) Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
    window.addEventListener('error', e => errors.push(e.message));
  } });
  assert.deepEqual(errors, [], 'The standalone page must initialize without runtime errors');
  const document = dom.window.document;
  return { dom, document, input(selector, value) {
    const node = document.querySelector(selector);
    assert.ok(node, 'Control exists: ' + selector);
    if (node.type === 'checkbox' || node.type === 'radio') node.checked = value;
    else node.value = value;
    node.dispatchEvent(new dom.window.Event(node.tagName === 'SELECT' || ['checkbox', 'radio'].includes(node.type) ? 'change' : 'input', { bubbles: true }));
  }, click(selector) { const node = document.querySelector(selector); assert.ok(node, selector); node.click(); }, stored() { return JSON.parse(dom.window.localStorage.getItem('startup-expert-validation-v2.2')); } };
}
function start(ui) {
  ui.input('[data-path="consent"]', true);
  ui.click('[data-action="next"]');
  ui.input('[data-path="profile.email"]', 'experto@example.org');
  ui.input('[data-path="initial.text"]', 'Clientes y ejecución');
  ui.click('[data-action="next"]');
  ui.click('[data-action="next"]');
}
function completeRelevance(ui) {
  for (let step=3;step<=8;step++) {
    ui.click('[data-step="'+step+'"]');
    for(const control of [...ui.document.querySelectorAll('#app input[data-path$=".relevance"][value="3"]')]) ui.input('#'+control.id,true);
  }
}
test('final page has one optional question and confirms only an acknowledged submission', async () => {
  const ui=boot(); start(ui); completeRelevance(ui); ui.click('[data-step="10"]');
  assert.equal(ui.document.querySelectorAll('#app textarea[data-path]').length,1);
  assert.equal(ui.document.querySelector('[data-delivery-email]'),null);
  let request;
  ui.dom.window.fetch=async (url, options) => { request={url,options}; return {ok:true,json:async()=>({ok:true,receiptId:'sheets-'+'a'.repeat(64)})}; };
  ui.input('[data-path="final.v9"]','Última observación');
  ui.click('[data-action="submit"]');
  await until(()=>!!ui.stored().submission);
  assert.equal(request.url,'/api/submit');
  assert.equal(JSON.parse(request.options.body).response.final.v9,'Última observación');
  assert.equal(ui.stored().submission.id,'sheets-'+'a'.repeat(64));
  assert.equal(ui.document.querySelector('[data-action="submit"]').disabled,true);
  ui.input('[data-path="final.v9"]','Corrección posterior');
  await new Promise(resolve=>setTimeout(resolve,550));
  assert.equal(ui.document.querySelector('[data-action="submit"]').disabled,false);
  ui.dom.window.close();
});
test('a failed submission retains answers and allows retry without a false receipt', async () => {
  const ui=boot(); start(ui); completeRelevance(ui); ui.click('[data-step="10"]');
  ui.dom.window.fetch=async()=>({ok:false,json:async()=>({ok:false})});
  ui.input('[data-path="final.v9"]','Conservar esta respuesta');
  ui.click('[data-action="submit"]');
  await until(()=>ui.document.querySelector('#submit-status').textContent.includes('No se ha podido'));
  assert.equal(ui.stored().final.v9,'Conservar esta respuesta');
  assert.equal(ui.stored().submission,null);
  assert.equal(ui.document.querySelector('[data-action="submit"]').disabled,false);
  ui.dom.window.close();
});
test('welcome hides navigation tools and the profile requests an email with optional name', () => {
  const ui = boot();
  assert.equal(ui.document.querySelector('.sidebar').hidden, true);
  ui.input('[data-path="consent"]', true); ui.click('[data-action="next"]');
  const email = ui.document.querySelector('[data-path="profile.email"]');
  assert.ok(email);
  assert.equal(email.type, 'email');
  assert.equal(email.required, true);
  assert.equal(ui.document.querySelector('[data-path="profile.name"]').required, false);
  ui.click('[data-action="next"]');
  assert.equal(ui.document.querySelector('#item-T1'), null);
  ui.input('[data-path="profile.email"]', 'experto@example.org');
  ui.click('[data-action="next"]');
  assert.equal(ui.stored().step, 2, 'Instructions precede the first dimension');
  assert.equal(ui.document.querySelector('#item-T1'), null);
  ui.click('[data-action="next"]');
  assert.ok(ui.document.querySelector('#item-T1'));
  ui.dom.window.close();
});

test('other phase can be entered immediately and survives navigation without losing pending profile text', async () => {
  const ui = boot();
  ui.input('[data-path="consent"]', true); ui.click('[data-action="next"]');
  ui.input('[data-path="profile.email"]', 'experto@example.org');
  ui.input('[data-path="profile.name"]', 'Nombre pendiente');
  ui.input('[data-path="profile.phases"][value="Otra"]', true);
  const other = ui.document.querySelector('[data-path="profile.phasesOther"]');
  assert.ok(other, 'Selecting Otra reveals its input without a reload');
  assert.equal(other.closest('[hidden]'), null);
  ui.input('[data-path="profile.phasesOther"]', 'Consolidación');
  ui.click('[data-action="next"]'); ui.click('[data-action="back"]');
  assert.equal(ui.document.querySelector('[data-path="profile.name"]').value, 'Nombre pendiente');
  assert.equal(ui.document.querySelector('[data-path="profile.phasesOther"]').value, 'Consolidación');
  ui.input('[data-path="profile.phases"][value="Otra"]', false);
  assert.ok(ui.document.querySelector('[data-path="profile.phasesOther"]').closest('[hidden]'));
  ui.input('[data-path="profile.phases"][value="Otra"]', true);
  assert.equal(ui.document.querySelector('[data-path="profile.phasesOther"]').value, 'Consolidación');
  ui.dom.window.close();
});

test('questions use two ratings and one observations field, with no applicability dropdown', async () => {
  const ui = boot(); start(ui);
  const item = ui.document.querySelector('#item-T1');
  assert.equal(item.querySelectorAll('fieldset.rating-group').length, 2);
  assert.equal(item.querySelectorAll('textarea').length, 1);
  assert.equal(item.querySelector('.item-observation').open, false);
  assert.equal(item.querySelector('[data-path="items.T1.applicability"]'), null);
  ui.input('[data-path="items.T1.usability"][value="3"]', true);
  ui.input('[data-path="items.T1.comment"]', 'La pregunta es clara; cambiaría la segunda respuesta');
  ui.click('[data-step="10"]'); ui.click('[data-action="export"]');
  const payload = JSON.parse(await readBlob(ui, ui.dom.window.downloadBlob));
  assert.equal(payload.response.items.T1.usability, 3);
  assert.equal(payload.response.items.T1.clarity, undefined);
  assert.equal(payload.response.items.T1.anchors, undefined);
  assert.equal(payload.response.profile.email, 'experto@example.org');
  openBlock(ui, 'T1');
  assert.equal(ui.document.querySelector('#item-T1 .item-observation').open, true);
  ui.dom.window.close();
});
function openBlock(ui, id) {
  ui.click('[data-step="9"]');
  ui.click(id.startsWith('D') ? `[data-summary-dimension="${id}"] h2 button` : `[data-summary-item="${id}"] [data-action="jump"]`);
}
function readBlob(ui, blob) {
  return new Promise((resolve, reject) => { const reader = new ui.dom.window.FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsText(blob); });
}
async function until(predicate) {
  for (let i = 0; i < 40; i++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 10)); }
  assert.fail('Expected asynchronous file operation to finish');
}
test('typing is grouped into one saved edit and the latest text is restored', async () => {
  const ui = boot(); start(ui);
  const revision = ui.stored().revision;
  ui.input('[data-path="items.T1.comment"]', 'Sin cambiar');
  ui.input('[data-path="items.T1.comment"]', 'Sin cambiar de pantalla');
  assert.equal(ui.stored().revision, revision, 'Typing should wait for a short pause');
  await new Promise(resolve => setTimeout(resolve, 550));
  const saved = ui.stored();
  assert.equal(saved.revision, revision + 1);
  assert.equal(saved.items.T1.comment, 'Sin cambiar de pantalla');
  const restored = boot(JSON.stringify(saved));
  assert.equal(restored.document.querySelector('[data-path="items.T1.comment"]').value, 'Sin cambiar de pantalla');
  ui.dom.window.close(); restored.dom.window.close();
});

test('pending text is saved on pagehide and before a download without waiting', async () => {
  const ui = boot(); start(ui);
  ui.input('[data-path="items.T1.comment"]', 'Último carácter ñ');
  ui.dom.window.dispatchEvent(new ui.dom.window.Event('pagehide'));
  assert.equal(ui.stored().items.T1.comment, 'Último carácter ñ');
  ui.click('[data-step="10"]');
  ui.input('[data-path="final.v9"]', 'Observación de cierre');
  ui.click('[data-action="export"]');
  const payload = JSON.parse(await readBlob(ui, ui.dom.window.downloadBlob));
  assert.equal(payload.response.final.v9, 'Observación de cierre');
  ui.dom.window.close();
});

test('backup clipboard export contains pending answers', async () => {
  const ui = boot(); start(ui); ui.click('[data-step="10"]');
  let copied;
  Object.defineProperty(ui.dom.window.navigator, 'clipboard', { value: { writeText: async raw => { copied = raw; } } });
  ui.input('[data-path="final.v9"]', 'Observación copiada');
  ui.click('[data-action="copy"]');
  await until(() => !!copied);
  const payload = JSON.parse(copied);
  assert.equal(payload.response.final.v9, 'Observación copiada');
  assert.equal(payload.instrumentVersion, '2.2.0');
  assert.equal(ui.stored().exportedRevision, -1, 'Copy is not a download receipt');
  assert.equal(ui.document.querySelector('#export-receipt').hidden, true);
  ui.dom.window.close();
});

test('denied clipboard leaves a selectable, safe copy and no false receipt', async () => {
  const ui = boot(); start(ui); ui.click('[data-step="10"]');
  Object.defineProperty(ui.dom.window.navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Denied'); } } });
  ui.input('[data-path="final.v9"]', '</textarea><img src=x>');
  ui.click('[data-action="copy"]');
  await until(() => !!ui.document.querySelector('#manual-copy'));
  const textarea = ui.document.querySelector('#manual-copy');
  assert.equal(JSON.parse(textarea.value).response.final.v9, '</textarea><img src=x>');
  assert.equal(textarea.readOnly, true);
  assert.equal(ui.document.querySelector('#app img'), null);
  assert.equal(ui.document.querySelector('#export-receipt').hidden, true);
  ui.dom.window.close();
});

test('summary feedback survives navigation and stays out of the final questions', () => {
  const ui = boot(); start(ui); ui.click('[data-step="9"]');
  ui.input('[data-path="final.v2"]', 'No eliminaría ninguna');
  ui.input('[data-path="final.v3"]', 'Falta comprobar la entrega de la solución');
  ui.click('[data-action="next"]');
  assert.equal(ui.stored().final.v2, 'No eliminaría ninguna');
  assert.equal(ui.stored().final.v3, 'Falta comprobar la entrega de la solución');
  assert.equal(ui.document.querySelector('[data-path="final.v3"]'), null);
  ui.click('[data-action="back"]');
  assert.equal(ui.document.querySelector('[data-path="final.v2"]').value, 'No eliminaría ninguna');
  ui.dom.window.close();
});
test('the UI does not expose the instrument before the initial view has been sealed', () => {
  const ui = boot();
  assert.equal(ui.document.querySelector('[data-action="next"]').disabled, true);
  ui.input('[data-path="consent"]', true); ui.click('[data-action="next"]');
  assert.equal(ui.document.querySelector('[data-step="3"]').disabled, true);
  ui.input('[data-path="profile.email"]', 'experto@example.org'); ui.input('[data-path="initial.text"]', 'Mi mirada inicial'); ui.click('[data-action="next"]');
  ui.click('[data-step="1"]');
  assert.equal(ui.document.querySelector('[data-path="initial.text"]').disabled, true);
  ui.dom.window.close();
});
test('omission hides scoring controls and the review separately counts skipped blocks', () => {
  const ui = boot(); start(ui);
  ui.input('input[data-path="items.T1.relevance"][value="4"]', true);
  ui.input('[data-path="dimensions.D1.skipReason"]', 'experience');
  assert.equal(ui.document.querySelector('[data-dimension-content="D1"]').hidden, true);
  ui.click('[data-step="10"]');
  assert.equal(ui.document.querySelector('[data-count="skipped"]').textContent, '6');
  assert.equal(ui.document.querySelector('[data-count="complete"]').textContent, '0');
  ui.dom.window.close();
});
test('visible error replaces the save promise when browser storage is unavailable', () => {
  const ui = boot(undefined, true);
  ui.input('[data-path="consent"]', true);
  assert.equal(ui.document.querySelector('#save-state').classList.contains('error'), true);
  ui.dom.window.close();
});
test('export is marked only after a download request and an edit invalidates it', () => {
  const ui = boot(); start(ui); ui.click('[data-step="10"]');
  assert.equal(ui.document.querySelector('#export-receipt').hidden, true);
  ui.click('[data-action="export"]');
  assert.equal(ui.document.querySelector('#export-receipt').hidden, false);
  assert.equal(ui.stored().exportedRevision, ui.stored().revision);
  ui.click('[data-step="3"]');
  ui.input('[data-path="items.T1.comment"]', 'Cambio posterior');
  ui.click('[data-step="10"]');
  assert.equal(ui.document.querySelector('#export-receipt').hidden, true);
  assert.ok(ui.stored().revision > ui.stored().exportedRevision);
  ui.dom.window.close();
});
test('downloading preserves keyboard focus on the export button', () => {
  const ui = boot(); start(ui); ui.click('[data-step="10"]');
  const button = ui.document.querySelector('[data-action="export"]');
  button.focus(); button.click();
  assert.equal(ui.document.activeElement, button);
  ui.dom.window.close();
});
test('a full review resolves all 27 blocks when their relevance is answered', () => {
  const ui = boot(); start(ui);
  const blocks = ['T1','T2','T4','T5','T6','D1','PM1','PM2','PM3','PM4','D2','VB1','VB2','VB3','D3','C1','C2','D4','F1','F2','F3','F4','D5','SA1','SA2','D6'];
  for (const block of blocks) {
    openBlock(ui, block);
    for (const radio of [...ui.document.querySelectorAll('input[type="radio"][value="3"]')]) {
      ui.input('input[data-path="' + radio.dataset.path + '"][value="3"]', true);
    }
  }
  ui.click('[data-step="10"]');
  assert.equal(ui.document.querySelector('[data-count="complete"]').textContent, '27');
  assert.equal(ui.document.querySelector('[data-count="pending"]').textContent, '0');
  assert.equal(ui.document.querySelector('[data-count="partial"]').textContent, '0');
  assert.equal(ui.document.querySelector('[data-count="skipped"]').textContent, '0');
  ui.dom.window.close();
});
test('a competing tab cannot be silently overwritten', () => {
  const ui = boot(); start(ui);
  const before = JSON.stringify(ui.stored());
  ui.dom.window.dispatchEvent(new ui.dom.window.StorageEvent('storage', { key: 'startup-expert-validation-v2.2', newValue: '{"other":"response"}' }));
  ui.input('[data-path="items.T1.comment"]', 'Mi copia local');
  assert.equal(JSON.stringify(ui.stored()), before);
  assert.equal(ui.document.querySelector('#save-state').classList.contains('error'), true);
  assert.equal(ui.document.querySelector('[data-path="items.T1.comment"]').value, 'Mi copia local');
  ui.dom.window.close();
});
test('canceling a new response preserves the existing draft', () => {
  const ui = boot(); start(ui);
  const previous = ui.stored().responseId;
  ui.dom.window.confirm = () => false;
  ui.click('#reset-button');
  assert.equal(ui.stored().responseId, previous);
  ui.dom.window.close();
});
test('the downloaded JSON contains normalized answers and restores through the real file input', async () => {
  const ui = boot(); start(ui);
  ui.input('input[data-path="items.T1.relevance"][value="4"]', true);
  ui.input('[data-path="items.T1.comment"]', 'Acentos y texto: <img src=x>');
  ui.input('[data-path="items.T1.skipReason"]', 'prefer');
  ui.click('[data-step="10"]'); ui.click('[data-action="export"]');
  const raw = await readBlob(ui, ui.dom.window.downloadBlob);
  const payload = JSON.parse(raw);
  assert.equal(payload.response.items.T1.relevance, null);
  assert.equal(payload.response.items.T1.skipReason, 'prefer');
  assert.equal(payload.instrument.items.length, 21);
  const id = payload.response.responseId;
  ui.click('#reset-button');
  assert.notEqual(ui.stored().responseId, id);
  const input = ui.document.querySelector('#import-file');
  Object.defineProperty(input, 'files', { value: [new ui.dom.window.File([raw], 'respuestas.json', { type: 'application/json' })], configurable: true });
  input.dispatchEvent(new ui.dom.window.Event('change', { bubbles: true }));
  await until(() => ui.stored().responseId === id);
  assert.equal(ui.stored().items.T1.comment, 'Acentos y texto: <img src=x>');
  assert.equal(ui.document.querySelector('#app img'), null);
  ui.dom.window.close();
});
test('an incompatible import leaves the current response intact', async () => {
  const ui = boot(); start(ui);
  const before = JSON.stringify(ui.stored());
  const input = ui.document.querySelector('#import-file');
  Object.defineProperty(input, 'files', { value: [new ui.dom.window.File(['{"version":"V1.4-candidata","respuestas":{}}'], 'antigua.json')], configurable: true });
  input.dispatchEvent(new ui.dom.window.Event('change', { bubbles: true }));
  await until(() => !ui.document.querySelector('#message').hidden);
  assert.equal(JSON.stringify(ui.stored()), before);
  ui.dom.window.close();
});
test('free text is inert when restored and when included in the printable report', () => {
  const ui = boot(); start(ui);
  ui.input('[data-path="items.T1.comment"]', '<img src=x onerror="window.pwned=true">');
  ui.click('[data-step="10"]');
  ui.dom.window.print = () => {};
  ui.click('[data-action="print"]');
  assert.equal(ui.document.querySelector('#print-view img'), null);
  assert.equal(ui.dom.window.pwned, undefined);
  ui.dom.window.close();
});
test('all generated fields have labels and DOM ids remain unique on every page', () => {
  const ui = boot(); start(ui);
  for (const step of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    ui.click('[data-step="' + step + '"]');
    const ids = [...ui.document.querySelectorAll('[id]')].map(n => n.id);
    assert.equal(new Set(ids).size, ids.length, 'Unique ids at step ' + step);
    for (const control of ui.document.querySelectorAll('#app input, #app select, #app textarea')) {
      assert.ok(control.labels.length > 0, 'Accessible label for ' + control.outerHTML.slice(0, 120));
      if (control.type === 'radio') assert.ok(control.closest('fieldset')?.querySelector('legend'), 'Radio group has a legend');
    }
  }
  ui.dom.window.close();
});
test('summary precedes the final step and shows every question with the entered criterion values', () => {
  const ui = boot(); start(ui);
  ui.input('input[data-path="items.T1.relevance"][value="4"]', true);
  ui.input('input[data-path="items.T1.usability"][value="2"]', true);
  openBlock(ui, 'D1');
  ui.input('input[data-path="dimensions.D1.coverage"][value="3"]', true);
  openBlock(ui, 'D6'); ui.click('[data-action="next"]');
  assert.ok(ui.document.querySelector('#summary-map'));
  assert.equal(ui.document.querySelectorAll('[data-summary-dimension]').length, 6);
  assert.equal(ui.document.querySelectorAll('[data-summary-item]').length, 21);
  assert.equal(ui.document.querySelector('[data-summary-value="items.T1.relevance"]').textContent, '4');
  assert.equal(ui.document.querySelector('[data-summary-value="items.T1.usability"]').textContent, '2');
  assert.equal(ui.document.querySelector('[data-summary-value="items.T1.anchors"]'), null);
  assert.equal(ui.document.querySelector('[data-summary-value="dimensions.D1.coverage"]').textContent, '3');
  ui.click('[data-action="next"]');
  assert.ok(ui.document.querySelector('[data-path="final.v9"]'));
  assert.ok(ui.document.querySelector('[data-action="export"]'));
  ui.dom.window.close();
});
test('each dimension shows all its questions and continues to the next dimension', () => {
  const ui = boot(); start(ui);
  assert.equal(ui.document.querySelectorAll('#app article.item').length, 5);
  assert.ok(ui.document.querySelector('[data-path="dimensions.D1.coverage"]'));
  ui.input('[data-path="items.T5.comment"]', 'Observación al final de la dimensión');
  ui.click('[data-action="next"]');
  assert.equal(ui.document.querySelectorAll('#app article.item').length, 4);
  assert.ok(ui.document.querySelector('#item-PM1'));
  ui.click('[data-action="back"]');
  assert.equal(ui.document.querySelector('[data-path="items.T5.comment"]').value, 'Observación al final de la dimensión');
  ui.dom.window.close();
});

test('summary hides stale omitted scores and updates after a focused correction', () => {
  const ui = boot(); start(ui);
  ui.input('input[data-path="items.T1.relevance"][value="4"]', true);
  ui.input('[data-path="items.T1.skipReason"]', 'prefer');
  ui.click('[data-step="9"]');
  assert.equal(ui.document.querySelector('[data-summary-value="items.T1.relevance"]'), null);
  assert.match(ui.document.querySelector('[data-summary-item="T1"]').textContent, /Omitid/);
  ui.click('[data-summary-item="T2"] [data-action="jump"]');
  assert.equal(ui.document.activeElement.id, 'item-T2');
  ui.input('input[data-path="items.T2.relevance"][value="3"]', true);
  ui.click('[data-action="return-summary"]');
  assert.equal(ui.document.querySelector('[data-summary-value="items.T2.relevance"]').textContent, '3');
  ui.dom.window.close();
});

test('welcome explains the expert task, target population and scope without a time estimate',()=>{
 const ui=boot();const text=ui.document.querySelector('#app').textContent;
 assert.match(text,/Como experto/i);
 assert.match(text,/startups en fases iniciales/i);
 assert.match(ui.document.querySelector('#page-title').textContent,/^Diagnóstico de startups en fases iniciales$/);
 assert.equal(ui.document.querySelector('.brand').textContent,'Diagnóstico de startups en fases iniciales');
 assert.equal(ui.document.querySelector('.brand-sub'),null);
 assert.match(text,/Objetivo del diagnóstico/);
 assert.match(text,/riesgos o debilidades, fortalezas y oportunidades/);
 assert.match(text,/inversores, mentores e incubadoras/);
 assert.doesNotMatch(text,/Google Sheets|Vercel|Google Apps Script|contadores agregados|hoja de información/);
 assert.doesNotMatch(text,/20[–-]30|minutos/);
 assert.doesNotMatch(text,/Una omisión nunca cuenta como 0/);
 ui.input('[data-path="consent"]',true);ui.click('[data-action="next"]');
 assert.match(ui.document.querySelector('label[for="initial-text"]').textContent,/qué dimensiones evaluarías/i);
 ui.dom.window.close();
});
test('profile uses numeric experience, pivot wording and no conflict field',()=>{
 const ui=boot();ui.input('[data-path="consent"]',true);ui.click('[data-action="next"]');
 assert.equal(ui.document.querySelector('[data-path="profile.years"]').type,'number');
 assert.match(ui.document.querySelector('label[for="profile-pivot"]').textContent,/pivote/i);
 assert.equal(ui.document.querySelector('[data-path="profile.conflict"]'),null);
 ui.dom.window.close();
});
test('sidebar dimension names match their page titles and question numbers are sequential',()=>{
 const ui=boot();start(ui);const expected=['Equipo','Problema y mercado','Propuesta de valor y modelo de negocio','Evidencia comercial (tracción y go-to-market)','Evidencia financiera','Recursos estratégicos y legitimidad'];
 expected.forEach((title,index)=>{
  const step=index+3;ui.click(`[data-step="${step}"]`);
  assert.equal(ui.document.querySelector('#page-title').textContent,title);
  assert.equal(ui.document.querySelector(`[data-step="${step}"] > span:nth-child(2)`).textContent,`Dimensión ${index+1} · ${title}`);
  assert.deepEqual([...ui.document.querySelectorAll('.item-id')].map(node=>node.textContent),Array.from({length:ui.document.querySelectorAll('.item').length},(_,i)=>`Pregunta ${i+1}`));
 });
 ui.dom.window.close();
});
test('expert guide contains only the essential instructions',()=>{
 const ui=boot();ui.input('[data-path="consent"]',true);ui.click('[data-action="next"]');ui.input('[data-path="profile.email"]','expert@example.org');ui.click('[data-action="next"]');
 assert.equal(ui.document.querySelectorAll('.guide-steps > li').length,2);
 assert.equal(ui.document.querySelectorAll('.guide-sheet > h2').length,0);
 assert.equal(ui.document.querySelectorAll('.guide-sheet > details').length,0);
 assert.equal(ui.document.querySelector('[data-guide-reference]'),null);
 assert.equal(ui.document.querySelector('[data-screening-design]'),null);
 assert.equal(ui.document.querySelector('.code-guide'),null);
 assert.doesNotMatch(ui.document.querySelector('.guide-sheet').textContent,/códigos|cribado|omisión nunca/i);
 ui.dom.window.close();
});
test('visible question labels avoid internal codes and rating choices use four distinct tones',()=>{
 const ui=boot();start(ui);const item=ui.document.querySelector('#item-T1');
 assert.match(item.querySelector('.item-id').textContent,/Pregunta 1/);
 assert.doesNotMatch(item.querySelector('.item-id').textContent,/T1/);
 assert.match(item.querySelector('h2').textContent,/perfiles necesarios y complementarios/i);
 assert.match(item.querySelector('h2').textContent,/proyecto/i);
 for(let score=1;score<=4;score++) assert.equal(item.querySelectorAll('.rating-choice.score-'+score).length,2);
 ui.input('input[data-path="items.T1.relevance"][value="4"]',true);ui.click('[data-step="9"]');
 assert.ok(ui.document.querySelector('[data-summary-value="items.T1.relevance"].score-4'));
 assert.doesNotMatch(ui.document.querySelector('[data-summary-item="T1"]').textContent,/T1/);
 ui.dom.window.dispatchEvent(new ui.dom.window.Event('beforeprint'));
 assert.doesNotMatch(ui.document.querySelector('#print-view').textContent,/T: Equipo|PM: Problema|T1/);
 ui.dom.window.close();
});
test('summary groups the long discrimination choice by dimension',()=>{
 const ui=boot();start(ui);ui.click('[data-step="9"]');
 const groups=ui.document.querySelectorAll('.discrimination-groups > details');assert.equal(groups.length,6);
 assert.equal([...groups].filter(group=>group.open).length,0);
 ui.input('input[data-path="designReview.discrimination"][value="C2"]',true);
 ui.click('[data-step="8"]');ui.click('[data-step="9"]');
 assert.equal(ui.document.querySelector('input[value="C2"]').closest('details').open,true);ui.dom.window.close();
});
test('email accepts accidental surrounding spaces',()=>{
 const ui=boot();ui.input('[data-path="consent"]',true);ui.click('[data-action="next"]');
 ui.input('[data-path="profile.email"]','  expert@example.org  ');ui.click('[data-action="next"]');
 assert.equal(ui.stored().profile.email,'expert@example.org');assert.equal(ui.stored().step,2);ui.dom.window.close();
});
test('sending with missing relevance stays local and points to unresolved questions',async()=>{
 const ui=boot();start(ui);ui.click('[data-step="10"]');let sent=false;ui.dom.window.fetch=async()=>{sent=true;throw Error('Must remain local');};
 ui.click('[data-action="submit"]');assert.equal(sent,false);assert.match(ui.document.querySelector('#submit-status').textContent,/relevancia/);
 assert.ok(ui.document.querySelector('[data-missing-relevance] [data-anchor="item-T1"]'));ui.dom.window.close();
});
