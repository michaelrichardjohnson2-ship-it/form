export type Entry={date:string;habit:number;state:number};
export type Weight={date:string;kg:number};
export async function cloud(path:string,options:RequestInit={}){
 const response=await fetch('/.netlify/functions/'+path,{...options,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json',...options.headers}});
 const data=await response.json();
 if(response.status===401){window.dispatchEvent(new Event('form-login-required'));throw Error('Please sign in again. Pending edits are kept on this device.')}
 if(!response.ok)throw Error(data.error||'Cloud sync is temporarily unavailable.');return data;
}
export async function readRecords():Promise<{entries:Entry[];measurements:Weight[]}>{return cloud('tracker')}
export async function writeRecords(changes:unknown[]){return cloud('tracker',{method:'POST',body:JSON.stringify({changes})})}
