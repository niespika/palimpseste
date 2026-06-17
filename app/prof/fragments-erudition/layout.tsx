import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { classeFragmentsActive } from './contexte-classe'
import { semestreFragmentsActif } from './contexte-semestre'
import SelecteurClasseFragments from './SelecteurClasseFragments'
import SelecteurSemestre from './SelecteurSemestre'

export default async function FragmentsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const [{ classe, classes }, { semestre, semestres }] = await Promise.all([
    classeFragmentsActive(supabase),
    semestreFragmentsActif(supabase),
  ])

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/prof" className="text-sm text-stone-500 hover:text-stone-700">
            ← Tableau de bord
          </Link>
          <h2 className="text-xl font-serif text-stone-900 mt-2">Fragments d'érudition</h2>
        </div>
        <div className="flex items-center gap-4">
          <SelecteurSemestre semestres={semestres} semestreActifId={semestre?.id ?? null} />
          <SelecteurClasseFragments classes={classes} classeActiveId={classe?.id ?? null} />
        </div>
      </div>

      <nav className="flex gap-1 mb-6 border-b border-stone-200 pb-0">
        {[
          { href: '/prof/fragments-erudition', label: 'Vue par semaine' },
          { href: '/prof/fragments-erudition/vue-ensemble', label: "Vue d'ensemble" },
          { href: '/prof/fragments-erudition/semaines', label: 'Semaines' },
          { href: '/prof/fragments-erudition/themes', label: 'Thèmes' },
          { href: '/prof/fragments-erudition/epreuves', label: 'Épreuves' },
          { href: '/prof/fragments-erudition/semestres', label: 'Semestres' },
          { href: '/prof/fragments-erudition/parametres', label: 'Paramètres' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-t-lg border-b-2 border-transparent hover:border-stone-300 transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  )
}
