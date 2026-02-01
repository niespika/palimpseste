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
4. Vérifiez que le parcours apparaît dans la liste et que le lien “Ouvrir” fonctionne.
5. Rafraîchissez la page : le parcours doit toujours être visible.

## Ticket 1.2

### Test manuel

1. Lancez l'app en local : `npm run dev`.
2. Connectez-vous avec le compte professeur (teacher@palimpseste.fr / teacher123).
3. Dans `/dashboard/teacher`, sélectionnez un parcours existant (ou créez-en un) puis cliquez sur “Ouvrir”.
4. Vérifiez que la liste des chapitres s'affiche avec les titres par défaut.
5. Renommez un chapitre, ajoutez des objectifs, et passez son statut à “Validé”.
6. Réordonnez deux chapitres avec les boutons “↑ / ↓”.
7. Rafraîchissez la page : les modifications et l'ordre des chapitres doivent être conservés.

## Ticket 2.1

### Test manuel

1. Lancez l'app en local : `npm run dev`.
2. Connectez-vous avec le compte professeur (teacher@palimpseste.fr / teacher123).
3. Dans `/dashboard/teacher`, créez un parcours si besoin puis cliquez sur “Ouvrir”.
4. Sur la page détail du parcours, uploadez un fichier `.txt`, `.md` ou `.pdf` dans le bloc “Document de cours”.
5. Vérifiez que le nom du fichier, la date d'upload et le statut d'ingestion apparaissent (pending puis processed).
6. Rafraîchissez la page : le document doit rester associé au parcours.
7. Uploadez un nouveau document et confirmez le remplacement : le fichier affiché doit être mis à jour.

## Ticket 2.2

### Test manuel

1. Lancez l'app en local : `npm run dev`.
2. Connectez-vous avec le compte professeur (teacher@palimpseste.fr / teacher123).
3. Dans `/dashboard/teacher`, ouvrez la section “Ressources”.
4. Créez une ressource texte (titre, contenu, tags) puis vérifiez qu'elle apparaît dans la liste.
5. Créez une ressource image en important un fichier, puis vérifiez l'aperçu et l'entrée dans la liste.
6. Testez les filtres par type et par tag.
7. Cliquez sur “Voir détail” pour consulter une ressource, puis supprimez-la en confirmant.
8. Rafraîchissez la page : les ressources restantes doivent toujours être visibles.

## Ticket 2.3

### Test manuel

1. Lancez l'app en local : `npm run dev`.
2. Connectez-vous avec le compte professeur (teacher@palimpseste.fr / teacher123).
3. Dans `/dashboard/teacher`, ouvrez un parcours avec un document de cours traité.
4. Dans le bloc “Passages”, cliquez sur “Générer les passages”.
5. Vérifiez que le nombre total de passages s'affiche et que la pagination permet de naviguer.
6. Cliquez sur “Voir le passage” pour ouvrir le texte complet.
7. Rafraîchissez la page : la liste des passages doit persister.
8. Cliquez sur “Regénérer les passages” et confirmez : la liste est recréée.

## Ticket 2.4

### Test manuel

1. Lancez l'app en local : `npm run dev`.
2. Connectez-vous avec le compte professeur (teacher@palimpseste.fr / teacher123).
3. Ouvrez un parcours avec un document traité et des passages générés.
4. Dans la liste des passages, utilisez “↑ / ↓” pour réordonner deux passages.
5. Cliquez sur “Fusionner avec le suivant” puis vérifiez que le passage fusionné apparaît.
6. Cliquez sur “Supprimer” et confirmez : le passage doit disparaître et la liste rester ordonnée.
7. Cliquez sur “Voir / Éditer” pour ouvrir un passage.
8. Modifiez le texte dans le textarea puis cliquez sur “Enregistrer”.
9. Testez la scission en entrant un index ou en utilisant le curseur, puis cliquez sur “Scinder”.
10. Revenez à la liste et rafraîchissez la page : toutes les modifications doivent persister.
11. Cliquez sur “Regénérer les passages” et confirmez l'alerte indiquant l'écrasement des modifications manuelles.

## Ticket 3.1

### Test manuel

1. Lancez l'app en local : `npm run dev`.
2. Connectez-vous avec le compte professeur (teacher@palimpseste.fr / teacher123).
3. Ouvrez un parcours qui possède des passages générés.
4. Dans la section “Concepts”, cliquez sur “Proposer des concepts”.
5. Vérifiez que des concepts proposés apparaissent avec leur définition et les passages sources.
6. Ouvrez le détail d'un concept, modifiez le nom et la définition, puis ajoutez un passage source.
7. Retirez un passage source (en gardant au moins un passage) et validez le concept.
8. Appliquez le filtre “Validés” puis “Rejetés” pour vérifier l'affichage.
9. Supprimez un passage source depuis la section “Passages” et vérifiez que les concepts liés sont mis à jour.
