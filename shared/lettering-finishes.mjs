// Decorative lettering only. Addresses, postal guides and QR never enter this pipeline.
export const letteringFinishes=['original','outline','inflated','worn'];
const cache=new Map();
export function clearLetteringCache(){cache.clear();}
function extrema(a,w,h,r,max){
 const temp=new Uint8ClampedArray(a.length),out=new Uint8ClampedArray(a.length);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=max?0:255;for(let dx=-r;dx<=r;dx++){const n=x+dx>=0&&x+dx<w?a[y*w+x+dx]:0;v=max?Math.max(v,n):Math.min(v,n);}temp[y*w+x]=v;}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=max?0:255;for(let dy=-r;dy<=r;dy++){const n=y+dy>=0&&y+dy<h?temp[(y+dy)*w+x]:0;v=max?Math.max(v,n):Math.min(v,n);}out[y*w+x]=v;}
 return out;
}
export function finishAlpha(a,w,h,finish){
 if(finish==='original')return a.slice();
 if(!letteringFinishes.includes(finish))throw Error('Unknown lettering finish.');
 const out=new Uint8ClampedArray(a.length);
 if(finish==='worn'){
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x,hash=(Math.imul(Math.floor(x/2)+17,73856093)^Math.imul(Math.floor(y/2)+23,19349663))>>>0;
   // Fixed paper-sized missing flecks, never an opaque brown rectangle.
   out[i]=hash%100<42?0:Math.round(a[i]*(.50+(hash%39)/100));
  }return out;
 }
 const inner=extrema(a,w,h,finish==='outline'?2:1,false);
 const outer=finish==='inflated'?extrema(a,w,h,3,true):a;
 for(let i=0;i<a.length;i++)out[i]=Math.max(0,outer[i]-inner[i]);
 return out;
}
export function drawFinishedLettering(ctx,text,x,y,width,lineHeight,maxLines,finish,unit,drawRaw){
 if(!text.trim())return;
 if(!finish||finish==='original'){drawRaw(ctx,text,x,y,width,lineHeight,maxLines);return;}
 const scale=(300/25.4)/unit,pad=4,w=Math.ceil(width*scale)+pad*2,h=Math.ceil(lineHeight*maxLines*scale)+pad*2;
 if(w*h>13000000||maxLines<1)throw Error('Lettering needs more room. Shorten the message.');
 const font=ctx.font.replace(/([\d.]+)px/,(_,n)=>Number(n)*scale+'px');
 const key=JSON.stringify([text,font,width*scale,lineHeight*scale,maxLines,finish,ctx.fillStyle,drawRaw.face,ctx.textAlign]);
 let layer=cache.get(key);
 if(!layer){
  layer=Object.assign(document.createElement('canvas'),{width:w,height:h});const c=layer.getContext('2d',{willReadFrequently:true});
  c.font=font;c.textAlign=ctx.textAlign;c.textBaseline='top';c.fillStyle='#fff';drawRaw(c,text,pad,pad,width*scale,lineHeight*scale,maxLines);
  const d=c.getImageData(0,0,w,h),a=new Uint8ClampedArray(w*h);for(let i=0;i<a.length;i++)a[i]=d.data[i*4+3];
  const result=finishAlpha(a,w,h,finish);for(let i=0;i<a.length;i++)d.data[i*4+3]=result[i];c.putImageData(d,0,0);
  c.globalCompositeOperation='source-in';c.fillStyle=ctx.fillStyle;c.fillRect(0,0,w,h);
  if(cache.size>=32)cache.delete(cache.keys().next().value);cache.set(key,layer);
 }
 ctx.drawImage(layer,x-pad/scale,y-pad/scale,w/scale,h/scale);
}
