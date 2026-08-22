-- ============================================================================
-- C4 — CORRECTIF DE TROIS GARDES : ROLLBACK. N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ----------------------------------------------------------------------------
-- ⚠️ IL ROUVRE LES TROIS TROUS. Ce n'est pas une figure de style :
--   1. `garde_depot_lieu` cesse de refuser `confiance_ocr_vf` sur un dépôt de
--      classe — une passation en classe pourra de nouveau porter une trace de
--      version finale qu'elle n'a pas ;
--   2. `photos_bien_formees` cesse de contrôler le TYPE des quatre clés : une
--      photo dont l'ordre, la rotation, la somme de contrôle et le drapeau de
--      page manquante sont tous `null` redeviendra insérable — et « sait dire
--      qu'une page manque » redeviendra une clé qui ne dit rien ;
--   3. la version à UN paramètre de `retour_segmente_bien_forme` revient : la
--      MÊME RÈGLE aura de nouveau deux domiciles en base, dont le plus ancien
--      porte l'état d'avant l'arbitrage du 21/08.
--
-- ⚠️ NON DESTRUCTIF DE DONNÉES : il ne touche aucune ligne, aucune colonne,
--    aucune table, aucune policy. Il ne fait que réécrire deux fonctions et en
--    recréer une troisième.
--
-- ⚠️ IL PEUT ÉCHOUER, ET C'EST LE COMPORTEMENT VOULU : si des dépôts portent
--    déjà des photos écrites SOUS la garde resserrée, les desserrer ne casse
--    rien ; mais si `retours_texte_segmente_chk` a été rebasculée entre-temps
--    sur la version à un paramètre (par `c4_l5_chaine_complement_rollback.sql`),
--    la recréation ci-dessous est un `create or replace` — elle passe, et les
--    deux fichiers restent compatibles.
--
-- LIRE D'ABORD le bloc de constat : il dit ce qui redeviendra possible.
-- ============================================================================

-- ── Constat, AVANT toute chose ─────────────────────────────────────────────
select
  (select count(*) from public.exercices_depots
     where photos_v1 is not null or photos_vf is not null)   as depots_portant_des_photos,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'retour_segmente_bien_forme')
                                                             as exemplaires_de_la_garde_de_retour,
  pg_get_functiondef('public.garde_depot_lieu()'::regprocedure)
    like '%confiance_ocr_vf%'                                as garde_lieu_couvre_encore_la_confiance_vf;

begin;

-- ── 1. La garde de lieu, revenue à QUATRE champs sur cinq ──────────────────
-- Le texte EXACT de `c4_l1_schema.sql`, garde C.
create or replace function public.garde_depot_lieu() returns trigger
language plpgsql as $fn$
declare v_lieu text;
begin
  select e.lieu into v_lieu from exercices e where e.id = new.exercice_id;
  if v_lieu = 'classe' then
    if new.statut = 'vf_remis' then
      raise exception 'Garde 07- §1.1 : en classe, la séquence s''arrête à retour_publie — il n''y a pas de version finale.'
        using errcode = 'check_violation';
    end if;
    if new.texte_vf is not null or new.photos_vf is not null
       or new.transcription_vf is not null or new.vf_remis_at is not null then
      raise exception 'Garde 07- §1.1 : aucune version finale sur une passation en classe.'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $fn$;

-- ── 2. Les photos, revenues au contrôle de PRÉSENCE seul ───────────────────
-- Le texte EXACT de `c4_l1_schema.sql`.
create or replace function public.photos_bien_formees(p jsonb)
returns boolean language sql immutable as $fn$
  select p is null
      or (jsonb_typeof(p) = 'array'
          and not exists (
            select 1 from jsonb_array_elements(p) e
             where jsonb_typeof(e.value) <> 'object'
                or not (e.value ? 'ordre')
                or not (e.value ? 'rotation')
                or not (e.value ? 'somme_controle')
                or not (e.value ? 'page_manquante')
          ));
$fn$;

-- ── 3. Le second domicile de la garde de retour, recréé ────────────────────
-- Le texte EXACT de `c4_l5_chaine.sql` §5.
create or replace function public.retour_segmente_bien_forme(p jsonb)
returns boolean language sql immutable as $$
  select p is null
      or (jsonb_typeof(p) = 'array'
          and jsonb_array_length(p) >= 1
          and not exists (
            select 1 from jsonb_array_elements(p) e
            where jsonb_typeof(e) <> 'object'
               or coalesce(e->>'id', '') = ''
               or coalesce(e->>'texte', '') = ''
               or jsonb_typeof(e->'ancrage') <> 'object'
               or coalesce(e#>>'{ancrage,citation}', '') = ''
               or coalesce(e#>>'{ancrage,source}', '') not in ('copie', 'texte_support'))
          and (select count(distinct e->>'id') from jsonb_array_elements(p) e)
              = jsonb_array_length(p));
$$;

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. Trois drapeaux, tous attendus à `t`.
-- Ils constatent que les trous sont bien ROUVERTS.
-- ============================================================================
select
  pg_get_functiondef('public.garde_depot_lieu()'::regprocedure)
    not like '%confiance_ocr_vf%'                                as trou_1_rouvert,
  public.photos_bien_formees(
    '[{"ordre":null,"rotation":null,"somme_controle":null,"page_manquante":null}]'::jsonb)
                                                                 as trou_2_rouvert,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'retour_segmente_bien_forme') = 2
                                                                 as trou_3_rouvert;
