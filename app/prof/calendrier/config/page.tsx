import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import type { Semestre, Holiday } from '@/types/calendrier'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { FUSEAUX, jourDansFuseau } from '@/utils/fuseau'
import { calculerGrilleSemaines, semestreActifAttendu } from '@/utils/calendrier-grille'
import { anneeScolaireDe, libelleAnneeScolaire } from '@/utils/frise-enseignement'
import RailConfig from './RailConfig'
import EcranAnnee, { type SemestreAnnee, type AnneeArchivee } from './EcranAnnee'
import EcranVacances from './EcranVacances'
import EcranClasses from './EcranClasses'
import EcranFuseau from './EcranFuseau'

const SECTIONS = ['classes', 'annee', 'vacances', 'fuseau'] as const
type Section = (typeof SECTIONS)[number]

// L'ancienne section « semestres » : les liens déjà posés ailleurs (Fragments) et
// les signets du prof doivent continuer d'atterrir au bon endroit.
const ALIAS_SECTION: Record<string, Section> = { semestres: 'annee' }

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

  // Aujourd'hui dans le fuseau de l'école (date pure) — pour la progression, l'année
  // scolaire courante et le semestre actif ATTENDU.
  const today = jourDansFuseau(new Date(), fuseau)
  const ayJour = anneeScolaireDe(today)

  // Le semestre actif se DÉDUIT de la date du jour (fonction pure) : c'est cette
  // valeur qu'affiche l'écran, jamais la colonne `is_active`. La colonne reste
  // matérialisée pour les autres modules (cf. utils/semestre-actif.ts), mais elle
  // peut avoir un rendu de retard le jour d'une bascule — l'écran, lui, ne ment pas.
  const actifId = semestreActifAttendu(semestresVivants, today)

  // Semestre sélectionné pour la gestion des vacances (défaut : actif, sinon premier
  // vivant). Un ?sem= pointant un semestre archivé est ignoré.
  const selId =
    sem && semestresVivants.some((s) => s.id === sem)
      ? sem
      : semestresVivants.find((s) => s.id === actifId)?.id ?? semestresVivants[0]?.id ?? null
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
  // On lit AUSSI `date_debut` et les semaines de vacances : c'est ce qui permet de
  // compter les semaines « hors calendrier » (lignes stockées qui ne s'alignent plus
  // sur aucune semaine de la grille — typiquement après un recul de la rentrée).
  const { data: semainesStockees } = await supabase
    .from('fragments_semaines')
    .select('id, semestre_id, is_vacation, date_debut')
  type LigneSemaine = { id: string; is_vacation: boolean; date_debut: string }
  const stockeesParSem = new Map<string, LigneSemaine[]>()
  for (const w of semainesStockees ?? []) {
    const sid = w.semestre_id as string | null
    if (!sid) continue
    const arr = stockeesParSem.get(sid) ?? []
    arr.push({ id: w.id as string, is_vacation: !!w.is_vacation, date_debut: w.date_debut as string })
    stockeesParSem.set(sid, arr)
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
  // P5 — déplacer les bornes de l'année peut faire SORTIR une période de son
  // semestre. Rien n'est détruit : celles qui ne tombaient pas entièrement dans
  // l'autre semestre restent en place, et se signalent ici.
  const holidaysInfo = holidays.map((h) => ({
    ...h,
    semaines: retirees.get(h.id) ?? 0,
    horsBornes: !!semSel && (h.start_date < semSel.start_date || h.end_date > semSel.end_date),
  }))

  // ── Infos par semestre ────────────────────────────────────────────────────
  const infosParSem = new Map<
    string,
    { totalSemaines: number; semainesGenerees: number; horsCalendrier: number; nbVacances: number; semaineCourante: number; termine: boolean }
  >()
  for (const s of semestres) {
    const hs = holidaysParSem.get(s.id) ?? []
    const grille = calculerGrilleSemaines(s, hs)
    const total = grille.filter((w) => !w.isVacation).length
    const debuts = new Set(grille.map((w) => w.start))
    const lignes = stockeesParSem.get(s.id) ?? []
    infosParSem.set(s.id, {
      totalSemaines: total,
      semainesGenerees: lignes.filter((w) => !w.is_vacation).length,
      // Même définition que `synchroniserSemaines` : une ligne stockée dont le lundi
      // n'est plus un lundi de la grille. Jamais supprimée (des dépôts y sont
      // rattachés) — mais désormais MONTRÉE.
      horsCalendrier: lignes.filter((w) => !debuts.has(w.date_debut)).length,
      nbVacances: hs.length,
      semaineCourante: Math.min(total, grille.filter((w) => !w.isVacation && w.start <= today).length),
      termine: s.end_date < today,
    })
  }

  // ── L'ANNÉE en cours : les semestres vivants de l'année scolaire du jour ───
  const semestresAnnee = semestresVivants
    .filter((s) => anneeScolaireDe(s.start_date) === ayJour)
    .sort((a, b) => (a.start_date < b.start_date ? -1 : a.start_date > b.start_date ? 1 : 0))

  // P4 — renuméroter sous un dépôt déjà fait : avertir AVANT d'enregistrer dès qu'un
  // semestre de l'année porte au moins un dépôt. Lecture admin (les pages prof lisent
  // `fragments_depots` par le client admin ; la page est déjà gardée prof par le layout).
  const idsSemainesAnnee = semestresAnnee.flatMap((s) =>
    (stockeesParSem.get(s.id) ?? []).map((w) => w.id)
  )
  let nbDepotsAnnee = 0
  if (idsSemainesAnnee.length > 0) {
    const { count } = await createAdminClient()
      .from('fragments_depots')
      .select('id', { count: 'exact', head: true })
      .in('semaine_id', idsSemainesAnnee)
    nbDepotsAnnee = count ?? 0
  }

  const semestresAnneeInfo: SemestreAnnee[] = semestresAnnee.map((s) => ({
    id: s.id,
    name: s.name,
    start_date: s.start_date,
    end_date: s.end_date,
    actif: s.id === actifId,
    ...infosParSem.get(s.id)!,
  }))

  // ── Archives, groupées par ANNÉE scolaire (c'est la maille de ce lot) ──────
  const parAnnee = new Map<number, AnneeArchivee>()
  for (const s of semestres.filter((x) => x.archived_at)) {
    const ay = anneeScolaireDe(s.start_date)
    const entree = parAnnee.get(ay) ?? { ay, libelle: libelleAnneeScolaire(ay), semestres: [] }
    entree.semestres.push({
      id: s.id,
      name: s.name,
      start_date: s.start_date,
      end_date: s.end_date,
      totalSemaines: infosParSem.get(s.id)!.totalSemaines,
    })
    parAnnee.set(ay, entree)
  }
  const archives = [...parAnnee.values()]
    .map((a) => ({
      ...a,
      semestres: a.semestres.sort((x, y) => (x.start_date < y.start_date ? -1 : 1)),
    }))
    .sort((a, b) => b.ay - a.ay)

  // Semestres VIVANTS d'une AUTRE année scolaire que celle du jour. L'écran ne les
  // édite pas (préparer l'année suivante est hors périmètre de ce lot) — mais il ne
  // peut pas les taire : ils comptent dans le calcul du semestre actif, dans le
  // sélecteur des vacances et dans la garde de chevauchement, et sans cet endroit
  // aucune UI ne permettrait de les archiver. On signale, et on offre la remise.
  const autresParAnnee = new Map<number, AnneeArchivee>()
  for (const s of semestresVivants.filter((x) => anneeScolaireDe(x.start_date) !== ayJour)) {
    const ayS = anneeScolaireDe(s.start_date)
    const entree = autresParAnnee.get(ayS) ?? { ay: ayS, libelle: libelleAnneeScolaire(ayS), semestres: [] }
    entree.semestres.push({
      id: s.id,
      name: s.name,
      start_date: s.start_date,
      end_date: s.end_date,
      totalSemaines: infosParSem.get(s.id)!.totalSemaines,
    })
    autresParAnnee.set(ayS, entree)
  }
  const autresVivantes = [...autresParAnnee.values()]
    .map((a) => ({ ...a, semestres: a.semestres.sort((x, y) => (x.start_date < y.start_date ? -1 : 1)) }))
    .sort((a, b) => b.ay - a.ay)

  // Section active (?section=) — défaut : Classes si un semestre existe, sinon Année.
  const demandee = ALIAS_SECTION[rawSection ?? ''] ?? (rawSection as Section)
  const section: Section = SECTIONS.includes(demandee)
    ? demandee
    : semestres.length > 0
      ? 'classes'
      : 'annee'

  // ── Résumés du rail ───────────────────────────────────────────────────────
  const nbAConfigurer = classes.filter((c) => !c.couleur).length
  const fuseauLabel = FUSEAUX.find((f) => f.id === fuseau)?.label ?? fuseau
  const libelleAnnee = libelleAnneeScolaire(ayJour)
  // L'état DE L'ANNÉE se lit sur ses propres semestres, jamais sur le drapeau global :
  // tant qu'un semestre d'une AUTRE année scolaire est encore vivant, c'est lui qui porte
  // `is_active`, et le rail annonçait « à définir » sur une année pourtant déjà saisie
  // (constaté en recette le 20/08). `semestreActifAttendu` rend toujours un id sur une
  // liste non vide — le `< 0` ne couvre donc plus que le cas « aucun semestre ».
  const actifDeAnnee = semestreActifAttendu(semestresAnnee, today)
  const idxActif = semestresAnnee.findIndex((s) => s.id === actifDeAnnee)
  const etatAnnee =
    semestresAnnee.length > 2
      ? `${semestresAnnee.length} semestres — à corriger`
      : idxActif < 0
        ? 'à définir'
        : semestresAnnee[idxActif].start_date > today
          ? `S${idxActif + 1} à venir`
          : semestresAnnee[idxActif].end_date < today
            ? 'année terminée'
            : `S${idxActif + 1} en cours`

  const railItems = [
    {
      key: 'classes',
      label: 'Classes',
      sub: `${classes.length} classe${classes.length > 1 ? 's' : ''}`,
      warn: nbAConfigurer > 0 ? `${nbAConfigurer} à configurer` : null,
    },
    {
      key: 'annee',
      label: 'Année',
      sub: `${libelleAnnee} · ${etatAnnee}`,
      // Un semestre vivant dont les semaines ne sont pas générées = Fragments muet.
      warn: semestresVivants.some(
        (s) => infosParSem.get(s.id)!.semainesGenerees !== infosParSem.get(s.id)!.totalSemaines
      )
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

        {section === 'annee' && (
          <section>
            <EnteteEcran
              titre="Année"
              soustitre="trois dates — les deux semestres s’en déduisent et ancrent la numérotation des semaines"
            />
            <EcranAnnee
              libelleAnnee={libelleAnnee}
              semestres={semestresAnneeInfo}
              archives={archives}
              autresVivantes={autresVivantes}
              nbDepotsAnnee={nbDepotsAnnee}
              ay={ayJour}
            />
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
              actifId={actifId}
              selectedId={selId}
              holidays={holidaysInfo}
              bande={bande}
              semainesGenerees={selId ? infosParSem.get(selId)?.semainesGenerees ?? 0 : 0}
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
