// Audit en lecture seule du code courant. Aucune API, aucune base réelle.
// Non-régression après correctifs ; AP6 conservé par arbitrage de Louis.
// Les helpers privés sont exposés uniquement dans la copie transpilée en mémoire.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const ts = require(path.join(root, 'node_modules/typescript'));
let tables = {}, requests = [], responses = [], etayage = false;
const admin = { from(table) {
  const filters = []; let one = false, patch;
  const q = {
    select() { return q; }, order() { return q; },
    eq(k,v) { filters.push(r=>r[k]===v); return q; },
    lt(k,v) { filters.push(r=>r[k]<v); return q; },
    gt(k,v) { filters.push(r=>r[k]>v); return q; },
    not(k) { filters.push(r=>r[k]!=null); return q; },
    is(k,v) { filters.push(r=>(r[k]??null)===v); return q; },
    maybeSingle() { one=true; return q; },
    update(p) { patch=p; return q; },
    then(resolve,reject) {
      const rows=(tables[table]||[]).filter(r=>filters.every(f=>f(r)));
      if(patch) rows.forEach(r=>Object.assign(r,patch));
      return Promise.resolve({data:structuredClone(one?rows[0]??null:rows),error:null}).then(resolve,reject);
    },
  }; return q;
}};
class AI { messages={create:async payload=>{
  requests.push(payload);
  assert.ok(responses.length,'Réponse simulée manquante');
  return {usage:{},stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(responses.shift())}]};
}}; }
const mocks={
  'server-only':{}, '@anthropic-ai/sdk':AI,
  '@/utils/supabase/admin':{createAdminClient:()=>admin},
  '@/utils/cout-api':{coutMessage:()=>0,normaliserUsage:()=>({}),enregistrerCoutApi:async()=>{}},
  '@/utils/aletheia/decoupage-serveur':{lireLaPorteEtayage:async()=>etayage},
};
const cache=new Map();
function load(rel) {
  let file=path.isAbsolute(rel)?rel:path.join(root,rel);
  if(!fs.existsSync(file))file=['.ts','.tsx','.js'].map(e=>file+e).find(fs.existsSync);
  if(cache.has(file))return cache.get(file).exports;
  const m={exports:{}};cache.set(file,m);
  let source=fs.readFileSync(file,'utf8');
  if(file===path.join(root,'utils/aletheia-retours.ts')) source+='\nexport const __audit={parseAjouts,diagnostiquerPhase,gabaritPourPrompt};';
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const req=name=>{
    if(Object.hasOwn(mocks,name))return mocks[name];
    if(name.startsWith('@/'))return load(name.slice(2));
    if(name.startsWith('.'))return load(path.resolve(path.dirname(file),name));
    return require(require.resolve(name,{paths:[root]}));
  };
  new Function('require','module','exports',js)(req,m,m.exports);return m.exports;
}
const observations=[];
function record(id,observation){observations.push({id,observation});console.log(id+' — '+observation);}
if (require.main === module) (async()=>{
  const gen=load('utils/aletheia-retours.ts'),a=gen.__audit;
  const common=load('utils/ia-commun.ts'),g=load('utils/aletheia/gabarits.ts');
  const vf=load('utils/aletheia/retour-vf.ts'),v1=load('utils/aletheia/retour-v1.ts');
  const {lettreNiveau}=load('utils/aletheia/diagnostic.ts');
  const note=load('utils/notation.ts').noteVersLettre;
  const ref={these_canonique:'Une thèse réelle.',arguments_cles:['17 : Distinguer opinion et preuve.','18 : Le doute ne suffit pas.']};
  const inv={these_eleve:'Une idée',arguments_captes:['Une idée'],arguments_rates:[],arguments_deformes:[],these_mal_definie:false,note:'Observation.'};
  const prompts={inventaire:gen.PROMPT_DIAG_INVENTAIRE_DEFAUT,niveau:gen.PROMPT_DIAG_NIVEAU_DEFAUT};
  assert.equal(note(lettreNiveau('niveau B')),'B');
  assert.throws(()=>lettreNiveau('indisponible'));
  responses=[{}];requests=[];
  await assert.rejects(a.diagnostiquerPhase(new AI(),'Texte argumentatif.',ref,'Thèse élève','Argument élève',prompts,'fixture'),/incomplet/);
  assert.equal(requests.length,1,'Un inventaire invalide ne parvient jamais au niveau.');
  responses=[inv,{}];requests=[];
  await assert.rejects(a.diagnostiquerPhase(new AI(),'Texte argumentatif.',ref,'Thèse élève','Argument élève',prompts,'fixture'),/Applicabilité/);
  record('AP1','Niveau B reste B ; les deux étapes refusent une sortie incomplète.');

  const cov=vf.lireCouverture([],['y1-1','y1-2']);assert.deepEqual(cov,[]);
  assert.ok(!vf.comparerSynthese(cov,[]).message.includes('disait déjà tout'));
  assert.match(vf.comparerSynthese([{id:'y1-1',etat:'partiel'}],[]).message,/à compléter/);
  assert.deepEqual(vf.lireNuances([{extrait_eleve:'Extrait',passage:'k1-1',verdict:'inconnu'}],new Set(['k1-1'])),[]);
  assert.throws(()=>a.parseAjouts([{extrait:'Ajout',ancre:'false',note:'Observation'}]));
  assert.equal(a.parseAjouts([{extrait:'Ajout',ancre:false,note:'Observation'}])[0].ancre,false);
  assert.equal(v1.lireRappel({phrase:'Un rappel',verdict:'inconnu'}),null);
  record('AP2','Absence de mesure, compréhension partielle et verdict invalide ne deviennent pas une confirmation.');

  etayage=true;
  tables={scriptorium_unites:[{id:'livre',gabarit_lecture:'argumentatif'}],aletheia_travaux:[{id:'t',tournante_cle:'exemple'}],aletheia_params:[]};
  for(const key of ['v1','vf']){
    const gab=await a.gabaritPourPrompt(admin,'t','livre',1,key);
    const template=g.assemblerPrompt(key==='v1'?gen.PROMPT_FEEDBACK_V1_DEFAUT:gen.PROMPT_FEEDBACK_VF_DEFAUT,gab.bloc);
    const prompt=common.injecter(template,{question_tournante:gab.questionTournante});
    assert.ok(prompt.includes(g.DEFINITIONS.argumentatif.tournantes[3].question));
    assert.ok(prompt.includes('Ne réclame pas un accord/désaccord'));
  }
  assert.equal(g.blocTournanteArgumentative('argumentatif','accord'),'');
  etayage=false;
  record('AP3','La question exemple figée en base et son critère arrivent dans les deux retours.');

  const gab={gabarit:'aphoristique',tournanteCle:'fil',questionTournante:'Quel fil vois-tu ?',reponseTournante:'REPONSE_FIL_ELEVE',blocInventaire:g.blocGabarit('aphoristique','diag_inventaire'),blocNiveau:g.blocGabarit('aphoristique','diag_niveau'),champFixe:''};
  responses=[{...inv,fragment_reference:ref.arguments_cles[0],fil:{captes:['Un lien réel'],rates:[],deformes:[]}},{niveau_these:'C',niveau_arguments:'B',these_mal_definie:false}];requests=[];
  const r=await a.diagnostiquerPhase(new AI(),'Texte des fragments.',ref,'Fragment 17','Interprétation',prompts,'fixture',gab);
  assert.match(JSON.stringify(requests[0]),/REPONSE_FIL_ELEVE/);
  assert.match(JSON.stringify(requests[1]),/17 : Distinguer opinion et preuve/);
  assert.match(JSON.stringify(requests[1]),/Un lien réel/);
  assert.ok(!JSON.stringify(requests[1]).includes('REPONSE_FIL_ELEVE'),'La prose ne passe pas dans la seconde étape.');
  assert.equal(note(r.niveaux.niveau_arguments),'B');
  responses=[{...inv,fragment_reference:ref.arguments_cles[0]},{niveau_these:'C',niveau_arguments:null,these_mal_definie:false}];requests=[];
  const sansFil=await a.diagnostiquerPhase(new AI(),'Texte des fragments.',ref,'Fragment 17','Interprétation',prompts,'fixture',{...gab,tournanteCle:'accord'});
  assert.equal(sansFil.niveaux.niveau_arguments,null);
  responses=[{...inv,fragment_reference:'Fragment absent'}];requests=[];
  await assert.rejects(a.diagnostiquerPhase(new AI(),'Texte des fragments.',ref,'Fragment 99','Interprétation',prompts,'fixture',gab),/non identifiée/);
  assert.equal(requests.length,1);
  responses=[inv,{niveau_these:'B',niveau_arguments:'B',these_mal_definie:false}];requests=[];
  await a.diagnostiquerPhase(new AI(),'Dialogue.',ref,'Voix attribuées','Mouvements',prompts,'fixture',{gabarit:'dialogue',blocInventaire:g.blocGabarit('dialogue','diag_inventaire'),blocNiveau:g.blocGabarit('dialogue','diag_niveau'),champFixe:'INDICE_AUTEUR_EXPLICITE'});
  const pDialogue=requests[0].messages[0].content.map(b=>b.text).join('');
  assert.match(pDialogue,/Position de l’auteur et indice donnés par l’élève : INDICE_AUTEUR_EXPLICITE/);
  record('AP4','Référence exacte et preuves du fil transmises ; hors tournante fil, axe non applicable ; fragment absent suspendu.');

  responses=[];requests=[];
  await assert.rejects(a.diagnostiquerPhase(new AI(),'Description sans thèse.',null,'Idée','Arguments',prompts,'fixture'),/Référence/);
  assert.equal(requests.length,0);
  record('AP5','Référence absente : aucun appel IA, aucun niveau.');

  tables={scriptorium_documents:[{unite_id:'livre',semaine:1,titre:'Début',texte_extrait:'TEXTE_SEANCE_1'},{unite_id:'livre',semaine:2,titre:'Suite',texte_extrait:'ECLAIRAGE_SEANCE_2'}],aletheia_livre_reference:[{scriptorium_livre_id:'livre',statut:'PENDING'}],aletheia_params:[]};
  responses=[{chapitres:[{semaine:1,these_canonique:'Thèse',arguments_cles:['Argument'],synthese_modele:'La suite éclaire ce passage.'},{semaine:2,these_canonique:'Suite'}]}];requests=[];
  await gen.genererReferenceLivre('livre');
  assert.equal(requests.length,1);assert.match(JSON.stringify(requests[0]),/ECLAIRAGE_SEANCE_2/);
  assert.match(JSON.stringify(requests[0]),/éclairage de la suite est permis/);
  assert.equal(tables.aletheia_livre_reference[0].contenu[0].synthese_modele,'La suite éclaire ce passage.');
  record('AP6 — arbitrage','Lots de deux conservés ; la suite peut éclairer la lecture sans devenir un prérequis de compréhension.');

  tables={scriptorium_documents:[{unite_id:'livre',semaine:1,titre:'Non exposée',texte_extrait:'SEANCE_NON_EXPOSEE'},{unite_id:'livre',semaine:3,titre:'Courante',texte_extrait:'TEXTE_COURANT'}],aletheia_livre_reference:[]};
  for(const exposees of [[],[3]])assert.ok(!(await gen.assemblerAncrageVf(admin,'livre',3,exposees)).amont.includes('SEANCE_NON_EXPOSEE'));
  assert.match((await gen.assemblerAncrageVf(admin,'livre',3,[1,3])).amont,/SEANCE_NON_EXPOSEE/);
  tables.aletheia_livre_reference=[{scriptorium_livre_id:'livre',statut:'READY',contenu:[{semaine:1,these_canonique:'FICHE_NON_EXPOSEE',arguments_cles:['Un argument']}]}];
  assert.ok(!(await gen.assemblerAncrageVf(admin,'livre',3,[3])).amont.includes('FICHE_NON_EXPOSEE'));
  assert.match((await gen.assemblerAncrageVf(admin,'livre',3,[1,3])).amont,/FICHE_NON_EXPOSEE/);
  record('AP7','Amont limité aux séances exposées dans les fiches et le repli texte ; liste vide respectée.');
  console.log(JSON.stringify({checks:observations.length,network:false},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

module.exports = { load, remplacerIO: (nom, valeur) => { mocks[nom] = valeur; } };
