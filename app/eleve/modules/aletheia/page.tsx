import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import SelecteurClasseEleve from '../../SelecteurClasseEleve'
import { chargerCapstoneLivre, contexteAletheia, estSemaineDebloquee, lireReglages, livresPourClasse, travauxParSemaine } from './data'
import type { StatutAletheia } from './types'

const BADGE: Record<StatutAletheia, { texte: string; classe: string }> = {
  DRAFT: { texte: 'À commencer', classe: 'bg-stone-100 text-stone-500' },
  V1_SUBMITTED: { texte: 'Travail soumis', classe: 'bg-amber-50 text-amber-700' },
  FEEDBACK1_READY: { texte: 'Retour à lire', classe: 'bg-amber-50 text-amber-700' },
  VF_SUBMITTED: { texte: 'Version finale soumise', classe: 'bg-amber-50 text-amber-700' },
  FEEDBACK2_READY: { texte: 'Retour final à valider', classe: 'bg-amber-50 text-amber-700' },
  DONE: { texte: 'Terminée', classe: 'bg-green-50 text-green-700' },
}

function CarteMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 pb-8">
      <Link href="/eleve" className="text-sm text-stone-500 hover:text-stone-700">← Retour</Link>
      <div className="bg-white border border-stone-200 rounded-xl p-6 text-center text-stone-500 text-sm">{children}</div>
    </div>
  )
}

export default async function PageAletheia() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { moduleActif, inscriptions, active } = await contexteAletheia(supabase, user.id)
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
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href="/eleve" className="text-sm text-stone-500 hover:text-stone-700">← Retour</Link>
        <SelecteurClasseEleve inscriptions={inscriptions} activeId={active.id} />
      </div>

      <div>
        <h2 className="text-xl font-serif text-stone-900">Aletheia</h2>
        <p className="text-sm text-stone-500 mt-1">Lis le livre dans ton exemplaire, semaine après semaine. Pour chaque semaine : note l’idée principale, les arguments et ton accord, pose tes questions et ton vocabulaire, puis réécris et lis ton retour.</p>
      </div>

      {livres.length === 0 ? (
        <CarteMessage>Aucun livre ne t&apos;est assigné pour le moment.</CarteMessage>
      ) : (
        livres.map(livre => {
          const travaux = travauxParLivre.get(livre.id)
          const cap = capstoneParLivre.get(livre.id)
          const toutesDone = livre.semaines.length > 0 && livre.semaines.every(s => travaux?.get(s.semaine)?.statut === 'DONE')
          const numerosSemaines = livre.semaines.map(s => s.semaine)
          const doneSet = new Set(livre.semaines.filter(s => travaux?.get(s.semaine)?.statut === 'DONE').map(s => s.semaine))
          return (
            <div key={livre.id} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
              <div>
                <h3 className="font-medium text-stone-900">{livre.titre}</h3>
                <p className="text-xs text-stone-400 mt-0.5">{livre.nb_semaines ?? livre.semaines.length} semaines de lecture</p>
              </div>
              <ul className="divide-y divide-stone-100">
                {livre.semaines.map(s => {
                  const statut = travaux?.get(s.semaine)?.statut ?? 'DRAFT'
                  const b = BADGE[statut]
                  const debloquee = estSemaineDebloquee(numerosSemaines, doneSet, s.semaine, deblocageSequentiel)
                  const corps = (
                    <>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-800">
                          Semaine {s.semaine} — {s.titre}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {s.chapitres && <span className="text-violet-600">{s.chapitres}</span>}
                          {s.chapitres && s.dateIndicative && ' · '}
                          {s.dateIndicative && <span>à partir du {s.dateIndicative}</span>}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${debloquee ? b.classe : 'bg-stone-100 text-stone-400'}`}>
                        {debloquee ? b.texte : '🔒 Verrouillée'}
                      </span>
                    </>
                  )
                  return (
                    <li key={s.semaine}>
                      {debloquee ? (
                        <Link
                          href={`/eleve/modules/aletheia/${livre.id}/${s.semaine}`}
                          className="flex items-center justify-between gap-3 py-3 hover:bg-stone-50 -mx-2 px-2 rounded-lg transition-colors"
                        >
                          {corps}
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between gap-3 py-3 -mx-2 px-2 opacity-60 cursor-not-allowed" title="Termine la semaine précédente pour débloquer celle-ci.">
                          {corps}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>

              {/* Carte d'architecture (générée par le prof) : l'élève la voit une fois
                  qu'il a lui-même tout terminé — anti-spoiler de l'aval. */}
              {toutesDone && (
                <div className="border-t border-stone-100 pt-3">
                  {cap?.statut === 'READY' ? (
                    <Link href={`/eleve/modules/aletheia/${livre.id}/capstone`}
                      className="block w-full text-center bg-stone-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors">
                      ✦ Voir la carte d&apos;architecture du livre →
                    </Link>
                  ) : (
                    <p className="text-sm text-stone-500">Tu as terminé le livre ! La carte d&apos;architecture sera bientôt disponible.</p>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
