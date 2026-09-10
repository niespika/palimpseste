// Recette technique sur le décor isolé : --structure ou --luna (5 réplicats V1/VF).
// --luna --cran8 : un smoke complémentaire du cran 8 ; --registre=chemin pour isoler les registres.
// Aucun gold ni ajustement de critères pédagogiques ; aucun accès à la production.
import { readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { creerContrat } from '../../utils/pilote-argument/contrat'
import { sujetsAdmissibles, creerTrace, traceUtilisable } from '../../utils/pilote-argument/serveur'
import { traiterDepot } from '../../utils/chaine/chaine'

const url=process.env.NEXT_PUBLIC_SUPABASE_URL!
if(!url?.includes('aoakpxxlyvthzueaywna'))throw Error('Sandbox uniquement')
const db=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}})
const chemin=process.argv.find(a=>a.startsWith('--registre='))?.slice(11) ?? '/tmp/pilote-argument-decor.json'
const r=JSON.parse(readFileSync(chemin,'utf8'))
if(r.termine)throw Error('Décor retiré')
const sauver=()=>{
  const courant=JSON.parse(readFileSync(chemin,'utf8'))
  r.lignes=[...new Map([...courant.lignes,...r.lignes].map(x=>[x.table+':'+x.id,x])).values()]
  r.depots=[...new Map([...courant.depots,...r.depots].map(x=>[x.id,x])).values()]
  writeFileSync(chemin,JSON.stringify({...courant,...r},null,2),{mode:0o600})
}
const sujetLong = process.argv.includes('--structure')
const origine=r.depots.find((d: {cran:number;parcours:string})=>d.cran===6 && d.parcours===(sujetLong?'1HLP':'TC'))
const {data:d,error:ed}=await db.from('exercices_depots').select('exercice_id').eq('id',origine.id).single();if(ed)throw ed
const {data:s,error:es}=await db.from('exercices_pilote_argument').select('contrat').eq('exercice_id',d.exercice_id).single();if(es)throw es
const structure=process.argv.includes('--structure-seule')
const cran8=process.argv.includes('--cran8')
const c=structure || cran8 ? creerContrat({cran:cran8?8:6,parcours:s.contrat.parcours,principale:structure?'structure':s.contrat.principale,secondaire:structure?null:s.contrat.secondaire,
  classe_id:s.contrat.classe_id,sujet:s.contrat.sujet,contexte_fourni:s.contrat.contexte_fourni,admissibilite:s.contrat.admissibilite}) : s.contrat
async function attribuer(contrat:unknown,requete=randomUUID()) {
  const {data:ex,error}=await db.rpc('attribuer_pilote_argument',{p_requete:requete,p_contrat:contrat,p_eleves:[r.eleve],p_echeance:null})
  if(error)throw error
  if(!r.lignes.some((x:{id:string})=>x.id===ex)){r.lignes.push({table:'exercices',id:ex});sauver()}
  const {data:d,error:ed}=await db.from('exercices_depots').select('id').eq('exercice_id',ex).eq('eleve_id',r.eleve).single();if(ed)throw ed
  return {ex,depot:d.id}
}
if(sujetLong) {
  const offre=await sujetsAdmissibles(db,c.classe_id)
  const sujets=offre.sujets.filter(s=>s.sujet.enonce.includes('Face à deux personnes'))
  assert.equal(sujets.length,1)
  const choix=sujets[0]
  for(const cran of [6,8] as const) {
    const contrat=creerContrat({cran,parcours:'1HLP',principale:'expression',secondaire:'argumentation',classe_id:c.classe_id,
      sujet:{id:choix.sujet.id,enonce:choix.sujet.enonce,notions:choix.sujet.notions},contexte_fourni:'',admissibilite:choix.admissibilite})
    const requete=randomUUID(), a=await attribuer(contrat,requete), b=await attribuer(contrat,requete)
    assert.equal(a.ex,b.ex)
    r.depots.push({id:a.depot,cran,parcours:'1HLP-banque'});sauver()
    const {error}=await db.from('exercices_pilote_argument').update({contrat:{...contrat,cran:8}}).eq('exercice_id',a.ex)
    assert.ok(error,'Contrat immuable')
    const {error:ee}=await db.rpc('enregistrer_relecture_argument',{p_depot:a.depot,p_eleve:r.eleve,p_texte:'Texte jamais enregistré',p_trace:{}})
    assert.ok(ee,'Texte périmé refusé')
    const anonyme=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
    const {error:ea}=await anonyme.from('exercices_pilote_argument').select('*')
    assert.ok(ea,'Pas de lecture du modèle par le client anonyme')
    const {error:er}=await anonyme.rpc('attribuer_pilote_argument',{p_requete:randomUUID(),p_contrat:contrat,p_eleves:[r.eleve],p_echeance:null})
    assert.ok(er,'Attribution réservée au serveur')
    const {error:connexion}=await anonyme.auth.signInWithPassword({email:r.email,password:r.motDePasse});if(connexion)throw connexion
    const {error:lectureEleve}=await anonyme.from('exercices_pilote_argument').select('*')
    assert.ok(lectureEleve,'Le compte élève ne peut pas lire le modèle conservé côté serveur')
    await anonyme.auth.signOut()
  }
  const trace=creerTrace(c,'Mon texte',[{question_id:c.questions[0].id,etat:'incertain'}])
  assert.ok(traceUtilisable(c,'Mon texte',trace))
  assert.equal(traceUtilisable(c,'Mon texte changé',trace),null)
  assert.equal(traceUtilisable(c,'Mon texte',creerTrace(c,'Mon texte',[])),null)
  const {data:pc,error:epc}=await db.from('scriptorium_parcours_classes').select('id').eq('classe_id',c.classe_id).single();if(epc)throw epc
  const {data:creneau,error:ec}=await db.from('scriptorium_parcours_classe_creneaux').select('id,semaine').eq('parcours_classe_id',pc.id).single();if(ec)throw ec
  assert.ok(r.lignes.some((l:{id:string})=>l.id===creneau.id),'Créneau synthétique enregistré')
  const {data:element,error:ee}=await db.from('scriptorium_parcours_classe_elements').select('id,semaine,vu_at').eq('creneau_id',creneau.id).single();if(ee)throw ee
  try {
    const {error}=await db.from('scriptorium_parcours_classe_elements').update({semaine:2,vu_at:null}).eq('id',element.id);if(error)throw error
    assert.equal((await sujetsAdmissibles(db,c.classe_id)).sujets.length,0,'Un cours futur ne doit rien ouvrir')
  } finally {
    const {error}=await db.from('scriptorium_parcours_classe_elements').update({semaine:element.semaine,vu_at:element.vu_at}).eq('id',element.id);if(error)throw error
  }
  assert.ok((await sujetsAdmissibles(db,c.classe_id)).sujets.length>=20)
  console.log('Recette structurelle réussie : idempotence, immuabilité, accès, trace périmée/vide et sujet 1HLP de 122 caractères aux deux crans.')
} else if(process.argv.includes('--luna')) {
  const sorties:Array<{replicat:number;erreur?:string;[cle:string]:unknown}>=[]
  for(let i=1;i<=(cran8?1:5);i++) {
    const {depot}=await attribuer(c)
    r.depots.push({id:depot,cran:c.cran,parcours:(cran8?'cran8-':structure?'structure-':'replicat-')+i});sauver()
    const v1='La science elle donne la nature vraie parce que ça mesure. Une balance mesure la masse. Donc tout est comme ça en vrai.'
    const vf='La science nous fait connaître la nature telle qu’elle est, parce qu’elle mesure les phénomènes. Une balance permet par exemple de mesurer une masse. Cette mesure nous donne donc accès à toute la nature, exactement telle qu’elle est.'
    const debut=Date.now()
    const {error:e1}=await db.from('exercices_depots').update({texte_v1:v1,v1_remis_at:new Date().toISOString(),statut:'v1_remis'}).eq('id',depot);if(e1)throw e1
    try {
      const b1=await traiterDepot(db,depot,'v1')
      const {error:e2}=await db.from('exercices_depots').update({texte_vf:vf,vf_remis_at:new Date().toISOString(),statut:'vf_remis'}).eq('id',depot);if(e2)throw e2
      const b2=await traiterDepot(db,depot,'vf')
      assert.ok(b1.retourEcrit && b2.retourEcrit,'Les deux retours doivent être publiés')
      const {data:mesures,error:em}=await db.from('competences_mesures').select('competence,observables,lettre_equivalente,delta_v1_vf').eq('depot_id',depot);if(em)throw em
      const {data:jugements,error:ej}=await db.from('exercices_pilote_argument_jugements').select('version,jugement,modele').eq('depot_id',depot);if(ej)throw ej
      assert.deepEqual(mesures.map(m=>m.competence).sort(),structure?['structure']:['argumentation','expression'])
      assert.ok(mesures.every(m=>m.lettre_equivalente===null && m.delta_v1_vf===null))
      assert.ok(mesures.every(m=>Object.values(m.observables).some(v=>typeof v==='number')),'Au moins un observable numérique dans chaque mesure demandée')
      assert.equal(b2.mesuresEcrites,0)
      assert.equal(jugements.length,2)
      assert.ok(jugements.every(j=>j.modele==='gpt-5.6-luna'))
      const sortie={replicat:i,duree_ms:Date.now()-debut,v1_retour:b1.retourEcrit,vf_retour:b2.retourEcrit,mesures, jugements}
      sorties.push(sortie)
      console.log(JSON.stringify({replicat:i,duree_ms:Date.now()-debut,v1_retour:b1.retourEcrit,vf_retour:b2.retourEcrit}))
    } catch(e) {sorties.push({replicat:i,erreur:e instanceof Error?e.message:JSON.stringify(e)}); console.log('Réplicat '+i+' : échec technique consigné')}
    writeFileSync(cran8?'/tmp/pilote-argument-luna-cran8.json':structure?'/tmp/pilote-argument-luna-structure.json':'/tmp/pilote-argument-luna.json',JSON.stringify(sorties,null,2),{mode:0o600})
  }
  if(sorties.some(s=>s.erreur))process.exitCode=1
} else throw Error('--structure ou --luna requis')
