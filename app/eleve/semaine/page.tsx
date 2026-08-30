import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { contexteClasseEleve } from '../contexte-classe'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { jourDansFuseau, formatJour } from '@/utils/fuseau'
import { lundiOnOrBefore, addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import { chargerLaSemaineDeLEleve } from '@/utils/eleve/semaine-serveur'
import {
  competencesDeLaSemaine, offreDEnFairePlus,
  type Bilan, type BlocRecapitulatif, type ExerciceDeLaSemaine, type Frise,
} from '@/utils/eleve/semaine'
import { listeDesForces } from '@/utils/eleve/profil'
import { lireLeQuotaDuCycle } from '@/utils/moteur/bonus-serveur'
import { actionDeLaLigne, echeanceLisible } from '@/utils/codex-onglets/accueil'
import { COMPETENCES, type Competence } from '@/utils/chaine/types'
import { NOM_COMPETENCE } from '@/utils/competences-classe'
import OffreDEnFairePlus from './OffreDEnFairePlus'
import Pastille from '@/components/Pastille'

// ============================================================================
// C6 · L2 — L'ÉCRAN DE LA SEMAINE. Un écran, DEUX TEMPS, jamais les deux.
// ----------------------------------------------------------------------------
// `02-exercices.md` §6.C : « AVANT DE COMMENCER, l'élève reçoit le récapitulatif
// de sa semaine […] IL PASSE ENSUITE SES EXERCICES […] À LA FIN, un bilan court. »
//
// ⭐ « C'est le SEUL endroit où le volume de la semaine se voit d'un coup d'œil ;
//    sans lui, l'élève découvre son travail exercice par exercice. » (`07-` §2)
//
// ⭐⭐ C6 · L3 — LE TROISIÈME TEMPS EST ARRIVÉ. Le §6.C décrit UNE séquence, et
//    elle se termine sur « PUIS ON LUI OFFRE D'EN FAIRE PLUS S'IL LE VEUT ».
//    `C6-L2` s'est arrêté juste avant, volontairement ; l'offre est ici, et
//    elle n'est pas une page de plus : c'est le troisième temps du même écran.
//
// ⛔ CE N'EST PAS UNE « PAGE UNIQUE DU CYCLE ». Le déroulé à six temps de C4-L3
//    existe, par dépôt, sous deux routes — cet écran est une VUE D'ENSEMBLE QUI
//    MÈNE À ELLES, jamais un remplaçant (`01-` §2).
//
// ⛔ ET IL PARLE DE LA SEMAINE, JAMAIS D'UN EXERCICE EN PARTICULIER — la
//    réciproque de ce que `utils/deroule/rappel.ts` s'interdit : « le temps 1
//    parle de CET EXERCICE, jamais de LA SEMAINE ».
//
// ⚠️ AUCUN INTERRUPTEUR NEUF (`07-` §5). La porte est `exercices_actif`, lue
//    dans le module partagé — et l'écran DIT pourquoi il est vide sans jamais
//    nommer un interrupteur.
//
// ════════════════════════════════════════════════════════════════════════════
// « MA SEMAINE », ORGANISATION `C` — L'INDEX REPLIÉ. CE FICHIER SEUL A CHANGÉ.
// ----------------------------------------------------------------------------
// Le contenu était bon, L'EMPILEMENT NE L'ÉTAIT PAS. La première mise en œuvre
// suivait l'option `3a` du handoff ; elle ne tenait pas, et LA DONNÉE DIT
// POURQUOI — c'est le fait à retenir avant de toucher à cet écran :
//
//   ⭐⭐ LE « TITRE » D'UN EXERCICE EST LA PREMIÈRE LIGNE DE SA CONSIGNE
//      (`titreDeLaConsigne`), donc UN PARAGRAPHE : **médiane 129 caractères,
//      p90 179, max 298 — 41 titres sur 452 tiennent en 60.** La maquette avait
//      été dessinée sur « Commentaire — Rousseau, Émile » (31 caractères) : une
//      ligne haute pastille + titre + échéance + bouton ne peut pas exister.
//   ⭐ ET LE RÉCAPITULATIF EST LE PLUS GROS OBJET DE L'ÉCRAN : cinq compétences,
//      chacune avec ses forces ET ses dimensions (51 au total, jamais tronquées).
//      Dans un rail de 276 px, il devenait un mur plus haut que le travail.
//
// ⭐⭐ D'OÙ `C` : L'OSSATURE DE `3a` EST TENUE, MAIS TOUT EST REPLIÉ. Une ligne
//    par exercice, une ligne par compétence — la semaine entière tient dans un
//    écran, et rien ne se lit avant d'être ouvert.
//
// ⚠️⚠️ LA LIGNE FERMÉE GARDE SON AMORCE, ET CE N'EST PAS UN ORNEMENT : trois
//    lignes disant « commencé · à rendre dim. 30 » sont INDISCERNABLES, et
//    l'élève ne saurait pas laquelle ouvrir. L'amorce est la consigne écrêtée à
//    UNE ligne — exactement ce que l'écran d'avant montrait (`truncate`), donc
//    on n'a rien retiré. ⛔ Et écrêter à l'affichage n'est pas tronquer la
//    donnée : la consigne entière est dans le panneau, deux lignes plus bas.
//
// ⭐ SUR TÉLÉPHONE, LE BOUTON DESCEND DANS LE PANNEAU OUVERT. À 390 px, amorce +
//    état + échéance + bouton sur un rang ne tient pas — et qui n'a pas lu la
//    consigne n'a rien à reprendre. Au-delà de 640 px il reste sur la ligne
//    fermée, pour reprendre sans ouvrir.
//
// ⭐ DEUX VUES, JAMAIS EMPILÉES — `Travail` et `Bilan`, commutées par le segment
//    en tête du rail.
//
// ⛔⛔ LE SEGMENT N'EST PAS UNE NAVIGATION LIBRE, ET CELA NE SE NÉGOCIE PAS.
//    `momentDeLaSemaine()` commande toujours : hors du moment `bilan`, l'onglet
//    Bilan est INERTE — l'ouvrir pendant la semaine DONNERAIT À L'ÉLÈVE LA
//    RÉPONSE À LA PHASE « SE JUGER » (`02-` §6.C), c'est-à-dire falsifierait la
//    mesure en silence. Symétriquement, au moment `bilan` la vue par défaut est
//    Bilan, et Travail reste consultable (les exercices faits).
//    ⚠️ La commutation passe par `?vue=`, donc par le SERVEUR : la garde n'est
//       pas un état de client qu'un rechargement pourrait contourner.
//
// ⛔ AUCUNE DURÉE PAR EXERCICE (`semaine.ts` l'exclut nommément de cet écran :
//    la durée vit au temps 2 du déroulé), AUCUNE MINUTE DE QUOTA, AUCUN
//    POURCENTAGE, AUCUNE BANDE DE COULEUR SUR LA FRISE.
//
// ⛔ LES DIMENSIONS REGARDÉES NE SE TRONQUENT PAS : « N points » est une ENTRÉE,
//    pas un remplacement — la compétence dépliée les liste TOUTES (une en porte
//    jusqu'à onze), et ses forces avec.
//
// ⛔ LES TROIS VIDES RESTENT DISTINCTS, et le bandeau d'incidents avec eux :
//    porte fermée ≠ aucun exercice ≠ semaine passée sans exercice.
//
// ⚠️ `OffreDEnFairePlus.tsx` N'EST PAS TOUCHÉ (consigne du handoff, deux fois
//    écrite) : sa carte n'a donc ni le filet ocre ni le bouton `bouton-plan` que
//    la maquette lui donne, à la différence de la carte de REFUS rendue ici.
// ============================================================================

type Vue = 'travail' | 'bilan'

const fmtJour = (d: string) => formatJour(d, { day: 'numeric', month: 'long' })

/** « 8 → 14 septembre » — le mois ne se répète pas quand la semaine ne le franchit pas. */
function bornesDuCycle(lundi: string, dimanche: string): string {
  const debut = lundi.slice(0, 7) === dimanche.slice(0, 7)
    ? formatJour(lundi, { day: 'numeric' })
    : fmtJour(lundi)
  return `${debut} → ${fmtJour(dimanche)}`
}

export default async function SemaineDeLEleve({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string; vue?: string }>
}) {
  const sp = await searchParams
  const fuseau = await lireFuseau()
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  // ⚠️ LA GARDE EXPLICITE, ET PAS UN `user!.id`. Le layout redirige déjà, mais
  //    l'assertion non nulle JETTE avant lui sur une requête anonyme : `/eleve`
  //    et `/eleve/calendrier` logguent ainsi un `TypeError` à chaque passage de
  //    robot — la redirection part quand même (307), c'est du bruit, pas une
  //    panne. `app/eleve/moi/page.tsx` porte le bon patron ; on le reprend.
  if (!user) redirect('/login')
  const { inscriptions, active, toutes } = await contexteClasseEleve(supabase, user.id)

  // ⚠️ UN CYCLE EST UNE SEMAINE DE LUNDI À DIMANCHE DANS LE FUSEAU DE L'ÉCOLE.
  //    On ne recalcule pas un lundi à la main.
  const aujourdhui = jourDansFuseau(new Date(), fuseau)
  const maintenant = new Date().toISOString()
  const demande = sp.cycle && /^\d{4}-\d{2}-\d{2}$/.test(sp.cycle) ? sp.cycle : aujourdhui
  const cycleLundi = toISODate(lundiOnOrBefore(demande))
  const cycleDimanche = toISODate(addDaysUTC(lundiOnOrBefore(demande), 6))
  const semainePrecedente = toISODate(addDaysUTC(lundiOnOrBefore(demande), -7))
  const semaineSuivante = toISODate(addDaysUTC(lundiOnOrBefore(demande), 7))
  const estLaSemaineEnCours = cycleLundi === toISODate(lundiOnOrBefore(aujourdhui))

  // ⚠️ LA CLASSE BORNE LA LISTE (`01-` §2, « dans les modules on reste par
  //    classe »). En état « Toutes », `active` est null SANS que l'élève soit
  //    sans classe : on parcourt alors toutes ses inscriptions.
  const enContexte = toutes ? inscriptions : active ? [active] : []

  // ⭐⭐ UN SEUL APPEL, POUR TOUTES SES CLASSES — `C6L2-31`, 29/08. L'écran
  //    appelait le chargeur UNE FOIS PAR INSCRIPTION et sommait : une instance
  //    sans classe passant le filtre de CHACUNE, un bi-classe lisait sa semaine
  //    EN DOUBLE — « 0 sur 8 » pour quatre exercices, et le bloc des compétences
  //    rendu deux fois. Le dédoublonnage se fait par `depotId`, dans le
  //    chargeur, AVANT que la frise, le récapitulatif et le bilan soient comptés.
  const semaine = await chargerLaSemaineDeLEleve(
    admin, user.id, enContexte.map((i) => i.classe_id), cycleLundi, fuseau)

  // ⛔⛔ LE QUOTA EST UNIFIÉ PAR ÉLÈVE, ET IL SE LIT **UNE SEULE FOIS**. « Un
  //    élève inscrit dans DEUX CLASSES a UN SEUL budget » (`01-` §4) — c'est une
  //    asymétrie réelle avec la liste au-dessus, qui, elle, agrège PAR
  //    INSCRIPTION. Le lire dans `chargerLaSemaineDeLEleve` l'aurait compté deux
  //    fois pour un bi-classe, et lui aurait offert deux quotas.
  // ⚠️ Et il ne se lit QUE sur la semaine EN COURS : « les minutes non utilisées
  //    sont perdues, sans report » — une semaine passée n'a plus de quota à
  //    offrir, et le pull, lui, écrit toujours sur le cycle courant.
  const incidentsDuQuota: string[] = []
  const quota = enContexte.length > 0 && estLaSemaineEnCours
    ? await lireLeQuotaDuCycle(admin, user.id, cycleLundi, incidentsDuQuota)
    : null

  // ⛔ DEUX VIDES À DISTINGUER, PAS UN (`07-` §5). La porte fermée n'est pas
  //    « tu n'as rien à faire », et l'élève n'a JAMAIS à connaître le nom d'un
  //    interrupteur pour comprendre son écran.
  const { porteOuverte, moment, exercices, frise, recapitulatif, bilan, manque } = semaine
  const incidents = [...semaine.incidents, ...incidentsDuQuota]

  // ⭐⭐ LE MOMENT COMMANDE LA VUE, ET LE PARAMÈTRE NE FAIT QUE CHOISIR DANS CE
  //    QU'IL AUTORISE. Hors du moment `bilan`, `?vue=bilan` ne donne rien :
  //    l'onglet est inerte à l'écran ET l'URL est sans effet — sinon la garde du
  //    §6.C ne tiendrait qu'à un lien qu'on ne clique pas.
  // ⚠️ C'est aussi ce qui remplace l'ancien `auBilan`, qui, au moment `vide`,
  //    ouvrait le bilan d'un élève n'ayant qu'un exercice DEMANDÉ EN PLUS.
  const vue: Vue = moment === 'bilan' && sp.vue !== 'travail' ? 'bilan' : 'travail'

  // ⭐ L'OFFRE SE LIT SUR LA LISTE FUSIONNÉE, pas par inscription : le moment de
  //   l'élève est celui de TOUT son travail, et son quota est unique.
  // ⚠️ `estLaSemaineEnCours` est une condition de plus, et elle est à l'écran :
  //   on ne propose pas d'en faire plus sur une semaine passée, dont le quota est
  //   perdu (`01-` §5) — l'action, elle, refuserait de toute façon.
  const offre = estLaSemaineEnCours
    ? offreDEnFairePlus(porteOuverte, moment, exercices, quota)
    : { offerte: false, motif: null, phrase: '' }

  // ⭐ LE PARTAGE SE DÉDUIT DU `ton`, ET IL NE S'AJOUTE AUCUN CHAMP. `a_lire`,
  //   `a_faire` et `en_cours` appellent un geste — c'est exactement ce que dit
  //   `actionDeLaLigne` en rendant une action ; `attente` et `clos` n'en
  //   appellent aucun et n'en reçoivent aucune. **Même prédicat que la frise**,
  //   et une seule fonction pour les deux, plutôt qu'une copie qui dériverait.
  const aFaire = exercices.filter((e) => actionDeLaLigne(e.ton) !== null)
  const dejaFait = exercices.filter((e) => actionDeLaLigne(e.ton) === null)

  const lienDeVue = (v: Vue) => {
    const p = new URLSearchParams()
    if (!estLaSemaineEnCours) p.set('cycle', cycleLundi)
    p.set('vue', v)
    return `/eleve/semaine?${p.toString()}`
  }

  return (
    <div>
      {/* ── LA BANDE DE PAGE ──────────────────────────────────────────────
          ⛔ L'EN-TÊTE BURELLE N'A RIEN REÇU : ni le titre, ni la navigation de
             semaine. Elle porte la marque et la devise, et rien d'autre. */}
      <div className="-mt-8 mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4
                      border-b border-bordure pb-4 pt-8">
        <div className="min-w-0">
          <Link href="/eleve"
            className="font-ui text-xs text-muet transition-colors hover:text-encre-douce">
            ‹ Tableau de bord
          </Link>
          <h2 className="font-titre text-2xl text-encre sm:text-3xl">Ma semaine</h2>
          {toutes && inscriptions.length > 1 && (
            <p className="font-ui text-xs text-muet">toutes les classes</p>
          )}
        </div>
        <nav aria-label="Choisir la semaine"
          className="flex w-full items-center justify-between gap-2
                     sm:w-auto sm:flex-none sm:justify-end sm:self-center">
          <Link href={`/eleve/semaine?cycle=${semainePrecedente}`} aria-label="Semaine précédente"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center
                       rounded-[10px] border border-bordure bg-surface px-3 font-ui text-[13px]
                       text-encre-douce transition-colors hover:bg-parchemin-fonce">
            <span aria-hidden className="sm:hidden">◀</span>
            <span aria-hidden className="hidden sm:inline">◀ précédente</span>
          </Link>
          <span className="min-w-[9rem] text-center">
            <span className="block font-corps text-[15px] font-semibold text-encre-douce">
              {bornesDuCycle(cycleLundi, cycleDimanche)}
            </span>
            {/* ⚠️ Le lien de retour NE REMPLACE PAS les dates : savoir QUELLE
                semaine on regarde est ce qui rend « précédente » lisible. */}
            {!estLaSemaineEnCours && (
              <Link href="/eleve/semaine"
                className="font-ui text-xs text-muet underline-offset-2
                           transition-colors hover:text-encre-douce hover:underline">
                cette semaine
              </Link>
            )}
          </span>
          <Link href={`/eleve/semaine?cycle=${semaineSuivante}`} aria-label="Semaine suivante"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center
                       rounded-[10px] border border-bordure bg-surface px-3 font-ui text-[13px]
                       text-encre-douce transition-colors hover:bg-parchemin-fonce">
            <span aria-hidden className="sm:hidden">▶</span>
            <span aria-hidden className="hidden sm:inline">suivante ▶</span>
          </Link>
        </nav>
      </div>

      {/* ⚠️ UNE LECTURE RATÉE SE DIT. « Une lecture ratée n'est pas "rien à
          faire" » : on ne laisse pas l'écran affirmer une semaine vide.
          ⛔ Et il reste EN TÊTE DE PAGE, avant les deux vues : il parle de tout
             ce que l'écran montre, pas d'une de ses moitiés. */}
      {incidents.length > 0 && (
        <div className="mb-6 rounded-xl border border-attention bg-attention-teinte p-4 text-sm text-encre">
          Une partie de ta semaine n’a pas pu être lue. Ce que tu vois ici est peut-être
          incomplet — dis-le à ton professeur plutôt que de t’y fier.
        </div>
      )}

      {/* ── VIDE Nº 1 : LA PORTE ─────────────────────────────────────────── */}
      {!porteOuverte ? (
        <section className="mx-auto max-w-2xl rounded-xl border border-bordure bg-surface p-8 text-center">
          <p className="text-sm text-encre-douce">
            Les exercices ne sont pas encore ouverts.<br />
            Ton professeur te préviendra quand ils le seront.
          </p>
        </section>
      ) : exercices.length === 0 ? (
        /* ── VIDE Nº 2 : RIEN À FAIRE ────────────────────────────────────── */
        <section className="mx-auto max-w-2xl rounded-xl border border-bordure bg-surface p-8 text-center">
          <p className="text-sm text-encre-douce">
            {estLaSemaineEnCours
              ? <>Tu n’as aucun exercice cette semaine.<br />Rien à rattraper : profites-en.</>
              : <>Aucun exercice ne t’a été donné cette semaine-là.</>}
          </p>
        </section>
      ) : (
        /* ⭐ LA GRILLE DES TROIS TAILLES D'ÉCRAN, ET ELLE NE DOUBLE AUCUN
             MARQUAGE. Le segment est le PREMIER bloc du document — donc en tête
             sur téléphone et sur tablette portrait, où tout retombe en une
             colonne (segment → travail → compétences → offre) — et la grille le
             renvoie EN TÊTE DU RAIL à partir de 1024 px. Un seul segment dans le
             document : deux exemplaires, l'un caché, donneraient deux fois le
             même lien à lire. */
        /* ⚠️⚠️ `grid-cols-1` N'EST PAS DÉCORATIF, ET SON ABSENCE A DÉBORDÉ
             L'ÉCRAN. Une grille sans colonne déclarée n'a qu'une piste `auto`,
             donc dimensionnée sur le MAX-CONTENT — et l'amorce d'un exercice est
             en `truncate`, c'est-à-dire en `nowrap` : sa largeur max-content est
             la consigne ENTIÈRE, 129 caractères en médiane. Toute la page en
             sortait par la droite sous 1024 px. `grid-cols-1` de Tailwind vaut
             `repeat(1, minmax(0, 1fr))` — c'est le `minmax(0, …)` qui borne la
             piste, exactement comme la colonne large le fait déjà en `lg:`.
             *Trouvé au smoke téléphone, invisible à `tsc` et aux tests.* */
        <div className="grid grid-cols-1 items-start gap-6
                        lg:grid-cols-[minmax(0,1fr)_276px] lg:grid-rows-[auto_auto_1fr]">

          {/* ── LE SEGMENT — première case du rail ───────────────────────── */}
          <div className="lg:col-start-2 lg:row-start-1">
            <div className="flex overflow-hidden rounded-[11px] border border-bordure-bouton
                            bg-surface font-ui sm:max-w-[320px] lg:max-w-none">
              {vue === 'travail' ? (
                <span aria-current="page"
                  className="flex-1 bg-bouton-parcours px-2 py-3 text-center text-sm font-semibold
                             text-bouton-parcours-texte">
                  Travail{aFaire.length > 0 && <span className="opacity-75"> · {aFaire.length}</span>}
                </span>
              ) : (
                <Link href={lienDeVue('travail')}
                  className="flex-1 px-2 py-3 text-center text-sm text-encre-douce
                             transition-colors hover:bg-parchemin-fonce">
                  Travail{aFaire.length > 0 && <span className="text-muet"> · {aFaire.length}</span>}
                </Link>
              )}
              {/* ⛔⛔ INERTE, PAS SEULEMENT ESTOMPÉ. Hors du moment `bilan`, ce
                  n'est pas un lien du tout : le bilan pendant la semaine
                  donnerait à l'élève la réponse à « se juger ». */}
              {moment !== 'bilan' ? (
                <span aria-disabled="true"
                  className="flex-1 cursor-default bg-parchemin-fonce px-2 py-3 text-center
                             text-sm text-muet-clair">
                  Bilan
                </span>
              ) : vue === 'bilan' ? (
                <span aria-current="page"
                  className="flex-1 bg-bouton-parcours px-2 py-3 text-center text-sm font-semibold
                             text-bouton-parcours-texte">
                  Bilan
                </span>
              ) : (
                <Link href={lienDeVue('bilan')}
                  className="flex-1 px-2 py-3 text-center text-sm text-encre-douce
                             transition-colors hover:bg-parchemin-fonce">
                  Bilan
                </Link>
              )}
            </div>
            {/* ⛔ AUCUN MOMENT NE SE TAIT — un onglet éteint sans un mot
                laisserait l'élève conclure qu'il n'aura pas de bilan. */}
            {moment !== 'bilan' && (
              <p className="mt-2 px-0.5 font-corps text-[13px] italic text-muet">
                {moment === 'recapitulatif'
                  ? 'Ton bilan s’ouvrira quand tu auras fini ta semaine.'
                  : 'Il n’y a pas de bilan pour cette semaine.'}
              </p>
            )}
          </div>

          {/* ── LA COLONNE PRINCIPALE ────────────────────────────────────── */}
          <div className="space-y-5 lg:col-start-1 lg:row-start-1 lg:row-span-3">
            {vue === 'travail' ? (
              <>
                {/* ⭐ LE VOLUME EN TÊTE : c'est le seul endroit où la semaine se
                    voit d'un coup d'œil. */}
                <LeVolume frise={frise} />

                {aFaire.length > 0 && (
                  <section>
                    <Surtitre>À faire</Surtitre>
                    {/* ⭐ UNE SEULE DÉPLIÉE À LA FOIS — `name` sur `<details>`
                        fait l'accordéon SANS UNE LIGNE DE JAVASCRIPT. La
                        première est ouverte : l'élève arrive sur du travail,
                        pas sur un sommaire. */}
                    <div className="flex flex-col gap-2">
                      {aFaire.map((e, i) => (
                        <RangDExercice key={e.depotId} e={e} ouvert={i === 0}
                          fuseau={fuseau} maintenant={maintenant} />
                      ))}
                    </div>
                  </section>
                )}

                {dejaFait.length > 0 && <DejaFait exercices={dejaFait} />}
              </>
            ) : (
              <LeBilan bilan={bilan} manque={manque} exercices={exercices} />
            )}
          </div>

          {/* ── LA SUITE DU RAIL ─────────────────────────────────────────── */}
          <div className="space-y-4 lg:col-start-2 lg:row-start-2">
            {/* En vue Travail : ce que la semaine travaille, une ligne par
                compétence. En vue Bilan : le rappel du volume, seul chiffre
                encore utile à ce moment-là. */}
            {vue === 'travail'
              ? recapitulatif.length > 0 && <CeQueLaSemaineTravaille blocs={recapitulatif} />
              : <TaSemaine frise={frise} />}

            {/* ── TEMPS 3 — L'OFFRE D'EN FAIRE PLUS ─────────────────────── */}
            {/* ⛔ AUCUN MOMENT NE SE TAIT : quand l'offre ne s'ouvre pas, sa
                PHRASE prend la place du bouton — « le silence est un mensonge »,
                et « quand tu auras fini » n'est pas « tu as tout pris ».
                ⛔ Et aucun nombre : le pull se compte en minutes CÔTÉ SERVEUR. */}
            {offre.offerte ? (
              <OffreDEnFairePlus invite={offre.phrase} />
            ) : offre.phrase ? (
              <section className="rounded-xl border border-bordure border-t-[3px]
                                  border-t-bouton-plan bg-surface p-4">
                <Surtitre dansUneCarte>En faire plus</Surtitre>
                <p className="font-corps text-[15px] leading-snug text-encre-douce">
                  {offre.phrase}
                </p>
              </section>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LES PIÈCES DE L'ÉCRAN
// ════════════════════════════════════════════════════════════════════════════

function Surtitre({ children, dansUneCarte }: {
  children: React.ReactNode
  dansUneCarte?: boolean
}) {
  return (
    <h3 className={`font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet
                    ${dansUneCarte ? 'mb-2.5' : 'mb-2.5 px-0.5'}`}>
      {children}
    </h3>
  )
}

/**
 * ⛔ AUCUN POURCENTAGE, AUCUNE BANDE DE COULEUR : deux décomptes réels
 *    (`06-` §5, « un écran n'affiche un nombre que si ce nombre compte quelque
 *    chose »), et les seuils vert/orange/rouge sont ceux de la frise DU
 *    PROFESSEUR, sur une CLASSE.
 * ⭐⭐ ET LE DEMANDÉ EN PLUS RESTE HORS DE LA FRACTION : sans cela, « 3 sur 5 »
 *    mélangerait l'assigné et le demandé, et l'élève lirait COMME UN RETARD ce
 *    qu'il a choisi en plus.
 */
function LeVolume({ frise }: { frise: Frise }) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <p className="font-titre text-2xl font-bold text-encre">
          {frise.faits} exercice{frise.faits > 1 ? 's' : ''} fait
          {frise.faits > 1 ? 's' : ''} sur {frise.total}
        </p>
        {frise.enPlus.total > 0 && <EnPlus frise={frise} />}
      </div>
      <Frise frise={frise} />
    </section>
  )
}

/** Le même volume, en rappel dans le rail — la vue Bilan n'a plus que ce chiffre. */
function TaSemaine({ frise }: { frise: Frise }) {
  return (
    <section className="rounded-xl border border-bordure border-t-[3px] border-t-bouton-valider
                        bg-surface p-4">
      <Surtitre dansUneCarte>Ta semaine</Surtitre>
      <p className="font-titre text-xl font-bold text-encre">
        {frise.faits} fait{frise.faits > 1 ? 's' : ''} sur {frise.total}
      </p>
      <Frise frise={frise} />
      {frise.enPlus.total > 0 && <p className="mt-2"><EnPlus frise={frise} /></p>}
    </section>
  )
}

function Frise({ frise }: { frise: Frise }) {
  if (frise.cases.length === 0) return null
  return (
    <div className="mt-2.5 flex gap-1" aria-hidden>
      {frise.cases.map((fait, i) => (
        <span key={i}
          className={`h-2 flex-1 rounded-full ${fait ? 'bg-bouton-valider' : 'bg-bordure'}`} />
      ))}
    </div>
  )
}

/**
 * ⭐⭐ C6-L3 — CE QU'IL A DEMANDÉ EN PLUS, DIT À PART. La marque se VOIT :
 *    sans elle, l'élève ne saurait pas lequel de ses exercices il a demandé.
 */
function EnPlus({ frise }: { frise: Frise }) {
  const n = frise.enPlus.total
  const s = n > 1 ? 's' : ''
  return (
    <span className="font-corps text-[15px] italic text-muet">
      {frise.enPlus.faits === n
        ? <>et {n} exercice{s} que tu as demandé{s} en plus, fait{s}.</>
        : <>et {n} exercice{s} que tu as demandé{s} en plus.</>}
    </span>
  )
}

/**
 * UN EXERCICE, EN UNE LIGNE QUI S'OUVRE.
 *
 * ⚠️⚠️ L'AMORCE N'EST PAS UN ORNEMENT. `e.titre` est la première ligne de la
 *    consigne — un paragraphe de 129 caractères en médiane —, et sans elle la
 *    ligne fermée ne porterait que « commencé · à rendre dim. 30 » : trois
 *    lignes identiques, et l'élève ne saurait pas laquelle ouvrir. Écrêtée à UNE
 *    ligne, c'est exactement ce que l'écran d'avant montrait ; la consigne
 *    entière est deux lignes plus bas, dans le panneau.
 *
 * ⭐ SUR TÉLÉPHONE, LE GESTE EST DANS LE PANNEAU. À 390 px, amorce + état +
 *    échéance + bouton sur un rang ne tient pas — et qui n'a pas lu la consigne
 *    n'a rien à reprendre. Au-delà de 640 px le bouton reste sur la ligne
 *    fermée, pour reprendre sans ouvrir.
 *
 * ⚠️ « Pendant le cycle, l'atelier est un ATTRIBUT VISUEL, jamais un lieu. Il se
 *    MONTRE, il ne se VISITE pas. »
 * ⛔ AUCUNE DURÉE ICI — `semaine.ts` l'exclut nommément de cet écran.
 */
function RangDExercice({ e, ouvert, fuseau, maintenant }: {
  e: ExerciceDeLaSemaine
  ouvert: boolean
  fuseau: string
  maintenant: string
}) {
  const action = actionDeLaLigne(e.ton)
  const echeance = echeanceLisible(e.echeance, maintenant, fuseau)
  // ⚠️⚠️ LE `display` NE SE SUPERPOSE PAS, ET LA CHAÎNE DE CLASSES NE TRANCHE
  //    RIEN. `inline-flex` et `hidden` sont deux utilitaires de la MÊME
  //    propriété : c'est l'ordre de la feuille de Tailwind qui départage, pas
  //    celui où on les écrit — et `inline-flex` y passe APRÈS. Écrit
  //    « inline-flex … hidden sm:inline-flex », le bouton restait donc visible
  //    sur téléphone, où il paraissait DEUX FOIS : sur la ligne et dans le
  //    panneau. Le `display` de base est donc porté par la branche, jamais
  //    par le fond commun. *Trouvé au smoke téléphone.*
  const bouton = (surTelephone: boolean) => action && (
    <Link href={e.href}
      className={`min-h-[44px] shrink-0 items-center justify-center whitespace-nowrap
                  rounded-[10px] px-5 font-ui text-sm font-semibold transition-colors
                  ${surTelephone
        ? 'flex w-full sm:hidden'
        : 'ml-auto hidden sm:inline-flex'}
                  ${action.plein
        ? 'bg-bouton-parcours text-bouton-parcours-texte hover:brightness-110'
        : 'border border-bordure-bouton bg-surface text-encre-douce hover:bg-parchemin-fonce'}`}>
      {action.libelle}
    </Link>
  )
  return (
    <details name="exercices-de-la-semaine" open={ouvert} data-module={e.atelier}
      className="group overflow-hidden rounded-xl border border-bordure bg-surface
                 open:border-bordure-bouton">
      <summary className="flex min-h-[52px] cursor-pointer list-none flex-col gap-2 px-4 py-2.5
                          group-open:border-b group-open:border-bordure
                          group-open:bg-parchemin-fonce
                          sm:flex-row sm:items-center sm:gap-3">
        {/* ⚠️ `sm:contents` — DEUX RANGS SUR TÉLÉPHONE (l'amorce, puis l'état et
            l'échéance), UNE SEULE LIGNE au-delà : les enveloppes s'effacent et
            les pièces retombent dans le même rang. */}
        <span className="flex items-center gap-3 sm:contents">
          <span aria-hidden className="text-xs text-muet group-open:hidden">▸</span>
          <span aria-hidden className="hidden text-xs text-muet group-open:inline">▾</span>
          <Pastille module={e.atelier} size={28} />
          {/* ⚠️ L'AMORCE S'EFFACE À L'OUVERTURE, et ce n'est pas un détail : la
              consigne entière est TROIS LIGNES PLUS BAS, et la garder répétait
              ses cinquante premiers caractères juste au-dessus d'eux — un
              bégaiement. *Vu à l'écran, pas au dessin.* Le vide qu'elle laisse
              est tenu par une cale, sans quoi l'état et l'échéance viendraient
              se coller au sceau. */}
          <span className="min-w-0 flex-1 truncate font-corps text-[16px] text-encre-douce
                           group-open:hidden">
            {e.titre}
          </span>
          <span aria-hidden className="hidden flex-1 group-open:block" />
        </span>
        <span className="flex items-center gap-3 pl-[52px] sm:contents sm:pl-0">
          <span className="font-ui text-[13px] text-muet">
            {e.libelle}
            {e.bonus && <span className="text-encre-douce"> · demandé en plus</span>}
          </span>
          {echeance && (
            <span className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1
                              font-ui text-xs ${echeance.proche
              ? 'border-attention/30 bg-attention-teinte font-semibold text-attention'
              : 'border-bordure bg-surface text-muet'}`}>
              {echeance.texte}
            </span>
          )}
          {bouton(false)}
        </span>
      </summary>

      <div className="px-4 pb-4 pt-3.5">
        <p className="max-w-[66ch] font-corps text-[17px] leading-relaxed text-encre sm:text-[18px]">
          {e.titre}
        </p>
        <div className="mt-3.5 sm:hidden">{bouton(true)}</div>
      </div>
    </details>
  )
}

/**
 * ⭐ REPLIÉ À TOUTES LES TAILLES — c'est la doctrine de cette organisation :
 *   ce qui n'appelle plus de geste ne prend pas de place. Le repli se fait en
 *   `<details>` natif : pas d'état client, pas d'hydratation, et le contenu
 *   reste dans le document, donc trouvable au `Ctrl+F` du navigateur.
 */
function DejaFait({ exercices }: { exercices: ExerciceDeLaSemaine[] }) {
  return (
    <details className="group">
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-3
                          rounded-xl bg-parchemin-fonce px-4 py-3">
        <span aria-hidden className="text-xs text-muet group-open:hidden">▸</span>
        <span aria-hidden className="hidden text-xs text-muet group-open:inline">▾</span>
        <span className="flex-1 font-ui text-[15px] font-semibold text-encre-douce">Déjà fait</span>
        <span className="font-ui text-sm text-muet">{exercices.length}</span>
      </summary>
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {exercices.map((e) => (
          <Link key={e.depotId} href={e.href}
            className="flex items-center gap-3 rounded-xl border border-bordure bg-surface-retrait
                       px-3.5 py-3 opacity-[.78] transition-opacity hover:opacity-100">
            <Pastille module={e.atelier} size={28} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-corps text-[15px] text-encre-douce">{e.titre}</span>
              <span className="block font-ui text-xs text-muet-clair">{e.libelle}</span>
            </span>
            <span className="shrink-0 rounded-full bg-ok-teinte px-2.5 py-1 font-ui text-[11px]
                             font-semibold uppercase tracking-[0.04em] text-ok">
              fait
            </span>
          </Link>
        ))}
      </div>
    </details>
  )
}

/**
 * `02-` §6.C, points 1 et 2 — les compétences que la semaine travaille, et LES
 * FORCES de l'élève dans celles-là. UNE LIGNE PAR COMPÉTENCE : le rail portait
 * cinq blocs de listes, plus hauts que le travail lui-même.
 * ⛔ ET AUCUNE FAIBLESSE : elles viennent au bilan, à la fin. Les nommer ici
 *    donnerait à l'élève la réponse à la phase « se juger ».
 * ⛔ LES DIMENSIONS REGARDÉES NE SE TRONQUENT PAS : « N points » est l'ENTRÉE,
 *    la compétence dépliée les liste TOUTES — et en LISTE, pas en phrase : une
 *    compétence en porte jusqu'à onze, et huit d'affilée séparées par des
 *    virgules se lisaient comme un mur (*vu à l'écran au smoke du 28/08*).
 * ⚠️ Les deux rendus sont exclusifs par `display:none` — un seul est dans
 *    l'arbre d'accessibilité à la fois, jamais les deux.
 */
function CeQueLaSemaineTravaille({ blocs }: { blocs: BlocRecapitulatif[] }) {
  const lignes = (
    <div className="flex flex-col gap-1.5">
      {blocs.map((b) => <LigneDeCompetence key={b.competence} b={b} />)}
    </div>
  )
  return (
    <>
      <details className="group sm:hidden">
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-3
                            rounded-xl bg-parchemin-fonce px-4 py-3">
          <span aria-hidden className="text-xs text-muet group-open:hidden">▸</span>
          <span aria-hidden className="hidden text-xs text-muet group-open:inline">▾</span>
          <span className="flex-1 font-ui text-[15px] font-semibold text-encre-douce">
            Ce que la semaine travaille
          </span>
          <span className="font-ui text-sm text-muet">{blocs.length}</span>
        </summary>
        <div className="mt-2.5">{lignes}</div>
      </details>
      <section className="hidden sm:block">
        <Surtitre>Ce que la semaine travaille</Surtitre>
        {lignes}
      </section>
    </>
  )
}

function LigneDeCompetence({ b }: { b: BlocRecapitulatif }) {
  const n = b.dimensionsRegardees.length
  const forces = listeDesForces(b.forces)
  return (
    <details name="competences-de-la-semaine"
      className="group overflow-hidden rounded-xl border border-bordure bg-surface">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2.5 px-3.5 py-2.5">
        <span aria-hidden className="text-xs text-muet group-open:hidden">▸</span>
        <span aria-hidden className="hidden text-xs text-muet group-open:inline">▾</span>
        <span className="flex-1 font-titre text-lg font-semibold text-encre">{b.competence}</span>
        {n > 0 && (
          <span className="shrink-0 font-ui text-xs text-muet">{n} point{n > 1 ? 's' : ''}</span>
        )}
      </summary>
      <div className="space-y-3 border-t border-bordure px-3.5 py-3">
        {/* ⚠️ La phrase se FABRIQUE dans `profil.ts` — son amorce CADRE la
            dimension au lieu de la qualifier (voir `INTITULE_DES_FORCES`). */}
        {forces && (
          <div>
            <p className="font-corps text-sm text-ok">{forces.intitule}</p>
            <ListeDeDimensions noms={forces.noms} />
          </div>
        )}
        {n > 0 && (
          <div>
            <p className="font-corps text-sm text-encre-douce">Cette semaine, on regarde :</p>
            <ListeDeDimensions noms={b.dimensionsRegardees} douce />
          </div>
        )}
      </div>
    </details>
  )
}

function ListeDeDimensions({ noms, douce }: { noms: readonly string[]; douce?: boolean }) {
  return (
    <ul className="mt-1 space-y-0.5">
      {noms.map((d) => (
        <li key={d} className={`flex gap-2 font-corps text-sm ${douce ? 'text-encre-douce' : 'text-encre'}`}>
          <span className="text-puce" aria-hidden>·</span>
          <span>{d}</span>
        </li>
      ))}
    </ul>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LE BILAN — « les deux écarts qui instruisent », enroulés par compétence
// ════════════════════════════════════════════════════════════════════════════

type MarqueDuBilan = 'a_reprendre' | 'reussi' | 'habitude' | null

/**
 * ⭐ LA MARQUE DE CONTENU — pour qu'on choisisse quoi ouvrir sans tout déplier.
 * ⚠️ `null` = LA SEMAINE N'EN A RIEN DIT. Une compétence que les exercices
 *    pouvaient porter mais qu'aucune mesure écrite ne touche n'a ni réussite ni
 *    écart : elle se range avec les non mesurées, et « comme d'habitude » lui
 *    ferait dire quelque chose qu'elle ne dit pas.
 */
function marqueDuBilan(b: Bilan): MarqueDuBilan {
  if (b.angleMort.length > 0) return 'a_reprendre'
  if (b.bonneSurprise.length > 0) return 'reussi'
  if (b.confirme.length > 0 || b.connu.length > 0) return 'habitude'
  return null
}

function LeBilan({ bilan, manque, exercices }: {
  bilan: Bilan[]
  manque: { copiesNonMesurees: number; incomplet: boolean }
  exercices: ExerciceDeLaSemaine[]
}) {
  const mesurees = bilan.filter((b) => marqueDuBilan(b) !== null)

  // ⭐ LE RÉFÉRENTIEL EST UNE CONSTANTE DE CODE, PAS UNE LECTURE DE DOCTRINE.
  //   « Pas de ligne » n'est pas « pas d'objet » (leçon de
  //   `c4_statut_recette_global.sql`) : les SIX compétences s'énumèrent
  //   toujours, et celles dont la semaine n'a rien dit se voient — grises et
  //   sans verdict — plutôt que de disparaître.
  const nommees = new Set(bilan.map((b) => b.competence))
  const nonMesurees = [
    ...bilan.filter((b) => marqueDuBilan(b) === null).map((b) => b.competence),
    ...COMPETENCES.map((c) => NOM_COMPETENCE[c]).filter((n) => !nommees.has(n)),
  ].sort((a, b) => a.localeCompare(b, 'fr'))

  // ⭐ LE DÉCOMPTE PAR COMPÉTENCE VIENT DE LA MÊME FONCTION PURE QUE LE
  //   CHARGEUR — on ne recompte pas à la main ce qui est déjà écrit une fois.
  // ⚠️ Il ADDITIONNE le demandé en plus, parce que « le bonus est un exercice
  //   normal, MESURES COMPRISES » (`01-` §5) : le bilan, lui, le compte.
  const nbPar = new Map<string, number>(
    competencesDeLaSemaine(exercices)
      .filter((p) => (COMPETENCES as readonly string[]).includes(p.competence))
      .map((p) => [NOM_COMPETENCE[p.competence as Competence], p.nbExercices + p.nbEnPlus]),
  )

  return (
    <section>
      {/* ⛔⛔ UNE COPIE NON MESURÉE N'A NI RÉUSSITE NI ÉCART, ET LE SILENCE EST
          UN MENSONGE : le bilan DIT ce qui manque, et il le dit EN ENTIER —
          « ce bilan ne la compte pas encore » est la moitié qui compte. */}
      {manque.incomplet && (
        <p className="mb-4 rounded-xl border border-attention/40 bg-attention-teinte p-3.5
                      font-corps text-[15px] leading-snug text-encre">
          {manque.copiesNonMesurees === 1
            ? 'Une de tes copies n’a pas encore été corrigée : ce bilan ne la compte pas encore.'
            : `${manque.copiesNonMesurees} de tes copies n’ont pas encore été corrigées : ce bilan ne les compte pas encore.`}
        </p>
      )}

      {mesurees.length === 0 ? (
        <p className="rounded-xl border border-bordure bg-surface p-5 font-corps text-sm text-encre-douce">
          Rien n’a encore été mesuré sur cette semaine. Ton bilan arrivera avec tes retours.
        </p>
      ) : (
        <>
          <p className="mb-4 px-0.5 font-corps text-[17px] text-encre-douce">
            {mesurees.length} compétence{mesurees.length > 1 ? 's' : ''} mesurée
            {mesurees.length > 1 ? 's' : ''} sur {COMPETENCES.length}.
          </p>
          <Surtitre>Choisis une compétence</Surtitre>
          <div className="flex flex-col gap-2">
            {/* ⭐ UNE SEULE DÉPLIÉE À LA FOIS — `name` sur `<details>` fait
                l'accordéon SANS UNE LIGNE DE JAVASCRIPT. La première est
                ouverte : le bilan doit apprendre quelque chose d'emblée. */}
            {mesurees.map((b, i) => (
              <LigneDeBilan key={b.competence} b={b} nb={nbPar.get(b.competence)} ouverte={i === 0} />
            ))}
            {nonMesurees.map((nom) => (
              <div key={nom}
                className="flex min-h-[44px] items-center gap-3 rounded-xl border border-dashed
                           border-bordure-bouton bg-surface-retrait px-4 py-3">
                <span className="flex-1 font-titre text-lg text-muet">{nom}</span>
                <span className="font-corps text-sm italic text-muet-clair">
                  pas mesurée cette semaine
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

const CHIP = {
  a_reprendre: 'border border-attention/30 bg-attention-teinte text-attention',
  reussi: 'border border-transparent bg-ok-teinte text-ok',
} as const

function LigneDeBilan({ b, nb, ouverte }: { b: Bilan; nb?: number; ouverte: boolean }) {
  const marque = marqueDuBilan(b)
  // ⭐⭐ « LES DEUX ÉCARTS QUI INSTRUISENT » — « c'est là que le bilan apprend
  //    quelque chose ; le reste ne fait que confirmer ce qu'il savait déjà ».
  const instruit = b.bonneSurprise.length > 0 || b.angleMort.length > 0
  return (
    <details name="bilan-de-la-semaine" open={ouverte}
      className="group overflow-hidden rounded-xl border border-bordure bg-surface
                 open:border-bordure-bouton">
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-3 px-4 py-3
                          group-open:border-b group-open:border-bordure group-open:bg-parchemin-fonce">
        <span aria-hidden className="text-xs text-muet group-open:hidden">▸</span>
        <span aria-hidden className="hidden text-xs text-muet group-open:inline">▾</span>
        <span className="flex-1 font-titre text-xl font-semibold text-encre">{b.competence}</span>
        {typeof nb === 'number' && nb > 0 && (
          <span className="hidden font-ui text-[13px] text-muet sm:inline">
            {nb} exercice{nb > 1 ? 's' : ''}
          </span>
        )}
        {marque === 'habitude' ? (
          <span className="font-corps text-sm italic text-muet">comme d’habitude</span>
        ) : marque && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 font-ui text-[11px] font-semibold
                            uppercase tracking-[0.04em] ${CHIP[marque]}`}>
            {marque === 'a_reprendre' ? 'à reprendre' : 'réussi'}
          </span>
        )}
      </summary>

      <div className="p-4">
        {instruit ? (
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
            {/* ⚠️⚠️ « SUR » N’EST PAS UN ORNEMENT — c’est lui qui fait du libellé
                un SUJET plutôt qu’un prédicat. Sans lui : « Tu as réussi tes
                raisons qui tournent en rond ». Même défaut, même parade que
                `AMORCE_DES_FORCES` — et c'est pourquoi la pastille ne dit pas
                « Tu as réussi » : elle dit « Tu y arrives », et la préposition
                reste dans la phrase. */}
            {b.bonneSurprise.length > 0 && (
              <div>
                <span className="inline-block rounded-full bg-ok-teinte px-2.5 py-1 font-ui
                                 text-[11px] font-semibold uppercase tracking-[0.05em] text-ok">
                  Tu y arrives
                </span>
                <p className="mt-2 font-corps text-[17px] leading-relaxed text-encre">
                  sur {joindre(b.bonneSurprise)} — <em className="text-encre-douce">là où tu
                  avais du mal jusqu’ici</em>.
                </p>
              </div>
            )}
            {b.angleMort.length > 0 && (
              <div className={b.bonneSurprise.length > 0
                ? 'border-t border-bordure pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0'
                : undefined}>
                <span className="inline-block rounded-full border border-attention/30
                                 bg-attention-teinte px-2.5 py-1 font-ui text-[11px] font-semibold
                                 uppercase tracking-[0.05em] text-attention">
                  À reprendre
                </span>
                <p className="mt-2 font-corps text-[17px] leading-relaxed text-encre">
                  {joindre(b.angleMort)} — <em className="text-encre-douce">c’était pourtant un
                  de tes points forts</em>.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Le reste, quand aucun écart n'instruit — et en LISTE, parce que
             certains libellés portent LEUR PROPRE ponctuation : la virgule de la
             liste et celle du libellé ne se distinguaient plus, et un « ? »
             coupait la phrase en deux au milieu.
             ⛔⛔ L'INTITULÉ GARDE SON « SUR » : « Ce que tu as tenu, comme
             d'habitude : » remettait la puce en OBJET DIRECT et ramenait le
             défaut d'à côté (« tu as tenu tes raisons qui tournent en rond »). */
          <div className="space-y-4">
            {b.confirme.length > 0 && (
              <div>
                <p className="font-corps text-sm text-encre-douce">Comme d’habitude, tu as tenu sur :</p>
                <ListeDeDimensions noms={b.confirme} douce />
              </div>
            )}
            {b.connu.length > 0 && (
              <div>
                <p className="font-corps text-sm text-encre-douce">Ce qui reste à travailler :</p>
                <ListeDeDimensions noms={b.connu} douce />
              </div>
            )}
          </div>
        )}
      </div>
    </details>
  )
}

/** « a, b et c » — jamais une énumération à virgules qui se lit comme une liste de fautes. */
function joindre(xs: readonly string[]): string {
  if (xs.length <= 1) return xs[0] ?? ''
  return `${xs.slice(0, -1).join(', ')} et ${xs[xs.length - 1]}`
}
