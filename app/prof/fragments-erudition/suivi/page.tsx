import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { classesAvecModule, inscriptionsClasse } from '@/utils/acces'
import { semestreFragmentsActif } from '../contexte-semestre'
import Tuile from '@/components/Tuile'
import DetailClasse, { type LigneEleve } from '@/components/classes/DetailClasse'
import CourbeEvolution, { type PointCourbe } from '@/components/CourbeEvolution'
import { noteVersLettre, COULEUR_LETTRE } from '@/utils/notation'
import LigneThemeEleve, { type ThemeEleve } from './LigneThemeEleve'
import BoutonActiverClasse from './BoutonActiverClasse'

// ---------------------------------------------------------------------------
// C8·L3 — SUIVI : fusion des anciens onglets « Vue d'ensemble » et « Thèmes »
// (revue prof-élève, règle R8). Une seule lecture par classe, puis par élève :
// thème (éditable ici, comme avant), moyennes de sections, taux de dépôt — et un
// clic sur le nom de l'élève ouvre sa progression. La logique métier est celle
// des deux écrans d'origine, sans changement : seules les surfaces fusionnent.
// ---------------------------------------------------------------------------

// Moyenne d'une section (0-4) → badge lettre.
function BadgeMoyenne({ label, moyenne }: { label: string; moyenne: number | null }) {
  const l = noteVersLettre(moyenne)
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="text-muet">{label}</span>
      {l ? (
        <span className={`px-1.5 py-0.5 rounded font-medium ${COULEUR_LETTRE[l]}`}>{l}</span>
      ) : (
        <span className="text-bordure">—</span>
      )}
    </span>
  )
}

interface MoySections { decouvertes: number | null; sources: number | null; reflexions: number | null }

function moyenne(xs: number[]): number | null {
  return xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : null
}

export default async function PageSuivi({ searchParams }: { searchParams: Promise<{ classe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()
  const { classe: classeSel } = await searchParams

  // Semestre consulté (sélecteur de la Barre 2) + ses semaines de travail.
  const { semestre } = await semestreFragmentsActif(supabase)
  const { data: moduleData } = await admin.from('modules').select('id').eq('slug', 'fragments-erudition').maybeSingle()
  const classes = (moduleData && semestre) ? await classesAvecModule(admin, moduleData.id) : []

  const { data: semaines } = semestre
    ? await admin.from('fragments_semaines').select('id, numero').eq('semestre_id', semestre.id).eq('is_vacation', false)
    : { data: [] }
  const nbSemaines = (semaines ?? []).length
  const semaineIds = new Set((semaines ?? []).map(s => s.id as string))
  const numeroParSemaine = new Map((semaines ?? []).map(s => [s.id as string, s.numero as number]))

  if (!semestre || classes.length === 0) {
    return (
      <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-muet text-sm">
        Aucune classe avec le module Fragments{semestre ? '' : ' (ou aucun semestre)'}.
      </div>
    )
  }

  // Une passe par classe : élèves, thèmes, dépôts, analyses publiées.
  type EleveStats = {
    id: string
    display_name: string
    inscriptionId: string
    theme: ThemeEleve | null
    moy: MoySections
    tauxDepot: number
  }
  const statsParClasse = new Map<string, { eleves: EleveStats[]; classeMoy: MoySections; points: PointCourbe[] }>()

  for (const c of classes) {
    const inscrits = await inscriptionsClasse(admin, c.id)
    const inscriptionIds = inscrits.map(i => i.id)
    const eleveIds = inscrits.map(i => i.eleve_id)
    const inscParEleve = new Map(inscrits.map(i => [i.eleve_id, i.id]))

    const { data: profils } = eleveIds.length > 0
      ? await admin.from('profiles').select('id, display_name').in('id', eleveIds).eq('role', 'eleve').order('display_name')
      : { data: [] }

    // Thèmes du semestre consulté (un thème par inscription × semestre).
    const { data: themes } = inscriptionIds.length > 0
      ? await admin
          .from('fragments_themes')
          .select('inscription_id, theme, description, essai_actif')
          .eq('semestre_id', semestre.id)
          .in('inscription_id', inscriptionIds)
      : { data: [] }
    const themeParInsc = new Map((themes ?? []).map(t => [t.inscription_id as string, t]))

    // Dépôts (du semestre) + analyses publiées.
    const { data: depots } = inscriptionIds.length > 0
      ? await admin.from('fragments_depots').select('id, inscription_id, semaine_id').in('inscription_id', inscriptionIds)
      : { data: [] }
    const depotsSemestre = (depots ?? []).filter(d => semaineIds.has(d.semaine_id as string))
    const depotParInsc = new Map<string, string[]>() // inscription → depotIds
    for (const d of depotsSemestre) {
      const arr = depotParInsc.get(d.inscription_id as string) ?? []
      arr.push(d.id as string)
      depotParInsc.set(d.inscription_id as string, arr)
    }
    const depotIds = depotsSemestre.map(d => d.id as string)
    const { data: analyses } = depotIds.length > 0
      ? await admin.from('fragments_analyses')
          .select('depot_id, note_decouvertes, note_sources, note_reflexions')
          .eq('statut', 'publiee').in('depot_id', depotIds)
      : { data: [] }
    const analyseParDepot = new Map((analyses ?? []).map(a => [a.depot_id as string, a]))

    const allD: number[] = [], allS: number[] = [], allR: number[] = []
    const eleves: EleveStats[] = (profils ?? []).map(p => {
      const inscriptionId = inscParEleve.get(p.id as string) as string
      const dIds = inscriptionId ? depotParInsc.get(inscriptionId) ?? [] : []
      const ds: number[] = [], ss: number[] = [], rs: number[] = []
      for (const dId of dIds) {
        const a = analyseParDepot.get(dId)
        if (!a) continue
        if (a.note_decouvertes != null) { ds.push(a.note_decouvertes); allD.push(a.note_decouvertes) }
        if (a.note_sources != null) { ss.push(a.note_sources); allS.push(a.note_sources) }
        if (a.note_reflexions != null) { rs.push(a.note_reflexions); allR.push(a.note_reflexions) }
      }
      const t = themeParInsc.get(inscriptionId)
      return {
        id: p.id as string,
        display_name: p.display_name as string,
        inscriptionId,
        theme: t ? { theme: t.theme, description: t.description, essai_actif: t.essai_actif } : null,
        moy: { decouvertes: moyenne(ds), sources: moyenne(ss), reflexions: moyenne(rs) },
        tauxDepot: nbSemaines > 0 ? Math.round((dIds.length / nbSemaines) * 100) : 0,
      }
    })

    // Courbe d'évolution : moyenne de la classe par semaine pédagogique.
    const parSemaine = new Map<number, { d: number[]; s: number[]; r: number[] }>()
    for (const dep of depotsSemestre) {
      const a = analyseParDepot.get(dep.id as string)
      if (!a) continue
      const num = numeroParSemaine.get(dep.semaine_id as string)
      if (num == null) continue
      const e = parSemaine.get(num) ?? { d: [], s: [], r: [] }
      if (a.note_decouvertes != null) e.d.push(a.note_decouvertes)
      if (a.note_sources != null) e.s.push(a.note_sources)
      if (a.note_reflexions != null) e.r.push(a.note_reflexions)
      parSemaine.set(num, e)
    }
    const points: PointCourbe[] = [...parSemaine.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([num, e]) => ({
        semaine: num,
        decouvertes: moyenne(e.d),
        sources: moyenne(e.s),
        reflexions: moyenne(e.r),
        moyenne: moyenne([...e.d, ...e.s, ...e.r]),
      }))

    statsParClasse.set(c.id, {
      eleves,
      classeMoy: { decouvertes: moyenne(allD), sources: moyenne(allS), reflexions: moyenne(allR) },
      points,
    })
  }

  const classeChoisie = classes.find(c => c.id === classeSel)
  const detail = classeChoisie ? statsParClasse.get(classeChoisie.id) : null

  return (
    <div className="space-y-6 pb-8">
      <p className="text-sm text-muet">
        Suivi — semestre <span className="font-medium text-encre-douce">{semestre.label}</span>. Thème de
        l&apos;élève, moyennes des sections en lettres, taux de dépôt ; le nom d&apos;un élève ouvre sa progression.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {classes.map(c => {
          const st = statsParClasse.get(c.id)
          const m = st?.classeMoy
          const total = st?.eleves.length ?? 0
          const definis = (st?.eleves ?? []).filter(e => e.theme?.theme && e.theme.theme.trim() !== '').length
          return (
            <Tuile
              key={c.id}
              nom={c.nom}
              sousTitre={`${total} élève${total > 1 ? 's' : ''}`}
              href={`/prof/fragments-erudition/suivi?classe=${c.id}`}
              selectionnee={classeSel === c.id}
              resume={
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <BadgeMoyenne label="Découvertes" moyenne={m?.decouvertes ?? null} />
                    <BadgeMoyenne label="Sources" moyenne={m?.sources ?? null} />
                    <BadgeMoyenne label="Réflexions" moyenne={m?.reflexions ?? null} />
                  </div>
                  <span className="text-xs text-muet">
                    {definis}/{total} thème{total > 1 ? 's' : ''} défini{total > 1 ? 's' : ''}
                  </span>
                </div>
              }
            />
          )
        })}
      </div>

      {detail && classeChoisie && detail.points.length > 0 && (
        <div className="bg-surface border border-bordure rounded-xl p-5">
          <p className="text-xs font-medium text-muet uppercase tracking-wide mb-3">
            Évolution de la moyenne — {classeChoisie.nom}
          </p>
          <CourbeEvolution
            data={detail.points}
            cleX="semaine"
            prefixeX="S"
            axeY="lettres"
            series={[
              { cle: 'decouvertes', label: 'Découvertes', couleur: '#3b82f6' },
              { cle: 'sources', label: 'Sources', couleur: '#10b981' },
              { cle: 'reflexions', label: 'Réflexions', couleur: '#8b5cf6' },
              { cle: 'moyenne', label: 'Moyenne', couleur: '#78716c', tiret: true },
            ]}
          />
        </div>
      )}

      {detail && classeChoisie && (
        <DetailClasse
          nom={classeChoisie.nom}
          sousTitre="Thème · moyenne par section (lettres) · taux de dépôt"
          action={<BoutonActiverClasse classeId={classeChoisie.id} semestreId={semestre.id} />}
          eleves={detail.eleves.map((e): LigneEleve => ({
            id: e.id,
            display_name: e.display_name,
            href: `/prof/fragments-erudition/eleve/${e.id}?classe=${classeChoisie.id}`,
            statut: (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <BadgeMoyenne label="Découvertes" moyenne={e.moy.decouvertes} />
                  <BadgeMoyenne label="Sources" moyenne={e.moy.sources} />
                  <BadgeMoyenne label="Réflexions" moyenne={e.moy.reflexions} />
                  <span className="text-xs text-muet">dépôt {e.tauxDepot}%</span>
                </div>
                <LigneThemeEleve
                  inscriptionId={e.inscriptionId}
                  semestreId={semestre.id}
                  theme={e.theme}
                />
              </div>
            ),
          }))}
        />
      )}
    </div>
  )
}
