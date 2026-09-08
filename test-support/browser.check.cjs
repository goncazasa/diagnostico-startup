const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.VALIDATION_PLAYWRIGHT || 'playwright');
const {boot}=require('./sheets-harness.cjs');
test('isolated browser: expert design, mandatory relevance, optional usability, archive and reload',async()=>{
 const sheets=boot(), requests=[],events=[],errors=[];
 const env={GOOGLE_SHEETS_WEBHOOK_URL:'https://script.google.com/macros/s/local-test/exec',GOOGLE_SHEETS_SECRET:'test-secret'};
 const fetchImpl=async(url,request)=>({ok:true,json:async()=>JSON.parse(sheets.ctx.doPost({postData:{contents:request.body}}).text)});
 const submit=(await import('../api/submit.mjs')).createHandler({env,fetchImpl});
 const progress=(await import('../api/progress.mjs')).createProgressHandler({env,fetchImpl});
 const server=http.createServer(async(req,res)=>{
  if(req.method==='POST') {const chunks=[];for await(const chunk of req)chunks.push(chunk);req.body=Buffer.concat(chunks).toString('utf8');
   res.status=n=>{res.statusCode=n;return res};res.json=obj=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(obj));return res;};
   if(req.url==='/api/submit'){requests.push(JSON.parse(req.body));return submit(req,res);}if(req.url==='/api/progress'){events.push(JSON.parse(req.body));return progress(req,res);}res.statusCode=404;return res.end();
  }
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync('public/index.html'));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 try {
  const page=await browser.newPage({viewport:{width:1320,height:900}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);assert.equal(events.length,0);
  await page.locator('#consent').check();await page.locator('[data-action="next"]').click();
  await page.locator('#profile-email').fill('prueba-local@example.org');await page.locator('#initial-text').fill('Experiencia previa a las preguntas.');
  await page.locator('[data-action="next"]').click();assert.equal(await page.locator('[data-screening-design]').count(),5);assert.equal(await page.locator('[data-context-metadata]').count(),2);
  assert.equal(await page.locator('[data-screening-design] input,[data-screening-design] select').count(),0);
  await page.locator('#designReview-screeningComment').fill('Las condiciones deben conservar las preguntas sobre caja.');
  const out=process.env.PLAYWRIGHT_OUTPUT||'output/playwright';fs.mkdirSync(out,{recursive:true});
  await page.screenshot({path:path.join(out,'v2-guide.png'),fullPage:true});
  await page.locator('[data-action="next"]').click();assert.equal(await page.locator('.item').count(),6);
  await page.locator('#step-nav [data-step="10"]').click();await page.locator('[data-action="submit"]').click();assert.equal(requests.length,0);assert.match(await page.locator('#submit-status').innerText(),/relevancia/);
  for(let step=3;step<=8;step++) {
   await page.locator('#step-nav [data-step="'+step+'"]').click();
   if(step===3) {await page.locator('#designReview-t3Example').selectOption('yes');await page.locator('#items-T4-skipReason').selectOption('experience');}
   if(step===4) {await page.locator('#dimensions-D2-skipReason').selectOption('prefer');continue;}
   for(const label of await page.locator('#app label:has(input[data-path$=".relevance"][value="3"])').all())if(await label.isVisible())await label.click();
   if(step===3){assert.ok(await page.locator('label[for="items-T3-usability-4"]').isVisible());await page.locator('label[for="items-T3-usability-4"]').click();}
  }
  await page.locator('#step-nav [data-step="9"]').click();assert.equal(await page.locator('[data-summary-item]').count(),24);
  await page.locator('input[data-path="designReview.discrimination"][value="C3"]').check();
  await page.locator('#designReview-discriminationComment').fill('La concentración puede cambiar con el periodo.');
  await page.setViewportSize({width:375,height:812});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(out,'v2-summary-mobile.png')});
  await page.locator('[data-action="next"]').click();await page.locator('#final-v9').fill('Prueba local del bloque A.');
  await page.locator('[data-action="submit"]').click();await page.waitForFunction(()=>document.querySelector('#submit-status').textContent.includes('se ha enviado'));
  assert.equal(requests.length,1);const p=requests[0];assert.equal(p.format,'expert-validation/2.0');assert.equal(p.instrument.items.length,24);
  assert.equal(p.response.items.C3.usability,null);assert.equal(p.response.items.T4.relevance,null);assert.equal(p.response.items.PM1.skipReason,'dimension');assert.deepEqual(p.response.designReview.discrimination,['C3']);
  assert.equal(sheets.tables.get('Entregas').length,2);assert.equal(sheets.tables.get('Valoraciones').length,31);assert.ok(sheets.tables.get('RevisionDiseno')[1].includes('yes'));
  assert.ok(events.length>0);assert.ok(events.every(e=>Object.keys(e).join(',')==='screen'));
  await page.reload();assert.ok(await page.locator('[data-action="submit"]').isDisabled());assert.equal(await page.locator('#final-v9').inputValue(),'Prueba local del bloque A.');
  assert.deepEqual(errors,[]);await page.screenshot({path:path.join(out,'v2-sent-mobile.png')});
 } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
});
