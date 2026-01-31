# Palimpseste

Socle Next.js (App Router) pour une plateforme éducative privée dédiée à la philosophie/HLP.

## Prérequis

- Node.js 18+
- npm, pnpm ou yarn

## Installation

```bash
npm install
```

## Démarrage en local

```bash
npm run dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000).

## Structure

- `app/` : routes et layouts via l'App Router.
- `components/` : composants réutilisables.
- `lib/` : helpers, configuration et logique partagée.

## Ticket 0.3

### Test manuel

1. Lancez l'app en local : `npm run dev`.
2. Connectez-vous avec le compte professeur (teacher@palimpseste.fr / teacher123).
3. Dans `/dashboard/teacher`, créez une classe puis ajoutez un ou plusieurs élèves.
4. Rafraîchissez la page : la classe et les élèves doivent être toujours visibles.
5. Vérifiez qu'un compte élève est redirigé vers `/login` s'il tente d'accéder à `/dashboard/teacher`.

## Ticket 1.1

### Test manuel

1. Lancez l'app en local : `npm run dev`.
2. Connectez-vous avec le compte professeur (teacher@palimpseste.fr / teacher123).
3. Dans `/dashboard/teacher`, utilisez la section “Parcours” pour créer un nouveau parcours (titre, niveau, nombre de chapitres).
4. Vérifiez que le parcours apparaît dans la liste et que le clic affiche ses détails.
5. Rafraîchissez la page : le parcours doit toujours être visible.

## Ticket 1.2

### Test manuel

1. Lancez l'app en local : `npm run dev`.
2. Connectez-vous avec le compte professeur (teacher@palimpseste.fr / teacher123).
3. Dans `/dashboard/teacher`, sélectionnez un parcours existant (ou créez-en un).
4. Vérifiez que la liste des chapitres s'affiche avec les titres par défaut.
5. Renommez un chapitre, ajoutez des objectifs, et passez son statut à “Validé”.
6. Réordonnez deux chapitres avec les boutons “↑ / ↓”.
7. Rafraîchissez la page : les modifications et l'ordre des chapitres doivent être conservés.
