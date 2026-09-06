import type {Entry} from './model';
import {assess} from './state';
import {warningConfig as c} from './config';
type Suggestion={text:string;tags:string[];unsafe?:boolean};
export const suggestions:Suggestion[] = [
 {text:'問題を先延ばしにしているから病む。',tags:['reality']},
 {text:'今の状態に名前をつけてみろ',tags:['reflection']},
 {text:'「もやもやワーク」で書き出す',tags:['reflection']},
 {text:'Moppyで小遣い稼ぎ',tags:['low-energy']},
 {text:'焼き肉に行く',tags:['low-energy','food']},
 {text:'温泉に行く',tags:['low-energy'],unsafe:true},
 {text:'妙音沢に行く',tags:['outdoor','nature'],unsafe:true},
 {text:'教会に行く',tags:['outdoor','social']},
 {text:'庭園に行く',tags:['outdoor','nature']},
 {text:'山奥で温泉に入る',tags:['nature'],unsafe:true},
 {text:'モルズを散歩させる',tags:['low-energy','outdoor']},
 {text:'作ったものをNoteに',tags:['creative']},
 {text:'新しいことを知って、資料にまとめる',tags:['creative']},
 {text:'山の中を4足歩行で駆け回る',tags:['high-energy','nature'],unsafe:true},
 {text:'景色の良い場所でPC作業をする',tags:['outdoor','creative']},
 {text:'水の中を探索する',tags:['water'],unsafe:true},
 {text:'パンを焼く',tags:['low-energy','food']},
 {text:'山奥の川辺で何かする',tags:['nature','water'],unsafe:true},
 {text:'他者になにか教える',tags:['creative','social']},
 {text:'美人にご飯を食べさせ、それを横から見る',tags:['social','food']},
 {text:'美人と散歩する',tags:['social','outdoor']}
];
const hash=(s:string)=>Array.from(s).reduce((h,ch)=>Math.imul(h^ch.charCodeAt(0),16777619)>>>0,2166136261);
export function selectSuggestions(e:Entry):Suggestion[] {
 const state=assess(e); if(state.high||!state.declining) return [];
 const tags:string[]=[];
 if((e.moyamoya??0)>=c.highMoyamoya) tags.push('reflection');
 if(e.realityHandling!=null&&e.realityHandling<=c.lowReality) tags.push('reality');
 if(e.energy!=null&&e.energy<=c.lowEnergy) tags.push('low-energy');
 else {if(e.mood!=null&&e.mood<=c.lowMood) tags.push('outdoor');tags.push('creative');}
 const seed=e.date+tags.join(',')+String(e.suicidalThought??0);
 return suggestions.filter(s=>!s.unsafe||(e.suicidalThought??0)<c.suicidalExclude).map(s=>({s,score:s.tags.filter(t=>tags.includes(t)).length,tie:hash(seed+s.text)})).sort((a,b)=>b.score-a.score||a.tie-b.tie).slice(0,2).map(x=>x.s);
}
