// ⚠️ FICHIER DÉRIVÉ — NE S'ÉDITE JAMAIS À LA MAIN.
// Sortie de `python3 scripts/derive-instruments.py --ecris`.
// La source fait foi ; `--verifie` dit si ce fichier en a divergé
// (piège 52 ; `03-` §1 ; `07-` §4).

export const INSTRUMENT_QUESTIONNEMENT = {
  "bloc_machine": {
    "champ_confiance": "confiance",
    "competence": "questionnement",
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
        "regle": "la cascade du palier de base et la règle de seuil du §4, citées mot pour mot dans le module",
        "sortie": "niveau"
      },
      "garde_fous": {
        "copie_sans_question": {
          "declencheur": "question_posee vide et forme_question absent",
          "effet": "niveau Absent, alerte déclarée",
          "statut": "acté"
        },
        "deplacement_absent": {
          "declencheur": "un recadrage dont le deplacement vaut [aucun]",
          "effet": "verdict verbal composé par le code, sans passer par le juge",
          "statut": "acté"
        },
        "palier_ou_decompte_rendu": {
          "declencheur": "le juge rend un palier, une lettre ou un décompte",
          "effet": "alerte de recette déclarée",
          "statut": "acté"
        },
        "promotion_refusee": {
          "declencheur": "le juge relève un recadrage vers valide",
          "effet": "requalification ignorée et alerte déclarée — le crible ne relève jamais",
          "statut": "acté"
        },
        "reprise_absente": {
          "declencheur": "un recadrage qui a passé le test du déplacement et dont la reprise vaut [aucune]",
          "effet": "verdict non_tenu composé par le code, sans passer par le juge",
          "statut": "acté"
        },
        "requalification_inappariable": {
          "declencheur": "une requalification qui ne vise aucun recadrage du relevé",
          "effet": "consignée, jamais comptée, alerte déclarée",
          "statut": "acté"
        },
        "test_illisible": {
          "declencheur": "un test hors liste dans une requalification",
          "effet": "le test se déduit du verdict d'arrivée, avec alerte",
          "statut": "acté"
        },
        "valeur_hors_liste": {
          "declencheur": "une valeur hors d'une liste fermée du catalogue",
          "effet": "alerte déclarée, jamais de valeur par défaut",
          "statut": "acté"
        }
      },
      "observables_mesure": {
        "debat_situe": {
          "famille": "binaire",
          "reussie": "vaut",
          "sens": "une réponse concurrente est énoncée — l'une des trois conditions de Bon (§4)",
          "statut": "acté",
          "valeur_reussie": "enoncees"
        },
        "enjeu": {
          "famille": "binaire",
          "reussie": "vaut",
          "sens": "l'enjeu est énoncé — l'une des trois conditions de Bon (§4)",
          "statut": "acté",
          "valeur_reussie": "enonce"
        },
        "notions_en_tension": {
          "famille": "binaire",
          "reussie": "vaut",
          "sens": "les notions sont articulées — « notions non articulées → Faible » (§4)",
          "statut": "acté",
          "valeur_reussie": "articulees"
        },
        "question_presente": {
          "famille": "binaire",
          "reussie": "vaut",
          "sens": "la forme de la question est posée — « forme absente → Absent » à la cascade du §4",
          "statut": "acté",
          "valeur_reussie": [
            "question_explicite",
            "tension_affirmee"
          ]
        },
        "question_propre": {
          "famille": "binaire",
          "reussie": "vaut",
          "sens": "la question dit autre chose que l'énoncé retourné ou un avis — « question pas propre → Absent » (§4)",
          "statut": "acté",
          "valeur_reussie": "propre"
        },
        "question_specifique": {
          "famille": "binaire",
          "reussie": "vaut",
          "sans_objet_si": "n/a",
          "sens": "la question est propre à cet énoncé — « générique → Moyen », et c'est la porte de Bon (§4)",
          "statut": "acté",
          "valeur_reussie": "specifique"
        },
        "recadrage": {
          "famille": "binaire",
          "reussie": "vaut",
          "sens": "au moins un recadrage valide après crible — la condition du seuil au §4",
          "statut": "acté",
          "valeur_reussie": "oui"
        },
        "recadrage_non_tenu": {
          "famille": "comptage rapporté",
          "rapporte_a": "les recadrages tentés",
          "reussie": "moins_de",
          "sans_objet_si": "aucun recadrage tenté",
          "sens": "les recadrages rétrogradés au test de la tenue n'atteignent pas la moitié des recadrages tentés ; sans tentative, la mesure est sans objet — le taux est NULL, jamais 0 (§5)",
          "seuil": 0.5,
          "statut": "acté"
        },
        "recadrage_verbal": {
          "famille": "comptage rapporté",
          "rapporte_a": "les recadrages tentés",
          "reussie": "moins_de",
          "sans_objet_si": "aucun recadrage tenté",
          "sens": "les recadrages rétrogradés au test du déplacement n'atteignent pas la moitié des recadrages tentés ; sans tentative, la mesure est sans objet — le taux est NULL, jamais 0 (§5)",
          "seuil": 0.5,
          "statut": "acté"
        }
      },
      "parametres": {
        "conjonction_bon": {
          "defaut": "stricte",
          "statut": "provisoire (réglage empirique)",
          "valeurs": [
            "stricte",
            "deux_sur_trois"
          ]
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
        "synonymes": {
          "Absent": [
            "E"
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
          "Bon"
        ]
      },
      "question_specifique": {
        "echelle": "nominale",
        "source": "question_specifique",
        "synonymes": {
          "generique": [
            "générique",
            "vague"
          ],
          "specifique": [
            "spécifique"
          ]
        },
        "valeurs": [
          "specifique",
          "generique",
          "n/a"
        ]
      },
      "seuil_franchi": {
        "echelle": "nominale",
        "source": "seuil_franchi",
        "synonymes": {
          "non": [
            false,
            "faux",
            "ferme"
          ],
          "oui": [
            true,
            "vrai",
            "franchi"
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
        "enjeux": [
          "enonce",
          "evoque",
          "absent",
          "limite"
        ],
        "formes_question": [
          "question_explicite",
          "tension_affirmee",
          "theme_nominal",
          "absent"
        ],
        "questions_propres": [
          "propre",
          "reprise_enonce",
          "avis",
          "n/a"
        ],
        "reponses_concurrentes": [
          "enoncees",
          "evoquees",
          "absentes",
          "limite"
        ],
        "specificites": [
          "specifique",
          "generique",
          "n/a"
        ],
        "tensions": [
          "articulees",
          "nommees",
          "absentes",
          "limite"
        ],
        "tests_crible": [
          "deplacement",
          "tenue"
        ],
        "types_recadrage": [
          "terme_redefini",
          "question_deplacee",
          "tension_revelee"
        ],
        "verdicts_recadrage": [
          "valide",
          "verbal",
          "non_tenu"
        ]
      }
    }
  },
  "competence": "questionnement",
  "degre_statut": 2,
  "empreinte_source": "6e5d0134fd6fa5dcd1aa9ecd452055dd777ecc8185fac284fa9c5d362d7488b2",
  "observables_mesure": {
    "debat_situe": {
      "famille": "binaire",
      "reussie": "vaut",
      "sens": "une réponse concurrente est énoncée — l'une des trois conditions de Bon (§4)",
      "statut": "acté",
      "valeur_reussie": "enoncees"
    },
    "enjeu": {
      "famille": "binaire",
      "reussie": "vaut",
      "sens": "l'enjeu est énoncé — l'une des trois conditions de Bon (§4)",
      "statut": "acté",
      "valeur_reussie": "enonce"
    },
    "notions_en_tension": {
      "famille": "binaire",
      "reussie": "vaut",
      "sens": "les notions sont articulées — « notions non articulées → Faible » (§4)",
      "statut": "acté",
      "valeur_reussie": "articulees"
    },
    "question_presente": {
      "famille": "binaire",
      "reussie": "vaut",
      "sens": "la forme de la question est posée — « forme absente → Absent » à la cascade du §4",
      "statut": "acté",
      "valeur_reussie": [
        "question_explicite",
        "tension_affirmee"
      ]
    },
    "question_propre": {
      "famille": "binaire",
      "reussie": "vaut",
      "sens": "la question dit autre chose que l'énoncé retourné ou un avis — « question pas propre → Absent » (§4)",
      "statut": "acté",
      "valeur_reussie": "propre"
    },
    "question_specifique": {
      "famille": "binaire",
      "reussie": "vaut",
      "sans_objet_si": "n/a",
      "sens": "la question est propre à cet énoncé — « générique → Moyen », et c'est la porte de Bon (§4)",
      "statut": "acté",
      "valeur_reussie": "specifique"
    },
    "recadrage": {
      "famille": "binaire",
      "reussie": "vaut",
      "sens": "au moins un recadrage valide après crible — la condition du seuil au §4",
      "statut": "acté",
      "valeur_reussie": "oui"
    },
    "recadrage_non_tenu": {
      "famille": "comptage rapporté",
      "rapporte_a": "les recadrages tentés",
      "reussie": "moins_de",
      "sans_objet_si": "aucun recadrage tenté",
      "sens": "les recadrages rétrogradés au test de la tenue n'atteignent pas la moitié des recadrages tentés ; sans tentative, la mesure est sans objet — le taux est NULL, jamais 0 (§5)",
      "seuil": 0.5,
      "statut": "acté"
    },
    "recadrage_verbal": {
      "famille": "comptage rapporté",
      "rapporte_a": "les recadrages tentés",
      "reussie": "moins_de",
      "sans_objet_si": "aucun recadrage tenté",
      "sens": "les recadrages rétrogradés au test du déplacement n'atteignent pas la moitié des recadrages tentés ; sans tentative, la mesure est sans objet — le taux est NULL, jamais 0 (§5)",
      "seuil": 0.5,
      "statut": "acté"
    }
  },
  "parametres": {
    "conjonction_bon": {
      "defaut": "stricte",
      "statut": "provisoire (réglage empirique)",
      "valeurs": [
        "stricte",
        "deux_sur_trois"
      ]
    }
  },
  "prompts": {
    "P1": "# RÔLE\nTu es un extracteur. Tu relèves des faits de FORME dans la production d'un\nélève de lycée (Première/Terminale, philosophie/HLP). Tu ne juges pas, tu ne\nnotes pas, tu ne connais pas le corrigé. N'invente aucun contenu, ne complète\naucune idée.\n\n# RÈGLE ABSOLUE — NE RIEN RECONSTRUIRE\nUne question « évidemment sous-entendue » mais jamais écrite est absente. Un\nrecadrage que le lecteur devine n'existe pas. Classe selon ce qui est\nLITTÉRALEMENT présent ; en cas de doute raisonnable entre deux valeurs, la\nmoins généreuse.\n\nUne question grammaticalement FERMÉE (« X est-il Y ? ») EST une question\nexplicite : ne juge jamais l'ouverture sur la syntaxe. La forme fermée n'est\npas un défaut.\n\nUne tension affirmée n'est PAS un thème nominal : le thème NOMME (« la\nliberté et la loi »), la tension OPPOSE (« la loi semble nier la liberté ;\npourtant… »).\n\nTu ne dis PAS si la question est propre à l'énoncé, ni si un recadrage\ndéplace quoi que ce soit : ces jugements demandent le corrigé, que tu n'as\npas. Tu consignes, l'évaluateur juge.\n\n# CHAMPS\n- question_posee : le problème tel que l'élève le formule (verbatim, ≤ 25\n  mots, \"\" si absent).\n- forme_question :\n  \"question_explicite\" — une phrase interrogative, ouverte ou fermée ;\n  \"tension_affirmee\"   — pas d'interrogation, mais deux termes dont\n                         l'opposition est POSÉE en phrase déclarative\n                         (« X semble nier Y ; pourtant… ») ;\n  \"theme_nominal\"      — un titre, un couple de notions, sans interrogation ;\n  \"absent\"             — rien.\n- notions_en_tension :\n  \"articulees\" — deux notions-clés de l'énoncé sont mises en rapport ET ce\n                 qui les oppose est dit ;\n  \"nommees\"    — deux notions sont là, leur rapport n'est jamais dit ;\n  \"absentes\"   — une seule notion est en jeu, ou aucune.\n- enjeu :\n  \"enonce\" — l'élève dit ce que la position change, pourquoi la question\n             compte ;\n  \"evoque\" — il annonce que la question est importante ou essentielle, sans\n             dire ce qu'une réponse changerait ;\n  \"absent\" — rien.\n- reponses_concurrentes : l'élève énonce-t-il une réponse concurrente à SA\n  question — la position qui rendrait le débat réel ?\n  \"enoncees\" — il dit laquelle, et on peut la citer ;\n  \"evoquees\" — il dit qu'on peut en débattre, que les avis divergent, sans\n               jamais dire quelle serait l'autre réponse ;\n  \"absentes\" — rien.\n- Sur ces TROIS champs — notions_en_tension, enjeu, reponses_concurrentes —\n  et sur eux seuls, une quatrième valeur existe :\n  \"limite\" — tu hésites SINCÈREMENT entre deux des valeurs ci-dessus, et tu\n             préfères l'indiquer plutôt que trancher au hasard. Tu écris\n             alors, dans \"note_<champ>\", LES DEUX valeurs entre lesquelles tu\n             hésites — par exemple : \"entre enonce et evoque\".\n  N'en fais pas un refuge : \"limite\" dit une hésitation réelle, pas un\n  confort. Une note qui ne nomme pas deux valeurs sera signalée et lue au\n  plus bas.\n- note_notions_en_tension / note_enjeu / note_reponses_concurrentes :\n  la note du \"limite\", \"\" sinon.\n- reponse_concurrente_citee : verbatim, ≤ 25 mots, \"\" si absent.\n- recadrages : la LISTE des segments où l'élève retravaille l'énoncé\n  LUI-MÊME. Liste vide s'il n'y en a aucun. Chaque élément porte :\n  - cite : le segment, verbatim ;\n  - type : \"terme_redefini\" (il redéfinit un terme pour révéler un problème\n           plus profond) | \"question_deplacee\" (il montre que la question\n           apparente en masque une autre) | \"tension_revelee\" (il fait\n           apparaître une tension non évidente) ;\n  - deplacement : les mots exacts qui disent ce que le recadrage CHANGE — ce\n           que la question devient, ce qu'une réponse devrait désormais\n           trancher. \"[aucun]\" si l'élève ne l'écrit pas ;\n  - reprise : les mots exacts, PLUS LOIN dans la production, qui conduisent\n           la suite sous la question nouvelle. \"[aucune]\" si l'élève ne la\n           reprend jamais.\n\n# SORTIE (JSON strict, aucun texte autour)\n{ \"question_posee\": \"...\",\n  \"forme_question\": \"...\",\n  \"notions_en_tension\": \"...\",\n  \"note_notions_en_tension\": \"\",\n  \"enjeu\": \"...\",\n  \"note_enjeu\": \"\",\n  \"reponses_concurrentes\": \"...\",\n  \"note_reponses_concurrentes\": \"\",\n  \"reponse_concurrente_citee\": \"...\",\n  \"recadrages\": [ { \"cite\": \"...\", \"type\": \"...\",\n                    \"deplacement\": \"...\", \"reprise\": \"...\" } ] }\n\n# MATÉRIAU\nÉnoncé donné à l'élève : {sujet}\nProduction : {copie}",
    "P2": "# RÔLE\nTu évalues le questionnement depuis le squelette fourni, sans la production.\nTu reçois en plus le RÉFÉRENT. Sois strict et littéral.\n\n# INTERDIT\nTu ne rends AUCUN palier, AUCUNE lettre, AUCUN décompte. Le niveau est\ncalculé par le code à partir de tes jugements. Si tu écris un niveau ou un\nnombre, la chaîne est en erreur.\n\n# LE RÉFÉRENT\n{nature_referent} vaut \"sujet\" ou \"texte\".\n- \"sujet\" : le référent est l'énoncé exact du sujet donné à l'élève. La\n  question de l'élève se juge contre les termes de ce sujet.\n- \"texte\" : le référent est le problème réel du texte de l'auteur, tel que la\n  référence validée le porte. La question de l'élève se juge contre lui.\n\n# COMMENT JUGER\n\n1. LE CRIBLE DU RECADRAGE — deux tests, dans cet ordre, sur chaque recadrage\n   de la liste.\n\n   TEST DU DÉPLACEMENT. Le \"deplacement\" change-t-il ce qui compterait comme\n   réponse — un partage nouveau, une condition nouvelle, une question\n   substituée ? Une reformulation qui laisse l'espace des réponses intact ne\n   vaut pas : « Autrement dit, l'homme est-il vraiment libre ? » redit la\n   question, il ne la déplace pas. Si le test rate : verdict \"verbal\".\n\n   TEST DE LA TENUE, sur les recadrages qui ont passé le premier. La\n   \"reprise\" conduit-elle réellement la suite sous la question nouvelle, ou\n   le recadrage est-il posé puis abandonné ? Si le test rate : verdict\n   \"non_tenu\".\n   Deux garde-fous. Reprendre le mot recadré une fois plus loin n'est PAS\n   tenir le recadrage : il faut que ce qui suit soit conduit sous la question\n   nouvelle. Et un recadrage tenu sur une SEULE partie reste tenu — on ne\n   demande pas qu'il gouverne tout le devoir.\n\n   Un recadrage qui passe les deux tests : verdict \"valide\".\n\n   TU NE PEUX QUE FERMER LE SEUIL OU REQUALIFIER À SEUIL ÉGAL. Jamais valider\n   un recadrage absent du squelette, jamais relever un \"verbal\". Chaque\n   verdict autre que \"valide\" porte sa raison, en une phrase.\n\n2. question_propre : ce que l'élève présente comme sa question est-il un\n   problème qu'il CONSTRUIT → \"propre\" ; l'énoncé simplement retourné en\n   interrogation → \"reprise_enonce\" ; un avis déguisé en question → \"avis\" ;\n   \"n/a\" si question_posee est vide.\n\n3. question_specifique : la question posée est-elle PROPRE à cet énoncé,\n   construite depuis ses termes précis → \"specifique\" ; ou si vague qu'elle\n   conviendrait à des dizaines d'énoncés → \"generique\" ; \"n/a\" si vide.\n\n4. LA PROSE POUR L'ÉLÈVE.\n   - justification_ancree : 2 à 4 phrases renvoyant aux champs du squelette,\n     sans palier ni décompte, signalant toute requalification du crible.\n   - ce_qui_plafonne : en termes de spécificité, d'enjeu, de débat ou de\n     seuil.\n   - levier : l'action concrète prioritaire, adressée à l'élève. Emploie le\n     mot « problématique », et « solution » pour ce qu'on y répond.\n   - confiance : \"elevee\" | \"moyenne\" | \"faible\". Faible s'il y a des\n     requalifications, ou une question éparpillée en plusieurs formulations\n     divergentes.\n\n# SORTIE (JSON strict, aucun texte autour)\n{ \"question_propre\": \"propre | reprise_enonce | avis | n/a\",\n  \"question_specifique\": \"specifique | generique | n/a\",\n  \"crible\": [ { \"cite\": \"...\",\n                \"verdict\": \"valide | verbal | non_tenu\",\n                \"test\": \"deplacement | tenue\",\n                \"raison\": \"...\" } ],\n  \"justification_ancree\": \"...\",\n  \"ce_qui_plafonne\": \"...\",\n  \"levier\": \"...\",\n  \"confiance\": \"elevee | moyenne | faible\" }\n\n# MATÉRIAU\nNature du référent : {nature_referent}\nRéférent : {referent}\nSquelette (Phase 1) : {squelette_phase_1}"
  },
  "source": "competences/questionnement.md",
  "statut": "RELUE ET VALIDÉE",
  "version": "2.2"
} as const
