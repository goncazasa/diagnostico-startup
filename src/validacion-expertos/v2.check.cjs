const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const instrument=require('./instrument.js');
const model=require('./core.js').createModel(instrument);
test('V2.2 contract keeps six dimensions and the revised bank of 21 questions',()=>{
 assert.equal(instrument.version,'2.2.0'); assert.equal(instrument.schema,'expert-validation/2.2');
 assert.equal(instrument.items.length,21); assert.equal(instrument.dimensions.length,6);
 for(const id of ['T3','C3','F5']) assert.equal(instrument.items.some(item=>item.id===id),false);
 assert.deepEqual(instrument.dimensions.map(d=>instrument.items.filter(i=>i.dim===d.id).length),[5,4,4,2,4,2]);
 assert.equal(instrument.screening.length,5); assert.equal(instrument.contextMetadata.length,2);
 assert.ok(instrument.items.find(i=>i.id==='VB4').sources.length);
 assert.deepEqual(instrument.dimensions.map(d=>d.short),instrument.dimensions.map(d=>d.name));
});
test('V2.2 copy reflects the approved entrepreneurial constructs',()=>{
 const questions=Object.fromEntries(instrument.items.map(item=>[item.id,item.q]));
 assert.match(questions.T1,/perfiles necesarios y complementarios/);
 assert.match(questions.T2,/experiencia relevante en el sector/);
 assert.match(questions.T4,/tiempo completo|disponibilidad suficiente/);
 assert.match(questions.T5,/roles y las responsabilidades/);
 assert.match(questions.T6,/cap table/);
 assert.match(questions.PM1,/segmento de clientes prioritario/);
 assert.match(questions.PM2,/problema identificado/);
 assert.match(questions.PM3,/tamaño del mercado/);
 assert.match(questions.PM4,/buen momento para lanzar/);
 assert.match(questions.VB1,/propuesta de valor/);
 assert.match(questions.VB2,/quién paga, por qué paga y cómo/);
 assert.match(questions.VB3,/pruebas con usuarios reales/);
 assert.match(questions.VB4,/aumentar sus ingresos/);
 assert.match(questions.C2,/estrategia de ventas/);
 assert.match(questions.F1,/cobros y pagos previstos/);
 assert.match(questions.SA2,/legitimidad en el mercado/);
});
test('delivery requires relevance or explicit omission, never optional usability or coverage',()=>{
 assert.equal(typeof model.deliveryIssues,'function');
 let s=model.createState('v2-mandatory'); s.consent=true;s.profile.email='expert@example.org';s=model.sealInitial(s);
 assert.equal(model.deliveryIssues(s).length,27);
 for(const a of Object.values(s.items))a.relevance=3;
 for(const a of Object.values(s.dimensions))a.relevance=3;
 assert.deepEqual(model.deliveryIssues(s),[]); assert.equal(model.status(s,'T1'),'complete');
 s.items.T1.relevance=null;assert.deepEqual(model.deliveryIssues(s),['T1']);
 s.items.T1.skipReason='experience';assert.deepEqual(model.deliveryIssues(s),[]);
 s.dimensions.D1.skipReason='prefer';for(const id of ['T1','T2','T4','T5','T6'])s.items[id].relevance=null;
 assert.deepEqual(model.deliveryIssues(s),[]);
});
test('applicability never hides absent tests, bootstrapped finance or sole-founder capabilities',()=>{
 assert.equal(typeof model.applicability,'function');
 for(const id of ['T1','T2','T4','PM1','PM2','PM3','PM4','VB1','VB2','VB3','C1','C2','F1','F2','F3','SA1','SA2']) assert.equal(model.applicability(id,{phase:'idea',company:false,founders:1,funding:'none'}).status,'applicable',id);
 for(const [id,field] of [['T6','hasOwnership'],['T5','hasDecisionAgreements'],['F4','hasEstimationBasis'],['VB4','deliveryDefined']]) {
  assert.equal(model.applicability(id,{}).status,'needs_context');
  assert.equal(model.applicability(id,{[field]:false}).status,'not_applicable');
  assert.equal(model.applicability(id,{[field]:true}).status,'applicable');
 }
 assert.throws(()=>model.applicability('missing',{}));
});
test('new expert judgements survive export and reject unknown item selections',()=>{
 let s=model.createState('v2-design-review');assert.ok(s.designReview);
 s.consent=true;s.profile.email='expert@example.org';s=model.sealInitial(s);
 s=model.edit(s,['designReview','discrimination'],['C2','VB4']);
 s=model.edit(s,['designReview','screeningComment'],'Revisar la fecha de primera venta.');
 const imported=model.importPayload(model.exportPayload(s));assert.deepEqual(imported.designReview,s.designReview);
 assert.throws(()=>model.edit(s,['designReview','discrimination'],['bad']));
 s.schemaVersion='expert-validation/2.1';assert.throws(()=>model.validateState(s));
});
test('browser tests read the current public build rather than a versioned stale filename',()=>{
 assert.match(fs.readFileSync('src/validacion-expertos/app.check.cjs','utf8'),/public\/index\.html/);
});
