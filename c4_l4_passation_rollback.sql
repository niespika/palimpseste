-- ============================================================================
-- C4 · L4 — LA PASSATION EN CLASSE : ROLLBACK. N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ----------------------------------------------------------------------------
-- Écrit EN MÊME TEMPS que `c4_l4_passation.sql`, avant son exécution — « une
-- ligne de journal atteste une intention, pas un fichier : `ls` avant de te fier
-- à une case de rollback » (le contrôle d'entrée du prompt C4-L4, leçon du
-- rollback de `c4_l5_chaine_complement.sql`).
--
-- CE QU'IL DÉFAIT, DANS L'ORDRE INVERSE :
--   1. il REMET `photos_bien_formees` dans l'état que `c4_gardes_correctif.sql`
--      lui a donné le 21/08 — le TYPE de `rotation` contrôlé, son DOMAINE non.
--      ⚠️ Après ce rollback, `{"rotation": 3}` repasse ;
--   2. il retire la garde et la fonction des doutes de transcription ;
--   3. il retire la colonne `transcription_v1_doutes` — ⚠️ AVEC SON CONTENU :
--      les endroits que la machine avait peiné à lire sont perdus. Ils se
--      reconstruisent en re-transcrivant, ce qui coûte deux appels par copie ;
--   4. il retire l'interrupteur `passation_classe_actif` — ⚠️ tout le code de
--      C4-L4 lit cette colonne : après ce rollback, il faut que le code de
--      C4-L4 soit retiré aussi, ou la lecture de l'interrupteur échouera.
--      Le retirer NE ferme rien : c'est l'inverse d'une coupure. Si le but est
--      d'ARRÊTER la passation, poser `passation_classe_actif = false` suffit,
--      et ce fichier n'a pas à être joué.
-- ============================================================================

begin;

-- ── 1. `photos_bien_formees` — retour à l'état du 21/08 ────────────────────
create or replace function public.photos_bien_formees(p jsonb)
returns boolean
language sql
immutable
as $function$
  select p is null
      or (jsonb_typeof(p) = 'array'
          and not exists (
            select 1 from jsonb_array_elements(p) e
             where jsonb_typeof(e.value) <> 'object'
                or coalesce(jsonb_typeof(e.value->'ordre'), 'absent') <> 'number'
                or coalesce(jsonb_typeof(e.value->'rotation'), 'absent') <> 'number'
                or coalesce(jsonb_typeof(e.value->'somme_controle'), 'absent') <> 'string'
                or coalesce(btrim(e.value->>'somme_controle'), '') = ''
                or coalesce(jsonb_typeof(e.value->'page_manquante'), 'absent') <> 'boolean'
          ));
$function$;

-- ── 2 et 3. Les doutes de transcription ────────────────────────────────────
alter table public.exercices_depots
  drop constraint if exists depots_transcription_doutes_chk;

alter table public.exercices_depots
  drop column if exists transcription_v1_doutes;

drop function if exists public.transcription_doutes_bien_formes(jsonb);

-- ── 4. L'interrupteur ──────────────────────────────────────────────────────
alter table public.scriptorium_params
  drop column if exists passation_classe_actif;

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. Quatre drapeaux, tous attendus à `t`.
-- ============================================================================
select
  not exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'scriptorium_params'
                 and column_name = 'passation_classe_actif')             as interrupteur_retire,
  not exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'exercices_depots'
                 and column_name = 'transcription_v1_doutes')            as colonne_doutes_retiree,
  not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public'
                 and p.proname = 'transcription_doutes_bien_formes')     as fonction_doutes_retiree,
  -- La garde des photos est revenue à l'état du 21/08 : le type, pas le domaine.
  public.photos_bien_formees(
    '[{"ordre":1,"rotation":3,"somme_controle":"ab","page_manquante":false}]'::jsonb)
  and not public.photos_bien_formees(
        '[{"ordre":1,"rotation":null,"somme_controle":"ab","page_manquante":false}]'::jsonb)
                                                                        as garde_photos_revenue;
