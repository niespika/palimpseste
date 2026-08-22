-- ============================================================================
-- C4 · L5 — COMPLÉMENT : ce que la revue adversariale a trouvé.
-- ----------------------------------------------------------------------------
-- Quatre points, tous éprouvés en base avant d'être écrits ici. Additive et
-- gatée → protocole NORMAL (tables neuves de C4-L1, toujours vides ; aucune
-- policy touchée ; aucune policy élève ajoutée).
--
--   1. `chaine_depense_du_mois(timestamptz)` — LA SOMME SE FAIT EN BASE.
--      `depenseDuMois` chargeait les lignes du mois pour les additionner côté
--      client : PostgREST plafonne la réponse (« Max rows », 1000 par défaut) et
--      NE SIGNALE RIEN — `error` reste nul, la somme se fige sur un sous-total,
--      et la COUPURE AUTOMATIQUE cesse d'exister au-delà de mille appels dans le
--      mois, c'est-à-dire dès la première classe. « L'agrégation se fait EN
--      REQUÊTE » (`07-` §1.2) : voici la requête.
--
--   2. `retour_segmente_bien_forme(jsonb, boolean)` — L'ÉDITION DU PROFESSEUR.
--      La garde imposait à `texte_edite_par_prof` la forme EXACTE du texte
--      engendré : chaque point ancré sur une citation de la copie ou du texte
--      support. Or `02-exercices.md` §6.D, étape 14, dit « il peut MODIFIER LE
--      RETOUR », sans condition ; `07-` §1.2 ne borne l'édition que par le lieu.
--      Un professeur qui écrit « attention à ta conclusion » — sans verbatim —
--      voyait son écran échouer sur une `23514`, et la seule issue applicative
--      aurait été de fabriquer un faux ancrage. L'ancrage devient donc exigé sur
--      LE TEXTE ENGENDRÉ SEUL ; l'identifiant stable, lui, reste exigé des deux
--      côtés — la contestation s'y accroche (§1.2).
--      Au passage : `btrim`, pour qu'un texte fait d'espaces ne passe plus.
--
--   3. Un index unique partiel `(depot_id, sous_dimension)` sur
--      `monitoring_mesures` — LA SEULE TABLE DU LOT SANS GARDE MÉCANIQUE. Une
--      reprise après expiration de bail, ou un second passage en version finale,
--      y versait des DOUBLONS : `n` gonflait, et la fenêtre de cinq exercices du
--      taux de lucidité comptait la même copie plusieurs fois. C'est le mode de
--      panne du §1.1, sur la table qu'on avait oublié de verrouiller. Le code
--      écrit désormais UNE ligne de calibration par dépôt — ses trois sources
--      (« se juger », confiance de remise, porte 2) tiennent dans son JSONB,
--      comme la fiche les décrit : « la calibration — dérivée, DE TROIS SOURCES ».
--
--   4. Les gardes d'idempotence des `do $$` cherchaient `pg_constraint` par NOM
--      SEUL, sans `conrelid` : une homonymie sur une autre table faisait sauter
--      l'ADD en silence, et les sept drapeaux disaient quand même « t ». Le
--      fichier `c4_l5_chaine.sql` est corrigé pour tout rejeu ultérieur, et deux
--      drapeaux de plus y vérifient que les deux gardes sont bien posées ; ici,
--      on RÉ-ASSERTE les deux contraintes sur la base courante.
--
-- Retour arrière : `c4_l5_chaine_complement_rollback.sql`.
-- ============================================================================

begin;

-- ── 1. La facture, sommée en base ──────────────────────────────────────────
create or replace function public.chaine_depense_du_mois(depuis timestamptz)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(cout), 0)::numeric from public.api_couts where created_at >= depuis;
$$;

comment on function public.chaine_depense_du_mois(timestamptz) is
  'C4-L5 — la dépense depuis un instant, SOMMÉE EN BASE. Lue par la coupure automatique '
  '(plafond mensuel, alerte à 70 %). Additionner côté client passait sous le plafond de '
  'lignes de PostgREST, qui ne signale rien : la coupure devenait inopérante au-delà de '
  'mille appels dans le mois. « L''agrégation se fait en requête » (07- §1.2).';

revoke all on function public.chaine_depense_du_mois(timestamptz) from public, anon, authenticated;
grant execute on function public.chaine_depense_du_mois(timestamptz) to service_role;

-- ── 2. La garde de forme, desserrée pour la SEULE colonne du professeur ────
create or replace function public.retour_segmente_bien_forme(
  p jsonb, ancrage_exige boolean default true)
returns boolean language sql immutable as $$
  select p is null
      or (jsonb_typeof(p) = 'array'
          -- Le professeur a le droit de tout retirer : `[]` n'est refusé que sur
          -- le texte ENGENDRÉ, qui doit toujours nommer au moins un point.
          and (jsonb_array_length(p) >= 1 or not ancrage_exige)
          and not exists (
            select 1 from jsonb_array_elements(p) e
            where jsonb_typeof(e) <> 'object'
               -- L'identifiant stable est exigé DES DEUX CÔTÉS : la contestation
               -- s'y accroche, et le drapeau des contestations répétées compte dessus.
               or coalesce(btrim(e->>'id'), '') = ''
               or coalesce(btrim(e->>'texte'), '') = ''
               -- L'ancrage n'est exigé que du texte ENGENDRÉ (RR3, `01-` §12) :
               -- « il peut modifier le retour » (`02-` §6.D, étape 14) sans que
               -- sa remarque porte un verbatim.
               or (ancrage_exige and (
                     jsonb_typeof(e->'ancrage') <> 'object'
                  or coalesce(btrim(e#>>'{ancrage,citation}'), '') = ''
                  or coalesce(e#>>'{ancrage,source}', '') not in ('copie', 'texte_support')))
               -- Un ancrage FOURNI reste bien formé, même côté professeur.
               or (not ancrage_exige and e ? 'ancrage' and (
                     jsonb_typeof(e->'ancrage') <> 'object'
                  or coalesce(btrim(e#>>'{ancrage,citation}'), '') = '')))
          and (select count(distinct e->>'id') from jsonb_array_elements(p) e)
              = jsonb_array_length(p));
$$;

alter table public.exercices_retours drop constraint if exists retours_texte_segmente_chk;
alter table public.exercices_retours
  add constraint retours_texte_segmente_chk
  check (public.retour_segmente_bien_forme(texte, true)
     and public.retour_segmente_bien_forme(texte_edite_par_prof, false));

-- ── 3. Une mesure de Monitoring par dépôt et par sous-dimension ────────────
create unique index if not exists uk_monitoring_depot_sous_dimension
  on public.monitoring_mesures (depot_id, sous_dimension)
  where depot_id is not null;

comment on index public.uk_monitoring_depot_sous_dimension is
  'C4-L5 — la garde d''idempotence de la seule table du lot qui n''en avait pas. Une reprise '
  'après expiration de bail, ou un second passage en version finale, y versait des doublons : '
  '`monitoring_niveaux.n` gonflait et la fenêtre de cinq exercices du taux de lucidité comptait '
  'la même copie plusieurs fois. PARTIEL : une mesure sans dépôt n''y entre pas. La calibration '
  'porte SES TROIS SOURCES dans son JSONB (fiche §4), elle n''occupe qu''une ligne.';

-- ── 4. Les deux gardes, ré-assertées sur LEUR table ────────────────────────
do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'exercices_jobs_statut_chk'
                    and conrelid = 'public.exercices_jobs'::regclass) then
    alter table public.exercices_jobs
      add constraint exercices_jobs_statut_chk
      check (statut in ('en_attente', 'en_cours', 'abouti', 'echoue'));
  end if;
end $$;

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. Six drapeaux, tous attendus à `t`.
-- ============================================================================
select
  (select public.chaine_depense_du_mois(now() - interval '400 days')) > 0     as somme_en_base,
  (select public.chaine_depense_du_mois(now() + interval '1 day')) = 0        as somme_vide_rend_zero,
  exists (select 1 from pg_constraint where conname = 'retours_texte_segmente_chk'
            and conrelid = 'public.exercices_retours'::regclass)              as garde_forme_posee,
  exists (select 1 from pg_constraint where conname = 'exercices_jobs_statut_chk'
            and conrelid = 'public.exercices_jobs'::regclass)                 as garde_statut_posee,
  (select count(*) from pg_indexes where schemaname = 'public'
     and indexname = 'uk_monitoring_depot_sous_dimension') = 1                as index_monitoring_pose,
  -- Le professeur peut écrire une remarque SANS ancrage ; la chaîne, non.
  public.retour_segmente_bien_forme('[{"id":"a","texte":"attention à ta conclusion"}]'::jsonb, false)
  and not public.retour_segmente_bien_forme('[{"id":"a","texte":"x"}]'::jsonb, true)
  and not public.retour_segmente_bien_forme('[{"id":"a","texte":"   ","ancrage":{"source":"copie","citation":"y"}}]'::jsonb, true)
                                                                              as garde_desserree_du_bon_cote;
