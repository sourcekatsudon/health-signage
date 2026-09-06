export const fields = ['energy','mood','suicidalThought','moyamoya','realityHandling','workHours','hobbyHours'] as const;
export type Field = typeof fields[number];
export type Metric = Field | 'sleepHours' | 'steps';
export type Entry = {date:string; updatedAt:string} & Partial<Record<Metric,number|null>>;
export const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const shiftDate = (date:string,n:number) => new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
export const datesFor = (date:string) => Array.from({length:14},(_,i)=>shiftDate(date,i-13));
export const limits:Record<Metric,[number,number,number]> = {energy:[1,5,1],mood:[1,5,1],suicidalThought:[0,4,1],moyamoya:[0,4,1],realityHandling:[1,5,1],workHours:[0,16,.5],hobbyHours:[0,16,.5],sleepHours:[0,24,.01],steps:[0,200000,1]};
export function validEntry(e:unknown):e is Entry {
 if(!e||typeof e!=='object') return false;
 const r=e as Entry;
 if(Object.keys(r).some(k=>!['date','updatedAt',...Object.keys(limits)].includes(k)))return false;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(Date.parse(r.date))||new Date(r.date).toISOString().slice(0,10)!==r.date||!Number.isFinite(Date.parse(r.updatedAt))) return false;
 return Object.entries(limits).every(([k,[min,max,step]])=>{const v=r[k as Metric];return v==null || (typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max&&Math.abs(v/step-Math.round(v/step))<1e-6)});
}
