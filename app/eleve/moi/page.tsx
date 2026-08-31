import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { deconnexion } from '../actions'
import { contexteClasseEleve } from '../contexte-classe'
import { chargerLeProfilDeLEleve, type CompetenceDeLEleve } from '@/utils/eleve/profil-serveur'
import { chargerLesFichesDeCompetence, lireLeChoixDesLettres } from '@/utils/eleve/fiche-serveur'
import { listeDesForces, motDeLaProgression, motDuDecompte, phraseDuGeste } from '@/utils/eleve/profil'
import type { GesteConcret } from '@/utils/eleve/profil'
import { COMPETENCES, type Competence } from '@/utils/chaine/types'
import { NOM_COMPETENCE } from '@/utils/competences-classe'
import { FENETRE_EVIDENCE } from '@/utils/routeur/config'
import { Balise } from '@/components/deroule/TexteBalise'
import BasculeDesLettres from './BasculeDesLettres'

// ============================================================================
// Onglet « Moi » (barre tactile) — LE PROFIL DE COMPÉTENCES DE L'ÉLÈVE.
//
// ⭐⭐ C6-L2 — PAR ARBITRAGE ③ DE LOUIS (28/08) : « le PROFIL — trajectoire,
//    cible, "quoi travailler" — s'installe sous l'onglet "Moi", ET LA FICHE DE
//    COMPÉTENCE AVEC LUI. » ⛔ Aucun onglet neuf.
//
// ⭐ LA PREMIÈRE PHRASE DU LOT EST ICI, ET SES TROIS MOTS ONT TROIS SOURCES
//    DIFFÉRENTES : « travaillé quatre fois » (le décompte des mesures qui
//    comptent) · « en progrès » (deux fenêtres d'observables comparées à la
//    lecture) · « prochaine étape » (`exercices_retours.action_revision`, du
//    dernier retour PUBLIÉ).
//
// ⛔⛔ RR4 — CE QUE CET ÉCRAN NE MONTRE JAMAIS : le `code` d'un observable, son
//    `sens` (le seuil), son `taux`, son `tauxFenetre`, ses `reussies` /
//    `denominateur`, sa `serie`. La coupure est dans le TYPE que ce lot lit
//    (`utils/eleve/profil-serveur.ts`), pas dans le JSX.
//    ⭐ LE SEUL NOMBRE DE CET ÉCRAN EST `n`, ET IL SE REND EN JAUGE DE QUATRE
//       CRANS — un décompte réel sur `FENETRE_EVIDENCE`, jamais un pourcentage,
//       jamais une barre continue.
//
// ════════════════════════════════════════════════════════════════════════════
// ⭐⭐ RÉ-AGENCEMENT DU 30/08 (`design_handoff_moi_eleve`) — ET CE QUE LA MESURE
//    A CHANGÉ À LA MAQUETTE.
// ----------------------------------------------------------------------------
// Le problème résolu : les six compétences s'empilaient dans une colonne
// `max-w-lg`, de hauteur variable, et le seul geste actionnable arrivait après.
// Désormais : ordinateur = colonne des six à 200 px + la compétence choisie en
// deux colonnes ; téléphone = six tuiles 2 × 3 qui tiennent dans l'écran, puis
// la fiche. Le niveau se porte par `?c=<compétence>` — donc aucun état client,
// et un lien profond marche.
//
// ⛔⛔ TROIS ÉCARTS MESURÉS ENTRE LA MAQUETTE ET LA BASE, le 30/08 (production
//    `ucmngachkxvvlegntuwh`, 62 élèves, 372 cellules élève × compétence) :
//
//  ① LA TUILE. La maquette y écrit « 4 fois · en progrès » (19 car.) et
//    « 3 fois sur 4 » (12 car.). Ces mots N'EXISTENT PAS : `profil.ts` rend
//    `motDuDecompte` (16-17 car.) et, pour n = 1…3, `motDeLaProgression` =
//    « pas encore assez d'exercices pour le dire (N sur 4) » — 51 car., soit
//    **70 car. pour la paire**. Et c'est le cas le plus fréquent : n = 1 sur
//    156 des 372 cellules, n = 2 sur 14, n = 3 sur 1, **n = 4 sur AUCUNE**.
//    ⭐ Donc : la tuile et la carte latérale portent `motDuDecompte` SEUL tant
//       que la fenêtre n'est pas pleine — ce que la maquette fait déjà
//       elle-même dans sa colonne latérale (« travaillé 3 fois »). La phrase
//       entière est dite UNE FOIS, dans l'en-tête de la compétence ouverte.
//       Rien n'est reformulé : c'est le même mot, servi à un seul endroit.
//
//  ② « LES QUATRE EXERCICES COMPTÉS » NE SE REND PAS, et le handoff l'avait
//    prévu (« si l'obtenir demande d'élargir le chargeur au-delà d'un titre et
//    d'une date, ne pas la rendre »). Deux raisons mesurées, chacune suffisante :
//    · `exercices` N'A PAS DE COLONNE TITRE. Le « titre » est
//      `titreDeLaConsigne(consigne_instanciee)` — la première ligne de la
//      consigne : **médiane 103 car., max 186** (bac à sable, 6 exercices).
//      C'est exactement le défaut payé sur `design_handoff_ma_semaine_eleve`.
//    · IL N'Y EN A JAMAIS QUATRE : le maximum observé est 3, une seule fois.
//    La colonne du travail se limite donc aux forces, comme prévu au handoff.
//
//  ③ L'INTERRUPTEUR DES LETTRES EST GRISÉ, ET C'EST L'ÉTAT RÉEL DE LA RENTRÉE :
//    **0 lettre affichable sur 372 cellules** (171/171 `profil_provisoire` à
//    vrai, 62/62 `competences_lettres_affichees` à NULL). Le rendu charte
//    montre deux tuiles lettrées : cet état-là n'existe nulle part aujourd'hui.
//    ⛔ Et la note de la maquette « une lettre demande quatre exercices et un
//       profil posé » EST FAUSSE : `lettreVisible()` ne regarde pas `n`. Au bac
//       à sable, un élève porte la lettre D sur Synthèse avec n = 1. Elle est
//       remplacée par la phrase de `lettreVisible()`, qui, elle, dit vrai.
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ L'ORDRE DES SIX EST CELUI DU RÉFÉRENTIEL, PAS UN TRI PAR `n` — arbitrage
 *    demandé par le handoff. Les maquettes trient les mieux mesurées en tête
 *    « pour la démonstration » ; à l'écran, un ordre qui bouge à chaque mesure
 *    déplacerait la compétence sous le doigt de l'élève. `COMPETENCES` est
 *    stable, et c'est l'ordre des fiches et de la matrice du professeur.
 */
const ORDRE = COMPETENCES

export default async function MoiEleve(
  { searchParams }: { searchParams: Promise<{ c?: string | string[] }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
  // ⭐ LE SÉLECTEUR DE CLASSE EST SORTI DE LA PAGE : il vit dans la chrome
  //    (Barre 1 de `EnTeteSite` ≥ sm, bandeau mobile < sm). On ne lit plus le
  //    contexte que pour NOMMER la classe dans la bande de page.
  const { inscriptions, active, toutes } = await contexteClasseEleve(supabase, user.id)

  // ⛔ LE PROFIL EST UNIFIÉ PAR ÉLÈVE et n'a AUCUN `classe_id` (`07-` §1.3) : il
  //    se charge sans classe, contrairement à la liste d'exercices.
  const choixDesLettres = await lireLeChoixDesLettres(admin, user.id)
  const [profil, inventaire] = await Promise.all([
    chargerLeProfilDeLEleve(admin, user.id, choixDesLettres),
    // ⭐⭐ LA FICHE EST GÉNÉRIQUE, LE PROFIL EST PERSONNEL — et c'est la SOURCE
    //    qui les sépare, pas l'écran. On sert ici le `### 1.1` et les
    //    dimensions de la fiche À CÔTÉ du profil ; `/eleve/moi/competences`
    //    reste en place, et aucun `eleveId` n'entre dans ce chargeur-là.
    chargerLesFichesDeCompetence(admin),
  ])
  const fichePar = new Map(inventaire.fiches.map((f) => [f.competence, f]))

  // ⭐ La bascule S'OFFRE TOUJOURS ; ce booléen dit si elle peut LEVER quelque
  //    chose. À faux, elle est grisée et porte « Rien à afficher » (décision de
  //    Louis, 29/08) — au lieu d'être absente comme avant.
  const laBasculePeutLever = profil.lettres.visible || profil.lettres.raison === 'choix_de_l_eleve'
  // ⚠️ LES MOTIFS DISTINCTS de ce qui se tait — jamais un par ligne. La garde
  //    est posée PAR COMPÉTENCE, et cinq des six étaient provisoires : l'écran
  //    répétait cinq fois « ton profil se stabilise encore ». *Vu à l'écran au
  //    smoke du 28/08.* Mesuré le 30/08 : après dédoublonnage, **1 motif
  //    distinct par élève** en production comme au bac à sable.
  const motifsDuSilence = [...new Set(
    profil.competences.filter((c) => !c.lettre && c.motDeLaLettre)
      .map((c) => c.motDeLaLettre as string),
  )]

  const parCompetence = new Map(profil.competences.map((c) => [c.competence, c]))
  const six = ORDRE.map((c) => parCompetence.get(c)).filter(Boolean) as CompetenceDeLEleve[]

  // ⭐ LE NIVEAU SE PORTE PAR L'URL, PAS PAR UN ÉTAT CLIENT : la page reste un
  //    Server Component, et l'élève peut revenir sur sa compétence par un lien.
  const brut = (await searchParams).c
  const demande = Array.isArray(brut) ? brut[0] : brut
  const ouverte = (COMPETENCES as readonly string[]).includes(demande ?? '')
    ? (demande as Competence) : null
  // Sur ordinateur, une compétence est TOUJOURS ouverte : la première du
  // référentiel à défaut de choix.
  const affichee = six.find((c) => c.competence === (ouverte ?? ORDRE[0])) ?? six[0] ?? null

  const nomDeClasse = toutes ? 'toutes les classes' : active?.classe_nom ?? null

  return (
    // ⚠️ L'INTERLIGNE EST PLUS SERRÉ SUR TÉLÉPHONE, et c'est mesuré : à
    //    `space-y-5` partout, « Se déconnecter » finissait 32 px SOUS la barre
    //    tactile. Les six tuiles, elles, tenaient déjà.
    <div className="space-y-3 sm:space-y-5">
      <h2 className="sr-only sm:hidden">Moi</h2>

      {/* ── LA BANDE DE PAGE (la chrome porte déjà onglets, classe, déconnexion) ── */}
      <div className="hidden sm:flex items-baseline gap-3 flex-wrap">
        <h2 className="font-titre text-[29px] leading-none text-encre">Moi</h2>
        {(profile?.display_name || nomDeClasse) && (
          <p className="font-corps italic text-base text-muet">
            {[profile?.display_name, nomDeClasse].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* ⚠️ UNE LECTURE RATÉE SE DIT — jamais un profil vide affirmé. Le bandeau
          reste EN TÊTE DE PAGE, mot pour mot. */}
      {profil.incidents.length > 0 && (
        <p className="text-sm text-encre bg-attention-teinte border border-attention rounded-xl p-3">
          Une partie de ton profil n’a pas pu être lue. Ce que tu vois ici est peut-être
          incomplet.
        </p>
      )}

      {inscriptions.length === 0 ? (
        <p className="text-sm text-muet">Tu n&apos;es inscrit dans aucune classe pour l&apos;instant.</p>
      ) : (
        <>
          {/* ══════════ ORDINATEUR — la colonne des six + le détail ══════════ */}
          <div className="hidden lg:grid grid-cols-[200px_1fr] gap-6 items-start">
            <aside className="flex flex-col gap-2">
              <p className="font-ui text-[11px] tracking-[0.11em] text-muet uppercase ml-0.5 mb-0.5">
                Mes six compétences
              </p>
              {six.map((c) => (
                <CarteLaterale key={c.competence} c={c} ouverte={c.competence === affichee?.competence} />
              ))}
              <div className="border-t border-bordure mt-1.5 pt-2 flex flex-col gap-1.5">
                <BasculeDesLettres initial={profil.lettres.visible} active={laBasculePeutLever} />
                <NoteDeLaJauge />
                <MotifsDuSilence motifs={motifsDuSilence} />
              </div>
            </aside>

            {affichee && (
              <section className="bg-surface border border-bordure rounded-xl overflow-hidden">
                <EnTeteDeCompetence c={affichee} grand />
                <div className="grid grid-cols-2">
                  <div className="flex flex-col border-r border-bordure">
                    <div className="p-5 flex-1"><ColonneDuTravail c={affichee} /></div>
                    <ProchaineEtape geste={profil.geste} />
                  </div>
                  <div className="p-5 bg-parchemin">
                    <ColonneDuRegard c={affichee} fiche={fichePar.get(affichee.competence)} />
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ══════════ TÉLÉPHONE & TABLETTE — deux niveaux ══════════ */}
          <div className="lg:hidden">
            {ouverte && affichee
              ? <FicheDeCompetence c={affichee} fiche={fichePar.get(affichee.competence)} geste={profil.geste} />
              : (
                <div className="space-y-2.5">
                  <ProchaineEtape geste={profil.geste} compact />
                  {/* ⚠️ LA LIGNE FAIT 44 px ET LA ZONE TAPABLE COUVRE LA PASTILLE
                      *ET* SON LIBELLÉ — c'est le `<button>` entier de la bascule. */}
                  <div className="flex items-center gap-2.5 min-h-[44px]">
                    <p className="flex-1 font-ui text-[11px] tracking-[0.11em] text-muet uppercase">
                      Mes six compétences
                    </p>
                    <BasculeDesLettres initial={profil.lettres.visible} active={laBasculePeutLever} />
                  </div>
                  {/* ⭐ LES SIX TIENNENT DANS L'ÉCRAN — mesuré à 390 × 700 : la
                      grille va de 300 à 566 px, la barre tactile commence à 643. */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                    {six.map((c) => <Tuile key={c.competence} c={c} />)}
                  </div>
                  <NoteDeLaJauge />
                  <MotifsDuSilence motifs={motifsDuSilence} />
                </div>
              )}
          </div>
        </>
      )}

      {/* ⭐ « Se déconnecter » EN PIED D'ÉCRAN SUR TÉLÉPHONE seulement : la
          Barre 1 de la chrome la porte déjà dès `sm`. */}
      <form action={deconnexion} className="sm:hidden pt-1">
        <button type="submit"
          className="w-full font-ui text-sm text-encre-douce border border-bordure rounded-xl py-3
                     min-h-[44px] hover:bg-parchemin-fonce transition-colors">
          Se déconnecter
        </button>
      </form>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LA JAUGE — LE SEUL NOMBRE DE L'ÉCRAN
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⛔ QUATRE CRANS, ET C'EST `n` SUR `FENETRE_EVIDENCE` — un DÉCOMPTE, jamais un
 *    pourcentage, jamais une barre continue (`06-` §5 : « les seuls nombres
 *    autorisés : n, et le nombre d'exercices de la semaine »).
 * ⚠️ `n` peut dépasser la fenêtre (une compétence à 5 mesures qui comptent
 *    existe au bac à sable) : la jauge PLAFONNE, et le mot dit le vrai nombre.
 */
function Jauge({ n, grand = false }: { n: number; grand?: boolean }) {
  const pleins = Math.min(Math.max(n, 0), FENETRE_EVIDENCE)
  return (
    <span
      className={`flex gap-[3px] ${grand ? 'w-24' : ''}`}
      role="img"
      aria-label={`${pleins} exercice${pleins > 1 ? 's' : ''} compté${pleins > 1 ? 's' : ''} sur ${FENETRE_EVIDENCE}`}
    >
      {Array.from({ length: FENETRE_EVIDENCE }, (_, i) => (
        <i key={i} aria-hidden
          className={`${grand ? 'h-2' : 'h-[7px]'} flex-1 rounded-full
            ${i < pleins ? 'bg-ok' : 'bg-bordure'}`} />
      ))}
    </span>
  )
}

/**
 * ⚠️ VRAI, ET MESURÉ : `progressionALaLecture` refuse de trancher tant que
 *    `n < FENETRE_EVIDENCE` — « il faut un avant et un après ». La note dit donc
 *    la règle du moteur, pas une promesse.
 */
function NoteDeLaJauge() {
  return (
    <p className="font-corps italic text-sm text-muet leading-snug">
      Quatre exercices sur une compétence, et on peut dire où tu vas.
    </p>
  )
}

/**
 * ⛔ LE MOTIF SE DIT UNE FOIS, PAS UNE FOIS PAR LIGNE — et JAMAIS le nom d'un
 *    interrupteur (`07-` §5). La phrase vient de `lettreVisible()`.
 */
function MotifsDuSilence({ motifs }: { motifs: string[] }) {
  if (motifs.length === 0) return null
  return (
    <>
      {motifs.map((m) => (
        <p key={m} className="font-corps italic text-sm text-muet leading-snug">{m}</p>
      ))}
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LES MOTS — VERBATIM DE `profil.ts`, ET SERVIS AU BON ENDROIT
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐⭐ CE QUE LA TUILE PORTE — ET POURQUOI CE N'EST PAS TOUJOURS LA PAIRE.
 *
 * `motDeLaProgression` fait 51 caractères tant que la fenêtre n'est pas pleine
 * (« pas encore assez d'exercices pour le dire (1 sur 4) ») : dans une tuile de
 * ~170 px, c'est quatre lignes, et les six ne tiennent plus dans l'écran.
 * ⭐ Or la jauge DIT DÉJÀ « 1 sur 4 », et elle le dit en un coup d'œil. On sert
 *    donc le décompte seul ici, et la phrase entière une seule fois, dans
 *    l'en-tête de la compétence ouverte. **Aucun mot n'est réécrit** : c'est le
 *    même `motDuDecompte`, verbatim.
 * ⚠️ À zéro mesure, `motDuDecompte` dit déjà « jamais travaillé » : la paire
 *    « jamais travaillé · pas encore travaillé » se lisait comme un bégaiement
 *    (*vu à l'écran au smoke du 28/08*).
 */
const motCourt = (c: CompetenceDeLEleve): string =>
  c.progression.etat === 'pas_assez_de_mesures'
    ? motDuDecompte(c.n)
    : `${motDuDecompte(c.n)} · ${motDeLaProgression(c.progression)}`

/**
 * L'apparence d'une TUILE, tirée de l'ÉTAT — jamais d'un seuil rendu visible.
 * ⭐ Compétence jamais mesurée : bordure POINTILLÉE et encre estompée —
 *    « l'absence se voit sans se reprocher ».
 * ⚠️ Mesuré : `n = 0` est l'état de **201 des 372 cellules** de production. Ce
 *    n'est pas le cas rare, c'est le cas majoritaire à la rentrée.
 */
function apparence(c: CompetenceDeLEleve) {
  if (c.n === 0) {
    return { carte: 'bg-surface border-dashed border-bordure-bouton', nom: 'text-muet', mot: 'text-muet-clair' }
  }
  switch (c.progression.etat) {
    case 'progres':
      return { carte: 'bg-ok-teinte border-ok/30', nom: 'text-encre', mot: 'text-ok' }
    case 'stagnation':
      return { carte: 'bg-attention-teinte border-attention/40', nom: 'text-encre', mot: 'text-attention' }
    default:
      return { carte: 'bg-surface border-bordure', nom: 'text-encre', mot: 'text-encre-douce' }
  }
}

/**
 * ⚠️ LA COLONNE LATÉRALE NE PORTE PAS LES TEINTES D'ÉTAT, et c'est le rendu
 *    charte qui en décide : ses six cartes sont sur `surface`, seule l'ouverte
 *    passe à `parchemin-fonce` avec son liseré. Les teintes vert/ocre ne vivent
 *    que sur les TUILES du téléphone, où elles remplacent le survol.
 * ⛔ Et surtout : deux classes `bg-…` sur le même élément ne se départagent PAS
 *    par leur ordre dans l'attribut — c'est l'ordre de la feuille de style qui
 *    tranche. On n'en pose donc jamais deux.
 */
function apparenceLaterale(c: CompetenceDeLEleve, ouverte: boolean) {
  if (ouverte) return { carte: 'bg-parchemin-fonce border-bordure border-l-[3px] border-l-liseret', nom: 'text-encre font-bold', mot: 'text-encre-douce' }
  if (c.n === 0) return { carte: 'bg-surface border-dashed border-bordure-bouton hover:bg-parchemin-fonce', nom: 'text-muet font-medium', mot: 'text-muet-clair' }
  return { carte: 'bg-surface border-bordure hover:bg-parchemin-fonce', nom: 'text-encre font-semibold', mot: 'text-muet' }
}

/** ⛔ LA LETTRE N'APPARAÎT QUE SI LES TROIS CONDITIONS SONT RÉUNIES — la garde
 *     est dans `profil-serveur.ts`, jamais ici. Le cadre pointillé « lettre »
 *     des maquettes marque l'EMPLACEMENT ; il ne s'affiche pas. */
function Lettre({ c, grande = false }: { c: CompetenceDeLEleve; grande?: boolean }) {
  if (!c.lettre) return null
  return (
    <span className={`font-titre leading-none text-encre-douce ${grande ? 'text-3xl' : 'text-xl'}`}>
      {c.lettre}
    </span>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// NIVEAU 1 — LA CARTE LATÉRALE (ordinateur) ET LA TUILE (téléphone)
// ════════════════════════════════════════════════════════════════════════════

function CarteLaterale({ c, ouverte }: { c: CompetenceDeLEleve; ouverte: boolean }) {
  const a = apparenceLaterale(c, ouverte)
  return (
    <Link href={`/eleve/moi?c=${c.competence}`} scroll={false}
      aria-current={ouverte ? 'true' : undefined}
      className={`border rounded-xl px-3 py-2.5 flex flex-col gap-1.5 transition-colors ${a.carte}`}>
      <span className={`font-titre text-[19px] leading-tight ${a.nom}`}>{c.nom}</span>
      <Jauge n={c.n} />
      <span className={`font-corps italic text-sm ${a.mot}`}>{motCourt(c)}</span>
    </Link>
  )
}

/**
 * ⚠️ CIBLE TACTILE : la tuile entière est tapable, et `min-h-[84px]` la tient
 *    au-dessus des 44 px même pour le nom le plus court.
 * ⚠️ LA LETTRE VA SUR LA LIGNE DU NOM, pas sur celle de la jauge : en ligne avec
 *    la jauge elle ajoutait une quatrième rangée de 24 px par tuile — 72 px sur
 *    la grille, et les six ne tenaient plus dans les 700 px. *Mesuré à l'écran.*
 * ⛔ ET LA JAUGE RESTE UN BLOC PLEINE LARGEUR : ses quatre crans sont en
 *    `flex-1`, donc dans une rangée horizontale elle se réduisait à ZÉRO —
 *    invisible à l'écran, `tsc` et les tests muets. *Vu au premier rendu.*
 */
function Tuile({ c }: { c: CompetenceDeLEleve }) {
  const a = apparence(c)
  return (
    <Link href={`/eleve/moi?c=${c.competence}`}
      className={`border rounded-xl px-3 py-2 flex flex-col gap-1.5 min-h-[84px] ${a.carte}`}>
      <span className="flex items-baseline gap-2">
        <span className={`flex-1 font-titre font-semibold text-[19px] leading-tight ${a.nom}`}>{c.nom}</span>
        <Lettre c={c} />
      </span>
      <span className="mt-auto"><Jauge n={c.n} /></span>
      <span className={`font-corps italic text-[13.5px] leading-tight ${a.mot}`}>{motCourt(c)}</span>
    </Link>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// NIVEAU 2 — LA COMPÉTENCE OUVERTE
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ C'EST ICI, ET ICI SEULEMENT, QUE LA PHRASE DE PROGRESSION SE DIT EN ENTIER
 *    — les 70 caractères de « travaillé 3 fois · pas encore assez d'exercices
 *    pour le dire (3 sur 4) », le cas de 171 des 372 cellules de production.
 * ⚠️ D'OÙ DEUX RANGÉES, ET NON UNE SEULE COMME AU RENDU CHARTE : sur une seule,
 *    la phrase repoussait la LETTRE sur une quatrième ligne, seule et alignée à
 *    droite. *Vu à l'écran sur `?c=structure`, n = 3.*
 */
function EnTeteDeCompetence({ c, grand = false }: { c: CompetenceDeLEleve; grand?: boolean }) {
  return (
    <header className={`flex flex-col gap-1.5
      ${grand ? 'px-5 py-4 bg-parchemin-fonce border-b border-bordure' : ''}`}>
      <div className="flex items-baseline gap-3">
        <h3 className={`font-titre font-bold leading-none text-encre ${grand ? 'text-[28px]' : 'text-2xl'}`}>
          {c.nom}
        </h3>
        <span className="self-center"><Jauge n={c.n} grand /></span>
        <span className="ml-auto"><Lettre c={c} grande /></span>
      </div>
      <p className="font-corps text-base text-encre-douce">
        {c.n === 0
          ? motDuDecompte(c.n)
          : <>{motDuDecompte(c.n)} · <span className="font-semibold text-encre">{motDeLaProgression(c.progression)}</span></>}
      </p>
    </header>
  )
}

/**
 * ⭐ « SES FORCES » — des NOMS de dimensions, jamais un taux, et jamais le
 *    `code` d'un observable (RR4). La phrase se FABRIQUE dans `profil.ts` :
 *    l'intitulé finit par « sur : » pour que la puce reste un SUJET.
 * ⛔ « Les quatre exercices comptés » du rendu charte n'est PAS rendu — voir
 *    l'écart ② de l'en-tête de fichier.
 */
function ColonneDuTravail({ c }: { c: CompetenceDeLEleve }) {
  const f = listeDesForces(c.forces)
  return (
    <div className="space-y-3.5">
      <p className="font-ui text-[11px] tracking-[0.11em] text-muet uppercase">
        Ce que ton travail a montré
      </p>
      {f ? (
        <div>
          <span className="inline-block font-ui text-[11px] tracking-[0.05em] uppercase
                           bg-ok-teinte text-ok rounded-full px-2.5 py-0.5">
            {/* ⛔ L'intitulé finit par « sur : » — la puce doit rester un SUJET. */}
            {f.intitule}
          </span>
          <ul className="mt-2.5 space-y-1.5">
            {f.noms.map((d) => (
              <li key={d} className="font-corps text-[17px] leading-snug text-encre flex gap-2.5">
                <span className="text-muet-clair" aria-hidden>·</span>
                {/* ⛔ VERBATIM : les libellés portent leur propre ponctuation. */}
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="font-corps italic text-[15px] text-muet leading-snug">
          {c.n === 0
            ? 'Rien encore : cette compétence n’a pas été travaillée.'
            : 'Pas encore de marque sur cette compétence.'}
        </p>
      )}
    </div>
  )
}

/**
 * ⭐ « CE QU'ON REGARDE DANS TA COPIE » — LA FICHE GÉNÉRIQUE, DANS LA FICHE
 *    PERSONNELLE. La page des six fiches reste en place ; elle n'est simplement
 *    plus le seul endroit où l'élève apprend ce qu'on mesure.
 *
 * ⛔ LE TEXTE EST PRÊT À SERVIR : le `### 1.1` de `competences_fiches.contenu`.
 *    On ne le résume pas, on ne le reformule pas. Rendu en GRAS ET ITALIQUE
 *    seulement (`utils/deroule/balisage.ts`), comme l'a tranché C4-L3.
 *    ⚠️ Mesuré le 30/08 : **726 à 824 caractères**, un seul paragraphe, 131 à
 *       151 mots — cinq fois le pavé de la maquette. La colonne les porte.
 *
 * ⭐⭐ LE CROISEMENT SE FAIT À L'ÉCRAN, SANS NOUVEAU CHAMP : toutes les
 *    dimensions de la fiche, marquées « au point » quand elles sont dans
 *    `forces`. Éprouvé le 30/08 sur les deux bases — **0 force absente de la
 *    liste des dimensions, 0 doublon** sur 171 cellules en production.
 * ⛔ Une dimension SANS marque n'est PAS dite « non acquise » : « sans taux »
 *    n'est pas « non acquis » (`01-` §8.2). La légende le dit.
 */
function ColonneDuRegard(
  { c, fiche, titre = true }: {
    c: CompetenceDeLEleve
    fiche?: { texte: string; dimensions: string[] }
    /** ⚠️ Faux sous le dépliant du téléphone : le `<summary>` PORTE DÉJÀ ce titre,
     *     et il s'affichait deux fois de suite. *Vu à l'écran, dépliant ouvert.* */
    titre?: boolean
  },
) {
  if (!fiche) return null
  const acquises = new Set(c.forces)
  const resteSansMarque = fiche.dimensions.some((d) => !acquises.has(d))
  return (
    <div className="space-y-3.5">
      {titre && (
        <p className="font-ui text-[11px] tracking-[0.11em] text-muet uppercase">
          Ce qu’on regarde dans ta copie
        </p>
      )}
      {/* ⚠️ ENVELOPPÉ DANS UN <p> : `Balise` rend un <span>, donc un élément
          INLINE — sans enveloppe, il se colle au bloc suivant. */}
      <p><Balise source={fiche.texte} className="font-corps text-[17px] leading-relaxed text-encre-douce" /></p>
      {fiche.dimensions.length > 0 && (
        <>
          <div className="h-px bg-bordure" />
          <div>
            <p className="font-ui text-[11px] tracking-[0.11em] text-muet uppercase mb-2.5">
              Les points regardés · tes marques
            </p>
            <ul className="space-y-2">
              {fiche.dimensions.map((d) => (
                <li key={d} className="flex items-center gap-2.5 font-corps text-base leading-snug">
                  <span className={`flex-1 ${acquises.has(d) ? 'text-encre' : 'text-encre-douce'}`}>{d}</span>
                  {acquises.has(d) && (
                    <span className="font-ui text-[10px] tracking-[0.05em] uppercase whitespace-nowrap
                                     bg-ok-teinte text-ok rounded-full px-2.5 py-0.5">
                      au point
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {resteSansMarque && (
              <p className="font-corps italic text-sm text-muet leading-snug mt-2.5">
                Sans marque : pas encore assez d’exercices pour le dire.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * ⭐ LE TROISIÈME MOT — « PROCHAINE ÉTAPE », ET LE GESTE CONCRET.
 *
 * ⛔⛔ `published_at` EST LA PORTE : un retour non publié ne se montre JAMAIS.
 * ⛔ LE GESTE N'EST RATTACHÉ À AUCUNE COMPÉTENCE tant que `cible_retenue` /
 *    `cible_primaire` sont vides — c'est le cas partout aujourd'hui. Il se dit
 *    donc « le dernier conseil que Calame t'a donné », MÊME dessiné dans le
 *    cadre d'une compétence. C'est `phraseDuGeste()` qui choisit.
 *
 * ⚠️⚠️ `compact` (téléphone) PLIE LE TEXTE À DEUX LIGNES, et c'est une MESURE
 *    qui l'impose : en production, `action_revision.texte` fait **234 à 484
 *    caractères, médiane 366** — la maquette en dessinait 87. Servi en entier
 *    en tête d'un écran de 700 px, il prenait ~205 px et poussait les six
 *    tuiles hors de l'écran : exactement la contrainte que le handoff demande
 *    de tenir (« voir les six sans défiler »). *Mesuré : 871 px de document
 *    pour 700 px de fenêtre au premier rendu.*
 *    ⭐ Le texte complet reste à UN DOIGT — le bloc ENTIER est le lien vers le
 *       déroulé, et la fiche d'une compétence le sert sans pli sur ordinateur.
 *       ⚠️ C'est aussi ce qui tient la cible tactile : un bouton de 44 px en
 *          plus du texte coûtait 52 px que l'écran n'a pas.
 */
function ProchaineEtape(
  { geste, compact = false }: { geste: GesteConcret | null; compact?: boolean },
) {
  const corps = (
    <>
      <p className="font-ui text-[11px] tracking-[0.11em] text-attention uppercase">Ta prochaine étape</p>
      {/* ⛔ VERBATIM de `phraseDuGeste()` : c'est elle qui refuse de nommer une
          compétence tant qu'aucune cible n'est écrite. */}
      <p className={`font-corps italic text-muet ${compact ? 'text-[13.5px] leading-snug' : 'text-sm'}`}>
        {phraseDuGeste(geste)}
      </p>
      {geste && (
        <p className={`font-corps text-encre
          ${compact ? 'text-[15.5px] leading-snug line-clamp-2' : 'text-[17px] leading-normal'}`}>
          {geste.texte}
        </p>
      )}
    </>
  )
  const cadre = `bg-attention-teinte border-attention/50 flex flex-col ${
    compact ? 'gap-1 border rounded-xl px-3.5 py-2' : 'gap-1.5 border-t px-5 pt-3.5 pb-4'}`

  if (compact && geste) {
    return (
      <Link href={geste.href} className={`${cadre} min-h-[44px]`}>
        {corps}
        <span className="font-ui text-[13px] text-encre-douce">Revoir ce retour →</span>
      </Link>
    )
  }
  return (
    <div className={cadre}>
      {corps}
      {geste && (
        <Link href={geste.href}
          className="self-start mt-1 font-ui text-[13px] text-encre-douce bg-surface
                     border border-bordure-bouton rounded-lg px-3.5 min-h-[44px] inline-flex items-center
                     hover:bg-parchemin-fonce transition-colors">
          Revoir ce retour
        </Link>
      )}
    </div>
  )
}

/**
 * ⭐ TÉLÉPHONE, NIVEAU 2 — le progrès EN HAUT, puis « ce qu'on regarde dans ta
 *    copie » EN DÉPLIANT FERMÉ, puis la prochaine étape, puis les voisines.
 * ⚠️ `<details>` sans `open` : Chrome restaure l'état ouvert au RECHARGEMENT et
 *    React crie « hydration failed » — le discriminant est un onglet NEUF.
 */
function FicheDeCompetence(
  { c, fiche, geste }: {
    c: CompetenceDeLEleve
    fiche?: { texte: string; dimensions: string[] }
    geste: GesteConcret | null
  },
) {
  const i = ORDRE.indexOf(c.competence)
  const precedente = i > 0 ? ORDRE[i - 1] : null
  const suivante = i >= 0 && i < ORDRE.length - 1 ? ORDRE[i + 1] : null
  return (
    <div className="space-y-3">
      <Link href="/eleve/moi"
        className="inline-flex items-center gap-2 min-h-[44px] font-ui text-sm text-muet
                   hover:text-encre transition-colors">
        ← Mes six compétences
      </Link>

      <section className="bg-surface border border-bordure rounded-xl p-4 space-y-4">
        <EnTeteDeCompetence c={c} />
        <ColonneDuTravail c={c} />
        {fiche && (
          <details className="border-t border-bordure pt-3 group">
            <summary className="flex items-center gap-2 min-h-[44px] cursor-pointer list-none
                                font-ui text-[11px] tracking-[0.11em] text-muet uppercase">
              <span className="flex-1">Ce qu’on regarde dans ta copie</span>
              <span aria-hidden className="text-muet-clair transition-transform group-open:rotate-180">▾</span>
            </summary>
            <div className="pt-2"><ColonneDuRegard c={c} fiche={fiche} titre={false} /></div>
          </details>
        )}
      </section>

      <ProchaineEtape geste={geste} compact />

      <nav className="flex items-center justify-between gap-3 pt-1">
        {precedente
          ? <VoisineLien competence={precedente} sens="precedente" />
          : <span />}
        {suivante
          ? <VoisineLien competence={suivante} sens="suivante" />
          : <span />}
      </nav>
    </div>
  )
}

function VoisineLien({ competence, sens }: { competence: Competence; sens: 'precedente' | 'suivante' }) {
  return (
    <Link href={`/eleve/moi?c=${competence}`}
      className="inline-flex items-center gap-1.5 min-h-[44px] font-ui text-sm text-encre-douce
                 hover:text-encre transition-colors">
      {sens === 'precedente' && <span aria-hidden>←</span>}
      <span>{NOM_COMPETENCE[competence]}</span>
      {sens === 'suivante' && <span aria-hidden>→</span>}
    </Link>
  )
}
