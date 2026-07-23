# Handoff — Aletheia, retour final « partie par partie » (élève)

> Pour Claude Code. Objectif : retravailler **uniquement l'affichage du retour final**
> côté élève (état `FEEDBACK2_READY`, avant la validation de lecture). Aujourd'hui tout
> le retour s'affiche empilé d'un bloc, avec une case à cocher par tuile et un seul
> bouton en bas. On passe à une **divulgation progressive** : une partie à la fois,
> cochée avant de révéler la suivante, les parties lues repliées, la **synthèse en
> dernier** portant le bouton de clôture.
>
> ⚠️ **Aucune refonte fonctionnelle.** La machine à états (`StatutAletheia`), les retours
> IA, l'action de validation (`validerLectureRetourVf` → `retour_vf_lu_at` → `DONE`) et le
> verrou transversal des retours non lus **ne changent pas**. On ne touche qu'à la
> **présentation** de la validation.

## Référence visuelle
- **`Aletheia Retour final Rendu Charte.dc.html`** (dans ce dossier) — storyboard hi-fi
  fidèle à la charte : la séquence sur **ordinateur** (① arrivée → ② en cours → ③ dernière
  partie + clôture) et sur **mobile**, plus les panneaux d'annotation. C'est la cible.

Reproduire ce **langage visuel** avec les composants/conventions du codebase (React, classes
Tailwind de `globals.css`, `next/font`, `Pastille`). Réutiliser les jetons (`bg-pigment`,
`text-pigment`, `bg-pigment-teinte`, `border-l-pigment`, `border-l-liseret`, `border-l-ok`,
`border-l-minium`, `bg-bouton`, `font-marque`…). **Pas de hex en dur.** Le sous-arbre est sous
`data-module="aletheia"` (`app/eleve/modules/aletheia/layout.tsx`) → pigment outremer et bouton
minium (`#B4452F`) hérités.

---

## Fichiers concernés
1. **`components/retours/ValidationLecture.tsx`** — ajouter un **mode séquentiel** (opt-in).
2. **`app/eleve/modules/aletheia/[livreId]/[semaine]/page.tsx`** — brancher ce mode dans la
   branche `statut === 'FEEDBACK2_READY'` : **ordre des tuiles**, préfixe « Partie N », libellé
   du bouton, accents.
3. **`components/aletheia/VueRetours.tsx`** — `bullesVF` renvoie déjà `{ id, titre, accent, node }` ;
   on s'en sert pour l'ordre et les accents (rien à changer dans la logique de génération).

---

## Chantier A — `ValidationLecture` en mode séquentiel (opt-in)

> `ValidationLecture` est **transverse** (Fragments écrit/essai, Codex, Aletheia VF). Le
> nouveau comportement doit être **opt-in** via une prop, pour **ne pas modifier** Fragments
> ni Codex. Eux continuent d'appeler le composant sans la prop → comportement actuel intact.

### Prop nouvelle
```ts
interface Props {
  tuiles: TuileRetour[]          // { id, titre, node, accent? }  ← accent ajouté (cf. plus bas)
  dejaLu: boolean
  marquerAction: () => Promise<{ error?: string; success?: boolean } | void>
  labelBouton?: string
  introMessage?: string
  sequentiel?: boolean           // ← NOUVEAU. true = divulgation progressive
}
```
Ajouter `accent?: Accent` à `TuileRetour` (réutiliser le type `Accent` + la map `ACCENT`
de `VueRetours.tsx` — les **exporter** depuis ce fichier pour éviter la duplication).

### Comportement quand `sequentiel && !dejaLu`
État local : `const [index, setIndex] = useState(0)` (partie courante révélée) et un `Set`
des parties **rouvertes** par l'élève (pour re-déplier un bandeau « Lu »).

Rendu, pour `total = tuiles.length` :

- **Fil de progression** en tête : `total` pastilles + « {index+1} / {total} ». Pastilles
  atteintes = `bg-pigment` (pleines, **bleu**) ; à venir = `border border-bordure` (creux).
  Surtitre `font-ui text-encre-douce` « Ton retour, partie par partie ». (cf. maquette)

- **Parties `i < index` (lues)** → **bandeau replié** `bg-parchemin-fonce border border-bordure
  rounded-xl`, hauteur ≥ 44px : pastille ✓ ronde **`bg-pigment-teinte text-pigment`** (PAS
  vert), libellé « Partie {i+1} · {titre} », action « déplier » à droite. Au clic → toggle
  dans le `Set` rouvertes → réaffiche `tuile.node` sous le bandeau. **Les parties lues restent
  donc accessibles, repliées par défaut.**

- **Partie `i === index` et `index < total-1` (courante, pas la dernière)** → **carte pleine** :
  `bg-surface border border-bordure border-l-4 ${ACCENT[tuile.accent]} rounded-xl`, surtitre
  `font-ui` « PARTIE {i+1} · {TITRE} » dans la couleur de l'accent, puis `tuile.node`. **Pied
  « à cocher »** : barre `border-t border-bordure bg-pigment-teinte`, une case (carré
  `border-bouton`, **minium**) + libellé `text-bouton font-medium` « **J'ai lu cette partie** ».
  Au cochage → `setIndex(index + 1)` (révèle la suivante). **Pas** de texte « la suivante
  apparaît ».

- **Partie `i === index === total-1` (dernière = la synthèse)** → carte pleine (accent
  `border-l-minium`), puis **le bouton de clôture** à la place du pied à cocher :
  `w-full bg-bouton text-surface rounded-xl py-3 font-medium` « ✓ J'ai lu mon retour — clore
  la semaine » → appelle `marquerAction()` (puis `router.refresh()`). Sous-texte `text-xs
  text-muet` « En validant, tu confirmes avoir lu les {total} parties. »

- **Parties `i > index`** → **non rendues** (cachées tant que la précédente n'est pas cochée).

`dejaLu === true` (cas affichage post-clôture / prof) : garder le rendu actuel (toutes les
tuiles dépliées, pastille ✓). Le mode séquentiel ne concerne que la **saisie** de validation.

### Accessibilité / tactile
Cases et bandeaux ≥ 44px de hauteur de cible. Le cochage et le re-dépliement sont des
contrôles `button`/`label` natifs. Le focus passe naturellement à la partie nouvellement
révélée (option : `ref` + `focus()` sur la nouvelle carte, sans `scrollIntoView`).

---

## Chantier B — câblage dans `[semaine]/page.tsx`

Dans la branche `statut === 'FEEDBACK2_READY'` (bloc « 4. Retour final »), aujourd'hui :

```tsx
<ValidationLecture
  tuiles={bullesVF(t.retour_vf).map((b) => ({ id: b.id, titre: b.titre, node: b.node }))}
  dejaLu={false}
  marquerAction={validerLectureRetourVf.bind(null, livreId, semaine)}
  labelBouton="J'ai tout lu — clore la semaine"
/>
```

À remplacer par (ordre imposé + accent transmis + mode séquentiel + libellé) :

```tsx
const ORDRE = ['ajouts', 'nuances', 'architecture', 'synthese'] as const
// Accents de CET écran (cf. maquette). Volontairement différents des défauts de
// `bullesVF` (qui servent la vue prof + la revue DONE) → on les fixe ici, on ne
// touche pas à `bullesVF`.
const ACCENT_PARTIE: Record<string, Accent> = {
  ajouts: 'pigment',      // bleu  → border-l-pigment
  nuances: 'or',          // or    → border-l-liseret
  architecture: 'green',  // vert  → border-l-ok
  synthese: 'minium',     // rouge → border-l-minium (+ bouton)
}
const tuiles = bullesVF(t.retour_vf)
  .slice()
  .sort((a, b) => ORDRE.indexOf(a.id) - ORDRE.indexOf(b.id))
  .map((b) => ({ id: b.id, titre: b.titre, node: b.node, accent: ACCENT_PARTIE[b.id] }))

<ValidationLecture
  sequentiel
  tuiles={tuiles}
  dejaLu={false}
  marquerAction={validerLectureRetourVf.bind(null, livreId, semaine)}
  labelBouton="✓ J'ai lu mon retour — clore la semaine"
  introMessage="Lis chaque partie, puis coche-la pour confirmer. La dernière clôt la semaine."
/>
```

- **Ordre final : 1) Ce que tu as ajouté (`ajouts`) · 2) Nuances (`nuances`) · 3) Architecture
  (`architecture`) · 4) Synthèse modèle (`synthese`).** `bullesVF` génère déjà ces `id` ; il
  **n'omet** que les parties vides → `total` = nombre réel de parties (2 à 4). **Ne jamais
  afficher de carte vide** (acquis via `bullesVF`).
- Le préfixe « Partie {n} · » est calculé **par l'index dans `tuiles`** (donc après tri et
  après omission des vides), pas par une numérotation figée.
- Ne **pas** changer `bullesVF` lui-même (utilisé aussi par `VueRetourVF` côté prof et par la
  revue `DONE`). Le tri se fait **au point d'appel**.

---

## Couleurs / jetons (cf. panneau « JETONS » de la maquette)
Liseré gauche par partie :
- **Ce que tu as ajouté** → `border-l-pigment` (bleu)
- **Nuances** → `border-l-liseret` (or)
- **Architecture** → `border-l-ok` (vert)
- **Synthèse modèle** → `border-l-minium` (rouge) + bouton `bg-bouton`

Règles « check » :
- **Toutes les pastilles de validation/progression en `pigment` (bleu)** — pastilles ✓ du
  stepper, points du fil « partie par partie », pastille ✓ des bandeaux « Lu » (sur
  `bg-pigment-teinte`). **Jamais en vert.** (Le vert `ok` reste réservé au **statut** d'une
  semaine **terminée** : chip « ✓ Terminée », et à l'accent *architecture*.)
- La case « à cocher » et son libellé toujours en **minium** (`border-bouton` / `text-bouton`),
  quel que soit l'accent de la carte.
- Le ✓ « ancré » à l'intérieur de « Ce que tu as ajouté » reste **neutre** (`text-encre`/
  `text-encre-douce`), le ⚠ non ancré en `text-retard`.

---

## Persistance & retour de l'élève (inchangé, à respecter)
- Tant que la lecture n'est pas validée, l'état reste **`FEEDBACK2_READY`**. Si l'élève quitte,
  il **retombe sur cet écran** au retour sur la semaine et reparcourt les parties (l'état de
  cochage est **éphémère/local** : on **redémarre à la partie 1** au rechargement — c'est
  voulu, l'élève relit pour valider).
- Le **verrou transversal** existant (`utils/retours-lus.ts` → source `aletheia` : un
  `FEEDBACK2_READY` non clos bloque tout rendu ailleurs et fournit le `href` de retour)
  **reste la garantie** que l'élève revient ici. Ne rien y changer.
- Le clic final appelle l'action serveur existante `validerLectureRetourVf(livreId, semaine)`
  → pose `retour_vf_lu_at` → `DONE`. **Inchangé.**

## Responsive
- **Mobile** : une seule colonne ; cartes, bandeaux repliés et case à cocher pleine largeur ;
  cibles tactiles ≥ 44px. Même séquence que l'ordinateur.
- **`lg`** : identique (le retour final est déjà une colonne ; pas de passage 2 colonnes ici).

## Checklist d'acceptation
- [ ] `FEEDBACK2_READY` : une **seule partie** visible à l'arrivée (la 1ʳᵉ), les suivantes
      cachées ; cocher « J'ai lu cette partie » révèle la suivante.
- [ ] Ordre **ajouts → nuances → architecture → synthèse** ; parties vides **omises** ;
      préfixe « Partie N » cohérent avec le nombre réel.
- [ ] Parties lues **repliées** en bandeau « ✓ Lu » (bleu), **re-dépliables**.
- [ ] La **dernière** partie (synthèse) porte le bouton **« ✓ J'ai lu mon retour — clore la
      semaine »** ; le clic pose `retour_vf_lu_at` → `DONE` (action inchangée).
- [ ] **Aucune pastille de check en vert** ; vert réservé au statut « Terminée » et à l'accent
      architecture. Aucun hex en dur (jetons + `font-*`).
- [ ] **Fragments / Codex** : `ValidationLecture` **sans** `sequentiel` → comportement
      **identique à avant** (non-régression).
- [ ] Machine à états, retours IA et verrou des retours non lus **inchangés**. Mobile OK (≥44px).
