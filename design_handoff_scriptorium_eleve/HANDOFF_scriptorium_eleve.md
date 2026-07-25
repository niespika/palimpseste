# Handoff — Scriptorium · face ÉLÈVE (rendu charte)

> Pour Claude Code. Objectif : **désengorger la page élève du Scriptorium**. Aujourd'hui un
> seul écran mélange trois choses — l'espace de dialogue avec le tuteur, le **plan du cours**,
> et l'historique des conversations. Le dialogue et l'historique cohabitent très bien ; le plan,
> lui, doit **partir ailleurs**. On introduit donc **deux sous-onglets** portés par la bande
> « seuil du module » du **nouvel en-tête** : **« Plan de cours »** et **« Discussion »**.
>
> - **Plan de cours** → le plan seul, **lisible d'un coup d'œil** (dates, « vu » / « cette
>   semaine » / « à venir » repérables par **couleur + jeux de police**, sobrement).
> - **Discussion** → l'échange **+** l'historique des conversations, refondus en
>   **espace épistolaire** : l'élève doit avoir le sentiment de s'asseoir à un écritoire.
>
> **C'est de la présentation + une réorganisation de navigation, pas de la logique.** Le streaming,
> le quota, les Server Actions (renommer/supprimer), le RAG et le **DTO anti-spoiler du plan**
> ne changent pas. **Périmètre : desktop uniquement** (voir Chantier 4).

---

## Révision du 24/07 — ce qui change

Ce handoff a déjà été livré une fois. Trois choses changent ; le reste est inchangé et
reste valable. **À comparer point par point si une implémentation a déjà commencé.**

| # | Ce qui change | Avant (handoff initial) | Maintenant |
|---|---|---|---|
| 1 | **Mobile retiré** | Maquettes iPad `2a`/`2b` + mobile `2c`/`2d`/`2e`, Chantier 4 « Responsive » détaillé, décision en attente sur la piste mobile | **Plus aucune maquette mobile ni iPad.** Remplacées par le § **Contraintes responsive minimales** (Chantier 4). Le mobile est traité au **chantier C10a** (passe élève mobile-first). La « décision en attente » sur les pistes `2d`/`2e` est **annulée** — sans objet. |
| 2 | **Onglets & commutateur** | Onglets « Plan de cours · Discussion », intitulés parfois notés « Parcours » | Intitulés **harmonisés vers « Plan de cours · Discussion »** (plan de rentrée). Les onglets sont **les sous-onglets du module** : ils vivent dans la **bande seuil** (`SousNavModule`) — **interdiction d'ajouter une barre d'onglets locale à la page**. Nouveau : **commutateur de vue « Année \| Parcours »** dans Plan de cours, **absent en v1** (règle ci-dessous). |
| 3 | **Discussion épistolaire** | Messagerie soignée : bulles gauche/droite, fond `pigment-teinte` pour l'élève, labels de locuteur | **Refonte de la surface** en *correspondance continue* : colonne unique sur un feuillet, voix distinguées par **typographie et mise en page**, **jamais par un aplat de couleur**. Séparateur de jour au lieu d'horodatages, écritoire au lieu d'un champ de messagerie, amorces en invitations, bandeau de transparence promu en **billet**. Voir Chantier 3 — il **remplace** l'ancien Chantier 3. |

**Ce qui ne change pas** : l'architecture concernée, le Chantier 1 (mécanique `?vue=`), le
Chantier 2 pour la **vue Parcours** (intacte, ne pas la redessiner), les rappels charte,
le hors-périmètre, et surtout : **aucune fonctionnalité nouvelle**.

---

## Références visuelles

Un fichier HTML accompagne ce document (ouvrir dans un navigateur, double-clic) :
**`Scriptorium Élève - Rendu charte.dc.html`** — cible hi-fi fidèle à la charte, en mode canvas
(pan/zoom). C'est lui qui **fait foi**. Écrans, repérés par un badge d'id :

**Onglet Plan de cours**
- `1a` — **cible** : vue Parcours active, commutateur **Année | Parcours** présent.
- `1b` — **v1** : le même écran **sans le commutateur** (+ la spécification de la vue Année à venir).

**Onglet Discussion — espace épistolaire, 5 états réels**
- `2a` — conversation **vierge** : billet de transparence (première utilisation) + amorces.
- `2b` — échange **en cours** : réponse en train de s'écrire + bouton **Stop**.
- `2c` — **réponse longue** : le rythme vertical sur la durée.
- `2d` — **quota atteint** : écritoire refermé, message doux.
- `2e` — **rail à plusieurs conversations** : `Renommer` / `Supprimer` révélés au survol.

Un second fichier documente le choix de direction : **`Scriptorium Élève - Discussion épistolaire
(explorations).dc.html`** — les trois partis explorés (`1a` correspondance continue *(retenu)*,
`1b` feuillets alternés, `1c` la page & la marge). **Il ne fait pas foi** : il explique pourquoi.

Reproduire le **langage visuel** avec les composants/conventions du codebase (React, jetons
Tailwind de `globals.css`, `next/font`, l'en-tête partagé). **Aucune couleur ni police en dur**
hors des valeurs déjà nommées dans le code (cf. § Rappels charte).

---

## Architecture concernée (existant — à lire avant de coder)

- **`app/eleve/modules/scriptorium/page.tsx`** — page serveur. Résout la classe active (cookie), gate `rag_actif`, puis prépare **tout** et monte `<ChatScriptorium>`. Fournit déjà :
  - `plan: PlanEleve` — **la donnée du Plan de cours** : `parcours[].{ titre, semaineCourante, nbSemaines, semaines[] }`, chaque semaine `{ k, lundi, courante, elements[] }`, chaque élément `{ libelle, statut }` avec `statut ∈ 'vu' | 'en_cours' | 'a_venir'`. **Titres et statuts SEULS** — aucun texte de contenu ne franchit ce DTO (règle anti-spoiler ; le contenu des semaines à venir n'existe que côté IA). **Ne pas élargir ce DTO.**
  - `conversations`, `convActive`, `quotaRestant`, `suggestions`, `premierUsage` — pour la Discussion.
  - Lit déjà `searchParams` (actuellement `?conv=`). **On y ajoute `?vue=`** (cf. Chantier 1).
  - `plan.parcours` est **déjà un tableau** : c'est ce qui rend la future vue Année triviale en donnée (une carte par entrée) — cf. Chantier 2.
- **`app/eleve/modules/scriptorium/ChatScriptorium.tsx`** — composant client, aujourd'hui **le point de confusion** : il rend à la fois (a) le rail des conversations `<aside>`, (b) le fil + composer, **et** (c) un **volet « Plan du cours »** (bouton `voletPlan` + panneau dépliable inline). C'est ce volet (c) qu'on **sort** de la Discussion pour en faire l'onglet Plan de cours. Le reste est **conservé** — c'est sa *surface* que le Chantier 3 refond.
- **`components/SousNavModule.tsx`** — les sous-onglets du module. Dans le nouvel en-tête il **se fond dans la bande 2** (zone centrale, sous la devise). **C'est le seul endroit où vivent « Plan de cours » et « Discussion ».**
- **`components/nav/EnTeteSite.tsx`** — en-tête partagé, Barre 2 = « seuil du module » : marque · **devise + sous-onglets au centre** · sceau. **Les sous-onglets sont aujourd'hui gatés `role === 'prof'`** (`montreSousOnglets = role === 'prof' && …`) et lisent `mod.sousOngletsProf`. Deux rendus existent : `SousOngletsRoute` (par route) et `SousOngletsParam` (par `?vue=`, sous `<Suspense>`). **Scriptorium est déjà en mode `?vue=`.**
- **`components/nav/configModules.ts`** — **source de vérité unique** de la Barre 2 (sous-onglets, devise, couleurs). `MODULES[scriptorium]` porte déjà `couleurs.onglet*` et une `devise`. Aujourd'hui seul `sousOngletsProf` existe.

> Note de cohérence avec `handoff_en_tete/` : cet en-tête prévoit **aucun sous-onglet côté élève**
> (Scriptorium élève = « devise seule »). Le présent handoff est donc **le premier cas** de
> sous-onglets élève — c'est exactement l'objet du Chantier 1. Rien à refondre dans l'en-tête :
> juste l'**alimenter** pour le rôle élève.

> Règle d'or : `page.tsx` continue de tout charger ; on **répartit l'affichage** entre deux onglets et on **déplace** le plan hors du fil. Le streaming (`/api/scriptorium/chat`), le quota, `renommer/supprimer`, l'URL `?conv=` et le DTO `PlanEleve` **ne changent pas de comportement**.

---

## Décisions validées par le porteur du projet

1. **Deux sous-onglets portés par la bande seuil du module** : « Plan de cours » · « Discussion ». **Pas** d'onglets dans le corps de la page, **pas** de fil d'Ariane, **pas** de second système d'onglets.
2. **Plan de cours = écran à part**, lisible **d'un coup d'œil** : dates, « vu » / « cette semaine » / « à venir » distingués par **couleur + graisse/italique**, sans surcharge.
3. **Commutateur « Année | Parcours »** spécifié, **vue Parcours par défaut et inchangée**, **vue Année non dessinée**, **commutateur absent en v1**.
4. **Discussion = espace épistolaire** (parti *correspondance continue*), échange + historique réunis. La refonte porte sur **le lieu**, pas sur la manière dont l'IA parle (ça se règle dans le prompt système, ailleurs).
5. **Anti-spoiler conservé** : le Plan de cours n'affiche que **titres + statuts** ; il ne dévoile pas la suite du cours (c'est voulu, on l'écrit à l'écran).
6. **Mobile hors périmètre** — chantier C10a. Ici : contraintes minimales seulement (Chantier 4).

---

## Chantier 1 — Les deux sous-onglets dans la bande seuil (navigation)

### Intention
Faire apparaître, **côté élève**, deux sous-onglets Scriptorium dans la bande « seuil du module »,
pilotés par **`?vue=`** (même mécanique que le prof), et router le contenu de la page en conséquence.

### ⚠️ Le point à ne pas rater
Ces onglets **ne sont pas** une barre d'onglets de page. Ils sont rendus par **`SousNavModule`
dans la bande 2 de l'en-tête**, au même endroit que les sous-onglets prof. **Ne créez pas** de
`<nav>` d'onglets dans `page.tsx` / `ChatScriptorium.tsx` : ce serait un **second système** de
navigation, en double avec l'en-tête. Si l'onglet actif n'apparaît pas, c'est la config/le rôle
qu'il faut corriger — pas une barre locale qu'il faut ajouter.

### À faire
1. **`configModules.ts`** — ajouter les sous-onglets élève de Scriptorium. Deux options, au choix de l'implémenteur (la 2ᵉ est la plus propre) :
   - étendre `ModuleConfig` d'un champ **`sousOngletsEleve?: SousOnglet[]`**, ou
   - un getter `sousOnglets(role)` renvoyant la bonne liste.
   Pour Scriptorium élève :
   ```ts
   sousOngletsEleve: [
     { href: '/eleve/modules/scriptorium?vue=plan',       label: 'Plan de cours', vue: 'plan' },
     { href: '/eleve/modules/scriptorium?vue=discussion', label: 'Discussion',    vue: 'discussion' },
   ]
   ```
   (Les autres modules laissent `sousOngletsEleve` vide → aucun changement pour eux.)
   **Libellés exacts** : « Plan de cours » et « Discussion ». Si du code ou une maquette dit
   encore « Parcours » pour cet onglet, **harmoniser vers « Plan de cours »** (« Parcours » ne
   désigne plus que la *vue* interne au plan — cf. Chantier 2).
2. **`EnTeteSite.tsx`** — rendre la Barre 2 role-aware :
   - `montreSousOnglets` = `!!mod && (liste du rôle).length > 0` (retirer le `role === 'prof'` dur).
   - `SousOngletsListe` / `SousOngletsRoute` / `SousOngletsParam` doivent itérer sur **la liste du rôle courant** (aujourd'hui `mod.sousOngletsProf` en dur) — passer la liste en prop plutôt que lire le champ prof.
   - Scriptorium ayant des onglets `?vue=`, le chemin `SousOngletsParam` (sous `<Suspense>`) s'applique tel quel.
3. **`page.tsx`** — lire `?vue=` (défaut recommandé **`discussion`**, l'usage quotidien) et **rendre l'onglet correspondant** :
   - `vue=plan` → nouveau composant **`PlanCours`** (Chantier 2).
   - `vue=discussion` → **`ChatScriptorium`** allégé (Chantier 3).
   `?conv=` continue de coexister (il ne vaut que sous `discussion`).

> Acceptation : sur `/eleve/modules/scriptorium`, deux onglets « Plan de cours » / « Discussion » apparaissent **dans l'en-tête** ; cliquer bascule `?vue=` ; l'onglet actif prend `ongletActifFond`/`ongletActifTexte`, l'autre `ongletInactif`. **Aucun onglet dans le corps de page.**

---

## Chantier 2 — Onglet « Plan de cours »

### Existant
Le plan vit dans un **volet dépliable** de `ChatScriptorium` (`voletPlan`), lignes tassées
`text-[11px]/[10px]`, statuts en petites icônes `✓ / ● / ○`. Tout est serré et coincé au-dessus du fil.

### 2.1 — Vue Parcours (défaut) — **inchangée, ne pas redessiner**
Reprendre la donnée `plan: PlanEleve` **telle quelle** et la présenter en **frise verticale de
semaines** (cf. `1a`). Objectif : **lisible d'un coup d'œil**.
- **En-tête de parcours** : titre du parcours (`font-titre`), puis une ligne méta `font-ui` : « N semaines · commencé le {lundi S1} · tu es en **semaine {semaineCourante}** » (le « semaine N » en **ocre, gras**). À droite, une **légende** compacte : ● vu (vert) · ● cette semaine (ocre) · ○ à venir (atténué).
- **Barre d'avancement** : `nbSemaines` segments ; posées = vert (`ok`), courante = ocre saillant, à venir = atténué.
- **Frise** : une rangée par semaine **présente dans `semaines`** (gouttière date à gauche · pastille sur l'axe · carte à droite) :
  - **vu** — date `font-ui` atténuée ; carte crème sobre ; puce **✓ vert** (`ok`) ; libellés en `font-corps` encre.
  - **cette semaine** (`courante`) — **saillante** : date en **ocre gras**, pastille ocre plus grosse, carte à **liseré gauche ocre** + fond légèrement ambré + ombre douce ; badge `cette semaine` (pill ocre, texte clair) ; libellés en **`font-corps` semi-gras encre** ; puce **● ocre**. Un lien discret « **En parler avec le tuteur →** » qui **bascule sur `?vue=discussion`**.
  - **à venir** — atténué : date `muet`, carte pointillée, libellés **`font-corps` italique** `muet`, puce **○**. Au-delà de ~2 semaines à venir, **replier** (« ⌄ … jusqu'à la semaine N ({dernier lundi}) »).
- **Note anti-spoiler** en pied, `font-ui` atténué italique : « Seuls les titres apparaissent ici — le tuteur ne dévoilera pas la suite du cours, c'est voulu. »

> Cette vue est **validée**. Elle devient simplement **la vue par défaut** du plan.
> *(Note : elle est reprise telle quelle dans la maquette, y compris ses gris clairs de méta.
> Un durcissement de contraste sur les dates atténuées serait bienvenu si l'occasion se présente,
> mais ce n'est pas demandé ici et ne doit pas servir de prétexte à la redessiner.)*

### 2.2 — Commutateur de vue « Année | Parcours »
- **Emplacement** : dans le **contenu** du plan, en haut à droite du bloc d'en-tête de parcours, au-dessus de la légende des statuts (cf. `1a`). C'est un **changement de vue**, pas de navigation : il **ne va pas** dans l'en-tête, et il **ne crée pas** d'entrée `?vue=` supplémentaire (une clé locale ou `?plan=annee|parcours` suffit — au choix de l'implémenteur).
- **Rendu** : **sobre**, style charte. Alegreya Sans 13 px, deux libellés séparés par un **filet vertical au pigment** ; l'actif en `600` encre-pigment `#4A3A28` avec un **filet de 2 px** dessous ; l'inactif en `500` `#6E5A3E`, sans fond. **Pas de gros segmented control**, pas de pastille, pas de fond plein.
- **État par défaut** : **Parcours** actif.
- **⚠️ Règle v1 — le commutateur est ABSENT.** Tant que la vue Année n'existe pas, on **ne rend pas** le commutateur : pas de bouton mort, pas d'onglet `disabled`, pas d'infobulle « bientôt ». Cf. `1b`. Concrètement : le rendre **conditionnel à l'existence de la vue Année**, et livrer v1 avec la condition à `false`.

### 2.3 — Vue Année — **spécifiée, pas à dessiner maintenant**
C'est la coupe pré-décidée du plan (v1 = vue Parcours seule). Ce qui est arrêté :
- **Même langage visuel que la vue Parcours** : **une carte par parcours** (`plan.parcours[]`), même grammaire — titre en `font-titre`, méta en `font-ui`, cartes au filet, statuts sur les mêmes tokens `ok` / `attention` (ocre) / `muet`, distinction renforcée par la police.
- **Aucune nouvelle grammaire visuelle à inventer**, aucun nouveau pigment, aucune donnée nouvelle : `plan.parcours` contient déjà tout (titre, `nbSemaines`, `semaineCourante`).
- L'anti-spoiler s'applique à l'identique : **titres et statuts seuls**.

> Acceptation : le plan se lit d'un coup d'œil ; on repère instantanément la semaine en cours ; « vu / cette semaine / à venir » se distinguent **par couleur + police** sans être criards ; aucun texte de contenu au-delà des libellés ; **en v1, aucun commutateur à l'écran**.

---

## Chantier 3 — Onglet « Discussion » : l'espace épistolaire

> **Ce chantier remplace intégralement le Chantier 3 du handoff initial** (bulles gauche/droite).

### L'intention
Ce n'est **pas** la manière dont l'IA parle — ça se règle ailleurs, dans le prompt système.
C'est **le lieu**. Aujourd'hui l'écran est une messagerie ; on veut que l'élève ait le sentiment
de **s'asseoir à un écritoire**. La référence : l'art épistolaire de la Renaissance et du XVIIIᵉ —
le soin de l'adresse, la dignité de la page, le temps long — **transposé, pas imité**.

**Contrainte non négociable** : des adolescents de 16-17 ans doivent lire **sans effort**.
**La lisibilité gagne sur l'ambiance à chaque arbitrage.**

### Parti retenu : *correspondance continue* (cf. explorations, parti `1a`)
Un **feuillet unique** qui se lit d'un trait, comme une longue lettre. Les voix ne sont pas
encadrées :
- **le tuteur occupe la pleine colonne** (prose posée, pleine page) ;
- **les mots de l'élève sont en retrait** (`margin-left: 12%`) derrière un **filet vertical au
  pigment** (`2px rgba(74,58,40,.34)`), précédés d'un petit label d'adresse **« Toi »**
  (Alegreya Sans 600, 11 px, `letter-spacing: .14em`, capitales).

**Interdit** : distinguer les voix par un **aplat de couleur**. Plus de fond `pigment-teinte`
côté élève, plus de bulle crème côté tuteur, plus d'alignement droite/gauche.

### À faire — structure
- **Retirer** de `ChatScriptorium` : le bouton `voletPlan` et le panneau plan dépliable (ils partent au Chantier 2). Le composant se recentre sur **rail + fil + écritoire**.
- **Conserver intacts** : `+ Nouvelle conversation`, la liste (`?conv=`), `Renommer`/`Supprimer`, les amorces (`suggestions`), le bandeau `premierUsage`, le streaming/stop, le quota, la saisie. **Aucun changement de logique, aucune fonctionnalité nouvelle.**
- **La page avant la bulle** : **colonne unique** de **~65-75 caractères** (720 px dans la maquette), centrée, sur un **feuillet `surface #FBF8F1`** posé sur le **fond de module `#F0EADE`**. Le fil ne s'élargit **jamais** au-delà de la colonne, quelle que soit la largeur d'écran.

### À faire — typographie (elle fait le rituel)
| Rôle | Police | Taille / interligne |
|---|---|---|
| Corps des messages (les deux voix) | **EB Garamond** (`font-corps`) | **18-19 px / ≈ 1,65** |
| Séparateur de jour, message de quota | **Cormorant Garamond italique** (`font-titre`) | 19 px |
| Rail, boutons, labels, méta | **Alegreya Sans** (`font-ui`) | 11-14 px |

- **Jamais de cursive ni d'italique long.** L'italique est réservé aux éléments rituels courts et aux emphases d'un mot ou deux dans la prose.
- Voix de l'élève en **encre douce `#5A4632`**, tuteur en **encre `#221C16`** : la nuance de valeur suffit à distinguer, avec le retrait et le filet.

### À faire — les rituels épistolaires (micro-détails de rendu, **sans toucher au texte généré**)
- **Séparateur de jour** façon datation de lettre : « **Ce vendredi 24 juillet** » en Cormorant italique, entre deux filets dégradés — **au lieu d'horodatages techniques**. Une fois **par journée** de correspondance, pas par message.
- **Fin de réponse** marquée d'un **fleuron très discret** : filet + petit carré au pigment tourné à 45°. **Un ornement par écran, pas un par message** — il se pose après la **dernière réponse achevée**.
- **En tête de conversation** : la marque du Scriptorium — sceau **N&B en `mix-blend-mode: multiply`**, comme `Pastille.tsx` — avec « **Ton Tuteur** » et la sous-ligne « Il s'appuie sur ce que ton professeur a préparé. » (remplace l'actuel « Tuteur du cours »).
- **Texture papier** : si texture, **à peine perceptible et en CSS léger** (le feuillet de la maquette n'utilise qu'un `radial-gradient` très doux). **Jamais d'image de parchemin.**

### À faire — l'écritoire (zone de saisie)
- Une **feuille**, pas un champ de messagerie : fond `surface`, **cadre au filet fin**, un filet un peu plus marqué en haut, coins à peine adoucis (`4px`).
- **Placeholder soigné, libellé existant conservé** : « **Ta question sur le cours… (Entrée pour envoyer)** » — l'élève est **tutoyé**.
- Bouton **« Envoyer »** sobre en Alegreya Sans, **noyer estompé** (`bg-bouton` = `#6B5A46` / texte `#F1EADD`), atténué (`disabled`) quand la saisie est vide.
- Pendant le streaming, « Envoyer » **devient** « **Stop** » (comportement actuel) : bouton au **filet**, pas d'aplat. **Aucune animation supplémentaire** — le texte qui s'écrit est déjà épistolaire en soi ; le seul mouvement admis est le curseur au pigment en fin de ligne.
- **Amorces** = **invitations discrètes sous l'écritoire** : petites **cartes au filet** (`#FBF8F1`, bord `#E4DBC9`), une par ligne, texte en EB Garamond 17 px — **plus de chips/pills arrondies**. Texte **tel que généré** par `suggestions`.

### À faire — la sérénité par le rythme
- **Blanc généreux**, rythme vertical régulier (≈ 26 px entre les tours, ≈ 20 px entre paragraphes d'une même réponse), **peu d'éléments simultanés**.
- **Le rail des conversations s'efface visuellement** — l'espace central est la lettre. Pas de cartouche, pas de fond propre : titres en EB Garamond, méta en Alegreya Sans, et la conversation active signalée par un **filet gauche au pigment** + un voile `rgba(74,58,40,.05)`. `Renommer` / `Supprimer` n'apparaissent **qu'au survol / focus** de la ligne. `Supprimer` est le **seul** élément qui a droit au rouge et garde sa confirmation existante.
- **Bandeau de transparence (`premierUsage`) → un billet à part entière** : feuillet teinte **`#E6DDC9`**, ton digne, titre « Avant de commencer » en Alegreya Sans, corps en EB Garamond 17 px. **Contenu strictement inchangé** (les deux phrases actuelles, mot pour mot).
- **Quota atteint** (`quotaEpuise`) : le champ et le bouton disparaissent (comportement actuel) ; reste un feuillet calme portant **la phrase existante, mot pour mot** — « Tu as beaucoup travaillé aujourd'hui — on se retrouve demain. » — en Cormorant italique centré. **Aucun compteur, aucune alerte, aucun rouge.** Sous 10 messages restants, la mention discrète reste alignée à droite sous l'écritoire, en Alegreya Sans `#6E5A3E`.
- **Le texte généré n'est pas retouché** : le rendu reste **`whitespace: pre-wrap`**. Les « paragraphes » visibles en `2c` sont les sauts de ligne du modèle, avec un espacement de bloc généreux — **pas du Markdown interprété**, aucun post-traitement.

### 🚫 Garde-fous anti-pastiche (interdits fermes)
- Pas de police **script/manuscrite** pour le corps.
- Pas de **parchemin vieilli photoréaliste**, taches, ni bords brûlés.
- Pas de **cachet de cire rouge** cliché, pas de **plume d'oie** en icône.
- Pas d'**ornement à chaque message** (un par écran).
- Pas de **sépia poussé** ; **aucun pigment nouveau** — encre `#221C16`, encre douce `#5A4632`, pigment `#4A3A28`, et c'est tout.
- **Contraste AA minimum partout** (c'est pour ça que les méta sont à `#6E5A3E` et le placeholder à `#7E6746`, et non aux gris clairs habituels).

> L'élégance vient de la **mise en page** — pense **belle édition de correspondance** (marges,
> filets, alignements), pas décor de film d'époque.

> Acceptation : un tiers non prévenu, à qui l'on ne dit rien, dirait « **une lettre** » — et
> trouverait le texte **parfaitement lisible**. Discussion = échange + historique, sans le plan ;
> aucune voix distinguée par un aplat ; toute la logique (stream, stop, quota, actions, `?conv=`) intacte.

---

## Chantier 4 — Contraintes responsive minimales

**Le mobile est hors périmètre de ce handoff.** Le nouvel en-tête (cf. `handoff_en_tete/`) est
explicitement hors périmètre mobile ; toute maquette mobile dessinée aujourd'hui poserait sur un
en-tête qui n'existe pas encore. Le design mobile de la face élève est traité au **chantier C10a**
(passe élève mobile-first).

Ici, une seule exigence : **à 375 px, rien de cassé.**
- **Empilement naturel des colonnes** (le feuillet passe pleine largeur, marges réduites).
- **Rail de conversations escamotable** (il ne doit pas écraser la lettre).
- **Barres mobiles existantes conservées** telles quelles.

Rien de plus n'est spécifié : pas de tiroir à concevoir, pas de piste à trancher, **aucune
maquette mobile à produire ni à attendre**. Ne pas inventer de vue mobile dédiée dans cette passe.

---

## Rappels charte (déjà dans le code — réutiliser, ne pas redéfinir)

- **Couleurs de l'en-tête = `configModules.MODULES[scriptorium].couleurs`**, PAS les tokens `globals.css` (la Barre 2 a sa propre palette, haute fidélité). Sous-onglets : **actif** `ongletActifFond #E6DDC9` / `ongletActifTexte #4A3A28` · **inactif** `ongletInactif #6A5C48`. Devise `couleur #6E5A3E`. Ces valeurs **existent déjà** — s'y brancher.
- **Statuts du plan = tokens d'état** : **vu → `ok`** (vert) · **cette semaine → `attention`** (ocre `#9A6A2E`) · **à venir → `muet`**. Distinguer aussi par **police** (gras pour la semaine courante, italique pour l'à-venir).
- **Boutons estompés** (préférence projet, cf. `CLAUDE.md`) : encre passée sur parchemin, jamais d'aplat franc. Token **`bg-bouton`** = **noyer estompé `#6B5A46` / texte `#F1EADD`** (`+ Nouvelle conversation`, `Envoyer`). Segment/onglet actif = `ongletActifFond`. **Le rouge reste réservé au destructif** (`Supprimer` → `retard`).
- **Polices** : `font-marque` Cinzel (marque, nom du module) · `font-titre` Cormorant Garamond (titres de parcours, éléments rituels de la Discussion) · `font-corps` EB Garamond (`<body>`, libellés du plan, **corps des messages**) · `font-ui` Alegreya Sans (onglets, dates, méta, boutons, rail).
- **Monde Scriptorium** : `data-module="scriptorium"` déjà posé par `page.tsx` → hérite pigment `#4A3A28` / `pigment-teinte #E6DDC9` / `--fond-module`.
- **Sceaux** : `sceaux/pastille-scriptorium.png` (module) et `palimpseste_medaillon.png` (marque). Déjà dans `public/sceaux/`. Traitement **N&B + `multiply`** comme `Pastille.tsx`.

## Hors périmètre (ne pas toucher)

- **Logique métier** : streaming `/api/scriptorium/chat`, quota du jour, `renommer/supprimer`, RAG, sélection de conversation `?conv=`. **Le handoff ne redéfinit que la surface** — aucune mention de la route de chat, du quota ou des données n'implique de les modifier.
- **DTO `PlanEleve`** : reste **titres + statuts seuls** (anti-spoiler). Ne pas y ajouter de texte de contenu, même « pour enrichir » le plan ou la vue Année.
- **En-tête desktop (structure)** : on ne fait que l'**alimenter** avec les onglets élève, pas le refondre.
- **Mobile** : chantier C10a. Aucune vue mobile à concevoir ici.
- **La manière dont l'IA parle** : prompt système, ailleurs. Le Chantier 3 ne touche **que** le rendu.

---

## Inventaire d'implémentation — maquette → composants existants

| Écran (maquette) | État couvert | Composants / fichiers concernés |
|---|---|---|
| `1a` | Plan de cours, vue Parcours + commutateur (cible) | **nouveau** `PlanCours` (extrait du volet de `ChatScriptorium.tsx`) · `page.tsx` (`?vue=plan`) · `SousNavModule` + `EnTeteSite.tsx` + `configModules.ts` (onglets) |
| `1b` | Plan de cours, **v1 sans commutateur** + spéc. vue Année | idem `1a`, commutateur rendu conditionnel (condition `false` en v1) |
| `2a` | Discussion — **conversation vierge** : billet `premierUsage` + amorces `suggestions` | `ChatScriptorium.tsx` (bloc `premierUsage`, bloc `messages.length === 0`, `suggestions.map`) |
| `2b` | Discussion — **streaming en cours** + bouton `Stop` | `ChatScriptorium.tsx` (`enCours`, `stop()`, rendu du dernier message) |
| `2c` | Discussion — **réponse longue** (`pre-wrap`, rythme vertical) | `ChatScriptorium.tsx` (rendu d'un message assistant) |
| `2d` | Discussion — **quota atteint** (`quotaEpuise`, message doux) | `ChatScriptorium.tsx` (branche `quotaEpuise`, mention `restant <= 10`) |
| `2e` | Discussion — **rail à plusieurs conversations**, `Renommer` / `Supprimer` au survol | `ChatScriptorium.tsx` (`<aside>`, liste `conversations`) · `actions.ts` (`renommerConversation`, `supprimerConversation`) — **logique inchangée** |
| *(tous)* | Onglets « Plan de cours · Discussion » dans la bande seuil | `components/SousNavModule.tsx` · `components/nav/EnTeteSite.tsx` · `components/nav/configModules.ts` |
| — | *Aucun écran mobile* | **hors périmètre** — chantier C10a |

**États réels couverts par la maquette, liste exacte** : conversation vierge (avec billet de
transparence) · échange en cours (streaming + Stop) · réponse longue · quota atteint (message
doux) · rail à plusieurs conversations (Renommer/Supprimer visibles) · Plan de cours avec
commutateur · Plan de cours v1 sans commutateur.

**États volontairement non maquettés** (comportements existants, rendu inchangé) : erreur d'envoi
(`erreur`, ligne `⚠` en `retard`) · confirmation de suppression (`confirm()` natif) · saisie
multi-lignes (`rows` auto jusqu'à 6) · gate `rag_actif=false`.

---

## Checklist d'acceptation

- [ ] **Deux onglets dans la bande seuil du module** (`SousNavModule`), pilotés par `?vue=plan|discussion` ; actif/inactif aux couleurs `configModules`. **Aucune barre d'onglets dans le corps de page.** Libellés « Plan de cours » · « Discussion ».
- [ ] **Plan de cours** = écran à part (`vue=plan`) : frise lisible d'un coup d'œil ; vu/cette semaine/à venir distingués **couleur + police** ; semaine courante saillante + lien « En parler avec le tuteur → » vers `discussion` ; note anti-spoiler. **Vue Parcours non redessinée.**
- [ ] **Commutateur Année | Parcours** : spécifié, sobre (Alegreya Sans + filet pigment), local au contenu, Parcours par défaut — et **absent à l'écran en v1** (aucun bouton mort).
- [ ] **Discussion épistolaire** : colonne unique ~65-75 caractères sur feuillet `#FBF8F1` / fond `#F0EADE` ; tuteur pleine page, élève en retrait derrière un filet pigment ; **aucun aplat de couleur pour distinguer les voix** ; corps EB Garamond 18-19 px / ≈1,65.
- [ ] **Rituels** : séparateur de jour en Cormorant italique au lieu d'horodatages ; **un seul ornement par écran** ; sceau N&B `multiply` en tête de conversation ; billet de transparence `#E6DDC9` **au contenu inchangé** ; amorces en cartes au filet ; écritoire au placeholder existant ; « Stop » pendant le streaming ; **aucune animation ajoutée**.
- [ ] **Aucun interdit** : pas de cursive pour le corps, pas de parchemin vieilli, pas de cire, pas de plume, pas de sépia poussé, **aucun pigment nouveau**, **contraste AA partout**.
- [ ] **Responsive** : à 375 px rien de cassé (empilement, rail escamotable, barres mobiles conservées). **Aucune vue mobile dédiée produite dans cette passe.**
- [ ] `EnTeteSite` rendu role-aware (plus de `sousOngletsProf` en dur) ; les autres modules inchangés.
- [ ] Aucune couleur/police en dur hors valeurs nommées ; **streaming, stop, quota, actions, `?conv=`, DTO `PlanEleve` inchangés** ; **aucune fonctionnalité nouvelle** ; aucune régression d'envoi.
