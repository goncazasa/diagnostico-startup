const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
test('progress API accepts only screen codes and signs aggregate events without personal data',async()=>{
 assert.ok(fs.existsSync('api/progress.mjs'),'Aggregate API must exist');
 const {createProgressHandler}=await import('../../api/progress.mjs');const sent=[];
 const handler=createProgressHandler({env:{GOOGLE_SHEETS_WEBHOOK_URL:'https://script.google.com/macros/s/test/exec',GOOGLE_SHEETS_SECRET:'test'},now:()=>new Date('2026-09-08T12:00:00Z'),fetchImpl:async(url,req)=>{sent.push(JSON.parse(req.body));return {ok:true,json:async()=>({ok:true})};}});
 async function call(body,origin='https://panel.test'){let status=200,result;await handler({method:'POST',headers:{host:'panel.test',origin,'content-type':'application/json'},body},{setHeader(){},status(n){status=n;return this;},json(x){result=x;return this;}});return {status,result};}
 assert.equal((await call({screen:'D1'})).status,200);
 assert.deepEqual(JSON.parse(sent[0].payload),{format:'expert-progress/2.0',screen:'D1',day:'2026-09-08'});
 assert.equal(sent[0].signature,crypto.createHmac('sha256','test').update(sent[0].payload).digest('hex'));
 for(const body of [{screen:'D1',email:'x@y.es'},{screen:'unknown'},{screen:'D1',responseId:'abc'}])assert.equal((await call(body)).status,400);
 assert.equal((await call({screen:'D1'},'https://evil.test')).status,403);assert.equal(sent.length,1);
});
