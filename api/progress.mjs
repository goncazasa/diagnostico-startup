import { createHmac } from 'node:crypto';
const SCREENS = new Set(['intro','profile','guide','D1','D2','D3','D4','D5','D6','review','final','completed']);
export function createProgressHandler({env=process.env, fetchImpl=globalThis.fetch, now=()=>new Date()}={}) {
  return async (req,res)=>{
    res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff');
    const fail=(status,error)=>res.status(status).json({ok:false,error});
    if(req.method!=='POST'){res.setHeader('Allow','POST');return fail(405,'Método no permitido.');}
    if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return fail(415,'Se requiere JSON.');
    try {if(!req.headers.origin || new URL(req.headers.origin).host!==req.headers.host)return fail(403,'Origen no permitido.');}catch{return fail(403,'Origen no permitido.');}
    let input;
    try {const raw=typeof req.body==='string'?req.body:Buffer.isBuffer(req.body)?req.body.toString('utf8'):JSON.stringify(req.body);if(!raw||Buffer.byteLength(raw)>128)return fail(400,'Evento no válido.');input=JSON.parse(raw);
      if(!input||Array.isArray(input)||Object.keys(input).join(',')!=='screen'||!SCREENS.has(input.screen))return fail(400,'Evento no válido.');
    }catch{return fail(400,'Evento no válido.');}
    if(!env.GOOGLE_SHEETS_SECRET||!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(env.GOOGLE_SHEETS_WEBHOOK_URL||''))return fail(503,'Registro no configurado.');
    const payload=JSON.stringify({format:'expert-progress/2.0',screen:input.screen,day:now().toISOString().slice(0,10)});
    const signature=createHmac('sha256',env.GOOGLE_SHEETS_SECRET).update(payload).digest('hex');
    try {const response=await fetchImpl(env.GOOGLE_SHEETS_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payload,signature}),signal:AbortSignal.timeout(10000)});
      if(!response.ok||(await response.json()).ok!==true)return fail(502,'Registro no confirmado.');
      return res.status(200).json({ok:true});
    }catch{return fail(502,'Registro no confirmado.');}
  };
}
export default createProgressHandler();
