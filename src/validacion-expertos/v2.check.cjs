const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const instrument=require('./instrument.js');
const model=require('./core.js').createModel(instrument);
const ids=['E1','E2','E3','E4','AM1','AM2','AM3','AM5','AM4','AM6','AM8','MV1','MV2','MV3','GF1','GF2','GF3','GF4','GR1','GR2'];
const questions=['¿El equipo tiene los perfiles necesarios y complementarios para ejecutar el proyecto?','¿El equipo conoce de primera mano al cliente, el sector y el problema que desea resolver?','¿La dedicación real del equipo (tiempo y foco) permite ejecutar las prioridades de esta fase?','¿El equipo convierte la evidencia y los aprendizajes en decisiones sobre el proyecto?','¿Está claramente definido el segmento de clientes prioritario?','¿Existe evidencia de que el problema es suficientemente importante para que el cliente actúe?','¿Se ha estimado cuántos clientes del segmento puede alcanzar realmente la startup, a qué precio y con qué frecuencia comprarían?','¿Se conocen las principales alternativas del cliente y existe una ventaja difícil de replicar?','¿Se monitorizan los cambios del mercado que podrían afectar al éxito del proyecto?','¿Está definido y contrastado quién paga, por qué paga y cómo lo hace?','¿Las funcionalidades se priorizan y mejoran utilizando evidencia de los usuarios?','¿Qué grado de compromiso comercial real ha conseguido la startup?','¿Se ha probado un canal de venta concreto para llegar al segmento prioritario y conseguir clientes?','¿Se registran las oportunidades comerciales y las razones por las que avanzan, se detienen o se pierden?','¿Se conoce el dinero disponible y los principales cobros y pagos de la startup?','¿Existe una previsión que permita anticipar las necesidades financieras de los próximos meses?','¿Para alcanzar el siguiente hito de la startup, se conocen los recursos necesarios y cómo se financiarán?','¿Se ha estimado cuánto cuesta conseguir y atender a un cliente y qué margen genera?','¿La startup mantiene colaboraciones activas que le aportan recursos o ventajas concretas para avanzar?','¿La startup cuenta con clientes o colaboradores que actúan como señal de legitimidad y le facilitan acceso a recursos u oportunidades?'];

test('V2.7 keeps the approved five-dimensional bank of 20 universal questions',()=>{
 assert.equal(instrument.version,'2.7.0');assert.equal(instrument.schema,'expert-validation/2.7');
 assert.deepEqual(instrument.dimensions.map(d=>d.name),['Equipo','Adaptación al mercado','Marketing y ventas','Gestión financiera','Gestión de recursos y relaciones']);
 assert.deepEqual(instrument.items.map(i=>i.id),ids);assert.deepEqual(instrument.items.map(i=>i.q),questions);
 assert.deepEqual(instrument.dimensions.map(d=>instrument.items.filter(i=>i.dim===d.id).length),[4,7,3,4,2]);
});
test('V2.7 uses four evidence levels and no conditional question route',()=>{
 for(const item of instrument.items){assert.equal(item.levels.length,4,item.id);assert.equal(item.conditional,undefined,item.id);assert.equal(item.applicability,undefined,item.id);assert.notEqual(item.levels[0],'',item.id);}
});
test('V2.7 has no prohibited scored topic',()=>{
 const questions=instrument.items.map(i=>i.q).join('\n');for(const term of [/reparto de participaciones/i,/propiedad intelectual/i,/dependencia de proveedores/i,/\bNPS\b/i,/productos alternativos/i,/productos complementarios/i])assert.doesNotMatch(questions,term);
});
test('V2.7 calculations require all 25 relevance blocks and isolate earlier imports',()=>{
 let s=model.createState('v25-check');s.consent=true;s.profile.email='expert@example.org';s=model.sealInitial(s);assert.equal(model.deliveryIssues(s).length,25);
 for(const a of [...Object.values(s.items),...Object.values(s.dimensions)])a.relevance=3;assert.deepEqual(model.deliveryIssues(s),[]);
 const payload=model.exportPayload(s);assert.equal(payload.format,'expert-validation/2.7');payload.format='expert-validation/2.6';assert.throws(()=>model.importPayload(payload),/V2\.7/);
});
test('financial help explains cash forecasting and expands CAC and LTV without internal codes',()=>{
 const gf2=instrument.items.find(item=>item.id==='GF2');
 const gf4=instrument.items.find(item=>item.id==='GF4');
 assert.doesNotMatch(gf2.note,/GF1|GF2/);
 assert.match(gf2.note,/previsión de caja/i);
 assert.match(gf4.note,/coste de adquirir un cliente/i);
 assert.match(gf4.note,/valor que ese cliente genera/i);
});
test('browser tests use the generated current public build',()=>assert.match(fs.readFileSync('src/validacion-expertos/app.check.cjs','utf8'),/public\/index\.html/));
