export const names = ['Diet','Cardio','Resistance','Semen retention','Wim Hof'];
export const shortNames = ['D','C','R','SR','WH'];
export const states = ['Empty','Done','Missed','Work'];
export function todayKey() { return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export function addDays(day: string, amount: number) { const d=new Date(day+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+amount); return d.toISOString().slice(0,10); }
export function weekday(day: string) { return new Date(day+'T12:00:00Z').getUTCDay(); }
export function monday(day: string) { return addDays(day,-((weekday(day)+6)%7)); }
export function sunday(day: string) { return addDays(day,-weekday(day)); }
export function validDate(day: unknown): day is string { return typeof day==='string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && !isNaN(Date.parse(day)) && new Date(day).toISOString().slice(0,10)===day; }
export function dateLabel(day: string, year=false) { return new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',...(year?{year:'numeric' as const}:{}) ,timeZone:'UTC'}).format(new Date(day+'T12:00:00Z')); }
export const GOAL_KG = 75;
export function goalDates(measurement: {date:string;kg:number}) {
 const weeks=Math.ceil(Math.max(0,measurement.kg-GOAL_KG));
 const estimated=addDays(measurement.date,weeks*7);
 return {estimated,graceEnd:addDays(estimated,14),reached:measurement.kg<=GOAL_KG};
}
export function projectedWeight(measurement: {date:string;kg:number}, date:string) {
 const elapsed=(Date.parse(date+'T12:00:00Z')-Date.parse(measurement.date+'T12:00:00Z'))/86400000;
 return Math.max(Math.min(GOAL_KG,measurement.kg),Math.round((measurement.kg-Math.max(0,elapsed)/7)*10)/10);
}
