-- ============================================================================
-- C4 · L9 — RETOUR ARRIÈRE de `c4_l9_examens_diagnostiques.sql`.
-- ----------------------------------------------------------------------------
-- ⚠️ À LIRE D'ABORD — le bloc de CONSTAT ci-dessous compte ce qui va partir.
--    Joue-le seul, lis-le, et ne descends qu'ensuite.
--
-- ⚠️ CE QUE CE FICHIER DÉTRUIT, ET CE QUI SE RECONSTRUIT :
--    · Les DEUX CODES redeviennent `diagnostic_essai` et
--      `diagnostic_explication_texte`. ⚠️ Le code de C4-L9 lit les codes NEUFS
--      (`utils/examens/types.ts`) : après ce retour arrière, la conception des
--      examens diagnostiques ne trouve plus ses deux types et REFUSE — elle le
--      dit, elle n'écrit rien de faux.
--    · `genres_admis`, `mode_saisie` et `libelle` des deux lignes repartent à
--      NULL, et `exclusions_parcours` à `'{}'` (sa valeur de seed). Rien n'est
--      perdu qui ne se réécrive : ces quatre valeurs sont dans la migration.
--    · `uk_exercices_planifie` disparaît — deux instances peuvent alors
--      revendiquer la même ligne de plan, en silence. `idx_exercices_planifie`
--      (C4-L1, non unique) reste : les lectures continuent de marcher.
--    · Le trigger `trg_exercices_cran_selon_le_type` et sa fonction partent, et
--      `exercices_cran_chk` REVIENT DANS SON ÉTAT DU 18/08.
--      ⚠️⚠️ ET C'EST LÀ QUE CE ROLLBACK PEUT ÉCHOUER, LÉGITIMEMENT : si une
--         instance d'examen diagnostique a déjà été conçue (`statut <>
--         'a_concevoir'` et `cran` nul), la re-pose du CHECK la refuse et
--         l'`alter table` s'arrête. LE CONSTAT CI-DESSOUS LES COMPTE. Il faut
--         alors décider ce qu'on en fait — les retirer, ou renoncer au retour
--         arrière —, et cette décision n'appartient pas à un fichier.
--
-- ⚠️ CE QU'IL NE FAIT PAS :
--    · Il ne touche NI `scriptorium_exercices_planifies` NI ses statuts : la
--      migration n'y a rien écrit. ⚠️ Mais les lignes de plan qu'une conception
--      aura fait passer `concu` LE RESTENT — leur instance, elle, n'est pas
--      détruite ici. Les deux restent cohérentes entre elles.
--    · Il ne ferme RIEN. Si le but est d'ARRÊTER la conception des examens
--      diagnostiques, `fabrique_actif = false` suffit, et ce fichier n'a pas à
--      être joué.
--    · Il ne défait PAS `c4_l1_seed.sql` : les deux lignes de type restent, avec
--      leur `nature`, leurs `competences` et leurs `supports_source`.
-- ============================================================================

-- ── CONSTAT — à jouer SEUL, avant tout, et à lire ───────────────────────────
select
  (select count(*) from public.exercices_types
    where code in ('examen_diagnostique_essai', 'examen_diagnostique_explication_texte'))
                                                       as types_a_renommer,
  (select count(*) from public.exercices
    where exercice_planifie_id is not null)            as instances_liees_a_un_plan,
  -- ⚠️ CELLES-CI FONT ÉCHOUER LA RE-POSE DU CHECK. Si le compte n'est pas nul,
  --    lis la ligne, décide, et ne descends pas à l'aveugle.
  (select count(*) from public.exercices
    where statut <> 'a_concevoir' and cran is null)    as instances_conçues_sans_cran,
  (select count(*) from public.scriptorium_exercices_planifies p
    where p.statut = 'concu'
      and exists (select 1 from public.exercices e where e.exercice_planifie_id = p.id))
                                                       as lignes_de_plan_conçues_par_une_instance;

begin;

-- Le mur d'abord : le trigger part, le CHECK d'origine revient.
drop trigger if exists trg_exercices_cran_selon_le_type on public.exercices;
drop function if exists public.garde_cran_selon_le_type();

-- ⚠️ Échoue si une instance conçue sans cran existe encore (voir le constat).
alter table public.exercices
  add constraint exercices_cran_chk check (statut = 'a_concevoir' or cran is not null);

-- L'unicité s'en va ; l'index non unique de C4-L1 reste et sert les lectures.
drop index if exists public.uk_exercices_planifie;

-- Les quatre valeurs posées sur les deux lignes retournent à l'état du seed.
update public.exercices_types
   set genres_admis        = null,
       exclusions_parcours = '{}',
       mode_saisie         = null,
       libelle             = null,
       updated_at          = now()
 where code in ('examen_diagnostique_essai', 'examen_diagnostique_explication_texte');

-- Le renommage, en sens inverse.
update public.exercices_types
   set code = 'diagnostic_essai', updated_at = now()
 where code = 'examen_diagnostique_essai';
update public.exercices_types
   set code = 'diagnostic_explication_texte', updated_at = now()
 where code = 'examen_diagnostique_explication_texte';

-- Le commentaire de colonne repart à celui que C4-L1 n'avait pas posé.
comment on column public.exercices_types.genres_admis is null;

commit;

-- ============================================================================
-- VÉRIFICATION DU RETOUR ARRIÈRE — six drapeaux, tous attendus à `t`.
-- ⚠️ Vérifiée PAR REQUÊTE, jamais sur la foi du mot « COMMIT » affiché.
-- ============================================================================
select
  (select count(*) = 2 from public.exercices_types
    where code in ('diagnostic_essai', 'diagnostic_explication_texte'))
                                                       as anciens_codes_revenus,
  not exists (select 1 from public.exercices_types
               where code in ('examen_diagnostique_essai',
                              'examen_diagnostique_explication_texte'))
                                                       as codes_neufs_partis,
  (select count(*) = 2 from public.exercices_types
    where nature = 'complet' and genres_admis is null and mode_saisie is null
      and libelle is null and exclusions_parcours = '{}')
                                                       as valeurs_revenues_au_seed,
  not exists (select 1 from pg_indexes
               where schemaname = 'public' and indexname = 'uk_exercices_planifie')
                                                       as unicite_retiree,
  exists (select 1 from pg_constraint where conname = 'exercices_cran_chk'
            and conrelid = 'public.exercices'::regclass)
  and not exists (select 1 from pg_trigger
                   where tgname = 'trg_exercices_cran_selon_le_type'
                     and tgrelid = 'public.exercices'::regclass and not tgisinternal)
                                                       as mur_d_origine_revenu,
  not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public' and p.proname = 'garde_cran_selon_le_type')
                                                       as fonction_retiree;
