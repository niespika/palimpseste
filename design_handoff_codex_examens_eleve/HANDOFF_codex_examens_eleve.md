# Handoff — Codex · onglet **Examens** (côté élève)

> **Périmètre : présentation seulement.** Les étapes 5 à 10 du `02-exercices.md`
> §6.D gardent leur ordre et leur contenu. Le champ d'édition reste un
> `<textarea>` qui préserve le découpage en blocs (piège 14). Aucun chiffre de
> confiance n'apparaît à l'écran (piège 56) : `confiance_ocr` sert toujours à
> **attirer l'œil sur un passage**, jamais à afficher un score. L'obligation de
> lecture reste **un seul geste sur le retour** (`lu_at`, `07-` §1.1 ; piège 32).
> Aucune note, aucune lettre, aucun pourcentage.
>
> Ce lot refait **le seuil du bi-classe**, **l'écran de l'onglet** et **le
> découpage de la passation en quatre écrans** — tout était empilé dans une
> colonne unique de `max-w-2xl`.

Fichiers de référence (à ouvrir côte à côte) :

- `Codex Examens (élève) - Wireframes.dc.html` — structures ; le tour 2 porte les
  deux organisations proposées pour l'onglet, **`2a` est retenu**, `2b` (trois
  bandes) est écarté.
- `Codex Examens (élève) - Rendu charte.dc.html` — les 6 écrans à l'échelle réelle
  (ordinateur/tablette 1040, téléphone 390). **C'est la référence de couleurs, de
  tailles et de libellés.**

---

## 1. Les fichiers concernés

| Écran | Route / composant | Ce qui change |
|---|---|---|
| **`1a` Seuil du bi-classe** | `app/eleve/ChoixClasseModule.tsx` | composition centrée ; les tuiles portent le niveau, le professeur et **l'état de la classe** |
| **`2a` Onglet Examens** | `app/eleve/modules/codex/examens/page.tsx` | deux colonnes : l'action à gauche, la mémoire dans un rail à droite ; **la ligne « Ce qui se rédige en classe » est supprimée** |
| — carte « Maintenant » | `components/examens/SignalDeLancement.tsx` | devient la carte forte de la zone « Maintenant » (titre Cormorant, bouton ocre) |
| — rail de mémoire | `components/examens/MesExamensPasses.tsx` | passe **à droite**, en retrait ; l'encart « À faire : n retour(s) à lire » devient la zone **« À lire »** de la colonne de gauche |
| **`1c` Déposer** · **`1d` Relire** · **`1e` Se juger** · **`1f` Retour** | `components/passation/EcranEleve.tsx` | les quatre temps deviennent **quatre écrans** au lieu de sections empilées ; fil des étapes en tête |
| Largeur de la page de passation | `app/eleve/modules/codex/passation/[depotId]/page.tsx` | `max-w-2xl` **tombe** : `1d` et `1f` sont à deux colonnes (le conteneur devient pleine largeur de module) |
| Idem côté Aletheia | `app/eleve/modules/aletheia/passation/[depotId]/page.tsx` et `.../examens/` | `EcranEleve` est **le même composant pour les deux modules** : le découpage s'applique aussi, avec le pigment d'Aletheia |
| En-tête / sous-onglets | `components/nav/EnTeteSite.tsx`, `SousNavModuleMobile.tsx` | **inchangés**, à une exception : voir §9.4 |

---

## 2. Jetons de couleur

Pigment du module posé par `data-module="codex"` (`app/globals.css`) — tous ces
jetons existent déjà :

| Rôle | Jeton | Valeur |
|---|---|---|
| Pigment (identité, **fil des étapes**) | `--pigment` | `#2E4A3C` |
| Teinte du pigment (étapes faites) | `--pigment-teinte` | `#DCE6DF` |
| Fond de module | `--fond-module` | `#F0EADE` |
| Cartes | `--surface` | `#FBF8F1` |
| Carte en retrait / bandeau d'étapes | — | `#F7F2E8` |
| **Rail de mémoire** (`2a`, colonne de droite) | — | `#F4EEE2` |
| Bordure | `--bordure` | `#E4DBC9` |
| Bordure de bouton secondaire | — | `#DFD4BE` |
| Encre / encre douce / tertiaire | `--encre` / `--encre-douce` / `--muet` | `#221C16` / `#5A4632` / `#8A6F4E` |
| Réussi | `--ok` / `--ok-teinte` | `#5B6E4A` / `#E4E8D8` · bandeau `#EFF2E7`, bordure `#C8D0B7` |
| Attention (échéance, « à lire », page manquante) | `--attention` / `--attention-teinte` | `#8A5A22` / `#EFE4CF`, bordure `#E0CBA8` · variante encart `#FBF3E6` / `#E6C98F` / `#8A6A2E` |
| En attente (retour en préparation) | — | `#E6ECF0` / `#3F5F75` / `#CBDAE3` |
| Liseré Codex (filet sous l'en-tête) | `--liseret` | `#6E2A2C` |
| Onglets (config existante) | `ongletActifFond` / `ongletActifTexte` / `ongletInactif` | `#D0DED5` / `#2E4A3C` / `#56685E` |

**Boutons estompés** (préférence projet, cf. `CLAUDE.md` — jamais d'aplat franc) :

| Emploi | Fond | Texte |
|---|---|---|
| **Dépôt / photo** (`Déposer ma copie`, `Prendre une photo`) — ocre | `#AC8552` | `#FBF5EA` |
| **Validation** (`Envoyer`, `Valider ma copie`, `Envoyer et terminer`, `J'ai lu mon retour`) — vert | `#737F5E` | `#F1F3E9` |
| **Bascule de vue** (`Mon texte / Ma photo`, `Mon retour / Mon texte`) — noyer | `#6B5A46` | `#F1EADD` |
| Secondaire | `#FBF8F1`, bordure `#DFD4BE` | `#4A3A28` |
| **Désactivé** (`J'ai lu mon retour` non déverrouillé) | `#EDE5D6`, bordure `#DFD4BE` | `#B4A489` |
| Destructif discret (`Retirer`, `✕`) | `#FBF3F1`, bordure `#E3CBC6` | `#7A3B34` |

**Surlignage** — un seul emploi ici : *ce que la machine a mal lu* et *le passage
cité par le professeur*, fond `#F3E5C4`, filet bas `#D9BD82`. La sélection élève
(`#DCE6DF` + filet `#2E4A3C`) ne sert pas dans cet onglet.

**Vignettes de photo** : placeholder hachuré
`repeating-linear-gradient(135deg,#ECE4D6 0 7px,#E4DACA 7px 14px)`, bordure
`#DFD4BE` — à remplacer par la vraie image, mêmes dimensions.

**Polices** (déjà en place) : Cinzel = sur-titres en petites capitales ·
Cormorant Garamond = titres d'écran et noms de classe · EB Garamond = corps,
sujets, texte de l'élève, retour · Alegreya Sans = boutons, pastilles, onglets,
horodatages.

---

## 3. Écran `1a` — le seuil du bi-classe

`app/eleve/ChoixClasseModule.tsx`. Le texte + deux boutons deviennent une
**composition centrée** (colonne de 640, centrée dans la page ; 62 px de blanc
au-dessus) :

1. **Ornement** : filet de 150 px coupé d'un losange de 7 px (`#C9B896`).
2. Sur-titre Cinzel 11 / `.15em` — « Ce qui se passe en classe ».
3. Titre **Cormorant 700 / 38** (téléphone : 30) — « Quelle classe ? ».
4. Une phrase EB Garamond 17 / 1.6, centrée, `max-width: 44ch`.
5. **Deux tuiles** (grille 1fr 1fr ; téléphone : empilées) : nom de classe en
   Cormorant 700 / 25, méta en Alegreya 13 `--muet` (matière · professeur ·
   jours), puis **une pastille d'état**. Liseré gauche 3 px : **ocre `#AC8552`
   quand la classe a quelque chose d'ouvert**, `#DFD4BE` sinon.
6. Ornement plus court, puis la ligne existante « Tu peux changer de classe à
   tout moment depuis le commutateur, en haut. » (italique, `--muet`).

⭐ **Ce qui rend le choix possible** : la tuile dit *pourquoi* entrer dans cette
classe (« 1 dépôt ouvert maintenant », « 1 retour à lire »). Les deux compteurs
se lisent avec les portes déjà en place (`signauxDeLancement`,
`examensEnClasseDeLEleve`) — **par classe**, pas agrégés.

⛔ Pas de sceau géant, pas d'illustration, pas de troisième tuile « toutes les
classes » : le module se travaille une classe à la fois (C7·L2).

---

## 4. Écran `2a` — l'onglet Examens

`app/eleve/modules/codex/examens/page.tsx`. **La ligne « Ce qui se rédige en
classe : la synthèse en classe et les examens diagnostiques. » disparaît** — les
intertitres portent l'information.

Grille `1fr 322px`, `gap: 30px`, padding `26px 26px 34px`.

**Colonne de gauche — ce qui demande un geste.** Deux zones, chacune ouverte par
un intertitre : Cinzel 11 / `.13em` + **filet 1 px `#DFD4BE`** qui court jusqu'au
bord + une mention à droite.

1. **Maintenant** (mention : pastille `attention` « à déposer avant 15 h 40 »).
   Carte `--surface`, liseré gauche 3 px ocre : point de 9 px `#AC8552` +
   sur-titre « Le dépôt est ouvert » ; titre **Cormorant 700 / 27** ; une ligne
   EB Garamond 16,5 ; **bouton ocre** « Déposer ma copie » avec la glyphe
   appareil-photo. Une carte par signal (`SignalDeLancement`).
2. **À lire** (mention italique : « un retour non lu bloque la remise
   suivante »). Carte à liseré ocre : titre EB Garamond 600 / 20, sous-ligne
   « 3 points · publié le 24 août par M. Fournier », **bouton secondaire**
   « Ouvrir mon retour ». Zone absente s'il n'y a rien à lire.

**Colonne de droite — la mémoire.** Panneau `#F4EEE2`, bordure `--bordure`,
rayon 12, padding `17px 18px`. Deux listes (`Mes examens passés`,
`Mes synthèses en classe`), chacune : sur-titre Cinzel + compte à droite, puis
des lignes séparées par des **filets 1 px `#E4DBC9`** — titre EB Garamond 15 +
pastille d'état (`à lire` / `en préparation` / `lu`, cette dernière à `.62`
d'opacité). Aucune bordure de carte : c'est un rail, pas une pile.

**Téléphone** : les deux zones de gauche en pleine largeur, puis une zone
**Mémoire** où les deux listes sont **repliées** en deux dépliants de 48 px
(« Mes examens passés · 3 »).

**Vide** : si rien n'est ouvert, rien à lire et rien de passé, garder le texte
actuel (« Rien en classe pour le moment… ») dans une carte centrée.

---

## 5. La passation — quatre écrans, un fil

`components/passation/EcranEleve.tsx`. Les sections empilées deviennent quatre
états successifs d'un même écran, chacun avec :

- **Barre de contenu** : « ← Examens » · titre en Cormorant 23 · mention à droite
  (« en classe · 1re B », « copie envoyée · 2 pages », « copie validée »,
  « publié le 27 août · M. Fournier »).
- **Fil des quatre temps** (bandeau `#F7F2E8`) : fait = `#DCE6DF` + ✓ ·
  courant = plein `#2E4A3C` · à venir = filet `#E4DBC9`, texte `--muet`.
  Libellés : `1 · Déposer`, `2 · Relire`, `3 · Se juger`, `4 · Retour`.
  Le fil n'affiche que les temps réellement servis (si `seJuger`/`confiance` ne
  sont pas servies, trois temps).
- Sur téléphone, le fil est remplacé par une pastille `1 / 4` dans la barre.

Le passage d'un temps au suivant reste commandé par l'état du dépôt, comme
aujourd'hui (`dejaTranscrit`, `vue.valide`, `vue.retourPublie`) : **aucun
routage nouveau**.

### 5.1 `1c` — Déposer (étape 5)

Colonne de 700 centrée. Dans l'ordre, et rien d'autre :

1. **Le sujet** — carte `--surface`, sur-titre Cinzel, texte EB Garamond 17 /
   1.58, puis le **rappel de lisibilité** en italique `--muet` (une ligne, jamais
   un encart ; `06-` §1 règle 1 — et il ne se sert pas à l'élève au clavier).
2. **Tes pages** — carte contenant, dans cet ordre :
   - **un seul bouton, ocre, pleine largeur** : « Prendre une photo »
     (Alegreya 600 / 17, padding 18 ; **téléphone : 18 px, min-height 70**, c'est
     le plus gros objet de l'écran). ⛔ **Pas d'entrée « choisir un fichier » à
     l'ordinateur.** Sur téléphone seulement, un lien texte secondaire
     « Choisir dans mes photos » sous le bouton.
   - la **liste numérotée** des pages : numéro Cinzel, vignette 50 × 64,
     « Page n » + état, puis `Tourner` · `↑` · `↓` · `Retirer` (boutons
     secondaires ; **46 px sur téléphone**, où `↑ ↓` disparaissent au profit du
     glisser).
   - une page manquante = ligne `#FBF3E6` / bordure `#E6C98F`, mention en
     italique « Page déclarée manquante » (piège 12).
   - lien « Une page manque ou est illisible ».
3. **Pied** : une ligne italique (« Après l'envoi, la machine lira ta copie… ») +
   **bouton vert** « Envoyer mes n pages ».

**L'attente** (`vue.attente`) : écran centré — vignette hachurée, titre Cormorant
26 « La machine lit ta copie », deux lignes, **barre de progression ocre**, et
« Tu peux fermer l'écran : le travail continue. » En cas de
`echec_definitif`, garder l'encart `attention` actuel (« Préviens ton professeur :
ta copie papier reste la preuve »).

### 5.2 `1d` — Relire (étapes 6 à 8)

**Les consignes passent en tête, en trois lignes numérotées** — bandeau
`#F7F2E8`, sur-titre « Avant de relire » + pastille `attention` « la machine se
trompe parfois », puis trois colonnes (téléphone : trois lignes), chiffres en
Cormorant 20 ocre :

1. **Corrige ce qu'elle a mal lu.** C'est ce texte-là qui sera lu ensuite, pas la photo.
2. **Tu peux ajouter du texte** si tu veux : finir une phrase, compléter une idée. C'est permis.
3. **Garde tes paragraphes** tels que tu les as écrits : une ligne vide entre deux.

Puis une grille `376px 1fr` :

- **à gauche, la photo** : sur-titre « Ta copie » + « page n sur m », l'image
  (min-height 376), et deux boutons secondaires de page.
- **à droite, le texte** : sur-titre « Ce que la machine a lu » + « tu peux tout
  modifier » ; l'encart des doutes (`#FBF3E6` / `#E6C98F`) — « Deux endroits où
  elle a hésité — vérifie-les », les extraits cités avec le mot surligné et un
  lien « voir » (**la liste des endroits, jamais un nombre**) ; le champ sur fond
  blanc, bordure `#DFD4BE`, EB Garamond 17 / 1.68, pied « n paragraphes — une
  ligne vide les sépare » + compte de signes ; enfin
  `Enregistrer sans valider` (secondaire) · « Après validation, ton texte ne
  bouge plus. » · **`Valider ma copie`** (vert).

**Téléphone** : consignes, puis **bascule noyer `Mon texte / Ma photo`**, puis
doutes, champ, bouton. Les deux vues ne se disputent jamais l'écran.

Pour l'élève au clavier (`auClavier`), même écran sans la colonne photo et sans
l'encart des doutes ; le refus de collage et sa journalisation restent inchangés.

### 5.3 `1e` — Se juger (étapes 9 et 10)

**Écran propre, servi seulement après validation du texte.** Colonne de 620
centrée :

- bandeau `#EFF2E7` / `#C8D0B7`, point vert : « **Ta copie est rendue.** Deux ou
  trois questions avant de partir. » ; mention « ça ne se note pas » à droite du
  fil.
- une **carte par question** : énoncé EB Garamond 18, réponses en boutons de
  48 px côte à côte (téléphone : empilés). Sélection : fond `#E4E8D8`, bordure
  `#A9B58F`, texte `#46523A`.
- **bouton vert** « Envoyer et terminer », puis « Ton retour arrivera ici quand
  ton professeur l'aura relu. Tu recevras un signal. »

La crédence (`vue.credence.servie`), quand elle est servie, prend la même forme
de carte, en premier, **une par cas** (jamais une seule pour une paire).

### 5.4 `1f` — Le retour

Grille `404px 1fr`.

- **À gauche : « Ce que tu as écrit »** — le texte de l'élève, EB Garamond 16,5 /
  1.66, dans une carte `--surface` qui **défile seule** (mention italique en
  pied) ; le passage cité par le point sélectionné est surligné `#F3E5C4`. En
  dessous, dépliant « Revoir mes photos · 2 pages ».
- **À droite** : « Ce que ton professeur en dit » (commentaire général,
  EB Garamond 17 / 1.6) ; puis **« Point par point »** + mention « coche chaque
  point quand tu l'as lu ».
  Chaque point : **case à cocher 24 px** (téléphone : 28), pastille de compétence,
  nature en italique (« ce qui tient » / « ce qui manque »), texte, puis — s'il y
  a ancrage — la citation et le lien **« voir dans mon texte → »** qui surligne le
  passage à gauche (téléphone : bascule vers « Mon texte »). Liseré gauche 3 px :
  `#C8D0B7` pour ce qui tient, `#E0CBA8` pour ce qui manque.
  Point sans ancrage : pas de bloc citation, rien d'autre ne change.
- **« Pour la prochaine fois »** (`feedForward`) : carte `#F7F2E8`, **filet haut
  3 px ocre**.
- **Pied** : « **n point(s) coché(s) sur m.** Coche les trois pour valider ta
  lecture — sans elle, tu ne peux rien rendre d'autre. » + bouton
  **`J'ai lu mon retour`**, **désactivé tant que les cases ne sont pas toutes
  cochées**. Sur téléphone, ce pied est **collé en bas**.
- Une fois `luLe` renseigné : garder la ligne actuelle « Lecture validée le … »
  et retirer le pied.
- Retour vide (`points.length === 0`) : garder la ligne en italique existante ;
  le bouton est alors actif d'emblée (rien à cocher).

---

## 6. Téléphone — ce qui est non négociable

- Cible minimale 44 px partout ; les boutons pleins sont à 48 px, le bouton photo
  à **70 px**.
- Un seul bouton primaire visible par écran.
- Les listes de mémoire sont repliées (`2a`), les vues concurrentes sont derrière
  une bascule (`1d`, `1f`), le pied du retour est collé.
- Aucune colonne à deux volets : les grilles `1d` et `1f` deviennent une bascule.

---

## 7. Ce qui ne change pas

- L'ordre et le contenu des étapes 5 à 10, et le fait que le professeur ouvre le
  dépôt (aucune minuterie à l'écran).
- Le `<textarea>` seul (pas de `contenteditable`, pas de normalisation à la
  frappe), le compteur de blocs qui **montre** le découpage sans le corriger.
- Le collage **non bloqué** sur la transcription, **bloqué et journalisé** sur la
  rédaction au clavier de l'élève exempté.
- `confiance_ocr` → une **liste d'endroits**, jamais un nombre.
- Aucune question sur ce que l'élève n'a pas compris (piège 26).
- `lu_at` : un seul geste, un seul domicile — **sur le retour**.
- Les deux gardes de l'onglet (module inactif, seuil de module) et leurs textes.

---

## 8. Recette

- [ ] La ligne « Ce qui se rédige en classe » n'existe plus.
- [ ] `2a` : rail de mémoire à droite en `#F4EEE2`, aucune carte bordée dedans ;
      sur téléphone, les deux listes sont repliées.
- [ ] Un élève bi-classe voit deux tuiles, chacune avec **son** état ; la classe
      qui a un dépôt ouvert porte le liseré ocre.
- [ ] `1c` : **un seul** bouton photo à l'ordinateur ; sur téléphone il fait
      70 px et vient avant la liste des pages.
- [ ] Une page déclarée manquante garde son rang dans la numérotation.
- [ ] `1d` : les trois consignes sont visibles **sans défiler** ; le mot
      « ajouter » y figure ; la photo est à gauche à l'ordinateur.
- [ ] `1e` n'apparaît **pas** avant la validation du texte, et n'affiche plus rien
      d'autre que ses questions.
- [ ] `1f` : le texte de l'élève est à gauche ; « voir dans mon texte » surligne
      le bon passage ; le bouton reste gris jusqu'à la dernière case cochée, et le
      compte est écrit à côté.
- [ ] Aucune note, lettre, pourcentage ni chiffre de confiance sur les six écrans.
- [ ] Les six écrans passent en 390 de large sans débordement horizontal.

---

## 9. Points à trancher avant intégration

1. **Les cases à cocher du retour** (`1f`) — la maquette les traite comme un
   **état local de l'écran** : elles déverrouillent le bouton, elles ne sont pas
   persistées. Si l'on veut savoir *quels* points ont été cochés, il faut une
   colonne, donc un contrat de données — **hors périmètre de ce lot**. À dire
   explicitement au moment de l'intégration.
2. **`1e` regroupe « Te juger » et « Comment te sens-tu »** (et la crédence
   quand elle est servie) sur un écran, avec **un seul bouton d'envoi** — alors
   que le code a trois actions (`actionSeJuger`, `actionConfianceRemise`,
   `actionCredence`). Deux options : un bouton qui les appelle en séquence, ou
   trois formulaires visuellement fondus dans le même écran. À arbitrer côté
   implémentation ; la doctrine (une valeur par compétence, une crédence par cas)
   ne bouge pas.
3. **Le fil des quatre temps garde le pigment `#2E4A3C`** et non un jeton
   estompé : c'est un indicateur d'étape, pas un contrôle. Les vraies bascules
   (`Mon texte / Ma photo`, `Mon retour / Mon texte`) prennent bien le noyer
   estompé.
4. **L'en-tête du module perd sa ligne italique** (« Ce que tu écris à la
   maison… ») dans cet onglet : elle est fausse ici, et c'est le même esprit que
   la mention supprimée. Si l'en-tête doit rester strictement identique entre les
   deux onglets, il faut une ligne propre à Examens — à choisir.
5. **Aletheia** : `EcranEleve` étant partagé, les quatre écrans arrivent aussi
   dans `app/eleve/modules/aletheia/passation/[depotId]` — mêmes structures, avec
   le pigment d'Aletheia. À faire dans le même lot ou à planifier.
