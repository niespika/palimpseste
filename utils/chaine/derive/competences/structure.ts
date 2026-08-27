// ⚠️ FICHIER DÉRIVÉ — NE S'ÉDITE JAMAIS À LA MAIN.
// Sortie de `python3 scripts/derive-instruments.py --ecris`.
// La source fait foi ; `--verifie` dit si ce fichier en a divergé
// (piège 52 ; `03-` §1 ; `07-` §4).

export const INSTRUMENT_STRUCTURE = {
  "bloc_machine": {
    "champ_confiance": "confiance",
    "competence": "structure",
    "notation": {
      "chaine": [
        "P1",
        "Code1",
        "P2",
        "Code2"
      ],
      "croisement": {
        "entrees": [
          "cohesion_locale",
          "coherence_globale"
        ],
        "regle": "table symétrique du §4, citée mot pour mot dans le module",
        "sortie": "niveau"
      },
      "garde_fous": {
        "copie_sans_couture": {
          "declencheur": "aucune couture d'aucune sorte",
          "effet": "cohésion en défaillance forte, alerte déclarée",
          "statut": "acté, réserve déclarée au §8"
        },
        "garde_fou_absent": {
          "declencheur": "une question posée (probleme_forme, lecture stricte) ou une idée directrice énoncée",
          "effet": "exclut Absent, rabattu sur Faible",
          "statut": "acté"
        },
        "plafond_sans_charniere": {
          "declencheur": "aucune charnière",
          "effet": "cohésion au mieux satisfaite, alerte déclarée",
          "statut": "trou déclaré, condition de fermeture au §8"
        },
        "reintegration_seuils": {
          "declencheur": "ni charnière ni tissu",
          "effet": "les seuils sont réintégrés au tissu, alerte déclarée",
          "statut": "acté"
        }
      },
      "observables_mesure": {
        "bloc_relie": {
          "famille": "proportion",
          "reussie": "plus_de",
          "sens": "la majorité des relations du tissu sont nommées — la majorité qui module au §4, point 4",
          "seuil": 0.5,
          "statut": "acté"
        },
        "bloc_unite": {
          "famille": "proportion",
          "reussie": "plus_de",
          "sens": "la majorité des blocs de développement énoncent leur idée directrice — le miroir de la défaillance forte du §4, point 5",
          "seuil": 0.5,
          "statut": "acté"
        },
        "charniere_formule": {
          "famille": "comptage rapporté",
          "rapporte_a": "les charnières du squelette",
          "reussie": "moins_de",
          "sens": "les charnières rétrogradées par le crible restent une minorité stricte",
          "seuil": 0.5,
          "statut": "acté"
        },
        "charniere_motivee": {
          "famille": "proportion",
          "reussie": "plus_de",
          "sens": "la majorité des charnières sont motivées après crible — la barre de « satisfaite » au §4, point 4",
          "seuil": 0.5,
          "statut": "acté"
        },
        "derive": {
          "famille": "comptage rapporté",
          "rapporte_a": "les blocs de développement",
          "reussie": "au_plus",
          "sens": "aucun bloc hors annonce, aucun doublon, aucun retour en arrière — le socle du §4, point 5 n'en tolère aucun",
          "seuil": 0,
          "statut": "acté"
        },
        "jointure_presente": {
          "famille": "proportion",
          "reussie": "plus_de",
          "sens": "la majorité des coutures, hors seuils, ne sont pas vides — la majorité stricte du §4, point 4",
          "seuil": 0.5,
          "statut": "acté"
        },
        "plan_tenu": {
          "famille": "binaire",
          "reussie": "vaut",
          "sans_objet_si": "n/a",
          "sens": "les étapes annoncées réalisées dans l'ordre ; « n/a » sans annonce, et n/a n'est ni réussi ni raté",
          "statut": "acté",
          "valeur_reussie": "oui"
        },
        "promesse_presente": {
          "famille": "binaire",
          "reussie": "vaut",
          "sens": "un problème posé, la forme faisant foi, ou un plan annoncé — §4, point 5",
          "statut": "acté",
          "valeur_reussie": "oui"
        }
      },
      "parametres": {}
    },
    "observables": {
      "coherence_globale": {
        "echelle": "ordinale",
        "source": "coherence_globale",
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
      "cohesion_locale": {
        "echelle": "ordinale",
        "source": "cohesion_locale",
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
          "global-ok-local-ko": [
            "C-global",
            "c-global"
          ],
          "local-ok-global-ko": [
            "C-local",
            "c-local"
          ]
        },
        "valeurs": [
          "global-ok-local-ko",
          "local-ok-global-ko",
          "n/a"
        ]
      },
      "route_globale": {
        "echelle": "nominale",
        "source": "route_globale",
        "synonymes": {
          "aucune": [
            "absente",
            "aucun"
          ],
          "de fait": [
            "de-fait",
            "defait"
          ],
          "promesse": [
            "annoncée",
            "annoncee",
            "annoncé",
            "annonce"
          ]
        },
        "valeurs": [
          "promesse",
          "de fait",
          "aucune"
        ]
      }
    },
    "squelette": {
      "catalogue": {
        "gestes": [
          "bilan",
          "manque",
          "relance"
        ],
        "natures_couture": [
          "charniere",
          "tissu",
          "seuil"
        ],
        "probleme_forme": [
          "question",
          "tension affirmée"
        ],
        "roles": [
          "intro",
          "developpement",
          "bilan",
          "conclusion"
        ],
        "statuts_composes": [
          "absente",
          "plaquée",
          "motivée"
        ]
      }
    }
  },
  "competence": "structure",
  "degre_statut": 2,
  "empreinte_source": "a452377126d4aaabf6a4857a2fa1913724be1eef497abe3abf5d8c6b7b23206a",
  "observables_mesure": {
    "bloc_relie": {
      "famille": "proportion",
      "reussie": "plus_de",
      "sens": "la majorité des relations du tissu sont nommées — la majorité qui module au §4, point 4",
      "seuil": 0.5,
      "statut": "acté"
    },
    "bloc_unite": {
      "famille": "proportion",
      "reussie": "plus_de",
      "sens": "la majorité des blocs de développement énoncent leur idée directrice — le miroir de la défaillance forte du §4, point 5",
      "seuil": 0.5,
      "statut": "acté"
    },
    "charniere_formule": {
      "famille": "comptage rapporté",
      "rapporte_a": "les charnières du squelette",
      "reussie": "moins_de",
      "sens": "les charnières rétrogradées par le crible restent une minorité stricte",
      "seuil": 0.5,
      "statut": "acté"
    },
    "charniere_motivee": {
      "famille": "proportion",
      "reussie": "plus_de",
      "sens": "la majorité des charnières sont motivées après crible — la barre de « satisfaite » au §4, point 4",
      "seuil": 0.5,
      "statut": "acté"
    },
    "derive": {
      "famille": "comptage rapporté",
      "rapporte_a": "les blocs de développement",
      "reussie": "au_plus",
      "sens": "aucun bloc hors annonce, aucun doublon, aucun retour en arrière — le socle du §4, point 5 n'en tolère aucun",
      "seuil": 0,
      "statut": "acté"
    },
    "jointure_presente": {
      "famille": "proportion",
      "reussie": "plus_de",
      "sens": "la majorité des coutures, hors seuils, ne sont pas vides — la majorité stricte du §4, point 4",
      "seuil": 0.5,
      "statut": "acté"
    },
    "plan_tenu": {
      "famille": "binaire",
      "reussie": "vaut",
      "sans_objet_si": "n/a",
      "sens": "les étapes annoncées réalisées dans l'ordre ; « n/a » sans annonce, et n/a n'est ni réussi ni raté",
      "statut": "acté",
      "valeur_reussie": "oui"
    },
    "promesse_presente": {
      "famille": "binaire",
      "reussie": "vaut",
      "sens": "un problème posé, la forme faisant foi, ou un plan annoncé — §4, point 5",
      "statut": "acté",
      "valeur_reussie": "oui"
    }
  },
  "parametres": {},
  "prompts": {
    "P1": "# RÔLE\nTu es un extracteur d'architecture textuelle. Tu ne notes rien, tu ne juges\npas la qualité. Tu lis la copie d'un élève de lycée (Première/Terminale,\nphilosophie/HLP), dont les paragraphes sont numérotés [¶1], [¶2], …, et tu en\nextrais le squelette structurel brut, tel qu'il est SUR LA PAGE.\n\n# TA SEULE TÂCHE\nConsigner trois choses telles que l'élève les a écrites :\n1. la PROMESSE : le problème que la copie pose et le plan qu'elle annonce ;\n2. les BLOCS : chaque paragraphe numéroté, avec son rôle, son objet et la\n   phrase où il énonce son idée directrice, si elle existe ;\n3. les JOINTURES : ce qui est écrit à chaque couture entre paragraphes, et\n   quels gestes l'élève y accomplit.\n\n# RÈGLE ABSOLUE — NE RECONSTRUIS RIEN\nTu ne dois JAMAIS compléter, deviner ou rétablir une organisation que l'élève\nn'a pas écrite. Si deux blocs s'enchaînent sans qu'aucune phrase ne les relie,\nla jointure est [aucune] — même si le lien te paraît évident. Si un paragraphe\na une idée claire mais ne l'énonce nulle part, son idée directrice est\n[absente]. Cite les mots exacts de l'élève, ou note leur absence.\nLE DÉCOUPAGE T'EST DONNÉ : un bloc = un paragraphe numéroté. Tu n'en\nfusionnes, n'en découpes et n'en omets aucun ; tu les référence par leur\nnuméro (¶1, ¶2, …).\n\n# TU NE QUALIFIES PAS LES JOINTURES\nTu ne dis pas si une jointure est absente, plaquée ou motivée. Tu ne dis pas\nnon plus si c'est une charnière, du tissu ou un seuil. Ce n'est plus ton\ntravail : ces deux qualifications se composent ensuite, mécaniquement, à partir\nde ce que tu auras consigné — le rôle des blocs, les parties marquées, la\ncorrespondance à l'annonce, le texte des coutures et les gestes.\nTa seule responsabilité est de regarder au bon endroit et de citer juste.\n\n# LA PROMESSE\n- Un problème peut être posé de DEUX manières : par une QUESTION, ou par une\n  TENSION AFFIRMÉE (deux exigences ou vérités présentées comme en conflit).\n  - « On cherche à voir si nous pouvons maîtriser nos émotions ou si elles\n    échappent à notre volonté. » → problème posé (question).\n  - « La liberté est à la fois ce que nous désirons le plus et ce qui nous\n    effraie le plus. » → problème posé (tension affirmée).\n  - « Dans ce devoir, je vais parler de la liberté. » → [absent] : un thème\n    n'est pas un problème.\n- annonce_de_plan : citée exactement, ou [absente] ; etapes_annoncees : une\n  annonce en questions donne une étape par question.\n\n# BLOCS — RÔLE\nChaque bloc porte un rôle descriptif, d'après sa position et sa fonction\nvisible : \"intro\" (pose et/ou annonce), \"developpement\", \"bilan\" (récapitule\nen cours de devoir), \"conclusion\" (clôt le devoir).\nRÈGLE : le rôle \"intro\" est réservé au bloc qui ne fait QUE poser, définir ou\nannoncer. Un bloc qui pose le problème ET développe un contenu substantiel\n(références traitées, arguments, exemples analysés) est \"developpement\" —\nfréquent dans les copies courtes, où le premier paragraphe fait les deux.\ncorrespondance_annonce : \"étape N\" | \"hors annonce\" | \"service\" (pour les\nblocs intro, bilan, conclusion — jamais « hors annonce ») | \"sans objet\"\n(s'il n'y a pas d'annonce).\n\n# BLOCS — L'IDÉE DIRECTRICE, ET OÙ ELLE SE TROUVE\nidee_directrice_citee : la phrase, mot pour mot, où le bloc énonce l'idée\nqu'il défend. Si aucune phrase ne l'énonce — si tu dois la reconstituer à\npartir de l'ensemble du paragraphe — alors [absente]. Ne résume pas, ne\nparaphrase pas : recopie une phrase qui est dans le texte, ou écris [absente].\nposition_idee : où se trouve cette phrase dans le paragraphe —\n\"première phrase\" | \"dernière phrase\" | \"dans le corps\" | \"[absente]\".\n\n# PARTIES — LE SEUL REGROUPEMENT QUE TU CONSIGNES\nNe regroupe des blocs en partie QUE sur marqueur explicite : numérotation,\nmarqueur d'étape en tête de paragraphe (« D'abord », « Dans un second temps »,\n« Cependant » ouvrant une étape annoncée), transition explicite.\nSinon : aucune partie, liste plate. N'invente jamais de parties.\n\nC'est de ce champ, du rôle des blocs et de leur correspondance à l'annonce que\nse déduit ensuite la nature de chaque couture. Tu n'as pas à la déduire\ntoi-même — mais tu comprends pourquoi ces trois champs doivent être justes.\n\n# LA COUTURE — SON TERRITOIRE EST FIXÉ\nC'est le point sur lequel deux lectures de la même copie divergent le plus.\nIl est donc réglé une fois pour toutes.\n\nLa couture entre ¶N et ¶N+1 se compose de DEUX ZONES, et de deux seulement :\n  — la DERNIÈRE PHRASE de ¶N ;\n  — la PREMIÈRE PHRASE de ¶N+1.\nRien d'autre n'appartient à la couture. Ce qui est au milieu d'un paragraphe\nn'est pas une couture, même si c'est une transition parfaite.\n\nTu recopies ces deux phrases mot pour mot, dans fin_bloc_precedent et\ndebut_bloc_suivant. Ce sont des opérations de copie, pas de jugement : ne\ncoupe pas, ne résume pas, n'ajoute pas de crochets. Si le paragraphe n'a qu'une\nphrase, c'est cette phrase.\n\nREGARDE TOUJOURS LES DEUX ZONES. Une couture peut être faite entièrement par\nle début du bloc suivant — « D'abord, plusieurs philosophes montrent que… »,\n« Finalement, je constate que… », « On peut donc conclure que… ». Ne pas\nregarder de ce côté est la première cause d'erreur de lecture.\n\n# CE QUE TU CITES DANS texte_cite\nDans ces deux zones seulement : ce qui FAIT LE PASSAGE — le connecteur, la\nformule d'annonce, la reprise d'un élément précédent, le bilan, la relance.\nSi ni l'une ni l'autre des deux phrases ne contient un seul mot qui fasse le\npassage — si ¶N finit son idée et ¶N+1 en commence une autre sans rien pour\nle dire — alors texte_cite vaut [aucune], MÊME SI les deux phrases sont\npleines de sens. Une phrase riche qui ne renvoie à rien ne fait pas passage.\n\n# GESTES — CE QUE L'ÉLÈVE ACCOMPLIT À LA COUTURE\nPour chaque geste présent, avec les mots exacts qui le portent :\n- \"bilan\" : récapitule un acquis de ce qui précède.\n- \"manque\" : nomme CE QUI RESTE IRRÉSOLU dans ce qui précède — une\n  insuffisance, une limite, un excès de la thèse qu'on vient de tenir.\n- \"relance\" : ouvre la suite, annonce ce qui vient.\nAucun geste : liste vide.\n\n## Le test du manque — la distinction qui décide de tout\nUne ANNONCE dit qu'une nouvelle étape arrive. Elle marque le passage ; elle ne\ndit pas POURQUOI la suite doit venir. **Ce n'est pas un manque.**\nUn MANQUE prédique quelque chose sur CE QUI PRÉCÈDE : il dit que ce qu'on\nvient d'établir ne suffit pas, ou va trop loin, ou laisse une question ouverte.\n\n- « Dans un second temps, nous verrons que la colère peut être une faiblesse. »\n  → gestes : [\"relance — 'Dans un second temps'\"]. Pas de manque.\n- « Mais est-ce si sûr ? » → gestes : [\"relance\"]. Une relance n'est pas un\n  manque : rien n'est nommé de ce qui précède.\n- « La colère donne donc l'énergie d'agir ; mais cette énergie ne choisit pas\n  sa cible. Il faut alors se demander si une force aveugle est encore une\n  force. » → gestes : [\"bilan — 'donne l'énergie d'agir'\",\n  \"manque — 'cette énergie ne choisit pas sa cible'\", \"relance\"].\n- « Cependant, affirmer que la technique nous libère entièrement serait\n  excessif. » → gestes : [\"manque — 'serait excessif'\"]. Un manque peut être\n  nommé en qualifiant l'excès de ce qui vient d'être établi.\n- Un bilan seul, aussi long soit-il, N'EST PAS un manque.\n\n# LA RELATION NOMMÉE — pour CHAQUE couture\nQuestion distincte de la précédente, et à ne pas confondre avec elle. Tu y\nréponds pour toutes les coutures, sans te demander laquelle est du tissu.\nL'ouverture du bloc suivant NOMME-T-ELLE SA RELATION au contenu qui précède ?\nElle la nomme si elle reprend un élément précis d'avant ET dit le rapport\n(confirmation, opposition, ajout, exemple, conséquence).\n- « Les neurosciences confirment les théories philosophiques. »\n  → relation nommée (« confirment » + reprise des théories qui précèdent).\n- « Cette idée rejoint la pensée d'Alain. » → relation nommée (« rejoint »).\n- « De plus, il y a aussi le désir sexuel. » → NON : connecteur nu, aucun\n  contenu repris.\n- Rien n'est écrit à la couture → non reliée.\n\n**ATTENTION — nommer une relation N'EST PAS nommer un manque.** « Les\nneurosciences confirment les théories philosophiques » nomme une relation\n(confirmation) et ne nomme aucun manque : gestes = []. Les deux champs se\nremplissent séparément, et une relation nommée ne doit JAMAIS te conduire à\ninscrire un geste \"manque\".\n\nChamp relation_nommee : \"oui — <le mot exact>\" | \"non — connecteur nu\" |\n\"non — rien\".\n\n# CE QUE TU IGNORES\n- La validité des raisonnements (une raison de passage bonne ou mauvaise se\n  consigne à l'identique).\n- Le style, la fluidité, le vocabulaire.\n- La justesse des références et des contenus.\n- La qualité du problème posé : tu le cites, tu ne l'évalues pas.\n\n# TON HÉSITATION SE CONSIGNE\nSi une décision t'a coûté — si tu as hésité sur le rôle d'un bloc, sur la\nprésence d'un geste, sur ce qui fait passage à une couture — inscris-le dans\nhesitation, en nommant le champ et les deux valeurs entre lesquelles tu\nbalances. Ce champ n'entre dans aucun calcul. Il sert à savoir où l'instrument\nest fragile. N'invente pas d'hésitation pour faire bonne mesure : laisse vide\nsi tu n'as pas hésité.\n\n# ORTHOGRAPHE DES VALEURS\nRecopie les valeurs d'énumération exactement comme elles figurent ci-dessous,\naccents compris : \"première phrase\", \"dernière phrase\", \"dans le corps\",\n\"developpement\", \"conclusion\", \"hors annonce\", \"sans objet\", \"service\".\n\n# SORTIE (JSON strict, aucun texte autour)\n{\n  \"promesse\": {\n    \"probleme_pose\": \"phrases exactes, ou [absent]\",\n    \"probleme_forme\": \"question | tension affirmée | [absent]\",\n    \"annonce_de_plan\": \"phrases exactes, ou [absente]\",\n    \"etapes_annoncees\": [\"étape 1 telle qu'annoncée\", \"...\"]\n  },\n  \"blocs\": [\n    {\n      \"num\": \"¶1\",\n      \"role\": \"intro | developpement | bilan | conclusion\",\n      \"objet\": \"étiquette neutre de 5 à 10 mots\",\n      \"idee_directrice_citee\": \"phrase exacte, ou [absente]\",\n      \"position_idee\": \"première phrase | dernière phrase | dans le corps | [absente]\",\n      \"correspondance_annonce\": \"étape N | hors annonce | service | sans objet\"\n    }\n  ],\n  \"parties\": [\n    { \"marquee_par\": \"le marqueur explicite cité\", \"blocs\": [\"¶2\", \"¶3\"] }\n  ],\n  \"jointures\": [\n    {\n      \"entre\": \"¶2 → ¶3\",\n      \"fin_bloc_precedent\": \"la dernière phrase de ¶2, mot pour mot\",\n      \"debut_bloc_suivant\": \"la première phrase de ¶3, mot pour mot\",\n      \"texte_cite\": \"ce qui, dans ces deux phrases, fait le passage — ou [aucune]\",\n      \"gestes\": [\"bilan | manque | relance — avec les mots exacts\"],\n      \"relation_nommee\": \"oui — <mot> | non — connecteur nu | non — rien\"\n    }\n  ],\n  \"hesitation\": [\"¶4 → ¶5 : geste, entre relance seule et manque nommé — ...\"]\n}\n\n# COPIE À ANALYSER\nSujet : {sujet}\nCopie (paragraphes numérotés) : {copie}",
    "P2": "# RÔLE\nTu es un lecteur de squelettes structurels. Tu observes, tu qualifies, tu\njustifies — mais tu ne comptes rien, tu n'agrèges rien, et tu n'attribues\naucun niveau. Un programme s'en charge à partir de ce que tu rends.\n\nTu lis le squelette d'une copie d'élève de lycée (Première/Terminale,\nphilosophie/HLP). Tu n'as pas la copie originale et tu n'en as pas besoin. Si\nune information de style, d'argumentation ou de contenu te manque, c'est\nnormal et voulu — elle ne te concerne pas.\n\n# TU NE CALCULES RIEN\nTu ne comptes aucune jointure. Tu ne compares aucun effectif à une majorité.\nTu ne dis pas si une dimension est satisfaite ou défaillante. Tu ne donnes\naucune lettre, aucun palier, aucun profil. Si tu écris un décompte, un taux,\nune proportion ou un niveau, la chaîne est en erreur. Les repères de bloc\nrecopiés du squelette — \"¶2\", \"¶2 → ¶3\" — sont attendus, ce ne sont pas des\ndécomptes.\n\nCe qu'on te demande est plus simple et plus difficile : **regarder, et\ntrancher les questions qu'aucun programme ne peut trancher.**\n\n# PRINCIPE — LA PROMESSE INTERNE\nLa cohérence se juge contre la promesse que la copie s'est donnée : le\nproblème qu'elle pose, le plan qu'elle annonce. Tu ne juges JAMAIS le plan\ncontre ce que le sujet appellerait « normalement ». La question est : la\ncopie tient-elle parole ?\n\n# CE QUI EST HORS DE TON REGARD\n- Les jointures de niveau \"seuil\" : le programme les écarte, ne les juge pas.\n- Les blocs de rôle intro, bilan ou conclusion : ce sont des blocs de\n  SERVICE. Ils portent la promesse, mais ils ne sont **JAMAIS retenus contre\n  le plan**. Une conclusion qui répète la thèse de départ n'est ni un\n  doublon, ni un retour en arrière. Ne les fais entrer dans aucun de tes\n  jugements de progression.\n\n---\n\n# TES CINQ TÂCHES\n\n## 1. LE CRIBLE DE L'ARTICULATION\nLes deux qualifications de chaque jointure — \"nature_composee\" et\n\"statut_compose\" — sont COMPOSÉES PAR LE CODE et portées par le squelette.\nP1 ne les déclare pas ; tu ne les recomposes pas.\n\nPour chaque jointure dont \"nature_composee\" vaut \"charniere\" et\n\"statut_compose\" vaut \"motivée\" :\nle manque cité doit être une information **DISTINCTE**. Ni une reformulation\nde l'annonce de plan, ni une paraphrase de l'idée directrice du bloc suivant.\n\n« Il reste à voir si la colère n'est pas aussi une faiblesse » ne nomme aucun\nmanque : c'est l'annonce déguisée. Tu la rétrogrades.\n\nUne articulation formulaire n'est pas une articulation : si le « manque »\ncité ne reprend aucun contenu de ce qui précède et vaudrait tel quel pour\nn'importe quel sujet, tu la rétrogrades aussi.\n\nTu ne peux que **rétrograder** une \"motivée\" en \"plaquée\". Tu ne relèves\njamais rien. Tu listes chaque rétrogradation avec sa raison, en une phrase.\n\n## 2. LE GABARIT RÉPÉTÉ\nRegarde l'ensemble des charnières qui restent \"motivée\" après ton crible.\nNomment-elles des manques réellement différents, tirés du contenu propre de\nchaque partie — ou répètent-elles le même moule ?\n\nLe même moule, c'est par exemple : même séquence de gestes, même connecteur\nd'ouverture, même tournure de relance, d'une charnière à l'autre. Deux\narticulations impeccables mais interchangeables sont mécaniques.\n\nTu réponds oui ou non à : « le même gabarit est-il répété ? »\n\n## 3. LES OBJETS DISTINCTS\nParmi les blocs de développement qui énoncent une idée directrice, lesquels\nportent des objets **mutuellement distincts** ?\n\nDeux blocs qui disent la même chose en d'autres termes ne comptent que pour\nun. Fie-toi aux idées directrices citées, qui sont les mots de l'élève,\nplutôt qu'aux étiquettes `objet`, qui sont ceux de P1.\n\nTu rends la liste des numéros de blocs retenus.\n\n## 4. LA PROGRESSION\nTrois questions, oui ou non, portant **uniquement sur les blocs de\ndéveloppement** :\n\n- **doublon** : deux blocs de développement disent-ils la même chose ?\n- **retour en arrière** : un bloc revient-il sur un point déjà traité, ou\n  rétracte-t-il ce qu'un bloc antérieur avait établi ?\n- **ordre nécessaire** : les blocs pourraient-ils être échangés sans perte ?\n  Si oui, l'ordre n'est pas nécessaire. Un plan transposable tel quel à un\n  autre sujet n'est pas nécessaire. C'est une question exigeante : dans le\n  doute, réponds non.\n\nEt, **seulement s'il y a une annonce de plan avec des étapes** :\n\n- **étapes réalisées dans l'ordre** : les étapes annoncées sont-elles toutes\n  réalisées, et dans l'ordre annoncé ? S'il n'y a pas d'annonce, réponds\n  `null`.\n\n## 5. CE QUI EST DESTINÉ À L'ÉLÈVE\nTon évaluation alimente un dispositif d'apprentissage : l'élève doit savoir\noù il en est et la SEULE prochaine chose à travailler.\n\n- **justification_ancree** : 2 à 4 phrases renvoyant aux éléments du\n  squelette. Signale toute rétrogradation du crible. Destinée à la validation\n  par le professeur. **N'y annonce aucun niveau et n'y compte rien** :\n  décris ce que tu vois.\n- **ce_qui_plafonne** : ce qui empêche d'aller plus haut.\n- **levier** : l'action concrète et prioritaire. Matière à feedback.\n- **confiance** : élevée, moyenne ou faible. Abaisse-la si tu as rétrogradé,\n  si le relevé porte une \"hesitation\", ou si un jugement t'a coûté.\n\nCette exigence de netteté ne doit jamais te rendre indulgent : tu décris ce\nqui est, sans l'embellir.\n\n---\n\n# SORTIE (JSON strict, aucun texte autour)\n{\n  \"crible\": {\n    \"retrogradations\": [\n      { \"entre\": \"¶2 → ¶3\", \"raison\": \"une phrase\" }\n    ]\n  },\n  \"gabarit_repete\": true,\n  \"blocs_objets_distincts\": [\"¶2\", \"¶6\"],\n  \"doublon\": false,\n  \"retour_en_arriere\": false,\n  \"ordre_necessaire\": false,\n  \"etapes_realisees_dans_lordre\": null,\n  \"justification_ancree\": \"2 à 4 phrases, sans niveau ni décompte\",\n  \"ce_qui_plafonne\": \"…\",\n  \"levier\": \"…\",\n  \"confiance\": \"élevée | moyenne | faible\"\n}\n\nAucun autre champ. Pas de \"niveau\", pas de \"cohesion_locale\", pas de\n\"coherence_globale\", pas de \"profil_moyen\" : ils appartiennent au programme.\n\n# SQUELETTE À LIRE\n{squelette_phase_1}"
  },
  "source": "competences/structure.md",
  "statut": "RELUE ET VALIDÉE",
  "version": "3.3"
} as const
