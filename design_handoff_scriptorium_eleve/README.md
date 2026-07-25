# Handoff — Scriptorium · face ÉLÈVE

Dossier prêt pour Claude Code. Tout est relatif : garder la structure telle quelle.

> **Révision du 24/07** — ce dossier a déjà été livré une fois. Trois choses changent :
> **le mobile est retiré**, **les onglets + le commutateur Année|Parcours** sont précisés, et
> **la Discussion est refondue en espace épistolaire**. Le détail figure dans la section
> « Révision du 24/07 — ce qui change » du HANDOFF, en tête de document. **Si une implémentation
> a déjà commencé, comparer avec cette section avant toute chose.**

## Contenu
- **`HANDOFF_scriptorium_eleve.md`** — les instructions (révision du 24/07, architecture concernée, décisions validées, 4 chantiers, rappels charte, hors-périmètre, inventaire d'implémentation, checklist). **Commencer par là.**
- **`Scriptorium Élève - Rendu charte.dc.html`** — **cible visuelle qui fait foi**, hi-fi fidèle à la charte, en mode canvas (pan/zoom). Ouvrir dans un navigateur (double-clic). Écrans repérés par badge d'id :
  - **Plan de cours** : `1a` cible (avec commutateur **Année | Parcours**) · `1b` **v1** (sans commutateur) + spécification de la vue Année.
  - **Discussion — espace épistolaire, 5 états réels** : `2a` conversation vierge (billet de transparence + amorces) · `2b` échange en cours (streaming + **Stop**) · `2c` réponse longue · `2d` quota atteint (message doux) · `2e` rail à plusieurs conversations (**Renommer** / **Supprimer**).
  - **Aucun écran mobile** — hors périmètre (chantier **C10a**).
- **`Scriptorium Élève - Discussion épistolaire (explorations).dc.html`** — les trois partis explorés pour la Discussion : `1a` **correspondance continue (retenu)** · `1b` feuillets alternés · `1c` la page & la marge. **Ne fait pas foi** : documente le choix.
- **`support.js`** — runtime requis par les `.dc.html` (chargé en `./support.js`). Ne pas déplacer.
- **`sceaux/`** — `palimpseste_medaillon.png` (marque de l'en-tête) et `pastille-scriptorium.png` (sceau du module).

## ⚠️ À retenir pour l'intégration

- **Le problème réglé** : l'écran élève actuel mélange **dialogue + plan du cours + historique**. On sépare le **plan** dans son propre onglet ; **dialogue + historique** restent ensemble.
- **Les onglets vivent dans l'en-tête, pas dans la page.** « Plan de cours » · « Discussion » sont les **sous-onglets du module**, rendus par **`SousNavModule`** dans la bande « seuil du module », pilotés par **`?vue=plan|discussion`**. **Ne pas créer de barre d'onglets locale** — ce serait un second système de navigation. Pas de fil d'Ariane.
- **Commutateur « Année | Parcours »** dans Plan de cours : sobre (Alegreya Sans + filet pigment), **local au contenu** (ce n'est pas de la navigation), **Parcours par défaut**. La **vue Parcours existante n'est pas redessinée**. La **vue Année n'est pas à dessiner** : elle réutilisera le même langage visuel (une carte par parcours). **Règle v1 : tant que la vue Année n'existe pas, le commutateur est absent** — pas de bouton mort à l'écran.
- **La Discussion doit ressembler à une lettre, pas à une messagerie** : colonne unique ~65-75 caractères sur feuillet `#FBF8F1` posé sur `#F0EADE` ; le tuteur occupe la pleine page, les mots de l'élève sont **en retrait derrière un filet au pigment** ; les voix se distinguent par **typographie et mise en page**, **jamais par un aplat de couleur**. Corps **EB Garamond 18-19 px / ≈1,65** — la lisibilité gagne sur l'ambiance à chaque arbitrage (lecteurs de 16-17 ans).
- **Rituels épistolaires, en rendu seulement** : séparateur de jour en Cormorant italique (« Ce vendredi 24 juillet ») au lieu d'horodatages · **un ornement par écran** · sceau N&B en `multiply` en tête de conversation · écritoire au **placeholder existant** · amorces en petites cartes au filet · bandeau de transparence promu en **billet `#E6DDC9` au contenu strictement inchangé**. **Aucune animation ajoutée** : le streaming est déjà épistolaire.
- **Interdits fermes** : pas de cursive pour le corps, pas de parchemin vieilli / taches / bords brûlés, pas de cire rouge, pas de plume d'oie, pas d'ornement par message, pas de sépia poussé, **aucun pigment nouveau**, **contraste AA partout**.
- **C'est de la présentation + navigation, pas de la logique** : streaming, **stop**, quota, `renommer`/`supprimer`, `?conv=`, RAG et le **DTO anti-spoiler `PlanEleve`** (titres + statuts seuls) **ne changent pas**. **Aucune fonctionnalité nouvelle.**
- **Plomberie à ouvrir** : `configModules.ts` (ajouter les sous-onglets **élève**), puis rendre role-aware `EnTeteSite.tsx` (il lit `sousOngletsProf` en dur — côté élève l'en-tête ne prévoit encore aucun sous-onglet, c'est le premier cas). Les autres modules restent intacts.
- **Couleurs onglets** = valeurs **déjà** dans `configModules` (actif `#E6DDC9`/`#4A3A28`, inactif `#6A5C48`) — pas les tokens CSS. **Statuts du plan** = tokens `ok` / `attention` (ocre `#9A6A2E`) / `muet`, renforcés par la **police** (gras = cette semaine, italique = à venir).
- **Boutons estompés** (cf. `CLAUDE.md`) : token `bg-bouton` = noyer `#6B5A46` / texte `#F1EADD`. Pas d'aplat franc ; rouge réservé au destructif (`Supprimer`).
- **Responsive** : **minimal**. À 375 px, rien de cassé — empilement naturel des colonnes, rail de conversations escamotable, barres mobiles existantes conservées. Le design mobile est traité au **chantier C10a** (passe élève mobile-first) : **aucune vue mobile à concevoir ici**.
- **Décisions closes** : la « décision en attente » du handoff initial sur la piste mobile Discussion (`2d` tiroir vs `2e` liste ↔ fil) est **annulée, sans objet** — le mobile sort du périmètre.

## Pour visualiser
Ouvrir les `.dc.html` dans un navigateur (double-clic). La présence de `./support.js` et
`./sceaux/*.png` à côté des fichiers est nécessaire à leur rendu.
