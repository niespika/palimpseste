import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { classesAvecModule, inscriptionsClasse } from '@/utils/acces'
import { semestreFragmentsActif } from '../contexte-semestre'
import Tuile from '@/components/Tuile'
import DetailClasse, { type LigneEleve } from '@/components/classes/DetailClasse'
import LigneThemeEleve, { type ThemeEleve } from './LigneThemeEleve'
import BoutonActiverClasse from './BoutonActiverClasse'

interface EleveTheme {
  id: string
  display_name: string
  inscriptionId: string
  theme: ThemeEleve | null
}

export default async function PageThemes({ searchParams }: { searchParams: Promise<{ classe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()
  const { classe: classeSel } = await searchParams

  // Semestre consulté : un thème par (inscription, semestre).
  const { semestre } = await semestreFragmentsActif(supabase)
  const { data: moduleData } = await admin.from('modules').select('id').eq('slug', 'fragments-erudition').maybeSingle()
  const classes = (moduleData && semestre) ? await classesAvecModule(admin, moduleData.id) : []

  if (!semestre || classes.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500 text-sm">
        Aucune classe avec le module Fragments{semestre ? '' : ' (ou aucun semestre)'}.
      </div>
    )
  }

  // Pour chaque classe : les élèves avec leur thème de ce semestre.
  const elevesParClasse = new Map<string, EleveTheme[]>()

  for (const c of classes) {
    const inscrits = await inscriptionsClasse(admin, c.id)
    const inscriptionIds = inscrits.map(i => i.id)
    const eleveIds = inscrits.map(i => i.eleve_id)
    const inscParEleve = new Map(inscrits.map(i => [i.eleve_id, i.id]))

    const { data: profils } = eleveIds.length > 0
      ? await admin.from('profiles').select('id, display_name').in('id', eleveIds).eq('role', 'eleve').order('display_name')
      : { data: [] }

    const { data: themes } = inscriptionIds.length > 0
      ? await admin
          .from('fragments_themes')
          .select('inscription_id, theme, description, essai_actif')
          .eq('semestre_id', semestre.id)
          .in('inscription_id', inscriptionIds)
      : { data: [] }
    const themeParInsc = new Map((themes ?? []).map(t => [t.inscription_id as string, t]))

    const eleves: EleveTheme[] = (profils ?? []).map(p => {
      const inscriptionId = inscParEleve.get(p.id as string) as string
      const t = themeParInsc.get(inscriptionId)
      return {
        id: p.id as string,
        display_name: p.display_name as string,
        inscriptionId,
        theme: t ? { theme: t.theme, description: t.description, essai_actif: t.essai_actif } : null,
      }
    })
    elevesParClasse.set(c.id, eleves)
  }

  const classeChoisie = classes.find(c => c.id === classeSel)
  const detail = classeChoisie ? elevesParClasse.get(classeChoisie.id) ?? [] : null

  return (
    <div className="space-y-6 pb-8">
      <p className="text-sm text-stone-500">
        Thèmes — semestre <span className="font-medium text-stone-700">{semestre.label}</span>. Le thème
        d&apos;un élève est sa question travaillée tout le semestre (champ unique).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {classes.map(c => {
          const eleves = elevesParClasse.get(c.id) ?? []
          const total = eleves.length
          const definis = eleves.filter(e => e.theme?.theme && e.theme.theme.trim() !== '').length
          return (
            <Tuile
              key={c.id}
              nom={c.nom}
              sousTitre={`${total} élève${total > 1 ? 's' : ''}`}
              href={`/prof/fragments-erudition/themes?classe=${c.id}`}
              selectionnee={classeSel === c.id}
              couleur={total > 0 && definis === total ? 'vert' : 'neutre'}
              resume={
                <span className="text-xs text-stone-500">
                  {definis}/{total} thème{total > 1 ? 's' : ''} défini{definis > 1 ? 's' : ''}
                </span>
              }
            />
          )
        })}
      </div>

      {detail && classeChoisie && (
        <DetailClasse
          nom={classeChoisie.nom}
          sousTitre="Thème par élève · activation de l'essai final"
          action={<BoutonActiverClasse classeId={classeChoisie.id} semestreId={semestre.id} />}
          eleves={detail.map((e): LigneEleve => ({
            id: e.id,
            display_name: e.display_name,
            statut: (
              <LigneThemeEleve
                inscriptionId={e.inscriptionId}
                semestreId={semestre.id}
                theme={e.theme}
              />
            ),
          }))}
        />
      )}
    </div>
  )
}
