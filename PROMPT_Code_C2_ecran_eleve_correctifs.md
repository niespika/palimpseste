# PROMPT — Session Code ⚙️ : C2.2-bis — Correctifs de recette écran élève (largeur · fil défilant · densité · menu Modules)

> **À coller dans une session Claude Code FRAÎCHE** (règle R4 : une session = un lot).
> Modèle standard.
>
> **Contexte à lire en démarrant, rien de plus :** `PLAN_CHANTIERS_RENTREE.md` §C2 ; les
> garde-fous du handoff `design_handoff_scriptorium_eleve/HANDOFF_scriptorium_eleve.md`
> (interdits fermes : voix par typographie jamais par aplat, un seul ornement par écran,
> aucune animation) ; ce fichier.
>
> **Décisions PO du 24/07** (recette utilisateur de C2.2, écran vu en vrai) — encodées
> telles quelles, elles ne se rediscutent pas en session (R7). Deux d'entre elles
> TRANCHENT des questions R7 laissées ouvertes par la session C2.2 : la largeur de
> colonne (« max-w-4xl du layout élève ») et le défilement du fil (« le feuillet se lit
> d'un trait »). **La recette utilisateur prime sur la lettre de la maquette.**

---

## Mission

Quatre correctifs sur l'écran élève Scriptorium livré en C2.2. **Présentation et
navigation uniquement — zéro changement de logique, zéro fonctionnalité nouvelle,
aucun SQL.** En cas de doute ou de trou : note la question et arrête-toi (R7).

## Pré-vol git

1. `git branch --show-current` : tu dois être sur **`feat/rag-ecran-eleve`** (lot C2.2,
   4 commits `501342c` → `0ec7930`, non mergé — ces correctifs s'empilent dessus).
   Sinon : STOP, demande au PO. Si une autre session occupe le dossier : worktree
   (`WORKTREE_cheatsheet.md`), ne tue jamais son serveur.
2. Laisse intacts et hors commit : `PLAN_CHANTIERS_RENTREE.md` (modifs PO non commitées),
   les `PROMPT_*.md`, `SUIVI_tests_manuels.md`, `.claude/`.

## Les quatre correctifs

### K1 — Largeur de l'espace élève : 896 → 1040

`app/eleve/layout.tsx`, le `<main>` (et lui seul) : `max-w-4xl` → `max-w-[1040px]`, et
son padding desktop aligné sur les colonnes de l'en-tête : `px-4 sm:px-[28px]`
(`EnTeteSite` travaille déjà à `max-w-[1040px]` / `px-[28px]` — le contenu doit tomber
sous la marque et le sceau). Ne touche ni au bloc `sm:hidden` ni à `BarreOngletsMobile`.
Conséquence assumée (décision PO) : **toutes** les pages élève respirent plus large — la
recette les balaie une à une (voir Recette, point 4).

### K2 — Le fil défile dans le feuillet, pas la page (desktop)

`ChatScriptorium.tsx`. Aujourd'hui : la page entière défile et `versLeBas()` fait un
`scrollIntoView` de page. Décision PO — **dès qu'une conversation contient des messages,
sur `lg+`, l'onglet Discussion tient dans la fenêtre** : la page ne défile pas ; le rail
et l'écritoire restent visibles en permanence ; **seul le fil, dans le feuillet, défile**.

En pratique (adapte si tu trouves plus simple, l'exigence est le comportement) :

- le conteneur racine (rail + lettre) prend une hauteur bornée sur `lg+` :
  `h-[calc(100dvh-Hpx)]` où `H` = en-tête sticky + `pt-8` du main + respiration basse.
  Mesure l'en-tête réel une fois, pose une constante commentée — pas de valeur au pif ;
- la colonne lettre devient une colonne flex (`min-h-0`), le feuillet passe en
  `flex-1 min-h-0 overflow-y-auto`, l'écritoire reste dessous, toujours visible ;
- le rail garde sa hauteur et prend son propre `overflow-y-auto` si sa liste dépasse ;
- `versLeBas()` : quand le feuillet est défilant, défilement du conteneur
  (`scrollTop = scrollHeight`) ; sinon comportement actuel. Le suivi du bas du fil
  pendant le streaming doit marcher dans les deux régimes.

**Inchangé :** état vide et première utilisation (billet + amorces) restent en flux de
page comme aujourd'hui ; **sous `lg`, tout reste en flux de page** (une boîte défilante à
375 px serait pire) ; aucune animation ajoutée ; datation, fleuron, sceau, `pre-wrap`
intacts.

### K3 — Densité typographique du feuillet : −1,5 pt sur le corps de lecture

`ChatScriptorium.tsx`, valeurs exactes — rien d'autre ne bouge (méta 11/11.5/12.5/13.5 px,
boutons, couleurs : intacts ; le contraste AA ne dépend pas de ces tailles, toutes ≥ 16px) :

| Élément | Avant | Après |
|---|---|---|
| Corps des messages (tuteur ET élève) | `text-[18px] leading-[1.66]` | `text-[16.5px] leading-[1.6]` |
| Phrase d'état vide « Pose une question… » | 18px | 16.5px |
| Billet « Avant de commencer » (les 2 ¶) | 17px | 16px |
| Amorces « Pour commencer » | 17px | 16px |
| Textarea de l'écritoire | 17px | 16px |
| Datation de journée | 19px | 18px |
| Curseur de streaming | `h-[19px]` | `h-[18px]` |

Avec K1, la ligne de lecture vise ~70-75 caractères : vérifie à l'œil, et ne compense
pas en touchant aux paddings du feuillet (`px-[46px]`) ni à `max-w-[720px]`.

### K4 — Menu déroulant « Modules » élève : Scriptorium manquant

`components/nav/configNavigation.ts`, `NAV_ELEVE`, onglet « Modules » : ajoute
`{ label: 'Scriptorium', href: '/eleve/modules/scriptorium' }` **entre Fragments et
Quazian** (même ordre que `NAV_PROF`). Le filtrage par accès réel existe déjà
(`navEleveFiltree`, slug = dernier segment du href) : un élève d'une classe **sans**
Scriptorium ne doit PAS voir l'entrée — c'est le comportement attendu, vérifie les deux
cas. `NAV_PROF` intact.

## Périmètre de fichiers (strict)

- **Autorisés** : `app/eleve/layout.tsx` (la ligne du `<main>` seulement) ;
  `app/eleve/modules/scriptorium/ChatScriptorium.tsx` ;
  `components/nav/configNavigation.ts`.
- **Interdits** : tout le reste — notamment `page.tsx`, `PlanCours.tsx`, `EnTeteSite.tsx`,
  `configModules.ts`, `actions.ts`, `/api/scriptorium/chat`, `globals.css`, `utils/*`,
  les gates (`rag_actif` tel quel), tout SQL. Un correctif qui semble en exiger un
  autre = cas R7 : note et stop.

## Recette (fin de session)

1. `npm run build` propre, `tsc --noEmit` et tests existants verts (aucun test modifié).
2. **Discussion, desktop (1440×900 ET 1280×800), conversation longue** — même méthode
   qu'en C2.2 pour peupler l'écran (échafaudage jetable, supprimé ensuite ; aucun flip de
   gate, aucune écriture en base) : pas de barre de défilement de page ; rail + écritoire
   toujours visibles ; molette sur le feuillet = le fil défile ; pendant un streaming le
   bas du fil reste en vue ; fleuron après la réponse ; état vide et première utilisation
   inchangés (flux de page).
3. **375 px** : comportement d'avant (flux de page), rien de cassé, rail escamotable.
4. **Balayage largeur (K1)**, desktop, rien de cassé ni d'absurde : tableau de bord,
   calendrier, intégrité, hub modules, Fragments, Quazian, Codex, Aletheia, Scriptorium
   (les 2 onglets). Un écran qui souffre → R7, note-le, pas de redesign sauvage.
5. **Menu (K4)** : élève d'une classe avec Scriptorium → l'entrée apparaît et mène au bon
   écran ; élève sans → absente ; menus prof inchangés.
6. Livre au PO une liste de recette utilisateur (6 lignes max).

## Fin de session

Commits lisibles sur `feat/rag-ecran-eleve` — **ne rien pousser, ne rien merger** (le
merge se décide au check-in, après cette recette et l'arbitrage R7 n°1 « recette gatée »).
Dernier commit type :
`fix(scriptorium): correctifs recette écran élève — colonne 1040, fil défilant, densité, menu Modules (C2.2-bis)`.
Note de journal habituelle + liste sèche des questions R7 rencontrées (même résolues par
« comportement existant gagne »).
