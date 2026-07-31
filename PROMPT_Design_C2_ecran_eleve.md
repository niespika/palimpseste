# PROMPT — Session Design 🎻 (Fable) : révision du handoff « Scriptorium élève »

> **À coller tel quel dans la session Design, avec en contexte :**
> 1. le dossier du handoff existant (écran élève Scriptorium, version Opus) ;
> 2. `design_handoff_charte_palimpseste/` (la charte — jetons, polices, sceaux) ;
> 3. `handoff_en_tete/` (le nouvel en-tête — les sous-onglets de module y vivent) ;
> 4. la section C2 de `PLAN_CHANTIERS_RENTREE.md`.
>
> Modèle : **Fable** — c'est l'un des 2-3 écrans critiques du plan (§5) : le visage du RAG
> pour l'élève.

---

Tu es le studio de design de **Palimpseste**. Tu as déjà produit un handoff pour l'écran
élève du Scriptorium (2 onglets : plan de cours + discussion avec l'IA). Ce handoff est
bon dans sa structure — on ne repart pas de zéro. Ta tâche : le **réviser** sur trois
points, dont un travail de fond sur le rendu de la Discussion. Tu itères directement sur
les fichiers du handoff existant (mêmes conventions : maquettes `.dc.html` + `support.js`,
README avec la section « fait foi », fidélité hifi).

## Ce qui existe déjà dans le code (à ne pas perdre de vue)

La mécanique est en prod, gatée (`rag_actif=false`) : `app/eleve/modules/scriptorium/page.tsx`
+ `ChatScriptorium.tsx` — fil de messages en streaming (avec bouton stop), rail de
conversations (créer / reprendre / renommer / supprimer), panneau plan du cours par statuts
(vu / en cours / à venir), amorces de la semaine, bandeau de transparence à la première
utilisation, quota avec message doux. **Le handoff ne redéfinit que la surface** — aucune
nouvelle fonctionnalité, aucune mention de la route de chat, du quota ou des données.

---

## Révision 1 — Retirer le mobile

Le nouvel en-tête (voir `handoff_en_tete/`) est explicitement **hors périmètre mobile** ;
toute maquette mobile dessinée aujourd'hui poserait sur un en-tête qui n'existe pas encore.
Donc :

- Supprimer du handoff toutes les maquettes et sections mobile.
- Les remplacer par un court paragraphe « Contraintes responsive minimales » : à 375 px,
  rien de cassé — empilement naturel des colonnes, rail de conversations escamotable,
  barres mobiles existantes conservées. Le **design** mobile sera traité au chantier C10a
  (passe élève mobile-first), pas ici.

## Révision 2 — Onglets et commutateur Année | Parcours

- **Deux onglets conservés : « Plan de cours · Discussion »** (intitulés du plan de
  rentrée — si le handoff actuel dit « Parcours », harmoniser vers « Plan de cours »).
  Point d'implémentation important : ces onglets sont les **sous-onglets du module** — ils
  vivent dans la bande « seuil du module » du nouvel en-tête (`SousNavModule`), **pas dans
  une barre d'onglets locale à la page**. Le handoff doit le dire explicitement pour que
  l'implémentation ne crée pas un second système d'onglets.
- Dans **Plan de cours**, prévoir un **commutateur de vue « Année | Parcours »** (toggle
  sobre, style charte — Alegreya Sans, filet pigment, pas de gros segmented control).
  - **La vue Parcours actuelle est très bien : la conserver telle quelle**, ne pas la
    redessiner. Elle devient simplement la vue par défaut.
  - **La vue Année n'est pas à dessiner maintenant.** C'est la coupe pré-décidée du plan
    (v1 = vue Parcours seule). Le handoff spécifie : l'emplacement et l'état du toggle,
    le fait que la vue Année réutilisera le même langage visuel (une carte par parcours,
    même grammaire que la vue Parcours), et la règle v1 : **tant que la vue Année n'existe
    pas, le toggle est absent** (pas de bouton mort à l'écran). Montrer les deux états dans
    la maquette : avec toggle (cible) et sans (v1).

## Révision 3 — La Discussion en « espace épistolaire » (le cœur de cette session)

### L'intention

Ce n'est **pas** la manière dont l'IA parle — ça, c'est réglé ailleurs, dans le prompt
système. C'est **le lieu**. Aujourd'hui, l'écran est une messagerie ; on veut que l'élève
ait le sentiment de s'asseoir à un écritoire. La référence : **l'art épistolaire de la
Renaissance et du XVIIIe siècle** — le soin de l'adresse, la dignité de la page, le temps
long — transposé, pas imité. Un espace **agréable, serein, un peu digne**. Et une contrainte
non négociable : des adolescents de 16-17 ans doivent lire sans effort — **la lisibilité
gagne sur l'ambiance à chaque arbitrage**.

### La direction

- **La page avant la bulle.** Une correspondance, pas un SMS. Colonne unique généreuse
  (~65-75 caractères) sur un feuillet `surface #FBF8F1` posé sur le fond du module
  `#F0EADE`. Les messages sont des **feuillets d'une lettre**, pas des bulles colorées
  gauche/droite. Les deux voix se distinguent par la typographie et la mise en page —
  par exemple : les questions de l'élève en retrait, précédées d'un filet au pigment ;
  les réponses pleine page ; ou de discrets en-têtes d'adresse. Jamais par des aplats
  de couleur.
- **L'encre et le papier de la charte, rien d'autre.** Encre `#221C16`, encre douce
  `#5A4632` pour le secondaire, pigment scriptorium `#4A3A28` en filets, lisérés et
  ornements. Aucun nouveau pigment. Si texture papier : à peine perceptible, en CSS
  léger — pas d'image de parchemin.
- **La typographie fait le rituel.** Corps des messages en **EB Garamond 18-19, interligne
  généreux (≈1.65)** — jamais de cursive ni d'italique long. **Cormorant Garamond italique**
  réservé aux éléments rituels : la date du jour rendue en séparateur de correspondance
  (« Ce vendredi 24 juillet ») au lieu de timestamps techniques. **Alegreya Sans** pour
  l'outillage : rail des conversations, boutons, métadonnées.
- **Les rituels épistolaires en micro-détails de rendu** (sans toucher au texte généré) :
  séparateurs de jour façon datation de lettre ; fin de réponse marquée d'un fleuron ou
  d'un filet très discret ; éventuellement la marque du Scriptorium (sceau N&B en multiply,
  comme `Pastille.tsx`) en tête de conversation. **Dosage : un ornement par écran, pas un
  par message.**
- **L'écritoire.** La zone de saisie est une feuille, pas un champ de messagerie : cadre au
  filet fin sur fond surface, placeholder soigné (reprendre le libellé existant, l'élève
  est tutoyé), bouton « Envoyer » sobre en Alegreya Sans. Le streaming est déjà épistolaire
  en soi — le texte s'écrit — aucune animation supplémentaire.
- **La sérénité par le rythme.** Blanc généreux, rythme vertical régulier, peu d'éléments
  simultanés ; le rail des conversations s'efface visuellement — l'espace central est la
  lettre. Les amorces deviennent des invitations discrètes sous l'écritoire (petites cartes
  au filet), pas des chips.
- **Le bandeau de transparence** (première utilisation) devient un **billet** à part
  entière : un feuillet teinte `#E6DDC9`, ton digne, contenu strictement inchangé.

### Garde-fous anti-pastiche (interdits fermes)

Pas de police script/manuscrite pour le corps · pas de parchemin vieilli photoréaliste,
taches ou bords brûlés · pas de cachet de cire rouge cliché ni de plume d'oie en icône ·
pas d'ornement à chaque message · pas de sépia poussé · contraste AA minimum partout.
L'élégance vient de la mise en page — pense **belle édition de correspondance** (marges,
filets, alignements), pas décor de film d'époque.

### Méthode

Explorer **2-3 partis** sur le canevas (ex. « correspondance continue » vs « feuillets
alternés » ; avec/sans en-têtes d'adresse), puis **trancher une déclinaison qui fait foi**,
déclinée sur les états réels : conversation vierge (avec billet de transparence) ·
conversation en cours (streaming + stop) · réponse longue · quota atteint (message doux) ·
rail avec plusieurs conversations (renommer/supprimer visibles).

---

## Livrables

1. Le dossier handoff **mis à jour en place** : maquettes `.dc.html` révisées (section
   « fait foi » à jour), `README.md`/`HANDOFF_*.md` révisés, avec une section
   **« Révision du 24/07 — ce qui change »** (mobile retiré, onglets/toggle, Discussion
   épistolaire) pour que l'implémentation sache quoi comparer.
2. L'inventaire d'implémentation mis à jour : correspondance maquette → composants
   existants (`page.tsx`, `ChatScriptorium.tsx`, `SousNavModule`), et la liste exacte des
   états couverts.
3. Le dossier prêt à committer sous `design_handoff_scriptorium_eleve/`.

## Critères de réussite

- Plus aucune maquette mobile ; le paragraphe « responsive minimal » est présent.
- Onglets « Plan de cours · Discussion » portés par l'en-tête (pas de barre locale) ;
  toggle Année|Parcours spécifié, absent en v1 ; vue Parcours intacte.
- La Discussion ne ressemble plus à une messagerie : un tiers non prévenu dirait « une
  lettre », tout en trouvant le texte parfaitement lisible.
- Zéro élément des interdits ; zéro nouvelle fonctionnalité ; charte respectée au jeton près.
