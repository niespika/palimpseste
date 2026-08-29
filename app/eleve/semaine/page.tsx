import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { contexteClasseEleve } from '../contexte-classe'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { jourDansFuseau, formatJour } from '@/utils/fuseau'
import { lundiOnOrBefore, addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import { chargerLaSemaineDeLEleve } from '@/utils/eleve/semaine-serveur'
import { offreDEnFairePlus, momentDeLaSemaine } from '@/utils/eleve/semaine'
import { listeDesForces } from '@/utils/eleve/profil'
import { lireLeQuotaDuCycle } from '@/utils/moteur/bonus-serveur'
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
// ============================================================================

const fmtJour = (d: string) => formatJour(d, { day: 'numeric', month: 'long' })

export default async function SemaineDeLEleve({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>
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
  //    ⭐ C'est le geste que le quota avait déjà reçu, deux lignes plus bas.
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
  // ⛔ PLUS AUCUNE AGRÉGATION ICI : tout est compté une fois, dans le chargeur,
  //    sur la liste dédoublonnée. Sommer par inscription était le défaut.
  const { porteOuverte, exercices, frise, recapitulatif, bilan, manque } = semaine
  const incidents = [...semaine.incidents, ...incidentsDuQuota]
  const auBilan = bilan.length > 0 || (exercices.length > 0 && recapitulatif.length === 0)

  // ⭐ L'OFFRE SE LIT SUR LA LISTE FUSIONNÉE, pas par inscription : le moment de
  //   l'élève est celui de TOUT son travail, et son quota est unique.
  // ⚠️ `estLaSemaineEnCours` est une condition de plus, et elle est à l'écran :
  //   on ne propose pas d'en faire plus sur une semaine passée, dont le quota est
  //   perdu (`01-` §5) — l'action, elle, refuserait de toute façon.
  const offre = estLaSemaineEnCours
    ? offreDEnFairePlus(porteOuverte, momentDeLaSemaine(exercices), exercices, quota)
    : { offerte: false, motif: null, phrase: '' }

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="font-titre text-2xl text-encre">Ma semaine</h2>
          <nav className="flex items-center gap-1 text-xs font-ui">
            <Link href={`/eleve/semaine?cycle=${semainePrecedente}`}
              className="px-2 py-1 rounded-md text-muet hover:bg-parchemin-fonce transition-colors">
              ← précédente
            </Link>
            {!estLaSemaineEnCours && (
              <Link href="/eleve/semaine"
                className="px-2 py-1 rounded-md text-encre-douce hover:bg-parchemin-fonce transition-colors">
                cette semaine
              </Link>
            )}
            <Link href={`/eleve/semaine?cycle=${semaineSuivante}`}
              className="px-2 py-1 rounded-md text-muet hover:bg-parchemin-fonce transition-colors">
              suivante →
            </Link>
          </nav>
        </div>
        <p className="text-muet text-sm mt-0.5">
          Du {fmtJour(cycleLundi)} au {fmtJour(cycleDimanche)}
          {toutes && inscriptions.length > 1 && <span> · toutes les classes</span>}
        </p>
      </header>

      {/* ⚠️ UNE LECTURE RATÉE SE DIT. « Une lecture ratée n'est pas "rien à
          faire" » : on ne laisse pas l'écran affirmer une semaine vide. */}
      {incidents.length > 0 && (
        <div className="bg-attention-teinte border border-attention rounded-xl p-4 text-sm text-encre">
          Une partie de ta semaine n’a pas pu être lue. Ce que tu vois ici est peut-être
          incomplet — dis-le à ton professeur plutôt que de t’y fier.
        </div>
      )}

      {/* ── VIDE Nº 1 : LA PORTE ─────────────────────────────────────────── */}
      {!porteOuverte ? (
        <section className="bg-surface border border-bordure rounded-xl p-8 text-center">
          <p className="text-encre-douce text-sm">
            Les exercices ne sont pas encore ouverts.<br />
            Ton professeur te préviendra quand ils le seront.
          </p>
        </section>
      ) : exercices.length === 0 ? (
        /* ── VIDE Nº 2 : RIEN À FAIRE ────────────────────────────────────── */
        <section className="bg-surface border border-bordure rounded-xl p-8 text-center">
          <p className="text-encre-douce text-sm">
            {estLaSemaineEnCours
              ? <>Tu n’as aucun exercice cette semaine.<br />Rien à rattraper : profites-en.</>
              : <>Aucun exercice ne t’a été donné cette semaine-là.</>}
          </p>
        </section>
      ) : (
        <>
          {/* ── LA FRISE ET SA BARRE ──────────────────────────────────────── */}
          <section>
            <h3 className="font-ui text-xs tracking-[0.1em] text-muet uppercase mb-2">
              Le travail de la semaine
            </h3>
            <div className="bg-surface border border-bordure rounded-xl p-5 space-y-3">
              {/* ⛔ AUCUN POURCENTAGE : deux décomptes réels, et rien d'autre
                  (`06-` §5, « un écran n'affiche un nombre que si ce nombre
                  compte quelque chose »). */}
              <p className="font-titre text-lg text-encre">
                {frise.faits} exercice{frise.faits > 1 ? 's' : ''} fait
                {frise.faits > 1 ? 's' : ''} sur {frise.total}
              </p>
              <div className="flex gap-1.5" aria-hidden>
                {frise.cases.map((fait, i) => (
                  <span key={i}
                    className={`h-2.5 flex-1 rounded-full ${fait ? 'bg-ok' : 'bg-parchemin-fonce'}`} />
                ))}
              </div>
              {/* ⭐⭐ C6-L3 — CE QU'IL A DEMANDÉ EN PLUS, DIT À PART ET JAMAIS
                  DANS LA FRACTION. Sans cette ligne, « 3 sur 5 » mélangerait
                  l'assigné et le demandé, et l'élève lirait COMME UN RETARD ce
                  qu'il a choisi en plus. ⛔ Deux décomptes réels, aucun taux. */}
              {frise.enPlus.total > 0 && (
                <p className="text-sm text-encre-douce">
                  {frise.enPlus.faits === frise.enPlus.total
                    ? <>Et {frise.enPlus.total} exercice{frise.enPlus.total > 1 ? 's' : ''} que
                      tu as demandé{frise.enPlus.total > 1 ? 's' : ''} en plus,
                      fait{frise.enPlus.total > 1 ? 's' : ''}.</>
                    : <>Et {frise.enPlus.total} exercice{frise.enPlus.total > 1 ? 's' : ''} que
                      tu as demandé{frise.enPlus.total > 1 ? 's' : ''} en plus.</>}
                </p>
              )}
            </div>
          </section>

          {/* ── TEMPS 1 — LE RÉCAPITULATIF ────────────────────────────────── */}
          {!auBilan && recapitulatif.length > 0 && (
            <section>
              <h3 className="font-ui text-xs tracking-[0.1em] text-muet uppercase mb-2">
                Ce que la semaine travaille
              </h3>
              <div className="bg-surface border border-bordure rounded-xl divide-y divide-bordure">
                {recapitulatif.map((b) => (
                  <div key={b.competence} className="p-5 space-y-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-titre text-base text-encre">{b.competence}</p>
                      <span className="text-xs text-muet whitespace-nowrap">
                        {b.nbExercices} exercice{b.nbExercices > 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* ⭐ « SES FORCES DANS CES COMPÉTENCES — ce qu'il réussit
                        déjà ». ⛔ Et AUCUNE faiblesse : elles viennent au bilan,
                        à la fin. Les nommer ici donnerait à l'élève la réponse à
                        la phase « se juger ». */}
                    {/* ⚠️ La phrase se FABRIQUE dans `profil.ts` — elle vivait ici
                        ET dans `/eleve/moi`, avec deux jointures distinctes.
                        Son amorce CADRE la dimension au lieu de la qualifier :
                        voir `INTITULE_DES_FORCES` et sa démonstration. */}
                    {(() => {
                      const f = listeDesForces(b.forces)
                      return f && (
                        <div>
                          <p className="text-sm text-ok">{f.intitule}</p>
                          <ul className="mt-1 space-y-0.5">
                            {f.noms.map((d) => (
                              <li key={d} className="text-sm text-encre flex gap-2">
                                <span className="text-muet" aria-hidden>·</span>
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })()}
                    {/* ⭐ « CE QU'IL DOIT SURVEILLER » = les dimensions que la
                        semaine MESURE, en langue élève et SANS VERDICT.
                        ⚠️ EN LISTE, PAS EN PHRASE : une compétence en porte
                        jusqu'à ONZE (la Synthèse), et huit d'affilée séparées par
                        des virgules se lisaient comme un mur — au point qu'on ne
                        distinguait plus une dimension de la suivante. *Vu à
                        l'écran au smoke du 28/08.* ⛔ On n'en coupe AUCUNE : ce
                        que la semaine regarde, elle le regarde en entier. */}
                    {b.dimensionsRegardees.length > 0 && (
                      <div>
                        <p className="text-sm text-encre-douce">Cette semaine, on regarde :</p>
                        <ul className="mt-1 space-y-0.5">
                          {b.dimensionsRegardees.map((d) => (
                            <li key={d} className="text-sm text-encre-douce flex gap-2">
                              <span className="text-muet" aria-hidden>·</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── TEMPS 2 — LE BILAN ────────────────────────────────────────── */}
          {auBilan && (
            <section>
              <h3 className="font-ui text-xs tracking-[0.1em] text-muet uppercase mb-2">
                Ton bilan de la semaine
              </h3>
              <div className="bg-surface border border-bordure rounded-xl p-5 space-y-5">
                {/* ⛔⛔ UNE COPIE NON MESURÉE N'A NI RÉUSSITE NI ÉCART, ET LE
                    SILENCE EST UN MENSONGE : le bilan DIT ce qui manque. */}
                {manque.incomplet && (
                  <p className="text-sm text-encre bg-attention-teinte rounded-lg p-3">
                    {manque.copiesNonMesurees === 1
                      ? 'Une de tes copies n’a pas encore été corrigée : ce bilan ne la compte pas encore.'
                      : `${manque.copiesNonMesurees} de tes copies n’ont pas encore été corrigées : ce bilan ne les compte pas encore.`}
                  </p>
                )}
                {bilan.length === 0 ? (
                  <p className="text-sm text-encre-douce">
                    Rien n’a encore été mesuré sur cette semaine. Ton bilan arrivera avec
                    tes retours.
                  </p>
                ) : bilan.map((b) => {
                  const instruit = b.bonneSurprise.length > 0 || b.angleMort.length > 0
                  return (
                    <div key={b.competence} className="space-y-1.5">
                      <p className="font-titre text-base text-encre">{b.competence}</p>
                      {/* ⭐⭐ LES DEUX ÉCARTS QUI INSTRUISENT, EN TÊTE — « c'est
                          là que le bilan apprend quelque chose ; le reste ne fait
                          que confirmer ce qu'il savait déjà ». */}
                      {/* ⚠️ « SUR » N’EST PAS UN ORNEMENT — c’est lui qui fait du
                          libellé un SUJET plutôt qu’un prédicat. Sans lui :
                          « Tu as réussi tes raisons qui tournent en rond ».
                          Même défaut, même parade que `AMORCE_DES_FORCES`. */}
                      {b.bonneSurprise.length > 0 && (
                        <p className="text-sm text-encre">
                          <span className="text-ok font-semibold">Tu y arrives</span>{' '}
                          sur {joindre(b.bonneSurprise)} — <em>là où tu avais du mal jusqu’ici</em>.
                        </p>
                      )}
                      {b.angleMort.length > 0 && (
                        <p className="text-sm text-encre">
                          <span className="text-attention font-semibold">À reprendre :</span>{' '}
                          {joindre(b.angleMort)} — <em>c’était pourtant un de tes points forts</em>.
                        </p>
                      )}
                      {/* Le reste, en second, et plus discret.
                          ⚠️ EN LISTE, comme sa voisine et pour la même raison —
                          ⛔⛔ ET L'INTITULÉ GARDE SON « SUR » — il avait d'abord
                          été écrit « Ce que tu as tenu, comme d'habitude : », ce
                          qui remettait la puce en OBJET DIRECT et ramenait le
                          défaut qu'on venait de corriger deux blocs plus haut
                          (« tu as tenu tes raisons qui tournent en rond »).
                          ⚠️ Le deux-points ne protège rien par lui-même : c'est
                          la PRÉPOSITION qui fait de la puce un sujet. Voir
                          `INTITULE_DES_FORCES`. */}
                      {!instruit && b.confirme.length > 0 && (
                        <div>
                          <p className="text-sm text-encre-douce">
                            Comme d’habitude, tu as tenu sur :
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {b.confirme.map((d) => (
                              <li key={d} className="text-sm text-encre-douce flex gap-2">
                                <span className="text-muet" aria-hidden>·</span>
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* ⚠️ EN LISTE, PAS EN PHRASE — la MÊME leçon que « on
                          regarde » deux blocs plus haut, et pour la même raison :
                          jusqu'à SEPT libellés d'affilée, séparés par des
                          virgules, se lisaient comme un mur. ⛔ Ici c'était pire,
                          parce que certains libellés portent LEUR PROPRE
                          ponctuation : « ta problématique, ta problématique, ou
                          celle du sujet ?, une problématique faite pour CE
                          sujet, … » — la virgule de la liste et celle du libellé
                          ne se distinguaient plus, et le « ? » coupait la phrase
                          en deux au milieu. ⛔ On n'en retire AUCUN : ce qui
                          reste à travailler, on le dit en entier.
                          ⚠️ Le passage en liste retire aussi l'accord
                          « reste / restent », qui était la seule raison de
                          compter les éléments à l'affichage. */}
                      {!instruit && b.connu.length > 0 && (
                        <div>
                          <p className="text-sm text-encre-douce">Ce qui reste à travailler :</p>
                          <ul className="mt-1 space-y-0.5">
                            {b.connu.map((d) => (
                              <li key={d} className="text-sm text-encre-douce flex gap-2">
                                <span className="text-muet" aria-hidden>·</span>
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── LA LISTE, ET LE CLIC QUI RAMÈNE AU TRAVAIL ────────────────── */}
          <section>
            <h3 className="font-ui text-xs tracking-[0.1em] text-muet uppercase mb-2">
              Tes exercices
            </h3>
            <div className="bg-surface border border-bordure rounded-xl divide-y divide-bordure">
              {exercices.map((e) => (
                <Link key={e.depotId} href={e.href} data-module={e.atelier}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-parchemin-fonce transition-colors">
                  {/* ⚠️ « Pendant le cycle, l'atelier est un ATTRIBUT VISUEL,
                      jamais un lieu. Il se MONTRE, il ne se VISITE pas. » */}
                  <Pastille module={e.atelier} size={28} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-encre truncate">{e.titre}</span>
                    <span className="block text-xs text-muet">
                      {e.libelle}
                      {/* ⭐ La marque se VOIT sur la ligne : sans elle, l'élève
                          ne saurait pas lequel de ses exercices il a demandé. */}
                      {e.bonus && <span className="text-encre-douce"> · demandé en plus</span>}
                    </span>
                  </span>
                  {e.echeance && (
                    <span className="text-xs text-muet whitespace-nowrap">
                      {fmtJour(e.echeance.slice(0, 10))}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>

          {/* ── TEMPS 3 — L'OFFRE D'EN FAIRE PLUS ────────────────────────── */}
          {/* ⛔ AUCUN MOMENT NE SE TAIT : quand l'offre ne s'ouvre pas, sa
              PHRASE prend sa place — « le silence est un mensonge », et
              « quand tu auras fini » n'est pas « tu as tout pris ». */}
          {offre.offerte ? (
            <OffreDEnFairePlus invite={offre.phrase} />
          ) : offre.phrase ? (
            <section>
              <h3 className="font-ui text-xs tracking-[0.1em] text-muet uppercase mb-2">
                En faire plus
              </h3>
              <div className="bg-surface border border-bordure rounded-xl p-5">
                <p className="text-sm text-encre-douce">{offre.phrase}</p>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}

/** « a, b et c » — jamais une énumération à virgules qui se lit comme une liste de fautes. */
function joindre(xs: readonly string[]): string {
  if (xs.length <= 1) return xs[0] ?? ''
  return `${xs.slice(0, -1).join(', ')} et ${xs[xs.length - 1]}`
}
