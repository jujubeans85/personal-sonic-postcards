// Run against a local static server. PLAYWRIGHT_MODULE and CHROMIUM_PATH are optional.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader']}: {})});
 const context=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(process.env.POSTCARD_TEST_URL||'http://127.0.0.1:8765'))external.push(r.url());});
 await page.addInitScript(()=>{globalThis.SpeechRecognition=class {constructor(){globalThis.testRecognition=this;}start(){this.onstart?.();}stop(){this.onend?.();}abort(){this.onend?.();}};Storage.prototype.setItem=()=>{throw Error('Persistence is forbidden');};indexedDB.open=()=>{throw Error('Persistence is forbidden');};});
 const base=process.env.POSTCARD_TEST_URL||'http://127.0.0.1:8765';await page.goto(base+'/collections/maker/?t=vintage-3');
 assert.equal(await page.locator('#styles button').count(),15);
 await page.locator('#speak-title').click();
 await page.evaluate(()=>{const result=[{transcript:'Love you Mimi'}];result.isFinal=true;const event={resultIndex:0,results:[result]};testRecognition.onresult(event);testRecognition.onresult(event);});
 assert.equal(await page.locator('#title').inputValue(),'Love you Mimi');
 await page.locator('#title').fill('MY WORDS');
 await page.evaluate(()=>{const result=[{transcript:'late words'}];result.isFinal=true;testRecognition.onresult({resultIndex:1,results:[null,result]});});
 assert.equal(await page.locator('#title').inputValue(),'MY WORDS');
 await page.locator('#title').fill('');await page.locator('#title').dispatchEvent('change');

 const photo=path.resolve('collections/print/fronts/front_cbo_01_A6_300dpi.jpg');await page.locator('#photo').setInputFiles(photo);await page.waitForFunction(()=>document.querySelector('#quality').textContent.includes('DPI'));
 const original=await page.locator('#preview').evaluate(c=>c.toDataURL());
 await page.locator('[data-style=vintage]').click();const treated=await page.locator('#preview').evaluate(c=>c.toDataURL());assert.notEqual(treated,original);
 await page.locator('#undo').click();assert.equal(await page.locator('#preview').evaluate(c=>c.toDataURL()),original);
 await page.locator('[data-style=deco]').click();
 await page.locator('#title').fill('KEEP THIS');await page.locator('#title').dispatchEvent('change');
 const hand=await page.locator('#preview').evaluate(c=>c.toDataURL());await page.locator('#font').selectOption('preset');assert.notEqual(await page.locator('#preview').evaluate(c=>c.toDataURL()),hand);await page.locator('#font').selectOption('adam-capture03');
 await page.locator('#sides').selectOption('both');await page.locator('#recipient').fill('For Mimi');await page.locator('#recipient').dispatchEvent('change');
 await page.locator('#message').fill('Some words arrive before you are ready for them.');await page.locator('#message').dispatchEvent('change');
 await page.locator('#collection-link').click();assert.equal(await page.locator('#qrURL').inputValue(),base+'/collections/?t=vintage-3');
 await page.locator('#view').selectOption('back');assert.equal(await page.locator('#status').innerText(),'');
 async function download(id,name){const wait=page.waitForEvent('download');await page.locator('#'+id).click();const d=await wait;const out=path.join(process.env.QA_OUTPUT||'/tmp',name);await d.saveAs(out);return out;}
 const saved=await download('save','postcard-test.juicecard'),savedData=JSON.parse(await fs.readFile(saved,'utf8'));assert.equal(savedData.project.style,'deco');assert.equal(savedData.project.font,'adam-capture03');assert.deepEqual(Buffer.from(savedData.photo.split(',')[1],'base64'),await fs.readFile(photo));
 const png=await download('png','postcard-back.png');assert.equal((await fs.readFile(png)).subarray(1,4).toString(),'PNG');
 const pdf=await download('pdf','postcard-print.pdf');assert.equal((await fs.readFile(pdf)).subarray(0,4).toString(),'%PDF');
 const {PDFDocument}=require('../shared/vendor/pdf-lib.min.js');const parsed=await PDFDocument.load(await fs.readFile(pdf));assert.equal(parsed.getPageCount(),2);assert.ok(Math.abs(parsed.getPage(0).getWidth()-210*72/25.4)<.01);
 await page.locator('#output').selectOption('card');await page.locator('#bleed').fill('3');await page.locator('#bleed').dispatchEvent('change');const custom=await download('pdf','postcard-bleed.pdf');const cardPDF=await PDFDocument.load(await fs.readFile(custom));assert.ok(Math.abs(cardPDF.getPage(0).getWidth()-154*72/25.4)<.01);assert.ok(Math.abs(cardPDF.getPage(0).getTrimBox().width-148*72/25.4)<.01);
 await page.locator('#output').selectOption('a4');
 const popupWait=page.waitForEvent('popup');await page.locator('#print').click();const popup=await popupWait;await popup.waitForLoadState();assert.equal(await popup.locator('img').evaluate(i=>i.style.width),'148mm');await popup.close();
 await page.locator('#clear').click();assert.match(await page.locator('#quality').innerText(),/No photo/);await page.locator('#open').setInputFiles(saved);await page.waitForFunction(()=>document.querySelector('#quality').textContent.includes('DPI'));assert.equal(await page.locator('#recipient').inputValue(),'For Mimi');
 await page.locator('#photo').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('bad')});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Previous photo kept'));assert.match(await page.locator('#quality').innerText(),/DPI/);
 await page.locator('#open').setInputFiles({name:'bad.juicecard',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({project:{schema:'other'}}))});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Current work kept'));
 await page.locator('#qrURL').fill('javascript:alert(1)');await page.locator('#qrURL').dispatchEvent('change');assert.equal(await page.locator('#png').isDisabled(),true);
 await page.locator('#collection-link').click();await page.locator('#view').selectOption('front');
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(process.env.QA_OUTPUT||'/tmp','postcard-desktop.png')});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(process.env.QA_OUTPUT||'/tmp','postcard-mobile.png')});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.reload();assert.match(await page.locator('#quality').innerText(),/No photo/);assert.equal(await page.locator('#recipient').inputValue(),'');
 await page.goto(base+'/collections/?t=vintage-3&profile=mmi#art');assert.match(await page.locator('#front').getAttribute('src'),/front3.jpg/);await page.locator('#choice').selectOption('vintage-4');assert.match(page.url(),/profile=mmi/);assert.match(page.url(),/#art$/);assert.equal(await page.locator('#make-card').getAttribute('href'),'maker/?t=vintage-4');
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);console.log('PASS: 15 presets, real photo, shared rendering, undo, QR, PNG, PDF, original-byte project roundtrip, invalid import/replacement, no persistence or external requests, mobile overflow, reload clearing, gallery routes.');
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
