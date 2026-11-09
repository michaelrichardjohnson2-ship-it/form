import {getStore} from '@netlify/blobs';
import {secret,authenticated,sameOrigin,json} from '../../server/security.mjs';
import {validate,saveChanges} from '../../server/records.mjs';
export const config={rateLimit:{windowLimit:120,windowSize:60,aggregateBy:['ip','domain']}};
export default async function handler(req){
 let key;try{key=secret()}catch{return json({error:'Cloud sync is not configured yet.'},503)}
 if(!authenticated(req,key))return json({error:'Please sign in again.'},401);
 if(req.method!=='GET'&&!sameOrigin(req))return json({error:'Invalid origin.'},403);
 try{const store=getStore({name:'form-private',consistency:'strong'});
 if(req.method==='GET'){const data=await store.get('records.json',{type:'json'});return json(data||{entries:[],measurements:[]})}
 if(req.method!=='POST')return json({error:'Method not allowed.'},405);
 const body=await req.text();if(body.length>1_000_000)return json({error:'Backup is too large.'},413);
 let changes;try{changes=JSON.parse(body).changes}catch{return json({error:'Invalid request.'},400)}
 if(!validate(changes))return json({error:'Invalid entries. Weigh-ins must use a Sunday date.'},400);
 await saveChanges(store,changes);return json({saved:true});
 }catch{return json({error:'Could not sync. Your pending changes are kept on this device.'},503)}
}
