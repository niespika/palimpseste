# LISTE_revue_prof_eleve — tri des notes de Louis (pages 2-7, revue complète du 22/07)

> Chaque item de ta revue est rattaché à un chantier du PLAN_CHANTIERS_RENTREE.md.
> Légende : **[chantier]** = pris en charge là · **[?]** = question à trancher (réponse au prochain
> check-in) · **[post]** = IDEES_post_rentree.md. Cette liste EST la checklist de la passe UI (C10) ;
> les sessions Code de design reçoivent la section concernée, verbatim.
>
> **Le principe directeur qui ressort de ta revue** (et qu'on adopte partout) :
> **un module = 2 ou 3 onglets, mêmes noms côté prof et côté élève quand ça a du sens.**
> Prof — Fragments : Semaine · Suivi · Évaluations (+Paramètres) ; Quazian : Flashcards · Quiz
> (+Paramètres) ; Codex : Exercices · Synthèse (+Paramètres) ; Aletheia : Exercices · Livres
> (+Paramètres) ; Scriptorium : Classes · Parcours · Ressources · Paramètres.
> Élève — Fragments : Écrit · Oral · Essai ; Quazian : Flashcards · Quiz ; Codex : Exercices ·
> Synthèse ; Aletheia : Exercices · Livres ; Scriptorium : Plan de cours · Discussion.

---

## Côté prof

### Tableau de bord — « It's a mess » **[C10b + mini-spec Fable]**
Recentrer sur 4 blocs : **Travaux à préparer** (lignes `a_concevoir` du plan) · **Travaux non remis** ·
**Élèves en difficulté** · **Synthèse RAG de la semaine** (la table L7 existe, il faut la vue).
La mini-spec du contenu se fait avec Fable (10 lignes) ; l'implémentation en standard.

### Pilotage
- Onglet Élèves : **tous les élèves visibles tout le temps**, classes en filtre latéral, contacts affichés. **[C10b]**
- Messagerie prof→élève / prof→classe (jamais élève→élève) : ton encadré « Plus tard ». **[post]**
- Onglet Classes : design avant-clic ; **bouton retour manquant** après clic ; définir ce qu'on voit
  en cliquant une classe (proposition : santé + à faire + accès rapides modules). **[C10b]**
- Calendrier : design léger des onglets. **[C10b]** — **[?] « On peut effacer un semestre ? »**
  → à vérifier en C12 ; si non, petit ajout (suppression gardée par confirmation).

### Intégrité
- Atelier : OK. Historique : rendre les anciens dossiers cliquables. **[C10b]**
- **[?] Paramètre « flashcards gelées » — surprenant.** Vérifier ce que le gel d'intégrité bloque
  vraiment et l'assumer ou le retirer. **[C7]**

### Fragments — « gros design + réorganisation » **[C8 — la réorg devient le cœur du chantier]**
- Onglets cibles : **Semaine** (dépôts + stats + orateur, semaine courante/précédente) ·
  **Suivi** (fusion Thèmes + Vue d'ensemble : vue par classe et par élève — thème, moyenne, taux de
  dépôt ; clic sur une case = progression) · **Évaluations** (Essai | Synthèse en toggle) · **Paramètres**.
- **[?] Bug calendrier/semaine lié aux semestres** → à diagnostiquer en C8 (probable cousin du
  « deux définitions de semaine N » relevé par l'audit).
- **[?] Le toggle par semestre est-il utile ?** → à trancher au check-in (mon avis : garder le scoping
  semestre en dessous, retirer le toggle visible si le calendrier le déduit).

### Scriptorium **[C9 — ressuscité : ta liste re-valide la spec reorg existante]**
- Onglets : **Classes · Parcours · Ressources · Paramètres** = exactement la spec
  `SPEC_scriptorium_reorg_onglets.md`. C9 sort du statut « coupé par défaut ».
- Classes : classes à gauche / détail à droite ; **« à faire pour cette classe »** ; **frise « où on en
  est dans le parcours »** (s'appuie sur la grille d'instance du RAG L3, déjà en place). **[C9]**
- Parcours : fonctionnel OK ; design tuile = parchemin. **[C9, cosmétique]**
- Ressources : liste des 3 ressources à gauche, « étagères » à droite ; Textes = parchemin,
  Cours = dossiers (post-RAG), Livres = design biblio d'Aletheia (en cours de production) ;
  **boutons retour**. **[C9]**
- Paramètres : design. **[C9]**

### Quazian — « design complet + je ne sais plus comment il fonctionne » **[C7 — élargi]**
- **Nouvelle logique flashcards** (mini-spec Fable) : générées **depuis les contenus (cours)** ;
  déclencheur = quand tu coches **« vu »** dans Scriptorium, les cartes de l'élément se génèrent
  automatiquement, **en file de validation prof** avant publication. Revoir la logique existante autour de ça.
- Onglets : **Flashcards · Quiz** (+Paramètres). « Semaine » disparaît au profit de Quiz. Design refait. **[C7]**
- **[?] Diagnostic : quoi en faire, où le mettre ?** Proposition à trancher : plus d'onglet dédié —
  le diagnostic se range dans la matrice compétences (C6) et la fiche élève ; on garde une entrée
  « fragilités » dans Quiz. **[C7/C6]**
- Paramètres : design léger. **[C7]**

### Codex **[C4 — élargi]**
- Exercices : à faire complètement → **c'est C4** (moteur + instance écriture).
- **Synthèse : à revoir complètement** (fonctionnement + design) + Paramètres à revoir.
  Onglets cibles : **Exercices · Synthèse** (+Paramètres). **[C4, lot dédié en fin de chantier]**

### Aletheia **[C5 — élargi]**
- Exercices : à faire complètement → **c'est C5** (instance lecture).
- **Livres** (ancien « Classes ») : design à refaire — reprendre ton design « biblio ». **[C5]**
- Paramètres : design + revue. Onglets cibles : **Exercices · Livres** (+Paramètres). **[C5]**

---

## Côté élève

- **Commutateur de classe : 3 états minimum — Toutes les classes / classe X / classe Y.**
  « Toutes » agrège au moins le tableau de bord et le calendrier ; dans les modules on reste par
  classe (v1). Mini-décision Fable, implémentation standard. **[C7]**
- Nav : les modules apparaissent dans le tableau de bord **mais pas tous dans le menu déroulant du
  haut** → aligner le menu sur les accès réels. **[C10a, fix rapide]**
- Tableau de bord : **garantir que tout le « à faire » y remonte** (fragments, flashcards dues, quiz,
  séances Codex, séances Aletheia, exercices C4/C5, retours à valider) ; le redesign vient après le
  contenu. **[C10a + branchements dans C4/C5]**
- Calendrier : OK. Intégrité : OK.
- **Scriptorium élève : 2 onglets — Plan de cours · Discussion.** **[C2]**
  - Discussion : design « échange épistolaire ».
  - Plan de cours : 2 vues — **Année** (plusieurs parcours) et **Parcours** (textes/livres cliquables,
    renvoi vers Aletheia pour les livres). C'est le L6 du RAG, dessiné par tes notes.
  - Espace de droite peu utilisé → **possibilité d'ajouter des notes** : **[post]** (bonne idée,
    pas vitale au jour 1).
- Fragments élève : design en partie fait, à vérifier/implémenter ; onglets **Écrit · Oral · Essai**. **[C8]**
- Quazian élève : design + logique ; onglets **Flashcards · Quiz**. **[C7]**
- Codex élève : design + logique ; onglets **Exercices · Synthèse**. **[C4]**
- Aletheia élève : design + logique ; onglets **Exercices · Livres**. **[C5]**

---

## Les 5 questions ouvertes à trancher (au prochain check-in, 2 min chacune)

1. Effacer un semestre : possible aujourd'hui ? sinon, l'ajouter ? *(C12)*
2. Toggle semestre visible sur Fragments : garder ou déduire du calendrier ? *(C8)*
3. Diagnostic Quazian : fondu dans compétences (C6) + entrée « fragilités » dans Quiz ? *(C7)*
4. « Flashcards gelées » par l'intégrité : assumé ou à retirer ? *(C7)*
5. Contenu au clic d'une classe (pilotage) : santé + à faire + accès modules ? *(C10b)*
