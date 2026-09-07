# Handoff — `/eleve/semaine` · « Ma semaine » (rendu charte)

> Pour Claude Code. Objectif : **rendre lisible l'écran de la semaine de l'élève**. Le
> contenu est bon, l'empilement ne l'est pas : frise, récapitulatif, bilan, liste des
> exercices et offre d'en faire plus se suivent dans une seule colonne, si bien qu'à
> l'ouverture l'élève lit d'abord du méta et jamais son travail. On **réorganise la
> présentation** de `app/eleve/semaine/page.tsx` **sans toucher aux règles** de
> `utils/eleve/semaine.ts` ni au chargeur `semaine-serveur.ts`.
> **Trois tailles d'écran** : téléphone, tablette, ordinateur — c'est un espace de travail,
> l'élève y vient depuis n'importe quel appareil.

## Références visuelles
Deux fichiers HTML accompagnent ce document (ouvrir dans un navigateur) :
- **`Ma semaine (élève) - Rendu charte.dc.html`** — la cible : ordinateur/tablette en vue **Travail**, ordinateur/tablette en vue **Bilan**, puis les **deux vues sur téléphone**.
- **`Ma semaine (élève) - Wireframes.dc.html`** — le « pourquoi » : quatre structures comparées (`1a` action d'abord · `1b` deux temps · `1c` fil des jours · `1d` repli minimal), puis `2a`, puis **`3a` — l'option retenue**, dont le rendu charte est la mise en couleur.

Reproduire le **langage visuel** avec les jetons du codebase (`globals.css`, `next/font`,
`components/Pastille.tsx`). **Aucune couleur ni police en dur** : `bg-surface`, `border-bordure`,
`text-encre`, `text-encre-douce`, `text-muet`, `bg-ok`, `text-attention`, `bg-attention-teinte`,
`bg-parchemin-fonce`, `font-titre`, `font-ui`.

---

## Ce qui existe (à lire avant de coder)
- **`app/eleve/semaine/page.tsx`** — la page (Server Component). Elle lit le fuseau, borne le cycle au lundi, agrège **par inscription** puis lit le **quota une seule fois par élève**. Toute cette partie reste telle quelle.
- **`utils/eleve/semaine.ts`** (pur) — `momentDeLaSemaine()` (`vide` · `recapitulatif` · `bilan`), `friseDeLaSemaine()`, `competencesDeLaSemaine()`, `bilanDeLaCompetence()`, `ceQuiManqueAuBilan()`, `offreDEnFairePlus()`.
- **`utils/eleve/semaine-serveur.ts`** — `chargerLaSemaineDeLEleve()` : `porteOuverte`, `exercices[]`, `frise`, `recapitulatif[]`, `bilan[]`, `manque`, `incidents`.
- **`app/eleve/semaine/OffreDEnFairePlus.tsx`** — le troisième temps (le pull) ; **inchangé**, seul son emplacement bouge.
- **`components/Pastille.tsx`** — le sceau du module en pastille teintée. À réutiliser tel quel.

> Règle d'or : **c'est de la présentation.** Aucune Server Action, aucun contrat de données,
> aucun seuil ne change. Rien de neuf n'est calculé côté serveur (voir « Ce qui manque »).

---

## La structure retenue (option `3a`)

**Deux vues, jamais empilées : `Travail` et `Bilan`.** Un segment les commute — il remplace
l'alternance implicite d'aujourd'hui (`auBilan`), qu'aucun repère à l'écran n'expliquait.

### Ordinateur & tablette paysage (≥ ~1024 px) — deux colonnes
1. **En-tête burelle** (marque + devise) : on **n'y ajoute rien**. Le titre et la navigation de semaine n'y entrent pas.
2. **Bande de page** juste sous l'en-tête : `‹ Tableau de bord`, titre **« Ma semaine »** (`font-titre`), et à droite **`◀ précédente` · « 8 → 14 septembre » · `suivante ▶`** (les trois liens `?cycle=` existants ; « cette semaine » remplace la date quand on n'y est pas).
3. **Colonne principale (gauche)** — vue Travail :
   - en tête, le **volume** : « 3 exercices faits sur 5 » (`font-titre`), la **frise** (une case par exercice imposé, `bg-ok` / `bg-parchemin-fonce`), et à côté, en italique discret, **« et 1 que tu as demandé en plus »** ;
   - **À faire** — une ligne haute par exercice : pastille du module, titre, `libelle` + `· demandé en plus` le cas échéant, échéance en pastille (teinte attention quand elle est proche), action à droite (`Commencer` / `Reprendre`, `href` existant) — **sans durée** ;
   - **Déjà fait · N** — les mêmes exercices, en deux colonnes, plus petits, estompés, marque « fait ».
4. **Rail (droite, ~276 px)** : le **segment Travail / Bilan** en tête, puis **« Ce que la semaine travaille »** (le récapitulatif), puis **« En faire plus »**.
5. **Vue Bilan** : la colonne principale porte le bilan (voir ci-dessous) ; le rail garde le segment, le rappel du volume, l'offre.

### Tablette portrait (~640–1023 px)
Une seule colonne : le rail **retombe sous** la colonne principale, dans le même ordre
(exercices → récapitulatif → offre). Les lignes d'exercices gardent leur hauteur.

### Téléphone (< 640 px)
Une colonne, cibles ≥ 44 px : en-tête compact (`‹ Tableau de bord` + « Ma semaine »), flèches
de semaine sur une ligne, segment pleine largeur, volume + frise, **À faire**, puis
**replis** (`▸ Déjà fait`, `▸ Ce que la semaine travaille`), puis l'offre.
En vue Bilan : le mot d'alerte des copies non mesurées, puis les compétences enroulées.

### Le bilan, enroulé par compétence
Une **ligne par compétence**, une seule dépliée à la fois. La ligne porte le nom, le nombre
d'exercices, et une **marque de contenu** pour qu'on choisisse quoi ouvrir sans tout déplier :
- `angleMort.length > 0` → **« à reprendre »** (teinte attention) ;
- sinon `bonneSurprise.length > 0` → **« réussi »** (teinte ok) ;
- sinon → **« comme d'habitude »** (muet).

Dépliée, elle montre **les deux écarts qui instruisent, côte à côte** sur grand écran, l'un
sous l'autre sur téléphone : `Tu as réussi …` / `À reprendre …`, avec l'incise (« là où tu
avais du mal jusqu'ici » · « c'était pourtant un de tes points forts »). Le « reste »
(`confirme` / `connu`) ne s'affiche que si aucun écart n'instruit, comme aujourd'hui.

---

## ⛔ Six garde-fous — la maquette est une image, le code a des règles

1. **LE SEGMENT N'EST PAS UNE NAVIGATION LIBRE.** `momentDeLaSemaine()` commande toujours :
   au moment `recapitulatif`, l'onglet **Bilan est inerte** (estompé, non cliquable) et une
   phrase le dit sous le segment — la maquette montre cet état : « Ton bilan s'ouvrira quand tu
   auras fini ta semaine. » Ouvrir le bilan
   pendant la semaine **donnerait à l'élève la réponse à la phase « se juger »** — c'est le
   §6.C, et ça ne se négocie pas. Symétriquement, au moment `bilan`, la vue par défaut est
   **Bilan**, et **Travail** reste consultable (les exercices faits).
2. **AUCUNE DURÉE PAR EXERCICE.** `utils/eleve/semaine.ts` l'exclut nommément de cet écran
   (la durée vit au temps 2 du déroulé). Ne pas exposer `dureeDeLInstance` ici — la maquette
   n'en porte pas.
3. **AUCUN NOMBRE DANS L'OFFRE.** Le pull se compte en minutes **côté serveur seulement** ; à
   l'écran, c'est la `phrase` rendue par `offreDEnFairePlus()`, telle quelle — et quand l'offre
   ne s'ouvre pas, **sa phrase de refus prend la place du bouton** (jamais un silence, jamais un
   nom d'interrupteur). C'est ce que montrent les deux vues : en Travail, la carte « En faire
   plus » porte le refus **sans bouton** ; en Bilan, la phrase de l'offre **avec** le bouton.
   ⚠️ Les phrases de refus de la maquette sont indicatives : prendre celles de `phraseDuRefus()`.
4. **AUCUN POURCENTAGE, AUCUNE BANDE DE COULEUR SUR LA FRISE.** Deux décomptes réels
   (`faits`, `total`), le `enPlus` **à part**, jamais dans la fraction.
5. **LES DIMENSIONS REGARDÉES NE SE TRONQUENT PAS.** « 17 points regardés · voir le détail »
   est une **entrée**, pas un remplacement : le détail (repli ou panneau) liste **toutes** les
   dimensions, en liste et pas en phrase — une compétence en porte jusqu'à onze. Et le
   récapitulatif **ne nomme aucune faiblesse**.
6. **LES TROIS VIDES RESTENT DISTINCTS**, et le bandeau d'incidents aussi (il ne figure pas
   dans la maquette, il reste en tête de page) : porte fermée ≠ aucun exercice ≠ semaine
   passée sans exercice ; « une lecture ratée n'est pas "rien à faire" ».

---

## Ce qui manque aux données (à trancher avant de coder)
- **Les compétences non mesurées.** La maquette affiche « 4 compétences mesurées sur 6 » et
  deux lignes grisées *(Questionnement, Lecture — le 6ᵉ nom est un placeholder à confirmer)*.
  `bilan[]` ne contient **que** les compétences mesurées : ces lignes demandent le référentiel
  des compétences. **Si l'obtenir coûte une lecture de doctrine, ne pas les rendre** — la vue
  se limite aux compétences présentes, et le compteur disparaît avec elles.
- **Le partage À faire / Déjà fait** se déduit du `ton` (`a_lire`, `a_faire`, `en_cours`
  appellent un geste ; `attente`, `clos` non) — même prédicat que la frise. Ne pas ajouter de
  champ.
- **`Commencer` / `Reprendre`** : libellé dérivé du `ton` (`en_cours` → « Reprendre »), cible
  inchangée (`e.href`).

## Rappels charte
- Jetons de couleur, jamais de hex en dur. Les valeurs de la maquette sont là pour l'œil :
  parchemin `#FBF8F1` / `#F6F1E5`, bordure `#E4DBC9`, encre `#221C16`, muet `#8A6F4E`,
  ok `#737F5E` / teinte `#E4E8D8`, attention `#8A6A2E` / teinte `#FBF3E6`.
- **Boutons estompés** (préférence projet, `CLAUDE.md`) : segment actif et action principale
  en **noyer estompé** `#6B5A46` sur `#F1EADD` ; l'offre d'en faire plus en **ocre estompé**
  `#AC8552` sur `#FBF5EA` ; la frise en **vert estompé** `#737F5E`.
- Titres en `font-titre` (Cormorant Garamond), corps en EB Garamond, UI/étiquettes en
  `font-ui` (Alegreya Sans) — surtitres en majuscules `.11em` de tracking.
- **Pastilles de module** par `components/Pastille.tsx` (sceau à 88 % du disque,
  `mix-blend-mode: multiply`) : 40 px sur les lignes « à faire », 28 px sur « déjà fait »,
  36 px sur téléphone. L'atelier **se montre, il ne se visite pas**.

## Hors périmètre
Le déroulé d'un exercice, le pull lui-même (`OffreDEnFairePlus.tsx`), l'onglet « Moi »
(profil), le calendrier — et l'échéance d'exercice absente de l'agenda, qui est un autre
chantier.

## Checklist
- [ ] En-tête burelle intacte ; titre + navigation de semaine dans la bande en dessous.
- [ ] Volume + frise + « demandé en plus » **au-dessus** de « À faire », dans la colonne principale.
- [ ] Segment Travail / Bilan **en tête du rail**, et **inerte** hors du moment `bilan` (avec sa phrase).
- [ ] Récapitulatif dans le rail ; bilan dans la colonne principale, enroulé par compétence, une seule dépliée.
- [ ] Aucune durée d'exercice, aucune minute de quota, aucun pourcentage à l'écran ; phrases de l'offre reprises de `phraseDuRefus()` / `offreDEnFairePlus()`.
- [ ] Dimensions regardées consultables **en entier**.
- [ ] Trois vides + bandeau d'incidents conservés mot pour mot.
- [ ] Téléphone : une colonne, cibles ≥ 44 px, replis ; tablette portrait : rail sous le contenu.
