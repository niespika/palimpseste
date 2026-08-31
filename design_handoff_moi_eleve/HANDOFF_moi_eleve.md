# Handoff — `/eleve/moi` · l'onglet « Moi » (rendu charte)

> Pour Claude Code. Objectif : **rendre lisibles les six compétences**. Le contenu est bon,
> l'empilement ne l'est pas : aujourd'hui une seule colonne `max-w-lg` porte *Moi* →
> *Ma classe* → *Où j'en suis* (les six compétences dans un même bloc `divide-y`, de hauteur
> variable selon les forces) → *Ta prochaine étape* → *Les six compétences expliquées* →
> *Déconnexion*. Les six se lisent comme un seul pavé, et le geste concret — la seule chose
> actionnable — arrive après.
> On **réorganise la présentation** de `app/eleve/moi/page.tsx` **sans toucher aux règles** de
> `utils/eleve/profil.ts` ni au chargeur `profil-serveur.ts`.
> **Deux tailles d'écran** dessinées : téléphone et ordinateur.

## Références visuelles
Deux fichiers HTML accompagnent ce document (ouvrir dans un navigateur) :
- **`Moi (élève) - Rendu charte.dc.html`** — la cible : l'écran ordinateur (1040), puis les
  **deux états téléphone** (interrupteur des lettres grisé « rien à lever », puis poussé).
- **`Moi (élève) - Wireframes.dc.html`** — le « pourquoi », du plus récent au plus ancien :
  **tour 4 = `4a` (ordinateur) et `4b` (téléphone), l'option retenue** ; tour 3 = les trois
  places possibles pour « ta prochaine étape » (`3a` bandeau · `3b` pied de colonne · `3c` pied
  de barre latérale) ; tour 2 = les deux niveaux (`2a` tuiles · `2b` table) ; tour 1 = les
  premières découpes. Canvas : glisser / zoomer.

Reproduire le **langage visuel** avec les jetons du codebase (`globals.css`, `next/font`) —
**aucune couleur ni police en dur** : `bg-surface`, `border-bordure`, `text-encre`,
`text-encre-douce`, `text-muet`, `text-ok`, `text-attention`, `bg-attention-teinte`,
`bg-parchemin-fonce`, `font-titre`, `font-ui`.

---

## Ce qui existe (à lire avant de coder)
- **`app/eleve/moi/page.tsx`** — la page (Server Component) : lit le profil, dédoublonne les
  motifs du silence, monte la bascule des lettres. **C'est le seul fichier à ré-agencer.**
- **`utils/eleve/profil.ts`** (pur) — `motDuDecompte()`, `motDeLaProgression()`,
  `listeDesForces()` + `INTITULE_DES_FORCES`, `lettreVisible()`, `phraseDuGeste()`,
  `dimensionsRegardees()`. **Les mots que l'élève lit sortent d'ici, verbatim.**
- **`utils/eleve/profil-serveur.ts`** — `chargerLeProfilDeLEleve()` : `competences[]`,
  `lettres`, `geste`, `incidents`. Le type ne porte **aucun** des six champs interdits
  d'`ObservableEleve` (RR4) : ne pas l'élargir.
- **`app/eleve/moi/BasculeDesLettres.tsx`** — l'interrupteur ; son emplacement change, pas son
  contrat.
- **`app/eleve/moi/competences/page.tsx`** — les six fiches génériques. **Reste en place**, mais
  n'est plus le seul endroit où l'élève apprend ce qu'on mesure (voir ci-dessous).
- **`app/eleve/layout.tsx`** + **`components/nav/EnTeteSite.tsx`** + **`BarreOngletsMobile.tsx`**
  — la chrome. **Intacte**, et c'est ce qui permet de retirer le sélecteur de classe de la page.

> Règle d'or : **c'est de la présentation.** Aucune Server Action, aucun contrat de données,
> aucun seuil ne change.

---

## La structure retenue

### Ordinateur (`4a`) — colonne des six + détail en deux colonnes
1. **En-tête du site : on n'y ajoute rien.** Les deux barres existent déjà et coûtent ~175 px
   (Barre 1 : onglets + chip de classe + déconnexion ; Barre 2 « hors module » : médaillon,
   marque, devise de la maison — `/eleve/moi` n'est pas un module, donc ni sceau ni sous-onglets).
2. **Bande de page** sous l'en-tête : titre **« Moi »** (`font-titre`) + nom et classe en italique.
3. **Colonne des six (200 px)** — une carte par compétence : nom, **jauge de quatre crans**,
   et « travaillé N fois · état ». La compétence ouverte porte le liseré gauche + le fond
   `bg-parchemin-fonce`. En pied : **l'interrupteur des lettres**, puis la phrase « quatre
   exercices, et on peut dire où tu vas ».
4. **La compétence choisie**, à droite, en une carte :
   - **en-tête** : nom (`font-titre`, 28), jauge, « travaillé 4 fois · en progrès », et
     l'emplacement de la lettre ;
   - **colonne gauche — « Ce que ton travail a montré »** : la pastille *Tu es au point sur*
     et la liste des dimensions, puis **« Les quatre exercices comptés »** (titre + date) ;
     en **pied de cette colonne**, sur fond teinté, **« Ta prochaine étape »** ;
   - **colonne droite — « Ce qu'on regarde dans <la compétence> »** : le paragraphe de la
     fiche servi tel quel, puis **« Les points regardés · tes marques »** — toutes les
     dimensions, celles qui sont acquises marquées « au point ».

### Téléphone (`4b`) — six tuiles, puis la fiche
1. **Aucun sélecteur de classe dans la page** : il est dans le bandeau mobile du layout.
2. **« Ta prochaine étape »** en tête, sur fond teinté.
3. **Ligne de titre** : surtitre *Mes six compétences* et, à droite, **l'interrupteur des
   lettres** — la ligne fait **44 px**, la zone tapable couvre la pastille *et* son libellé.
4. **Six tuiles, grille 2 × 3** : nom, jauge, « 4 fois · en progrès » / « 3 fois sur 4 » /
   « jamais travaillé ». Lettres affichées **dans la tuile** quand l'interrupteur est poussé.
5. **« Se déconnecter »** en pied.
6. **La fiche d'une compétence** (niveau 2, dessinée au tour 2 de `Moi (élève) - Wireframes`) :
   progrès en haut, puis **« Ce qu'on regarde dans ta copie » en dépliant fermé**, puis la
   prochaine étape, puis les flèches vers les compétences voisines.

> **Les six tiennent dans un écran.** Les maquettes téléphone sont dessinées dans un gabarit
> **390 × 700** — le viewport web réel une fois la chrome du navigateur et la **barre tactile
> (56 px + safe-area)** déduites. C'est la contrainte à tenir : voir les six sans défiler.

---

## ⛔ Sept garde-fous — la maquette est une image, le code a des règles

1. **RR4 NE S'ASSOUPLIT PAS.** Aucun `code` d'observable, aucun `sens`, aucun `taux`, aucun
   `tauxFenetre`, aucun `reussies`/`denominateur`, aucune `serie`. La coupure est dans le
   **type** (`profil-serveur.ts`) : si un champ manque à l'écran, c'est voulu — ne pas
   l'ajouter au chargeur.
2. **LES SEULS NOMBRES AUTORISÉS SONT `n` ET LA FENÊTRE.** La **jauge de quatre crans** est le
   rendu de `n` sur `FENETRE_EVIDENCE` — un **décompte réel**, jamais un pourcentage, jamais
   une barre de progression continue. « 3 fois sur 4 » se lit tel quel.
3. **LES MOTS VIENNENT DE `profil.ts`, VERBATIM.** `motDuDecompte()`,
   `motDeLaProgression()`, `INTITULE_DES_FORCES` (« Tu es au point sur : » — et l'intitulé
   **finit par « sur : »**, la puce doit rester un *sujet*), `phraseDuGeste()`. Les libellés de
   dimension sortent de `dimension_eleve` **sans rien qu'on leur ajoute** : ils portent leur
   propre ponctuation. Les phrases de la maquette sont indicatives.
4. **LA LETTRE DEMANDE LES TROIS CONDITIONS**, et c'est `lettreVisible()` qui tranche —
   `competences_affichage_actif` **et** pas de `profil_provisoire` **et** le choix de l'élève.
   Le rendu charte le montre : à l'état poussé, **deux tuiles sur six** portent une lettre.
   Le cadre pointillé « lettre » des maquettes marque l'emplacement, **il ne s'affiche pas**.
5. **L'INTERRUPTEUR RESTE À SA PLACE, MÊME QUAND IL NE PEUT RIEN LEVER** — décision de Louis,
   29/08. Il est alors **grisé et porte « Rien à afficher »** (état de la rentrée : profil qui
   se stabilise, ou lettres non ouvertes cette année). ⚠️ **C'est un changement de
   comportement** par rapport au code actuel, qui ne monte la bascule que si
   `laBasculeAUnSens` : la garde devient *désactivé* au lieu de *absent*.
   ⛔ Et **l'élève n'apprend jamais le nom d'un interrupteur** (`07-` §5) : « Rien à afficher »,
   jamais « porte fermée » ni « `profil_provisoire` ». La phrase de `lettreVisible()` reste
   disponible en explication, dite **une seule fois**, jamais une fois par compétence.
6. **LE GESTE N'EST RATTACHÉ À AUCUNE COMPÉTENCE** tant que `cible_retenue` /
   `cible_primaire` sont vides — ce qui est le cas partout aujourd'hui. Il se dit donc
   « **le dernier conseil que Calame t'a donné** », jamais « ton geste pour l'Expression »,
   **même s'il est dessiné dans le cadre d'une compétence** (`3b` retenu). C'est
   `phraseDuGeste()` qui choisit, et `published_at` qui autorise : un retour non publié ne se
   montre jamais.
7. **UNE LECTURE RATÉE SE DIT.** Le bandeau `profil.incidents` reste en tête de page, mot pour
   mot. Un profil vide affirmé serait un mensonge.

---

## Ce qui manque aux données (à trancher avant de coder)

- **« Les points regardés » de la colonne droite** demandent, par compétence, **toutes** les
  dimensions + **lesquelles sont acquises**. Les dimensions existent
  (`dimensionsRegardees()` sur `competences_correspondance.dimension_eleve`) ; l'état acquis
  n'arrive aujourd'hui que par `forces` (`listeDesForces`). Le croisement « toutes les
  dimensions, marquées quand elles sont dans `forces` » **se fait à l'écran, sans nouveau
  champ** — et une dimension non marquée n'est **pas** dite « non acquise » : la légende est
  « sans marque : pas encore assez d'exercices pour le dire ».
- **« Les quatre exercices comptés »** (liste titre + date de la colonne gauche) n'est **pas**
  dans `ProfilEleve`. C'est la liste des `mesuresQuiComptent` de la compétence.
  **Si l'obtenir demande d'élargir le chargeur au-delà d'un titre et d'une date, ne pas la
  rendre** : le bloc disparaît et la colonne gauche se limite aux forces. ⛔ En aucun cas cette
  liste ne porte de résultat, de note ou d'état par exercice — ce serait la matrice du
  professeur.
- **Le paragraphe « Ce qu'on regarde dans <la compétence> »** vient du `### 1.1` de
  `competences_fiches.contenu` — déjà lu par `chargerLesFichesDeCompetence()`. **On ne le
  résume pas, on ne le reformule pas** ; rendu en gras/italique seulement
  (`utils/deroule/balisage.ts` + `TexteBalise`). La page `/eleve/moi/competences` **reste** :
  la fiche est générique, le profil est personnel — même onglet, sources séparées.
- **L'ordre des six** : celui du référentiel (`COMPETENCES`), pas un tri par `n`. Les maquettes
  montrent les mieux mesurées en tête pour la démonstration ; **trancher explicitement** —
  un ordre stable est préférable pour que l'élève retrouve sa compétence au même endroit.

## Rappels charte
- Jetons de couleur, jamais de hex en dur. Valeurs de la maquette, pour l'œil : parchemin
  `#FBF8F1` / `#F6F1E5` / `#F4EEE2`, bordure `#E4DBC9`, encre `#221C16`, muet `#8A6F4E`,
  ok `#737F5E` / teinte `#EFF2E7` · `#E4E8D8`, attention `#8A6A2E` / teinte `#FBF3E6`.
- **Boutons estompés** (préférence projet, cf. `CLAUDE.md`) : noyer `#6B5A46` sur `#F1EADD`,
  ocre `#AC8552` sur `#FBF5EA`, validation `#737F5E` sur `#F1F3E9` — jamais d'aplat franc.
  L'interrupteur des lettres poussé prend le **vert estompé**.
- Titres en `font-titre` (Cormorant Garamond), corps en EB Garamond, UI et surtitres en
  `font-ui` (Alegreya Sans) — surtitres en majuscules, tracking `.11em`.
- **Cibles tactiles ≥ 44 px** partout sur téléphone, interrupteur compris.
- Compétence jamais mesurée : bordure **pointillée** et encre estompée (`Connaissance` dans
  les maquettes) — l'absence se voit sans se reprocher.

## Hors périmètre
La matrice du professeur, la fiche de compétence elle-même (`/eleve/moi/competences`), le
déroulé d'un exercice, « Ma semaine », le calendrier. Et l'ouverture des lettres, qui est une
décision de classe, pas un écran.

## Checklist
- [ ] En-tête du site intacte ; **sélecteur de classe retiré de la page** (il est dans la chrome).
- [ ] Ordinateur : colonne des six à **200 px** + détail en **deux colonnes**, jamais empilé.
- [ ] Téléphone : **six tuiles en 2 × 3 visibles sans défiler** dans un viewport 390 × 700, barre tactile comprise.
- [ ] Interrupteur des lettres **à droite de « Mes six compétences »**, ligne de **44 px**, **grisé + « Rien à afficher »** quand il ne peut rien lever.
- [ ] Lettres affichées **seulement** là où `lettreVisible()` le permet.
- [ ] Jauge de quatre crans = `n` / `FENETRE_EVIDENCE` ; aucun taux, aucun seuil, aucun pourcentage.
- [ ] Mots repris **verbatim** de `profil.ts` ; motif du silence dit **une seule fois**.
- [ ] « Ta prochaine étape » en pied de la colonne du travail, **sans nommer de compétence**.
- [ ] « Ce qu'on regarde » **dans la fiche de la compétence** (deuxième colonne sur ordinateur, dépliant sur téléphone) — la page des six fiches reste accessible.
- [ ] Bandeau d'incidents conservé mot pour mot.
- [ ] « Se déconnecter » en pied d'écran sur téléphone.
