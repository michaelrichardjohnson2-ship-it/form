import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
export const COOKIE='__Host-form-session';
const digest=s=>createHash('sha256').update(s).digest();
export function secret(){const p=process.env.FORM_PASSWORD;if(!p||p.length<16)throw Error('Set FORM_PASSWORD to a unique password of at least 16 characters in Netlify.');return p}
export function equal(a,b){return typeof a==='string'&&typeof b==='string'&&timingSafeEqual(digest(a),digest(b))}
const sign=(body,key)=>createHmac('sha256',key).update('form-session-v1:'+body).digest('base64url');
export function issue(key,now=Date.now()){const body=String(now+30*86400000);return body+'.'+sign(body,key)}
export function verify(token,key,now=Date.now()){if(typeof token!=='string')return false;const [body,sig,extra]=token.split('.');return !extra&&/^\d+$/.test(body)&&Number(body)>now&&Number(body)<=now+31*86400000&&equal(sig,sign(body,key))}
export function authenticated(request,key){const value=(request.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);return verify(value,key)}
export function sameOrigin(req){return req.headers.get('origin')===new URL(req.url).origin}
export function json(data,status=200,headers={}){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie',...headers}})}
export const cookie=token=>`${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${token?2592000:0}`;
