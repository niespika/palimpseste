// ============================================================================
// C4 · L8 — LA CONCEPTION : les deux portes, et ce qui a été conçu.
// ----------------------------------------------------------------------------
// « Deux portes de conception, un import » (`02-` §6 B ; `01-` §2 ; piège 26).
// « L'atelier est un attribut visuel, jamais un interlocuteur différent. »
// ============================================================================

import Link from 'next/link'
import { garderProf } from '@/utils/fabrique/acces'
import { formatJour } from '@/utils/fuseau'

export const dynamic = 'force-dynamic'

/** Une ligne rendue par Supabase. Le client ne connaît pas le schéma : on la lit
 *  par accesseurs étroits plutôt qu'en la déréférençant à l'aveugle. */
type Ligne = Record<string, unknown>
const txt = (x: unknown): string => (typeof x === 'string' ? x : '')
const oui = (x: unknown): boolean => x === true
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
/** Une jointure Supabase rend tantôt un objet, tantôt un tableau d'un élément. */
const jointure = (x: unknown, k: string): Ligne => {
  const v = lig(x)[k]
  return lig(Array.isArray(v) ? v[0] : v)
}


const TON: Record<string, string> = {
  a_concevoir: 'text-attention', concu: 'text-encre', assigne: 'text-ok', clos: 'text-muet',
}

export default async function Conception() {
  const { admin, actif } = await garderProf()
  const [{ data: instances }, { data: refs }] = await Promise.all([
    admin.from('exercices')
      .select('id, cran, genre, lieu, statut, bloque, id_import, classe_id, created_at,'
        + ' exercices_types(code, libelle), classes(nom)')
      .order('created_at', { ascending: false }).limit(50),
    // La file des références à valider — « une référence non validée n'entre
    // jamais en Phase 2 » (`02-` §6 A).
    admin.from('exercices_references')
      .select('id, localisation, validee_at, exercices_textes(id_import, auteur, titre)')
      .order('created_at', { ascending: false }).limit(50),
  ])

  const aValider = ((refs ?? []) as unknown as Ligne[]).filter((r) => !r.validee_at)

  return (
    <div className="space-y-6 pb-12">
      <header className="space-y-1">
        <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
          Pilotage · La fabrique
        </p>
        <h1 className="font-titre text-2xl text-encre">La conception</h1>
        <p className="font-ui text-sm text-encre-douce max-w-3xl">
          <strong>Aucun appel de modèle ici</strong>{' '}: ce qui s&apos;engendre — matériaux, appuis,
          références — s&apos;engendre au générateur, hors plateforme, et arrive par l&apos;import.
          {' '}Cet écran ne fait que <em>borner une saisie</em>.
        </p>
      </header>

      {!actif && (
        <p className="rounded-lg border border-attention bg-attention-teinte px-3 py-2 font-ui text-sm text-encre">
          <code>fabrique_actif</code>{' '}est à OFF.
        </p>
      )}

      <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
        <h2 className="font-titre text-lg text-encre">Les deux portes</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/prof/conception/nouvelle?porte=aletheia"
            className="rounded-lg border border-bordure-bouton bg-parchemin px-4 py-3 font-ui text-sm">
            <strong className="block text-encre">Aletheia</strong>
            <span className="text-encre-douce">restituer · expliquer · évaluer · interroger</span>
          </Link>
          <Link href="/prof/conception/nouvelle?porte=codex"
            className="rounded-lg border border-bordure-bouton bg-parchemin px-4 py-3 font-ui text-sm">
            <strong className="block text-encre">Codex</strong>
            <span className="text-encre-douce">composer</span>
          </Link>
        </div>
        <p className="font-ui text-xs text-muet">
          Les textes d&apos;auteur, les références décomposées et le corpus vivent au
          {' '}<Link href="/prof/corpus" className="underline">Scriptorium</Link> : le professeur y
          dépose, il ne conçoit pas là.
        </p>
      </section>

      {aValider.length > 0 && (
        <section className="rounded-xl border border-attention bg-surface p-4 space-y-2">
          <h2 className="font-titre text-lg text-encre">
            Les références à valider ({aValider.length})
          </h2>
          <p className="font-ui text-xs text-encre-douce">
            <strong>Une référence non validée n&apos;entre jamais en Phase 2</strong> : un texte
            déposé sans décomposition validée ne sert aucune instance qui le vise, en source comme
            en cible.
          </p>
          <ul className="divide-y divide-bordure font-ui text-sm">
            {aValider.map((r) => (
              <li key={txt(r.id)} className="flex items-center justify-between gap-3 py-2">
                <span className="text-encre">
                  {txt(jointure(r, 'exercices_textes').auteur) || '?'} — {txt(jointure(r, 'exercices_textes').titre) || '?'}
                  {' '}<span className="text-muet">· {txt(r.localisation)}</span>
                </span>
                <Link href={`/prof/conception/reference/${txt(r.id)}`}
                  className="rounded-md bg-bouton px-3 py-1 text-surface">lire et valider</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
        <h2 className="font-titre text-lg text-encre">Les instances</h2>
        {(instances ?? []).length === 0
          ? <p className="font-ui text-sm text-muet">Aucune instance.</p>
          : (
            <ul className="divide-y divide-bordure font-ui text-sm">
              {((instances ?? []) as unknown as Ligne[]).map((e) => (
                <li key={txt(e.id)} className="flex flex-wrap items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <Link href={`/prof/conception/${txt(e.id)}`} className="text-encre underline">
                      {txt(jointure(e, 'exercices_types').libelle) || txt(jointure(e, 'exercices_types').code)} · cran {txt(e.cran)}
                    </Link>
                    <span className="text-muet">
                      {' '}· {txt(e.lieu)}{e.genre ? ` · ${txt(e.genre)}` : ''}
                      {jointure(e, 'classes').nom ? ` · ${txt(jointure(e, 'classes').nom)}` : ''}
                      {e.id_import ? ` · ${txt(e.id_import)}` : ''}
                      {' '}· {formatJour(txt(e.created_at), { day: 'numeric', month: 'short' })}
                    </span>
                  </span>
                  <span className={TON[txt(e.statut)] ?? 'text-muet'}>
                    {txt(e.statut)}{oui(e.bloque) && <span className="text-attention"> · bloquée</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  )
}
