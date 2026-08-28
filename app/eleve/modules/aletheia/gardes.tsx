import 'server-only'
// ============================================================================
// C5 · L4 — LES QUATRE GARDES DU MODULE, REJOUÉES SUR CHACUN DES TROIS ONGLETS.
// ----------------------------------------------------------------------------
// ⛔⛔ « UN ONGLET QUI NE LES REJOUE PAS REND UNE PAGE VIDE AU LIEU DE DIRE
//    POURQUOI. » Le patron est `app/eleve/modules/codex/examens/page.tsx`, qui
//    rejoue `module.actif` puis `seuilModule` avec ce commentaire : « les deux
//    gardes précèdent le contenu de l'onglet […] un onglet qu'on clique doit
//    dire POURQUOI il refuse, jamais rendre une page vide ».
//
// ⭐ ALETHEIA EN A QUATRE, PAS DEUX, et elles sont toutes les quatre dans
//    `contexteAletheia` (`data.ts`) — que ce module RÉUTILISE, il n'en écrit
//    pas une variante :
//      1. module non activé            → carte, avec son propre « ← Retour » ;
//      2. module indisponible au compte → carte, idem ;
//      3. état « Toutes » du commutateur → `ChoixClasseModule` (les livres se
//         lisent PAR CLASSE : en « Toutes », on la demande) ;
//      4. classe en contexte sans Aletheia → `ModuleHorsClasse` (le repli
//         silencieux montrait les livres d'une classe sous le nom d'une autre).
//
// ⚠️ LES DEUX PREMIÈRES CARTES PORTENT LEUR « ← Retour » ET C'EST LEUR SEULE
//    ISSUE ; le corps d'un onglet, lui, en rend déjà un — d'où `avecRetour`.
//
// ⚠️ CE MODULE NE DÉCIDE RIEN : il rend un ÉCRAN ou la CLASSE en contexte. Aucune
//    porte d'interrupteur ici — `exercices_actif` se lit DANS
//    `exercicesMaisonDeLEleve`, et `passation_classe_actif` dans
//    `signauxDeLancement` : « une garde qu'on peut oublier en écrivant un second
//    écran n'est pas une garde ».
// ============================================================================

import { notFound } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { contexteAletheia, type InscriptionAletheia } from './data'
import CarteMessage from './CarteMessage'
import ModuleHorsClasse from '../../ModuleHorsClasse'
import ChoixClasseModule from '../../ChoixClasseModule'

export type SeuilAletheia =
  | { type: 'ecran'; noeud: React.ReactNode }
  | { type: 'ok'; userId: string; supabase: SupabaseClient; active: InscriptionAletheia }

/**
 * Le seuil du module, pour un onglet.
 *
 * `avecRetour` dit si l'onglet appelant rend déjà son propre « ← Retour » :
 * les deux cartes des sorties 1 et 2 REMPLACENT la page, elles gardent donc le
 * leur quoi qu'il arrive — c'est aux ONGLETS qui les portent DANS leur corps
 * de déclarer le contraire, et aucun ne le fait aujourd'hui.
 */
export async function seuilAletheia(): Promise<SeuilAletheia> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { moduleActif, inscriptions, active, toutes, horsClasse } =
    await contexteAletheia(supabase, user.id)

  if (!moduleActif) {
    return { type: 'ecran', noeud: <CarteMessage>Ce module n&apos;est pas encore activé.</CarteMessage> }
  }
  if (!active) {
    return { type: 'ecran', noeud: <CarteMessage>Ce module n&apos;est pas disponible pour ton compte.</CarteMessage> }
  }
  // C7·L2 — les livres se lisent par classe : en état « Toutes », on la demande.
  if (toutes) {
    return { type: 'ecran', noeud: <ChoixClasseModule inscriptions={inscriptions} nomModule="Aletheia" /> }
  }
  // Accès & classes · L1 — la classe au commutateur n'a pas Aletheia : le repli
  // silencieux sur une autre inscription montrait les livres d'une classe sous
  // le nom d'une autre. On le dit, et on renvoie au commutateur.
  if (horsClasse) {
    return {
      type: 'ecran',
      noeud: (
        <ModuleHorsClasse
          nomModule="Aletheia"
          classeContexte={horsClasse}
          ailleurs={inscriptions.map((i) => i.classe_nom)}
        />
      ),
    }
  }
  return { type: 'ok', userId: user.id, supabase, active }
}
