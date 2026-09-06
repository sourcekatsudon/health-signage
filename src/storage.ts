import {validEntry,type Entry} from './model';
export const storageKey='healthSignage.v2';
export type Store={entries:Record<string,Entry>;pending:Record<string,string>};
export function readStore():Store {
 const raw=localStorage.getItem(storageKey);
 if(raw){const s=JSON.parse(raw) as Store;if(!s.entries||!s.pending||!Object.values(s.entries).every(validEntry))throw Error('保存データを読み取れません');return s;}
 const legacy=JSON.parse(localStorage.getItem('moodSignageEntries')||'{}');
 const entries:Record<string,Entry>={};
 // Preserve the original key verbatim. Old mood included suicidal language:
 // it must not be silently mapped to either new independent mental-health scale.
 for(const [date,v] of Object.entries(legacy) as [string,Record<string,number>][]) {
  const e:Entry={date,updatedAt:new Date().toISOString(),sleepHours:v.sleep_hours,hobbyHours:v.creative_hours};
  if(validEntry(e))entries[date]=e;
 }
 return {entries,pending:Object.fromEntries(Object.values(entries).map(e=>[e.date,e.updatedAt]))};
}
export function writeStore(s:Store){localStorage.setItem(storageKey,JSON.stringify(s));}
