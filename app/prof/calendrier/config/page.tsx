import { createClient } from '@/utils/supabase/server'
import type { Semestre, Holiday } from '@/types/calendrier'
import GestionSemestres from './GestionSemestres'
import GestionHolidays from './GestionHolidays'
import CouleursClasses from './CouleursClasses'
import GestionJoursCours from './GestionJoursCours'

export default async function CalendrierConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ sem?: string }>
}) {
  const supabase = await createClient()
  const { sem } = await searchParams

  const { data: semestresData } = await supabase
    .from('semesters')
    .select('id, name, start_date, end_date, is_active, created_at')
    .order('start_date', { ascending: false })
  const semestres = (semestresData ?? []) as Semestre[]

  // Semestre sélectionné pour la gestion des vacances (défaut : actif, sinon premier).
  const selId =
    sem && semestres.some((s) => s.id === sem)
      ? sem
      : semestres.find((s) => s.is_active)?.id ?? semestres[0]?.id ?? null

  const { data: holidaysData } = selId
    ? await supabase
        .from('holidays')
        .select('id, semester_id, label, start_date, end_date, created_at')
        .eq('semester_id', selId)
        .order('start_date')
    : { data: [] }
  const holidays = (holidaysData ?? []) as Holiday[]

  const { data: classesData } = await supabase
    .from('classes')
    .select('id, nom, couleur')
    .eq('statut', 'active')
    .order('nom')
  const classes = (classesData ?? []) as { id: string; nom: string; couleur: string | null }[]

  // Motifs hebdomadaires (jours de cours) par classe.
  const { data: patternsData } = await supabase.from('teaching_patterns').select('classe_id, weekday')
  const weekdaysParClasse = new Map<string, number[]>()
  for (const p of patternsData ?? []) {
    const arr = weekdaysParClasse.get(p.classe_id) ?? []
    arr.push(p.weekday)
    weekdaysParClasse.set(p.classe_id, arr)
  }
  const classesCours = classes.map((c) => ({
    id: c.id,
    nom: c.nom,
    weekdays: (weekdaysParClasse.get(c.id) ?? []).sort((a, b) => a - b),
  }))

  return (
    <div className="space-y-10 max-w-3xl">
      <section>
        <h3 className="text-base font-medium text-stone-900">Semestres</h3>
        <p className="text-sm text-stone-500 mt-0.5 mb-4">
          Le semestre est commun à toutes les classes. Il ancre la numérotation des
          semaines et sert de période de référence à Fragments et Quazian.
        </p>
        <GestionSemestres semestres={semestres} />
      </section>

      <section>
        <h3 className="text-base font-medium text-stone-900">Vacances</h3>
        <p className="text-sm text-stone-500 mt-0.5 mb-4">
          Les périodes de vacances sont saisies par semestre. Une semaine qui en
          chevauche une ne reçoit pas de numéro pédagogique (lot suivant).
        </p>
        <GestionHolidays semestres={semestres} selectedId={selId} holidays={holidays} />
      </section>

      <section>
        <h3 className="text-base font-medium text-stone-900">Couleurs des classes</h3>
        <p className="text-sm text-stone-500 mt-0.5 mb-4">
          La couleur distingue les classes sur le calendrier (vue d&apos;ensemble,
          pastilles d&apos;échéances).
        </p>
        <CouleursClasses classes={classes} />
      </section>

      <section>
        <h3 className="text-base font-medium text-stone-900">Jours de cours</h3>
        <p className="text-sm text-stone-500 mt-0.5 mb-4">
          Motif hebdomadaire par classe (informatif, sans contrainte). Les jours
          sélectionnés s&apos;affichent sur le calendrier (hors vacances).
        </p>
        <GestionJoursCours classes={classesCours} />
      </section>
    </div>
  )
}
