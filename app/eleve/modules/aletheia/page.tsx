import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { chargerCapstoneLivre, contexteAletheia, estSemaineDebloquee, lireReglages, livresPourClasse, travauxParSemaine } from './data'
import { indexEtape } from './etapes'
import Pastille from '@/components/Pastille'
import type { StatutAletheia } from './types'

const BADGE: Record<StatutAletheia, { texte: string; classe: string }> = {
  DRAFT: { texte: 'À commencer', classe: 'bg-parchemin-fonce text-muet' },
  V1_SUBMITTED: { texte: 'Travail soumis', classe: 'bg-attention-teinte text-attention' },
  FEEDBACK1_READY: { texte: 'Retour à lire', classe: 'bg-attention-teinte text-attention' },
  VF_SUBMITTED: { texte: 'Version finale soumise', classe: 'bg-attention-teinte text-attention' },
  FEEDBACK2_READY: { texte: 'Retour final à valider', classe: 'bg-attention-teinte text-attention' },
  DONE: { texte: 'Terminée', classe: 'bg-pigment-teinte text-pigment' },
}

function fmtJourMois(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Micro-stepper : 4 points = les 4 étapes (Lecture · Retour · Réécriture · Retour
// final). Plein (ok) = passé · pigment = courant · creux = à venir. DONE = 4 pleins.
function MicroStepper({ statut, taille = 'normal' }: { statut: StatutAletheia; taille?: 'normal' | 'petit' }) {
  const courant = indexEtape(statut)
  const done = statut === 'DONE'
  const d = taille === 'petit' ? 'w-[7px] h-[7px]' : 'w-2.5 h-2.5'
  return (
    <div className={`flex ${taille === 'petit' ? 'gap-1' : 'gap-1.5'}`} aria-hidden>
      {[0, 1, 2, 3].map((i) => {
        const plein = done || i < courant
        const actif = !done && statut !== 'DRAFT' && i === courant
        return <span key={i} className={`${d} rounded-full ${plein || actif ? 'bg-pigment' : 'border border-bordure'}`} />
      })}
    </div>
  )
}

function CarteMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 pb-8">
      <Link href="/eleve" className="text-sm text-muet hover:text-encre-douce">← Retour</Link>
      <div className="bg-surface border border-bordure rounded-xl p-8 flex flex-col items-center text-center">
        <span className="opacity-70"><Pastille module="aletheia" size={56} /></span>
        <p className="font-marque text-sm font-semibold tracking-[0.2em] text-pigment mt-3">ALETHEIA</p>
        <p className="font-corps text-sm text-muet mt-2 max-w-sm">{children}</p>
      </div>
    </div>
  )
}

export default async function PageAletheia() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { moduleActif, active } = await contexteAletheia(supabase, user.id)
  if (!moduleActif) return <CarteMessage>Ce module n&apos;est pas encore activé.</CarteMessage>
  if (!active) return <CarteMessage>Ce module n&apos;est pas disponible pour ton compte.</CarteMessage>

  const livres = await livresPourClasse(admin, active.classe_id)
  const travauxParLivre = new Map(
    await Promise.all(livres.map(async l => [l.id, await travauxParSemaine(supabase, user.id, l.id)] as const)),
  )
  // Capstone = carte du LIVRE, partagée. L'élève ne la voit qu'après avoir lui-même
  // tout terminé (bloc rendu sous `toutesDone`) → pas de spoiler de l'aval.
  const capstoneParLivre = new Map(
    await Promise.all(livres.map(async l => [l.id, await chargerCapstoneLivre(admin, l.id)] as const)),
  )
  const { deblocageSequentiel } = await lireReglages(admin)

  return (
    <div className="space-y-8 pb-8">
      <Link href="/eleve" className="text-sm text-muet hover:text-encre-douce">← Retour</Link>

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
          // Semaine courante = 1ʳᵉ non terminée et débloquée.
          const couranteNum = ordered.find(s =>
            (travaux?.get(s.semaine)?.statut ?? 'DRAFT') !== 'DONE'
            && estSemaineDebloquee(numerosSemaines, doneSet, s.semaine, deblocageSequentiel),
          )?.semaine
          const nbSemaines = livre.nb_semaines ?? total

          return (
            <section key={livre.id} className="space-y-5">
              {/* ── Héros : le sceau remis en valeur ───────────────────────── */}
              <div className="flex items-center gap-4 sm:gap-5">
                <span className="sm:hidden"><Pastille module="aletheia" size={64} /></span>
                <span className="hidden sm:block"><Pastille module="aletheia" size={92} /></span>
                <div className="min-w-0">
                  <p className="font-marque text-sm font-semibold tracking-[0.2em] text-pigment">ALETHEIA</p>
                  <h2 className="font-titre text-2xl sm:text-3xl text-encre leading-tight mt-0.5">{livre.titre}</h2>
                  <p className="font-corps text-sm text-muet mt-1">{nbSemaines} semaine{nbSemaines > 1 ? 's' : ''} · lis-le dans ton propre exemplaire</p>
                </div>
              </div>

              {/* ── Barre d'avancement ─────────────────────────────────────── */}
              {total > 0 && (
                <div className="bg-surface border border-bordure rounded-xl px-4 py-3 flex items-center gap-3 sm:gap-4">
                  <span className="font-titre whitespace-nowrap shrink-0">
                    <span className="text-2xl font-semibold text-pigment">{nbDone}</span>
                    <span className="text-muet text-base"> / {total}</span>
                  </span>
                  <span className="font-ui text-sm text-encre-douce whitespace-nowrap shrink-0 hidden sm:inline">semaines terminées</span>
                  <div className="flex-1 h-2 bg-bordure rounded-full overflow-hidden">
                    <div className="h-full bg-pigment transition-all" style={{ width: `${Math.round((nbDone / total) * 100)}%` }} />
                  </div>
                  {couranteNum != null && (
                    <span className="font-ui text-xs text-pigment bg-pigment-teinte px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">Semaine {couranteNum} t&apos;attend</span>
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
                      <div key={s.semaine} className="bg-parchemin border border-bordure rounded-xl px-4 py-3 flex items-center gap-3 sm:gap-4 opacity-60" title="Termine la semaine précédente pour débloquer celle-ci.">
                        <span className="font-titre text-xl sm:text-2xl text-muet w-5 sm:w-6 text-center shrink-0">{s.semaine}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-corps text-sm sm:text-base text-encre-douce truncate">{s.titre}</p>
                          {(s.chapitres || s.dateIndicative) && (
                            <p className="hidden sm:block text-xs text-muet mt-0.5 truncate">
                              {s.chapitres}{s.chapitres && s.dateIndicative && ' · '}{s.dateIndicative && `à partir du ${s.dateIndicative}`}
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
                      <span className={`font-titre text-xl sm:text-2xl w-5 sm:w-6 text-center shrink-0 ${courante ? 'text-pigment' : 'text-muet'}`}>{s.semaine}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-corps text-sm sm:text-base text-encre truncate ${courante ? 'font-medium' : ''}`}>{s.titre}</p>
                        <p className="hidden sm:block text-xs text-muet mt-0.5 truncate">
                          {s.chapitres && <span className="text-pigment">{s.chapitres}</span>}
                          {s.chapitres && (statut === 'DONE' ? finLe : s.dateIndicative) && ' · '}
                          {statut === 'DONE'
                            ? (finLe ? <span>terminée le {finLe}</span> : <span>terminée</span>)
                            : (s.dateIndicative && <span>à partir du {s.dateIndicative}</span>)}
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
              {total > 0 && (toutesDone ? (
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
                  <span className="font-corps text-sm text-muet flex-1">La carte d&apos;architecture du livre se révèle quand les {total} semaines sont terminées.</span>
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
