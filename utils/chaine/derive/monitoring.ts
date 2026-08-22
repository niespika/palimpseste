// ⚠️ FICHIER DÉRIVÉ — NE S'ÉDITE JAMAIS À LA MAIN.
// Sortie de `python3 scripts/derive-instruments.py --ecris`.
// La source fait foi ; `--verifie` dit si ce fichier en a divergé
// (piège 52 ; `03-` §1 ; `07-` §4).

export const INSTRUMENT_MONITORING = {
  "bloc_machine": {
    "competence": "monitoring",
    "notation": {
      "chaine": [
        "extraction",
        "interface",
        "code"
      ],
      "croisement": {
        "entrees": [
          "confiance_declaree",
          "niveau"
        ],
        "regle": "la comparaison du §7, citée mot pour mot dans le module",
        "sortie": "calibration"
      },
      "garde_fous": {
        "competence_non_evaluee": {
          "declencheur": "une compétence dont le statut de recette n'est pas evaluee",
          "effet": "écartée du calcul, jamais inscrite à competences_couvertes",
          "statut": "acté"
        },
        "cote_manquant": {
          "declencheur": "la confiance n'est pas déclarée, ou l'instrument n'a rendu aucun niveau, ou l'élève affirme un observable que le squelette ne porte pas",
          "effet": "calibration indetermine, jamais de verdict composé",
          "statut": "acté"
        },
        "valeur_hors_liste": {
          "declencheur": "une valeur hors d'une liste fermée du catalogue",
          "effet": "alerte déclarée, jamais de valeur par défaut",
          "statut": "acté"
        }
      },
      "parametres": {}
    },
    "observables": {
      "amplitude_ecart": {
        "echelle": "ordinale",
        "source": "amplitude_ecart",
        "valeurs": [
          0,
          1,
          2,
          3,
          "n/a"
        ]
      },
      "calibration": {
        "echelle": "nominale",
        "source": "calibration",
        "valeurs": [
          "bien_calibre",
          "surconfiant",
          "sous_confiant",
          "indetermine",
          "n/a"
        ]
      }
    },
    "squelette": {
      "catalogue": {
        "aveux": [
          "signale",
          "tout_lisse"
        ],
        "confiances": [
          "elevee",
          "moyenne",
          "faible",
          "non_exprimee"
        ],
        "sources": [
          "spontanee",
          "sollicitee"
        ],
        "suppositions": [
          "distingue",
          "tout_assertif"
        ]
      }
    }
  },
  "champs_sortie": [
    "aveu_incomprehension",
    "confiance_declaree",
    "marquage_supposition"
  ],
  "degre_statut": 2,
  "empreinte_source": "b344f320f60905768b94f7b7cc4f006771eb2c33bd6c7d6d3a5fc2a3052b7500",
  "prompt_extraction": "SYSTÈME — EXTRACTION · MONITORING\n\nRôle. Tu es un extracteur. Tu relèves, dans la production d'un élève de lycée\n(Première/Terminale, philosophie/HLP), les marques par lesquelles il dit\nlui-même où il en est. Tu ne juges pas, tu ne notes pas, tu ne corriges pas.\nTu ne connais ni le cours, ni la référence, ni le corrigé : n'invente aucun\ncontenu, ne complète aucune idée.\n\nEntrée.\n- Consigne posée à l'élève : {{CONSIGNE}}\n- Réponse de l'élève (brute) : {{REPONSE_ELEVE}}\n\nRègle absolue — TU CONSIGNES, TU NE JUGES PAS. Tu ne dis jamais si l'élève a\nraison d'être incertain, ni si son incertitude tombe au bon endroit : la\nconfrontation à la vérité se fait ailleurs, par du code. Ici, une marque est\nprésente ou elle ne l'est pas. Classe selon ce qui est LITTÉRALEMENT écrit.\nN'infère pas d'intention : une prose prudente n'est pas un aveu, une phrase\nnuancée n'est pas une supposition marquée. En cas de doute raisonnable entre\ndeux valeurs, choisis la moins généreuse.\n\nCe que tu ignores.\n- La justesse de ce que l'élève dit : un aveu portant sur un point qu'il\n  maîtrise se consigne comme un aveu.\n- La qualité de la langue, l'organisation, le contenu.\n- Le NOMBRE de marques : un aveu ou dix, la valeur est la même.\n\nChamps.\n- aveu_incomprehension : l'élève signale-t-il explicitement un passage ou une\n  idée qu'il N'A PAS COMPRIS (« ce passage me résiste », « je ne comprends\n  pas… ») → \"signale\" ; ou présente-t-il tout comme également maîtrisé →\n  \"tout_lisse\". Un OUBLI factuel (« je ne me rappelle plus le nom ») ou une\n  simple INCERTITUDE (« je ne suis pas sûr de… ») n'ouvrent pas ce champ :\n  l'incertitude déclarée est le champ suivant, et c'est ce qui rend les deux\n  indépendants.\n- confiance_declaree : niveau de confiance que l'élève exprime de lui-même sur\n  son travail, s'il l'exprime → \"elevee\" / \"moyenne\" / \"faible\" /\n  \"non_exprimee\".\n- marquage_supposition : distingue-t-il ce qu'il pose comme SÛR de ce qu'il\n  avance en HYPOTHÈSE (« on peut supposer que… », « si je comprends bien,\n  alors… ») → \"distingue\" ; ou tout est-il posé au même niveau d'assurance →\n  \"tout_assertif\".\n\nLes deux premiers champs et le troisième sont indépendants. \"signale\" dit que\nl'élève nomme un manque ; \"distingue\" dit qu'il sépare deux régimes\nd'assertion dans ce qu'il avance. Une copie peut être \"tout_lisse\" et\n\"distingue\", ou \"signale\" et \"tout_assertif\". Réponds aux deux séparément.\n\nSortie. Uniquement ce JSON :\n{\n  \"aveu_incomprehension\": \"...\",\n  \"confiance_declaree\": \"...\",\n  \"marquage_supposition\": \"...\"\n}",
  "source": "competences/monitoring.md",
  "statut": "RELUE ET VALIDÉE",
  "variables": [
    "CONSIGNE",
    "REPONSE_ELEVE"
  ],
  "version": "2.1"
} as const
