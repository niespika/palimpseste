import { createClient } from '@/utils/supabase/server'
import type { Semestre, Holiday } from '@/types/calendrier'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { FUSEAUX, jourDansFuseau } from '@/utils/fuseau'
import { calculerGrilleSemaines } from '@/utils/calendrier-grille'
import RailConfig from './RailConfig'
import EcranSemestres from './EcranSemestres'
import EcranVacances from './EcranVacances'
import EcranClasses from './EcranClasses'
import EcranFuseau from './EcranFuseau'

const SECTIONS = ['classes', 'semestres', 'vacances', 'fuseau'] as const
type Section = (typeof SECTIONS)[number]

// Année scolaire déduite des dates (rentrée septembre → août) : aucun champ saisi.
function anneeScolaire(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  const y = d.getUTCFullYear()
  // Frontière AOÛT (getUTCMonth : 0 = janvier … 7 = août) : couvre aussi bien les
  // rentrées de septembre que celles de fin août (sessions d'automne Québec/CEGEP).
  return d.getUTCMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

// En-tête d'un volet : titre serif + sous-titre italique (charte Palimpseste).
function EnteteEcran({ titre, soustitre }: { titre: string; soustitre: string }) {
  return (
    <div className="flex items-baseline gap-3 flex-wrap mb-4">
      <h2 className="font-serif text-2xl text-encre m-0">{titre}</h2>
      <span className="italic text-[15px] text-muet">{soustitre}</span>
    </div>
  )
}

export default async function CalendrierConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ sem?: string; section?: string }>
}) {
  const supabase = await createClient()
  const { sem, section: rawSection } = await searchParams
  const fuseau = await lireFuseau()

  // Sélection résiliente : si la migration `archived_at` n'est pas encore appliquée,
  // on dégrade en traitant tous les semestres comme non archivés (page fonctionnelle).
  const semRes = await supabase
    .from('semesters')
    .select('id, name, start_date, end_date, is_active, created_at, archived_at')
    .order('start_date', { ascending: false })
  let semestres: Semestre[]
  if (semRes.error) {
    const fallback = await supabase
      .from('semesters')
      .select('id, name, start_date, end_date, is_active, created_at')
      .order('start_date', { ascending: false })
    semestres = ((fallback.data ?? []) as Semestre[]).map((s) => ({ ...s, archived_at: null }))
  } else {
    semestres = (semRes.data ?? []) as Semestre[]
  }

  // Semestres non archivés (« vivants ») : les archivés sont masqués des listes
  // de l'app — donc exclus du sélecteur et des candidats par défaut du volet Vacances.
  const semestresVivants = semestres.filter((s) => !s.archived_at)

  // Semestre sélectionné pour la gestion des vacances (défaut : actif, sinon premier
  // vivant). Un ?sem= pointant un semestre archivé est ignoré.
  const selId =
    sem && semestresVivants.some((s) => s.id === sem)
      ? sem
      : semestresVivants.find((s) => s.is_active)?.id ?? semestresVivants[0]?.id ?? null
  const semSel = semestresVivants.find((s) => s.id === selId) ?? null

  // Toutes les vacances en une requête → map par semestre (sert au volet Vacances
  // ET au calcul des semaines / de la progression de chaque semestre).
  const { data: allHolidaysData } = await supabase
    .from('holidays')
    .select('id, semester_id, label, start_date, end_date, created_at')
    .order('start_date')
  const holidaysParSem = new Map<string, Holiday[]>()
  for (const h of (allHolidaysData ?? []) as Holiday[]) {
    const arr = holidaysParSem.get(h.semester_id) ?? []
    arr.push(h)
    holidaysParSem.set(h.semester_id, arr)
  }
  const holidays = selId ? holidaysParSem.get(selId) ?? [] : []

  // Semaines réellement STOCKÉES (`fragments_semaines`) — à ne pas confondre avec la
  // grille calculée plus bas. C'est cette table que lit Fragments et à laquelle les
  // dépôts sont rattachés : l'écran doit dire la vérité sur l'écart entre les deux,
  // sinon un semestre sans aucune semaine s'affiche « 12 semaines ✔ » (constat 24/07).
  const { data: semainesStockees } = await supabase
    .from('fragments_semaines')
    .select('semestre_id, is_vacation')
    .eq('is_vacation', false)
  const stockeesParSem = new Map<string, number>()
  for (const w of semainesStockees ?? []) {
    const sid = w.semestre_id as string | null
    if (!sid) continue
    stockeesParSem.set(sid, (stockeesParSem.get(sid) ?? 0) + 1)
  }

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
  const classesEcran = classes.map((c) => ({
    id: c.id,
    nom: c.nom,
    couleur: c.couleur,
    weekdays: (weekdaysParClasse.get(c.id) ?? []).sort((a, b) => a - b),
  }))

  // Bande des semaines du semestre sélectionné : source de vérité = fonction pure,
  // aucune requête (réutilise le semestre + les vacances déjà chargés).
  const bande = semSel ? calculerGrilleSemaines(semSel, holidays) : []
  const nbSemainesPeda = bande.filter((s) => !s.isVacation).length

  // Semaines pédagogiques retirées PAR chaque période. Chaque semaine de vacances
  // est imputée à UNE seule période — celle qui commence le plus tôt parmi celles
  // qui la couvrent (holidays est trié par start_date). Une période entièrement
  // redondante (recouverte par une autre plus précoce) retire donc 0 semaine
  // → « n'enlève aucune semaine pédagogique ».
  const retirees = new Map<string, number>()
  for (const w of bande) {
    if (!w.isVacation) continue
    const couvrante = holidays.find((h) => h.start_date <= w.end && w.start <= h.end_date)
    if (couvrante) retirees.set(couvrante.id, (retirees.get(couvrante.id) ?? 0) + 1)
  }
  const holidaysInfo = holidays.map((h) => ({ ...h, semaines: retirees.get(h.id) ?? 0 }))

  // Aujourd'hui dans le fuseau de l'école (date pure) — pour la progression.
  const today = jourDansFuseau(new Date(), fuseau)

  // Infos par semestre : année scolaire, total de semaines pédagogiques, nombre de
  // périodes de vacances, semaine courante (progression), état « terminé ».
  const semestresInfo = semestres.map((s) => {
    const hs = holidaysParSem.get(s.id) ?? []
    const grille = calculerGrilleSemaines(s, hs)
    const total = grille.filter((w) => !w.isVacation).length
    const courante = Math.min(total, grille.filter((w) => !w.isVacation && w.start <= today).length)
    return {
      ...s,
      anneeScolaire: anneeScolaire(s.start_date),
      totalSemaines: total,
      semainesGenerees: stockeesParSem.get(s.id) ?? 0,
      nbVacances: hs.length,
      semaineCourante: courante,
      termine: s.end_date < today,
    }
  })

  // Section active (?section=) — défaut : Classes si un semestre existe, sinon Semestres.
  const section: Section = SECTIONS.includes(rawSection as Section)
    ? (rawSection as Section)
    : semestres.length > 0
      ? 'classes'
      : 'semestres'

  // Résumés du rail.
  const nbAConfigurer = classes.filter((c) => !c.couleur).length
  const semActif = semestres.find((s) => s.is_active)
  const fuseauLabel = FUSEAUX.find((f) => f.id === fuseau)?.label ?? fuseau
  const railItems = [
    {
      key: 'classes',
      label: 'Classes',
      sub: `${classes.length} classe${classes.length > 1 ? 's' : ''}`,
      warn: nbAConfigurer > 0 ? `${nbAConfigurer} à configurer` : null,
    },
    {
      key: 'semestres',
      label: 'Semestres',
      sub: semActif
        ? `${semActif.name} · actif`
        : `${semestres.length} semestre${semestres.length > 1 ? 's' : ''}`,
      // Un semestre vivant dont les semaines ne sont pas générées = Fragments muet.
      warn: semestresInfo.some((s) => !s.archived_at && s.semainesGenerees !== s.totalSemaines)
        ? 'semaines à générer'
        : null,
    },
    {
      key: 'vacances',
      label: 'Vacances',
      sub: `${holidays.length} période${holidays.length > 1 ? 's' : ''} · ${nbSemainesPeda} sem.`,
    },
    { key: 'fuseau', label: 'Fuseau', sub: fuseauLabel },
  ]

  return (
    <div className="flex gap-[26px] items-start">
      <RailConfig active={section} items={railItems} />

      <main className="flex-1 min-w-0">
        {section === 'classes' && (
          <section>
            <EnteteEcran
              titre="Classes"
              soustitre="couleur et jours de cours — la couleur signe la classe sur tout le calendrier"
            />
            <EcranClasses classes={classesEcran} />
          </section>
        )}

        {section === 'semestres' && (
          <section>
            <EnteteEcran
              titre="Semestres"
              soustitre="communs à toutes les classes — ancrent la numérotation des semaines"
            />
            <EcranSemestres semestres={semestresInfo} />
          </section>
        )}

        {section === 'vacances' && (
          <section>
            <EnteteEcran
              titre="Vacances"
              soustitre="saisies par semestre — une semaine en vacances ne reçoit pas de numéro"
            />
            <EcranVacances
              semestres={semestresVivants}
              selectedId={selId}
              holidays={holidaysInfo}
              bande={bande}
              semainesGenerees={selId ? stockeesParSem.get(selId) ?? 0 : 0}
            />
          </section>
        )}

        {section === 'fuseau' && (
          <section>
            <EnteteEcran titre="Fuseau horaire" soustitre="heure des échéances, quizz et photos" />
            <EcranFuseau fuseau={fuseau} />
          </section>
        )}
      </main>
    </div>
  )
}
