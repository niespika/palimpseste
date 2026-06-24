import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { contexteAletheia, livreAccessible, semaineLivre, travauxParSemaine, peutAccederSemaine, lireReglages } from '../../data'
import FormulaireV1 from '../../FormulaireV1'
import FormulaireVf from '../../FormulaireVf'
import BoutonLectureRetourVf from '../../BoutonLectureRetourVf'
import PollStatut from '../../PollStatut'
import { VueRetourV1, VueRetourVF } from '@/components/aletheia/VueRetours'
import AtelierDeuxColonnes from '@/components/AtelierDeuxColonnes'
import Pastille from '@/components/Pastille'
import { ETAPES_SEMAINE, indexEtape } from '../../etapes'
import type { TravailAletheia, StatutAletheia } from '../../types'

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-bordure rounded-xl p-5 space-y-3">
      <h3 className="font-medium text-encre">{titre}</h3>
      {children}
    </section>
  )
}

// Stepper de progression — situe l'élève dans le parcours de la semaine.
function Stepper({ statut }: { statut: StatutAletheia }) {
  const courant = indexEtape(statut)
  return (
    <ol className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 text-xs">
      {ETAPES_SEMAINE.map((label, i) => {
        const fait = i < courant
        const actif = i === courant
        return (
          <li key={label} className="flex items-center gap-1.5 shrink-0">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
              fait ? 'bg-ok text-surface' : actif ? 'bg-pigment text-surface' : 'bg-parchemin-fonce text-muet'
            }`}>
              {fait ? '✓' : i + 1}
            </span>
            <span className={`font-ui whitespace-nowrap ${actif ? 'text-pigment font-medium' : fait ? 'text-encre-douce' : 'text-muet'}`}>{label}</span>
            {i < ETAPES_SEMAINE.length - 1 && <span className="text-bordure" aria-hidden>·</span>}
          </li>
        )
      })}
    </ol>
  )
}

function Champ({ label, valeur }: { label: string; valeur: string | null }) {
  if (!valeur) return null
  return (
    <div>
      <p className="text-xs font-medium text-muet mb-0.5">{label}</p>
      <p className="text-sm text-encre-douce whitespace-pre-wrap">{valeur}</p>
    </div>
  )
}

function ListeChamp({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null
  return (
    <div>
      <p className="text-xs font-medium text-muet mb-0.5">{label}</p>
      <ul className="list-disc list-inside space-y-0.5 text-sm text-encre-douce">
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  )
}

// Date ISO → « JJ/MM ».
function fmtJourMois(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Ligne « Revoir le détail » repliée (archive d'une semaine terminée).
function Repli({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <details className="bg-surface border border-bordure rounded-xl group">
      <summary className="cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden px-4 py-3 min-h-[44px] flex items-center gap-3">
        <span className="text-muet text-xs transition-transform group-open:rotate-90" aria-hidden>▸</span>
        <span className="font-corps text-sm text-encre flex-1">{titre}</span>
        <span className="font-ui text-xs text-muet shrink-0 group-open:hidden">déplier</span>
      </summary>
      <div className="px-4 pb-4 pt-1 border-t border-bordure space-y-3">{children}</div>
    </details>
  )
}

// Revue d'une semaine terminée (DONE) — archive hiérarchisée : synthèse à relire,
// avant/après, dévoilement, détail replié. Réutilise l'atelier 2 colonnes pour le
// même langage visuel. Aucune logique d'état : pure lecture du travail clos.
function RevueDone({ t, evalQuestions }: { t: TravailAletheia; evalQuestions: boolean }) {
  const rv = t.retour_vf!
  const amont = rv.architecture_amont ?? []
  const aval = rv.architecture_aval_jalons ?? []
  return (
    <div className="space-y-5">
      {/* 1. La synthèse modèle — le « keeper », tout en haut. */}
      {rv.synthese_modele && (
        <section className="bg-surface border border-bordure border-l-4 border-l-pigment rounded-xl p-4 sm:p-5">
          <p className="font-ui text-xs tracking-[0.1em] text-pigment uppercase mb-2">★ À relire — la synthèse modèle</p>
          <p className="font-corps text-base text-encre leading-relaxed whitespace-pre-wrap">{rv.synthese_modele}</p>
        </section>
      )}

      {/* 2. Ton chemin — avant / après (premier jet ↔ version finale). */}
      {(t.these || t.these_vf) && (
        <div>
          <p className="font-ui text-xs tracking-[0.1em] text-muet uppercase mb-2">Ton chemin — du premier jet à la version finale</p>
          <AtelierDeuxColonnes
            labelRetour="Ton premier jet"
            labelFormulaire="Ta version finale"
            suffixeRetour={null}
            retourOuvertMobile={false}
            retour={
              <div className="bg-parchemin-fonce border border-bordure rounded-xl p-4 h-full">
                <p className="text-sm text-encre-douce italic whitespace-pre-wrap leading-relaxed">{t.these || '—'}</p>
              </div>
            }
            formulaire={
              <div className="bg-surface border border-bordure border-l-4 border-l-pigment rounded-xl p-4 h-full">
                <p className="text-sm text-encre whitespace-pre-wrap leading-relaxed">{t.these_vf || '—'}</p>
              </div>
            }
          />
        </div>
      )}

      {/* 3. Ce que cette semaine t'a dévoilé — le fil entre les semaines. */}
      {(amont.length > 0 || aval.length > 0) && (
        <section className="bg-surface border border-bordure border-l-4 border-l-ok rounded-xl p-4 sm:p-5 space-y-3">
          <p className="font-ui text-xs tracking-[0.1em] text-ok uppercase">Ce que cette semaine t&apos;a dévoilé</p>
          {amont.length > 0 && (
            <div>
              <p className="text-xs text-muet mb-1">Ce que tu as déjà vu</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-encre-douce">{amont.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
          {aval.length > 0 && (
            <div>
              <p className="text-xs text-muet mb-1">Jalons à venir</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-encre-douce">{aval.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
        </section>
      )}

      {/* 4. Revoir le détail — replié par défaut, rien n'est perdu. */}
      <div className="space-y-2">
        <p className="font-ui text-xs tracking-[0.1em] text-muet uppercase">Revoir le détail</p>
        {t.retour_v1 && (
          <Repli titre="Ton retour socratique — relances & réponses à tes questions">
            <VueRetourV1 retour={t.retour_v1} montrerRemarque={evalQuestions} />
          </Repli>
        )}
        <Repli titre="Le retour final complet — nuances, ajouts vérifiés">
          <VueRetourVF retour={rv} />
        </Repli>
        <Repli titre="Ta saisie initiale — arguments, accord, questions, vocabulaire">
          <Champ label="Arguments" valeur={t.arguments} />
          <Champ label="Ton accord" valeur={t.accord} />
          <ListeChamp label="Tes questions" items={t.questions ?? []} />
          <ListeChamp label="Vocabulaire" items={t.vocabulaire ?? []} />
        </Repli>
      </div>
    </div>
  )
}

export default async function PageSemaineAletheia({ params }: { params: Promise<{ livreId: string; semaine: string }> }) {
  const { livreId, semaine: semaineStr } = await params
  const semaine = Number(semaineStr)
  if (!Number.isInteger(semaine) || semaine < 1) notFound()

  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Accès : module actif + livre assigné à la classe ACTIVE (inscrite au module).
  const { moduleActif, active } = await contexteAletheia(supabase, user.id)
  if (!moduleActif || !active) notFound()
  if (!(await livreAccessible(admin, [active.classe_id], livreId))) notFound()

  const sem = await semaineLivre(admin, livreId, semaine)
  if (!sem) notFound()

  const { data: livre } = await admin.from('scriptorium_unites').select('label').eq('id', livreId).maybeSingle()

  // Déblocage séquentiel (Lot 6 D) : semaine verrouillée tant que la précédente n'est pas DONE.
  if (!(await peutAccederSemaine(admin, user.id, livreId, semaine))) {
    return (
      <div className="space-y-5 pb-8">
        <Link href="/eleve/modules/aletheia" className="text-sm text-muet hover:text-encre-douce">← Planning</Link>
        <div className="bg-surface border border-bordure rounded-xl p-6 text-center text-muet text-sm">
          🔒 Cette semaine n&apos;est pas encore débloquée. Termine d&apos;abord la semaine précédente.
        </div>
      </div>
    )
  }

  const { evalQuestions, aides } = await lireReglages(admin)
  const travaux = await travauxParSemaine(supabase, user.id, livreId)
  const t: TravailAletheia | null = travaux.get(semaine) ?? null
  const statut = t?.statut ?? 'DRAFT'
  // Date de clôture : retour_vf_lu_at (posé exactement à FEEDBACK2_READY→DONE),
  // repli sur updated_at par robustesse.
  const dateFin = fmtJourMois(t?.retour_vf_lu_at ?? t?.updated_at)

  // Pilotage par statut. Les états transitoires *_SUBMITTED (l'IA prépare le retour
  // en arrière-plan via after()) sont réels : on montre l'étape précédente + un
  // message d'attente, et la page se rafraîchit via PollStatut.
  const v1Soumis = statut !== 'DRAFT'
  const enAttenteRetour1 = statut === 'V1_SUBMITTED'
  const enAttenteRetour2 = statut === 'VF_SUBMITTED'
  const echecRetour1 = statut === 'DRAFT' && !!t?.retour_v1_erreur_at
  const echecRetour2 = statut === 'FEEDBACK1_READY' && !!t?.retour_vf_erreur_at

  return (
    <div className="space-y-5 pb-8">
      <PollStatut actif={enAttenteRetour1 || enAttenteRetour2} livreId={livreId} semaine={semaine} />
      <Link href="/eleve/modules/aletheia" className="text-sm text-muet hover:text-encre-douce">← Planning</Link>

      <div>
        <div className="flex items-center gap-4">
          <Pastille module="aletheia" size={56} />
          <div className="min-w-0 flex-1">
            <p className="font-marque text-sm font-semibold tracking-[0.18em] text-pigment">ALETHEIA</p>
            <h2 className="font-titre text-2xl text-encre leading-tight">Semaine {semaine} — {sem.titre}</h2>
          </div>
          {statut === 'DONE' && (
            <span className="font-ui text-xs sm:text-sm text-ok bg-ok-teinte px-3 py-1.5 rounded-full whitespace-nowrap shrink-0">
              ✓ Terminée{dateFin ? ` le ${dateFin}` : ''}
            </span>
          )}
        </div>
        {statut !== 'DONE' && (
          <>
            {livre?.label && <p className="text-xs text-muet mt-3">{livre.label as string}</p>}
            <p className="text-sm text-muet mt-1">
              {sem.chapitres && <span className="text-pigment">{sem.chapitres}</span>}
              {sem.chapitres && sem.dateIndicative && ' · '}
              {sem.dateIndicative && <span>à partir du {sem.dateIndicative}</span>}
            </p>
            <p className="text-xs text-muet mt-2">Lis ces chapitres dans ton propre exemplaire, puis rédige ci-dessous.</p>
          </>
        )}
      </div>

      <Stepper statut={statut} />

      {/* Semaine terminée : archive hiérarchisée (Chantier 3). Les autres états
          conservent la pile inchangée. */}
      {statut === 'DONE' && t?.retour_vf ? (
        <RevueDone t={t} evalQuestions={evalQuestions} />
      ) : (
       <>
      {echecRetour1 && (
        <div className="bg-retard-teinte border border-retard rounded-xl px-4 py-3 text-sm text-retard">
          La préparation de ton retour n&apos;a pas abouti. Renvoie ton travail ci-dessous ; si le problème persiste, préviens ton professeur.
        </div>
      )}

      {/* Étape 1 — saisie 5 champs */}
      {!v1Soumis ? (
        <Bloc titre="1. Ta lecture de la semaine">
          <FormulaireV1
            livreId={livreId}
            semaine={semaine}
            theseInitial={t?.these ?? ''}
            argumentsInitial={t?.arguments ?? ''}
            accordInitial={t?.accord ?? ''}
            questionsInitial={(t?.questions ?? []).join('\n')}
            vocabulaireInitial={(t?.vocabulaire ?? []).join('\n')}
            aides={aides}
          />
        </Bloc>
      ) : (
        <Bloc titre="1. Ta lecture de la semaine">
          <Champ label="Idée principale" valeur={t?.these ?? null} />
          <Champ label="Arguments" valeur={t?.arguments ?? null} />
          <Champ label="Ton accord" valeur={t?.accord ?? null} />
          <ListeChamp label="Tes questions" items={t?.questions ?? []} />
          <ListeChamp label="Vocabulaire" items={t?.vocabulaire ?? []} />
        </Bloc>
      )}

      {enAttenteRetour1 && <p className="text-sm text-muet">Ton retour est en cours de préparation…</p>}

      {/* Étape de réécriture — atelier 2 colonnes : le retour reste sous les yeux. */}
      {statut === 'FEEDBACK1_READY' && t?.retour_v1 ? (
        <>
          {echecRetour2 && (
            <div className="bg-retard-teinte border border-retard rounded-xl px-4 py-3 text-sm text-retard">
              La préparation de ton retour n&apos;a pas abouti. Renvoie ta version finale ci-dessous ; si le problème persiste, préviens ton professeur.
            </div>
          )}
          <AtelierDeuxColonnes
            labelRetour="Ton retour"
            labelFormulaire="Ta version finale"
            retour={<VueRetourV1 retour={t.retour_v1} montrerRemarque={evalQuestions} />}
            formulaire={
              <div className="bg-surface border border-bordure rounded-xl p-4 sm:p-5">
                <FormulaireVf
                  livreId={livreId}
                  semaine={semaine}
                  theseInitial={t?.these_vf ?? t?.these ?? ''}
                  argumentsInitial={t?.arguments_vf ?? t?.arguments ?? ''}
                  accordInitial={t?.accord_vf ?? t?.accord ?? ''}
                />
              </div>
            }
          />
        </>
      ) : (
        <>
          {/* Retour V1 (états non-réécriture : reste en pile) */}
          {t?.retour_v1 && (
            <Bloc titre="2. Retour — pour creuser">
              <VueRetourV1 retour={t.retour_v1} montrerRemarque={evalQuestions} />
            </Bloc>
          )}
          {/* Version finale, en lecture seule */}
          {t?.these_vf && (
            <Bloc titre="3. Ta version finale">
              <Champ label="Idée principale" valeur={t?.these_vf ?? null} />
              <Champ label="Arguments" valeur={t?.arguments_vf ?? null} />
              <Champ label="Ton accord" valeur={t?.accord_vf ?? null} />
            </Bloc>
          )}
        </>
      )}

      {enAttenteRetour2 && <p className="text-sm text-muet">Ton retour final est en cours de préparation…</p>}

      {/* Retour VF + validation de lecture */}
      {t?.retour_vf && (
        <Bloc titre="4. Retour final — synthèse et architecture">
          <VueRetourVF retour={t.retour_vf} />
          {statut === 'FEEDBACK2_READY' ? (
            <div className="pt-2">
              <p className="text-xs text-muet mb-2">Pour clore la semaine, confirme que tu as lu ce retour.</p>
              <BoutonLectureRetourVf livreId={livreId} semaine={semaine} />
            </div>
          ) : (
            <p className="text-sm text-ok pt-2">✓ Semaine terminée.</p>
          )}
        </Bloc>
      )}
       </>
      )}
    </div>
  )
}
