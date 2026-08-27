import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { chargerCapstoneLivre, contexteAletheia, estSemaineDebloquee, lireReglages, livresPourClasse, travauxParSemaine } from './data'
import ModuleHorsClasse from '../../ModuleHorsClasse'
import ChoixClasseModule from '../../ChoixClasseModule'
import { MicroStepper } from '@/components/aletheia/Steppers'
import Pastille from '@/components/Pastille'
import type { StatutAletheia } from './types'
import { signauxDeLancement } from '@/utils/examens/signal'
import SignalDeLancement from '@/components/examens/SignalDeLancement'
import { lireLaPorte } from '@/utils/deroule/acces'
import { exercicesMaisonDeLEleve } from '@/utils/codex-onglets/liste'
import type { TonEtat } from '@/utils/codex-onglets/regles'

const BADGE: Record<StatutAletheia, { texte: string; classe: string }> = {
  DRAFT: { texte: 'À commencer', classe: 'bg-parchemin-fonce text-muet' },
  V1_SUBMITTED: { texte: 'Travail soumis', classe: 'bg-attention-teinte text-attention' },
  FEEDBACK1_READY: { texte: 'Retour à lire', classe: 'bg-attention-teinte text-attention' },
  VF_SUBMITTED: { texte: 'Version finale soumise', classe: 'bg-attention-teinte text-attention' },
  FEEDBACK2_READY: { texte: 'Retour final à valider', classe: 'bg-attention-teinte text-attention' },
  DONE: { texte: 'Terminée', classe: 'bg-pigment-teinte text-pigment' },
}

/**
 * ⭐⭐ C5-L2 — LES EXERCICES DE LECTURE À FAIRE À LA MAISON.
 *
 * ⚠️ **AVANT CE LOT, ILS N'APPARAISSAIENT NULLE PART.** Cette page ne rendait,
 *    du moteur, que `signauxDeLancement(admin, user.id, 'aletheia')` — les
 *    passations de CLASSE déjà ouvertes par le professeur —, et la seule liste
 *    d'exercices maison, celle de Codex, écartait délibérément tout ce qui n'est
 *    pas `composer` (C4-L6). *Un exercice conçu et assigné était invisible.*
 *
 * ⛔ **CE N'EST PAS UN ONGLET** : les onglets de la lecture sont `C5-L4`, et
 *    `configModules.ts` n'est pas touché. C'est une LISTE, à un endroit qui
 *    existe déjà, et un `href`.
 *
 * ⭐ La lecture, sa porte (`exercices_actif`) et le tri vivent dans le module
 *    partagé : cet écran n'a AUCUNE règle. Les jetons sont ceux de `globals.css`.
 */
const PASTILLE: Record<TonEtat, string> = {
  a_lire:   'bg-attention-teinte text-attention',
  a_faire:  'bg-info-teinte text-info',
  en_cours: 'bg-info-teinte text-info',
  attente:  'bg-parchemin-fonce text-muet',
  clos:     'bg-parchemin-fonce text-muet',
}

function fmtJourMois(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function CarteMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 pb-8">
      <Link href="/eleve" className="text-sm text-muet hover:text-encre-douce">← Retour</Link>
      <div className="bg-surface border border-bordure rounded-xl p-8 flex flex-col items-center text-center">
        <span className="opacity-70"><Pastille module="aletheia" size={56} /></span>
        <p className="font-marque text-sm font-semibold tracking-[0.2em] text-pigment mt-3">ALETHEIA</p>
        <p className="font-corps text-sm text-encre-douce mt-2 max-w-sm">{children}</p>
      </div>
    </div>
  )
}

export default async function PageAletheia() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { moduleActif, inscriptions, active, toutes, horsClasse } = await contexteAletheia(supabase, user.id)
  if (!moduleActif) return <CarteMessage>Ce module n&apos;est pas encore activé.</CarteMessage>
  if (!active) return <CarteMessage>Ce module n&apos;est pas disponible pour ton compte.</CarteMessage>
  // C7·L2 — les livres se lisent par classe : en état « Toutes », on la demande.
  if (toutes) return <ChoixClasseModule inscriptions={inscriptions} nomModule="Aletheia" />
  // Accès & classes · L1 — la classe au commutateur n'a pas Aletheia : le repli
  // silencieux sur une autre inscription montrait les livres d'une classe sous
  // le nom d'une autre. On le dit, et on renvoie au commutateur.
  if (horsClasse) {
    return <ModuleHorsClasse nomModule="Aletheia" classeContexte={horsClasse} ailleurs={inscriptions.map(i => i.classe_nom)} />
  }

  const livres = await livresPourClasse(admin, active.classe_id)
  const travauxParLivre = new Map(
    await Promise.all(livres.map(async l => [l.id, await travauxParSemaine(admin, user.id, l.id)] as const)),
  )
  // Capstone = carte du LIVRE, partagée. L'élève ne la voit qu'après avoir lui-même
  // tout terminé (bloc rendu sous `toutesDone`) → pas de spoiler de l'aval.
  const capstoneParLivre = new Map(
    await Promise.all(livres.map(async l => [l.id, await chargerCapstoneLivre(admin, l.id)] as const)),
  )
  const { deblocageSequentiel } = await lireReglages(admin)
  // C4-L9 — le signal du LANCEMENT (jamais celui de l'assignation, qui est
  // C6-L2). Lecture par le SERVEUR, filtrée sur `eleve_id`.
  const signaux = await signauxDeLancement(admin, user.id, 'aletheia')
  // ⭐ C5-L2 — la maison, enfin. ⚠️ La classe en contexte borne la liste
  //    (« dans les modules on reste par classe », `01-` §2) ; la porte, elle,
  //    est `exercices_actif` et se lit DANS le module, jamais ici.
  const [porteExercices, exercices] = await Promise.all([
    lireLaPorte(admin),
    exercicesMaisonDeLEleve(admin, user.id, active.classe_id, 'aletheia'),
  ])

  return (
    <div className="space-y-8 pb-8">
      <Link href="/eleve" className="text-sm text-muet hover:text-encre-douce">← Retour</Link>

      <SignalDeLancement signaux={signaux} />

      {/* ── ⭐⭐ C5-L2 — CE QUI SE FAIT À LA MAISON, À L'ÉCRAN ──────────────
          « Lecture formative, à la maison — Aletheia — ÉCRAN, y compris les
          analyses longues » (`06-` §1). ⛔ Le bloc ne s'affiche que s'il y a
          quelque chose : cette page porte d'abord les LIVRES, et un encart vide
          au-dessus d'eux ferait croire à une panne. Le vide s'explique là où il
          se remarque — sous les livres, quand la porte est fermée. */}
      {exercices.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-titre text-xl text-encre">Mes exercices de lecture</h2>
          <p className="font-corps text-sm text-muet">
            Ce que tu travailles <strong>à la maison</strong>, à l&apos;écran.
          </p>
          <div className="space-y-2">
            {exercices.map((e) => (
              <Link
                key={e.depotId}
                href={e.href}
                className="flex items-center justify-between gap-3 bg-surface border border-bordure rounded-xl px-4 py-3 hover:border-pigment transition-colors"
              >
                <p className="text-sm font-medium text-encre truncate min-w-0">{e.titre}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${PASTILLE[e.etat.ton]}`}>
                  {e.etat.libelle}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ⭐ UN VIDE EXPLIQUÉ, JAMAIS UN ÉCRAN QUI SE TAIT (`07-` §5 ; `06-` §5).
          ⚠️ Seulement quand la PORTE est fermée : « aucun exercice » n'est pas
          une nouvelle sur une page qui porte d'abord des livres, mais « ils ne
          sont pas encore ouverts » en est une — et l'élève n'a pas à connaître
          le nom d'un interrupteur pour comprendre pourquoi son écran est vide. */}
      {exercices.length === 0 && !porteExercices.exercicesActifs && (
        <p className="font-corps text-sm text-muet">
          Les exercices de lecture ne sont pas encore ouverts. Ton professeur
          t&apos;indiquera quand ils commencent.
        </p>
      )}

      {livres.length === 0 ? (
        <CarteMessage>Aucun livre ne t&apos;est assigné pour le moment.</CarteMessage>
      ) : (
        livres.map(livre => {
          const travaux = travauxParLivre.get(livre.id)
          const cap = capstoneParLivre.get(livre.id)
          const ordered = [...livre.semaines].sort((a, b) => a.semaine - b.semaine)
          const total = ordered.length
          const numerosSemaines = ordered.map(s => s.semaine)
          const doneSet = new Set(ordered.filter(s => travaux?.get(s.semaine)?.statut === 'DONE').map(s => s.semaine))
          const nbDone = doneSet.size
          const toutesDone = total > 0 && nbDone === total
          // Séance courante = 1ʳᵉ non terminée et débloquée (comparaison sur l'ordinal d'ORIGINE).
          const couranteSeance = ordered.find(s =>
            (travaux?.get(s.semaine)?.statut ?? 'DRAFT') !== 'DONE'
            && estSemaineDebloquee(numerosSemaines, doneSet, s.semaine, deblocageSequentiel),
          )
          const couranteNum = couranteSeance?.semaine
          // Compteur affiché : en mode C, la taille de l'EXTRAIT (jamais le total du livre, qui fuiterait).
          const nbSemaines = livre.mode === 'C' ? total : (livre.nb_semaines ?? total)

          return (
            <section key={livre.id} className="space-y-5">
              {/* ── En-tête du livre (l'identité Aletheia est portée par la Barre 2 de l'en-tête) ── */}
              <div className="min-w-0">
                <h2 className="font-titre text-2xl sm:text-3xl text-encre leading-tight">{livre.titre}</h2>
                {livre.auteur && <p className="font-corps text-sm text-muet mt-0.5 italic">{livre.auteur}</p>}
                <p className="font-corps text-sm text-muet mt-1">{nbSemaines} séance{nbSemaines > 1 ? 's' : ''} · lis-le dans ton propre exemplaire{!livre.gouverne && ' · sans échéances'}</p>
              </div>

              {/* ── Barre d'avancement ─────────────────────────────────────── */}
              {total > 0 && (
                <div className="bg-surface border border-bordure rounded-xl px-4 py-3 flex items-center gap-3 sm:gap-4">
                  <span className="font-titre whitespace-nowrap shrink-0">
                    <span className="text-2xl font-semibold text-pigment">{nbDone}</span>
                    <span className="text-muet text-base"> / {total}</span>
                  </span>
                  <span className="font-ui text-sm text-encre-douce whitespace-nowrap shrink-0 hidden sm:inline">séances terminées</span>
                  <div className="flex-1 h-2 bg-bordure rounded-full overflow-hidden">
                    <div className="h-full bg-pigment transition-all" style={{ width: `${Math.round((nbDone / total) * 100)}%` }} />
                  </div>
                  {couranteSeance != null && (
                    <span className="font-ui text-xs text-pigment bg-pigment-teinte px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">Séance {couranteSeance.numero} t&apos;attend</span>
                  )}
                </div>
              )}

              {/* ── Liste des semaines ─────────────────────────────────────── */}
              <div className="flex flex-col gap-2">
                {ordered.map(s => {
                  const tw = travaux?.get(s.semaine)
                  const statut = tw?.statut ?? 'DRAFT'
                  const finLe = fmtJourMois(tw?.retour_vf_lu_at ?? tw?.updated_at)
                  const debloquee = estSemaineDebloquee(numerosSemaines, doneSet, s.semaine, deblocageSequentiel)
                  const courante = s.semaine === couranteNum
                  const href = `/eleve/modules/aletheia/${livre.id}/${s.semaine}`

                  if (!debloquee) {
                    return (
                      <div key={s.semaine} className="bg-parchemin border border-bordure rounded-xl px-4 py-3 flex items-center gap-3 sm:gap-4 opacity-60" title="Termine la séance précédente pour débloquer celle-ci.">
                        <span className="font-titre text-xl sm:text-2xl text-muet w-5 sm:w-6 text-center shrink-0">{s.numero}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-corps text-sm sm:text-base text-encre-douce truncate">{s.titre}</p>
                          {(s.chapitres || s.dateIndicative) && (
                            <p className="hidden sm:block text-xs text-muet mt-0.5 truncate">
                              {s.chapitres}{s.chapitres && s.dateIndicative && ' · '}{s.dateIndicative && `à rendre le ${s.dateIndicative}`}
                            </p>
                          )}
                        </div>
                        <span className="font-ui text-xs text-muet whitespace-nowrap shrink-0">🔒 Verrouillée</span>
                      </div>
                    )
                  }

                  const action = statut === 'DONE' ? 'Revoir →' : statut === 'DRAFT' ? 'Ouvrir →' : 'Continuer →'
                  const actionClasse = statut === 'DONE' || statut === 'DRAFT' ? 'text-pigment' : 'text-bouton font-medium'
                  const b = BADGE[statut]

                  return (
                    <Link
                      key={s.semaine}
                      href={href}
                      className={`rounded-xl px-4 py-3 flex items-center gap-3 sm:gap-4 transition-colors ${
                        courante
                          ? 'bg-pigment-teinte border border-bordure border-l-4 border-l-pigment'
                          : 'bg-surface border border-bordure hover:bg-parchemin-fonce'
                      }`}
                    >
                      <span className={`font-titre text-xl sm:text-2xl w-5 sm:w-6 text-center shrink-0 ${courante ? 'text-pigment' : 'text-muet'}`}>{s.numero}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-corps text-sm sm:text-base text-encre truncate ${courante ? 'font-medium' : ''}`}>{s.titre}</p>
                        <p className="hidden sm:block text-xs text-muet mt-0.5 truncate">
                          {s.chapitres && <span className="text-pigment">{s.chapitres}</span>}
                          {s.chapitres && (statut === 'DONE' ? finLe : s.dateIndicative) && ' · '}
                          {statut === 'DONE'
                            ? (finLe ? <span>terminée le {finLe}</span> : <span>terminée</span>)
                            : (s.dateIndicative && <span>à rendre le {s.dateIndicative}</span>)}
                        </p>
                        {/* Mobile : les 4 points sous le titre (le sous-titre est masqué). */}
                        <div className="sm:hidden mt-2"><MicroStepper statut={statut} taille="petit" /></div>
                      </div>
                      {/* Desktop : points + badge en colonnes dédiées. */}
                      <div className="hidden sm:flex shrink-0"><MicroStepper statut={statut} /></div>
                      {/* État porté aux lecteurs d'écran (le badge visuel est masqué < sm, le stepper est aria-hidden). */}
                      <span className="sr-only">État : {b.texte}</span>
                      <span className={`hidden sm:inline-block font-ui text-xs ${b.classe} px-2.5 py-1 rounded-full text-center shrink-0 w-[112px]`}>{b.texte}</span>
                      <span className={`font-ui text-xs sm:text-sm whitespace-nowrap shrink-0 text-right ${actionClasse} sm:w-[72px]`}>{action}</span>
                    </Link>
                  )
                })}
              </div>

              {/* ── Capstone : carte du livre (uniquement si le livre a des semaines) ── */}
              {total > 0 && (livre.mode === 'C' ? (
                // (mode C) Le capstone visé = carte-de-parcours (C2, futur). Le book capstone
                // (livre entier) est INTERDIT ici (spoiler aval) : placeholder SANS lien vers
                // .../capstone tant que C2 n'est pas livré. Dormant sous gate OFF (mode ≠ C).
                <div className="border border-dashed border-bordure rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-muet" aria-hidden>✦</span>
                  <span className="font-corps text-sm text-muet flex-1">La carte du parcours sera bientôt disponible.</span>
                  {!toutesDone && <span className="font-ui text-xs text-muet whitespace-nowrap shrink-0">🔒 {nbDone}/{total}</span>}
                </div>
              ) : toutesDone ? (
                cap?.statut === 'READY' ? (
                  <Link href={`/eleve/modules/aletheia/${livre.id}/capstone`}
                    className="block w-full text-center bg-bouton text-surface py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-colors">
                    ✦ Voir la carte d&apos;architecture du livre →
                  </Link>
                ) : (
                  <div className="border border-dashed border-bordure rounded-xl px-4 py-3 text-sm text-muet text-center">
                    Tu as terminé le livre ! La carte d&apos;architecture sera bientôt disponible.
                  </div>
                )
              ) : (
                <div className="border border-dashed border-bordure rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-muet" aria-hidden>✦</span>
                  <span className="font-corps text-sm text-muet flex-1">La carte d&apos;architecture du livre se révèle quand les {total} séances sont terminées.</span>
                  <span className="font-ui text-xs text-muet whitespace-nowrap shrink-0">🔒 {nbDone}/{total}</span>
                </div>
              ))}
            </section>
          )
        })
      )}
    </div>
  )
}
