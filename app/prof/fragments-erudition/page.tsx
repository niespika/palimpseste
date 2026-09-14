import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { classesAvecModule } from '@/utils/acces'
import { formatInstant, formatJour, jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { estSemaineComptee, mentionPremiereSemaine } from '@/utils/fragments-semaines'
import { semaineCourante } from '@/utils/fragments-semaine-courante'
import { semestreFragmentsActif } from './contexte-semestre'
import { toggleSemaineOuverte, definirSemestreFragments } from './actions'
import FriseSemaines from './FriseSemaines'
import VueSemaine, { type ClasseSemaine } from './VueSemaine'
import type { EleveAvecDepot, FragmentSemaine, StatutPresentation } from '@/types/fragments'

async function toggleAction(formData: FormData): Promise<void> {
  'use server'
  await toggleSemaineOuverte(formData)
}

async function suivreSemestreAction(formData: FormData): Promise<void> {
  'use server'
  const id = String(formData.get('semestre') ?? '')
  if (id) await definirSemestreFragments(id)
}

// ----------------------------------------------------------------------------
// Vestigia · onglet Semaine — UN SEUL ÉCRAN (refonte du 13/09).
// Avant : une liste de dix-sept tuiles, puis une page par semaine, puis une page
// par classe, puis une page par élève — quatre chargements pour lire un retour.
// Désormais : la frise du semestre en haut, la semaine choisie dessous, les
// classes en segments, l'élève ouvert dans un panneau à droite, le retour
// validé sur place. La semaine reste un paramètre d'URL (`?semaine=`), la classe
// aussi (`?classe=`) : un lien vers cet écran garde tout son sens.
//
// Lecture : les trois classes tiennent en SIX requêtes au lieu d'une dizaine par
// classe — tout est lu par lots, sur l'ensemble des inscriptions du module.
// ----------------------------------------------------------------------------

// `date_debut` est une DATE PURE (→ formatJour, UTC) ; `date_limite` un INSTANT
// (fin de journée dans le fuseau de l'école → formatInstant). Règle du projet.
const formatDate = (dateStr: string, tz: string) => formatInstant(dateStr, tz, { day: 'numeric', month: 'long' })

export default async function PageFragmentsProf({
  searchParams,
}: {
  searchParams: Promise<{ semaine?: string; classe?: string }>
}) {
  const { semaine: semaineParam, classe: classeParam } = await searchParams
  const supabase = await createClient()
  const admin = createAdminClient()
  const tz = await lireFuseau()
  const { semestre: semestreCookie, semestres } = await semestreFragmentsActif(supabase)
  const aujourdHui = jourDansFuseau(new Date(), tz)

  // ⚠️ Un lien entrant (`?semaine=`) peut viser une semaine d'un AUTRE semestre que
  // celui du cookie — l'écran d'analyse, une présentation, un favori. On suit alors
  // la semaine, jamais le cookie : substituer une autre semaine en silence ferait
  // publier des retours en croyant être ailleurs. Une semaine inconnue → 404.
  let semestre = semestreCookie
  let semestreSuivi = false
  if (semaineParam) {
    const { data: voulue } = await supabase.from('fragments_semaines').select('id, semestre_id, is_vacation').eq('id', semaineParam).maybeSingle()
    // Inconnue, vacances (pas une case de la frise), ou semestre hors liste : 404,
    // jamais une autre semaine à la place.
    if (!voulue || voulue.is_vacation) notFound()
    if (voulue.semestre_id !== (semestre?.id ?? null)) {
      const autre = semestres.find(s => s.id === voulue.semestre_id)
      if (!autre) notFound()
      semestre = autre
      semestreSuivi = true
    }
  }

  // Les semaines sont dérivées du semestre (+ vacances) dans le Calendrier
  // (regenererSemaines). La frise montre aussi les vacances — en trait, pas en case.
  const { data: semainesBrutes } = semestre
    ? await supabase.from('fragments_semaines').select('*').eq('semestre_id', semestre.id).order('date_debut')
    : { data: [] }
  const semaines = (semainesBrutes ?? []) as FragmentSemaine[]
  const premiere = semestre?.premiereSemaine ?? 1

  const { data: moduleData } = await admin.from('modules').select('id').eq('slug', 'fragments-erudition').maybeSingle()
  const classes = moduleData ? await classesAvecModule(admin, moduleData.id) : []
  const classeIds = classes.map(c => c.id)

  // Toutes les inscriptions actives des classes du module, en une lecture.
  const { data: inscriptions } = classeIds.length > 0
    ? await admin.from('inscriptions').select('id, classe_id, eleve_id').eq('statut', 'active').in('classe_id', classeIds)
    : { data: [] }
  const inscriptionIds = (inscriptions ?? []).map(i => i.id as string)
  // Le dénominateur de la frise compte des PERSONNES : un élève inscrit dans deux
  // classes du module a deux inscriptions (deux dépôts possibles), une seule tête.
  const nbElevesDistincts = new Set((inscriptions ?? []).map(i => i.eleve_id as string)).size

  // Le compte de dépôts de chaque semaine de travail, pour la frise. Une requête
  // `head` par semaine, en parallèle : ⛔ une seule lecture de tous les dépôts du
  // semestre passerait sous le plafond PostgREST de 1000 lignes sans le dire.
  const semainesTravail = semaines.filter(s => !s.is_vacation)
  const comptesListe = inscriptionIds.length > 0
    ? await Promise.all(semainesTravail.map(async s => {
        const { count } = await admin
          .from('fragments_depots')
          .select('id', { count: 'exact', head: true })
          .eq('semaine_id', s.id)
          .in('inscription_id', inscriptionIds)
        return [s.id, { deposes: count ?? 0, inscrits: nbElevesDistincts }] as const
      }))
    : []
  const comptes = Object.fromEntries(comptesListe)

  const semaine = semaineCourante(semaines, premiere, aujourdHui, semaineParam)

  // ── La semaine choisie : dépôts, analyses, présentations, par classe ────────
  let classesSemaine: ClasseSemaine[] = []
  if (semaine && inscriptionIds.length > 0) {
    const eleveIds = [...new Set((inscriptions ?? []).map(i => i.eleve_id as string))]
    const [{ data: eleves }, { data: depots }, { data: presentations }, { data: comptesPres }] = await Promise.all([
      admin.from('profiles').select('id, display_name, classe').in('id', eleveIds).eq('role', 'eleve').order('display_name'),
      admin.from('fragments_depots')
        .select('id, eleve_id, inscription_id, semaine_id, statut, commentaire_eleve, created_at, updated_at, photos:fragments_photos(id, depot_id, storage_path, ordre, created_at)')
        .eq('semaine_id', semaine.id).in('inscription_id', inscriptionIds),
      admin.from('fragments_presentations').select('id, eleve_id, inscription_id, semaine_id, statut, created_at')
        .eq('semaine_id', semaine.id).in('inscription_id', inscriptionIds).order('created_at'),
      // Borné au semestre : sans cette borne, le plafond PostgREST (1000 lignes)
      // sous-compterait les présentations et fausserait le tirage au sort.
      admin.from('fragments_presentations').select('eleve_id').eq('statut', 'presente').in('inscription_id', inscriptionIds).in('semaine_id', semaines.map(s => s.id)),
    ])
    const depotIds = (depots ?? []).map(d => d.id as string)
    // `commentaire_general` et `signal_integrite` remontent pour que la validation
    // par lot se fasse en connaissance de cause (cf. AnalyseResumee).
    const { data: analyses } = depotIds.length > 0
      ? await admin.from('fragments_analyses').select('id, depot_id, statut, note_decouvertes, note_sources, note_reflexions, commentaire_general, signal_integrite').in('depot_id', depotIds)
      : { data: [] }

    const profilParId = Object.fromEntries((eleves ?? []).map(e => [e.id as string, e]))
    const depotParInscription = Object.fromEntries((depots ?? []).map(d => [d.inscription_id as string, d]))
    const analyseParDepot = Object.fromEntries((analyses ?? []).map(a => [a.depot_id as string, a]))
    const nbPresParEleve: Record<string, number> = {}
    for (const p of comptesPres ?? []) nbPresParEleve[p.eleve_id as string] = (nbPresParEleve[p.eleve_id as string] ?? 0) + 1

    classesSemaine = classes.map(c => {
      const inscrits = (inscriptions ?? []).filter(i => i.classe_id === c.id)
      const elevesAvecDepot: EleveAvecDepot[] = inscrits
        .map(i => {
          const profil = profilParId[i.eleve_id as string]
          if (!profil) return null
          const depot = depotParInscription[i.id as string]
          return {
            id: profil.id as string,
            display_name: profil.display_name as string,
            classe: (profil.classe as string | null) ?? null,
            depot: depot ? { ...depot, photos: depot.photos ?? [] } : null,
            analyse: depot ? (analyseParDepot[depot.id as string] ?? null) : null,
          } as EleveAvecDepot
        })
        .filter((e): e is EleveAvecDepot => !!e)
        .sort((a, b) => a.display_name.localeCompare(b.display_name, 'fr'))
      const inscriptionIdsClasse = new Set(inscrits.map(i => i.id as string))
      const presentationsClasse = (presentations ?? [])
        .filter(p => inscriptionIdsClasse.has(p.inscription_id as string))
        .map(p => ({
          ...p,
          statut: p.statut as StatutPresentation,
          eleve: profilParId[p.eleve_id as string]
            ? { display_name: profilParId[p.eleve_id as string].display_name as string, classe: (profilParId[p.eleve_id as string].classe as string | null) ?? null }
            : null,
        }))
      return {
        id: c.id,
        nom: c.nom,
        inscrits: inscrits.length,
        eleves: elevesAvecDepot,
        eligibles: elevesAvecDepot.filter(e => e.depot).map(e => ({ id: e.id, display_name: e.display_name, classe: e.classe, nbPresentations: nbPresParEleve[e.id] ?? 0 })),
        presentations: presentationsClasse,
      }
    })
  }

  const mention = mentionPremiereSemaine(premiere)

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muet">
          Semaines du semestre <span className="font-medium text-encre-douce">{semestre?.label ?? '—'}</span>
          {mention && <span className="text-muet-clair"> · {mention}</span>}
        </p>
        <Link
          href="/prof/calendrier/config"
          className="text-xs text-muet hover:text-encre px-2 py-1 rounded hover:bg-parchemin-fonce transition-colors"
        >
          Gérer le calendrier →
        </Link>
      </div>

      {semestreSuivi && semestre && (
        // Le sélecteur de l'en-tête lit le cookie ; la page, elle, suit le lien.
        // On le dit, et on offre de réaligner le sélecteur d'un clic.
        <form action={suivreSemestreAction} className="bg-attention-teinte border border-attention text-attention rounded-xl px-4 py-2 text-sm flex items-center gap-3 flex-wrap">
          <input type="hidden" name="semestre" value={semestre.id} />
          <span>Cette semaine appartient au semestre <b>{semestre.label}</b>, pas à celui du sélecteur.</span>
          <button type="submit" className="font-ui text-xs underline underline-offset-2 hover:text-encre">Passer le sélecteur sur {semestre.label}</button>
        </form>
      )}

      {semaines.length === 0 ? (
        // Sans semaine, aucun élève ne peut déposer : l'écran doit dire quoi faire et
        // mener DIRECTEMENT au geste (l'ancre ?section=annee ouvre la bonne section).
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-sm space-y-2">
          <p className="text-encre">
            {semestre
              ? 'Aucune semaine générée pour ce semestre — les élèves ne peuvent rien déposer.'
              : 'Aucun semestre : définis l’année dans le Calendrier, ses semaines suivront.'}
          </p>
          <p className="text-muet">
            Les semaines se déduisent du semestre et des vacances.{' '}
            <Link href="/prof/calendrier/config?section=annee" className="text-encre-douce underline">
              Générer les semaines dans le Calendrier →
            </Link>
          </p>
        </div>
      ) : (
        <>
          <FriseSemaines semaines={semaines} premiere={premiere} choisieId={semaine?.id ?? null} classeId={classes.some(c => c.id === classeParam) ? (classeParam as string) : null} aujourdHui={aujourdHui} comptes={comptes} />

          {semaine && (
            <>
              {/* L'en-tête de la semaine : titre, dates, ouverture — et son interrupteur. */}
              <div className="flex items-center gap-x-4 gap-y-1 flex-wrap px-1">
                <h2 className="font-titre text-2xl font-semibold text-encre leading-none">
                  Semaine {semaine.numero}{semaine.titre ? <span className="text-encre-douce font-medium"> — {semaine.titre}</span> : null}
                </h2>
                <p className="text-sm text-muet">
                  {formatJour(semaine.date_debut, { day: 'numeric', month: 'long' })} → {formatDate(semaine.date_limite, tz)}
                  {estSemaineComptee(semaine, premiere) ? ' · limite le soir' : ''}
                </p>
                {!estSemaineComptee(semaine, premiere) && (
                  <p className="text-sm text-muet-clair italic">Pas de dépôt réclamé cette semaine</p>
                )}
                <span className={`font-ui text-xs px-2 py-0.5 rounded-full ${semaine.ouverte ? 'bg-ok-teinte text-ok' : 'bg-parchemin-fonce text-muet'}`}>
                  {semaine.ouverte ? 'Ouverte aux élèves' : 'Fermée'}
                </span>
                <form action={toggleAction}>
                  <input type="hidden" name="id" value={semaine.id} />
                  <input type="hidden" name="ouverte" value={String(semaine.ouverte)} />
                  <button type="submit" className="font-ui text-xs text-muet hover:text-encre underline underline-offset-2 decoration-puce hover:decoration-encre transition-colors">
                    {semaine.ouverte ? 'Fermer' : 'Rouvrir'}
                  </button>
                </form>
              </div>

              {classesSemaine.length === 0 ? (
                <p className="text-sm text-muet">Aucune classe avec le module Vestigia.</p>
              ) : (
                <VueSemaine
                  key={semaine.id}
                  semaineId={semaine.id}
                  classes={classesSemaine}
                  classeInitiale={classeParam ?? null}
                  tz={tz}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
