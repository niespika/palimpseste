import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { inscriptionsModuleEleve } from '@/utils/acces'
import { contexteClasseEleve } from '@/app/eleve/contexte-classe'

// ---------------------------------------------------------------------------
// C8·L3 — état des onglets élève de Fragments (Écrit · Oral · Essai [· Synthèse]).
//
// Avant ce lot, la même information vivait dans trois tuiles cliquables en tête
// de page (vert / rouge / neutre + une mention courte). Les onglets ayant pris la
// navigation, l'état devient une PASTILLE sur l'onglet — et la règle qui la
// calcule vit ici, à un seul endroit, pour les deux surfaces (Barre 2 desktop et
// sous-nav mobile). Les couleurs et les mentions sont celles des anciennes tuiles,
// mot pour mot : ce lot réorganise, il ne redéfinit pas les signaux.
//
// L'onglet « Synthèse » n'existe que si une synthèse est publiée (arbitrage Louis,
// 13/08) : d'où le booléen, distinct des trois couleurs.
// ---------------------------------------------------------------------------

export type CouleurOnglet = 'vert' | 'rouge' | 'neutre'

export interface EtatOnglet {
  couleur: CouleurOnglet
  /** Mention courte, reprise des sous-titres des anciennes tuiles. */
  libelle: string
}

export interface EtatOngletsFragments {
  ecrit: EtatOnglet
  oral: EtatOnglet
  essai: EtatOnglet
  /** Vrai si une synthèse de semestre est publiée pour l'élève → 4ᵉ onglet. */
  synthese: boolean
}

const RIEN: EtatOnglet = { couleur: 'neutre', libelle: 'Rien de neuf' }

export const ETAT_VIDE: EtatOngletsFragments = {
  ecrit: RIEN, oral: RIEN, essai: RIEN, synthese: false,
}

/**
 * Recalcule l'état des onglets pour l'élève connecté, sur son inscription
 * courante (commutateur de classe du Lot 9). Lecture seule.
 *
 * `supabase` : client user-scoped (RLS) ; `admin` : service-role, comme la page
 * élève, pour les tables dont l'élève ne voit qu'une partie (analyses, oraux).
 */
export async function etatOngletsFragmentsEleve(
  supabase: SupabaseClient,
  admin: SupabaseClient,
  userId: string,
): Promise<EtatOngletsFragments> {
  const { data: moduleData } = await supabase
    .from('modules').select('id').eq('slug', 'fragments-erudition').maybeSingle()
  if (!moduleData) return ETAT_VIDE

  const inscriptions = await inscriptionsModuleEleve(supabase, userId, moduleData.id)
  if (inscriptions.length === 0) return ETAT_VIDE

  // C7·L2 — en état « Toutes », aucune classe n'est choisie : les pastilles des
  // onglets Fragments n'ont rien à annoncer (le module demande la classe à son
  // entrée). Sans ce retour, le repli ci-dessous colorerait les pastilles avec
  // l'état d'une classe que l'élève n'a pas désignée.
  const { active, toutes } = await contexteClasseEleve(supabase, userId)
  if (toutes) return ETAT_VIDE
  const inscription = inscriptions.find(i => i.id === active?.id) ?? inscriptions[0]
  const inscriptionId = inscription.id

  const { data: semCourant } = await admin
    .from('semesters').select('id').eq('is_active', true).maybeSingle()

  // ── Écrit : semaine ouverte, dépôt de l'élève, dernier retour lu ou non ──
  let reqSemaine = supabase.from('fragments_semaines').select('id').eq('ouverte', true)
  if (semCourant?.id) reqSemaine = reqSemaine.eq('semestre_id', semCourant.id)
  const { data: semaine } = await reqSemaine.order('numero', { ascending: false }).limit(1).maybeSingle()

  const { data: depotActuel } = semaine
    ? await supabase
        .from('fragments_depots').select('id')
        .eq('inscription_id', inscriptionId).eq('semaine_id', semaine.id).maybeSingle()
    : { data: null }

  const { data: tousDepots } = await supabase
    .from('fragments_depots').select('id').eq('inscription_id', inscriptionId)
  const depotIds = (tousDepots ?? []).map(d => d.id as string)

  const { data: dernierRetour } = depotIds.length > 0
    ? await admin
        .from('fragments_analyses').select('id, retour_lu_at')
        .in('depot_id', depotIds).eq('statut', 'publiee')
        .order('publiee_at', { ascending: false }).limit(1).maybeSingle()
    : { data: null }
  const gateActif = !!dernierRetour && !dernierRetour.retour_lu_at

  const ecrit: EtatOnglet = !semaine
    ? RIEN
    : !depotActuel
      ? { couleur: 'rouge', libelle: 'À déposer' }
      : gateActif
        ? { couleur: 'rouge', libelle: 'Retour à lire' }
        : { couleur: 'vert', libelle: 'À jour' }

  // ── Oral : un retour d'oral publié suffit ──────────────────────────────────
  const { data: presentations } = await admin
    .from('fragments_presentations').select('id').eq('inscription_id', inscriptionId)
  const presentationIds = (presentations ?? []).map(p => p.id as string)
  const { data: oraux } = presentationIds.length > 0
    ? await admin.from('fragments_oraux').select('id').in('presentation_id', presentationIds)
    : { data: [] }
  const oralIds = (oraux ?? []).map(o => o.id as string)
  const { data: analysesOrales } = oralIds.length > 0
    ? await admin
        .from('fragments_analyses_orales').select('id')
        .not('publiee_at', 'is', null).in('oral_id', oralIds).limit(1)
    : { data: [] }
  const oral: EtatOnglet = (analysesOrales ?? []).length > 0
    ? { couleur: 'vert', libelle: 'Retour disponible' }
    : RIEN

  // ── Essai : épreuve ouverte pour la classe, dépôt, retour publié ───────────
  let themeQuery = supabase
    .from('fragments_themes').select('essai_actif').eq('inscription_id', inscriptionId)
  if (semCourant?.id) themeQuery = themeQuery.eq('semestre_id', semCourant.id)
  const { data: theme } = await themeQuery.maybeSingle()
  const essaiActif = !!theme?.essai_actif

  let essai: EtatOnglet = RIEN
  if (essaiActif) {
    const { data: lienOuvert } = await admin
      .from('fragments_essais_classes')
      .select('fragments_essais_epreuves(id)')
      .eq('classe_id', inscription.classe_id).eq('depots_ouverts', true)
      .order('date_essai', { ascending: false }).limit(1).maybeSingle()
    const epreuveOuverte = (lienOuvert?.fragments_essais_epreuves as unknown as { id: string } | null) ?? null

    const { data: essaisInscription } = await admin
      .from('fragments_essai_depots').select('id, essai_id').eq('inscription_id', inscriptionId)
    const essaiIds = (essaisInscription ?? []).map(e => e.id as string)
    const depotPourEpreuve = epreuveOuverte
      ? (essaisInscription ?? []).some(e => e.essai_id === epreuveOuverte.id)
      : false

    const { data: analysePubliee } = essaiIds.length > 0
      ? await admin
          .from('fragments_essai_depot_analyses').select('id')
          .in('depot_id', essaiIds).eq('statut', 'publiee').limit(1).maybeSingle()
      : { data: null }

    essai = analysePubliee
      ? { couleur: 'vert', libelle: 'Retour disponible' }
      : depotPourEpreuve || (!epreuveOuverte && essaiIds.length > 0)
        ? { couleur: 'vert', libelle: 'Déposé' }
        : epreuveOuverte
          ? { couleur: 'rouge', libelle: 'À déposer' }
          : RIEN
  }

  // ── Synthèse : l'onglet n'existe que si un bilan est publié ────────────────
  const { data: synthese } = await admin
    .from('fragments_syntheses').select('id')
    .eq('inscription_id', inscriptionId).eq('statut', 'publiee').limit(1).maybeSingle()

  return { ecrit, oral, essai, synthese: !!synthese }
}
