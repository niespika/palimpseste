# Module **Aletheia** — Spécification (révisée)

> *Aletheia* (ἀλήθεια, « dévoilement ») : module de lecture autonome et formative pour l'approche d'un texte difficile. Tout le dispositif tend vers le dévoilement progressif de l'architecture cachée du texte.
>
> *Cette version remplace la v1. Elle intègre l'état réel de Scriptorium, Codex et Fragments.*

---

## 1. Vision

Permettre à un élève de faire, **en autonomie** et sur plusieurs semaines, une première lecture sérieuse d'un texte philosophique exigeant (cas pilote : *La Naissance de la tragédie*), via une boucle hebdomadaire de résumé → relance socratique → réécriture → synthèse modèle + dévoilement de l'architecture, puis une carte d'ensemble finale.

**Principes directeurs**

- **Formatif, sans note.** Ni lettre (E–A), ni note /20.
- **Aucun anti-triche.** Travail autonome assumé ; on optimise uniquement pour l'apprentissage.
- **Tuteur généreux mais exigeant.** L'IA accompagne ; elle ne fait pas le travail à la place de l'élève.
- **Ancrage strict.** L'IA ne mobilise que les documents de l'Unité Livre déposés dans Scriptorium. Aucune littérature secondaire, aucun contexte externe.
- **Dévoilement progressif.** L'architecture du texte se révèle au fil des semaines, jamais d'un coup.
- **Lisibilité = objectif premier des retours.** Une synthèse trop longue n'est pas lue : elle est donc plafonnée et sa lecture est validée (cf. §5).

---

## 2. Modifications à Scriptorium (prérequis)

> ⚠️ Ce paragraphe **modifie le module Scriptorium existant**.

**État actuel.** Un bouton **« Ajouter du contenu »** (3 champs : unité/semaine, Nom, Classe en multi-assignation) ; 2 onglets (**classes**, **unités**) affichant l'arborescence dans les deux sens.

**Changement : deux boutons.**

1. **« Ajouter des unités »** — reprend **exactement** le comportement actuel (les 3 champs) et **remplace** « Ajouter du contenu ». Rien d'autre ne change pour les unités.
2. **« Ajouter un livre »** (nouveau type de contenu) — champs :
   - **Titre général** du livre ;
   - **Nombre de semaines** que dure la lecture ;
   - **Date de début** de la lecture ;
   - **Classe(s)** à laquelle/auxquelles le livre est rattaché ;
   - puis, **pour chaque semaine** : **1 PDF**, **1 titre**, et la **référence des chapitres** (ex. « Chap. 1-4 ») — cette référence sert au planning de l'élève, qui lit son propre exemplaire (cf. §4).

**Affichage.** Une fois ajouté, le livre apparaît comme **tuile sous l'onglet « Unité »** (et dans l'arborescence de sa/ses classe(s)), de façon cohérente avec l'existant.

---

## 3. Modèle de données

> *À réconcilier avec `ARCHITECTURE.md` et `SPEC_Scriptorium.md`* (même convention que Codex/Quazian). On n'introduit **pas** de modèle de contenu parallèle.

- **Le contenu « Livre » vit dans le modèle Scriptorium**, comme une **unité multi-semaines** (chaque semaine porte : `pdf_ref`, `titre`, `chapitres`). Réutiliser/étendre le modèle d'unité existant plutôt que dupliquer.
- **Aletheia ne possède que les tables du travail élève** (préfixe `aletheia_`, analogue à `synthese_travaux`) :

| Table | Rôle | Champs clés |
|---|---|---|
| `aletheia_travaux` | Travail d'un élève pour une semaine | `id`, `scriptorium_livre_id`, `semaine_index`, `eleve_id`, `statut`, `resume_initial`, `questions` (string[]), `retour_1` (json), `resume_vf`, `retour_2` (json), `retour_2_lu_at` (validation de lecture), `devoilement` (json — extrait persisté du retour 2, pour mémoire + capstone), `updated_at` |
| `aletheia_capstone` | Carte finale par élève | `id`, `scriptorium_livre_id`, `eleve_id`, `contenu` (json), `created_at` |

```
enum AletheiaStatut {
  DRAFT             // rien soumis
  V1_SUBMITTED      // résumé + questions soumis → attente retour 1
  FEEDBACK1_READY   // retour 1 (socratique) disponible
  VF_SUBMITTED      // vf soumise → attente retour 2
  FEEDBACK2_READY   // retour 2 disponible, en attente de validation de lecture
  DONE              // élève a validé avoir lu le retour 2 → semaine close
}
```

---

## 4. Accès et boucle hebdomadaire (côté élève)

**Accès au texte.** L'élève **n'a pas accès au PDF** ; il doit avoir **acheté le livre** et le lit dans son propre exemplaire. En application : il voit uniquement le **planning** (semaines + titres + chapitres) et son **espace d'écriture**. **Pas de visionneuse de lecture in-app.** Les PDF de Scriptorium servent **uniquement d'ancrage IA** (§6), jamais d'affichage élève.

**Boucle, par semaine :**

1. **Lecture** — l'élève consulte le planning (semaine, titre, chapitres à lire) et lit ces chapitres dans son exemplaire.
2. **Résumé + questions** — il rédige un résumé (1-2 §) et pose 2-3 questions pour approfondir → *soumet* → `V1_SUBMITTED`.
3. **Retour IA n°1 (socratique)** → `FEEDBACK1_READY`.
4. **Réécriture** — l'élève produit sa **vf** → *soumet* → `VF_SUBMITTED`.
   *Gate souple :* le retour n°2 ne se débloque qu'après soumission de la vf.
5. **Retour IA n°2 (reconstruction + architecture)** → `FEEDBACK2_READY`.
6. **Validation de lecture** — l'élève doit **valider avoir lu** le retour n°2. **Tant qu'il ne l'a pas validé, la semaine ne se clôt pas** (`retour_2_lu_at` renseigné → `DONE`). Mécanisme repris des Fragments.

> Pacing : `date_de_début` + la semaine donnent un rythme indicatif. Option (off par défaut) : débloquer la semaine N+1 à la clôture de N.

---

## 5. Prompts

> Templates à stocker dans `PromptConfig`, injection de variables `{...}`. **Versions v1 — à calibrer** sur exemples réels (point critique pour les retours 2 et capstone). Modèle configurable par prompt via `AppConfig`.

### 5.1 `ALETHEIA_FEEDBACK_1` — Retour socratique

**Variables :** `{texte_unite}` (texte des PDF de la semaine), `{resume_eleve}`, `{questions_eleve}`, `{syntheses_precedentes}`.

**Invariants :**

- **Tu ne corriges JAMAIS directement** une erreur ou une approximation du résumé. Tu **poses une question** qui amène l'élève à la repérer lui-même, en le renvoyant à un passage précis (chapitre/section).
- **En revanche, tu RÉPONDS** clairement aux questions que l'élève a posées, ancrées dans le texte. *(On questionne ses erreurs, on répond à ses questions.)*
- *(Option togglable)* Si une question de l'élève est purement factuelle, réponds-y puis propose une reformulation qui creuserait davantage.
- **Adaptativité légère, sans plafond** (logique Codex) : résumé faible → effort sur la compréhension de base ; résumé solide → on pousse plus loin. Toujours vers la **marche suivante**, jamais « ton niveau, c'est X ».
- **Ancrage strict** à `{texte_unite}` : aucune référence à la suite du livre, à d'autres œuvres, à la littérature critique. Ramène l'élève au texte s'il s'en écarte.
- **Citations systématiques** (chapitre/section).
- **Tu ne réécris pas le résumé** (rôle du retour final).
- **Ton** bienveillant, encourageant, exigeant. **3-5 relances maximum.**

**Sortie (JSON) :**
```json
{
  "questions_pour_avancer": ["..."],
  "reponses_a_tes_questions": ["..."],
  "remarque_questions": "..."        // optionnel
}
```

### 5.2 `ALETHEIA_FEEDBACK_2` — Reconstruction + dévoilement de l'architecture

**Variables :** `{livre_entier}`, `{resume_initial_eleve}`, `{resume_vf_eleve}`, `{syntheses_precedentes}`, `{architectures_precedentes}`, `{semaine_courante_N}`, `{total_semaines}`.

**Invariants :**

- **⛔ Longueur : synthèse modèle ≤ ~200 mots.** Priorité absolue à la lisibilité — l'élève doit la lire **en entier**. Pas de remplissage, pas de redite.
- **Synthèse modèle** des chapitres de la semaine, qui **pointe explicitement les nuances et les erreurs** subsistant dans la vf (comparaison vf ↔ texte), sans humilier.
- **Ajouts à la vf** (logique Codex) : si l'élève a **ajouté du contenu nouveau** dans sa vf (au-delà de corriger), **vérifie ces ajouts contre `{livre_entier}`** et signale toute affirmation **non ancrée ou erronée** introduite à la réécriture. Ne jamais laisser passer un ajout faux.
- **Adaptativité légère, sans plafond** ; pointe la marche suivante.
- **Dévoilement de l'architecture, divulgation progressive :**
  - **Amont** (chapitres lus, semaines ≤ N) : **entièrement explicite** — « ce point reprend / prolonge X vu en semaine k ».
  - **Aval** (chapitres non lus, > N) : **jalons seulement**, sans contenu — « ceci prépare un argument à venir ; tu verras pourquoi plus loin ».
  - ⚠️ **Tu reçois le livre entier en contexte, mais tu ne divulgues JAMAIS le contenu au-delà de la semaine N.** Le livre entier sert ta compréhension, pas ta sortie.
- **Continuité** : référence la trajectoire de l'élève via `{syntheses_precedentes}`.
- **Ancrage strict** `{livre_entier}` ; **citations** (chapitre/section).

**Sortie (JSON) :**
```json
{
  "synthese_modele": "...",              // ≤ ~200 mots
  "nuances_et_erreurs": ["..."],
  "ajouts_a_verifier": ["..."],          // si l'élève a ajouté du contenu non ancré
  "architecture_amont": ["..."],         // liens explicites, semaines ≤ N
  "architecture_aval_jalons": ["..."]    // jalons seulement, sans contenu
}
```
> `architecture_amont` + `architecture_aval_jalons` sont copiés dans `aletheia_travaux.devoilement` (mémoire + matière du capstone).

### 5.3 `ALETHEIA_CAPSTONE` — Carte d'architecture complète

**Variables :** `{livre_entier}`, `{tous_les_devoilements}`, `{toutes_syntheses_eleve}`.

**Invariants :**

- **⛔ Longueur : ≤ ~300 mots, tient sur un écran.** Facile à lire avant tout — sinon l'objectif est manqué.
- L'élève a **tout lu** : **tous les liens aval peuvent être pleinement révélés**. La carte donne la vue d'ensemble du mouvement argumentatif + le fil conducteur du texte.
- **Ancrage strict** au texte (pas de commentaire externe) ; **citations**.
- Réutilise le **vocabulaire** que l'élève s'est approprié (`{toutes_syntheses_eleve}`).

**Sortie :** structure de carte (chapitres = nœuds, liens argumentatifs = arêtes) + un **court** texte de fil conducteur.

---

## 6. Pipeline d'ancrage (extraction PDF)

- Les chapitres sont des **PDF (ressources Scriptorium)**, **jamais servis à l'élève** — uniquement extraits comme contexte IA.
  - Réutiliser le pipeline d'extraction de Codex/Scriptorium s'il existe ; sinon l'ajouter.
- **Périmètres :**
  - Retour 1 → texte des PDF **de la semaine** uniquement.
  - Retour 2 & Capstone → texte de **toute l'Unité Livre**.
- **Budget de contexte :** *La Naissance de la tragédie* (~150 p.) tient sans difficulté en contexte → injection directe acceptable. **Pour des livres plus longs**, prévoir une étape de récupération (chunking + retrieval) — *hors périmètre du pilote, à noter.*

---

## 7. Capstone

À la clôture de la dernière semaine (toutes en `DONE`), génération d'une **carte de l'architecture du livre** (`aletheia_capstone`) :
- assemblée à partir des `devoilement` hebdomadaires + relecture du livre entier ;
- liens aval enfin pleinement explicités ;
- **courte et lisible** (≤ ~300 mots) ;
- vue dédiée, avec option d'export/impression (Lot 6).

C'est le télos du module : à la fin, toute la structure est dévoilée.

---

## 8. Séquençage des lots

> Chaque lot est livrable et testable indépendamment. À déposer un par un.

**Lot 1 — Scriptorium : type de contenu « Livre »**
Deux boutons (« Ajouter des unités » [= existant] / « Ajouter un livre » [nouveau]). Modèle de contenu Livre (titre général, nb semaines, date de début, classe(s) ; par semaine : PDF + titre + chapitres). Le livre apparaît comme tuile sous « Unité ».

**Lot 2 — Aletheia : structure + planning élève**
Tables `aletheia_` ; machine à états (§4). Vue **planning élève** (semaines + titres + chapitres, lecture seule, **sans PDF**). Espace d'écriture (résumé + questions, puis vf) avec stubs pour les retours IA.

**Lot 3 — Retour 1 socratique + pipeline d'ancrage**
Extraction texte des PDF de la semaine. `PromptConfig: ALETHEIA_FEEDBACK_1`. Appel modèle, affichage structuré. Réinjection des `syntheses_precedentes`.

**Lot 4 — Retour 2 + validation de lecture**
Contexte livre entier + `N`. `PromptConfig: ALETHEIA_FEEDBACK_2` (divulgation progressive, vérification des ajouts, plafond de longueur). **Gate de validation de lecture** (clôture de semaine). Persistance de `devoilement`.

**Lot 5 — Capstone**
`PromptConfig: ALETHEIA_CAPSTONE` (court, lisible). Génération à la clôture des N semaines, vue dédiée.

**Lot 6 (optionnel) — Affinages**
Édition des prompts via console dev ; évaluation légère de la qualité des questions (option retour 1) ; export/impression de la carte ; déblocage séquentiel des semaines.

---

## 9. Décisions actées

- Scriptorium : **deux boutons**, nouveau type **Livre** (PDF + titre + chapitres par semaine), tuile sous « Unité ».
- Élève **sans accès au PDF** (lit son exemplaire) ; planning seul, pas de visionneuse.
- Retour 1 **socratique** (questionne les erreurs, répond aux questions) ; retour 2 **reconstruction + architecture**.
- **Dévoilement progressif** (amont explicite / aval en jalons).
- **Ancrage** : retour 1 sur l'unité de la semaine, retour 2 sur le livre entier ; **aucune** littérature externe.
- **Ajouts à la vf vérifiés** contre le livre (logique Codex).
- **Plafonds de longueur** : retour 2 ≤ ~200 mots, capstone ≤ ~300 mots.
- **Validation de lecture** sur le retour 2, conditionnant la clôture de la semaine (mécanisme Fragments).
- Synthèses **persistées** et réinjectées (continuité).
- **Capstone final** : carte complète, courte et lisible.
