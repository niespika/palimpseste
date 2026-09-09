// Audit ponctuel du 08/09/2026 — lancer depuis la racine du dépôt.
// Exécute le code applicatif avec base, IA et hooks React simulés, sans réseau.
// Tests de non-régression des six correctifs, complétés par la recette PostgreSQL
// réelle dans aletheia-concurrence-sql.mjs. Aucun accès à Supabase.
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const ts = require(path.join(root, 'node_modules/typescript'));
let db, calls, etayage = false;
const jobs = [];
function admin() { return {
  async rpc(name, p) {
    const t = db.aletheia_travaux.find(t => t.id === p.p_travail);
    if (name === 'aletheia_reclamer_retour') {
      if (!t || t.statut !== (p.p_phase === 'v1' ? 'V1_SUBMITTED' : 'VF_SUBMITTED') ||
          (t.retour_generation && Date.now() - Date.parse(t.retour_generation_at) < 90000)) return {data:null,error:null};
      Object.assign(t,{retour_generation:randomUUID(),retour_generation_at:new Date().toISOString()});
      return {data:structuredClone(t),error:null};
    }
    assert.equal(name,'aletheia_enregistrer_diagnostic');
    const phase=p.p_phase;
    const stable=phase==='v1' ? ['FEEDBACK1_READY','VF_SUBMITTED','FEEDBACK2_READY','DONE'] : ['FEEDBACK2_READY','DONE'];
    if (!t || t[`${phase}_revision`]!==p.p_revision || !stable.includes(t.statut)) return {data:false,error:null};
    let d=db.aletheia_diagnostic.find(d=>d.travail_id===t.id);
    if (!d) {d={travail_id:t.id};db.aletheia_diagnostic.push(d)}
    if(d[`inventaire_${phase}`]) return {data:false,error:null};
    if(p.p_resultat) {
      d[`inventaire_${phase}`]=p.p_resultat.inventaire;
      for(const [k,v] of Object.entries(p.p_resultat.niveaux)) d[`${k}_${phase}`]=v;
      d.erreur_at=null;
    } else d.erreur_at=new Date().toISOString();
    return {data:true,error:null};
  },
  from(table) {
  let op = 'read', patch, predicates = [], single = false;
  const q = {
    select() { return q }, eq(k,v) { predicates.push(r => r[k] === v); return q },
    lt(k,v) { predicates.push(r => r[k] < v); return q }, lte(k,v) { predicates.push(r => r[k] <= v); return q },
    gt(k,v) { predicates.push(r => r[k] > v); return q },
    in(k,v) { predicates.push(r => v.includes(r[k])); return q },
    not(k,op,v) { predicates.push(r => r[k] != null); return q },
    is(k,v) { predicates.push(r => (r[k] ?? null) === v); return q },
    order() { return q }, limit() { return q },
    maybeSingle() { single = true; return q }, single() { single = true; return q },
    update(p) { op = 'update'; patch = p; return q }, upsert(p) { op = 'upsert'; patch = p; return q },
    insert(p) { op = 'insert'; patch = p; return q },
    then(resolve,reject) { try {
      const rows = db[table] ?? [];
      const selected = rows.filter(r => predicates.every(p => p(r)));
      if (op === 'update') selected.forEach(r => {
        if(table==='aletheia_travaux' && patch.statut && patch.statut!==r.statut) Object.assign(r,{retour_generation:null,retour_generation_at:null});
        Object.assign(r, patch);
      });
      if (op === 'upsert') { const r = rows.find(r => r.travail_id === patch.travail_id); if (r) Object.assign(r,patch); else (db[table] ??= []).push({...patch}); }
      if (op === 'insert') (db[table] ??= []).push(...(Array.isArray(patch) ? patch : [patch]));
      return Promise.resolve({data: single ? structuredClone(selected[0] ?? null) : structuredClone(selected), error: null}).then(resolve,reject);
    } catch (e) { return Promise.reject(e).then(resolve,reject); } }
  }; return q;
} } }
class AI { messages = {create: payload => { calls.push(payload); return new Promise((resolve,reject) => jobs.push({resolve,reject})); }} }
const mocks = {
  'server-only': {}, '@anthropic-ai/sdk': AI,
  '@/utils/supabase/admin': {createAdminClient: admin},
  '@/utils/cout-api': {coutMessage: () => 0, normaliserUsage: () => ({}), enregistrerCoutApi: async () => {}},
  '@/utils/integrite': {signalerEnAttenteIA: async () => {}, messageSiBloque: async () => null},
  '@/utils/aletheia/decoupage-serveur': {lireLaPorteEtayage: async () => etayage},
};
function load(rel, extra = {}, cache = new Map()) {
  const file = path.isAbsolute(rel) ? rel : path.join(root, rel);
  if (cache.has(file)) return cache.get(file).exports;
  const m = {exports: {}}; cache.set(file,m);
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const req = s => {
    if (Object.hasOwn(extra,s)) return extra[s];
    if (Object.hasOwn(mocks,s)) return mocks[s];
    if (s.startsWith('@/') || s.startsWith('.')) {
      let p = s.startsWith('@/') ? path.join(root,s.slice(2)) : path.resolve(path.dirname(file),s);
      if (!fs.existsSync(p)) p = ['.ts','.tsx','.js'].map(e => p+e).find(fs.existsSync);
      return load(p,extra,cache);
    }
    return require(require.resolve(s,{paths:[root]}));
  };
  new Function('require','module','exports',code)(req,m,m.exports);
  return m.exports;
}
function reset() {
  calls=[]; jobs.length=0; etayage=false;
  db={aletheia_travaux:[{id:'t1',eleve_id:'e1',scriptorium_livre_id:'l1',semaine_index:1,statut:'V1_SUBMITTED',v1_revision:randomUUID(),vf_revision:randomUUID(),these:'ANCIENNE COPIE',arguments:'Arguments initiaux',accord:'Accord initial',questions:['Pourquoi ?'],vocabulaire:[]}],
  scriptorium_documents:[{unite_id:'l1',semaine:1,titre:'Séance 1',texte_extrait:'Un texte de livre suffisant.'}],aletheia_params:[{id:1}],aletheia_diagnostic:[],aletheia_livre_reference:[{scriptorium_livre_id:'l1',statut:'READY',contenu:[{semaine:1,these_canonique:'Une thèse canonique.',arguments_cles:['Argument réel.'],concepts_cles:[],synthese_modele:''}]}]};
}
async function until(n) { for (let i=0;i<100;i++) { if(jobs.length>=n) return; await new Promise(r=>setImmediate(r)); } throw Error('Appels manquants '+n); }
function answer(job, obj) { job.resolve({usage:{input_tokens:1,output_tokens:1},stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(obj)}]}); }
(async()=> {
  const gen=load('utils/aletheia-retours.ts');
  for(const phase of ['v1','vf']) {
    reset();
    const t=db.aletheia_travaux[0];
    const pending=phase==='v1'?'V1_SUBMITTED':'VF_SUBMITTED';
    Object.assign(t,{statut:pending,these_vf:'Finale',arguments_vf:'Arguments finaux',accord_vf:'Accord final'});
    const generer=phase==='v1'?gen.genererRetourV1:gen.genererRetourVf;
    const a=generer('t1'); await until(1);
    assert.equal(await generer('t1'),false);
    assert.equal(calls.length,1,'Un deuxième worker ne peut pas appeler le modèle pendant le bail.');
    t.retour_generation_at=new Date(Date.now()-91000).toISOString();
    const b=generer('t1'); await until(2);
    jobs[1].reject(Error('échec réseau simulé')); assert.equal(await b,false);
    assert.equal(t.statut,phase==='v1'?'DRAFT':'FEEDBACK1_READY');
    Object.assign(t,{these:'NOUVELLE COPIE',these_vf:'NOUVELLE FINALE',statut:pending,retour_generation:null});
    answer(jobs[0],phase==='v1'?{relances:['Ancien retour'],accord:'Ancien accord',vocabulaire:[{terme:'ancien',definition:'Ancienne définition'}]}:{synthese_modele:'Ancienne synthèse.'});
    assert.equal(await a,false);
    assert.equal(t.statut,pending); assert.equal(t[`retour_${phase}`],undefined);
    assert.equal(db.quazian_flashcards?.length??0,0,'Un ancien résultat ne crée pas de cartes.');
    const c=generer('t1'); await until(3);
    answer(jobs[2],phase==='v1'?{relances:['Nouveau retour'],accord:'Nouvel accord'}:{synthese_modele:'Nouvelle synthèse.'});
    assert.equal(await c,true);
    assert.equal(t.statut,phase==='v1'?'FEEDBACK1_READY':'FEEDBACK2_READY');
  }
  console.log('F1 OK : V1 et VF, un propriétaire ; reprise expirée ; ancien résultat refusé ; nouveau résultat accepté.');

  reset(); const t=db.aletheia_travaux[0];
  t.statut='DRAFT'; await gen.diagnostiquerTravail('t1'); assert.equal(calls.length,0);
  t.statut='V1_SUBMITTED'; await gen.diagnostiquerTravail('t1'); assert.equal(calls.length,0);
  t.statut='FEEDBACK1_READY';
  const ancien=gen.diagnostiquerTravail('t1'); await until(1);
  answer(jobs[0],{these_eleve:'Ancienne copie',arguments_captes:[],arguments_rates:[],arguments_deformes:[],these_mal_definie:false,note:'Observation.'}); await until(2);
  t.v1_revision=randomUUID(); t.these='Copie remplacée';
  answer(jobs[1],{niveau_these:'D',niveau_arguments:'D',these_mal_definie:false}); await ancien;
  assert.equal(db.aletheia_diagnostic.length,0,'La publication de l’ancienne version est refusée.');
  const neuf=gen.diagnostiquerTravail('t1'); await until(3);
  answer(jobs[2],{these_eleve:'Copie remplacée',arguments_captes:[],arguments_rates:[],arguments_deformes:[],these_mal_definie:false,note:'Observation.'}); await until(4);
  answer(jobs[3],{niveau_these:'B',niveau_arguments:'B',these_mal_definie:false}); await neuf;
  assert.equal(db.aletheia_diagnostic[0].inventaire_v1.these_eleve,'Copie remplacée');
  await gen.diagnostiquerTravail('t1');assert.equal(calls.length,4,'Une phase valide n’est pas recalculée.');
  Object.assign(t,{statut:'VF_SUBMITTED',these_vf:'Finale',arguments_vf:'Arguments'});
  await gen.diagnostiquerTravail('t1');assert.equal(calls.length,4,'VF encore modifiable, non diagnostiquée.');
  t.statut='FEEDBACK2_READY';
  const vf=gen.diagnostiquerTravail('t1');await until(5);
  jobs[4].reject(Error('échec VF simulé'));await vf;
  assert.equal(db.aletheia_diagnostic[0].inventaire_v1.these_eleve,'Copie remplacée');
  assert.ok(db.aletheia_diagnostic[0].erreur_at);
  console.log('F2 OK : brouillons exclus, version périmée refusée, diagnostic valide conservé même après échec VF.');

  reset();
  db.scriptorium_unites=[{id:'l1',type:'livre',supprime_at:null,label:'Livre de parcours',nb_semaines:1}];
  const expositionMocks={
    '@/utils/acces':{},'../../contexte-classe':{},
    '@/utils/aletheia-dates':{
      livresGouvernesPourClasses:async()=>['l1'],lireModeCActif:async()=>false,
      resoudreDatesLivre:async()=>({dates:new Map(),gouverne:true,creneauxGouvernants:[]}),
      modeExposition:async()=>({mode:'B',exposees:[1]}),formatEcheanceFr:()=>'',
    },
  };
  const prof=load('app/prof/aletheia/donnees.ts',expositionMocks);
  const student=load('app/eleve/modules/aletheia/data.ts',expositionMocks);
  assert.equal((await prof.livresDeClasse(admin(),'classe1')).length,1);
  assert.equal((await student.livresPourClasse(admin(),'classe1')).length,1);
  db.scriptorium_unites[0].supprime_at=new Date().toISOString();
  assert.equal((await prof.livresDeClasse(admin(),'classe1')).length,0);
  console.log('F3 OK : exposition commune, livre de parcours visible, livre supprimé exclu.');

  const niveau=load('app/prof/aletheia/diagnostic.ts');
  assert.equal(niveau.niveauThese({niveau_these_v1:3,niveau_these_vf:null,these_mal_definie_v1:false,these_mal_definie_vf:true}),null);
  console.log('F5 OK : VF non définie, aucun ancien niveau réaffiché.');

  reset(); etayage=true;
  Object.assign(db.aletheia_travaux[0],{statut:'VF_SUBMITTED',these_vf:'Copie finale',arguments_vf:'Arguments finaux',accord_vf:'Accord final'});
  db.aletheia_livre_reference=[{scriptorium_livre_id:'l1',statut:'READY',contenu:[{semaine:1,these_canonique:'Thèse',arguments_cles:[],synthese_modele:''}]}];
  const vfGen=load('utils/aletheia-retours.ts',{
    '@/utils/aletheia/exposition-serveur':{exposeesPourEleve:async()=>[1]},
    '@/utils/aletheia/retour-vf-serveur':{passagesAmont:async()=>[]},
  });
  const v=vfGen.genererRetourVf('t1');await until(1);
  answer(jobs[0],{synthese_modele:'Synthèse de repli.',nuances_detail:[{extrait_eleve:'Copie finale',passage:null,verdict:'precise',note:'Précision',priorite:1}]});
  assert.equal(await v,true);
  const final=load('utils/aletheia/retour-vf-serveur.ts',{'./fenetre-serveur':{contexteSeance:async()=>({d:null,texte:null,passages:[]})}});
  const travailFinal=db.aletheia_travaux[0];
  const preparer=()=>final.preparerRetourFinal(admin(),travailFinal,'l1',1,travailFinal.retour_vf.synthese_modele);
  assert.equal((await preparer()).synthese,null,'Sans couverture, la page conserve la lecture simple.');
  travailFinal.retour_vf.synthese_couverture=[{id:'y1-1',etat:'absent'}];
  assert.ok((await preparer()).synthese);
  travailFinal.retour_vf.synthese_couverture=[{id:'y1-99',etat:'absent'}];
  assert.equal((await preparer()).synthese,null,'Couverture étrangère au texte affiché refusée.');
  // Une modification de la fiche pendant l’IA ne change pas la synthèse évaluée.
  reset();etayage=true;Object.assign(db.aletheia_travaux[0],{statut:'VF_SUBMITTED',these_vf:'Finale'});
  db.aletheia_livre_reference=[{scriptorium_livre_id:'l1',statut:'READY',contenu:[{semaine:1,these_canonique:'Thèse',synthese_modele:'Version évaluée.'}]}];
  const gele=vfGen.genererRetourVf('t1');await until(1);
  db.aletheia_livre_reference[0].contenu[0].synthese_modele='Nouvelle fiche. Deux phrases.';
  answer(jobs[0],{synthese_modele:'Réponse modèle.',synthese_couverture:[{id:'y1-1',etat:'absent'}]});await gele;
  assert.equal(db.aletheia_travaux[0].retour_vf.synthese_modele,'Version évaluée.');
  console.log('F6 OK : lecture simple sans couverture ; interaction si couverture correspondante ; synthèse figée pendant l’IA.');

  reset();
  const texte=Array.from({length:40},(_,i)=>`Phrase numéro ${i+1} qui parle de choses assez longues pour compter des mots.`).join(' ');
  const dec=load('utils/aletheia/decoupage.ts').construireDecoupeSemaine(1,texte);
  const passage={id:'k1-1',role:'these',libelle:'La phrase',phrase_debut:'s1-017',phrase_fin:'s1-024',pivots:[['s1-020']],pivots_texte:[]};
  db.aletheia_livre_reference=[{scriptorium_livre_id:'l1',statut:'READY',contenu:[{semaine:1,passages_cles:[passage]}]}];
  const fen=load('utils/aletheia/fenetre-serveur.ts',{'./decoupage-serveur':{
    chargerDecoupeLivre:async()=>({semaines:[dec],perimee:false}),chargerTextes:async()=>[{semaine:1,texte}],
  }});
  const detail=[{passage:'k1-1',libelle:'La phrase'}];
  const sans=await fen.preparerFenetres(admin(),'t1','l1',1,'fenetre',detail,[{relance:0,essais:1,verdict_code:'ailleurs'}]);
  assert.equal(sans[0].pivot,undefined,'Pas de bonne réponse avant le seuil.');
  const fenetres=await fen.preparerFenetres(admin(),'t1','l1',1,'fenetre',detail,[{relance:0,essais:2,verdict_code:'ailleurs'}]);
  assert.deepEqual(fenetres[0].pivot,['s1-020']);
  const juste=await fen.preparerFenetres(admin(),'t1','l1',1,'demi_section',detail,[{relance:0,essais:1,verdict_code:'juste'}]);
  assert.deepEqual(juste[0].pivot,['s1-020']);
  let cursor=0;
  const fakeReact={useState:init=>{const value=cursor++===0?1:(typeof init==='function'?init():init);return [value,()=>{}]}};
  const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};
  const component=load('app/eleve/modules/aletheia/ReponsesRelancesFil.tsx',{
    react:fakeReact,'react/jsx-runtime':jsx,'next/navigation':{useRouter:()=>({refresh(){}})},
    './actions':{},'@/components/aletheia/FilEcrans':{__esModule:true,default:'FilEcrans'},'@/components/aletheia/PageDuLivre':{PageDuLivre:'PageDuLivre'},
  }).default;
  const rendered=component({livreId:'l1',semaine:1,numeroSeance:1,retour:{relances:['Trouver la phrase'],relances_detail:detail,vocabulaire:[]},questionsEleve:[],rappelEleve:null,fenetres,surlignagesInitiaux:{0:{verdict_code:'ailleurs',essais:2,surlignage:['s1-030']}}});
  const screen=rendered.props.ecrans.find(e=>e.id==='chercher-0');
  const page=screen.corps.props.children.find(c=>c?.type==='PageDuLivre');
  assert.equal(page.props.cliquable,false);assert.deepEqual(page.props.enEvidence,['s1-020']);assert.deepEqual(page.props.selection,[]);
  console.log('F4 OK : le serveur restitue la phrase méritée, le composant la restaure sans l’ancien mauvais surlignage.');
})().catch(e=>{console.error(e);process.exitCode=1});
