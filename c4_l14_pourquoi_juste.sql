-- ============================================================================
-- C4 · L14 — `exercices_cas.pourquoi_juste` : LE CHAMP QUI REND LA CORRECTION
--            POSSIBLE.
-- ----------------------------------------------------------------------------
-- CE QUE CE FICHIER FAIT, ET RIEN D'AUTRE : une colonne `text` NULLABLE de plus
-- sur `exercices_cas`. **Additive**, sans `default` — donc sans réécriture de
-- table ni verrou long —, sans contrainte, sans policy touchée, RLS inchangée.
--
-- POURQUOI ELLE EXISTE.
--   Le `08-FORMAT_IMPORT.md` est passé au **format 1.2** le 23/08 : il déclare
--   `pourquoi_juste`. La raison est au `08-` §5.2, et elle tient en une ligne :
--   « là où la réponse attendue est un CANDIDAT, elle a besoin d'un pourquoi ;
--   ailleurs, elle EST le pourquoi ». Aux crans **1** (`diagnostic_guide`) et
--   **3** (`transformation_guidee`), « l'écran sert QUATRE candidats : trois
--   distracteurs tirés de la banque, plus la `reponse_attendue` » (`02-` §5) :
--   elle s'affiche donc **nue, dans la forme des distracteurs**, et rien en elle
--   ne peut dire pourquoi elle est juste. Or le `02-` §2.3.1 a exige que « la
--   correction du premier cas soit servie avant le second », et à ces deux crans
--   le jugement est **algorithmique** — ni extraction, ni squelette, donc **rien
--   que le modèle chaud puisse reformuler** (`06-` §2, temps 4).
--   **Sans `pourquoi_juste`, la correction n'a aucune source.**
--
-- SA FORME EST CELLE DE `reponse_attendue`, ET C'EST VOULU. « La forme physique
--   en base t'appartient » (`07-` §1.1) : `text` NULLABLE, **sans CHECK**. Les
--   conditions de cran — présent aux crans 1 et 3, `null` aux sept autres — sont
--   portées par le CONTRÔLE (refus n° 12 à l'import, son jumeau à l'écran de
--   conception), jamais par la base : un `CHECK` ne peut pas lire le cran de
--   l'instance, qui vit sur `exercices`, ni la nature de son type. C'est
--   exactement le partage que `reponse_attendue` et `distracteurs` tiennent déjà
--   sur cette table depuis C4-L8.
--
-- ⚠️ SON ABSENCE A UN SENS DÉFINI, ET CE SENS N'EST PAS UNE ERREUR : « la
--   correction servie ne dira que la réponse, pas pourquoi elle est la bonne »
--   (`08-` §5.2). C'est un **signalement**, jamais un refus — « une mineure
--   n'ajoute que des champs FACULTATIFS ; casser la compatibilité, c'est
--   incrémenter le majeur » (`08-` §1). Les instances déjà en base, importées
--   sous la 1.0 ou conçues à l'écran, restent donc valides et servies : elles
--   naissent `NULL` ici, et l'écran de correction se tait sur le pourquoi sans
--   rien inventer.
--
-- PROTOCOLE : **normal**, pas renforcé (`SUIVI_SQL.md`, règle 5). La migration
--   est **additive et gatée** — colonne neuve sur une table de C4, dont les
--   **six interrupteurs restent à OFF** jusqu'à la recette. Aucun flux existant
--   (Aletheia, Fragments, Quazian, Codex, auth) n'est touché.
-- ⚠️ RÈGLE 6 — RÉPÉTITION À BLANC : copier le CORPS de ce fichier (entre son
--   `begin;` et son `commit;`) dans sa propre transaction d'essai, **jamais le
--   fichier entier** : son `commit;` validerait la transaction englobante.
--
-- Rollback : `c4_l14_pourquoi_juste_rollback.sql`.
-- ⛔ Le rollback DÉTRUIT le contenu de la colonne — lire son en-tête avant.
-- ============================================================================

begin;

-- ── LE CONSTAT AVANT ────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_cas'
      and column_name = 'pourquoi_juste')                    as colonne_avant_attendu_0,
  (select count(*) from public.exercices_cas)                as cas_en_base,
  -- Les cas qui la RÉCLAMENT : ceux dont le cran de l'instance sert des
  -- candidats. Le cran vit sur `exercices`, en NUMÉRO depuis C4-L11.
  (select count(*) from public.exercices_cas c
     join public.exercices e on e.id = c.exercice_id
    where e.cran in (1, 3))                                  as cas_aux_crans_a_candidats;

-- ── LA COLONNE ──────────────────────────────────────────────────────────────
alter table public.exercices_cas
  add column if not exists pourquoi_juste text;

comment on column public.exercices_cas.pourquoi_juste is
  'POURQUOI CE CANDIDAT-LÀ EST LE BON — servi à l''élève à la correction (08- §5.2, format 1.2 ; '
  'C4-L14). Attendu aux crans 1 et 3, où la reponse_attendue s''affiche NUE parmi quatre candidats '
  'et ne peut rien dire d''elle-même ; NULL aux sept autres, où « la reponse_attendue EST le '
  'pourquoi ». Les conditions de cran vivent au CONTRÔLE (refus n° 12), jamais dans un CHECK : la '
  'base ne sait pas lire le cran, qui est sur exercices. Son ABSENCE aux crans 1 et 3 est un '
  'SIGNALEMENT, jamais un refus — un fichier de la 1.1 s''importe toujours (08- §1 et §7.3).';

-- ── LE CONSTAT APRÈS ────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_cas'
      and column_name = 'pourquoi_juste')                    as colonne_apres_attendu_1,
  (select is_nullable from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_cas'
      and column_name = 'pourquoi_juste')                    as nullable_attendu_YES,
  (select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_cas'
      and column_name = 'pourquoi_juste')                    as type_attendu_text,
  (select column_default from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_cas'
      and column_name = 'pourquoi_juste')                    as defaut_attendu_null,
  -- Rien d'autre n'a bougé sur la table : ni contrainte de plus, ni policy.
  (select count(*) from pg_constraint
    where conrelid = 'public.exercices_cas'::regclass)       as contraintes_de_la_table,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'exercices_cas')  as policies_de_la_table,
  -- ⚠️ LES SIX INTERRUPTEURS N'ONT PAS BOUGÉ — ce lot ne les allume pas.
  (select not (exercices_actif or routeur_actif or competences_affichage_actif
               or fabrique_actif or chaine_actif or passation_classe_actif)
     from public.scriptorium_params where id = 1)            as les_six_toujours_a_off;

commit;
