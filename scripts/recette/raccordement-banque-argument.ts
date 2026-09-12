// Recette FONCTIONNELLE, sans calibration : six parcours/crans et un cycle IA.
// node --env-file=.env.local --import ./scripts/register-calibration-resolver.mjs scripts/recette/raccordement-banque-argument.ts --registre=<chemin ignoré> [--ia]
// --nettoyer reprend uniquement le nettoyage d'un registre interrompu.
import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { chargerDoctrineDepuisBase } from '../../utils/fabrique/doctrine'
import { lireLesSegments } from '../../utils/moteur/calendrier-serveur'
import { lireLesInscriptions, lireLesFiches } from '../../utils/routeur/donnees'
import { lirePagine } from '../../utils/routeur/donnees'
import { lireLesInstances, lireLesInstancesDejaDeposees } from '../../utils/moteur/vivier-serveur'
import { constituerLeVivier, candidatsPour } from '../../utils/moteur/vivier'
import { poserLaSemaineDUnEleve, poserLesSemainesDuRouteur, composerPourUnEleve, type ContextePose } from '../../utils/moteur/cycle-serveur'
import { lignesDeDecision } from '../../utils/moteur/decision'
import { chargeurBanqueArgument, porteBanqueArgument, persisterAvecArguments, instancesArgumentAttribuees } from '../../utils/pilote-argument/distribution-serveur'
import { affichagePilote, type ContratServi } from '../../utils/pilote-argument/contrat'
import { traiterDepot } from '../../utils/chaine/chaine'
import { lireLesDepotsPourLeRegistre } from '../../utils/registre/reussites-serveur'
import { lireLaPorteDesCrans } from '../../utils/registre/porte-serveur'
import { instrumentDuRouteur } from '../../utils/moteur/etat-serveur'
import { valeurDuVerdict } from '../../utils/chaine/observables'

const url=process.env.NEXT_PUBLIC_SUPABASE_URL!
assert.equal(new URL(url).hostname,'aoakpxxlyvthzueaywna.supabase.co','Sandbox uniquement')
const db=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})
const chemin=process.argv.find(a=>a.startsWith('--registre='))?.slice(11)
if(!chemin)throw Error('--registre=chemin privé obligatoire')
type Decor={eleves:string[];lignes:Array<{table:string;id:string}>;params:Record<string,unknown>;preuves:unknown[];empreintes:Record<string,string>;termine?:boolean}
const r:Decor=existsSync(chemin)?JSON.parse(readFileSync(chemin,'utf8')):{eleves:[],lignes:[],params:{},preuves:[],empreintes:{}}
const sauver=()=>writeFileSync(chemin,JSON.stringify(r,null,2),{mode:0o600})
const preuve=(nom:string,detail:unknown=true)=>{r.preuves.push({nom,detail});sauver();console.log(nom,JSON.stringify(detail))}
async function creer(table:string,charge:Record<string,unknown>) {
  const id=typeof charge.id==='string'?charge.id:randomUUID()
  r.lignes.push({table,id});sauver()
  const {error}=await db.from(table).insert({...charge,id});if(error)throw Error(`${table} : ${error.message}`)
  return id
}
async function modifier(table:string,charge:Record<string,unknown>,id:string) {
  const {error}=await db.from(table).update(charge).eq('id',id);if(error)throw Error(`${table} : ${error.message}`)
}
async function params(charge:Record<string,unknown>) {
  const {error}=await db.from('scriptorium_params').update(charge).eq('id',1);if(error)throw error
}
const tables=['exercices_sujets','exercices','exercices_materiaux','exercices_cas','exercices_pilote_argument']
async function empreintes() {
  const resultat:Record<string,string>={}
  for(const table of tables) {
    const cles=table==='exercices_pilote_argument'?['exercice_id']:table==='exercices_cas'?['exercice_id','ordre']:['id']
    const lignes=await lirePagine(db,table,'*',cles,q=>q)
    resultat[table]=createHash('sha256').update(JSON.stringify(lignes)).digest('hex')
  }
  return resultat
}
async function nettoyer() {
  const erreurs:string[]=[]
  try {
    const classes=r.lignes.filter(l=>l.table==='classes').map(l=>l.id)
    if(classes.length) {
      const exercices=await lirePagine<{id:string}>(db,'exercices','id',['id'],q=>q.in('classe_id',classes))
      for(const e of exercices){const {error}=await db.from('exercices').delete().eq('id',e.id);if(error)erreurs.push(error.message)}
    }
    for(const l of [...r.lignes].reverse()) {
      const {error}=await db.from(l.table).delete().eq('id',l.id);if(error)erreurs.push(`${l.table}: ${error.message}`)
    }
    for(const eleve of r.eleves){const {error}=await db.auth.admin.deleteUser(eleve);if(error&&error.status!==404)erreurs.push(error.message)}
  } finally {
    if(Object.keys(r.params).length)await params(r.params)
  }
  if(erreurs.length)throw Error('Nettoyage incomplet : '+erreurs.join('; '))
  if(Object.keys(r.empreintes).length)assert.deepEqual(await empreintes(),r.empreintes,'Banques préexistantes conservées exactement')
  const {data:p,error}=await db.from('scriptorium_params').select(Object.keys(r.params).join(',')).eq('id',1).single()
  if(error)throw error
  assert.deepEqual(p,r.params)
  r.termine=true;preuve('Décor retiré, banques inchangées, paramètres restaurés')
}
if(process.argv.includes('--nettoyer')) {
  await nettoyer()
} else {
  assert.equal(existsSync(chemin),false,'Choisir un registre neuf')
  try {
    const {data:p,error}=await db.from('scriptorium_params').select('routeur_actif,exercices_actif,chaine_actif,gabarit_actif,juge_mesure_actif,notions_actif,pilote_argument_actif,pilote_argument_banque_actif').eq('id',1).single()
    if(error)throw error;r.params=p;r.empreintes=await empreintes();sauver()
    await params({routeur_actif:true,exercices_actif:true,chaine_actif:true,pilote_argument_actif:true,pilote_argument_banque_actif:true,
      gabarit_actif:false,juge_mesure_actif:false,notions_actif:true})
    const doctrine=await chargerDoctrineDepuisBase(db as never)
    const decoupe=await lireLesSegments(db)
    const cycle=decoupe.segments[2].premierLundi!
    assert.ok(cycle)
    const charger=chargeurBanqueArgument(db,doctrine)
    const population:Array<{eleve:string;classe:string;parcours:string;cran:6|8;c:ContextePose}>=[]
    const crans: Array<6|8> = process.argv.includes('--complet-seul') || process.argv.includes('--trajectoire-seule') ? [6] : [6,8]
    for(const parcours of ['TC','1HLP','THLP'])for(const cran of crans) {
      const motDePasse=randomUUID()
      const {data:u,error:eu}=await db.auth.admin.createUser({email:`recette-banque-${randomUUID()}@example.test`,password:motDePasse,email_confirm:true})
      if(eu||!u.user)throw eu
      const eleve=u.user.id;r.eleves.push(eleve);sauver()
      await creer('profiles',{id:eleve,role:'eleve',display_name:'Recette banque argument'})
      const classe=await creer('classes',{nom:`Recette banque ${parcours} cran ${cran}`,niveau:parcours==='1HLP'?'1ere':'terminale',
        type_pedagogique:parcours==='TC'?'tc':'hlp',annee_scolaire:'2026-2027'})
      await creer('inscriptions',{eleve_id:eleve,classe_id:classe})
      const notions=parcours==='TC'?['la vérité']:parcours==='1HLP'?['Les pouvoirs de la parole']:['Les expressions de la sensibilité']
      const cours=await creer('scriptorium_contenus',{type:'cours',titre:'Cours de recette technique',notions,texte_extrait:'Support technique.'})
      const pa=await creer('scriptorium_parcours',{titre:'Recette banque',nb_semaines:2})
      const pc=await creer('scriptorium_parcours_classes',{parcours_id:pa,classe_id:classe,date_debut:'2026-09-07',horaire_snapshot:[
        {semaine:1,dateReelle:'2026-09-07',statut:'definie',semestreNom:'Recette',pedaDansSemestre:1},
        {semaine:2,dateReelle:'2026-09-14',statut:'definie',semestreNom:'Recette',pedaDansSemestre:2}]})
      const cr=await creer('scriptorium_parcours_classe_creneaux',{parcours_classe_id:pc,semaine:1,ordre:0,ref_type:'contenu',contenu_id:cours})
      await creer('scriptorium_parcours_classe_elements',{creneau_id:cr,ref_type:'contenu',semaine:1,ordre:0})
      const {error:en}=await db.from('competences_niveaux').upsert(['argumentation','expression','structure'].map(competence=>({
        eleve_id:eleve,competence,lettre:cran===6?'C':'B',lettre_initiale:cran===6?'C':'B',profil_provisoire:false})))
      if(en)throw en
      const offres=await charger(eleve,[classe])
      assert.ok(offres.length>0)
      const instances=offres.filter(i=>i.cranNumero===cran)
      const c:ContextePose={eleveId:eleve,cycleLundi:cycle,segment:3,decoupe,modesAdmis:doctrine.modesAdmis,
        fuseau:'America/Toronto',maintenant:new Date().toISOString(),echeance:cycle,instances,banqueArgumentActive:true,
        positions:new Map(),dejaDeposees:new Set(),inscriptions:await lireLesInscriptions(db,eleve),coursVus:new Set([cours])}
      population.push({eleve,classe,parcours,cran,c})
      preuve('Offre admissible '+parcours+' cran '+cran,{sujets:instances.length})
    }
    // Un cours hors thème n'ouvre aucun sujet du pilote.
    const hors=await creer('classes',{nom:'Recette hors thème',niveau:'terminale',type_pedagogique:'tc',annee_scolaire:'2026-2027'})
    assert.equal((await charger(population[0].eleve,[hors])).length,0)
    preuve('Classe sans cours admissible : aucune offre')
    await params({pilote_argument_banque_actif:false});assert.equal(await porteBanqueArgument(db),false)
    await params({pilote_argument_banque_actif:true,pilote_argument_actif:false});assert.equal(await porteBanqueArgument(db),false)
    await params({pilote_argument_actif:true});assert.equal(await porteBanqueArgument(db),true)
    preuve('Deux portes indépendantes respectées')
    // La porte du registre demeure : un objet neuf ne produit pas encore.
    await params({gabarit_actif:true})
    const ferme=await composerPourUnEleve(db,population[0].c)
    assert.equal(ferme.vivier.retenus.length,0)
    assert.ok(ferme.vivier.ecartes.some(e=>e.motif==='porte_registre'))
    await params({gabarit_actif:false})
    preuve('Porte du registre conservée : objet neuf fermé au 6')
    // Une semaine mixte, banque ordinaire + pilote, pour le même budget.
    const {instances:banque}=await lireLesInstances(db,doctrine)
    assert.ok(banque.length>600)
    assert.ok(banque.every(i=>!i.piloteArgument))
    const ordinaire=banque.find(i=>i.classeId===null&&i.objet==='argument'&&i.cranNumero===2&&i.modesParCompetence.argumentation)
    if(ordinaire)population[0].c.instances.push(ordinaire)
    for(const membre of population) {
      const avant=await db.from('exercices_pilote_argument').select('*',{head:true,count:'exact'})
      const resultats=await Promise.all([poserLaSemaineDUnEleve(db,membre.c),poserLaSemaineDUnEleve(db,membre.c)])
      assert.ok(resultats.some(b=>b.depotsPoses>0),JSON.stringify(resultats))
      assert.ok(resultats.some(b=>b.dejaServi),JSON.stringify(resultats))
      const historique=await instancesArgumentAttribuees(db,membre.eleve,doctrine)
      assert.ok(historique.length>0)
      assert.ok(historique.every(i=>i.cranNumero===membre.cran))
      const apres=await db.from('exercices_pilote_argument').select('*',{head:true,count:'exact'})
      assert.equal(apres.count!-avant.count!,historique.length,'Une attribution par choix, aucune offre non choisie matérialisée')
      const encore=await poserLaSemaineDUnEleve(db,membre.c);assert.equal(encore.dejaServi,true)
      const deja=await lireLesInstancesDejaDeposees(db,[membre.eleve])
      const suivants=constituerLeVivier(membre.c.instances,{parcours:membre.parcours==='TC'?['tc']:['hlp'],
        coursVus:membre.c.coursVus,positionsDeLecture:new Map(),instancesDejaDeposees:deja.parEleve.get(membre.eleve)!,classesDeLEleve:new Set([membre.classe])})
      assert.ok(suivants.retenus.every(v=>!historique.some(h=>h.exerciceId===v.instance.exerciceId)))
      preuve('Service automatique '+membre.parcours+' cran '+membre.cran,{depots:historique.length,doubleAppel:'un seul service',reprise:'inchangée'})
    }
    // Échec après insertion du premier exercice : toute la transaction recule.
    const m=population[0]
    const deja=(await lireLesInstancesDejaDeposees(db,[m.eleve])).parEleve.get(m.eleve)!
    const i=m.c.instances.find(i=>i.piloteArgument&&!deja.has(i.exerciceId))!
    assert.ok(i)
    const retenus=constituerLeVivier([i],{parcours:['tc'],coursVus:m.c.coursVus,positionsDeLecture:new Map(),instancesDejaDeposees:new Set(),classesDeLEleve:new Set([m.classe])}).retenus
    const candidat=candidatsPour(retenus,'argumentation',[])[0]
    const ctx={...m.c,cycleLundi:'2027-05-03'}
    const [ligne]=lignesDeDecision([{candidat,regle:'R2',tour:0,tirage:false,departageParPB3:false}],[],retenus,
      {eleveId:m.eleve,cycleLundi:ctx.cycleLundi,etatEscalade:{lu_at:ctx.maintenant,par_competence:{}},tirages:[],paliers:new Map(),alternatives:null})
    await assert.rejects(()=>persisterAvecArguments(db,[ligne,{...ligne,exercice_id:randomUUID()}],[i],ctx))
    const absent=await db.from('exercices').select('id').eq('id',i.exerciceId).maybeSingle();assert.equal(absent.data,null)
    await params({pilote_argument_banque_actif:false})
    await assert.rejects(()=>persisterAvecArguments(db,[ligne],[i],ctx))
    await params({pilote_argument_banque_actif:true})
    const repris=await persisterAvecArguments(db,[ligne],[i],ctx);assert.equal(repris.depots.length,1)
    const idDepot=repris.depots[0].depot_id
    await modifier('exercices_depots',{texte_v1:'Brouillon à conserver',statut:'ouvert'},idDepot)
    const bis=await persisterAvecArguments(db,[ligne],[i],ctx);assert.equal(bis.deja_servi,true)
    const copie=await db.from('exercices_depots').select('texte_v1,statut,assigne_at').eq('id',idDepot).single()
    assert.equal(copie.data?.texte_v1,'Brouillon à conserver');assert.equal(copie.data?.statut,'ouvert')
    assert.ok(copie.data?.assigne_at.startsWith(ctx.cycleLundi+'T12:00:00'))
    preuve('Échec transactionnel annulé, porte fermée refusée, reprise sans écraser le brouillon')
    // Bonus : deux requêtes sur le même rang ne consomment qu'une place.
    const j=m.c.instances.find(x=>x.piloteArgument&&!deja.has(x.exerciceId)&&x.exerciceId!==i.exerciceId)!
    const bl={...ligne,exercice_id:j.exerciceId}
    const bonus=await Promise.all([persisterAvecArguments(db,[bl],[j],ctx,0),persisterAvecArguments(db,[bl],[j],ctx,0)])
    assert.equal(bonus.filter(b=>!b.deja_servi).length,1)
    const bd=await db.from('routeur_decisions').select('bonus').eq('id',bonus[0].depots[0].decision_id).single();assert.equal(bd.data?.bonus,true)
    preuve('Bonus concurrent : une décision et un dépôt, marque bonus conservée')
    if(process.argv.includes('--trajectoire-seule')) {
      const instrument=instrumentDuRouteur('argumentation')!
      const observables=Object.fromEntries(Object.entries(instrument.observablesMesure)
        .map(([code,entree])=>[code,valeurDuVerdict(code,entree,false,instrument.parametres).valeur]))
      const fiches=await lireLesFiches(db)
      await params({gabarit_actif:true,juge_mesure_actif:true})
      for(const m of population) {
        const {data:dep,error}=await db.from('exercices_depots').select('id').eq('eleve_id',m.eleve).limit(1).single();if(error)throw error
        await creer('competences_mesures',{eleve_id:m.eleve,classe_id:m.classe,depot_id:dep.id,competence:'argumentation',
          modes:['composer'],observables,lettre_equivalente:null,lieu:'maison',forme:'formatif',instrument_version:'recette-synthetique'})
        const instances=(await charger(m.eleve,[m.classe])).filter(i=>i.cranNumero===8)
        const contexte={...m.c,cycleLundi:'2027-05-10',instances,fiches}
        const compo=await composerPourUnEleve(db,contexte)
        assert.ok(compo.trajectoire.some(t=>t.competence==='argumentation'),'Signal synthétique attendu')
        assert.ok(compo.vivier.retenus.some(v=>v.instance.cranNumero===8&&v.porte==='sonde'))
        const service=await poserLaSemaineDUnEleve(db,contexte)
        assert.ok(service.depotsPoses>0,JSON.stringify(service))
        const ds=await lirePagine<{id:string;sondes_retenues:Array<{motif:string}>}>(db,'routeur_decisions','id,sondes_retenues',['id'],q=>q.eq('eleve_id',m.eleve).eq('cycle_lundi',contexte.cycleLundi))
        assert.ok(ds.some(d=>d.sondes_retenues.some(s=>s.motif==='trajectoire_descente')))
        preuve('Cran 8 servi par le signal existant, gabarit ON, '+m.parcours,{depots:service.depotsPoses,signal:'synthétique, sans lettre créée'})
      }
      await params({gabarit_actif:false,juge_mesure_actif:false})
    }
    // Même entrée que le cron, banque ENTIÈRE et gabarit actif. Seuls les
    // historiques de ces comptes jetables reçoivent des réussites de décor.
    if(process.argv.includes('--complet') || process.argv.includes('--complet-seul')) {
      const cycleSuivant=new Date(Date.parse(cycle+'T12:00:00Z')+7*86400000).toISOString().slice(0,10)
      for(const m of population.filter(m=>m.cran===6))for(const cran of [1,2,3,4,5]) {
        const candidats=banque.filter(i=>i.objet==='argument'&&i.cranNumero===cran&&i.cle&&i.classeId===null)
        assert.ok(candidats.length>=2,'Décor de progression : deux instances requises au cran '+cran)
        for(const [index,i] of candidats.slice(0,2).entries()) {
          const at=new Date(Date.parse(cycle+'T12:00:00Z')-(14-index*7)*86400000).toISOString()
          const depot=await creer('exercices_depots',{eleve_id:m.eleve,exercice_id:i.exerciceId,statut:'clos',origine:'prof',
            assigne_at:at,v1_remis_at:at,verdicts_cran:{v1:{version:'v1',cran,at,modele:'recette-synthetique',reussi:true,
              probleme_present:true,probleme_vu:null,passage:null,motif:'Décor technique, aucune copie réelle jugée.'}}})
          if(cran===1 || cran===3) {
            const {error}=await db.from('exercices_metacognition').insert({depot_id:depot,credence:[{cas:2,jetons:[100,0,0],index_correct:0}]})
            if(error)throw error
          }
        }
      }
      await params({gabarit_actif:true})
      for(const m of population.filter(m=>m.cran===6)) {
        const porte=await lireLaPorteDesCrans(db,m.eleve,cycleSuivant)
        const offres=await charger(m.eleve,[m.classe])
        const compo=await composerPourUnEleve(db,{...m.c,cycleLundi:cycleSuivant,instances:[...banque,...offres],
          notionsActif:true,notionsVues:new Set(['la verite','les pouvoirs de la parole','les expressions de la sensibilite']),
          dejaDeposees:(await lireLesInstancesDejaDeposees(db,[m.eleve])).parEleve.get(m.eleve)!})
        r.preuves.push({nom:'Diagnostic gabarit '+m.parcours,detail:{porte:porte.de('argument'),registre:porte.registre,
          retenus:compo.vivier.retenus.filter(v=>v.instance.objet==='argument').map(v=>({cran:v.instance.cranNumero,porte:v.porte,pilote:!!v.instance.piloteArgument})),
          liste:compo.listeComplete,objets:compo.objets}});sauver()
      }
      const e=population.filter(m=>m.cran===6).map(m=>m.eleve)
      const resultat=await poserLesSemainesDuRouteur(db,'America/Toronto',cycleSuivant,{cycleDemande:cycleSuivant,elevesDemandes:e})
      r.preuves.push({nom:'Point entrée complet',detail:resultat});sauver()
      assert.equal(resultat.erreurs.length,0,JSON.stringify(resultat.erreurs))
      assert.equal(resultat.elevesServis,3,JSON.stringify(resultat))
      for(const m of population.filter(m=>m.cran===6)) {
        const ds=await lirePagine<{id:string;exercice_id:string}>(db,'routeur_decisions','id,exercice_id',['id'],q=>q.eq('eleve_id',m.eleve).eq('cycle_lundi',cycleSuivant))
        const {data:pilotes,error}=await db.from('exercices_pilote_argument').select('exercice_id').in('exercice_id',ds.map(d=>d.exercice_id));if(error)throw error
        const {data:types}=await db.from('exercices').select('cran,exercices_types(code)').in('id',ds.map(d=>d.exercice_id))
        r.preuves.push({nom:'Types réellement servis '+m.parcours,detail:types});sauver()
        assert.ok(pilotes.length>0,'Le point entrée doit servir un argument pour '+m.parcours)
        preuve('Point entrée complet, gabarit ON, '+m.parcours,{total:ds.length,pilotes:pilotes.length,autres:ds.length-pilotes.length})
      }
      await params({gabarit_actif:false})
    }
    if(process.argv.includes('--ia')) {
      const m8=population.find(x=>x.parcours==='TC'&&x.cran===8)!
      const {data:ds,error:ed}=await db.from('exercices_depots').select('id,exercice_id').eq('eleve_id',m8.eleve).limit(1).single();if(ed)throw ed
      const {data:cs,error:ec}=await db.from('exercices_pilote_argument').select('contrat').eq('exercice_id',ds.exercice_id).single();if(ec)throw ec
      const contrat=cs.contrat as ContratServi
      const vue=affichagePilote(contrat,'v1');assert.deepEqual(vue.preparation,[]);assert.equal(vue.modele,null);assert.deepEqual(vue.reponses,[])
      const v1='On peut chercher la vérité avec les autres, car ils voient nos erreurs. Par exemple, un ami peut montrer que notre souvenir est inexact. Discuter donne donc la vérité.'
      const vf='Discuter peut nous rapprocher de la vérité parce que les autres peuvent vérifier les raisons de nos opinions. Par exemple, un ami peut opposer une photographie à notre souvenir d’un événement. Cette preuve permet de corriger ce souvenir ; la discussion rend ici notre jugement plus conforme aux faits. Elle ne garantit pas cependant que tout ce que les autres disent soit vrai.'
      await modifier('exercices_depots',{texte_v1:v1,statut:'v1_remis',v1_remis_at:new Date().toISOString()},ds.id)
      const b1=await traiterDepot(db,ds.id,'v1');assert.ok(b1.retourEcrit,JSON.stringify(b1))
      await modifier('exercices_depots',{texte_vf:vf,statut:'vf_remis',vf_remis_at:new Date().toISOString()},ds.id)
      const b2=await traiterDepot(db,ds.id,'vf');assert.ok(b2.retourEcrit,JSON.stringify(b2))
      const {data:mesures,error:em}=await db.from('competences_mesures').select('competence,lettre_equivalente,delta_v1_vf').eq('depot_id',ds.id);if(em)throw em
      assert.ok(mesures.length>0&&mesures.every(m=>m.lettre_equivalente===null&&m.delta_v1_vf===null))
      assert.equal(b2.mesuresEcrites,0)
      const registre=await lireLesDepotsPourLeRegistre(db,m8.eleve);assert.ok(registre.depots.every(d=>d.depotId!==ds.id))
      preuve('Passation 8 automatiquement servie : V1, retour, VF, retour final',{sujet:contrat.sujet.enonce,v1,vf,b1,b2,mesures,aideAvantV1:false,progressionInventee:false})
    }
  } finally { await nettoyer() }
}
