-- ============================================================================
-- C4 · L3 — LE DÉROULÉ DE L'ÉLÈVE, À LA MAISON : les quatre données que le
--            §1 nomme et que la base ne portait pas encore.
-- ----------------------------------------------------------------------------
-- « Ce que le §1 NOMME sans que la base le porte encore s'ajoute en migration
--   ADDITIVE sous les conventions de dépôt ; la forme physique t'appartient »
--   (`07-` §1). Et : « une donnée que RIEN ne nomme se signale, elle ne
--   s'invente pas ». Les quatre gestes ci-dessous sont nommés — chacun porte
--   son renvoi.
--
-- ⚠️ CE QUE CE FICHIER NE FAIT PAS, ET POURQUOI.
--    1. IL NE CRÉE AUCUNE TABLE. Le schéma est joué (C4-L1), la fabrique aussi
--       (C4-L8) : `exercices_depots`, `exercices_metacognition`,
--       `exercices_retours`, `exercices_jobs` portent déjà tout le déroulé —
--       les six horodatages, les trois gestes de la remise, le motif de
--       dépassement, la crédence, la contestation. Rien à y ajouter.
--    2. IL N'OUVRE AUCUNE POLICY ÉLÈVE, et ce n'est pas un oubli. Le patron du
--       moteur est « RLS active partout, policy PROF `for all`, et AUCUNE
--       POLICY ÉLÈVE » (`c4_l1_schema.sql`, décision de Louis du 14/08),
--       repris tel quel par C4-L4 et C4-L2. C'est PLUS FERMÉ que « ses propres
--       lignes » (`07-` §1) : l'élève ne lit RIEN en direct, le serveur lit
--       pour lui et filtre sur `eleve_id`. Le piège 42 du prompt — « les
--       policies élève s'ouvrent TABLE PAR TABLE, en excluant `exercices_cas`,
--       `exercices_squelettes` et `exercices_metacognition` » — est donc tenu
--       a fortiori : aucune des trois n'est ouverte, et aucune autre non plus.
--       La vérification en pied le RÉ-ÉPROUVE par requête.
--    3. IL NE CRÉE AUCUNE FONCTION `security definer` (piège 43 : il n'y a rien
--       à révoquer, parce qu'il n'y a rien de neuf à appeler). Le déroulé écrit
--       par des routes serveur, avec la clé de service.
--    4. IL NE TOUCHE PAS `collages_bloques` : C4-L4 l'a posée, et « un lot le
--       RÉUTILISE, il n'en crée pas un second » (`07-` §1.2). Le champ de
--       rédaction de la maison écrit dans la MÊME colonne, par la MÊME RPC
--       `journaliser_collage(uuid, text)`.
--
-- CE QU'IL FAIT — quatre gestes additifs, et rien d'autre :
--
--   1. `exercices_depots.saisie_telemetrie` — L'INSTRUMENTATION DU FAISCEAU.
--      « Le rythme de frappe et l'apparition du texte par blocs », « le nombre
--      de sessions d'écriture » (`06-` §6) : trois des sept signaux, et SANS
--      CETTE COLLECTE ILS N'EXISTENT PAS. La colonne porte des MESURES, jamais
--      un verdict — « tous tagués, aucun bloquant, jamais un verdict » : on
--      écrit les signes saisis, le temps actif, le plus grand ajout d'un seul
--      tenant et le nombre de sessions ; le rapport « neuf cents signes par
--      minute » se RECALCULE à la lecture, il ne se stocke pas (même partage
--      que `observables.ts` : la valeur s'écrit, le verdict se relit).
--      ⚠️ Par VERSION — `{"v1": {…}, "vf": {…}}` — parce que le delta v1→vf
--         est lui-même un signal et que mêler les deux saisies le brouillerait.
--
--   2. `exercices_depots.aide_consommee` — LE COMPTEUR DE L'ÉCRAN. `01-` §11 :
--      « `aide_consommee` : dépliages de la fiche et relectures (définition
--      provisoire, révisable selon les types) ». C'est C4-L3 qui la porte et la
--      passe à `traiterDepot` (sa signature l'accepte en option) ; la chaîne la
--      RECOPIE telle quelle dans `competences_mesures.aide_consommee` et ne la
--      calcule jamais. Elle a besoin d'un domicile qui survive à un
--      rechargement : le voici. ⭐ CE QU'ELLE COMPTE, décision du PO du 22/08 :
--      les dépliages des aides que CET écran sert — la DÉMONSTRATION du temps 1
--      et le GUIDE de l'appui — plus les RELECTURES du retour. « La fiche » du
--      `01-` §11 est la fiche de compétence dite à l'élève (`06-` §5), qui n'a
--      pas d'écran dans ce lot (C6-L2) : le compteur porte les aides du déroulé.
--
--   3. `exercices_demonstrations.cours_declares` et `.notions` — LA PARADE À
--      L'IMITATION DE SURFACE. « Les exemples portent TOUJOURS sur un autre
--      thème que l'exercice du jour » (`06-` §2). La table ne portait qu'un
--      `theme` en texte libre, et l'instance ne porte AUCUN thème : la règle
--      n'était donc vérifiable par rien. ⭐ Décision du PO du 22/08 : la
--      comparaison se fait sur le RATTACHEMENT AU COURS et sur les NOTIONS —
--      l'exercice les porte déjà (`exercices_sujets.notions`,
--      `exercices_sujets_cours`, `exercices_textes_cours`), la démonstration
--      pas encore. Une démonstration est ÉCARTÉE si elle partage le cours de
--      l'exercice, ou NE SERAIT-CE QU'UNE de ses notions.
--      ⚠️ NULLABLES à dessein : « ne déclare rien » n'est pas « ne porte aucune
--         notion ». Une démonstration qui ne déclare rien n'est pas écartable —
--         elle est SERVIE, et une trace serveur avertit le professeur que la
--         parade n'a pas pu être vérifiée sur elle (décision du PO). Le
--         REMPLISSAGE de ces deux colonnes appartient à C4-L8 : le format
--         d'import (`08-FORMAT_IMPORT.md` §5 bis) ne les connaît pas encore.
--
--   4. `scriptorium_params.vf_delai_jours` — L'ÉCHÉANCE DE LA VERSION FINALE.
--      « La vf se rend le même jour que la v1 quand c'est possible, sinon dans
--      les TROIS À QUATRE JOURS — et JAMAIS À CHEVAL SUR DEUX SEMAINES de
--      travail » (`06-` §2 ; `01-` §11). « Acté sur le principe ; les modalités
--      suivent l'emploi du temps réel » : l'échéance SE RÈGLE, elle ne se grave
--      pas en dur. Le domaine est borné par la source — 1 à 4 jours — et le
--      défaut est 3. Le « jamais à cheval » n'est pas un réglage : c'est un
--      plafond que le code applique par-dessus, sur le calendrier réel.
--
-- Additive et gatée → protocole NORMAL. Aucune table créée, aucune policy
-- touchée, aucune colonne existante modifiée, aucun `update` de donnée.
-- Les trois colonnes `not null default` naissent avec un défaut RAPIDE (PG 11+,
-- aucune réécriture de table), et leurs gardes revalident les lignes existantes
-- au moment de la pose.
--
-- ⚠️ Les six interrupteurs restent à OFF. L'écran naît derrière
--    `exercices_actif` (`07-` §1.5, §5), qui est au professeur — ce lot n'en
--    détourne aucun autre et n'en crée pas un septième : `exercices_actif`
--    répond exactement à « les élèves peuvent-ils faire des exercices ? ».
-- ============================================================================

begin;

-- ── 1. L'INSTRUMENTATION DU FAISCEAU ────────────────────────────────────────
alter table public.exercices_depots
  add column if not exists saisie_telemetrie jsonb not null default '{}'::jsonb;

comment on column public.exercices_depots.saisie_telemetrie is
  'Trois des sept signaux du faisceau (06- §6), PAR VERSION : {"v1": {...}, "vf": {...}}. '
  'Chaque version porte des MESURES, jamais un verdict — signes_saisis, ms_actifs, '
  'plus_grand_ajout, sessions. Le rythme (« neuf cents signes par minute n''est pas tapé '
  'par un élève ») se RECALCULE à la lecture ; le stocker en ferait un second domicile. '
  'Tous tagués, aucun bloquant : la convergence seule fait un drapeau, par signalerEnAttenteIA.';

-- La garde : un objet, dont chaque clé est une version connue et chaque valeur
-- un objet de compteurs ENTIERS POSITIFS. Le domaine des versions est fermé —
-- `v1` et `vf` sont les deux états d'un dépôt (§1.1), pas une liste ouverte.
create or replace function public.saisie_telemetrie_bien_formee(t jsonb)
returns boolean
language sql
immutable
as $function$
  select t is null
      or (jsonb_typeof(t) = 'object'
          and not exists (
            select 1 from jsonb_each(t) e
             where e.key not in ('v1', 'vf')
                or jsonb_typeof(e.value) <> 'object'
                or exists (
                     select 1 from jsonb_each(e.value) c
                      where c.key not in ('signes_saisis', 'ms_actifs',
                                          'plus_grand_ajout', 'sessions')
                         or jsonb_typeof(c.value) <> 'number'
                         or (c.value)::numeric < 0
                         or (c.value)::numeric <> trunc((c.value)::numeric)
                   )
          ));
$function$;

do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'depots_saisie_telemetrie_chk'
                    and conrelid = 'public.exercices_depots'::regclass) then
    alter table public.exercices_depots
      add constraint depots_saisie_telemetrie_chk
      check (public.saisie_telemetrie_bien_formee(saisie_telemetrie));
  end if;
end $$;

-- ── 2. LE COMPTEUR D'AIDE ───────────────────────────────────────────────────
alter table public.exercices_depots
  add column if not exists aide_consommee integer not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'depots_aide_consommee_chk'
                    and conrelid = 'public.exercices_depots'::regclass) then
    alter table public.exercices_depots
      add constraint depots_aide_consommee_chk check (aide_consommee >= 0);
  end if;
end $$;

comment on column public.exercices_depots.aide_consommee is
  'Le compteur de l''ÉCRAN (01- §11, « dépliages de la fiche et relectures », définition '
  'provisoire) : les dépliages de la DÉMONSTRATION du temps 1 et du GUIDE de l''appui, plus '
  'les RELECTURES du retour. Décision du PO du 22/08 — « la fiche » du 01- §11 est la fiche '
  'de compétence dite à l''élève (06- §5), qui n''a pas d''écran avant C6-L2. C''est C4-L3 qui '
  'la porte et la passe à traiterDepot ; la chaîne la RECOPIE dans competences_mesures et ne '
  'la calcule jamais. Elle vit ici parce qu''elle doit survivre à un rechargement.';

-- ── 3. LA PARADE À L'IMITATION DE SURFACE ───────────────────────────────────
-- NULLABLES : « ne déclare rien » ≠ « ne porte aucune notion ». Le tableau vide
-- est une déclaration (« aucune notion »), le NULL est une absence de déclaration
-- — et c'est cette absence que l'écran signale au professeur au lieu d'écarter.
alter table public.exercices_demonstrations
  add column if not exists cours_declares text[];
alter table public.exercices_demonstrations
  add column if not exists notions text[];

comment on column public.exercices_demonstrations.cours_declares is
  'Le rattachement au cours de la DÉMONSTRATION, pour la parade à l''imitation de surface : '
  '« les exemples portent toujours sur un AUTRE THÈME que l''exercice du jour » (06- §2). '
  'NULL = non déclaré (la démonstration est servie, et le professeur en est averti) ; '
  '{} = déclaré sans cours. Le remplissage appartient à C4-L8 (08- §5 bis).';
comment on column public.exercices_demonstrations.notions is
  'Les notions de la DÉMONSTRATION. Une démonstration est écartée si elle partage le cours '
  'de l''exercice OU NE SERAIT-CE QU''UNE de ses notions (décision du PO, 22/08). '
  'NULL = non déclaré ; {} = déclaré sans notion. Remplissage : C4-L8.';

-- ── 4. L'ÉCHÉANCE DE LA VERSION FINALE ──────────────────────────────────────
-- « Sinon dans les TROIS À QUATRE JOURS » (06- §2) : le domaine vient de la
-- source, le défaut est 3. ⚠️ Ce réglage est un DÉLAI, pas l'échéance : le
-- « jamais à cheval sur deux semaines de travail » est un plafond que le code
-- applique par-dessus, sur le calendrier réel (01- §11).
alter table public.scriptorium_params
  add column if not exists vf_delai_jours integer not null default 3;

do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'params_vf_delai_chk'
                    and conrelid = 'public.scriptorium_params'::regclass) then
    alter table public.scriptorium_params
      add constraint params_vf_delai_chk check (vf_delai_jours between 1 and 4);
  end if;
end $$;

comment on column public.scriptorium_params.vf_delai_jours is
  'Le délai maximal de rendu de la version finale, en jours (06- §2 : « le même jour quand '
  'c''est possible, sinon dans les trois à quatre jours »). L''échéance SE RÈGLE, elle ne se '
  'grave pas en dur. Le « JAMAIS À CHEVAL SUR DEUX SEMAINES de travail » n''est pas un '
  'réglage : c''est un plafond appliqué par le code sur le calendrier réel.';

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. Dix drapeaux, tous attendus à `t`.
-- ============================================================================
select
  -- (1) La télémétrie du faisceau : la colonne, sa garde, ce qu'elle accepte
  --     et surtout ce qu'elle REFUSE.
  exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'exercices_depots'
             and column_name = 'saisie_telemetrie'
             and is_nullable = 'NO'
             and column_default = '''{}''::jsonb')                     as telemetrie_posee,
  exists (select 1 from pg_constraint where conname = 'depots_saisie_telemetrie_chk'
            and conrelid = 'public.exercices_depots'::regclass)         as telemetrie_gardee,
  public.saisie_telemetrie_bien_formee('{}'::jsonb)
  and public.saisie_telemetrie_bien_formee(null)
  and public.saisie_telemetrie_bien_formee(
        '{"v1":{"signes_saisis":1420,"ms_actifs":730000,"plus_grand_ajout":37,"sessions":3},'
        '"vf":{"signes_saisis":210,"ms_actifs":95000,"plus_grand_ajout":22,"sessions":1}}'::jsonb)
                                                                        as telemetrie_licite_passe,
  -- Une version inconnue, un compteur inconnu, un négatif, un décimal, une
  -- chaîne, un scalaire : tous refusés. Un domaine ouvert ne se garde pas.
  not public.saisie_telemetrie_bien_formee('{"v2":{"sessions":1}}'::jsonb)
  and not public.saisie_telemetrie_bien_formee('{"v1":{"vitesse":900}}'::jsonb)
  and not public.saisie_telemetrie_bien_formee('{"v1":{"sessions":-1}}'::jsonb)
  and not public.saisie_telemetrie_bien_formee('{"v1":{"sessions":1.5}}'::jsonb)
  and not public.saisie_telemetrie_bien_formee('{"v1":{"sessions":"3"}}'::jsonb)
  and not public.saisie_telemetrie_bien_formee('{"v1":3}'::jsonb)
  and not public.saisie_telemetrie_bien_formee('[]'::jsonb)             as telemetrie_faux_refuses,

  -- (2) Le compteur d'aide.
  exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'exercices_depots'
             and column_name = 'aide_consommee'
             and data_type = 'integer' and is_nullable = 'NO'
             and column_default = '0')
  and exists (select 1 from pg_constraint where conname = 'depots_aide_consommee_chk'
                and conrelid = 'public.exercices_depots'::regclass)     as aide_posee,

  -- (3) La parade : deux colonnes NULLABLES — l'absence de déclaration doit
  --     rester distinguable du tableau vide.
  (select count(*) = 2 from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_demonstrations'
      and column_name in ('cours_declares', 'notions')
      and data_type = 'ARRAY' and is_nullable = 'YES')                  as parade_posee,
  (select count(*) = 2 from public.exercices_demonstrations
    where cours_declares is null and notions is null)                   as demos_non_declarees,

  -- (4) L'échéance réglable : le défaut de la source, et son domaine.
  (select vf_delai_jours = 3 from public.scriptorium_params where id = 1)
  and exists (select 1 from pg_constraint where conname = 'params_vf_delai_chk'
                and conrelid = 'public.scriptorium_params'::regclass)   as echeance_posee,

  -- (5) ⭐ AUCUNE POLICY ÉLÈVE N'A ÉTÉ OUVERTE — ni par ce fichier, ni avant.
  --     Sur les 39 tables du moteur : une seule policy par table, `*_prof_all`,
  --     et son prédicat exige `profiles.role = 'prof'`. Le piège 42 est tenu
  --     a fortiori, `exercices_cas`/`_squelettes`/`_metacognition` comprises.
  (select count(*) = 0 from pg_policies
    where schemaname = 'public'
      and (tablename like 'exercices%' or tablename like 'competences%'
           or tablename like 'monitoring%' or tablename = 'routeur_decisions'
           or tablename = 'assiduite_hebdo' or tablename = 'demonstrations_formes')
      and policyname not like '%\_prof\_all')                           as zero_policy_eleve,

  -- (6) Les six interrupteurs n'ont pas bougé.
  (select not (exercices_actif or routeur_actif or competences_affichage_actif
               or fabrique_actif or chaine_actif or passation_classe_actif)
     from public.scriptorium_params where id = 1)                       as les_six_toujours_a_off;
