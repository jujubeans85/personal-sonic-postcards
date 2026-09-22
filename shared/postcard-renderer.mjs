import {drawFinishedLettering} from './lettering-finishes.mjs';
import {drawHandwriting} from './handwriting.mjs';
import {styles,cropRect} from './postcard-project.mjs';
import {treatPixels,floydBits} from './photo-treatments.mjs';
const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:Math.max(1,Math.round(w)),height:Math.max(1,Math.round(h))});
const caches=new WeakMap();
export function preparedPhoto(image,p){
 const rotated=canvas(p.rotation%180?image.naturalHeight:image.naturalWidth,p.rotation%180?image.naturalWidth:image.naturalHeight);
 const c=rotated.getContext('2d');c.translate(rotated.width/2,rotated.height/2);c.rotate(p.rotation*Math.PI/180);c.drawImage(image,-image.naturalWidth/2,-image.naturalHeight/2);return rotated;
}
function photoLayer(photo,p,wm,hm){
 const key=JSON.stringify([wm,hm,p.style,p.intensity,p.fit,p.zoom,p.panX,p.panY,p.bw]);
 let cache=caches.get(photo);if(!cache){cache=new Map();caches.set(photo,cache);}if(cache.has(key))return cache.get(key);
 // One physical 300-DPI treatment master feeds preview and every export.
 const layer=canvas(wm/25.4*300,hm/25.4*300),c=layer.getContext('2d');
 const r=cropRect(photo.width,photo.height,wm/hm,p),source=canvas(Math.min(r.w,layer.width),Math.min(r.w,layer.width)*r.h/r.w);
 source.getContext('2d').drawImage(photo,r.x,r.y,r.w,r.h,0,0,source.width,source.height);
 globalThis.JuiceComposition.drawBackground(c,{image:source,color:'rgba(0,0,0,0)',fit:p.fit});
 if(p.style==='floyde'&&p.intensity>0){
  // Fixed 0.30 mm dot pitch: the preview and print retain the same coarse grain.
  const small=canvas(wm/.30,hm/.30),sc=small.getContext('2d');sc.drawImage(layer,0,0,small.width,small.height);
  const d=sc.getImageData(0,0,small.width,small.height),luma=new Float32Array(small.width*small.height);
  for(let i=0;i<luma.length;i++)luma[i]=d.data[i*4+3]?( .2126*d.data[i*4]+.7152*d.data[i*4+1]+.0722*d.data[i*4+2]-128)*1.3+128:255;
  const bits=floydBits(luma,small.width,small.height);
  for(let i=0;i<bits.length;i++)d.data[i*4]=d.data[i*4+1]=d.data[i*4+2]=bits[i];
  sc.putImageData(d,0,0);c.globalAlpha=p.intensity/100;c.imageSmoothingEnabled=false;c.drawImage(small,0,0,layer.width,layer.height);c.globalAlpha=1;c.imageSmoothingEnabled=true;
 }
 const d=c.getImageData(0,0,layer.width,layer.height);c.putImageData(treatPixels(d,p.style,p.intensity,p.bw),0,0);
 if(p.style==='deco'&&p.intensity>0){
  // Decoration is clipped to the actual photo, including contain-fit transparency.
  c.globalCompositeOperation='source-atop';c.globalAlpha=p.intensity/100;c.strokeStyle=p.bw?'#333':'#8b692c';c.lineWidth=3;
  for(const inset of [8,17])c.strokeRect(inset,inset,layer.width-2*inset,layer.height-2*inset);
  c.globalCompositeOperation='source-over';c.globalAlpha=1;
 }
 if(cache.size>=6)cache.delete(cache.keys().next().value);cache.set(key,layer);return layer;
}
export function drawQR(ctx,qr,x,y,size){
 const n=qr.getModuleCount(),module=Math.max(1,Math.floor(size/(n+8))),actual=(n+8)*module;
 ctx.clearRect(x,y,actual,actual);ctx.fillStyle='#000';
 // Quiet zone is unprinted paper. Use light stock / a light label for reliable scanning.
 for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qr.isDark(r,c))ctx.fillRect(x+(c+4)*module,y+(r+4)*module,module,module);
 return actual;
}
function lines(ctx,text,x,y,maxWidth,lineHeight,maxLines){
 if(!text.trim())return;
 const rows=[];
 for(const paragraph of text.replace(/\r\n?/g,'\n').split('\n')){
  let line='';
  for(const word of paragraph.trim().split(/\s+/)){
   const candidate=line?line+' '+word:word;
   if(ctx.measureText(candidate).width>maxWidth&&line){rows.push(line);line=word;}else line=candidate;
  }
  rows.push(line);
 }
 if(rows.length>maxLines)throw Error('Message is too long for this format. Shorten it or use a larger card.');
 for(const row of rows){if(ctx.measureText(row).width>maxWidth)throw Error('Text is too wide for this format. Shorten the long word or link.');ctx.fillText(row,x,y);y+=lineHeight;}
}
export function postalGeometry(p){
 if(p.width<138||p.width>240||p.height<88||p.height>130||p.width/p.height<1.414)throw Error('Postal back needs landscape 150 × 105 mm, or 138–240 × 88–130 mm with width/height at least 1.414.');
 if(p.photoSide!=='front')throw Error('For the postal back, keep the photo on the front.');
 return {divider:p.width-80,addressX:p.width-65,addressWidth:50,bottom:p.height-15};
}
export function renderCard(target,p,photo,side,qr=null,bleed=0){
 const raw=(ctx,...args)=>p.font&&p.font!=='preset'?drawHandwriting(ctx,...args,p.font):lines(ctx,...args);raw.face=p.font;
 const write=(ctx,text,x,y,width,lineHeight,maxLines)=>{const ink=ctx.fillStyle;ctx.fillStyle=p.bw?'#222':'#67412e';drawFinishedLettering(ctx,text,x,y,width,lineHeight,maxLines,p.lettering,unit,raw);ctx.fillStyle=ink;};
 const ctx=target.getContext('2d'),s=styles[p.style],unit=target.width/(p.width+2*bleed),b=bleed*unit,w=p.width*unit,h=p.height*unit;
 const postal=p.postal?postalGeometry(p):null;
 ctx.clearRect(0,0,target.width,target.height);
 globalThis.JuiceComposition.drawBackground(ctx,{transparent:true});
 const m=Math.max(3,p.border)*unit,band=side==='front'&&p.title?Math.min(h*.2,15*unit):0;
 if(photo&&(p.photoSide===side||p.photoSide==='both')){
  const wm=Math.max(1,p.width-2*m/unit),hm=Math.max(1,p.height-2*m/unit-band/unit);
  ctx.drawImage(photoLayer(photo,p,wm,hm),b+m,b+m,wm*unit,hm*unit);
 }
 const qrHere=qr&&p.qrSide===side,qmm=qrHere?Math.max(22,(qr.getModuleCount()+8)*.4):0;
 if(qrHere&&(qmm+6>p.height||qmm+6>p.width*.48))throw Error('QR is too large for this card/label. Use a larger format or a shorter link.');
 ctx.fillStyle='#222';ctx.textBaseline='top';
 if(side==='front'&&p.title){ctx.font=`${Math.min(5.5,p.height*.065)*unit}px ${s.font}`;write(ctx,p.title,b+m,b+h-m-band*.75,w-2*m-(qrHere?(qmm+3)*unit:0),8*unit,1);}
 let qrX=b+w-3*unit-qmm*unit,qrY=b+h-3*unit-qmm*unit;
 if(side==='back'&&postal){
  const {divider,addressX,addressWidth,bottom}=postal,mm=v=>b+v*unit;
  const line=(x,y,x2,y2)=>{ctx.beginPath();ctx.moveTo(mm(x),mm(y));ctx.lineTo(mm(x2),mm(y2));ctx.stroke();};
  ctx.strokeStyle='#777';ctx.lineWidth=.2*unit;
  line(divider,40,divider,bottom-1);ctx.strokeRect(mm(p.width-40),mm(5),25*unit,29*unit);
  ctx.font=`${2.8*unit}px sans-serif`;ctx.fillText('STAMP',mm(p.width-36),mm(16));
  ctx.font=`${3.5*unit}px sans-serif`;
  if(p.address.trim())lines(ctx,p.address,mm(addressX),mm(44),addressWidth*unit,6*unit,Math.floor((bottom-44)/6));
  else for(let y=50;y<=Math.min(bottom-2,74);y+=8)line(addressX,y,p.width-15,y);
  const textW=(divider-10)*unit,top=p.returnAddress?20:6;
  if(p.returnAddress){ctx.font=`${2.5*unit}px sans-serif`;lines(ctx,p.returnAddress,mm(5),mm(5),textW,3.5*unit,3);}
  qrX=mm(5);qrY=mm(bottom-qmm-1);
  const end=qrHere?bottom-qmm-4:bottom-2;
  ctx.font=`${3.8*unit}px ${s.font}`;write(ctx,p.recipient,mm(5),mm(top),textW,5*unit,1);
  ctx.font=`${3.4*unit}px ${s.font}`;
  const rows=Math.floor((end-top-14)/5);
  if(p.message&&rows<1)throw Error('Message and QR need more space. Shorten the URL or use a larger postcard.');
  write(ctx,p.message,mm(5),mm(top+7),textW,5*unit,Math.max(0,rows));
  ctx.font=`${3*unit}px ${s.font}`;write(ctx,p.signature,mm(5),mm(end-5),textW,4*unit,1);
 }else if(side==='back'&&(p.recipient||p.message||p.signature)){
  if(p.message&&p.height-2*m/unit<28.5)throw Error('Back message needs more height or a smaller frame margin.');
  const tw=w-2*m-(qrHere?(qmm+4)*unit:0);
  ctx.font=`bold ${Math.min(5,p.height*.075)*unit}px ${s.font}`;write(ctx,p.recipient,b+m,b+m,tw,6*unit,1);
  ctx.font=`${Math.min(4,p.height*.055)*unit}px ${s.font}`;write(ctx,p.message,b+m,b+m+10*unit,tw,5.5*unit,Math.max(1,Math.floor((p.height-2*m/unit-23)/5.5)));
  ctx.font=`italic ${3.5*unit}px ${s.font}`;write(ctx,p.signature,b+m,b+h-m-5*unit,tw,5*unit,1);
 }
 if(qrHere)drawQR(ctx,qr,Math.round(qrX),Math.round(qrY),qmm*unit);
 return target;
}
