import { createHash, createHmac } from 'node:crypto';
import core from '../src/validacion-expertos/core.js';
import instrument from '../src/validacion-expertos/instrument.js';

const model = core.createModel(instrument);
const MAX_BYTES = 1024 * 1024;

export function createHandler({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return async function submit(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const fail = (code, error) => res.status(code).json({ ok: false, error });
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return fail(405, 'Método no permitido.'); }
    if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return fail(415, 'Se requiere JSON.');
    if (req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host) return fail(403, 'Origen no permitido.');
      } catch { return fail(403, 'Origen no permitido.'); }
    }
    let payload;
    try {
      const raw = typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
      if (!raw) return fail(400, 'Faltan las respuestas.');
      if (Buffer.byteLength(raw, 'utf8') > MAX_BYTES) return fail(413, 'La respuesta supera el tamaño permitido.');
      const incoming = JSON.parse(raw);
      if (incoming.format !== 'expert-validation/1.9' || incoming.instrumentVersion !== instrument.version) return fail(400, 'Versión de formulario no compatible.');
      const state = model.validateState(incoming.response);
      if (!state.initial.lockedAt) return fail(400, 'Complete el inicio del formulario.');
      // Only validated answers and the server's instrument enter the archive.
      // Navigation, client receipts and export time must not change a retry key.
      state.step = 10; state.focusId = null; state.submission = null;
      payload = model.exportPayload(state, state.updatedAt);
    } catch { return fail(400, 'Revise el formato y los campos de su respuesta.'); }
    if (!env.GOOGLE_SHEETS_SECRET || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(env.GOOGLE_SHEETS_WEBHOOK_URL || '')) return fail(503, 'El envío aún no está configurado. Sus respuestas siguen en este navegador.');
    const serialized = JSON.stringify(payload);
    const receiptId = 'sheets-' + createHash('sha256').update(serialized).digest('hex');
    const body = JSON.stringify({ payload: serialized, signature: createHmac('sha256', env.GOOGLE_SHEETS_SECRET).update(serialized).digest('hex') });
    try {
      const response = await fetchImpl(env.GOOGLE_SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body, signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) return fail(502, 'No se ha podido confirmar el envío. Puede reintentarlo.');
      const data = await response.json();
      if (data.ok !== true || data.receiptId !== receiptId) return fail(502, 'No se ha recibido confirmación del guardado.');
      return res.status(200).json({ ok: true, receiptId });
    } catch { return fail(502, 'No se ha podido confirmar el envío. Puede reintentarlo.'); }
  };
}

export default createHandler();
