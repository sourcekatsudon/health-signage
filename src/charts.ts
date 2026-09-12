import Chart from 'chart.js/auto';
import type {ChartDataset} from 'chart.js';
import {datesFor,type Entry,type Metric} from './model';
const charts:Chart[]=[];
export function drawCharts(entries:Record<string,Entry>,end:string){
 const dates=datesFor(end),labels=dates.map(d=>`${Number(d.slice(5,7))}/${Number(d.slice(8))}`);
 const data=(key:Metric)=>dates.map(d=>entries[d]?.[key]??null);
 const series=(label:string,key:Metric,color:string,axis='y'):ChartDataset=>({label,data:data(key),borderColor:color,backgroundColor:color+'b3',yAxisID:axis,borderWidth:2.5,pointRadius:3.5,pointHoverRadius:6,pointBorderColor:'#fff',pointBorderWidth:2,pointBackgroundColor:color,spanGaps:false});
 const configs=[
  {id:'state-chart',type:'line',datasets:[series('エネルギー','energy','#276d60'),series('気分','mood','#685384'),series('睡眠時間','sleepHours','#82562c','sleep')],max:5,min:1,sleep:true},
  {id:'work-chart',type:'bar',datasets:[series('仕事時間','workHours','#276d60')],max:16,min:0},
  {id:'hobby-chart',type:'bar',datasets:[series('趣味・副業・創作','hobbyHours','#685384')],max:16,min:0},
  {id:'reality-chart',type:'line',datasets:[series('モヤモヤ','moyamoya','#82562c'),series('現実対処力','realityHandling','#315f76')],max:5,min:0}
 ] as const;
 for(const [i,c] of configs.entries()){
  if(charts[i]){charts[i].data.labels=labels;charts[i].data.datasets=[...c.datasets];charts[i].update('none');continue}
  charts[i]=new Chart(document.getElementById(c.id) as HTMLCanvasElement,{type:c.type,data:{labels,datasets:[...c.datasets]},options:{responsive:true,maintainAspectRatio:false,animation:false,elements:{bar:{borderRadius:5,borderSkipped:false}},interaction:{intersect:false,mode:'index'},plugins:{legend:{display:false},tooltip:{enabled:true,backgroundColor:'#233d3c',padding:12,cornerRadius:12,titleColor:'#f2f5e8',bodyColor:'#edf3e8',displayColors:true}},scales:{x:{grid:{display:false},ticks:{color:'#68796e',font:{size:10},maxRotation:0,autoSkip:true,maxTicksLimit:i===0?14:7}},y:{min:c.min,max:c.max,border:{display:false},ticks:{stepSize:i===1||i===2?4:1,color:'#68796e',font:{size:10}},grid:{color:'#eaf0e7'}},...('sleep'in c?{sleep:{position:'right' as const,min:0,max:16,grid:{drawOnChartArea:false},ticks:{stepSize:4,color:'#82562c',callback:(v:string|number)=>v+'h'}}}:{})}}});
 }
 document.getElementById('period')!.textContent=`${dates[0].replaceAll('-','/')} — ${end.replaceAll('-','/')} · 14日間`;
 document.getElementById('empty')!.hidden=dates.some(d=>['energy','mood','sleepHours'].some(k=>entries[d]?.[k as Metric]!=null));
}
