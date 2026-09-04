const { test } = require('node:test');
const assert = require('node:assert/strict');
const instrument = require('./instrument.js');
const model = require('./core.js').createModel(instrument);
function payload() {
  let state = model.createState('response-server-test');
  state.consent = true; state.profile.email = 'expert@example.org';
  state = model.sealInitial(state);
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
const env = { RESEND_API_KEY: 'test-key', RESEND_FROM: 'Panel <panel@example.org>' };
test('missing mail configuration fails without claiming receipt', async () => {
  const result = await run(payload(), { env: {} });
  assert.equal(result.statusCode, 503); assert.equal(result.body.ok, false);
});
test('server validates consent and scores before contacting the mail provider', async () => {
  for (const edit of [p => p.response.consent=false, p => p.response.items.T2.usability=8]) {
    const p = payload(); edit(p);
    const result = await run(p, { env, fetchImpl: async () => { assert.fail('Must not send invalid data'); } });
    assert.equal(result.statusCode, 400);
  }
});
test('delivery uses the fixed recipient, validated attachment and stable retry key', async () => {
  const sent=[];
  const options={env, fetchImpl: async (url, request) => { sent.push({url, ...request}); return {ok:true, json:async()=>({id:'mail-receipt-01'})}; }};
  const p=payload(); p.to='attacker@example.org'; p.instrument={fake:true};
  const first=await run(p,options);
  p.exportedAt='2027-01-01T00:00:00.000Z'; p.response.step=9;
  const second=await run(p,options);
  assert.equal(first.statusCode,200); assert.equal(first.body.receiptId,'mail-receipt-01'); assert.equal(second.body.ok,true);
  const mail=JSON.parse(sent[0].body);
  assert.deepEqual(mail.to,['luis.gonzalezc@urjc.es']); assert.equal(mail.reply_to,'expert@example.org');
  const attached=JSON.parse(Buffer.from(mail.attachments[0].content,'base64').toString('utf8'));
  assert.equal(attached.instrument.items.length,20); assert.equal(attached.response.items.T1.relevance,null);
  assert.equal(sent[0].headers['Idempotency-Key'],sent[1].headers['Idempotency-Key']);
});
test('provider failure or invalid acknowledgment never becomes a success', async () => {
  for (const fetchImpl of [async()=>({ok:false}), async()=>({ok:true,json:async()=>({})}), async()=>{throw new Error('Timeout');}]) {
    const result=await run(payload(),{env,fetchImpl}); assert.equal(result.statusCode,502); assert.equal(result.body.ok,false);
  }
});
test('endpoint rejects unsupported methods, cross-origin and oversized bodies', async () => {
  assert.equal((await run(payload(),{env},{method:'GET'})).statusCode,405);
  assert.equal((await run(payload(),{env},{headers:{'content-type':'application/json',host:'panel.example.org',origin:'https://other.example.org'}})).statusCode,403);
  assert.equal((await run('x'.repeat(1024*1024+1),{env})).statusCode,413);
});
