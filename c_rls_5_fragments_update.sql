-- ============================================================================
-- C-RLS-5 — l'élève cesse de pouvoir blanchir ses propres marques d'anti-triche.
-- Campagne C (revue RLS), constat 5. Écrit le 2026-08-30.
-- ----------------------------------------------------------------------------
-- ⛔ LE DÉFAUT. La policy « Élève met à jour ses dépôts » ouvre l'UPDATE de
--    `fragments_depots` sur TOUTE la ligne dès qu'elle lui appartient, **sans
--    restriction de colonnes**. L'élève peut donc remettre `photos_suspectes`
--    à `false` et `signal_integrite` à `null` sur son propre dépôt — c'est-à-dire
--    effacer l'indice que le professeur regarde.
--    ⭐ Éprouvé en transaction annulée (rôle `authenticated`, JWT d'un élève
--    réel) : `UPDATE 1`, relecture `photos_suspectes = f`, `signal_integrite`
--    null.
--
-- ⭐ CE QUI REND LE GESTE GRATUIT : **aucun code du dépôt ne fait d'UPDATE sur
--    cette table.** Recensement : 31 occurrences de `from('fragments_depots')`,
--    dont **0 `.update()`** — un INSERT côté élève, deux DELETE, et 28 lectures.
--    La policy est de la **surface d'attaque morte** : la retirer ne change
--    aucun comportement.
--
-- ⭐ POURQUOI PAS UN `revoke` DE COLONNES : prof et élève partagent le rôle
--    Postgres `authenticated` — un `revoke` sur `photos_suspectes` aveuglerait
--    aussi le professeur. Retirer la policy ne coûte rien et ne prend personne
--    en otage.
--
-- ⚠️ CE QUE CE FICHIER NE PRÉTEND PAS FAIRE. Il **ne rend pas la marque
--    infalsifiable**, et c'est assumé : `photos_suspectes` et `photo_prise_at`
--    sont **fournis par le navigateur** au moment de l'INSERT
--    (`app/eleve/modules/fragments-erudition/actions.ts:152`), et l'élève peut
--    simplement ne jamais poser la marque. Le serveur ne peut pas recouper —
--    l'EXIF est purgé à la compression, **« parce que la loi 25 l'exige »**
--    (`06-` §7 point 4). ⭐ **Décision de Louis, 30/08 : le signal reste un
--    GARDE-FOU, pas une preuve** — l'écran le déclare déjà « indicatif, non
--    probant ». Ce fichier retire une porte inutile, il ne change pas la nature
--    du dispositif.
--
-- ⚠️ Ce qui a des conséquences n'est pas touché : le strike vient de
--    `signalerStrikeAuto` sur un signal calculé CÔTÉ SERVEUR à partir du
--    commentaire, et `photos_suspectes` n'alimente aucun strike (4 occurrences
--    dans tout le dépôt, toutes en écriture ou en affichage).
--
-- ⚠️ ORDRE : **SQL SEUL, AUCUN CODE.** La migration est inerte pour le code
--    déployé, qui n'écrit jamais d'UPDATE ici. `fragments_depots` est une table
--    de flux vivant (protocole renforcé, règle R6) : 2 lignes en bac à sable,
--    **0 en production**, et la première échéance est le 2026-08-31.
--
-- Retour arrière : `c_rls_5_fragments_update_rollback.sql`.
-- ============================================================================

begin;

-- ── Constat de tête ───────────────────────────────────────────────────────
do $$
declare
  v_policies text;
  v_depots bigint;
  v_marques bigint;
begin
  select string_agg(policyname || ' (' || cmd || ')', ', ' order by cmd, policyname)
    into v_policies from pg_policies where tablename = 'fragments_depots';
  select count(*) into v_depots from fragments_depots;
  select count(*) into v_marques from fragments_depots
   where photos_suspectes or signal_integrite is not null;
  raise notice 'AVANT — policies : %', v_policies;
  raise notice 'AVANT — % dépôt(s), dont % portant une marque', v_depots, v_marques;
end $$;

-- ── Le geste ──────────────────────────────────────────────────────────────
drop policy if exists "Élève met à jour ses dépôts" on fragments_depots;

-- ── Contrôle de pied — il s'exécute AVANT le commit ──────────────────────
do $$
declare
  v_update int;
  v_reste int;
  v_depots bigint;
  v_marques bigint;
  v_rls boolean;
begin
  -- ⭐ Mesuré sur le `cmd`, pas sur le nom : une seconde policy d'écriture
  --    oubliée compterait ici. (La leçon de C-RLS-4 : les policies permissives
  --    sont OR'ées, en retirer une n'en ferme pas deux.)
  select count(*) into v_update from pg_policies
   where tablename = 'fragments_depots' and cmd in ('UPDATE', 'ALL');
  select count(*) into v_reste from pg_policies where tablename = 'fragments_depots';
  select count(*) into v_depots from fragments_depots;
  select count(*) into v_marques from fragments_depots
   where photos_suspectes or signal_integrite is not null;
  select relrowsecurity into v_rls from pg_class where relname = 'fragments_depots';

  raise notice 'APRÈS — % policy(ies) restantes, dont % autorisant un UPDATE', v_reste, v_update;
  raise notice 'APRÈS — % dépôt(s), dont % portant une marque · RLS : %', v_depots, v_marques, v_rls;

  if v_update <> 0 then
    raise exception 'ÉCHEC — % policy(ies) autorisent encore un UPDATE élève', v_update;
  end if;
  if v_reste <> 4 then
    raise exception 'ÉCHEC — % policies restantes, 4 attendues (INSERT élève, SELECT élève, SELECT prof, DELETE prof)', v_reste;
  end if;
  if not v_rls then
    raise exception 'ÉCHEC — RLS désactivée sur fragments_depots';
  end if;
  raise notice '✅ les trois drapeaux sont bons.';
end $$;

commit;
