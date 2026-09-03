// ============================================================================
// FRAGMENTS (élève) — « À FAIRE MAINTENANT » : la règle pure de la carte d'accueil.
// ----------------------------------------------------------------------------
// Handoff `design_handoff_fragments_eleve` (A·2) : l'élève voit UNE chose à
// faire, en tête de page, et le reste est replié. Ce module décide laquelle.
// Il est PUR (testable) : la page lui passe des faits déjà lus, il rend un
// titre, un texte, une action — jamais une requête.
//
// L'ordre est celui des urgences du tableau de bord (`app/eleve/page.tsx`) :
//   1. un retour non lu BLOQUE tout rendu (gate transversal) → il passe avant ;
//   2. un fragment en retard (90) ;
//   3. le thème — vide, ou commenté par le professeur (85) ;
//   4. le fragment de la semaine (75) ;
//   5. puis les états sans geste : déposé, à jour, facultatif, aucune semaine.
// ============================================================================

import type { StatutDuTheme } from './fragments-theme'

export type GenreAFaire =
  | 'retour_a_lire'
  | 'bloque_ailleurs'
  | 'en_retard'
  | 'theme_a_ecrire'
  | 'theme_commente'
  | 'a_deposer'
  | 'facultatif'
  | 'retour_en_preparation'
  | 'a_jour'
  | 'aucune_semaine'

export interface SemaineAFaire {
  numero: number | null
  /** Fragments réclame-t-il un fragment cette semaine (C8-L4) ? */
  reclamee: boolean
  /** L'échéance, déjà nommée dans le fuseau de l'école (« dimanche 6 septembre »). */
  limite: string
  /** L'échéance est passée. */
  echue: boolean
}

export interface FaitsAFaire {
  themeStatut: StatutDuTheme
  semaine: SemaineAFaire | null
  /** L'élève a déposé pour la semaine ouverte. */
  depose: boolean
  /** … et ce dépôt est marqué en retard. */
  depotEnRetard: boolean
  /** Le dépôt de la semaine a son retour publié. */
  retourDeLaSemaine: boolean
  /** Le dernier retour écrit de Fragments n'est pas lu (gate du module). */
  gateActif: boolean
  /** Retours non lus qui bloquent le dépôt, HORS le gate ci-dessus (autres modules, autre classe). */
  retoursAilleurs: { label: string; href: string }[]
}

export interface CarteAFaire {
  genre: GenreAFaire
  titre: string
  texte: string
  /** `null` = rien à faire (la carte dit l'état, sans bouton). */
  action: { libelle: string; href: string } | null
  /** Ton de la carte : liseré et sur-label. */
  ton: 'pigment' | 'attention' | 'retard' | 'ok' | 'neutre'
}

const sem = (s: SemaineAFaire) => (s.numero != null ? `Semaine ${s.numero}` : 'Cette semaine')

export function carteAFaire(f: FaitsAFaire): CarteAFaire {
  if (f.gateActif) {
    return {
      genre: 'retour_a_lire',
      titre: 'Lis ton dernier retour',
      texte: 'Coche chaque partie, puis valide : c’est ce qui débloque ton prochain dépôt.',
      action: { libelle: 'Lire mon retour', href: '#retour' },
      ton: 'attention',
    }
  }
  if (f.retoursAilleurs.length > 0) {
    const [premier] = f.retoursAilleurs
    const plusieurs = f.retoursAilleurs.length > 1
    return {
      genre: 'bloque_ailleurs',
      titre: plusieurs ? 'Des retours t’attendent ailleurs' : 'Un retour t’attend ailleurs',
      texte: plusieurs
        ? 'Lis-les et valide-les pour pouvoir déposer ici.'
        : `Lis-le et valide-le pour pouvoir déposer ici : ${premier.label}.`,
      action: { libelle: plusieurs ? 'Voir le premier' : 'Le lire', href: premier.href },
      ton: 'attention',
    }
  }
  if (f.semaine && !f.depose && f.semaine.reclamee && f.semaine.echue) {
    return {
      genre: 'en_retard',
      titre: `${sem(f.semaine)} — ton fragment est en retard`,
      texte: `Il était à rendre avant ${f.semaine.limite}. Dépose-le maintenant : il sera marqué en retard, mais il comptera.`,
      action: { libelle: 'Déposer', href: '#depot' },
      ton: 'retard',
    }
  }
  if (f.themeStatut === 'vide') {
    return {
      genre: 'theme_a_ecrire',
      titre: 'Propose ton thème du semestre',
      texte: 'Écris-le ci-dessus : ton professeur le relira et le validera. Tes fragments s’écriront sur ce thème.',
      action: { libelle: 'Écrire mon thème', href: '#theme' },
      ton: 'pigment',
    }
  }
  if (f.themeStatut === 'commente') {
    return {
      genre: 'theme_commente',
      titre: 'Ton professeur a commenté ton thème',
      texte: 'Lis son commentaire, puis propose ton thème à nouveau.',
      action: { libelle: 'Répondre', href: '#theme' },
      ton: 'attention',
    }
  }
  if (!f.semaine) {
    return {
      genre: 'aucune_semaine',
      titre: 'Aucune semaine n’est ouverte',
      texte: 'Ton professeur en ouvrira une bientôt.',
      action: null,
      ton: 'neutre',
    }
  }
  if (!f.depose) {
    if (f.semaine.reclamee) {
      return {
        genre: 'a_deposer',
        titre: `${sem(f.semaine)} — dépose ton fragment`,
        texte: `À rendre avant ${f.semaine.limite}. Photographie ta fiche manuscrite.`,
        action: { libelle: 'Déposer', href: '#depot' },
        ton: 'pigment',
      }
    }
    return {
      genre: 'facultatif',
      titre: `${sem(f.semaine)} — rien n’est réclamé`,
      texte: 'Pas de fragment dû cette semaine. Tu peux déposer si tu veux.',
      action: { libelle: 'Déposer quand même', href: '#depot' },
      ton: 'neutre',
    }
  }
  if (!f.retourDeLaSemaine) {
    return {
      genre: 'retour_en_preparation',
      titre: `${sem(f.semaine)} — ${f.depotEnRetard ? 'déposé en retard' : 'déposé'}`,
      texte: 'Retour en préparation : ton professeur l’examinera bientôt. Ta fiche reste visible en attendant.',
      action: null,
      ton: 'ok',
    }
  }
  return {
    genre: 'a_jour',
    titre: `${sem(f.semaine)} — à jour`,
    texte: 'Rien à faire cette semaine. On attend l’ouverture de la prochaine.',
    action: null,
    ton: 'ok',
  }
}
