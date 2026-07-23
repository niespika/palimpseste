# Patch couleurs #2 — bouton & liseré par module

> **Pour Claude Code.** On introduit deux jetons par module en plus de `--pigment` :
> `--bouton` (fond des boutons d'action) et `--liseret` (bord/filet d'identité). Cela
> permet, par module, un bouton et un liseré distincts de la couleur d'identité.
>
> **Identité (`--pigment`) = titre + cartes + sceau + jauges.** On n'y touche **que pour
> Fragments** (l'olive `#5A6043` sortait grisé → `#616E30`, plus net). Aletheia, Codex,
> Quazian, Scriptorium gardent leur `--pigment` actuel.

## Couleurs cibles

| Module | `--bouton` (boutons) | `--liseret` (filet) | `--pigment` (identité) |
|---|---|---|---|
| **Aletheia** | **`#B4452F`** *(était `#2C4A7C`)* | **`#B8893B`** | `#2C4A7C` *(inchangé)* |
| **Codex** | `#2E4A3C` *(= pigment, inchangé)* | **`#6E2A2C`** | `#2E4A3C` *(inchangé)* |
| **Quazian** | `#3E6B8E` *(= pigment, inchangé)* | **`#BE8276`** | `#3E6B8E` *(inchangé)* |
| **Fragments** | **`#B26A4A`** *(terracotta, était `#5A6043`)* | `#616E30` *(= identité)* | **`#616E30`** *(olive net, était `#5A6043`)* |
| **Scriptorium** | `#4A3A28` *(= pigment)* | `#4A3A28` *(= pigment)* | `#4A3A28` *(inchangé)* |
| Général (hors module) | = pigment `#5A4632` | = pigment | inchangé |

> **Boutons qui changent visuellement : Aletheia (minium) et Fragments (terracotta).**
> Codex / Quazian / Scriptorium : bouton = pigment, donc aucun changement de bouton.
> **Identité qui change : Fragments uniquement** (olive `#5A6043` → `#616E30`).

---

## A. `app/globals.css`

### A.1 — Défauts dans `:root` (juste après `--pigment` / `--pigment-teinte`)

```css
  --pigment:          #5A4632;
  --pigment-teinte:   #E8DFCB;
  --fond-module:      #F4EFE6;
  --bouton:           #5A4632;   /* ← AJOUTER : fond bouton = pigment par défaut */
  --liseret:          #5A4632;   /* ← AJOUTER : liseré = pigment par défaut */
```

### A.2 — Renseigner `--bouton` + `--liseret` sur chaque module

Remplace le bloc « Un monde par module » par celui-ci :

```css
[data-module="palimpseste"] { --pigment:#5A4632; --pigment-teinte:#E8DFCB; --fond-module:#F4EFE6; --bouton:#5A4632; --liseret:#5A4632; }
[data-module="aletheia"]    { --pigment:#2C4A7C; --pigment-teinte:#DDE3EC; --fond-module:#F3ECDD;
                              --or:#B8893B; --minium:#B4452F; --bouton:#B4452F; --liseret:#B8893B; }
[data-module="fragments"]   { --pigment:#616E30; --pigment-teinte:#E2E3D2; --fond-module:#EFE9DC;
                              --terracotta:#B26A4A; --bouton:#B26A4A; --liseret:#616E30; }
[data-module="codex"]       { --pigment:#2E4A3C; --pigment-teinte:#DCE6DF; --fond-module:#F0EADE;
                              --bordeaux:#6E2A2C; --nuit:#28324A; --bouton:#2E4A3C; --liseret:#6E2A2C; }
[data-module="quazian"]     { --pigment:#3E6B8E; --pigment-teinte:#DCE6EC; --fond-module:#F2ECE0;
                              --ocre:#C8993F; --rose:#BE8276; --bouton:#3E6B8E; --liseret:#BE8276; }
[data-module="scriptorium"] { --pigment:#4A3A28; --pigment-teinte:#E6DDC9; --fond-module:#F0EADE; --bouton:#4A3A28; --liseret:#4A3A28; }
```

> Changements de `--pigment` : **Fragments** `#5A6043` → `#616E30`. (Aletheia reste `#2C4A7C`.)

### A.3 — Exposer les deux jetons à Tailwind (`@theme inline`)

```css
  --color-pigment:         var(--pigment);
  --color-pigment-teinte:  var(--pigment-teinte);
  --color-bouton:          var(--bouton);    /* ← AJOUTER : bg-bouton, text-bouton, border-bouton */
  --color-liseret:         var(--liseret);   /* ← AJOUTER : border-l-liseret */
```

---

## B. Boutons d'action — `bg-pigment` → `bg-bouton`

Tous les **boutons pleins** (CTA `<button>`/`<Link>`) actuellement en
`bg-pigment text-surface` passent en **`bg-bouton text-surface`**.

```
grep -rn "bg-pigment text-surface" app/
```

Et les **segments/onglets « actif »** :
```
on/actif ? 'bg-pigment text-surface border-pigment' …  →  'bg-bouton text-surface border-bouton' …
```
(`prof/a-risque/page.tsx`, `prof/calendrier/FiltreClasses.tsx`,
`prof/quazian/semestre/page.tsx`, `prof/scriptorium/{FormulaireContenu,FormulaireLivre,LigneContenu,EditeurClassesLivre}.tsx`,
`fragments…/EditorAnalyse.tsx`, `EditorAnalyseOrale.tsx`, `EnregistreurAudio.tsx`,
`eleve/SelecteurClasseEleve.tsx`, `eleve/calendrier/page.tsx`, `prof/calendrier/page.tsx`…)

> Effet visuel du basculement : **Aletheia** (boutons minium) et **Fragments** (boutons
> terracotta). Pour Codex/Quazian/Scriptorium, `--bouton` = `--pigment` → identique.

### ⛔ NE PAS convertir (surfaces/jauges, pas des boutons — restent `pigment`)
- Bannières de confirmation : `eleve/modules/fragments-erudition/EssaiPublie.tsx` (l.81),
  `BilanSemestre.tsx` (l.32) — `bg-pigment text-surface` mais ce sont des **encarts**.
- Barres de progression / jauges : `eleve/modules/quazian/SessionRevision.tsx` (l.125),
  `prof/codex/synthese/[sessionId]/TableauSynthese.tsx` (l.156),
  `prof/aletheia/page.tsx` (l.18), `prof/quazian/quizz/[quizId]/lancer/TableauLive.tsx` (l.117),
  `prof/fragments-erudition/essais/[essaiId]/TableauEssai.tsx` (l.267, barres de graphe).
- Puces/marqueurs : `bg-pigment-teinte text-pigment` (`SessionRevision`, `CarteFlashcard`,
  `QuestionCard`) et tous les `text-pigment` de **titre** → restent sur le pigment.

> Boutons « fantômes »/liens d'action en `text-pigment hover:bg-pigment-teinte`
> (ex. `QuestionCard.tsx` l.183) : si tu veux que leur teinte d'action suive le bouton,
> passe-les en `text-bouton hover:bg-bouton/10` — **optionnel**.

---

## C. Liseré d'identité — `border-l-pigment` → `border-l-liseret`

Le bord gauche d'identité des tuiles/cartes de module passe sur `--liseret`.

### C.1 `components/Tuile.tsx`
Dans la logique `bordGauche`, remplace les deux `'border-l-pigment'` par `'border-l-liseret'` :
```tsx
  const bordGauche = module
    ? 'border-l-liseret'
    : accentModule
      ? (couleur === 'rouge' ? 'border-l-retard' : 'border-l-liseret')
      : BORDURE_ETAT[couleur]
```
> Laisse `ring-pigment` / `hover:border-pigment` tels quels (voir aussi le patch sélection).

### C.2 Reste de l'app
```
grep -rn "border-l-pigment" app/ components/
```
Tout liseré d'identité de module → `border-l-liseret` (notamment les cartes « À faire »
de `app/eleve/page.tsx` et les filets d'accent des pages de module).

---

## D. Vérification

```
grep -rn "bg-pigment text-surface" app/   # boutons → bg-bouton (sauf les 2 bannières listées)
grep -rn "border-l-pigment" app/ components/   # liserés d'identité → border-l-liseret
```

Ouvrir et comparer :
- **Aletheia** : boutons **minium `#B4452F`** ; liseré **or `#B8893B`** ; nom/cartes/sceau **bleus `#2C4A7C`**.
- **Codex** : boutons inchangés (vert `#2E4A3C`) ; liseré **bordeaux `#6E2A2C`**.
- **Quazian** : boutons inchangés (bleu `#3E6B8E`) ; liseré **rose `#BE8276`**.
- **Fragments** : boutons **terracotta `#B26A4A`** ; identité + liseré **olive `#616E30`** (titre, cartes, sceau, puces).
- **Scriptorium** : aucun changement.

Référence visuelle : `references/Modules - contrôle couleurs.dc.html` et
`references/Fragments - propositions olive.dc.html` (option C retenue).
