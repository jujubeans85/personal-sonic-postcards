import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {defaults,validateProject,qrDestination,dimensions,cropRect,outputSides,styles} from '../shared/postcard-project.mjs';
test('shared renderer is the exact pinned upstream artifact; dependencies retain checksums',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../shared/vendor/manifest.json',import.meta.url)));
 for(const [name,hash] of Object.entries(manifest.files))assert.equal(createHash('sha256').update(readFileSync(new URL('../shared/vendor/'+name,import.meta.url))).digest('hex'),hash,name);
 assert.equal(manifest.commit,'ef4ef609794062e44ff4b403ef7da8f640a6ce7e');
});
test('project contract rejects unbounded imports and does not accept arbitrary style/code',()=>{
 assert.deepEqual(validateProject(defaults()),defaults());
 for(const patch of [{width:0},{width:Infinity},{width:'148'},{style:'<script>'},{rotation:45},{qrEnabled:'yes'},{message:'x'.repeat(351)}])assert.throws(()=>validateProject({...defaults(),...patch}));
 assert.throws(()=>validateProject({schema:'other'}));
 assert.equal('script' in validateProject({...defaults(),script:'alert(1)'}),false);
});
test('URLs and output geometry preserve destination and correct physical proportions',()=>{
 assert.equal(qrDestination('https://example.org/gift?t=abc#play'),'https://example.org/gift?t=abc#play');
 for(const url of ['javascript:alert(1)','data:text/plain,hi','https://user:pass@example.org','/relative'])assert.throws(()=>qrDestination(url));
 assert.deepEqual(dimensions(defaults()),{width:1748,height:1240});
 assert.deepEqual(outputSides({...defaults(),sides:'both'}),['front','back']);
 const p=defaults();assert.deepEqual(cropRect(2000,1000,1,p),{x:500,y:0,w:1000,h:1000});
 assert.equal(cropRect(2000,1000,1,{...p,panX:-100}).x,0);
 assert.equal(cropRect(2000,1000,1,{...p,panX:100}).x,1000);
 assert.equal(cropRect(2000,1000,1,{...p,fit:'contain'}).w,2000);
 assert.equal(Object.keys(styles).length,15);
});
test('upstream renderer executes cover, contain, wash and transparency without storage',()=>{
 const scope={};vm.runInNewContext(readFileSync(new URL('../shared/vendor/composition.js',import.meta.url),'utf8'),scope);
 const calls=[];const ctx={canvas:{width:200,height:100},save(){},restore(){},fillRect(){},drawImage(...args){calls.push(args)}};
 scope.JuiceComposition.drawBackground(ctx,{image:{width:100,height:100},fit:'cover',wash:.5});assert.deepEqual(calls[0].slice(1),[0,-50,200,200]);assert.equal(ctx.globalAlpha,.5);
 scope.JuiceComposition.drawBackground(ctx,{image:{width:100,height:100},fit:'contain'});assert.deepEqual(calls[1].slice(1),[50,0,100,100]);
 scope.JuiceComposition.drawBackground(ctx,{transparent:true});assert.equal(calls.length,2);
});
test('maker disables network connections and contains no persistence or network photo path',()=>{
 const html=readFileSync(new URL('../collections/maker/index.html',import.meta.url),'utf8');assert.match(html,/connect-src 'none'/);
 const src=readFileSync(new URL('../collections/maker/maker.mjs',import.meta.url),'utf8');assert.doesNotMatch(src,/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|\.openStore\(|\.transact\(/);
 assert.match(src,/pagehide/);assert.match(src,/revokeObjectURL/);
});

test('preset lettering preserves deliberate line breaks and rejects overflowing short cards',async()=>{
 const {renderCard}=await import('../shared/postcard-renderer.mjs');
 globalThis.JuiceComposition={drawBackground(){}};
 const calls=[],ctx={clearRect(){},measureText:s=>({width:s.length}),fillText:(...args)=>calls.push(args)};
 const target={width:1480,height:1050,getContext:()=>ctx};
 renderCard(target,{...defaults(),sides:'back',message:'FIRST\nSECOND'},null,'back');
 assert.deepEqual(calls.map(c=>c[0]),['FIRST','SECOND']);
 assert.ok(calls[1][2]>calls[0][2]);
 assert.throws(()=>renderCard(target,{...defaults(),height:25,message:'HELLO'},null,'back'),/more height/);
 delete globalThis.JuiceComposition;
});

test('four public recipes and postal geometry reserve the address and lower clear zone',async()=>{
 const {visibleStyles}=await import('../shared/postcard-project.mjs');
 assert.deepEqual(visibleStyles,['deco','urban','floyde','worn']);
 const {postalGeometry}=await import('../shared/postcard-renderer.mjs');
 const g=postalGeometry({...defaults(),width:150});assert.equal(g.bottom,90);assert.equal(g.addressX,85);assert.equal(g.addressWidth,50);
 assert.throws(()=>postalGeometry({...defaults(),width:100,height:50}),/Postal back/);
});
test('Floyd diffusion and strength preserve determinism, endpoints and alpha',async()=>{
 const {floydBits,treatPixels}=await import('../shared/photo-treatments.mjs');
 const a=floydBits(new Float32Array(100).fill(128),10,10);assert.ok(a.includes(0)&&a.includes(255));assert.deepEqual(a,floydBits(new Float32Array(100).fill(128),10,10));
 const raw=new Uint8ClampedArray([100,140,180,255,20,20,20,0]);
 for(const style of ['urban','deco','worn']){assert.deepEqual(treatPixels({data:raw.slice()},style,0).data,raw);const full=treatPixels({data:raw.slice()},style,100).data;assert.notDeepEqual(full,raw);assert.deepEqual(full.slice(4),raw.slice(4));}
});
test('index backups whitelist metadata and per-person send history does not affect other recipients',async()=>{
 const {validateIndex,suggestions,mergeIndexes}=await import('../shared/link-index.mjs');
 const raw={schema:'juice-links/1',profiles:[{id:'p1',name:'Mark'},{id:'p2',name:'Mimi'}],links:[{id:'l1',url:'https://example.org',title:'Music',note:'For you',category:'other',profileIds:['p1','p2'],photo:'do not persist'}],sent:[{linkId:'l1',profileId:'p1',at:'2026-09-22T00:00:00Z'}],photo:'secret'};
 const clean=validateIndex(raw);assert.ok(!JSON.stringify(clean).includes('photo'));assert.equal(suggestions(clean,{profileId:'p1'}).length,0);assert.equal(suggestions(clean,{profileId:'p2'}).length,1);
 assert.deepEqual(mergeIndexes(clean,clean),clean);assert.throws(()=>validateIndex({...raw,links:[{...raw.links[0],url:'javascript:alert(1)'}]}));
});
