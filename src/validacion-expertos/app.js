(function () {
  'use strict';
  const instrument = globalThis.ValidationInstrument;
  const model = globalThis.ValidationCore.createModel(instrument);
  const STORAGE_KEY = 'startup-expert-validation-v1.8';
  const repository = globalThis.ValidationCore.createRepository({ getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) }, STORAGE_KEY);
  const app = document.getElementById('app');
  const email = instrument.researcherEmail;
  const statusLabels = { complete: 'Completo', partial: 'Parcial', pending: 'Pendiente', skipped: 'Omitido' };
  const criteriaLabels = { relevance: 'Relevancia', coverage: 'Cobertura', usability: 'Claridad y respuestas' };
  const scaleLabels = {
    relevance: ['Nada relevante', 'Poco relevante', 'Bastante relevante', 'Muy relevante'],
    coverage: ['Insuficiente', 'Faltan aspectos importantes', 'Cubre lo principal', 'Suficiente para el alcance'],
    usability: ['La pregunta o sus respuestas necesitan replantearse', 'Necesitan cambios importantes', 'Necesitan ajustes menores', 'La pregunta es clara y sus respuestas son adecuadas']
  };
  const finalQuestions = [
    ['v2', '¿Eliminaría alguna dimensión? ¿Por qué?', 'Puede responder «Ninguna».'],
    ['v3', '¿Falta alguna dimensión o área importante?', 'Piense en el propósito y las fases del diagnóstico.'],
    ['v9', 'Observaciones finales', '¿Hay algo importante que debamos cambiar o tener en cuenta? Puede dejarlo en blanco.']
  ];
  const shortScales = {
    relevance: ['Nada', 'Poco', 'Bastante', 'Mucho'],
    coverage: ['Insuficiente', 'Faltan aspectos', 'Lo principal', 'Suficiente'],
    usability: ['Replantear', 'Cambios importantes', 'Ajustes menores', 'Están bien']
  };
  const steps = [
    { name: 'Participación', type: 'intro' }, { name: 'Perfil y mirada inicial', type: 'profile' },
    { name: 'Cómo valorar', type: 'guide' },
    ...instrument.dimensions.map((d, i) => ({ name: `Dimensión ${i + 1} · ${d.short}`, type: 'dimension', dim: d.id })),
    { name: 'Resumen', type: 'review' }, { name: 'Valoración final y entrega', type: 'final' }
  ];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const idFor = path => path.replaceAll('.', '-');
  const valueAt = path => path.split('.').reduce((value, key) => value[key], state);
  const optional = '<span class="optional">Opcional</span>';
  const questionNames = {
    T1: 'Capacidades disponibles', T2: 'Conocimiento del cliente', T3: 'Aprendizaje y decisiones', T4: 'Dedicación', T5: 'Acuerdos y responsabilidades',
    PM1: 'Segmento prioritario', PM2: 'Importancia del problema', PM3: 'Mercado accesible', PM4: 'Condiciones de adopción',
    VB1: 'Ventaja frente a alternativas', VB2: 'Quién paga y cómo', VB3: 'Resultado de uso',
    C1: 'Compromiso comercial', C2: 'Llegada y venta al cliente',
    F1: 'Caja disponible', F2: 'Previsión de caja', F3: 'Recursos para el hito', F4: 'Costes y margen por cliente',
    SA1: 'Aportación de la red', SA2: 'Evidencias de confianza'
  };
  const codeGroups = { T: 'Equipo (Team)', PM: 'Problema y mercado', VB: 'Propuesta de valor y modelo de negocio', C: 'Evidencia comercial', F: 'Finanzas', SA: 'Recursos estratégicos y legitimidad' };
  const dimensionLabel = id => 'Dimensión ' + id.slice(1);
  const questionLabel = item => `Pregunta ${item.id.match(/\d+$/)[0]} · ${item.id}`;
  function codeGuide() {
    return `<details class="code-guide"><summary>¿Qué significan los códigos de las preguntas?</summary><p><strong>D1 significa Dimensión 1.</strong> <strong>T significa equipo, del inglés Team.</strong> T1 identifica la primera pregunta sobre equipo. Las letras identifican el tema y el número, la pregunta dentro de ese tema.</p><dl>${Object.entries(codeGroups).map(([code, name]) => `<div><dt>${code}</dt><dd>${esc(name)}</dd></div>`).join('')}</dl><p class="fine">Son referencias para localizar preguntas, no puntuaciones.</p></details>`;
  }
  let state = model.createState(globalThis.crypto?.randomUUID?.() || ('response-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)));
  let writeBlocked = false;
  let printMode = 'full';
  let sending = false;
  let submissionError = '';
  const currentSubmission = () => state.submission && /^sheets-[a-f0-9]{64}$/.test(state.submission.id) && state.submission.revision === state.revision;
  let textTimer;
  const pendingText = new Map();
  const restored = repository.load();
  if (restored.ok && restored.value) {
    try { state = model.validateState(restored.value); }
    catch (error) { writeBlocked = true; message('No se pudo recuperar la respuesta anterior: ' + error.message + ' No se ha reemplazado. Puede importar una copia o comenzar otra respuesta.'); }
  } else if (!restored.ok) {
    writeBlocked = true;
    message('No se pudo leer el guardado local. Puede completar la revisión y descargar sus respuestas; no cierre esta ventana antes de hacerlo.');
  }
  if (!model.canVisit(state, state.step)) state.step = state.consent ? 1 : 0;

  function message(text) {
    const box = document.getElementById('message');
    box.textContent = text;
    box.hidden = !text;
  }
  function setSaveStatus(ok) {
    const node = document.getElementById('save-state');
    const text = ok ? 'Cambios guardados en este navegador' : 'Guardado local no disponible. Descargue sus respuestas antes de cerrar.';
    if (node.textContent !== text) node.textContent = text;
    node.classList.toggle('error', !ok);
    document.getElementById('save-time').textContent = ok ? 'Último cambio: ' + new Date(state.updatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
  }
  function persist() {
    if (writeBlocked) { setSaveStatus(false); return false; }
    const result = repository.save(state);
    setSaveStatus(result.ok);
    return result.ok;
  }
  function field(path, label, hint = '', type = 'textarea', options = []) {
    const id = idFor(path), value = valueAt(path);
    const required = path === 'profile.email';
    const attrs = `id="${id}" data-path="${path}" ${required ? 'required autocomplete="email"' : path === 'profile.name' ? 'autocomplete="name"' : ''} ${hint ? `aria-describedby="${id}-help"` : ''}`;
    let control;
    if (type === 'select') control = `<select ${attrs}><option value="">Sin respuesta</option>${options.map(([v, l]) => `<option value="${esc(v)}" ${value === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    else if (type === 'textarea') control = `<textarea ${attrs} maxlength="6000" ${path === 'initial.text' && state.initial.lockedAt ? 'disabled' : ''}>${esc(value)}</textarea>`;
    else control = `<input ${attrs} type="${type}" value="${esc(value)}" ${type === 'number' ? 'min="0" max="100" step="1" inputmode="numeric"' : `maxlength="${required ? 254 : path === 'profile.name' ? 200 : 6000}"`}>`;
    return `<div class="field"><label for="${id}">${esc(label)} ${required ? '' : optional}</label>${control}${hint ? `<p class="fine" id="${id}-help">${esc(hint)}</p>` : ''}</div>`;
  }
  function checks(path, label, values) {
    return `<fieldset class="field"><legend>${esc(label)} ${optional}</legend><div class="choice-list">${values.map((v, i) => `<label for="${idFor(path)}-${i}"><input type="checkbox" id="${idFor(path)}-${i}" data-path="${path}" data-list="true" value="${esc(v)}" ${valueAt(path).includes(v) ? 'checked' : ''}>${esc(v)}</label>`).join('')}</div></fieldset>`;
  }
  function rating(path, label, criterion) {
    return `<fieldset class="rating-group"><legend>${esc(label)}</legend><div class="rating-options">${scaleLabels[criterion].map((label, i) => {
      const number = i + 1, id = idFor(path) + '-' + number;
      return `<label class="rating-choice" for="${id}" title="${esc(label)}"><input type="radio" id="${id}" name="${idFor(path)}" data-path="${path}" aria-label="${number}: ${esc(label)}" value="${number}" ${valueAt(path) === number ? 'checked' : ''}><span><b>${number}</b>${esc(shortScales[criterion][i])}</span></label>`;
    }).join('')}</div><div class="rating-tools"><button class="text-button" type="button" data-action="clear" data-target="${path}" ${valueAt(path) === null ? 'hidden' : ''}>Dejar sin respuesta</button></div></fieldset>`;
  }
  function omission(kind, id) {
    const path = `${kind}.${id}.skipReason`, current = valueAt(path);
    return `<div class="omission"><label for="${idFor(path)}">Si no conoce suficientemente ${kind === 'dimensions' ? 'el tema de esta dimensión' : 'el tema de esta pregunta'}, no es necesario que opine.</label><select id="${idFor(path)}" data-path="${path}"><option value="" ${!current ? 'selected' : ''}>Quiero dar mi opinión</option><option value="experience" ${current === 'experience' ? 'selected' : ''}>No conozco suficientemente este tema</option><option value="prefer" ${current === 'prefer' ? 'selected' : ''}>Prefiero dejarlo sin valorar</option>${current === 'dimension' ? '<option value="dimension" selected>Omitida con la dimensión</option>' : ''}</select></div>`;
  }
  function badge(id) { const status = model.status(state, id); return `<span class="badge ${status}" data-status="${id}">${statusLabels[status]}</span>`; }
  function heading(title, subtitle = '') { return `<div class="page-heading"><h1 id="page-title" tabindex="-1">${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>`; }
  function nav(nextLabel = 'Continuar') {
    return `<div class="nav-row"><button type="button" class="button secondary" data-action="back" ${state.step === 0 ? 'disabled' : ''}>Atrás</button><button type="button" class="button" data-action="next" ${state.step === 0 && !state.consent ? 'disabled' : ''}>${esc(nextLabel)}</button></div>`;
  }
  function intro() {
    return heading('Ayúdenos a revisar 20 preguntas', 'Un diagnóstico para startups en fase temprana, revisado por expertos como usted.') +
      `<section class="surface"><p class="intro-lead">Le mostraremos seis temas, uno por página. En cada pregunta solo tendrá que valorar su relevancia y si el enunciado y sus respuestas funcionan bien.</p>
      <p><strong>Usted evalúa el instrumento; no está puntuando una startup.</strong></p>
      <p>Los comentarios son opcionales. Puede saltar lo que no pueda valorar y continuar más tarde.</p>
      <p class="fine">Son 20 preguntas agrupadas en seis dimensiones. Puede hacer pausas: guardamos sus avances en este navegador.</p>
      <p class="subtle">Al terminar, pulse «Enviar revisión». No tendrá que abrir su correo ni adjuntar archivos.</p>
      <details class="extra-fields"><summary>Propósito y alcance del diagnóstico</summary><p>${esc(instrument.purpose)}</p><p>${esc(instrument.population)}</p><p>Esta ronda incluye seis dimensiones y veinte preguntas candidatas. No predice éxito ni decide inversiones. Se centra en la evidencia para el siguiente hito; la escalabilidad no se evalúa como dimensión independiente. Puede cuestionar esta delimitación en el resumen.</p></details>
      <details class="privacy"><summary>Participación y uso de las respuestas</summary>
      <p>Proyecto de investigación académica vinculado a la Universidad Rey Juan Carlos. La participación es voluntaria. Puede dejar de cumplimentar el formulario en cualquier momento.</p>
      <p>El borrador se guarda en este navegador cuando este lo permite. No incluya nombres de clientes, datos confidenciales ni información que no quiera compartir. El almacenamiento local no sustituye una copia descargada.</p>
      <p>Solicitamos su correo para identificar su revisión y poder contactar con usted sobre ella; el nombre es opcional. Al pulsar «Enviar revisión», sus datos y respuestas se guardan en una hoja privada de Google Sheets del investigador, a través de Vercel y Google Apps Script. Puede guardar una copia descargada. Esta participación no es anónima. Completar el formulario no autoriza a publicar su nombre o correo.</p>
      <p>Antes de entregar respuestas, solicite la hoja de información del estudio a <a href="mailto:${email}?subject=Hoja%20de%20informaci%C3%B3n%20del%20estudio">${email}</a>: debe concretar responsable del tratamiento, base jurídica, conservación, destinatarios y derechos. Esta versión candidata no incorpora todavía esa hoja. Para consultar una retirada, indique su identificador de respuesta; su posibilidad y condiciones deben explicarse en la hoja. Tras una anonimización irreversible puede no ser posible localizarla.</p></details>
      <label class="check-line" for="consent"><input id="consent" type="checkbox" data-path="consent" ${state.consent ? 'checked' : ''}><span>He leído esta información y acepto participar voluntariamente y el uso académico de las respuestas que decida entregar.</span></label>
      ${nav('Empezar la revisión')}</section>`;
  }
  function profile() {
    return heading('Antes de empezar', 'Primero, su criterio sin haber visto el modelo. Después, un breve perfil.') +
      `<section class="surface"><h2>¿Qué miraría usted?</h2>
      ${field('initial.text', 'Si dispusiera de diez minutos para diagnosticar una startup temprana, ¿qué evaluaría?', state.initial.lockedAt ? 'Su respuesta inicial ya está registrada. Puede añadir nuevas ideas en el resumen o al final.' : 'Unas pocas ideas bastan. Nos ayudan a detectar aspectos que el modelo podría haber pasado por alto. Puede dejarlo en blanco; al continuar quedará registrado sin cambios.')}</section>` +
      `<section class="surface">${field('profile.email', 'Correo electrónico', 'Para identificar su revisión y poder contactar con usted sobre sus respuestas.', 'email')}${field('profile.name', 'Nombre', '', 'text')}${checks('profile.roles', 'Perfiles desde los que participa', model.roles)}
      ${field('profile.years', 'Años de experiencia relevante', '', 'number')}
      <details class="extra-fields" ${state.profile.ventures || state.profile.phases.length || state.profile.sectors || state.profile.pivot || state.profile.conflict ? 'open' : ''}><summary>Añadir más detalles sobre su experiencia (opcional)</summary>
      ${field('profile.ventures', 'Startups fundadas, evaluadas o acompañadas', '', 'select', ['0–10', '11–25', '26–50', '51–100', '>100'].map(x => [x, x]))}
      <div class="field" style="margin-top:20px">${checks('profile.phases', 'Fases con las que tiene experiencia', model.phases)}</div>
      ${field('profile.sectors', 'Sectores o modelos con mayor experiencia', 'Por ejemplo: SaaS B2B, servicios, hardware o actividad regulada.', 'text')}
      ${field('profile.pivot', 'Experiencia personal de pivote, cierre o fracaso', '', 'select', ['Sí', 'No', 'Prefiero no responder'].map(x => [x, x]))}
      ${field('profile.conflict', 'Conflictos de interés o circunstancias relevantes', 'Puede describirlos sin identificar personas o empresas.')}</details>
      ${nav('Empezar con las preguntas')}</section>`;
  }
  function guide() {
    return heading('Dos escalas, dos tareas diferentes', 'Usted evalúa el instrumento; no está puntuando una startup.') +
      `<section class="surface"><h2>Lo que verá el emprendedor</h2><p>Cada pregunta tiene cuatro niveles candidatos, del <strong>0 al 3</strong>. Describen evidencias o prácticas observables, ordenadas para ese aspecto.</p>
      <p class="subtle">Los niveles no son intervalos equivalentes ni una puntuación de éxito. En la aplicación futura habrá que distinguir falta de evidencia, desconocimiento, «No aplica todavía» y preferencia por no responder.</p>
      <h2 style="margin-top:24px">Lo que le pedimos a usted</h2><p>Valore del <strong>1 al 4</strong> dos aspectos de cada pregunta:</p>
      <table class="scale-guide"><tbody><tr><th scope="row">Relevancia</th><td>¿Ayuda a identificar brechas para el siguiente hito?</td></tr><tr><th scope="row">Claridad y respuestas</th><td>¿Se entiende la pregunta y son adecuadas sus respuestas? Si algo falla, indíquelo en Observaciones.</td></tr></tbody></table>
      <p class="fine" style="margin-top:12px">Cada pregunta tiene dos valoraciones; cada dimensión, relevancia y cobertura. Las observaciones son opcionales. Si no conoce suficientemente un tema, puede dejarlo sin valorar.</p>${codeGuide()}</section>
      <section class="surface"><h2>Contexto de esta ronda</h2><ul class="guidelines"><li>Se revisan seis dimensiones y veinte preguntas reformuladas. Las conclusiones se limitarán al contenido mostrado.</li><li>La escalabilidad no forma parte de esta ronda. Puede cuestionar esta delimitación en la valoración final.</li><li>Juzgue la adecuación a la fase y al modelo. Señale cuándo una pregunta solo resulta pertinente bajo determinadas condiciones.</li><li>Si una dimensión queda fuera de su experiencia, puede omitirla junto con sus preguntas. Las omisiones no se convertirán en puntuaciones bajas.</li><li>Cuando detecte un problema, indique el nivel o término afectado y una posible reformulación.</li></ul>${nav('Revisar el equipo')}</section>`;
  }
  function glossary(item) {
    const text = (item.q + ' ' + item.note + ' ' + item.levels.join(' ')).toLowerCase();
    const terms = instrument.glossary.filter(g => text.includes(g.term));
    return terms.length ? `<details class="help"><summary>Consultar términos de esta pregunta</summary><dl>${terms.map(g => `<dt>${esc(g.label)}</dt><dd>${esc(g.definition)}</dd>`).join('')}</dl></details>` : '';
  }
  function itemHtml(item) {
    const record = state.items[item.id], base = 'items.' + item.id;
    return `<article class="surface item" id="item-${item.id}" aria-labelledby="title-${item.id}"><div class="item-header"><span class="item-id">${questionLabel(item)}</span>${badge(item.id)}</div>
      <h2 id="title-${item.id}">${esc(item.q)}</h2><details class="help"><summary>Aclaración de esta pregunta</summary><p>${esc(item.note)}</p>${glossary(item)}</details>
      <p class="level-caption">Estas son las respuestas que podría elegir el emprendedor. Léalas para valorar la pregunta.</p><div class="levels">${item.levels.map((text, i) => `<div class="level"><b aria-label="Nivel ${i}">${i}</b><span>${esc(text)}</span></div>`).join('')}</div>
      ${item.conditional ? `<aside class="conditional-note"><strong>Opción adicional propuesta para el emprendedor</strong><p>${esc(item.conditional)}</p><p class="fine">Valore también esta opción al juzgar las respuestas. Si no conoce suficientemente este tema, puede dejarlo sin valorar al final de la pregunta.</p></aside>` : ''}
      ${item.applicabilityNote ? `<p class="applicability-note">${esc(item.applicabilityNote)}</p>` : ''}
      <div data-item-content="${item.id}" ${record.skipReason ? 'hidden' : ''}><p class="eval-label">Ahora, su opinión como experto</p>
      ${rating(base + '.relevance', '¿Es relevante esta pregunta?', 'relevance')}${rating(base + '.usability', '¿Se entiende la pregunta y son adecuadas sus respuestas?', 'usability')}
      ${field(base + '.comment', 'Observaciones', 'Si algo no está claro o cambiaría alguna respuesta, puede explicarlo aquí.')}</div>
      ${omission('items', item.id)}
      <p class="omitted-message" data-item-omitted="${item.id}" ${record.skipReason ? '' : 'hidden'}>Pregunta omitida. Sus puntuaciones no se incluirán en el análisis.</p></article>`;
  }
  function dimension(id) {
    const dim = instrument.dimensions.find(d => d.id === id), items = instrument.items.filter(i => i.dim === id), record = state.dimensions[id], base = 'dimensions.' + id;
    return heading(dimensionLabel(id) + ' · ' + dim.short, items.length + ' preguntas sobre este tema. Revise la página y continúe a la siguiente dimensión.') +
      `<section class="dimension-intro" id="dimension-${id}"><p>${esc(dim.desc)}</p>${omission('dimensions', id)}</section>
      <p class="notice" data-dimension-omitted="${id}" ${record.skipReason ? '' : 'hidden'}>Ha dejado esta dimensión sin valorar. Pulse «Continuar» para seguir.</p>
      <div data-dimension-content="${id}" ${record.skipReason ? 'hidden' : ''}>${items.map(itemHtml).join('')}
      <section class="surface dimension-top"><h2>Su opinión sobre esta dimensión</h2>
      ${rating(base + '.relevance', '¿Es relevante evaluar este tema?', 'relevance')}${rating(base + '.coverage', '¿Las preguntas cubren lo necesario?', 'coverage')}
      ${field(base + '.comment', 'Observaciones', 'Puede indicar qué falta o qué cambiaría en el conjunto de esta dimensión.')}</section></div>
      <button type="button" class="text-button" data-action="return-summary">Ver resumen de respuestas</button>
      ${nav(record.skipReason ? 'Continuar' : state.step === 8 ? 'Ver resumen' : 'Siguiente dimensión')}`;
  }
  function final() {
    return heading('Último paso', 'Puede añadir una observación y enviar su revisión.') +
      `<section class="surface">${field('final.v9', 'Observaciones finales', '¿Hay algo importante que debamos cambiar o tener en cuenta?')}${delivery()}</section>`;
  }
  function scoreText(record, criteria) { return criteria.map(key => criteriaLabels[key] + ': ' + (record[key] ?? 'sin respuesta')).join(' · '); }
  function delivery() {
    const counts = model.summary(state);
    return `<p class="fine">${counts.pending + counts.partial ? 'Puede enviar su revisión aunque haya dejado preguntas sin responder.' : 'Su revisión está lista para enviar.'}</p>
      <button type="button" class="button" data-action="submit">Enviar revisión</button>
      <p id="submit-status" role="status" aria-live="polite"></p>
      <details class="extra-fields"><summary>Guardar una copia (opcional)</summary>
      <p class="fine">Puede descargar una copia de seguridad de sus respuestas.</p>
      <div class="actions"><button type="button" class="button secondary" data-action="export">Descargar respuestas (.json)</button><button type="button" class="button secondary" data-action="print">Imprimir resumen</button><button type="button" class="text-button" data-action="copy">Copiar respuestas</button></div>
      <p class="response-id">Identificador: ${esc(state.responseId)}<br><span data-last-change></span></p>
      <p id="copy-status" role="status"></p><div id="manual-copy-wrapper" hidden></div>
      <div class="notice" id="export-receipt" role="status" hidden>Se ha solicitado la descarga de su copia. Descargar no equivale a enviar.</div>
      <div class="notice" id="export-stale" hidden>Ha cambiado respuestas desde la última copia descargada.</div>
      <details><summary>Consultar progreso</summary>${reviewCounts()}</details></details>
      <div class="nav-row"><button type="button" class="button secondary" data-action="back">Volver al resumen</button></div>`;
  }
  function reviewCounts() {
    const counts = model.summary(state);
    return `<div class="review-counts">${[['complete', 'Completos'], ['partial', 'Parciales'], ['pending', 'Pendientes'], ['skipped', 'Omitidos']].map(([key, label]) => `<div><strong data-count="${key}">${counts[key]}</strong>${label}</div>`).join('')}</div>`;
  }
  function summaryValue(kind, id, criterion) {
    const value = state[kind][id][criterion];
    const label = `${id} · ${criteriaLabels[criterion]}: ${value === null ? 'sin responder' : value + ', ' + scaleLabels[criterion][value - 1]}`;
    return `<span class="summary-score ${value === null ? 'unanswered' : ''}" data-summary-value="${kind}.${id}.${criterion}" role="img" aria-label="${esc(label)}" title="${esc(label)}">${value ?? '—'}</span>`;
  }
  function summaryMap(interactive = true) {
    return `<div class="summary-map" ${interactive ? 'id="summary-map"' : ''}>${instrument.dimensions.map((dim, index) => {
      const omitted = model.status(state, dim.id) === 'skipped';
      const items = instrument.items.filter(item => item.dim === dim.id);
      const dimTitle = `<span class="summary-dimension-number">${dimensionLabel(dim.id)}</span><span>${esc(dim.name)}</span>`;
      return `<section class="summary-dimension" data-summary-dimension="${dim.id}" aria-labelledby="${interactive ? 'map' : 'print-map'}-${dim.id}"><h2 id="${interactive ? 'map' : 'print-map'}-${dim.id}">${interactive ? `<button type="button" data-action="jump" data-step="${index + 3}" data-anchor="dimension-${dim.id}">${dimTitle}</button>` : dimTitle}</h2>
      <div class="summary-dimension-scores">${omitted ? '<p class="summary-omitted">Dimensión omitida</p>' : `<div><span>Relevancia</span>${summaryValue('dimensions', dim.id, 'relevance')}</div><div><span>Cobertura</span>${summaryValue('dimensions', dim.id, 'coverage')}</div>`}</div>
      <table class="summary-table"><caption class="sr-only">Preguntas de ${esc(dim.name)}. Valoraciones del experto de 1 a 4.</caption><thead><tr><th scope="col">Pregunta</th><th scope="col">Relevancia</th><th scope="col">Claridad y respuestas</th></tr></thead><tbody>${items.map(item => {
        const skipped = model.status(state, item.id) === 'skipped';
        const title = `<span class="summary-question-code">${item.id}</span><span>${esc(questionNames[item.id])}</span>`;
        return `<tr data-summary-item="${item.id}"><th scope="row">${interactive ? `<button type="button" data-action="jump" data-step="${index + 3}" data-anchor="item-${item.id}" title="${esc(item.q)}" aria-label="Revisar ${questionLabel(item)}: ${esc(item.q)}">${title}</button>` : title}</th>${skipped ? '<td colspan="2" class="summary-omitted">Omitida</td>' : model.itemCriteria.map(criterion => `<td>${summaryValue('items', item.id, criterion)}</td>`).join('')}</tr>`;
      }).join('')}</tbody></table></section>`;
    }).join('')}</div>`;
  }
  function review() {
    return heading('Resumen de sus respuestas', 'Las seis dimensiones y sus veinte preguntas, reunidas en una sola vista. Compruebe sus valoraciones antes de pasar a las conclusiones finales.') +
      `<section class="summary-intro"><p><strong>Los números son sus valoraciones como experto, de 1 a 4.</strong> En cada pregunta se muestran relevancia y valoración conjunta de claridad y respuestas. En cada dimensión, relevancia y cobertura.</p>
      <p class="summary-legend"><span><b class="summary-score">1–4</b> Valor introducido</span><span><b class="summary-score unanswered">—</b> Sin responder</span><span><b class="summary-omitted">Omitida</b> Excluida del análisis</span></p>
      <p class="fine">Pulse el nombre de una dimensión o pregunta para revisarla. Los títulos están abreviados; al abrirlos verá la pregunta completa. No se calculan promedios ni una puntuación de la startup.</p>${reviewCounts()}${codeGuide()}</section>
      ${summaryMap()}
      <section class="surface summary-feedback"><h2>Con el conjunto a la vista</h2><p class="fine">Si lo desea, señale qué sobra o qué falta. Puede cuestionar también la ausencia de una dimensión de escalabilidad.</p>${finalQuestions.filter(([key]) => ['v2','v3'].includes(key)).map(([key, label, hint]) => field('final.' + key, label, hint)).join('')}</section>
      <div class="actions"><button type="button" class="button secondary" data-action="print-map">Imprimir este resumen</button></div>
      ${nav('Continuar a la valoración final')}`;
  }
  function profileText() {
    const p = state.profile;
    return [['Correo', p.email], ['Nombre', p.name], ['Perfiles', p.roles.join(', ')], ['Años', p.years], ['Startups', p.ventures], ['Fases', p.phases.join(', ')], ['Sectores', p.sectors], ['Pivote, cierre o fracaso', p.pivot], ['Conflictos de interés', p.conflict]].map(([label, value]) => label + ': ' + (value || 'Sin respuesta')).join('\n');
  }
  function render() {
    const step = steps[state.step];
    document.querySelector('.sidebar').hidden = state.step === 0;
    document.querySelector('.save-footer').hidden = state.step === 0;
    printMode = step.type === 'review' ? 'map' : 'full';
    app.innerHTML = step.type === 'intro' ? intro() : step.type === 'profile' ? profile() : step.type === 'guide' ? guide() : step.type === 'dimension' ? dimension(step.dim) : step.type === 'final' ? final() : review();
    document.getElementById('step-nav').innerHTML = steps.map((step, i) => {
      const name = !state.initial.lockedAt && step.type === 'dimension' ? 'Dimensión ' + (i - 2) : step.name;
      return `<button type="button" class="step-button" data-step="${i}" ${model.canVisit(state, i) ? '' : 'disabled'} ${i === state.step ? 'aria-current="step"' : ''}><span class="step-number" aria-hidden="true">${i + 1}</span><span>${esc(name)}</span>${step.dim ? `<span class="step-count" data-nav-count="${step.dim}"></span>` : ''}</button>`;
    }).join('');
    refresh();
  }
  function refresh() {
    const counts = model.summary(state);
    const progress = document.getElementById('progress');
    progress.max = counts.total;
    progress.value = counts.resolved;
    progress.setAttribute('aria-valuetext', `${counts.complete} completos, ${counts.skipped} omitidos y ${counts.pending + counts.partial} sin terminar`);
    document.getElementById('progress-text').textContent = `${counts.complete} completos, ${counts.skipped} omitidos, ${counts.pending + counts.partial} por terminar`;
    document.querySelectorAll('[data-status]').forEach(node => { const status = model.status(state, node.dataset.status); node.className = 'badge ' + status; node.textContent = statusLabels[status]; });
    document.querySelectorAll('#step-nav [data-step]').forEach(button => { button.disabled = !model.canVisit(state, Number(button.dataset.step)); });
    document.querySelectorAll('[data-nav-count]').forEach(node => { const c = model.summary(state, node.dataset.navCount); node.textContent = `${c.resolved}/${c.total}`; node.setAttribute('aria-label', `${c.complete} completos y ${c.skipped} omitidos`); });
    document.querySelectorAll('[data-action="clear"]').forEach(button => { button.hidden = valueAt(button.dataset.target) === null; });
    if (state.step === 0) app.querySelector('[data-action="next"]').disabled = !state.consent;
    if (steps[state.step].type === 'final') {
      const button = app.querySelector('[data-action="submit"]');
      button.disabled = sending || !!currentSubmission();
      button.textContent = sending ? 'Enviando…' : currentSubmission() ? 'Revisión enviada' : state.submission ? 'Enviar cambios' : 'Enviar revisión';
      document.getElementById('submit-status').textContent = sending ? 'Enviando su revisión…' : submissionError || (currentSubmission() ? 'Su revisión se ha enviado. Gracias por colaborar.' : state.submission ? 'Ha cambiado respuestas después del envío. Puede enviar la versión actualizada.' : '');
      document.querySelector('[data-last-change]').textContent = 'Último cambio: ' + new Date(state.updatedAt).toLocaleString('es-ES');
      const currentExport = model.hasCurrentExport(state);
      document.getElementById('export-receipt').hidden = !currentExport;
      document.getElementById('export-stale').hidden = state.exportedRevision < 0 || currentExport;
    }
    const currentDim = steps[state.step].dim;
    if (currentDim) {
      const omitted = !!state.dimensions[currentDim].skipReason;
      app.querySelector('[data-dimension-content]').hidden = omitted;
      app.querySelector('[data-dimension-omitted]').hidden = !omitted;
      instrument.items.filter(i => i.dim === currentDim).forEach(item => {
        const skip = !!state.items[item.id].skipReason;
        app.querySelector(`[data-item-content="${item.id}"]`).hidden = skip;
        app.querySelector(`[data-item-omitted="${item.id}"]`).hidden = !skip;
      });
    }
  }
  function validFields() {
    for (const control of app.querySelectorAll('input, select, textarea')) {
      if (!control.disabled && !control.closest('[hidden]') && !control.checkValidity()) { control.reportValidity(); return false; }
    }
    return true;
  }
  function goTo(step, anchor) {
    flushText();
    if (!validFields() || !model.canVisit(state, step)) return;
    if (steps[step].dim) {
      if (anchor) state.focusId = anchor.replace(/^(item|dimension)-/, '');
      else if (step !== state.step) state.focusId = instrument.items.find(i => i.dim === steps[step].dim).id;
    }
    state.step = step;
    persist(); render();
    document.querySelector('.outline').open = false;
    const requested = anchor ? document.getElementById(anchor) : document.getElementById('page-title');
    const target = requested?.closest('[hidden]') ? document.getElementById('dimension-' + steps[step].dim) : requested;
    if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start' }); }
  }
  function advance(direction) {
    flushText();
    if (!validFields()) return;
    if (state.step === 1 && direction === 1) { state = model.sealInitial(state); goTo(3); return; }
    if (state.step === 3 && direction === -1) { goTo(1); return; }
    goTo(state.step + direction);
  }
  function updateControl(event) {
    const control = event.target.closest('[data-path]');
    if (!control || control.disabled) return;
    const path = control.dataset.path;
    if (!control.checkValidity()) { setSaveStatus(false); return; }
    let value = control.value;
    if (control.dataset.list) value = Array.from(app.querySelectorAll(`input[data-path="${path}"]:checked`), node => node.value);
    else if (control.type === 'checkbox') value = control.checked;
    else if (control.type === 'radio') { if (!control.checked) return; value = Number(control.value); }
    try {
      const previous = state;
      state = model.edit(state, path.split('.'), value);
      if (state !== previous) invalidateCopy();
      persist(); refresh();
    }
    catch (error) { message(error.message); }
  }
  function flushText() {
    clearTimeout(textTimer);
    const controls = [...pendingText.values()];
    pendingText.clear();
    controls.forEach(control => updateControl({ target: control }));
  }
  function invalidateCopy() {
    const status = document.getElementById('copy-status');
    if (status?.textContent) status.textContent = 'Ha cambiado respuestas. Vuelva a copiarlas antes de pegarlas en el correo.';
    const manual = document.getElementById('manual-copy-wrapper');
    if (manual) { manual.hidden = true; manual.replaceChildren(); }
  }
  app.addEventListener('input', event => {
    const control = event.target;
    if (!control.dataset.path || ['checkbox', 'radio'].includes(control.type) || control.tagName === 'SELECT') return;
    pendingText.set(control.dataset.path, control);
    clearTimeout(textTimer);
    invalidateCopy();
    document.getElementById('save-state').textContent = writeBlocked ? 'Guardado detenido en esta pestaña. Descargue su copia antes de cerrarla.' : 'Guardando al terminar de escribir…';
    const receipt = document.getElementById('export-receipt');
    if (receipt) receipt.hidden = true;
    textTimer = setTimeout(flushText, 400);
  });
  app.addEventListener('change', event => { flushText(); updateControl(event); });
  document.getElementById('step-nav').addEventListener('click', event => { const button = event.target.closest('[data-step]'); if (button && !button.disabled) goTo(Number(button.dataset.step)); });
  app.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    try {
      flushText();
      if (action === 'back') advance(-1);
      if (action === 'next') advance(1);
      if (action === 'jump') goTo(Number(button.dataset.step), button.dataset.anchor);
      if (action === 'return-summary') goTo(9);
      if (action === 'clear') {
        state = model.edit(state, button.dataset.target.split('.'), null);
        app.querySelectorAll(`input[data-path="${button.dataset.target}"]`).forEach(node => { node.checked = false; });
        persist(); refresh();
        app.querySelector(`input[data-path="${button.dataset.target}"]`).focus();
      }
      if (action === 'submit') submitResponses();
      if (action === 'export') exportResponses();
      if (action === 'copy') copyResponses();
      if (action === 'print' || action === 'print-map') { printMode = action === 'print-map' ? 'map' : 'full'; renderPrint(); window.print(); }
    } catch (error) { message(error.message || 'No se pudo completar la acción. Puede volver a intentarlo.'); }
  });
  async function submitResponses() {
    flushText();
    if (sending || currentSubmission()) return;
    if (location.protocol === 'file:') { submissionError = 'Para enviar, abra el enlace web de la encuesta. Esta copia local permite revisar y descargar respuestas.'; refresh(); return; }
    const payload = model.exportPayload(state);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    sending = true; submissionError = ''; refresh();
    try {
      const response = await fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
      const result = await response.json();
      if (!response.ok || result.ok !== true || typeof result.receiptId !== 'string' || !/^sheets-[a-f0-9]{64}$/.test(result.receiptId)) throw new Error(response.status === 503 ? 'not-configured' : 'failed');
      if (state.responseId === payload.response.responseId) {
        state = model.validateState({ ...state, submission: { id: result.receiptId, revision: payload.response.revision, at: new Date().toISOString() } });
        persist();
      }
    } catch (error) {
      if (state.responseId === payload.response.responseId) submissionError = error.message === 'not-configured' ? 'El envío todavía no está disponible. Sus respuestas se conservan; puede guardar una copia y volver más tarde.' : 'No se ha podido confirmar el envío. Sus respuestas se conservan. Pulse «Enviar revisión» para reintentarlo.';
    } finally { clearTimeout(timer); sending = false; refresh(); }
  }
  function exportResponses() {
    flushText();
    const payload = model.exportPayload(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `validacion_experto_V1_8_${state.responseId}_${payload.exportedAt.replace(/[-:.]/g, '')}.json`;
    document.body.appendChild(link);
    try {
      link.click(); state = model.markExport(state); persist();
      document.getElementById('export-receipt').hidden = false;
      document.getElementById('export-stale').hidden = true;
    }
    finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
  }
  async function copyResponses() {
    flushText();
    const payload = model.exportPayload(state);
    const raw = JSON.stringify(payload, null, 2);
    const status = document.getElementById('copy-status');
    const holder = document.getElementById('manual-copy-wrapper');
    const stillCurrent = () => state.responseId === payload.response.responseId && state.revision === payload.response.revision && pendingText.size === 0;
    status.textContent = 'Preparando la copia…';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(raw);
      status.textContent = stillCurrent() ? 'Respuestas copiadas. Abra el correo y péguelas en el mensaje. Todavía no se han enviado.' : 'Las respuestas han cambiado durante la copia. Vuelva a copiarlas antes de enviarlas.';
    } catch {
      if (!stillCurrent()) { status.textContent = 'Las respuestas han cambiado. Pulse de nuevo «Copiar respuestas».'; return; }
      status.textContent = 'El navegador no permite copiar automáticamente. Copie el texto seleccionado o descargue el archivo.';
      const label = document.createElement('label'); label.htmlFor = 'manual-copy'; label.textContent = 'Respuestas para copiar y pegar en el correo';
      const textarea = document.createElement('textarea'); textarea.id = 'manual-copy'; textarea.readOnly = true; textarea.value = raw;
      holder.replaceChildren(label, textarea); holder.hidden = false;
      textarea.focus(); textarea.select();
    }
  }
  function renderPrint() {
    flushText();
    const payload = model.exportPayload(state), response = payload.response;
    document.body.dataset.printMode = printMode;
    if (printMode === 'map') {
      document.getElementById('print-view').innerHTML = `<h1>Resumen de sus respuestas</h1><p class="print-note">Validación de expertos V1.8 · Último cambio: ${esc(new Date(state.updatedAt).toLocaleString('es-ES'))} · ${esc(state.responseId)}<br>Valoraciones del experto de 1 a 4. — = sin responder. Omitida = excluida del análisis.</p><p class="print-note">T: Equipo (Team). PM: Problema y mercado. VB: Propuesta de valor y modelo de negocio. C: Evidencia comercial. F: Finanzas. SA: Recursos estratégicos y legitimidad.</p>${summaryMap(false)}`;
      return;
    }
    document.getElementById('print-view').innerHTML = `<h1>Validación de expertos · V1.8</h1><p>Diagnóstico para startups en fase temprana</p><p class="print-note">Respuesta ${esc(state.responseId)} · Último cambio: ${esc(new Date(state.updatedAt).toLocaleString('es-ES'))} · ${esc(new Date().toLocaleString('es-ES'))}<br>Esta copia no acredita envío ni recepción.</p><p>${payload.summary.complete} bloques completos; ${payload.summary.partial} parciales; ${payload.summary.pending} pendientes; ${payload.summary.skipped} omitidos.</p><h2>Perfil y mirada inicial</h2><p class="pre-wrap">${esc(profileText())}</p><p class="pre-wrap">${esc(state.initial.text || 'Mirada inicial sin respuesta')}</p>
      ${instrument.dimensions.map(dim => `<h2>${dimensionLabel(dim.id)} · ${esc(dim.name)}</h2><p>${model.status(response, dim.id) === 'skipped' ? 'Dimensión omitida' : esc(scoreText(response.dimensions[dim.id], model.dimCriteria))}</p><p class="pre-wrap">${esc(response.dimensions[dim.id].comment)}</p>${instrument.items.filter(i => i.dim === dim.id).map(item => `<article><strong>${questionLabel(item)} · ${esc(item.q)}</strong><p>${model.status(response, item.id) === 'skipped' ? 'Pregunta omitida: sus puntuaciones se excluyen.' : esc(scoreText(response.items[item.id], model.itemCriteria))}</p><p class="pre-wrap">${esc(response.items[item.id].comment || 'Sin comentario')}</p></article>`).join('')}`).join('')}
      <h2>Valoración final</h2>${finalQuestions.map(([key, label]) => `<article><strong>${esc(label)}</strong><p class="pre-wrap">${esc(state.final[key] || 'Sin respuesta')}</p></article>`).join('')}`;
  }
  document.getElementById('import-button').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', async event => {
    flushText();
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('El archivo supera 1 MB. Seleccione una exportación de este formulario.');
      const raw = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('No se pudo leer el archivo.')); reader.readAsText(file); });
      let payload;
      try { payload = JSON.parse(raw); } catch { throw new Error('El archivo no contiene JSON válido. No se ha cambiado su borrador.'); }
      const incoming = model.importPayload(payload);
      if ((state.revision > 0 || writeBlocked) && !window.confirm('Recuperar este archivo reemplazará el borrador de este navegador. Si necesita conservarlo, cancele y descargue primero sus respuestas. ¿Recuperar el archivo?')) return;
      flushText();
      state = incoming;
      if (!model.canVisit(state, state.step)) state.step = state.consent ? 1 : 0;
      writeBlocked = false;
      const saved = persist();
      render();
      message(saved ? '' : 'Archivo recuperado en esta ventana. El navegador no permite guardarlo localmente; descargue una copia antes de cerrar.');
      document.getElementById('page-title').focus();
    } catch (error) { message(error.message); }
    finally { event.target.value = ''; }
  });
  document.getElementById('reset-button').addEventListener('click', () => {
    flushText();
    if (!window.confirm('Se iniciará una respuesta nueva y se reemplazará el borrador local. Cancele y descargue primero la respuesta actual si necesita conservarla. ¿Comenzar otra respuesta?')) return;
    state = model.createState(globalThis.crypto?.randomUUID?.() || ('response-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)));
    writeBlocked = false;
    message(''); persist(); render();
    document.getElementById('page-title').focus();
  });
  window.addEventListener('pagehide', () => { flushText(); persist(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushText(); });
  window.addEventListener('beforeprint', () => { if (state.consent) renderPrint(); });
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY && event.newValue !== JSON.stringify(state)) {
      writeBlocked = true;
      setSaveStatus(false);
      message('La respuesta guardada ha cambiado en otra ventana. Esta ventana conserva su borrador y ha detenido el guardado para evitar sobrescribirlo. Descargue aquí la copia que quiera conservar; después, recargue esta pestaña para continuar con la copia guardada.');
    }
  });
  render();
  if (writeBlocked) setSaveStatus(false);
  else if (restored.value) setSaveStatus(true);
  else document.getElementById('save-state').textContent = 'El guardado local comienza cuando responde. También puede descargar una copia.';
})();
