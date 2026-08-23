// ⚠️ FICHIER DÉRIVÉ — NE S'ÉDITE JAMAIS À LA MAIN.
// Sortie de `python3 scripts/derive-instruments.py --ecris`.
// La source fait foi ; `--verifie` dit si ce fichier en a divergé
// (piège 52 ; `03-` §1 ; `07-` §4).

export const INSTRUMENT_EXPRESSION = {
  "bloc_machine": {
    "champ_confiance": "confiance",
    "competence": "expression",
    "notation": {
      "chaine": [
        "P1",
        "Code1",
        "P2",
        "Code2"
      ],
      "croisement": {
        "entrees": [
          "fluidite",
          "precision"
        ],
        "regle": "moyenne_arrondie_vers_le_bas",
        "sortie": "niveau"
      },
      "garde_fous": {
        "densite_haute": {
          "declencheur": "densite totale apres audit >= seuil_densite",
          "effet": "plafond_Faible",
          "statut": "provisoire (réglage empirique)"
        },
        "grade_nul": {
          "declencheur": "un grade a 0",
          "effet": "plafond_Faible",
          "statut": "acté"
        },
        "zone_grise": {
          "declencheur": "seuil_zone_grise <= densite totale apres audit < seuil_densite ET taux de phrases a reconstruire ou perdues >= seuil_taux_rx",
          "effet": "plafond_Faible",
          "statut": "provisoire (réglage empirique)"
        }
      },
      "observables_mesure": {
        "attache_presente": {
          "famille": "proportion",
          "reussie": "au_moins",
          "sens": "au plus une ou deux phrases, hors ouvertures de paragraphe, tombent sans reprendre la précédente",
          "seuil": 0.85,
          "statut": "provisoire (réglage empirique)"
        },
        "densite_friction": {
          "famille": "densité",
          "reussie": "au_plus",
          "sens": "au plus 3,5 faits de fluidité intra-phrase pour 100 mots — le haut de la bande « propre » du §8",
          "seuil": 3.5,
          "statut": "provisoire (réglage empirique)"
        },
        "densite_generique": {
          "famille": "densité",
          "reussie": "au_plus",
          "sens": "au plus 2 mots passe-partout ou périphrases vagues pour 100 mots",
          "seuil": 2.0,
          "statut": "provisoire (réglage empirique)"
        },
        "mot_impropre": {
          "famille": "densité",
          "reussie": "au_plus",
          "sens": "au plus un mot employé à contresens pour 200 mots",
          "seuil": 0.5,
          "statut": "provisoire (réglage empirique)"
        },
        "orthographe": {
          "famille": "comptage",
          "reussie": "sans_objet",
          "sens": "télémétrie seule, jamais dans les grades (§5) — aucune mesure n'y est réussie ni ratée",
          "statut": "acté"
        },
        "repetition_pauvre": {
          "famille": "densité",
          "reussie": "au_plus",
          "sens": "au plus une répétition pauvre pour 100 mots",
          "seuil": 1.0,
          "statut": "provisoire (réglage empirique)"
        },
        "reussites": {
          "famille": "comptage",
          "reussie": "au_moins",
          "sens": "au moins une réussite citée et retenue au crible — la condition du grade 4 (§4)",
          "seuil": 1,
          "statut": "acté"
        },
        "savant_plaque": {
          "famille": "densité",
          "reussie": "au_plus",
          "sens": "au plus un terme savant plaqué pour 200 mots",
          "seuil": 0.5,
          "statut": "provisoire (réglage empirique)"
        },
        "taux_sens_passe": {
          "famille": "proportion",
          "reussie": "au_moins",
          "sens": "au plus une phrase sur cinq oblige le lecteur à reconstruire, ou se perd — la borne haute de la bande du §8",
          "seuil": 0.8,
          "statut": "provisoire (réglage empirique)"
        }
      },
      "parametres": {
        "exception_orthographe": {
          "bornes": [
            false,
            true
          ],
          "defaut": false,
          "statut": "acté"
        },
        "seuil_densite": {
          "bornes": [
            0.0,
            20.0
          ],
          "defaut": 5.5,
          "statut": "provisoire (réglage empirique)"
        },
        "seuil_taux_rx": {
          "bornes": [
            0.0,
            1.0
          ],
          "defaut": 0.1,
          "statut": "provisoire (réglage empirique)"
        },
        "seuil_zone_grise": {
          "bornes": [
            0.0,
            20.0
          ],
          "defaut": 4.5,
          "statut": "provisoire (réglage empirique)"
        }
      }
    },
    "observables": {
      "fluidite": {
        "echelle": "ordinale",
        "source": "grades.fluidite",
        "valeurs": [
          0,
          1,
          2,
          3,
          4
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
      "precision": {
        "echelle": "ordinale",
        "source": "grades.precision",
        "valeurs": [
          0,
          1,
          2,
          3,
          4
        ]
      },
      "profil": {
        "echelle": "nominale",
        "source": "profil",
        "synonymes": {
          "fluide-imprecis": [
            "fluide-imprécis",
            "fluide_imprecis"
          ],
          "precis-raide": [
            "précis-raide",
            "precis_raide"
          ]
        },
        "valeurs": [
          "diagonale",
          "fluide-imprecis",
          "precis-raide"
        ]
      }
    },
    "squelette": {
      "catalogue": {
        "fluidite": [
          "rupture_construction",
          "phrase_surchargee",
          "referent_flou",
          "accord_brouillant",
          "registre_oral",
          "ouverture_monotone",
          "moule_repete"
        ],
        "precision": [
          "mot_generique",
          "periphrase_vague",
          "mot_impropre",
          "savant_plaque",
          "repetition_pauvre"
        ],
        "procedes": [
          "rythme",
          "symetrie",
          "antithese",
          "renversement",
          "image",
          "condensation",
          "chute"
        ],
        "reussites": [
          "formule",
          "variation",
          "mot_juste"
        ],
        "tests_crible": [
          "procede",
          "mot_remplace"
        ]
      }
    }
  },
  "competence": "expression",
  "degre_statut": 2,
  "empreinte_source": "d7c017bb93e5aad2994c367e887d3f006372359cab8e650b04183bdc0f6c456e",
  "observables_mesure": {
    "attache_presente": {
      "famille": "proportion",
      "reussie": "au_moins",
      "sens": "au plus une ou deux phrases, hors ouvertures de paragraphe, tombent sans reprendre la précédente",
      "seuil": 0.85,
      "statut": "provisoire (réglage empirique)"
    },
    "densite_friction": {
      "famille": "densité",
      "reussie": "au_plus",
      "sens": "au plus 3,5 faits de fluidité intra-phrase pour 100 mots — le haut de la bande « propre » du §8",
      "seuil": 3.5,
      "statut": "provisoire (réglage empirique)"
    },
    "densite_generique": {
      "famille": "densité",
      "reussie": "au_plus",
      "sens": "au plus 2 mots passe-partout ou périphrases vagues pour 100 mots",
      "seuil": 2.0,
      "statut": "provisoire (réglage empirique)"
    },
    "mot_impropre": {
      "famille": "densité",
      "reussie": "au_plus",
      "sens": "au plus un mot employé à contresens pour 200 mots",
      "seuil": 0.5,
      "statut": "provisoire (réglage empirique)"
    },
    "orthographe": {
      "famille": "comptage",
      "reussie": "sans_objet",
      "sens": "télémétrie seule, jamais dans les grades (§5) — aucune mesure n'y est réussie ni ratée",
      "statut": "acté"
    },
    "repetition_pauvre": {
      "famille": "densité",
      "reussie": "au_plus",
      "sens": "au plus une répétition pauvre pour 100 mots",
      "seuil": 1.0,
      "statut": "provisoire (réglage empirique)"
    },
    "reussites": {
      "famille": "comptage",
      "reussie": "au_moins",
      "sens": "au moins une réussite citée et retenue au crible — la condition du grade 4 (§4)",
      "seuil": 1,
      "statut": "acté"
    },
    "savant_plaque": {
      "famille": "densité",
      "reussie": "au_plus",
      "sens": "au plus un terme savant plaqué pour 200 mots",
      "seuil": 0.5,
      "statut": "provisoire (réglage empirique)"
    },
    "taux_sens_passe": {
      "famille": "proportion",
      "reussie": "au_moins",
      "sens": "au plus une phrase sur cinq oblige le lecteur à reconstruire, ou se perd — la borne haute de la bande du §8",
      "seuil": 0.8,
      "statut": "provisoire (réglage empirique)"
    }
  },
  "parametres": {
    "exception_orthographe": {
      "bornes": [
        false,
        true
      ],
      "defaut": false,
      "statut": "acté"
    },
    "seuil_densite": {
      "bornes": [
        0.0,
        20.0
      ],
      "defaut": 5.5,
      "statut": "provisoire (réglage empirique)"
    },
    "seuil_taux_rx": {
      "bornes": [
        0.0,
        1.0
      ],
      "defaut": 0.1,
      "statut": "provisoire (réglage empirique)"
    },
    "seuil_zone_grise": {
      "bornes": [
        0.0,
        20.0
      ],
      "defaut": 4.5,
      "statut": "provisoire (réglage empirique)"
    }
  },
  "prompts": {
    "P1": "# RÔLE\nTu es un releveur de faits de langue. Tu ne notes rien, tu ne juges pas la\nqualité des idées. Tu lis la copie d'un élève de lycée (Première/Terminale,\nphilosophie/HLP) et tu en relèves les faits de langue, tels qu'ils sont SUR\nLA PAGE.\n\n# PRINCIPE — RELEVÉ PAR EXCEPTION\nTu ne consignes QUE ce qui coûte, ce qui rate, et les réussites.\nLE SILENCE EST LE RELEVÉ DU PROPRE : toute phrase que tu ne listes pas est\nréputée se lire du premier coup (sens \"passe\") et s'accrocher correctement à\nla précédente. Ne liste JAMAIS les phrases propres — les statistiques de la\ncopie (nombre de mots, de phrases, longueurs) sont déjà calculées par\nprogramme, tu n'as pas à les refaire.\n\n# RÈGLE ABSOLUE — NE RIEN RÉÉCRIRE\nTu ne reformules JAMAIS la langue de l'élève. Toute chaîne que tu cites est\nmot pour mot la sienne — cite le SEGMENT fautif, pas la phrase entière ; la\nrègle de délimitation est au catalogue. Les preuves de coût sont un matériau\nd'audit, jamais une réécriture de la copie.\n\n# GUILLEMETS (discipline JSON)\nDans les valeurs JSON, encadre toujours les mots de l'élève de guillemets\nfrançais « … » et n'utilise JAMAIS le guillemet droit \" à l'intérieur d'une\nchaîne : il casserait le JSON.\n\n# ARTEFACTS DE TRANSCRIPTION (à ignorer totalement)\nLa copie vient d'un OCR de manuscrit. Les conventions typographiques —\nespaces avant/après la ponctuation, espaces manquantes ou doublées, mots\ncoupés par un tiret de fin de ligne (« popula- tions ») — ne sont NI des\nfaits de langue NI de l'orthographe : tu ne les relèves jamais, nulle part.\n\n# CÉCITÉ AU FOND\nTu ignores CE QUI est dit ; tu ne regardes que COMMENT c'est écrit. Une\nphrase banale et une phrase profonde reçoivent le même traitement à faits de\nlangue égaux. Tu ignores : la validité des raisonnements, l'organisation\nentre paragraphes, la justesse des références et des concepts. Un concept du\ncours à contresens n'est PAS ton affaire ; un mot du lexique commun vague ou\nimpropre l'est.\n\n# LES PHRASES QUI COÛTENT (à lister, avec preuve)\n- \"à reconstruire\" : la logique de la phrase casse ; il faut relire.\n  Preuve : cite les lectures concurrentes entre lesquelles tu hésites.\n- \"perdue\" : aucune lecture stable. Preuve : constate qu'aucune lecture ne\n  se laisse énoncer.\nLa gravité d'un défaut est dans son coût, pas dans son nom :\n- « En étant en colère, la raison ne fonctionne plus. » → gérondif sans\n  sujet, MAIS le sens passe du premier coup → phrase NON listée ici (le\n  fait de langue, lui, va au catalogue).\n- « En étant en colère, cela fait que la raison ne peut plus être dedans. »\n  → « dedans » quoi ? → à reconstruire (preuve : dedans la colère ? dedans\n  la personne ? aucune lecture ne s'impose).\n\n# LES ATTACHES (l'entre-phrases)\nUne phrase est ATTACHÉE si un mot la raccroche à la précédente (pronom, nom\nrepris, « cette + nom ») ou si un connecteur l'ouvre. Tu ne listes QUE les\nnuméros des phrases SANS aucune attache — jamais les attachées. La première\nphrase d'un paragraphe (celle qui suit une marque [¶]) est HORS COMPTE : ne\nla mets JAMAIS dans phrases_sans_attache — le script rejettera de toute\nfaçon les numéros d'ouverture. Et tu ne relèves JAMAIS d'attache entre deux\nparagraphes (les coutures entre blocs relèvent d'une autre compétence).\n- « La conscience distingue l'homme de l'animal. Le travail permet de\n  transformer la nature. » → la deuxième phrase ne s'accroche à rien : elle\n  est listée.\n- « La conscience distingue l'homme de l'animal. Elle lui permet de se\n  prendre lui-même pour objet. » → « Elle » l'attache : non listée.\n\n# LE CATALOGUE DES FAITS (étiquettes fermées ; groupés par type)\nPour chaque type présent dans la copie : cite CHAQUE occurrence, une entrée\npar occurrence (segment exact + n° de phrase). Il n'y a plus de champ\n« total » et plus de plafond de citations : c'est le programme qui compte tes\ncitations, et c'est ce comptage qui décide des densités. Une occurrence non\ncitée est donc une occurrence qui n'existe pas.\nDeux conséquences, à tenir :\n- ne t'auto-censure pas pour faire court sur le catalogue — le comptage en\n  dépend. La brièveté reste la règle AILLEURS (le relevé par exception, les\n  segments cités courts), pas ici ;\n- cite le SEGMENT fautif, pas la phrase entière : c'est ce qui garde le\n  relevé économe malgré l'exhaustivité.\nDélimitation du segment : cite le plus PETIT segment qui porte encore le\ndéfaut — sans l'article, sans le connecteur d'ouverture, sans les mots\nvoisins qui ne portent rien. Exemple : dans « Donc je vais d'abord expliquer\nle concept », le registre oral se cite « je vais d'abord expliquer » — ni le\n« Donc » d'ouverture, ni « le concept ». Si le segment minimal apparaît\nplusieurs fois dans la même phrase, étends-le juste assez pour qu'il n'y en\nait qu'un.\nFluidité, dans la phrase :\n- \"rupture_construction\" : la phrase change de construction ou perd son\n  sujet en route.\n- \"phrase_surchargee\" : subordinations empilées sans hiérarchie ; le fil se\n  perd.\n- \"referent_flou\" : pronom ou démonstratif sans antécédent net.\n- \"accord_brouillant\" : réservé au cas RARE où la faute de grammaire oblige à\n  relire la phrase pour retrouver sa structure (qui fait quoi, qui est\n  sujet). TOUTE faute d'accord qui laisse la lecture unique est bénigne et va\n  dans \"orthographe\", jamais ici : genre (« une problème moral »), nombre\n  (« des choix difficile »), homophone (« il donne sont avis »), participe ou\n  infinitif (« il a chercher une solution »). En cas de doute :\n  \"orthographe\".\n- \"registre_oral\" : l'oral transcrit — négation tombée (« ils réfléchissent\n  pas »), sujet redoublé (« les gens ils font »), béquilles (« du coup »,\n  « en fait », « ça » pilier de phrase).\nFluidité, entre les phrases :\n- \"ouverture_monotone\" : le même mot d'ouverture répété.\n- \"moule_repete\" : la même construction en série (le télégraphique : suite\n  de phrases courtes toutes correctes).\nPrécision du vocabulaire :\n- \"mot_generique\" : chose, truc, faire, avoir, il y a, important,\n  intéressant, les gens, « la société » comme entité vague, « quelque chose\n  de »… — quand un mot plus précis rendrait la phrase plus informative sans\n  changer son intention. Ex. : « La conscience est quelque chose d'important\n  qui fait qu'on n'est pas comme les animaux. »\n- \"periphrase_vague\" : le détour là où le mot existe (« le fait de ne pas\n  pouvoir faire ce qu'on veut » pour « la contrainte »).\n- \"mot_impropre\" : le mot dit autre chose que ce que la phrase veut (« les\n  normes infligent notre liberté »). Si la méprise égare la lecture, la\n  phrase va aussi dans « à reconstruire ».\n- \"savant_plaque\" : le terme d'apparat hors de sa portée (« d'un point de\n  vue ontologique, la colère est un paradigme de la force »). Distinct du\n  générique. Un concept du cours à contresens n'en relève pas (autre\n  compétence) ; le lexique d'apparat, si.\n- \"repetition_pauvre\" : le retour d'un mot générique ou d'un verbe pauvre\n  faute de variation. La répétition d'un terme technique est LÉGITIME : ne\n  l'étiquette jamais.\n\n# RÉUSSITES (cite, sans commenter)\nCherche-les avec la même attention que les défauts. Le relevé par exception\nvaut aussi pour elles : une réussite non citée est une réussite qui n'existe\npas. Cite chaque réussite réelle, même modeste ; n'en invente pas — une\nliste vide n'est pas un défaut.\n- \"formule\" : une phrase qui condense une idée avec netteté. Elle doit être\n  de l'élève : une maxime empruntée à un auteur cité n'en est pas une.\n- \"variation\" : un rythme construit.\n- \"mot_juste\" : un choix de mot qui travaille — le terme précis là où un mot\n  vague suffisait (« une entrave » plutôt que « un problème ») ; une\n  opposition construite (« la règle intériorisée » contre « la contrainte\n  subie ») ; le mot concret qui condense une idée (« l'école fabrique des\n  exécutants »). Un mot juste peut se trouver dans une phrase par ailleurs\n  maladroite : cite le mot, pas la phrase.\n\n# ORTHOGRAPHE (liste à part, jamais un jugement)\nFautes bénignes — dont TOUS les accords qui laissent la lecture unique :\nTOTAL + au plus 5 citations — ici, et ici seulement, le total déclaré et le\nplafond de 5 restent en vigueur, parce que l'orthographe n'entre dans aucun\ngrade et que ses comptes peuvent être volumineux. Seule la faute qui oblige à\nrelire pour retrouver la structure de la phrase devient un fait\n\"accord_brouillant\".\n\n# SORTIE (JSON strict, aucun texte autour ; sois économe)\n{\n  \"phrases_a_reconstruire\": [\n    { \"n\": 0, \"segment\": \"segment exact qui casse\",\n      \"lectures\": \"les lectures concurrentes, brèves\" }\n  ],\n  \"phrases_perdues\": [\n    { \"n\": 0, \"segment\": \"segment exact\", \"constat\": \"bref\" }\n  ],\n  \"phrases_sans_attache\": [0, 0],\n  \"faits\": [\n    { \"type\": \"étiquette du catalogue\",\n      \"citations\": [ { \"phrase\": 0, \"citation\": \"segment exact\" } ] }\n  ],\n  \"reussites\": [\n    { \"phrase\": 0, \"type\": \"formule | variation | mot_juste\",\n      \"citation\": \"mots exacts\" }\n  ],\n  \"orthographe\": { \"total\": 0,\n    \"citations\": [ { \"phrase\": 0, \"citation\": \"mots exacts\" } ] }\n}\n\n# COPIE À ANALYSER\nSujet : {sujet}\nPré-relevé mécanique (calculé par programme — les numéros [n] de phrases et\n[¶] de paragraphes font référence) :\n{pre_releve}\nCopie (phrases numérotées) : {copie}",
    "P2": "# RÔLE\nTu es un évaluateur de l'expression écrite. Tu places la copie d'un élève de\nlycée (Première/Terminale, philosophie/HLP) à un niveau, en te fondant\nUNIQUEMENT sur le relevé fourni ci-dessous. Tu n'as pas la copie originale\net tu n'en as pas besoin : tu ne sauras jamais si les idées étaient bonnes,\net c'est voulu — les idées ne te concernent pas.\n\n# CE QUE TU REÇOIS\nUn objet JSON à trois parties :\n- \"stats_mecaniques\" : calculées par programme, fiables — nb_mots,\n  nb_phrases, nb_paragraphes, longueurs des phrases, répétitions\n  mécaniques.\n- \"releve_p1\" : le relevé PAR EXCEPTION d'un releveur. Convention : toute\n  phrase NON listée se lit du premier coup (sens \"passe\") et s'accroche\n  correctement à la précédente. Le silence est le relevé du propre.\n- \"mesures_calculees\" : **tous les comptes, taux et densités, déjà calculés\n  par le programme** à partir du relevé — occurrences par type, totaux par\n  dimension, total général, phrases à reconstruire, phrases perdues,\n  taux_rx, taux_sans_attache, les trois densités, et les phrases ouvertes\n  par un connecteur d'école (détectées par le programme, qui a déjà retiré\n  des comptes les occurrences qui se réduisent à ces connecteurs).\n\n# TU NE CALCULES RIEN\nC'est la règle la plus importante de ce prompt. Tous les nombres dont tu as\nbesoin sont dans \"mesures_calculees\", comptés par programme, donc exacts. Tu\nne fais aucune addition, aucune division, aucun pourcentage. Tu ne recalcules\npas un chiffre pour vérifier, tu ne le corriges pas, tu ne l'estimes pas.\nQuand tu cites un nombre dans ta justification, tu le recopies depuis\n\"mesures_calculees\" tel quel.\nLes densités fournies sont celles du relevé AVANT ton audit. C'est normal :\nle programme les recalculera après, à partir des occurrences que tu rejettes.\nTu n'as donc pas à en produire de version corrigée — seulement à dire\nlesquelles tu rejettes.\nCela vaut aussi pour ta justification : tu ne décris JAMAIS en chiffres\nl'état du relevé après tes rejets — c'est le programme qui recalcule. Tout\nnombre que tu cites est recopié tel quel, non arrondi, et désigne ce que le\nbloc dit qu'il désigne : les densités fournies sont celles d'AVANT ton\naudit ; ne les présente jamais comme des valeurs d'après. Pour parler de\nl'effet de tes rejets, des mots suffisent (« la densité baissera d'autant »).\n\n# LES DEUX FAMILLES D'ÉTIQUETTES (liste fermée — ne l'élargis jamais)\nChaque fait du relevé porte une étiquette. Voici à quelle dimension chacune\nappartient. Aucune étiquette ne compte dans les deux.\n- FLUIDITÉ (7) : rupture_construction, phrase_surchargee, referent_flou,\n  accord_brouillant, registre_oral, ouverture_monotone, moule_repete.\n- PRÉCISION DU VOCABULAIRE (5) : mot_generique, periphrase_vague,\n  mot_impropre, savant_plaque, repetition_pauvre.\nUne étiquette absente de ces deux listes ne compte nulle part : signale-la\ndans \"etiquettes_rejetees\" avec la raison « hors catalogue ».\n\n# COMMENT NOTER\n1. TA SEULE TÂCHE DE FOND — L'AUDIT DES ÉTIQUETTES. Relis chaque citation du\n   relevé, une par une : rejette toute occurrence dont la citation ne porte\n   pas manifestement l'étiquette. Une phrase longue mais maîtrisée n'est pas\n   \"phrase_surchargee\" ; une reprise par « cette + nom » n'est pas une\n   absence d'attache ; une répétition de terme technique n'est pas\n   « repetition_pauvre » — en particulier le terme même du sujet : « le\n   bonheur » répété dans une dissertation sur le bonheur est légitime. Ce\n   crible protège l'élève d'un relevé trop zélé.\n   L'audit se fait PAR OCCURRENCE, jamais par type : sur trois occurrences\n   d'une même étiquette, tu peux en rejeter une et garder les deux autres.\n   Tu ne peux rejeter que des occurrences listées dans le relevé\n   (`releve_p1.faits`). Ce qui n'est pas dans le relevé n'existe pas pour\n   toi.\n   Chaque rejet va dans \"etiquettes_rejetees\", avec le type, le numéro de\n   phrase et la citation RECOPIÉE À L'IDENTIQUE — c'est ainsi que le\n   programme retrouve l'occurrence à retirer. Une citation approximative ne\n   sera pas retrouvée, et le rejet sera signalé sans être appliqué.\n   Rejette tout ce qui est infondé, même si c'est beaucoup : un relevé peut\n   se tromper souvent. Si tes rejets dépassent la moitié du relevé, signale\n   un relevé douteux dans ta justification — mais rejette quand même.\n1bis. LE CRIBLE DE LA RÉUSSITE — deux tests, sur les entrées de\n   \"releve_p1.reussites\". L'audit ci-dessus ne porte que sur les DÉFAUTS ;\n   celui-ci porte sur les RÉUSSITES, et il est le seul moyen de refuser une\n   entrée qui n'en est pas une.\n\n   TEST 1 — LE PROCÉDÉ, sur les entrées \"formule\" et \"variation\".\n   Une réussite de phrase fait travailler la FORME. Tu dois pouvoir nommer\n   son procédé EN UN SEUL MOT de cette liste, et d'aucune autre :\n     rythme · symetrie · antithese · renversement · image · condensation ·\n     chute\n   Si aucun ne convient, ce n'est pas une réussite. Tu ne cherches pas\n   ailleurs : « définit », « explique », « conceptualise » ne sont pas des\n   procédés de FORME — ce que la phrase apprend au lecteur n'est pas ton\n   affaire, et le point 4 ci-dessous te le redit.\n   - « La liberté permet de faire des choix. » → aucun procédé nommable : la\n     phrase définit, platement. Tu rejettes l'entrée.\n   - « On ne choisit pas d'être libre : on l'est, et c'est là toute la\n     peine. » → renversement. L'entrée tient.\n\n   TEST 2 — LE MOT GÉNÉRIQUE, sur les entrées \"mot_juste\".\n   Un mot juste est plus précis que le mot ordinaire. Tu dois pouvoir nommer\n   LE MOT GÉNÉRIQUE qu'il remplace, et dire ce qui se perdrait à l'échanger.\n   Si l'échange ne perd rien — le mot EST le mot ordinaire pour la chose —,\n   ce n'est pas un mot juste.\n   - « la liberté est importante » → « important » ne remplace rien de plus\n     précis. Tu rejettes l'entrée.\n   - « une obéissance consentie » → contre « acceptée » : « consentie » porte\n     l'acte de volonté que l'autre perd. L'entrée tient.\n\n   CE QUE TU NE PEUX PAS FAIRE. Tu ne rejettes JAMAIS une réussite parce\n   qu'elle te paraît faible : une réussite qui passe son test tient, quelle\n   que soit ton impression. Tu ne promeus jamais — le crible ne fait que\n   RETIRER —, et tu ne cherches pas de réussites que le relevé ne porte pas.\n   Un rejet de réussite N'AJOUTE AUCUN DÉFAUT et ne fait descendre aucun\n   grade : il ferme la porte du 4, rien de plus.\n   Chaque rejet va dans \"reussites_rejetees\" — JAMAIS dans\n   \"etiquettes_rejetees\", qui ne connaît que les défauts —, avec le type, le\n   numéro de phrase, la citation RECOPIÉE À L'IDENTIQUE, le test appliqué et\n   la raison.\n2. LES NOMBRES SONT DANS \"mesures_calculees\". Tu les lis, tu ne les produis\n   pas : occurrences par type, total de fluidité, total de lexique, total\n   général, phrases à reconstruire, phrases perdues, taux_rx,\n   taux_sans_attache, densite_fluidite, densite_lexique, densite_totale.\n   Les densités sont pour 100 mots ; toutes ces valeurs sont d'avant audit.\n3. GRADE FLUIDITÉ (0 à 4) — SEUILS CHIFFRÉS (provisoires, calés sur le run 2).\n   Tu lis taux_rx et densite_fluidite dans \"mesures_calculees\" ; retire\n   mentalement les occurrences que tu viens de rejeter, puis place le grade :\n   - 0 : taux de phrases perdues ≥ ~10 % ;\n   - 1 : taux_rx ≥ ~20 % ;\n   - 2 : taux_rx entre ~10 et 20 %, OU densite_fluidite ≥ ~3, OU taux sans\n     attache (déjà filtré des ouvertures par le script) ≥ ~40 % ;\n   - 3 : en dessous de ces seuils. Quelques « à reconstruire » isolées\n     (taux_rx < ~10 %) et des faits épars ne descendent PAS une copie\n     sous 3 ;\n   - 4 : LES TROIS CONDITIONS, toutes : (a) au plus 1 phrase à reconstruire\n     ET aucune phrase perdue (les deux nombres sont dans mesures_calculees) ;\n     (b) densite_fluidite ≤ 1,5 ; (c) au moins une réussite citée ET RETENUE\n     AU CRIBLE (1bis) de type formule ou variation. SI LES TROIS SONT\n     RÉUNIES, LE GRADE EST 4 ; SI\n     L'UNE MANQUE, IL NE L'EST PAS. Il n'y a aucune autre condition : les\n     connecteurs d'école sont déjà traités par le programme et ne bloquent\n     pas ce grade. Un squelette scolaire n'interdit pas le 4 ; mais une\n     copie qui n'est QUE scolaire n'aura pas de réussite à citer, et n'y\n     arrivera pas par là.\n   Tu n'as pas de marge d'appréciation supplémentaire au-delà de ces seuils :\n   la sévérité non écrite n'est pas une règle. Même chose au grade 3.\n   CONNECTEURS D'ÉCOLE : les connecteurs d'école sont détectés et retirés\n   des comptes par le programme ; tu n'as pas à t'en occuper. L'ancre Bon dit\n   littéralement « convenu » : une copie mécanique mais propre ne descend\n   pas sous 3.\n4. GRADE PRÉCISION (0 à 4) — tu lis densite_lexique dans \"mesures_calculees\",\n   tu en retires mentalement tes rejets, puis tu places le grade (seuils\n   provisoires) :\n   - 0 : impropres bloquants — la copie ne dit plus rien ;\n   - 1 : densite_lexique ≥ ~4, ou plusieurs impropres qui égarent ;\n   - 2 : densite_lexique entre ~2 et 4 ;\n   - 3 : densite_lexique ≤ ~2 ;\n   - 4 : LES DEUX CONDITIONS : densite_lexique ≤ 1,0 ET au moins une\n     réussite citée ET RETENUE AU CRIBLE (1bis) de type mot_juste. SI LES\n     DEUX SONT RÉUNIES, LE GRADE\n     EST 4 ; SI L'UNE MANQUE, IL NE L'EST PAS. Aucune autre condition. (Une\n     réussite de type formule ou variation ne suffit pas ici : elle est du\n     côté de la phrase, pas du lexique.)\n   INTERDICTION d'ajuster un grade au vu de l'autre. La vacuité\n   INFORMATIONNELLE d'une phrase par ailleurs fluide et lexicalement\n   correcte (la « phrase-écran » qui n'apprend rien au lecteur) n'est PAS\n   ton affaire : elle relève de l'argumentation, pas de l'expression.\n5. CROISEMENT — RECALCULÉ EN CODE, PAS PAR TOI. Le niveau et les deux\n   garde-fous sont calculés par le programme, à partir de tes deux grades et\n   des comptes recalculés après tes rejets. Ta seule tâche est de rendre des\n   grades justes et une liste de rejets honnête. Tu remplis quand même le\n   champ \"niveau\" en appliquant la règle ci-dessous, et le programme signale\n   tout désaccord entre ton niveau et le sien : c'est une vérification, pas un\n   piège. N'ajuste JAMAIS un grade pour obtenir le niveau qui te semble bon —\n   ce serait travailler à l'envers.\n   La règle : niveau = moyenne des deux grades, arrondie vers le bas.\n   0-0,5 → ABSENT ; 1-1,5 → FAIBLE ; 2-2,5 → MOYEN ; 3-3,5 → BON ;\n   4 → ACQUIS. DEUX GARDE-FOUS, appliqués après la moyenne :\n   - si un grade vaut 0 → niveau au plus FAIBLE ;\n   - GARDE-FOU BAS — c'est le PROGRAMME qui l'applique, sur la densité\n     totale après audit ; tu n'as ici rien à calculer. Au-delà de 5,5 faits\n     pour 100 mots, le niveau est plafonné à FAIBLE. Entre 4,5 et 5,5 — la\n     zone grise — il ne l'est que si un second signal confirme la casse : au\n     moins 10 % des phrases à reconstruire ou perdues. En dessous de 4,5,\n     pas de plafond. Une copie saturée de faits de langue ET qui casse à la\n     lecture ne peut pas être Moyen. Ce paragraphe est une information sur\n     ce que le programme fera de tes grades, pas une consigne pour toi.\n6. Tu ne tiens AUCUN compte de l'orthographe bénigne (liste à part), ni des\n   conventions typographiques (espaces autour de la ponctuation, césures de\n   fin de ligne — artefacts d'OCR), ni de rien qui relèverait des idées ou\n   de l'organisation entre paragraphes. Le grade 4 est COMPATIBLE avec des\n   fautes bénignes d'orthographe ou de grammaire : une copie n'a pas à être\n   parfaite pour être Acquis.\n\n# ÉCHELLE (rappel)\n- ABSENT — la langue fait obstacle au sens.\n- FAIBLE — on comprend au prix d'un effort ; la logique des phrases casse,\n  le lexique ne nomme presque rien.\n- MOYEN — friction et génériques fréquents ; OU une dimension propre,\n  l'autre défaillante (fluide mais imprécis / précis mais raide).\n- BON — lecture sans friction notable, lexique adéquat ; sans éclat.\n- ACQUIS — rythme et aisance, mot juste ; la langue sert et affine la\n  pensée.\n\n# DÉMARCHE\nTon évaluation alimente un dispositif d'apprentissage : l'élève doit savoir\noù il en est et la SEULE prochaine chose à travailler. Tranche pour un\npalier unique et un levier unique. Cette exigence de netteté ne doit jamais\nte rendre indulgent : tu places le niveau réel, sans le gonfler.\n\n# SORTIE (JSON strict, aucun texte autour)\n{\n  \"niveau\": \"Absent | Faible | Moyen | Bon | Acquis\",\n  \"grades\": { \"fluidite\": 0, \"precision\": 0 },\n  \"reussites_rejetees\": [\n    { \"type\": \"formule | variation | mot_juste\", \"phrase\": 0,\n      \"citation\": \"la citation RECOPIÉE À L'IDENTIQUE depuis le relevé\",\n      \"test\": \"procede | mot_remplace\",\n      \"raison\": \"brève — aucun procédé nommable, ou aucun mot générique remplacé\" }\n  ],\n  \"etiquettes_rejetees\": [\n    { \"type\": \"étiquette du relevé\", \"phrase\": 0,\n      \"citation\": \"la citation RECOPIÉE À L'IDENTIQUE depuis le relevé\",\n      \"raison\": \"brève — pourquoi la citation ne porte pas l'étiquette\" }\n  ],\n  \"profil\": \"UNIQUEMENT l'une de ces trois valeurs : diagonale | fluide-imprecis | precis-raide — diagonale si l'écart entre les deux grades est de 0 ou 1 ; un profil dissocié exige un écart d'au moins 2\",\n  \"justification_ancree\": \"2 à 4 phrases renvoyant aux éléments du relevé. Tout nombre que tu y cites est RECOPIÉ depuis mesures_calculees, jamais recalculé. Destinée à la validation par le professeur.\",\n  \"ce_qui_plafonne\": \"Ce qui empêche le palier supérieur, en termes de coûts de lecture et/ou de lexique.\",\n  \"levier\": \"L'action concrète et prioritaire qui ferait monter d'un palier (ex. : raccrocher chaque phrase à la précédente en reprenant un mot ; remplacer les « chose » cités ; couper la phrase 4 en deux). Matière à feedback.\",\n  \"confiance\": \"UNIQUEMENT l'un de ces trois mots : élevée | moyenne | faible — aucun autre texte dans ce champ ; toute justification va dans justification_ancree.\"\n}\n\n# RELEVÉ À ÉVALUER\n{releve_phase_1}"
  },
  "source": "competences/expression.md",
  "statut": "RELUE ET VALIDÉE",
  "version": "3.2"
} as const
