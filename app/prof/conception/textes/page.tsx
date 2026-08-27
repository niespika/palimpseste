// ============================================================================
// C5 · L1 — LES TEXTES : un texte se dépose, se décompose, se valide.
// ----------------------------------------------------------------------------
// « Déposer un texte et concevoir un exercice sont DEUX GESTES SÉPARÉS » (`02-`
//   §6 A). Cet écran porte le PREMIER, et rien du second : le pipeline de
//   conception vit à `/prof/conception/nouvelle`, la lecture et la validation de
//   la référence à `/prof/conception/reference/[id]`.
//
// ⛔ CE N'EST PAS UNE RÉORGANISATION DE LA NAVIGATION. « Les onglets de la
//    lecture et le déménagement de `app/prof/conception/` sont C5-L4 — on ne
//    réorganise pas la navigation » : cet écran s'ajoute sous la conception, il
//    ne déplace rien.
//
// ⚠️ L'INTERRUPTEUR EST `fabrique_actif`, et il n'en naît pas un septième. « Un
//    onglet, une liste, une porte ne sont pas des fonctionnalités à gater : un
//    onglet dont l'interrupteur est à OFF S'AFFICHE, et son contenu dit pourquoi
//    il est vide » (`07-` §5). L'écran s'affiche donc, et le dit.
//
// ⚠️ TOUTE LECTURE SE CONFRONTE À SON DÉCOMPTE. PostgREST plafonne à 1000 lignes
//    SANS RIEN SIGNALER — c'est le défaut qui a fait naître C4-L8-bis, où sept
//    objets sur treize n'avaient plus aucune consigne. Ici les volumes sont
//    petits, mais « petit aujourd'hui » n'est pas une garde : on compare.
// ============================================================================

import Link from 'next/link'
import { garderProf } from '@/utils/fabrique/acces'
import { lire, incidentsDe } from '@/utils/fabrique/lecture'
import { phrasesDuTexte } from '@/utils/fabrique/verifie-reference'
import { borneDeConception, phraseDeLaBorne } from '@/utils/fabrique/non-spoiler-conception'
import Depot from './Depot'
import ListeTextes from './ListeTextes'
import type { ContenuAAdopter, LigneTexte } from './types'

export const dynamic = 'force-dynamic'

type Ligne = Record<string, unknown>
const txt = (x: unknown): string => (typeof x === 'string' ? x : '')
const num = (x: unknown): number | null => (typeof x === 'number' ? x : null)
const oui = (x: unknown): boolean => x === true
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
/** Une jointure Supabase rend tantôt un objet, tantôt un tableau d'un élément. */
const jointure = (x: unknown, k: string): Ligne => {
  const v = lig(x)[k]
  return lig(Array.isArray(v) ? v[0] : v)
}

const PLAFOND = 1000

export default async function TextesDeLaFabrique() {
  const { admin, actif } = await garderProf()

  const [lTextes, lContenus, lLivres] = await Promise.all([
    lire<Ligne>('les textes de la fabrique',
      admin.from('exercices_textes')
        // ⚠️ LE `select` RESTE UN LITTÉRAL D'UN SEUL TENANT. Coupé avec un `+`, il
        //    cesse d'être une constante de type : le typeur de supabase-js rend
        //    `GenericStringError[]` et la ligne devient inassignable — sans que rien
        //    ne dise que c'est la MISE EN FORME qui l'a cassée (piège déjà noté à
        //    `app/prof/corpus/page.tsx` et à `utils/routeur/donnees.ts`).
        .select('id, id_import, auteur, titre, reference, statut, bloque, contenu_id, plan_livre_id, plan_livre_declare, plan_semaine, reference_id, exercices_references(id, validee_at), scriptorium_contenus(texte_extrait)')
        .neq('statut', 'retire').order('created_at').limit(PLAFOND)),
    lire<Ligne>('les textes du Scriptorium',
      admin.from('scriptorium_contenus')
        .select('id, titre, auteur, texte_extrait')
        .eq('type', 'texte').is('supprime_at', null).order('titre').limit(PLAFOND)),
    lire<Ligne>('les livres',
      admin.from('aletheia_livre_reference')
        .select('id, scriptorium_unites:scriptorium_livre_id(label, supprime_at)').limit(PLAFOND)),
  ])
  const incidents = incidentsDe(lTextes, lContenus, lLivres)

  // ⚠️ LE DÉCOMPTE, CONFRONTÉ. Une liste tronquée ressemble à une liste courte.
  const { count: nContenus } = await admin.from('scriptorium_contenus')
    .select('id', { count: 'exact', head: true }).eq('type', 'texte').is('supprime_at', null)
  if (nContenus !== null && nContenus > lContenus.lignes.length) {
    incidents.push(`les textes du Scriptorium : ${lContenus.lignes.length} lus sur ${nContenus} `
      + 'en base — la liste est TRONQUÉE, et ce qu’elle ne montre pas n’est pas absent.')
  }

  const titreDuLivre = new Map(
    (lLivres.lignes as unknown as Ligne[])
      .filter((l) => !jointure(l, 'scriptorium_unites').supprime_at)
      .map((l) => [txt(l.id), txt(jointure(l, 'scriptorium_unites').label) || txt(l.id)]))

  const textes: LigneTexte[] = (lTextes.lignes as unknown as Ligne[]).map((t) => {
    const contenu = txt(jointure(t, 'scriptorium_contenus').texte_extrait)
    const ref = jointure(t, 'exercices_references')
    const borne = borneDeConception({
      id: txt(t.id),
      planLivreReferenceId: t.plan_livre_id === null ? null : txt(t.plan_livre_id),
      planSeance: num(t.plan_semaine),
    })
    return {
      id: txt(t.id),
      idImport: txt(t.id_import),
      libelle: `${txt(t.auteur)} — ${txt(t.titre)}`,
      reference: txt(t.reference),
      etatReference: !t.reference_id || !ref.id ? 'aucune' : (ref.validee_at ? 'validee' : 'deposee'),
      referenceId: t.reference_id === null ? null : txt(t.reference_id),
      statut: txt(t.statut),
      bloque: oui(t.bloque),
      borne: phraseDeLaBorne(borne, t.plan_livre_id ? titreDuLivre.get(txt(t.plan_livre_id))
        : txt(t.plan_livre_declare)),
      motsDuTexte: (contenu.match(/\S+/g) ?? []).length,
      phrasesDuTexte: phrasesDuTexte(contenu).length,
    }
  })

  // LE PONT — les textes du Scriptorium qui n'ont pas encore d'identité de
  // fabrique. « Jamais une seconde table de textes » : ce sont les MÊMES lignes.
  const adoptes = new Set((lTextes.lignes as unknown as Ligne[]).map((t) => txt(t.contenu_id)))
  const aAdopter: ContenuAAdopter[] = (lContenus.lignes as unknown as Ligne[])
    .filter((c) => !adoptes.has(txt(c.id)))
    .map((c) => ({
      id: txt(c.id), titre: txt(c.titre) || '(sans titre)', auteur: txt(c.auteur) || '(sans auteur)',
      motsDuTexte: (txt(c.texte_extrait).match(/\S+/g) ?? []).length,
    }))

  const livres = [...titreDuLivre.entries()].map(([id, titre]) => ({ id, titre }))

  return (
    <div className="space-y-6 pb-12">
      <header className="space-y-1">
        <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
          Pilotage · La fabrique ·{' '}
          <Link href="/prof/conception" className="underline">Conception</Link>
        </p>
        <h1 className="font-titre text-2xl text-encre">Les textes, et leur décomposition</h1>
        <p className="font-ui text-sm text-encre-douce max-w-3xl">
          <strong>Déposer un texte et concevoir un exercice sont deux gestes séparés.</strong>{' '}
          Ce qu&apos;on extrait d&apos;un texte s&apos;appelle une <em>référence décomposée</em> :
          elle est <strong>engendrée</strong>, puis <strong>validée par vous</strong>. Elle
          appartient au texte — ni à l&apos;exercice, ni à l&apos;élève — et se fabrique
          {' '}<strong>une seule fois</strong> ; tous les exercices bâtis sur ce texte s&apos;en
          servent.
        </p>
      </header>

      {!actif && (
        <p className="rounded-lg border border-attention bg-attention-teinte px-3 py-2 font-ui text-sm text-encre">
          <code>fabrique_actif</code> est à OFF : ce que vous déposez ici n&apos;est pas encore
          servi aux élèves. <strong>Le dépôt et la décomposition, eux, fonctionnent</strong> — un
          interrupteur du professeur ne ferme pas l&apos;atelier où il prépare.
        </p>
      )}

      {incidents.length > 0 && (
        <div className="rounded-lg border border-retard bg-retard-teinte px-3 py-2 space-y-1">
          <p className="font-ui text-sm text-encre">
            <strong>Des lectures ont échoué.</strong> Ce que cet écran ne montre pas n’est
            peut-être pas absent : il n’a pas pu être lu.
          </p>
          {incidents.map((x, i) => (
            <p key={i} className="font-ui text-xs text-encre-douce">· {x}</p>
          ))}
        </div>
      )}

      <ListeTextes textes={textes} />
      <Depot aAdopter={aAdopter} livres={livres} />
    </div>
  )
}
