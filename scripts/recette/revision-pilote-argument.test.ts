import test from 'node:test'
import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContexteDepot } from '../../utils/chaine/contexte'
import { creerContrat, attentesPour } from '../../utils/pilote-argument/contrat'
import { jugerArgument, reprendreConstatsV1, type ResultatArgument } from '../../utils/pilote-argument/chaine'
import { comparerConstats, retourDesConstats } from '../../utils/pilote-argument/jugement'
import { empreinteTexte } from '../../utils/pilote-argument/serveur'

function fixture() {
  const texte='Un exemple permet de défendre une possibilité.'
  const c=creerContrat({cran:8,parcours:'THLP',principale:'structure',secondaire:'expression',
    sujet:{id:'sujet-test',enonce:'Que peut montrer un exemple ?',notions:['Les métamorphoses du moi']},
    contexte_fourni:'Le cas est hypothétique.',classe_id:'classe-test',
    admissibilite:{cours_ids:['cours-test'],notions_ouvertes:['Les métamorphoses du moi'],verifie_le:'2026-09-11'}})
  const ids=attentesPour(c,'v1').map(a=>a.id)
  const v1: ResultatArgument={empreinte_texte:empreinteTexte(texte),empreinte_pedagogique:c.empreinte_pedagogique,modele:'modele-conserve',
    extraction:Object.fromEntries(ids.map(id=>[id,{passages:[texte],absence:false}])),
    jugement:Object.fromEntries(ids.map(id=>[id,{etat:'tenu',passages:[texte],motif:'Tu exposes une possibilité.',revision:null}]))}
  v1.jugement['argument.appui.recevabilite']={etat:'indeterminable',passages:[],motif:'Le statut du cas reste incertain.',revision:null}
  return {c,texte,v1}
}

test('VF identique : mêmes états et motifs, secondaire écartée et aucune observation inventée', () => {
  const {c,texte,v1}=fixture(), original=structuredClone(v1)
  const vf=reprendreConstatsV1(c,texte,texte,v1)!
  assert.deepEqual(Object.keys(vf.jugement),attentesPour(c,'vf').map(a=>a.id))
  assert.equal(vf.jugement['argument.expression.precision'],undefined)
  assert.deepEqual(vf.jugement['argument.appui.recevabilite'],v1.jugement['argument.appui.recevabilite'])
  assert.equal(vf.modele,v1.modele)
  const cmp=comparerConstats(c,v1.jugement,vf.jugement)
  assert.ok([...cmp.principale,...cmp.objet].every(c=>!['corrige','a_reprendre'].includes(c.changement)))
  assert.equal(cmp.reussite_autonome,false)
  assert.equal(cmp.delta_progression,null)
  assert.doesNotMatch(retourDesConstats(c,'depot-test','vf',vf.jugement,v1.jugement).points.at(-1)!.texte,/a corrigé/)
  vf.jugement['argument.idee.presence'].motif='Autre motif'
  assert.deepEqual(v1,original)
})

test('la reprise exige le texte exact, la bonne empreinte pédagogique et des preuves valides', () => {
  const {c,texte,v1}=fixture()
  assert.equal(reprendreConstatsV1(c,texte,texte+' ',v1),null)
  assert.equal(reprendreConstatsV1(c,texte,texte.replace('possibilité','certitude'),v1),null)
  assert.throws(()=>reprendreConstatsV1(c,texte,texte,{...v1,empreinte_texte:'perimee'}))
  assert.throws(()=>reprendreConstatsV1({...c,empreinte_pedagogique:'autre'},texte,texte,v1))
  const incomplet=structuredClone(v1);delete incomplet.jugement['argument.idee.presence']
  assert.throws(()=>reprendreConstatsV1(c,texte,texte,incomplet))
  const invente=structuredClone(v1);invente.extraction['argument.idee.presence'].passages=['Citation inventée']
  assert.throws(()=>reprendreConstatsV1(c,texte,texte,invente))
})

function baseFictive(v1: ResultatArgument | null, erreurInsertion?: string) {
  const lignes=new Map<string,ResultatArgument>(v1 ? [['v1',structuredClone(v1)]] : [])
  const insertions: unknown[]=[]
  return {lignes,insertions,admin:{from(table: string) {
    assert.equal(table,'exercices_pilote_argument_jugements')
    let version=''
    return {select() {return this},eq(champ: string,valeur: string) {if(champ==='version')version=valeur;return this},
      async maybeSingle() {return {data:lignes.get(version) ?? null,error:null}},
      async insert(ligne: ResultatArgument & {version:string}) {
        insertions.push(structuredClone(ligne))
        if(erreurInsertion==='23505') {lignes.set(ligne.version,structuredClone(ligne));return {error:{code:'23505'}}}
        if(erreurInsertion) return {error:{code:erreurInsertion,message:'Écriture refusée'}}
        lignes.set(ligne.version,structuredClone(ligne));return {error:null}
      }}
  }} as unknown as SupabaseClient}
}

test('la chaîne persiste la reprise avant le retour et ne la réinsère pas au second passage', async () => {
  const {c,texte,v1}=fixture(),db=baseFictive(v1)
  const ctx={depotId:'depot-test',piloteArgument:c,productionV1:texte,productionVf:texte} as ContexteDepot
  const vf=await jugerArgument(db.admin,ctx,'vf')
  assert.equal(vf.appels,0)
  assert.equal(db.insertions.length,1)
  assert.deepEqual(db.lignes.get('vf')!.jugement,vf.jugement)
  const relu=await jugerArgument(db.admin,ctx,'vf')
  assert.equal(relu.appels,0);assert.equal(db.insertions.length,1)
})

test('la chaîne conserve le refus de sauvegarde et exige le jugement V1', async () => {
  const {c,texte,v1}=fixture()
  const ctx={depotId:'depot-test',piloteArgument:c,productionV1:texte,productionVf:texte} as ContexteDepot
  await assert.rejects(jugerArgument(baseFictive(v1,'refus').admin,ctx,'vf'),/non conservé/)
  await assert.rejects(jugerArgument(baseFictive(null).admin,ctx,'vf'),/jugement V1 est nécessaire/)
  const concurrent=await jugerArgument(baseFictive(v1,'23505').admin,ctx,'vf')
  assert.equal(concurrent.appels,0)
})
