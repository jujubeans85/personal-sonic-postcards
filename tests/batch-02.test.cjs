const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../shared/nfc-transport.js'),'utf8');
function setup(Reader){const c=vm.createContext({NDEFReader:Reader,AbortController,TextDecoder,setTimeout,clearTimeout});vm.runInContext(source,c);return c.JuiceNFCTransport;}
test('unsupported devices require explicit simulation and mark result',async()=>{
 const api=setup();await assert.rejects(api.read(),/cancelled/);assert.equal((await api.read({confirmSimulation:()=>true})).simulated,true);
 await assert.rejects(api.writePreset('hall'),/unavailable/);
});
test('reading handlers are ready before scan; malformed records tolerated; scan stops after success',async()=>{
 let reader,signal;
 class Reader {constructor(){reader=this;}scan(opts){signal=opts.signal;this.onreading({serialNumber:'123456789',message:{records:[{recordType:'text',encoding:'bad-encoding',data:new Uint8Array()},{recordType:'text',data:new TextEncoder().encode('JUICE-ROOM:hall')}]}});return Promise.resolve();}}
 const result=await setup(Reader).read({acceptPreset:id=>id==='hall'});assert.equal(result.presetFromCard,'hall');assert.equal(signal.aborted,true);assert.equal(reader.onreading,null);
});
test('scan failure, reading error and timeout clean up',async()=>{
 for(const mode of ['throw','reject','readingerror','timeout']) {
  let reader,signal;class Reader {constructor(){reader=this;}scan(o){signal=o.signal;if(mode==='throw')throw Error('denied');if(mode==='reject')return Promise.reject(Error('denied'));if(mode==='readingerror')this.onreadingerror();return Promise.resolve();}}
  await assert.rejects(setup(Reader).read({timeoutMs:5}));assert.equal(signal.aborted,true);assert.equal(reader.onreading,null);
 }
});
test('write uses NDEFReader and passes abortable operation',async()=>{
 let data,signal;class Reader {async write(d,o){data=d;signal=o.signal;}}
 assert.equal(await setup(Reader).writePreset('hall'),true);assert.equal(data.records[0].data,'JUICE-ROOM:hall');assert.ok(signal);
});
test('both maintained consumers use canonical transport',()=>{
 const main=fs.readFileSync(path.join(__dirname,'../juice-cinema.html'),'utf8');const module=fs.readFileSync(path.join(__dirname,'../juice-cinema/src/nfc-manager.js'),'utf8');
 assert.match(main,/src="\.\/shared\/nfc-transport.js"/);assert.match(module,/import '\.\.\/\.\.\/shared\/nfc-transport.js'/);
 for(const s of [main,module]) assert.doesNotMatch(s,/new NDEFWriter|new NDEFReader/);
});
