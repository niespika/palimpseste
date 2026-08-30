// ============================================================================
// C4 · L6 — L'ONGLET EXERCICES DE L'ÉLÈVE : ce qui se fait À LA MAISON.
// (⭐ Handoff « Codex Exercices (élève) » §3 — la liste plate devient TROIS
//  GROUPES, l'échéance passe sur chaque ligne, et chaque ligne porte UNE action.)
// ----------------------------------------------------------------------------
// « Côté élève : EXERCICES, où il passe ce qui lui est donné, et Examens […].
//   Le partage de la face élève est celui du `06-Palimpseste.md` §1 — ce qui se
//   fait à la maison, et ce qui se rédige en classe. »        — `07-` §2, C4-L6
//
// ⭐ LA PORTE LA PLUS IMPORTANTE DU LOT EST ICI. `app/eleve/modules/codex/exercice/[depotId]`
//    — le déroulé à six temps de C4-L3 — n'était lié DEPUIS NULLE PART : aucun
//    `href` du dépôt ne le désignait, et l'écran ne s'atteignait qu'en tapant
//    l'identifiant d'un dépôt. *Un écran sans porte n'existe pas.*
//
// ⛔ CE N'EST PAS UN TABLEAU DE BORD, ET SURTOUT PAS « L'ÉCRAN DE LA SEMAINE ».
//    « Le tableau de bord est le point d'entrée du cycle » (`01-` §2) et l'écran
//    de la semaine — sa frise, sa barre de progrès — est **C6-L2**. Cet onglet
//    est UNE LISTE ET UNE PORTE, pas un second point d'entrée qui recomposerait
//    la semaine.
//
// ⛔⛔ AUCUNE LETTRE, AUCUNE NOTE, AUCUN POURCENTAGE DE COMPLÉTION (`06-` §5 ;
//    `01-` §9 ; handoff §3) : « un onglet qui range des exercices n'est pas un
//    endroit où l'on découvre son niveau », et les agrégats sont ceux du
//    professeur (C4-L2). Les nombres qu'on lit ici sont des CARDINAUX DE GROUPE
//    — « À faire · 2 » —, jamais un rapport à un total.
//
// ⚠️ TOUTE LA RÈGLE VIT DANS `utils/codex-onglets/accueil.ts`, module PUR et
//    éprouvé : cet écran ne groupe pas, ne trie pas, ne décide d'aucune action.
//    Il rend.
// ============================================================================

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { seuilModule } from '@/app/eleve/seuil-module'
import { lireLaPorte } from '@/utils/deroule/acces'
import { exercicesMaisonDeLEleve, type ExerciceMaison } from '@/utils/codex-onglets/liste'
import {
  grouperPourLAccueil, actionDeLaLigne, metaDeLaLigne, echeanceLisible, attenduDeLaLigne,
  type AccueilGroupe,
} from '@/utils/codex-onglets/accueil'
import { enrichirLAccueil, type MetaDAccueil } from '@/utils/codex-onglets/accueil-serveur'

export default async function CodexElevePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: module } = await supabase
    .from('modules')
    .select('id, actif')
    .eq('slug', 'codex')
    .single()

  // ⚠️ LES DEUX GARDES PRÉCÈDENT LE CONTENU DE L'ONGLET (`modules.actif`, puis
  //    le seuil : classe en contexte, et cette classe a-t-elle Codex ?). Elles
  //    sont les mêmes sous Examens — un onglet qu'on clique doit dire POURQUOI
  //    il refuse, jamais rendre une page vide.
  if (!module?.actif) {
    return (
      <div className="text-center py-16 text-muet text-sm">Ce module n&apos;est pas encore activé.</div>
    )
  }

  const seuil = await seuilModule(supabase, user.id, module.id, 'Codex')
  if (seuil.type === 'ecran') return seuil.noeud

  // ⚠️ LA CLASSE EN CONTEXTE BORNE LA LISTE : « dans les modules on reste par
  //    classe » (`01-` §2). Le seuil vient de la résoudre — on ne la relit pas.
  const admin = createAdminClient()
  const [porte, exercices] = await Promise.all([
    // `exercices_actif` — l'interrupteur du `07-` §5 qui répond à « les élèves
    // peuvent-ils faire des exercices ? ». Ce lot n'en allume aucun, n'en crée
    // aucun, et n'en détourne aucun autre : il le LIT, pour expliquer un vide.
    lireLaPorte(admin),
    exercicesMaisonDeLEleve(admin, user.id, seuil.inscription.classe_id),
  ])

  // La durée indicative et l'échéance de version finale — DEUX lectures en lot
  // pour toute la liste, jamais une par ligne.
  const { fuseau, metas } = await enrichirLAccueil(admin, exercices, porte.delaiVfJours)
  const maintenant = new Date().toISOString()
  const groupes = grouperPourLAccueil(exercices)

  return (
    <div>
      <Link href="/eleve" className="text-sm text-muet hover:text-encre-douce mb-6 inline-flex items-center gap-1">
        ← Retour
      </Link>

      {/* Identité du module portée par la Barre 2 ; on garde la consigne. */}
      <p className="text-sm text-muet mb-6 mt-2">
        Ce que tu écris <strong>à la maison</strong>, à l&apos;écran.
      </p>

      {exercices.length > 0 ? (
        <div className="flex flex-col gap-7">
          {groupes.map((g) => (
            <GroupeDeLAccueil
              key={g.cle} groupe={g} metas={metas} fuseau={fuseau} maintenant={maintenant}
            />
          ))}
        </div>
      ) : (
        // ⭐ UN VIDE EXPLIQUÉ, JAMAIS UN ONGLET QUI CLIGNOTE (piège 41). Les
        //    deux causes ne se disent pas de la même façon : la porte fermée
        //    n'est pas « rien à faire », et l'élève n'a pas à connaître le nom
        //    d'un interrupteur pour comprendre pourquoi son écran est vide.
        //    ⚠️ Les DEUX TEXTES sont ceux d'avant, mot pour mot (handoff §3).
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center">
          <p className="text-muet text-sm">
            {porte.exercicesActifs
              ? 'Aucun exercice pour le moment. Ceux que ton professeur te donne apparaîtront ici.'
              : 'Les exercices ne sont pas encore ouverts. Ton professeur t’indiquera quand ils commencent.'}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Un groupe ───────────────────────────────────────────────────────────────

/**
 * ⭐ « Terminés » EST REPLIÉ PAR DÉFAUT (handoff §3), et le repli se fait en
 *    `<details>` natif : pas d'état client, pas d'hydratation, et le contenu
 *    reste dans le document — donc trouvable au `Ctrl+F` du navigateur.
 */
function GroupeDeLAccueil({
  groupe, metas, fuseau, maintenant,
}: {
  groupe: AccueilGroupe
  metas: Map<string, MetaDAccueil>
  fuseau: string
  maintenant: string
}) {
  if (groupe.compte === 0) return null

  const lignes = (
    <div className={groupe.cle === 'termines'
      ? 'grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3'
      : 'flex flex-col gap-2.5'}>
      {groupe.lignes.map((l, i) => (
        <LigneDeLAccueil
          key={l.depotId} ligne={l} groupe={groupe.cle} premiere={i === 0}
          meta={metas.get(l.depotId) ?? null} fuseau={fuseau} maintenant={maintenant}
        />
      ))}
    </div>
  )

  if (groupe.cle === 'termines') {
    return (
      <details className="group">
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-3
                            rounded-xl border border-bordure bg-surface-retrait px-4 py-3">
          <span aria-hidden className="text-xs text-muet group-open:hidden">▸</span>
          <span aria-hidden className="hidden text-xs text-muet group-open:inline">▾</span>
          <span className="flex-1 font-titre text-xl font-semibold text-encre">
            {groupe.titre} · {groupe.compte}
          </span>
          {groupe.murmure && (
            <span className="hidden font-corps text-sm italic text-muet sm:inline">
              {groupe.murmure}
            </span>
          )}
        </summary>
        <div className="mt-2.5">{lignes}</div>
      </details>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="font-marque text-[11px] font-semibold uppercase tracking-[0.13em] text-muet">
          {groupe.titre} · {groupe.compte}
        </h2>
        {groupe.murmure && (
          <span className="font-corps text-sm italic text-muet">{groupe.murmure}</span>
        )}
      </div>
      {lignes}
    </section>
  )
}

// ── Une ligne ───────────────────────────────────────────────────────────────

function LigneDeLAccueil({
  ligne, groupe, premiere, meta, fuseau, maintenant,
}: {
  ligne: ExerciceMaison
  groupe: AccueilGroupe['cle']
  premiere: boolean
  meta: MetaDAccueil | null
  fuseau: string
  maintenant: string
}) {
  const action = actionDeLaLigne(ligne.etat.ton)
  const echeance = echeanceLisible(ligne.echeance, maintenant, fuseau)

  // ── Groupe 3 : une carte sobre, qui EST le lien. Pas de bouton : « tu peux
  //    les relire » n'appelle pas un geste, il en autorise un.
  if (groupe === 'termines') {
    return (
      <Link
        href={ligne.href}
        className="rounded-xl border border-bordure bg-surface px-4 py-3 opacity-[.72]
                   transition-opacity hover:opacity-100"
      >
        <span className="block font-corps text-[15px] text-encre-douce">{ligne.titre}</span>
        <span className="mt-0.5 block font-ui text-xs text-muet">{ligne.etat.libelle}</span>
      </Link>
    )
  }

  // ── Groupe 2 : deux états à NE PAS CONFONDRE (handoff §3). L'attente n'offre
  //    aucune action — et n'est donc pas un lien : cliquer mènerait à un écran
  //    qui n'a rien à dire. La reprise due, elle, ouvre.
  if (groupe === 'en_attente') {
    const attendu = attenduDeLaLigne(ligne, meta?.echeanceVf ?? null, fuseau)
    const aLire = ligne.etat.ton === 'a_lire'
    const corps = (
      <>
        <span aria-hidden className="hidden size-[30px] shrink-0 rounded-full border border-bordure
                                     bg-pigment-teinte opacity-75 sm:block" />
        <span className="min-w-0 flex-1">
          <span className={`block font-corps text-[17px] ${aLire ? 'text-encre' : 'text-encre-douce'}`}>
            {ligne.titre}
          </span>
          <span className="mt-0.5 block font-ui text-xs text-muet">{attendu}</span>
        </span>
        {aLire
          ? <Pastille ton="attention">à reprendre</Pastille>
          : <Pastille ton="info">retour en préparation</Pastille>}
        {action && <Bouton action={action} />}
      </>
    )
    const classe = 'flex flex-col gap-3 rounded-xl border border-bordure bg-surface-retrait '
      + 'px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4'
    return aLire
      ? <Link href={ligne.href} className={`${classe} transition-colors hover:border-pigment`}>{corps}</Link>
      : <div className={classe}>{corps}</div>
  }

  // ── Groupe 1 : la ligne qui appelle un geste. La PREMIÈRE porte le filet de
  //    pigment — « le plus proche en premier », et l'œil y va sans compter.
  return (
    <Link
      href={ligne.href}
      className={`flex flex-col gap-3 rounded-xl border border-bordure bg-surface px-4 py-4
                  transition-colors hover:border-pigment sm:flex-row sm:items-center sm:gap-4
                  ${premiere ? 'border-l-[3px] border-l-pigment' : ''}`}
    >
      <span aria-hidden className="hidden size-10 shrink-0 rounded-full border border-bordure
                                   bg-pigment-teinte sm:block" />
      <span className="min-w-0 flex-1">
        <span className="block font-corps text-[19px] font-semibold text-encre">{ligne.titre}</span>
        <span className="mt-0.5 block font-ui text-[13px] text-muet">
          {metaDeLaLigne({
            competences: ligne.competences,
            estUnePaire: ligne.estUnePaire,
            dureeMin: meta?.dureeMin ?? null,
          })}
        </span>
      </span>
      {echeance && (
        <Pastille ton={echeance.proche ? 'attention' : 'neutre'}>{echeance.texte}</Pastille>
      )}
      {action && <Bouton action={action} />}
    </Link>
  )
}

// ── Les deux pièces communes ────────────────────────────────────────────────

function Pastille(
  { ton, children }: { ton: 'attention' | 'info' | 'neutre'; children: React.ReactNode },
) {
  const cls = ton === 'attention'
    ? 'bg-attention-teinte text-attention border-attention/30 font-semibold'
    : ton === 'info'
      ? 'bg-info-teinte text-info border-info/25'
      : 'bg-surface text-muet border-bordure'
  return (
    <span className={`shrink-0 self-start whitespace-nowrap rounded-full border px-3 py-1.5
                      font-ui text-xs sm:self-auto ${cls}`}>
      {children}
    </span>
  )
}

/**
 * ⚠️ CE N'EST PAS UN `<button>` : la ligne entière est déjà un lien, et un
 *    bouton imbriqué dans une ancre est du HTML invalide — le navigateur le
 *    déplace hors du lien, et la cible tactile se déchire en deux. On rend donc
 *    l'AFFORDANCE, et c'est le lien parent qui porte le geste.
 * ⚠️ 48 px sur téléphone, 44 px au-delà (handoff §3 et §7) : « l'écran est
 *    souvent un téléphone » (`07-` §3) — ici la cible est la ligne entière, qui
 *    est plus haute encore, et l'affordance prend toute la largeur au pouce.
 */
function Bouton({ action }: { action: { libelle: string; plein: boolean } }) {
  return (
    <span
      aria-hidden
      className={`inline-flex min-h-[48px] w-full shrink-0 items-center justify-center
                  whitespace-nowrap rounded-[10px] px-5 font-ui text-sm font-semibold
                  sm:min-h-[44px] sm:w-auto ${action.plein
        ? 'bg-bouton text-bouton-texte'
        : 'border border-bordure-bouton bg-surface text-encre-douce'}`}
    >
      {action.libelle}
    </span>
  )
}
