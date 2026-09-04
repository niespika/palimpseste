# SPEC — Aletheia : étayage par niveau, gabarits de lecture et texte découpé

> Statut : **proposé**, issu de l'évaluation pédagogique du 2026-09-03 et de quatre échanges de
> cadrage avec Louis. Aucun code, aucune migration écrite ici. Les migrations qu'il appelle
> suivent la règle absolue de `SUIVI_SQL.md` au moment où elles seront écrites.
> Gate : tout ce qui suit naît derrière **`aletheia_etayage_actif` à OFF** (patron `rag_actif`).
> Sous gate OFF, le module se comporte à l'octet près comme aujourd'hui.

---

## 0. Ce que ce spec change, en une page

Aletheia fait écrire l'élève avant de l'aider, questionne ses erreurs, répond à ses questions,
lui montre une synthèse modèle après l'effort, et lui fait valider la lecture du retour. Tout
cela est juste et reste. Ce qui manque tient en quatre mesures faites sur les 38 travaux réels
de production (3 élèves, 1 livre de 29 séances, juillet-août 2026 — comptes probablement de
test, chiffres à rejouer sur une vraie classe) :

| Mesure | Valeur | Ce qu'elle dit |
|---|---|---|
| Thèse laissée strictement identique entre V1 et VF | 19 / 38 | la réécriture n'atteint pas ce que les relances visent |
| Ajouts de la VF non ancrés dans le texte | 33 / 111 | l'élève colle ses réponses aux relances dans ses arguments |
| Durée V1 → clôture de la séance (médiane, minimum) | 17 min, 5 min | personne ne relit le livre entre les deux |
| Retour final complet (médiane, maximum) | 912 mots, 1 206 | trop long pour être agi ; la synthèse tient ses 194 mots |
| Citations du livre faites par l'IA, retrouvées verbatim dans le texte stocké | ~~117 / 242~~ **3 / 3** (E9) | ⚠️ **mesure d'E0 FAUSSE** : le script comptait les segments entre deux apostrophes (« l'amour … d'un ») comme des citations — 344 faux positifs ; entre guillemets, l'IA cite 10 fois, 3 hors texte de l'élève, 3 retrouvées verbatim. La pièce « désigner, ne plus citer » (§ 6.2) reste juste pour une autre raison : une relance sans passage n'envoie pas relire |

Le spec répond par six pièces, qui s'empilent dans cet ordre :

1. **Le texte découpé** (§ 3) : chaque version de livre est découpée une fois en sections,
   paragraphes et phrases, bornes en caractères. Code pur, aucune IA.
2. **La fiche enrichie de passages clés** (§ 4) : la fiche canonique porte, par séance, des
   passages avec leurs phrases pivots, alignés sur le découpage et amendables par le prof.
3. **Les gabarits de lecture** (§ 5) : quatre jeux de questions, choisis par livre, qui
   remplacent les cinq champs fixes.
4. **La séance recomposée** (§ 6) : rappel d'ouverture, réponse aux relances avant la
   réécriture, retour final agi (une nuance prioritaire, flèche vers le texte, comparaison
   avec la synthèse par surlignage).
5. **La forme par niveau** (§ 7) : le diagnostic prof, désormais hebdomadaire, décide si le
   passage est montré (E, D), à surligner dans une fenêtre de 400 mots (C, B), ou dans une
   demi-section (A). Deux règles de code, jamais un prompt.
6. **Les règles annexes** (§ 8) : « je ne sais pas », petits malins, Quazian, traductions.

Valeur attendue, dans l'ordre : réponse aux relances avant réécriture > passages et
surlignage > comparaison avec la synthèse > rappel d'ouverture > gabarits. Les gabarits sont
en dernier par valeur immédiate mais en premier par dépendance : la fiche, le diagnostic et
les prompts en dépendent.

---

## 1. Ce qui existe et sur quoi on s'appuie (vérifié dans le code le 03/09)

- Machine à états par séance `DRAFT → V1_SUBMITTED → FEEDBACK1_READY → VF_SUBMITTED →
  FEEDBACK2_READY → DONE` ; écritures compare-and-set ; retours générés en `after()`
  (`app/eleve/modules/aletheia/actions.ts`, `utils/aletheia-retours.ts`).
- Cinq champs de saisie V1 : `these`, `arguments`, `accord`, `questions[]`, `vocabulaire[]` ;
  trois champs VF (`FormulaireV1.tsx`, `FormulaireVf.tsx`).
- Retour V1 socratique : `relances[]`, `accord`, `reponses_questions[]`, `vocabulaire[]`,
  `remarque_questions` (masquée par défaut). Reçoit le texte de la semaine, la fiche canonique
  de la semaine **courante** (confidentielle), les VF des semaines passées, la trajectoire
  diagnostique. Ancrage strict à la semaine : interdiction de citer l'amont et l'aval.
- Retour VF : `synthese_modele` (écrasée par celle de la fiche quand elle existe),
  `ajouts_verifies[]` (extrait verbatim de la VF + `ancre`), `nuances_et_erreurs[]`,
  `architecture_amont[]`, `architecture_aval_jalons[]`. Contexte : fiches amont, texte de la
  semaine, **titres seuls** de l'aval (anti-spoiler structurel, Lot C), `temperature: 0`.
- Fiche canonique `aletheia_livre_reference.contenu` (jsonb, additif) : par semaine
  `these_canonique`, `arguments_cles[]`, `concepts_cles[]`, `synthese_modele`, stamps
  `genere_le` / `amende_le` ; générée par lots de 2 semaines ; éditeur prof ; `amende_par_prof`.
- Diagnostic prof-only en deux phases anti-halo (inventaire puis niveau E→A sur deux axes,
  thèse et arguments), `temperature: 0`. **Automatique en semaine 1 seulement** ; les autres
  semaines sont un lot lancé par le prof (`actions.ts`, `if (semaine === 1)`). Biais mesuré et
  accepté : thèse +1 indulgente, arguments −1 sévère sur le milieu de gamme
  (`aletheia_calibration/DECISIONS_calibration.md`).
- Détecteur « petit malin » sans IA : rendu vide sous 25 caractères, aveu de non-travail →
  strike avant tout appel IA (`utils/detecteur-integrite.ts`). Signal IA `hors_sujet` /
  `aveu_non_travail` → alerte prof en attente.
- Validation de lecture du retour final, divulgation partie par partie, synthèse en dernier
  (`components/retours/ValidationLecture.tsx`, prop `sequentiel`).
- Vocabulaire → cartes Quazian, déduplication par `concept_tag` en minuscules, exact
  (`creerCartesVocabulaire`).
- Copie annotée du prof : surlignage par couches et **une** flèche par dépôt
  (`utils/copie/couches.ts`, gate `copie_annotee_actif`).
- Partition d'un texte par intervalles de caractères, garantie « pas un octet retouché »,
  convention **base 0, fin exclue** (`utils/deroule/marquage.ts`,
  `segmenterParIntervalles` ; convention de `exercices.materiau_source_localisation`).
- Découpe d'un texte en sections par plages de lignes (`utils/scriptorium-sections.ts`,
  `decouperPlages`). **Il n'existe aucun découpeur en phrases.**
- Mode C (extraits d'un livre dans un parcours) : les séances exposées sont un sous-ensemble ;
  l'amont et l'aval de l'IA sont bornés à l'extrait (`utils/aletheia-extrait.ts`).

---

## 2. Décisions actées avec Louis (03/09)

| # | Décision |
|---|---|
| D1 | Le rappel d'ouverture part **dans l'appel V1**, pas dans un appel séparé ; le retour V1 s'ouvre par la bulle sur le rappel. L'appel V1 reçoit pour cela la fiche de la séance **N−1** (thèse canonique + synthèse modèle), avec une exception nommée à la règle d'ancrage strict, valable pour cette seule bulle. |
| D2 | La **version modernisée par IA** d'une traduction libre de droits est la version de **référence** du module : c'est elle que lit le tuteur, elle qu'on cite, elle qu'on découpe, elle qu'on surligne. Le livre papier de l'élève peut différer : tout passage montré porte la mention « dans notre version ». **Aucune vérification par le code contre le livre de l'élève** ; le repère stable inter-traductions est le chapitre et le numéro de section. |
| D3 | **Quatre gabarits** de lecture, choisis par livre, surchargeables par séance : argumentatif, dialogué, aphoristique, analytique. Les champs sont des **questions**. L'ironique est absorbé par le dialogué (voix empruntée = voix multiple), le descriptif disparaît (il se lit en dialogué ou en argumentatif ; le drapeau « pas de thèse nette » de la fiche ne change pas de gabarit, il neutralise l'axe 1 du diagnostic comme aujourd'hui). |
| D4 | « Je ne sais pas » est une **réponse recevable** par champ, qui déclenche un étayage ; le détecteur de petits malins continue de frapper le rendu **vide** et l'aveu de **non-lecture**, plus jamais un champ court. |
| D5 | Tailles : passage **montré** à E et D = **dix lignes** (les phrases de philosophes sont longues, la pivot au milieu, jamais en tête) ; fenêtre à surligner à C et B = **400 mots** arrondis à la phrase ; à A = **la moitié de la section** contenant la pivot. On ne coupe jamais une phrase. **Calibré par E0 (§ 13)** : dix lignes ≈ 119 mots ≈ 3 phrases médianes, et une pivot mesurée fait 13 à 128 mots → le passage montré = **la pivot entière + au moins une phrase avant et une après, et jamais moins de dix lignes** ; la demi-section se borne à la **phrase**, pas au paragraphe (§ 3.2). |
| D6 | Le texte de chaque livre est **découpé une fois** en sections, paragraphes et phrases, comme la fabrique découpe ses extraits ; les passages clés de la fiche s'alignent sur ce découpage ; l'IA ne produit **jamais un offset**, seulement un identifiant. |
| D7 | Le retour final **pointe le texte** : phrase de l'élève à gauche, phrase du texte à droite, flèche et verdict *confirme* / *infirme*. À C et au-dessus, l'élève surligne d'abord, la flèche apparaît ensuite. |
| D8 | La comparaison avec la synthèse modèle se fait par **surlignage**, comparé par le code à un jugement *présent / partiel / absent* par phrase, produit dans l'appel VF. Aucun appel supplémentaire. |
| D9 | Quazian : déduplication sur un **`terme_canonique`** (lemme) produit par l'appel V1, plus garde-fou de préfixe. |
| D10 | Le gradient de forme est piloté par l'**axe arguments** du diagnostic (le plus robuste, et dont le biais pousse vers plus d'aide), avec **deux séances consécutives** requises pour changer de forme. Le diagnostic tourne **à chaque séance**. |
| D11 | « Tes questions » reste un **champ à part** dans tous les gabarits : une question reçoit une réponse, une objection reçoit une relance ; les objections vont dans la question tournante. « Quelle est la thèse que l'auteur préfère ? » est **fixe** dans le dialogué (c'est l'axe 1 du diagnostic), « quelle idée te convainc » est tournante. |

---

## 3. Le texte découpé

### 3.1 Objet

Une **découpe** par (livre, version du texte) : la liste des sections, paragraphes et phrases
de chaque semaine, avec leurs bornes en caractères dans `scriptorium_documents.texte_extrait`.
Convention **base 0, fin exclue**, la même que `materiau_source_localisation`.

```jsonc
// aletheia_livre_decoupage (1 ligne par livre)
{
  "scriptorium_livre_id": "…",
  "version": "sha256 concaténé des texte_extrait par semaine",   // fige la version
  "semaines": [
    { "semaine": 12, "texte_hash": "…",
      "paragraphes": [ { "id": "p12-03", "debut": 1240, "fin": 2210 } ],
      "phrases":     [ { "id": "s12-031", "para": "p12-03", "debut": 1240, "fin": 1398 } ] }
  ]
}
```

### 3.2 Règles

- **Un seul découpeur en phrases**, en code pur, dans un module dédié (`utils/texte/phrases.ts`
  ou équivalent), testé sur des fixtures de phrases philosophiques : points-virgules, deux-points,
  citations imbriquées, abréviations (« ch. », « § », « p. »), points de suspension, appels de
  note en fin de phrase (« sa raison 5. » dans le texte réel). ⛔ Pas de second découpeur nulle
  part : la leçon du tokeniseur s'applique (`reference_miroir_du_code_tokeniseur`).
- **Partitionnante** : la concaténation des phrases d'une semaine rend le texte à l'octet
  près ; on réutilise `segmenterParIntervalles` pour tout rendu.
- **Les paragraphes sont optionnels.** E0 (§ 13) a montré que le texte extrait des PDF ne
  porte **aucune ligne vide** (1 « paragraphe » par semaine) et qu'une heuristique de ligne
  courte est trop instable (de 1 à 8 paragraphes par semaine, jusqu'à 2 226 mots). Les
  paragraphes ne sont donc remplis **que si le texte en a** (une version modernisée livrée
  avec des lignes vides) ; toutes les fenêtres (§ 7) se bornent à la **phrase**, et
  `para_debut` / `para_fin` des passages clés (§ 4.1) deviennent `phrase_debut` /
  `phrase_fin`. Rien dans le spec ne dépend d'un paragraphe.
- **Le nettoyage est une liste de MASQUES, pas une réécriture** *(arbitrage E1, 03/09)*. E0 a
  compté **340 appels de note collés** (« sa raison 5. », « idées modernes 6 », « du roman
  13 »), un numéro de section en tête de texte (« 19 On ne saurait… ») et 33 césures
  « mot-\nmot ». Ils apparaîtraient tels quels dans un passage montré. Mais la doctrine de la
  plateforme est nette (`utils/lecture/texte-support.ts`) : **le texte ne se recopie jamais,
  `texte_extrait` est son seul domicile, et pas un octet n'est retouché**. La découpe porte
  donc, par semaine, des **masques** — des intervalles que le rendu omet — et la détection
  des phrases se fait sur une copie de travail de même longueur où les masques sont des
  espaces : les bornes valent telles quelles sur le texte. Le trait d'union d'une césure
  **reste** (« peut-\nêtre » rend « peut-être », « con-\ntemplation » rend
  « con-templation » : sans dictionnaire on ne distingue pas les deux, le second est le
  moindre mal, 33 cas sur le livre). `version` = empreinte des `texte_extrait` bruts.
- **Figée par version** : si `texte_extrait` change (re-modernisation, re-découpe des
  semaines), `version` change, la découpe est régénérée, et **tous les passages clés de la
  fiche sont invalidés** jusqu'à régénération ou ré-alignement (§ 4.3). Pas de rustine au
  cas par cas.
- Générée à la préparation du livre, dans le même orchestrateur que la carte et la fiche ;
  quelques millisecondes, pas de `after()` nécessaire.
- Mode C : la découpe couvre toutes les semaines du livre ; l'exposition filtre par séance
  comme aujourd'hui.

### 3.3 Mesure préalable obligatoire

Avant d'écrire le découpeur : compter sur le livre de prod (29 semaines, 10 554 caractères par
semaine en médiane, 33 césures « mot-\nmot » sur tout le livre) le nombre de phrases par
semaine, la longueur médiane et maximale d'une phrase, et la proportion de « phrases » de
moins de 5 mots (titres, appels de note). Ces chiffres calibrent les dix lignes de D5 et
décident si les appels de note doivent être nettoyés à l'extraction.

---

## 4. La fiche enrichie : passages clés

### 4.1 Schéma (additif dans `aletheia_livre_reference.contenu`, aucun SQL)

```jsonc
{
  "semaine": 12, "titre": "…",
  "gabarit": "argumentatif",              // NOUVEAU — surcharge optionnelle du gabarit du livre
  "these_canonique": "…", "arguments_cles": ["…"], "concepts_cles": ["…"], "synthese_modele": "…",
  "passages_cles": [                       // NOUVEAU — 2 à 4 par semaine (E4, `utils/aletheia/passages.ts`)
    { "id": "k12-1",
      "role": "these",                     // these | argument:2 | concept:socratisme_esthetique | reponse
      "phrase_debut": "s12-029", "phrase_fin": "s12-036",   // bloc CONTIGU de 2 à 12 phrases (les paragraphes sont optionnels, § 3.2)
      "pivots": [["s12-031"], ["s12-034", "s12-035"]],   // alternatives recevables ; chaque alternative = 1-2 phrases contiguës
      "pivots_texte": ["…", "…"],          // le texte RENDU de chaque alternative, pour le ré-alignement (§ 4.3)
      "libelle": "la phrase où l'auteur formule la règle",  // ce que l'élève cherche : le LIEU, jamais la réponse
      "decoupage_version": "…",
      "revoir": false }                    // posé par le ré-alignement quand une pivot n'est pas retrouvée
  ],
  "synthese_phrases": [ { "id": "y12-1", "texte": "…" } ]   // NOUVEAU — la synthèse modèle numérotée (§ 6.5)
}
```

- Une **pivot** est une phrase ou deux phrases contiguës. Un passage long (une page) garde
  une pivot courte : la consigne est toujours « la phrase où… », jamais « le passage ».
- **Plusieurs alternatives** quand deux endroits répondent. Le code accepte l'une ou l'autre.
- `role` relie le passage à un argument clé ou à un concept : c'est ce que le retour V1
  désigne (§ 6.2).

### 4.2 Génération

Un appel **par semaine, en parallèle**, distinct de l'appel de fiche (E0 : 5 à 6 s et
~330 tokens de sortie par semaine, loin du plafond de 60 s ; le coller au lot de fiche de
2 semaines le rallongerait sans raison). Le modèle reçoit la fiche de la semaine et le texte
**avec ses phrases numérotées** (`[s12-031] …`) et rend des identifiants, jamais du texte. Le
code vérifie : identifiants existants, passage contigu de 2 à 12 phrases, pivot de 1 à 2
phrases **contiguës** à l'intérieur du passage ; ce qui ne passe pas est **rejeté** (le passage
tombe, la fiche reste READY, la semaine est signalée « passages incomplets » dans la
vue-livre, comme une référence partielle aujourd'hui). Aucune citation libre n'est acceptée à
ce niveau. Deux consignes de prompt tirées d'E0 : « deux phrases distinctes qui répondent
chacune = deux **alternatives**, jamais une pivot à trou » (le seul rejet mesuré) ; et « le
libellé dit **où** chercher, jamais **ce qu'on** y trouve » (un libellé sur douze donnait la
réponse : « le dialogue platonicien devient modèle du roman, poésie servante »). Le second
point ne se vérifie pas en code : il se relit dans l'éditeur de fiche.

### 4.3 Édition prof

Dans l'éditeur de fiche existant, un volet « passages clés » : le texte de la semaine affiché
phrase par phrase, chaque passage comme une surbrillance à étendre ou réduire **par phrases
entières**, ses pivots comme une surbrillance plus foncée. Ajouter, supprimer, dupliquer une
alternative. `amende_le` par semaine, comme aujourd'hui ; une régénération IA reprend la
main avec confirmation.

Après un changement de version du texte (§ 3.2), l'éditeur propose un **ré-alignement**
(bouton « ⇄ Ré-aligner sur le texte », visible dès qu'un passage porte une autre version) :
chaque pivot est recherchée mot pour mot (texte rendu, masques omis) dans la nouvelle
version ; retrouvée → ré-alignée, les bornes du passage recalées à la même distance ;
sinon → marquée « à revoir ». Le prof valide. **Éprouvé (E4, 03/09)** : deux phrases
ajoutées en tête de la semaine 18 du livre de prod en bac à sable → 12 passages recalés
de +2 phrases, 0 à revoir ; texte remis → 12 recalés, 0 à revoir. La première épreuve
avait laissé un passage « à revoir » : le numéro de section poussé au milieu du texte
n'était plus masqué et entrait dans la pivot — le masque vaut maintenant pour tout
numéro seul sur sa ligne (32 sur le livre, contre 28 en tête).

### 4.4 Mesure préalable obligatoire

Sur le livre de prod, générer les passages clés de trois semaines (courte, médiane, longue),
et mesurer : nombre de passages produits, longueur des pivots en mots, taux de rejet par le
code, et **temps du lot** (le plafond Vercel de 60 s a déjà tué la fiche une fois ; la
numérotation des phrases grossit l'entrée).

---

## 5. Les gabarits de lecture

Un gabarit = cinq emplacements. Les deux premiers portent l'opération de lecture propre au
genre ; le troisième **tourne** d'une séance à l'autre ; **« Tes questions »** et
**« Vocabulaire »** sont invariants. Le gabarit est une colonne du livre
(`scriptorium_unites.gabarit_lecture`, défaut `argumentatif`), surchargeable par séance
dans la fiche (§ 4.1). Il pilote : les libellés des champs, les prompts V1 et VF, les deux
axes du diagnostic, le contenu de la fiche.

### 5.1 Argumentatif (Race et Histoire, Manifeste, Apologie, Lettres, Méditations)

| Emplacement | Question posée à l'élève |
|---|---|
| 1 | Quelle est l'idée que l'auteur défend ? |
| 2 | Quelles sont les raisons qu'il avance pour défendre son idée ? |
| 3 (tournant) | Es-tu d'accord avec ce que dit l'auteur ? · Quelle objection lui adresserais-tu ? · À qui parle-t-il, et que veut-il qu'on fasse ? · Donne un exemple qui illustre ou contredit son idée. |
| 4 | As-tu des questions à lui poser ? |
| 5 | Quels mots n'as-tu pas compris ? |

Diagnostic : axe 1 = thèse saisie ; axe 2 = arguments restitués. Fiche : inchangée.

### 5.2 Dialogué (Le Banquet, l'Apologie, l'Utopie, l'Éloge de la folie, les mythes, le théâtre)

| Emplacement | Question posée à l'élève |
|---|---|
| 1 | Quelles sont les idées que l'on trouve dans ce passage, et qui soutient chacune ? |
| 2 | Qu'est-ce qui fait avancer l'échange ? Y a-t-il des objections, des réfutations, des retournements ? |
| fixe | Quelle est la thèse que l'auteur préfère, selon toi ? Qu'est-ce qui te le fait dire ? |
| 3 (tournant) | Quelle idée du texte te convainc ? · Laquelle te paraît la plus faible ? · Où hésites-tu sur ce que l'auteur pense vraiment ? |
| 4 | As-tu des questions à poser ? |
| 5 | Quels mots n'as-tu pas compris ? |

Diagnostic : axe 1 = **attribution** (les positions sont-elles à la bonne voix, l'auteur
est-il distingué de ses personnages) ; axe 2 = mouvements de l'échange restitués. Fiche :
`these_canonique` devient « la position de l'auteur », `arguments_cles` devient « positions par
voix » (une entrée = voix + position). L'ironie tient là : la voix de la Folie est une voix,
la position d'Érasme est la position de l'auteur.

### 5.3 Aphoristique / digressif (Par-delà bien et mal, Montaigne)

| Emplacement | Question posée à l'élève |
|---|---|
| 1 | Quel passage as-tu choisi ? Recopie-le. |
| 2 | Que veut-il dire, selon toi ? |
| 3 (tournant) | Quel passage n'arrives-tu vraiment pas à comprendre, et d'après toi pourquoi t'échappe-t-il ? · Quel fil vois-tu entre ce passage et un autre de la séance ? · Es-tu d'accord avec lui ? |
| 4 | As-tu des questions à poser ? |
| 5 | Quels mots n'as-tu pas compris ? |

Le passage recopié est **localisé par le code dans notre version** (recherche mot pour mot,
puis à deux mots près) ; s'il n'est pas retrouvé (autre traduction), l'IA le localise par le
sens et le code affiche « dans notre version, c'est ici » avec le passage. Le retour V1
travaille sur ce fragment-là : la fiche porte une thèse reconstruite **par aphorisme** de la
séance (`arguments_cles` devient « fragments : n°, thèse implicite »). « Je ne sais pas » est
ici une question de plein droit (emplacement 3).

Diagnostic : axe 1 = thèse implicite du fragment choisi ; axe 2 = **n.d.** par défaut (pas de
liste à restituer), sauf quand le tournant est « le fil » (→ fil juste ou non).

### 5.4 Analytique / boîte à outils (La Poétique, L'Art d'avoir toujours raison)

| Emplacement | Question posée à l'élève |
|---|---|
| 1 | Que dit l'auteur de la notion ou de l'outil que ce passage décrit ? |
| 2 | Applique l'analyse de l'auteur à un cas de ton choix. |
| 3 (tournant) | Cet outil te paraît-il honnête ? · Connais-tu une œuvre qui ne rentre pas dans cette définition ? · Quelle distinction de l'auteur te semble la plus utile ? |
| 4 | As-tu des questions à poser ? |
| 5 | Quels mots n'as-tu pas compris ? |

Idée et argument ne sont pas distingués (décision Louis). Diagnostic : axe 1 = notion saisie
(définition, critères) ; axe 2 = **application correcte** au cas choisi. Fiche :
`arguments_cles` devient « critères / espèces / mécanisme ».

### 5.5 Invariants transverses

- La question tournante suit un cycle par livre (ordre fixé dans la fiche du livre, avancé à
  chaque séance) ; elle n'est jamais la même deux séances de suite. Le prof peut la forcer.
- Le prompt V1 reçoit **le gabarit** et le libellé de la tournante ; son traitement par champ
  suit le gabarit (le socratique pour 1 et 2, le révélateur de compréhension pour la
  tournante, les réponses pour 4, les définitions pour 5).
- Le prompt VF et le prompt de diagnostic reçoivent de même le gabarit ; l'inventaire
  (phase 1) et l'échelle (phase 2) ont un texte par gabarit. Les niveaux E→A restent les
  mêmes lettres.
- Les colonnes `these`, `arguments`, `accord` **gardent leur nom** en base (contrat de la
  machine à états et du diagnostic) ; leur sens dépend du gabarit. La réponse à la question
  fixe du dialogué va dans une colonne additive `champ_fixe`.

---

## 6. La séance recomposée

### 6.1 Ouverture : le rappel (D1)

Une case de trois lignes avant les champs : « Sans relire, quelle était l'idée de la séance
dernière ? » Stockée dans `aletheia_travaux.rappel`. Absente en séance 1, et en mode C pour
la première séance exposée. **Aucun appel** : le rappel part dans l'appel V1.

Dans le prompt V1 : un bloc « Rappel de la séance précédente » avec la thèse canonique et la
synthèse modèle de la fiche N−1, et l'instruction : juger le rappel contre la fiche N−1
**seulement**, en une bulle courte (juste / partiel / à côté, plus la phrase qui manque),
**sans citer l'aval** et sans que cette bulle serve de relance. Exception nommée à la règle
« ancrage strict à la semaine ». Sortie : `retour_v1.rappel: { verdict, phrase }`. Rendu :
première bulle du retour V1.

### 6.2 Le retour V1 : désigner, ne plus citer

Le prompt V1 reçoit les passages clés de la semaine **avec leurs identifiants et libellés**
(pas leur texte : il a déjà le texte de la semaine). Chaque relance sort avec :

```jsonc
{ "question": "…", "passage": "k12-2" | null, "libelle_a_trouver": "la phrase où Nietzsche formule la règle" }
```

- `passage` obligatoire pour toute relance sur les emplacements 1 et 2 ; `null` toléré pour
  la tournante.
- Le code résout l'identifiant. Identifiant inconnu → la relance est servie **sans** tâche de
  localisation, avec le renvoi descriptif d'aujourd'hui, et un compteur `passage_invalide`
  est incrémenté (télémétrie, vue prof).
- Les réponses aux questions de l'élève portent de même un `passage` optionnel (« Nietzsche
  répond ici »).
- Budget : **300 mots** pour tout le retour V1 hors passages (aujourd'hui 526 en médiane).
  Le prompt fixe le budget ; le code journalise un dépassement, ne tronque pas.

### 6.3 Répondre avant de réécrire

Sous chaque relance, une case dont le libellé dépend de la forme (§ 7) :

| Forme | Libellé de la case |
|---|---|
| passage montré | « Relis ces lignes, puis réponds à la question en une ou deux phrases. » |
| passage à surligner | « Surligne la phrase qui répond, puis dis en une phrase ce qu'elle change à ce que tu avais écrit. » |
| réponse à une question de l'élève | « Cette réponse change-t-elle quelque chose à ton idée principale ? Si oui, quoi. » |

Stockage : `aletheia_travaux.reponses_relances` (jsonb : `[{ relance: i, texte, surlignage:
[debut, fin] | null, verdict_code }]`). La réécriture (formulaire VF) n'est accessible
qu'**après** ces cases, avec les réponses affichées en regard. Les réponses sont injectées
dans l'appel VF (bloc « Ce que l'élève a répondu aux relances »), ce qui permet au retour
final de dire si la correction a été faite.

### 6.4 Le retour final agi (D7)

L'appel VF sort, par nuance :

```jsonc
{ "extrait_eleve": "… (verbatim de la VF, comme ajouts_verifies)", "passage": "k12-1", "pivot": ["s12-031"],
  "verdict": "confirme" | "infirme" | "precise", "note": "… (≤ 40 mots)", "priorite": 1 }
```

- Une seule nuance `priorite: 1`, affichée dépliée en tête. Les autres repliées.
- Rendu : phrase de l'élève à gauche, texte à droite, la pivot surlignée, **une** flèche
  (réutiliser les couches et la flèche de la copie annotée). À C et au-dessus, la fenêtre
  s'ouvre sans surlignage ; l'élève surligne ; le code compare à la pivot ; la flèche et le
  verdict apparaissent ensuite.
- Sur téléphone : blocs empilés, couleur partagée à la place de la flèche. **À montrer sur
  375 px avec un vrai retour avant de conclure** (règle du dépôt, payée deux fois).
- `architecture_amont` : chaque lien devient une **paire de passages** (`passage_courant`,
  `passage_amont` = identifiant d'un passage clé d'une séance passée, `relation` ≤ 12 mots).
  Le prompt VF reçoit pour cela les identifiants et libellés des passages clés de l'amont
  (déjà dans les fiches amont). Rendu : les deux extraits côte à côte. À C et au-dessus :
  l'extrait courant est montré, et l'élève choisit parmi les **libellés** des passages clés
  amont celui qui répond ; le code confirme, puis affiche la paire.
- Budget : nuance prioritaire + note ≤ 80 mots ; le reste replié n'a pas de budget.

### 6.5 Comparer sa version à la synthèse par surlignage (D8)

La synthèse modèle de la fiche est numérotée par phrases (`synthese_phrases`, § 4.1). L'appel
VF la reçoit numérotée et rend `synthese_couverture: [{ id: "y12-1", etat: "present" |
"partiel" | "absent" }]` en comparant à la VF de l'élève.

Écran : la synthèse, la consigne « Surligne ce que cette synthèse dit et que ta version ne
disait pas », puis le code compare l'ensemble surligné (arrondi à la phrase) aux phrases
`absent` : « Tu as repéré 2 des 3 manques ; celui-ci t'a échappé », la phrase mise en
évidence. L'inverse est mesuré aussi (phrase surlignée alors qu'elle était `present` :
« celle-ci, tu l'avais »). Stockage : `aletheia_travaux.comparaison_synthese` (jsonb). La
case à cocher de clôture reste après cette étape.

### 6.6 Ordre d'écran d'une séance

1. Rappel (sauf séance 1) · 2. Lecture dans son livre · 3. Les cinq champs du gabarit ·
4. Attente · 5. Retour V1 : bulle rappel, relances avec case de réponse, réponses aux
questions, vocabulaire · 6. Réécriture avec ses réponses en regard · 7. Attente · 8. Retour
final : nuance prioritaire avec flèche, autres nuances repliées, ajouts vérifiés,
architecture en paires, synthèse à surligner · 9. Clôture.

---

## 7. La forme par niveau (D5, D10)

### 7.1 Deux règles de code

```
forme(eleve, livre, N) :
  niveaux = niveau_arguments_vf des séances < N, les plus récentes d'abord   // axe arguments SEUL
  si aucun niveau                     → 'montre'                              // séance 1, ou diagnostic en erreur
  forme_courante = forme de la séance N−1 (défaut 'montre')
  cible = 'montre' si niveau ∈ {E, D} ; 'fenetre' si ∈ {C, B} ; 'demi_section' si A
  si cible == forme_courante           → forme_courante
  si les DEUX derniers niveaux donnent la même cible ≠ forme_courante → cible   // hystérésis
  sinon                                → forme_courante
```

Retirer de l'aide exige deux séances ; **en donner plus n'en exige qu'une** (un E isolé après
deux C ramène à `montre` tout de suite : l'asymétrie est voulue, dans le sens sûr).

### 7.2 Les trois formes

| Forme | Niveaux | Ce que l'élève voit sous la relance | Ce qu'il fait | Vérification |
|---|---|---|---|---|
| `montre` | E, D | la pivot **mise en évidence** avec une phrase de chaque côté, étendue phrase par phrase jusqu'à **dix lignes** (≥ 740 caractères, E6), mention « dans notre version » | répond en une ou deux phrases | aucune par le code ; le retour VF juge la réponse |
| `fenetre` | C, B | **400 mots** arrondis à la phrase, la pivot à une position non prévisible dans la fenêtre, dans la liseuse intégrée | surligne la phrase, puis une phrase de réponse | intersection d'intervalles avec la pivot (§ 7.3) |
| `demi_section` | A | la moitié de la section contenant la pivot, bornée à la **phrase** (E6 : la découpe en paragraphes est optionnelle, § 3.2) | idem | idem |

Le rappel, les réponses aux questions et la synthèse ne changent pas de forme avec le niveau.

### 7.3 Barème du surlignage (code pur, aucun appel)

Soit S le surlignage (arrondi aux phrases entières), P l'union des pivots recevables, K le
passage englobant. **Les tolérances se comptent en phrases, pas en mots** : E0 a mesuré des
pivots de 13 à 128 mots, un seuil « 3 × la pivot » vaudrait 39 mots ici et toute la fenêtre
là.

| Cas | Retour affiché |
|---|---|
| S couvre une pivot entière et déborde d'au plus **une phrase** de chaque côté | « C'est la phrase. » |
| S chevauche une pivot sans la couvrir | « Tu y es presque : prends la phrase entière. » |
| S couvre une pivot et déborde de plus d'une phrase d'un côté | « Tu y es, mais tu as pris trop large. » |
| S ⊂ K sans toucher P | « Bon endroit, pas la phrase. » |
| S hors de K | « Ce n'est pas là. Relis à partir de … » (la première phrase de K) |

Deux essais ; **au second échec, la pivot est montrée** (décision Louis) et la case de réponse
reste ouverte. Le verdict et le nombre d'essais sont stockés (§ 6.3) et visibles du prof.

### 7.4 Le diagnostic à chaque séance

Supprimer la condition `semaine === 1` dans `soumettreV1` et `soumettreVf` : le diagnostic
tourne à chaque séance, phases V1 et VF (deux petits appels par phase, texte de la semaine
en cache, sortie ≤ 512 tokens). Le lot prof reste pour rattraper les erreurs. Coût à
mesurer sur une classe : ordre de grandeur, quatre appels courts par élève et par séance.

---

## 8. Règles annexes

### 8.1 « Je ne sais pas » (D4)

Recevable sur tout champ, sous deux conditions cumulées : au moins un autre champ montre du
travail, et le « je ne sais pas » dit **quoi** en une ligne (le formulaire l'exige : « Dis en
une ligne ce qui te bloque »). Cette ligne devient une **question** ajoutée au champ 4.
Étayages par emplacement :

- **Emplacement 1** : trois propositions (la thèse canonique reformulée en registre élève,
  deux distracteurs plausibles tirés des `arguments_cles` ou d'une lecture voisine, générés
  avec la fiche et amendables), l'élève choisit et dit pourquoi. La reconnaissance précède le
  rappel.
- **Emplacement 2** : « Surligne (ou recopie) la phrase qui t'a le plus arrêté, même sans la
  comprendre » ; le retour V1 part de là.
- **Tournante** : « je ne sais pas encore » est légitime ; l'IA fournit une affirmation précise
  à laquelle réagir (comportement actuel).

Le rendu part en `V1_SUBMITTED` normalement ; le diagnostic note E ou D sur l'axe concerné,
ce qui déclenche la forme `montre`.

### 8.2 Petits malins

- Le seuil « rendu vide sous 25 caractères » ne s'applique plus **par champ** : le strike
  automatique tombe si **tous** les emplacements 1 à 3 sont vides ou « je ne sais pas » sans
  ligne d'explication, ou sur un aveu de **non-lecture** (« j'ai pas lu »). Un « je sais pas
  sur quoi commenter » seul n'est plus un strike (c'est un cas réel de la prod).
- Le signal IA `hors_sujet` (remplissage creux) ne bouge pas.
- Un surlignage systématiquement « hors de K » sur toutes les relances n'est **pas** un signal
  d'intégrité : c'est un signal de lecture, visible du prof, rien d'automatique.

### 8.3 Quazian (D9)

L'appel V1 sort, par terme, `{ terme, terme_canonique, definition }` avec `terme_canonique` =
lemme, masculin singulier, sans article, minuscules. Déduplication par `terme_canonique`
(colonne additive `quazian_flashcards.lemme`, nullable ; les cartes anciennes gardent la
déduplication par `concept_tag`). ~~Garde-fou : deux lemmes partageant un préfixe de 6 lettres
et une distance d'édition ≤ 2 sont considérés égaux.~~ **Amendé en E5** : la tolérance aux
fautes fusionnait « sophiste » et « sophisme » ; la déduplication se fait par RACINE seule
(`memeLemme`). Le recto reste le mot tel que l'élève l'a écrit.

### 8.4 Traductions et droits (D2)

- Chaque passage montré ou fenêtre ouverte porte « dans notre version ; ton livre peut le dire
  autrement » et le repère chapitre + section.
- La liseuse intégrée n'affiche jamais plus qu'une fenêtre (400 mots) ou une demi-section :
  pas de visionneuse du livre. Sur une traduction encore protégée, la demi-section (forme A)
  doit être **désactivable par livre** (`scriptorium_unites.liseuse_max = 'fenetre'`).
- La version modernisée est celle du prof ; le spec ne dit rien de sa production.

### 8.5 Mode C

Sous gate ON en mode C : les passages clés amont proposés (§ 6.4) et le rappel (§ 6.1) ne
prennent que les séances **exposées** ; la fiche N−1 du rappel est la séance exposée
précédente, pas la semaine N−1 du livre. Rien d'autre ne change.

---

## 9. Données

Toutes additives. Chaque migration = un fichier `.sql` à la racine + une ligne dans
`SUIVI_SQL.md`, sandbox d'abord.

| Objet | Type | Contenu |
|---|---|---|
| `aletheia_livre_decoupage` | table | `scriptorium_livre_id` PK, `version`, `semaines` jsonb, `updated_at` |
| `scriptorium_unites.gabarit_lecture` | colonne | enum `argumentatif \| dialogue \| aphoristique \| analytique`, défaut `argumentatif` |
| `scriptorium_unites.liseuse_max` | colonne | enum `fenetre \| demi_section`, défaut `demi_section` |
| `scriptorium_unites.cycle_tournante` | colonne | jsonb, ordre des questions tournantes |
| `aletheia_travaux.rappel` | colonne | text |
| `aletheia_travaux.champ_fixe` / `champ_fixe_vf` | colonnes | text (dialogué), V1 puis VF |
| `aletheia_travaux.tournante_cle` | colonne | text, clé de la question tournante FIGÉE à la soumission V1 (le retour IA parle de la même question que le formulaire, mode C compris) |
| `aletheia_travaux.reponses_relances` | colonne | jsonb |
| `aletheia_travaux.comparaison_synthese` | colonne | jsonb |
| `aletheia_travaux.forme` | colonne | enum, la forme servie pour cette séance (audit) |
| `aletheia_livre_reference.contenu` | jsonb | `+gabarit`, `+passages_cles[]`, `+synthese_phrases[]`, `+distracteurs[]` — **aucun SQL** |
| `quazian_flashcards.lemme` | colonne | text nullable |
| `aletheia_params` | colonnes | prompts par gabarit (V1, VF, diag inventaire, diag niveau) — ou un jsonb `prompts_gabarits` |
| gate | flag | `aletheia_etayage_actif`, défaut OFF, dans la table des interrupteurs du module |

`retour_v1` et `retour_vf` (jsonb) gagnent les clés décrites en § 6 ; les lectures restent
tolérantes aux anciens retours (clés absentes = comportement actuel).

---

## 10. Lots, dans l'ordre de dépendance

| Lot | Contenu | Dépend de | Fait quand |
|---|---|---|---|
| **E0** ✅ 03/09 | Mesures préalables § 3.3 et § 4.4 sur le livre de prod, chiffres consignés au § 13 | — | fait : D5 amendé (passage = pivot + 1 phrase de chaque côté, ≥ 10 lignes), barème en phrases, paragraphes optionnels, nettoyage des appels de note ajouté à E1 |
| **E1** ✅ code 03/09, SQL bac à sable ☑ 03/09, prod ☐ | Découpeur en phrases (`utils/aletheia/decoupage.ts`, 15 tests), masques au lieu de nettoyage, `aletheia_livre_decoupage` + porte `aletheia_etayage_actif` (`aletheia_etayage_l1.sql`, ligne au journal, **non jouée**), génération en ligne à la création du livre et à la re-découpe, empreinte de version (`decoupage-serveur.ts`) | E0 | fait pour le code : 29/29 semaines partitionnantes à l'octet près, 1 078 phrases, 484 + 28 + 33 masques ; recette `scripts/recette/aletheia-decoupage-e1.mjs` (--genere / --etat / --retire) jouée en bac à sable : 4 livres découpés, ≤ 0,4 s chacun ; reste à jouer le SQL en bac à sable puis en prod |
| **E2** ✅ code 03/09, SQL bac à sable ☑ 03/09, prod ☐ | Diagnostic à chaque séance porte ouverte ; colonne `aletheia_travaux.forme` (`aletheia_etayage_l2.sql`) ; `utils/aletheia/forme.ts` (pur, 11 tests) + `forme-serveur.ts` ; la forme s'écrit sur le travail à la soumission V1 | — | fait : 38 travaux de prod rejoués à blanc dans les DEUX variantes d'hystérésis (§ 13.4) — **à lire par Louis, qui tranche D10** |
| **E3** ✅ code 03/09 (E3a), SQL bac à sable ☑ 03/09, prod ☐, recette écrans 03/09 (E3b) | Gabarits : `gabarits.ts` (4 gabarits en questions, cycle fixe, blocs de prompt), `gabarit-serveur.ts`, colonnes `gabarit_lecture` / `cycle_tournante` / `champ_fixe` / `champ_fixe_vf` / `tournante_cle` / `blocs_gabarits` (`aletheia_etayage_l3.sql`), placeholders `{bloc_gabarit}` dans les 5 prompts, formulaires et page élève, sélecteur dans l'éditeur du livre, surcharge par séance dans la fiche ; identité porte fermée prouvée par `scripts/recette/aletheia-prompts-identite.mjs` | — | fait : trois livres semés en bac à sable (`scripts/recette/aletheia-livres-e3.mjs`, textes Wikisource libres de droits — Le Banquet trad. Cousin / dialogué, Maximes et intermèdes trad. Albert / aphoristique, Poétique trad. Ruelle / analytique), fiches générées par gabarit (positions par voix, thèse implicite par fragment, critères) ; le Banquet a passé une séance COMPLÈTE (V1 → retour socratique aux bulles du gabarit → VF à quatre champs → retour final, diagnostic V1 et VF, `tournante_cle` et `forme` écrits) via un Chrome sans fenêtre (`scratchpad/smoke_e3.mjs`, captures 1280 / 768 / 375) ; les formulaires des deux autres livres rendus aux trois tailles. **À lire par Louis** : les retours (captures et base). Reste : l'éditeur prof des blocs de prompt (`blocs_gabarits`) n'a pas d'écran (lu par le code, éditable en base) ; le cycle tournant par défaut de l'analytique commence par « honnête » (pensé pour Schopenhauer) : pour la Poétique, régler `cycle_tournante` du livre |
| **E4** ✅ code 03/09, aucun SQL, recette bac à sable 03/09 | `utils/aletheia/passages.ts` (pur, 7 tests : vérification, ré-alignement, normalisation), `passages-serveur.ts` (un appel par semaine en parallèle, fusion dans la fiche), actions `genererPassagesCles` / `realignerPassagesCles`, composant `PassagesCles` (lecture : passage rendu, pivots surlignées, périmé / à revoir ; édition : bornes par phrases entières, alternatives de pivots, libellé), `passages_cles` porté par `parseReference` et normalisé à l'enregistrement de la fiche | E1 | fait pour la génération et le ré-alignement (semaines 2, 18, 23 du livre de prod en bac à sable : 12 passages, 0 rejet, ~6 s/semaine ; épreuve de version aller-retour 12/0) ; **l'amendement à la main passe par l'éditeur de fiche, que je n'ai PAS pu ouvrir** (aucun compte prof de test en bac à sable) — à faire par Louis sur le serveur de la branche ; le prompt `prompt_passages` est lu dans `aletheia_params` mais n'a ni colonne ni écran (défaut du code) |
| **E5** ✅ code 03/09, SQL bac à sable ☑ 03/09, prod ☐, recette 03/09 | `utils/aletheia/retour-v1.ts` (pur, 8 tests) : blocs `{bloc_rappel}` / `{bloc_passages}` (V1) et `{bloc_reponses}` (VF) — identité porte fermée conservée (6/6) ; rappel d'ouverture dans `FormulaireV1` (à partir de la 2ᵉ séance exposée), jugé contre la fiche N−1 et rendu en première bulle ; relances par identifiant de passage avec « à chercher » ; cases de réponse (`ReponsesRelances`, action `repondreRelances`, colonne `reponses_relances`) qui remplacent l'atelier de réécriture tant que toutes les relances n'ont pas leur réponse ; réponses injectées dans l'appel VF ; lemme des cartes (`quazian_flashcards.lemme`, dédup par racine) ; bulle de la tournante qui suit la question posée | E3, E4 | fait : Banquet séance 2 jouée de bout en bout en bac à sable (rappel « en partie », 3 relances dont 2 désignent un passage, réponses stockées, VF, retour final) ; ⚠️ **budget non tenu** : 418 mots au premier essai pour 300 ; bloc durci (plafonds par partie) → **359** à la séance 3, rappel jugé « juste », cartes Quazian créées avec leur lemme. **Tranché par Louis (03/09) : deux relances au plus aux formes E/D** (`MAX_RELANCES_MONTRE = 2`, demandé au modèle ET plafonné en code) ; ⚠️ **défaut préexistant trouvé** : les cartes Quazian d'Aletheia n'ont JAMAIS été créées (contrainte `type`) — contourné en `type = 'concept'`, noté dans IDEES |
| **E6** ✅ code 03/09, aucun SQL, recette bac à sable 03/09 | `utils/aletheia/fenetre.ts` (pur, 7 tests) : `fenetreMontre` (pivot ± 1 phrase étendue à ≥ 740 car), `fenetreCherche` (≥ 400 mots, position de la pivot tirée d'une graine par travail et par relance), `demiSection`, `bareme` § 7.3 en phrases, `libelleReponse` ; `fenetre-serveur.ts` (`preparerFenetres`, `jugerSurlignage`) ; action élève `verifierSurlignage` (barème CÔTÉ SERVEUR, essais journalisés sur `reponses_relances[i]`, pivot rendue seulement si juste ou au 2ᵉ échec — D14) ; `ReponsesRelances` : phrases en ligne (des `<span role=button>`, un `<button>` est inline-block et met chaque phrase sur sa ligne — 5 100 px de haut mesurés sur téléphone), « Vérifier (essai n/2) », case de réponse ouverte seulement une fois la pivot méritée ; `repondreRelances` fusionne avec les entrées du surlignage | E2, E5 | fait : 20 surlignages contre la table du § 7.3 (test) ; Banquet séance 3 (forme `fenetre`) jouée par CDP : un faux → « Ce n'est pas là », la bonne → « C'est la phrase » ; deux faux sur la relance de thèse → pivot révélée et case ouverte ; réponses + surlignages + verdicts + essais en base ; réécriture ouverte ; les trois formes rendues aux trois tailles (captures `e6-s3-{montre,fenetre,demi_section}-{1280,768,375}`). ⚠️ À 375 px, une fenêtre de 400 mots fait ~1 200 px de haut : c'est le prix du D5 (deux fenêtres par séance au plus). Arbitrages : la demi-section se borne à la phrase, pas au paragraphe ; les alternatives de pivot sont toutes recevables au barème mais seule la première est révélée |
| **E7** ✅ code 03/09, SQL bac à sable ☑ 03/09, prod ☐, recette bac à sable 03/09 | `utils/aletheia/retour-vf.ts` (pur, 6 tests) : synthèse numérotée `y{sem}-{n}` par LE découpeur, bloc `{bloc_passages_vf}` (passages de la semaine + amont + synthèse numérotée, trois tâches ajoutées à l'appel VF), lecture tolérante par identifiants connus (`lireNuances` — une seule priorité 1 qui désigne un passage —, `lirePaires`, `lireCouverture` — non jugée = présente), `comparerSynthese` (repérés / manqués / « tu l'avais »), `optionsAmont` (la bonne + 3 autres, ordre du livre, déterministe) ; `retour-vf-serveur.ts` (`preparerRetourFinal`) ; colonnes `comparaison_synthese` et `retour_vf_agi` (`aletheia_etayage_l7.sql`) ; actions `verifierSurlignageNuance` / `choisirPassageAmont` / `comparerSyntheseAction` (jugées côté serveur) ; composant `RetourFinalAgi` (nuance prioritaire : extrait à gauche, texte à droite, pivot surlignée, UNE flèche ≥ 1024 px, couleur partagée en dessous ; à C+ surlignage d'abord, pivot au juste ou au 2ᵉ échec ; autres nuances repliées ; paires amont en deux extraits, choix parmi des libellés à C+ ; synthèse à surligner puis comparée) branché sur les tuiles séquentielles de la validation de lecture | E5, E6 | fait : Banquet séance 3 (forme `fenetre`) — l'appel VF a rendu 4 nuances (prioritaire → `k3-2`, « precise », note 28 mots), 3 paires, couverture 9 phrases (4 absentes, 3 partielles) ; recette CDP : faux → « Ce n'est pas là », bonne → « C'est la phrase » + flèche + verdict ; un choix amont juste et deux faux (paire révélée dans les deux cas) ; 3 manques sur 4 repérés + « celle-ci tu l'avais déjà » ; tout en base. Captures 1280 / 375 des trois gestes. Arbitrages : la pivot vient de la FICHE, jamais du modèle ; le modèle rend `passage: null` quand rien ne tranche (2 nuances sur 4 ici : la nuance « c'est de la semaine 2 » n'a pas de passage — juste) ; une paire fausse révèle quand même le passage (« Ce n'était pas celui-là : voici… ») ; la clôture ne dépend pas des gestes |
| **E8** ✅ code 03/09, SQL bac à sable ☑ 03/09, prod ☐, recette bac à sable 03/09 | `utils/aletheia/integrite.ts` (pur, 6 tests) : `signalRendu` (porte ouverte : strike seulement si les TROIS emplacements sont sans matière ou sur un aveu de NON-LECTURE ; porte fermée : la règle d'avant), `texteJeNeSaisPas` (texte stocké, explicite), `questionDeBlocage` (la ligne de blocage devient une question du champ 4), `propositionsChamp1` (thèse en registre élève + 2 distracteurs, mélange déterministe par élève et séance) ; `FormulaireV1` : lien « Je ne sais pas » sous les deux premières questions, ligne de blocage exigée, trois propositions à choisir + « pourquoi » (emplacement 1), phrase recopiée (emplacement 2), « Finalement, je réponds moi-même » ; `soumettreV1` compose le texte côté serveur ; fiche : `these_eleve` + `distracteurs` générés porte ouverte par `{bloc_propositions}` du prompt de référence (identité conservée), amendables dans l'éditeur de fiche ; `scriptorium_unites.liseuse_max` (`aletheia_etayage_l8.sql`) plafonne la forme dans `forme-serveur.ts`, sélecteur dans l'éditeur du livre ; mode C (§ 8.5) : `exposition-serveur.ts` (`exposeesPourEleve` sans cookie, `seanceExposeePrecedente`) — le rappel prend la fiche de la séance EXPOSÉE précédente, l'amont des paires ne prend que les séances exposées | E3, E5 | fait : les 4 cas réels de la prod mesurés le 03/09 (« Je sais pas sur quoi commenter » 30 car, « Je sais pas » 11 car, « Je ne sais pas avec quoi être en accord ou désaccord », thèse « L'auteur qualifie Dionysos » 26 car) passent sans strike (test) ; Poétique séance 1 jouée par CDP avec « je ne sais pas » aux deux emplacements : distracteurs générés (3 semaines, plausibles — « selon le mètre », « reproduire fidèlement »), 0 strike, `FEEDBACK1_READY`, forme `montre`, diagnostic E/D, deux relances qui partent du choix de l'élève et de sa phrase recopiée, les deux lignes de blocage répondues comme questions. Captures 1280 / 375. Arbitrages : le garde-fou Quazian « préfixe 6 + distance ≤ 2 » (§ 8.3) n'est PAS retenu — décidé en E5 (sophiste/sophisme fusionnaient), la déduplication reste par racine ; la tournante n'a pas de « je ne sais pas » (déjà légitime) ; un « je ne sais pas » aux deux emplacements exige une réponse à la tournante ; l'aveu de non-lecture ne vaut un strike que dans un rendu court (≤ 240 caractères), comme les aveux d'avant |
| **E9** ✅ **ALLUMÉ le 04/09** : SQL prod ☑, fusion poussée (`449d76e`), livres préparés par script (découpe, fiches avec propositions, 138 passages), porte OUVERTE par Louis, carte d'architecture régénérée en phrases — reste le rejeu des mesures après quatre séances | `scripts/recette/aletheia-mesures.mjs --base prod\|sandbox [--depuis date] [--json f]` : les cinq mesures du § 0 + les compteurs de l'étayage (formes, rappels jugés, relances avec passage, réponses, surlignages, nuance, choix amont, synthèse comparée, « je ne sais pas »), tolérant aux colonnes absentes ; interrupteur `PorteEtayage` dans Paramètres de Scriptorium (colonne `aletheia_etayage_actif`, patron de la copie annotée) ; **baseline prod prise le 03/09** (§ 13.5) | tout | fait pour la préparation : baseline prod = thèse identique 19/38, ajouts non ancrés 33/111, 17 min / 5 min, retour final 912 mots (max 1 206), citations 3/3 (la mesure d'E0 était fausse — spec amendé § 0) ; bac à sable (recette) : 4 formes servies, 2 rappels jugés, 6 réponses aux relances, 2 surlignages, 1 nuance, 3 choix amont, 1 synthèse comparée, 1 « je ne sais pas ». **Procédure d'allumage** (Louis) : 1. ✅ SQL prod dans l'ordre `l1 → l2 → l3 → l5 → l7 → l8 → l9` (joué le 04/09, répétition à blanc d'abord, `SUIVI_SQL.md`) ; 2. ✅ merge de `feat/aletheia-etayage` dans `main` + push (04/09, `449d76e`) ; 3. par livre : découpe (à la re-découpe ou à la création, sinon `aletheia-decoupage-e1.mjs --genere`), fiche régénérée (propositions du « je ne sais pas ») puis passages clés générés et relus dans la vue Livre ; 4. Paramètres de Scriptorium → « Ouvrir » ; 5. après quatre séances : `aletheia-mesures.mjs --base prod --depuis <date d'allumage>` contre le § 13.5. ⚠️ Arbitrage : la porte est GLOBALE (`scriptorium_params`), pas par classe — la « classe pilote » est celle qui a un livre Aletheia à l'allumage ; une porte par classe demanderait de passer la classe à tous les lecteurs de la porte (jobs `after()` compris), ce que le chantier n'a pas fait |

**À reprendre APRÈS E9 (Louis, 03/09, vu les captures d'E6)** — l'écran de la liseuse : éviter l'**effet
d'empilement** (retour, relances, fenêtres, cases les uns sous les autres) ; **séparer les moments** du
retour (rappel · relances · réponses · réécriture) ; donner à la partie droite l'**effet d'une page** de
livre. **Élargi le 04/09 à TOUS les écrans élève de cette partie** (élégant · lisible ordinateur et
téléphone · un écran = une tâche · compréhensible sans explication) — **avant tout passage en
production**. Brief pour Design : `design_brief_aletheia_etayage/BRIEF_Design_Aletheia_etayage.md`.
✅ **FAITE le 04/09** (découpe et rendu charte validés par Louis en artefacts, puis trois commits
`6b4ac90` · `c5bec35` · `8b8bceb`) : `components/aletheia/FilEcrans.tsx` (compteur, titre, barre du bas
FIXE à bascule + un seul bouton, Précédent qui garde l'état), `PageDuLivre` (l'extrait comme une page) ;
porte ouverte, `FormulaireV1Fil` (rappel, une question par écran, « je ne sais pas » en écrans),
`ReponsesRelancesFil` (rappel jugé, relance → surligner → répondre avec bascule texte / réponse,
tournante, réponses, vocabulaire), `FormulaireVfFil` (un champ par écran, la relance qui le concerne en
regard), `RetourFinalAgi` réécrit (nuance en deux écrans, un lien par écran, synthèse, clôture par la
barre de la partie — `ValidationLecture` gagne un contexte et des tuiles à barre intégrée, additif),
`RevueDone` avec « ce que tu as trouvé toi-même » ; liens amont en phrase (`phraseDuLien` + prompt) ;
**présentation** du module (4 écrans, une fois par version, « revoir ») ; `aletheia_travaux.ouvert_at`
+ `aletheia_eleve_etat` (`aletheia_etayage_l9.sql`) ; **temps réel d'une séance** (médiane ouverture →
clôture, ≥ 3 séances) montré à l'élève et dans l'en-tête prof du livre. Porte fermée : les formulaires
d'avant (`*Classique`), inchangés. Sur ordinateur les écrans qui vont par deux tiennent en deux colonnes,
la barre n'est plus fixe.

Chaque lot : `tsc`, tests, **puis** rendu avec données réelles sur les trois tailles d'écran.
Aucun lot ne se ferme sur « ça compile ».

---

## 11. Ce que le spec ne fait pas

- Pas de vérification d'un texte contre le livre papier de l'élève (D2).
- Pas de visionneuse du livre.
- Pas de correction du biais d'axes du diagnostic (accepté ; D10 le contourne).
- Pas de production de la version modernisée.
- Pas de retrait d'étayage sur les champs eux-mêmes (demander la structure en mouvements à
  un A confirmé) : noté dans `IDEES_post_rentree.md`, pour après E9.
- Pas de rappel espacé au-delà de la séance précédente (rappel de N−3, N−6) : même
  destination.

## 12. Réponses de Louis aux questions ouvertes (03/09) — actées

| # | Décision |
|---|---|
| D12 | Question tournante : **cycle fixe** par livre. |
| D13 | Séance 1 : forme **`montre` pour tout le monde**, aucun diagnostic encore. |
| D14 | Surlignage : **au second échec, la pivot est montrée** (§ 7.3). |
| D15 | Distracteurs du « je ne sais pas » : **générés avec la fiche, amendables** par le prof (§ 8.1). |
| **D17** | **Hystérésis (amende D10)** : plus d'aide en une séance **seulement sur un E** ; tout autre changement de forme exige deux séances d'accord. *(Louis, 03/09 : « un D peut être un D mal lu ».)* Rejeu des 38 travaux : 15 montre / 23 fenêtre, **6 changements** (contre 10 en asymétrie totale). `OptionsForme.asymetrie = 'sur_E'` par défaut. |
| D16 | Prompts par gabarit : **un tronc commun + un bloc par gabarit**. `aletheia_params` porte le tronc (V1, VF, diag inventaire, diag niveau) et un jsonb `blocs_gabarits` à quatre entrées ; l'injection se fait sur un placeholder `{bloc_gabarit}` du tronc. |

## 13. Résultats du lot E0 (03/09) — mesures sur le livre de prod

Livre : *NdT*, 29 semaines, texte extrait des PDF (`scriptorium_documents.texte_extrait`).
Découpeur **prototype** Python, scratchpad seulement (le découpeur réel sera écrit une fois, en
TS, au lot E1 ; les chiffres ci-dessous le calibrent). Génération de passages clés sur trois
semaines (2 : courte, 18 : médiane, 23 : longue) avec le modèle de l'app (`claude-sonnet-4-6`,
`temperature: 0`), phrases numérotées, sortie par identifiants, vérification par le code.

### 13.1 Phrases (§ 3.3)

| Mesure | Valeur |
|---|---|
| Phrases sur le livre | 1 056 |
| Phrases par semaine | médiane 34, min 11, max 61 |
| Mots par phrase | **médiane 43**, p90 88, **max 278** |
| « Phrases » de moins de 5 mots | 19 (1,8 %) — toutes réelles (« Comment ? », « Hélas ! »), aucune scorie |
| Caractères par ligne PDF | médiane 74 |
| **Dix lignes** | ≈ 740 caractères ≈ **119 mots ≈ 2,8 phrases** |
| Appels de note collés au texte (« sa raison 5. ») | **340** sur le livre, jusqu'à 27 par semaine *(E1, avec les cas devant un guillemet ou une fin de ligne : **484**, échantillon de 40 relus sans faux positif)* |
| Numéro de section en tête de semaine (« 19\nOn ne saurait… ») | **28 semaines sur 29** *(E0 n'en avait compté qu'une : sa mesure exigeait une espace, le PDF met un retour à la ligne)* |
| Césures « mot-\nmot » | 33 |
| Paragraphes détectables par ligne vide | **0** (1 bloc par semaine) |
| Paragraphes par heuristique de ligne courte | médiane 4, de 1 à 8 ; 382 mots médians, **max 2 226** → inutilisable |

### 13.2 Passages clés (§ 4.4)

| Semaine | Phrases | Temps | Tokens in / out | Passages | Rejetés par le code |
|---|---|---|---|---|---|
| 2 | 25 | 4,9 s | 2 314 / 321 | 4 | 0 |
| 18 | 34 | 5,9 s | 4 530 / 339 | 4 | 1 (pivot non contiguë : deux phrases séparées données comme une seule pivot) |
| 23 | 61 | 5,5 s | 7 509 / 329 | 4 | 0 |

Sur les 12 passages : **de 2 à 10 phrases** (40 à 397 mots) ; pivots de **13 à 128 mots**
(médiane ≈ 57), 4 pivots à deux phrases ; JSON valide trois fois sur trois ; deux passages sur
douze donnent deux alternatives, toutes deux justes. Les pivots choisies sont les bonnes
phrases (l'« œil » de Socrate, la « barque » du dialogue platonicien, les trois formules
socratiques, le rêve de Socrate). Un libellé sur douze donne la réponse. Les appels de note
apparaissent **dans les pivots** (« aliéniste 3 », « idées modernes 6 », « du roman 13 ») et un
numéro de section ouvre la semaine 23 (« 19 On ne saurait… »).

### 13.3 Ce que cela change (reporté dans le spec)

1. **D5 amendé** : le passage montré est la pivot entière plus une phrase avant et une après,
   et jamais moins de dix lignes ; une pivot seule peut déjà dépasser dix lignes.
2. **Barème § 7.3 en phrases**, pas en mots.
3. **Paragraphes optionnels** (§ 3.2) : toutes les fenêtres se bornent à la phrase ; la
   demi-section de la forme A = la moitié des phrases de la section contenant la pivot.
4. **Nettoyage à l'extraction** (§ 3.2) : appels de note, numéro de section en tête, césures,
   avant découpe, une fois, versionné.
5. **Un appel par semaine en parallèle** pour les passages (§ 4.2), distinct du lot de fiche ;
   temps et coût négligeables (~330 tokens de sortie, 5 à 6 s).
6. **Deux consignes de prompt** (§ 4.2) : alternatives plutôt que pivot à trou ; libellé = le
   lieu, pas le contenu.
7. La fenêtre de 400 mots contient tous les passages générés (max 397 mots) : la fenêtre est
   le passage étendu à 400 mots, la pivot à une position non prévisible.
8. Demi-section à A : section médiane ≈ 1 700 mots, max ≈ 3 200 → demi-section ≈ 850 mots,
   max ≈ 1 600. Tenable.

### 13.4 Rejeu à blanc d'E2 : la forme que le code aurait servie (38 séances, 3 élèves)

`decider()` rejoué sur les diagnostics réels de prod (axe arguments, VF d'abord), forme de
départ « montre ». Deux variantes d'hystérésis :

| Variante | montre | fenêtre | demi-section | changements de forme sur 38 séances |
|---|---|---|---|---|
| **Asymétrique (D10)** : plus d'aide en une séance, moins en deux | 23 | 15 | 0 | **10** |
| Symétrique : deux séances dans les deux sens | 15 | 23 | 0 | **6** |

Aucun A consécutif chez ces trois élèves : la demi-section n'est jamais servie. L'élève 3
(19 séances, niveaux VF qui alternent D et C : `D C D C C D C D C C D D C C C D D C C`)
est le cas qui départage : en asymétrique il change de forme **6 fois**, en symétrique
**3 fois**, et il reçoit « montre » 13 séances sur 19 contre 7. Or le biais mesuré du
diagnostic sur cet axe est **−1 (sévère)** : une part de ces D sont des C. La règle
asymétrique réagit donc au bruit, dans le sens sûr mais au prix d'un va-et-vient.
**Tranché par Louis (D17)** : la variante intermédiaire, « plus d'aide en une séance seulement
sur un **E** ». Sur ces 38 séances elle donne le même résultat que le symétrique (aucun E
n'y suit deux C) : 15 montre / 23 fenêtre, 6 changements. Les trois variantes restent dans
le code (`OptionsForme.asymetrie`) et dans le rejeu : `scratchpad/e2_rejeu_prod.mjs
[--toujours | --jamais]`.

Scripts : `scratchpad/e0_phrases.py`, `e0_paras.py`, `e0_passages.mjs`, résultats
`e0_passages_resultats.json` (session du 03/09 ; à recopier dans `aletheia_calibration/` si
on veut les rejouer).

### 13.5 Baseline d'E9 — prod, 03/09 (avant allumage), par `scripts/recette/aletheia-mesures.mjs`

38 travaux, 3 élèves, 1 livre. Thèse identique V1 → VF **19 / 38** · ajouts VF non ancrés **33 / 111** ·
durée V1 → clôture **17 min** (min 5) · retour final **912 mots** (max 1 206, synthèse 194) · retour V1
526 mots (max 954, 2 relances) · citations entre guillemets hors texte de l'élève **3**, retrouvées
verbatim **3** (la mesure d'E0 comptait les apostrophes, § 0). Diagnostic : 38, args V1→VF 15 progrès /
23 stables / 0 recul ; args V1 = E 3 · D 19 · C 14 · B 2. À rejouer avec `--depuis <date d'allumage>`
après quatre séances ; le bac à sable de recette (49 travaux, 6 élèves, 5 livres) sert de témoin de
forme : 4 formes servies, 2 rappels jugés, 4 relances avec passage sur 103, 6 réponses, 2 surlignages,
1 nuance surlignée, 3 choix amont (1 juste), 1 synthèse comparée (3 manques repérés, 1 échappé), 1 « je ne sais pas ».

---

## 14. Campagne de smoke du 04/09 (bac à sable, branche `feat/aletheia-etayage`, Chrome sans fenêtre)

| Parcours | Résultat |
|---|---|
| **Porte FERMÉE** — Poétique séance 2, V1 complète | formulaire d'avant (« Idée principale », « Arguments », « Ton accord », pas de « Je ne sais pas », pas de rappel) ; en base `forme`, `tournante_cle`, `champ_fixe`, `rappel` NULL ; `retour_v1` sans `relances_detail` ni `rappel` ; retour affiché. Non-régression tenue |
| **Poétique séance 1** (analytique, « je ne sais pas » aux deux emplacements) | 0 strike, forme `montre`, 2 relances qui partent du choix ; réponses aux relances → réécriture → retour final (pas de nuance pointée : ce livre n'a PAS de passages clés — dégradé propre, synthèse comparée 3/4) → clôture, `DONE` + `retour_vf_lu_at` |
| **Par-delà séance 1** (aphoristique, forme `montre`) | V1 5 champs, 2 relances avec passage, réponses, VF, retour final : **aucune `nuances_detail` malgré 4 passages** (1 cas sur 3 — lecture rendue tolérante aux variantes de clé + journal du brut, à surveiller), synthèse comparée 2/3, clôture |
| **Par-delà séance 2** (forme `montre`, avec amont) | rappel jugé **juste**, tournante `fil` (cycle), 2 relances avec passage, VF, retour final : nuance prioritaire `k2-2` avec pivot + flèche, **3 paires amont révélées** (forme montre), synthèse comparée 3/4, clôture. ⚠️ retour V1 à **342 mots** pour 300 (2 relances) |
| **Banquet séance 3** (dialogué, forme `fenetre`, E6-E7) | surlignage des relances (faux → bonne ; deux faux → pivot), VF, retour final agi (surlignage de la nuance, 3 choix amont, synthèse), clôture forcée en base pour la recette |

**Écrans prof (04/09, compte de Louis, volet du navigateur puis Chrome sans fenêtre par lien
magique — `scratchpad/smoke_prof.mjs`)** : liste des livres ; vue Livre de Par-delà (fiche en
lecture avec passages et, depuis `53a0207`, les trois propositions du « je ne sais pas ») ; éditeur
de fiche : distracteur amendé et enregistré (fiche « amendée à la main », valeur en base, 4 passages
intacts) ; éditeur du livre : « Liseuse intégrée » → fenêtre, Enregistrer ⇒ `liseuse_max = fenetre`
en base, puis retour au défaut ⇒ NULL ; Paramètres : l'interrupteur ferme (base `false`, texte
« fermé ») et rouvre (base `true`). ⚠️ Un volet de navigateur CACHÉ ne s'hydrate jamais : les boutons
React y restent inertes, seules les formulaires à action serveur répondraient — d'où le Chrome sans
fenêtre.

Non couverts : le mode C (aucun parcours en extrait au bac à sable), la forme `demi_section` en
séance réelle (rendue seulement en capture), les cartes Quazian sur les nouveaux livres.

**Refonte des écrans (04/09, après la campagne)** — recette CDP aux trois tailles : Poétique s3 en fil
(7 écrans avec le chemin « je ne sais pas », soumission, retour) ; Par-delà s2 remis au retour à la forme
`fenetre` : retour en fil (10 écrans, faux → bonne phrase, bascule, réponses en base), réécriture en fil
(3 écrans, bascule), retour final partie par partie (nuance surlignée + flèche, 3 liens un par écran,
synthèse comparée, clôture → DONE), revue avec les gestes ; Poétique s2 libérée : présentation 4 écrans,
`presentation_vue_at` et `ouvert_at` posés, lien « revoir » ; en-tête prof : « temps d'une séance : pas
encore mesuré ». Non couvert : la barre fixe n'est jugée qu'en capture pleine page (sticky réel à voir sur
un téléphone), la forme `montre` en fil (les séances de recette étaient closes), `demi_section`.

