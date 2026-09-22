const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader']}: {})});
try{
 const ctx=await browser.newContext({viewport:{width:1024,height:1366},acceptDownloads:true}),page=await ctx.newPage();page.setDefaultTimeout(15000);const errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:8765'))external.push(r.url());});
 await page.addInitScript(()=>{window.SpeechRecognition=window.webkitSpeechRecognition=class{constructor(){throw Error('Microphone should not start');}};});
 await page.goto('http://127.0.0.1:8765/collections/maker/');
 await page.locator('#font').selectOption('preset');
 await page.locator('#photo').setInputFiles(path.resolve('collections/print/fronts/front_cbo_01_A6_300dpi.jpg'));
 await page.waitForFunction(()=>document.querySelector('#quality').textContent.includes('DPI'));
 const pixels=()=>page.locator('#preview').evaluate(c=>c.toDataURL());const original=await pixels();
 const alpha=await page.locator('#preview').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return [d[3],d.filter((v,i)=>i%4===3&&v>0).length];});assert.equal(alpha[0],0);assert.ok(alpha[1]>10000);
 await page.locator('[data-style=floyde]').click();
 await page.locator('#intensity').evaluate(e=>{e.value=0;e.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForFunction(()=>document.querySelector('#strength-value').textContent==='0%');assert.equal(await pixels(),original);
 await page.locator('#intensity').evaluate(e=>{e.value=100;e.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForFunction(()=>document.querySelector('#strength-value').textContent==='100%');assert.notEqual(await pixels(),original);
 const full=await pixels();await page.locator('#stock').selectOption('recycled');assert.equal(await pixels(),full);
 await page.locator('#qrEnabled').check();assert.ok(await page.locator('#qr-thumb').isVisible());assert.equal(await page.locator('#png').isDisabled(),true);assert.equal(await pixels(),full);
 await page.locator('#qrURL').fill('https://example.org/gift?person=mark#listen');await page.waitForFunction(()=>!document.querySelector('#png').disabled);
 await page.locator('#view').selectOption('back');
 const clear=await page.locator('#preview').evaluate(c=>{const d=c.getContext('2d').getImageData(0,Math.ceil(c.height*90/105),c.width,Math.floor(c.height*15/105)).data;return d.every((v,i)=>i%4!==3||v===0);});assert.equal(clear,true);
 if(process.env.QR_DECODER_MODULE){const jsQR=require(process.env.QR_DECODER_MODULE);const data=await page.locator('#qr-thumb').evaluate(c=>{const copy=document.createElement('canvas');copy.width=c.width;copy.height=c.height;const x=copy.getContext('2d');x.fillStyle='white';x.fillRect(0,0,copy.width,copy.height);x.drawImage(c,0,0);return {pixels:Array.from(x.getImageData(0,0,c.width,c.height).data),w:c.width,h:c.height};});assert.equal(jsQR(Uint8ClampedArray.from(data.pixels),data.w,data.h).data,'https://example.org/gift?person=mark#listen');}
 assert.equal(await page.evaluate(()=>localStorage.length),0);
 await page.locator('#link-library > summary').click();await page.locator('#capture-url').click();await page.locator('#link-title').fill('A song for Mark');await page.locator('#link-note').fill('He will love this bass line');await page.locator('#new-profile').fill('Mark');await page.locator('#save-link').click();assert.match(await page.locator('#index-status').innerText(),/Link saved/);
 let index=await page.evaluate(()=>JSON.parse(localStorage.getItem('juice-link-index-v1')));assert.equal(index.links.length,1);assert.equal(index.profiles[0].name,'Mark');assert.equal(index.sent.length,0);assert.ok(!JSON.stringify(index).includes('data:image'));
 await page.locator('#index-profile').selectOption(index.profiles[0].id);await page.locator('#index-links').selectOption(index.links[0].id);await page.locator('#mark-sent').click();assert.equal(await page.locator('#index-links option').count(),1);
 await page.locator('#index-unused').uncheck();await page.locator('#index-links').selectOption(index.links[0].id);await page.locator('#mark-sent').click();await page.locator('#index-unused').check();assert.equal(await page.locator('#index-links option').count(),2);
 const wait=page.waitForEvent('download');await page.locator('#backup-index').click();const download=await wait,backup=path.join(process.env.QA_OUTPUT||'/tmp','index-test.json');await download.saveAs(backup);const stored=JSON.parse(await fs.readFile(backup));assert.equal(stored.links[0].url,'https://example.org/gift?person=mark#listen');
 await page.locator('#restore-index').setInputFiles(backup);assert.match(await page.locator('#index-status').innerText(),/merged/);index=await page.evaluate(()=>JSON.parse(localStorage.getItem('juice-link-index-v1')));assert.equal(index.links.length,1);
 await page.reload();assert.match(await page.locator('#quality').innerText(),/No photo/);assert.equal(await page.locator('#message').inputValue(),'');assert.equal(await page.locator('#qrURL').inputValue(),'');assert.match(await page.locator('#index-count').innerText(),/1 saved links/);
 await page.locator('#photo').setInputFiles(path.resolve('collections/print/fronts/front_cbo_01_A6_300dpi.jpg'));await page.waitForFunction(()=>document.querySelector('#quality').textContent.includes('DPI'));await page.locator('[data-style=urban]').click();await page.screenshot({path:path.join(process.env.QA_OUTPUT||'/tmp','refined-ipad.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS: photo alpha, live strength, real QR decode when configured, postal clear zone, explicit metadata storage, send/undo, backup merge, reload privacy, iPad/mobile layout');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
