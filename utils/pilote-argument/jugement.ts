import { attentesPour, type ContratServi } from './contrat'
import type { Forme } from '../chaine/schema'
import type { RetourSegmente, PointRetour } from '../chaine/types'
import { citationsAttribueesDansLaProse } from '../chaine/retour'

export type EtatConstat = 'tenu' | 'a_reprendre' | 'indeterminable' | 'non_applicable'
export type ExtractionArgument = Record<string, { passages: string[]; absence: boolean }>
export type JugementArgument = Record<string, { etat: EtatConstat; passages: string[]; motif: string; revision: string | null }>
export type ConstatReference = { preuves: number[]; absence?: boolean; etat?: EtatConstat; motif?: string; revision?: string | null }

/** Les citations sont toujours des sous-chaînes de la copie, assemblées par le code. */
export function passagesCitables(texte: string): string[] {
  return Array.from(new Intl.Segmenter('fr', {granularity:'sentence'}).segment(texte), s => s.segment.trim()).filter(Boolean)
}
export function formeAvecReferences(forme: Forme, passages: readonly string[]): Forme {
  if (forme.type !== 'objet' || !passages.length) throw new Error('Preuves indisponibles')
  return {type:'objet',champs:Object.fromEntries(Object.entries(forme.champs).map(([id,f]) => {
    if(f.type!=='objet')throw new Error('Constat illisible')
    const champs=Object.fromEntries(Object.entries(f.champs).filter(([cle])=>cle!=='passages'))
    return [id,{type:'objet',champs:{...champs,preuves:{type:'liste',de:{type:'enum',valeurs:passages.map((_,i)=>i)},max:8}}}]
  }))}
}
export function retablirPassages(sortie: Record<string, ConstatReference>, passages: readonly string[]): ExtractionArgument | JugementArgument {
  return Object.fromEntries(Object.entries(sortie).map(([id,{preuves,...constat}]) => {
    if(new Set(preuves).size!==preuves.length || preuves.some(i=>!Number.isInteger(i) || passages[i]===undefined)) throw new Error(`${id} : référence de preuve invalide`)
    return [id,{...constat,passages:preuves.map(i=>passages[i])}]
  })) as ExtractionArgument | JugementArgument
}

export function formeExtraction(c: ContratServi, phase: 'v1' | 'vf'): Forme {
  return { type: 'objet', champs: Object.fromEntries(attentesPour(c, phase).map(a => [a.id, {
    type: 'objet', champs: { passages: { type: 'liste', de: { type: 'texte', min: 1 }, max: 8 }, absence: { type: 'booleen' } },
  }])) }
}
export function formeJugement(c: ContratServi, phase: 'v1' | 'vf'): Forme {
  return { type: 'objet', champs: Object.fromEntries(attentesPour(c, phase).map(a => [a.id, {
    type: 'objet', champs: { etat: { type: 'enum', valeurs: ['tenu','a_reprendre','indeterminable','non_applicable'] },
      passages: { type: 'liste', de: { type: 'texte', min: 1 }, max: 8 },
      motif: { type: 'texte', min: 1, max: 900 }, revision: { type: 'ou', formes: [{ type: 'texte', min: 1, max: 500 }, { type: 'nul' }] } },
  }])) }
}
export function verifierPreuves(c: ContratServi, phase: 'v1' | 'vf', texte: string, releve: ExtractionArgument | JugementArgument): void {
  const attentes = attentesPour(c, phase)
  if (Object.keys(releve).length !== attentes.length || attentes.some(a => !releve[a.id])) throw new Error('Attentes manquantes ou supplémentaires')
  for (const a of attentes) {
    const r = releve[a.id]
    if (r.passages.some(p => !texte.includes(p))) throw new Error(`${a.id} : citation absente du texte élève`)
    if ('motif' in r && citationsAttribueesDansLaProse(r.motif + ' ' + (r.revision ?? '')).some(p => !texte.includes(p))) {
      throw new Error('Citation attribuée à l’élève absente de sa copie')
    }
    if ('absence' in r && r.absence && r.passages.length) throw new Error(`${a.id} : absence true exige passages vide`)
    if ('etat' in r) {
      if (r.etat === 'tenu' && !r.passages.length) throw new Error(`${a.id} : tenu exige un passage verbatim`)
      if (r.etat === 'non_applicable' && a.condition === 'toujours') throw new Error(`${a.id} : attente toujours applicable, non_applicable interdit`)
      if (r.etat === 'a_reprendre' && !r.revision) throw new Error(`${a.id} : a_reprendre exige une action de révision`)
    }
  }
}
export function prioriteRevision(c: ContratServi, j: JugementArgument): string | null {
  const attentes = attentesPour(c, 'v1')
  return attentes.find(a => a.competence === c.principale && j[a.id]?.etat === 'a_reprendre')?.id
    ?? attentes.find(a => a.attente_objet && j[a.id]?.etat === 'a_reprendre')?.id ?? null
}
export function comparerConstats(c: ContratServi, v1: JugementArgument, vf: JugementArgument) {
  const changements = attentesPour(c,'vf').map(a => {
    const avant = v1[a.id]?.etat, apres = vf[a.id]?.etat
    return { attente: a.id, fonction: a.fonction, avant: avant ?? null, apres: apres ?? null,
      changement: !avant || !apres || ['indeterminable','non_applicable'].includes(avant) || ['indeterminable','non_applicable'].includes(apres)
        ? 'indeterminable' : avant === apres ? 'stable' : apres === 'tenu' ? 'corrige' : 'a_reprendre' }
  })
  const ids = new Set(attentesPour(c,'vf').filter(a => a.mesure_demandee).map(a => a.id))
  const objet = new Set(attentesPour(c,'vf').filter(a => a.attente_objet).map(a => a.id))
  return { principale: changements.filter(a => ids.has(a.attente)), objet: changements.filter(a => objet.has(a.attente)),
    reussite_autonome: false as const, delta_progression: null }
}

/** Le retour expose les constats jugés, sans réinventer un score ni faire un troisième jugement. */
export function retourDesConstats(c: ContratServi, depotId: string, phase: 'v1' | 'vf', j: JugementArgument, v1?: JugementArgument): RetourSegmente {
  const attentes = attentesPour(c, phase)
  const priorite = prioriteRevision(c, phase === 'vf' && v1 ? v1 : j)
  const choisies = [
    attentes.find(a => a.competence === c.principale && j[a.id]?.etat === 'tenu'),
    attentes.find(a => a.id === priorite),
    attentes.find(a => a.attente_objet && j[a.id]?.etat === 'a_reprendre' && a.id !== priorite),
    ...(phase === 'v1' && c.secondaire ? [attentes.find(a => a.competence === c.secondaire && j[a.id]?.etat === 'a_reprendre')] : []),
  ].filter((a): a is typeof attentes[number] => !!a)
  if (!choisies.length) choisies.push(attentes.find(a => j[a.id]?.etat !== 'non_applicable') ?? attentes[0])
  const vus = new Set<string>()
  const points: PointRetour[] = []
  for (const a of choisies) {
    const r = j[a.id]
    if (!r || vus.has(a.id)) continue
    // Deux propriétés peuvent partager une preuve : ne pas publier deux fois le même constat.
    const cle = JSON.stringify([r.passages, r.motif])
    if (vus.has(cle)) continue
    vus.add(a.id); vus.add(cle)
    const porteObjet = !a.mesure_demandee
    points.push({ id: `${depotId}-${phase}-${a.id}`, competence: a.competence as PointRetour['competence'],
      portee: porteObjet ? 'objet' : 'competence',
      nature: r.etat === 'tenu' ? 'reussite' : 'point_de_travail',
      ...(r.passages[0] ? { ancrage: { source: 'copie' as const, citation: r.passages[0] } } : {}),
      texte: `${porteObjet ? 'Dans ton argument : ' : ''}${r.motif}` })
  }
  if (phase === 'vf' && v1) {
    const comparaison = comparerConstats(c,v1,j)
    const corriges = comparaison.principale.filter(a => a.changement === 'corrige')
    const resteObjet = comparaison.objet.some(a => a.apres === 'a_reprendre')
    points.push({ id: `${depotId}-vf-comparaison`, competence: c.principale, nature: corriges.length ? 'reussite' : 'point_de_travail',
      texte: corriges.length
        ? `Ta révision a corrigé ce point : ${corriges.map(a => a.fonction.toLowerCase()).join(', ')}.${resteObjet ? ' Une difficulté reste dans la construction de l’argument.' : ''}`
        : 'La comparaison des deux versions ne permet pas de constater un point corrigé dans la compétence travaillée.' })
  }
  return { points, action_revision: phase === 'v1' && priorite ? j[priorite].revision : null, feed_forward: null }
}
