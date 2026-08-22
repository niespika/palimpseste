-- ============================================================================
-- C4 · L5 — COMPLÉMENT : ROLLBACK. N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ----------------------------------------------------------------------------
-- ⚠️ CE FICHIER A ÉTÉ ÉCRIT LE 21/08, APRÈS COUP. Sa ligne existait au
--    `SUIVI_SQL.md` depuis le 21/08 et `c4_l5_chaine_complement.sql` s'en
--    réclamait en en-tête — mais LE FICHIER N'ÉTAIT PAS SUR LE DISQUE. Manque
--    trouvé en fabriquant `PROMPT_Code_C4_L4.md`, dont l'écran de correction
--    dépend précisément de la garde que ce complément desserre. Son contenu est
--    dérivé de la description de sa ligne au journal et du corps du complément ;
--    il n'invente rien.
--
-- CE QU'IL DÉFAIT, DANS L'ORDRE INVERSE DU COMPLÉMENT :
--   1. il RE-RESSERRE l'édition du professeur — `texte_edite_par_prof` redevient
--      soumis à la forme EXACTE du texte engendré, chaque point ancré sur un
--      verbatim de la copie ou du texte support. ⚠️ C'est un RETOUR EN ARRIÈRE
--      SUR UNE RÈGLE DE SOURCE : `02-exercices.md` §6.D, étape 14, dit « il peut
--      modifier le retour », sans condition. Après ce rollback, un professeur
--      qui écrit « attention à ta conclusion » verra son écran échouer sur une
--      `23514`. Ne le jouer que si le complément lui-même pose problème ;
--   2. il retire l'index unique du Monitoring — les doublons de
--      `monitoring_mesures` redeviennent possibles à la reprise après expiration ;
--   3. il retire `chaine_depense_du_mois(timestamptz)` — la somme repasse par la
--      PAGINATION côté code : correcte, mais plus lente, et c'est au code de la
--      pagination d'exister.
--
-- CE QU'IL NE TOUCHE PAS : `exercices_jobs_statut_chk` (point 4 du complément)
-- n'était qu'une RÉ-ASSERTION d'une garde posée par `c4_l5_chaine.sql` — la
-- retirer défairait C4-L5 lui-même, pas son complément.
--
-- ⚠️ IL RECRÉE LUI-MÊME la version à UN paramètre de
--    `retour_segmente_bien_forme` au lieu de la supposer présente : elle a pu
--    être retirée depuis (`c4_gardes_correctif.sql`, qui l'écarte comme second
--    domicile d'une même règle). Un rollback qui suppose son terrain n'en est
--    pas un.
--
-- LIRE D'ABORD le bloc de constat : il dit ce qui va être refusé.
-- ============================================================================

-- ── Constat, AVANT toute chose ─────────────────────────────────────────────
-- La première ligne est la seule qui puisse faire échouer ce rollback : ce sont
-- les retours édités par le professeur SANS verbatim, que la garde resserrée
-- refusera. Si elle n'est pas à 0, ne pas jouer ce fichier — ou éditer ces
-- retours d'abord.
select
  (select count(*) from public.exercices_retours
    where texte_edite_par_prof is not null
      and not public.retour_segmente_bien_forme(texte_edite_par_prof, true))
                                                    as retours_prof_que_le_rollback_refusera,
  (select count(*) from public.exercices_retours
    where texte_edite_par_prof is not null)         as retours_edites_par_le_prof,
  (select count(*) from public.monitoring_mesures
    where depot_id is not null)                     as mesures_sous_l_index_du_monitoring,
  (select count(*) from public.api_couts)           as lignes_de_cout_a_repaginer;

begin;

-- ── 1. La garde de forme, re-resserrée des DEUX côtés ──────────────────────
-- Le texte EXACT de `c4_l5_chaine.sql` §5 : c'est l'état d'avant le complément.
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

-- L'ordre compte : la contrainte DÉPEND de la fonction à deux paramètres.
alter table public.exercices_retours drop constraint if exists retours_texte_segmente_chk;
alter table public.exercices_retours
  add constraint retours_texte_segmente_chk
  check (public.retour_segmente_bien_forme(texte)
     and public.retour_segmente_bien_forme(texte_edite_par_prof));

drop function if exists public.retour_segmente_bien_forme(jsonb, boolean);

-- ── 2. L'index d'idempotence du Monitoring ─────────────────────────────────
drop index if exists public.uk_monitoring_depot_sous_dimension;

-- ── 3. La somme en base ────────────────────────────────────────────────────
drop function if exists public.chaine_depense_du_mois(timestamptz);

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. Cinq drapeaux, tous attendus à `t`.
-- ============================================================================
select
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'retour_segmente_bien_forme'
      and p.pronargs = 2) = 0                                     as deux_parametres_retiree,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'retour_segmente_bien_forme'
      and p.pronargs = 1) = 1                                     as un_parametre_retablie,
  exists (select 1 from pg_constraint where conname = 'retours_texte_segmente_chk'
            and conrelid = 'public.exercices_retours'::regclass)   as garde_forme_reposee,
  -- La garde est bien REDEVENUE stricte : la remarque sans verbatim est refusée.
  not public.retour_segmente_bien_forme('[{"id":"a","texte":"attention à ta conclusion"}]'::jsonb)
  and public.retour_segmente_bien_forme(
        '[{"id":"a","texte":"x","ancrage":{"source":"copie","citation":"y"}}]'::jsonb)
                                                                   as garde_de_nouveau_stricte,
  (select count(*) from pg_indexes where schemaname = 'public'
     and indexname = 'uk_monitoring_depot_sous_dimension') = 0      as index_monitoring_retire;
