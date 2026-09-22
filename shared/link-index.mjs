import {qrDestination} from './postcard-project.mjs';
export const INDEX_KEY='juice-link-index-v1';
export const categories=['other','commercial','community'];
export const emptyIndex=()=>({schema:'juice-links/1',profiles:[],links:[],sent:[]});
const str=(s,max=350)=>{if(typeof s!=='string'||s.length>max)throw Error('Invalid link index text.');return s;};
const id=s=>{str(s,100);if(!/^[a-zA-Z0-9_-]+$/.test(s))throw Error('Invalid index ID.');return s;};
export function validateIndex(raw){
 if(!raw||raw.schema!=='juice-links/1'||!Array.isArray(raw.profiles)||!Array.isArray(raw.links)||!Array.isArray(raw.sent)||raw.profiles.length>1000||raw.links.length>5000||raw.sent.length>20000)throw Error('Not a supported link-index backup (maximum 5,000 links).');
 const p=raw.profiles.map(x=>({id:id(x.id),name:str(x.name,100)})),pids=new Set(p.map(x=>x.id));
 if(pids.size!==p.length)throw Error('Duplicate profile ID.');
 const links=raw.links.map(x=>{
  if(!Array.isArray(x.profileIds)||x.profileIds.length>1000||x.profileIds.some(v=>!pids.has(v))||!categories.includes(x.category))throw Error('Invalid link category or profile.');
  return {id:id(x.id),url:qrDestination(str(x.url,1500)),title:str(x.title,150),note:str(x.note,1000),category:x.category,profileIds:[...new Set(x.profileIds)]};
 });const lids=new Set(links.map(x=>x.id));if(lids.size!==links.length)throw Error('Duplicate link ID.');
 const sent=raw.sent.map(x=>{if(!pids.has(x.profileId)||!lids.has(x.linkId)||!Number.isFinite(Date.parse(x.at)))throw Error('Invalid send history.');return {profileId:id(x.profileId),linkId:id(x.linkId),at:str(x.at,40)};});
 return {schema:'juice-links/1',profiles:p,links,sent};
}
export function mergeIndexes(current,incoming){
 const a=validateIndex(current),b=validateIndex(incoming);
 // IDs keep the same link and person across backup copies. Current records win on conflicts.
 const merge=(old,next,key)=>[...new Map([...next,...old].map(x=>[key(x),x])).values()];
 return validateIndex({schema:a.schema,profiles:merge(a.profiles,b.profiles,x=>x.id),links:merge(a.links,b.links,x=>x.id),sent:merge(a.sent,b.sent,x=>x.linkId+'|'+x.profileId)});
}
export function suggestions(index,{profileId='',category='all',unused=true,query=''}={}){
 const q=query.trim().toLowerCase();return index.links.filter(x=>
  (!profileId||x.profileIds.includes(profileId))&&(category==='all'||x.category===category)&&
  (!profileId||!unused||!index.sent.some(s=>s.linkId===x.id&&s.profileId===profileId))&&
  (!q||[x.title,x.url,x.note].join(' ').toLowerCase().includes(q)));
}
// Only this metadata module accesses storage. Call saveIndex only after an explicit index action.
export function loadIndex(){const s=localStorage.getItem(INDEX_KEY);return s?validateIndex(JSON.parse(s)):emptyIndex();}
export function saveIndex(index){const clean=validateIndex(index);localStorage.setItem(INDEX_KEY,JSON.stringify(clean));return clean;}
