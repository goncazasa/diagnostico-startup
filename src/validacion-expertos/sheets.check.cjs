const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const instrument = require('./instrument.js');
const model = require('./core.js').createModel(instrument);
const {boot}=require('../../test-support/sheets-harness.cjs');

function payload(revision=1) {
  let s=model.createState('expert-01'); s.consent=true;s.profile.email='expert@example.org';s=model.sealInitial(s);
  s.revision=revision;s.items.T1.relevance=4;s.items.T1.usability=3;
  s.items.T2.skipReason='experience';s.items.T2.comment='=IMPORTXML("https://example.org")';
  s.initial.text='áéñ 🚀';return model.exportPayload(s);
}
test('receiver rejects unsigned requests without writing',()=>{
  const x=boot();assert.equal(x.post(payload(),false).ok,false);assert.equal(x.tables.size,0);
});
test('receipt follows durable archive; retries do not duplicate it',()=>{
  const x=boot(),p=payload();const first=x.post(p);assert.equal(first.ok,true);
  assert.deepEqual(x.post(p),first);assert.equal(x.tables.get('Entregas').length,2);
  const archive=x.tables.get('Entregas')[1];
  assert.deepEqual(JSON.parse(Buffer.from(archive.slice(5).join(''),'base64').toString('utf8')),p);
  x.setFailFlush(true);assert.equal(x.post(payload(2)).ok,false);
});
test('analysis uses latest revision, preserves numeric scores and missingness, escapes formulas',()=>{
  const x=boot();assert.equal(x.post(payload(2)).ok,true);assert.equal(x.post(payload(1)).ok,true);
  assert.equal(x.tables.get('Entregas').length,3);
  const rows=x.tables.get('Valoraciones'), header=rows[0];
  assert.equal(rows.length,30);
  const t1=rows.find(r=>r[header.indexOf('elemento_id')]==='T1');
  assert.equal(t1[header.indexOf('revision')],2);
  assert.equal(t1[header.indexOf('relevancia')],4);
  const t2=rows.find(r=>r[header.indexOf('elemento_id')]==='T2');
  assert.equal(t2[header.indexOf('relevancia')],'');
  assert.equal(t2[header.indexOf('observaciones')][0],"'");
  assert.equal(rows.flat().includes('expert@example.org'),false);
  assert.equal(x.tables.get('Participantes')[1].includes('expert@example.org'),true);
});
test('archive survives analysis failure and retry repairs derived tables',()=>{
  const x=boot(),p=payload();x.setFailAnalysis(true);
  assert.equal(x.post(p).ok,true);assert.equal(x.props.ANALYSIS_PENDING,'true');
  x.setFailAnalysis(false);assert.equal(x.post(p).ok,true);
  assert.equal(x.tables.get('Entregas').length,2);assert.equal(x.tables.get('Valoraciones').length,30);
  assert.equal(x.props.ANALYSIS_PENDING,undefined);
});
test('large unicode observations round trip across archive cells',()=>{
  const x=boot(),p=payload();p.response.final.v9='ñ'.repeat(30000);
  assert.equal(x.post(p).ok,true);
  const cells=x.tables.get('Entregas')[1].slice(5);
  assert.ok(cells.length>1);assert.ok(cells.every(c=>c.length<=25000));
  assert.equal(JSON.parse(Buffer.from(cells.join(''),'base64').toString('utf8')).response.final.v9,p.response.final.v9);
});

test('V2 design judgements and conditional rules are available in analysis tables',()=>{
 const x=boot(),p=payload();p.response.designReview={screeningComment:'Revisar fase',discrimination:['C3','F5'],discriminationComment:'Concentración variable'};
 assert.equal(x.post(p).ok,true);
 const review=x.tables.get('RevisionDiseno');assert.ok(review);assert.equal(review.length,2);
 assert.ok(review[1].includes('C3 | F5'));
 const dictionary=x.tables.get('Diccionario');const c3=dictionary.find(r=>r[3]==='C3');assert.match(c3[dictionary[0].indexOf('aplicabilidad')],/facturación/);
 assert.ok(x.tables.get('DisenoInstrumento'));
});
test('content validity uses exact fractions, minimum counts and all items for the scale',()=>{
 const x=boot();
 for(let n=0;n<9;n++) {const p=payload();p.response.responseId='panel-'+n;for(const a of Object.values(p.response.items)){a.skipReason='';a.relevance=4;}p.response.items.C3.relevance=n<7?4:1;assert.equal(x.post(p).ok,true);}
 let table=x.tables.get('ValidezContenido');assert.ok(table);
 const c3=table.find(r=>r[1]==='C3');assert.equal(c3[2],9);assert.equal(c3[3],7);assert.equal(c3[4],7/9);assert.equal(c3[5],'revisar');
 const summary=table.find(r=>r[1]==='S-CVI/Ave');assert.ok(summary[4]>0.9);
 const p=payload();p.response.responseId='panel-9';for(const a of Object.values(p.response.items)){a.skipReason='experience';a.relevance=null;}x.post(p);
 table=x.tables.get('ValidezContenido');assert.equal(table.find(r=>r[1]==='C3')[2],9);
});
test('testing records are labelled, excluded from academic validity and summarized separately',()=>{
 const x=boot();
 for(let n=0;n<6;n++) {const p=payload();p.response.responseId='real-panel-'+n;for(const a of Object.values(p.response.items)){a.skipReason='';a.relevance=4;}assert.equal(x.post(p).ok,true);}
 const fake=payload();fake.response.responseId='testing-panel-01';fake.response.profile.name='DATOS DE TESTING · Ana';fake.response.profile.email='testing.ana@example.org';for(const a of Object.values(fake.response.items)){a.skipReason='';a.relevance=1;}assert.equal(x.post(fake).ok,true);
 const participants=x.tables.get('Participantes'),pHeader=participants[0];
 assert.equal(participants.find(r=>r[pHeader.indexOf('participante_id')]==='testing-panel-01')[pHeader.indexOf('es_testing')],true);
 const cvi=x.tables.get('ValidezContenido'),c3=cvi.find(r=>r[1]==='C3');assert.equal(c3[2],6);assert.equal(c3[4],1);
 const summary=x.tables.get('Resumen');assert.ok(summary);assert.match(summary[0][0],/Panel de resultados/);assert.ok(summary.flat().includes('Registros de prueba'));assert.ok(summary.flat().includes(1));
});
test('aggregate screen events contain no participant archive and reject unknown fields',()=>{
 const x=boot();
 const p={format:'expert-progress/2.0',screen:'D1',day:'2026-09-08'};
 assert.equal(x.post(p).ok,true);assert.equal(x.post(p).ok,true);
 assert.equal(x.tables.has('Entregas'),false);assert.equal(x.tables.get('Recorrido')[1][2],2);
 assert.equal(x.post({...p,email:'secret@example.org'}).ok,false);
 assert.equal(x.tables.get('Recorrido').length,2);
});

test('historical V1.9 archives stay intact and separate when rebuilding V2 tables',()=>{
 const x=boot(),p=payload();assert.equal(x.post(p).ok,true);
 const legacy=JSON.parse(JSON.stringify(p));legacy.instrument=require('../../test-support/instrument-v1.9.cjs');legacy.instrumentVersion='1.9.0';legacy.format='expert-validation/1.9';legacy.response.instrumentVersion='1.9.0';legacy.response.schemaVersion='expert-validation/1.9';delete legacy.response.designReview;
 legacy.response.items.T3={relevance:3,usability:null,skipReason:'',comment:'Dato histórico V1.9'};
 for(const id of ['VB4','C3','F5'])delete legacy.response.items[id];
 const raw=JSON.stringify(legacy),receipt='sheets-'+crypto.createHash('sha256').update(raw).digest('hex');
 const row=[receipt,legacy.response.responseId,'1.9.0',legacy.response.revision,new Date().toISOString(),Buffer.from(raw).toString('base64')];
 x.tables.get('Entregas').push(row);x.ctx.actualizarAnalisis();
 assert.deepEqual(x.tables.get('Entregas')[2],row);
 const ratings=x.tables.get('Valoraciones');assert.equal(ratings.filter(r=>r[1]==='1.9.0').length,27);assert.equal(ratings.filter(r=>r[1]==='2.1.0').length,29);
 assert.equal(x.post(legacy).ok,false,'V2 receiver rejects new V1.9 submissions but preserves archived originals');
});
