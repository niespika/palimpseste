-- ============================================================================
-- C4 · L9-bis — RETOUR ARRIÈRE de `c4_l9_bis_examen_produire_macro.sql`.
-- ----------------------------------------------------------------------------
-- ⚠️ À LIRE D'ABORD — le bloc de CONSTAT ci-dessous dit ce qui va se refermer.
--
-- ⚠️ CE QUE CE FICHIER DÉFAIT, ET LA CONSÉQUENCE EST SILENCIEUSE :
--    · les deux types d'examen diagnostique **reperdent leur grain** ;
--    · la garde revient à celle du 18/08 — grain **interdit** sur `complet`.
--    ⚠️⚠️ **ET « SE JUGER » REDEVIENT INERTE SUR LES DEUX EXAMENS** : le drapeau
--       continuera de se lever, l'étape ne se servira plus, et **rien à l'écran
--       ne le dira**. C'est exactement le défaut que la migration répare — *« une
--       année de collecte manquée ne se rattrape pas »*. Ne jouer ce fichier que
--       si l'on a décidé, en source, qu'un examen diagnostique n'est PAS un
--       `produire` au `macro`.
--
-- ⚠️ CE QU'IL NE FAIT PAS :
--    · il ne touche NI aux `genres_admis`, NI au `mode_saisie`, NI au `libelle`,
--      NI aux codes renommés : tout cela est C4-L9, et son propre rollback
--      (`c4_l9_examens_diagnostiques_rollback.sql`) s'en charge ;
--    · il ne retire PAS la dérivation du geste dans le code
--      (`lirePerimetre`) — elle devient simplement sans effet, le grain
--      manquant refermant l'étape juste après. **Le code reste cohérent.**
-- ============================================================================

-- ── CONSTAT — à jouer SEUL, avant tout, et à lire ───────────────────────────
select
  (select count(*) from public.exercices_types
    where nature = 'complet' and grain = 'macro')            as types_qui_reperdent_leur_grain,
  (select count(*) from public.exercices_depots d
     join public.exercices e on e.id = d.exercice_id
     join public.exercices_types t on t.id = e.type_id
    where t.nature = 'complet' and e.optin_se_juger)         as depots_dont_se_juger_se_refermera,
  (select count(*) from public.exercices_metacognition m
     join public.exercices_depots d on d.id = m.depot_id
     join public.exercices e on e.id = d.exercice_id
     join public.exercices_types t on t.id = e.type_id
    where t.nature = 'complet')                              as jugements_deja_collectes;
-- ⚠️ La troisième ligne compte ce qui est DÉJÀ COLLECTÉ : ce fichier ne l'efface
--    pas, mais plus rien n'en produira après lui.

begin;

alter table public.exercices_types
  drop constraint if exists types_complet_macro_sans_cran_chk;

update public.exercices_types
   set grain = null, updated_at = now()
 where nature = 'complet';

do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'types_complet_sans_objet_ni_cran_chk'
                    and conrelid = 'public.exercices_types'::regclass) then
    alter table public.exercices_types
      add constraint types_complet_sans_objet_ni_cran_chk check (
        nature <> 'complet'
        or (grain is null and coalesce(array_length(crans_admis, 1), 0) = 0)
      );
  end if;
end $$;

commit;

-- ============================================================================
-- VÉRIFICATION DU RETOUR ARRIÈRE — quatre drapeaux, tous attendus à `t`.
-- ⚠️ Vérifiée PAR REQUÊTE, jamais sur la foi du mot « COMMIT » affiché.
-- ============================================================================
select
  (select count(*) = 2 from public.exercices_types
    where nature = 'complet' and grain is null)              as grain_repris,
  exists (select 1 from pg_constraint
           where conname = 'types_complet_sans_objet_ni_cran_chk'
             and conrelid = 'public.exercices_types'::regclass)
  and not exists (select 1 from pg_constraint
                   where conname = 'types_complet_macro_sans_cran_chk'
                     and conrelid = 'public.exercices_types'::regclass)
                                                             as garde_d_origine_revenue,
  -- Ce que C4-L9 avait posé n'est PAS défait par ce fichier.
  (select count(*) = 2 from public.exercices_types
    where nature = 'complet' and genres_admis is not null
      and mode_saisie = 'manuscrit' and libelle is not null) as c4_l9_intact,
  (select count(*) = 13 from public.exercices_types
    where nature in ('moment', 'element') and grain is not null)
                                                             as les_treize_intacts;
