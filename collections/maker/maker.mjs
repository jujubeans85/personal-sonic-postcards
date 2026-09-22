import {clearLetteringCache} from '../../shared/lettering-finishes.mjs';
import {mountLinkLibrary} from './link-library.mjs';
import {loadHandwriting} from '../../shared/handwriting.mjs';
import {defaults,styles,visibleStyles,validateProject,qrDestination,outputSides,dimensions,VERSION,cropRect} from '../../shared/postcard-project.mjs';
import {preparedPhoto,renderCard,drawQR} from '../../shared/postcard-renderer.mjs';
import {shareURL} from '../../shared/postcard-catalog.mjs';
const $=id=>document.getElementById(id);
let project={...defaults(),font:'adam-capture03',lettering:'outline',width:150,postal:true,sides:'both'},image=null,original=null,prepared=null,generation=0,valid=false,busy=false;
const history=[];let thumbKey='',paintFrame=0,lastPreviewSide=null;
function schedulePaint(){valid=false;for(const id of ['png','share','pdf','print'])$(id).disabled=true;cancelAnimationFrame(paintFrame);paintFrame=requestAnimationFrame(paint);}
const say=m=>$('status').textContent=m;
function remember(){history.push({...project});if(history.length>30)history.shift();$('undo').disabled=false;}
function qrFor(p){if(!p.qrEnabled)return null;const dest=qrDestination(p.qrURL);const qr=globalThis.qrcode(0,'M');qr.addData(dest,'Byte');qr.make();return qr;}
function sync(){for(const [k,v] of Object.entries(project)){const el=$(k);if(el){if(el.type==='checkbox')el.checked=v;else el.value=v;}}for(const b of $('lettering-options').children)b.setAttribute('aria-pressed',String(b.dataset.lettering===project.lettering));for(const b of $('styles').children)b.setAttribute('aria-pressed',String(b.dataset.style===project.style));$('format').value=['150,105','148,105','105,148','150,150','100,50'].includes(`${project.width},${project.height}`)?`${project.width},${project.height}`:'custom';}
function photoFor(){if(!image)return null; if(!prepared||prepared.rotation!==project.rotation)prepared={rotation:project.rotation,image:preparedPhoto(image,project)};return prepared.image;}
function paint(){
 valid=false;say('');$('qr-options').hidden=!project.qrEnabled;$('preview').style.background=project.stock==='recycled'?'#e4d6b6':'#fff';$('strength-value').textContent=project.intensity+'%';$('reset-style').setAttribute('aria-pressed',String(project.style==='original'));$('intensity').disabled=project.style==='original';
 try{
  project=validateProject(project);let qr=null,qrError='';try{qr=qrFor(project);}catch(e){qrError=project.qrURL?'Enter a complete http:// or https:// URL.':'Add a destination URL to generate your QR.';}const side=$('view').value;
  const qc=$('qr-thumb').getContext('2d');qc.clearRect(0,0,160,160);if(qr)drawQR(qc,qr,0,0,160);
  $('qr-destination').textContent=qr?'Opens: '+qrDestination(project.qrURL):qrError;
  if(project.qrEnabled&&!outputSides(project).includes(project.qrSide))throw Error('Include the QR side in “Make”, or move the QR to the included side.');
  const d=dimensions(project,110),staged=Object.assign(document.createElement('canvas'),d);
  renderCard(staged,project,photoFor(),side,qr);Object.assign($('preview'),d);$('preview').getContext('2d').drawImage(staged,0,0);lastPreviewSide=side;$('preview-state').textContent=side==='front'?'Front preview':'Back preview · address and QR stay sharp';
  // Validate both output faces, including text overflow, before enabling exports.
  for(const s of outputSides(project))if(s!==side){try{renderCard(Object.assign(document.createElement('canvas'),d),project,photoFor(),s,qr);}catch(e){throw Error(s[0].toUpperCase()+s.slice(1)+' text/layout: '+e.message);}}
  const warnings=[];
  if(!image)warnings.push('No photo selected. You can make a blank or text-only card.');
  if(!outputSides(project).includes(side))warnings.push('Shown side is excluded from the PDF. PNG exports the shown side.');
  if(project.sides==='front'&&(project.recipient||project.message||project.signature))warnings.push('Back text is not included in front-only output.');
  if(image){const src=photoFor(),r=cropRect(src.width,src.height,project.width/project.height,project);const dpi=Math.floor(Math.min(r.w/(project.width/25.4),r.h/(project.height/25.4)));warnings.push(`Conservative photo resolution: ${dpi} DPI at this card size.${dpi<200?' Use a smaller card or a larger source for sharper print.':''}`);}
  $('quality').textContent=warnings.join(' ');valid=!qrError;if(qrError)say(qrError);
  const tk=JSON.stringify([generation,project.rotation,project.fit,project.zoom,project.panX,project.panY,project.width,project.height,project.border,project.bw,!!image]);
  if(tk!==thumbKey){thumbKey=tk;for(const button of $('styles').children){const thumb=button.querySelector('canvas');thumb.width=180;thumb.height=Math.round(180*project.height/project.width);renderCard(thumb,{...project,style:button.dataset.style,intensity:80,postal:false,title:'',recipient:'',message:'',signature:'',photoSide:'both'},photoFor(),'front');}}
 }catch(e){say(e.message);$('preview-state').textContent=lastPreviewSide?`Showing last rendered ${lastPreviewSide}. Check the message below; exports are paused.`:'Preview needs attention. Check the message below.';}
 for(const side of ['front','back'])$('view-'+side).setAttribute('aria-pressed',String($('view').value===side));
 for(const id of ['png','share','pdf','print'])$(id).disabled=!valid||busy;
}
for(const key of visibleStyles){const s=styles[key];
 const b=document.createElement('button');b.type='button';b.dataset.style=key;b.setAttribute('aria-pressed',String(key==='original'));
 const thumb=document.createElement('canvas');thumb.width=180;thumb.height=44;const ctx=thumb.getContext('2d');ctx.fillStyle=s.paper;ctx.fillRect(0,0,180,44);ctx.fillStyle=s.accent;ctx.fillRect(7,7,30,30);ctx.font=`18px ${s.font}`;ctx.fillStyle=s.ink;ctx.fillText('Aa / JUICE',46,29);b.append(thumb,document.createTextNode(s.label));b.onclick=()=>{remember();project.style=key;sync();paint();};$('styles').append(b);
}
for(const [k,v] of Object.entries(project)){const el=$(k);if(!el||['title','recipient','message','signature','address','returnAddress','qrURL'].includes(k))continue;el.addEventListener(el.type==='range'?'input':'change',()=>{if(el.type!=='range')remember();project[k]=el.type==='checkbox'?el.checked:typeof v==='number'?Number(el.value):el.value;if(k==='qrEnabled'&&project.qrEnabled){project.qrSide='back';project.sides='both';}sync();if(el.type==='range')schedulePaint();else paint();});}
// Keyboard dictation follows ordinary input events, with no in-app microphone session.
function stopSpeech(){}
for(const field of ['title','recipient','message','signature','address','returnAddress','qrURL']){
 const text=$(field);text.addEventListener('focus',remember);text.addEventListener('input',()=>{project[field]=text.value;schedulePaint();});
}
for(const el of document.querySelectorAll('input[type=range]'))el.addEventListener('pointerdown',remember);
$('reset-style').onclick=()=>{remember();project.style='original';sync();paint();};
$('postal-format').onclick=()=>{remember();Object.assign(project,{postal:true,width:150,height:105,photoSide:'front',sides:'both',qrSide:'back'});sync();paint();};
loadHandwriting().then(paint).catch(e=>say(e.message));
$('format').onchange=()=>{if($('format').value==='custom')return;remember();[project.width,project.height]=$('format').value.split(',').map(Number);project.postal=$('format').value==='150,105';if(project.postal){project.photoSide='front';project.sides='both';}sync();paint();};
$('view').onchange=paint;
 for(const side of ['front','back'])$('view-'+side).onclick=()=>{$('view').value=side;paint();};
 for(const b of $('lettering-options').children)b.onclick=()=>{remember();project.lettering=b.dataset.lettering;sync();paint();};
$('undo').onclick=()=>{stopSpeech();if(history.length){project=history.pop();sync();paint();}$('undo').disabled=!history.length;};
function decode(file){return new Promise((resolve,reject)=>{
 if(!file||!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)||!file.size||file.size>12*1024*1024){reject(Error('Choose a JPEG, PNG, WebP or GIF up to 12 MiB.'));return;}
 const url=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{URL.revokeObjectURL(url);if(img.naturalWidth*img.naturalHeight>24000000)reject(Error('Choose an image under 24 megapixels.'));else resolve(img);};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Could not open this image. Try a JPEG or PNG.'));};img.src=url;
});}
$('preview-photo').onclick=()=>$('photo').click();
$('photo').onchange=async()=>{const file=$('photo').files[0];if(!file)return;const n=++generation;try{const img=await decode(file);if(n!==generation)return;image=img;original=file;prepared=null;paint();}catch(e){if(n===generation)say(e.message+' Previous photo kept.');}$('photo').value='';};
$('clear').onclick=()=>{generation++;image=original=prepared=null;$('photo').value='';paint();};
$('collection-link').onclick=()=>{remember();const u=new URL('../',location.href);const slug=new URL(location.href).searchParams.get('t');project.qrURL=slug?shareURL(u.href,slug):u.href;project.qrEnabled=true;project.qrSide='back';project.sides='both';sync();paint();};
mountLinkLibrary({getURL:()=>project.qrURL,useURL:url=>{remember();Object.assign(project,{qrEnabled:true,qrURL:url,qrSide:'back',sides:'both'});sync();paint();}});
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
const dataURL=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(Error('Could not read photo.'));r.readAsDataURL(blob);});
$('save').onclick=async()=>{stopSpeech();try{const saved={project:validateProject(project),photo:original?await dataURL(original):null};download(new Blob([JSON.stringify(saved)],{type:'application/json'}),'postcard.juicecard');say('Project exported with its original photo. Store it somewhere you can find again.');}catch(e){say(e.message);}};
$('open').onchange=async()=>{stopSpeech();const file=$('open').files[0];if(!file)return;const n=++generation;try{
 if(file.size>18*1024*1024)throw Error('Project exceeds the 18 MiB import limit.');const data=JSON.parse(await file.text());const next=validateProject(data.project);let blob=null,img=null;
 if(data.photo!==null){if(typeof data.photo!=='string'||!/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(data.photo))throw Error('Project photo must be an embedded supported image.');const [head,body]=data.photo.split(',');const bytes=Uint8Array.from(atob(body),c=>c.charCodeAt(0));blob=new Blob([bytes],{type:head.slice(5,head.indexOf(';'))});img=await decode(blob);}
 if(n!==generation)return;stopSpeech();project=next;image=img;original=blob;prepared=null;history.length=0;$('undo').disabled=true;sync();paint();
 }catch(e){if(n===generation)say('Project not opened: '+e.message+' Current work kept.');}$('open').value='';};
function rendered(p,side,bleed=0){const size=dimensions(p,300,bleed);if(size.width*size.height>13000000)throw Error('Output exceeds 13 megapixels. Reduce dimensions or bleed.');return renderCard(Object.assign(document.createElement('canvas'),size),p,photoFor(),side,qrFor(p),bleed);}
const png=c=>new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(Error('PNG export failed.')),'image/png'));
async function guarded(fn){if(!valid||busy)return;cancelAnimationFrame(paintFrame);paint();if(!valid)return;stopSpeech();busy=true;paint();const controls=[...document.querySelectorAll('.controls input,.controls select,.controls button,.controls textarea,#view,#view-front,#view-back,#undo,#save,#preview-photo')];const disabled=controls.map(el=>el.disabled);controls.forEach(el=>el.disabled=true);try{await fn({...project});}catch(e){if(e.name!=='AbortError')say(e.message);}finally{busy=false;controls.forEach((el,i)=>el.disabled=disabled[i]);for(const id of ['png','share','pdf','print'])$(id).disabled=!valid;}}
$('png').onclick=()=>guarded(async p=>{download(await png(rendered(p,$('view').value)),`postcard-${$('view').value}.png`);say('PNG saved. Use PDF when exact print dimensions matter.');});
$('share').onclick=()=>guarded(async p=>{const file=new File([await png(rendered(p,$('view').value))],`postcard-${$('view').value}.png`,{type:'image/png'});if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'Postcard'});}catch(e){if(e.name==='AbortError')return;download(file,file.name);say('Sharing was unavailable; PNG downloaded instead.');}}else{download(file,file.name);say('File sharing is unavailable here; PNG downloaded instead.');}});
async function pdfBytes(p){
 const {PDFDocument,rgb}=globalThis.PDFLib,doc=await PDFDocument.create(),pt=72/25.4,bleed=p.output==='card'?p.bleed:0;
 const cw=p.width+2*bleed,ch=p.height+2*bleed;
 if(p.output==='a4'&&(cw>190||ch>277))throw Error('This card does not fit A4 with 10 mm margins. Reduce its size or use custom-page output.');
 for(const side of outputSides(p)){
  const c=rendered(p,side,bleed),img=await doc.embedPng(await (await png(c)).arrayBuffer());
  const pw=p.output==='a4'?210:cw,ph=p.output==='a4'?297:ch,page=doc.addPage([pw*pt,ph*pt]);
  const x=(pw-cw)/2*pt,y=(ph-ch)/2*pt;page.drawImage(img,{x,y,width:cw*pt,height:ch*pt});
  page.setTrimBox(x+bleed*pt,y+bleed*pt,p.width*pt,p.height*pt);
  if(p.output==='a4'&&p.marks){for(const xx of [x,x+cw*pt])for(const yy of [y,y+ch*pt]){const sx=xx===x?-1:1,sy=yy===y?-1:1;page.drawLine({start:{x:xx+sx*2*pt,y:yy},end:{x:xx+sx*5*pt,y:yy},thickness:.4,color:rgb(0,0,0)});page.drawLine({start:{x:xx,y:yy+sy*2*pt},end:{x:xx,y:yy+sy*5*pt},thickness:.4,color:rgb(0,0,0)});}}
 }
 return doc.save();
}
$('pdf').onclick=()=>guarded(async p=>{download(new Blob([await pdfBytes(p)],{type:'application/pdf'}),'postcard-print.pdf');say('Print PDF saved. Print at 100% / actual size. Proof front/back alignment and QR on your paper.');});
$('print').onclick=()=>guarded(async p=>{
 // A separate local document isolates print dimensions from the gallery and UI.
 if(p.width>190||p.height>277)throw Error('This card does not fit home A4 with margins. Save the custom-page PDF instead.');const win=window.open('','_blank');if(!win){throw Error('Pop-up blocked. Save the print PDF and print it instead.');}
 const c=rendered(p,$('view').value);win.document.open();win.document.write('<!doctype html><title>Print postcard</title><link rel="stylesheet" href="'+new URL('print.css',location.href).href+'"><p>Print at actual size / 100%. Close this tab when finished.</p>');win.document.close();
 const img=win.document.createElement('img');img.style.width=p.width+'mm';img.style.height=p.height+'mm';img.onload=()=>{win.document.querySelector('p').remove();win.focus();win.print();};img.src=c.toDataURL('image/png');win.document.body.append(img);
});
window.addEventListener('pagehide',()=>{clearLetteringCache();cancelAnimationFrame(paintFrame);generation++;thumbKey='';lastPreviewSide=null;image=original=prepared=null;history.length=0;project=defaults();$('preview').width=0;for(const c of $('styles').querySelectorAll('canvas'))c.width=0;});
window.addEventListener('pageshow',()=>{sync();paint();});
sync();paint();
