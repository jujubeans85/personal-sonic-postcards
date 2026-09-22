// Mask conversion and text normalisation extracted unchanged from FONT_JUICE working.js.
// The registry is the extension point for a future curated capture; no synthetic font substitutes.
const faces=new Map();
function prepareGlyphMask(image){
  const mask=document.createElement('canvas');
  mask.width=image.naturalWidth||image.width;
  mask.height=image.naturalHeight||image.height;
  const ctx=mask.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw new Error('2D canvas unavailable');
  ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,mask.width,mask.height);
  const data=pixels.data;
  const count=mask.width*mask.height;
  if(!count)throw new Error('Zero-sized glyph');
  // Transparent sources already contain the correct mask, regardless of ink RGB.
  // Opaque scans use the border to identify white paper vs a black backing.
  let hasTransparency=false,borderLuminance=0,borderSamples=0;
  for(let y=0;y<mask.height;y++)for(let x=0;x<mask.width;x++){
    const i=(y*mask.width+x)*4;
    if(data[i+3]<255)hasTransparency=true;
    if(x===0||y===0||x===mask.width-1||y===mask.height-1){
      borderLuminance+=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];borderSamples++;
    }
  }
  const lightBackground=borderLuminance/Math.max(1,borderSamples)>127;
  let occupied=0,borderOccupied=0,borderCount=0;
  for(let y=0;y<mask.height;y++){
    for(let x=0;x<mask.width;x++){
      const i=(y*mask.width+x)*4;
      const luminance=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
      const alpha=hasTransparency?data[i+3]:Math.round(lightBackground?255-luminance:luminance);
      data[i]=255;data[i+1]=255;data[i+2]=255;data[i+3]=alpha;
      const border=x===0||y===0||x===mask.width-1||y===mask.height-1;
      if(border)borderCount++;
      if(alpha>12){occupied++;if(border)borderOccupied++}
    }
  }
  const coverage=occupied/count;
  const borderCoverage=borderCount?borderOccupied/borderCount:0;
  if(coverage<.001)throw new Error('Glyph mask is empty');
  if(coverage>.96&&borderCoverage>.9)throw new Error('Glyph mask became a solid rectangle');
  ctx.clearRect(0,0,mask.width,mask.height);
  ctx.putImageData(pixels,0,0);
  return mask;
}
function normaliseText(value){
  return value.toUpperCase().replace(/\r\n?/g,'\n').replace(/\t/g,'    ').replace(/\u00a0/g,' ')
    .replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"')
    .replace(/[\u2013\u2014]/g,'-').replace(/\u2026/g,'...');
}

export async function loadHandwriting(){
 const datasets=[{id:'adam-original',glyphs:globalThis.FONT_JUICE_GLYPHS}, {...globalThis.FONT_JUICE_CAPTURE03,id:'adam-capture03'}];
 await Promise.all(datasets.map(async dataset=>{
  if(!dataset.glyphs)throw Error('Your handwriting data did not load.');
  const entries=await Promise.all(Object.entries(dataset.glyphs).map(async([ch,variants])=>{
   const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Could not load handwriting '+ch));i.src=variants[0];});
   return [ch,{mask:prepareGlyphMask(image),metric:dataset.metrics?.[ch]?.[0]}];
  }));faces.set(dataset.id,{...dataset,letters:Object.fromEntries(entries)});
 }));
}
export function drawHandwriting(ctx,text,x,y,width,lineHeight,maxLines,font,measureOnly=false){
 if(!text.trim())return;
 const face=faces.get(font);if(!face)throw Error('Loading your handwriting…');
 const size=Number(ctx.font.match(/([\d.]+)px/)[1]);
 const units=Array.from(normaliseText(text));
 const missing=[...new Set(units.filter(ch=>!face.letters[ch]&&!/\s/.test(ch)))];
 if(missing.length)throw Error('Your font has no capture for '+missing.join(' ')+'. Edit those characters or choose preset type.');
 const punctuation={'.':[.12,0],',':[.22,.1],':':[.48,-.16],';':[.58,.04],"'":[.24,-.69],'"':[.25,-.69],'-':[.10,-.42],'_':[.06,.08],'~':[.18,-.40],'^':[.24,-.62]};
 const items=units.map(ch=>{
  if(/\s/.test(ch))return {space:true,newline:ch==='\n',advance:size*.45};
  const {mask,metric}=face.letters[ch], [factor,offset]=punctuation[ch]||[1,0];
  const scale=metric?size/face.emHeight:size*factor/mask.height;
  return {mask,w:mask.width*scale,h:mask.height*scale,baseline:metric?(mask.height-metric.baseline)*scale:offset*size,advance:mask.width*scale+size*.045};
 });
 const ink=items.filter(i=>i.mask),ascent=Math.max(size,...ink.map(i=>i.h-i.baseline)),descent=Math.max(0,...ink.map(i=>i.baseline));
 // Fit captured ascenders/descenders inside the consumer's line box.
 const shrink=Math.min(1,lineHeight*.9/(ascent+descent));
 for(const i of items){for(const k of ['w','h','baseline','advance'])if(k in i)i[k]*=shrink;}
 const rows=[[]];let used=0;
 const next=()=>{while(rows.at(-1).at(-1)?.space)rows.at(-1).pop();rows.push([]);used=0;};
 for(let at=0;at<items.length;){const i=items[at];if(i.newline){next();at++;continue;}if(i.space){if(used){rows.at(-1).push(i);used+=i.advance;}at++;continue;}
  let end=at,total=0;while(end<items.length&&!items[end].space)total+=items[end++].advance;
  if(total>width)throw Error('A word is too wide in your handwriting. Shorten it or choose a larger card.');
  if(used&&used+total>width)next();for(;at<end;at++){rows.at(-1).push(items[at]);used+=items[at].advance;}
 }
 if(rows.length>maxLines)throw Error('Your handwritten text needs more room. Shorten it or choose a larger card.');
 if(measureOnly)return rows.length;
 for(const row of rows){let xx=x+(ctx.textAlign==='center'?(width-row.reduce((n,i)=>n+i.advance,0))/2:0);for(const item of row){if(item.mask){const tint=document.createElement('canvas');tint.width=item.mask.width;tint.height=item.mask.height;const c=tint.getContext('2d');c.drawImage(item.mask,0,0);c.globalCompositeOperation='source-in';c.fillStyle=ctx.fillStyle;c.fillRect(0,0,tint.width,tint.height);ctx.drawImage(tint,xx,y+ascent*shrink-item.h+item.baseline,item.w,item.h);}xx+=item.advance;}y+=lineHeight;}
}
