import {fields,today,shiftDate,validEntry,type Entry,type Field} from './model';
import {assess} from './state';
import {selectSuggestions} from './suggestions';
import {readStore,writeStore,type Store} from './storage';
import {SyncQueue} from './sync';
import {syncConfig} from './config';
import {LocalHealthMetricsProvider} from './provider';
import {drawCharts} from './charts';
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const labels:Record<Field,string>={energy:'エネルギー / 回復感',mood:'気分 / 興味',suicidalThought:'死にたい気持ち',moyamoya:'モヤモヤ度',realityHandling:'現実対処力',workHours:'仕事時間',hobbyHours:'趣味・副業・創作時間'};
const meanings:Partial<Record<Field,string[]>>={energy:['かなり低い・動けない','疲れている','普通','まあ元気','よく寝た・エネルギー高'],mood:['かなり落ち込む','悪い','普通','良い','クリエイティブ・楽しい'],suicidalThought:['なし','少しちらつく','そこそこある','強い','非常に強い'],moyamoya:['なし','少し','気になる','強い','かなり強い・身動きが取りづらい'],realityHandling:['分かっている問題にもほぼ着手できない','メール返信・電話・タスクを避け始めている','後回しが増えている','面倒だが対応できる','面倒な問題でも普通に処理できる']};
const shortLabels:Partial<Record<Field,string[]>>={energy:['低い','疲れ','普通','元気','高い'],mood:['落ち込む','悪い','普通','良い','楽しい'],suicidalThought:['なし','少し','ある','強い','非常に強い'],moyamoya:['なし','少し','気になる','強い','かなり強い'],realityHandling:['着手困難','避ける','後回し','対応可','問題なし']};
let store:Store;let storageHealthy=true;
try{store=readStore()}catch{store={entries:{},pending:{}};storageHealthy=false;el('save-status').textContent='保存データを確認してください（上書き停止）'}
let selected=today(),lastToday=today(),revision=0;
const status=(s:string)=>{if(storageHealthy)el('save-status').textContent=s};
const sync=new SyncQueue(store,status);
const provider=new LocalHealthMetricsProvider(()=>store.entries);
function current():Entry{return store.entries[selected]??{date:selected,updatedAt:new Date().toISOString()}}
function persist(){try{if(!storageHealthy)throw Error();writeStore(store);return true}catch{storageHealthy=false;el('save-status').textContent='ローカル保存失敗 / 画面を閉じないでください';return false}}
function commit(e:Entry){if(!storageHealthy)return;e.updatedAt=new Date(Math.max(Date.now(),revision+1)).toISOString();revision=Date.parse(e.updatedAt);store.entries[e.date]=e;store.pending[e.date]=e.updatedAt;if(persist())sync.schedule();render()}
function setValue(key:Field,value:number){commit({...current(),[key]:value})}
for(const key of fields){
 const card=document.createElement('section');card.className='field';card.dataset.key=key;card.setAttribute('aria-label',labels[key]);
 const head=document.createElement('div');head.className='field-label';const label=document.createElement('span');label.textContent=labels[key];head.append(label);const meaning=document.createElement('span');meaning.className='meaning';meaning.id='meaning-'+key;head.append(meaning);card.append(head);
 if(meanings[key]){
  const group=document.createElement('div');group.className='segments';const min=key==='moyamoya'||key==='suicidalThought'?0:1;
  meanings[key]!.forEach((text,i)=>{const b=document.createElement('button');b.type='button';b.dataset.key=key;b.dataset.value=String(i+min);b.setAttribute('aria-label',`${labels[key]} ${i+min}: ${text}`);b.setAttribute('aria-pressed','false');b.append(String(i+min));const small=document.createElement('small');small.textContent=shortLabels[key]![i];b.append(small);b.onclick=()=>setValue(key,i+min);group.append(b)});card.append(group);
 }else{
  const group=document.createElement('div');group.className='hours';
  const minus=document.createElement('button');minus.textContent='−';minus.setAttribute('aria-label',labels[key]+'を0.5時間減らす');minus.onclick=()=>setValue(key,Math.max(0,(current()[key]??0)-.5));
  const output=document.createElement('output');output.id='value-'+key;
  const range=document.createElement('input');range.type='range';range.min='0';range.max='16';range.step='0.5';range.id=key;range.setAttribute('aria-label',labels[key]);range.oninput=()=>setValue(key,Number(range.value));
  const plus=document.createElement('button');plus.textContent='+';plus.setAttribute('aria-label',labels[key]+'を0.5時間増やす');plus.onclick=()=>setValue(key,Math.min(16,(current()[key]??0)+.5));group.append(minus,output,range,plus);card.append(group);
 }
 el('fields').append(card);
}
function render(){
 const e=current();el<HTMLInputElement>('date').value=selected;el<HTMLInputElement>('date').max=today();el<HTMLButtonElement>('next').disabled=selected>=today();el('input-title').textContent=selected===today()?'今日の入力':'過去日の入力';el<HTMLButtonElement>('copy').disabled=!store.entries[shiftDate(selected,-1)];
 for(const key of fields){const v=e[key];if(meanings[key]){const min=key==='moyamoya'||key==='suicidalThought'?0:1;el('meaning-'+key).textContent=v==null?'未入力':meanings[key]![v-min];document.querySelectorAll<HTMLButtonElement>(`button[data-key="${key}"]`).forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.value)===v)))}else{el('value-'+key).textContent=v==null?'—':String(v);el<HTMLInputElement>(key).value=String(v??0);el('meaning-'+key).textContent=v==null?'未入力 · 0〜16時間':'時間 · 0.5時間刻み'}}
 const count=fields.filter(key=>e[key]!=null).length;
 el('entry-progress').textContent=`${count} / ${fields.length} 項目`;
 fields.forEach((key,i)=>{document.querySelector<HTMLElement>(`.field[data-key="${key}"]`)!.dataset.filled=String(e[key]!=null);(el('progress-dots').children[i] as HTMLElement).dataset.filled=String(e[key]!=null)});
 for(const key of ['workHours','hobbyHours'] as const){el<HTMLInputElement>(key).style.setProperty('--range-fill',`${(e[key]??0)/16*100}%`)}
 drawCharts(store.entries,selected);renderSupport();void renderMetrics();
}
function renderSupport(){
 // Today's safety message stays visible while editing historical records.
 const actual=store.entries[today()];const e=actual??{date:today(),updatedAt:new Date().toISOString()};const state=assess(e),box=el('support');box.replaceChildren();box.className='support';const title=document.createElement('strong'),body=document.createElement('p');box.append(title,body);
 if(state.high){box.classList.add('high');title.textContent='今日は、一人で抱えない日';body.textContent='誰か一人に連絡して、今の状態をそのまま伝える。具体的な方法を考え始めているなら、人・医療・緊急支援につなぐ。'}
 else if(state.declining){box.classList.add('warning');title.textContent=state.watch?'今日は誰かとつながって':'調子が崩れてきている';body.textContent='今日の候補： '+selectSuggestions(e).map(s=>s.text).join(' / ')}
 else if(state.watch){box.classList.add('warning');title.textContent='少し、気にかけておく日';body.textContent='今の気持ちを、一人で抱えず誰かに伝えてもいい。'}
 else {title.textContent='今日の観測';body.textContent=state.incomplete?'まだ未入力の項目があります。今の自分に近いところをタップ。':'今日の記録を受け取りました。変化を、少しずつ見ていきましょう。'}
}
async function renderMetrics(){const day=today();const [sleep,steps]=await Promise.all([provider.getSleepDuration(day),provider.getSteps(day)]);el('sleep').textContent=sleep==null?'— 未接続':sleep+' h';el('steps').textContent=steps==null?'— 未接続':steps.toLocaleString()+' 歩'}
el<HTMLInputElement>('date').onchange=()=>{const d=el<HTMLInputElement>('date').value;if(d&&d<=today()){selected=d;render()}};
el('prev').onclick=()=>{selected=shiftDate(selected,-1);render()};el('next').onclick=()=>{if(selected<today()){selected=shiftDate(selected,1);render()}};el('today').onclick=()=>{selected=today();render()};
el('copy').onclick=()=>{const previous=store.entries[shiftDate(selected,-1)];if(previous){const e={...current()};fields.forEach(k=>e[k]=previous[k]??null);commit(e)}};
el('export').onclick=()=>{const blob=new Blob([JSON.stringify({version:2,entries:store.entries,legacy:JSON.parse(localStorage.getItem('moodSignageEntries')||'null')},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='health-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
el('import').onclick=()=>el<HTMLInputElement>('import-file').click();
el<HTMLInputElement>('import-file').onchange=async()=>{try{const file=el<HTMLInputElement>('import-file').files?.[0];if(!file)return;const parsed=JSON.parse(await file.text());const records=Object.values(parsed.entries??parsed);if(!records.length||!records.every(validEntry)||records.some(e=>(e as Entry).date>today()))throw Error();for(const e of records as Entry[]){if(!store.entries[e.date]||e.updatedAt>store.entries[e.date].updatedAt){store.entries[e.date]=e;store.pending[e.date]=e.updatedAt}}if(persist()){sync.schedule();render()}}catch{status('読み込み失敗：v2 JSON形式を確認')}finally{el<HTMLInputElement>('import-file').value=''}};
async function hydrate(){try{const response=await fetch('/api/health-log');if(!response.ok)throw Error();const data=await response.json();for(const e of data.entries as Entry[]){if(!validEntry(e))continue;const local=store.entries[e.date];if(!local||e.updatedAt>=local.updatedAt){store.entries[e.date]=e;if(data.pending.includes(e.date))store.pending[e.date]=e.updatedAt;else delete store.pending[e.date]}}if(persist()){render();if(Object.keys(store.pending).length)void sync.flush();else status(data.notionConfigured?'保存済':'ローカル保存 / Notion未設定')}}catch{status('ローカル表示 / サーバー未接続')}}
render();void hydrate();
window.addEventListener('online',()=>void sync.flush());
setInterval(()=>{const now=today();if(now!==lastToday){if(selected===lastToday)selected=now;lastToday=now;render()}if(Object.keys(store.pending).length)void sync.flush()},syncConfig.retryMs);
