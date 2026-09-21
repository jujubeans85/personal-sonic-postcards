import {styles,cropRect} from './postcard-project.mjs';
const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:Math.max(1,Math.round(w)),height:Math.max(1,Math.round(h))});
export function preparedPhoto(image,p){
 const rotated=canvas(p.rotation%180?image.naturalHeight:image.naturalWidth,p.rotation%180?image.naturalWidth:image.naturalHeight);
 const c=rotated.getContext('2d');c.translate(rotated.width/2,rotated.height/2);c.rotate(p.rotation*Math.PI/180);c.drawImage(image,-image.naturalWidth/2,-image.naturalHeight/2);
 return rotated;
}
function treat(ctx,p,s){
 if(p.intensity===0&&!p.bw)return;
 const data=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height),a=data.data,t=p.intensity/100;
 for(let i=0;i<a.length;i+=4){
  const r=a[i],g=a[i+1],b=a[i+2],l=.2126*r+.7152*g+.0722*b;
  const sep=[.393*r+.769*g+.189*b,.349*r+.686*g+.168*b,.272*r+.534*g+.131*b];
  const grain=(((Math.imul(i/4+1,1597334677)>>>0)%101)/100-.5)*s.grain*100;
  for(let j=0;j<3;j++){const v=[r,g,b][j];let n=l+(v-l)*s.sat;n=n*(1-s.sepia)+sep[j]*s.sepia;n=(n-128)*s.contrast+128+grain;if(s.poster)n=Math.round(n/48)*48;a[i+j]=p.bw?l:v*(1-t)+n*t;}
 }
 ctx.putImageData(data,0,0);
}
function lines(ctx,text,x,y,maxWidth,lineHeight,maxLines){
 const words=text.trim().split(/\s+/);let line='',rows=[];
 for(const word of words){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width>maxWidth&&line){rows.push(line);line=word;}else line=candidate;}
 if(line)rows.push(line);
 if(rows.length>maxLines)throw Error('Message is too long for this format. Shorten it or use a larger card.');
 for(const row of rows){if(ctx.measureText(row).width>maxWidth)throw Error('Text is too wide for this format. Shorten the long word or link.');ctx.fillText(row,x,y);y+=lineHeight;}
}
export function renderCard(target,p,photo,side,qr=null,bleed=0){
 const ctx=target.getContext('2d'),s=styles[p.style],unit=target.width/(p.width+2*bleed),b=bleed*unit,w=p.width*unit,h=p.height*unit;
 let paper=p.stock==='recycled'?'#f0e5ce':s.paper,ink=s.ink,accent=s.accent;
 if(p.bw){paper='#ffffff';ink='#111111';accent='#444444';}
 ctx.clearRect(0,0,target.width,target.height);
 globalThis.JuiceComposition.drawBackground(ctx,{color:paper});
 const m=Math.max(3,p.border)*unit;
 const hasPhoto=photo&&(p.photoSide===side||p.photoSide==='both');
 const hasText=side==='front'?p.title:!!(p.recipient||p.message||p.signature);
 const band=side==='front'&&p.title?Math.min(h*.2,15*unit):0;
 if(hasPhoto){
  const pw=Math.max(1,w-2*m),ph=Math.max(1,h-2*m-band),rect=cropRect(photo.width,photo.height,pw/ph,p);
  const shrink=Math.min(1,Math.max(pw,ph)/Math.max(rect.w,rect.h),2400/Math.max(rect.w,rect.h));const source=canvas(rect.w*shrink,rect.h*shrink);source.getContext('2d').drawImage(photo,rect.x,rect.y,rect.w,rect.h,0,0,source.width,source.height);
  const layer=canvas(pw,ph);globalThis.JuiceComposition.drawBackground(layer.getContext('2d'),{image:source,color:paper,fit:p.fit});treat(layer.getContext('2d'),p,s);
  ctx.drawImage(layer,b+m,b+m,pw,ph);
 }
 ctx.strokeStyle=accent;ctx.lineWidth=Math.max(1,unit*.4);
 if(p.style!=='original'&&p.style!=='realistic'&&p.intensity>0){ctx.strokeRect(b+m*.45,b+m*.45,w-m*.9,h-m*.9);if(p.style==='deco')ctx.strokeRect(b+m*.7,b+m*.7,w-m*1.4,h-m*1.4);}
 if(p.style==='postmodern'||p.style==='picasso'||p.style==='marketing'){ctx.fillStyle=accent;ctx.globalAlpha=p.intensity/100;ctx.fillRect(b+m,b+m*.2,w*.22,m*.35);ctx.globalAlpha=1;}
 const qrHere=qr&&p.qrSide===side;
 const qmm=qrHere?Math.max(22,(qr.getModuleCount()+8)*.4):0;
 if(qrHere&&(qmm+6>p.height||qmm+6>p.width*.48))throw Error('QR is too large for this card/label. Use a larger format or a shorter link.');
 if(hasText){
  ctx.fillStyle=paper;
  if(side==='back'&&hasPhoto){ctx.globalAlpha=.94;ctx.fillRect(b+m,b+m,w-2*m,h-2*m);ctx.globalAlpha=1;}
  ctx.fillStyle=ink;ctx.textBaseline='top';
  if(side==='front') {ctx.font=`${Math.min(5.5,p.height*.065)*unit}px ${s.font}`;lines(ctx,p.title,b+m,b+h-m-band*.75,w-2*m-(qrHere?(qmm+3)*unit:0),8*unit,1);}
  else {
   const textWidth=w-2*m-(qrHere?(qmm+4)*unit:0);
   ctx.font=`bold ${Math.min(5,p.height*.075)*unit}px ${s.font}`;lines(ctx,p.recipient,b+m,b+m,textWidth,6*unit,1);
   ctx.font=`${Math.min(4,p.height*.055)*unit}px ${s.font}`;lines(ctx,p.message,b+m,b+m+10*unit,textWidth,5.5*unit,Math.max(1,Math.floor((p.height-2*m/unit-23)/5.5)));
   ctx.font=`italic ${3.5*unit}px ${s.font}`;lines(ctx,p.signature,b+m,b+h-m-5*unit,textWidth,5*unit,1);
  }
 }
 if(qrHere){
  const n=qr.getModuleCount(),module=Math.max(1,Math.floor(qmm*unit/(n+8))),size=(n+8)*module,x=Math.round(b+w-3*unit-size),y=Math.round(b+h-3*unit-size);
  ctx.fillStyle='#fff';ctx.fillRect(x,y,size,size);ctx.fillStyle='#000';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qr.isDark(r,c))ctx.fillRect(x+(c+4)*module,y+(r+4)*module,module,module);
 }
 return target;
}
