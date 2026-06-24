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
import type { TravailAletheia } from '../../types'

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-bordure rounded-xl p-5 space-y-3">
      <h3 className="font-medium text-encre">{titre}</h3>
      {children}
    </section>
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
        {livre?.label && <p className="text-xs text-muet">{livre.label as string}</p>}
        <h2 className="text-xl font-serif text-encre">Semaine {semaine} — {sem.titre}</h2>
        <p className="text-sm text-muet mt-1">
          {sem.chapitres && <span className="text-pigment">{sem.chapitres}</span>}
          {sem.chapitres && sem.dateIndicative && ' · '}
          {sem.dateIndicative && <span>à partir du {sem.dateIndicative}</span>}
        </p>
        <p className="text-xs text-muet mt-2">Lis ces chapitres dans ton propre exemplaire, puis rédige ci-dessous.</p>
      </div>

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

      {/* Retour V1 */}
      {t?.retour_v1 && (
        <Bloc titre="2. Retour — pour creuser">
          <VueRetourV1 retour={t.retour_v1} montrerRemarque={evalQuestions} />
        </Bloc>
      )}

      {/* Étape 2 — version finale (3 champs) */}
      {echecRetour2 && (
        <div className="bg-retard-teinte border border-retard rounded-xl px-4 py-3 text-sm text-retard">
          La préparation de ton retour n&apos;a pas abouti. Renvoie ta version finale ci-dessous ; si le problème persiste, préviens ton professeur.
        </div>
      )}
      {statut === 'FEEDBACK1_READY' ? (
        <Bloc titre="3. Ta version finale">
          <FormulaireVf
            livreId={livreId}
            semaine={semaine}
            theseInitial={t?.these_vf ?? t?.these ?? ''}
            argumentsInitial={t?.arguments_vf ?? t?.arguments ?? ''}
            accordInitial={t?.accord_vf ?? t?.accord ?? ''}
          />
        </Bloc>
      ) : t?.these_vf ? (
        <Bloc titre="3. Ta version finale">
          <Champ label="Idée principale" valeur={t?.these_vf ?? null} />
          <Champ label="Arguments" valeur={t?.arguments_vf ?? null} />
          <Champ label="Ton accord" valeur={t?.accord_vf ?? null} />
        </Bloc>
      ) : null}

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
    </div>
  )
}
