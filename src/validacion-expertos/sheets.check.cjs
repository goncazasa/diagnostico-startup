const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const instrument = require('./instrument.js');
const model = require('./core.js').createModel(instrument);
function boot() {
  const tables = new Map(), props = { SHEET_ID: 'test', SHARED_SECRET: 'test-secret' };
  let failFlush = false, failAnalysis = false;
  function sheet(name) {
    if (name === 'Valoraciones' && failAnalysis) throw new Error('Analysis unavailable');
    if (!tables.has(name)) tables.set(name, []);
    const data = tables.get(name);
    return { getLastRow:()=>data.length, getMaxRows:()=>10000, getMaxColumns:()=>100,
      insertRowsAfter(){},insertColumnsAfter(){},setFrozenRows(){},
      clearContents(){data.length=0;},
      getDataRange:()=>({getValues:()=>data.map(r=>r.slice())}),
      getRange:(row,col,rows=1,cols=1)=>({
        getValues:()=>Array.from({length:rows},(_,i)=>Array.from({length:cols},(_,j)=>data[row-1+i]?.[col-1+j]??'')),
        setValues(values){values.forEach((r,i)=>r.forEach((v,j)=>{ data[row-1+i]??=[]; data[row-1+i][col-1+j]=v; }));}
      }) };
  }
  const book={getSheetByName:name=>tables.has(name)?sheet(name):null,insertSheet:sheet};
  const ctx={console, Date, JSON, Error, Object, String, Number, Array, Math,
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:(k,v)=>props[k]=v,deleteProperty:k=>delete props[k]})},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
    SpreadsheetApp:{openById:()=>book,flush(){if(failFlush)throw new Error('Write failed');}},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})},
    Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},
      computeDigest:(_,s)=>Array.from(crypto.createHash('sha256').update(s).digest()),
      computeHmacSha256Signature:(s,k)=>Array.from(crypto.createHmac('sha256',k).update(s).digest()),
      base64Encode:s=>Buffer.from(s).toString('base64'),base64Decode:s=>Buffer.from(s,'base64'),
      newBlob:b=>({getDataAsString:()=>Buffer.from(b).toString('utf8')})}
  };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync('google-apps-script/Code.gs','utf8'),ctx);
  function post(p,valid=true){const raw=JSON.stringify(p); const signature=valid?crypto.createHmac('sha256',props.SHARED_SECRET).update(raw).digest('hex'):'bad';return JSON.parse(ctx.doPost({postData:{contents:JSON.stringify({payload:raw,signature})}}).text);}
  return {ctx,tables,props,post,setFailFlush:v=>failFlush=v,setFailAnalysis:v=>failAnalysis=v};
}
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
  assert.equal(rows.length,28);
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
  assert.equal(x.tables.get('Entregas').length,2);assert.equal(x.tables.get('Valoraciones').length,28);
  assert.equal(x.props.ANALYSIS_PENDING,undefined);
});
test('large unicode observations round trip across archive cells',()=>{
  const x=boot(),p=payload();p.response.final.v9='ñ'.repeat(30000);
  assert.equal(x.post(p).ok,true);
  const cells=x.tables.get('Entregas')[1].slice(5);
  assert.ok(cells.length>1);assert.ok(cells.every(c=>c.length<=25000));
  assert.equal(JSON.parse(Buffer.from(cells.join(''),'base64').toString('utf8')).response.final.v9,p.response.final.v9);
});
