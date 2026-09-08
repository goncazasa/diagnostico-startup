const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const instrument=require('./instrument.js');
const model=require('./core.js').createModel(instrument);
test('V2.1 contract removes T3 and keeps six dimensions and screening metadata',()=>{
 assert.equal(instrument.version,'2.1.0'); assert.equal(instrument.schema,'expert-validation/2.1');
 assert.equal(instrument.items.length,23); assert.equal(instrument.dimensions.length,6);
 assert.equal(instrument.items.some(item=>item.id==='T3'),false);
 assert.deepEqual(instrument.dimensions.map(d=>instrument.items.filter(i=>i.dim===d.id).length),[5,4,4,3,5,2]);
 assert.equal(instrument.screening.length,5); assert.equal(instrument.contextMetadata.length,2);
 for(const id of ['C3','VB4','F5']) assert.ok(instrument.items.find(i=>i.id===id).sources.length);
});
test('delivery requires relevance or explicit omission, never optional usability or coverage',()=>{
 assert.equal(typeof model.deliveryIssues,'function');
 let s=model.createState('v2-mandatory'); s.consent=true;s.profile.email='expert@example.org';s=model.sealInitial(s);
 assert.equal(model.deliveryIssues(s).length,29);
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
 for(const [id,field] of [['C3','hasRevenue'],['T6','hasOwnership'],['T5','hasDecisionAgreements'],['F4','hasEstimationBasis'],['F5','usesPublicFunding'],['VB4','deliveryDefined']]) {
  assert.equal(model.applicability(id,{}).status,'needs_context');
  assert.equal(model.applicability(id,{[field]:false}).status,'not_applicable');
  assert.equal(model.applicability(id,{[field]:true}).status,'applicable');
 }
 assert.throws(()=>model.applicability('missing',{}));
});
test('new expert judgements survive export and reject unknown item selections',()=>{
 let s=model.createState('v2-design-review');assert.ok(s.designReview);
 s.consent=true;s.profile.email='expert@example.org';s=model.sealInitial(s);
 s=model.edit(s,['designReview','discrimination'],['C3','VB4']);
 s=model.edit(s,['designReview','screeningComment'],'Revisar la fecha de primera venta.');
 const imported=model.importPayload(model.exportPayload(s));assert.deepEqual(imported.designReview,s.designReview);
 assert.throws(()=>model.edit(s,['designReview','discrimination'],['bad']));
 s.schemaVersion='expert-validation/1.9';assert.throws(()=>model.validateState(s));
});
test('browser tests read the current public build rather than a versioned stale filename',()=>{
 assert.match(fs.readFileSync('src/validacion-expertos/app.check.cjs','utf8'),/public\/index\.html/);
});
