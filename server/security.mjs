export function sameOrigin(req){return req.headers.get('origin')===new URL(req.url).origin}
export function json(data,status=200,headers={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}})}
