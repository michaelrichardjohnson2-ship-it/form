import {secret,equal,issue,authenticated,sameOrigin,json,cookie} from '../../server/security.mjs';
export const config={rateLimit:{windowLimit:15,windowSize:60,aggregateBy:['ip','domain']}};
export default async function handler(req){
 let key;try{key=secret()}catch{return json({error:'The owner needs to set FORM_PASSWORD in Netlify to finish setup.'},503)}
 if(req.method==='GET')return json({authenticated:authenticated(req,key)});
 if(!sameOrigin(req))return json({error:'Invalid origin.'},403);
 if(req.method==='DELETE')return json({authenticated:false},200,{'Set-Cookie':cookie('')});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const body=await req.text();if(body.length>4096)return json({error:'Invalid request'},400);
 let p;try{p=JSON.parse(body).password}catch{return json({error:'Invalid request'},400)}
 if(typeof p!=='string'||!equal(p,key))return json({error:'Incorrect password.'},401);
 return json({authenticated:true},200,{'Set-Cookie':cookie(issue(key))});
}
