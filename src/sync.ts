import type {Store} from './storage';
import {writeStore} from './storage';
import {syncConfig} from './config';
export class SyncQueue {
 private running=false;private timer:ReturnType<typeof setTimeout>|undefined;
 constructor(private store:Store,private status:(s:string)=>void){}
 schedule(){clearTimeout(this.timer);this.status('保存中…');this.timer=setTimeout(()=>void this.flush(),syncConfig.debounceMs)}
 async flush(){
  if(this.running)return;this.running=true;let failed=false;
  try {
   for(const [date,revision] of Object.entries(this.store.pending)) {
    try {
     const entry=this.store.entries[date];
     const response=await fetch('/api/health-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(entry),signal:AbortSignal.timeout(20000)});
     if(!response.ok)throw Error('local server');
     const result=await response.json();
     if(!result.synced)throw Error('Notion');
     if(this.store.pending[date]===revision){delete this.store.pending[date];writeStore(this.store)}
    }catch{failed=true}
   }
   this.status(failed?'ローカル保存済 / Notion未同期':Object.keys(this.store.pending).length?'保存中…':'保存済');
  }finally{this.running=false}
 }
}
