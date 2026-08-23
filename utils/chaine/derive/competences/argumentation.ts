// ⚠️ FICHIER DÉRIVÉ — NE S'ÉDITE JAMAIS À LA MAIN.
// Sortie de `python3 scripts/derive-instruments.py --ecris`.
// La source fait foi ; `--verifie` dit si ce fichier en a divergé
// (piège 52 ; `03-` §1 ; `07-` §4).

export const INSTRUMENT_ARGUMENTATION = {
  "bloc_machine": {
    "champ_confiance": "confiance",
    "competence": "argumentation",
    "notation": {
      "chaine": [
        "P1",
        "Code1",
        "P2",
        "Code2"
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
        "copie_sans_unite": {
          "declencheur": "aucune unité au décompte (squelette vide, ou toutes les unités écartées)",
          "effet": "niveau Absent, alerte déclarée",
          "statut": "acté"
        },
        "limite_illisible": {
          "declencheur": "une unité limite dont la note ne donne pas deux statuts lisibles",
          "effet": "écartée du décompte, comptée dans nb_limites, alerte déclarée",
          "statut": "acté"
        },
        "marque_hors_liste": {
          "declencheur": "une marque de termes hors liste fermée",
          "effet": "consignée, jamais appliquée, le seuil ne se ferme pas, alerte déclarée",
          "statut": "acté"
        },
        "requalification_appariee_par_repli": {
          "declencheur": "rang valide et thèse non recopiée, ou rang faux mais thèse égale à exactement une unité du statut attendu",
          "effet": "appliquée à cette unité, alerte déclarée",
          "statut": "acté"
        },
        "requalification_inappariable": {
          "declencheur": "une requalification de P2 sans correspondance avec une unité du statut attendu, et sans repli possible",
          "effet": "consignée, jamais appliquée, alerte déclarée",
          "statut": "acté"
        },
        "statut_hors_liste": {
          "declencheur": "un statut du lien hors liste fermée au squelette",
          "effet": "unité écartée du décompte, alerte déclarée",
          "statut": "acté"
        },
        "test_illisible": {
          "declencheur": "un test de crible absent ou hors liste sur une requalification",
          "effet": "si le statut d'arrivée déclaré est légal il détermine le test et la requalification est appliquée, alerte déclarée ; sinon consignée, jamais appliquée",
          "statut": "acté"
        },
        "traitement_hors_liste": {
          "declencheur": "un traitement d'objection hors liste fermée",
          "effet": "ne compte pas pour le seuil, alerte déclarée",
          "statut": "acté"
        }
      },
      "observables_mesure": {
        "garant_ambigu": {
          "famille": "comptage rapporté",
          "rapporte_a": "les unités du décompte",
          "reussie": "au_plus",
          "sens": "aucune unité marquée ambigu — le libellé Acquis du §4 n'en tolère aucune",
          "seuil": 0,
          "statut": "acté"
        },
        "garant_circulaire": {
          "famille": "comptage rapporté",
          "rapporte_a": "les unités du décompte",
          "reussie": "moins_de",
          "sens": "les garants rétrogradés au test de la distinction n'atteignent pas la moitié",
          "seuil": 0.5,
          "statut": "acté"
        },
        "garant_present": {
          "famille": "proportion",
          "reussie": "plus_de",
          "sens": "la majorité stricte des unités portent un garant cité — « absent → Absent » à la règle d'agrégation du §4",
          "seuil": 0.5,
          "statut": "acté"
        },
        "garant_vague": {
          "famille": "comptage rapporté",
          "rapporte_a": "les unités du décompte",
          "reussie": "au_plus",
          "sens": "aucune unité marquée vague — le libellé Acquis du §4 n'en tolère aucune",
          "seuil": 0,
          "statut": "acté"
        },
        "lien_explicite": {
          "famille": "proportion",
          "reussie": "plus_de",
          "sens": "la majorité stricte des unités sont explicites après crible — « explicite → Bon » à la règle d'agrégation du §4",
          "seuil": 0.5,
          "statut": "acté"
        },
        "nb_limites": {
          "famille": "comptage rapporté",
          "rapporte_a": "les unités du décompte, écartées comprises",
          "reussie": "sans_objet",
          "sens": "signal d'ambiguïté de l'instrument, pas de compétence (§5) — il pilote la confiance, aucune mesure n'y est réussie ni ratée",
          "statut": "acté"
        },
        "objection_traitee": {
          "famille": "binaire",
          "reussie": "vaut",
          "sens": "au moins une objection réfutée ou portée nuancée — la condition du seuil au §4",
          "statut": "acté",
          "valeur_reussie": "oui"
        },
        "preuve_circulaire": {
          "famille": "comptage rapporté",
          "rapporte_a": "les unités du décompte",
          "reussie": "moins_de",
          "sens": "les preuves circulaires n'atteignent pas la moitié — à égalité en tête elles décideraient, « circulaire → Faible »",
          "seuil": 0.5,
          "statut": "acté"
        },
        "source_cosmetique": {
          "famille": "comptage rapporté",
          "rapporte_a": "les unités du décompte",
          "reussie": "moins_de",
          "sens": "les sources requalifiées au test de la source n'atteignent pas la moitié",
          "seuil": 0.5,
          "statut": "acté"
        }
      },
      "parametres": {}
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
        "marques_termes": [
          "ambigu",
          "vague"
        ],
        "statuts_apres_crible": [
          "absent",
          "circulaire",
          "cosmetique",
          "implicite",
          "explicite"
        ],
        "statuts_lien": [
          "absent",
          "circulaire",
          "implicite",
          "explicite",
          "limite"
        ],
        "tests_crible": [
          "distinction",
          "source",
          "sens",
          "contour"
        ],
        "traitements_objection": [
          "réfutée",
          "portée nuancée",
          "évoquée sans réponse",
          "aucune"
        ]
      }
    }
  },
  "competence": "argumentation",
  "degre_statut": 2,
  "empreinte_source": "3f7d2960c92765ed93a2712303a24a6d4d1ae047db5e6c1e429ac894ca75f379",
  "observables_mesure": {
    "garant_ambigu": {
      "famille": "comptage rapporté",
      "rapporte_a": "les unités du décompte",
      "reussie": "au_plus",
      "sens": "aucune unité marquée ambigu — le libellé Acquis du §4 n'en tolère aucune",
      "seuil": 0,
      "statut": "acté"
    },
    "garant_circulaire": {
      "famille": "comptage rapporté",
      "rapporte_a": "les unités du décompte",
      "reussie": "moins_de",
      "sens": "les garants rétrogradés au test de la distinction n'atteignent pas la moitié",
      "seuil": 0.5,
      "statut": "acté"
    },
    "garant_present": {
      "famille": "proportion",
      "reussie": "plus_de",
      "sens": "la majorité stricte des unités portent un garant cité — « absent → Absent » à la règle d'agrégation du §4",
      "seuil": 0.5,
      "statut": "acté"
    },
    "garant_vague": {
      "famille": "comptage rapporté",
      "rapporte_a": "les unités du décompte",
      "reussie": "au_plus",
      "sens": "aucune unité marquée vague — le libellé Acquis du §4 n'en tolère aucune",
      "seuil": 0,
      "statut": "acté"
    },
    "lien_explicite": {
      "famille": "proportion",
      "reussie": "plus_de",
      "sens": "la majorité stricte des unités sont explicites après crible — « explicite → Bon » à la règle d'agrégation du §4",
      "seuil": 0.5,
      "statut": "acté"
    },
    "nb_limites": {
      "famille": "comptage rapporté",
      "rapporte_a": "les unités du décompte, écartées comprises",
      "reussie": "sans_objet",
      "sens": "signal d'ambiguïté de l'instrument, pas de compétence (§5) — il pilote la confiance, aucune mesure n'y est réussie ni ratée",
      "statut": "acté"
    },
    "objection_traitee": {
      "famille": "binaire",
      "reussie": "vaut",
      "sens": "au moins une objection réfutée ou portée nuancée — la condition du seuil au §4",
      "statut": "acté",
      "valeur_reussie": "oui"
    },
    "preuve_circulaire": {
      "famille": "comptage rapporté",
      "rapporte_a": "les unités du décompte",
      "reussie": "moins_de",
      "sens": "les preuves circulaires n'atteignent pas la moitié — à égalité en tête elles décideraient, « circulaire → Faible »",
      "seuil": 0.5,
      "statut": "acté"
    },
    "source_cosmetique": {
      "famille": "comptage rapporté",
      "rapporte_a": "les unités du décompte",
      "reussie": "moins_de",
      "sens": "les sources requalifiées au test de la source n'atteignent pas la moitié",
      "seuil": 0.5,
      "statut": "acté"
    }
  },
  "parametres": {},
  "prompts": {
    "P1": "# RÔLE\nTu es un extracteur de structure argumentative. Tu ne notes rien, tu ne juges\npas la qualité. Tu lis la copie d'un élève de lycée (Première/Terminale,\nphilosophie/HLP) et tu en extrais le squelette argumentatif brut, tel qu'il\nest SUR LA PAGE.\n\n# TA SEULE TÂCHE\nPour chaque thèse que l'élève défend, repérer la preuve qu'il offre à son\nappui, le connecteur qui les relie le cas échéant, et — surtout — le GARANT :\nla phrase où l'élève écrit POURQUOI cette preuve soutient cette thèse, si elle\nexiste. Le tout TEL QUE L'ÉLÈVE L'A ÉCRIT.\n\n# RÈGLE ABSOLUE — NE RECONSTRUIS RIEN\nC'est le point critique. Tu ne dois JAMAIS compléter, deviner ou rétablir un\nraisonnement que l'élève n'a pas écrit. Si l'élève juxtapose une preuve et une\nthèse sans expliciter le lien, tu consignes que le lien est IMPLICITE — tu ne\nle rends pas explicite à sa place. Faire le travail du lecteur fausserait tout :\nun lien implicite déguisé en explicite changerait un niveau Moyen en Bon. Cite\nles mots exacts de l'élève, ou note leur absence.\n\n# CONNECTEUR ≠ GARANT (distinction décisive)\nUn connecteur (« donc », « de ce fait », « ainsi », « par conséquent »,\n« cela entraîne ») annonce qu'une conclusion suit ; il ne dit pas POURQUOI elle\nsuit. CE N'EST PAS un garant. Un garant répond à « pourquoi cette preuve\ndonne-t-elle cette thèse ? » et apporte une information DISTINCTE de la preuve\net de la thèse.\n- « Les mots sont supprimés du novlangue. De ce fait, la pensée est limitée. »\n  → connecteur seul, garant [absent].\n- « ...supprimés ; or on ne peut former un concept sans le mot qui le porte, si\n  bien que le supprimer rend la pensée correspondante impossible. »\n  → garant présent (il apporte la raison : pas de mot, pas de concept).\nUne phrase qui ne fait que répéter la thèse ou la preuve sous d'autres mots\nn'est PAS un garant : note [absent]. Et ne retiens JAMAIS comme garant d'une\nunité un principe général énoncé ailleurs dans la copie : ne consigne que ce\nqui relie CETTE preuve à CETTE thèse, à l'endroit du lien.\n\n# CE QUE TU IGNORES\n- Le style, la fluidité, le vocabulaire, l'élégance. Une preuve mal écrite et\n  une preuve bien écrite se consignent à l'identique.\n- La JUSTESSE des références : tu n'évalues pas si une référence est correcte\n  ou pertinente, seulement ce que l'élève en fait dans son raisonnement.\n- L'organisation, les transitions, le plan.\n\n# STATUT DU LIEN (pour chaque unité, choisis UN statut)\n- \"absent\" : aucune preuve offerte, simple affirmation.\n- \"circulaire\" : la « preuve » ne fait que reformuler la thèse.\n- \"implicite\" : preuve réelle, mais garant [absent] — seul un connecteur, ou\n  rien, relie la preuve à la thèse ; le lecteur devrait reconstruire le pourquoi.\n- \"explicite\" : preuve réelle ET garant présent — l'élève écrit la raison qui\n  relie la preuve à la thèse, sans reconstruction nécessaire.\n- \"limite\" : tu hésites sincèrement entre deux statuts. Indique-le plutôt que\n  de trancher arbitrairement, et précise entre lesquels.\n\n# OBJECTIONS\nRepère toute objection ou contre-thèse que l'élève soulève, et comment il la\ntraite : \"réfutée\", \"portée nuancée\", \"évoquée sans réponse\", ou \"aucune\". Ne\ncompte pas la simple structure dialectique du devoir (thèse/antithèse) comme\nune objection : il faut que l'élève teste son propre argument contre une\ncontradiction.\n\n# SORTIE (JSON strict, aucun texte autour)\n{\n  \"these_generale\": \"la thèse d'ensemble défendue par la copie\",\n  \"unites\": [\n    {\n      \"these\": \"...\",\n      \"preuve_offerte\": \"la preuve telle que présentée par l'élève\",\n      \"liaison_citee\": \"le connecteur ou la phrase de liaison exacts, ou [aucune]\",\n      \"garant_cite\": \"la phrase exacte où l'élève dit POURQUOI la preuve soutient la thèse, ou [absent]\",\n      \"statut_du_lien\": \"absent | circulaire | implicite | explicite | limite\",\n      \"note\": \"optionnel : si 'limite', entre quels statuts et pourquoi\"\n    }\n  ],\n  \"objections\": [\n    { \"objection\": \"... ou aucune\",\n      \"traitement\": \"réfutée | portée nuancée | évoquée sans réponse | aucune\" }\n  ]\n}\n\n# COPIE À ANALYSER\nSujet : {sujet}\nCopie : {copie}",
    "P2": "# RÔLE\nTu es un lecteur de squelettes argumentatifs. Tu observes, tu qualifies, tu\njustifies — mais tu ne comptes rien, tu n'agrèges rien, et tu n'attribues\naucun niveau. Un programme s'en charge à partir de ce que tu rends.\n\nTu lis le squelette d'une copie d'élève de lycée (Première/Terminale,\nphilosophie/HLP) : la thèse générale, les unités argumentatives — thèse,\npreuve, liaison, garant, statut du lien — et les objections avec leur\ntraitement. Tu n'as pas la copie originale et tu n'en as pas besoin. Si une\ninformation de style, de structure ou de contenu te manque, c'est normal et\nvoulu — elle ne te concerne pas.\n\n# TU NE CALCULES RIEN\nTu ne comptes aucune unité. Tu ne détermines pas le statut dominant. Tu ne\nvérifies pas si une objection ouvre le palier Acquis. Tu ne donnes aucune\nlettre, aucun palier. N'écris aucun décompte, taux ni proportion, et aucun\nniveau : la chaîne serait en erreur. Les identifiants recopiés du squelette —\nle rang de l'unité — sont attendus, ce ne sont pas des décomptes.\n\nCe qu'on te demande est plus simple et plus difficile : trancher la seule\nquestion qu'aucun programme ne peut trancher.\n\n# TA TÂCHE — LE CRIBLE DU LIEN (quatre tests)\n\n## Test 1 — LA DISTINCTION, sur les unités \"explicite\"\nLe garant_cite doit apporter une raison DISTINCTE de la preuve et de la\nthèse. S'il ne fait que reformuler ou présupposer la thèse — s'il\n« justifie » par ce qui devait précisément être justifié — il ne vaut pas.\nUne explicitation circulaire n'est pas une explicitation.\n\n- « ...on ne peut former un concept sans le mot qui le porte, si bien que le\n  supprimer rend la pensée correspondante impossible. » → la raison est\n  distincte de la preuve (les mots supprimés) et de la thèse (la pensée\n  limitée). Le garant tient.\n- « La colère donne de l'énergie, et cette énergie montre bien que la colère\n  est une force. » → le « garant » répète la thèse qu'il devait justifier.\n  Tu requalifies l'unité en \"implicite\".\n\n## Test 2 — LA SOURCE, sur les unités \"explicite\" ET \"implicite\"\nQuand l'unité s'appuie sur une SOURCE CITÉE — un auteur, une œuvre, un\narticle, une donnée, un témoignage, n'importe quoi que l'élève invoque du\ndehors —, pose deux questions :\n\n  (a) CE QU'ELLE DIT EST-IL DÉPLIÉ ? La copie donne-t-elle un contenu qu'on\n      pourrait examiner — autre chose que la thèse redite sous le nom de la\n      source ?\n  (b) LE LIEN EST-IL FAIT ? La copie écrit-elle par quel mécanisme ce que dit\n      la source donne la thèse ?\n\nSI LES DEUX MANQUENT, tu requalifies l'unité en \"cosmetique\" : la source est\nlà pour cautionner, pas pour prouver. Citer une source n'est pas une raison.\n\n- « La liberté suppose la contrainte. En effet, comme le montre Le Contrat\n  social, la liberté véritable est celle qui s'accorde à la loi. » → retire\n  la source : ce qui reste EST la thèse. Rien n'est déplié, aucun mécanisme.\n  → \"cosmetique\".\n- « La liberté suppose la contrainte. Rousseau distingue la liberté\n  naturelle, sans limite et sans droit, de la liberté civile, bornée par la\n  volonté générale. » → le contenu EST déplié : une distinction qu'on peut\n  examiner. Seul le mécanisme manque. → reste \"implicite\", PAS cosmetique.\n- « ...de la liberté civile, bornée par la volonté générale. Or une liberté\n  sans borne n'est qu'un pouvoir de fait, que le premier plus fort annule :\n  c'est la borne qui la rend mienne. » → contenu déplié ET mécanisme écrit.\n  → reste \"explicite\".\n\nPRÉSENTER LA SOURCE N'EST PAS LA DÉPLIER. Dire de qui elle est, à quel\ncourant elle appartient, ce qu'elle soutient par ailleurs : rien de cela ne\ndéplie ce qui sert la thèse ICI. Une unité peut avoir l'air documentée et\nêtre cosmétique.\n\n## Test 3 — LE SENS, sur les unités restées \"explicite\"\nUn même terme est-il employé avec UN AUTRE SENS d'un bout à l'autre de\nl'unité — un sens dans la preuve ou le garant, un autre dans la thèse ?\nC'est une propriété de RELATION : il faut deux emplois pour la voir. Cite\nles deux, mot pour mot. Si oui, tu marques l'unité \"ambigu\".\n\n- « La liberté, c'est faire ce qu'on veut. Or l'homme libre décide par\n  lui-même. Donc l'homme libre n'obéit à personne. » → « libre » vaut\n  d'abord absence de contrainte, puis autonomie. → \"ambigu\".\n- « La loi contraint, et toute contrainte limite. Donc la loi limite. » →\n  « contrainte » garde le même sens partout. Rien à marquer.\n\n## Test 4 — LE CONTOUR, sur les unités restées \"explicite\"\nLe garant tient-il PARCE QU'un de ses termes reste sans contour ? Le test :\ndonne au terme une définition précise, n'importe laquelle — le lien\ntient-il encore ? S'il ne tient plus, tu marques l'unité \"vague\".\nC'est une propriété d'UN SEUL emploi.\n\n- « La technique dénature l'homme, car tout ce qui est artificiel\n  s'oppose à la nature. » → précise « artificiel » (fabriqué ? non spontané ?)\n  et le garant cesse de porter. → \"vague\".\n- Un terme laissé large mais dont le lien ne dépend PAS : ne marque rien.\n  Le mot mal choisi pour lui-même n'est pas ton affaire, c'est celle d'un\n  autre instrument.\n\n## CE QUE TU NE PEUX PAS FAIRE\nTu ne peux que DESCENDRE D'UN PALIER, REQUALIFIER À PALIER ÉGAL, ou MARQUER\nSANS CHANGER LE STATUT. Les cinq seuls mouvements permis :\n  \"explicite\" → \"implicite\"   (test 1)\n  \"explicite\" → \"cosmetique\"  (test 2)\n  \"implicite\" → \"cosmetique\"  (test 2)\n  \"explicite\" marquée \"ambigu\" (test 3 — le statut ne change pas)\n  \"explicite\" marquée \"vague\"  (test 4 — le statut ne change pas)\nTu ne relèves jamais rien, tu ne touches pas aux objections ni à leur\ntraitement. Tu listes chaque requalification avec le rang de l'unité (en\ncomptant depuis 1), sa thèse recopiée, le test qui l'a déclenchée, et ta\nraison en une phrase.\n\n# CE QUE TU IGNORES\n- Le nombre d'unités, leur ordre, la présence d'un plan : tout cela relève\n  de la compétence Structure.\n- Le style et le vocabulaire des citations.\n- La justesse d'une source et son à-propos : qu'elle soit exacte, bien\n  attribuée, ou pertinente pour le sujet ne te regarde pas — cela relève de\n  la compétence Connaissance. Tu juges seulement ce que sa citation apporte\n  AU LIEN entre la preuve et la thèse.\n\n# CE QUI EST DESTINÉ À L'ÉLÈVE\nTon évaluation alimente un dispositif d'apprentissage : l'élève doit savoir\noù il en est et la SEULE prochaine chose à travailler.\n\n- justification_ancree : 2 à 4 phrases renvoyant aux éléments du squelette\n  (statuts de liens, garants cités, sources invoquées, traitement des\n  objections). Signale explicitement toute unité requalifiée par ton crible. N'y annonce aucun\n  niveau et n'y compte rien : décris ce que tu vois. Destinée à la\n  validation par le professeur.\n- ce_qui_plafonne : ce qui empêche d'aller plus haut, en termes de garants\n  (absents ou circulaires), de sources qui ne prouvent rien, et/ou de\n  traitement d'objection.\n- levier : l'action concrète et prioritaire qui ferait progresser (ex. :\n  écrire le garant aujourd'hui absent — la raison qui relie la preuve à la\n  thèse ; dire ce que la source apporte de plus que la thèse ; introduire et\n  réfuter une objection). Matière à feedback.\n- confiance : élevée | moyenne | faible. Abaisse-la si tu as requalifié, si\n  le squelette porte des unités \"limite\", ou si un jugement t'a coûté.\n\nCette exigence de netteté ne doit jamais te rendre indulgent : tu décris ce\nqui est, sans l'embellir.\n\n# SORTIE (JSON strict, aucun texte autour)\n{\n  \"crible\": {\n    \"requalifications\": [\n      { \"unite\": 2, \"these\": \"la thèse locale de l'unité, recopiée\",\n        \"test\": \"distinction | source\",\n        \"vers\": \"implicite | cosmetique\",\n        \"raison\": \"une phrase\" }\n    ]\n  },\n  \"justification_ancree\": \"2 à 4 phrases, sans niveau ni décompte\",\n  \"ce_qui_plafonne\": \"…\",\n  \"levier\": \"…\",\n  \"confiance\": \"élevée | moyenne | faible\"\n}\n\nAucun autre champ. Pas de \"niveau\", pas de \"palier_base\", pas de\n\"seuil_franchi\" : ils appartiennent au programme.\n\n# SQUELETTE À LIRE\n{squelette_phase_1}"
  },
  "source": "competences/argumentation.md",
  "statut": "RELUE ET VALIDÉE",
  "version": "4.2"
} as const
