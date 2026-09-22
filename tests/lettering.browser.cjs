const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader']}: {})});
try{
 const page=await browser.newPage({viewport:{width:1024,height:1366}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.POSTCARD_TEST_URL||'http://127.0.0.1:8765';
 await page.goto(base+'/collections/maker/');await page.locator('#view-back').click();await page.locator('#message').fill('SOME WORDS STAY WITH YOU.');await page.waitForFunction(()=>!document.querySelector('#png').disabled);
 assert.equal(await page.locator('#view-back').getAttribute('aria-pressed'),'true');
 const renders=[];for(const name of ['original','outline','inflated','worn']){await page.locator(`[data-lettering=${name}]`).click();renders.push(await page.locator('#preview').evaluate(c=>c.toDataURL()));}assert.equal(new Set(renders).size,4);
 await page.locator('#view-front').click();const before=await page.locator('#preview').evaluate(c=>c.toDataURL());await page.locator('#message').fill('HELLO 🦄');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('no capture'));assert.equal(await page.locator('#preview').evaluate(c=>c.toDataURL()),before);assert.match(await page.locator('#status').innerText(),/Back text/);assert.ok(await page.locator('#png').isDisabled());
 await page.locator('#view-back').click();assert.match(await page.locator('#preview-state').innerText(),/last rendered front/);await page.locator('#message').fill('LOVE YOU');await page.waitForFunction(()=>!document.querySelector('#png').disabled);assert.match(await page.locator('#preview-state').innerText(),/Back preview/);
 const bounds=await page.locator('#view-back').boundingBox();assert.ok(bounds.height>=64);assert.ok(bounds.width>120);
 await page.locator('#qrEnabled').check();await page.locator('#qrURL').fill('https://example.org');await page.waitForFunction(()=>!document.querySelector('#png').disabled);
 const qr=[];for(const name of ['original','outline','inflated','worn']){await page.locator(`[data-lettering=${name}]`).click();qr.push(await page.locator('#qr-thumb').evaluate(c=>c.toDataURL()));}assert.equal(new Set(qr).size,1);
 await page.locator('[data-lettering=outline]').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(process.env.QA_OUTPUT||'/tmp','next-pass-back.png')});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto(base+'/collections/maker/lettering-proof.html');await page.waitForFunction(()=>document.querySelectorAll('#proofs canvas').length===4);await page.setViewportSize({width:1120,height:1100});await page.screenshot({path:path.join(process.env.QA_OUTPUT||'/tmp','lettering-proof.png'),fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS: four lettering appearances, unchanged QR, front/back switching, overflow preview recovery, 64px side controls, mobile layout and lettering proof');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
