import test from 'node:test';
import assert from 'node:assert/strict';
import {SyncQueue} from '../src/sync.ts';
import {readStore,type Store} from '../src/storage.ts';
const date='2026-01-01',revision='2026-01-01T00:00:00Z';
const makeStore=():Store=>({entries:{[date]:{date,updatedAt:revision,energy:2}},pending:{[date]:revision}});
const memory=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value)}});
test('offline queue survives reload and only clears after successful Notion sync',async()=>{
 const store=makeStore();const messages:string[]=[];const queue=new SyncQueue(store,s=>messages.push(s));
 globalThis.fetch=async()=>new Response(JSON.stringify({synced:false}));await queue.flush();assert.ok(store.pending[date]);assert.equal(messages.at(-1),'ローカル保存済 / Notion未同期');
 globalThis.fetch=async()=>new Response(JSON.stringify({synced:true}));await queue.flush();assert.equal(store.pending[date],undefined);assert.equal(messages.at(-1),'保存済');
});
test('editing during an in-flight request cannot acknowledge the newer revision',async()=>{
 const store=makeStore();let complete!:(r:Response)=>void;
 globalThis.fetch=()=>new Promise(resolve=>{complete=resolve});
 const queue=new SyncQueue(store,()=>{});const flushing=queue.flush();
 store.entries[date]={...store.entries[date],energy:4,updatedAt:'2026-01-01T00:00:01Z'};store.pending[date]=store.entries[date].updatedAt;
 complete(new Response(JSON.stringify({synced:true})));await flushing;
 assert.equal(store.pending[date],'2026-01-01T00:00:01Z');
});
test('one Notion failure does not prevent other dates reaching local server',async()=>{
 const store=makeStore();const second='2026-01-02';store.entries[second]={date:second,updatedAt:revision};store.pending[second]=revision;let calls=0;
 globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({synced:false}))};
 await new SyncQueue(store,()=>{}).flush();assert.equal(calls,2);assert.equal(Object.keys(store.pending).length,2);
});
test('legacy migration preserves original and does not conflate mood with suicidal thought',()=>{
 memory.clear();const original=JSON.stringify({[date]:{mood:1,sleep_hours:8,creative_hours:2}});memory.set('moodSignageEntries',original);
 const store=readStore();assert.equal(store.entries[date].sleepHours,8);assert.equal(store.entries[date].hobbyHours,2);assert.equal(store.entries[date].mood,undefined);assert.equal(store.entries[date].suicidalThought,undefined);assert.equal(memory.get('moodSignageEntries'),original);
});
