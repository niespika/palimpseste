// ============================================================================
// C4 · L8 — LE PIPELINE DE CONCEPTION, dans l'ordre des sources.
// ----------------------------------------------------------------------------
// « Deux portes de conception, un import » (`02-` §6 B ; piège 26) :
//   · ALETHEIA — les modes réceptifs, sur un texte d'auteur déjà déposé ET DÉJÀ
//     POURVU DE SA RÉFÉRENCE VALIDÉE (B.1) ;
//   · CODEX — `composer`, sur un matériau `genere` ou un `sujet` (B.2).
//     ⚠️ « `texte_auteur` n'est PAS ouvert dans Codex » (piège 28).
//
// Cette page ne fait que CHARGER : la doctrine dérivée, les banques déposées, et
// les classes. Le pipeline lui-même est un composant client, borné par ce que la
// doctrine déclare — il n'invente rien et n'appelle aucun modèle.
// ============================================================================

import Link from 'next/link'
import { garderProf } from '@/utils/fabrique/acces'
import { chargerDoctrineDepuisBase } from '@/utils/fabrique/doctrine'
import { borneDeConception, phraseDeLaBorne } from '@/utils/fabrique/non-spoiler-conception'
import Pipeline, { type CarteDoctrine } from './Pipeline'

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


export default async function NouvelleInstance({
  searchParams,
}: { searchParams: Promise<{ porte?: string }> }) {
  const { porte: brut } = await searchParams
  const porte: 'aletheia' | 'codex' = brut === 'codex' ? 'codex' : 'aletheia'
  const { admin } = await garderProf()
  const d = await chargerDoctrineDepuisBase(admin as never)

  const [{ data: textes }, { data: sujets }, { data: materiaux }] = await Promise.all([
    // ⚠️ « Une référence NON VALIDÉE n'entre jamais en Phase 2 » : seuls les
    // textes dont la décomposition est validée entrent au pipeline (piège 25).
    admin.from('exercices_textes')
      .select('id, id_import, auteur, titre, reference, cours_etat, plan_livre_id,'
        + ' plan_livre_declare, plan_semaine,'
        + ' exercices_references!inner(validee_at), scriptorium_contenus(texte_extrait)')
      .eq('statut', 'valide').not('exercices_references.validee_at', 'is', null),
    admin.from('exercices_sujets').select('id, id_import, enonce, forme, cours_etat')
      .eq('statut', 'valide'),
    admin.from('exercices_materiaux')
      .select('id, id_import, objet_code, mode, support, contenu, defaut, famille,'
        + ' observable_code, observable_competence')
      .eq('statut', 'valide'),
  ])

  // La CARTE : ce que la doctrine borne, réduit à ce que l'écran doit connaître.
  // Aucune valeur n'y est écrite à la main — tout vient des tables dérivées.
  const carte: CarteDoctrine = {
    objets: Object.fromEntries(Object.values(d.objets).map((o) => [o.code, {
      code: o.code, libelle: o.libelle, grain: o.grain, nature: o.nature,
      supportSource: o.supportSource, genres: o.genres, competences: o.competences,
      modes: o.modes, crans: [...o.crans].sort((a, b) => a - b),
      sourceParMode: o.sourceParMode,
    }])),
    crans: Object.fromEntries(Object.values(d.crans).map((c) => [c.n, {
      n: c.n, code: c.code, geste: c.geste, appui: c.appui, fait: c.fait,
      palierVise: c.palierVise, materiauCible: c.materiauCible,
      defaut: c.defaut, distracteurs: c.distracteurs, reponseAttendue: c.reponseAttendue,
      guide: c.guide, jugement: c.jugement, couverture: c.couverture,
      regimeV1vf: c.regimeV1vf,
    }])),
    modesAdmis: d.modesAdmis,
    durees: Object.fromEntries(Object.entries(d.durees).map(([k, v]) => [k, v.valeur])),
    // La banque de consignes, réduite au couple demandé à l'affichage.
    routes: Object.fromEntries(Object.entries(d.routes).map(([cle, rs]) => [cle,
      rs.map((r) => ({
        competence: r.competence, code: r.code, nom: r.nom,
        section: r.section, fichier: r.fichier, crans: r.crans,
        consignes: Object.fromEntries(Object.entries(
          d.consignesIsolees[`${r.competence}|${r.section}`] ?? {})),
        defautInjecte: d.observables[`${r.competence}|${r.section}`]?.defautInjecte ?? '',
      }))])),
    consignesProduction: d.consignesProduction,
    guidesProduction: d.guidesProduction,
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="space-y-1">
        <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
          Pilotage · La fabrique · <Link href="/prof/conception" className="underline">Conception</Link>
        </p>
        <h1 className="font-titre text-2xl text-encre">
          Concevoir une instance — {porte === 'codex' ? 'Codex' : 'Aletheia'}
        </h1>
        <p className="font-ui text-sm text-encre-douce max-w-3xl">
          {porte === 'aletheia'
            ? <>Les modes réceptifs, sur un texte d&apos;auteur <strong>déjà déposé et déjà pourvu
              de sa référence validée</strong>. L&apos;atelier est un attribut visuel, jamais un
              interlocuteur différent.</>
            : <><code>composer</code>, sur un matériau fabriqué ou un sujet.
              {' '}<strong><code>texte_auteur</code> n&apos;est pas ouvert ici</strong> : un exercice
              bâti sur un texte d&apos;auteur se conçoit dans Aletheia.</>}
        </p>
      </header>

      <nav className="inline-flex rounded-lg border border-bordure bg-surface p-0.5 font-ui text-sm">
        {(['aletheia', 'codex'] as const).map((p) => (
          <Link
            key={p} href={`/prof/conception/nouvelle?porte=${p}`}
            aria-current={porte === p ? 'true' : undefined}
            className={`rounded-md px-3.5 py-1.5 transition-colors ${
              porte === p ? 'bg-bouton text-surface' : 'text-encre-douce hover:bg-parchemin-fonce'}`}
          >
            {p === 'aletheia' ? 'Aletheia — restituer · expliquer · évaluer · interroger' : 'Codex — composer'}
          </Link>
        ))}
      </nav>

      <Pipeline
        porte={porte}
        carte={carte}
        textes={((textes ?? []) as unknown as Ligne[]).map((t) => ({
          id: txt(t.id), libelle: `${txt(t.auteur)} — ${txt(t.titre)} (${txt(t.reference)})`,
          contenu: txt(jointure(t, 'scriptorium_contenus').texte_extrait),
          // ⚠️ « NON-SPOILER : SEUL L'AMONT EXPOSÉ EST SERVI » (`07-` §2, C5-L1).
          //    La règle est celle du routeur et elle est PER-ÉLÈVE ; cet écran
          //    n'en connaît aucun. On DIT donc quelle borne l'instance portera —
          //    le couple { livre, séance } que le texte déclare — sans jamais
          //    fabriquer une « position de la classe », qui serait une seconde
          //    échelle prise à une source hors manifeste.
          borne: phraseDeLaBorne(
            borneDeConception({
              id: txt(t.id),
              planLivreReferenceId: t.plan_livre_id === null ? null : txt(t.plan_livre_id),
              planSeance: typeof t.plan_semaine === 'number' ? t.plan_semaine : null,
            }),
            t.plan_livre_declare === null ? null : txt(t.plan_livre_declare)),
        }))}
        sujets={((sujets ?? []) as unknown as Ligne[]).map((s) => ({
          id: txt(s.id), libelle: `${txt(s.enonce)} · ${txt(s.forme)}`,
        }))}
        materiaux={((materiaux ?? []) as unknown as Ligne[]).map((m) => ({
          id: txt(m.id), objet: txt(m.objet_code), mode: txt(m.mode), support: txt(m.support),
          famille: m.famille === null ? null : txt(m.famille),
          defaut: txt(m.defaut), contenu: txt(m.contenu),
          observableCode: txt(m.observable_code), observableCompetence: txt(m.observable_competence),
        }))}
      />
    </div>
  )
}
