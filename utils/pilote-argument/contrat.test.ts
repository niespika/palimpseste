import test from 'node:test'
import assert from 'node:assert/strict'
import { creerContrat, COMPETENCES_PILOTE, affichagePilote, attentesPour, observablesPour, paquetIndependant, validerReponses, type ContratServi } from './contrat'
import { admissibiliteSujet } from './admissibilite'
import { comparerConstats, retourDesConstats, verifierPreuves, formeJugement, formeExtraction, passagesCitables, formeAvecReferences, retablirPassages, type JugementArgument } from './jugement'
import { valider } from '../chaine/schema'

export function contratTest(a: Partial<Parameters<typeof creerContrat>[0]> = {}): ContratServi {
  return creerContrat({ cran: 6, parcours: 'TC', principale: 'expression', secondaire: 'argumentation',
    sujet: { id: 'sujet-test', enonce: 'Peut-on toujours dire la vérité ?', notions: ['la vérité'] },
    contexte_fourni: '', classe_id: 'classe-test', admissibilite: { cours_ids: ['cours-test'], notions_ouvertes: ['la vérité'], verifie_le: '2026-09-10' }, ...a })
}
const sujet = { forme: 'dissertation_tc', notions: ['la vérité','la nature'], statut: 'valide', bloque: false, cours_etat: 'notions' }
test('les références rétablissent la copie exacte et refusent une preuve fabriquée ou répétée', () => {
  const texte='La science elle mesure ça.\nUne balance mesure la masse.', c=contratTest()
  const passages=passagesCitables(texte)
  assert.ok(passages.length>1 && passages.every(p=>texte.includes(p)))
  const brut=Object.fromEntries(attentesPour(c,'v1').map(a=>[a.id,{preuves:[0],absence:false}]))
  const forme=formeAvecReferences(formeExtraction(c,'v1'),passages)
  assert.ok(valider(brut,forme).ok)
  const releve=retablirPassages(brut,passages)
  verifierPreuves(c,'v1',texte,releve)
  assert.deepEqual(releve['argument.idee.presence'].passages,[passages[0]])
  brut['argument.idee.presence'].preuves=[passages.length]
  assert.equal(valider(brut,forme).ok,false)
  assert.throws(()=>retablirPassages(brut,passages))
  brut['argument.idee.presence'].preuves=[0,0]
  assert.throws(()=>retablirPassages(brut,passages))
})
test('admissibilité : une notion suffit, futur et parcours différents refusés', () => {
  assert.ok(admissibiliteSujet('TC',sujet,[{ id:'cours',notions:['la vérité'] }]))
  assert.equal(admissibiliteSujet('TC',sujet,[]),null)
  assert.equal(admissibiliteSujet('1HLP',sujet,[{ id:'cours',notions:['la vérité'] }]),null)
  assert.equal(admissibiliteSujet('TC',{ ...sujet,cours_etat:'generique' },[{id:'cours',notions:['la vérité']}]),null)
})
test('HLP : une entrée du thème commencé ouvre le thème, sans croiser niveaux', () => {
  const hlp = { ...sujet, forme:'essai_hlp', notions:['Les métamorphoses du moi'] }
  assert.ok(admissibiliteSujet('THLP',hlp,[{id:'cours',notions:['Les expressions de la sensibilité']}]))
  assert.equal(admissibiliteSujet('1HLP',hlp,[{id:'cours',notions:['Les pouvoirs de la parole']}]),null)
  assert.ok(admissibiliteSujet('1HLP',{...hlp,notions:['L’autorité de la parole']},[{id:'cours',notions:['L’art de la parole']}]))
})
test('54 configurations : repères, séparation de P1, VF limitée et cran 8 sans fuite', () => {
  let n=0
  for (const principale of COMPETENCES_PILOTE) for (const secondaire of [null,...COMPETENCES_PILOTE.filter(c => c!==principale)]) {
    for (const parcours of ['TC','1HLP','THLP'] as const) for (const cran of [6,8] as const) {
      const c=contratTest({principale,secondaire,parcours,cran});n++
      const p=paquetIndependant(c,'Copie élève','v1')
      assert.equal(p.sujet_exact,c.sujet.enonce)
      assert.equal(JSON.stringify(p).includes(c.contrat.modele.texte),false)
      assert.equal('trace' in p,false)
      assert.equal('questions' in p,false)
      const v=affichagePilote(c,'v1')
      assert.equal(v.preparation.length,cran===8 ? 0 : principale==='structure' && !secondaire ? 2 : 3)
      if(cran===8) {assert.equal(v.modele,null);assert.deepEqual(v.reponses,[]);assert.equal(v.invitation,'');assert.deepEqual(v.aideRevision,[])}
      assert.deepEqual(paquetIndependant(c,'VF','vf').competences_mesurees,[principale])
      assert.ok(attentesPour(c,'vf').filter(a=>a.mesure_demandee).every(a=>a.competence===principale))
      assert.equal(new Set(observablesPour(c,'v1','structure')).size,observablesPour(c,'v1','structure').length)
    }
  }
  assert.equal(n,54)
})
test('le contrat refuse deux fois la même compétence et les réponses forgées', () => {
  assert.throws(()=>contratTest({principale:'expression',secondaire:'expression'}))
  const c=contratTest(), id=c.questions[0].id
  validerReponses(c,'Mon texte',[{question_id:id,etat:'incertain'}])
  assert.throws(()=>validerReponses(c,'Mon texte',[{question_id:id,etat:'fonctionne',passage:'Texte inventé'}]))
  assert.throws(()=>validerReponses(c,'Mon texte',[{question_id:id,etat:'repere'} as never]))
  assert.throws(()=>validerReponses(c,'Mon texte',[{question_id:id,etat:'incertain'},{question_id:id,etat:'incertain'}]))
  assert.throws(()=>validerReponses(contratTest({cran:8}),'Mon texte',[]))
})
test('une nouvelle banque ne remplace pas les critères ni les aides d’un contrat déjà attribué', () => {
  const courant=contratTest(), attribue=structuredClone(courant)
  attribue.version='0.2'
  attribue.empreinte_pedagogique='a12996f1fa94344791a0741f4a326a93de69058e14e56afe49dcc59cb75a123c'
  attribue.contrat.version='0.2'
  attribue.contrat.regles_communes=['Règle conservée lors de l’attribution.']
  attribue.contrat.attentes[0].critere='Critère conservé lors de l’attribution.'
  attribue.questions[0].preparation='Question conservée lors de l’attribution.'
  attribue.contrat.modele.annotations[0].libelle='Annotation conservée lors de l’attribution.'
  // Le passage par JSON reproduit la lecture du contrat stocké en base.
  const relu=JSON.parse(JSON.stringify(attribue)) as ContratServi
  for(const phase of ['v1','vf'] as const) {
    const paquet=paquetIndependant(relu,'Copie enregistrée',phase)
    assert.equal(paquet.empreinte_pedagogique,attribue.empreinte_pedagogique)
    assert.deepEqual(paquet.regles,attribue.contrat.regles_communes)
    assert.equal(paquet.attentes[0].critere,attribue.contrat.attentes[0].critere)
    assert.notEqual(paquet.attentes[0].critere,courant.contrat.attentes[0].critere)
  }
  const ecran=affichagePilote(relu,'v1')
  assert.equal(ecran.preparation[0].preparation,attribue.questions[0].preparation)
  assert.equal(ecran.modele?.annotations[0].libelle,attribue.contrat.modele.annotations[0].libelle)
  assert.notEqual(courant.empreinte_pedagogique,attribue.empreinte_pedagogique)
})
function jugement(c: ContratServi): JugementArgument {
  return Object.fromEntries(attentesPour(c,'v1').map(a => [a.id,{etat:'tenu',passages:['Mon texte'],motif:'Tu donnes une idée lisible.',revision:null}]))
}
test('contrôle des preuves : citations étrangères, absence contradictoire, état impossible', () => {
  const c=contratTest(), j=jugement(c)
  assert.ok(valider(j,formeJugement(c,'v1')).ok)
  verifierPreuves(c,'v1','Mon texte',j)
  j['argument.idee.presence'].passages=['Prémisse du modèle']
  assert.throws(()=>verifierPreuves(c,'v1','Mon texte',j))
  j['argument.idee.presence']={etat:'non_applicable',passages:[],motif:'Absent',revision:null}
  assert.throws(()=>verifierPreuves(c,'v1','Mon texte',j))
})
test('VF : Expression corrigée et raisonnement encore faux restent deux constats', () => {
  const c=contratTest(), v1=jugement(c), vf=jugement(c)
  v1['argument.expression.precision']={etat:'a_reprendre',passages:['Mon texte'],motif:'Un mot reste flou.',revision:'Précise ce mot.'}
  v1['argument.lien.pertinence']={etat:'a_reprendre',passages:['Mon texte'],motif:'Cet appui ne justifie pas la conclusion.',revision:'Explique pourquoi cet appui soutient cette idée.'}
  vf['argument.lien.pertinence']=v1['argument.lien.pertinence']
  const cmp=comparerConstats(c,v1,vf)
  assert.equal(cmp.principale.filter(a=>a.changement==='corrige').length,1)
  assert.ok(cmp.objet.some(a=>a.apres==='a_reprendre'))
  assert.equal(cmp.delta_progression,null);assert.equal(cmp.reussite_autonome,false)
  const r=retourDesConstats(c,'depot-test','vf',vf,v1)
  assert.ok(r.points.some(p=>p.portee==='objet'))
  assert.match(r.points.at(-1)!.texte,/Une difficulté reste/)
})
test('VF inverse : raisonnement corrigé, expression inchangée et indéterminable conservé', () => {
  const c=contratTest(), v1=jugement(c), vf=jugement(c)
  v1['argument.lien.pertinence']={etat:'a_reprendre',passages:['Mon texte'],motif:'Lien défaillant',revision:'Précise le lien.'}
  vf['argument.expression.precision']={etat:'indeterminable',passages:[],motif:'Lecture incertaine',revision:null}
  const cmp=comparerConstats(c,v1,vf)
  assert.equal(cmp.principale.filter(a=>a.changement==='corrige').length,0)
  assert.ok(cmp.objet.some(a=>a.changement==='corrige'))
  assert.equal(cmp.principale.find(a=>a.attente==='argument.expression.precision')?.changement,'indeterminable')
  const bilan=retourDesConstats(c,'depot-test','vf',vf,v1).points.at(-1)!
  assert.equal(bilan.nature,'reussite')
  assert.equal(bilan.portee,'objet')
  assert.match(bilan.texte,/a corrigé/)
  assert.match(bilan.texte,/incertains/)
  assert.doesNotMatch(bilan.texte,/ne permet pas de constater un point corrigé/)
})
test('un argument inchangé déjà tenu ne reçoit pas un reproche de révision absente', () => {
  const c=contratTest(), j=jugement(c)
  const bilan=retourDesConstats(c,'depot-test','vf',j,j).points.at(-1)!
  assert.equal(bilan.nature,'reussite')
  assert.equal(bilan.texte,'Les points examinés sont tenus dans les deux versions.')
  assert.doesNotMatch(bilan.texte,/corrigé|progressé/)
})
test('une incertitude devenue tenue ne devient pas une correction démontrée', () => {
  const c=contratTest(), avant=jugement(c), apres=jugement(c)
  avant['argument.lien.pertinence']={etat:'indeterminable',passages:[],motif:'Le lien reste incertain.',revision:null}
  const bilan=retourDesConstats(c,'depot-test','vf',apres,avant).points.at(-1)!
  assert.doesNotMatch(bilan.texte,/a corrigé|sont tenus dans les deux/)
  assert.match(bilan.texte,/ne permet pas de conclure/)
})
test('le bilan de correction conserve aussi la difficulté qui reste dans la principale', () => {
  const c=contratTest(), avant=jugement(c), apres=jugement(c)
  avant['argument.lien.pertinence']={etat:'a_reprendre',passages:['Mon texte'],motif:'Le lien manque.',revision:'Explique le lien.'}
  avant['argument.expression.precision']=apres['argument.expression.precision']={etat:'a_reprendre',passages:['Mon texte'],motif:'Un mot reste vague.',revision:'Précise ce mot.'}
  const bilan=retourDesConstats(c,'depot-test','vf',apres,avant).points.at(-1)!
  assert.match(bilan.texte,/a corrigé/)
  assert.match(bilan.texte,/reste à reprendre/)
  assert.equal(bilan.portee,'objet')
})
