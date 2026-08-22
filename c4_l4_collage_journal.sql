-- ============================================================================
-- C4 · L4 — LE JOURNAL DES COLLAGES BLOQUÉS, ET SON DESTINATAIRE : LE PROF.
-- ----------------------------------------------------------------------------
-- « Chaque tentative de collage bloquée EST JOURNALISÉE » (`06-` §1, acté le
--   29/07). Le lot l'avait tenue pour une trace serveur — un `console.warn` que
--   personne ne lit, qui expire avec les journaux de l'hébergeur, et que le
--   professeur ne voit JAMAIS. Ce n'est pas un journal. Décision de Louis,
--   22/08 : LES TROIS VECTEURS SE RAPPORTENT AU PROFESSEUR.
--
-- ⚠️ CE QUE CE FICHIER NE FAIT PAS, ET POURQUOI.
--    Il n'écrit RIEN dans `integrite_signalements`, et ce n'est pas un oubli :
--      · le §7 de la SPEC ne fait jamais d'un signal isolé un drapeau — c'est la
--        CONVERGENCE qui part au prof, par `signalerEnAttenteIA`, avec
--        confirmation humaine ; une tentative de collage n'est pas un verdict ;
--      · « la journalisation d'une tentative alimente le faisceau, QUI NE
--        REGARDE QUE LA MAISON » (`06-` §6 ; piège 37 de C4-L4) — en classe,
--        elle informe le professeur, elle ne l'accuse pas ;
--      · et la table ne le pourrait pas : `unique (eleve_id, module, rendu_ref)`
--        n'admet qu'UNE ligne par rendu, quand il faut ici compter N tentatives.
--    ⚠️ Rectification d'un commentaire faux laissé dans `depots.ts` le 22/08 :
--       `integrite_signalements_module_check` NOMME BIEN `codex` et `aletheia`,
--       et `type` n'a AUCUNE contrainte. Le canal aurait donc accepté la ligne.
--       C'est la DOCTRINE qui l'interdit, pas la forme de la table — et un motif
--       faux qui protège la bonne décision reste un motif faux.
--
-- CE QU'IL FAIT — additif, et rien d'autre :
--   1. `exercices_depots.collages_bloques` — LE JOURNAL, une entrée par
--      tentative : le MOYEN et l'INSTANT. La colonne vit sur le dépôt parce que
--      c'est la copie qui est en cause, et parce que C4-L3 — le même champ de
--      rédaction, à la maison — écrira dans la MÊME colonne : « un lot le
--      réutilise, il n'en crée pas un second ».
--   2. `collages_bien_formes()` — la garde : un tableau, un objet par entrée,
--      un `moyen` PARMI LES TROIS QUE LA SOURCE NOMME, et un `at` non vide.
--      Le domaine est fermé À DESSEIN : un quatrième vecteur qui apparaîtrait
--      un jour est une décision de source, pas une valeur qui se glisse.
--   3. `journaliser_collage()` — L'AJOUT EST ATOMIQUE. Un lire-modifier-écrire
--      depuis le serveur perdrait une tentative sur deux `Cmd+V` rapprochés, et
--      c'est exactement ce qu'on veut compter. L'instant est celui du SERVEUR :
--      l'horloge du navigateur de l'élève n'est pas une source.
--
-- Additive et gatée → protocole NORMAL. Aucune policy touchée. La colonne naît
-- `not null default '[]'` : les 23 lignes existantes la satisfont sans réécriture
-- (défaut rapide, PG 11+), et la garde les revalide toutes au moment de sa pose.
-- ============================================================================

begin;

-- ── 1. LE JOURNAL ──────────────────────────────────────────────────────────
alter table public.exercices_depots
  add column if not exists collages_bloques jsonb not null default '[]'::jsonb;

comment on column public.exercices_depots.collages_bloques is
  'Les tentatives de collage BLOQUÉES, une entrée par tentative : {moyen, at}. '
  '`06-` §1 : « chaque tentative bloquée est journalisée ». Rapporté au professeur '
  'sur son écran de correction ; JAMAIS un signalement d''intégrité (la convergence '
  'seule fait un drapeau, et le faisceau ne regarde que la maison — `06-` §6).';

-- ── 2. LA GARDE ────────────────────────────────────────────────────────────
-- Les TROIS vecteurs, et eux seuls : « raccourci clavier, glisser-déposer,
-- menu contextuel » (`06-` §1). Le domaine est fermé — cf. l'en-tête.
create or replace function public.collages_bien_formes(c jsonb)
returns boolean
language sql
immutable
as $function$
  select c is null
      or (jsonb_typeof(c) = 'array'
          and not exists (
            select 1 from jsonb_array_elements(c) e
             where jsonb_typeof(e.value) <> 'object'
                or coalesce(e.value->>'moyen', '')
                     not in ('raccourci', 'glisser-deposer', 'menu-contextuel')
                or coalesce(btrim(e.value->>'at'), '') = ''
          ));
$function$;

do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'depots_collages_chk'
                    and conrelid = 'public.exercices_depots'::regclass) then
    alter table public.exercices_depots
      add constraint depots_collages_chk
      check (public.collages_bien_formes(collages_bloques));
  end if;
end $$;

-- ── 3. L'AJOUT ATOMIQUE ────────────────────────────────────────────────────
-- ⚠️ `security invoker` (le défaut) — PAS `definer` : la fonction n'est appelée
--    que par le serveur avec la clé de service, qui passe déjà outre RLS.
--    Un `definer` ouvrirait une porte que personne n'a demandée.
-- ⚠️ `search_path` épinglé — la règle posée par les migrations `securite_*`.
create or replace function public.journaliser_collage(p_depot_id uuid, p_moyen text)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
begin
  if p_moyen not in ('raccourci', 'glisser-deposer', 'menu-contextuel') then
    raise exception 'moyen de collage inconnu : %', p_moyen
      using hint = 'Les trois vecteurs de `06-` §1, et eux seuls.';
  end if;
  update public.exercices_depots
     set collages_bloques = coalesce(collages_bloques, '[]'::jsonb)
                            || jsonb_build_object('moyen', p_moyen, 'at', now()),
         updated_at = now()
   where id = p_depot_id;
end;
$function$;

revoke all on function public.journaliser_collage(uuid, text) from public;
grant execute on function public.journaliser_collage(uuid, text) to service_role;

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. Six drapeaux, tous attendus à `t`.
-- ============================================================================
select
  exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'exercices_depots'
             and column_name = 'collages_bloques'
             and is_nullable = 'NO'
             and column_default = '''[]''::jsonb')                    as colonne_posee,
  exists (select 1 from pg_constraint where conname = 'depots_collages_chk'
            and conrelid = 'public.exercices_depots'::regclass)        as garde_posee,
  -- Les trois vecteurs de la source passent, et le tableau vide aussi.
  public.collages_bien_formes('[]'::jsonb)
  and public.collages_bien_formes(null)
  and public.collages_bien_formes(
        '[{"moyen":"raccourci","at":"2026-08-22T12:00:00Z"},'
        '{"moyen":"glisser-deposer","at":"2026-08-22T12:00:01Z"},'
        '{"moyen":"menu-contextuel","at":"2026-08-22T12:00:02Z"}]'::jsonb)
                                                                      as trois_vecteurs_passent,
  -- Un quatrième vecteur, un instant vide, un scalaire : refusés.
  not public.collages_bien_formes('[{"moyen":"telepathie","at":"x"}]'::jsonb)
  and not public.collages_bien_formes('[{"moyen":"raccourci","at":"  "}]'::jsonb)
  and not public.collages_bien_formes('[{"moyen":"raccourci"}]'::jsonb)
  and not public.collages_bien_formes('["raccourci"]'::jsonb)          as faux_vecteurs_refuses,
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'journaliser_collage'
             and p.prosecdef = false
             and p.proconfig @> array['search_path=public, pg_temp'])  as ajout_sain,
  -- Les 23 lignes existantes sont toutes au journal vide, et aucune n'est nulle.
  (select count(*) = 0 from public.exercices_depots
    where collages_bloques is null or collages_bloques <> '[]'::jsonb) as lignes_existantes_vides;
