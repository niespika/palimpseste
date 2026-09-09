// Instrumentation locale de recette uniquement, jamais utilisée par Vercel.
// Depuis une copie compilée du dépôt reliée à la sandbox :
// NODE_ENV=production node /chemin/serveur-performance-navigation.mjs 3103
// Les requêtes viennent du navigateur ; seuls nombres/durées/noms de tables sont conservés.
import { createRequire } from 'node:module';
import { AsyncLocalStorage } from 'node:async_hooks';
import http from 'node:http';
import fs from 'node:fs';
const req=createRequire(process.cwd()+'/package.json');
req('@next/env').loadEnvConfig(process.cwd(),false,{info(){},error(){}});
if(process.env.NEXT_PUBLIC_SUPABASE_URL===process.env.PROD_SUPABASE_URL)throw new Error('Sandbox exigée');
const origin=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
const storage=new AsyncLocalStorage();
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(input,init={})=>{
 const context=storage.getStore();
 const url=new URL(typeof input==='string'?input:input.url??input);
 const debut=performance.now();
 const resultat=await nativeFetch(input,init);
 if(context && url.origin===origin)context.lectures.push({table:url.pathname.split('/').at(-1),methode:init.method??input.method??'GET',ms:Math.round(performance.now()-debut),statut:resultat.status});
 return resultat;
};
const port=Number(process.argv[2]);
const app=req('next')({dev:false,hostname:'localhost',port});
const handle=app.getRequestHandler();
app.prepare().then(()=>http.createServer((request,response)=>{
 const u=new URL(request.url,'http://localhost');
 const contexte={chemin:u.pathname,vue:u.searchParams.get('vue'),rsc:request.headers.rsc==='1',prefetch:request.headers['next-router-prefetch']==='1',methode:request.method,lectures:[]};
 const debut=performance.now();
 response.once('finish',()=>{
  if(['/prof/routeur','/eleve','/eleve/calendrier','/eleve/moi','/eleve/modules/fragments-erudition'].includes(u.pathname)){
   const ligne=JSON.stringify({...contexte,dureeMs:Math.round(performance.now()-debut),statut:response.statusCode});
   fs.appendFileSync('/tmp/palimpseste-navigation-http-'+port+'.jsonl',ligne+'\n');
   console.log(ligne);
  }
 });
 storage.run(contexte,()=>handle(request,response));
}).listen(port,'127.0.0.1',()=>console.log('Recette sandbox sur http://localhost:'+port)));
