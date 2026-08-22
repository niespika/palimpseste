-- ============================================================================
-- C4 · L4 — LA PASSATION EN CLASSE : ce que le flux exige de la base.
-- ----------------------------------------------------------------------------
-- « AUCUNE TABLE NE SE CRÉE. C4-L1 les a posées, C4-L5 et C4-L8 les ont
--   complétées. Ce que le §1 nomme et que la base ne porte pas s'ajoute en
--   MIGRATION ADDITIVE » (piège 5). Ce fichier ne crée donc aucune table :
--   il ajoute UNE colonne d'interrupteur, UNE colonne de donnée, et RESSERRE
--   une garde de C4-L1 dont le §1.1 laissait le domaine ouvert.
--
-- Additive et gatée → protocole NORMAL. Aucune policy touchée, aucune policy
-- élève ajoutée (« toutes les écritures passent par le serveur », §1 ; C4-L1
-- n'a posé AUCUNE policy élève sur les vingt tables — vérifié par requête le
-- 22/08 : une seule policy par table, `*_prof_all`). Les tables touchées sont
-- celles de C4-L1, qu'AUCUN flux existant ne lit : `exercices_depots` porte
-- quatorze lignes de recette, toutes `assigne`, AUCUNE avec des photos
-- (`select count(*) … where photos_v1 is not null or photos_vf is not null` = 0).
--
--   1. `scriptorium_params.passation_classe_actif` — L'INTERRUPTEUR PROPRE DU
--      LOT, À OFF. « Si ce lot en veut un propre, il naît à OFF, au même
--      emplacement que les interrupteurs existants » (piège 6 ; §1.5). Il est
--      DISTINCT de `chaine_actif` à dessein : la coupure automatique de facture
--      bascule `chaine_actif` (C4-L5, `acces.ts`), et une transcription qui
--      s'éteindrait parce que la facture du mois a coupé laisserait une classe
--      entière sans son écran, pendant l'heure de cours. Les trois interrupteurs
--      du §1.5 restent au professeur et ne sont pas touchés ici.
--
--   2. `exercices_depots.transcription_v1_doutes` — CE QUE LA MACHINE A PEINÉ
--      À LIRE, par passage. « La confiance de transcription dit ce que la
--      machine a peiné à lire » (`06-` §1, règle 2) ; « un écran n'affiche un
--      nombre que si ce nombre compte quelque chose » (`06-` §5) — et un
--      scalaire ne sait pas MONTRER un passage. `confiance_ocr_v1` reste le
--      chiffre ; cette colonne porte les endroits.
--      Deux origines, et deux seulement : les « Doutes » que le prompt de
--      transcription reporte en fin de réponse (sa règle 5), et les endroits où
--      LES DEUX PASSES ONT DIVERGÉ — c'est-à-dire la matière même dont
--      `confiance_ocr` est le résumé (`06-` §4, provisoire — réglage empirique).
--      ⚠️ CE N'EST PAS une seconde version de la transcription, ni un diff de
--      l'édition de l'élève, ni un drapeau d'écart : « aucune version double
--      n'est conservée, aucun drapeau d'écart n'est levé » (`02-` §6.D) porte
--      sur le CONTRÔLE DE L'ÉLÈVE — la correction qu'il fait ne se compare à
--      rien et ne se compte pas. Ici, rien de l'élève n'est regardé : les deux
--      passes sont deux lectures de la MÊME photo par la machine, et leur écart
--      est déjà, par définition de la source, ce que `confiance_ocr` mesure.
--      La colonne est écrite À LA TRANSCRIPTION et jamais retouchée ensuite.
--      Le §1 ne la nomme pas : elle est portée à son amendement, comme le
--      régime v2.23 du `07-` y autorise désormais une session Code (« le §1
--      est ouvert à l'implémentation ; la modification se dit au relevé »).
--
--   3. `photos_bien_formees` — LE DOMAINE DE `rotation`. C4-L1 exigeait « un
--      nombre » ; `c4_gardes_correctif.sql` (21/08) a exigé LE TYPE. Il reste le
--      DOMAINE : « `rotation` est "un nombre", pas encore "un quart de tour" —
--      si une rotation ne peut être qu'un quart de tour, borne-la » (piège 12).
--      Elle ne peut être qu'un quart de tour : l'écran ne propose que la
--      rotation par quarts, et une valeur libre rendrait la somme de contrôle
--      inutile (deux dépôts de la même page à 3° près ne se reconnaîtraient
--      plus). Domaine posé : 0, 90, 180, 270.
--      La fonction est partagée par `photos_v1` et `photos_vf` ; les deux
--      colonnes sont vides sur les quatorze lignes existantes.
--
-- Retour arrière : `c4_l4_passation_rollback.sql`.
-- ============================================================================

begin;

-- ── 1. L'interrupteur propre du lot, à OFF ─────────────────────────────────
alter table public.scriptorium_params
  add column if not exists passation_classe_actif boolean not null default false;

comment on column public.scriptorium_params.passation_classe_actif is
  'C4-L4 — la passation en classe (dépôt des photos, transcription, correction, '
  'publication). À OFF jusqu''à la recette. DISTINCT de `chaine_actif` : la coupure '
  'automatique de facture bascule celui-là, jamais celui-ci.';

-- ── 2. Ce que la machine a peiné à lire, par passage ───────────────────────
alter table public.exercices_depots
  add column if not exists transcription_v1_doutes jsonb;

comment on column public.exercices_depots.transcription_v1_doutes is
  'C4-L4 — les endroits que la machine a peiné à lire : les « Doutes » du prompt '
  'de transcription (sa règle 5) et les passages où les DEUX PASSES ont divergé. '
  'Le détail dont `confiance_ocr_v1` est le résumé (`06-` §4). Écrite à la '
  'transcription, jamais retouchée. Ni version double, ni diff de l''édition.';

-- La forme : un tableau d'objets `{origine, extrait, alternative?}`.
--   · `origine` ∈ `doutes` | `desaccord` — d'où l'endroit vient ;
--   · `extrait` — le passage, non vide, tel que la machine l'a lu ;
--   · `alternative` — l'autre lecture, quand il y en a une (facultative, mais
--     si elle est là, elle n'est pas vide : une alternative vide ne montre rien).
-- `null` reste légitime : une copie sans doute existe, et un dépôt sans photo
-- n'a pas de transcription du tout.
create or replace function public.transcription_doutes_bien_formes(d jsonb)
returns boolean
language sql
immutable
as $function$
  select d is null
      or (jsonb_typeof(d) = 'array'
          and not exists (
            select 1 from jsonb_array_elements(d) e
             where jsonb_typeof(e) <> 'object'
                or coalesce(e->>'origine', '') not in ('doutes', 'desaccord')
                or coalesce(btrim(e->>'extrait'), '') = ''
                or (e ? 'alternative'
                    and jsonb_typeof(e->'alternative') <> 'null'
                    and coalesce(btrim(e->>'alternative'), '') = '')
          ));
$function$;

do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'depots_transcription_doutes_chk'
                    and conrelid = 'public.exercices_depots'::regclass) then
    alter table public.exercices_depots
      add constraint depots_transcription_doutes_chk
      check (public.transcription_doutes_bien_formes(transcription_v1_doutes));
  end if;
end $$;

-- ── 3. `rotation` est un QUART DE TOUR, et la garde le dit ─────────────────
-- ⚠️ `create or replace` sur une fonction utilisée par deux contraintes CHECK :
--    Postgres ne revalide PAS les lignes existantes. C'est sans conséquence ici
--    (aucune ligne ne porte de photo) et c'est dit pour que personne ne croie
--    le contraire ; la vérification en fin de fichier ré-éprouve la garde.
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
                -- Le DOMAINE, et pas seulement le type : un quart de tour
                -- (piège 12 ; « la forme physique appartient à la session Code »).
                or (e.value->>'rotation')::numeric not in (0, 90, 180, 270)
                or coalesce(jsonb_typeof(e.value->'somme_controle'), 'absent') <> 'string'
                or coalesce(btrim(e.value->>'somme_controle'), '') = ''
                or coalesce(jsonb_typeof(e.value->'page_manquante'), 'absent') <> 'boolean'
          ));
$function$;

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. Huit drapeaux, tous attendus à `t`.
-- ============================================================================
select
  (select passation_classe_actif from public.scriptorium_params limit 1) = false
                                                                        as interrupteur_a_off,
  exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'exercices_depots'
             and column_name = 'transcription_v1_doutes')                as colonne_doutes_posee,
  exists (select 1 from pg_constraint where conname = 'depots_transcription_doutes_chk'
            and conrelid = 'public.exercices_depots'::regclass)          as garde_doutes_posee,
  -- La garde des doutes accepte ce qui est licite…
  public.transcription_doutes_bien_formes(null)
  and public.transcription_doutes_bien_formes('[]'::jsonb)
  and public.transcription_doutes_bien_formes(
        '[{"origine":"doutes","extrait":"consience","alternative":"conscience"}]'::jsonb)
  and public.transcription_doutes_bien_formes(
        '[{"origine":"desaccord","extrait":"il ya"}]'::jsonb)            as doutes_licites_passent,
  -- … et refuse ce qui ne l'est pas.
  not public.transcription_doutes_bien_formes('[{"origine":"autre","extrait":"x"}]'::jsonb)
  and not public.transcription_doutes_bien_formes('[{"origine":"doutes","extrait":"  "}]'::jsonb)
  and not public.transcription_doutes_bien_formes(
            '[{"origine":"doutes","extrait":"x","alternative":""}]'::jsonb)
  and not public.transcription_doutes_bien_formes('["x"]'::jsonb)        as doutes_faux_refuses,
  -- Un quart de tour passe…
  public.photos_bien_formees(
    '[{"ordre":1,"rotation":270,"somme_controle":"ab","page_manquante":false}]'::jsonb)
  and public.photos_bien_formees(null)
  and public.photos_bien_formees('[]'::jsonb)                            as quart_de_tour_passe,
  -- … et tout ce qui n'en est pas un est refusé.
  not public.photos_bien_formees(
        '[{"ordre":1,"rotation":3,"somme_controle":"ab","page_manquante":false}]'::jsonb)
  and not public.photos_bien_formees(
        '[{"ordre":1,"rotation":-90,"somme_controle":"ab","page_manquante":false}]'::jsonb)
  and not public.photos_bien_formees(
        '[{"ordre":1,"rotation":null,"somme_controle":"ab","page_manquante":false}]'::jsonb)
                                                                        as rotation_libre_refusee,
  -- Ce que C4-L1 et le correctif du 21/08 tenaient déjà tient toujours.
  not public.photos_bien_formees(
        '[{"ordre":1,"rotation":90,"somme_controle":"","page_manquante":false}]'::jsonb)
  and not public.photos_bien_formees('[{"ordre":1,"rotation":90,"somme_controle":"ab"}]'::jsonb)
                                                                        as gardes_c4l1_intactes;
