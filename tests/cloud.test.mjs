import test from 'node:test';
import assert from 'node:assert/strict';
import {validate,saveChanges} from '../server/records.mjs';
import {createHandler} from '../netlify/functions/tracker.mjs';
const origin='https://form.example';
const req=(method='GET',body,requestOrigin=origin)=>new Request(origin+'/.netlify/functions/tracker',{method,headers:{origin:requestOrigin},...(body?{body:JSON.stringify(body)}:{})});
test('records can be read and edited without password or cookie',async()=>{
 delete process.env.FORM_PASSWORD;
 let data={entries:[],measurements:[]};
 const handler=createHandler(()=>({async get(){return data},async getWithMetadata(){return {data,etag:'1'}},async setJSON(key,next){data=next;return {modified:true}}}));
 const initial=await handler(req());assert.equal(initial.status,200);assert.deepEqual(await initial.json(),data);
 const saved=await handler(req('POST',{changes:[{type:'habit',date:'2026-11-09',habit:0,state:1}]}));assert.equal(saved.status,200);
 const read=await handler(req());assert.equal((await read.json()).entries[0].state,1);assert.equal(read.headers.get('cache-control'),'no-store');
 assert.equal((await handler(req('POST',{changes:[]},'https://elsewhere.example'))).status,403);
 assert.equal((await handler(req('POST',{changes:[{type:'habit',date:'2026-11-09',habit:0,state:9}]}))).status,400);
});
test('entry validation rejects future and invalid states and non-Sunday weights',()=>{assert.ok(validate([{type:'habit',date:'2026-11-09',habit:2,state:3}]));assert.ok(validate([{type:'weight',date:'2026-11-08',kg:82}]));assert.equal(validate([{type:'weight',date:'2026-11-09',kg:82}]),false);assert.equal(validate([{type:'habit',date:'2099-11-09',habit:0,state:1}]),false);assert.equal(validate([{type:'habit',date:'2026-11-09',habit:0,state:9}]),false)});
test('concurrent device updates retain both records using conditional writes',async()=>{let data=null,version=0;const store={async getWithMetadata(){const snapshot=data?{data:structuredClone(data),etag:String(version)}:null;await Promise.resolve();return snapshot},async setJSON(key,next,options){if(options.onlyIfNew&&data||options.onlyIfMatch&&options.onlyIfMatch!==String(version))return {modified:false};data=structuredClone(next);version++;return {modified:true}}};await Promise.all([saveChanges(store,[{type:'habit',date:'2026-11-09',habit:0,state:1}]),saveChanges(store,[{type:'habit',date:'2026-11-09',habit:1,state:3}])]);assert.equal(data.entries.length,2);await saveChanges(store,[{type:'habit',date:'2026-11-09',habit:0,state:2}]);assert.equal(data.entries.length,2);assert.equal(data.entries.find(e=>e.habit===0).state,2)});
