# Handoff — Aletheia, espace élève (mise en valeur des sceaux + revue des semaines)

> Pour Claude Code. Objectif : faire ressembler le module **Aletheia** côté élève à la
> maquette validée. **Pas de refonte fonctionnelle** : la machine à états (`StatutAletheia`),
> les retours IA, le capstone et le déblocage séquentiel ne changent pas. On retouche
> l'agencement, la hiérarchie de lecture, et on remet les sceaux en valeur.

## Référence visuelle
- **`Aletheia — Parcours élève.dc.html`** — rendu hi-fi fidèle à la charte, tous les écrans
  élève d'Aletheia dans les six états + planning + capstone + états limites. C'est la cible.

Reproduire ce **langage visuel** avec les composants/conventions du codebase (React,
classes Tailwind de `globals.css`, `next/font`, composant `Pastille`). Réutiliser les jetons
(`bg-pigment`, `text-pigment`, `bg-pigment-teinte`, `bg-bouton`, `font-marque`…) — **ne pas
réintroduire de hex en dur**. Le sous-arbre est déjà sous `data-module="aletheia"` via
`app/eleve/modules/aletheia/layout.tsx`, donc le pigment (outremer) et le bouton
(⚠ **minium `#B4452F`**, pas le bleu) sont hérités.

---

## Décisions validées par le porteur du projet
1. **Le parcours est bon, on ne touche pas à la logique.** Les 6 états (`DRAFT` → `V1_SUBMITTED`
   → `FEEDBACK1_READY` → `VF_SUBMITTED` → `FEEDBACK2_READY` → `DONE`), l'atelier deux-colonnes
   (déjà en place via `AtelierDeuxColonnes`), le stepper, le capstone et le déblocage séquentiel
   restent tels quels.
2. **Trois retouches seulement :**
   - **Sceaux remis en valeur** : agrandis, et **ajoutés là où ils manquaient** (en-tête du
     planning, en-tête du capstone).
   - **Revue d'une semaine terminée (`DONE`) repensée** : passer d'une pile de 4 blocs égaux à
     une **archive hiérarchisée** (synthèse à relire en haut, ton avant/après visible, le détail
     replié).
   - **Planning plus lisible** : chaque semaine montre son avancement par **4 points** (le
     stepper en miniature) + une barre d'avancement globale.

---

## Chantier 1 — Sceaux remis en valeur

Le composant existe déjà : **`components/Pastille.tsx`** (`<Pastille module="aletheia" size={…} />`,
disque teinté + PNG `mix-blend-multiply`). Les PNG sont dans `public/sceaux/`.

À faire :
- **`app/eleve/modules/aletheia/page.tsx`** (planning) : l'en-tête est aujourd'hui un simple
  `<h2>Aletheia</h2>` **sans sceau**. Ajouter un **bloc héros** : `<Pastille module="aletheia"
  size={92} />` à gauche, puis `font-marque` « ALETHEIA », le **titre du livre** en `font-titre`
  (~30px) et la ligne auteur/nb semaines en `font-corps text-muet`.
- **`app/eleve/modules/aletheia/[livreId]/capstone/page.tsx`** : en-tête sans sceau →
  ajouter `<Pastille module="aletheia" size={112} />` **centré** au-dessus du titre
  « ✦ Carte d'architecture du livre ». C'est une page à garder/imprimer, le sceau y est l'objet.
- La page semaine (`[semaine]/page.tsx`) a déjà `<Pastille module="aletheia" size={56} />` —
  **OK, ne pas réduire**.
- Tailles cibles : **planning hero 92 · semaine 56 · capstone 112**. Disque = `bg-pigment-teinte`,
  léger `inset ring` pigment optionnel.

> Acceptation : aucun en-tête de monde sans son sceau ; le sceau est nettement plus présent
> qu'avant sur le planning et le capstone.

---

## Chantier 2 — Planning repensé (`app/eleve/modules/aletheia/page.tsx`)

### Existant
Un `<h3>` titre de livre + une `<ul className="divide-y">` de semaines, chaque ligne = libellé +
**petit badge texte** (`BADGE[statut]`) ou « 🔒 Verrouillée ». Pas de sceau, pas de vue d'ensemble.

### Cible (voir maquette, bande A)
Par livre :
1. **Héros** (cf. Chantier 1) : sceau 92 + ALETHEIA + titre du livre + `Auteur · {nb_semaines} semaines · lis-le dans ton exemplaire`.
2. **Barre d'avancement** : `bg-surface border border-bordure rounded-xl`, un grand chiffre
   `font-titre text-pigment` = `nbDone / total`, le libellé « semaines terminées », une
   `<progress>`-like bar (`bg-bordure` + remplissage `bg-ok` à `nbDone/total`), et un chip
   `bg-pigment-teinte text-pigment` « Semaine N t'attend » (la 1ʳᵉ semaine non `DONE` débloquée).
   - `nbDone = livre.semaines.filter(s => travaux?.get(s.semaine)?.statut === 'DONE').length`.
3. **Liste des semaines** — passer de la `divide-y` plate à des **cartes** (`bg-surface border
   border-bordure rounded-xl`, `flex flex-col gap-2`). Chaque ligne contient, alignés :
   - le **numéro** en `font-titre text-muet` ;
   - titre (`font-corps`) + sous-ligne `text-pigment` chapitres · date (réutiliser `s.chapitres`,
     `s.dateIndicative`) ;
   - un **micro-stepper de 4 points** (voir ci-dessous) ;
   - le **badge d'état** (`BADGE[statut]`) ;
   - l'**action** : `DONE` → « Revoir → », semaine courante → « Continuer → » (`text-bouton`
     minium, `font-medium`), `DRAFT` débloquée → « Ouvrir → », verrouillée → « 🔒 Verrouillée »
     (ligne en `opacity-60`, non cliquable, comme aujourd'hui).
   - **Semaine courante** = mettre la carte en `bg-pigment-teinte border-l-4 border-l-liseret`
     (la 1ʳᵉ non terminée et débloquée).
4. **CTA capstone** en bas (existant) : garder le rendu `bg-bouton` quand `toutesDone && cap READY`.
   Quand non terminé, afficher une **carte pointillée verrouillée** : `border border-dashed
   border-bordure`, « La carte d'architecture se révèle quand les 6 semaines sont terminées »
   + `🔒 {nbDone}/{total}`.

**Le micro-stepper (4 points).** Réutiliser la logique d'`indexEtape(statut)` déjà présente
dans `[semaine]/page.tsx` (extraire dans un util partagé, p.ex. `aletheia/etapes.ts`) :
les 4 points correspondent aux 4 `ETAPES_SEMAINE` (`Lecture · Retour · Réécriture · Retour final`).
Pour une semaine donnée, `courant = indexEtape(statut)` :
- point `i < courant` → `bg-ok` (plein) ;
- point `i === courant` (et `statut !== 'DONE'`) → `bg-pigment` ;
- sinon → `border border-bordure` (creux).
`DONE` → les 4 points pleins `bg-ok`. Verrouillée → 4 points creux + `opacity-60`.

> Acceptation : d'un regard sur le planning, on voit jusqu'où chaque semaine **passée** est
> allée (les 4 points) sans rien ouvrir ; « Revoir » ouvre la semaine terminée.

---

## Chantier 3 — Revue d'une semaine terminée ⭐ (`[livreId]/[semaine]/page.tsx`)

### Problème actuel
Quand `statut === 'DONE'`, la page empile, en lecture seule et à poids égal : Bloc 1 (saisie V1,
5 champs) → Bloc 2 (`VueRetourV1`) → Bloc 3 (VF, 3 champs) → Bloc 4 (`VueRetourVF`). Long
défilement, rien ne ressort, alors qu'une semaine close est surtout une **archive à relire**.

### Cible (voir maquette, bande C — « APRÈS »)
**Uniquement quand `statut === 'DONE'`**, remplacer la pile par une **vue de revue
hiérarchisée**. Les autres états restent strictement inchangés (le pilotage par statut existant
ne bouge pas). Ordre :

1. **En-tête** : sceau 56 + ALETHEIA + `Semaine {n} — {titre}`, plus un chip à droite
   `bg-ok-teinte text-ok` « ✓ Terminée » (date = `t.updated_at` formatée). Stepper : 4 pastilles
   `bg-ok` (tout fait).
2. **★ La synthèse modèle, à relire** — tout en haut. Carte `border-l-4 border-l-liseret`
   (pigment), surtitre `font-ui text-pigment` « ★ À RELIRE — LA SYNTHÈSE MODÈLE », corps =
   `t.retour_vf.synthese_modele` en `font-corps` ~16px. C'est le « keeper ».
3. **Ton chemin — avant/après** : surtitre `font-ui text-muet` « DU PREMIER JET À LA VERSION
   FINALE », puis **deux colonnes** (`grid lg:grid-cols-2 gap-4 items-stretch`). Réutiliser
   **`components/AtelierDeuxColonnes.tsx`** (mêmes props `labelRetour`/`labelFormulaire` →
   ici « Ton premier jet » / « Ta version finale ») pour garder le **même langage** que l'atelier :
   - gauche = `t.these` (V1) en `text-muet italic` sur `bg-parchemin-fonce` ;
   - droite = `t.these_vf` (VF) en `text-encre` sur `bg-surface border-l`/anneau pigment.
   - Sur mobile (`< lg`) : une **bascule segmentée** « Ta version finale / Ton premier jet »
     (la VF par défaut), même composant que la bascule de l'atelier mobile.
4. **Ce que cette semaine t'a dévoilé** : carte `border-l-4 border-l-ok` avec
   `t.retour_vf.architecture_amont` (« ce que tu as déjà vu ») + `architecture_aval_jalons`
   (« jalon »). C'est le fil entre les semaines.
5. **Revoir le détail** — replié : trois lignes `<details>` (`bg-surface border rounded-xl`,
   chevron `▸`) qui ne se déploient qu'au clic :
   - « Ton retour socratique » → `<VueRetourV1 retour={t.retour_v1} … />` ;
   - « Le retour final complet » → `<VueRetourVF retour={t.retour_vf} />` (nuances, ajouts vérifiés) ;
   - « Ta saisie initiale » → les `Champ`/`ListeChamp` de la V1 (arguments, accord, questions, vocabulaire).
   **Réutiliser tels quels** `VueRetourV1`/`VueRetourVF` (`components/aletheia/VueRetours.tsx`) et
   les helpers `Champ`/`ListeChamp` déjà dans le fichier — juste les déplacer dans des `<details>`.

> Acceptation : une semaine `DONE` s'ouvre sur la synthèse + l'avant/après, le détail est replié
> par défaut ; aucune donnée n'est perdue (tout reste accessible en dépliant). Les états
> non-`DONE` sont identiques à avant.

---

## Chantier 4 — Capstone : sceau héros (`[livreId]/capstone/page.tsx`)

Garder la structure (fil conducteur / nœuds / liens) et le bouton imprimer. Ajouter l'en-tête
héros : `<Pastille module="aletheia" size={112} />` **centré**, surtitre `font-marque`
« ALETHEIA · {titre du livre} », titre `font-titre` « ✦ La carte d'architecture du livre »,
sous-titre. Le bloc « Fil conducteur » prend un `border-l-4 border-l-attention` (accent or) ;
nœuds et liens restent en cartes `bg-surface`. États `PENDING`/erreur inchangés (juste le sceau
en plus, légèrement atténué).

---

## Rappels charte (déjà dans le codebase — réutiliser, ne pas redéfinir)
- **Polices** : `font-marque` Cinzel (CAPS espacées) · `font-titre` Cormorant (titres, grands
  chiffres, synthèse) · `font-corps` EB Garamond (`<body>`) · `font-ui` Alegreya Sans (nav,
  badges, boutons, surtitres, dates).
- **Pigment du monde** hérité via `data-module="aletheia"` : `text-pigment` (outremer),
  `bg-pigment-teinte`, `border-l-liseret` ; **bouton = `bg-bouton` (minium `#B4452F`)**.
- **États** : `text-ok`/`bg-ok-teinte` (fait, terminée) · `text-attention`/`bg-attention-teinte`
  (à faire, retour à lire) · `text-retard`/`bg-retard-teinte` (erreur) · `text-info` (accord).
- **Sceaux** : `components/Pastille.tsx`, PNG dans `public/sceaux/`. Ne pas dessiner de SVG.
- **Cartes** : `bg-surface border border-bordure rounded-xl` ; têtière = `<div className="h-1.5
  bg-pigment" />` ; tuile à bord gauche = `border-l-4 border-l-liseret`.

## Responsive
- Mobile : 1 colonne ; avant/après en **bascule segmentée** (pas de 2 colonnes) ; le détail
  reste replié. Cibles tactiles ≥ 44px.
- `lg` (≥1024) : avant/après en 2 colonnes via `AtelierDeuxColonnes` ; planning lisible en lignes.
- `print:hidden` sur les barres de nav (le capstone reste imprimable).

## Checklist d'acceptation
- [ ] Planning : sceau héros 92 présent ; barre d'avancement `nbDone/total` ; chaque semaine a
      ses **4 points** d'avancement + badge + action ; semaine courante mise en avant ; CTA
      capstone verrouillé tant que non terminé.
- [ ] Semaine `DONE` : synthèse modèle en tête, avant/après (`AtelierDeuxColonnes`, V1↔VF),
      architecture, détail dans des `<details>` repliés. Aucune régression sur les autres états.
- [ ] Capstone : sceau 112 centré en en-tête ; structure et impression inchangées.
- [ ] Aucun en-tête de monde sans sceau. Aucune couleur/police en dur ; tout via jetons et
      `font-*`. Machine à états, retours IA et déblocage séquentiel **inchangés**.
</content>
