import {emptyIndex,loadIndex,saveIndex,validateIndex,mergeIndexes,suggestions} from '../../shared/link-index.mjs';
import {qrDestination} from '../../shared/postcard-project.mjs';
export function mountLinkLibrary({getURL,useURL}){
 const $=id=>document.getElementById(id),say=s=>$('index-status').textContent=s;
 let index=emptyIndex(),selected='',blocked=false;
 try{index=loadIndex();}catch(e){blocked=true;say('Saved index could not be read. Existing storage has been left untouched; saving is disabled to avoid replacing it.');}
 const option=(v,t)=>Object.assign(document.createElement('option'),{value:v,textContent:t});
 function commit(next){if(blocked)throw Error('Index storage is unavailable or unreadable. Existing data has not been overwritten.');index=saveIndex(next);render();}
 function render(){
  const profile=$('index-profile').value,assign=[...$('link-profile').selectedOptions].map(o=>o.value);
  for(const id of ['index-profile','link-profile']){$(id).replaceChildren(option('',id==='index-profile'?'All profiles':'No profile · Other by default'));for(const p of index.profiles)$(id).append(option(p.id,p.name));}
  $('index-profile').value=profile;for(const o of $('link-profile').options)o.selected=assign.includes(o.value);
  const found=suggestions(index,{profileId:profile,category:$('index-category').value,unused:$('index-unused').checked,query:$('index-search').value});
  $('index-links').replaceChildren(option('',found.length?'Choose a saved link…':'No matching links yet'));
  for(const l of found)$('index-links').append(option(l.id,l.title||l.url));
  if(found.some(l=>l.id===selected))$('index-links').value=selected;else selected='';
  const l=index.links.find(x=>x.id===selected);$('selected-note').textContent=l?.note||'';
  $('use-link').disabled=!l;$('delete-link').disabled=!l;$('mark-sent').disabled=!l||!profile;
  const sent=l&&index.sent.some(s=>s.linkId===l.id&&s.profileId===profile);
  $('mark-sent').textContent=sent?'Undo sent to this person':'Mark sent to this person';
  $('index-count').textContent=`${index.links.length} saved links · ${index.profiles.length} profiles`;
 }
 for(const id of ['index-profile','index-category','index-unused'])$(id).onchange=render;
 $('index-search').oninput=render;
 $('index-links').onchange=()=>{selected=$('index-links').value;const l=index.links.find(x=>x.id===selected);if(l){$('link-url').value=l.url;$('link-title').value=l.title;$('link-note').value=l.note;$('link-category').value=l.category;for(const o of $('link-profile').options)o.selected=l.profileIds.includes(o.value);}render();};
 $('use-link').onclick=()=>{const l=index.links.find(x=>x.id===selected);if(l)useURL(l.url);};
 $('capture-url').onclick=()=>{$('link-url').value=getURL();selected='';$('link-title').value='';$('link-note').value='';$('index-editor').open=true;render();};
 $('new-link').onclick=()=>{selected='';for(const id of ['link-url','link-title','link-note','new-profile'])$(id).value='';$('index-editor').open=true;render();};
 $('save-link').onclick=()=>{try{
  const next=structuredClone(index),name=$('new-profile').value.trim();let pids=[...$('link-profile').selectedOptions].map(o=>o.value).filter(Boolean);
  if(name){let p=next.profiles.find(x=>x.name.toLowerCase()===name.toLowerCase());if(!p){p={id:crypto.randomUUID(),name};next.profiles.push(p);}pids.push(p.id);}
  const prior=next.links.find(x=>x.id===selected);
  const link={id:prior?.id||crypto.randomUUID(),url:qrDestination($('link-url').value.trim()),title:$('link-title').value.trim(),note:$('link-note').value.trim(),category:$('link-category').value,profileIds:[...new Set(pids)]};
  const existing=next.links.find(x=>x.url===link.url&&x.id!==link.id);
  if(existing)throw Error('This URL is already saved. Select its existing entry to edit it.');
  if(prior)next.links[next.links.indexOf(prior)]=link;else next.links.push(link);
  commit(next);selected=link.id;$('new-profile').value='';render();say('Link saved on this device. Export a backup to keep it safely for years.');
 }catch(e){say(e.message);}};
 $('mark-sent').onclick=()=>{try{const next=structuredClone(index),pid=$('index-profile').value;const i=next.sent.findIndex(s=>s.linkId===selected&&s.profileId===pid);if(i>=0)next.sent.splice(i,1);else next.sent.push({linkId:selected,profileId:pid,at:new Date().toISOString()});commit(next);say(i>=0?'Send record removed.':'Marked sent. It is now hidden by “Not yet sent” for this person.');}catch(e){say(e.message);}};
 $('delete-link').onclick=()=>{try{const next=structuredClone(index);next.links=next.links.filter(x=>x.id!==selected);next.sent=next.sent.filter(x=>x.linkId!==selected);commit(next);say('Link removed. You can restore it from an exported backup.');}catch(e){say(e.message);}};
 $('backup-index').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(index,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='juice-links-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);say('Backup exported. It contains link notes, profiles and send history; no photos or postcard messages.');};
 $('restore-index').onchange=async()=>{try{const f=$('restore-index').files[0];if(!f)return;if(f.size>4*1024*1024)throw Error('Backup is too large (4 MiB maximum).');const incoming=validateIndex(JSON.parse(await f.text()));commit(mergeIndexes(index,incoming));say('Backup merged. Existing records kept where IDs matched.');}catch(e){say(e.message);}finally{$('restore-index').value='';}};
 render();
}
