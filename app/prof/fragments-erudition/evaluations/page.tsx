import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { classesAvecModule, inscriptionsClasse } from '@/utils/acces'
import { semestreFragmentsActif } from '../contexte-semestre'
import Tuile from '@/components/Tuile'
import FormulaireNouvelEssai from './FormulaireNouvelEssai'
import GestionEssaisClasse from './GestionEssaisClasse'
import GestionSyntheses from './GestionSyntheses'
import LibelleSuivi from '@/components/nav/LibelleSuivi'

// ---------------------------------------------------------------------------
// C8·L3 — ÉVALUATIONS : les anciens onglets « Essais » et « Synthèses » se rangent
// sous un seul onglet, avec un toggle interne (`?vue=essai|synthese`). Le semestre
// est celui du sélecteur de la Barre 2 : le côté Synthèse entre donc directement
// sur ses classes, sans repasser par une liste de semestres (arbitrage Louis, 13/08).
// La logique métier est celle des deux écrans d'origine, inchangée.
// ---------------------------------------------------------------------------

interface EssaiRow { id: string; titre: string; duree_minutes: number }
interface LienRow { essai_id: string; classe_id: string; date_essai: string; depots_ouverts: boolean }

type Vue = 'essai' | 'synthese'

function Toggle({ vue, classeSel }: { vue: Vue; classeSel?: string }) {
  const lien = (v: Vue) =>
    `/prof/fragments-erudition/evaluations?vue=${v}${classeSel ? `&classe=${classeSel}` : ''}`
  const item = (v: Vue, label: string) => (
    <Link
      key={v}
      href={lien(v)}
      aria-current={vue === v ? 'page' : undefined}
      className={`relative font-ui text-sm px-4 py-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment ${
        vue === v ? 'bg-pigment text-surface font-medium' : 'text-muet hover:text-encre'
      }`}
    >
      <LibelleSuivi>{label}</LibelleSuivi>
    </Link>
  )
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-bordure bg-surface">
      {item('essai', 'Essai')}
      {item('synthese', 'Synthèse')}
    </div>
  )
}

export default async function PageEvaluations({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; classe?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()
  const { vue: vueParam, classe: classeSel } = await searchParams
  const vue: Vue = vueParam === 'synthese' ? 'synthese' : 'essai'

  const { semestre } = await semestreFragmentsActif(supabase)
  const { data: moduleData } = await admin.from('modules').select('id').eq('slug', 'fragments-erudition').maybeSingle()
  const classes = (moduleData && semestre) ? await classesAvecModule(admin, moduleData.id) : []

  const enTete = (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h3 className="text-base font-medium text-encre">
          {vue === 'essai' ? 'Essais' : 'Synthèses de semestre'} — {semestre?.label ?? '—'}
        </h3>
        <p className="text-sm text-muet mt-0.5">
          {vue === 'essai'
            ? "Un essai = une session d'écriture, assignable à plusieurs classes (date propre à chacune)."
            : 'Bilan de fin de semestre : fragments écrits + oral, avec note suggérée.'}
        </p>
      </div>
      <Toggle vue={vue} classeSel={classeSel} />
    </div>
  )

  if (!semestre || classes.length === 0) {
    return (
      <div className="space-y-6 pb-8">
        {enTete}
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-muet text-sm">
          Aucune classe avec le module Fragments{semestre ? '' : ' (ou aucun semestre)'}.
        </div>
      </div>
    )
  }

  const lienClasse = (classeId: string) =>
    `/prof/fragments-erudition/evaluations?vue=${vue}&classe=${classeId}`
  const classeChoisie = classes.find(c => c.id === classeSel)

  // ── Côté ESSAI ───────────────────────────────────────────────────────────
  if (vue === 'essai') {
    const { data: epreuves } = await admin
      .from('fragments_essais_epreuves')
      .select('id, titre, duree_minutes')
      .eq('semestre_id', semestre.id)
      .order('created_at', { ascending: false })
    const epreuveIds = (epreuves ?? []).map(e => e.id as string)

    const { data: liens } = epreuveIds.length > 0
      ? await admin
          .from('fragments_essais_classes')
          .select('essai_id, classe_id, date_essai, depots_ouverts')
          .in('essai_id', epreuveIds)
      : { data: [] }

    const epreuveParId = new Map((epreuves ?? []).map(e => [e.id as string, e as EssaiRow]))
    const liensParClasse = new Map<string, LienRow[]>()
    for (const l of (liens ?? []) as LienRow[]) {
      const arr = liensParClasse.get(l.classe_id) ?? []
      arr.push(l)
      liensParClasse.set(l.classe_id, arr)
    }

    let assignees: { id: string; titre: string; date_essai: string; depots_ouverts: boolean }[] = []
    let disponibles: { id: string; titre: string }[] = []
    if (classeChoisie) {
      const liensClasse = liensParClasse.get(classeChoisie.id) ?? []
      const assigneesIds = new Set(liensClasse.map(l => l.essai_id))
      assignees = liensClasse
        .map(l => {
          const ep = epreuveParId.get(l.essai_id)
          return ep ? { id: ep.id, titre: ep.titre, date_essai: l.date_essai, depots_ouverts: l.depots_ouverts } : null
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => a.date_essai.localeCompare(b.date_essai))
      disponibles = (epreuves ?? [])
        .filter(e => !assigneesIds.has(e.id as string))
        .map(e => ({ id: e.id as string, titre: e.titre as string }))
    }

    return (
      <div className="space-y-6 pb-8">
        {enTete}

        <FormulaireNouvelEssai
          classes={classes.map(c => ({ id: c.id, nom: c.nom }))}
          semestreId={semestre.id}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map(c => {
            const n = (liensParClasse.get(c.id) ?? []).length
            return (
              <Tuile
                key={c.id}
                nom={c.nom}
                sousTitre={`${n} essai${n > 1 ? 's' : ''}`}
                href={lienClasse(c.id)}
                selectionnee={classeSel === c.id}
                couleur={n > 0 ? 'vert' : 'neutre'}
              />
            )
          })}
        </div>

        {classeChoisie && (
          <GestionEssaisClasse
            classeId={classeChoisie.id}
            classeNom={classeChoisie.nom}
            assignees={assignees}
            disponibles={disponibles}
          />
        )}
      </div>
    )
  }

  // ── Côté SYNTHÈSE ────────────────────────────────────────────────────────
  // Inscriptions par classe : elles servent aux compteurs des tuiles ET, pour la
  // classe choisie, à la liste d'élèves passée à <GestionSyntheses>.
  const inscritsParClasse = new Map<string, { id: string; eleve_id: string }[]>()
  for (const c of classes) {
    inscritsParClasse.set(c.id, await inscriptionsClasse(admin, c.id))
  }
  const tousInscriptionIds = [...inscritsParClasse.values()].flat().map(i => i.id)

  const { data: syntheses } = tousInscriptionIds.length > 0
    ? await admin
        .from('fragments_syntheses')
        .select('id, eleve_id, inscription_id, statut, synthese, points_forts, axes_progres, note20_suggeree, note20_min, note20_max, note20_justification, note20_validee, note_visible_eleve, notes_prof, created_at, updated_at, publiee_at')
        .eq('semestre_id', semestre.id)
        .in('inscription_id', tousInscriptionIds)
    : { data: [] }

  const statsParClasse = new Map<string, { total: number; publiees: number; eleves: number }>()
  for (const c of classes) {
    const ids = new Set((inscritsParClasse.get(c.id) ?? []).map(i => i.id))
    const lignes = (syntheses ?? []).filter(s => ids.has(s.inscription_id as string))
    statsParClasse.set(c.id, {
      total: lignes.length,
      publiees: lignes.filter(s => s.statut === 'publiee').length,
      eleves: ids.size,
    })
  }

  let eleves: { id: string; display_name: string; classe: string | null; inscription_id: string }[] = []
  const syntheseParEleve: Record<string, unknown> = {}
  if (classeChoisie) {
    const inscrits = inscritsParClasse.get(classeChoisie.id) ?? []
    const eleveIds = inscrits.map(i => i.eleve_id)
    const inscriptionParEleve = Object.fromEntries(inscrits.map(i => [i.eleve_id, i.id]))
    const inscriptionIds = new Set(inscrits.map(i => i.id))

    const { data: elevesBruts } = eleveIds.length > 0
      ? await admin.from('profiles').select('id, display_name, classe').in('id', eleveIds).eq('role', 'eleve').order('display_name')
      : { data: [] }
    eleves = (elevesBruts ?? []).map(e => ({ ...e, inscription_id: inscriptionParEleve[e.id] })) as typeof eleves

    for (const s of syntheses ?? []) {
      if (inscriptionIds.has(s.inscription_id as string)) syntheseParEleve[s.eleve_id as string] = s
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {enTete}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {classes.map(c => {
          const st = statsParClasse.get(c.id) ?? { total: 0, publiees: 0, eleves: 0 }
          return (
            <Tuile
              key={c.id}
              nom={c.nom}
              sousTitre={`${st.eleves} élève${st.eleves > 1 ? 's' : ''}`}
              href={lienClasse(c.id)}
              selectionnee={classeSel === c.id}
              couleur={st.publiees > 0 ? 'vert' : 'neutre'}
              resume={
                st.total > 0
                  ? <span className="text-xs text-muet">{st.publiees}/{st.total} synthèse{st.total > 1 ? 's' : ''} publiée{st.publiees > 1 ? 's' : ''}</span>
                  : <span className="text-xs text-muet">Aucune synthèse générée</span>
              }
            />
          )
        })}
      </div>

      {classeChoisie && (
        <GestionSyntheses
          semestreId={semestre.id}
          eleves={eleves}
          syntheseParEleve={syntheseParEleve as Parameters<typeof GestionSyntheses>[0]['syntheseParEleve']}
        />
      )}
    </div>
  )
}
