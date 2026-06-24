import Link from 'next/link'
import Pastille from '@/components/Pastille'
import { createClient } from '@/utils/supabase/server'
import { semestreFragmentsActif } from './contexte-semestre'
import SelecteurSemestre from './SelecteurSemestre'
import { TuileAccentModule } from '@/components/TuileAccent'
import SousNavModule from '@/components/SousNavModule'

export default async function FragmentsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { semestre, semestres } = await semestreFragmentsActif(supabase)

  return (
    <div data-module="fragments">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <Link href="/prof" className="font-ui text-sm text-muet hover:text-encre transition-colors">
            ← Tableau de bord
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <Pastille module="fragments" size={44} />
            <h2 className="font-marque text-xl font-semibold tracking-wide text-pigment">FRAGMENTS D&apos;ÉRUDITION</h2>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SelecteurSemestre semestres={semestres} semestreActifId={semestre?.id ?? null} />
        </div>
      </div>

      <SousNavModule onglets={[
        { href: '/prof/fragments-erudition', label: 'Semaine' },
        { href: '/prof/fragments-erudition/vue-ensemble', label: "Vue d'ensemble" },
        { href: '/prof/fragments-erudition/themes', label: 'Thèmes' },
        { href: '/prof/fragments-erudition/essais', label: 'Essais' },
        { href: '/prof/fragments-erudition/semestres', label: 'Synthèses' },
        { href: '/prof/fragments-erudition/parametres', label: 'Paramètres' },
      ]} />

      <TuileAccentModule>{children}</TuileAccentModule>
    </div>
  )
}
