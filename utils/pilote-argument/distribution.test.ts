import { test } from 'node:test'
import assert from 'node:assert/strict'
import { identifiantOffre, instanceArgument, contratDeDecision, type OffreArgument } from './distribution'
import { affichagePilote } from './contrat'
import { candidatsPour, constituerLeVivier, substratsDeLaSemaine } from '../moteur/vivier'
import { lignesDeDecision, propositionsIsoDuree, type LigneDeDecision } from '../moteur/decision'
import type { Doctrine } from '../fabrique/doctrine'
import type { ExercicePose } from '../routeur/semaine'

const doctrine = { crans: { 6: { geste:'produire',code:'production_etayee' }, 8: { geste:'produire',code:'production_autonome' } },
  objets: { argument: { grain:'meso', exclusionsParcours:[], parCran:{6:{dureeMin:20},8:{dureeMin:20}} } } } as unknown as Doctrine
const offre: OffreArgument = { classe_id:'classe', parcours:'TC', cran:6, sujet:{id:'sujet',enonce:'Peut-on connaître la vérité ?',notions:['la vérité']},
  admissibilite:{cours_ids:['cours'],notions_ouvertes:['la vérité'],verifie_le:'2026-09-12T00:00:00Z'} }
const instance = (o=offre) => instanceArgument(identifiantOffre('eleve',o),o,doctrine)
const contexte = { parcours:['tc'] as const, coursVus:new Set(['cours']), positionsDeLecture:new Map(),
  instancesDejaDeposees:new Set<string>(), classesDeLEleve:new Set(['classe']) }
const decision = (principale:string,secondaire:string|null): LigneDeDecision => ({ cible_retenue:principale,
  alternatives_ecartees:{cibles_secondaires:secondaire?[secondaire]:[]},sondes_retenues:[] } as unknown as LigneDeDecision)

test('offres stables et propres à chaque élève, classe, sujet et cran', () => {
  const id = identifiantOffre('eleve',offre)
  assert.match(id,/^[0-9a-f-]{36}$/)
  assert.equal(identifiantOffre('eleve',{...offre,admissibilite:{...offre.admissibilite,verifie_le:'plus tard'}}),id)
  for (const id2 of [identifiantOffre('autre',offre), identifiantOffre('eleve',{...offre,cran:8}),
    identifiantOffre('eleve',{...offre,classe_id:'autre'})]) assert.notEqual(id2,id)
})
test('54 contrats : neuf configurations, trois parcours, deux crans ; version 0.4 conservée', () => {
  for (const parcours of ['TC','1HLP','THLP'] as const) for (const cran of [6,8] as const)
    for (const principale of ['argumentation','expression','structure']) for (const secondaire of [null,'argumentation','expression','structure']) {
      if(principale===secondaire)continue
      const contrat = contratDeDecision(decision(principale,secondaire),{...offre,parcours,cran})
      assert.equal(contrat.version,'0.4')
      assert.equal(contrat.principale,principale)
      assert.equal(contrat.secondaire,secondaire)
      if(cran===8) {
        const vue=affichagePilote(contrat,'v1')
        assert.deepEqual(vue.preparation,[])
        assert.equal(vue.modele,null)
        assert.deepEqual(vue.reponses,[])
        assert.deepEqual(vue.aideRevision,[])
      }
    }
})
test('le pilote refuse la troisième cible et la sonde silencieuse', () => {
  const d=decision('argumentation','expression')
  d.alternatives_ecartees={cibles_secondaires:['expression','structure']}
  assert.throws(()=>contratDeDecision(d,offre))
  d.alternatives_ecartees={cibles_secondaires:[]}
  d.sondes_retenues=[{sonde_montee:false} as never]
  assert.throws(()=>contratDeDecision(d,offre))
})
test('les offres passent les filtres et le budget ordinaires ; classe et dépôt restent des barrières', () => {
  const i=instance()
  assert.equal(constituerLeVivier([i],contexte).retenus.length,1)
  assert.equal(constituerLeVivier([i],{...contexte,classesDeLEleve:new Set(['autre'])}).retenus.length,0)
  assert.equal(constituerLeVivier([i],{...contexte,coursVus:new Set()}).retenus.length,0)
  assert.equal(constituerLeVivier([i],{...contexte,instancesDejaDeposees:new Set([i.exerciceId])}).retenus.length,0)
})
test('une même semaine ne sert pas le même sujet au 6 puis au 8 ; aucune sonde supplémentaire', () => {
  const retenus=constituerLeVivier([instance(),instance({...offre,cran:8}),instance({...offre,sujet:{...offre.sujet,id:'second'}})],contexte).retenus
  const c=candidatsPour(retenus,'argumentation',[],true)[0]
  assert.equal(c.ciblesSecondaires.length,1)
  assert.equal(c.ciblesSecondaires[0],'expression')
  const pose={candidat:c,regle:'R2',tour:0,tirage:false,departageParPB3:false} as ExercicePose
  assert.equal(candidatsPour(retenus,'expression',[pose]).length,1)
  assert.deepEqual(substratsDeLaSemaine([pose],retenus)[0].competences,[])
  assert.equal(propositionsIsoDuree(pose,retenus,[]).offerte,false)
  const [l]=lignesDeDecision([pose],[],retenus,{eleveId:'eleve',cycleLundi:'2026-09-14',etatEscalade:{lu_at:'date',par_competence:{}},
    tirages:[],paliers:new Map(),alternatives:null})
  assert.equal(contratDeDecision(l,offre).secondaire,'expression')
})
test('le 8 peut passer par la sonde de trajectoire existante ; la porte reste fermée sans ce signal', () => {
  const i=instance({...offre,cran:8})
  const porte={actif:true,registre:[],de:()=>({objet:'argument',ouverts:[1,2,3],sondes:[],methode:false})}
  assert.equal(constituerLeVivier([i],{...contexte,porte}).retenus.length,0)
  const ouvert=constituerLeVivier([i],{...contexte,porte:{...porte,sondesDeTrajectoire:new Set(['argumentation'] as const)}})
  assert.equal(ouvert.retenus.length,1)
  assert.equal(ouvert.retenus[0].porte,'sonde')
})
