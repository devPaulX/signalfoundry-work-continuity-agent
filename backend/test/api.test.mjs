import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {createHandler} from '../src/api.mjs';
import {ARTIFACTS,WORKSPACE} from '../src/demo-data.mjs';

const sessionId='1dd00c48-968f-4a77-aa72-c5f55b397995';

test('real HTTP route sequence: workspace -> save update -> generate -> persisted retrieval',async()=>{
  const sessions=new Map();
  const store={
    async getWorkspace(id){const s=sessions.get(id)||{updates:[],snapshots:[]};return {workspace:WORKSPACE,artifacts:[...ARTIFACTS,...s.updates],updatesRemaining:3-s.updates.length};},
    async addUpdate(id,content){let s=sessions.get(id);if(!s){s={updates:[],snapshots:[]};sessions.set(id,s);}s.updates.push({id:'UPD-01',title:'New update',kind:'Team update',date:'2026-10-18',content});return {createdAt:'2026-10-18'};},
    async saveSnapshot(id,snapshot){let s=sessions.get(id);if(!s){s={updates:[],snapshots:[]};sessions.set(id,s);}const saved={id:'test-snapshot',...snapshot};s.snapshots.push(saved);return saved;},
    async latestSnapshot(id){return sessions.get(id)?.snapshots.at(-1)||null;},
  };
  const synthesize=async sources=>({model:'test-fake-injection-only',brief:{status:{value:'Pending',citations:[]},decisions:[],actions:[],blockers:[],dependencies:[],questions:[]},verification:{sourcesUsed:[],rejectedClaims:0},sourceCount:sources.length});
  const server=http.createServer(createHandler({store,synthesize}));server.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  const api=async(path,method='GET',body)=>{const r=await fetch(base+path,{method,headers:{'content-type':'application/json'},body:body&&JSON.stringify(body)});return {status:r.status,payload:await r.json()};};
  try{
    let r=await api('/api/health');assert.equal(r.status,200);
    r=await api(`/api/workspace?sessionId=${sessionId}`);assert.equal(r.payload.artifacts.length,5);
    r=await api('/api/updates','POST',{sessionId,content:'An additional fictional update records progress.'});assert.equal(r.status,201);
    r=await api(`/api/workspace?sessionId=${sessionId}`);assert.equal(r.payload.artifacts.length,6);
    r=await api('/api/briefs/generate','POST',{sessionId});assert.equal(r.status,201);assert.equal(r.payload.snapshot.sourceCount,6);
    r=await api(`/api/briefs/latest?sessionId=${sessionId}`);assert.equal(r.payload.snapshot.id,'test-snapshot');
    r=await api('/api/updates','POST',{sessionId,content:'No'});assert.equal(r.status,400);
    r=await api('/api/briefs/generate','POST',{sessionId:'../fake'});assert.equal(r.status,400);
  } finally {server.close();await once(server,'close');}
});
