(function () {
  'use strict';
  const instrument = globalThis.ValidationInstrument;
  const model = globalThis.ValidationCore.createModel(instrument);
  const STORAGE_KEY = 'startup-expert-validation-v2.1';
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
    ['v2', '¿Eliminarías alguna dimensión? ¿Por qué?', 'Puedes responder «Ninguna».'],
    ['v3', '¿Falta alguna dimensión o área importante?', 'Piensa en el propósito y las fases del diagnóstico.'],
    ['v9', 'Observaciones finales', '¿Hay algo importante que debamos cambiar o tener en cuenta?']
  ];
  const shortScales = {
    relevance: ['Nada', 'Poco', 'Bastante', 'Mucho'],
    coverage: ['Insuficiente', 'Faltan aspectos', 'Lo principal', 'Suficiente'],
    usability: ['Replantear', 'Cambios importantes', 'Ajustes menores', 'Clara y adecuada']
  };
  const steps = [
    { name: 'Bienvenida', type: 'intro' }, { name: 'Tu experiencia', type: 'profile' },
    { name: 'Cómo responder', type: 'guide' },
    ...instrument.dimensions.map((d, i) => ({ name: `Dimensión ${i + 1} · ${d.short}`, type: 'dimension', dim: d.id })),
    { name: 'Resumen', type: 'review' }, { name: 'Enviar revisión', type: 'final' }
  ];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const idFor = path => path.replaceAll('.', '-');
  const valueAt = path => path.split('.').reduce((value, key) => value[key], state);
  const optional = '<span class="optional">Opcional</span>';
  const questionNames = {
    C3: 'Dependencia de clientes', VB4: 'Ingresos y horas de trabajo', F5: 'Financiación pública pendiente',
    T1: 'Perfiles complementarios', T2: 'Conocimiento del cliente', T4: 'Disponibilidad', T5: 'Acuerdos y responsabilidades', T6: 'Estructura de propiedad',
    PM1: 'Segmento prioritario', PM2: 'Importancia del problema', PM3: 'Mercado accesible', PM4: 'Momento y adopción',
    VB1: 'Ventaja frente a alternativas', VB2: 'Quién paga y cómo', VB3: 'Resultado de uso',
    C1: 'Compromiso comercial', C2: 'Llegada y venta al cliente',
    F1: 'Caja disponible', F2: 'Previsión de caja', F3: 'Recursos para el hito', F4: 'Costes y margen por cliente',
    SA1: 'Aportación de la red', SA2: 'Evidencias de confianza'
  };
  const codeGroups = { T: 'Equipo (Team)', PM: 'Problema y mercado', VB: 'Propuesta de valor y modelo de negocio', C: 'Evidencia comercial', F: 'Finanzas', SA: 'Recursos estratégicos y legitimidad' };
  const dimensionLabel = id => 'Dimensión ' + id.slice(1);
  const questionLabel = item => `Pregunta ${item.id.match(/\d+$/)[0]} · ${item.id}`;
  function codeGuide() {
    return `<details class="code-guide"><summary>Los códigos de las preguntas</summary><p><strong>D1 significa Dimensión 1.</strong> En T1, la letra T identifica Equipo (Team) y el número indica la pregunta. Son referencias para localizarla.</p><dl>${Object.entries(codeGroups).map(([code, name]) => `<div><dt>${code}</dt><dd>${esc(name)}</dd></div>`).join('')}</dl></details>`;
  }
  function illustration(id) {
    const drawings = {
      D1: '<path d="M45 93h100M67 72l43-25 43 25"/><circle cx="110" cy="41" r="18"/><circle cx="59" cy="79" r="14"/><circle cx="161" cy="79" r="14"/><path d="M82 108V96a28 28 0 0 1 56 0v12M35 119v-11a24 24 0 0 1 44-13m62 0a24 24 0 0 1 44 13v11"/>',
      D2: '<circle cx="99" cy="73" r="48"/><circle cx="99" cy="73" r="28"/><circle cx="99" cy="73" r="7"/><path d="M105 67l53-40m-4 0 23-5-11 22M41 126h98"/>',
      D3: '<path d="M38 63l37-22 37 22v43l-37 22-37-22zM38 63l37 22 37-22M75 85v43M117 37h56v49h-40l-16 12zM130 52h30m-30 13h21"/>',
      D4: '<path d="M39 117V34m0 83h143M56 101l33-26 29 8 51-44m-23 0h23v22"/><circle cx="89" cy="75" r="5"/><circle cx="118" cy="83" r="5"/><path d="M69 117v-8m36 8v-9m36 9V96"/>',
      D5: '<rect x="40" y="37" width="142" height="91" rx="9"/><path d="M40 61h142M59 82h36m-36 17h22M122 107V87m18 20V74m18 33V94M59 25h55"/><circle cx="58" cy="49" r="2"/><circle cx="68" cy="49" r="2"/>',
      D6: '<path d="M110 23l37 15v32c0 24-17 39-37 50-20-11-37-26-37-50V38zM93 67l12 13 23-27M42 54l31 7m74 0 31-7M65 114l18-17m54 0 18 17"/><circle cx="33" cy="51" r="9"/><circle cx="187" cy="51" r="9"/><circle cx="59" cy="123" r="9"/><circle cx="161" cy="123" r="9"/>'
    };
    return `<svg class="dimension-art" viewBox="0 0 220 150" aria-hidden="true"><ellipse cx="110" cy="85" rx="96" ry="58" fill="#eaf0f9"/><circle cx="176" cy="29" r="18" fill="#e5efd0"/><g fill="white" stroke="#29577b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${drawings[id] || drawings.D1}</g></svg>`;
  }
  let state = model.createState(globalThis.crypto?.randomUUID?.() || ('response-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)));
  let writeBlocked = false;
  let printMode = 'full';
  let sending = false;
  let submissionError = '';
  const currentSubmission = () => state.submission && /^sheets-[a-f0-9]{64}$/.test(state.submission.id) && state.submission.revision === state.revision;
  let textTimer;
  const pendingText = new Map();
  const reachedScreens = new Set();
  function recordProgress(screen) {
    if (!state.consent || location.protocol === 'file:' || reachedScreens.has(screen) || !navigator.sendBeacon) return;
    // Aggregate counters only: no response ID, email, answers, timestamps or session token.
    try { if (navigator.sendBeacon('/api/progress', new Blob([JSON.stringify({ screen })], {type:'application/json'}))) reachedScreens.add(screen); } catch { /* Optional telemetry never blocks answering. */ }
  }
  const restored = repository.load();
  if (restored.ok && restored.value) {
    try { state = model.validateState(restored.value); }
    catch (error) { writeBlocked = true; message('No se pudo recuperar la respuesta anterior: ' + error.message + ' No se ha reemplazado. Puedes importar una copia o comenzar otra respuesta.'); }
  } else if (!restored.ok) {
    writeBlocked = true;
    message('No se pudo leer el guardado local. Puedes completar la revisión y descargar tus respuestas; no cierres esta ventana antes de hacerlo.');
  }
  if (!model.canVisit(state, state.step)) state.step = state.consent ? 1 : 0;

  function message(text) {
    const box = document.getElementById('message');
    box.textContent = text;
    box.hidden = !text;
  }
  function setSaveStatus(ok) {
    const node = document.getElementById('save-state');
    const text = ok ? 'Cambios guardados en este navegador' : 'No se puede guardar aquí. Descarga una copia antes de cerrar.';
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
    else control = `<input ${attrs} type="${type}" value="${esc(value)}" ${type === 'number' ? 'min="0" max="100" step="1" inputmode="numeric"' : `maxlength="${required ? 254 : ['profile.name', 'profile.phasesOther'].includes(path) ? 200 : 6000}"`}>`;
    return `<div class="field"><label for="${id}">${esc(label)} ${required ? '' : optional}</label>${control}${hint ? `<p class="fine" id="${id}-help">${esc(hint)}</p>` : ''}</div>`;
  }
  function checks(path, label, values) {
    return `<fieldset class="field"><legend>${esc(label)} ${optional}</legend><div class="choice-list">${values.map((v, i) => `<label for="${idFor(path)}-${i}"><input type="checkbox" id="${idFor(path)}-${i}" data-path="${path}" data-list="true" value="${esc(v)}" ${valueAt(path).includes(v) ? 'checked' : ''}>${esc(v)}</label>`).join('')}</div></fieldset>`;
  }
  function rating(path, label, criterion) {
    return `<fieldset class="rating-group"><legend>${esc(label)} ${criterion === 'relevance' ? '<span class="optional">Obligatoria o con omisión</span>' : optional}</legend><div class="rating-options">${scaleLabels[criterion].map((label, i) => {
      const number = i + 1, id = idFor(path) + '-' + number;
      return `<label class="rating-choice" for="${id}" title="${esc(label)}"><input type="radio" id="${id}" name="${idFor(path)}" data-path="${path}" aria-label="${number}: ${esc(label)}" value="${number}" ${valueAt(path) === number ? 'checked' : ''}><span><b>${number}</b>${esc(shortScales[criterion][i])}</span></label>`;
    }).join('')}</div><div class="rating-tools"><button class="text-button" type="button" data-action="clear" data-target="${path}" ${valueAt(path) === null ? 'hidden' : ''}>Dejar sin respuesta</button></div></fieldset>`;
  }
  function omission(kind, id) {
    const path = `${kind}.${id}.skipReason`, current = valueAt(path);
    return `<div class="omission"><label for="${idFor(path)}">¿Este tema queda fuera de tu experiencia? Puedes omitir${kind === 'dimensions' ? ' la dimensión' : ' la pregunta'}.</label><select id="${idFor(path)}" data-path="${path}"><option value="" ${!current ? 'selected' : ''}>Voy a valorarla</option><option value="experience" ${current === 'experience' ? 'selected' : ''}>No tengo suficiente experiencia</option><option value="prefer" ${current === 'prefer' ? 'selected' : ''}>Prefiero no responder</option>${current === 'dimension' ? '<option value="dimension" selected>Omitida con la dimensión</option>' : ''}</select></div>`;
  }
  function badge(id) { const status = model.status(state, id); return `<span class="badge ${status}" data-status="${id}">${statusLabels[status]}</span>`; }
  function heading(title, subtitle = '') { return `<div class="page-heading"><h1 id="page-title" tabindex="-1">${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>`; }
  function nav(nextLabel = 'Continuar') {
    return `<div class="nav-row"><button type="button" class="button secondary" data-action="back" ${state.step === 0 ? 'disabled' : ''}>Atrás</button><button type="button" class="button" data-action="next" ${state.step === 0 && !state.consent ? 'disabled' : ''}>${esc(nextLabel)}</button></div>`;
  }
  function intro() {
    return `<div class="welcome-hero"><div>${heading('Ayúdanos a mejorar el diagnóstico', 'Revisa un cuestionario de diagnóstico para startups en fase temprana.')}<p class="intro-lead">Indica si las preguntas son relevantes, claras y tienen respuestas adecuadas.</p><p class="key-instruction">Vas a revisar el cuestionario, no a evaluar una startup concreta.</p><div class="welcome-facts"><span><strong>23</strong> preguntas</span><span><strong>6</strong> dimensiones</span><span><strong>20–30</strong> min</span></div></div><div class="welcome-art">${illustration('D1')}</div></div>` +
      `<section class="surface welcome-start"><p>Puedes dejar preguntas sin valorar y añadir observaciones donde lo necesites. Tu avance se guarda en este navegador para que puedas continuar más tarde.</p>
      <details class="extra-fields"><summary>Propósito y alcance del estudio</summary><p>${esc(instrument.purpose)}</p><p>${esc(instrument.population)}</p><p>El instrumento está en proceso de validación. No predice el éxito ni sustituye una decisión de inversión. La relación entre ingresos y trabajo se revisa dentro del modelo de negocio.</p></details>
      <details class="privacy"><summary>Participación y uso de las respuestas</summary>
      <p>Investigación doctoral vinculada a la Universidad Rey Juan Carlos. Participar es voluntario y puedes abandonar el formulario en cualquier momento.</p>
      <p>El correo permite identificar tu revisión y contactar contigo sobre ella. El nombre es opcional. La participación no es anónima, pero los resultados se publicarán de forma agregada y anonimizada, sin tu nombre ni tu correo.</p>
      <p>Al pulsar «Enviar revisión», tus respuestas se guardan en una hoja privada de Google Sheets del investigador mediante Vercel y Google Apps Script. No incluyas datos confidenciales ni nombres de clientes. También puedes descargar una copia de tu revisión.</p>
      <p>Se registran contadores agregados de pantallas recibidas para estudiar el recorrido. Esos eventos no incluyen correo, nombre, identificador de respuesta ni valoraciones.</p><p>Puedes solicitar la hoja de información del estudio antes o después de responder en <a href="mailto:${email}?subject=Hoja%20de%20informaci%C3%B3n%20del%20estudio">${email}</a>. Incluye responsable, base jurídica, conservación, destinatarios y derechos. Para retirar una respuesta, escribe a ese correo con su identificador. Tras anonimizarla de forma irreversible, puede que ya no sea posible localizarla.</p></details>
      <label class="check-line" for="consent"><input id="consent" type="checkbox" data-path="consent" ${state.consent ? 'checked' : ''}><span>He leído la información y acepto participar voluntariamente y el uso académico de mis respuestas.</span></label>
      ${nav('Empezar la revisión')}</section>`;
  }
  function profile() {
    return heading('Tu experiencia', 'Solo el correo es obligatorio. El resto nos ayuda a interpretar tu revisión.') +
      `<section class="surface profile-form"><div class="form-grid">${field('profile.email', 'Correo electrónico', 'Para identificar tu revisión y contactar contigo sobre ella.', 'email')}${field('profile.name', 'Nombre', '', 'text')}</div>${checks('profile.roles', '¿Cuál es tu relación con las startups? (puedes marcar varias)', model.roles)}
      ${field('profile.years', 'Años de experiencia con startups', '', 'number')}
      <details class="extra-fields" ${state.profile.ventures || state.profile.phases.length || state.profile.sectors || state.profile.pivot || state.profile.conflict ? 'open' : ''}><summary>Más sobre tu experiencia (opcional)</summary>
      ${field('profile.ventures', 'Startups fundadas, evaluadas o acompañadas', '', 'select', ['0–10', '11–25', '26–50', '51–100', '>100'].map(x => [x, x]))}
      ${checks('profile.phases', 'Fases con las que tienes experiencia (puedes marcar varias)', model.phases)}
      <div data-other-phase ${state.profile.phases.includes('Otra') ? '' : 'hidden'}>${field('profile.phasesOther', '¿Qué otra fase?', 'Por ejemplo: crecimiento internacional o consolidación.', 'text')}</div>
      ${field('profile.sectors', 'Sectores o modelos que conoces mejor', 'Por ejemplo: servicios, software para empresas o industria.', 'text')}
      ${field('profile.pivot', '¿Has vivido un cambio de rumbo, cierre o fracaso de una startup?', '', 'select', ['Sí', 'No', 'Prefiero no responder'].map(x => [x, x]))}
      ${field('profile.conflict', 'Conflictos de interés o circunstancias relevantes', 'No incluyas nombres de personas o empresas.')}</details>
      <div class="initial-question">${field('initial.text', 'Antes de ver las preguntas: ¿qué evaluarías en una startup en fase temprana?', state.initial.lockedAt ? 'Esta respuesta ya está registrada. Puedes añadir ideas en el resumen.' : 'No hay una respuesta correcta. Escribe tu criterio antes de ver el cuestionario; al continuar se guardará y ya no podrás editarlo.')}</div>
      ${nav('Continuar')}</section>`;
  }
  function guide() {
    return heading('Cómo responder', 'Revisa cada pregunta; no la respondas como si evaluaras una startup.') +
      `<section class="surface guide-sheet"><ol class="guide-steps">
      <li><strong>Lee la pregunta y sus respuestas.</strong><span>Los niveles 0–3 son las opciones que verá la persona emprendedora.</span></li>
      <li><strong>Valora la pregunta.</strong><span><b>Relevancia</b>: si merece formar parte del diagnóstico. <b>Claridad y respuestas</b>: si se entiende y las opciones funcionan.</span></li></ol>
      <p class="guide-note">La relevancia es obligatoria. Si el tema queda fuera de tu experiencia, puedes omitirlo. Las demás valoraciones y las observaciones son opcionales.</p>
      <details class="extra-fields"><summary>Más criterios de revisión</summary><p>Ten en cuenta la fase y el modelo de negocio. «No aplica todavía» se registra aparte y nunca equivale a 0.</p></details>${codeGuide()}${screeningDesign()}${nav('Revisar la primera dimensión')}</section>`;
  }
  function screeningDesign() {
    return `<details class="design-proposal" data-guide-reference><summary>Cribado y contexto del futuro diagnóstico</summary><p>Estos datos adaptarán el diagnóstico a cada proyecto. Revisa las opciones y las reglas; no los respondas como fundador.</p>
      <dl>${instrument.screening.map(field => `<div data-screening-design="${field.id}"><dt>${esc(field.label)}</dt><dd>${esc(field.options.join(' · '))}<p>${esc(field.purpose)}</p></dd></div>`).join('')}</dl>
      <p>Los cinco datos generales no resuelven todas las exclusiones. Las condiciones específicas se muestran junto a cada ítem; una falta de pruebas no oculta la pregunta.</p>
      <p class="section-label"><strong>Contexto temporal sin puntuación</strong></p><dl>${instrument.contextMetadata.map(field => `<div data-context-metadata="${field.id}"><dt>${esc(field.label)}</dt><dd>${esc(field.description)}</dd></div>`).join('')}</dl>
      ${field('designReview.screeningComment', 'Observaciones sobre el cribado y el contexto')}</details>`;
  }
  function itemDesign(item) {
    return (item.designFields || []).map(field => `<aside class="design-note"><strong>${esc(field.label)}</strong><p>${esc(field.description)}</p></aside>`).join('');
  }
  function glossary(item) {
    const text = (item.q + ' ' + item.note + ' ' + item.levels.join(' ') + ' ' + (item.conditional || '')).toLowerCase();
    const words = new Set(text.split(/[^0-9a-zà-ÿ]+/).filter(Boolean));
    const matches = term => term.split(' ').every(part => words.has(part) || words.has(part + 's') || words.has(part + 'es'));
    const terms = instrument.glossary.filter(g => matches(g.term));
    return terms.length ? `<details class="help" open><summary>Términos de esta pregunta</summary><dl>${terms.map(g => `<dt>${esc(g.label)}</dt><dd>${esc(g.definition)}</dd>`).join('')}</dl></details>` : '';
  }
  function itemHtml(item) {
    const record = state.items[item.id], base = 'items.' + item.id;
    return `<article class="surface item" id="item-${item.id}" aria-labelledby="title-${item.id}"><div class="item-header"><span class="item-id">${questionLabel(item)}</span>${badge(item.id)}</div>
      <h2 id="title-${item.id}">${esc(item.q)}</h2><details class="help" open><summary>Qué tener en cuenta</summary><p>${esc(item.note)}</p>${glossary(item)}</details>
      <p class="level-caption">Respuestas previstas para la persona emprendedora</p><div class="levels">${item.levels.map((text, i) => `<div class="level"><b aria-label="Nivel ${i}">${i}</b><span>${esc(text)}</span></div>`).join('')}</div>
      ${item.conditional ? `<aside class="conditional-note"><p>${esc(item.conditional)}</p></aside>` : ''}
      ${item.applicabilityNote ? `<p class="applicability-note">${esc(item.applicabilityNote)}</p>` : ''}
      ${itemDesign(item)}
      <div class="expert-response" data-item-content="${item.id}" ${record.skipReason ? 'hidden' : ''}><p class="eval-label">Tu valoración <span>Escala de 1 a 4</span></p>
      ${rating(base + '.relevance', '¿Es relevante esta pregunta?', 'relevance')}${rating(base + '.usability', '¿Se entiende la pregunta y son adecuadas sus respuestas?', 'usability')}
      ${field(base + '.comment', 'Observaciones', '')}</div>
      ${omission('items', item.id)}
      <p class="omitted-message" data-item-omitted="${item.id}" ${record.skipReason ? '' : 'hidden'}>Pregunta omitida. Tus puntuaciones no se incluirán en el análisis.</p></article>`;
  }
  function dimension(id) {
    const dim = instrument.dimensions.find(d => d.id === id), items = instrument.items.filter(i => i.dim === id), record = state.dimensions[id], base = 'dimensions.' + id;
    return `<div class="dimension-heading"><div><p class="step-context">${dimensionLabel(id)} de 6 <span>${items.length} preguntas</span></p>${heading(dim.name, dim.desc)}</div>${illustration(id)}</div>` +
      `<section class="dimension-intro" id="dimension-${id}">${omission('dimensions', id)}</section>
      <p class="notice" data-dimension-omitted="${id}" ${record.skipReason ? '' : 'hidden'}>Has dejado esta dimensión sin valorar. Pulsa «Continuar» para seguir.</p>
      <div data-dimension-content="${id}" ${record.skipReason ? 'hidden' : ''}>${items.map(itemHtml).join('')}
      <section class="surface dimension-top"><h2>La dimensión en conjunto</h2>
      ${rating(base + '.relevance', '¿Es relevante evaluar este tema?', 'relevance')}${rating(base + '.coverage', '¿Las preguntas cubren lo necesario?', 'coverage')}
      ${field(base + '.comment', 'Observaciones', '¿Falta algún aspecto o cambiarías algo en esta dimensión?')}</section></div>
      <button type="button" class="text-button" data-action="return-summary">Ver resumen de tu revisión</button>
      ${nav(record.skipReason ? 'Continuar' : state.step === 8 ? 'Ver resumen' : 'Siguiente dimensión')}`;
  }
  function final() {
    return heading('Envía tu revisión', 'Gracias por aportar tu experiencia. Puedes añadir un último comentario antes de enviar.') +
      `<section class="surface">${field('final.v9', 'Observaciones finales', '¿Hay algo importante que debamos cambiar o tener en cuenta?')}${delivery()}</section>`;
  }
  function scoreText(record, criteria) { return criteria.map(key => criteriaLabels[key] + ': ' + (record[key] ?? 'sin respuesta')).join(' · '); }
  function delivery() {
    const counts = model.summary(state);
    const missing = model.deliveryIssues(state);
    return `<p class="fine">${missing.length ? 'Faltan decisiones de relevancia. Se necesita una puntuación o un motivo de omisión antes del envío.' : 'La revisión está lista para enviar. Los campos opcionales pueden quedar vacíos.'}</p>
      ${missing.length ? `<div data-missing-relevance><p>Revisar los elementos pendientes:</p><div class="choice-list">${missing.map(id => { const item = instrument.items.find(i => i.id === id), dimId = item ? item.dim : id; return `<button type="button" class="text-button" data-action="jump" data-step="${steps.findIndex(s => s.dim === dimId)}" data-anchor="${item ? 'item' : 'dimension'}-${id}">${esc(item ? id : dimensionLabel(id))}</button>`; }).join('')}</div></div>` : ''}
      <button type="button" class="button" data-action="submit">Enviar revisión</button>
      <p id="submit-status" role="status" aria-live="polite"></p>
      <details class="extra-fields"><summary>Guardar una copia (opcional)</summary>
      <p class="fine">Puedes importar la copia descargada desde el menú «Tu respuesta».</p>
      <div class="actions"><button type="button" class="button secondary" data-action="export">Descargar copia</button><button type="button" class="button secondary" data-action="print">Imprimir revisión</button><button type="button" class="text-button" data-action="copy">Copiar respuestas</button></div>
      <p class="response-id">Identificador: ${esc(state.responseId)}<br><span data-last-change></span></p>
      <p id="copy-status" role="status"></p><div id="manual-copy-wrapper" hidden></div>
      <div class="notice" id="export-receipt" role="status" hidden>Copia preparada para descargar. Para entregar tu revisión, pulsa «Enviar revisión».</div>
      <div class="notice" id="export-stale" hidden>Has cambiado respuestas desde la última copia descargada.</div>
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
    return heading('Resumen de tu revisión', 'Comprueba tus valoraciones. Pulsa en una pregunta o dimensión para corregirla.') +
      `<section class="summary-intro"><p>Estos números representan tu valoración del cuestionario, de 1 a 4.</p>
      <p class="summary-legend"><span><b class="summary-score">1–4</b> Valor introducido</span><span><b class="summary-score unanswered">—</b> Sin responder</span><span><b class="summary-omitted">Omitida</b> Excluida del análisis</span></p>
      ${reviewCounts()}</section>
      ${summaryMap()}
      <section class="surface summary-feedback"><h2>¿Qué mejorarías del conjunto?</h2>${finalQuestions.filter(([key]) => ['v2','v3'].includes(key)).map(([key, label, hint]) => field('final.' + key, label, hint)).join('')}
      <fieldset class="field"><legend>¿En qué preguntas se espera que casi todas las startups elijan el mismo nivel? ${optional}</legend><div class="choice-list">${instrument.items.map(item => `<label><input type="checkbox" data-path="designReview.discrimination" data-list="true" value="${item.id}" ${state.designReview.discrimination.includes(item.id) ? 'checked' : ''}>${item.id} · ${esc(questionNames[item.id])}</label>`).join('')}</div></fieldset>
      ${field('designReview.discriminationComment', 'Observaciones sobre la capacidad de distinguir situaciones', 'Este juicio expresa una previsión; las diferencias reales se estudiarán con respuestas de fundadores.')}</section>
      <div class="actions"><button type="button" class="button secondary" data-action="print-map">Imprimir este resumen</button></div>
      ${nav('Continuar al envío')}`;
  }
  function designReviewText() {
    const d = state.designReview;
    return 'Cribado: ' + (d.screeningComment || 'Sin observaciones') + '\nPosible falta de discriminación: ' + (d.discrimination.join(', ') || 'Sin selección') + '\nObservaciones: ' + (d.discriminationComment || 'Sin observaciones');
  }
  function profileText() {
    const p = state.profile;
    return [['Correo', p.email], ['Nombre', p.name], ['Perfiles', p.roles.join(', ')], ['Años', p.years], ['Startups', p.ventures], ['Fases', p.phases.join(', ')], ['Sectores', p.sectors], ['Pivote, cierre o fracaso', p.pivot], ['Conflictos de interés', p.conflict]].map(([label, value]) => label + ': ' + (value || 'Sin respuesta')).join('\n');
  }
  function render() {
    const step = steps[state.step];
    document.body.dataset.screen = step.type;
    document.querySelector('.sidebar').hidden = state.step === 0;
    document.querySelector('.save-footer').hidden = state.step === 0;
    printMode = step.type === 'review' ? 'map' : 'full';
    app.innerHTML = step.type === 'intro' ? intro() : step.type === 'profile' ? profile() : step.type === 'guide' ? guide() : step.type === 'dimension' ? dimension(step.dim) : step.type === 'final' ? final() : review();
    document.querySelector('.outline').open = !globalThis.matchMedia?.('(max-width: 800px)').matches;
    document.getElementById('step-nav').innerHTML = steps.map((step, i) => {
      const name = !state.initial.lockedAt && step.type === 'dimension' ? 'Dimensión ' + (i - 2) : step.name;
      return `<button type="button" class="step-button" data-step="${i}" ${model.canVisit(state, i) ? '' : 'disabled'} ${i === state.step ? 'aria-current="step"' : ''}><span class="step-number" aria-hidden="true">${i + 1}</span><span>${esc(name)}</span>${step.dim ? `<span class="step-count" data-nav-count="${step.dim}"></span>` : ''}</button>`;
    }).join('');
    refresh();
  }
  function refresh() {
    recordProgress(steps[state.step].dim || steps[state.step].type);
    const counts = model.summary(state);
    const progress = document.getElementById('progress');
    progress.max = counts.total;
    progress.value = counts.resolved;
    progress.setAttribute('aria-valuetext', `${counts.complete} completos, ${counts.skipped} omitidos y ${counts.pending + counts.partial} sin terminar`);
    const completeQuestions = instrument.items.filter(item => model.status(state, item.id) === 'complete').length;
    const completeDimensions = instrument.dimensions.filter(dim => model.status(state, dim.id) === 'complete').length;
    document.getElementById('progress-text').textContent = `Preguntas: ${completeQuestions}/${instrument.items.length} · Dimensiones: ${completeDimensions}/${instrument.dimensions.length}${counts.skipped ? ' · ' + counts.skipped + ' omitidas' : ''}`;
    const otherPhase = app.querySelector('[data-other-phase]');
    if (otherPhase) otherPhase.hidden = !state.profile.phases.includes('Otra');
    document.querySelectorAll('[data-status]').forEach(node => { const status = model.status(state, node.dataset.status); node.className = 'badge ' + status; node.textContent = statusLabels[status]; });
    document.querySelectorAll('#step-nav [data-step]').forEach(button => { button.disabled = !model.canVisit(state, Number(button.dataset.step)); });
    document.querySelectorAll('[data-nav-count]').forEach(node => { const c = model.summary(state, node.dataset.navCount); node.textContent = `${c.resolved}/${c.total}`; node.setAttribute('aria-label', `${c.complete} completos y ${c.skipped} omitidos`); });
    document.querySelectorAll('[data-action="clear"]').forEach(button => { button.hidden = valueAt(button.dataset.target) === null; });
    if (state.step === 0) app.querySelector('[data-action="next"]').disabled = !state.consent;
    if (steps[state.step].type === 'final') {
      const button = app.querySelector('[data-action="submit"]');
      button.disabled = sending || !!currentSubmission();
      button.textContent = sending ? 'Enviando…' : currentSubmission() ? 'Revisión enviada' : state.submission ? 'Enviar cambios' : 'Enviar revisión';
      document.getElementById('submit-status').textContent = sending ? 'Enviando tu revisión…' : submissionError || (currentSubmission() ? 'Tu revisión se ha enviado. Gracias por colaborar.' : state.submission ? 'Has cambiado respuestas después del envío. Puedes enviar la versión actualizada.' : '');
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
    const requested = anchor ? document.getElementById(anchor) : document.getElementById('page-title');
    const target = requested?.closest('[hidden]') ? document.getElementById('dimension-' + steps[step].dim) : requested;
    if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start' }); }
  }
  function advance(direction) {
    flushText();
    if (!validFields()) return;
    if (state.step === 1 && direction === 1) { state = model.sealInitial(state); goTo(2); return; }
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
    if (status?.textContent) status.textContent = 'Has cambiado respuestas. Vuelve a copiarlas para tener una copia actualizada.';
    const manual = document.getElementById('manual-copy-wrapper');
    if (manual) { manual.hidden = true; manual.replaceChildren(); }
  }
  app.addEventListener('input', event => {
    const control = event.target;
    if (!control.dataset.path || ['checkbox', 'radio'].includes(control.type) || control.tagName === 'SELECT') return;
    pendingText.set(control.dataset.path, control);
    clearTimeout(textTimer);
    invalidateCopy();
    document.getElementById('save-state').textContent = writeBlocked ? 'Guardado detenido. Descarga una copia antes de cerrar esta pestaña.' : 'Guardando al terminar de escribir…';
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
    } catch (error) { message(error.message || 'No se pudo completar la acción. Puedes volver a intentarlo.'); }
  });
  async function submitResponses() {
    flushText();
    if (sending || currentSubmission()) return;
    if (model.deliveryIssues(state).length) { submissionError = 'Faltan valoraciones de relevancia. Selecciona los elementos pendientes e indica una puntuación o un motivo de omisión.'; refresh(); return; }
    if (location.protocol === 'file:') { submissionError = 'Para enviar, abre el enlace web de la encuesta. Desde esta copia local puedes revisar y descargar tus respuestas.'; refresh(); return; }
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
        recordProgress('completed');
        persist();
      }
    } catch (error) {
      if (state.responseId === payload.response.responseId) submissionError = error.message === 'not-configured' ? 'El envío todavía no está disponible. Tus respuestas se conservan; puedes guardar una copia y volver más tarde.' : 'No se ha podido confirmar el envío. Tus respuestas se conservan. Pulsa «Enviar revisión» para reintentarlo.';
    } finally { clearTimeout(timer); sending = false; refresh(); }
  }
  function exportResponses() {
    flushText();
    const payload = model.exportPayload(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `validacion_experto_V2_1_${state.responseId}_${payload.exportedAt.replace(/[-:.]/g, '')}.json`;
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
      status.textContent = stillCurrent() ? 'Respuestas copiadas. Para entregarlas, usa el botón «Enviar revisión».' : 'Las respuestas han cambiado durante la copia. Vuelve a copiarlas para tener la versión actualizada.';
    } catch {
      if (!stillCurrent()) { status.textContent = 'Las respuestas han cambiado. Pulsa de nuevo «Copiar respuestas».'; return; }
      status.textContent = 'No se ha podido copiar automáticamente. Copia el texto seleccionado o descarga el archivo.';
      const label = document.createElement('label'); label.htmlFor = 'manual-copy'; label.textContent = 'Copia de tus respuestas';
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
      document.getElementById('print-view').innerHTML = `<h1>Resumen de tus respuestas</h1><p class="print-note">Validación de expertos V2.1 · Último cambio: ${esc(new Date(state.updatedAt).toLocaleString('es-ES'))} · ${esc(state.responseId)}<br>Valoraciones del experto de 1 a 4. — = sin responder. Omitida = excluida del análisis.</p><p class="print-note">T: Equipo (Team). PM: Problema y mercado. VB: Propuesta de valor y modelo de negocio. C: Evidencia comercial. F: Finanzas. SA: Recursos estratégicos y legitimidad.</p>${summaryMap(false)}`;
      return;
    }
    document.getElementById('print-view').innerHTML = `<h1>Diagnóstico de startups</h1><p>Revisión por expertos · Instrumento V2.1</p><p class="print-note">Respuesta ${esc(state.responseId)} · Último cambio: ${esc(new Date(state.updatedAt).toLocaleString('es-ES'))} · ${esc(new Date().toLocaleString('es-ES'))}<br>Esta copia no acredita envío ni recepción.</p><p>${payload.summary.complete} bloques completos; ${payload.summary.partial} parciales; ${payload.summary.pending} pendientes; ${payload.summary.skipped} omitidos.</p><h2>Perfil y criterio inicial</h2><p class="pre-wrap">${esc(profileText())}</p><p class="pre-wrap">${esc(state.initial.text || 'Criterio inicial sin respuesta')}</p>
      ${instrument.dimensions.map(dim => `<h2>${dimensionLabel(dim.id)} · ${esc(dim.name)}</h2><p>${model.status(response, dim.id) === 'skipped' ? 'Dimensión omitida' : esc(scoreText(response.dimensions[dim.id], model.dimCriteria))}</p><p class="pre-wrap">${esc(response.dimensions[dim.id].comment)}</p>${instrument.items.filter(i => i.dim === dim.id).map(item => `<article><strong>${questionLabel(item)} · ${esc(item.q)}</strong><p>${model.status(response, item.id) === 'skipped' ? 'Pregunta omitida: sus puntuaciones se excluyen.' : esc(scoreText(response.items[item.id], model.itemCriteria))}</p><p class="pre-wrap">${esc(response.items[item.id].comment || 'Sin comentario')}</p></article>`).join('')}`).join('')}
      <h2>Revisión del diseño</h2><p class="pre-wrap">${esc(designReviewText())}</p><h2>Valoración final</h2>${finalQuestions.map(([key, label]) => `<article><strong>${esc(label)}</strong><p class="pre-wrap">${esc(state.final[key] || 'Sin respuesta')}</p></article>`).join('')}`;
  }
  document.getElementById('import-button').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', async event => {
    flushText();
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('El archivo supera 1 MB. Selecciona una copia descargada de este formulario.');
      const raw = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('No se pudo leer el archivo.')); reader.readAsText(file); });
      let payload;
      try { payload = JSON.parse(raw); } catch { throw new Error('No se reconoce el formato del archivo. Tu borrador se conserva.'); }
      const incoming = model.importPayload(payload);
      if ((state.revision > 0 || writeBlocked) && !window.confirm('Importar este archivo reemplazará tu borrador en este navegador. Si quieres conservarlo, cancela y descarga una copia primero. ¿Importar el archivo?')) return;
      flushText();
      state = incoming;
      if (!model.canVisit(state, state.step)) state.step = state.consent ? 1 : 0;
      writeBlocked = false;
      const saved = persist();
      render();
      message(saved ? '' : 'Archivo recuperado. El navegador no permite guardar los cambios; descarga una copia antes de cerrar.');
      document.getElementById('page-title').focus();
    } catch (error) { message(error.message); }
    finally { event.target.value = ''; }
  });
  document.getElementById('reset-button').addEventListener('click', () => {
    flushText();
    if (!window.confirm('Se reemplazará tu borrador por una respuesta nueva. Si quieres conservarlo, cancela y descarga una copia primero. ¿Comenzar otra respuesta?')) return;
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
      message('Hay cambios guardados desde otra pestaña. Aquí se ha detenido el guardado para no sobrescribirlos. Descarga una copia si quieres conservar lo que ves; después, recarga para recuperar los cambios de la otra pestaña.');
    }
  });
  render();
  if (writeBlocked) setSaveStatus(false);
  else if (restored.value) setSaveStatus(true);
  else document.getElementById('save-state').textContent = 'El guardado local comienza cuando respondes. También puedes descargar una copia.';
})();
