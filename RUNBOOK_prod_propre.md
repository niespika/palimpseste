# Runbook — Prod propre + bac-à-sable (Chemin A)

Objectif : un site **propre** pour les élèves (zéro donnée de test) **et** un bac-à-sable
où continuer à bricoler avec les livres pourris, **sans jamais polluer la prod**.

> **ÉTAT RÉALISÉ LE 24/08/2026 — NE PAS REJOUER LES ÉTAPES HISTORIQUES CI-DESSOUS.**
> La production est le projet Supabase `ucmngachkxvvlegntuwh` ; la sandbox reste
> `aoakpxxlyvthzueaywna`. Vercel `Production` (`main`, `palimpseste.ink`) pointe sur
> la première ; Vercel `Preview` et `.env.local` pointent sur la seconde. La prod a
> reçu le schéma public sans données, `seed_prod.sql`, les cinq buckets privés et
> `c11b_storage_prod.sql`. Elle contient seulement le compte/profil professeur de
> Louis ; aucun élève, classe, parcours, livre ni fichier n'a été copié. Les
> inscriptions publiques Auth y sont désactivées. Les étapes 0–9 sont conservées
> comme **historique de préparation**, pas comme procédure encore à exécuter.

## Le principe (à garder en tête)

Les élèves, livres et classes **ne vivent pas dans une branche git** : ils vivent dans
une **base de données Supabase**. Deux branches git ne peuvent pas avoir des données
différentes — le code est identique. Ce qui diffère, c'est **quelle base chaque
environnement utilise**, réglé par les **variables d'env Vercel**.

```
                      Vercel (1 seul projet)
        ┌─────────────────────┴──────────────────────┐
   Production (branche main)              Preview (branche staging + autres)
   domaine palimpseste.ink                URL *.vercel.app (bac-à-sable)
        │                                            │
   ENV « Production »                         ENV « Preview »
        ▼                                            ▼
   NOUVELLE base Supabase                     Base ACTUELLE (aoakpxxlyvthzueaywna)
   « palimpseste-prod » : schéma cloné,       INTACTE : tous les élèves tests +
   config seedée, ZÉRO donnée → vrais élèves  livres pourris restent ici
```

Sécurité native : l'env « Preview » s'applique à **toutes** les branches sauf la
production → un preview **ne peut jamais** toucher la base des élèves.

Déjà fait dans le repo : branche **`staging`** créée (à partir de `main`) +
**`seed_prod.sql`** (config minimale). Le reste est du travail dans les dashboards
Supabase / Vercel (tes accès requis).

---

## Étape 0 — Pré-requis

- Supabase CLI : `brew install supabase/tap/supabase` (ou `npx supabase ...`).
- Accès dashboard **Supabase** (l'org) + **Vercel**.
- Les **connection strings** des deux bases : Supabase → *Settings ▸ Database ▸
  Connection string ▸ URI* (contient le mot de passe DB). On notera :
  - `SANDBOX_DB_URL` = base actuelle (`aoakpxxlyvthzueaywna`)
  - `PROD_DB_URL` = nouvelle base (créée à l'étape 1)

## Étape 1 — Créer la nouvelle base Supabase (= PROD)

⚠️ Le free tier Supabase = **2 projets actifs PAR ORGANISATION** (pas par compte).
L'org actuelle est pleine (Cogito + Palimpseste) → **crée une NOUVELLE organisation
gratuite** (Dashboard ▸ sélecteur d'org en haut ▸ *New organization*, plan **Free**).
Le Branching de Supabase n'est PAS une option : il exige le plan Pro (25 $/mois).

Puis, dans cette nouvelle org : ▸ **New project**.
- Nom : `palimpseste-prod`. Même **région** que l'actuelle. Mot de passe DB → **noter**.
- Coût : **0 $** (nouvelle org = 2 nouveaux slots free).

Limites free à connaître (sans gravité) : un projet **pause après ~7 j d'inactivité**
(la prod ne pausera pas tant que les élèves l'utilisent ; le bac-à-sable se restaure
en 1 clic, sans perte) ; quotas 500 Mo DB / 1 Go storage / ~50 000 MAU → large pour
une classe.

## Étape 2 — Cloner la STRUCTURE (schéma) vers la nouvelle base

Pas de schéma consolidé dans le repo, et les 39 `.sql` **ne sont pas auto-suffisants**
(tables de base comme `profiles`/`modules` non versionnées). → **Ne pas** rejouer les
`.sql`. On dump la base actuelle, qui fait foi.

```bash
# 1) Structure seule (schéma public), depuis la base ACTUELLE
supabase db dump --db-url "$SANDBOX_DB_URL" --schema public -f schema_public.sql
#    (équivalent : pg_dump "$SANDBOX_DB_URL" --schema-only --schema=public -f schema_public.sql)

# 2) Appliquer sur la NOUVELLE base
psql "$PROD_DB_URL" -f schema_public.sql
```

Recrée toutes les tables, RLS, fonctions, séquences — **sans aucune donnée**.

> Si erreur du type `function gen_random_uuid() does not exist` : active l'extension
> dans Supabase ▸ *Database ▸ Extensions* (`pgcrypto`), puis relance.

## Étape 3 — Copier la CONFIG indispensable (pas les données élèves)

La structure est vide. Sans certaines lignes de config, l'app se dégrade ou n'affiche
rien. Deux options :

**Option recommandée (fidèle) — data-dump ciblé depuis l'actuelle :**

```bash
pg_dump "$SANDBOX_DB_URL" --data-only \
  --table=public.modules \
  --table=public.calendrier_params \
  --table=public.codex_params \
  --table=public.aletheia_params \
  --table=public.integrite_params \
  --table=public.fragments_semestres \
  -f config_data.sql
psql "$PROD_DB_URL" -f config_data.sql
```

→ capture ta **vraie liste de modules** + tes **params actuels** (y compris les
prompts que tu as édités dans l'UI). `modules` est ici **obligatoire** : sinon la
prod n'affiche aucun module.

> Décide **table par table** pour le **calendrier scolaire** (`calendrier_semaines`,
> jours de cours, vacances) : c'est ta structure d'année. Soit tu l'ajoutes en
> `--table=...` pour la reprendre, soit tu redéfinis un calendrier propre pour la
> nouvelle année et tu ne la copies pas.

**Option filet de sécurité (params 100 % par défaut) :** exécuter `seed_prod.sql`
(fourni). Réinsère seulement les singletons `*_params` + le bucket `codex`. À utiliser
si tu veux des prompts = défauts calibrés du code. (Ne dispense **pas** de copier
`modules`.)

## Étape 4 — Recréer les buckets Storage (+ leurs policies)

Le schéma `public` **ne porte pas** les buckets, et **aucune policy Storage n'est
versionnée** (toutes créées à la main). Dans le dashboard de l'**actuelle** : *Storage*
→ relève la liste des buckets et leurs **policies**. Recrée à l'identique dans la
**nouvelle** (même nom, même public/privé) :
- au minimum `codex` (privé) — déjà couvert par `seed_prod.sql` ;
- très probablement aussi : photos Fragments, oraux, imports/images Scriptorium —
  **vérifie la liste réelle** dans le dashboard actuel.
- recopie les **policies** (Storage ▸ Policies) de chaque bucket.

## Étape 5 — Variables d'environnement Vercel

Vercel ▸ *Settings ▸ Environment Variables*. Renseigne **deux jeux** :

| Variable | **Production** (nouvelle base) | **Preview** (base actuelle) |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projet **prod** | URL projet **actuel** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon **prod** | anon **actuel** |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role **prod** | service_role **actuel** |
| `ANTHROPIC_API_KEY` | (même clé, ou dédiée prod) | (même, ou dédiée test) |
| `RESEND_API_KEY` | ta clé Resend | ta clé Resend |
| `RESEND_FROM` | `no-reply@palimpseste.ink` | idem (ou adresse test) |
| `GROQ_API_KEY` | ta clé GROQ | ta clé GROQ |

- Pour chaque variable, coche le bon **scope** : colonne gauche = *Production*,
  colonne droite = *Preview* (+ *Development* si tu veux que `npm run dev` tape la
  base actuelle — recommandé).
- `NEXT_PUBLIC_SITE_URL` : facultatif (sert uniquement de repli si l'en-tête `host`
  manque). Tu peux le laisser vide.
- Clés API séparées prod/test (Anthropic, GROQ) = facultatif, utile seulement si tu
  veux **isoler les coûts** du bac-à-sable.

## Étape 6 — Brancher git / Vercel

- Vercel ▸ *Settings ▸ Git* : **Production Branch = `main`** (normalement déjà le cas).
- Pousser la branche bac-à-sable : `git push -u origin staging` → crée un déploiement
  **Preview** branché sur la **base actuelle**, avec une URL stable.
- Domaine : Production = `palimpseste.ink`. (Optionnel : `staging.palimpseste.ink`
  pointé sur le déploiement de la branche `staging`.)

## Étape 7 — Créer ton compte prof sur la PROD

1. Sur `palimpseste.ink`, **inscris-toi** avec ton email.
2. Vérifie qu'une ligne apparaît dans `profiles` (SQL Editor prod :
   `select * from profiles;`). **Si vide** → le trigger `auth.users → profiles`
   manque (il n'est versionné nulle part) ; recrée-le, ou crée la ligne `profiles`
   à la main, puis vérifie comment ton code crée les profils à l'inscription.
3. Passe ton rôle à prof :
   `update profiles set role = 'prof' where id = '<ton-uuid-auth>';`

## Étape 8 — Smoke test prod (AVANT de partager aux élèves)

- [ ] Connexion prof OK.
- [ ] L'inscription crée bien une ligne `profiles`.
- [ ] Créer une classe + activer un module → les modules **s'affichent** (sinon
      `modules` vide → refais l'étape 3).
- [ ] Inviter **un élève de test** (ta propre adresse) → email reçu → le lien pointe
      vers `palimpseste.ink` → finalisation d'inscription OK.
- [ ] Upload d'un document/photo → bucket OK (sinon refais l'étape 4).
- [ ] Calendrier / heure affichés correctement (`calendrier_params` présent).

**Tant qu'un point échoue, ne donne pas le lien aux élèves.**

## Étape 9 — Discipline continue (le seul « coût » récurrent)

- Chaque **nouvelle migration SQL** : l'exécuter **d'abord** sur le bac-à-sable
  (base actuelle) pour tester, **puis** sur la prod.
- Travailler sur `staging` / branches de feature → Preview (base actuelle) ; quand
  c'est bon → **merge dans `main`** → déploiement prod (vrais élèves).
- ⚠️ Sur le bac-à-sable, **n'invite que tes propres adresses de test** : Resend peut
  envoyer de **vrais** emails (avec un lien staging) si tu invites une vraie adresse.

---

## Annexe — Gotchas Supabase repérés dans ce repo

- **Pas de schéma consolidé** : ne jamais reconstruire en rejouant les 39 `.sql`
  (tables de base non versionnées). Le **dump de la base actuelle** fait foi (étape 2).
- **Trigger `auth.users → profiles` non versionné** : à vérifier/recréer (étape 7).
- **Buckets Storage créés à la main** : à recréer (étape 4).
- **Policies `storage.objects` non versionnées** (grep `storage.objects` = 0 dans les
  `.sql`) : à recréer côté dashboard (étape 4).
- **Extension `pgcrypto`** (`gen_random_uuid`) : à activer si absente (étape 2).
- **Code 100 % host-aware** : aucun domaine de prod codé en dur ; les liens email
  s'adaptent au domaine d'envoi → rien à changer dans le code pour le multi-domaine.
