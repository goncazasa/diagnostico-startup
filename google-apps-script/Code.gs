/* Bound Google Apps Script. Run configurar once, then deploy as a web app.
 * Entregas is the immutable source. Other tabs are replaceable analysis views.
 * Never add secrets to this file; use Script Properties.
 */
const ARCHIVE_CHUNKS = 60;
const CHUNK_SIZE = 25000;

function configurar() {
  const props = PropertiesService.getScriptProperties();
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('Abra este proyecto desde Extensiones > Apps Script en su hoja.');
  props.setProperty('SHEET_ID', book.getId());
  if (!props.getProperty('SHARED_SECRET')) props.setProperty('SHARED_SECRET', Utilities.getUuid() + Utilities.getUuid());
  ensureArchive_(book);
  SpreadsheetApp.flush();
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Validación de expertos')
    .addItem('Actualizar tablas de análisis', 'actualizarAnalisis').addToUi();
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function hex_(bytes) { return bytes.map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join(''); }
function digest_(raw) { return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8)); }
function equal_(a, b) {
  if (typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function doPost(e) {
  let lock;
  try {
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty('SHARED_SECRET'), sheetId = props.getProperty('SHEET_ID');
    const content = e && e.postData && e.postData.contents;
    if (!secret || !sheetId || !content || content.length > 2000000) return json_({ok:false});
    const envelope = JSON.parse(content);
    if (typeof envelope.payload !== 'string' || envelope.payload.length > 1048576) return json_({ok:false});
    const signature = hex_(Utilities.computeHmacSha256Signature(envelope.payload, secret, Utilities.Charset.UTF_8));
    if (!equal_(signature, envelope.signature)) return json_({ok:false});
    // Full validation happens in the trusted Vercel function before signing.
    const payload = JSON.parse(envelope.payload), response = payload.response;
    if (!response || !response.consent || !response.initial.lockedAt || !payload.instrument.items || payload.format !== 'expert-validation/1.8') return json_({ok:false});
    const receiptId = 'sheets-' + digest_(envelope.payload);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) return json_({ok:false});
    const book = SpreadsheetApp.openById(sheetId), archive = ensureArchive_(book);
    const count = archive.getLastRow();
    const exists = count > 1 && archive.getRange(2, 1, count - 1, 1).getValues().some(r => r[0] === receiptId);
    if (!exists) {
      const encoded = Utilities.base64Encode(envelope.payload, Utilities.Charset.UTF_8);
      const chunks = encoded.match(new RegExp('.{1,' + CHUNK_SIZE + '}', 'g')) || [];
      if (chunks.length > ARCHIVE_CHUNKS) return json_({ok:false});
      const row = [receiptId, response.responseId, payload.instrumentVersion, response.revision, new Date().toISOString()]
        .concat(chunks, Array(ARCHIVE_CHUNKS - chunks.length).fill(''));
      ensureSize_(archive, count + 1, row.length);
      props.setProperty('ANALYSIS_PENDING', 'true');
      archive.getRange(count + 1, 1, 1, row.length).setValues([row.map(safeCell_)]);
    }
    // A receipt means the original is durably stored, even if analysis needs repair.
    SpreadsheetApp.flush();
    if (!exists || props.getProperty('ANALYSIS_PENDING')) {
      try { rebuild_(book); SpreadsheetApp.flush(); props.deleteProperty('ANALYSIS_PENDING'); }
      catch (error) { props.setProperty('ANALYSIS_PENDING', 'true'); console.error('Actualizar tablas de análisis desde el menú.'); }
    }
    return json_({ok:true, receiptId:receiptId});
  } catch (error) { return json_({ok:false}); }
  finally { if (lock) lock.releaseLock(); }
}

function ensureSize_(sheet, rows, cols) {
  if (sheet.getMaxRows() < rows) sheet.insertRowsAfter(sheet.getMaxRows(), rows - sheet.getMaxRows());
  if (sheet.getMaxColumns() < cols) sheet.insertColumnsAfter(sheet.getMaxColumns(), cols - sheet.getMaxColumns());
}
function ensureArchive_(book) {
  const sheet = book.getSheetByName('Entregas') || book.insertSheet('Entregas');
  if (!sheet.getLastRow()) {
    const header = ['entrega_id','participante_id','version','revision','recibida_utc']
      .concat(Array.from({length:ARCHIVE_CHUNKS}, (_,i) => 'json_base64_' + (i + 1)));
    ensureSize_(sheet, 1, header.length);
    sheet.getRange(1,1,1,header.length).setValues([header]); sheet.setFrozenRows(1);
  }
  return sheet;
}
// Escape untrusted spreadsheet formulas without changing numeric measurements.
function safeCell_(value) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return value;
  return /^[\s\u0000-\u001f]*[=+@-]/.test(value) || /^['\t\r\n]/.test(value) ? "'" + value : value;
}
function writeTable_(book, name, rows) {
  const sheet = book.getSheetByName(name) || book.insertSheet(name);
  ensureSize_(sheet, rows.length, rows[0].length);
  sheet.clearContents();
  sheet.getRange(1,1,rows.length,rows[0].length).setValues(rows.map(row => row.map(safeCell_)));
  sheet.setFrozenRows(1);
}
function actualizarAnalisis() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Hay una entrega en curso. Inténtelo de nuevo.');
  const props = PropertiesService.getScriptProperties();
  try {
    props.setProperty('ANALYSIS_PENDING','true');
    rebuild_(SpreadsheetApp.openById(props.getProperty('SHEET_ID')));
    SpreadsheetApp.flush(); props.deleteProperty('ANALYSIS_PENDING');
  } finally { lock.releaseLock(); }
}
function rebuild_(book) {
  const latest = Object.create(null), instruments = Object.create(null);
  const archive = ensureArchive_(book).getDataRange().getValues().slice(1);
  archive.forEach(row => {
    const raw = Utilities.newBlob(Utilities.base64Decode(row.slice(5).join(''))).getDataAsString('UTF-8');
    if ('sheets-' + digest_(raw) !== row[0]) throw new Error('La entrega archivada no coincide con su huella.');
    const p = JSON.parse(raw), s = p.response, key = JSON.stringify([p.instrumentVersion,s.responseId]);
    instruments[p.instrumentVersion] = p.instrument;
    // Older offline submissions cannot replace a newer revision.
    // Equal revisions resolve to the most recently received; all originals remain.
    if (!latest[key] || s.revision >= latest[key].payload.response.revision) latest[key] = {payload:p,id:row[0],at:row[4]};
  });
  const base = ['participante_id','version','revision','entrega_id','recibida_utc'];
  const ratings = [base.concat(['tipo','dimension_id','elemento_id','texto','relevancia','claridad_y_respuestas','cobertura','motivo_omision','observaciones'])];
  const contacts = [base.concat(['correo','nombre','roles','anos_experiencia','numero_proyectos','experiencia_pivote','sectores','conflicto_interes','fases'])];
  const responses = [base.concat(['consentimiento','creada_utc','actualizada_utc','opinion_inicial','opinion_bloqueada_utc','global_v2','global_v3','observacion_final','juicios_contestados','juicios_posibles'])];
  const dictionary = [['version','tipo','dimension_id','elemento_id','texto','nota','aplicabilidad','niveles_emprendedor','criterios_experto']];
  Object.keys(latest).sort().forEach(key => {
    const entry = latest[key], p = entry.payload, s = p.response, ins = p.instrument, profile = s.profile;
    const common = [s.responseId,p.instrumentVersion,s.revision,entry.id,entry.at];
    let answered = 0;
    ins.dimensions.forEach(d => {
      const a = s.dimensions[d.id];
      const rel = a.skipReason ? null : a.relevance, coverage = a.skipReason ? null : a.coverage;
      answered += Number(rel !== null) + Number(coverage !== null);
      ratings.push(common.concat(['dimension',d.id,d.id,d.name,rel,null,coverage,a.skipReason,a.comment]));
    });
    ins.items.forEach(item => {
      const a = s.items[item.id];
      const rel = a.skipReason ? null : a.relevance, usability = a.skipReason ? null : a.usability;
      answered += Number(rel !== null) + Number(usability !== null);
      ratings.push(common.concat(['pregunta',item.dim,item.id,item.q,rel,usability,null,a.skipReason,a.comment]));
    });
    contacts.push(common.concat([profile.email,profile.name,profile.roles.join(' | '),profile.years,profile.ventures,profile.pivot,profile.sectors,profile.conflict,profile.phases.join(' | ')]));
    responses.push(common.concat([s.consent,s.createdAt,s.updatedAt,s.initial.text,s.initial.lockedAt,s.final.v2,s.final.v3,s.final.v9,answered,2*(ins.dimensions.length+ins.items.length)]));
  });
  Object.keys(instruments).sort().forEach(version => {
    const ins=instruments[version];
    ins.dimensions.forEach(d => dictionary.push([version,'dimension',d.id,d.id,d.name,d.desc,'','','Relevancia y cobertura: 1–4; vacío = sin respuesta.']));
    ins.items.forEach(i => dictionary.push([version,'pregunta',i.dim,i.id,i.q,i.note,i.applicabilityNote || '',i.levels.map((level,n)=>n+': '+level).join('\n'),JSON.stringify(ins.expertCriteria)]));
  });
  writeTable_(book,'Valoraciones',ratings);
  writeTable_(book,'Participantes',contacts);
  writeTable_(book,'Respuestas',responses);
  writeTable_(book,'Diccionario',dictionary);
}
