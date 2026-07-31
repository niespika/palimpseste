# SPEC C11c — Écran de détail des coûts API (`/prof/couts`)

> **Statut : « si crédits », comme C9** — décision PO du 25/07, spec gelée avant le gel du
> 29/07. Se tire si un cycle finit en avance ; sinon glisse en septembre **sans perte** :
> l'attribution (C11a-bis) journalise dès maintenant, l'écran ne fait que lire.
> **Prérequis :** C11a-bis mergé + `c11a_api_couts.sql` (v2) joué en sandbox.
> **Estimation :** ~1 j-éq · ⚙️ standard · aucune dépendance nouvelle (`recharts` est déjà
> dans `package.json`).
> **Prompt de session : à écrire au moment du tirage** (le code aura bougé — C7/C8
> notamment), pas maintenant. Cette spec fixe le QUOI ; le prompt fixera le comment.
>
> Ligne à ajouter au §C11 du plan (au check-in) :
> `**C11c :** écran détail des coûts (/prof/couts — module · élève×module · par jour) ·
> « si crédits » sinon post-rentrée · spec SPEC_C11c_ecran_couts.md · prérequis C11a-bis + SQL.`

## Pourquoi

La tuile donne le total du mois et le détail par module. Ce qui manque : l'historique
(naviguer dans le temps), la ventilation **par élève**, et le rythme **par jour** — savoir
ce que coûte chaque module par élève, et voir qui travaille quand. Décision PO du 25/07
(demande d'origine du chantier).

## La page

Nouvelle route `app/prof/couts/` (prof-only via le layout existant), lectures serveur en
admin — mêmes conventions que la tuile. **La tuile ne change pas**, sauf un ajout : sa
ligne devient un lien vers la page.

**Période :** mois par défaut (le courant), navigation ← mois →. Bornes calculées dans le
fuseau de l'école (`lireFuseau`/`jourDansFuseau`, comme la tuile — même fenêtre, mêmes
chiffres).

**Sources — la règle anti-double-comptage de C11a, réaffirmée :** Fragments et Codex par
les colonnes `cout_api` des tables hôtes ; Aletheia, Quazian, Scriptorium par le journal
`api_couts` ; ne **jamais** lire les colonnes `cout` de `scriptorium_messages` /
`scriptorium_rag_syntheses`. Chaque lecture vérifie `{ error }` ; une source muette →
total partiel **annoncé** (pastille + mention, pattern de la tuile). La page ne lève
jamais.

## Vue 1 — par module

Tableau : module · coût · nb d'appels · coût moyen/appel · part attribuée à un élève (%).
Le total doit **réconcilier avec la tuile** au dollar près sur le même mois (c'est le test
d'honnêteté de la page).

## Vue 2 — élève × module

Lignes = élèves (nom via `profiles`, toutes classes confondues, filtre par classe en
tête) ; colonnes = les 5 modules + total ; tri par total décroissant. En bas, une ligne
séparée **« Coûts de classe / non attribués »** (Quazian entier — structurel, génération
par contenu/classe —, synthèses hebdo, capstone et fiche de référence Aletheia) pour que
la somme du tableau égale le total de la vue 1 — rien de maquillé.

Attribution côté tables hôtes : `codex_travaux.eleve_id` (constaté). Fragments : à
constater dans les tables d'analyses (jointure dépôt→élève probable) ; si une part
Fragments n'est pas attribuable, elle rejoint la ligne « non attribués » **en le disant**.

## Vue 3 — activité par jour

Un élève sélectionné (depuis la vue 2 ou un sélecteur) → barres empilées par module, par
jour, sur la période (`recharts`, jetons de `globals.css`, jamais de hex en dur). Bascule
de métrique **$ / nb d'appels** — les appels lisent mieux « qui bosse quand » (le coût
varie avec la longueur des textes et le cache), le $ répond au budget. Rappel affiché en
une ligne discrète : les coûts de classe n'apparaissent pas ici (par construction).

Extension notée, pas en v1 : heatmap classe entière (élèves × jours).

## Fait quand · coupe

**Fait quand :** les 3 vues sur données réelles ; total v1 = tuile ; `{ error }` partout ;
lisible laptop (prof d'abord — mobile : tableaux scrollables, rien de cassé à 375 px).
**Coupe :** la vue 3 (graphe) — les deux tableaux seuls font déjà l'essentiel.
**Hors périmètre :** tout SQL (le schéma est complet après C11a-bis) ; alertes/seuils de
budget ; export CSV ; l'analyse orale Fragments (angle mort assumé — item IDEES).
