# Spécifications — Étape 2 : Dépôt des comptes-rendus (module Fragments d'érudition)

## 1. Contexte

L'étape 1 (socle : authentification, rôles, tableaux de bord, tables `profiles`, `modules`, `module_assignments`) est terminée et déployée. Lis le fichier `ARCHITECTURE.md` et le fichier `specifications-etape-1.md` pour comprendre l'existant avant de commencer.

Cette étape 2 construit la première fonctionnalité réelle du module **Fragments d'érudition** : le dépôt par les élèves de leur compte-rendu hebdomadaire manuscrit, photographié au téléphone, et sa consultation par le professeur.

**Rappel pédagogique** (pour comprendre ce qu'on construit) : chaque élève travaille toute l'année sur un thème personnel choisi avec le professeur. Chaque semaine, il fait des recherches et rédige à la main un compte-rendu recto-verso en trois sections : (1) ce qu'il a découvert, (2) les sources consultées, (3) ses réflexions. Il photographie sa feuille et la dépose sur le site.

**Hors périmètre de cette étape** : aucun appel à l'IA, aucune évaluation, aucun retour sur le travail, aucun graphique. Uniquement le dépôt et la consultation.

## 2. Nouvelles tables (avec script SQL et politiques RLS)

### `fragments_themes`
Le thème annuel de chaque élève pour ce module.
- `id` (uuid)
- `eleve_id` (uuid → profiles, unique)
- `theme` (texte, ex. « La piraterie dans l'océan Indien », « L'histoire du rire »)
- `description` (texte, optionnel — cadrage du thème décidé avec le prof)
- `created_at`, `updated_at`

Seul le prof peut créer et modifier les thèmes. L'élève peut lire le sien.

### `fragments_semaines`
Les semaines de travail, créées par le prof.
- `id` (uuid)
- `numero` (entier, ex. 1, 2, 3…)
- `titre` (texte, optionnel, ex. « Semaine du 14 septembre »)
- `date_debut` (date)
- `date_limite` (timestamp — date et heure limites de dépôt)
- `ouverte` (booléen — une semaine fermée n'accepte plus de dépôts)
- `created_at`

### `fragments_depots`
Les comptes-rendus déposés.
- `id` (uuid)
- `eleve_id` (uuid → profiles)
- `semaine_id` (uuid → fragments_semaines)
- `statut` (enum : `depose` | `en_retard`) — calculé à la soumission selon la date limite
- `commentaire_eleve` (texte, optionnel — petit champ libre, ex. « la photo 2 est un peu floue »)
- `created_at`, `updated_at`
- contrainte d'unicité sur (eleve_id, semaine_id) — un seul dépôt par élève et par semaine, mais remplaçable (voir 4.3)

### `fragments_photos`
Les photos d'un dépôt.
- `id` (uuid)
- `depot_id` (uuid → fragments_depots)
- `storage_path` (texte — chemin dans Supabase Storage)
- `ordre` (entier — 1 pour le recto, 2 pour le verso, etc.)
- `created_at`

### Stockage
- Créer un bucket Supabase Storage **privé** nommé `fragments`.
- Chemins de la forme : `{eleve_id}/{semaine_id}/{nom_fichier}`.
- Politiques d'accès : un élève ne peut écrire et lire que dans son propre dossier ; le prof peut tout lire. Aucun accès public. L'affichage des images passe par des URL signées à durée limitée.

## 3. Traitement des photos (important)

Les élèves photographieront leur feuille au téléphone : fichiers lourds (3 à 10 Mo), parfois au format HEIC (iPhone), parfois mal orientés.

- Accepter JPEG, PNG et HEIC à la sélection.
- **Compresser et convertir côté client avant l'envoi** : conversion en JPEG, redimensionnement à 2000 px maximum sur le grand côté, qualité ~80 %. Objectif : des fichiers de quelques centaines de Ko, parfaitement lisibles. (C'est important pour les coûts de stockage et, à l'étape suivante, pour l'envoi à l'API d'analyse.)
- Respecter l'orientation EXIF (pas de photos couchées).
- Entre 1 et 4 photos par dépôt (cas normal : 2, recto et verso).
- Afficher un aperçu des photos avant la confirmation du dépôt, avec possibilité d'en retirer ou d'en réordonner.

## 4. Interface élève (`/eleve/modules/fragments-erudition`)

Remplace la page « Ce module arrive bientôt ».

### 4.1 En-tête
- Le thème de l'élève, bien visible (ex. « Ton thème : La piraterie dans l'océan Indien »).
- Si aucun thème n'est encore défini : « Ton thème sera défini avec ton professeur » et le dépôt reste possible.

### 4.2 Semaine en cours
- La semaine ouverte la plus récente, avec sa date limite et un indicateur clair : « Dépôt à faire » / « Déposé ✓ » / « Déposé en retard ».
- Bouton « Déposer mon compte-rendu » : sélection des photos (depuis l'appareil photo ou la galerie — sur mobile, `capture` doit proposer l'appareil photo), aperçu, champ commentaire optionnel, confirmation.
- L'interface doit être **irréprochable sur téléphone** : c'est le cas d'usage principal.

### 4.3 Remplacement
- Tant que la semaine est ouverte, l'élève peut remplacer son dépôt (nouvelles photos écrasent les anciennes). Après fermeture, plus aucune modification.

### 4.4 Historique
- Liste de ses dépôts passés, par semaine, avec statut et accès à ses propres photos.

## 5. Interface professeur (`/prof`, section Fragments d'érudition)

Ajouter une entrée « Fragments d'érudition » dans le tableau de bord prof.

### 5.1 Gestion des semaines
- Créer une semaine (numéro proposé automatiquement, dates, date limite).
- Ouvrir / fermer une semaine manuellement. (Pas de fermeture automatique nécessaire pour l'instant : le statut `en_retard` est calculé par rapport à la date limite, et je fermerai à la main.)

### 5.2 Gestion des thèmes
- Tableau des élèves ayant accès au module, avec leur thème ; édition directe du thème et de sa description.

### 5.3 Vue par semaine (l'écran principal)
- Sélecteur de semaine.
- Tableau de tous les élèves ayant accès au module, avec pour chacun : statut (déposé / en retard / manquant), date et heure du dépôt, commentaire éventuel.
- Les manquants doivent être visibles d'un coup d'œil (code couleur).
- Clic sur un élève → visionneuse des photos de son dépôt : navigation recto/verso, zoom (les copies manuscrites doivent être confortablement lisibles à l'écran), rotation manuelle au besoin, téléchargement.

### 5.4 Vue par élève
- Depuis la fiche d'un élève : l'historique complet de ses dépôts, semaine par semaine.

## 6. Petites retouches au socle

- Sur le tableau de bord élève, la carte du module affiche désormais un état utile : « Semaine 3 — à déposer avant dimanche 18 h » ou « Semaine 3 — déposé ✓ ».
- Mettre à jour `ARCHITECTURE.md` : nouvelles tables, bucket de stockage, structure du dossier `modules/fragments-erudition/`.

## 7. Critères d'acceptation

L'étape 2 est terminée quand :

1. En tant que prof, je crée la « Semaine 1 » avec une date limite future, et je définis le thème d'un élève de test.
2. Connecté comme élève sur un **téléphone**, je vois mon thème et la semaine 1, je photographie une feuille recto-verso, je dépose les deux photos avec un commentaire ; l'opération prend moins d'une minute et les fichiers envoyés font moins de 1 Mo chacun.
3. Je peux remplacer mon dépôt tant que la semaine est ouverte ; après fermeture par le prof, le bouton disparaît.
4. Un dépôt effectué après la date limite (mais avant fermeture) est marqué « en retard ».
5. En tant que prof, dans la vue Semaine 1, je vois qui a déposé, qui est en retard, qui n'a rien rendu ; j'ouvre le dépôt de l'élève de test et je lis confortablement ses deux photos (zoom fluide).
6. Un élève ne peut en aucun cas accéder aux photos d'un autre élève (vérifier en manipulant les URL).
7. Les photos ne sont pas accessibles publiquement (une URL copiée dans une fenêtre de navigation privée, sans connexion, ne montre rien après expiration de la signature).
8. `ARCHITECTURE.md` est à jour.

## 8. Méthode de travail demandée

Comme à l'étape 1 : procède par petites étapes, explique-moi en termes simples, et indique-moi précisément toute action manuelle à faire dans Supabase (création du bucket, exécution du SQL, politiques de stockage). Termine par un mini-guide : créer une semaine, définir un thème, consulter les dépôts.
