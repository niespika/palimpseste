# Patch — Tuile sélectionnée : fond plein au lieu de l'anneau

> **Pour Claude Code.** Cible : `components/Tuile.tsx`.
> Aujourd'hui une tuile `selectionnee` reçoit `ring-2 ring-pigment`. Cet anneau
> **se cumule** avec le liseré gauche de la carte et, sur une tuile cliquable, avec
> la bordure de survol (`hover:border-pigment`) → empilement disgracieux de traits.
>
> **Correctif :** la tuile active passe en **couleur pleine** (bloc au pigment du
> module, texte crème), sans anneau. Un seul signal de sélection, lisible. Le survol
> des autres tuiles redevient discret (ombre + bordure neutre).
>
> Référence visuelle : `references/Tuile sélectionnée - avant après.dc.html`.

## Modification de `components/Tuile.tsx`

Remplace le bloc de calcul des classes **et** le JSX `contenu` par ceci :

```tsx
  const accentModule = useTuileAccent()
  const plein = !!selectionnee   // carte active → fond plein (un seul signal, plus d'anneau)

  const bordGauche = module
    ? 'border-l-liseret'
    : accentModule
      ? (couleur === 'rouge' ? 'border-l-retard' : 'border-l-liseret')
      : BORDURE_ETAT[couleur]

  // Survol : si la carte est déjà pleine, on se contente de l'ombre (pas de bordure
  // pigment qui doublonnerait). Sinon, léger rehaut de bordure comme avant.
  const survol = href
    ? (plein
        ? 'hover:shadow-sm'
        : `${accentModule || module ? 'hover:border-pigment' : 'hover:border-muet'} hover:shadow-sm`)
    : ''

  // Carte pleine = bloc au pigment du module (sépia général hors module), bord uni,
  // aucun liseré concurrent. Sinon, surface claire + liseré gauche habituel.
  const carte = plein
    ? `bg-pigment border border-pigment rounded-xl px-4 py-3 h-full transition-colors ${survol}`
    : `bg-surface border border-bordure border-l-4 ${bordGauche} rounded-xl px-4 py-3 h-full transition-colors ${survol}`

  const contenu = (
    <div data-module={module} className={carte}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {avecSceau && module && <Pastille module={module} size={36} />}
          <div className="min-w-0">
            <p className={
              plein
                ? `${module ? 'font-marque font-semibold tracking-wide' : 'font-ui font-medium'} text-surface truncate`
                : (module
                    ? 'font-marque font-semibold tracking-wide text-pigment truncate'
                    : 'font-ui font-medium text-encre truncate')
            }>
              {module ? nom.toUpperCase() : nom}
            </p>
            {sousTitre && (
              <p className={`font-corps text-sm mt-0.5 truncate ${plein ? 'text-surface/75' : 'text-muet'}`}>
                {sousTitre}
              </p>
            )}
          </div>
        </div>
        {href && <span className={`flex-shrink-0 ${plein ? 'text-surface/70' : 'text-bordure'}`}>→</span>}
      </div>
      {resume && <div className="mt-2">{resume}</div>}
    </div>
  )
```

### Ce qui change concrètement
- **Supprime** la variable `anneau` (le `ring-2 ring-pigment` / `ring-2 ring-muet`) et son usage dans `className`.
- La sélection est désormais portée par `bg-pigment` + bord uni `border-pigment`, texte `text-surface`.
- Le survol ne pose plus de bordure pigment quand la carte est déjà pleine.

> **Note de compatibilité :** ce code suppose le patch #2 appliqué (`border-l-liseret`).
> S'il ne l'est pas encore, remplace les deux `'border-l-liseret'` ci-dessus par
> `'border-l-pigment'` — la logique de sélection (fond plein) est indépendante.

> `text-surface/75` et `/70` : Tailwind v4 gère l'opacité sur les couleurs de thème
> (`@theme inline --color-surface`) via `color-mix`. Si ton build ne les génère pas,
> remplace par `text-surface` tout court (le crème ressort déjà bien sur le pigment).

## Vérification
- Ouvrir un sélecteur à base de `<Tuile … selectionnee>` : page **prof/quazian/diagnostic**
  (onglets « Par classe / Par unité / Flashcards »), **prof/quazian/parametres**,
  ou un sélecteur de classe (prof/eleves, prof/classes…).
- La tuile active doit être un **bloc plein** (pigment du module, ou sépia `#5A4632`
  hors module) ; **plus d'anneau** ; le survol des autres tuiles reste discret.

## Optionnel — mêmes empilements ailleurs (hors composant Tuile)
Deux sélections par anneau analogues, à harmoniser si tu veux la même logique :
- `prof/fragments-erudition/parametres/FormulaireParametres.tsx` (l.113) :
  `active ? 'border-l-pigment ring-2 ring-pigment'` → fond plein `bg-pigment text-surface`.
- `prof/aletheia/FormulaireParametresAletheia.tsx` (l.92) : `'ring-2 ring-pigment'`
  → idem si ces vignettes doivent suivre la même convention.
