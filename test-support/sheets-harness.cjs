const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
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
module.exports={boot};
