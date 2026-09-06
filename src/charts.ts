import Chart from 'chart.js/auto';
import type {ChartDataset} from 'chart.js';
import {datesFor,type Entry,type Metric} from './model';
const charts:Chart[]=[];
export function drawCharts(entries:Record<string,Entry>,end:string){
 const dates=datesFor(end),labels=dates.map(d=>`${Number(d.slice(5,7))}/${Number(d.slice(8))}`);
 const data=(key:Metric)=>dates.map(d=>entries[d]?.[key]??null);
 const series=(label:string,key:Metric,color:string,axis='y'):ChartDataset=>({label,data:data(key),borderColor:color,backgroundColor:color+'65',yAxisID:axis,borderWidth:2,pointRadius:3,pointHoverRadius:6,spanGaps:false});
 const configs=[
  {id:'state-chart',type:'line',datasets:[series('エネルギー','energy','#4a83e7'),series('気分','mood','#36a58a'),series('睡眠時間','sleepHours','#9982c6','sleep')],max:5,min:1,sleep:true},
  {id:'work-chart',type:'bar',datasets:[series('仕事時間','workHours','#6b97db')],max:16,min:0},
  {id:'hobby-chart',type:'bar',datasets:[series('趣味・副業・創作','hobbyHours','#56ad96')],max:16,min:0},
  {id:'reality-chart',type:'line',datasets:[series('モヤモヤ','moyamoya','#d99a50'),series('現実対処力','realityHandling','#4a83e7')],max:5,min:0}
 ] as const;
 for(const [i,c] of configs.entries()){
  if(charts[i]){charts[i].data.labels=labels;charts[i].data.datasets=[...c.datasets];charts[i].update('none');continue}
  charts[i]=new Chart(document.getElementById(c.id) as HTMLCanvasElement,{type:c.type,data:{labels,datasets:[...c.datasets]},options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{intersect:false,mode:'index'},plugins:{legend:{display:false},tooltip:{enabled:true}},scales:{x:{grid:{display:false},ticks:{color:'#919cad',font:{size:10},maxRotation:0,autoSkip:true,maxTicksLimit:i===0?14:7}},y:{min:c.min,max:c.max,border:{display:false},ticks:{stepSize:i===1||i===2?4:1,color:'#919cad',font:{size:10}},grid:{color:'#f0f2f7'}},...('sleep'in c?{sleep:{position:'right' as const,min:0,max:16,grid:{drawOnChartArea:false},ticks:{stepSize:4,color:'#9982c6',callback:(v:string|number)=>v+'h'}}}:{})}}});
 }
 document.getElementById('period')!.textContent=`${dates[0].replaceAll('-','/')} — ${end.replaceAll('-','/')} · 14日間`;
 document.getElementById('empty')!.hidden=dates.some(d=>['energy','mood','sleepHours'].some(k=>entries[d]?.[k as Metric]!=null));
}
