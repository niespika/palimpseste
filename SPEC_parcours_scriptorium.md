# SPEC — Refonte Scriptorium : Parcours (fondation) — **v2 (durcie)**

> Document de conception. Aucun code applicatif n'est écrit ici : le DDL et les signatures sont spécifiés pour approbation, l'implémentation réelle devra lire `node_modules/next/dist/docs/` (Next à breaking changes) avant d'écrire quoi que ce soit.
> Réconciliation : les quatre notes de conception (schéma, frise, migration, UI) divergeaient sur le nommage des tables et des helpers. Ce SPEC **tranche** en faveur du préfixe `scriptorium_*` (cohérence stricte avec l'existant) et fige un jeu de noms unique, signalé au §4.0.

---

## Changelog v2 — durcissement adversarial (18 findings)

Cette révision replie **18 findings** de contre-épreuve (3 lentilles : maths, migration, schéma ; 0 bloquant, verdict global « fondation solide, à durcir sur les bords ») **plus 2 décisions du product owner**. Le cœur algorithmique (frise §5.2) et l'étanchéité de la migration côté livres restent **inchangés et vérifiés** ; les corrections portent sur les frontières, les gardes d'intégrité et les promesses de résolution.

**Décisions PO verrouillées intégrées.**
- **A1 — Renommage Fragments.** Le libellé UI « Ton parcours » de Fragments devient « **Ta progression** » (colonne DB `fragments_analyses.retour_parcours` **inchangée**). Statut : passe d'« optionnel » à **décidé** (petit chantier UI hors chemin critique, acté). Voir §3.2 et §9.1.
- **A2 — Semestres définis à l'avance.** Le prof connaît les dates du S2 dès le début d'année. **Règle verrouillée** : pour assigner/planifier un parcours, **tous les semestres qu'il chevauche doivent DÉJÀ exister**. Si le parcours déborde **au-delà du dernier semestre défini de l'année scolaire**, l'assignation **signale/bloque** (« ce parcours prolonge au-delà des semestres définis — définissez le semestre suivant ou raccourcissez le parcours »). Résout `maths-M2` et `schema-S5`. Voir §2 (décision 8), §5.3, §7.4, §9.

**Corrections mécaniques repliées (lentille maths — frise §5).**
- `maths-M1` — L'année scolaire (AY) se dérive de `date_debut`, **pas « de l'ancre »** (fin de la circularité). AY définie explicitement : `[1er août Y] → [31 juillet Y+1]`, août ⇒ **nouvelle** année. Frise vide ⇒ `avis` explicite, jamais un `a_definir` muet (§5.1, §5.3).
- `maths-M3` — `semesters.end_date` **doit être un dimanche** (fin de semaine calendaire) ; sinon `friseEnseignementContinue` **signale/tronque** la dernière semaine partielle. Règle de comptage de la dernière semaine précisée (§5.1, §5.3).
- `maths-M4` — Le **chevauchement de deux semestres** devient une **erreur bloquante côté config** (sauvegarde refusée) ; à défaut l'avis remonte au bandeau d'aperçu §7.4 (« configuration semestres incohérente ») pour empêcher une assignation sur une frise corrompue (§5.3(d), §7.4).

**Corrections mécaniques repliées (lentille migration — §6).**
- `migration-Mig1` — Garde-fou anti-livre rendu **non tautologique** : le périmètre livre est calculé **indépendamment de `_u`** (§6.4).
- `migration-Mig2` — Le `pg_dump` de sauvegarde **inclut désormais les tables `aletheia_*`** (les données à préserver), ou exige un snapshot/PITR complet (§6.4, étape 0).
- `migration-Mig3` — Contradiction §6.4/§6.5 corrigée : les 5 pickers prof **filtrent déjà** `.is('supprime_at', null)` ⇒ le soft-delete Phase A les rend invisibles prof immédiatement (§6.4).
- `migration-Mig5` — Réversibilité Phase A **scopée** (liste matérialisée des ids réellement flippés) ou documentée comme non idempotente (§6.4).
- `migration-Mig4` — **Symétrie livre soft-deleté** : les créneaux référant un livre `supprime_at` non null sont **masqués** avec badge « livre retiré » (pas de fantôme silencieux) (§4.1, §7.3).

**Corrections mécaniques repliées (lentille schéma — §4).**
- `schema-S1` — **Garde de type DB** sur le bras « livre » de l'arc polymorphe : `unique (id, type)` sur `scriptorium_unites` + **FK composite** `(livre_id, livre_type)` → `(id, type)` via colonne générée `livre_type` (§4.1, Contraintes applicatives).
- `schema-S6` — **Numéro qui fait foi** documenté : `indexContinu` = **interne** (mapping, jamais exposé brut) ; `pedagogical_number` (« S1 · sem. 3 ») = **affichage**. Coexistence des **trois** numérotations signalée (§5.1, §9).
- `schema-S7` — La suppression d'un contenu de bibliothèque **ne purge PAS** les créneaux référents : soft-delete + créneaux **conservés** affichés « contenu retiré » (restaurable). Justification du RESTRICT corrigée (§4.1, §7.2).
- `schema-S9` — `unique (parcours_id, semaine, ordre)` + calcul **atomique** de `ordre` (§4.1, §7.6).

**Arbitrages de conception appliqués (à confirmer par le PO — voir §9).**
- `schema-S3` — Référencer un livre dans un créneau **ne donne PAS d'accès Aletheia** ; l'exposition Aletheia reste **mono-source** via `scriptorium_unite_classes`. « Deux usages disjoints d'un même livre », pas d'unification (§4.3).
- `schema-S2` — Bornes de tranche gardées par `semaine` (int), mais `modifierLivreComplet` (re-découpe destructive) rendue **consciente des créneaux référents** + validation des bornes **à la lecture** (§4.1, §7.3, §7.5).
- `schema-S4` — L'aperçu prof **recalcule** depuis la frise (fondation, prof-only) ; **snapshot d'horaire optionnel** documenté (non implémenté) pour la future publication élève (§4.5, §9).
- `schema-S8` — RAG : envisager une **table de chunks unique** `source_type + source_id` en arc-exclusif plutôt que deux tables parallèles (note, non implémenté) (§4.4).

---

## 1. Contexte & objectif

Scriptorium organise aujourd'hui le contenu pédagogique autour de deux formes stockées dans la **même** table `scriptorium_unites`, discriminées par `type` :
- les **unités** (`type='unite'`) — conteneurs de cours/textes, consommés par Quazian et Codex ;
- les **livres** (`type='livre'`) — supports de lecture Aletheia, découpés semaine par semaine.

Ce modèle couple étroitement le **contenu** à son **conteneur** et à sa **classe** : un `scriptorium_documents` a un `unite_id NOT NULL`, une `semaine`, et son exposition à une classe vit soit dans `scriptorium_document_classes` (par document, chemin Quazian) soit dans `scriptorium_unite_classes` (par livre, chemin Aletheia). Deux systèmes d'assignation classe coexistent — c'est une dette.

**Objectif de la refonte** : introduire les **Parcours**.
- Une **bibliothèque de contenus réutilisables** (Textes + Cours), items de première classe, sans classe ni semaine propres.
- Un conteneur **Parcours** qui orchestre ces contenus **semaine par semaine**, avec plusieurs contenus ordonnés par créneau hebdomadaire.
- Une **planification par classe** : le même parcours est daté séparément pour chaque classe.
- Une **frise de semaines d'enseignement continue inter-semestres**, qui saute les vacances et déborde proprement sur le semestre suivant.
- L'**onglet Livres conservé tel quel** (Aletheia intact), mais **référençable** par un parcours (livre entier ou tranche).

Le RAG et le re-câblage de Quazian/Codex vers les Parcours sont explicitement **hors de ce chantier** (le schéma les accueille sans les brancher).

---

## 2. Décisions verrouillées (product owner — non négociables)

1. **Contenu réutilisable.** Textes et Cours sont des items de première classe, réutilisables entre plusieurs Parcours ET plusieurs classes. Un Parcours les **référence** via une jointure portant `semaine` + `ordre` intra-semaine. Un créneau hebdo peut contenir plusieurs contenus (ex. 1 cours + 2 textes) avec hiérarchie temporelle.
2. **Livres Aletheia séparés & conservés.** Les livres restent un onglet distinct, inchangés (découpe semaine par semaine intacte). Mais un Parcours peut référencer un livre **entier** ou une **tranche** (certaines de ses semaines/chapitres). Référencer un livre **ordonnance** ce livre dans le flux du parcours ; cela **ne modifie ni ne redéfinit** l'exposition Aletheia du livre (voir décision 9 et §4.3).
3. **Temporalité par frise inter-semestres.** Le numéro de semaine d'un Parcours se traduit en date réelle via une **frise de semaines d'enseignement continue à travers les semestres**, qui **saute les vacances**. La date de début du prof est ramenée à la semaine d'enseignement qui la contient (ou la suivante si vacances). Les semaines de débordement s'affichent **« à définir »** tant que le semestre suivant (de la **même année scolaire**) n'existe pas — et **uniquement** dans ce cas (voir décision 8).
4. **Migration minimale.** Ne conserver que les livres Aletheia (`type='livre'` + toutes leurs dépendances). Les unités (`type='unite'`), leurs documents et les données Quazian/Codex qui en dépendent peuvent **disparaître** (données pilote jetables). Attention aux cascades.
5. **Périmètre = fondation uniquement.** Bibliothèques Textes/Cours + builder de Parcours + frise + onglet Livre référençable + migration. Re-câblage Quazian/Codex et RAG = chantiers ultérieurs (schéma prêt à les accueillir).
6. **Planification par classe.** Un Parcours est conçu une fois puis planifié séparément par classe. La date de début vit sur l'**assignation parcours↔classe** (classe A démarre semaine 3, classe B semaine 5).
7. **Ancrage par date**, ramenée à la semaine d'enseignement.
8. **(v2 — A2) Semestres définis à l'avance ⇒ toute la fenêtre d'un parcours doit exister pour l'assigner.** Le prof connaît les dates de tous les semestres de l'année scolaire dès le début d'année. **Règle** : pour assigner/planifier un parcours à une classe, **tous les semestres qu'il chevauche doivent déjà exister**. Un parcours qui déborde **au-delà de l'année scolaire** (frontière août, §5.1) est **NON PLANIFIABLE** : l'assignation le **bloque** avec un message clair. Un parcours qui déborde sur un semestre **encore à créer mais dans la même année scolaire** est **signalé** (« définissez le semestre suivant »). Cette décision **fait quasi disparaître** le cas transitoire « à définir » et **tranche** `maths-M2` / `schema-S5`.
9. **(v2 — S3) Exposition livre mono-source.** Référencer un livre dans un créneau de parcours **ne confère aucun accès Aletheia**. L'exposition Aletheia d'un livre à une classe reste **mono-source** via `scriptorium_unite_classes`. Un créneau-livre ne fait qu'**ordonnancer** le livre dans le flux pédagogique du parcours. *Décision d'arbitrage — à confirmer par le PO (§9).*

---

## 3. Périmètre

### 3.1 DANS ce chantier
- Tables neuves : `scriptorium_contenus`, `scriptorium_parcours`, `scriptorium_parcours_creneaux`, `scriptorium_parcours_classes` + extension arc-exclusif de `scriptorium_contenu_images` (RLS prof-only) + **garde de type DB** `unique (id, type)` sur `scriptorium_unites` (additif, §4.1, S1).
- Bibliothèques **Textes** et **Cours** : CRUD, upload/extraction de fichier, images, soft-delete, compteur d'usages.
- **Builder de Parcours** : grille hebdomadaire, créneaux ordonnés (ajout/retrait/réordonnancement/déplacement, `ordre` atomique — S9), picker Textes/Cours/Livres (avec sélecteur de tranche livre).
- **Assignation par classe** : toggle + `ChampDate` + aperçu des dates résolues via la frise, **avec garde « débordement hors année scolaire = NON PLANIFIABLE »** (décision 8) et **bandeau « config semestres incohérente »** (M4).
- **Frise pure** `utils/frise-enseignement.ts` (multi-semestre, saute vacances, déborde, **AY dérivée de `date_debut`**, validation `end_date` dimanche) + tests unitaires.
- **Onglet Livres** conservé (vue-livre 3 colonnes inchangée) + référençable comme contenu de parcours + **re-découpe consciente des créneaux référents** (S2).
- **Migration** : audit des cascades live, soft-delete réversible **scopé** (Phase A) puis purge dure explicite et scopée (Phase B), **backup incluant `aletheia_*`** (Mig2), **garde-fou non tautologique** (Mig1).

### 3.2 HORS-scope (recensé, non fait ici)
- **Consommation élève** des Parcours (dashboard élève, dates résolues côté élève, gate de lecture). C'est le chantier qui **activera** le snapshot d'horaire optionnel du §4.5 (S4).
- **Re-câblage Quazian/Codex** vers les Parcours/créneaux et **unification effective** de la dette d'assignation classe (`document_classes`/`unite_classes`). Sites à revisiter : `app/prof/quazian/actions.ts:27`, `app/prof/quazian/page.tsx:17`, `app/prof/quazian/quizz/page.tsx:36`, `app/prof/quazian/diagnostic/actions.ts:96`, `app/prof/codex/actions.ts:25`.
- **RAG / embeddings** (aucun pgvector aujourd'hui). Couture future = `scriptorium_contenus.texte_extrait` + fiches livre, via les `assembler*` de `utils/aletheia-retours.ts`. Piste d'abstraction unifiée notée §4.4 (S8).
- **Fix mono-semestre des vues calendrier** (`app/prof/calendrier/page.tsx:45`, `app/eleve/calendrier/page.tsx:56` lisent `is_active` seul). La frise est déjà multi-semestre ; corriger l'**affichage** calendrier est un autre chantier.
- **Relabel Fragments « Ton parcours » → « Ta progression »** — **(v2 — A1) DÉCIDÉ / acté PO** (n'est plus « optionnel »). Petit chantier UI Fragments, **hors chemin critique** de cette fondation : la colonne DB `fragments_analyses.retour_parcours` reste **inchangée**, seul le libellé d'affichage change. Traité comme lot annexe, planifiable indépendamment.

---

## 4. Modèle de données

### 4.0 Note de réconciliation du nommage (tranché)

| Concept | Retenu (ce SPEC) | Variantes des notes sources | Raison du choix |
|---|---|---|---|
| Bibliothèque | `scriptorium_contenus` | `bibliotheque_contenus` (schéma) | Cohérence stricte du préfixe repo `scriptorium_*`. |
| Champ corps IA | `texte_extrait` | `texte` (schéma) | Même nom que `scriptorium_documents.texte_extrait` (rôle identique : ancrage IA). |
| Discriminant | `type` ∈ (`texte`,`cours`) | `kind` (schéma) | Aligné sur `scriptorium_documents.type` / `scriptorium_unites.type`. |
| Images de contenu | **réutilise** `scriptorium_contenu_images` + `contenu_id` nullable (arc exclusif avec `document_id`) | table neuve `bibliotheque_contenu_images` (schéma) | Évite un nom quasi-identique (`scriptorium_contenus_images`) source d'erreurs SQL ; même patron arc-exclusif que les créneaux. |
| Conteneur | `scriptorium_parcours` | `parcours` (schéma) | Préfixe cohérent + désambiguïse la collision « parcours » (voir §9). |
| Jointure semaine+ordre | `scriptorium_parcours_creneaux` | `parcours_items` (schéma) | Terme métier FR « créneau », aligné sur les signatures d'actions UI. |
| Assignation classe | `scriptorium_parcours_classes` | `parcours_assignations` (schéma) | Idem. |
| Durée | `nb_semaines` | `duree_semaines` (schéma) | Aligné sur les signatures d'actions UI. |
| Helpers frise | `friseEnseignementContinue` / `resoudreAncre` / `mapperParcours` / **`anneeScolaireDe`** dans `utils/frise-enseignement.ts` | `construireFrise`/`indexSemaineContenant`/`datesParcours` (UI) | Noms de la note « frise » (spec algorithmique autoritaire). |

### 4.1 DDL consolidé (Phase A — additive, non-cassante)

```sql
-- ============================================================================
-- FONDATION PARCOURS — Phase A (additive). Fichier : parcours_phase_a.sql
-- ============================================================================

-- 0. Garde de type DB pour l'arc polymorphe des créneaux (v2 — schema-S1) ------
-- scriptorium_unites.id est déjà PK (donc unique) ; on ajoute une clé candidate
-- COMPOSITE (id, type) UNIQUEMENT pour servir de cible à une FK composite depuis
-- les créneaux. Redondante pour l'unicité, indispensable comme référence de FK :
-- Postgres exige que les colonnes référencées portent une contrainte unique/PK.
alter table scriptorium_unites
  add constraint scriptorium_unites_id_type_uk unique (id, type);

-- 1. Bibliothèque de contenus réutilisables (Textes & Cours) ------------------
-- Item de PREMIÈRE CLASSE : AUCUN lien vers une unité, une semaine, ou une classe.
-- Ces dimensions sont portées par le créneau (parcours_creneaux) et par
-- l'assignation classe (parcours_classes). Discriminé par `type`.
create table if not exists scriptorium_contenus (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('texte', 'cours')),  -- extensible plus tard
  titre         text not null,
  auteur        text,                        -- surtout 'texte' ; souvent null pour 'cours'
  texte_extrait text,                         -- CORPS intégral consommé par les IA / futur RAG
  chapitres     text,                         -- métadonnée d'extrait (repris de scriptorium_documents)
  fichier_ref   text,                         -- fichier source facultatif (bucket 'scriptorium')
  tags          text[] not null default '{}', -- optionnel (recherche/filtre) ; supprimable si non désiré
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),  -- maj applicative (convention repo, pas de trigger)
  supprime_at   timestamptz                          -- SOFT-DELETE (jamais de DELETE dur)
);
create index if not exists idx_contenus_type    on scriptorium_contenus(type) where supprime_at is null;
create index if not exists idx_contenus_vivants on scriptorium_contenus(supprime_at);
-- Recherche plein-texte future (léger, non-RAG) : décommenter au besoin
-- create index if not exists idx_contenus_fts on scriptorium_contenus
--   using gin (to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(texte_extrait,'')));

-- 2. Extension arc-exclusif de scriptorium_contenu_images ---------------------
-- La table existe déjà (images filles de scriptorium_documents, document_id NOT NULL).
-- On l'ouvre aux contenus de bibliothèque : document_id devient nullable, on ajoute
-- contenu_id nullable, et un CHECK impose EXACTEMENT une des deux cibles.
alter table scriptorium_contenu_images
  alter column document_id drop not null;
alter table scriptorium_contenu_images
  add column if not exists contenu_id uuid references scriptorium_contenus(id) on delete cascade;
-- (Nettoyer d'abord toute ligne existante avant d'ajouter la contrainte.)
alter table scriptorium_contenu_images
  add constraint scriptorium_contenu_images_cible_chk check (
    (document_id is not null and contenu_id is null)
    or (document_id is null and contenu_id is not null)
  );
create index if not exists idx_contenu_images_contenu on scriptorium_contenu_images(contenu_id)
  where contenu_id is not null;

-- 3. Parcours = gabarit d'orchestration hebdomadaire --------------------------
-- Temporellement NEUTRE : numérote ses semaines 1..nb_semaines. La traduction en
-- dates réelles se fait par classe, à la lecture, via la frise (§5).
create table if not exists scriptorium_parcours (
  id          uuid primary key default gen_random_uuid(),
  titre       text not null,
  description text,
  auteur      text,
  nb_semaines integer not null check (nb_semaines between 1 and 52),
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  supprime_at timestamptz
);
create index if not exists idx_parcours_vivants on scriptorium_parcours(supprime_at);

-- 4. Créneau hebdo — jointure polymorphe en ARC EXCLUSIF ----------------------
-- 1 ligne = 1 contenu (texte/cours de bibliothèque) OU 1 livre (entier/tranche),
-- posé dans une semaine, à une position `ordre`. Plusieurs créneaux par semaine.
create table if not exists scriptorium_parcours_creneaux (
  id            uuid primary key default gen_random_uuid(),
  parcours_id   uuid not null references scriptorium_parcours(id) on delete cascade,
  semaine       integer not null check (semaine >= 1),  -- semaine RELATIVE (1..nb_semaines)
  ordre         integer not null,                       -- position intra-semaine (toujours fournie par l'action, §7.6)

  ref_type      text not null check (ref_type in ('contenu', 'livre')),  -- cible de stockage

  -- Cible A : contenu de bibliothèque (texte OU cours).
  -- RESTRICT = garde-fou de dernier recours ; en usage NORMAL il ne se déclenche
  -- JAMAIS (les contenus sont soft-deletés, jamais DELETE dur). La vraie protection
  -- des parcours tiers est le NON-PURGE des créneaux au soft-delete (v2 — schema-S7, §7.2).
  contenu_id    uuid references scriptorium_contenus(id) on delete restrict,

  -- Cible B : livre (scriptorium_unites type='livre'), entier ou en tranche.
  livre_id            uuid references scriptorium_unites(id) on delete restrict,
  livre_semaine_debut integer,   -- index de semaine du livre (aligné sur scriptorium_documents.semaine)
  livre_semaine_fin   integer,   -- borne INCLUSE ; (null,null) = livre ENTIER

  -- v2 — schema-S1 : constante générée servant UNIQUEMENT de garde de type via FK composite.
  -- Non nullable par construction. Sous MATCH SIMPLE (défaut), la FK composite (livre_id,
  -- livre_type) n'est vérifiée QUE si livre_id est non null (créneau 'livre') ; pour un
  -- créneau 'contenu' (livre_id null), la FK est ignorée. Résultat : tout créneau 'livre'
  -- est GARANTI pointer une ligne scriptorium_unites de type='livre'.
  livre_type    text generated always as ('livre') stored,

  titre_affiche text,            -- override d'affichage propre au créneau
  note          text,            -- consigne facultative du prof
  created_at    timestamptz not null default now(),

  -- Arc exclusif : exactement une cible selon ref_type.
  constraint parcours_creneaux_cible_chk check (
    (ref_type = 'contenu' and contenu_id is not null and livre_id is null)
    or (ref_type = 'livre' and livre_id   is not null and contenu_id is null)
  ),
  -- Les bornes de tranche n'existent que pour une cible livre.
  constraint parcours_creneaux_tranche_scope_chk check (
    ref_type = 'livre' or (livre_semaine_debut is null and livre_semaine_fin is null)
  ),
  -- Tranche cohérente (début ≤ fin) si les deux bornes sont posées.
  constraint parcours_creneaux_tranche_ordre_chk check (
    livre_semaine_debut is null or livre_semaine_fin is null
    or livre_semaine_debut <= livre_semaine_fin
  ),
  -- v2 — schema-S1 : garde de type DB sur le bras 'livre'.
  constraint parcours_creneaux_livre_type_fk
    foreign key (livre_id, livre_type)
    references scriptorium_unites(id, type) on delete restrict,
  -- v2 — schema-S9 : unicité de l'ordre intra-semaine (empêche les doublons de course).
  constraint parcours_creneaux_ordre_uk unique (parcours_id, semaine, ordre)
);
create index if not exists idx_parcours_creneaux_parcours on scriptorium_parcours_creneaux(parcours_id, semaine, ordre);
create index if not exists idx_parcours_creneaux_contenu  on scriptorium_parcours_creneaux(contenu_id) where contenu_id is not null;
create index if not exists idx_parcours_creneaux_livre    on scriptorium_parcours_creneaux(livre_id)   where livre_id   is not null;

-- 5. Assignation par classe — la date de début vit ICI -----------------------
-- Classe A démarre le 08/09, classe B le 22/09 : deux lignes, deux date_debut,
-- même parcours_id. date_debut nullable = « assigné, pas encore daté » (UX toggle).
create table if not exists scriptorium_parcours_classes (
  id          uuid primary key default gen_random_uuid(),
  parcours_id uuid not null references scriptorium_parcours(id) on delete cascade,
  classe_id   uuid not null references classes(id) on delete cascade,
  date_debut  date,                                  -- DATE PURE (régime UTC : T00:00:00Z, getters UTC)
  statut      text not null default 'active' check (statut in ('active', 'archivee')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (parcours_id, classe_id)
  -- v2 — schema-S4 (différé) : emplacement réservé pour un futur SNAPSHOT d'horaire
  -- (horaire_snapshot jsonb, snapshot_version int, snapshot_genere_le timestamptz) —
  -- NON créé ici, voir §4.5. La fondation recalcule l'aperçu depuis la frise.
);
create index if not exists idx_parcours_classes_parcours on scriptorium_parcours_classes(parcours_id);
create index if not exists idx_parcours_classes_classe   on scriptorium_parcours_classes(classe_id);
```

**Contraintes applicatives** (à défendre dans les server actions, en plus des contraintes DB ci-dessus) :
- `creneaux.semaine <= parcours.nb_semaines` (CHECK inter-tables impossible en Postgres).
- `livre_semaine_debut/fin` dans l'étendue réelle du livre (`scriptorium_documents.semaine` de ce `livre_id`) **au moment de l'insertion** — et **revalidées à la lecture** (une re-découpe peut les rendre hors-étendue, v2 — schema-S2, §7.5).
- `contenu_id`/`livre_id` non soft-deletés au moment de l'insertion.
- **(v2 — schema-S1) `livre_id` doit pointer une unité `type='livre'`** — désormais **garanti par la FK composite** `parcours_creneaux_livre_type_fk`, mais à **revérifier aussi en server action** (défense en profondeur : message d'erreur propre plutôt qu'exception FK brute).
- **(v2 — décision 8 / schema-S5) À l'assignation** : refuser (bloquer) une assignation dont le parcours déborde **au-delà de l'année scolaire** de `date_debut` ; signaler (non bloquant) un débordement sur un semestre **de l'AY encore à créer** (§7.4, §7.6).

**Justifications structurantes.**
- *Une table `scriptorium_contenus` (pas deux)* : Textes et Cours partagent la quasi-totalité de leurs colonnes ; le seul écart est sémantique → discriminant `type`, comme le fait déjà `scriptorium_documents`. Deux tables dupliqueraient images, futurs chunks RAG, RLS et la branche polymorphe des créneaux.
- *Nouvelle table (pas de refactor de `scriptorium_documents`)* : `scriptorium_documents` est enfant obligatoire de `scriptorium_unites` (`unite_id NOT NULL`), semaine-indexé, exposé par `scriptorium_document_classes` — l'exact contraire de la réutilisabilité. Elle doit **rester intacte** : c'est le stockage « une semaine = un document » des livres Aletheia (ancrage IA).
- *Arc exclusif à FK réelles + CHECK (pas de `(target_type, target_id)` sans FK)* : garde l'intégrité référentielle et une **seule liste ordonnée** par (parcours, semaine), permettant de trier « 1 cours + 2 textes ».
- **(v2) *Garde de type DB sur le bras livre* (schema-S1)** : le CHECK d'arc garantit qu'un créneau `livre` a un `livre_id` non null, **mais pas** que cet id soit un livre (les unités survivent en base — soft-deletées, non purgées — après Phase A). La FK composite `(livre_id, livre_type='livre') → (id, type)` **ferme** ce trou au niveau DB : un copier-coller d'id d'unité, un bug de picker ou un import ne peuvent plus créer un créneau-livre pointant une unité. Le comportement MATCH SIMPLE (FK ignorée si `livre_id` null) préserve l'arc exclusif côté `contenu`.
- *Tranche de livre par bornes contiguës* : `[livre_semaine_debut, livre_semaine_fin]`, `(null,null)` = entier. Un sous-ensemble **non contigu** relèverait d'une table enfant `parcours_creneau_livre_semaines` — à n'introduire que si le besoin se matérialise. **(v2 — schema-S2)** Ces bornes sont des `int` **sans FK** vers `scriptorium_documents(id)` : c'est un choix **assumé**, car la re-découpe destructive (`modifierLivreComplet`, delete+reinsert) **régénère de nouveaux uuid** à chaque re-découpe — une FK sur `document_id` serait donc systématiquement cassée et n'apporterait aucune protection. La protection retenue est double : (a) la re-découpe **détecte et reconfirme** les créneaux référents (§7.5), (b) les bornes sont **revalidées/clampées à la lecture** (badge « tranche à revoir » si hors étendue, §7.3). *Décision d'arbitrage — à confirmer par le PO (§9).*
- *`nb_semaines` stocké explicitement* (pas dérivé de `max(semaine)`) : autorise des semaines vides déjà planifiées et pilote l'affichage « à définir » du débordement.
- *Soft-delete partout* : un contenu est référencé par N créneaux ; un DELETE dur casserait la structure (ou serait bloqué par le RESTRICT). Même patron que `scriptorium_unites.supprime_at`. **(v2 — schema-S7)** Le RESTRICT sur `contenu_id` **ne se déclenche jamais** en usage normal (soft-delete = la ligne reste) : ce n'est donc **pas** le « filet » qui protège les parcours tiers. La vraie protection est que la suppression **ne purge PAS** les créneaux référents (elle les **conserve**, affichés « contenu retiré », restaurables — §7.2). Symétriquement (v2 — migration-Mig4), un créneau référant un **livre** soft-deleté est **masqué** (badge « livre retiré ») au lieu d'être un fantôme silencieux.

### 4.2 RLS

Authoring **prof-only** sur les tables neuves (patron `exists (select 1 from profiles where id=auth.uid() and role='prof')`, identique à `scriptorium_*`/`calendrier_*`). Lecture élève **préparée mais non activée** — quand elle viendra, voie recommandée = **client admin + garde applicative** filtrant `texte_extrait` (anti-spoiler), sans policy SELECT élève directe.

```sql
alter table scriptorium_contenus         enable row level security;
alter table scriptorium_parcours         enable row level security;
alter table scriptorium_parcours_creneaux enable row level security;
alter table scriptorium_parcours_classes enable row level security;
-- (scriptorium_contenu_images a déjà sa RLS ; vérifier qu'elle couvre le nouveau chemin contenu_id.)

-- Exemple (à répliquer sur les 4 tables) :
drop policy if exists contenus_prof_all on scriptorium_contenus;
create policy contenus_prof_all on scriptorium_contenus
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));
```

### 4.3 Exposition classe : usages disjoints du livre (principe, application différée)

Principe : **l'assignation à une classe cesse d'être une propriété du contenu ; elle devient une propriété de la relation Parcours→Classe.** Un Texte/Cours n'a **aucun** lien classe direct ; son exposition = « figure dans un créneau » ∧ « ce parcours est assigné à la classe ».

| Table de liaison | Statut cible | Rôle |
|---|---|---|
| `scriptorium_parcours_classes` | **NOUVEAU, canonique (pour Textes/Cours)** | Parcours → classe (+ date). Seule voie d'exposition des Textes/Cours. |
| `scriptorium_unite_classes` | **CONSERVÉ tel quel — SOURCE UNIQUE de l'exposition Aletheia du livre** | Livre → classe. Source de vérité du planning **Aletheia**. |
| `scriptorium_document_classes` | **GELÉ → retiré au recâblage Quazian** | Vidé par la migration (cascade des documents d'unité). |
| `scriptorium_contenus` | — | **Aucune** table classe. Exposition transitive via parcours. |

**(v2 — schema-S3) Règle d'exposition du livre : mono-source, deux usages disjoints.**
Un même livre peut être **à la fois** planifié Aletheia (`scriptorium_unite_classes`) **et** référencé dans un créneau (`parcours_creneaux`). Ce sont **deux usages disjoints d'un même livre**, pas une unification :

1. **Usage « lecture Aletheia »** — exposition classe **exclusivement** via `scriptorium_unite_classes`. C'est la **seule** source de vérité de « quelles classes lisent ce livre dans Aletheia ». **Un créneau-livre n'ajoute JAMAIS d'accès Aletheia.**
2. **Usage « ordonnancement Parcours »** — le créneau-livre **positionne** le livre (entier ou tranche) dans le flux hebdomadaire du parcours, à des fins d'affichage/planification. L'usage « extrait / Quazian / RAG » d'un livre (chantier ultérieur) sera **distinct** de la lecture Aletheia et ne passera **pas** par `scriptorium_unite_classes`.

Il n'y a donc **pas** de « troisième source d'exposition » ni de réconciliation à opérer : les deux usages ne se recouvrent pas. Le recâblage futur Quazian/Codex qui dérivera l'accès depuis `parcours_classes` concernera **les Textes/Cours** (et, pour le livre, un futur usage « extrait/RAG » **explicitement séparé** de la lecture Aletheia), **jamais** l'exposition de lecture Aletheia du livre.

> ⚠️ **Le recâblage effectif** de Quazian/Codex sur la dérivée « accès classe depuis parcours_classes » (pour Textes/Cours) est **hors-scope** (§3.2). Le schéma est prêt ; le branchement viendra plus tard.
> ✅ *Décision d'arbitrage — à confirmer par le PO (§9) : exposition livre mono-source Aletheia.*

### 4.4 Emplacement RAG réservé (non implémenté)

Deux foyers de texte : `scriptorium_contenus.texte_extrait` et `scriptorium_documents.texte_extrait`. Cible future = tables de chunks + pgvector, réunies à la retrieval par la couche d'assemblage (`assembler*`). Rien à créer ici.

**(v2 — schema-S8) Note d'architecture (à trancher au chantier RAG).** Deux options :
- (a) **deux tables de chunks parallèles à FK réelles** (`scriptorium_contenu_chunks`, `scriptorium_document_chunks`) — simple mais **perpétue** le split contenu/document jusque dans les embeddings : le retrieval par parcours devra re-splitter par `ref_type` et unioner deux tables, réintroduisant au niveau RAG la dualité que l'arc-exclusif des créneaux efface au niveau orchestration ;
- (b) **une table de chunks unique** `scriptorium_chunks(source_type text check in ('contenu','document'), source_id uuid, …, embedding vector)` en **arc-exclusif** (même patron que les créneaux), avec deux FK réelles conditionnelles — le retrieval par créneau devient une simple jointure `(source_type, source_id)` sans union.
**Recommandation** : privilégier (b) pour aligner la couche RAG sur l'abstraction d'orchestration déjà retenue. Non implémenté ; simple justification à porter au chantier RAG.

### 4.5 (v2 — schema-S4) Snapshot d'horaire résolu (réservé, non implémenté)

**Constat.** La fondation **ne matérialise pas** le mapping `semaine→date` : l'aperçu prof le **recalcule** depuis les semestres/holidays courants (§5). C'est **acceptable pour la fondation** car l'aperçu est **prof-only** et se veut « source de vérité unique = frise ». Mais toute édition calendrier (ajout d'une vacance, re-bornage/archivage d'un semestre) **décale silencieusement** l'aval de **tous** les parcours assignés, sans version ni audit (risque #10, §9). Ce serait une base non-déterministe pour une future couche de **deadlines élève**.

**Décision (fondation).** On garde le **recalcul à la lecture** pour l'aperçu prof. On **prévoit** (documenté, **non implémenté**) un **snapshot d'horaire optionnel**, à activer au chantier « consommation élève » :
- colonnes réservées sur `scriptorium_parcours_classes` : `horaire_snapshot jsonb` (liste `{ semaine, dateReelle, statut, semestreNom, pedaDansSemestre }`), `snapshot_version int`, `snapshot_genere_le timestamptz` ;
- **généré explicitement lors de la PUBLICATION** de l'horaire vers les élèves (pas à l'assignation prof) ;
- **régénération explicite** (bouton) avec **diff visible** (« 4 échéances décalées : … ») avant de re-publier ;
- l'aperçu prof continue d'afficher la frise **recalculée** ; l'écart snapshot↔frise devient un signal actionnable.

> ✅ *Décision d'arbitrage — à confirmer par le PO (§9) : snapshot d'horaire différé au chantier consommation élève.*

---

## 5. Frise d'enseignement continue inter-semestres

### 5.1 Ce qu'on réutilise / ce qu'on ajoute

Réutilisé de `utils/calendrier-grille.ts` : `lundiOnOrBefore`, `addDaysUTC`, `toISODate`, et surtout `calculerGrilleSemaines(semestre, holidays)` qui découpe **un** semestre en semaines lundi→dimanche, marque les vacances (chevauchement ≥ 1 jour, `pedagogicalNumber:null`) et numérote les semaines de travail **en repartant de 1 à chaque semestre**.

Ajouté (pur, aucune table) — `utils/frise-enseignement.ts` :

```ts
interface SemaineEnseignement {
  indexContinu: number        // 1..N GLOBAL, sans reset inter-semestre (saute les vacances) — INTERNE (mapping)
  semestreId: string
  semestreNom: string
  pedagogicalNumber: number   // n° LOCAL au semestre (étiquette « S1 · sem. 3 ») — AFFICHAGE
  dateDebutLundi: string      // YYYY-MM-DD (lundi, date pure)
  dateFinDimanche: string     // YYYY-MM-DD (dimanche)
}

// v2 — maths-M1 : dérive l'année scolaire (AY) d'une date pure.
// Convention VERROUILLÉE : AY = [Y-08-01, (Y+1)-07-31]. AOÛT ⇒ NOUVELLE année.
//   mois(1..12) >= 8  → Y = année(date)         (août..décembre)
//   mois < 8          → Y = année(date) - 1     (janvier..juillet)
function anneeScolaireDe(dateISO: string): number

// Concatène, dans l'ordre chronologique des semestres VIVANTS de l'AY, les semaines
// NON-vacances de chaque calculerGrilleSemaines(), et renumérote en continu.
// v2 — maths-M3 : si un end_date n'est pas un DIMANCHE, signale et TRONQUE la dernière
//   semaine partielle (voir règle ci-dessous). v2 — maths-M4 : si deux semestres se
//   chevauchent, renvoie un `avis` bloquant (« configuration semestres incohérente »).
function friseEnseignementContinue(
  semestres: { id; name; start_date; end_date; archived_at }[],  // déjà filtrés AY + archived_at IS NULL, triés par start_date
  holidaysParSemestre: Map<string, Holiday[]>
): { frise: SemaineEnseignement[]; avis?: string; avisBloquant?: boolean }

// Date prof → indexContinu de la semaine qui la CONTIENT, sinon la SUIVANTE
// (vacances/gap/avant la 1re). null si au-delà de la frise connue de l'AY.
// v2 — maths-M1 : si la frise est VIDE, renvoie un `avis` explicite (frise vide),
//   pas un a_definir muet.
function resoudreAncre(
  friseResult: { frise: SemaineEnseignement[]; avis?: string; avisBloquant?: boolean },
  dateDebut: string
): { ancreIdx: number | null; avis?: string }

// Semaine k du parcours (1..nb) → SemaineEnseignement (statut 'resolue') ou marqueur
// non résolu. v2 — décision 8 / schema-S5 : distingue deux statuts non résolus :
//   'a_definir'      = déborde sur un semestre de l'AY encore à créer (résoluble)
//   'non_planifiable'= déborde au-delà de l'AY (frontière août) — DÉFINITIF, non résoluble
function mapperParcours(
  friseResult, ancreIdx, nbSemaines
): Array<SemaineEnseignement | { statut: 'a_definir' | 'non_planifiable' }>
```

**Règle de chargement des semestres (v2 — maths-M1, remplace « année scolaire de l'ancre »).**
Côté serveur, au moment de l'aperçu/assignation :
1. Calculer `Y = anneeScolaireDe(date_debut)` — **dérivée de `date_debut`, pas de l'ancre** (fin de la circularité : l'ancre est un `indexContinu` qui dépendrait de la frise déjà construite).
2. Charger les semestres **`archived_at IS NULL`** dont la `start_date` tombe dans `[Y-08-01, (Y+1)-07-31]`, **triés par `start_date`**. **Ne jamais** filtrer sur `is_active` (couplage mono-semestre à fuir, §9).
3. Construire la frise sur ce sous-ensemble.
4. **Si la frise est vide** → renvoyer un **`avis` explicite** : « aucun semestre pour l'année scolaire de cette date » (distinct du cas (c′) « ancre après le dernier semestre »). Ne **jamais** dégrader en `a_definir` muet.

**Règle de comptage de la dernière semaine (v2 — maths-M3).**
`calculerGrilleSemaines` inclut toute semaine dont le **lundi ≤ `end_date`**. Si `end_date` **n'est pas un dimanche**, la dernière semaine émise déborde au-delà de la fin réelle du semestre et gonfle `pedagogicalNumber` d'une unité, décalant **tout** le débordement d'une semaine.
- **Normalisation demandée** : `semesters.end_date` **doit être un dimanche** (fin de semaine calendaire). À valider **côté config semestres** (voir §7.4/config) — idéalement en refusant/avertissant la saisie d'une `end_date` non dominicale.
- **Filet dans `friseEnseignementContinue`** : si la dernière semaine émise d'un semestre a `lundi > end_date − 6 j` (i.e. son intersection avec `[start,end]` fait moins de 7 jours), **signaler** (`avis`) et **tronquer** cette semaine partielle (ne pas l'émettre comme semaine d'enseignement pleine). La règle exacte : **une semaine n'est comptée comme semaine d'enseignement que si `dimanche(semaine) ≤ end_date`** (semaine calendaire entièrement dans le semestre) ; une `end_date` dominicale garantit cette égalité sur la dernière semaine.

**Règle d'ancre (unique, prouvée).** *L'ancre est la première semaine `W` de la frise telle que `W.dateFinDimanche >= dateDebut`.* Elle couvre les deux cas : date dans une semaine d'enseignement → containment ; date en vacances/gap → semaine suivante.

**Off-by-one (point sensible).** La semaine d'ancre **est** la 1re du parcours : `indexContinu = ancreIdx + (k − 1)`. Ceci remplace le patron naïf `dateIndicative(dateDebut, semaine) = dateDebut + (semaine-1)*7` (`app/eleve/modules/aletheia/data.ts:28`), qui ne saute ni vacances ni gap.

**(v2 — schema-S6) Trois numérotations coexistent — quel numéro fait foi.**
| Numérotation | Portée | Usage | Exposée à l'utilisateur ? |
|---|---|---|---|
| `indexContinu` (frise) | global inter-semestre, sans reset | **mapping interne** (calcul de dates, off-by-one) | **NON — jamais affichée brute** |
| `pedagogical_number` (frise / `calculerGrilleSemaines`) | local au semestre, reset par semestre | **affichage** (« S1 · sem. 3 ») | **OUI** |
| `fragments_semaines.pedagogical_number` | grille pédagogique **matérialisée** (Fragments) | affichage Fragments | OUI (contexte Fragments) |
**Règle** : l'UI Parcours **n'expose que** le libellé `S{semestre} · sem. {pedagogical_number}` ; `indexContinu` reste **interne**. Point de vigilance : pour une même semaine calendaire, Fragments (`fragments_semaines`), Parcours (péda local) et le mapping interne (indexContinu) peuvent afficher des numéros différents — à surveiller lors d'une future consommation croisée (idéalement, dériver `fragments_semaines` de la même primitive que la frise). Voir §9.

### 5.2 Déroulé chiffré (exemple du product owner) — inchangé, vérifié au jour près

Données : **S1** `2026-09-07 → 2026-12-27` (dimanche), vacance « Relâche » = semaine du `2026-10-26` ; **S2** `2027-01-11 → 2027-04-30` ; gap inter-semestre `2026-12-28 → 2027-01-10` non modélisé. *(Note v2 — maths-M3 : les deux `end_date` de cet exemple sont bien des dimanches — pas de troncature.)*

Frise obtenue (vacance sautée entre idx 7 et 8 ; gap sauté entre idx 15 et 16) :

| indexContinu | Semestre | péda. local | Lundi → Dimanche |
|---|---|---|---|
| 1 | S1 | 1 | 2026-09-07 → 09-13 |
| 2 | S1 | 2 | 2026-09-14 → 09-20 |
| **3** | S1 | **3** | **2026-09-21 → 09-27** |
| 4 | S1 | 4 | 2026-09-28 → 10-04 |
| 5 | S1 | 5 | 2026-10-05 → 10-11 |
| 6 | S1 | 6 | 2026-10-12 → 10-18 |
| 7 | S1 | 7 | 2026-10-19 → 10-25 |
| — | *(Relâche)* | — | *2026-10-26 → 11-01 (hors frise)* |
| 8 | S1 | 8 | 2026-11-02 → 11-08 |
| … | S1 | … | … |
| 15 | S1 | 15 | 2026-12-21 → 12-27 |
| — | *(gap)* | — | *12-28 → 01-10 (hors frise)* |
| 16 | S2 | 1 | 2027-01-11 → 01-17 |
| 17 | S2 | 2 | 2027-01-18 → 01-24 |
| 18 | S2 | 3 | 2027-01-25 → 01-31 |

Le prof saisit `date_debut = 2026-09-23` (mercredi) → `anneeScolaireDe('2026-09-23') = 2026` (mois 9 ≥ 8) → AY `[2026-08-01, 2027-07-31]` → S1 **et** S2 chargés → première semaine avec `fin >= 2026-09-23` = **idx 3** → `ancreIdx = 3`.

Mapping, `nb_semaines = 16` (`idx = 3 + (k−1) = k + 2`) :

| k | idx | Semestre · péda | Lundi → Dimanche | Note |
|---|---|---|---|---|
| 1 | 3 | S1 · 3 | 2026-09-21 → 09-27 | ancre |
| 5 | 7 | S1 · 7 | 2026-10-19 → 10-25 | |
| 6 | 8 | S1 · 8 | 2026-11-02 → 11-08 | **saute la relâche** |
| 13 | 15 | S1 · 15 | 2026-12-21 → 12-27 | dernière de S1 |
| 14 | 16 | S2 · 1 | 2027-01-11 → 01-17 | **saute le gap** ; résolu **car S2 existe** (décision 8) |
| 15 | 17 | S2 · 2 | 2027-01-18 → 01-24 | |
| 16 | 18 | S2 · 3 | 2027-01-25 → 01-31 | **fin du parcours** |

Vérification : S1 fournit `#3..#15` = 13 semaines (k=1..13) ; reste 3 semaines débordant sur S2 `#1..#3` (k=14..16). **Le parcours se termine à la semaine d'enseignement 3 de S2, soit le lundi 2027-01-25.** Comportement exact décrit par le PO. Comme S1 et S2 appartiennent à la **même** AY 2026-27 et existent tous deux, l'assignation est **pleinement résolue** (aucun `a_definir`, aucun `non_planifiable` — décision 8).

### 5.3 Cas de bord (v2 — durcis)

| # | Cas | Comportement (v2) |
|---|---|---|
| (a) | **Semestre suivant (de la même AY) pas encore créé** | Avec la **décision 8**, ce cas est **rare** : le prof définit ses semestres à l'avance. S'il subsiste, `mapperParcours` renvoie le statut **`a_definir`** pour les k concernés et l'assignation **signale** (« ce parcours déborde sur un semestre non encore défini de l'année scolaire — définissez le semestre suivant pour dater ces semaines »). On **ne matérialise pas** les dates ; on ne stocke que `date_debut`. Créer le semestre puis régénérer → ces semaines se résolvent seules, sans migration. **Résoluble.** |
| (a′) | **Débordement au-delà de l'année scolaire (frontière août)** | **(v2 — décision 8 / maths-M2 / schema-S5)** Statut **`non_planifiable`** : la frise est bornée à l'AY de `date_debut` ; un semestre de l'AY suivante ne sera **jamais** chaîné. L'assignation **BLOQUE** avec message clair (« ce parcours prolonge au-delà des semestres définis / au-delà de l'année scolaire — définissez le semestre suivant ou **raccourcissez le parcours** »). **Non résoluble** dans l'AY courante → on ne présente **jamais** ce cas comme un `a_definir` transitoire. |
| (b) | **Gap entre S1 et S2** (intersemestre non modélisé) | **Sauté**, comme des vacances : la continuité est **pédagogique**, pas calendaire. Garde-fou : ne chaîner que des semestres **de la même année scolaire** (frontière août, `anneeScolaireDe`) et **signaler sans bloquer** si le gap > ~6 semaines (config aberrante). |
| (c) | **Ancre avant le 1er semestre de l'AY** | `ancreIdx = 1` + `avis` (« date antérieure au programme »). Non bloquant. |
| (c′) | **Ancre après le dernier semestre de l'AY** (mais frise non vide) | `ancreIdx = null` → `avis` (« date postérieure au dernier semestre défini de l'année scolaire — définir le semestre suivant »). À distinguer du cas « frise vide » (aucun semestre pour l'AY, §5.1 pt 4). |
| (c″) | **(v2 — maths-M1) Frise vide** (aucun semestre vivant pour l'AY de `date_debut`) | **`avis` explicite** : « aucun semestre pour l'année scolaire de cette date ». **Jamais** un `a_definir` muet. Bloque l'aperçu résolu (rien à résoudre). |
| (d) | **Chevauchement / doublon de frontière de semestre** | **(v2 — maths-M4)** Le chevauchement de deux semestres (`start[i] <= end[i-1]`) est traité comme une **erreur de configuration BLOQUANTE** : (i) **côté config semestres**, la sauvegarde de deux semestres qui se recouvrent est **refusée** ; (ii) **défense en profondeur** dans `friseEnseignementContinue` : si un chevauchement est détecté malgré tout, la fonction remonte `avisBloquant=true`, et l'aperçu §7.4 affiche un **bandeau « configuration semestres incohérente »** qui **empêche l'assignation** sur une frise corrompue. L'anti-doublon de frontière (`w.start <= dernierLundiEmis` → skip, car `lundiOnOrBefore(S2.start)` peut recouvrir la dernière semaine calendaire de S1) reste, mais **n'est plus la seule protection** : un simple `console`/signal interne ne protège pas le prof qui date un parcours. |
| (e) | **(v2 — maths-M3) `end_date` d'un semestre non dominicale** | Signalé côté config (saisie idéalement contrainte au dimanche) ; à défaut, `friseEnseignementContinue` **tronque** la dernière semaine partielle et remonte un `avis` (« dernière semaine de {semestre} tronquée : end_date non dominicale »). |

### 5.4 Discipline fuseau (confirmée)

Tout est en **date pure UTC**. Aucun `timestamptz` dans le mapping. `date_debut` = colonne `date` (comme `semesters.start_date`), arithmétique via `lundiOnOrBefore`/`addDaysUTC`/`toISODate` (getters UTC, pas de dérive DST), comparaisons **lexicales** sur `YYYY-MM-DD`. Affichage via `formatJour` (UTC), comme les grilles calendrier. `anneeScolaireDe` lit le mois/année en **UTC** (`toISODate` → slice). Le seul recours au fuseau reste le `today` de surbrillance (cosmétique, hors mapping).

---

## 6. Migration — « ne garder que les livres Aletheia »

> ⚠️ **Fait structurant #1** — le schéma de base (`scriptorium_unites`, `scriptorium_documents`, `quazian_*`) précède le versionnage SQL : ses clauses `ON DELETE` **ne sont pas lisibles dans git**. **Conséquence : on ne s'appuie PAS sur les cascades. On supprime les enfants explicitement, dans l'ordre, scopés par `unite_id`.** Le script marche que les FK soient CASCADE, RESTRICT ou NO ACTION. *(Ceci tranche la divergence entre la note schéma — qui proposait un `delete … type='unite'` reposant sur les cascades — et la note migration : on retient l'approche explicite.)*

> ⚠️ **Fait structurant #2** — la protection d'une carte/session vient du **TYPE de son unité parente**, jamais de son `source`. Ne jamais filtrer par `source <> 'aletheia'` : on filtre par `scriptorium_unite_id ∈ {unités type='unite'}`. Une carte de vocabulaire ancrée sur un livre a `scriptorium_unite_id = <id du livre>` → hors périmètre → intacte.

### 6.1 Audit des cascades (à confirmer live)

FK entrantes vers `scriptorium_unites(id)` : `scriptorium_documents(unite_id)` CASCADE ; `scriptorium_unite_classes` CASCADE ; `aletheia_travaux/capstone/livre_reference/diagnostic(scriptorium_livre_id)` CASCADE (mais **livre-only** → jamais atteints) ; `codex_sessions(scriptorium_unite_id)` CASCADE ; `quazian_flashcards(scriptorium_unite_id)` CASCADE (ambivalent : unité=jetable, vocab-livre=à préserver, distingués par `type`) ; `quazian_publications` à vérifier. **(v2)** Nouvelle FK entrante ajoutée par ce chantier : `scriptorium_parcours_creneaux(livre_id, livre_type) → (id, type)` **ON DELETE RESTRICT** — sans effet sur la migration (les créneaux ne référencent que des **livres**, hors périmètre `_u`).

**Découplage clé** : `scriptorium_documents.semaine` n'est **pas** une FK — Aletheia/Quazian référencent `semaine`/`semaine_index` en `int`, jamais l'`id` d'un document. Supprimer les documents d'une unité ne remonte donc vers **aucune** table Aletheia.

### 6.2 Ce qu'on garde / ce qu'on perd

**Conservé (structurellement étanche)** : `scriptorium_unites type='livre'` + leurs documents + `scriptorium_unite_classes` + tous les `aletheia_*` + **toutes** les `quazian_flashcards` de vocabulaire ancrées livre (peu importe `source`) + leurs `quazian_card_states`.

**Perdu (à ACTER explicitement — « impact accepté », pas « aucun impact »)** : unités pilote + leurs documents/images/liaisons + `quazian_publications` d'unité + `quazian_flashcards` d'unité + **`quazian_card_states` + `quazian_review_log`** (progression FSRS élève) + **`codex_travaux` (OCR V1/VF, retours) + `codex_erreurs`** (travail/trace Codex élève). Le PO les qualifie de jetables : **à valider avant exécution prod.**

Effet de bord bénin : `quazian_quizzes.scope_unites` (tableau sans FK) survit en pointant des unités disparues — inoffensif (le code réduit sur les unités présentes).

### 6.3 Contenu bibliothèque : bibliothèques **vides** par défaut

Décision 4 (données pilote jetables) → **on ne migre PAS** les anciens documents `type='cours'`/`'texte'` vers `scriptorium_contenus`. Les bibliothèques démarrent **vides**. *Option* (si le prof veut garder des items précis) : import ponctuel avant purge (`titre`, `auteur`, `texte_extrait`, `chapitres`, `fichier_ref` + re-pointage images vers `contenu_id`).

### 6.4 Script sûr (5 étapes, Phase A réversible puis Phase B dure)

**Étape 0 — Backup (obligatoire prod) — (v2 — migration-Mig2 : inclut les tables `aletheia_*`)** :
```bash
# Les tables aletheia_* SONT les données à préserver (travail élève sur les livres,
# fiches, capstone, calibration). Un backup qui les OMET donne une fausse assurance.
pg_dump "$SUPABASE_DB_URL" \
  -t scriptorium_unites -t scriptorium_documents -t scriptorium_document_classes \
  -t scriptorium_contenu_images -t scriptorium_unite_classes \
  -t quazian_flashcards -t quazian_card_states -t quazian_review_log -t quazian_publications \
  -t codex_sessions -t codex_travaux -t codex_erreurs \
  -t aletheia_travaux -t aletheia_capstone -t aletheia_livre_reference \
  -t aletheia_diagnostic -t aletheia_params \
  --data-only --column-inserts -f backup_pre_purge_$(date +%Y%m%d).sql
```
> **Recommandation forte (v2)** : préférer un **snapshot / PITR Supabase complet** juste avant la fenêtre de maintenance. Le `pg_dump` partiel ci-dessus reste utile pour une restauration ciblée, mais **seul un snapshot complet** garantit l'absence d'angle mort. Ne pas s'appuyer sur un dump partiel comme unique filet.

**Étape 1 — Introspection du catalogue live** (lire les `ON DELETE` réels et les triggers avant tout) :
```sql
select c.conname, conrelid::regclass as enfant, confrelid::regclass as parent,
       a.attname as colonne_fk,
       case c.confdeltype when 'a' then 'NO ACTION' when 'r' then 'RESTRICT'
            when 'c' then 'CASCADE' when 'n' then 'SET NULL' when 'd' then 'SET DEFAULT' end as on_delete
from pg_constraint c
join lateral unnest(c.conkey) with ordinality k(attnum, ord) on true
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
where c.contype = 'f'
  and confrelid::regclass in ('scriptorium_unites'::regclass, 'scriptorium_documents'::regclass,
                              'quazian_flashcards'::regclass, 'quazian_card_states'::regclass)
order by parent, enfant;
-- + inventaire pg_trigger sur ces tables. NE PAS utiliser session_replication_role='replica'
--   (il désactive aussi FK et CHECK — l'inverse du contrôle recherché).
```

**Étape 2 — Dry-run** (comptages « ce qui part » vs « ce qui reste », valider les volumes pilote et un garde-fou anti-livre = 0, **calculé de façon non tautologique** — cf. étape 4).

**Étape 3 — Phase A (recommandée en prod d'abord, réversible, zéro code à changer) — (v2 — migration-Mig5 : réversibilité scopée)** :
```sql
begin;
  -- v2 — Mig5 : matérialiser les ids RÉELLEMENT flippés pour une réversion scopée.
  create table if not exists _migration_phase_a_flip (
    kind text not null,          -- 'unite' | 'publication'
    id   uuid not null,
    flippe_le timestamptz not null default now()
  );

  insert into _migration_phase_a_flip (kind, id)
    select 'unite', id from scriptorium_unites
    where type='unite' and supprime_at is null;         -- SEULEMENT celles qui étaient vivantes

  update scriptorium_unites set supprime_at = now()
    where id in (select id from _migration_phase_a_flip where kind='unite');

  insert into _migration_phase_a_flip (kind, id)
    select 'publication', id from quazian_publications
    where scriptorium_unite_id in (select id from scriptorium_unites where type='unite')
      and flashcards_visibles = true;                   -- SEULEMENT celles réellement publiées

  update quazian_publications set flashcards_visibles = false
    where id in (select id from _migration_phase_a_flip where kind='publication');
commit;
```
Réversion **scopée** (ne ressuscite que ce qui a été flippé — ne re-publie/ne restaure PAS des lignes soft-deletées/dépubliées AVANT la migration) :
```sql
begin;
  update scriptorium_unites set supprime_at = null
    where id in (select id from _migration_phase_a_flip where kind='unite');
  update quazian_publications set flashcards_visibles = true
    where id in (select id from _migration_phase_a_flip where kind='publication');
commit;
-- (À défaut de cette table de marquage, DOCUMENTER que la réversion en masse
--  `where type='unite'` n'est PAS idempotente vis-à-vis des soft-deletes/dépublications antérieurs.)
```
**(v2 — migration-Mig3, corrige la contradiction §6.4/§6.5)** : les **5 pickers prof** (`quazian/actions.ts:28`, `quazian/page.tsx:17`, `quazian/quizz/page.tsx:37`, `quazian/diagnostic/actions.ts:96`, `codex/actions.ts:26`) **filtrent déjà** `.is('supprime_at', null)` → le soft-delete Phase A rend les unités **invisibles côté prof immédiatement** ; la dépublication coupe **en plus** la visibilité **élève** Quazian (qui lit `quazian_publications`, pas `unites.supprime_at`). La recette L7 « unités invisibles prof » est donc **testable et attendue** (aligné sur §6.5). Observer quelques jours.

**Étape 4 — Phase B (purge dure, après backup + fenêtre de maintenance)** — une transaction, suppressions **explicites feuilles→racine**, scopées, avec garde-fou `RAISE` **non tautologique** :
```sql
begin;
create temporary table _u  on commit drop as select id from scriptorium_unites   where type='unite';
create temporary table _d  on commit drop as select id from scriptorium_documents where unite_id in (select id from _u);
create temporary table _f  on commit drop as select id from quazian_flashcards    where scriptorium_unite_id in (select id from _u);
create temporary table _cs on commit drop as select id from codex_sessions        where scriptorium_unite_id in (select id from _u);

-- v2 — migration-Mig1 : GARDE-FOU NON TAUTOLOGIQUE.
-- On calcule les livres du périmètre INDÉPENDAMMENT de _u : on repart des ids de _u
-- et on vérifie leur type DIRECTEMENT dans scriptorium_unites (source), sans réappliquer
-- le filtre type='unite'. Si UN SEUL id de _u n'est pas 'unite' (donc un livre, ou une
-- valeur inattendue), on ABORTE. Contrairement à l'ancienne formulation
-- (`... and type <> 'unite'` sur _u, structurellement toujours 0), ce contrôle PEUT
-- se déclencher si la définition de _u dérive un jour.
-- NB (documenté) : la PROTECTION RÉELLE des livres reste le filtre `type='unite'` de _u ;
-- ce RAISE est une défense en profondeur qui DÉTECTE une dérive de _u, pas la protection primaire.
do $$
declare n_non_unite int; n_aletheia int;
begin
  select count(*) into n_non_unite
    from scriptorium_unites u
    where u.id in (select id from _u)
      and u.type is distinct from 'unite';   -- doit être 0 ; sinon _u a dérivé
  select count(*) into n_aletheia from (
    select 1 from aletheia_travaux          where scriptorium_livre_id in (select id from _u)
    union all select 1 from aletheia_capstone        where scriptorium_livre_id in (select id from _u)
    union all select 1 from aletheia_livre_reference where scriptorium_livre_id in (select id from _u)
    union all select 1 from aletheia_diagnostic      where scriptorium_livre_id in (select id from _u)) x;
  if n_non_unite <> 0 or n_aletheia <> 0 then
    raise exception 'ABORT: périmètre _u touche % ligne(s) non-unité / % ligne(s) Aletheia', n_non_unite, n_aletheia;
  end if;
end $$;

-- Suppressions ordonnées
delete from quazian_review_log  where card_state_id in (select id from quazian_card_states where flashcard_id in (select id from _f));
delete from quazian_card_states where flashcard_id in (select id from _f);
delete from codex_erreurs       where travail_id in (select id from codex_travaux where session_id in (select id from _cs));
delete from codex_travaux       where session_id in (select id from _cs);
delete from quazian_flashcards  where id in (select id from _f);
delete from codex_sessions      where id in (select id from _cs);
delete from quazian_publications where scriptorium_unite_id in (select id from _u);
delete from scriptorium_contenu_images   where document_id in (select id from _d);
delete from scriptorium_document_classes where document_id in (select id from _d);
delete from scriptorium_documents        where id in (select id from _d);
delete from scriptorium_unite_classes    where unite_id in (select id from _u);
delete from scriptorium_unites where id in (select id from _u) and type = 'unite';

-- Vérif post-purge (livres/aletheia inchangés) via RAISE NOTICE ; rollback si surprise avant commit.
commit;
```

### 6.5 Impact code hors-scope (vérifié : rien à changer pour la fondation)

Les 5 sites lisant `type='unite'` en dur sont déjà robustes à 0 unité (`?? []` + `.is('supprime_at', null)`, aucun `.single()` sur les listes). Ils afficheront des sélecteurs vides jusqu'au recâblage. Angles morts non bloquants : visibilité élève Quazian (traitée par la dépublication Phase A) ; `quazian_quizzes.scope_unites` orphelin (dégradé silencieux propre). **(v2)** Cohérent avec §6.4 étape 3 : ces 5 pickers filtrent `supprime_at` → invisibilité prof immédiate au soft-delete.

---

## 7. UI & server actions (PROF)

### 7.1 Onglets

`app/prof/scriptorium/page.tsx`, même mécanique `?vue=` / `<Link>` / style `ongletClasse()`. **Aujourd'hui** : `Par classe · Par unité · Paramètres`. **Cible** :

```
[ Textes ]  [ Cours ]  [ Parcours ]  [ Livres ]  [ Paramètres ]
 ?vue=textes  ?vue=cours  ?vue=parcours ?vue=livres  ?vue=parametres
```

| Onglet | Remplace | Rôle |
|---|---|---|
| **Textes** / **Cours** | éclatent `Par unité` | Bibliothèques réutilisables (même écran, `type` filtré). |
| **Parcours** | `Par unité` (le conteneur devient Parcours) | Builder : grille hebdo + ordre + assignation classe datée. |
| **Livres** | sous-vue livre de `Par unité` | Liste des livres + vue-livre 3 colonnes **inchangée**. |
| **Paramètres** | `Paramètres` | Prompts carte/référence, **inchangé**. |

**« Par classe » disparaît comme surface d'édition** : la visibilité **dérive** désormais des parcours assignés (fin de la double saisie). Sa fonction « qu'est-ce que voit cette classe ? » se réincarne en **aperçu lecture seule** dans l'onglet Parcours (§7.4).

### 7.2 Onglets Textes & Cours (bibliothèques jumelles)

Liste `scriptorium_contenus WHERE type=<onglet> AND supprime_at IS NULL`, triée par titre : titre, auteur, badge type, aperçu `texte_extrait` (`line-clamp-2`), vignettes, **compteur « utilisé dans N parcours »** (COUNT sur `parcours_creneaux`), actions Modifier/Supprimer. Recherche client par titre/auteur.

**(v2 — schema-S7) Suppression = soft-delete SANS purge des créneaux.** L'action `supprimerContenu` fait un **soft-delete** (`supprime_at = now()`) et **conserve** les créneaux référents (elle ne les purge PAS). Le `confirm()` et le compteur « utilisé dans N parcours » **restent** (information au prof), mais le message devient : « Ce contenu est utilisé dans N parcours ; il y apparaîtra comme **“contenu retiré”** (restaurable). » Dans les parcours concernés, le créneau reste en place, affiché **« contenu retiré »** (badge grisé, titre `titre_affiche` s'il existe sinon « contenu retiré »), et la **restauration** du contenu (`supprime_at = null`) le réactive partout. Aucune cascade destructive sur des parcours tiers. *(Symétrie côté livre : créneau pointant un livre soft-deleté → badge « livre retiré », voir §7.3 / migration-Mig4.)*

Formulaire = `FormulaireContenu.tsx` → **`FormulaireContenuBiblio`** : **retire** Unité / Semaine / Classes ; type **implicite** (fixé par l'onglet) ; **ajoute** Auteur et remonte Chapitres ; garde Titre, corps texte, fichier (via `extraireTexte()` + upload URL signée), légende + images. Édition en ligne = **`LigneContenuBiblio`** (variante de `LigneContenu.tsx` sans chips classe ni select unité/semaine).

### 7.3 Onglet Parcours — le builder

**Liste** (`?vue=parcours`, sans `parcours=`) : tuiles `components/Tuile.tsx`, sous-titre `N semaines · X classe(s)`, bouton « + Nouveau parcours » (mini-form titre + nb_semaines).

**Détail** (`?vue=parcours&parcours=<id>`), deux zones :

*La grille* — une ligne par semaine `1..nb_semaines` ; dans chaque semaine, la liste **ordonnée** (`ordre`) des créneaux : poignée drag `⠿`, badge type (`Cours`/`Texte`/`Livre`), titre (livre-tranche : « — tranche Sx→Sy » ou « — entier »), bouton retirer. Réordonner dans la semaine = drag (fallback ↑/↓) → `reordonnerCreneaux`. Déplacer vers une autre semaine = select « Semaine » (MVP) → `deplacerCreneau` (drag inter-semaines différé).

**(v2) États dégradés affichés (jamais de fantôme silencieux) :**
- **schema-S7** — créneau dont `contenu_id` est soft-deleté → badge **« contenu retiré »** (grisé), restaurable en réactivant le contenu.
- **migration-Mig4** — créneau dont `livre_id` est soft-deleté → badge **« livre retiré »** (grisé). Le builder/aperçu résout le titre depuis `scriptorium_unites` en incluant les `supprime_at` non null **uniquement pour l'affichage du badge**, pas pour la résolution normale.
- **schema-S2** — créneau-livre dont la tranche `[debut,fin]` sort de l'étendue courante du livre (après re-découpe) → badge **« tranche à revoir »** (voir §7.5).

*Le picker « + Ajouter »* (popover, onglets internes Textes/Cours/Livres + recherche) : Textes/Cours → `ajouterCreneau(parcoursId, semaine, { contenuId })` ; Livres → choix **entier** ou **tranche** (sélecteur de plage lisant les `scriptorium_documents.semaine` réelles du livre) → `ajouterCreneau(parcoursId, semaine, { livreId, semaineDebut?, semaineFin? })`. Un même contenu peut être ajouté plusieurs fois. **(v2 — schema-S9)** `ordre` est calculé **atomiquement** côté action (§7.6) ; l'unicité `(parcours_id, semaine, ordre)` empêche tout doublon de course.

### 7.4 Assignation par classe + aperçu frise

Une ligne par classe active : toggle assigné (`assignerParcoursClasse`/`retirerParcoursClasse`) + **`ChampDate`** (`app/prof/calendrier/config/ChampDate.tsx`, émet `YYYY-MM-DD`). Dès qu'une date est posée, **aperçu résolu** (calculé par la frise §5) : note de snap (« ramené à la semaine d'enseignement du … » si vacances/hors semestre), chaque semaine → date réelle + repère `S1 · sem. 3`.

**(v2) Signalements/blocages à l'aperçu (décision 8 / M1 / M4) :**
- **Débordement hors année scolaire (`non_planifiable`, décision 8 / maths-M2 / schema-S5)** → bandeau **bloquant** : « Ce parcours prolonge au-delà des semestres définis de l'année scolaire (N semaine(s) non planifiable(s)). Définissez le semestre suivant **ou raccourcissez le parcours**. » L'assignation est **refusée** tant que le débordement subsiste. **Distinction UI nette** : « à définir (semestre à créer) » (jaune, résoluble) ≠ « **non planifiable** (hors année scolaire) » (rouge, bloquant).
- **Débordement sur un semestre de l'AY encore à créer (`a_definir`, cas rare avec décision 8)** → badge **« à définir »** (jaune) + note « se recalcule à la création du semestre suivant ».
- **Frise vide / ancre hors frise (maths-M1, cas c″/c′)** → bandeau `avis` explicite (« aucun semestre pour l'année scolaire de cette date » / « date postérieure au dernier semestre défini »), pas d'aperçu résolu.
- **Configuration semestres incohérente (maths-M4, `avisBloquant`)** → bandeau rouge **« configuration semestres incohérente (chevauchement) »** qui **empêche l'assignation** sur une frise corrompue. À traiter d'abord côté config semestres.

*(Config semestres — hors périmètre strict mais lié : la saisie doit refuser deux semestres qui se chevauchent (M4) et idéalement contraindre `end_date` au dimanche (M3).)*

### 7.5 Onglet Livres (conservé) + re-découpe consciente des créneaux (v2 — schema-S2)

`?vue=livres` = chemin `vue=unites` filtré `type='livre'`, **inchangé** : tuiles livres, `VueLivre` 3 colonnes (`PanneauFiche`/`ColonneCarte`), `EnteteLivre`, mode découpe (`EditeurLivre`), régénération des fiches. Ajout discret « utilisé dans N parcours » sur la tuile (la sélection comme contenu se fait dans le picker Parcours, pas ici).

**(v2 — schema-S2) `modifierLivreComplet` (re-découpe, `app/prof/scriptorium/actions.ts:394`, delete+reinsert) devient CONSCIENTE des créneaux référents.** La re-découpe est **destructive** (elle supprime puis ré-insère tous les documents du livre avec de **nouveaux uuid** ; `max(semaine)` peut changer). Une FK sur `document_id` **ne suffirait pas** — les uuid changent à chaque re-découpe, donc toute FK serait systématiquement rompue et n'offrirait aucune protection ; c'est pourquoi les bornes de tranche restent des `int` sur `semaine`. À la place :
1. **Détection** : avant/pendant la re-découpe, lister les créneaux `ref_type='livre'` pointant ce `livre_id` **avec une tranche** (`livre_semaine_debut`/`fin` non nuls).
2. **Reconfirmation** : si de nouvelles bornes d'étendue (`1..nouveau_max_semaine`) **excluent** une borne de tranche existante (`debut` ou `fin` hors `[1, nouveau_max]`), **exiger une reconfirmation explicite du prof** (« N parcours référencent des tranches de ce livre ; la re-découpe peut les rendre invalides — confirmer ? »).
3. **Revalidation / clamp** : à la confirmation, **clamp** les bornes dans la nouvelle étendue (ou marquer la tranche « à revoir »), et **journaliser l'impact** (quel parcours, quelle tranche, ancienne→nouvelle borne).
4. **Validation à la lecture** (défense en profondeur) : le builder/aperçu **revalide** toute tranche à l'affichage (borne hors `[1, max_semaine]` courant → badge **« tranche à revoir »**, §7.3), de sorte qu'aucune tranche périmée ne renvoie silencieusement du contenu décalé.

> ✅ *Décision d'arbitrage — à confirmer par le PO (§9) : bornes de tranche par `semaine` (int) + re-découpe consciente, plutôt qu'une table enfant à FK sur `document_id`.*

### 7.6 Server actions (`app/prof/scriptorium/actions.ts`)

Style existant : `verifierProf()`, `revalidatePath('/prof/scriptorium')`, retour `{ error? }` / `{ id? }` / `{ success? }`.

**Bibliothèque** (`scriptorium_contenus`) :
```ts
creerContenu(formData): Promise<{ id?; error? }>          // type (champ caché), titre, auteur?, texte,
                                                          // chapitres?, fichier (extraction/upload), legende?
modifierContenu(formData): Promise<{ success?; error? }>
supprimerContenu(id): Promise<{ success?; error? }>       // v2 — S7 : SOFT-DELETE seul (supprime_at=now()) ;
                                                          // NE PURGE PAS les créneaux (conservés « contenu retiré ») ;
                                                          // Storage conservé tant que restaurable (purge au vidage définitif)
restaurerContenu(id): Promise<{ success?; error? }>       // v2 — S7 : supprime_at=null → réactive partout
ajouterImageContenu(formData): Promise<{ error? }>
supprimerImageContenu(imageId): Promise<{ error? }>
```
> ⚠️ Remplacent les actuelles `ajouterContenu`/`modifierContenu`/`reassignerClasses`/`supprimerContenu`/`ajouterImage`/`supprimerImage` (qui opèrent sur `scriptorium_documents` + `scriptorium_document_classes`). Après migration, l'ancien jeu ne sert **plus que** pour les documents de livre (édités via `modifierLivreComplet`/`EditeurLivre`, voir re-découpe consciente §7.5).

**Parcours** (`scriptorium_parcours`) :
```ts
creerParcours(formData): Promise<{ id?; error? }>                       // titre, nb_semaines
modifierParcours(id, { titre; nb_semaines; description? }): Promise<{ error? }>  // nb_semaines↓ → confirm/purge des créneaux au-delà
supprimerParcours(id): Promise<{ error? }>                             // soft-delete + détache créneaux/classes
```

**Créneaux** (`scriptorium_parcours_creneaux`) :
```ts
type RefContenu = { contenuId: string } | { livreId: string; semaineDebut?: number; semaineFin?: number }
ajouterCreneau(parcoursId, semaine, ref: RefContenu): Promise<{ id?; error? }>
// v2 — schema-S9 : ordre calculé ATOMIQUEMENT dans la requête d'insert :
//   insert ... (ordre) values ((select coalesce(max(ordre),0)+1
//     from scriptorium_parcours_creneaux where parcours_id=$p and semaine=$s))
//   + RETRY sur violation de la contrainte unique (parcours_id, semaine, ordre).
// v2 — schema-S1 : vérifier en amont que livreId pointe un type='livre' (message propre ;
//   la FK composite reste le filet DB). CHECK arc exclusif garanti par le DDL.
retirerCreneau(creneauId): Promise<{ error? }>
reordonnerCreneaux(parcoursId, semaine, ordreIds: string[]): Promise<{ error? }>
// v2 — schema-S9 : réécrit ordre = 1..n en UNE transaction. Pour éviter une collision
//   transitoire avec la contrainte unique, réécrire via un décalage temporaire
//   (ex. ordre = ordre + 1000 puis ordre = rang final), ou ordre fractionnaire.
deplacerCreneau(creneauId, nouvelleSemaine): Promise<{ error? }>       // append (ordre atomique = max+1, même patron)
```

**Assignation** (`scriptorium_parcours_classes`) :
```ts
assignerParcoursClasse(parcoursId, classeId, dateDebut: string | null): Promise<{ error?; avis?; bloque?: boolean }>
// v2 — décision 8 / M2 / S5 : si dateDebut posée, résout la frise (AY dérivée de dateDebut).
//   - débordement hors année scolaire (non_planifiable) → { bloque: true, error/avis explicite } : REFUSE l'upsert.
//   - débordement sur semestre de l'AY à créer (a_definir) → upsert OK + { avis } (signale).
//   - frise vide / config incohérente (M1 / M4) → { bloque: true, avis } : REFUSE.
retirerParcoursClasse(parcoursId, classeId): Promise<{ error? }>
apercuDatesParcoursClasse(parcoursId, classeId): Promise<{
  data?: Array<{ semaine; dateReelle: string | null;
                 statut: 'definie' | 'a_definir' | 'non_planifiable';   // v2 — S5 : 3 statuts
                 semestreNom: string | null; pedaDansSemestre: number | null }>
  snap?: { dateSaisie; dateRamenee; enVacances } | null
  avis?: string; avisBloquant?: boolean   // v2 — M1/M4 : frise vide, config incohérente
  error? }>   // charge semestres vivants de l'AY(dateDebut) + holidays, construit la frise, applique mapperParcours()
              // (peut aussi être calculé directement dans le server component pour éviter un aller-retour)
```

### 7.7 Composants

**Réutiliser tels quels** : `ChampDate.tsx`, `RailConfig.tsx` (si on scinde le détail en `?section=`), `Tuile.tsx`, toute la sous-vue `vue-livre/*`, `extraireTexte()` + upload URL signée + `getUrlSignee()`, `EnteteEcran`.
**Adapter** : `FormulaireContenu.tsx` → `FormulaireContenuBiblio` ; `LigneContenu.tsx` → `LigneContenuBiblio` ; `EditeurLivre`/`modifierLivreComplet` → **re-découpe consciente des créneaux** (§7.5, S2).
**Créer** : `utils/frise-enseignement.ts` (avec `anneeScolaireDe`) ; `app/prof/scriptorium/parcours/GrilleParcours.tsx` ; `.../PickerContenu.tsx` ; `.../AssignationClasses.tsx` (bandeaux non_planifiable / config incohérente) ; `.../FormulaireParcours.tsx` ; `app/prof/scriptorium/BibliothequeContenus.tsx`.
**Touchés** : `app/prof/scriptorium/page.tsx` (5 onglets) ; `app/prof/scriptorium/actions.ts`.

---

## 8. Découpage en lots livrables

Chaque lot est testable indépendamment. Les lots de migration (7, 8) sont découplés de la construction (le schéma est additif) et peuvent être joués quand le pilote est prêt à perdre ses unités.

| Lot | Contenu | Dépend de | Test de recette |
|---|---|---|---|
| **L1 — Schéma Phase A** | `parcours_phase_a.sql` (§4.1) + RLS (§4.2). Additif, non-cassant. **Inclut (v2) : `unique(id,type)` sur `scriptorium_unites` + colonne générée `livre_type` + FK composite de garde de type (S1) ; `unique(parcours_id,semaine,ordre)` (S9).** | — | Tables créées, RLS prof-only OK ; **FK composite refuse un créneau-livre pointant une unité (S1)** ; **doublon d'ordre intra-semaine rejeté (S9)** ; aucune régression Scriptorium existant. |
| **L2 — Bibliothèques Textes/Cours** | Onglets `?vue=textes\|cours`, `FormulaireContenuBiblio`, `LigneContenuBiblio`, actions `creer/modifier/supprimer/restaurerContenu` + images. **Soft-delete NON purgeant + restauration (S7).** | L1 | Créer/éditer/supprimer un texte et un cours ; upload+extraction ; **soft-delete ⇒ créneaux conservés « contenu retiré », restaurables (S7)** ; compteur d'usages. |
| **L3 — Frise pure** | `utils/frise-enseignement.ts` (+ `anneeScolaireDe`) + tests unitaires reproduisant le déroulé chiffré (§5.2) et les bords (a)–(e). | — (pur) | Tests verts : ancre idx 3, débordement S2, saut relâche+gap, off-by-one. **(v2) Bords : AY dérivée de `date_debut` / frontière août (M1) ; frise vide ⇒ avis explicite (M1) ; `end_date` non dominicale ⇒ troncature+avis (M3) ; chevauchement semestres ⇒ `avisBloquant` (M4) ; débordement hors AY ⇒ `non_planifiable` (S5).** |
| **L4 — Builder Parcours** | Liste + détail, `GrilleParcours`, `PickerContenu` (Textes/Cours/Livres + tranche), actions parcours + créneaux (**ordre atomique + retry, S9**). Badges dégradés « contenu/livre retiré / tranche à revoir » (S7/Mig4/S2). | L1, L2 | Construire un parcours 16 sem ; ajouter 1 cours + 2 textes en sem. 1 ; réordonner ; ajouter livre entier + tranche ; réutiliser un contenu ; **deux ajouts concurrents ⇒ ordres distincts (S9)** ; **badge « contenu/livre retiré » (S7/Mig4)**. |
| **L5 — Assignation + aperçu frise** | `AssignationClasses`, `assigner/retirerParcoursClasse`, `apercuDatesParcoursClasse`. **Bandeaux : `non_planifiable` bloquant (décision 8/S5), config incohérente bloquant (M4), frise vide (M1).** | L3, L4 | Assigner 2 classes à 2 dates ; snap vacances, dates S1, résolution S2 **car S2 existe** ; **débordement hors AY ⇒ blocage + message « raccourcir » (S5)** ; **débordement sur semestre à créer ⇒ « à définir » signalé (a)** ; **chevauchement semestres ⇒ assignation refusée (M4)**. |
| **L6 — Onglet Livres référençable + re-découpe consciente** | `?vue=livres` (réutilise vue-livre), compteur « utilisé dans N parcours ». **`modifierLivreComplet` détecte les créneaux référents, reconfirme + clamp/journalise (S2) ; validation des tranches à la lecture.** | L4 | Vue-livre intacte ; picker livre/tranche OK depuis L4 ; **re-découpe d'un livre tranché ⇒ reconfirmation + tranche « à revoir » si hors étendue (S2)**. |
| **L7 — Migration Phase A (soft)** | Introspection + dry-run + **soft-delete/dépublication scopés (table `_migration_phase_a_flip`, Mig5)** (§6.4, étapes 1–3), en prod. | — (indépendant) | Unités **invisibles prof** (pickers filtrent `supprime_at`, Mig3) **et élève**, aucune donnée perdue, **réversion scopée** ne ressuscite que les ids flippés (Mig5) ; livres/Aletheia intacts. |
| **L8 — Migration Phase B (purge dure)** | **Backup incluant `aletheia_*` / snapshot PITR (Mig2)** + transaction explicite scopée avec **garde-fou non tautologique (Mig1)** (§6.4, étape 4), fenêtre de maintenance. | L7 observé | **Backup vérifié contenir les `aletheia_*` (Mig2)** ; garde-fou anti-dérive = 0 (Mig1) ; comptages post-purge : livres/Aletheia/vocab-livre inchangés. |

Ordre recommandé : **L1 → L3** (parallélisables) → **L2 → L4 → L5 → L6**, puis **L7** (dès que possible, réversible) et **L8** (quand le pilote accepte la perte).

---

## 9. Risques & points ouverts

1. **Collision de nom « parcours »** — Fragments utilise déjà « Ton parcours » (progression élève) et la colonne `fragments_analyses.retour_parcours`. **Tranché : on garde « Parcours » pour le conteneur Scriptorium** (terme verrouillé par le PO, sémantiques disjointes prof/élève, aucun conflit technique — namespace `scriptorium_parcours*` vs `fragments_*`, aucune co-occurrence dans ce chantier 100 % prof). **(v2 — A1) DÉCIDÉ (acté PO, plus « optionnel »)** : renommer le libellé UI Fragments « Ton parcours » → « **Ta progression** » (colonne DB `fragments_analyses.retour_parcours` **inchangée**). Petit chantier UI, **hors chemin critique**, planifiable à part.
2. **Découplage mono-semestre** — la frise lit **tous** les semestres vivants de l'AY (jamais `is_active`), donc la donnée est correcte dès maintenant. **Mais** les vues calendrier prof/élève (`page.tsx:45` / `:56`) restent mono-semestre : un parcours à cheval y perdrait sa moitié S1 à la bascule. **Le fix des vues est hors-scope** (§3.2) ; risque assumé tant qu'aucune consommation calendrier des parcours n'est branchée.
3. **Unification de la dette d'assignation classe** — le principe (exposition dérivée de `parcours_classes` pour Textes/Cours) est posé et le schéma est prêt, mais **`document_classes`/`unite_classes` cohabitent encore** : le retrait effectif appartient au recâblage Quazian/Codex (hors-scope). **(v2 — S3)** Pour l'**entité livre**, il n'y a **pas** d'unification à opérer : l'exposition Aletheia reste **mono-source** (`unite_classes`) et un créneau-livre n'ajoute **aucun** accès (décision 9, §4.3) — pas de « troisième source ». Risque résiduel : deux chemins d'exposition (Textes/Cours) tant que la dérivée n'est pas branchée — accepté.
4. **Perte de travail élève à la migration** (FSRS + Codex) — **impact accepté, pas nul**. À faire valider explicitement par le PO avant Phase B ; Phase A (réversible, scopée — Mig5) sert de filet ; **backup incluant `aletheia_*` / PITR** (Mig2) obligatoire.
5. **`ON DELETE` inconnus** (schéma de base hors git) — mitigé par l'introspection (étape 1) + suppressions explicites ordonnées + **garde-fou non tautologique** (Mig1) ; ne jamais s'appuyer sur une cascade implicite.
6. **`date_debut` nullable** (tranché en faveur de l'UX toggle « assigné sans date ») vs la recommandation initiale `NOT NULL`. Conséquence : une assignation sans date n'a pas d'aperçu résolu. Réversible si le besoin change.
7. **`ref_type` redondant avec le CHECK d'arc** — conservé pour la lisibilité ; risque mineur d'incohérence `ref_type` vs nulls, borné par le CHECK et, côté livre, par la **FK composite de type** (S1).
8. **Réutilisation de `scriptorium_contenu_images`** (arc exclusif `document_id`/`contenu_id`) — prérequis : nettoyer toute ligne incohérente avant la contrainte, et vérifier que la RLS existante couvre le chemin `contenu_id`.
9. **Tranches de livre non contiguës** — non couvertes (bornes contiguës seulement). Table enfant `parcours_creneau_livre_semaines` à n'introduire que si le besoin se matérialise. **(v2 — S2)** L'intégrité des tranches contiguës face à la re-découpe destructive est traitée par la re-découpe consciente + validation à la lecture (§7.5), **pas** par une FK (uuid volatils).
10. **Tradeoff « ne rien matérialiser »** — éditer les vacances de S1 *après* assignation **décale** les dates aval (source de vérité unique = frise recalculée à la lecture). Comportement voulu **pour la fondation prof-only**, à signaler dans l'UI. **(v2 — S4)** Devient un **risque de fond** dès la consommation élève (échéances qui bougent sous les pieds des élèves, sans audit) → traité par le **snapshot d'horaire optionnel** documenté §4.5, à activer au chantier « consommation élève ».
11. **(v2 — S6) Trois numérotations de semaine coexistent** — `indexContinu` (interne, jamais exposé), `pedagogical_number` (affichage, reset par semestre), `fragments_semaines.pedagogical_number` (matérialisé Fragments). Point de vigilance : pour une même semaine calendaire, Parcours, Fragments et Calendrier peuvent afficher des numéros différents. Règle : l'UI Parcours n'expose que `S{n} · sem. {péda}` ; idéalement dériver `fragments_semaines` de la même primitive que la frise (chantier ultérieur).
12. **(v2 — décision 8 / S5) Débordement hors année scolaire = NON PLANIFIABLE** — un parcours long démarré tard peut franchir la frontière août : les semaines au-delà de l'AY ne sont **jamais** résolubles. Traité par un **blocage explicite à l'assignation** (message « raccourcir le parcours ») et une **distinction UI** stricte « à définir (résoluble) » vs « non planifiable (bloquant) ». Ne plus jamais présenter un débordement hors-AY comme transitoire.

### ✅ Décisions à confirmer par le PO

Les arbitrages de conception suivants ont été **tranchés dans ce SPEC** (valeurs par défaut retenues) mais doivent être **confirmés** avant implémentation :

1. **Exposition livre mono-source (schema-S3, §4.3, décision 9).** Référencer un livre dans un créneau de parcours **ne donne aucun accès Aletheia** ; l'exposition Aletheia reste **mono-source** via `scriptorium_unite_classes`. Un créneau-livre ne fait qu'**ordonnancer** le livre. → *Confirmer que le parcours ne doit jamais, à terme, devenir une source d'accès de lecture Aletheia.*
2. **Stratégie tranche / re-découpe (schema-S2, §4.1, §7.5).** Bornes de tranche par `semaine` (int, **pas** de FK sur `document_id` car uuid volatils au delete+reinsert), + `modifierLivreComplet` **consciente** (détection/reconfirmation/clamp/journalisation) + **validation à la lecture** (badge « tranche à revoir »). → *Confirmer qu'on préfère cette approche à une table enfant `parcours_creneau_livre_semaines` référant les documents par id.*
3. **Snapshot d'horaire différé (schema-S4, §4.5).** La fondation **recalcule** l'aperçu depuis la frise (prof-only, acceptable) ; le **snapshot d'horaire** (gel `semaine→date` versionné, régénération explicite + diff) est **documenté mais non implémenté**, prévu pour le chantier « consommation élève ». → *Confirmer qu'aucune matérialisation n'est requise dans cette fondation.*
4. **Blocage config semestres chevauchants (maths-M4, §5.3(d), §7.4).** Le chevauchement de deux semestres devient une **erreur bloquante côté config** (sauvegarde refusée) ; à défaut, l'aperçu §7.4 le remonte en **bandeau bloquant**. → *Confirmer qu'on peut refuser la sauvegarde de semestres qui se recouvrent (impact sur l'écran de config des semestres).*
