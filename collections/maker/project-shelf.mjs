// Only explicit Save persists a project, including its original photo. Never autosave.
const dbName='juice-postcard-projects';
function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open(dbName,1);r.onupgradeneeded=()=>r.result.createObjectStore('projects',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function run(mode,action){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('projects',mode);let request;try{request=action(tx.objectStore('projects'));}catch(e){db.close();reject(e);return;}tx.oncomplete=()=>{db.close();resolve(request.result);};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error||Error('Storage transaction failed.'));};});}
export const listProjects=async()=>(await run('readonly',s=>s.getAll())).map(({id,name,updated})=>({id,name,updated})).sort((a,b)=>b.updated-a.updated);
export const getProject=id=>run('readonly',s=>s.get(id));
export const removeProject=id=>run('readwrite',s=>s.delete(id));
export async function saveProject({id,name,blob}){id=id||crypto.randomUUID();await run('readwrite',s=>s.put({id,name:name.slice(0,100),blob,updated:Date.now()}));return id;}
