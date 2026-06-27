import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { classesAvecRappel } from '@/utils/rappels'
import { calculerSante, type SanteInscription } from '@/utils/sante'
import { tachesDeriveesDuCalendrier } from '@/utils/calendrier-a-faire'
import Tuile, { type CouleurTuile } from '@/components/Tuile'
import { type ModuleSceau } from '@/components/Pastille'
import EnTeteMobileProf from '@/components/EnTeteMobileProf'
import RappelsClasses from './RappelsClasses'
import CoutApi from './CoutApi'

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

export default async function ProfAccueil() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const [{ data: classes }, { data: inscriptionsActives }, rappels, sante, tachesCal] = await Promise.all([
    admin.from('classes').select('id, nom, niveau, filiere, annee_scolaire').order('nom'),
    admin.from('inscriptions').select('id, eleve_id, classe_id').eq('statut', 'active'),
    classesAvecRappel(supabase),
    calculerSante(admin),
    tachesDeriveesDuCalendrier(),
  ])

  const toutesClasses = classes ?? []
  const inscrits = inscriptionsActives ?? []

  // ── Zone 1 : fragments à valider (analyses générées, toutes classes) ────────
  const { data: analysesAValider } = await admin
    .from('fragments_analyses').select('depot_id').eq('statut', 'generee')
  const depotIdsAValider = (analysesAValider ?? []).map((a) => a.depot_id as string)
  const { data: depotsAValider } = depotIdsAValider.length > 0
    ? await admin.from('fragments_depots').select('id, inscription_id, semaine_id').in('id', depotIdsAValider)
    : { data: [] }
  const inscIdsAValider = [...new Set((depotsAValider ?? []).map((d) => d.inscription_id as string))]
  const { data: inscAValider } = inscIdsAValider.length > 0
    ? await admin.from('inscriptions').select('id, eleve_id, classe_id').in('id', inscIdsAValider)
    : { data: [] }
  const inscMap = new Map((inscAValider ?? []).map((i) => [i.id as string, i]))
  const eleveIdsAValider = [...new Set((inscAValider ?? []).map((i) => i.eleve_id as string))]
  // Noms pour TOUTES les lignes affichées : à valider + inscriptions actives (couvre les
  // « élèves à risque », sinon ils s'affichaient « ? » dès qu'il n'y avait rien à valider).
  const eleveIdsAffichage = [...new Set([
    ...inscrits.map((i) => i.eleve_id as string),
    ...eleveIdsAValider,
  ])]
  const { data: profilsAffichage } = eleveIdsAffichage.length > 0
    ? await admin.from('profiles').select('id, display_name').in('id', eleveIdsAffichage)
    : { data: [] }
  const nomEleve = new Map((profilsAffichage ?? []).map((p) => [p.id as string, p.display_name as string]))
  const { data: semainesV } = await admin.from('fragments_semaines').select('id, numero')
  const numSemaine = new Map((semainesV ?? []).map((s) => [s.id as string, s.numero as number]))
  const nomClasse = new Map(toutesClasses.map((c) => [c.id, c.nom]))

  const aValider = (depotsAValider ?? []).map((d) => {
    const insc = inscMap.get(d.inscription_id as string)
    return {
      depotId: d.id as string,
      classeId: insc?.classe_id as string | undefined,
      eleveNom: insc ? nomEleve.get(insc.eleve_id as string) ?? '?' : '?',
      classeNom: insc ? nomClasse.get(insc.classe_id as string) ?? '' : '',
      semaineNum: numSemaine.get(d.semaine_id as string) ?? '?',
    }
  })
  const aValiderParClasse = new Map<string, number>()
  for (const v of aValider) if (v.classeId) aValiderParClasse.set(v.classeId, (aValiderParClasse.get(v.classeId) ?? 0) + 1)

  // ── Zone 1 : intégrité (« petits malins ») — signalements à traiter + bloqués ─
  const [{ count: nbSignalements }, { count: nbBloques }, { data: integriteParams }, { data: premierSig }] = await Promise.all([
    admin.from('integrite_signalements').select('id', { count: 'exact', head: true }).is('acquitte_at', null),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('integrite_bloque', true),
    admin.from('integrite_params').select('actif').eq('id', 1).maybeSingle(),
    admin.from('integrite_signalements').select('id').is('acquitte_at', null).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  // Détection désactivée → les élèves ne sont plus bloqués de facto : on n'alerte pas.
  const integriteActive = integriteParams?.actif ?? true
  const bloq = nbBloques ?? 0
  const sig = nbSignalements ?? 0
  const integriteAlerte = integriteActive && (bloq > 0 || sig > 0)
  // Deep-link : on ouvre directement le 1ᵉʳ cas (sur mobile, la preuve plein écran).
  const premierSigId = (premierSig?.id as string | undefined) ?? null
  const hrefIntegrite = premierSigId ? `/prof/integrite?sel=${premierSigId}` : '/prof/integrite'

  // ── Zone 2 : santé de la cohorte (par inscription) ──────────────────────────
  const santeValues = [...sante.values()]
  const totalSuivi = santeValues.length
  const enDifficulte = santeValues.filter((s) => s.enDifficulte)
  const nbAJour = totalSuivi - enDifficulte.length
  const pctAJour = totalSuivi > 0 ? Math.round((nbAJour / totalSuivi) * 100) : null

  // ── Zone 3 : agrégats par classe (santé) ────────────────────────────────────
  const inscritsParClasse = new Map<string, string[]>() // classeId → eleveIds
  for (const i of inscrits) {
    const arr = inscritsParClasse.get(i.classe_id as string) ?? []
    arr.push(i.eleve_id as string)
    inscritsParClasse.set(i.classe_id as string, arr)
  }
  const santeParClasse = new Map<string, SanteInscription[]>()
  for (const s of santeValues) {
    const arr = santeParClasse.get(s.classeId) ?? []
    arr.push(s)
    santeParClasse.set(s.classeId, arr)
  }

  // ── Héros « À TRAITER MAINTENANT » : l'action la plus urgente ───────────────
  type Hero = { titre: string; sousTitre?: string; ctaLabel: string; ctaHref: string; module?: ModuleSceau; danger?: boolean }
  let hero: Hero | null = null
  let heroTacheId: string | null = null
  let heroIntegrite = false
  if (aValider.length > 0) {
    const noms = [...new Set(aValider.slice(0, 2).map((v) => v.eleveNom))].filter((n) => n && n !== '?')
    hero = {
      titre: `${aValider.length} fragment${aValider.length > 1 ? 's' : ''} à valider`,
      sousTitre: [noms.join(' & '), aValider[0].classeNom, `semaine ${aValider[0].semaineNum}`].filter(Boolean).join(' · '),
      ctaLabel: 'Ouvrir la validation →',
      ctaHref: `/prof/fragments-erudition/analyse/${aValider[0].depotId}`,
      module: 'fragments',
    }
  } else if (integriteAlerte) {
    const parts: string[] = []
    if (bloq > 0) parts.push(`${bloq} élève${bloq > 1 ? 's' : ''} bloqué${bloq > 1 ? 's' : ''}`)
    if (sig > 0) parts.push(`${sig} signalement${sig > 1 ? 's' : ''} à traiter`)
    hero = { titre: 'Intégrité — petits malins', sousTitre: parts.join(' · '), ctaLabel: 'Gérer →', ctaHref: hrefIntegrite, danger: true }
    heroIntegrite = true
  } else if (tachesCal.length > 0) {
    const t = tachesCal[0]
    heroTacheId = t.id
    hero = { titre: t.label, sousTitre: [t.classeNom, fmtDate(t.echeance)].filter(Boolean).join(' · '), ctaLabel: 'Ouvrir →', ctaHref: t.href }
  }
  // « À préparer » = les autres items (l'item promu en héros est retiré du fil).
  const integriteEnPreparer = integriteAlerte && !heroIntegrite
  const tachesEnPreparer = tachesCal.filter((t) => t.id !== heroTacheId)

  const labelClasse = (n: number) => `${n} élève${n > 1 ? 's' : ''}`

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <EnTeteMobileProf titre="Tableau de bord" />
        <h2 className="hidden sm:block font-titre text-2xl text-encre">Tableau de bord</h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
          {/* Colonne gauche : héros + à préparer */}
          <div className="space-y-6">
            {/* Héros */}
            {hero ? (
              <div data-module={hero.module} className="bg-surface border border-bordure rounded-xl overflow-hidden">
                <div className={`h-1.5 ${hero.danger ? 'bg-retard' : 'bg-pigment'}`} />
                <div className="px-5 py-5">
                  <p className={`font-ui text-[11px] font-medium uppercase tracking-[0.12em] ${hero.danger ? 'text-retard' : 'text-pigment'}`}>
                    À traiter maintenant
                  </p>
                  <h3 className="font-titre text-2xl text-encre mt-1.5 leading-tight">{hero.titre}</h3>
                  {hero.sousTitre && <p className="font-corps text-base text-encre-douce mt-1">{hero.sousTitre}</p>}
                  <Link
                    href={hero.ctaHref}
                    className={`inline-block mt-4 rounded-lg px-4 py-2 font-ui text-sm font-medium text-surface transition-opacity hover:opacity-90 ${hero.danger ? 'bg-retard' : 'bg-pigment'}`}
                  >
                    {hero.ctaLabel}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-surface border border-bordure rounded-xl px-5 py-6">
                <p className="font-titre text-xl text-encre">Rien d&apos;urgent</p>
                <p className="font-corps text-sm text-muet mt-1">Aucune validation ni alerte en attente. Tout est à jour.</p>
              </div>
            )}

            {/* À préparer */}
            <div>
              <h3 className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-muet mb-2">À préparer</h3>
              <div className="space-y-2">
                {integriteEnPreparer && (
                  <Link href={hrefIntegrite} className="block bg-surface border border-bordure rounded-xl px-4 py-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-retard flex-shrink-0" aria-hidden />
                      <span className="font-corps text-base text-encre flex-1">
                        {bloq > 0 && `${bloq} élève${bloq > 1 ? 's' : ''} bloqué${bloq > 1 ? 's' : ''}`}
                        {bloq > 0 && sig > 0 && ' · '}
                        {sig > 0 && `${sig} signalement${sig > 1 ? 's' : ''}`}
                        <span className="text-muet"> — intégrité</span>
                      </span>
                      <span className="font-ui text-xs text-retard bg-retard-teinte px-2 py-0.5 rounded-full flex-shrink-0">à traiter</span>
                    </div>
                  </Link>
                )}
                {tachesEnPreparer.map((t) => (
                  <Link key={t.id} href={t.href} className="block bg-surface border border-bordure rounded-xl px-4 py-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-pigment flex-shrink-0" aria-hidden />
                      <span className="font-corps text-base text-encre flex-1">
                        {t.label}
                        {t.classeNom && <span className="text-muet"> — {t.classeNom}</span>}
                      </span>
                      <span className="font-ui text-xs text-muet flex-shrink-0">{fmtDate(t.echeance)}</span>
                    </div>
                  </Link>
                ))}
                <RappelsClasses classes={rappels} />
                {/* Coût API — dernière ligne du fil (plus de section isolée). */}
                <CoutApi />
              </div>
            </div>
          </div>

          {/* Colonne droite : santé + mes classes */}
          <div className="space-y-6">
            {/* Santé de la cohorte */}
            <div>
              <h3 className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-muet mb-2">Santé de la cohorte</h3>
              <div className="bg-surface border border-bordure rounded-xl p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-titre text-3xl text-ok leading-none">{pctAJour != null ? `${pctAJour}%` : '—'}</span>
                    <span className="font-ui text-xs text-muet">à jour · {nbAJour}/{totalSuivi}</span>
                  </div>
                  <Link href="/prof/a-risque" className="font-ui text-xs text-retard hover:underline whitespace-nowrap">
                    {enDifficulte.length} à risque →
                  </Link>
                </div>
                {enDifficulte.length > 0 && (
                  <>
                    <div className="border-t border-dashed border-bordure my-3" />
                    <ul className="space-y-1.5">
                      {enDifficulte.slice(0, 3).map((s) => (
                        <li key={s.inscriptionId} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-retard flex-shrink-0" aria-hidden />
                          <Link href={`/prof/eleves/${s.eleveId}`} className="font-corps text-sm text-encre hover:text-retard hover:underline">
                            {nomEleve.get(s.eleveId) ?? '?'}
                          </Link>
                          <span className="font-ui text-xs text-muet">· {nomClasse.get(s.classeId)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            {/* Mes classes */}
            <div>
              <h3 className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-muet mb-2">Mes classes</h3>
              {toutesClasses.length === 0 ? (
                <div className="bg-surface border border-bordure rounded-xl p-6 text-center text-muet text-sm">
                  Aucune classe. <Link href="/prof/classes" className="underline">Créer une classe →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {toutesClasses.map((c) => {
                    const nbInscrits = (inscritsParClasse.get(c.id) ?? []).length
                    const santeClasse = santeParClasse.get(c.id) ?? []
                    const aDesFragments = santeClasse.length > 0
                    const nbDiff = santeClasse.filter((s) => s.enDifficulte).length
                    const nbValider = aValiderParClasse.get(c.id) ?? 0
                    const couleur: CouleurTuile = !aDesFragments ? 'neutre' : nbDiff > 0 ? 'rouge' : 'vert'
                    return (
                      <Tuile
                        key={c.id}
                        nom={c.nom}
                        couleur={couleur}
                        href={`/prof/classes/${c.id}`}
                        resume={
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-muet">{labelClasse(nbInscrits)}</span>
                            {nbDiff > 0 && <span className="text-retard">· {nbDiff} à risque</span>}
                            {nbValider > 0 && <span className="text-attention">· {nbValider} à valider</span>}
                            {aDesFragments && nbDiff === 0 && <span className="text-ok">· à jour</span>}
                          </div>
                        }
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
