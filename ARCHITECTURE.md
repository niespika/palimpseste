# Architecture — Palimpseste

## Structure du projet

```
palimpseste/
├── app/                        # Pages et routes (Next.js App Router)
│   ├── login/                  # Page de connexion
│   │   ├── page.tsx            # Interface de connexion
│   │   └── actions.ts          # Action serveur : signInWithPassword
│   ├── prof/                   # Espace professeur (protégé : rôle prof)
│   │   ├── layout.tsx          # En-tête + vérification rôle
│   │   ├── page.tsx            # Tableau de bord (stats)
│   │   ├── actions.ts          # Déconnexion
│   │   ├── eleves/             # Gestion des élèves
│   │   │   ├── page.tsx        # Liste + création
│   │   │   ├── actions.ts      # CRUD élèves (via clé service_role)
│   │   │   ├── FormulaireAjoutEleve.tsx
│   │   │   └── LigneEleve.tsx
│   │   └── modules/            # Gestion des modules
│   │       ├── page.tsx        # Liste + assignation
│   │       ├── actions.ts      # Toggle actif, sauvegarder assignments
│   │       └── GestionModule.tsx
│   ├── eleve/                  # Espace élève (protégé : rôle eleve)
│   │   ├── layout.tsx          # En-tête + vérification rôle
│   │   ├── page.tsx            # Grille des modules activés
│   │   ├── actions.ts          # Déconnexion
│   │   └── modules/[slug]/     # Page d'un module
│   │       └── page.tsx
│   ├── layout.tsx              # Layout racine (html, body, fonts)
│   └── page.tsx                # Redirection selon rôle
├── modules/                    # Dossiers des modules pédagogiques
│   └── fragments-erudition/    # Prêt pour l'étape 2
├── types/
│   └── index.ts                # Types TypeScript partagés
├── utils/supabase/
│   ├── client.ts               # Client navigateur (anon key)
│   ├── server.ts               # Client serveur (anon key + cookies)
│   └── admin.ts                # Client admin (service_role — serveur uniquement)
├── middleware.ts               # Protection des routes (session)
├── .env.example                # Variables d'environnement nécessaires
└── ARCHITECTURE.md             # Ce fichier
```

## Schéma de base de données

### `profiles`
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Référence `auth.users.id` |
| `role` | enum `prof\|eleve` | Rôle de l'utilisateur |
| `display_name` | text | Prénom ou pseudonyme |
| `classe` | text (nullable) | Ex. « Terminale HLP » |
| `created_at` | timestamptz | Date de création |

### `modules`
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `slug` | text (unique) | Identifiant URL, ex. `fragments-erudition` |
| `nom` | text | Nom affiché, ex. « Fragments d'érudition » |
| `description` | text | Description courte |
| `actif` | boolean | Visible par les élèves si `true` |
| `created_at` | timestamptz | |

### `module_assignments`
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `eleve_id` | uuid → `profiles.id` | L'élève concerné |
| `module_id` | uuid → `modules.id` | Le module concerné |
| `created_at` | timestamptz | |
| — | contrainte unique | `(eleve_id, module_id)` |

Un module est visible pour un élève si et seulement si :
1. Il existe une ligne dans `module_assignments` pour cet élève et ce module
2. ET `modules.actif = true`

## Ajouter un nouveau module

1. **Base de données** — Insérer une ligne dans `modules` :
   ```sql
   insert into modules (slug, nom, description, actif)
   values ('mon-module', 'Nom du module', 'Description', false);
   ```

2. **Dossier** — Créer `modules/mon-module/` pour y regrouper les composants.

3. **Page élève** — Créer `app/eleve/modules/mon-module/page.tsx` avec le contenu du module.

4. **Page prof (optionnel)** — Si le module nécessite une interface de correction/suivi pour le prof, créer `app/prof/modules/mon-module/page.tsx`.

5. **Activer** — Depuis `/prof/modules`, passer le module à « Actif » et assigner les élèves concernés. Le tableau de bord élève affiche automatiquement la carte.

## Sécurité

- La clé `SUPABASE_SERVICE_ROLE_KEY` n'est utilisée que dans `utils/supabase/admin.ts`, appelé uniquement depuis des Server Components ou des Server Actions (jamais depuis le navigateur).
- Le middleware rafraîchit la session à chaque requête et redirige les utilisateurs non authentifiés.
- La vérification du rôle (`prof` vs `eleve`) est faite côté serveur dans chaque `layout.tsx`.
- La Row Level Security (RLS) de Supabase garantit qu'un élève ne peut pas lire les données d'un autre élève, même en contournant l'interface.
