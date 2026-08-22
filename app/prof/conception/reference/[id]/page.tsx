// ============================================================================
// C4 · L8 — L'ÉCRAN DE VALIDATION DE LA RÉFÉRENCE — celui du `05-` §4.4.
// ----------------------------------------------------------------------------
// « PAR DÉFAUT, LA LECTURE ANNOTÉE : l'armature EN TÊTE — la question
//   directrice, la thèse, et les phrases qui la portent mises en évidence dans
//   le texte —, puis le texte en pleine page, ses moments EN FILET DE MARGE avec
//   leur étiquette et leur flèche de cible, et SEUL CE QUI N'EST PAS ORDINAIRE
//   EST MARQUÉ. À UN BOUTON, LE FORMULAIRE — le détail complet, toutes les
//   valeurs déclarées : IL NE DISPARAÎT JAMAIS. LE BANDEAU PORTE TOUJOURS le
//   verdict du contrôle machine, le nombre de blocages, le nombre de
//   signalements, et le nombre de valeurs déclarées. »   — `05-` §4.4, piège 35
//
// « La validation est UNE LECTURE » (`02-` §6 A) — et « UN SEUL GESTE, POUR
//   TOUTE LA RÉFÉRENCE : pas de validation champ par champ » (`05-` §4.5).
//
// ⚠️ « LES INTERVALLES VIENNENT DU CODE, JAMAIS DU MODÈLE » (`05-` §1) — ici,
//    ils viennent du fichier d'import, et le contrôle les relit.
// ⚠️ « La maquette n'est pas une spécification » (`05-` §5) : cet écran suit le
//    §4.4, pas `MAQUETTE_Ecran_Validation_Reference.html`.
// ⚠️ C5-L1 RÉEMPLOIERA CET ÉCRAN — il ne se construit pas deux fois.
// ============================================================================

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { garderProf } from '@/utils/fabrique/acces'
import { controleReference, phrasesDuTexte } from '@/utils/fabrique/verifie-reference'
import LectureAnnotee from './LectureAnnotee'

export const dynamic = 'force-dynamic'

/** Une ligne rendue par Supabase. Le client ne connaît pas le schéma : on la lit
 *  par accesseurs étroits plutôt qu'en la déréférençant à l'aveugle. */
type Ligne = Record<string, unknown>
const txt = (x: unknown): string => (typeof x === 'string' ? x : '')
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
/** Une jointure Supabase rend tantôt un objet, tantôt un tableau d'un élément. */
const jointure = (x: unknown, k: string): Ligne => {
  const v = lig(x)[k]
  return lig(Array.isArray(v) ? v[0] : v)
}


export default async function ValidationReference({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { admin } = await garderProf()
  const { data: ref } = await admin.from('exercices_references')
    .select('id, localisation, contenu, validee_at, validee_par,'
      + ' scriptorium_contenus(titre, auteur, texte_extrait),'
      + ' exercices_textes(id_import, auteur, titre)')
    .eq('id', id).maybeSingle()
  if (!ref) notFound()

  const r = ref as unknown as Ligne
  const texte = txt(jointure(r, 'scriptorium_contenus').texte_extrait)
  const v = controleReference(r.contenu, texte)
  const phrases = phrasesDuTexte(texte)

  return (
    <div className="space-y-5 pb-12">
      <header className="space-y-1">
        <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
          Pilotage · La fabrique ·{' '}
          <Link href="/prof/conception" className="underline">Conception</Link>
        </p>
        <h1 className="font-titre text-2xl text-encre">
          {txt(jointure(r, 'scriptorium_contenus').auteur)} — {txt(jointure(r, 'scriptorium_contenus').titre)}
        </h1>
        <p className="font-ui text-sm text-encre-douce">
          {txt(r.localisation)}
          {txt(jointure(r, 'exercices_textes').id_import)
            && <> · <code>{txt(jointure(r, 'exercices_textes').id_import)}</code></>}
        </p>
      </header>

      <LectureAnnotee
        referenceId={id}
        dejaValidee={!!r.validee_at}
        phrases={phrases}
        reference={lig(r.contenu)}
        verdict={v}
      />
    </div>
  )
}
