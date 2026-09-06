import {fields,type Entry} from './model';
import {warningConfig as c} from './config';
export function assess(e:Entry) {
 const points = [e.energy!=null&&e.energy<=c.lowEnergy,e.mood!=null&&e.mood<=c.lowMood,e.moyamoya!=null&&e.moyamoya>=c.highMoyamoya,e.realityHandling!=null&&e.realityHandling<=c.lowReality,e.workHours!=null&&e.hobbyHours!=null&&e.workHours+e.hobbyHours<=c.lowActivityHours,e.sleepHours!=null&&e.sleepHours>=c.longSleepHours].filter(Boolean).length;
 return {points,declining:points>=c.warningPoints,watch:(e.suicidalThought??0)>=c.suicidalWatch,high:(e.suicidalThought??0)>=c.suicidalHigh,incomplete:fields.some(k=>e[k]==null)};
}
