import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  lireParamsIntegrite, LABEL_MODULE, LABEL_TYPE_STRIKE,
  type ModuleIntegrite, type TypeStrike,
} from '@/utils/integrite'
import { chargerPreuve } from '@/utils/integrite-preuve'
import { formatInstant } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import type {
  SelectionVue, SignalementVue, EvenementVue, HistoriqueLigne, DossierVue, AvisEleve,
} from '@/components/integrite/types'

// ════════════════════════════════════════════════════════════════════════════
// Lecture de l'HISTORIQUE d'intégrité (onglet « Historique » prof + page élève).
// Les avis (signalements) NE sont jamais supprimés — ils sont seulement marqués
// `acquitte_at` pour sortir du « à traiter ». Ici on les lit SANS ce filtre pour
// reconstituer la trace. Les déblocages et la chronologie viennent du journal
// integrite_evenements. Tout passe par le service_role (garde de rôle assurée par
// l'appelant côté prof ; côté élève, on filtre explicitement sur son propre id).
// ════════════════════════════════════════════════════════════════════════════

type Admin = ReturnType<typeof createAdminClient>

// Les created_at des signalements/événements sont des INSTANTS (timestamptz) :
// affichés dans le fuseau choisi par le prof (cf. lireFuseau / utils/fuseau).
const fmtLong = (iso: string, tz: string) =>
  formatInstant(iso, tz, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const fmtCourt = (iso: string, tz: string) =>
  formatInstant(iso, tz, { day: 'numeric', month: 'short' })

const CHAMPS_SIGNALEMENT = 'id, eleve_id, module, rendu_ref, type, motif, source, statut, created_at'

type LigneSignalement = {
  id: string; eleve_id: string; module: string; rendu_ref: string
  type: string; motif: string | null; source: string; statut: string; created_at: string
}

function vueSignalement(s: LigneSignalement, eleveNom: string, tz: string): SignalementVue {
  return {
    id: s.id,
    eleveId: s.eleve_id,
    eleveNom,
    moduleSlug: s.module as ModuleIntegrite,
    moduleLabel: LABEL_MODULE[s.module as ModuleIntegrite] ?? s.module,
    typeSlug: s.type,
    typeLabel: LABEL_TYPE_STRIKE[s.type as TypeStrike] ?? s.type,
    motif: s.motif ?? null,
    source: s.source as 'algo' | 'ia',
    enAttente: s.statut === 'en_attente',
    statut: s.statut as 'en_attente' | 'confirme' | 'rejete',
    date: fmtLong(s.created_at, tz),
    dateCourt: fmtCourt(s.created_at, tz),
  }
}

// Construit une SelectionVue (avis + preuve) à partir d'une ligne signalement.
async function construireSelection(
  admin: Admin, s: LigneSignalement, eleveNom: string,
  etat: { strikes: number; seuil: number; bloque: boolean }, tz: string,
): Promise<SelectionVue> {
  const preuve = await chargerPreuve(admin, s.module as ModuleIntegrite, s.rendu_ref, { motif: s.motif, type: s.type })
  return {
    signalement: vueSignalement(s, eleveNom, tz),
    preuve,
    strikesEleve: etat.strikes,
    seuil: etat.seuil,
    eleveBloque: etat.bloque,
    tz,
  }
}

function vueEvenement(e: {
  id: string; type: string; source: string | null; module: string | null
  motif: string | null; strikes_apres: number | null; created_at: string
}, tz: string): EvenementVue {
  return {
    id: e.id,
    type: e.type as EvenementVue['type'],
    source: e.source ?? null,
    moduleSlug: (e.module as ModuleIntegrite | null) ?? null,
    moduleLabel: e.module ? (LABEL_MODULE[e.module as ModuleIntegrite] ?? e.module) : null,
    motif: e.motif ?? null,
    strikesApres: e.strikes_apres ?? null,
    date: fmtLong(e.created_at, tz),
    dateCourt: fmtCourt(e.created_at, tz),
  }
}

// ── Tableau récapitulatif prof : une ligne par élève ayant un historique ───────
export async function chargerHistoriqueProf(admin: Admin): Promise<HistoriqueLigne[]> {
  const { seuil } = await lireParamsIntegrite(admin)
  const tz = await lireFuseau()

  const [{ data: sigs }, { data: deb }] = await Promise.all([
    admin.from('integrite_signalements').select('eleve_id, statut, created_at'),
    admin.from('integrite_evenements').select('eleve_id').eq('type', 'deblocage'),
  ])

  type Agg = { confirmes: number; ecartes: number; enAttente: number; deblocages: number; dernier: string | null }
  const agg = new Map<string, Agg>()
  const acc = (id: string): Agg => {
    let a = agg.get(id)
    if (!a) { a = { confirmes: 0, ecartes: 0, enAttente: 0, deblocages: 0, dernier: null }; agg.set(id, a) }
    return a
  }
  for (const s of (sigs ?? []) as { eleve_id: string; statut: string; created_at: string }[]) {
    const a = acc(s.eleve_id)
    if (s.statut === 'confirme') a.confirmes++
    else if (s.statut === 'rejete') a.ecartes++
    else if (s.statut === 'en_attente') a.enAttente++
    if (!a.dernier || s.created_at > a.dernier) a.dernier = s.created_at
  }
  for (const e of (deb ?? []) as { eleve_id: string }[]) acc(e.eleve_id).deblocages++

  const eleveIds = [...agg.keys()]
  if (eleveIds.length === 0) return []

  const [{ data: profils }, { data: inscrits }] = await Promise.all([
    admin.from('profiles').select('id, display_name, integrite_strikes, integrite_bloque').in('id', eleveIds),
    admin.from('inscriptions').select('eleve_id, classes(nom)').in('eleve_id', eleveIds).eq('statut', 'active'),
  ])
  const profilMap = new Map((profils ?? []).map((p) => [p.id as string, p]))

  // Libellé court des classes par élève.
  const classesParEleve = new Map<string, string[]>()
  for (const i of (inscrits ?? []) as { eleve_id: string; classes: { nom: string } | { nom: string }[] | null }[]) {
    const c = Array.isArray(i.classes) ? i.classes[0] : i.classes
    if (!c?.nom) continue
    const arr = classesParEleve.get(i.eleve_id) ?? []
    if (!arr.includes(c.nom)) arr.push(c.nom)
    classesParEleve.set(i.eleve_id, arr)
  }

  const lignes: HistoriqueLigne[] = eleveIds.map((id) => {
    const a = agg.get(id)!
    const p = profilMap.get(id)
    return {
      eleveId: id,
      nom: (p?.display_name as string) ?? '?',
      classes: (classesParEleve.get(id) ?? []).join(' · ') || '—',
      confirmes: a.confirmes,
      ecartes: a.ecartes,
      enAttente: a.enAttente,
      deblocages: a.deblocages,
      strikes: (p?.integrite_strikes as number | null) ?? 0,
      seuil,
      bloque: !!p?.integrite_bloque,
      dernier: a.dernier,
      dernierCourt: a.dernier ? fmtCourt(a.dernier, tz) : null,
    }
  })

  // Tri : bloqués d'abord, puis le plus d'avis retenus, puis le plus de signaux en
  // attente, puis le plus récent (date ISO, ordre lexical = chronologique), puis nom.
  lignes.sort((x, y) =>
    Number(y.bloque) - Number(x.bloque)
    || y.confirmes - x.confirmes
    || y.enAttente - x.enAttente
    || (y.dernier ?? '').localeCompare(x.dernier ?? '')
    || x.nom.localeCompare(y.nom, 'fr'),
  )
  return lignes
}

// ── Dossier complet d'un élève (détail du tableau prof) ────────────────────────
export async function chargerDossierIntegrite(admin: Admin, eleveId: string): Promise<DossierVue | null> {
  const { seuil } = await lireParamsIntegrite(admin)
  const tz = await lireFuseau()
  const { data: profil } = await admin
    .from('profiles').select('display_name, integrite_strikes, integrite_bloque').eq('id', eleveId).maybeSingle()
  if (!profil) return null

  const nom = (profil.display_name as string) ?? '?'
  const strikes = (profil.integrite_strikes as number | null) ?? 0
  const bloque = !!profil.integrite_bloque

  const [{ data: sigs }, { data: evs }] = await Promise.all([
    admin.from('integrite_signalements').select(CHAMPS_SIGNALEMENT)
      .eq('eleve_id', eleveId).order('created_at', { ascending: false }),
    admin.from('integrite_evenements')
      .select('id, type, source, module, motif, strikes_apres, created_at')
      .eq('eleve_id', eleveId).order('created_at', { ascending: false }),
  ])

  const lignes = (sigs ?? []) as LigneSignalement[]
  // Liste légère : pas de preuve ici (chargée à la demande au clic, cf. chargerSelectionAvis).
  const avis = lignes.map((s) => vueSignalement(s, nom, tz))
  const evenements = ((evs ?? []) as Parameters<typeof vueEvenement>[0][]).map((e) => vueEvenement(e, tz))

  return {
    eleveId,
    nom,
    strikes,
    seuil,
    bloque,
    confirmes: lignes.filter((s) => s.statut === 'confirme').length,
    ecartes: lignes.filter((s) => s.statut === 'rejete').length,
    deblocages: evenements.filter((e) => e.type === 'deblocage').length,
    avis,
    evenements,
  }
}

// Preuve d'UN avis (chargée à la demande au clic dans le dossier prof).
export async function chargerSelectionAvis(admin: Admin, signalementId: string): Promise<SelectionVue | null> {
  const { data: s } = await admin
    .from('integrite_signalements').select(CHAMPS_SIGNALEMENT).eq('id', signalementId).maybeSingle()
  if (!s) return null
  const ligne = s as LigneSignalement
  const [{ data: profil }, { seuil }, tz] = await Promise.all([
    admin.from('profiles').select('display_name, integrite_strikes, integrite_bloque').eq('id', ligne.eleve_id).maybeSingle(),
    lireParamsIntegrite(admin),
    lireFuseau(),
  ])
  return construireSelection(admin, ligne, (profil?.display_name as string) ?? '?', {
    strikes: (profil?.integrite_strikes as number | null) ?? 0,
    seuil,
    bloque: !!profil?.integrite_bloque,
  }, tz)
}

// ── Vue élève : SES avis CONFIRMÉS uniquement + chronologie de SES blocages ────
export interface HistoriqueEleveVue {
  bloque: boolean
  strikes: number
  seuil: number
  message: string            // message de blocage (paramètre prof)
  avis: AvisEleve[]          // statut='confirme' uniquement (métadonnées + contexte, SANS preuve)
  evenements: EvenementVue[] // blocages / déblocages (chronologie)
}

export async function chargerHistoriqueEleve(admin: Admin, eleveId: string): Promise<HistoriqueEleveVue> {
  const params = await lireParamsIntegrite(admin)
  const tz = await lireFuseau()
  const { data: profil } = await admin
    .from('profiles').select('display_name, integrite_strikes, integrite_bloque').eq('id', eleveId).maybeSingle()
  const strikes = (profil?.integrite_strikes as number | null) ?? 0
  const bloque = !!profil?.integrite_bloque && params.actif
  const nom = (profil?.display_name as string) ?? ''

  const [{ data: sigs }, { data: evs }] = await Promise.all([
    admin.from('integrite_signalements').select(CHAMPS_SIGNALEMENT)
      .eq('eleve_id', eleveId).eq('statut', 'confirme').order('created_at', { ascending: false }),
    admin.from('integrite_evenements')
      .select('id, type, source, module, motif, strikes_apres, created_at')
      .eq('eleve_id', eleveId).in('type', ['blocage', 'deblocage']).order('created_at', { ascending: false }),
  ])

  const lignes = (sigs ?? []) as LigneSignalement[]
  // Avis allégés : on ne calcule que le contexte (slim) — pas de preuve ni d'URL signée.
  const avis: AvisEleve[] = await Promise.all(
    lignes.map(async (s) => ({
      signalement: vueSignalement(s, nom, tz),
      contexte: (await chargerPreuve(admin, s.module as ModuleIntegrite, s.rendu_ref, { motif: s.motif, type: s.type, slim: true })).contexte,
    })),
  )
  const evenements = ((evs ?? []) as Parameters<typeof vueEvenement>[0][]).map((e) => vueEvenement(e, tz))

  return { bloque, strikes, seuil: params.seuil, message: params.messageBloque, avis, evenements }
}
