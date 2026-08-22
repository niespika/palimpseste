-- ============================================================================
-- C4 · L5 — LA CHAÎNE DE MESURE : son interrupteur, ses gardes, ses formes.
-- ----------------------------------------------------------------------------
-- « Ce lot ne crée aucune table du §1 — C4-L1 les a posées. Ce que le §1 NOMME
--   et que la base ne porte pas s'ajoute en MIGRATION ADDITIVE ; la FORME
--   PHYSIQUE T'APPARTIENT (§1). Une donnée que rien ne nomme se signale, elle ne
--   s'invente pas. »                                   — PROMPT_Code_C4_L5, piège 5
--
-- Manifeste du lot : `07-Implementation.md` §1, §4 et §6 (VERSION 2.8, VALIDÉ ET
-- GELÉ) · `01-routeur.md` §11 et §12 (5.3) · `03-competences.md` §1 et §7 (2.1) ·
-- `competences/*.md` · `04-Instances_Exercices.md` (3.1) · ce journal ·
-- `c1_rls_eleve.sql` comme patron RLS.
--
-- ADDITIVE ET GATÉE → PROTOCOLE NORMAL (SUIVI_SQL règle 5) : les quatre objets
-- touchés sont des tables NEUVES de C4-L1, TOUTES VIDES au 21/08 (vérifié par
-- requête : `exercices_jobs` 0, `competences_mesures` 0, `exercices_retours` 0,
-- `monitoring_mesures` 0), plus une colonne de plus sur `scriptorium_params`,
-- au même emplacement que les cinq interrupteurs existants — patron déjà suivi
-- par `c2_l9_prompt_tuteur.sql` et `c4_l8_doctrine.sql`.
--
-- CE QUE CE FICHIER FAIT, EN CINQ POINTS :
--   1. `scriptorium_params.chaine_actif` — L'INTERRUPTEUR PROPRE DU LOT, À OFF.
--      « Son propre interrupteur naît à OFF, au même emplacement que les
--        existants » (piège 49). La COUPURE AUTOMATIQUE de facture bascule
--        celui-ci, et JAMAIS l'un des trois du `07-` §1.5.
--   2. `exercices_jobs.bail_expire_at` — LE BAIL. Le « fait quand » demande de
--      PROVOQUER une expiration : sans bail, il n'y a rien à faire expirer.
--      + le vocabulaire fermé de `statut`.
--   3. `monitoring_mesures.source` — LA LISTE FERMÉE, RECALÉE SUR LA SOURCE.
--      La base porte `spontane` / `sollicite` ; la fiche du Monitoring, qui FAIT
--      FOI sur les champs du Monitoring (`07-` §1.4), écrit `spontanee` /
--      `sollicitee` — §5, §6 et son bloc machine (`sources: [spontanee,
--      sollicitee]`). La table est VIDE : le recalage ne convertit rien.
--   4. `competences_mesures` — L'INDEX UNIQUE PARTIEL `(depot_id, competence)`.
--      C'est la garde MÉCANIQUE du mode de panne visé : « une reprise après
--      expiration écrit une SECONDE MESURE pour la même copie, et la règle de
--      montée fait bouger une lettre sans que l'élève ait rien fait » (§1.1).
--      Partiel : les mesures sans dépôt — les devoirs ingérés — n'y entrent pas.
--   5. `exercices_retours.texte` — LE TEXTE SEGMENTÉ, EN jsonb, ET SA GARDE.
--      « Le `texte` se rend SEGMENTÉ, et c'est un contrat sur celui qui
--        l'engendre (§2, C4-L5) : une liste de points, chacun avec son
--        IDENTIFIANT STABLE, son ANCRAGE et son TEXTE — jamais un bloc que
--        l'écran devrait découper » (§1.2). Le §1 laisse la forme physique à la
--      session ; un `text` qui porterait du JSON ne se vérifierait pas PAR
--      REQUÊTE, et la recette de ce lot l'exige.
--
-- CE QU'IL NE FAIT PAS : il ne crée aucune table, ne touche à aucun flux
-- existant, n'ajoute AUCUNE POLICY ÉLÈVE (les squelettes et la métacognition ne
-- sont jamais lisibles par l'élève avant la publication de son retour — §1 ;
-- C4-L1 a choisi « aucune policy élève » sur les vingt tables, et ce lot ne
-- rouvre rien), et ne touche PAS aux trois interrupteurs du `07-` §1.5.
--
-- Retour arrière : `c4_l5_chaine_rollback.sql`.
-- ============================================================================

begin;

-- ── 1. L'interrupteur propre du lot, à OFF ─────────────────────────────────
alter table public.scriptorium_params
  add column if not exists chaine_actif boolean not null default false;

comment on column public.scriptorium_params.chaine_actif is
  'C4-L5 — l''interrupteur PROPRE de la chaîne de mesure. À OFF jusqu''à la recette. '
  'La coupure automatique de facture bascule CELUI-CI (plafond mensuel, alerte 70 %), '
  'jamais exercices_actif / routeur_actif / competences_affichage_actif, qui commandent '
  'les élèves, le routeur et l''affichage et restent au professeur (07- §1.5 ; §2, C4-L5).';

-- ── 2. Le bail de la file, et le vocabulaire de son statut ─────────────────
alter table public.exercices_jobs
  add column if not exists bail_expire_at timestamptz;

comment on column public.exercices_jobs.bail_expire_at is
  'C4-L5 — le BAIL d''un job réclamé. Passé cet instant, le job est réputé abandonné et '
  'se reprend : c''est l''EXPIRATION que le « fait quand » demande de provoquer (07- §1.1). '
  'La reprise ne peut pas doubler la mesure — index unique (depot_id, competence) ci-dessous.';

create index if not exists idx_jobs_reclamables
  on public.exercices_jobs (statut, bail_expire_at)
  where not echec_definitif;

do $$
begin
  -- ⚠️ `conrelid` : chercher une contrainte PAR NOM SEUL fait sauter l'ADD en
  --    silence dès qu'une homonyme existe sur une autre table — et les drapeaux
  --    disent quand même « t ». Le nom d'une contrainte n'est unique QUE par table.
  if not exists (select 1 from pg_constraint where conname = 'exercices_jobs_statut_chk'
                   and conrelid = 'public.exercices_jobs'::regclass) then
    alter table public.exercices_jobs
      add constraint exercices_jobs_statut_chk
      check (statut in ('en_attente', 'en_cours', 'abouti', 'echoue'));
  end if;
end $$;

-- ── 3. `monitoring_mesures.source` — recalée sur la fiche, qui fait foi ────
do $$
declare n bigint;
begin
  select count(*) into n from public.monitoring_mesures;
  if n > 0 then
    raise exception 'monitoring_mesures porte % ligne(s) : le recalage de la liste fermée '
      'demanderait une conversion, qui n''est pas écrite ici.', n;
  end if;
end $$;

alter table public.monitoring_mesures drop constraint if exists monitoring_mesures_source_check;
alter table public.monitoring_mesures
  add constraint monitoring_mesures_source_check
  check (source in ('spontanee', 'sollicitee'));

comment on column public.monitoring_mesures.source is
  'competences/monitoring.md §5 — « toute mesure de Monitoring porte sa `source` — `spontanee` '
  'ou `sollicitee` — et une série ne mélange JAMAIS les deux ». La fiche fait foi sur les champs '
  'du Monitoring (07- §1.4) ; son bloc machine déclare `sources: [spontanee, sollicitee]`. '
  'C4-L1 avait posé `spontane` / `sollicite` — hors de son manifeste, donc sans la fiche.';

-- ── 4. Une mesure par dépôt et par compétence — la garde d'idempotence ─────
create unique index if not exists uk_mesures_depot_competence
  on public.competences_mesures (depot_id, competence)
  where depot_id is not null;

comment on index public.uk_mesures_depot_competence is
  'C4-L5 — « une reprise après expiration ne crée JAMAIS une seconde mesure » (07- §2, le fait '
  'quand). PARTIEL : une mesure sans dépôt d''origine — un devoir ingéré — n''y entre pas. '
  'La version finale n''écrit jamais de mesure (01- §11), et la paire de diagnostic est UNE '
  'mesure dont les deux résultats s''attachent (07- §1.2) : rien de légitime ne se heurte à cet index.';

-- ── 5. Le retour segmenté, et sa garde de forme ────────────────────────────
create or replace function public.retour_segmente_bien_forme(p jsonb)
returns boolean language sql immutable as $$
  select p is null
      or (jsonb_typeof(p) = 'array'
          and jsonb_array_length(p) >= 1
          -- Chaque point porte son identifiant stable, son ancrage et son texte.
          and not exists (
            select 1 from jsonb_array_elements(p) e
            where jsonb_typeof(e) <> 'object'
               or coalesce(e->>'id', '') = ''
               or coalesce(e->>'texte', '') = ''
               or jsonb_typeof(e->'ancrage') <> 'object'
               or coalesce(e#>>'{ancrage,citation}', '') = ''
               or coalesce(e#>>'{ancrage,source}', '') not in ('copie', 'texte_support'))
          -- Les identifiants sont uniques : sans quoi la contestation ne sait pas
          -- ce qu'elle désigne, et le drapeau des contestations répétées ne compte rien.
          and (select count(distinct e->>'id') from jsonb_array_elements(p) e)
              = jsonb_array_length(p));
$$;

comment on function public.retour_segmente_bien_forme(jsonb) is
  '07- §1.2 — « le `texte` se rend SEGMENTÉ, et c''est un contrat sur celui qui l''engendre '
  '(§2, C4-L5) : une liste de points, chacun avec son identifiant stable, son ancrage et son '
  'texte — jamais un bloc que l''écran devrait découper ». RR3 : « les citations portent leur '
  'source » — la copie d''un côté, le texte support de l''autre (01- §12).';

do $$
declare n bigint;
begin
  select count(*) into n from public.exercices_retours;
  if n > 0 then
    raise exception 'exercices_retours porte % ligne(s) : le passage en jsonb demanderait une '
      'conversion du texte existant, qui n''est pas écrite ici.', n;
  end if;
end $$;

alter table public.exercices_retours
  alter column texte type jsonb using nullif(texte, '')::jsonb,
  alter column texte_edite_par_prof type jsonb using nullif(texte_edite_par_prof, '')::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'retours_texte_segmente_chk'
                   and conrelid = 'public.exercices_retours'::regclass) then
    alter table public.exercices_retours
      add constraint retours_texte_segmente_chk
      check (public.retour_segmente_bien_forme(texte)
         and public.retour_segmente_bien_forme(texte_edite_par_prof));
  end if;
end $$;

comment on column public.exercices_retours.texte is
  '07- §1.2 — LA LISTE DES POINTS, en jsonb : [{ id, ancrage:{source,citation}, texte, '
  'competence, nature }]. `points_ids` en est l''index, et rien de plus. Le professeur édite '
  'la MÊME forme (texte_edite_par_prof), et son édition ne vaut que pour les passations en '
  'classe — la garde `garde_retour_maison_non_edite` le tient déjà.';

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. NEUF drapeaux, tous attendus à `t`.
-- ============================================================================
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'scriptorium_params'
      and column_name = 'chaine_actif') = 1                                as interrupteur_pose,
  (select chaine_actif from public.scriptorium_params limit 1) = false     as interrupteur_a_off,
  (select exercices_actif or routeur_actif or competences_affichage_actif
     from public.scriptorium_params limit 1) = false                       as les_trois_toujours_a_off,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_jobs'
      and column_name = 'bail_expire_at') = 1                              as bail_pose,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'monitoring_mesures_source_check')
    like '%spontanee%sollicitee%'                                          as source_recalee,
  (select count(*) from pg_indexes
    where schemaname = 'public' and indexname = 'uk_mesures_depot_competence') = 1
                                                                           as index_idempotence_pose,
  (select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_retours'
      and column_name = 'texte') = 'jsonb'                                 as retour_en_jsonb,
  -- Les deux gardes elles-mêmes : sept drapeaux à `t` ne prouvaient pas qu'elles
  -- étaient posées, et un retour EN BLOC redevenait insérable sans qu'on le voie.
  exists (select 1 from pg_constraint where conname = 'retours_texte_segmente_chk'
            and conrelid = 'public.exercices_retours'::regclass)           as garde_forme_posee,
  exists (select 1 from pg_constraint where conname = 'exercices_jobs_statut_chk'
            and conrelid = 'public.exercices_jobs'::regclass)              as garde_statut_posee;
