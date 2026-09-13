const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const instrument=require('./instrument.js');
const model=require('./core.js').createModel(instrument);

test('V2.3 contract keeps five dimensions and the approved bank of 19 questions',()=>{
 assert.equal(instrument.version,'2.3.0'); assert.equal(instrument.schema,'expert-validation/2.3');
 assert.deepEqual(instrument.dimensions.map(d=>d.id),['D1','D2','D4','D5','D6']);
 assert.deepEqual(instrument.dimensions.map(d=>d.name),['Equipo','Adaptación al mercado','Marketing y ventas','Gestión financiera','Gestión de recursos y relaciones']);
 assert.deepEqual(instrument.items.map(item=>item.id),['T1','T2','T4','T6','PM1','PM2','VB1','VB2','PM3','PM4','C1','C2','C4','F1','F2','F3','F4','SA1','SA2']);
 for(const id of ['T3','T5','C3','VB3','VB4','F5']) assert.equal(instrument.items.some(item=>item.id===id),false);
 assert.deepEqual(instrument.dimensions.map(d=>instrument.items.filter(i=>i.dim===d.id).length),[4,6,3,4,2]);
 assert.equal(instrument.screening.length,5); assert.equal(instrument.contextMetadata.length,2);
 assert.deepEqual(instrument.dimensions.map(d=>d.short),instrument.dimensions.map(d=>d.name));
});

test('V2.3 changes only the approved question copy',()=>{
 const expected={
  T1:'¿El equipo tiene los perfiles necesarios y complementarios para ejecutar con éxito el proyecto?',
  T2:'¿El equipo dispone de experiencia relevante en el sector?',
  T4:'¿Los fundadores trabajan a tiempo completo o tienen disponibilidad suficiente para atender las prioridades del proyecto?',
  T6:'¿El reparto de participaciones permite tomar decisiones sin bloqueos y deja margen para incorporar personas clave o inversores?',
  PM1:'¿Está bien definido el segmento de clientes prioritario?',
  PM2:'¿Hay evidencia directa de que el problema identificado es lo bastante importante para que el cliente actúe?',
  VB1:'¿Está bien definida la propuesta de valor y el cliente reconoce una ventaja frente a otras alternativas?',
  VB2:'¿Se ha definido y validado quién paga, por qué paga y cómo lo hace?',
  PM3:'¿Se ha estimado el tamaño del mercado con datos contrastables?',
  PM4:'¿Puede explicarse con evidencias por qué este es un buen momento para lanzar el proyecto?',
  C1:'¿Qué compromisos comerciales se han conseguido y cuáles se han repetido?',
  C2:'¿Se ha contrastado la estrategia de ventas (go-to-market) con el segmento de clientes definido?',
  C4:'¿Se registran las oportunidades comerciales y las razones por las que avanzan, se detienen o se pierden?',
  F1:'¿Tienes control del dinero disponible y de los cobros y pagos previstos en los próximos meses?',
  F2:'¿Existe una previsión de caja que permita anticipar las necesidades de los próximos meses?',
  F3:'¿Se conocen los recursos necesarios y su financiación para alcanzar el siguiente hito?',
  F4:'¿Se conoce lo que cuesta conseguir y atender a un cliente y el margen que deja?',
  SA1:'¿Las relaciones externas aportan recursos u oportunidades necesarios para el siguiente hito?',
  SA2:'¿Existen evidencias de legitimidad en el mercado que faciliten la colaboración con clientes o socios?'
 };
 assert.deepEqual(Object.fromEntries(instrument.items.map(item=>[item.id,item.q])),expected);
 assert.equal(instrument.items.find(item=>item.id==='C4').levels.length,4);
 assert.doesNotMatch(JSON.stringify(instrument.items.find(item=>item.id==='T6')),/cap table/i);
});

test('delivery requires relevance or explicit omission, never optional usability or coverage',()=>{
 assert.equal(typeof model.deliveryIssues,'function');
 let s=model.createState('v2-mandatory'); s.consent=true;s.profile.email='expert@example.org';s=model.sealInitial(s);
 assert.equal(model.deliveryIssues(s).length,24);
 for(const a of Object.values(s.items))a.relevance=3;
 for(const a of Object.values(s.dimensions))a.relevance=3;
 assert.deepEqual(model.deliveryIssues(s),[]); assert.equal(model.status(s,'T1'),'complete');
 s.items.T1.relevance=null;assert.deepEqual(model.deliveryIssues(s),['T1']);
 s.items.T1.skipReason='experience';assert.deepEqual(model.deliveryIssues(s),[]);
 s.dimensions.D1.skipReason='prefer';for(const id of ['T1','T2','T4','T6'])s.items[id].relevance=null;
 assert.deepEqual(model.deliveryIssues(s),[]);
});

test('applicability never hides absent tests, bootstrapped finance or sole-founder capabilities',()=>{
 assert.equal(typeof model.applicability,'function');
 for(const id of ['T1','T2','T4','PM1','PM2','VB1','VB2','PM3','PM4','C1','C2','C4','F1','F2','F3','SA1','SA2']) assert.equal(model.applicability(id,{phase:'idea',company:false,founders:1,funding:'none'}).status,'applicable',id);
 for(const [id,field] of [['T6','hasOwnership'],['F4','hasEstimationBasis']]) {
  assert.equal(model.applicability(id,{}).status,'needs_context');
  assert.equal(model.applicability(id,{[field]:false}).status,'not_applicable');
  assert.equal(model.applicability(id,{[field]:true}).status,'applicable');
 }
 assert.throws(()=>model.applicability('missing',{}));
});

test('new expert judgements survive export and reject unknown item selections',()=>{
 let s=model.createState('v2-design-review');assert.ok(s.designReview);
 s.consent=true;s.profile.email='expert@example.org';s=model.sealInitial(s);
 s=model.edit(s,['designReview','discrimination'],['C2','C4']);
 s=model.edit(s,['designReview','screeningComment'],'Revisar la fecha de primera venta.');
 const imported=model.importPayload(model.exportPayload(s));assert.deepEqual(imported.designReview,s.designReview);
 assert.throws(()=>model.edit(s,['designReview','discrimination'],['bad']));
 s.schemaVersion='expert-validation/2.2';assert.throws(()=>model.validateState(s));
});

test('browser tests read the current public build rather than a versioned stale filename',()=>{
 assert.match(fs.readFileSync('src/validacion-expertos/app.check.cjs','utf8'),/public\/index\.html/);
});
