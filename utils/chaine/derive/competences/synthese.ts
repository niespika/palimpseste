// ⚠️ FICHIER DÉRIVÉ — NE S'ÉDITE JAMAIS À LA MAIN.
// Sortie de `python3 scripts/derive-instruments.py --ecris`.
// La source fait foi ; `--verifie` dit si ce fichier en a divergé
// (piège 52 ; `03-` §1 ; `07-` §4).

export const INSTRUMENT_SYNTHESE = {
  "bloc_machine": {
    "champ_confiance": "confiance",
    "competence": "synthese",
    "notation": {
      "chaine": [
        "P1A",
        "P1B",
        "P2",
        "Code"
      ],
      "croisement": {
        "entrees": [
          "palier_base",
          "seuil_franchi"
        ],
        "regle": "la règle d'agrégation du §4, citée mot pour mot dans le module",
        "sortie": "niveau"
      },
      "garde_fous": {
        "apport_apparie": {
          "declencheur": "un apport dont le terme se retrouve dans la référence",
          "effet": "alerte déclarée, l'apport n'ouvre pas le seuil",
          "statut": "acté"
        },
        "compression_hors_bornes": {
          "declencheur": "taux de compression hors des bornes de la consigne",
          "effet": "confiance abaissée, signal ; aucun plafond",
          "statut": "provisoire (réglage empirique)"
        },
        "fidelite_limite_illisible": {
          "declencheur": "une fidélité limite dont la note ne nomme pas deux états",
          "effet": "comptée contresens_partiel, alerte déclarée",
          "statut": "acté"
        },
        "operation_incoherente": {
          "declencheur": "une operation qui contredit la cardinalité de correspond_a",
          "effet": "alerte déclarée, aucune correction",
          "statut": "acté"
        },
        "production_sans_unite": {
          "declencheur": "aucune unité au relevé",
          "effet": "niveau Absent, alerte déclarée",
          "statut": "acté"
        },
        "rapport_orphelin": {
          "declencheur": "un rapport qui vise une unité inexistante",
          "effet": "rapport écarté de l'appariement, alerte déclarée",
          "statut": "acté"
        }
      },
      "observables_mesure": {
        "apport_decoratif": {
          "famille": "comptage rapporté",
          "rapporte_a": "les apports tentés",
          "reussie": "moins_de",
          "sans_objet_si": "aucun apport tenté",
          "sens": "les apports rétrogradés au test du déploiement n'atteignent pas la moitié des apports tentés",
          "seuil": 0.5,
          "statut": "acté"
        },
        "apport_non_couvrant": {
          "famille": "comptage rapporté",
          "rapporte_a": "les apports tentés",
          "reussie": "moins_de",
          "sans_objet_si": "aucun apport tenté",
          "sens": "les apports rétrogradés au test de la couverture n'atteignent pas la moitié des apports tentés",
          "seuil": 0.5,
          "statut": "acté"
        },
        "apport_organisateur": {
          "famille": "binaire",
          "reussie": "vaut",
          "sens": "au moins un apport survit au crible — la condition du seuil au §4",
          "statut": "acté",
          "valeur_reussie": "oui"
        },
        "apport_vide": {
          "famille": "comptage rapporté",
          "rapporte_a": "les apports tentés",
          "reussie": "moins_de",
          "sans_objet_si": "aucun apport tenté",
          "sens": "les apports rétrogradés au test du contenu n'atteignent pas la moitié des apports tentés",
          "seuil": 0.5,
          "statut": "acté"
        },
        "contresens_majeur": {
          "famille": "comptage rapporté",
          "rapporte_a": "les unités appariées à la référence",
          "reussie": "au_plus",
          "sens": "aucun contresens majeur — un seul sur une thèse essentielle plafonne à Faible au §4",
          "seuil": 0,
          "statut": "acté"
        },
        "contresens_partiel": {
          "famille": "comptage rapporté",
          "rapporte_a": "les unités appariées à la référence",
          "reussie": "au_plus",
          "sens": "les contresens partiels ne dépassent pas le paramètre — au-delà, le §4 plafonne à Moyen",
          "seuil_parametre": "contresens_partiels_plafond_moyen",
          "statut": "provisoire (réglage empirique)"
        },
        "copie_verbatim": {
          "famille": "proportion",
          "reussie": "moins_de",
          "sens": "la reprise verbatim n'est pas dominante — « reprise verbatim dominante donne Absent » au §4",
          "seuil": 0.5,
          "statut": "acté"
        },
        "couverture_essentielles": {
          "famille": "proportion",
          "reussie": "au_moins",
          "sens": "la part de thèses essentielles couvertes fidèlement atteint le paramètre — la condition de Bon au §4",
          "seuil_parametre": "part_essentielles_bon",
          "statut": "provisoire (réglage empirique)"
        },
        "elagage": {
          "famille": "comptage",
          "porte_sur": "les inversions comptées à part (§5)",
          "reussie": "au_plus",
          "sens": "aucune inversion hiérarchique — la règle d'agrégation du §4 fait tomber toute inversion à Moyen ; l'observable rend deux nombres, le verdict ne lit que celui-là",
          "seuil": 0,
          "statut": "acté"
        },
        "mobilisation_reliee": {
          "famille": "proportion",
          "reussie": "plus_de",
          "sens": "les unités prises dans au moins un rapport non additif sont strictement majoritaires — la condition de Bon sans référence, règle d'agrégation du §4",
          "seuil": 0.5,
          "statut": "acté"
        },
        "part_integrative": {
          "famille": "proportion",
          "reussie": "plus_de",
          "sens": "la part intégrative est strictement majoritaire — la condition de Bon au §4",
          "seuil": 0.5,
          "statut": "acté"
        },
        "relation_rendue": {
          "famille": "proportion",
          "reussie": "au_moins",
          "sens": "la part de rapports de la référence appariés atteint le paramètre — « rapports rendus », condition de Bon au §4",
          "seuil_parametre": "part_rapports_rendus_bon",
          "statut": "provisoire (réglage empirique)"
        },
        "taux_compression": {
          "famille": "proportion",
          "reussie": "sans_objet",
          "sens": "conformité de consigne, pas de compétence (§5) — hors bornes il rend un signal, jamais une note ; aucune mesure n'y est réussie ni ratée",
          "statut": "acté"
        }
      },
      "parametres": {
        "compression_cible": {
          "bornes": [
            0.0,
            1.0
          ],
          "defaut": null,
          "statut": "provisoire (réglage empirique)"
        },
        "contresens_partiels_plafond_moyen": {
          "bornes": [
            1,
            20
          ],
          "defaut": 2,
          "statut": "provisoire (réglage empirique)"
        },
        "part_essentielles_bon": {
          "bornes": [
            0.0,
            1.0
          ],
          "defaut": 0.8,
          "statut": "provisoire (réglage empirique)"
        },
        "part_rapports_rendus_bon": {
          "bornes": [
            0.0,
            1.0
          ],
          "defaut": 0.8,
          "statut": "provisoire (réglage empirique)"
        },
        "seuil_ngrammes_copie": {
          "bornes": [
            3,
            30
          ],
          "defaut": 8,
          "statut": "provisoire (réglage empirique)"
        },
        "tolerance_compression": {
          "bornes": [
            0.0,
            5.0
          ],
          "defaut": 0.5,
          "statut": "provisoire (réglage empirique)"
        }
      }
    },
    "observables": {
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
      "palier_base": {
        "echelle": "ordinale",
        "source": "palier_base",
        "valeurs": [
          "Absent",
          "Faible",
          "Moyen",
          "Bon"
        ]
      },
      "seuil_franchi": {
        "echelle": "nominale",
        "source": "seuil_franchi",
        "synonymes": {
          "non": [
            "faux",
            "false"
          ],
          "oui": [
            "vrai",
            "true"
          ]
        },
        "valeurs": [
          "oui",
          "non"
        ]
      }
    },
    "squelette": {
      "catalogue": {
        "fidelites": [
          "fidele",
          "contresens_partiel",
          "contresens_majeur",
          "limite"
        ],
        "fonctions_reference": [
          "defend_these",
          "explique",
          "illustre"
        ],
        "formes_these": [
          "affirmation_complete",
          "mot_ou_syntagme",
          "question",
          "absente"
        ],
        "natures_rapport": [
          "additive",
          "nuance",
          "refute",
          "illustre",
          "conclut",
          "precise"
        ],
        "operations": [
          "copie",
          "paraphrase",
          "fusion",
          "generalisation",
          "apport"
        ],
        "referents": [
          "texte",
          "cours"
        ],
        "statuts_unite": [
          "essentielle",
          "secondaire",
          "illustration"
        ],
        "verdicts_apport": [
          "organisateur",
          "vide",
          "decoratif",
          "non_couvrant"
        ]
      }
    }
  },
  "competence": "synthese",
  "degre_statut": 2,
  "empreinte_source": "3b3beeadf8f19e9501ef10613ad0f69ab18c8f7542bedffbc5252d9a0cb97441",
  "observables_mesure": {
    "apport_decoratif": {
      "famille": "comptage rapporté",
      "rapporte_a": "les apports tentés",
      "reussie": "moins_de",
      "sans_objet_si": "aucun apport tenté",
      "sens": "les apports rétrogradés au test du déploiement n'atteignent pas la moitié des apports tentés",
      "seuil": 0.5,
      "statut": "acté"
    },
    "apport_non_couvrant": {
      "famille": "comptage rapporté",
      "rapporte_a": "les apports tentés",
      "reussie": "moins_de",
      "sans_objet_si": "aucun apport tenté",
      "sens": "les apports rétrogradés au test de la couverture n'atteignent pas la moitié des apports tentés",
      "seuil": 0.5,
      "statut": "acté"
    },
    "apport_organisateur": {
      "famille": "binaire",
      "reussie": "vaut",
      "sens": "au moins un apport survit au crible — la condition du seuil au §4",
      "statut": "acté",
      "valeur_reussie": "oui"
    },
    "apport_vide": {
      "famille": "comptage rapporté",
      "rapporte_a": "les apports tentés",
      "reussie": "moins_de",
      "sans_objet_si": "aucun apport tenté",
      "sens": "les apports rétrogradés au test du contenu n'atteignent pas la moitié des apports tentés",
      "seuil": 0.5,
      "statut": "acté"
    },
    "contresens_majeur": {
      "famille": "comptage rapporté",
      "rapporte_a": "les unités appariées à la référence",
      "reussie": "au_plus",
      "sens": "aucun contresens majeur — un seul sur une thèse essentielle plafonne à Faible au §4",
      "seuil": 0,
      "statut": "acté"
    },
    "contresens_partiel": {
      "famille": "comptage rapporté",
      "rapporte_a": "les unités appariées à la référence",
      "reussie": "au_plus",
      "sens": "les contresens partiels ne dépassent pas le paramètre — au-delà, le §4 plafonne à Moyen",
      "seuil_parametre": "contresens_partiels_plafond_moyen",
      "statut": "provisoire (réglage empirique)"
    },
    "copie_verbatim": {
      "famille": "proportion",
      "reussie": "moins_de",
      "sens": "la reprise verbatim n'est pas dominante — « reprise verbatim dominante donne Absent » au §4",
      "seuil": 0.5,
      "statut": "acté"
    },
    "couverture_essentielles": {
      "famille": "proportion",
      "reussie": "au_moins",
      "sens": "la part de thèses essentielles couvertes fidèlement atteint le paramètre — la condition de Bon au §4",
      "seuil_parametre": "part_essentielles_bon",
      "statut": "provisoire (réglage empirique)"
    },
    "elagage": {
      "famille": "comptage",
      "porte_sur": "les inversions comptées à part (§5)",
      "reussie": "au_plus",
      "sens": "aucune inversion hiérarchique — la règle d'agrégation du §4 fait tomber toute inversion à Moyen ; l'observable rend deux nombres, le verdict ne lit que celui-là",
      "seuil": 0,
      "statut": "acté"
    },
    "mobilisation_reliee": {
      "famille": "proportion",
      "reussie": "plus_de",
      "sens": "les unités prises dans au moins un rapport non additif sont strictement majoritaires — la condition de Bon sans référence, règle d'agrégation du §4",
      "seuil": 0.5,
      "statut": "acté"
    },
    "part_integrative": {
      "famille": "proportion",
      "reussie": "plus_de",
      "sens": "la part intégrative est strictement majoritaire — la condition de Bon au §4",
      "seuil": 0.5,
      "statut": "acté"
    },
    "relation_rendue": {
      "famille": "proportion",
      "reussie": "au_moins",
      "sens": "la part de rapports de la référence appariés atteint le paramètre — « rapports rendus », condition de Bon au §4",
      "seuil_parametre": "part_rapports_rendus_bon",
      "statut": "provisoire (réglage empirique)"
    },
    "taux_compression": {
      "famille": "proportion",
      "reussie": "sans_objet",
      "sens": "conformité de consigne, pas de compétence (§5) — hors bornes il rend un signal, jamais une note ; aucune mesure n'y est réussie ni ratée",
      "statut": "acté"
    }
  },
  "parametres": {
    "compression_cible": {
      "bornes": [
        0.0,
        1.0
      ],
      "defaut": null,
      "statut": "provisoire (réglage empirique)"
    },
    "contresens_partiels_plafond_moyen": {
      "bornes": [
        1,
        20
      ],
      "defaut": 2,
      "statut": "provisoire (réglage empirique)"
    },
    "part_essentielles_bon": {
      "bornes": [
        0.0,
        1.0
      ],
      "defaut": 0.8,
      "statut": "provisoire (réglage empirique)"
    },
    "part_rapports_rendus_bon": {
      "bornes": [
        0.0,
        1.0
      ],
      "defaut": 0.8,
      "statut": "provisoire (réglage empirique)"
    },
    "seuil_ngrammes_copie": {
      "bornes": [
        3,
        30
      ],
      "defaut": 8,
      "statut": "provisoire (réglage empirique)"
    },
    "tolerance_compression": {
      "bornes": [
        0.0,
        5.0
      ],
      "defaut": 0.5,
      "statut": "provisoire (réglage empirique)"
    }
  },
  "prompts": {
    "P1A": "# RÔLE\nTu es un releveur de synthèse. Tu ne notes rien, tu ne juges pas la qualité.\nTu lis la production d'un élève de lycée (Première/Terminale,\nphilosophie/HLP) — un condensé de texte, ou une restitution de ce qu'il a\nretenu du cours — et tu relèves ce qu'elle dit et ce qu'elle fait, TELLE\nQU'ELLE EST SUR LA PAGE.\n\nTu n'as pas le texte d'origine ni le cours, et tu n'en as pas besoin. Ce\nn'est pas ton travail de vérifier si l'élève dit vrai.\n\n# TA SEULE TÂCHE\n1. Découper la production en UNITÉS : les contenus distincts qu'elle\n   restitue.\n2. Relever les RAPPORTS : chaque endroit où l'élève relie explicitement au\n   moins deux de ses unités, avec les mots exacts qui portent le lien.\n3. Relever les APPORTS : les termes qui coiffent — un mot, une distinction,\n   une formule qui prétend dire ce que plusieurs unités font ensemble.\n4. Dire sous quelle forme la thèse d'ensemble est énoncée.\n\n# RÈGLE ABSOLUE — NE RIEN CRÉDITER\nC'est le point critique, en deux faces.\n1. UNE UNITÉ N'EXISTE QUE SI TU PEUX LA CITER. Ne relève aucun contenu\n   supposé, impliqué, ou « évidemment sous-entendu ». Si l'élève ne l'a pas\n   écrit, il n'y est pas.\n2. UN RAPPORT N'EXISTE QUE S'IL EST ÉCRIT. Deux unités visiblement opposées\n   mais que l'élève ne confronte jamais ne font AUCUN rapport. C'est\n   précisément ce qu'on mesure : le silo. Ne relie rien à sa place.\n\n# LES SIX NATURES DE RAPPORT (liste fermée)\n- \"additive\" : la juxtaposition marquée — de plus, ensuite, également,\n  puis, aussi. Ce n'est pas un rapport, c'est son absence signalée.\n- \"nuance\" : toutefois, dans une certaine mesure, sauf que, cependant.\n- \"refute\" : alors que, loin de, contrairement à, mais, au contraire.\n- \"illustre\" : par exemple, ainsi, comme le montre, c'est le cas de.\n- \"conclut\" : donc, par conséquent, il s'ensuit, dès lors, c'est\n  pourquoi.\n- \"precise\" : plus précisément, c'est-à-dire, autrement dit, en\n  d'autres termes.\n\"nuance\" restreint la portée ; \"precise\" détermine le contenu sans rien\nretirer. \"illustre\" donne un cas ; \"conclut\" tire une conséquence.\nChoisis la nature d'après les mots que tu cites, pas d'après ce que tu\ncrois que l'élève a voulu dire.\n\n# LES APPORTS (à consigner, jamais à juger)\nUn APPORT est un terme qui coiffe : il prétend dire ce que plusieurs\nunités font ensemble. Consigne le terme exact, les unités qu'il RECOUVRE —\ncelles dont il condense ou réorganise le contenu — et son DÉPLOIEMENT :\nles endroits où l'élève FAIT quelque chose de ce terme (il relit une unité\nà travers lui, il opère un partage, il tranche une difficulté). S'il est\nposé une fois et plus jamais repris, écris [pose_seul].\n- « l'oubli n'est pas l'échec de la mémoire mais son tri : conserver et\n  perdre sont les deux gestes d'une même économie du passé » → terme\n  « économie du passé » ; recouvre les unités sur la conservation et sur la\n  sélection ; déploiement : la phrase les relit toutes deux à travers lui.\n- « ces deux thèses montrent que la mémoire est une question complexe » →\n  terme « complexe » ; unites_recouvertes [] : aucun contenu des unités n'y\n  est repris ; déploiement [pose_seul].\n- « comme le montre aussi Freud avec le refoulement » → terme\n  « refoulement » ; unites_recouvertes [] ; déploiement [pose_seul].\nTu consignes les trois de la même façon. Le tri entre concept, étiquette\nvide, terme décoratif et terme qui ne rassemble rien appartient à\nl'évaluateur.\n\n# LA FORME DE LA THÈSE\n- \"affirmation_complete\" : l'élève énonce une thèse, sujet et prédicat.\n- \"mot_ou_syntagme\" : il donne un thème, pas une thèse (« la mémoire »,\n  « le rapport entre l'oubli et l'action »).\n- \"question\" : il pose une question au lieu d'affirmer.\n- \"absente\" : rien qui prétende dire ce que l'ensemble affirme.\n\n# CE QUE TU IGNORES\n- Le style, la fluidité, le vocabulaire : une production pataude et une\n  production élégante se relèvent à l'identique.\n- L'orthographe.\n- La justesse : tu ne sais pas ce que dit le texte d'origine, et tu n'as\n  pas à le deviner.\n- La validité philosophique des idées et des rapports.\n\n# SORTIE (JSON strict, aucun texte autour)\n{\n  \"unites\": [\n    { \"u\": 1,\n      \"citation\": \"les mots exacts de l'élève, 30 mots au plus\",\n      \"segments\": [1, 2] }\n  ],\n  \"rapports\": [\n    { \"entre\": [1, 3],\n      \"citation\": \"les mots exacts qui portent le lien\",\n      \"nature\": \"additive | nuance | refute | illustre | conclut | precise\" }\n  ],\n  \"apports\": [\n    { \"terme_cite\": \"les mots exacts de l'élève\",\n      \"unites_recouvertes\": [1, 3],\n      \"deploiement\": [\"citation de l'endroit où le terme retravaille\"] }\n  ],\n  \"these_forme\": \"affirmation_complete | mot_ou_syntagme | question | absente\",\n  \"these_citee\": \"la thèse telle qu'énoncée, ou \\\"\\\"\"\n}\n\n# MATÉRIAU\nConsigne donnée à l'élève : {consigne}\nPré-relevé mécanique (phrases numérotées, compression) : {pre_releve}\nProduction de l'élève : {production}",
    "P1B": "# RÔLE\nTu es un aligneur. Tu ne notes rien, tu ne juges pas la qualité, tu ne\ncomptes rien. On te donne les UNITÉS relevées dans la production d'un\nélève, et la RÉFÉRENCE DÉCOMPOSÉE du texte qu'il devait restituer. Tu dis,\npour chaque unité de l'élève, ce qu'elle restitue du texte, et par quelle\nopération.\n\n# TA SEULE TÂCHE\nPour chaque unité de la production :\n1. correspond_a : les numéros d'unités de la RÉFÉRENCE que cette unité\n   restitue effectivement — ou [] si elle n'en restitue aucune.\n2. operation : par quel geste.\n\n# RÈGLE ABSOLUE — NE RIEN CRÉDITER\nUne unité de la référence n'est restituée que si l'unité de l'élève la dit\neffectivement. Jamais parce que « ça va de soi », jamais parce que le reste\nde la production la suppose. Créditer une couverture non écrite changerait\nune restitution trouée en restitution complète.\n\nCÉCITÉ AU CANON : tu alignes contre la RÉFÉRENCE FOURNIE, jamais contre ce\nque tu sais du thème ou de l'auteur. Si le texte dit autre chose que la\ndoctrine que tu connais, c'est le texte qui fait foi.\n\nEt tu alignes même quand l'élève se trompe : une unité qui VISE une unité\nde la référence en la déformant lui correspond quand même. Ce n'est pas toi\nqui juges la fidélité — dis à quoi elle vise.\n\n# LES CINQ OPÉRATIONS (liste fermée)\n- \"copie\" : reprise verbatim ou quasi d'une unité de la référence. Le\n  pré-relevé te signale les recouvrements littéraux ; confirme-les, n'en\n  invente pas.\n- \"paraphrase\" : reformulation locale d'UNE unité.\n- \"fusion\" : l'unité de l'élève couvre PLUSIEURS unités de la référence en\n  rendant leur rapport.\n- \"generalisation\" : un terme surordonné remplace plusieurs unités ou une\n  énumération.\n- \"apport\" : aucune correspondance — l'unité dit quelque chose que la\n  référence ne dit nulle part. correspond_a doit alors être [].\n\n# CE QUE TU IGNORES\n- Le style et l'orthographe.\n- La qualité, le niveau, la note : rien de tout cela ne te concerne.\n- Les rapports et les apports relevés dans la production : ils ne sont pas\n  ton objet, un programme s'en charge.\n\n# SORTIE (JSON strict, aucun texte autour)\n{\n  \"alignement\": [\n    { \"u\": 1,\n      \"correspond_a\": [3, 4],\n      \"operation\": \"copie | paraphrase | fusion | generalisation | apport\" }\n  ]\n}\n\nAucun autre champ. Pas de \"niveau\", pas de \"fidelite\", pas de décompte :\nils appartiennent à l'évaluateur et au programme.\n\n# MATÉRIAU\nRéférence décomposée (unités numérotées, fonctions, rapports et cibles) :\n{reference_decomposee}\nUnités relevées dans la production : {unites_relevees}\nRecouvrements verbatim signalés par le pré-relevé : {recouvrements}",
    "P2": "# RÔLE\nTu es un lecteur de squelettes de synthèse. Tu observes, tu qualifies, tu\njustifies — mais tu ne comptes rien, tu n'agrèges rien, et tu n'attribues\naucun niveau. Un programme s'en charge à partir de ce que tu rends.\n\nTu lis le squelette d'une production d'élève de lycée (Première/Terminale,\nphilosophie/HLP) : ses unités citées, les rapports qu'il écrit, les termes\nqui coiffent, et — quand il y en a une — son alignement sur la référence du\ntexte. Tu n'as pas la production continue et tu n'en as pas besoin. Si une\ninformation de style ou de mise en page te manque, c'est normal et voulu.\n\n# TU NE CALCULES RIEN\nTu ne comptes aucune unité. Tu ne dis pas si l'intégration domine. Tu ne\nvérifies pas si le seuil est franchi. Tu ne donnes aucune lettre, aucun\npalier. N'écris aucun décompte, taux ni proportion, et aucun niveau : la\nchaîne serait en erreur. Les identifiants `u` recopiés du squelette sont\nattendus, ce ne sont pas des décomptes.\n\n# PREMIÈRE TÂCHE — LE CRIBLE DE L'APPORT\nPour chaque apport, trois tests, dans cet ordre. Le premier qui échoue\ndonne le verdict.\n1. CONTENU : le terme PORTE-T-IL une organisation — une catégorie, une\n   distinction, une tension qui tient ensemble ce qu'il recouvre ? Un\n   terme qui coifferait n'importe quel matériau (« complexe », « plusieurs\n   aspects », « différents points de vue », « une vraie question »)\n   n'organise rien → \"vide\". Une étiquette vide n'est pas un concept.\n2. COUVERTURE : le terme recouvre-t-il au moins DEUX unités distinctes ?\n   Sinon → \"non_couvrant\" : le terme ne rassemble rien. Ce verdict ne dit\n   rien de la provenance du terme — un terme entièrement tiré du matériau\n   qui n'en tient qu'une seule idée le déclenche aussi.\n3. DÉPLOIEMENT : le matériau est-il relu, partagé ou tranché À TRAVERS le\n   terme ? Si le champ deploiement vaut [pose_seul], le terme est juste et\n   inerte → \"decoratif\".\nUn apport qui passe les trois est \"organisateur\".\n\nLA PROVENANCE NE COMPTE PAS, LE DÉPLOIEMENT DÉCIDE. Un concept venu du\ncours et mis au travail est un geste ; le même, posé sans rien faire, est\nune mauvaise utilisation d'un savoir rapporté. Ne demande jamais d'où vient\nle terme.\n\nChaque verdict autre que \"organisateur\" se dit avec sa raison, en une\nphrase, et abaisse ta confiance.\n\n# SECONDE TÂCHE — LA FIDÉLITÉ (seulement si un alignement t'est fourni)\nPour chaque unité de l'élève qui correspond à au moins une unité de la\nréférence :\n- \"fidele\" : elle fait dire à la référence ce qu'elle dit — OU elle suit\n  une LECTURE DÉCLARÉE DÉFENDABLE par la référence. Une lecture déclarée\n  n'est jamais un contresens.\n- \"contresens_partiel\" : l'unité visée est déformée, sans que sa thèse soit\n  renversée.\n- \"contresens_majeur\" : l'unité visée est faite pour dire autre chose que\n  ce qu'elle dit, jusqu'à sa thèse.\n- \"limite\" : tu hésites sincèrement. Indique-le plutôt que de trancher, et\n  précise entre quels deux états.\n\nNOMME L'ORIGINE DU CONTRESENS. La référence déclare, pour chaque phrase,\nson STATUT D'ÉNONCIATION : l'auteur l'affirme, la rapporte, la concède,\nl'avance en hypothèse, la dit avec ironie. Le contresens le plus fréquent\nest de prendre pour la thèse de l'auteur une phrase qu'il RAPPORTE — la\nposition qu'il cite pour la combattre. Dis dans la note l'unité visée, son\nstatut, et l'écart. C'est ce qui rend le retour utilisable.\n\n# CE QUE TU IGNORES\n- Le style, le vocabulaire, l'orthographe.\n- L'architecture et les transitions : c'est la compétence Structure.\n- La validité philosophique des idées : tu consignes qu'un rapport est\n  rendu, pas qu'il est bon.\n\n# CE QUI EST DESTINÉ À L'ÉLÈVE\nTon évaluation alimente un dispositif d'apprentissage : l'élève doit savoir\noù il en est et la SEULE prochaine chose à travailler.\n\n- justification_ancree : 2 à 4 phrases renvoyant aux éléments du squelette\n  (unités, rapports écrits ou absents, apports). Signale explicitement\n  toute rétrogradation de ton crible. N'y annonce aucun niveau et n'y\n  compte rien : décris ce que tu vois. Destinée à la validation par le\n  professeur.\n- ce_qui_plafonne : ce qui empêche d'aller plus haut, en termes de mise en\n  relation (idées jamais reliées, rapports du texte perdus, thèse\n  essentielle manquante, contresens) et/ou de seuil (aucun apport, apport\n  vide, apport décoratif).\n- levier : l'action concrète et prioritaire qui ferait progresser (ex. :\n  fondre deux idées qui se répondent ; écrire l'opposition que le texte\n  construit ; remplacer le chapeau vide par le mot qui recouvre vraiment\n  les deux thèses ; faire travailler le concept au lieu de le poser). Sur\n  un contresens majeur, dis-le ainsi : « tu as compris ce qui se fait dans\n  le texte, tu n'as pas compris ce que le texte dit ».\n- confiance : élevée | moyenne | faible. Abaisse-la si tu as rétrogradé un\n  apport, si des fidélités sont \"limite\", ou si un jugement t'a coûté.\n\nCette exigence de netteté ne doit jamais te rendre indulgent : tu décris ce\nqui est, sans l'embellir.\n\n# SORTIE (JSON strict, aucun texte autour)\n{\n  \"crible\": [\n    { \"terme_cite\": \"recopié du squelette\",\n      \"verdict\": \"organisateur | vide | decoratif | non_couvrant\",\n      \"raison\": \"une phrase, sauf si organisateur\" }\n  ],\n  \"fidelite\": [\n    { \"u\": 1,\n      \"etat\": \"fidele | contresens_partiel | contresens_majeur | limite\",\n      \"note\": \"si contresens ou limite : l'unité de référence visée, son statut d'énonciation, et l'écart\" }\n  ],\n  \"justification_ancree\": \"2 à 4 phrases, sans niveau ni décompte\",\n  \"ce_qui_plafonne\": \"…\",\n  \"levier\": \"…\",\n  \"confiance\": \"élevée | moyenne | faible\"\n}\n\nAucun autre champ. Pas de \"niveau\", pas de \"palier_base\", pas de\n\"seuil_franchi\" : ils appartiennent au programme. Si aucun alignement ne\nt'est fourni, rends \"fidelite\": [].\n\n# SQUELETTE À LIRE\n{squelette}"
  },
  "source": "competences/synthese.md",
  "statut": "RELUE ET VALIDÉE",
  "version": "3.4"
} as const
