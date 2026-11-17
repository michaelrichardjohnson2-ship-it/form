// Retained to replace the previous login endpoint when updating an existing repository.
export default function handler(){return Response.json({error:'Form no longer requires sign-in.'},{status:410,headers:{'Cache-Control':'no-store'}})}
