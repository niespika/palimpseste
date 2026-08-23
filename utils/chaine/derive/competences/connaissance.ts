// ⚠️ FICHIER DÉRIVÉ — NE S'ÉDITE JAMAIS À LA MAIN.
// Sortie de `python3 scripts/derive-instruments.py --ecris`.
// La source fait foi ; `--verifie` dit si ce fichier en a divergé
// (piège 52 ; `03-` §1 ; `07-` §4).

export const INSTRUMENT_CONNAISSANCE = {
  "bloc_machine": {
    "champ_confiance": "confiance",
    "competence": "connaissance",
    "notation": {
      "chaine": [
        "P1",
        "Code1",
        "P2",
        "Code2"
      ],
      "croisement": {
        "entrees": [
          "diversite",
          "justesse"
        ],
        "regle": "la règle de croisement du §4, citée mot pour mot dans le module",
        "sortie": "niveau"
      },
      "garde_fous": {
        "copie_sans_unite": {
          "declencheur": "aucune unité au relevé, mentions vides exclues",
          "effet": "niveau Absent, alerte déclarée",
          "statut": "acté"
        },
        "etendue_hors_contexte": {
          "declencheur": "une etendue rendue quand le paramètre restitution_de_cours vaut 0",
          "effet": "écartée, alerte déclarée",
          "statut": "acté"
        },
        "garde_fou_contresens": {
          "declencheur": "unités en contresens ou attributions erronee majoritaires",
          "effet": "plafond_Faible, quel que soit l'éventail",
          "statut": "acté"
        },
        "palier_ou_decompte_rendu": {
          "declencheur": "le juge rend un palier, une lettre ou un décompte",
          "effet": "alerte de recette déclarée",
          "statut": "acté"
        },
        "unite_jugee_inappariable": {
          "declencheur": "une unité jugée sans correspondance avec une unité du relevé",
          "effet": "consignée, jamais comptée, alerte déclarée",
          "statut": "acté"
        },
        "valeur_hors_liste": {
          "declencheur": "une valeur hors d'une liste fermée du catalogue",
          "effet": "alerte déclarée, jamais de valeur par défaut",
          "statut": "acté"
        }
      },
      "observables_mesure": {
        "contresens": {
          "famille": "comptage rapporté",
          "rapporte_a": "les unités jugées, les inverifiable exclues (§4)",
          "reussie": "au_plus",
          "sens": "aucun contresens ni attribution erronée — « au moins un » suffit à faire défaillir la Justesse (§4)",
          "seuil": 0,
          "statut": "acté"
        },
        "diversite_registres": {
          "famille": "comptage",
          "reussie": "au_moins",
          "sens": "au moins le paramètre de registres distincts — en dessous, la Diversité est en défaillance (§4)",
          "seuil_parametre": "min_registres",
          "statut": "provisoire (réglage empirique)"
        },
        "diversite_sources": {
          "famille": "comptage",
          "reussie": "au_moins",
          "sens": "au moins le paramètre de sources distinctes — la seule barre que le §4 donne pour les sources, et celle que la question « se juger » appelle « plusieurs »",
          "seuil_parametre": "haut_sources",
          "statut": "provisoire (réglage empirique)"
        },
        "etendue_rappel": {
          "echelle": [
            "nul",
            "fragmentaire",
            "lacunaire",
            "complet"
          ],
          "famille": "ordinal",
          "reussie": "au_moins",
          "sans_objet_si": "rendue hors du contexte de classe",
          "sens": "l'essentiel du cours est là, avec ou sans trous — les deux premières réponses de sa question « se juger » (§5)",
          "seuil": "lacunaire",
          "statut": "provisoire (réglage empirique)"
        },
        "inverifiable": {
          "famille": "comptage rapporté",
          "rapporte_a": "les unités du relevé",
          "reussie": "sans_objet",
          "sens": "signal de confiance, jamais un défaut (§5) — elles sortent des majorités, aucune mesure n'y est réussie ni ratée",
          "statut": "acté"
        },
        "mobilisation": {
          "famille": "comptage",
          "reussie": "au_moins",
          "sens": "au moins une unité mobilisée — « aucune unité » donne défaillance forte sur les deux dimensions (§4)",
          "seuil": 1,
          "statut": "acté"
        },
        "taux_justesse": {
          "famille": "proportion",
          "reussie": "plus_de",
          "sens": "la majorité stricte des unités jugées sont justes — le miroir de « unités en approximative majoritaires → défaillance » (§4)",
          "seuil": 0.5,
          "statut": "acté"
        },
        "unite_plaquee": {
          "famille": "comptage rapporté",
          "rapporte_a": "les unités jugées, les inverifiable exclues (§4)",
          "reussie": "moins_de",
          "sens": "les unités plaquées n'atteignent pas la majorité — « unités en plaque majoritaires → défaillance » (§4)",
          "seuil": 0.5,
          "statut": "acté"
        }
      },
      "parametres": {
        "haut_registres": {
          "bornes": [
            1,
            4
          ],
          "defaut": 3,
          "statut": "provisoire (réglage empirique)"
        },
        "haut_sources": {
          "bornes": [
            1,
            20
          ],
          "defaut": 3,
          "statut": "provisoire (réglage empirique)"
        },
        "min_registres": {
          "bornes": [
            1,
            4
          ],
          "defaut": 2,
          "statut": "provisoire (réglage empirique)"
        },
        "plafond_inverifiable_haut": {
          "bornes": [
            0,
            100
          ],
          "defaut": 25,
          "statut": "provisoire (réglage empirique)"
        },
        "restitution_de_cours": {
          "bornes": [
            0,
            1
          ],
          "defaut": 0,
          "statut": "acté"
        },
        "seuil_ratio_haut": {
          "bornes": [
            0.0,
            100.0
          ],
          "defaut": 4.5,
          "statut": "provisoire (réglage empirique)"
        }
      }
    },
    "observables": {
      "diversite": {
        "echelle": "ordinale",
        "source": "grades.diversite",
        "synonymes": {
          "défaillance": [
            "defaillance",
            "défaillante",
            "ko"
          ],
          "défaillance forte": [
            "defaillance forte",
            "DF"
          ],
          "haut": [
            "haute"
          ],
          "satisfaite": [
            "satisfaisante",
            "ok"
          ]
        },
        "valeurs": [
          "défaillance forte",
          "défaillance",
          "satisfaite",
          "haut"
        ]
      },
      "etendue": {
        "echelle": "ordinale",
        "source": "etendue",
        "valeurs": [
          "nul",
          "fragmentaire",
          "lacunaire",
          "complet",
          "n/a"
        ]
      },
      "justesse": {
        "echelle": "ordinale",
        "source": "grades.justesse",
        "synonymes": {
          "défaillance": [
            "defaillance",
            "défaillante",
            "ko"
          ],
          "défaillance forte": [
            "defaillance forte",
            "DF"
          ],
          "haut": [
            "haute"
          ],
          "satisfaite": [
            "satisfaisante",
            "ok"
          ]
        },
        "valeurs": [
          "défaillance forte",
          "défaillance",
          "satisfaite",
          "haut"
        ]
      },
      "niveau": {
        "echelle": "ordinale",
        "source": "niveau",
        "synonymes": {
          "Absent": [
            "E"
          ],
          "Acquis": [
            "A"
          ],
          "Bon": [
            "B"
          ],
          "Faible": [
            "D"
          ],
          "Moyen": [
            "C"
          ]
        },
        "valeurs": [
          "Absent",
          "Faible",
          "Moyen",
          "Bon",
          "Acquis"
        ]
      },
      "profil_moyen": {
        "echelle": "nominale",
        "source": "profil_moyen",
        "synonymes": {
          "juste-mais-etroit": [
            "C-étroit",
            "C-etroit",
            "c-etroit"
          ],
          "large-mais-approximatif": [
            "C-approximatif",
            "c-approximatif"
          ],
          "large-mais-decoratif": [
            "C-décoratif",
            "C-decoratif",
            "c-decoratif"
          ]
        },
        "valeurs": [
          "juste-mais-etroit",
          "large-mais-decoratif",
          "large-mais-approximatif",
          "n/a"
        ]
      }
    },
    "squelette": {
      "catalogue": {
        "attributions": [
          "correcte",
          "erronee",
          "absente",
          "n/a"
        ],
        "etendues": [
          "complet",
          "lacunaire",
          "fragmentaire",
          "nul"
        ],
        "justesses": [
          "juste",
          "approximative",
          "contresens",
          "inverifiable"
        ],
        "marqueurs_emploi": [
          "posee_seule"
        ],
        "referents": [
          "cours",
          "modele"
        ],
        "types_unite": [
          "reference",
          "concept",
          "exemple",
          "donnee"
        ],
        "verdicts_apropos": [
          "sert_le_propos",
          "plaque"
        ]
      }
    }
  },
  "competence": "connaissance",
  "degre_statut": 2,
  "empreinte_source": "cfb7bda95ee30625a9287933036c6f71c9ca7587117c6097e94b953e570d64a4",
  "observables_mesure": {
    "contresens": {
      "famille": "comptage rapporté",
      "rapporte_a": "les unités jugées, les inverifiable exclues (§4)",
      "reussie": "au_plus",
      "sens": "aucun contresens ni attribution erronée — « au moins un » suffit à faire défaillir la Justesse (§4)",
      "seuil": 0,
      "statut": "acté"
    },
    "diversite_registres": {
      "famille": "comptage",
      "reussie": "au_moins",
      "sens": "au moins le paramètre de registres distincts — en dessous, la Diversité est en défaillance (§4)",
      "seuil_parametre": "min_registres",
      "statut": "provisoire (réglage empirique)"
    },
    "diversite_sources": {
      "famille": "comptage",
      "reussie": "au_moins",
      "sens": "au moins le paramètre de sources distinctes — la seule barre que le §4 donne pour les sources, et celle que la question « se juger » appelle « plusieurs »",
      "seuil_parametre": "haut_sources",
      "statut": "provisoire (réglage empirique)"
    },
    "etendue_rappel": {
      "echelle": [
        "nul",
        "fragmentaire",
        "lacunaire",
        "complet"
      ],
      "famille": "ordinal",
      "reussie": "au_moins",
      "sans_objet_si": "rendue hors du contexte de classe",
      "sens": "l'essentiel du cours est là, avec ou sans trous — les deux premières réponses de sa question « se juger » (§5)",
      "seuil": "lacunaire",
      "statut": "provisoire (réglage empirique)"
    },
    "inverifiable": {
      "famille": "comptage rapporté",
      "rapporte_a": "les unités du relevé",
      "reussie": "sans_objet",
      "sens": "signal de confiance, jamais un défaut (§5) — elles sortent des majorités, aucune mesure n'y est réussie ni ratée",
      "statut": "acté"
    },
    "mobilisation": {
      "famille": "comptage",
      "reussie": "au_moins",
      "sens": "au moins une unité mobilisée — « aucune unité » donne défaillance forte sur les deux dimensions (§4)",
      "seuil": 1,
      "statut": "acté"
    },
    "taux_justesse": {
      "famille": "proportion",
      "reussie": "plus_de",
      "sens": "la majorité stricte des unités jugées sont justes — le miroir de « unités en approximative majoritaires → défaillance » (§4)",
      "seuil": 0.5,
      "statut": "acté"
    },
    "unite_plaquee": {
      "famille": "comptage rapporté",
      "rapporte_a": "les unités jugées, les inverifiable exclues (§4)",
      "reussie": "moins_de",
      "sens": "les unités plaquées n'atteignent pas la majorité — « unités en plaque majoritaires → défaillance » (§4)",
      "seuil": 0.5,
      "statut": "acté"
    }
  },
  "parametres": {
    "haut_registres": {
      "bornes": [
        1,
        4
      ],
      "defaut": 3,
      "statut": "provisoire (réglage empirique)"
    },
    "haut_sources": {
      "bornes": [
        1,
        20
      ],
      "defaut": 3,
      "statut": "provisoire (réglage empirique)"
    },
    "min_registres": {
      "bornes": [
        1,
        4
      ],
      "defaut": 2,
      "statut": "provisoire (réglage empirique)"
    },
    "plafond_inverifiable_haut": {
      "bornes": [
        0,
        100
      ],
      "defaut": 25,
      "statut": "provisoire (réglage empirique)"
    },
    "restitution_de_cours": {
      "bornes": [
        0,
        1
      ],
      "defaut": 0,
      "statut": "acté"
    },
    "seuil_ratio_haut": {
      "bornes": [
        0.0,
        100.0
      ],
      "defaut": 4.5,
      "statut": "provisoire (réglage empirique)"
    }
  },
  "prompts": {
    "P1": "# RÔLE\nTu es un releveur de connaissances mobilisées. Tu ne notes rien, tu ne juges\nni la justesse ni l'à-propos de quoi que ce soit. Tu lis la production d'un\nélève de lycée (Première/Terminale, philosophie/HLP) et tu consignes ce\nqu'elle convoque, TEL QUE C'EST SUR LA PAGE.\n\n# TA SEULE TÂCHE\nRepérer chaque UNITÉ DE SAVOIR que la copie mobilise — un auteur, une thèse,\nune notion du cours, un exemple, une donnée — et consigner pour chacune :\nde quel registre elle est, quelle source la copie nomme, les mots exacts par\nlesquels la copie lui FAIT DIRE quelque chose, et les mots exacts par\nlesquels cette unité TRAVAILLE dans le devoir.\n\n# RÈGLE ABSOLUE N° 1 — NE RIEN CRÉDITER\nMobiliser n'est pas mentionner. « Comme le dit Kant » n'est pas une\nmobilisation : rien n'est attribué, rien n'est vérifiable, il n'y a rien à\njuger. La mobilisation commence quand la copie FAIT DIRE QUELQUE CHOSE à sa\nsource. Tu ne complètes jamais, tu ne devines jamais, tu ne rétablis jamais\nce que l'élève « voulait dire ». Une unité n'existe que si tu peux la citer.\n\n# RÈGLE ABSOLUE N° 2 — TU NE SAIS RIEN\nTu consignes ce que la copie DIT de Bergson ; jamais ce que Bergson a dit.\nQu'elle soit exacte, approximative ou fausse ne te regarde pas et ne doit\nrien changer à ton relevé. Une thèse fausse se relève exactement comme une\nthèse juste. Un autre lecteur jugera, et il ne le pourra que si tu as relevé\nsans corriger.\n\n# LES QUATRE REGISTRES (liste fermée — UN registre par unité)\n- \"reference\" : un auteur, une œuvre, une thèse d'auteur.\n- \"concept\" : une notion ou une distinction du cours.\n- \"exemple\" : un cas, une situation, une œuvre convoquée pour illustrer.\n- \"donnee\" : un chiffre, un fait daté, un résultat.\n\n# LES DEUX CHAMPS QUI SE CONFONDENT — citation ≠ emploi\n- citation : les mots par lesquels la copie fait dire quelque chose à\n  l'unité. C'est le CONTENU convoqué. 30 mots au plus.\n- emploi : les mots par lesquels cette unité travaille — la thèse qu'elle\n  appuie, la distinction qu'elle sert, la difficulté qu'elle tranche. C'est\n  ce que la copie EN FAIT.\n\nSi la copie nomme l'unité, lui fait dire quelque chose, et que rien ne s'y\nappuie ensuite, écris emploi : [posee_seule]. Ne le déduis pas de la\nbrièveté : cherche dans TOUT le devoir si quelque chose s'appuie dessus.\n\n- « Pour Bergson, la durée vécue ne se compte pas. » — et rien, plus loin, ne\n  s'appuie là-dessus. → citation remplie, emploi [posee_seule].\n- « Pour Bergson, la durée vécue ne se compte pas ; c'est pourquoi vouloir\n  mesurer le temps d'un deuil n'a pas de sens. » → emploi : « vouloir\n  mesurer le temps d'un deuil n'a pas de sens ».\n\n# LE CHAMP source\nL'auteur, l'œuvre ou le domaine QUE LA COPIE NOMME, dans ses mots exacts.\nSi elle n'en nomme aucun, laisse la chaîne vide. N'attribue jamais une\nsource que la copie ne nomme pas, même si elle te paraît évidente.\n\n# LES MENTIONS VIDES\nUn nom lâché sans contenu — « comme le dit Kant », « selon les philosophes\nantiques » — n'est PAS une unité. Consigne-le à part, dans mentions_vides,\navec les mots exacts. Sans cela, une copie qui n'aligne que des allusions\nrendrait un relevé vide, et personne ne pourrait expliquer à l'élève ce qui\nlui manque.\n\n# CE QUE TU IGNORES\n- Le style, la fluidité, le vocabulaire : compétence Expression.\n- L'organisation, le plan, les transitions : compétence Structure.\n- La force du raisonnement et la qualité des liens : compétence Argumentation.\n- Ce que les unités deviennent ensemble : compétence Synthèse.\n- Et, encore une fois, la justesse : elle ne se juge pas ici.\n\n# CITER EN NUMÉROS\nLe pré-relevé donne la production découpée en phrases numérotées. Le champ\nphrases porte les numéros des phrases qui portent l'unité. N'invente aucun\nnuméro, n'en donne aucun qui ne figure pas au pré-relevé.\n\n# SORTIE (JSON strict, aucun texte autour)\n{\n  \"unites_mobilisees\": [\n    {\n      \"u\": 1,\n      \"type\": \"reference | concept | exemple | donnee\",\n      \"source\": \"l'auteur, l'œuvre ou le domaine que la copie nomme ; chaîne vide si elle n'en nomme aucun\",\n      \"citation\": \"les mots exacts par lesquels la copie fait dire quelque chose à l'unité, 30 mots au plus\",\n      \"phrases\": [3, 4],\n      \"emploi\": \"les mots exacts par lesquels l'unité travaille, ou [posee_seule]\"\n    }\n  ],\n  \"mentions_vides\": [\n    { \"citation\": \"les mots exacts du nom lâché sans contenu\", \"phrases\": [7] }\n  ]\n}\n\nAucun autre champ. Pas de justesse, pas de niveau, pas de décompte : ils ne\nt'appartiennent pas.\n\n# CONSIGNE\n{consigne}\n\n# PRODUCTION\n{production}\n\n# PRÉ-RELEVÉ (phrases numérotées)\n{pre_releve}",
    "P2": "# RÔLE\nTu es un juge de connaissances mobilisées. Tu observes, tu qualifies, tu\njustifies — mais tu ne comptes rien, tu n'agrèges rien, et tu n'attribues\naucun niveau. Un programme s'en charge à partir de ce que tu rends.\n\nTu lis le relevé d'une production d'élève de lycée : les unités de savoir\nqu'elle mobilise, avec leur registre, leur source, ce que la copie leur fait\ndire et ce qu'elle en fait. Tu n'as PAS la production et tu n'en as pas\nbesoin. Tu reçois en revanche le corpus du cours de sa classe.\n\n# TU NE CALCULES RIEN\nTu ne comptes ni les unités, ni les registres, ni les sources. Tu ne\ndétermines aucune majorité. Tu ne donnes aucune lettre, aucun palier, aucune\nproportion. N'écris aucun décompte, taux ni niveau : la chaîne serait en\nerreur. Les identifiants `u` recopiés du relevé sont attendus, ce ne sont pas\ndes décomptes.\n\n# LES DEUX RÉFÉRENTS, DANS CET ORDRE\n1. LE CORPUS DU COURS. C'est lui qui fait foi. Quand le cours s'écarte de la\n   doctrine des manuels, c'est le cours qui a raison : l'élève est jugé sur\n   ce qu'on lui a enseigné, jamais sur le canon. Ne convoque JAMAIS un manuel\n   contre le corpus.\n2. TON PROPRE SAVOIR, en repli, pour l'unité que le corpus ne porte pas.\n\n# L'ABSENCE N'EST PAS UNE FAUTE\nLe corpus ne porte que la matière déjà vue en classe, et il s'arrête là. Une\nunité qu'il ne porte pas n'est PAS un contresens de ce seul fait : elle passe\nau second référent, et tu écris referent: \"modele\". L'élève qui mobilise hors\ndu cours ne doit rien y perdre. Et si tu ne peux établir la justesse ni par\nle corpus ni par ton savoir, écris justesse: \"inverifiable\". ON NE FABRIQUE\nPAS UN CONTRESENS FAUTE DE RÉFÉRENCE.\n\n# LES QUATRE JUGEMENTS, UNITÉ PAR UNITÉ\n- justesse : \"juste\" | \"approximative\" | \"contresens\" | \"inverifiable\"\n  Ce que la copie FAIT DIRE à l'unité est-il exact ? Tu juges la citation,\n  jamais la réputation de l'auteur.\n- attribution : \"correcte\" | \"erronee\" | \"absente\" | \"n/a\"\n  La thèse est-elle prêtée au bon auteur ? Pose-toi d'abord une question :\n  cette unité prête-t-elle quelque chose à quelqu'un ? Si OUI et que la copie\n  ne le nomme pas, c'est \"absente\" — un défaut. Si NON — un exemple autonome,\n  une donnée sans source, une notion de sens commun —, c'est \"n/a\", et ce\n  n'est pas un défaut.\n- apropos : \"sert_le_propos\" | \"plaque\"\n  L'unité TRAVAILLE-t-elle pour CE sujet ? C'est le champ emploi que tu lis.\n  Un emploi [posee_seule] en est le cas d'école, mais il n'est pas à lui seul\n  un verdict : une unité peut être employée et rester hors du propos.\n- referent : \"cours\" | \"modele\"\n  Contre lequel des deux tu as jugé. Il commande la confiance.\n\nJUSTE ET PLAQUÉ NE S'OPPOSENT PAS. Une unité peut être parfaitement exacte et\nhors de propos ; une unité approximative peut servir le propos. Les quatre\njugements sont indépendants — ne fais pas descendre l'un parce qu'un autre\ndescend.\n\n# L'ÉTENDUE DU RAPPEL — SEULEMENT SI ON TE LA DEMANDE\nLe champ « Restitution de cours », plus bas, vaut \"oui\" ou \"non\".\n\nSi \"non\" : n'écris ni etendue ni ce_qui_manque. La question ne se pose pas.\n\nSi \"oui\" — la production est une restitution du cours faite de mémoire —,\nrends en plus :\n- etendue : \"complet\" | \"lacunaire\" | \"fragmentaire\" | \"nul\", jugée contre le\n  corpus ;\n- ce_qui_manque : ce que le cours porte et que la production ne rappelle pas,\n  NOMMÉ. C'est cette phrase-là, et non la valeur, qui servira à l'élève.\n\nCe n'est PAS une proportion. Le cours n'est pas une liste d'unités et tu ne\ndois pas le découper pour compter : tu juges, et tu nommes ce qui manque.\n\n# CE QUE TU IGNORES\n- L'usage argumentatif d'une référence — si elle prouve ce qu'elle doit\n  prouver, si le lien est écrit : compétence Argumentation. Une source peut\n  être juste et à propos sans rien prouver ; cela ne te regarde pas.\n- Ce que les unités deviennent ensemble, mises en relation ou coiffées :\n  compétence Synthèse.\n- Le lexique commun, les mots vagues ou d'apparat : compétence Expression.\n- L'architecture et les transitions : compétence Structure.\n\n# TU NE COMPLÈTES PAS\nTu ne juges que les unités du relevé. Tu n'en ajoutes aucune, même si le\ncorpus te souffle que l'élève aurait pu en mobiliser une autre. Et tu ne\ncorriges aucune citation : tu la juges telle qu'elle est écrite.\n\n# CE QUI EST DESTINÉ À L'ÉLÈVE\nTon évaluation alimente un dispositif d'apprentissage : l'élève doit savoir\noù il en est et la SEULE prochaine chose à travailler.\n\n- justification_ancree : 2 à 4 phrases appuyées sur les unités, sans nombre\n  ni palier, qui nomme le contresens ou le plaqué décisif. Destinée à la\n  validation par le professeur.\n- ce_qui_plafonne : ce qui empêche d'aller plus haut — un contresens, une\n  attribution fausse, des unités posées là, un éventail qui tient sur une\n  seule source.\n- levier : l'action concrète et prioritaire. Par exemple : « ta copie tient\n  sur Bergson seul : un exemple ou une donnée d'un autre registre ouvrirait\n  le palier suivant » ; « l'unité 3 prête à Kant la thèse inverse, reprends\n  la distinction légalité / moralité ».\n- confiance : \"élevée\" | \"moyenne\" | \"faible\". Abaisse-la si tu as rendu des\n  \"inverifiable\", si le relevé est très court, ou si un jugement t'a coûté.\n\nCette exigence de netteté ne doit jamais te rendre indulgent : tu décris ce\nqui est, sans l'embellir.\n\n# SORTIE (JSON strict, aucun texte autour)\n{\n  \"unites\": [\n    { \"u\": 1,\n      \"justesse\": \"juste | approximative | contresens | inverifiable\",\n      \"attribution\": \"correcte | erronee | absente\",\n      \"apropos\": \"sert_le_propos | plaque\",\n      \"referent\": \"cours | modele\" }\n  ],\n  \"etendue\": \"complet | lacunaire | fragmentaire | nul\",\n  \"ce_qui_manque\": \"ce que le cours porte et que la production ne rappelle pas\",\n  \"justification_ancree\": \"2 à 4 phrases, sans niveau ni décompte\",\n  \"ce_qui_plafonne\": \"…\",\n  \"levier\": \"…\",\n  \"confiance\": \"élevée | moyenne | faible\"\n}\n\nAucun autre champ. Pas de niveau, pas de diversité, pas de justesse\nd'ensemble, aucun compte : ils appartiennent au programme. Les champs\netendue et ce_qui_manque n'apparaissent QUE si la restitution de cours vaut\n\"oui\".\n\n# RESTITUTION DE COURS\n{restitution_de_cours}\n\n# LE CORPUS DU COURS\n{corpus_cours}\n\n# LA CONSIGNE\n{consigne}\n\n# LE RELEVÉ À JUGER\n{releve_phase_1}"
  },
  "source": "competences/connaissance.md",
  "statut": "RELUE ET VALIDÉE",
  "version": "2.2"
} as const
