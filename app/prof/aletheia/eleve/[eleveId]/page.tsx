import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { VueRetourV1, VueRetourVF } from '@/components/aletheia/VueRetours'
import { DetailDiagChapitre, TrajectoireDiag } from '@/components/aletheia/Diagnostic'
import CourbeEvolution, { type SerieCourbe } from '@/components/CourbeEvolution'
import { livresDeClasse, travauxEleve, progression, chargerDiagnostics, STATUT_LABEL, type LivreProf } from '../../donnees'
import { chargerCapstoneLivre } from '@/app/eleve/modules/aletheia/data'
import type { TravailAletheia, DiagnosticTravail } from '@/app/eleve/modules/aletheia/types'

function Champ({ label, valeur }: { label: string; valeur: string | null | undefined }) {
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

function SemaineDrill({ livre, travaux, diag }: { livre: LivreProf; travaux: Map<number, TravailAletheia>; diag: Map<number, DiagnosticTravail> }) {
  return (
    <div className="space-y-4">
      {livre.semaines.map(s => {
        const t = travaux.get(s.semaine) ?? null
        const statut = t?.statut ?? 'DRAFT'
        return (
          <details key={s.semaine} className="bg-surface border border-bordure rounded-xl">
            <summary className="px-4 py-3 cursor-pointer flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-encre">
                Semaine {s.semaine} — {s.titre}
                {s.chapitres && <span className="text-pigment font-normal"> · {s.chapitres}</span>}
              </span>
              <span className="text-xs text-muet whitespace-nowrap">{STATUT_LABEL[statut]}</span>
            </summary>
            <div className="px-4 pb-4 space-y-4 border-t border-bordure pt-4">
              {!t ? (
                <p className="text-sm text-muet">Rien soumis pour cette semaine.</p>
              ) : (
                <>
                  <section className="space-y-2">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-muet">Version initiale (V1)</h5>
                    <Champ label="Idée principale" valeur={t.these} />
                    <Champ label="Arguments" valeur={t.arguments} />
                    <Champ label="Ton accord" valeur={t.accord} />
                    <ListeChamp label="Questions" items={t.questions ?? []} />
                    <ListeChamp label="Vocabulaire" items={t.vocabulaire ?? []} />
                  </section>

                  {t.retour_v1 && (
                    <section className="space-y-2">
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-muet">Retour V1</h5>
                      <VueRetourV1 retour={t.retour_v1} montrerRemarque />
                    </section>
                  )}

                  {(t.these_vf || t.arguments_vf || t.accord_vf) && (
                    <section className="space-y-2">
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-muet">Version finale (VF)</h5>
                      <Champ label="Idée principale" valeur={t.these_vf} />
                      <Champ label="Arguments" valeur={t.arguments_vf} />
                      <Champ label="Ton accord" valeur={t.accord_vf} />
                    </section>
                  )}

                  {t.retour_vf && (
                    <section className="space-y-2">
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-muet">Retour final (VF)</h5>
                      <VueRetourVF retour={t.retour_vf} />
                    </section>
                  )}

                  <section className="space-y-1 border-t border-bordure pt-3">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-muet">Diagnostic (prof — non montré à l&apos;élève)</h5>
                    <DetailDiagChapitre d={diag.get(s.semaine)} />
                  </section>
                </>
              )}
            </div>
          </details>
        )
      })}
    </div>
  )
}

// Niveau retenu par axe : VF si présent (réponse au feedback), sinon V1.
// « mal définie » → pas de niveau (gap dans la courbe).
function niveauThese(d: DiagnosticTravail | undefined): number | null {
  if (!d) return null
  if (d.niveau_these_vf != null) return d.these_mal_definie_vf ? null : d.niveau_these_vf
  if (d.niveau_these_v1 != null) return d.these_mal_definie_v1 ? null : d.niveau_these_v1
  return null
}
function niveauArgs(d: DiagnosticTravail | undefined): number | null {
  if (!d) return null
  return d.niveau_arguments_vf ?? d.niveau_arguments_v1
}

const SERIES_DIAG: SerieCourbe[] = [
  { cle: 'arguments', label: 'Arguments', couleur: '#0ea5e9' },
  { cle: 'these', label: 'Thèse', couleur: '#8b5cf6' },
]

// Tuile haute du diagnostic (courbe E→A + trajectoire compacte), visible d'emblée.
function TuileDiagnostic({ livre, diag }: { livre: LivreProf; diag: Map<number, DiagnosticTravail> }) {
  const points = livre.semaines.map(s => ({
    x: `S${s.semaine}`,
    these: niveauThese(diag.get(s.semaine)),
    arguments: niveauArgs(diag.get(s.semaine)),
  }))
  const aDiag = points.some(p => p.these != null || p.arguments != null)

  return (
    <section className="bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl p-4">
      <h5 className="text-sm font-medium text-encre">
        Diagnostic de compréhension <span className="font-normal text-muet">— prof, jamais montré à l&apos;élève</span>
      </h5>
      <p className="text-xs text-muet mb-3">Thèse / arguments en E→A (V1→VF) · la tendance prime sur le point isolé.</p>
      {aDiag ? (
        <>
          <CourbeEvolution data={points} cleX="x" series={SERIES_DIAG} axeY="lettres" domaine={[0, 4]} hauteur={200} />
          <div className="mt-3 pt-3 border-t border-bordure">
            <p className="text-xs text-muet mb-1">Trajectoire (axe arguments)</p>
            <TrajectoireDiag semaines={livre.semaines.map(s => s.semaine)} diag={diag} />
          </div>
        </>
      ) : (
        <p className="text-sm text-muet">Pas encore diagnostiqué — lance le diagnostic depuis la vue classe.</p>
      )}
    </section>
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
  // Diagnostic (prof-only) de l'élève, par livre → semaine.
  const diagParLivre = new Map(
    await Promise.all(livres.map(async l => [l.id, (await chargerDiagnostics(admin, [eleveId], l.id)).get(eleveId) ?? new Map<number, DiagnosticTravail>()] as const)),
  )

  return (
    <div className="space-y-6">
      <div>
        <Link href="/prof/aletheia" className="text-sm text-muet hover:text-encre-douce">← Classe</Link>
        <h3 className="text-lg font-serif text-encre mt-2">{eleve.display_name as string}</h3>
        <p className="text-sm text-muet">Détail par livre et par semaine</p>
      </div>

      {livres.length === 0 ? (
        <p className="text-sm text-muet">Aucun livre assigné à cet élève.</p>
      ) : (
        livres.map(livre => {
          const travaux = travauxParLivre.get(livre.id) ?? new Map<number, TravailAletheia>()
          const p = progression(livre.semaines, travaux)
          const cap = capstoneParLivre.get(livre.id)
          return (
            <div key={livre.id} className="space-y-4">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h4 className="font-medium text-encre">{livre.titre}</h4>
                <span className="text-xs text-muet">{p.done}/{p.total} semaines terminées</span>
              </div>

              <TuileDiagnostic livre={livre} diag={diagParLivre.get(livre.id) ?? new Map()} />

              <SemaineDrill livre={livre} travaux={travaux} diag={diagParLivre.get(livre.id) ?? new Map()} />

              {/* Pas de carte du livre ici (elle est dans le Scriptorium) — juste
                  l'indication de l'accès de l'élève + l'état de génération. */}
              <section className="bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h5 className="text-sm font-medium text-encre">✦ Carte d&apos;architecture du livre</h5>
                    <p className="text-sm text-muet mt-1">
                      {cap?.statut !== 'READY'
                        ? (cap?.statut === 'PENDING' ? 'Pas encore générée (génération en cours).' : cap?.statut === 'ERROR' ? 'Génération échouée — régénère-la depuis le Scriptorium.' : 'Pas encore générée — à générer depuis le Scriptorium.')
                        : p.done === p.total && p.total > 0
                          ? 'L’élève a terminé le livre : la carte lui est accessible.'
                          : `L’élève y accèdera à la fin du livre (${p.done}/${p.total} semaines).`}
                    </p>
                  </div>
                  <Link href="/prof/scriptorium" className="text-xs text-muet hover:text-encre underline whitespace-nowrap shrink-0">
                    Voir la carte dans le Scriptorium →
                  </Link>
                </div>
              </section>
            </div>
          )
        })
      )}
    </div>
  )
}
