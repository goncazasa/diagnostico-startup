(function (root) {
  'use strict';
  const SCHEMA = 'expert-validation/2.1';
  const SKIPS = ['', 'experience', 'prefer', 'dimension'];
  const ROLES = ['Fundador/a', 'Inversor/a', 'Mentor/a o aceleradora', 'Académico/a', 'Consultor/a', 'Otro'];
  const PHASES = ['Idea', 'Validación', 'Primeras ventas', 'Repetición comercial', 'Escalado', 'Otra'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function check(condition, message) { if (!condition) throw new Error(message); }
  function text(value, max = 6000) { return typeof value === 'string' && value.length <= max; }
  function date(value) { return typeof value === 'string' && Number.isFinite(Date.parse(value)); }
  function rating(value) { return value === null || (Number.isInteger(value) && value >= 1 && value <= 4); }
  function validEmail(value) { return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+$/.test(value); }
  function list(value, allowed) { return Array.isArray(value) && new Set(value).size === value.length && value.every(x => allowed.includes(x)); }

  function createModel(instrument) {
    const dimIds = instrument.dimensions.map(d => d.id);
    const itemIds = instrument.items.map(i => i.id);
    const dimCriteria = ['relevance', 'coverage'];
    const itemCriteria = ['relevance', 'usability'];
    function createState(id, now = new Date().toISOString()) {
      return {
        schemaVersion: SCHEMA, instrumentVersion: instrument.version,
        responseId: id, createdAt: now, updatedAt: now, revision: 0, exportedRevision: -1,
        consent: false, step: 0, focusId: null, submission: null,
        profile: { email: '', name: '', roles: [], years: '', ventures: '', pivot: '', sectors: '', conflict: '', phases: [], phasesOther: '' },
        initial: { text: '', lockedAt: null },
        designReview: { screeningComment: '', discrimination: [], discriminationComment: '' },
        dimensions: Object.fromEntries(dimIds.map(id => [id, { relevance: null, coverage: null, skipReason: '', comment: '' }])),
        items: Object.fromEntries(itemIds.map(id => [id, { relevance: null, usability: null, skipReason: '', comment: '' }])),
        final: Object.fromEntries(['v2', 'v3', 'v9'].map(key => [key, '']))
      };
    }
    function validateState(candidate) {
      check(plain(candidate), 'El archivo no contiene una respuesta válida.');
      check(candidate.schemaVersion === SCHEMA && candidate.instrumentVersion === instrument.version, 'Este archivo pertenece a otra versión. Usa una copia exportada desde V2.1.');
      check(text(candidate.responseId, 100) && /^[a-zA-Z0-9_-]{8,100}$/.test(candidate.responseId), 'El identificador de respuesta no es válido.');
      check(date(candidate.createdAt) && date(candidate.updatedAt), 'Las fechas del archivo no son válidas.');
      check(Number.isSafeInteger(candidate.revision) && candidate.revision >= 0, 'La revisión no es válida.');
      check(Number.isSafeInteger(candidate.exportedRevision) && candidate.exportedRevision >= -1 && candidate.exportedRevision <= candidate.revision, 'La revisión exportada no es válida.');
      check(typeof candidate.consent === 'boolean', 'El consentimiento no es válido.');
      check(Number.isInteger(candidate.step) && candidate.step >= 0 && candidate.step <= dimIds.length + 4, 'La pantalla guardada no es válida.');
      const out = createState(candidate.responseId, candidate.createdAt);
      for (const key of ['updatedAt', 'revision', 'exportedRevision', 'consent', 'step']) out[key] = candidate[key];
      check(candidate.focusId == null || [...dimIds, ...itemIds].includes(candidate.focusId), 'La pregunta guardada no es válida.');
      out.focusId = candidate.focusId ?? null;
      if (candidate.submission != null) {
        const receipt = candidate.submission;
        check(plain(receipt) && text(receipt.id, 200) && receipt.id.length > 0 && date(receipt.at) && Number.isSafeInteger(receipt.revision) && receipt.revision >= 0 && receipt.revision <= candidate.revision, 'El justificante de envío no es válido.');
        out.submission = { id: receipt.id, at: receipt.at, revision: receipt.revision };
      }
      check(plain(candidate.profile) && plain(candidate.initial) && plain(candidate.dimensions) && plain(candidate.items) && plain(candidate.final), 'Faltan secciones en el archivo.');
      const p = candidate.profile;
      check(text(p.email, 254) && (p.email === '' || validEmail(p.email)), 'Introduce un correo electrónico válido.');
      check(text(p.name, 200), 'El nombre no es válido o supera 200 caracteres.');
      check(list(p.roles, ROLES) && list(p.phases, PHASES), 'El perfil contiene opciones desconocidas.');
      check(text(p.phasesOther, 200), 'El perfil contiene un texto demasiado largo.');
      check(p.years === '' || (typeof p.years === 'string' && /^\d{1,3}$/.test(p.years) && Number(p.years) <= 100), 'Los años de experiencia deben estar entre 0 y 100.');
      check(['', '0–10', '11–25', '26–50', '51–100', '>100'].includes(p.ventures), 'El número de startups no es válido.');
      check(['', 'Sí', 'No', 'Prefiero no responder'].includes(p.pivot), 'La experiencia de pivote no es válida.');
      for (const key of ['sectors', 'conflict']) check(text(p[key]), 'El texto del perfil es demasiado largo.');
      out.profile = { email: p.email, name: p.name, roles: [...p.roles], phases: [...p.phases], phasesOther: p.phasesOther, years: p.years, ventures: p.ventures, pivot: p.pivot, sectors: p.sectors, conflict: p.conflict };
      check(text(candidate.initial.text) && (candidate.initial.lockedAt === null || date(candidate.initial.lockedAt)), 'La mirada inicial no es válida.');
      out.initial = { text: candidate.initial.text, lockedAt: candidate.initial.lockedAt };
      const design = candidate.designReview;
      check(plain(design) && text(design.screeningComment) && text(design.discriminationComment), 'Falta la revisión del diseño o contiene texto demasiado largo.');
      check(list(design.discrimination, itemIds), 'La selección sobre discriminación contiene preguntas desconocidas o repetidas.');
      out.designReview = { screeningComment: design.screeningComment, discrimination: [...design.discrimination], discriminationComment: design.discriminationComment };
      for (const [kind, ids, criteria] of [['dimensions', dimIds, dimCriteria], ['items', itemIds, itemCriteria]]) {
        for (const id of ids) {
          const record = candidate[kind][id];
          check(plain(record), 'Falta la respuesta de ' + id + '.');
          check(SKIPS.includes(record.skipReason) && text(record.comment), 'La omisión o comentario de ' + id + ' no es válido.');
          out[kind][id].skipReason = record.skipReason;
          out[kind][id].comment = record.comment;
          for (const criterion of criteria) {
            check(rating(record[criterion]), 'La puntuación de ' + id + ' debe ser de 1 a 4 o estar vacía.');
            out[kind][id][criterion] = record[criterion];
          }
        }
      }
      for (const key of Object.keys(out.final)) {
        check(text(candidate.final[key]), 'Una respuesta final es demasiado larga o no es válida.');
        out.final[key] = candidate.final[key];
      }
      return out;
    }
    function edit(state, path, value) {
      check(Array.isArray(path) && path.length >= 1 && path.length <= 3 && !path.some(k => ['__proto__', 'prototype', 'constructor'].includes(k)), 'Campo desconocido.');
      const allowed = path[0] === 'consent' || ['profile', 'initial', 'items', 'dimensions', 'final', 'designReview'].includes(path[0]);
      check(allowed && (path[0] !== 'consent' || (path.length === 1 && typeof value === 'boolean')), 'Campo no editable.');
      check(path[0] !== 'initial' || (path[1] === 'text' && !state.initial.lockedAt), 'Tu criterio inicial ya está registrado. Puedes añadir ideas en el resumen.');
      const next = clone(state);
      let target = next;
      for (const part of path.slice(0, -1)) { check(plain(target[part]), 'Campo desconocido.'); target = target[part]; }
      const key = path[path.length - 1];
      check(Object.hasOwn(target, key), 'Campo desconocido.');
      if (JSON.stringify(target[key]) === JSON.stringify(value)) return state;
      target[key] = value;
      next.revision += 1;
      next.updatedAt = new Date().toISOString();
      return validateState(next);
    }
    function sealInitial(state) {
      check(state.consent, 'Acepta la participación antes de continuar.');
      check(validEmail(state.profile.email), 'Introduce tu correo electrónico para continuar.');
      if (state.initial.lockedAt) return state;
      const next = clone(state);
      next.initial.lockedAt = new Date().toISOString();
      next.revision++;
      next.updatedAt = next.initial.lockedAt;
      return next;
    }
    function canVisit(state, step) {
      return Number.isInteger(step) && step >= 0 && step <= dimIds.length + 4 && (step === 0 || (state.consent && (step === 1 || (!!state.initial.lockedAt && validEmail(state.profile.email)))));
    }
    function status(state, id) {
      const isDimension = dimIds.includes(id);
      const record = isDimension ? state.dimensions[id] : state.items[id];
      const item = instrument.items.find(i => i.id === id);
      if (record.skipReason || (!isDimension && state.dimensions[item.dim].skipReason)) return 'skipped';
      const answered = (isDimension ? dimCriteria : itemCriteria).filter(key => rating(record[key]) && record[key] !== null).length;
      return record.relevance !== null ? 'complete' : answered ? 'partial' : 'pending';
    }
    function deliveryIssues(state) {
      return [...dimIds, ...itemIds].filter(id => !['complete', 'skipped'].includes(status(state, id)));
    }
    // Design rules for the future founder instrument; the expert panel never filters its bank.
    function applicability(itemId, context = {}) {
      const item = instrument.items.find(item => item.id === itemId);
      check(!!item, 'Pregunta desconocida.');
      const rule = item.applicability;
      if (!rule?.field) return { status: 'applicable', reason: 'Se revisa en todas las rutas.' };
      if (typeof context[rule.field] !== 'boolean') return { status: 'needs_context', field: rule.field, reason: rule.question };
      return context[rule.field] ? { status: 'applicable', reason: rule.question } : { status: 'not_applicable', reason: rule.exclusion };
    }
    function summary(state, dimensionId) {
      const ids = dimensionId ? [dimensionId, ...instrument.items.filter(i => i.dim === dimensionId).map(i => i.id)] : [...dimIds, ...itemIds];
      const out = { complete: 0, partial: 0, skipped: 0, pending: 0, total: ids.length, resolved: 0 };
      for (const id of ids) out[status(state, id)]++;
      out.resolved = out.complete + out.skipped;
      return out;
    }
    function exportPayload(state, now = new Date().toISOString()) {
      check(state.consent, 'Acepta la participación antes de exportar tus respuestas.');
      check(validEmail(state.profile.email), 'Introduce tu correo electrónico en el perfil antes de entregar tus respuestas.');
      const response = validateState(state);
      for (const id of dimIds) if (response.dimensions[id].skipReason) for (const key of dimCriteria) response.dimensions[id][key] = null;
      for (const item of instrument.items) {
        const record = response.items[item.id];
        if (response.dimensions[item.dim].skipReason) record.skipReason = 'dimension';
        if (record.skipReason) {
          for (const key of itemCriteria) record[key] = null;
        }
      }
      response.exportedRevision = response.revision;
      return { format: SCHEMA, instrumentVersion: instrument.version, exportedAt: now, summary: summary(response), instrument: clone(instrument), response };
    }
    function importPayload(payload) {
      check(plain(payload) && payload.format === SCHEMA && payload.instrumentVersion === instrument.version, 'Selecciona una copia de V2.1. Las versiones anteriores tienen preguntas o criterios distintos y deben abrirse en su formulario original.');
      return validateState(payload.response);
    }
    function markExport(state) { return { ...state, exportedRevision: state.revision }; }
    function hasCurrentExport(state) { return state.exportedRevision >= 0 && state.exportedRevision === state.revision; }
    return { createState, validateState, edit, sealInitial, canVisit, status, summary, deliveryIssues, applicability, exportPayload, importPayload, markExport, hasCurrentExport, roles: ROLES, phases: PHASES, dimCriteria, itemCriteria };
  }
  function createRepository(storage, key) {
    return {
      load() { try { const raw = storage.getItem(key); return { ok: true, value: raw === null ? null : JSON.parse(raw) }; } catch (error) { return { ok: false, error: error.message }; } },
      save(value) { try { storage.setItem(key, JSON.stringify(value)); return { ok: true }; } catch (error) { return { ok: false, error: error.message }; } }
    };
  }
  const api = { createModel, createRepository };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ValidationCore = api;
})(globalThis);
