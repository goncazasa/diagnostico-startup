const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash, createHmac } = require('node:crypto');
const instrument = require('./instrument.js');
const model = require('./core.js').createModel(instrument);
function payload() {
  let state = model.createState('response-server-test');
  state.consent = true; state.profile.email = 'expert@example.org';
  state = model.sealInitial(state);
  for(const a of [...Object.values(state.items), ...Object.values(state.dimensions)]) a.relevance=3;
  state.items.T1.relevance = 4; state.items.T1.skipReason = 'experience';
  return model.exportPayload(state);
}
async function run(body, options = {}, request = {}) {
  const { createHandler } = await import('../../api/submit.mjs');
  const handler = createHandler(options);
  const result = { headers: {}, statusCode: 200, body: null };
  const res = { setHeader(k,v) { result.headers[k]=v; }, status(code) { result.statusCode=code; return this; }, json(body) { result.body=body; return this; } };
  await handler({ method: 'POST', headers: { 'content-type': 'application/json', host: 'panel.example.org', origin: 'https://panel.example.org' }, body, ...request }, res);
  return result;
}
const env = { GOOGLE_SHEETS_WEBHOOK_URL: 'https://script.google.com/macros/s/test/exec', GOOGLE_SHEETS_SECRET: 'test-secret-not-a-real-credential' };
test('missing Sheets configuration fails without claiming receipt', async () => {
  const result = await run(payload(), { env: {} });
  assert.equal(result.statusCode, 503); assert.equal(result.body.ok, false);
});
test('server validates consent and scores before contacting Sheets', async () => {
  for (const edit of [p => p.response.consent=false, p => p.response.items.T2.usability=8]) {
    const p = payload(); edit(p);
    const result = await run(p, { env, fetchImpl: async () => { assert.fail('Must not send invalid data'); } });
    assert.equal(result.statusCode, 400);
  }
});
test('delivery signs validated data and verifies a stable content receipt', async () => {
  const sent=[];
  const options={env, fetchImpl: async (url, request) => { sent.push({url, ...request}); const data=JSON.parse(request.body); return {ok:true, json:async()=>({ok:true,receiptId:'sheets-'+createHash('sha256').update(data.payload).digest('hex')})}; }};
  const p=payload(); p.to='attacker@example.org'; p.instrument={fake:true};
  const first=await run(p,options);
  p.exportedAt='2027-01-01T00:00:00.000Z'; p.response.step=9;
  const second=await run(p,options);
  assert.equal(first.statusCode,200); assert.match(first.body.receiptId,/^sheets-[a-f0-9]{64}$/); assert.equal(second.body.ok,true);
  const envelope=JSON.parse(sent[0].body);
  assert.equal(sent[0].url,env.GOOGLE_SHEETS_WEBHOOK_URL);
  assert.equal(envelope.signature,createHmac('sha256',env.GOOGLE_SHEETS_SECRET).update(envelope.payload).digest('hex'));
  const attached=JSON.parse(envelope.payload);
  assert.equal(attached.instrument.items.length,21); assert.equal(attached.response.items.T1.relevance,null);
  assert.equal(sent[0].body,sent[1].body);
  assert.equal(attached.response.profile.email,'expert@example.org');
});
test('provider failure or invalid acknowledgment never becomes a success', async () => {
  for (const fetchImpl of [async()=>({ok:false}), async()=>({ok:true,json:async()=>({})}), async()=>({ok:true,json:async()=>({ok:true,receiptId:'sheets-wrong'})}), async()=>{throw new Error('Timeout');}]) {
    const result=await run(payload(),{env,fetchImpl}); assert.equal(result.statusCode,502); assert.equal(result.body.ok,false);
  }
});
test('endpoint rejects unsupported methods, cross-origin and oversized bodies', async () => {
  assert.equal((await run(payload(),{env},{method:'GET'})).statusCode,405);
  assert.equal((await run(payload(),{env},{headers:{'content-type':'application/json',host:'panel.example.org',origin:'https://other.example.org'}})).statusCode,403);
  assert.equal((await run('x'.repeat(1024*1024+1),{env})).statusCode,413);
});

test('missing relevance is rejected by the server even if the client bypasses its form',async()=>{const p=payload();p.response.items.VB4.relevance=null;const r=await run(p,{env,fetchImpl:async()=>assert.fail('No send')});assert.equal(r.statusCode,400);assert.deepEqual(r.body.missing,['VB4']);});
