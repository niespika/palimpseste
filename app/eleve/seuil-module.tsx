import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { inscriptionsModuleEleve } from '@/utils/acces'
import { contexteClasseEleve, type InscriptionEleve } from './contexte-classe'
import ChoixClasseModule from './ChoixClasseModule'
import ModuleHorsClasse from './ModuleHorsClasse'

// ----------------------------------------------------------------------------
// Le SEUIL d'un module côté élève — un seul endroit où se pose la question
// « dans quelle classe suis-je, et cette classe a-t-elle ce module ? ».
//
// Accès & classes · L1 (14/08) : le module appartient à la CLASSE. Chaque page
// module posait jusqu'ici sa propre garde sur `aAccesModule`, qui répond en
// UNION des classes de l'élève — un bi-classe entrait donc dans Codex depuis
// Test, basculait le commutateur sur T5 (qui n'a pas Codex) et lisait une page
// vide au lieu d'un refus. Centraliser évite d'écrire cinq fois la même règle
// et de la voir diverger à la sixième.
//
// Trois écrans-seuils possibles, dans cet ordre :
//   1. aucune classe de l'élève n'a le module        → mur (message d'avant) ;
//   2. commutateur sur « Toutes les classes »        → « Quelle classe ? » ;
//   3. la classe en contexte n'a pas le module       → « Passe sur Test ».
// Sinon le module s'ouvre, sur l'inscription de la classe en contexte.
// ----------------------------------------------------------------------------

export type SeuilModule =
  /** Le module s'ouvre : `inscription` est celle de la classe en contexte. */
  | { type: 'ouvert'; inscription: InscriptionEleve }
  /** Un écran-seuil prend la place du module : la page le retourne tel quel. */
  | { type: 'ecran'; noeud: React.ReactNode }

export async function seuilModule(
  supabase: SupabaseClient,
  userId: string,
  moduleId: string,
  /** Nom affiché du module — les deux écrans-seuils le disent à l'élève. */
  nomModule: string
): Promise<SeuilModule> {
  const [inscriptionsModule, { active, toutes }] = await Promise.all([
    inscriptionsModuleEleve(supabase, userId, moduleId),
    contexteClasseEleve(supabase, userId),
  ])

  // 1. Aucune classe de l'élève n'a ce module : le refus est total, quel que
  //    soit l'état du commutateur (proposer « Quelle classe ? » n'offrirait
  //    aucune classe à choisir).
  if (inscriptionsModule.length === 0) {
    return { type: 'ecran', noeud: <ModuleHorsClasse nomModule={nomModule} classeContexte={active?.classe_nom ?? ''} ailleurs={[]} /> }
  }

  // 2. État « Toutes » : un module se travaille une classe à la fois (C7·L2) et
  //    le choix ne porte que sur les classes qui l'ont.
  if (toutes) {
    return { type: 'ecran', noeud: <ChoixClasseModule inscriptions={inscriptionsModule} nomModule={nomModule} /> }
  }
  if (!active) {
    return { type: 'ecran', noeud: <ModuleHorsClasse nomModule={nomModule} classeContexte="" ailleurs={[]} /> }
  }

  // 3. Le cas réel du 14/08 : entrer dans le module, puis basculer sur une
  //    classe qui ne l'a pas. L'accès existe — ailleurs ; on le dit.
  const ici = inscriptionsModule.find((i) => i.classe_id === active.classe_id)
  if (!ici) {
    return {
      type: 'ecran',
      noeud: (
        <ModuleHorsClasse
          nomModule={nomModule}
          classeContexte={active.classe_nom}
          ailleurs={inscriptionsModule.map((i) => i.classe_nom)}
        />
      ),
    }
  }

  return { type: 'ouvert', inscription: ici }
}
