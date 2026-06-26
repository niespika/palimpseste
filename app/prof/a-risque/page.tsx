import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { calculerSante, SEUILS_SANTE, motifsSante, COULEUR_SIGNAL, type SanteInscription } from '@/utils/sante'
import { noteVersLettre } from '@/utils/notation'
import EnTeteMobileProf from '@/components/EnTeteMobileProf'

// Page dédiée « à risque » (Pilotage / tableau de bord). On explique POURQUOI
// chaque élève décroche : groupé PAR CLASSE, la raison portée en chips colorées
// (un signal = une couleur). Calcul par inscription (un élève bi-classe
// n'apparaît qu'au titre du contexte où il décroche).
export default async function PageARisque() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: moi } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (moi?.role !== 'prof') notFound()

  const admin = createAdminClient()

  const [sante, { data: profiles }, { data: classes }] = await Promise.all([
    calculerSante(admin),
    admin.from('profiles').select('id, display_name').eq('role', 'eleve'),
    admin.from('classes').select('id, nom').order('nom'),
  ])

  const nomEleve = new Map((profiles ?? []).map(p => [p.id as string, p.display_name as string]))
  const nomClasse = new Map((classes ?? []).map(c => [c.id as string, c.nom as string]))

  const enDifficulte = [...sante.values()].filter(s => s.enDifficulte)

  // Regroupement par classe (ordre alphabétique des classes ; au sein d'une
  // classe, tri par sévérité — nb de signaux décroissant — puis nom).
  const parClasse = new Map<string, SanteInscription[]>()
  for (const s of enDifficulte) {
    const arr = parClasse.get(s.classeId) ?? []
    arr.push(s)
    parClasse.set(s.classeId, arr)
  }
  const groupes = [...parClasse.entries()]
    .map(([classeId, eleves]) => ({
      classeId,
      nom: nomClasse.get(classeId) ?? '—',
      eleves: eleves.sort((a, b) =>
        motifsSante(b).length - motifsSante(a).length
        || (nomEleve.get(a.eleveId) ?? '').localeCompare(nomEleve.get(b.eleveId) ?? '')),
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom))

  return (
    <div className="space-y-6">
      <EnTeteMobileProf titre={`${enDifficulte.length} élève${enDifficulte.length > 1 ? 's' : ''} à risque`} retourHref="/prof" />

      <div className="hidden sm:block">
        <Link href="/prof" className="font-ui text-sm text-muet hover:text-encre-douce">← Tableau de bord</Link>
        <h2 className="font-titre text-2xl text-encre mt-2">
          {enDifficulte.length} élève{enDifficulte.length > 1 ? 's' : ''} à risque
        </h2>
      </div>
      <p className="font-corps text-sm text-muet -mt-3 sm:mt-0">
        Au moins un signal : au moins {SEUILS_SANTE.depotsManquants} fragments manquants, une moyenne
        sous {noteVersLettre(SEUILS_SANTE.moyenneSous)}, ou plus de {SEUILS_SANTE.revisionEnRetard} cartes en retard.
      </p>

      {enDifficulte.length === 0 ? (
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-sm text-ok">
          Aucun élève à risque 🎉
        </div>
      ) : (
        <div className="space-y-6">
          {groupes.map(g => (
            <section key={g.classeId} className="space-y-2">
              <h3 className="font-ui text-[11px] font-medium text-muet uppercase tracking-[0.12em]">
                {g.nom} · {g.eleves.length}
              </h3>
              <div className="space-y-2">
                {g.eleves.map(s => (
                  <Link
                    key={s.inscriptionId}
                    href={`/prof/eleves/${s.eleveId}`}
                    className="block bg-surface border border-bordure border-l-4 border-l-retard rounded-xl px-4 py-3 hover:shadow-sm hover:border-muet transition-all"
                  >
                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                      <span className="font-corps text-base text-encre sm:w-44 flex-shrink-0">
                        {nomEleve.get(s.eleveId) ?? '?'}
                      </span>
                      <span className="flex flex-wrap gap-1.5 flex-1">
                        {motifsSante(s).map((m, i) => (
                          <span key={i} className={`font-ui text-xs px-2 py-0.5 rounded-full ${COULEUR_SIGNAL[m.type]}`}>
                            {m.label}
                          </span>
                        ))}
                      </span>
                      <span className="font-ui text-xs text-muet flex-shrink-0">Ouvrir la fiche →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
