import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { contexteAletheia, livreAccessible, semaineLivre, travauxParSemaine, peutAccederSemaine, lireReglages } from '../../data'
import { validerLectureRetourVf } from '../../actions'
import FormulaireV1 from '../../FormulaireV1'
import FormulaireVf from '../../FormulaireVf'
import PollStatut from '../../PollStatut'
import { VueRetourV1, VueRetourVF, bullesVF, type Accent } from '@/components/aletheia/VueRetours'
import ValidationLecture from '@/components/retours/ValidationLecture'
import BanniereRetoursNonLus from '@/components/retours/BanniereRetoursNonLus'
import { retoursNonLus } from '@/utils/retours-lus'
import AtelierDeuxColonnes from '@/components/AtelierDeuxColonnes'
import Pastille from '@/components/Pastille'
import { StepperNomme } from '@/components/aletheia/Steppers'
import type { TravailAletheia } from '../../types'

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-bordure rounded-xl p-5 space-y-3">
      <h3 className="font-medium text-encre">{titre}</h3>
      {children}
    </section>
  )
}

// Écran d'attente épuré pendant qu'un retour IA se prépare en arrière-plan
// (états transitoires V1_SUBMITTED / VF_SUBMITTED). Même langage que l'écran
// capstone « se prépare ». Le polling/relance est porté par PollStatut.
function TuileAttente({ titre, sousTitre }: { titre: string; sousTitre: string }) {
  return (
    // role=status + aria-live : l'attente et la bascule auto (PollStatut) sont
    // annoncées au lecteur d'écran. Sous-titre en encre-douce (contraste AA).
    <div role="status" aria-live="polite" className="bg-surface border border-bordure rounded-xl p-8 flex flex-col items-center text-center">
      <span className="opacity-85"><Pastille module="aletheia" size={76} /></span>
      <p className="font-titre text-xl text-encre mt-4">{titre}</p>
      <p className="font-corps text-sm text-encre-douce mt-1.5 max-w-sm">{sousTitre}</p>
    </div>
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
        <section className="bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl p-4 sm:p-5 space-y-3">
          <p className="font-ui text-xs tracking-[0.1em] text-attention uppercase">Ce que cette semaine t&apos;a dévoilé</p>
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
          <VueRetourVF retour={rv} masquerSynthese />
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
  const enAttenteRetour1 = statut === 'V1_SUBMITTED'
  const enAttenteRetour2 = statut === 'VF_SUBMITTED'
  const echecRetour1 = statut === 'DRAFT' && !!t?.retour_v1_erreur_at
  const echecRetour2 = statut === 'FEEDBACK1_READY' && !!t?.retour_vf_erreur_at

  // Bannière de blocage transversal sur les états de soumission (V1 / VF). Pas
  // d'exclusion : le bloc local de validation VF n'apparaît qu'en FEEDBACK2_READY,
  // état où cette bannière n'est pas rendue → aucun doublon, et un retour VF non lu
  // d'une AUTRE semaine reste visible et cliquable.
  const enSoumission = statut === 'DRAFT' || statut === 'FEEDBACK1_READY'
  const retoursALire = enSoumission ? await retoursNonLus(admin, user.id) : []

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
            <span className="font-ui text-xs sm:text-sm text-minium bg-minium-teinte px-3 py-1.5 rounded-full whitespace-nowrap shrink-0">
              ✓ Terminée{dateFin ? ` le ${dateFin}` : ''}
            </span>
          )}
        </div>
        {(statut === 'DRAFT' || statut === 'FEEDBACK1_READY') && (
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

      <StepperNomme statut={statut} />

      {enSoumission && <BanniereRetoursNonLus retours={retoursALire} />}

      {/* Rendu piloté PAR STATUT : chaque phase n'affiche que ce qui la concerne.
          Les états transitoires (attente IA) et la validation finale sont épurés —
          on ne réempile plus les blocs antérieurs (saisie, retour V1, version finale). */}
      {statut === 'DONE' && t?.retour_vf ? (
        // Semaine terminée : archive hiérarchisée (tout reste accessible en dépli).
        <RevueDone t={t} evalQuestions={evalQuestions} />
      ) : statut === 'V1_SUBMITTED' ? (
        // Attente du retour socratique (IA en arrière-plan, polling via PollStatut).
        <TuileAttente
          titre="Ton retour se prépare"
          sousTitre="L’IA relit ta lecture et prépare ses relances. La page se met à jour toute seule."
        />
      ) : statut === 'VF_SUBMITTED' ? (
        // Attente du retour final (reconstruction + architecture).
        <TuileAttente
          titre="Ton retour final se prépare"
          sousTitre="Synthèse modèle et dévoilement de l’architecture. La page se met à jour toute seule."
        />
      ) : statut === 'FEEDBACK2_READY' && t?.retour_vf ? (
        // Validation de lecture — SEULES les tuiles à valider (divulgation progressive).
        <Bloc titre="4. Retour final — synthèse et architecture">
          {(() => {
            // Ordre imposé pour CET écran + accents propres. On trie/fixe AU POINT
            // D'APPEL — `bullesVF` (vue prof + revue DONE) reste inchangé. `bullesVF`
            // omet déjà les parties vides → pas de carte vide, « Partie N » indexé réel.
            const ORDRE = ['ajouts', 'nuances', 'architecture', 'synthese'] as const
            const ACCENT_PARTIE: Record<string, Accent> = {
              ajouts: 'pigment',      // border-l-pigment (bleu)
              nuances: 'or',          // border-l-liseret (or)
              architecture: 'green',  // border-l-ok (vert)
              synthese: 'minium',     // border-l-minium (rouge) + bouton
            }
            const tuiles = bullesVF(t.retour_vf!)
              .slice()
              .sort((a, b) => ORDRE.indexOf(a.id as typeof ORDRE[number]) - ORDRE.indexOf(b.id as typeof ORDRE[number]))
              .map((b) => ({ id: b.id, titre: b.titre, node: b.node, accent: ACCENT_PARTIE[b.id] }))
            return (
              <ValidationLecture
                sequentiel
                tuiles={tuiles}
                dejaLu={false}
                marquerAction={validerLectureRetourVf.bind(null, livreId, semaine)}
                labelBouton="✓ J’ai lu mon retour — clore la semaine"
                introMessage="Lis chaque partie, puis coche-la pour confirmer. La dernière clôt la semaine."
              />
            )
          })()}
        </Bloc>
      ) : statut === 'FEEDBACK1_READY' && t?.retour_v1 ? (
        // Réécriture — atelier 2 colonnes SEUL : le retour reste sous les yeux.
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
        // DRAFT (+ échec retour 1) — saisie initiale 5 champs.
        <>
          {echecRetour1 && (
            <div className="bg-retard-teinte border border-retard rounded-xl px-4 py-3 text-sm text-retard">
              La préparation de ton retour n&apos;a pas abouti. Renvoie ton travail ci-dessous ; si le problème persiste, préviens ton professeur.
            </div>
          )}
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
        </>
      )}
    </div>
  )
}
