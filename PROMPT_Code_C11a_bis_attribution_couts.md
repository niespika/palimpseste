# PROMPT — Session Code ⚙️ : C11a-bis — attribution des coûts (élève, classe, modèle, tokens)

> **À coller dans une session Claude Code FRAÎCHE** (règle R4 : une session = un lot).
> Modèle standard.
>
> **Contexte à lire en démarrant, dans cet ordre, rien de plus :**
> 1. `PLAN_CHANTIERS_RENTREE.md` §C11 ;
> 2. `SUIVI_SQL.md` — le protocole (R6) et la ligne du 25/07 (`c11a_api_couts.sql`) ;
> 3. sur la branche `feat/c11a-couts` : `c11a_api_couts.sql` et `utils/cout-api.ts`.
>
> **Pourquoi ce lot, pourquoi maintenant.** C11a est fait (commit `8d96c85`, branche non
> poussée) mais son SQL n'a **pas encore été exécuté**. C'est la seule fenêtre où enrichir
> le schéma d'`api_couts` est gratuit : on modifie la migration avant de la jouer — pas
> d'ALTER, et surtout **aucune ligne écrite sans attribution** (l'épisode juin-juillet a
> montré ce que coûte une donnée qu'on ne peut pas reconstituer). Décision PO du 25/07,
> prise hors session (R7) : élargissement assumé du périmètre C11a. Ce lot prépare le
> futur écran de détail (coûts par module / par élève / par jour — chantier séparé) et
> règle au passage l'item d'`IDEES_post_rentree.md` « journaliser les tokens » (hit-rate
> du prompt caching, recommandation ouverte de l'audit du 02/07).

---

## Mission

Étendre le journal `api_couts` pour porter l'**attribution** de chaque coût : élève,
classe, modèle, compteurs de tokens — **tout nullable, best-effort**. Zéro écran, zéro
changement de la tuile, zéro nouvelle lecture en base. Un coût non attribuable reste une
ligne valide (module + montant) : c'est la réalité (coûts « de classe »), pas un échec.

## Pré-vol (avant toute modification)

1. `git status` : tu dois être sur `feat/c11a-couts`, tête `8d96c85`. Des `M` peuvent
   traîner sur `IDEES_post_rentree.md` / `PLAN_CHANTIERS_RENTREE.md` (éditions PO) —
   **ne les committe pas**, ne travaille pas dedans (exception encadrée au point 4 de
   l'ordre de travail).
2. Vérifie en base (comme au constat C11a, `SUPABASE_DB_URL` de `.env.local`) que
   `select to_regclass('public.api_couts')` renvoie toujours **NULL**. Si la table existe
   désormais (le PO aurait joué le SQL entre-temps) : **STOP** — le chemin devient une
   migration additive séparée, à faire valider (R7).

## Ordre de travail

1. **La migration, en place** — même fichier `c11a_api_couts.sql` (jamais exécuté, donc
   modifiable ; ce n'est pas un rejeu d'archive). Ajouter à `create table api_couts` :

   - `eleve_id uuid null references profiles(id) on delete set null`
   - `classe_id uuid null references classes(id) on delete set null`
   - `modele text null`
   - `tokens_entree integer null` · `tokens_sortie integer null` ·
     `tokens_cache_lecture integer null` · `tokens_cache_ecriture integer null`
     *(écriture cache = total, tous TTL confondus)*

   `on delete set null` des deux côtés : un élève ou une classe supprimé n'efface pas un
   coût déjà payé — il devient « non attribué ». Ajouter
   `create index if not exists idx_api_couts_eleve on api_couts(eleve_id, created_at)
   where eleve_id is not null;`. RLS et policy inchangées (lecture prof, écriture
   service_role). Mettre à jour : l'en-tête du fichier (2-3 lignes : v2 du 25/07, avant
   exécution) et le **bloc de vérification** (les 7 colonnes présentes via
   `information_schema.columns`, `policies = 1` inchangé).
   Enfin, compléter la **note de la ligne du 25/07** dans `SUIVI_SQL.md` (pas de nouvelle
   ligne : même fichier, jamais exécuté) : « v2 avant exécution : + attribution
   élève/classe/modèle/tokens ».

2. **`utils/cout-api.ts`** — signature rétro-compatible :

   ```ts
   enregistrerCoutApi(module: string, cout: number, ctx?: {
     eleveId?: string | null
     classeId?: string | null
     modele?: string | null
     tokens?: { entree: number; sortie: number; cacheLecture: number; cacheEcriture: number } | null
   })
   ```

   - Une fonction **pure et exportée** de normalisation d'usage vers ces 4 compteurs,
     pour les DEUX formes en circulation : l'usage Anthropic brut (celui que `coutMessage`
     sait lire, `cache_creation` inclus) et l'`UsageIA` normalisé de
     `utils/ia-fournisseur` (sommer `cacheEcriture5m + cacheEcriture1h`). + **un test
     unitaire** dans `utils/` (la suite tourne déjà, `npm test`).
   - L'insert porte les nouveaux champs quand `ctx` les fournit ; `cout <= 0` avec un
     usage mesuré reste ignoré comme aujourd'hui (comportement inchangé).
   - Les deux `console.error` « journalisation PERDUE » incluent `eleveId`/`classeId`
     quand présents.

3. **Les 14 sites d'appel** — la règle est stricte : on renseigne ce qui est **déjà en
   scope** ou passable en paramètre depuis un appelant qui l'a déjà ; on n'ajoute
   **AUCUNE requête en base** pour l'attribution. « À constater » = si ce n'est pas dans
   le scope, on n'invente pas, on laisse vide et on le note.

   | Site | eleveId | classeId | modele | tokens |
   |---|---|---|---|---|
   | `utils/aletheia-retours.ts:289` (retour V1) | `t.eleve_id` | — | `MODELE` | `response.usage` |
   | `aletheia-retours.ts:596` (retour VF) | `eleveId` | — | `MODELE` | `response.usage` |
   | `aletheia-retours.ts:714` (capstone, livre entier) | — | — | `MODELE` | `response.usage` |
   | `aletheia-retours.ts:889` (fiche de référence livre) | — | — | `MODELE` | `response.usage` |
   | `aletheia-retours.ts:1040` et `:1056` (diagnostic Inv/Niv) | `eleveId` — dispo chez l'appelant `diagnostiquerTravail` (l.1084), **à passer en paramètre** à `diagnostiquerPhase` | — | modèle du site | usages respectifs |
   | `utils/generer-questions.ts:71` et `:105` (quiz) | — | à constater | constante du fichier | `message.usage` |
   | `utils/extraire-flashcards.ts:73`, `:111`, `:137` | — | à constater | constante du fichier | `message.usage` |
   | `app/prof/quazian/diagnostic/actions.ts:240` (diagnostic de classe) | — | à constater | `'claude-sonnet-4-6'` | `message.usage` |
   | `app/api/scriptorium/chat/route.ts:191` | `user.id` | `classeId` | `reglages.modele` | l'usage déjà mesuré (quand il l'est) |
   | `utils/scriptorium-synthese-rag.ts:166` | — | `classeId` | `reglages.modeleSynthese` | `usage` |

   ⚠️ `utils/aletheia-retours.ts` est binaire pour `grep` (octets NUL — voir IDEES) :
   utilise `grep -a` ou ouvre le fichier directement.

4. **`IDEES_post_rentree.md`** : annoter l'item « Journaliser les tokens… » comme réglé
   par C11a-bis — **seulement si** le fichier n'a pas de modifications non commitées
   étrangères au moment de ton passage ; sinon, signale-le au PO en fin de session et n'y
   touche pas.

## Périmètre de fichiers (strict)

- **Autorisés** : `c11a_api_couts.sql` · `utils/cout-api.ts` (+ son nouveau test) · les
  6 fichiers des sites d'appel · `SUIVI_SQL.md` (la note de la ligne du 25/07) ·
  `IDEES_post_rentree.md` (l'annotation conditionnelle du point 4).
- **Interdits** : `app/prof/CoutApi.tsx` — la tuile lit `module, cout`, rien ne change
  pour elle ; tout écran ou page nouvelle (chantier séparé) ; les inserts
  `scriptorium_messages` / `scriptorium_conversations` sans vérification d'`error`
  (item IDEES, autre chantier — même si ça te démange) ; exécuter du SQL (le PO s'en
  charge) ; push ou merge.

## Recette (fin de session)

1. `tsc` 0 erreur · eslint 0 sur les fichiers touchés · tests verts (112 + le nouveau) ·
   `next build` propre.
2. Exercer l'écriture contre la vraie base **avant** exécution du SQL : l'échec doit
   logger « PERDUE » avec l'attribution dans le message (préservation du test A du plan
   C11a).
3. Mettre à jour la **liste de tests manuels du rapport C11a** (étapes D) : la requête de
   contrôle devient

   ```sql
   select module,
          count(*)                                   as appels,
          count(eleve_id)                            as attribues_eleve,
          count(classe_id)                           as attribues_classe,
          count(tokens_entree)                       as avec_tokens,
          round(sum(cout)::numeric, 4)               as total_usd,
          max(created_at)                            as dernier
     from api_couts group by module order by total_usd desc;
   ```

   avec les attentes par module : Aletheia retours/diagnostic → `eleve_id` renseigné ;
   capstone et fiche de référence → non attribués (normal) ; Quazian → jamais d'élève
   (génération par classe/contenu — structurel) ; chat Scriptorium → élève **et**
   classe ; synthèse hebdo → classe seule ; `tokens_*` non nuls partout où l'usage
   fournisseur existe.

## Fin de session

Un commit sur la branche (ne pas pousser), type :
`fix(couts): C11a-bis — attribution élève/classe + modèle/tokens dans api_couts (avant exécution SQL)`.
Livre au PO : la liste de recette A→E mise à jour (avec les nouvelles vérifs D), la liste
sèche des « à constater » résolus ou laissés vides, et les questions R7 rencontrées.
