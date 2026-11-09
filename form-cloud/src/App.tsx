import { readRecords, writeRecords } from './storage';
import { useEffect,useRef,useState } from 'react';
import { names,shortNames,states,todayKey,addDays,monday,sunday,dateLabel,goalDates,projectedWeight,GOAL_KG,weekday,validDate } from './tracker';
type Entry={date:string;habit:number;state:number}; type Weight={date:string;kg:number};
type Change = {type:'habit';date:string;habit:number;state:number}|{type:'weight';date:string;kg:number};
type Draft = {payload:Change;token:string};
const DRAFT_KEY='form-cloud-pending-v1';
export default function Home(){
 const drafts=useRef<Record<string,Draft>>({});const saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null);const saving=useRef(false);const mutation=useRef(0);
 function persistDrafts(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify(drafts.current));return true}catch{return false}}
 function scheduleSave(){if(saveTimer.current)clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>{void flush()},30000)}
 async function flush(){
  if(saving.current){scheduleSave();return}const batch=Object.entries(drafts.current);if(!batch.length)return;saving.current=true;setNotice('Saving…');let failed=false;
  try{await writeRecords(batch.map(([,d])=>d.payload));mutation.current++;
  for(const [key,draft] of batch)if(drafts.current[key]?.token===draft.token)delete drafts.current[key];persistDrafts();
  }catch{failed=true;}
  saving.current=false;
  if(failed){setError('Cloud sync is unavailable. Your changes are pending on this device.');setNotice('Not saved');scheduleSave()}
  else if(Object.keys(drafts.current).length){setNotice('Changes pending · syncs after 30s');}
  else{setError('');setNotice('Synced');}
 }

 const [localImport,setLocalImport]=useState(false);
 useEffect(()=>{try{const data=JSON.parse(localStorage.getItem('form-records-v1')||'null');setLocalImport(Boolean(data&&(data.entries?.length||data.measurements?.length)&&!localStorage.getItem('form-migrated-v1')))}catch{}},[]);
 const [futureDate,setFutureDate]=useState('');const [today,setToday]=useState('');const [entries,setEntries]=useState<Entry[]>([]);const [weights,setWeights]=useState<Weight[]>([]);const [loaded,setLoaded]=useState(false);const [error,setError]=useState('');const [exploring,setExploring]=useState(false);const [days,setDays]=useState(90);const [weekOffset,setWeekOffset]=useState(0);const [weightOpen,setWeightOpen]=useState(false);const [weightDate,setWeightDate]=useState('');const [kg,setKg]=useState('');const [notice,setNotice]=useState('');const history=useRef<HTMLDivElement>(null);
 async function load(quiet=false){if(saving.current)return;const version=mutation.current;if(!quiet)setError('');try{const d=await readRecords();if(version!==mutation.current||saving.current)return;let es=d.entries;let ws=d.measurements;for(const {payload:p} of Object.values(drafts.current)){if(p.type==='habit')es=[...es.filter(e=>e.date!==p.date||e.habit!==p.habit),{date:p.date,habit:p.habit,state:p.state}];else ws=[...ws.filter(w=>w.date!==p.date),{date:p.date,kg:p.kg}]}setEntries(es);setWeights(ws);setLoaded(true)}catch{if(!quiet)setError('Could not load your cloud entries.');}}
 useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))drafts.current=stored;}catch{}if(Object.keys(drafts.current).length){setNotice('Changes pending · syncs after 30s');scheduleSave()}const d=todayKey();setToday(d);const christmas=d.slice(0,4)+'-12-25';setFutureDate(christmas>=d?christmas:addDays(d,28));setWeightDate(sunday(d));load();const refresh=()=>{if(document.visibilityState==='visible')void load(true)};const timer=setInterval(()=>{setToday(todayKey());refresh()},30000);window.addEventListener('focus',refresh);return()=>{window.removeEventListener('focus',refresh);clearInterval(timer);if(saveTimer.current)clearTimeout(saveTimer.current)}},[]);
 useEffect(()=>{if(history.current) history.current.scrollTop=history.current.scrollHeight},[loaded,today]);
 function value(date:string,habit:number){return entries.find(e=>e.date===date&&e.habit===habit)?.state||0}
 function golden(date:string){return names.every((_,i)=>value(date,i)===1)}
 function save(payload:Change,key:string,success:()=>void){
 if(payload.type==='weight'&&(weekday(payload.date)!==0||!Number.isFinite(payload.kg)||payload.kg<=1||payload.kg>1000)){setError('Enter a valid weight and a Sunday date.');return;}
 drafts.current[key]={payload,token:crypto.randomUUID()};const kept=persistDrafts();setError(kept?'':'Keep this page open until saving finishes; this browser cannot keep pending changes.');success();setNotice('Changes pending · syncs after 30s');scheduleSave();
 }

 function cycle(date:string,habit:number){const state=(value(date,habit)+1)%4;save({type:'habit',date,habit,state},date+habit,()=>setEntries(es=>[...es.filter(e=>e.date!==date||e.habit!==habit),{date,habit,state}]))}
 function dots(date:string){return names.map((name,i)=><button key={name} className="dot" data-state={value(date,i)} disabled={!loaded} aria-label={`${dateLabel(date,true)}, ${name}: ${states[value(date,i)]}. Change to ${states[(value(date,i)+1)%4]}`} title={`${name}: ${states[value(date,i)]}`} onClick={()=>cycle(date,i)}/>)}
 function exportBackup(){
 const data={version:1,exportedAt:new Date().toISOString(),entries,measurements:weights};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='form-backup-'+todayKey()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 async function importBackup(file:File|undefined){
 if(!file)return;
 try{if(file.size>5_000_000)throw Error();const d=JSON.parse(await file.text());
 if(!Array.isArray(d.entries)||!Array.isArray(d.measurements)||d.entries.length>100000||d.measurements.length>10000)throw Error();
 for(const e of d.entries)if(!validDate(e.date)||e.date>todayKey()||!Number.isInteger(e.habit)||e.habit<0||e.habit>4||!Number.isInteger(e.state)||e.state<0||e.state>3)throw Error();
 for(const w of d.measurements)if(!validDate(w.date)||w.date>todayKey()||weekday(w.date)!==0||typeof w.kg!=='number'||!Number.isFinite(w.kg)||w.kg<=1||w.kg>1000)throw Error();
 for(const e of d.entries)save({type:'habit',date:e.date,habit:e.habit,state:e.state},e.date+e.habit,()=>{});
 for(const w of d.measurements)save({type:'weight',date:w.date,kg:w.kg},'weight:'+w.date,()=>{});
 setEntries(es=>Array.from(new Map([...es,...d.entries].map(e=>[e.date+':'+e.habit,e])).values()));
 setWeights(ws=>Array.from(new Map([...ws,...d.measurements].map(w=>[w.date,w])).values()));
 setNotice('Backup imported · syncs after 30s');
 }catch{setError('This is not a valid Form backup. Your records have not been replaced.');}
 }
 if(!today)return <main className="loading">Loading your days…</main>;
 const start=monday(addDays(today,weekOffset*7));const end=addDays(start,6);const weekEntries=entries.filter(e=>e.date>=start&&e.date<=end);const count=(s:number)=>weekEntries.filter(e=>e.state===s).length;const goldCount=Array.from({length:7},(_,i)=>addDays(start,i)).filter(golden).length;
 const latest=[...weights].sort((a,b)=>b.date.localeCompare(a.date))[0];
 const goal=latest?goalDates(latest):null;
 return <main><section className="focus" aria-label="Form health tracker">
 <h1 className="wordmark">FORM</h1>
 {loaded&&localImport&&<div className="migration"><p>Entries from the earlier version are on this device.</p><button onClick={()=>{const data=localStorage.getItem('form-records-v1');if(data)void importBackup(new File([data],'local-backup.json',{type:'application/json'}));localStorage.setItem('form-migrated-v1','yes');setLocalImport(false)}}>Move them to cloud</button><button onClick={()=>setLocalImport(false)}>Later</button></div>}
 <div ref={history} className={'history'+(exploring?' exploring':'')} onScroll={e=>{const el=e.currentTarget;setExploring(el.scrollTop<el.scrollHeight-el.clientHeight-8)}} aria-label="Scroll up to view previous dates">
 <button className="older" onClick={()=>{const el=history.current;const old=el?.scrollHeight||0;setDays(d=>d+90);requestAnimationFrame(()=>{if(el)el.scrollTop=el.scrollHeight-old})}}>Earlier days ↑</button>
 {Array.from({length:days},(_,i)=>addDays(today,i-days)).map(date=><div key={date} className={'row past'+(golden(date)?' golden':'')}><span className="date">{dateLabel(date)}{golden(date)&&<span className="sr-only">, golden day</span>}</span>{dots(date)}</div>)}
 </div>
 <div className="row columns"><span>{new Date(today+'T12:00:00Z').toLocaleString('en-GB',{month:'long',timeZone:'UTC'})}</span>{shortNames.map((n,i)=><abbr key={n} title={names[i]}>{n}</abbr>)}</div>
 <div className={'row today'+(golden(today)?' golden':'')}><div className="date">TODAY<small>{golden(today)?'GOLDEN DAY':dateLabel(today)}</small></div>{dots(today)}</div>
 <div className="feedback" aria-live="polite">{!loaded&&!error?'Loading…':notice}</div>
 {error&&<div className="error" role="alert">{error} {!loaded?<button onClick={()=>void load()}>Try again</button>:<button onClick={()=>void flush()}>Retry save</button>}</div>}
 <details className="weekly"><summary>{count(1)} / 35 {weekOffset===0?'THIS WEEK':'COMPLETED'}{goldCount>0?` · ${goldCount} GOLDEN ${goldCount===1?'DAY':'DAYS'}`:''}</summary><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeekOffset(w=>w-1)}>←</button><span>{dateLabel(start)} – {dateLabel(end)}</span><button aria-label="Next week" disabled={weekOffset===0} onClick={()=>setWeekOffset(w=>w+1)}>→</button></div><div className="tally">{count(1)} done · {count(2)} missed · {count(3)} work · {35-weekEntries.filter(e=>e.state!==0).length} empty</div><div className="habit-totals">{shortNames.map((n,i)=><span key={n} title={names[i]}>{n} <strong>{weekEntries.filter(e=>e.habit===i&&e.state===1).length}/7</strong></span>)}</div></details>
 <div className="weights"><div><div className="label">Last measured weight</div><div className="number">{latest?latest.kg.toFixed(1):'—'}<span className="unit">kg</span></div><div className="sunday">{latest?dateLabel(latest.date):'YOUR SUNDAY CHECK-IN'}</div></div><div><div className="label">Predicted weight</div><div className="number">{latest?(latest.kg-1).toFixed(1):'—'}<span className="unit">kg</span></div><div className="sunday">{latest?dateLabel(addDays(latest.date,7))+' · ':''}−1 KG TARGET</div></div></div>
 {loaded&&<button className="checkin" onClick={()=>{setWeightOpen(!weightOpen);setWeightDate(sunday(today));setKg(weights.find(w=>w.date===sunday(today))?.kg.toString()||'')}}>{weightOpen?'Close':sunday(today)===today?'Sunday check-in →':'Add / edit Sunday weigh-in →'}</button>}
 {weightOpen&&<form className="weightform" onSubmit={e=>{e.preventDefault();save({type:'weight',date:weightDate,kg:Number(kg)},'weight:'+weightDate,()=>{setWeights(ws=>[...ws.filter(w=>w.date!==weightDate),{date:weightDate,kg:Number(kg)}]);setWeightOpen(false)})}}><label>Sunday<input type="date" required max={today} value={weightDate} onChange={e=>setWeightDate(e.target.value)}/></label><label>Measured weight (kg)<input type="number" required min="1.1" max="1000" step="0.1" placeholder="82.0" value={kg} onChange={e=>setKg(e.target.value)}/></label><button type="submit">Update weigh-in</button></form>}
 <section className="goal" aria-label="Weight goal"><div><div className="label">Goal weight</div><div className="number">75<span className="unit">kg</span></div></div><div className="goal-dates">{goal?<><div className="label">{goal.reached?'Goal reached':'Estimated arrival'}</div><div className="arrival">{dateLabel(goal.reached?goal.estimated:goal.graceEnd,true)}</div></>:<div className="label">Add a Sunday weigh-in to see your estimated arrival.</div>}</div></section>
 <section className="projection" aria-label="Future weight estimate"><label htmlFor="future-date">Weight on a future date</label><div className="projection-row"><input id="future-date" type="date" min={today} value={futureDate} onChange={e=>setFutureDate(e.target.value)}/><output aria-live="polite" className="projection-value">{latest&&futureDate>=today?projectedWeight(latest,futureDate).toFixed(1):'—'}<span className="unit">kg</span></output></div><p className="projection-note">Based on −1 kg per week from your latest weigh-in, then maintaining {GOAL_KG} kg. An estimate, not a guarantee.</p></section>
 <details className="backup"><summary>Data & backups</summary><p>Synced privately across your devices. Export a backup to keep a separate copy.</p><div><button onClick={exportBackup} disabled={!loaded}>Export backup</button><label className="import">Import backup<input type="file" accept="application/json,.json" onChange={e=>{void importBackup(e.target.files?.[0]);e.target.value=''}}/></label></div><p>Import merges entries; matching dates use the imported values.</p></details>
 </section></main>
}
