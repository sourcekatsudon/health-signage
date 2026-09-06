import type {Entry} from './model';
export interface HealthMetricsProvider {
 getSleepDuration(date:string):Promise<number|null>;
 getSteps(date:string):Promise<number|null>;
}
/** Real measurements only; missing wearable data is never fabricated. */
export class LocalHealthMetricsProvider implements HealthMetricsProvider {
 constructor(private entries:()=>Record<string,Entry>){}
 async getSleepDuration(date:string){return this.entries()[date]?.sleepHours??null}
 async getSteps(date:string){return this.entries()[date]?.steps??null}
}
