// Serializable project contract; photo bytes live separately in memory until explicit save.
export const VERSION = 'juice-postcard/1';
export const styles = {
 original: {label:'Original', paper:'#ffffff', ink:'#182222', accent:'#182222', sat:1, sepia:0, contrast:1, grain:0, font:'sans-serif'},
 vintage: {label:'Vintage', paper:'#f5e7c7', ink:'#493b29', accent:'#967342', sat:.65, sepia:.5, contrast:.9, grain:.12, font:'Georgia'},
 deco: {label:'Deco', paper:'#f5ecd4', ink:'#202f30', accent:'#ad893a', sat:.75, sepia:.12, contrast:1.12, grain:0, font:'Georgia'},
 postmodern: {label:'Post modern', paper:'#f7edff', ink:'#26143a', accent:'#e64276', sat:1.35, sepia:0, contrast:1.1, grain:0, font:'sans-serif'},
 vogue: {label:'Vogue · editorial', paper:'#ffffff', ink:'#151515', accent:'#151515', sat:.3, sepia:0, contrast:1.1, grain:0, font:'Georgia'},
 retro: {label:'Retro', paper:'#ffe5b7', ink:'#563f32', accent:'#cf673e', sat:.85, sepia:.25, contrast:.92, grain:.05, font:'Georgia'},
 urban: {label:'Urban', paper:'#ededeb', ink:'#121212', accent:'#d9e441', sat:.25, sepia:0, contrast:1.35, grain:.12, font:'monospace'},
 chic: {label:'Chic', paper:'#fff7ed', ink:'#252321', accent:'#ab795b', sat:.6, sepia:.1, contrast:1.02, grain:0, font:'Georgia'},
 floyde: {label:'Floyd · newsprint', paper:'#ffffff', ink:'#182222', accent:'#ed7cb1', sat:1.5, sepia:0, contrast:1.15, grain:.03, font:'sans-serif'},
 dahli: {label:'Dahli · warm', paper:'#f4deb1', ink:'#433525', accent:'#357d83', sat:1.15, sepia:.3, contrast:1.12, grain:.04, font:'Georgia'},
 picasso: {label:'Picasso · colour blocks', paper:'#fff1d7', ink:'#202020', accent:'#236eac', sat:1.25, sepia:0, contrast:1.2, grain:0, font:'sans-serif'},
 marketing: {label:'Marketing', paper:'#ffffff', ink:'#092b44', accent:'#ff693e', sat:1.15, sepia:0, contrast:1.1, grain:0, font:'sans-serif'},
 realistic: {label:'Realistic', paper:'#ffffff', ink:'#182222', accent:'#182222', sat:1, sepia:0, contrast:1, grain:0, font:'sans-serif'},
 cartoon: {label:'Cartoon · poster colour', paper:'#ffffff', ink:'#191919', accent:'#efbc35', sat:1.3, sepia:0, contrast:1.15, grain:0, poster:true, font:'sans-serif'},
 worn: {label:'Worn', paper:'#e9d8b6', ink:'#4a4235', accent:'#968567', sat:.5, sepia:.55, contrast:.85, grain:.25, font:'Georgia'}
};
export const visibleStyles = ['deco','urban','floyde','worn'];
export const defaults = () => ({schema:VERSION, font:'preset', lettering:'original', style:'original', intensity:80, width:148, height:105, sides:'front', photoSide:'front', fit:'cover', rotation:0, zoom:1, panX:0, panY:0, border:5, title:'', recipient:'', message:'', signature:'', qrEnabled:false, qrURL:'', qrSide:'back', output:'a4', bleed:0, bw:false, stock:'white', marks:true, postal:false, address:'', returnAddress:''});
const choices={lettering:['original','outline','inflated','worn'],font:['preset','adam-original','adam-capture03'],style:Object.keys(styles),sides:['front','back','both'],photoSide:['front','back','both'],fit:['cover','contain'],qrSide:['front','back'],output:['a4','card','label'],stock:['white','recycled']};
const ranges={intensity:[0,100],width:[25,297],height:[25,297],rotation:[0,270],zoom:[1,3],panX:[-100,100],panY:[-100,100],border:[0,15],bleed:[0,5]};
export function validateProject(input) {
 if(!input || input.schema!==VERSION) throw Error('This is not a supported JUICE postcard project.');
 const p=defaults();
 for(const [k,v] of Object.entries(p)) {
  if(!(k in input)) continue;
  if(choices[k]) {if(!choices[k].includes(input[k]))throw Error(`Invalid ${k}.`);p[k]=input[k];}
  else if(ranges[k]) {const n=input[k];if(typeof n!=='number'||!Number.isFinite(n)||n<ranges[k][0]||n>ranges[k][1])throw Error(`Invalid ${k}.`);p[k]=n;}
  else if(typeof v==='boolean') {if(typeof input[k]!=='boolean')throw Error(`Invalid ${k}.`);p[k]=input[k];}
  else {if(typeof input[k]!=='string'||input[k].length>(k==='qrURL'?1500:k==='message'?800:['message','address','returnAddress'].includes(k)?350:100))throw Error(`Invalid ${k}.`);p[k]=input[k];}
 }
 if(p.rotation%90)throw Error('Rotation must be a quarter turn.');
 return p;
}
export function qrDestination(raw) {
 const url=new URL(raw);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('Use a complete https:// or http:// link without login details.');return url.href;
}
export function outputSides(p){return p.sides==='both'?['front','back']:[p.sides];}
export function dimensions(p,dpi=300,bleed=0){return {width:Math.round((p.width+2*bleed)/25.4*dpi),height:Math.round((p.height+2*bleed)/25.4*dpi)};}
export function cropRect(iw,ih,aspect,p){
 let w=iw/p.zoom,h=ih/p.zoom;
 if(p.fit==='cover') {if(w/h>aspect)w=h*aspect;else h=w/aspect;}
 return {x:(iw-w)*(p.panX+100)/200,y:(ih-h)*(p.panY+100)/200,w,h};
}
