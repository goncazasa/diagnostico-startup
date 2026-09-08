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
    if (payload.format === 'expert-progress/2.0') return recordProgress_(payload, sheetId);
    if (!response || !response.consent || !response.initial.lockedAt || !payload.instrument.items || payload.format !== 'expert-validation/2.1' || payload.instrumentVersion !== '2.1.0' || payload.instrument.version !== '2.1.0' || response.schemaVersion !== payload.format || response.instrumentVersion !== payload.instrumentVersion) return json_({ok:false});
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
function isTestingResponse_(response) {
  const profile = response && response.profile || {};
  return /^testing[-_]/i.test(response && response.responseId || '') ||
    /DATOS DE TESTING/i.test(profile.name || '') ||
    /^(datos[.]testing|testing[.+_-])/i.test(profile.email || '');
}
function average_(values) {
  const valid = values.filter(value => Number.isFinite(value));
  return valid.length ? Math.round(valid.reduce((sum,value) => sum + value, 0) / valid.length * 100) / 100 : '';
}
function summaryRows_(latest, instruments) {
  const entries = Object.keys(latest).map(key => latest[key].payload).filter(payload => payload.instrumentVersion === '2.1.0');
  const real = entries.filter(payload => !isTestingResponse_(payload.response));
  const testing = entries.filter(payload => isTestingResponse_(payload.response));
  const selected = real.length ? real : testing;
  const instrument = instruments['2.1.0'];
  const rows = [
    ['Panel de resultados · Validación de expertos','','','','',''],
    [real.length ? 'Resultados académicos: los registros de prueba están excluidos.' : 'VISTA DEMOSTRATIVA · Todavía no hay respuestas reales. Se muestran únicamente datos de prueba.','','','','',''],
    ['Indicador','Valor','Cómo interpretarlo','','',''],
    ['Respuestas recibidas',entries.length,'Última revisión recibida de cada participante.','','',''],
    ['Participantes reales',real.length,'Se utilizan en los cálculos académicos.','','',''],
    ['Registros de prueba',testing.length,'Sirven para comprobar el funcionamiento y no entran en la validez de contenido.','','',''],
    ['','','','','',''],
    ['Resultados por dimensión','','','','',''],
    ['Dimensión','N','Relevancia media','Cobertura media','Lectura','Datos mostrados']
  ];
  if (!instrument || !selected.length) rows.push(['Sin datos','','','','','']);
  else instrument.dimensions.forEach(dimension => {
    const records = selected.map(payload => payload.response.dimensions[dimension.id]).filter(record => record && !record.skipReason);
    const relevance = average_(records.map(record => record.relevance));
    const coverage = average_(records.map(record => record.coverage));
    const combined = average_([relevance,coverage]);
    const reading = combined === '' ? 'Sin datos' : combined >= 3.5 ? 'Muy favorable' : combined >= 3 ? 'Favorable' : combined >= 2.5 ? 'Revisar' : 'Prioritaria';
    rows.push([dimension.name,records.length,relevance,coverage,reading,real.length ? 'Reales' : 'Prueba']);
  });
  rows.push(['','','','','',''],['Resultados por pregunta','','','','',''],['Pregunta','Dimensión','N','Relevancia media','Claridad media','Lectura']);
  if (instrument && selected.length) instrument.items.map(item => {
    const records = selected.map(payload => payload.response.items[item.id]).filter(record => record && !record.skipReason);
    const relevance = average_(records.map(record => record.relevance));
    const usability = average_(records.map(record => record.usability));
    const combined = average_([relevance,usability]);
    return {item, n:records.length, relevance, usability, combined};
  }).sort((a,b) => (a.combined === '' ? 99 : a.combined) - (b.combined === '' ? 99 : b.combined)).forEach(result => {
    const reading = result.combined === '' ? 'Sin datos' : result.combined >= 3.5 ? 'Muy favorable' : result.combined >= 3 ? 'Favorable' : result.combined >= 2.5 ? 'Revisar' : 'Prioritaria';
    rows.push([result.item.id + ' · ' + result.item.q,result.item.dim,result.n,result.relevance,result.usability,reading]);
  });
  return rows;
}
function formatWorkbook_(book) {
  const tableNames = ['Valoraciones','Participantes','Respuestas','Diccionario','RevisionDiseno','DisenoInstrumento','ValidezContenido','Recorrido'];
  tableNames.forEach(name => {
    const sheet = book.getSheetByName(name);
    if (!sheet || !sheet.getLastColumn || !sheet.getLastRow) return;
    const rows = sheet.getLastRow(), columns = sheet.getLastColumn();
    if (!rows || !columns) return;
    sheet.setFrozenRows(1);
    sheet.getDataRange().setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle');
    sheet.getRange(1,1,1,columns).setBackground('#17324d').setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
    if (sheet.getFilter()) sheet.getFilter().remove();
    if (rows > 1) sheet.getRange(1,1,rows,columns).createFilter();
    sheet.autoResizeColumns(1,columns);
    for (let column=1; column<=columns; column++) sheet.setColumnWidth(column,Math.min(sheet.getColumnWidth(column),320));
    sheet.setTabColor('#6b8e7d');
  });
  const summary = book.getSheetByName('Resumen');
  if (!summary || !summary.getLastColumn) return;
  const rows = summary.getLastRow(), columns = summary.getLastColumn();
  summary.setFrozenRows(2); summary.setHiddenGridlines(true); summary.setTabColor('#d49a3a');
  summary.getDataRange().setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle').setWrap(true);
  summary.getRange(1,1,1,columns).setBackground('#17324d').setFontColor('#ffffff').setFontSize(18).setFontWeight('bold');
  summary.getRange(2,1,1,columns).setBackground('#f4ead7').setFontColor('#6b4e20').setFontWeight('bold');
  [3,9,17,18].filter(row => row <= rows).forEach(row => summary.getRange(row,1,1,columns).setBackground('#dce8e2').setFontColor('#17324d').setFontWeight('bold'));
  summary.setColumnWidth(1,430); summary.setColumnWidth(2,130); summary.setColumnWidth(3,160); summary.setColumnWidth(4,160); summary.setColumnWidth(5,150); summary.setColumnWidth(6,140);
  summary.setRowHeight(1,42); summary.setRowHeight(2,38);
  const rules = [
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Prioritaria').setBackground('#f8d7da').setFontColor('#842029').setRanges([summary.getRange(1,6,rows,1),summary.getRange(1,5,rows,1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Revisar').setBackground('#fff3cd').setFontColor('#664d03').setRanges([summary.getRange(1,6,rows,1),summary.getRange(1,5,rows,1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Muy favorable').setBackground('#d1e7dd').setFontColor('#0f5132').setRanges([summary.getRange(1,6,rows,1),summary.getRange(1,5,rows,1)]).build()
  ];
  summary.setConditionalFormatRules(rules);
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
  const base = ['participante_id','version','revision','entrega_id','recibida_utc','es_testing'];
  const ratings = [base.concat(['tipo','dimension_id','elemento_id','texto','relevancia','claridad_y_respuestas','cobertura','motivo_omision','observaciones'])];
  const contacts = [base.concat(['correo','nombre','roles','anos_experiencia','numero_proyectos','experiencia_pivote','sectores','conflicto_interes','fases','fases_otra'])];
  const responses = [base.concat(['consentimiento','creada_utc','actualizada_utc','opinion_inicial','opinion_bloqueada_utc','global_v2','global_v3','observacion_final','juicios_contestados','juicios_posibles'])];
  const dictionary = [['version','tipo','dimension_id','elemento_id','texto','nota','aplicabilidad','niveles_emprendedor','criterios_experto']];
  const designReviews = [base.concat(['observacion_cribado','posible_falta_discriminacion','observacion_discriminacion'])];
  const instrumentDesign = [['version','tipo','elemento_id','definicion_json']];
  Object.keys(latest).sort().forEach(key => {
    const entry = latest[key], p = entry.payload, s = p.response, ins = p.instrument, profile = s.profile;
    const common = [s.responseId,p.instrumentVersion,s.revision,entry.id,entry.at,isTestingResponse_(s)];
    if (s.designReview) designReviews.push(common.concat([s.designReview.screeningComment,s.designReview.discrimination.join(' | '),s.designReview.discriminationComment]));
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
    contacts.push(common.concat([profile.email,profile.name,profile.roles.join(' | '),profile.years,profile.ventures,profile.pivot,profile.sectors,profile.conflict,profile.phases.join(' | '),profile.phasesOther||'']));
    responses.push(common.concat([s.consent,s.createdAt,s.updatedAt,s.initial.text,s.initial.lockedAt,s.final.v2,s.final.v3,s.final.v9,answered,2*(ins.dimensions.length+ins.items.length)]));
  });
  Object.keys(instruments).sort().forEach(version => {
    const ins=instruments[version];
    ins.dimensions.forEach(d => dictionary.push([version,'dimension',d.id,d.id,d.name,d.desc,'','','Relevancia y cobertura: 1–4; vacío = sin respuesta.']));
    ins.items.forEach(i => {
      dictionary.push([version,'pregunta',i.dim,i.id,i.q,i.note,[i.conditional,i.applicabilityNote].filter(Boolean).join('\n'),i.levels.map((level,n)=>n+': '+level).join('\n'),JSON.stringify(ins.expertCriteria)]);
      if (i.applicability) instrumentDesign.push([version,'reglas_item',i.id,JSON.stringify({applicability:i.applicability,designFields:i.designFields,sources:i.sources})]);
    });
    (ins.screening || []).forEach(f => instrumentDesign.push([version,'cribado',f.id,JSON.stringify(f)]));
    (ins.contextMetadata || []).forEach(f => instrumentDesign.push([version,'metadato_no_puntuado',f.id,JSON.stringify(f)]));
  });
  writeTable_(book,'Valoraciones',ratings);
  writeTable_(book,'Participantes',contacts);
  writeTable_(book,'Respuestas',responses);
  writeTable_(book,'Diccionario',dictionary);
  writeTable_(book,'RevisionDiseno',designReviews);
  writeTable_(book,'DisenoInstrumento',instrumentDesign);
  writeTable_(book,'ValidezContenido',contentValidity_(latest,instruments));
  writeTable_(book,'Resumen',summaryRows_(latest,instruments));
  try { formatWorkbook_(book); } catch (error) { console.error('No se pudo aplicar el formato visual: ' + error.message); }
}

function contentValidity_(latest, instruments) {
  const rows = [['version','elemento_id','n_validas','n_relevantes','cvi','decision','omisiones']];
  Object.keys(instruments).filter(version => version === '2.1.0').forEach(version => {
    const ins = instruments[version], entries = Object.keys(latest).map(k => latest[k].payload).filter(p => p.instrumentVersion === version && !isTestingResponse_(p.response));
    const results = ins.items.map(item => {
      const valid = entries.filter(p => !p.response.dimensions[item.dim].skipReason && !p.response.items[item.id].skipReason && Number.isInteger(p.response.items[item.id].relevance) && p.response.items[item.id].relevance >= 1 && p.response.items[item.id].relevance <= 4);
      const positive = valid.filter(p => p.response.items[item.id].relevance >= 3).length;
      const omitted = entries.filter(p => p.response.dimensions[item.dim].skipReason || p.response.items[item.id].skipReason).length;
      const cvi = valid.length ? positive / valid.length : null;
      rows.push([version,item.id,valid.length,positive,cvi,valid.length < 6 ? 'datos insuficientes' : cvi >= 0.78 ? 'umbral alcanzado' : 'revisar',omitted]);
      return {n:valid.length,cvi};
    });
    const enough = results.length > 0 && results.every(r => r.n >= 6);
    const average = enough ? results.reduce((sum,r) => sum+r.cvi,0)/results.length : null;
    rows.push([version,'S-CVI/Ave',entries.length,null,average,!enough ? 'datos insuficientes en uno o más ítems' : average >= 0.90 ? 'umbral global alcanzado; revisar resultados por ítem' : 'revisar',null]);
  });
  return rows;
}

function recordProgress_(payload, sheetId) {
  const allowed = ['intro','profile','guide','D1','D2','D3','D4','D5','D6','review','final','completed'];
  if (Object.keys(payload).sort().join(',') !== 'day,format,screen' || !allowed.includes(payload.screen) || !/^\d{4}-\d{2}-\d{2}$/.test(payload.day)) return json_({ok:false});
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return json_({ok:false});
  try {
    const book = SpreadsheetApp.openById(sheetId), sheet = book.getSheetByName('Recorrido') || book.insertSheet('Recorrido');
    if (!sheet.getLastRow()) sheet.getRange(1,1,1,3).setValues([['dia_utc','pantalla','eventos_recibidos']]);
    const rows = sheet.getDataRange().getValues(), index = rows.findIndex((r,i) => i > 0 && r[0] === payload.day && r[1] === payload.screen);
    if (index >= 0) sheet.getRange(index+1,3).setValues([[Number(rows[index][2])+1]]);
    else { ensureSize_(sheet,rows.length+1,3); sheet.getRange(rows.length+1,1,1,3).setValues([[payload.day,payload.screen,1]]); }
    SpreadsheetApp.flush(); return json_({ok:true});
  } finally { lock.releaseLock(); }
}
