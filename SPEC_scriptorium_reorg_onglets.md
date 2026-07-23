# SPEC — Scriptorium : réorganisation des onglets (6 → 4)

> **Statut** : à implémenter (Code). **Réorganisation rapide uniquement** — aucun changement
> de modèle de données, aucune nouvelle fonctionnalité. On **déplace** ce qui existe déjà,
> on réutilise les vues `?vue=` telles quelles.
> **Prérequis lu** :
> - `components/nav/configModules.ts` (source de vérité des sous-onglets, Barre 2)
> - `components/nav/EnTeteSite.tsx` (rendu Barre 2 desktop + surbrillance onglet actif)
> - `components/nav/SousNavModuleMobile.tsx` (mêmes sous-onglets sur mobile)
> - `app/prof/scriptorium/page.tsx` (page unique pilotée par `?vue=`)
>
> **Important — périmètre** : ceci est une passe d'**organisation** (où vivent les sections),
> pas d'esthétique. L'habillage visuel, la vraie hiérarchie et une sous-navigation soignée
> seront refaits **ensuite avec Design**. Ici : **le plus petit diff possible** qui obtient la
> nouvelle structure d'onglets. Ne pas sur-concevoir.

---

## 0. Résumé exécutif

Scriptorium expose aujourd'hui **6 sous-onglets** (Barre 2) : *Par classe · Textes · Cours ·
Parcours · Livres · Paramètres*, plus une **barre « Plan d'évaluation »** (gatée) qui s'affiche
**en haut de toutes les vues** — c'est trop, et le plan d'évaluation « apparaît partout » sans
avoir sa place.

On passe à **4 onglets** : **Classes · Parcours · Ressources · Paramètres**.

| Nouvel onglet | `?vue=` porté | Contenu |
|---|---|---|
| **Classes** | `classes` | Inchangé, **+** accès au plan d'évaluation spécifique de la classe dans le détail |
| **Parcours** | `parcours` (+ `evaluations`, `modeles`) | Parcours **+** accès aux plans d'évaluation (la barre plan, recentrée ici) |
| **Ressources** | `ressources` (+ `textes`, `cours`, `livres`) | **Nouveau hub** : 3 tuiles Textes / Cours / Livres → vues existantes |
| **Paramètres** | `parametres` | Inchangé |

Les vues `textes`, `cours`, `livres`, `evaluations`, `modeles` **existent déjà et ne changent pas** :
elles sont simplement **regroupées** sous un onglet parent et atteintes autrement. Le seul écran
réellement neuf est le **hub Ressources** (3 tuiles).

**Principe de coût** : réutiliser au maximum. La barre « Plan d'évaluation » actuelle n'est pas
réécrite — on **restreint** juste sa condition d'affichage au groupe Parcours. Aucune fusion de
vues, aucune nouvelle sous-navigation à onglets (ce sera le travail de Design).

---

## 1. Contexte technique (état actuel, vérifié)

- **Une seule page** : `app/prof/scriptorium/page.tsx`, pilotée par `searchParams.vue`
  (défaut `'classes'`). Chaque valeur de `vue` rend un bloc conditionnel.
- **Les onglets ne sont pas dans la page** : ils sont déclarés dans
  `components/nav/configModules.ts` → `MODULES` → entrée `cle: 'scriptorium'` →
  `sousOngletsProf` (6 entrées, chacune `{ href, label, vue }`).
- **Surbrillance de l'onglet actif** : pilotée par `?vue=`.
  - Desktop : `EnTeteSite.tsx` → `SousOngletsParam` → `actif={(o) => o.vue === vue}`.
  - Mobile : `SousNavModuleMobile.tsx` → `BarreParam` → `actif={(o) => o.vue === vue}`.
  - ⚠️ C'est une **égalité stricte** `o.vue === vue`. Dès qu'une vue (ex. `textes`) n'est plus
    portée par un onglet, **aucun onglet ne s'allume** → il faut passer à une correspondance
    **par groupe** (cf. §2.2). C'est le seul changement « nav » nécessaire, il est petit.
- **Plan d'évaluation** : gaté par `planEvalActif` (`lireGatePlanActif`, lu dans le `Promise.all`
  initial). Rendu par une **barre en tête de page** (page.tsx, bloc `{planEvalActif && (…)}`,
  ~l.304‑316) avec deux liens `vue=modeles` (« Modèles ») et `vue=evaluations` (« Par classe »),
  visible **quelle que soit la vue** → à recentrer.
- **La barre mobile du bas** (`BarreOngletsMobileProf.tsx`) est la nav de **premier niveau**
  (Tableau / Pilotage / Modules / Moi) : **elle n'est pas concernée**.
- ⚠️ Ne pas confondre avec le module **Pilotage → Classes** (`/prof/classes`, matrice élèves ×
  modules) : c'est une **route différente**, hors périmètre. Ici « Classes » = l'onglet
  Scriptorium `?vue=classes`.

---

## 2. Changements — navigation (Barre 2)

### 2.1 `components/nav/configModules.ts` — passer à 4 onglets + groupes de vues

Dans l'interface `SousOnglet`, **ajouter** un champ optionnel de regroupement :

```ts
export interface SousOnglet {
  href: string
  label: string
  /** Vue qui rend cet onglet actif (onglets pilotés par ?vue=). */
  vue?: string
  /** Vues (y compris `vue`) qui allument cet onglet. Défaut = [vue].
   *  Permet qu'un onglet parent reste actif sur ses sous-vues regroupées. */
  vues?: string[]
}
```

Remplacer le `sousOngletsProf` de l'entrée `scriptorium` (les 6 actuelles) par **4 entrées** :

```ts
sousOngletsProf: [
  { href: '/prof/scriptorium?vue=classes',    label: 'Classes',    vue: 'classes',    vues: ['classes'] },
  { href: '/prof/scriptorium?vue=parcours',   label: 'Parcours',   vue: 'parcours',   vues: ['parcours', 'evaluations', 'modeles'] },
  { href: '/prof/scriptorium?vue=ressources', label: 'Ressources', vue: 'ressources', vues: ['ressources', 'textes', 'cours', 'livres'] },
  { href: '/prof/scriptorium?vue=parametres', label: 'Paramètres', vue: 'parametres', vues: ['parametres'] },
]
```

Notes :
- L'ordre fait foi (Classes en premier → cohérent avec le défaut `vue='classes'` de la page).
- On garde `vue` (canonique, sert au `href` et au repli de défaut) **et** on ajoute `vues`.

### 2.2 Surbrillance par groupe (2 fichiers)

Remplacer l'égalité stricte par une **appartenance au groupe**. Helper identique des deux côtés :

```ts
const estActif = (o: { vue?: string; vues?: string[] }) =>
  (o.vues ?? (o.vue ? [o.vue] : [])).includes(vue)
```

- **`components/nav/EnTeteSite.tsx`** → dans `SousOngletsParam`, remplacer
  `actif={(o) => o.vue === vue}` par `actif={estActif}`.
  Adapter de la même façon le **fallback** du `<Suspense>` (actuellement
  `actif={(o) => o.vue === mod.sousOngletsProf[0]?.vue}`) pour rester cohérent — au repli,
  allumer le **premier** onglet (Classes) suffit.
- **`components/nav/SousNavModuleMobile.tsx`** → dans `BarreParam`, même remplacement
  `actif={(o) => o.vue === vue}` → `actif={estActif}` (et le fallback de sa `Suspense`).

Ainsi : `vue=textes|cours|livres` allume **Ressources** ; `vue=evaluations|modeles` allume
**Parcours** ; `vue=parcours` avec un `parcours=…` ouvert reste sur **Parcours** ; etc.

### 2.3 Effet de bord cosmétique (à ignorer)

`EnTeteSite.tsx` calcule `sousOngletsCompacts = mod.sousOngletsProf.length >= 6`. Avec 4 onglets,
les sous-onglets ne seront **plus** en mode compact (padding/typo un cran plus grands). C'est
**voulu et sans action** — Design ré-ajustera. Ne rien coder de spécial.

---

## 3. Changements — `app/prof/scriptorium/page.tsx`

Aucune requête de données existante n'est retirée. Les chargements de `textes/cours/livres/
evaluations/modeles` restent identiques (mêmes conditions `vue === …`). On ajoute une vue, on
déplace une barre, on ajoute un lien dans le détail classe.

### 3.1 Nouveau hub **Ressources** (`vue === 'ressources'`)

Ajouter un bloc de rendu quand `vue === 'ressources'` : **3 tuiles** (composant `Tuile`, déjà
importé) menant aux vues existantes.

```tsx
{vue === 'ressources' && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    <Tuile nom="Textes" sousTitre="Extraits réutilisables"  href="/prof/scriptorium?vue=textes" />
    <Tuile nom="Cours"  sousTitre="Supports de cours"        href="/prof/scriptorium?vue=cours"  />
    <Tuile nom="Livres" sousTitre="Œuvres (lecture Aletheia)" href="/prof/scriptorium?vue=livres" />
  </div>
)}
```

- Minimal : **pas de compteurs** sur les tuiles (Design décidera). Si vraiment trivial à brancher
  (nb de contenus par type / nb de livres), c'est un bonus optionnel, sinon s'abstenir.
- Les sous-titres ci-dessus sont indicatifs ; peu importe leur formulation exacte à ce stade.
- **Respecter l'API existante de `Tuile`** (`components/Tuile.tsx`) : mêmes props que les usages
  actuels de cette page (`nom`, `sousTitre`, `href`, `couleur` optionnelle, etc.). Si le typage
  impose une prop, la fournir — ne pas modifier le composant `Tuile`.

### 3.2 Retour vers le hub depuis Textes / Cours / Livres

Pour que le hub soit navigable, ajouter un lien discret **« ← Ressources »**
(`href="/prof/scriptorium?vue=ressources"`) en tête de chacune des vues regroupées :

- **Textes / Cours** : au-dessus du `<BibliothequeContenus … />` (bloc `{biblioType && (…)}`).
- **Livres (liste)** : au-dessus du `<FormulaireLivre … />`, dans la branche **liste**
  (celle sans `uniteSelLivre`, ~l.446‑469).
- **Livre ouvert** (`uniteSelLivre`, `VueLivre`) : **ne pas toucher**. Son retour interne
  (« ← Tous les livres ») ramène déjà à `vue=livres`, qui porte désormais le « ← Ressources ».

C'est le choix **le moins demandant** (simple lien retour, pas de sous-barre d'onglets
Textes·Cours·Livres — ce raffinement est laissé à Design).

### 3.3 Recentrer la barre **Plan d'évaluation** sous Parcours (supprimer le « partout »)

La barre existante (bloc `{planEvalActif && (…)}`, ~l.304‑316) ne doit plus s'afficher partout.
**Restreindre sa condition** au groupe Parcours :

```tsx
{planEvalActif && (estParcours || estEvaluations || estModeles) && (
  /* …barre existante inchangée… */
)}
```

- `estParcours`, `estEvaluations`, `estModeles` sont **déjà** calculés dans la page.
- Dans cette barre, le lien de retour **« ← Scriptorium »** pointe aujourd'hui vers
  `?vue=classes` : le faire pointer vers **`?vue=parcours`** (et, au choix, le libeller
  **« ← Parcours »**), puisque le plan vit maintenant sous Parcours.
- Conserver tels quels les deux liens **« Modèles »** (`vue=modeles`) et **« Par classe »**
  (`vue=evaluations`) : on **garde la bascule actuelle** (pas de fusion Modèles/Classes — décision
  « moins demandant »).

Résultat obtenu, sans autre code :
- `vue=parcours` → barre Plan d'évaluation **au-dessus** de la liste des parcours = les deux
  accès (parcours + plans) cohabitent en **deux sections empilées**.
- `vue=evaluations` / `vue=modeles` → mêmes écrans qu'aujourd'hui (liste classes-avec-plan ;
  liste modèles ; détails ; assignation), retour vers Parcours. La règle « cliquer une classe →
  plan spécifique de la classe » (`vue=evaluations&classe=…`) **fonctionne déjà** et est conservée.
- Toutes les autres vues (classes, ressources, textes, cours, livres, parametres) → **plus de
  barre** plan d'évaluation.

> Gate OFF (`planEvalActif === false`) : aucune barre, aucun lien plan nulle part. **Inchangé.**

### 3.4 Ajouter le plan d'évaluation dans le **détail d'une classe**

Dans le bloc `vue === 'classes'` avec `classeSel` (le panneau détail, ~l.377‑422) qui liste déjà
« Parcours assignés » et « Livres », ajouter — **gaté** — un accès au **plan spécifique de la
classe** :

```tsx
{planEvalActif && (
  <div className="space-y-2">
    <p className="text-xs text-muet uppercase tracking-wide">Plan d'évaluation</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Tuile
        nom="Plan d'évaluation de la classe"
        sousTitre="Voir et ajuster"
        href={`/prof/scriptorium?vue=evaluations&classe=${classeSel}`}
      />
    </div>
  </div>
)}
```

- **Le moins demandant** : une tuile/lien vers la vue **existante** `vue=evaluations&classe=…`
  (le plan spécifique de la classe). **Ne pas** embarquer `GrillePlan` en inline ici.
- Statut du plan en sous-titre (validé / brouillon / aucun) = **bonus optionnel** seulement si les
  données sont déjà en main sans requête supplémentaire ; sinon laisser sans sous-titre.
- Placer cette section à côté des sections « Parcours assignés » / « Livres » existantes ; adapter
  au besoin le message vide « ni parcours ni livre » pour ne pas contredire la présence du plan.

### 3.5 Copies internes référençant les anciens onglets

Corriger les libellés qui nomment des onglets disparus :

- Message vide du détail classe (~l.419) : « …ou un livre depuis **« Livres »** » →
  remplacer « Livres » par **« Ressources »**.
- Balayer le fichier (et le reste de `app/prof/scriptorium/`) pour toute mention résiduelle
  « onglet Textes/Cours/Livres » dans des textes d'aide ; réaligner sur « Ressources » si présent.
  (Les liens `href="…?vue=textes|cours|livres|parcours|evaluations|modeles"` restent **valides** —
  ne pas les changer, seuls les **libellés d'onglet** ont bougé.)

---

## 4. Comportements à préserver (non-régression)

1. **Toutes les vues `?vue=` restent joignables** : `classes, parcours, ressources, textes, cours,
   livres, parametres, evaluations, modeles`. On ne renomme **aucune** valeur de `vue`.
2. **Gate plan d'évaluation** : tout le plan (barre sous Parcours + tuile dans le détail classe)
   reste sous `planEvalActif`. Gate OFF ⇒ page prof identique à avant sur ce point.
3. **Parité desktop / mobile** : la surbrillance par groupe (§2.2) doit être appliquée aux **deux**
   (`EnTeteSite.tsx` et `SousNavModuleMobile.tsx`) — même helper, même résultat.
4. **Liens profonds inchangés** : `?vue=livres&unite=…`, `?vue=parcours&parcours=…`,
   `?vue=evaluations&classe=…`, `?vue=modeles&modele=…` continuent de fonctionner et allument le
   bon onglet parent (Ressources / Parcours).
5. **Défaut** : `/prof/scriptorium` sans param ⇒ `vue='classes'` ⇒ onglet **Classes** actif.
6. Aucune migration SQL, aucune Server Action modifiée, aucun composant de vue
   (`BibliothequeContenus`, `GrilleParcours`, `GrillePlan`, `GrilleModele`, `VueLivre`, …) touché
   dans sa logique.

---

## 5. Hors périmètre (⇒ Design, plus tard)

- Toute l'**esthétique** (tuiles du hub, hiérarchie visuelle, icônes, couleurs, densité).
- Une **sous-navigation à onglets** Textes·Cours·Livres dans Ressources (ici : simple lien retour).
- Une **sous-navigation** Parcours·Plans dans l'onglet Parcours (ici : réutilisation de la barre).
- La **fusion** Modèles + Classes sur un seul écran de plans (ici : on garde la bascule actuelle).
- Compteurs / badges sur les tuiles du hub Ressources.
- Ré-équilibrage du mode compact des sous-onglets (déclenché mécaniquement par le passage à 4).

Ces points sont **volontairement** laissés de côté : cette passe ne fait que **replacer les
sections** dans la nouvelle ossature à 4 onglets, au plus petit coût.

---

## 6. Checklist de recette

- [ ] Barre 2 affiche exactement **4 onglets** : Classes · Parcours · Ressources · Paramètres
  (desktop **et** mobile).
- [ ] `?vue=textes`, `?vue=cours`, `?vue=livres` → onglet **Ressources** en surbrillance.
- [ ] `?vue=parcours`, `?vue=evaluations`, `?vue=modeles` → onglet **Parcours** en surbrillance.
- [ ] `vue=ressources` affiche les 3 tuiles ; chacune ouvre la bonne vue ; « ← Ressources » y ramène.
- [ ] Onglet **Parcours** : la barre Plan d'évaluation apparaît au-dessus des parcours ; « Modèles »
  et « Par classe » fonctionnent ; retour → Parcours.
- [ ] Barre Plan d'évaluation **absente** sur Classes, Ressources, Textes, Cours, Livres, Paramètres.
- [ ] Détail d'une classe : tuile **Plan d'évaluation** → `vue=evaluations&classe=…` (le plan de
  cette classe). Présente seulement si gate ON.
- [ ] **Gate OFF** : aucun élément plan d'évaluation où que ce soit ; reste des onglets intact.
- [ ] Aucune copie ne mentionne encore un onglet « Textes/Cours/Livres » disparu.
- [ ] `npm run lint` / build OK ; `/prof/scriptorium` sans param ⇒ Classes.
