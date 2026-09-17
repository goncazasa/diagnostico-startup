const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const instrument=require('./instrument.js');
const model=require('./core.js').createModel(instrument);
const ids=['E1','E2','E3','E4','E5','AM1','AM2','AM3','AM5','AM4','AM6','AM8','MV1','MV2','MV3','GF1','GF2','GF3','GF4','GR1','GR2'];
const questions=['¿El equipo tiene los perfiles necesarios y complementarios para ejecutar el proyecto?','¿El equipo conoce de primera mano al cliente, el sector y el problema que desea resolver?','¿La dedicación real del equipo (tiempo y foco) permite ejecutar las prioridades de esta fase?','¿El equipo escucha las señales del mercado: convierte la evidencia y los aprendizajes en decisiones sobre el proyecto?','¿Está claramente definido el segmento de clientes prioritario?','¿Qué evidencia existe de que el problema es suficientemente importante como para que el cliente actúe?','¿Se ha estimado cuántos clientes del segmento puede alcanzar realmente la startup?','¿Se conocen las principales alternativas en el mercado para nuestro cliente y existe una ventaja difícil de replicar?','¿Se monitorizan los cambios del mercado que podrían afectar al éxito o fracaso del proyecto?','¿Está definido y contrastado quién paga, por qué paga y cómo lo hace?','¿Las funcionalidades del producto o servicio se priorizan y mejoran utilizando evidencia de los usuarios?','¿Qué grado de compromiso comercial real ha conseguido la startup?','¿Se ha validado un canal de venta concreto para llegar al segmento prioritario y conseguir clientes?','¿Se registran las oportunidades comerciales y las razones por las que avanzan, se detienen o se pierden?','¿Se conoce el dinero disponible y los principales cobros y pagos de la startup?','¿Existe una previsión que permita anticipar las necesidades financieras de los próximos meses?','¿Se conocen los recursos necesarios para alcanzar el siguiente hito objetivo de la startup y cómo se financiarán?','¿Se ha estimado cuánto cuesta conseguir y atender a un cliente y qué margen genera?','¿La startup mantiene colaboraciones activas que le aportan recursos o ventajas concretas para avanzar?','¿La startup cuenta con clientes o colaboradores que refuerzan su credibilidad ante terceros?'];
questions.splice(4,0,'¿El reparto de participaciones (cap table) permite tomar decisiones sin bloqueos y deja margen para incorporar personas clave o inversores?');

test('V2.8 keeps the approved five-dimensional bank of 21 universal questions',()=>{
 assert.equal(instrument.version,'2.8.0');assert.equal(instrument.schema,'expert-validation/2.8');
 assert.deepEqual(instrument.dimensions.map(d=>d.name),['Equipo','Adaptación al mercado','Marketing y ventas','Gestión financiera','Gestión de recursos y relaciones']);
 assert.deepEqual(instrument.items.map(i=>i.id),ids);assert.deepEqual(instrument.items.map(i=>i.q),questions);
 assert.deepEqual(instrument.dimensions.map(d=>instrument.items.filter(i=>i.dim===d.id).length),[5,7,3,4,2]);
});
test('V2.8 uses four evidence levels and no conditional question route',()=>{
 for(const item of instrument.items){assert.equal(item.levels.length,4,item.id);assert.equal(item.conditional,undefined,item.id);assert.equal(item.applicability,undefined,item.id);assert.notEqual(item.levels[0],'',item.id);}
});
test('V2.8 has no prohibited scored topic',()=>{
 const questions=instrument.items.map(i=>i.q).join('\n');for(const term of [/propiedad intelectual/i,/dependencia de proveedores/i,/\bNPS\b/i,/productos alternativos/i,/productos complementarios/i])assert.doesNotMatch(questions,term);
});
test('V2.8 calculations require all 26 relevance blocks and isolate earlier imports',()=>{
 let s=model.createState('v28-check');s.consent=true;s.profile.email='expert@example.org';s=model.sealInitial(s);assert.equal(model.deliveryIssues(s).length,26);
 for(const a of [...Object.values(s.items),...Object.values(s.dimensions)])a.relevance=3;assert.deepEqual(model.deliveryIssues(s),[]);
 const payload=model.exportPayload(s);assert.equal(payload.format,'expert-validation/2.8');payload.format='expert-validation/2.7';assert.throws(()=>model.importPayload(payload),/V2\.8/);
});
test('V2.8 renders the revised descriptions, guidance and response anchors',()=>{
 const dimensions=Object.fromEntries(instrument.dimensions.map(d=>[d.id,d]));
 const items=Object.fromEntries(instrument.items.map(i=>[i.id,i]));
 assert.equal(dimensions.D1.desc,'Capacidades, experiencia y conocimiento del sector, disponibilidad y aprendizaje del equipo para ejecutar el proyecto.');
 assert.equal(dimensions.D4.desc,'Evidencias de compromiso comercial y estrategia de lanzamiento, venta y aprendizaje en el proceso comercial.');
 assert.equal(dimensions.D5.desc,'Control de la situación financiera, previsión y gestión de caja y estimación de costes.');
 assert.equal(dimensions.D6.desc,'Relaciones externas y colaboraciones que aportan legitimidad y permiten acceder a recursos, conocimiento, mercado y oportunidades.');
 assert.match(items.E3.note,/disponibilidad y foco/i);
 assert.match(items.E5.note,/porcentajes, vesting/i);
 assert.equal(items.E5.levels[0],'No se ha revisado cómo afecta el reparto de participaciones a la toma de decisiones.');
 assert.equal(items.E5.levels[3],'Existen mecanismos previstos (vesting, cláusulas de salida) para incorporar personas clave o inversores y desbloquear decisiones, y se revisan cuando cambia el equipo.');
 assert.equal(items.AM2.levels[2],'Clientes del segmento objetivo describen situaciones reales en las que el problema les genera consecuencias relevantes, como pérdida de tiempo, costes, esfuerzo o riesgo.');
 assert.equal(items.AM3.levels[3],'La estimación se apoya en datos recientes o evidencia del mercado y se revisa cuando cambian los supuestos relevantes.');
 assert.equal(items.GR1.levels[2],'Existen colaboraciones activas que facilitan recursos, capacidades u oportunidades útiles para la startup.');
 assert.match(items.GR2.note,/señal de confianza/i);
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
