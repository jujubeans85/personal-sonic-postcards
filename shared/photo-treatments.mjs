// Fixed image-only recipes. Floyd uses serpentine Floyd–Steinberg error diffusion.
// Inputs are bounded by the renderer. No storage or network; original bytes are never altered.
export function floydBits(luma,width,height) {
 const work=Float32Array.from(luma),out=new Uint8Array(work.length);
 for(let y=0;y<height;y++){
  const step=y%2?-1:1;
  for(let x=step===1?0:width-1;x>=0&&x<width;x+=step){
   const i=y*width+x,v=work[i],q=v<128?0:255;out[i]=q;const e=v-q;
   if(x+step>=0&&x+step<width)work[i+step]+=e*7/16;
   if(y+1<height){work[i+width]+=e*5/16;if(x-step>=0&&x-step<width)work[i+width-step]+=e*3/16;if(x+step>=0&&x+step<width)work[i+width+step]+=e/16;}
  }
 }
 return out;
}
export function treatPixels(data,style,strength,bw=false) {
 const a=data.data,t=strength/100,active=['urban','deco','worn'].includes(style);
 if((!active||!strength)&&!bw)return data;
 for(let i=0;i<a.length;i+=4){
  if(!a[i+3])continue;
  const r=a[i],g=a[i+1],b=a[i+2],l=.2126*r+.7152*g+.0722*b;
  const grain=(((Math.imul((i/4)+1,1597334677)>>>0)%101)/100-.5);
  let nr=r,ng=g,nb=b;
  if(style==='urban'){const v=(l-128)*1.85+128+grain*44;nr=v+(r-l)*.12;ng=v+(g-l)*.12;nb=v+(b-l)*.12;}
  else if(style==='deco'){nr=(.393*r+.769*g+.189*b-128)*1.22+120;ng=(.349*r+.686*g+.168*b-128)*1.22+120;nb=(.272*r+.534*g+.131*b-128)*1.22+120;}
  else if(style==='worn'){const v=(l-128)*.76+148+grain*60;nr=v+18;ng=v+6;nb=v-19;}
  nr=r*(1-t)+Math.max(0,Math.min(255,nr))*t;ng=g*(1-t)+Math.max(0,Math.min(255,ng))*t;nb=b*(1-t)+Math.max(0,Math.min(255,nb))*t;
  if(bw){const v=.2126*nr+.7152*ng+.0722*nb;nr=ng=nb=v;}
  a[i]=nr;a[i+1]=ng;a[i+2]=nb;
 }
 return data;
}
