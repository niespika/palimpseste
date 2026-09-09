// Audit du 08/09/2026. Aucun appel IA, aucune écriture distante.
// Depuis la racine : node --import ./scripts/register-calibration-resolver.mjs scripts/recette/audit-performances-2026-09-08.mjs --production-lecture-seule
// Sortie : agrégats anonymes dans /tmp/palimpseste-perf-results.json.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const root = process.cwd();
if (!process.argv.includes('--production-lecture-seule')) throw new Error('Passer --production-lecture-seule après autorisation explicite de lecture de la production.');
const require = createRequire(root + '/package.json');
require('@next/env').loadEnvConfig(root, false, {info(){},error(){}});
const url = process.env.PROD_SUPABASE_URL;
const key = process.env.PROD_SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('Configuration production absente');
process.env.NEXT_PUBLIC_SUPABASE_URL = url;
process.env.SUPABASE_SERVICE_ROLE_KEY = key;
const nativeFetch = globalThis.fetch;
let calls = [], active = 0, peak = 0;
globalThis.fetch = async (input, init = {}) => {
  const u = new URL(typeof input === 'string' ? input : input.url ?? input);
  const method = init.method ?? input.method ?? 'GET';
  if (u.origin !== new URL(url).origin || !['GET', 'HEAD'].includes(method)) throw new Error('Audit en lecture seule : appel interdit');
  const start = performance.now();
  active++; peak = Math.max(peak, active);
  try {
    const res = await nativeFetch(input, {...init, signal: AbortSignal.timeout(20000)});
    const body = await res.clone().arrayBuffer();
    calls.push({table:u.pathname.split('/').at(-1), method, ms:Math.round(performance.now()-start), bytes:body.byteLength, status:res.status});
    return res;
  } finally { active--; }
};
const {createClient} = require('@supabase/supabase-js');
const admin = createClient(url, key, {auth:{persistSession:false,autoRefreshToken:false}});
const summarize = (name,start,extra={}) => {
  const byTable = {};
  for (const c of calls) {const t=byTable[c.table]??={calls:0,ms:0,bytes:0};t.calls++;t.ms+=c.ms;t.bytes+=c.bytes;}
  const times = calls.map(c=>c.ms).sort((a,b)=>a-b);
  const result = {name,elapsedMs:Math.round(performance.now()-start),requests:calls.length,peakConcurrency:peak,requestMedianMs:times[Math.floor(times.length/2)],errors:calls.filter(c=>c.status>=400).length,byTable,...extra};
  console.log(JSON.stringify(result));
  return result;
};
const {chargerBudgets} = await import(root+'/app/prof/routeur/serveur.ts');
let start = performance.now();
const budgets = await chargerBudgets(admin);
if (budgets.incidents.length || calls.length === 0) throw new Error('Mesure invalide : lectures incomplètes.');
const results = [summarize('chargerBudgets actuel — production lue depuis le poste local', start, {eleves:budgets.eleves.length,incidents:budgets.incidents.length})];
fs.writeFileSync('/tmp/palimpseste-perf-results.json',JSON.stringify(results,null,2));
calls=[];peak=0;start=performance.now();
const {lireLesInscriptionsDesEleves,lireLAssiduite,lireLesSeuils,lireLesInterrupteurs}=await import(root+'/utils/routeur/donnees.ts');
const {budgetDeLEleve}=await import(root+'/utils/routeur/budget.ts');
const {data:profils,error}=await admin.from('profiles').select('id,display_name,budget_plancher_min,budget_plafond_min,budget_optionnel_min,preference_recueillie_at').eq('role','eleve').order('display_name');
if(error)throw new Error('Lecture des profils refusée');
const ids=profils.map(p=>p.id);
const [inscriptions,assiduite,seuils,flags]=await Promise.all([lireLesInscriptionsDesEleves(admin,ids),lireLAssiduite(admin,ids),lireLesSeuils(admin),lireLesInterrupteurs(admin)]);
const equivalent=profils.every(p=>JSON.stringify(budgetDeLEleve(inscriptions.get(p.id)??[],{plancher:p.budget_plancher_min,plafond:p.budget_plafond_min,optionnel:p.budget_optionnel_min}))===JSON.stringify(budgets.eleves.find(e=>e.id===p.id)?.budget));
results.push(summarize('Prototype de collecte groupée — hors application',start,{eleves:profils.length,budgetsIdentiques:equivalent,assiduiteLignes:assiduite.length}));
fs.writeFileSync('/tmp/palimpseste-perf-results.json',JSON.stringify(results,null,2));
for(const [name,cols] of [['scriptorium_documents','id,unite_id,titre,type,semaine,chapitres,texte_extrait,fichier_ref'],['scriptorium_contenus','id,type,titre,auteur,texte_extrait,chapitres,notions,supprime_at']]){
  calls=[];peak=0;start=performance.now();
  const {data,error,count}=await admin.from(name).select(cols,{count:'exact'}).order('id').range(0,999);
  if(error){console.log(JSON.stringify({name,errorCode:error.code}));continue;}
  const bytes=Buffer.byteLength(JSON.stringify(data));
  const noText=Buffer.byteLength(JSON.stringify(data.map(({texte_extrait,...r})=>r)));
  results.push(summarize(name+' — taille des données',start,{rows:data.length,totalRows:count,jsonBytes:bytes,jsonWithoutTextBytes:noText}));
}
fs.writeFileSync('/tmp/palimpseste-perf-results.json',JSON.stringify(results,null,2));
