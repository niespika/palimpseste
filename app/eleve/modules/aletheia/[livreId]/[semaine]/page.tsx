import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { contexteAletheia, livreAccessible, semaineLivre, travauxParSemaine } from '../../data'
import FormulaireResumeQuestions from '../../FormulaireResumeQuestions'
import FormulaireVf from '../../FormulaireVf'
import BoutonLectureRetour2 from '../../BoutonLectureRetour2'
import type { Retour1, Retour2, TravailAletheia } from '../../types'

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
      <h3 className="font-medium text-stone-900">{titre}</h3>
      {children}
    </section>
  )
}

function Liste({ items }: { items: string[] }) {
  if (!items?.length) return null
  return (
    <ul className="list-disc list-inside space-y-1 text-sm text-stone-700">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  )
}

function VueRetour1({ retour }: { retour: Retour1 }) {
  return (
    <div className="space-y-3 text-sm">
      {retour.reponses_a_tes_questions?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-500 mb-1">Réponses à tes questions</p>
          <Liste items={retour.reponses_a_tes_questions} />
        </div>
      )}
      {retour.questions_pour_avancer?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-500 mb-1">Pour avancer</p>
          <Liste items={retour.questions_pour_avancer} />
        </div>
      )}
      {retour.remarque_questions && <p className="text-xs text-stone-400 italic">{retour.remarque_questions}</p>}
    </div>
  )
}

function VueRetour2({ retour }: { retour: Retour2 }) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs font-medium text-stone-500 mb-1">Synthèse modèle</p>
        <p className="text-stone-700 whitespace-pre-wrap">{retour.synthese_modele}</p>
      </div>
      {retour.nuances_et_erreurs?.length > 0 && (
        <div><p className="text-xs font-medium text-stone-500 mb-1">Nuances et points à revoir</p><Liste items={retour.nuances_et_erreurs} /></div>
      )}
      {retour.ajouts_a_verifier?.length > 0 && (
        <div><p className="text-xs font-medium text-stone-500 mb-1">Ajouts à vérifier</p><Liste items={retour.ajouts_a_verifier} /></div>
      )}
      {retour.architecture_amont?.length > 0 && (
        <div><p className="text-xs font-medium text-stone-500 mb-1">Architecture — ce que tu as déjà vu</p><Liste items={retour.architecture_amont} /></div>
      )}
      {retour.architecture_aval_jalons?.length > 0 && (
        <div><p className="text-xs font-medium text-stone-500 mb-1">Architecture — jalons à venir</p><Liste items={retour.architecture_aval_jalons} /></div>
      )}
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
  const travaux = await travauxParSemaine(supabase, user.id, livreId)
  const t: TravailAletheia | null = travaux.get(semaine) ?? null
  const statut = t?.statut ?? 'DRAFT'

  // Pilotage par statut. Les états transitoires *_SUBMITTED (l'IA prépare le
  // retour) ne persistent pas avec les stubs du Lot 2, mais on les gère pour les
  // Lots 3-4 (génération asynchrone) : on montre l'étape précédente + une attente.
  const resumeSoumis = statut !== 'DRAFT'
  const enAttenteRetour1 = statut === 'V1_SUBMITTED'
  const enAttenteRetour2 = statut === 'VF_SUBMITTED'

  return (
    <div className="space-y-5 pb-8">
      <Link href="/eleve/modules/aletheia" className="text-sm text-stone-500 hover:text-stone-700">← Planning</Link>

      <div>
        {livre?.label && <p className="text-xs text-stone-400">{livre.label as string}</p>}
        <h2 className="text-xl font-serif text-stone-900">Semaine {semaine} — {sem.titre}</h2>
        <p className="text-sm text-stone-500 mt-1">
          {sem.chapitres && <span className="text-violet-600">{sem.chapitres}</span>}
          {sem.chapitres && sem.dateIndicative && ' · '}
          {sem.dateIndicative && <span>à partir du {sem.dateIndicative}</span>}
        </p>
        <p className="text-xs text-stone-400 mt-2">Lis ces chapitres dans ton propre exemplaire, puis rédige ci-dessous.</p>
      </div>

      {/* Étape 1 — résumé + questions */}
      {!resumeSoumis ? (
        <Bloc titre="1. Ton résumé et tes questions">
          <FormulaireResumeQuestions livreId={livreId} semaine={semaine} />
        </Bloc>
      ) : (
        <Bloc titre="1. Ton résumé et tes questions">
          <p className="text-sm text-stone-700 whitespace-pre-wrap">{t?.resume_initial}</p>
          {t?.questions && t.questions.length > 0 && (
            <div className="pt-1"><p className="text-xs font-medium text-stone-500 mb-1">Tes questions</p><Liste items={t.questions} /></div>
          )}
        </Bloc>
      )}

      {enAttenteRetour1 && (
        <p className="text-sm text-stone-500">Ton retour 1 est en cours de préparation…</p>
      )}

      {/* Retour 1 */}
      {t?.retour_1 && (
        <Bloc titre="2. Retour 1 — pour creuser">
          <VueRetour1 retour={t.retour_1} />
        </Bloc>
      )}

      {/* Étape 2 — version finale */}
      {statut === 'FEEDBACK1_READY' && (
        <Bloc titre="3. Ta version finale">
          <FormulaireVf livreId={livreId} semaine={semaine} valeurInitiale={t?.resume_initial ?? ''} />
        </Bloc>
      )}
      {t?.resume_vf && (
        <Bloc titre="3. Ta version finale">
          <p className="text-sm text-stone-700 whitespace-pre-wrap">{t.resume_vf}</p>
        </Bloc>
      )}

      {enAttenteRetour2 && (
        <p className="text-sm text-stone-500">Ton retour 2 est en cours de préparation…</p>
      )}

      {/* Retour 2 + validation de lecture */}
      {t?.retour_2 && (
        <Bloc titre="4. Retour 2 — synthèse et architecture">
          <VueRetour2 retour={t.retour_2} />
          {statut === 'FEEDBACK2_READY' ? (
            <div className="pt-2">
              <p className="text-xs text-stone-400 mb-2">Pour clore la semaine, confirme que tu as lu ce retour.</p>
              <BoutonLectureRetour2 livreId={livreId} semaine={semaine} />
            </div>
          ) : (
            <p className="text-sm text-green-700 pt-2">✓ Semaine terminée.</p>
          )}
        </Bloc>
      )}
    </div>
  )
}
