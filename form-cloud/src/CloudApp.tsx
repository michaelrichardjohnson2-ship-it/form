import {useEffect,useState} from 'react';
import Home from './App';
export default function CloudApp(){
 const [signedIn,setSignedIn]=useState(false),[checking,setChecking]=useState(true),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function check(){try{const r=await fetch('/.netlify/functions/auth',{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);setSignedIn(d.authenticated)}catch(e){setError(e instanceof Error?e.message:'Could not connect. Please try again.')}finally{setChecking(false)}}
 useEffect(()=>{void check();const expired=()=>{setSignedIn(false);setError('Please sign in again. Your pending changes are kept on this device.')};window.addEventListener('form-login-required',expired);return()=>window.removeEventListener('form-login-required',expired)},[]);
 async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/.netlify/functions/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const d=await r.json();if(!r.ok)throw Error(d.error||'Please wait a minute and try again.');setPassword('');setSignedIn(true)}catch(e){setError(e instanceof Error?e.message:'Could not sign in.')}finally{setBusy(false)}}
 async function logout(){const r=await fetch('/.netlify/functions/auth',{method:'DELETE'});if(r.ok)setSignedIn(false)}
 if(checking)return <main className="loading">Connecting to Form…</main>;
 if(!signedIn)return <main className="login"><form onSubmit={login}><h1>FORM</h1><p>Your days. On every device.</p><label htmlFor="password">Your Form password</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/><button disabled={busy} type="submit">{busy?'Signing in…':'Sign in'}</button>{error&&<p role="alert" className="error">{error}</p>}</form></main>;
 return <><Home/><button className="logout" onClick={()=>void logout()}>Sign out</button></>;
}
