// Portable identity belongs in the saved document, never just a browser database.
import {validateProject} from './postcard-project.mjs?v=back5';
const schema='juice-project-file/2',token=/^[a-zA-Z0-9-]{16,80}$/;
const cleanName=s=>String(s||'Untitled postcard').trim().slice(0,100)||'Untitled postcard';
export async function documentIdentity(data,fallbackName=''){
 const p=validateProject(data.project);
 if(data.document!==undefined){
  const d=data.document;
  if(!d||d.schema!==schema||typeof d.id!=='string'||typeof d.revision!=='string'||!token.test(d.id)||!token.test(d.revision)||(d.parentRevision!==null&&(typeof d.parentRevision!=='string'||!token.test(d.parentRevision)))||!Number.isSafeInteger(d.sequence)||d.sequence<1||d.sequence>1000000||typeof d.name!=='string'||d.name.length>100||typeof d.createdAt!=='string'||typeof d.savedAt!=='string'||!Number.isFinite(Date.parse(d.createdAt))||!Number.isFinite(Date.parse(d.savedAt)))throw Error('Project identity is invalid. Original file kept.');
  return {schema,id:d.id,revision:d.revision,parentRevision:d.parentRevision,sequence:d.sequence,name:cleanName(d.name),createdAt:d.createdAt,savedAt:d.savedAt};
 }
 // Identical legacy copies get the same identity on either device. Different
 // legacy artwork is kept separate; never guess that matching names mean a match.
 const bytes=new TextEncoder().encode(JSON.stringify({project:p,photo:data.photo}));
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
 return {schema,id:'legacy-'+hash,revision:'legacy-'+hash,parentRevision:null,sequence:0,name:cleanName(fallbackName||p.title||p.recipient),createdAt:null,savedAt:null};
}
export function nextDocument(previous,name,{newCopy=false,now=new Date().toISOString()}={}){
 const base=newCopy?null:previous;
 return {schema,id:base?.id||crypto.randomUUID(),revision:crypto.randomUUID(),parentRevision:base?.revision||null,sequence:(base?.sequence||0)+1,name:cleanName(name||base?.name),createdAt:base?.createdAt||now,savedAt:now};
}
export function documentFilename(d){const name=d.name.normalize('NFKC').replace(/[^\p{L}\p{N}_-]+/gu,'_').replace(/^_+|_+$/g,'').slice(0,65)||'Postcard';return `${name}--r${String(d.sequence).padStart(3,'0')}--${d.revision}.juicecard.json`;}
export function shelfLabel(row){const d=row.document;return d?`${row.name} · r${d.sequence} · ${d.revision.slice(0,8)} · ${new Date(row.updated).toLocaleString()}`:`${row.name} · legacy copy · ${new Date(row.updated).toLocaleString()}`;}
