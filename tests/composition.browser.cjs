// Run against a local static server. PLAYWRIGHT_MODULE and CHROMIUM_PATH are optional.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader']}: {})});
 const context=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(process.env.POSTCARD_TEST_URL||'http://127.0.0.1:8765'))external.push(r.url());});
 await page.addInitScript(()=>{globalThis.SpeechRecognition=class {constructor(){throw Error('Browser microphone must not start');}};const save=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k!=='juice-link-index-v1')throw Error('Unexpected persistence');return save.call(this,k,v);};indexedDB.open=()=>{throw Error('Photo persistence is forbidden');};});
 const base=process.env.POSTCARD_TEST_URL||'http://127.0.0.1:8765';await page.goto(base+'/collections/maker/?t=vintage-3');
 assert.equal(await page.locator('#styles button').count(),4);
 assert.equal(await page.locator('#speak-title').count(),0);
 await page.locator('#title').fill('');

 // Real captured masks: every rendered glyph remains inside its line box at both resolutions.
 await page.waitForFunction(()=>!document.querySelector('#status').textContent.includes('Loading'));
 const lettering=await page.evaluate(async()=>{
  const {loadHandwriting,drawHandwriting}=await import('/shared/handwriting.mjs');await loadHandwriting();
  const result=[];
  for(const font of ['adam-original','adam-capture03'])for(const scale of [1,300/110]){
   const c=document.createElement('canvas').getContext('2d'),boxes=[];
   c.font=`${20*scale}px sans-serif`;c.fillStyle='#123456';c.drawImage=(mask,x,y,w,h)=>boxes.push({x,y,w,h});
   drawHandwriting(c,'AG, WHY?\nLOVE 123',0,0,500*scale,30*scale,2,font);
   result.push(boxes.every(b=>b.x>=0&&b.y>=-0.001&&b.x+b.w<=500*scale&&b.y+b.h<=60*scale));
   try{drawHandwriting(c,'LOVE 🦄',0,0,500,30,2,font);result.push(false);}catch(e){result.push(e.message.includes('no capture'));}
  }
  return result;
 });assert.ok(lettering.every(Boolean));
 const photo=path.resolve('collections/print/fronts/front_cbo_01_A6_300dpi.jpg');await page.locator('#photo').setInputFiles(photo);await page.waitForFunction(()=>document.querySelector('#quality').textContent.includes('DPI'));
 const original=await page.locator('#preview').evaluate(c=>c.toDataURL());
 await page.locator('[data-style=worn]').click();const treated=await page.locator('#preview').evaluate(c=>c.toDataURL());assert.notEqual(treated,original);
 await page.locator('#undo').click();assert.equal(await page.locator('#preview').evaluate(c=>c.toDataURL()),original);
 await page.locator('[data-style=deco]').click();
 await page.locator('#title').fill('KEEP THIS');await page.locator('#title').dispatchEvent('change');
 const hand=await page.locator('#preview').evaluate(c=>c.toDataURL());await page.locator('#font').selectOption('preset');assert.notEqual(await page.locator('#preview').evaluate(c=>c.toDataURL()),hand);await page.locator('#font').selectOption('adam-original');assert.notEqual(await page.locator('#preview').evaluate(c=>c.toDataURL()),hand);await page.locator('#font').selectOption('adam-capture03');
 await page.locator('#sides').selectOption('both');await page.locator('#recipient').fill('For Mimi');await page.locator('#recipient').dispatchEvent('change');
 await page.locator('#message').fill('Some words arrive before you are ready for them.');await page.locator('#message').dispatchEvent('change');
 await page.locator('#qrEnabled').check();await page.locator('#collection-link').click();assert.equal(await page.locator('#qrURL').inputValue(),base+'/collections/?t=vintage-3');
 await page.locator('#view-back').click();assert.equal(await page.locator('#status').innerText(),'');
 async function download(id,name){const wait=page.waitForEvent('download');await page.locator('#'+id).click();const d=await wait;const out=path.join(process.env.QA_OUTPUT||'/tmp',name);await d.saveAs(out);return out;}
 const saved=await download('save','postcard-test.juicecard'),savedData=JSON.parse(await fs.readFile(saved,'utf8'));assert.equal(savedData.project.style,'deco');assert.equal(savedData.project.font,'adam-capture03');assert.deepEqual(Buffer.from(savedData.photo.split(',')[1],'base64'),await fs.readFile(photo));
 const beforeReopen=await page.locator('#preview').evaluate(c=>c.toDataURL());
 const png=await download('png','postcard-back.png');assert.equal((await fs.readFile(png)).subarray(1,4).toString(),'PNG');
 const exportedPixels=await page.evaluate(async({project,photo})=>{
  const {renderCard,preparedPhoto}=await import('/shared/postcard-renderer.mjs');const {dimensions,qrDestination}=await import('/shared/postcard-project.mjs');
  const source=new Image();await new Promise((resolve,reject)=>{source.onload=resolve;source.onerror=reject;source.src=photo;});const qr=qrcode(0,'M');qr.addData(qrDestination(project.qrURL),'Byte');qr.make();
  const canvas=Object.assign(document.createElement('canvas'),dimensions(project));renderCard(canvas,project,preparedPhoto(source,project),'back',qr);
  return canvas.toDataURL().split(',')[1];
 },savedData);
 // Transparent PNG encoders can differ by one RGB level on antialiased pixels.
 const parity=await page.evaluate(async pair=>{
  const arrays=[];for(const data of pair){const im=new Image();await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=reject;im.src='data:image/png;base64,'+data;});const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);arrays.push(x.getImageData(0,0,c.width,c.height).data);}
  let colour=0,alpha=0;for(let i=0;i<arrays[0].length;i++){const d=Math.abs(arrays[0][i]-arrays[1][i]);if(i%4===3)alpha=Math.max(alpha,d);else colour=Math.max(colour,d);}return {colour,alpha};
 },[exportedPixels,(await fs.readFile(png)).toString('base64')]);assert.equal(parity.alpha,0);assert.ok(parity.colour<=1);

 const pdf=await download('pdf','postcard-print.pdf');assert.equal((await fs.readFile(pdf)).subarray(0,4).toString(),'%PDF');
 const {PDFDocument}=require('../shared/vendor/pdf-lib.min.js');const parsed=await PDFDocument.load(await fs.readFile(pdf));assert.equal(parsed.getPageCount(),2);assert.ok(Math.abs(parsed.getPage(0).getWidth()-210*72/25.4)<.01);
 await page.locator('#output').selectOption('card');await page.locator('#bleed').fill('3');await page.locator('#bleed').dispatchEvent('change');const custom=await download('pdf','postcard-bleed.pdf');const cardPDF=await PDFDocument.load(await fs.readFile(custom));assert.ok(Math.abs(cardPDF.getPage(0).getWidth()-156*72/25.4)<.01);assert.ok(Math.abs(cardPDF.getPage(0).getTrimBox().width-150*72/25.4)<.01);
 await page.locator('#output').selectOption('a4');
 const popupWait=page.waitForEvent('popup');await page.locator('#print').click();const popup=await popupWait;await popup.waitForLoadState();assert.equal(await popup.locator('img').first().evaluate(i=>i.style.width),'150mm');assert.equal(await popup.locator('img').count(),2);assert.equal(await popup.locator('img').last().getAttribute('data-side'),'back');if(process.env.QR_DECODER_MODULE){const data=await popup.locator('img').last().evaluate(async im=>{await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0);return {pixels:Array.from(x.getImageData(0,0,c.width,c.height).data),w:c.width,h:c.height};});const decoded=require(process.env.QR_DECODER_MODULE)(Uint8ClampedArray.from(data.pixels),data.w,data.h);assert.equal(decoded?.data,base+'/collections/?t=vintage-3');}await popup.close();
 await page.locator('#clear').click();assert.match(await page.locator('#quality').innerText(),/No photo/);await page.locator('#open').setInputFiles(saved);await page.waitForFunction(()=>document.querySelector('#quality').textContent.includes('DPI'));assert.equal(await page.locator('#recipient').inputValue(),'For Mimi');assert.equal(await page.locator('#font').inputValue(),'adam-capture03');assert.equal(await page.locator('#preview').evaluate(c=>c.toDataURL()),beforeReopen);
 await page.locator('#photo').setInputFiles({name:'bad.png' ,mimeType:'image/png',buffer:Buffer.from('bad')});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Previous photo kept'));assert.match(await page.locator('#quality').innerText(),/DPI/);
 await page.locator('#open').setInputFiles({name:'bad.juicecard',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({project:{schema:'other'}}))});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Current work kept'));
 await page.locator('#qrURL').fill('javascript:alert(1)');await page.locator('#qrURL').dispatchEvent('change');await page.waitForFunction(()=>document.querySelector('#png').disabled);assert.equal(await page.locator('#png').isDisabled(),true);
 await page.locator('#collection-link').click();await page.locator('#view-front').click();
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(process.env.QA_OUTPUT||'/tmp','postcard-desktop.png')});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(process.env.QA_OUTPUT||'/tmp','postcard-mobile.png')});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.reload();assert.match(await page.locator('#quality').innerText(),/No photo/);assert.equal(await page.locator('#recipient').inputValue(),'');
 await page.goto(base+'/collections/?t=vintage-3&profile=mmi#art');assert.match(await page.locator('#front').getAttribute('src'),/front3.jpg/);await page.locator('#choice').selectOption('vintage-4');assert.match(page.url(),/profile=mmi/);assert.match(page.url(),/#art$/);assert.equal(await page.locator('#make-card').getAttribute('href'),'maker/?t=vintage-4');
 await page.goto(base+'/collections/maker/');
 await page.locator('#title').fill('LOVE 🦄');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('no capture'));assert.equal(await page.locator('#png').isDisabled(),true);
 await page.locator('#font').selectOption('preset');assert.equal(await page.locator('#png').isDisabled(),false);
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);console.log('PASS: revised maker, fonts, PNG parity, PDF, original bytes, privacy and gallery routes.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
