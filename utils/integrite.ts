import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'

// ════════════════════════════════════════════════════════════════════════════
// Détection « petits malins » — logique transverse (Aletheia, Codex, Fragments).
// Cf. integrite_petits_malins.sql. Strike auto (rendu vide/aveu, haute confiance)
// OU signal IA (hors-sujet/bâclé) en attente de confirmation prof. À `seuil`
// strikes : blocage des rendus + révision flashcards (le quizz reste ouvert).
// Déblocage prof = -1 strike. Tout passe par le service_role (admin) côté serveur.
// ════════════════════════════════════════════════════════════════════════════

type Admin = ReturnType<typeof createAdminClient>

export type ModuleIntegrite = 'aletheia' | 'codex' | 'fragments'
export type TypeStrike = 'vide' | 'aveu_non_travail' | 'hors_sujet' | 'section_na' | 'bacle'

export const LABEL_MODULE: Record<ModuleIntegrite, string> = {
  aletheia: 'Aletheia',
  codex: 'Codex',
  fragments: 'Fragments',
}

export const LABEL_TYPE_STRIKE: Record<TypeStrike, string> = {
  vide: 'Rendu vide',
  aveu_non_travail: 'Aveu de non-travail',
  hors_sujet: 'Hors-sujet',
  section_na: 'Section déclarée non applicable',
  bacle: 'Rendu bâclé',
}

// Messages par défaut (éditables par le prof via integrite_params). Ton « cheeky »
// volontaire : faire comprendre à l'élève qu'il se la coule douce, sans l'humilier.
export const MESSAGE_STRIKE_DEFAUT =
  'Hmm 😏 Ce rendu n’a pas dû te coûter beaucoup de sueur. On ne la fait pas à l’envers : reprends-le sérieusement. Encore quelques rendus aussi légers et tu seras mis en pause.'
export const MESSAGE_BLOQUE_DEFAUT =
  'Bravo l’artiste 🎭 À force de rendus un peu trop légers, te voilà en pause. Tes dépôts et ta révision de flashcards sont gelés tant que ton prof ne t’a pas débloqué. Le quizz, lui, reste ouvert — l’occasion de prouver que tu sais bosser.'

export interface ParamsIntegrite {
  actif: boolean
  seuil: number
  messageStrike: string
  messageBloque: string
}

export async function lireParamsIntegrite(admin: Admin): Promise<ParamsIntegrite> {
  const { data } = await admin
    .from('integrite_params')
    .select('actif, seuil_strikes, message_strike, message_bloque')
    .eq('id', 1)
    .maybeSingle()
  return {
    actif: data?.actif ?? true,
    seuil: data?.seuil_strikes ?? 3,
    messageStrike: data?.message_strike?.trim() || MESSAGE_STRIKE_DEFAUT,
    messageBloque: data?.message_bloque?.trim() || MESSAGE_BLOQUE_DEFAUT,
  }
}

// Message de blocage à montrer à l'élève s'il est bloqué (et le système actif),
// sinon null. Sert de garde-fou serveur (rendus, révision) ET de bannière UI.
export async function messageSiBloque(admin: Admin, eleveId: string): Promise<string | null> {
  const params = await lireParamsIntegrite(admin)
  if (!params.actif) return null
  const { data } = await admin.from('profiles').select('integrite_bloque').eq('id', eleveId).maybeSingle()
  return data?.integrite_bloque ? params.messageBloque : null
}

// Incrément du compteur de strikes (read-modify-write ; volume faible, course
// improbable et sans gravité). Bloque l'élève dès qu'on atteint le seuil.
// Renvoie de quoi journaliser (avant/après + transition de blocage).
async function incrementerStrike(
  admin: Admin, eleveId: string, seuil: number,
): Promise<{ bloque: boolean; dejaBloque: boolean; strikesAvant: number; strikesApres: number }> {
  const { data: prof } = await admin
    .from('profiles')
    .select('integrite_strikes, integrite_bloque')
    .eq('id', eleveId)
    .maybeSingle()
  const dejaBloque = !!prof?.integrite_bloque
  const strikesAvant = prof?.integrite_strikes ?? 0
  const strikesApres = strikesAvant + 1
  const bloque = dejaBloque || strikesApres >= seuil
  const patch: Record<string, unknown> = { integrite_strikes: strikesApres, integrite_bloque: bloque }
  if (bloque && !dejaBloque) patch.integrite_bloque_at = new Date().toISOString()
  await admin.from('profiles').update(patch).eq('id', eleveId)
  return { bloque, dejaBloque, strikesAvant, strikesApres }
}

// Journal d'événements daté (strike / blocage / déblocage). Best-effort : un échec
// ne doit jamais casser le flux appelant. Cf. integrite_evenements.sql. Alimente
// le tableau « Historique » prof et la chronologie de la page élève.
type EvenementIntegrite = {
  eleveId: string
  type: 'strike' | 'blocage' | 'deblocage'
  source?: string | null            // 'algo' | 'ia' | 'manuel' | 'auto'
  signalementId?: string | null
  module?: string | null
  motif?: string | null
  strikesAvant?: number | null
  strikesApres?: number | null
  acteurId?: string | null          // prof qui a agi (null si auto / élève)
}
async function journaliser(admin: Admin, ev: EvenementIntegrite): Promise<void> {
  try {
    await admin.from('integrite_evenements').insert({
      eleve_id: ev.eleveId,
      type: ev.type,
      source: ev.source ?? null,
      signalement_id: ev.signalementId ?? null,
      module: ev.module ?? null,
      motif: ev.motif ?? null,
      strikes_avant: ev.strikesAvant ?? null,
      strikes_apres: ev.strikesApres ?? null,
      acteur_id: ev.acteurId ?? null,
    })
  } catch (e) {
    console.error('[integrite] journaliser :', e)
  }
}

// Strike AUTOMATIQUE (rendu vide / aveu) : haute confiance, comptabilisé direct.
// Dédup par (élève, module, rendu) : re-soumettre le MÊME rendu ne re-strike pas.
// Renvoie le message « cheeky » à montrer à l'élève (null si rien à dire).
export async function signalerStrikeAuto(
  admin: Admin,
  opts: { eleveId: string; module: ModuleIntegrite; renduRef: string; type: TypeStrike; motif: string },
): Promise<{ avertissement: string | null; bloque: boolean; nouveau: boolean }> {
  try {
    const params = await lireParamsIntegrite(admin)
    if (!params.actif) return { avertissement: null, bloque: false, nouveau: false }

    // ignoreDuplicates : un doublon (même rendu) n'insère rien → pas de re-strike.
    const { data: inseres } = await admin
      .from('integrite_signalements')
      .upsert(
        {
          eleve_id: opts.eleveId, module: opts.module, rendu_ref: opts.renduRef,
          type: opts.type, motif: opts.motif, source: 'algo', statut: 'confirme', compte_strike: true,
        },
        { onConflict: 'eleve_id,module,rendu_ref', ignoreDuplicates: true },
      )
      .select('id')
    if (!inseres || inseres.length === 0) return { avertissement: null, bloque: false, nouveau: false }

    const signalementId = (inseres[0]?.id as string | undefined) ?? null
    const { bloque, dejaBloque, strikesAvant, strikesApres } = await incrementerStrike(admin, opts.eleveId, params.seuil)
    await journaliser(admin, {
      eleveId: opts.eleveId, type: 'strike', source: 'algo', signalementId,
      module: opts.module, motif: opts.motif, strikesAvant, strikesApres,
    })
    if (bloque && !dejaBloque) {
      await journaliser(admin, {
        eleveId: opts.eleveId, type: 'blocage', source: 'auto', signalementId,
        module: opts.module, strikesAvant, strikesApres,
      })
    }
    return { avertissement: bloque ? params.messageBloque : params.messageStrike, bloque, nouveau: true }
  } catch (e) {
    // Best-effort : un échec de signalement ne doit jamais casser le rendu de l'élève.
    console.error('[integrite] signalerStrikeAuto :', e)
    return { avertissement: null, bloque: false, nouveau: false }
  }
}

// Signal IA en ATTENTE de confirmation prof (hors-sujet / bâclé). Ne strike PAS
// tant que le prof n'a pas confirmé. Best-effort (appelé dans les jobs IA after()).
export async function signalerEnAttenteIA(
  admin: Admin,
  opts: { eleveId: string; module: ModuleIntegrite; renduRef: string; type: TypeStrike; motif: string },
): Promise<void> {
  try {
    const params = await lireParamsIntegrite(admin)
    if (!params.actif) return
    // Dédup : ne pas re-signaler un rendu déjà signalé (par l'algo ou une analyse antérieure).
    await admin
      .from('integrite_signalements')
      .upsert(
        {
          eleve_id: opts.eleveId, module: opts.module, rendu_ref: opts.renduRef,
          type: opts.type, motif: opts.motif, source: 'ia', statut: 'en_attente', compte_strike: false,
        },
        { onConflict: 'eleve_id,module,rendu_ref', ignoreDuplicates: true },
      )
  } catch (e) {
    console.error('[integrite] signalerEnAttenteIA :', e)
  }
}

// Prof CONFIRME un signal IA → +1 strike (idempotent : un signal déjà comptabilisé
// est simplement acquitté). Sort de la file « à faire ».
export async function confirmerSignalement(admin: Admin, signalementId: string, acteurId?: string | null): Promise<void> {
  const { data: sig } = await admin
    .from('integrite_signalements')
    .select('id, eleve_id, module, motif')
    .eq('id', signalementId)
    .maybeSingle()
  if (!sig) return
  const maintenant = new Date().toISOString()
  // Compare-and-set : on ne compte le strike que si CETTE confirmation fait passer
  // compte_strike de false→true (idempotent, anti double-clic / double-onglet).
  const { data: maj } = await admin
    .from('integrite_signalements')
    .update({ statut: 'confirme', compte_strike: true, acquitte_at: maintenant })
    .eq('id', signalementId)
    .eq('compte_strike', false)
    .select('id')
  if (maj && maj.length > 0) {
    const params = await lireParamsIntegrite(admin)
    const eleveId = sig.eleve_id as string
    const { bloque, dejaBloque, strikesAvant, strikesApres } = await incrementerStrike(admin, eleveId, params.seuil)
    await journaliser(admin, {
      eleveId, type: 'strike', source: 'ia', signalementId,
      module: sig.module as string | null, motif: sig.motif as string | null,
      strikesAvant, strikesApres, acteurId,
    })
    if (bloque && !dejaBloque) {
      await journaliser(admin, {
        eleveId, type: 'blocage', source: 'auto', signalementId,
        module: sig.module as string | null, strikesAvant, strikesApres, acteurId,
      })
    }
  } else {
    // Déjà comptabilisé → s'assurer simplement que l'alerte est acquittée.
    await admin.from('integrite_signalements').update({ acquitte_at: maintenant }).eq('id', signalementId)
  }
}

// Prof ÉCARTE un signal (faux positif) ou ACQUITTE une alerte info (strike algo
// déjà compté) : dans les deux cas, l'alerte sort du « à faire ». N'enlève PAS un
// strike déjà comptabilisé (le déblocage s'en charge).
export async function acquitterSignalement(admin: Admin, signalementId: string, rejeter: boolean): Promise<void> {
  const patch: Record<string, unknown> = { acquitte_at: new Date().toISOString() }
  if (rejeter) patch.statut = 'rejete'
  await admin.from('integrite_signalements').update(patch).eq('id', signalementId)
}

// Prof BLOQUE manuellement un élève (action explicite depuis la page Intégrité).
// N'incrémente PAS le compteur de strikes : le déblocage (debloquerEleve) fait
// déjà -1 strike et lève le blocage. Le blocage ne prend effet que si la détection
// est active (cf. messageSiBloque, garde-fou serveur des rendus).
export async function bloquerEleve(admin: Admin, eleveId: string, acteurId?: string | null): Promise<void> {
  // Garde `.eq('integrite_bloque', false)` : on ne pose integrite_bloque_at que sur
  // la transition réelle non-bloqué → bloqué (anti double-clic / double-onglet ;
  // cohérent avec incrementerStrike qui ne réécrit bloque_at que si !dejaBloque).
  const { data: maj } = await admin
    .from('profiles')
    .update({ integrite_bloque: true, integrite_bloque_at: new Date().toISOString() })
    .eq('id', eleveId)
    .eq('integrite_bloque', false)
    .select('integrite_strikes')
  // Journaliser uniquement la transition réelle (une ligne mise à jour).
  if (maj && maj.length > 0) {
    const strikes = (maj[0].integrite_strikes as number | null) ?? 0
    await journaliser(admin, { eleveId, type: 'blocage', source: 'manuel', strikesAvant: strikes, strikesApres: strikes, acteurId })
  }
}

// Prof DÉBLOQUE un élève : lève le blocage et retire 1 strike (le prochain
// incident re-bloquera). Les signalements restent dans l'historique.
export async function debloquerEleve(admin: Admin, eleveId: string, acteurId?: string | null): Promise<void> {
  const { data: prof } = await admin.from('profiles').select('integrite_strikes, integrite_bloque').eq('id', eleveId).maybeSingle()
  const strikesAvant = (prof?.integrite_strikes as number | null) ?? 0
  const strikesApres = Math.max(0, strikesAvant - 1)
  await admin
    .from('profiles')
    .update({ integrite_bloque: false, integrite_strikes: strikesApres, integrite_bloque_at: null })
    .eq('id', eleveId)
  // Compter le déblocage seulement si l'élève était réellement bloqué.
  if (prof?.integrite_bloque) {
    await journaliser(admin, { eleveId, type: 'deblocage', source: 'manuel', strikesAvant, strikesApres, acteurId })
  }
}
