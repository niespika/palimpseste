# Spécifications — Étape 1 : Socle du site pédagogique

## 1. Contexte général du projet

Je suis professeur de philosophie et d'humanités dans un lycée français. Je construis une plateforme pédagogique web pour mes élèves. La vision d'ensemble : un site modulaire où chaque élève se connecte et accède à des « modules » pédagogiques (Fragments d'érudition, Quiz, Aide à l'essai, Analyse de texte, etc.) que j'active individuellement pour chacun. Certains modules feront appel à l'API Claude (Anthropic) pour analyser des travaux d'élèves et produire des retours.

**Cette étape 1 ne construit que le socle.** Aucun module fonctionnel, aucun appel à l'IA, aucun dépôt de fichier. Uniquement : authentification, rôles, tableaux de bord, structure de base de données prête pour la suite, déploiement.

Je n'ai aucune connaissance en programmation. Explique-moi chaque action que je dois faire moi-même (création de comptes Supabase/Vercel, variables d'environnement, etc.) pas à pas, comme à un débutant complet.

## 2. Pile technique imposée

- **Next.js** (dernière version stable, App Router, TypeScript)
- **Supabase** : authentification, base de données PostgreSQL, et plus tard stockage de fichiers
- **Tailwind CSS** pour le style
- **Vercel** pour l'hébergement, connecté à mon repo GitHub (déploiement automatique à chaque push)
- Toute l'interface utilisateur est **en français**

Aucune clé secrète ne doit jamais être écrite dans le code ou poussée sur GitHub : tout passe par des variables d'environnement (`.env.local` en local, variables de projet sur Vercel). Fournis un fichier `.env.example` documentant les variables nécessaires.

## 3. Rôles et authentification

### 3.1 Deux rôles

- **prof** : moi, l'administrateur unique du site.
- **eleve** : mes élèves.

### 3.2 Page de connexion unique

- Une seule page de connexion (`/login`) : champ courriel + mot de passe.
- Après connexion, redirection automatique selon le rôle :
  - rôle `prof` → `/prof` (tableau de bord professeur)
  - rôle `eleve` → `/eleve` (tableau de bord élève)
- Pas d'inscription libre (« sign up ») : **les comptes élèves sont créés uniquement par le prof** depuis son interface. C'est essentiel : il s'agit d'élèves mineurs, le site ne doit pas être ouvert au public.
- Page d'accueil (`/`) : si non connecté, redirige vers `/login` ; si connecté, redirige vers le tableau de bord du rôle.

### 3.3 Protection des routes

- Toutes les pages sous `/prof/*` sont inaccessibles sans session avec rôle `prof`.
- Toutes les pages sous `/eleve/*` sont inaccessibles sans session avec rôle `eleve`.
- Un élève qui tente d'accéder à `/prof` est redirigé vers `/eleve`, et inversement.
- La protection doit exister **côté serveur** (middleware ou vérification serveur), pas seulement côté client.
- Bouton de déconnexion visible sur chaque tableau de bord.

### 3.4 Sécurité des données (Row Level Security)

Active la Row Level Security de Supabase sur toutes les tables, avec des politiques garantissant :
- un élève ne peut lire et modifier que ses propres données ;
- le prof peut lire et modifier les données de tous les élèves ;
- aucune donnée accessible sans authentification.

## 4. Base de données (préparer la modularité dès maintenant)

Créer les tables suivantes (fournis le script SQL à exécuter dans Supabase, avec les politiques RLS) :

### `profiles`
Liée à `auth.users` de Supabase (création automatique via trigger à la création d'un utilisateur).
- `id` (uuid, référence auth.users)
- `role` (enum : `prof` | `eleve`)
- `display_name` (texte) — prénom ou pseudonyme de l'élève. **Par souci de protection des données de mineurs, le site n'a pas besoin du nom complet.**
- `classe` (texte, optionnel) — ex. « Terminale HLP », « Première HLP »
- `created_at`

### `modules`
Le catalogue des modules du site.
- `id` (uuid)
- `slug` (texte unique, ex. `fragments-erudition`)
- `nom` (texte, ex. « Fragments d'érudition »)
- `description` (texte)
- `actif` (booléen) — permet de masquer un module en construction
- `created_at`

Insérer dès maintenant une ligne : slug `fragments-erudition`, nom « Fragments d'érudition », description « Recherches hebdomadaires sur un thème personnel, compte-rendu manuscrit et retours détaillés », `actif = false`.

### `module_assignments`
Quels modules sont activés pour quel élève.
- `id` (uuid)
- `eleve_id` (uuid → profiles)
- `module_id` (uuid → modules)
- `created_at`
- contrainte d'unicité sur (eleve_id, module_id)

## 5. Tableau de bord professeur (`/prof`)

Trois sections (pages ou onglets) :

### 5.1 Élèves
- Liste de tous les comptes élèves : nom affiché, classe, courriel, date de création, modules activés.
- Bouton « Ajouter un élève » : formulaire avec courriel, mot de passe provisoire, nom affiché, classe. La création du compte se fait côté serveur (clé service role de Supabase, jamais exposée au navigateur).
- Possibilité de modifier le nom affiché et la classe, de réinitialiser le mot de passe, et de désactiver/supprimer un compte.

### 5.2 Modules
- Liste des modules du catalogue avec leur statut (actif / en construction).
- Pour chaque module : voir et modifier la liste des élèves qui y ont accès (cases à cocher ou équivalent simple).

### 5.3 Accueil du tableau de bord
- Vue d'ensemble simple : nombre d'élèves, nombre de modules actifs. (Les statistiques de travaux viendront aux étapes suivantes.)

## 6. Tableau de bord élève (`/eleve`)

- Message d'accueil avec le nom affiché de l'élève.
- Grille de cartes : **uniquement** les modules activés pour cet élève (et marqués `actif` dans le catalogue).
- Si aucun module n'est activé : message bienveillant du type « Aucun module n'est encore activé pour toi. Ton professeur les activera bientôt. »
- Cliquer sur une carte mène à `/eleve/modules/[slug]` — pour l'instant une page « Ce module arrive bientôt » (les vraies interfaces viendront aux étapes suivantes).

## 7. Architecture du code : penser modulaire

Organiser le code pour que l'ajout d'un futur module soit simple et localisé :
- un dossier par module (ex. `modules/fragments-erudition/`) regroupant ses composants élève et prof ;
- les tableaux de bord découvrent les modules via la table `modules`, pas via du code en dur ;
- documenter dans un fichier `ARCHITECTURE.md` à la racine : la structure du projet, le schéma de base de données, et la procédure à suivre pour ajouter un nouveau module à l'avenir.

## 8. Design

- Sobre, clair, lisible : c'est un outil de travail scolaire.
- Responsive : les élèves utiliseront souvent un téléphone (notamment, plus tard, pour photographier leurs copies).
- Interface entièrement en français, tutoiement pour les élèves, vouvoiement neutre ou tutoiement pour le prof (au choix, rester cohérent).

## 9. Hors périmètre de l'étape 1 (ne PAS construire)

- Dépôt de fichiers ou de photos
- Tout appel à l'API Claude / Anthropic
- Le contenu réel du module Fragments d'érudition
- Évaluations, notes, graphiques de suivi
- Notifications, courriels automatiques

## 10. Critères d'acceptation

L'étape 1 est terminée quand :

1. Le site est déployé sur Vercel et accessible via une URL publique.
2. Je peux me connecter avec mon compte prof et j'arrive sur `/prof`.
3. Depuis `/prof`, je crée un compte élève de test ; je peux me connecter avec ce compte (dans un autre navigateur) et j'arrive sur `/eleve`.
4. L'élève de test ne voit aucun module ; je lui assigne « Fragments d'érudition » depuis mon interface ; il ne le voit toujours pas tant que le module est `actif = false` ; je passe le module à actif ; la carte apparaît sur son tableau de bord.
5. L'élève connecté qui tape l'URL `/prof` est redirigé vers `/eleve`.
6. Une personne non connectée qui tape n'importe quelle URL du site est redirigée vers `/login`.
7. Aucune clé secrète n'apparaît dans le repo GitHub.
8. Le fichier `ARCHITECTURE.md` existe et décrit la procédure d'ajout d'un module.

## 11. Méthode de travail demandée

- Procède par petites étapes et explique-moi ce que tu fais au fur et à mesure, en termes simples.
- Quand une action manuelle m'incombe (créer le projet Supabase, exécuter le SQL, configurer Vercel), donne-moi la liste exacte des clics et des champs à remplir.
- À la fin, fournis-moi un petit guide « prise en main » : comment créer mes vrais comptes élèves, comment assigner des modules.
