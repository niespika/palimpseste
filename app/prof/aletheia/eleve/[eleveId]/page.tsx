import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { VueRetourV1, VueRetourVF } from '@/components/aletheia/VueRetours'
import { livresDeClasse, travauxEleve, progression, STATUT_LABEL, type LivreProf } from '../../donnees'
import { chargerCapstoneLivre } from '@/app/eleve/modules/aletheia/data'
import type { TravailAletheia } from '@/app/eleve/modules/aletheia/types'

function Champ({ label, valeur }: { label: string; valeur: string | null | undefined }) {
  if (!valeur) return null
  return (
    <div>
      <p className="text-xs font-medium text-stone-500 mb-0.5">{label}</p>
      <p className="text-sm text-stone-700 whitespace-pre-wrap">{valeur}</p>
    </div>
  )
}

function ListeChamp({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null
  return (
    <div>
      <p className="text-xs font-medium text-stone-500 mb-0.5">{label}</p>
      <ul className="list-disc list-inside space-y-0.5 text-sm text-stone-700">
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  )
}

function SemaineDrill({ livre, travaux }: { livre: LivreProf; travaux: Map<number, TravailAletheia> }) {
  return (
    <div className="space-y-4">
      {livre.semaines.map(s => {
        const t = travaux.get(s.semaine) ?? null
        const statut = t?.statut ?? 'DRAFT'
        return (
          <details key={s.semaine} className="bg-white border border-stone-200 rounded-xl">
            <summary className="px-4 py-3 cursor-pointer flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-stone-800">
                Semaine {s.semaine} — {s.titre}
                {s.chapitres && <span className="text-violet-600 font-normal"> · {s.chapitres}</span>}
              </span>
              <span className="text-xs text-stone-400 whitespace-nowrap">{STATUT_LABEL[statut]}</span>
            </summary>
            <div className="px-4 pb-4 space-y-4 border-t border-stone-100 pt-4">
              {!t ? (
                <p className="text-sm text-stone-400">Rien soumis pour cette semaine.</p>
              ) : (
                <>
                  <section className="space-y-2">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Version initiale (V1)</h5>
                    <Champ label="Idée principale" valeur={t.these} />
                    <Champ label="Arguments" valeur={t.arguments} />
                    <Champ label="Ton accord" valeur={t.accord} />
                    <ListeChamp label="Questions" items={t.questions ?? []} />
                    <ListeChamp label="Vocabulaire" items={t.vocabulaire ?? []} />
                  </section>

                  {t.retour_v1 && (
                    <section className="space-y-2">
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Retour V1</h5>
                      <VueRetourV1 retour={t.retour_v1} montrerRemarque />
                    </section>
                  )}

                  {(t.these_vf || t.arguments_vf || t.accord_vf) && (
                    <section className="space-y-2">
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Version finale (VF)</h5>
                      <Champ label="Idée principale" valeur={t.these_vf} />
                      <Champ label="Arguments" valeur={t.arguments_vf} />
                      <Champ label="Ton accord" valeur={t.accord_vf} />
                    </section>
                  )}

                  {t.retour_vf && (
                    <section className="space-y-2">
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Retour final (VF)</h5>
                      <VueRetourVF retour={t.retour_vf} />
                    </section>
                  )}
                </>
              )}
            </div>
          </details>
        )
      })}
    </div>
  )
}

export default async function DrillDownEleveAletheia({ params }: { params: Promise<{ eleveId: string }> }) {
  const { eleveId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: moi } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (moi?.role !== 'prof') redirect('/eleve')

  const admin = createAdminClient()
  const { data: eleve } = await admin.from('profiles').select('display_name').eq('id', eleveId).maybeSingle()
  if (!eleve) notFound()

  // Livres assignés aux classes (actives) de l'élève — dédupliqués.
  const { data: inscriptions } = await admin
    .from('inscriptions').select('classe_id').eq('eleve_id', eleveId).eq('statut', 'active')
  const classeIds = [...new Set((inscriptions ?? []).map(i => i.classe_id as string))]
  const livresParClasse = await Promise.all(classeIds.map(c => livresDeClasse(admin, c)))
  const livresMap = new Map<string, LivreProf>()
  for (const arr of livresParClasse) for (const l of arr) livresMap.set(l.id, l)
  const livres = [...livresMap.values()]

  const travauxParLivre = new Map(
    await Promise.all(livres.map(async l => [l.id, await travauxEleve(admin, eleveId, l.id)] as const)),
  )
  const capstoneParLivre = new Map(
    await Promise.all(livres.map(async l => [l.id, await chargerCapstoneLivre(admin, l.id)] as const)),
  )

  return (
    <div className="space-y-6">
      <div>
        <Link href="/prof/aletheia" className="text-sm text-stone-500 hover:text-stone-700">← Classe</Link>
        <h3 className="text-lg font-serif text-stone-900 mt-2">{eleve.display_name as string}</h3>
        <p className="text-sm text-stone-400">Détail par livre et par semaine</p>
      </div>

      {livres.length === 0 ? (
        <p className="text-sm text-stone-400">Aucun livre assigné à cet élève.</p>
      ) : (
        livres.map(livre => {
          const travaux = travauxParLivre.get(livre.id) ?? new Map<number, TravailAletheia>()
          const p = progression(livre.semaines, travaux)
          const cap = capstoneParLivre.get(livre.id)
          return (
            <div key={livre.id} className="space-y-4">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h4 className="font-medium text-stone-900">{livre.titre}</h4>
                <span className="text-xs text-stone-400">{p.done}/{p.total} semaines terminées</span>
              </div>

              <SemaineDrill livre={livre} travaux={travaux} />

              <section className="bg-white border border-stone-200 border-l-4 border-l-stone-800 rounded-xl p-4">
                <h5 className="text-sm font-medium text-stone-800 mb-2">✦ Carte d&apos;architecture du livre (partagée)</h5>
                {cap?.statut === 'READY' && cap.contenu ? (
                  <div className="space-y-3 text-sm">
                    {cap.contenu.fil_conducteur && <p className="text-stone-700 whitespace-pre-wrap">{cap.contenu.fil_conducteur}</p>}
                    {cap.contenu.noeuds.length > 0 && (
                      <ul className="space-y-1">
                        {cap.contenu.noeuds.map((n, i) => (
                          <li key={i}><span className="font-medium text-stone-800">{n.chapitre}</span><span className="text-stone-600"> — {n.idee}</span></li>
                        ))}
                      </ul>
                    )}
                    {cap.contenu.liens.length > 0 && (
                      <ul className="space-y-1 pt-2 border-t border-stone-100">
                        {cap.contenu.liens.map((l, i) => (
                          <li key={i} className="text-stone-700"><span className="font-medium">{l.de}</span> → <span className="font-medium">{l.vers}</span> : {l.relation}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-stone-400">
                    {cap?.statut === 'PENDING' ? 'En cours de génération…' : cap?.statut === 'ERROR' ? 'La génération a échoué.' : 'Pas encore générée (aucun élève n’a terminé le livre).'}
                  </p>
                )}
              </section>
            </div>
          )
        })
      )}
    </div>
  )
}
