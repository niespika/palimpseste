-- ============================================================================
-- C4 · L9 — LA CONCEPTION DES EXAMENS DIAGNOSTIQUES : rendre les deux types
--            CONCEVABLES, et poser les deux gardes que la conception exige.
-- ----------------------------------------------------------------------------
-- « Toute ancre naît là. Une ancre est une mesure dont le `lieu` vaut `classe`
--   et la `forme` `sommatif` (`01-` §10), et elle passe toujours par l'un des
--   DEUX TYPES D'EXAMEN DIAGNOSTIQUE — l'essai dans Codex, l'explication de
--   texte dans Aletheia. »                                    — `07-` §2, C4-L9
--
-- ⚠️ CE QUE CE FICHIER NE FAIT PAS, ET POURQUOI.
--    1. IL NE CRÉE AUCUNE TABLE. Le schéma est joué (C4-L1), la fabrique aussi
--       (C4-L8), la passation aussi (C4-L4). Tout ce dont ce lot a besoin
--       existe déjà — jusqu'à la clé vers le plan.
--    2. IL NE POSE AUCUNE COLONNE SUR `scriptorium_exercices_planifies`
--       (décision de Louis, 22/08). La clé qui relie la ligne de plan à
--       l'instance EXISTE, et elle est posée DANS L'AUTRE SENS :
--       `exercices.exercice_planifie_id` (`c4_l1_schema.sql` l. 329), déclarée
--       au `07-` §1.1. Un second `exercice_id` à côté de `quiz_id` et de
--       `codex_session_id` ferait DEUX DOMICILES POUR UN SEUL LIEN, et rien ne
--       les tiendrait d'accord. `exercices_lien_module_chk` n'est donc pas
--       touchée : elle ne parle que du quiz et de la session Codex.
--    3. IL NE RENOMME RIEN DANS `scriptorium_exercices_planifies` —
--       `diagnostique`, `fenetre_diagnostique` et `origine = 'diagnostic'`
--       RESTENT. Renoncement chiffré et assumé : ≈ 50 sites, une migration sur
--       une table VIVANTE, et aucune ambiguïté dans cette table — elle ne parle
--       jamais de crans. Prix assumé : deux vocabulaires, qui ne se rencontrent
--       qu'à la clé du point 2.
--    4. IL NE REMPLIT NI `grain` NI `crans_admis` sur les deux lignes.
--       `types_complet_sans_objet_ni_cran_chk` l'interdit — « un exercice
--       complet n'a NI OBJET NI CRAN », et « lui laisser un grain fabriquerait
--       une DURÉE FANTÔME » : un diagnostique passé en classe n'est pas
--       décompté au budget de l'élève.
--    5. IL NE TOUCHE PAS `competences` sur ces deux lignes : elle porte LES SIX
--       et c'est un PLAFOND (`c4_l1_seed.sql`). Ce qui est réellement mesuré
--       est l'intersection avec ce que la classe déclare évaluable, et la
--       chaîne la fait toute seule. L'arrêté du `01-` §10 — trois compétences
--       pour l'essai, quatre pour l'explication — va sur l'INSTANCE, en
--       `modes_par_competence`, jamais ici.
--    6. IL NE CRÉE AUCUNE FONCTION `security definer`. La seule fonction posée
--       est un TRIGGER `security invoker` (le défaut, et le bon : les écritures
--       passent par le serveur avec la clé de service, qui passe déjà outre
--       RLS ; un `definer` ouvrirait une porte que personne n'a demandée).
--    7. IL N'OUVRE AUCUNE POLICY ÉLÈVE. Le patron du moteur est « RLS active
--       partout, policy PROF `for all`, AUCUNE policy élève » ; la vérification
--       en pied le ré-éprouve par requête.
--
-- CE QU'IL FAIT — quatre gestes, et rien d'autre :
--
--   1. LE RENOMMAGE DES DEUX CODES DE TYPE (tranché le 22/08).
--      `diagnostic_essai`             → `examen_diagnostique_essai`
--      `diagnostic_explication_texte` → `examen_diagnostique_explication_texte`
--      Le motif : CINQ codes partageaient le préfixe `diagnostic_` — TROIS pour
--      le geste `diagnostiquer` (`diagnostic_guide`, `diagnostic_nomme`,
--      `diagnostic_fin`, les crans de `02-` §2.2) et DEUX pour l'ANCRE, qui
--      n'ont rien à voir. Le geste `diagnostiquer` est un cran d'un objet ;
--      l'examen diagnostique est une copie entière, macro par construction et
--      hors routage (`01-` §10).
--      ⚠️ POURQUOI ICI ET PAS DANS `c4_l1_seed.sql` : ce seed est DÉJÀ JOUÉ, et
--         éditer une migration jouée la ferait mentir sur ce qui a tourné.
--         (`c4_l1_seed.sql` et son rollback sont tout de même mis à jour POUR
--         LA BASE NEUVE — exception assumée, dite au `SUIVI_SQL.md`.)
--      ✓ SANS RISQUE, VÉRIFIÉ PAR REQUÊTE LE 22/08 : les sept clés étrangères
--        qui pointent `exercices_types` pointent toutes son `id`, jamais son
--        `code` ; et aucune ligne d'`exercices_routes.objet_code` — la seule
--        colonne texte qui recopie un code — ne porte l'un des deux anciens.
--
--   2. CE QUE LA MISSION NOMME SUR CES DEUX LIGNES.
--      · `genres_admis` — la PLAGE ADMISE. `dissertation_tc` et `essai_hlp`
--        pour l'essai ; `explication_texte_tc` et `interpretation_hlp` pour
--        l'explication (`07-` §2 ; les valeurs au `02-` §1.3).
--        ⚠️ « Le `genre` se renseigne sur l'INSTANCE, jamais sur le type »
--           (`02-` §1.3) NE SE CONTREDIT PAS : sur le TYPE, `genres_admis` est
--           la plage ; sur l'INSTANCE, `exercices.genre` est l'ÉLECTION, et
--           elle ne vaut que pour les TROIS OBJETS TERMINAUX. Deux colonnes
--           distinctes : la plage ne descend jamais sur l'instance, l'élection
--           ne remonte jamais sur le type.
--      · `exclusions_parcours` — `'{}'`, ÉCRIT EXPLICITEMENT. « Est exclu
--        l'élève dont TOUS ses parcours figurent dans la liste » (`02-` §4), et
--        « les deux listes de la semaine 1 sont IDENTIQUES EN TC ET EN HLP »
--        (`01-` §10) : les deux examens vont à tout le monde, dans les deux
--        parcours. La seule exclusion écrite au corpus est la problématisation
--        → `["hlp"]`, et il n'y en a pas d'autre à inventer.
--      · `mode_saisie` — `'manuscrit'`. Le `06-` §1 déclare les DEUX canaux
--        diagnostiques manuscrits : « Écriture diagnostique, en classe ·
--        manuscrit → photos → transcription → contrôle par l'élève », idem pour
--        la lecture. La valeur se POSE plutôt que de rester nulle en silence.
--        (L'exemption de lisibilité reste au profil de l'élève —
--        `profiles.mode_saisie_force = 'ecran'` bascule tous ses types
--        manuscrits, `07-` §1.3 ; C4-L4 la lit déjà.)
--      · `libelle` — le dériveur le remplit sur les treize objets et ne
--        touchera jamais ces deux lignes (voir l'avertissement ci-dessous) : il
--        resterait vide si personne ne l'écrivait, et l'écran de conception
--        n'aurait qu'un code à afficher. Les deux libellés recopient le
--        vocabulaire des sources — « examen diagnostique » (`01-` §10, `07-`
--        §2), « un essai + une explication de texte » (`01-` §10).
--      ⚠️⚠️ ET PERSONNE NE RELIRA CES DEUX LIGNES. `scripts/derive-doctrine.py`
--         écrit bien `exercices_types` (`crans_admis`, `exclusions_parcours`,
--         `libelle`) — MAIS SEULEMENT SUR LES TREIZE OBJETS : son `update`
--         joint sur `t.code = v.code` où `v` est la table des objets. Et son
--         `--verifie` compte `exercices_types where nature <> 'complet'` : il
--         est AVEUGLE à ces deux lignes PAR CONSTRUCTION. Elles sont hors de
--         toute dérivation et de tout contrôle machine — ce qui est écrit ici à
--         la main y reste, juste ou faux. C'est pourquoi la vérification en
--         pied de ce fichier les recompte valeur par valeur.
--
--   3. L'UNICITÉ DE LA LIGNE DE PLAN — `uk_exercices_planifie`.
--      `idx_exercices_planifie` existe (`c4_l1_schema.sql` l. 388) mais IL
--      N'EST PAS UNIQUE : rien n'empêche aujourd'hui deux instances de
--      revendiquer la même ligne de plan. L'index unique partiel rend vraie la
--      règle « une ligne de plan ⇔ AU PLUS UNE instance », sur le patron de
--      `uk_exercices_quiz` et `uk_exercices_codex_session`.
--      ⭐ CE QU'IL CHANGE À LA CONCEPTION : L'INSERTION DE L'INSTANCE DEVIENT
--         LE CLAIM. Deux onglets qui conçoivent la même ligne de plan, le
--         second PERD SUR L'INDEX — pas sur un `UPDATE` conditionnel —, et il
--         perd AVANT d'avoir écrit quoi que ce soit. (Le patron `quiz_id` avait
--         besoin d'un claim-`UPDATE` parce que son lien vivait du mauvais côté ;
--         celui-ci n'en a pas besoin.)
--      ⚠️ AUCUNE DÉCOUPE PAR STATUT, et c'est voulu. `exercices` ne porte NI
--         `supprime_at` NI statut `retire` — ses quatre statuts sont
--         `a_concevoir → concu → assigne → clos` (§1.1) : il n'y a pas de
--         tombstone à exclure. Exclure `clos` rendrait la LECTURE INVERSE
--         (de la ligne de plan vers son instance) vide dès l'examen terminé —
--         or le « fait quand » exige que « les deux se retrouvent l'une
--         l'autre », par UNE SEULE COLONNE ET DEUX LECTURES.
--      ⚠️ `idx_exercices_planifie` EST LAISSÉ EN PLACE. Il devient redondant
--         (même clé, même prédicat) et il appartient à C4-L1 ; les migrations
--         de ce lot sont ADDITIVES, et aucun piège ne demande de le retirer.
--         Le retrait est signalé au relevé, il n'est pas fait ici.
--
--   4. LE MUR, ET IL EST EN BASE : `exercices_cran_chk`.
--      `check (statut = 'a_concevoir' or cran is not null)` (`c4_l1_schema.sql`
--      l. 362). Une instance d'examen diagnostique N'A PAS DE CRAN — son type
--      est `complet`, et `types_complet_sans_objet_ni_cran_chk` lui interdit
--      d'en admettre un. DÈS QUE LA CONCEPTION POSE `statut = 'concu'`, LA
--      CONTRAINTE REFUSE LA LIGNE. La garde est juste pour les treize objets ;
--      elle n'a jamais vu la troisième nature.
--      ⛔ ON NE CONTOURNE PAS EN INVENTANT UN CRAN : un cran faux ferait dériver
--         `regime_v1vf` (`02-` §2.2), `couverture_observables` et la durée.
--      Un `CHECK` ne peut pas lire une autre table, et le discriminant —
--      `nature = 'complet'` — vit sur `exercices_types`. Deux voies propres
--      étaient ouvertes (`07-` §1 : « la forme physique appartient à la session
--      Code ») : un TRIGGER qui joint le type, ou un DISCRIMINANT PORTÉ PAR LA
--      LIGNE (le patron existe : `paire_diagnostic`).
--      ⭐ RETENU : LE TRIGGER. Le motif est celui que le §1 répète — « deux
--         copies d'un même chiffre finissent par diverger ». `nature` vit sur
--         le type, `exercices.type_id` est `not null` : recopier `complet` sur
--         chaque instance fabriquerait un second domicile pour une valeur
--         dérivable. `paire_diagnostic` n'est pas un contre-exemple : elle
--         n'est PAS dérivable du type — c'est un choix de conception, et c'est
--         pour cela qu'elle a dû vivre sur la ligne.
--      ⭐ ET LE TRIGGER EST STRICTEMENT PLUS FORT que ce qu'un discriminant
--         aurait acheté : il tient LES DEUX SENS. Un `CHECK` n'aurait jamais pu
--         exprimer le second — « une instance d'un type `complet` ne porte
--         JAMAIS de cran » —, et rien ne l'interdisait jusqu'ici.
--      Ce que le trigger dit, exactement :
--        · type `complet`  → `cran` TOUJOURS NULL (les deux examens) ;
--        · type non complet → `cran` obligatoire dès que le statut quitte
--          `a_concevoir` (LA RÈGLE D'AVANT, MOT POUR MOT, pour les treize).
--      Le changement est écrit au `07-` §1 depuis le relevé de cette séance,
--      comme le §1 le permet (« ouvert à l'implémentation »).
--
-- Additive et gatée → protocole NORMAL pour les gestes 1, 2 et 3. ⚠️ Le geste 4
-- REMPLACE une contrainte existante sur `exercices`, qui porte des LIGNES DE
-- RECETTE : la répétition à blanc (règle 6 du `SUIVI_SQL.md`) est jouée
-- d'abord, corps seul entre le `begin;` et le `commit;`, et le retour à l'état
-- d'avant vérifié PAR REQUÊTE.
--
-- ⚠️ Les six interrupteurs restent à OFF. L'écran de conception de ce lot vit
--    derrière `fabrique_actif` (comme le reste de la fabrique) et le signal de
--    l'élève derrière `exercices_actif` — ce lot n'en crée pas un septième et
--    n'en détourne aucun. `plan_evaluation_actif`, qui commande la lecture du
--    plan, appartient au professeur et n'est pas touché.
-- ============================================================================

begin;

-- ── 1. LE RENOMMAGE DES DEUX CODES ──────────────────────────────────────────
-- Idempotent : rejoué, le `where` ne trouve plus rien et rien ne bouge.
update public.exercices_types
   set code = 'examen_diagnostique_essai', updated_at = now()
 where code = 'diagnostic_essai';

update public.exercices_types
   set code = 'examen_diagnostique_explication_texte', updated_at = now()
 where code = 'diagnostic_explication_texte';

-- ── 2. CE QUE LA MISSION NOMME ──────────────────────────────────────────────
-- L'ESSAI — Codex, l'écriture diagnostique.
update public.exercices_types
   set genres_admis        = array['dissertation_tc', 'essai_hlp'],
       exclusions_parcours = '{}',
       mode_saisie         = 'manuscrit',
       libelle             = 'L''examen diagnostique — l''essai',
       updated_at          = now()
 where code = 'examen_diagnostique_essai';

-- L'EXPLICATION DE TEXTE — Aletheia, la lecture diagnostique.
update public.exercices_types
   set genres_admis        = array['explication_texte_tc', 'interpretation_hlp'],
       exclusions_parcours = '{}',
       mode_saisie         = 'manuscrit',
       libelle             = 'L''examen diagnostique — l''explication de texte',
       updated_at          = now()
 where code = 'examen_diagnostique_explication_texte';

comment on column public.exercices_types.genres_admis is
  'La PLAGE ADMISE de genres du type (02- §1.3). À ne pas confondre avec exercices.genre, '
  'qui est l''ÉLECTION, faite sur l''INSTANCE et RÉSERVÉE AUX TROIS OBJETS TERMINAUX '
  '(introduction, conclusion, partie). Deux colonnes distinctes : la plage ne descend jamais '
  'sur l''instance, l''élection ne remonte jamais sur le type. Sur les deux examens '
  'diagnostiques, la plage borne le MATÉRIAU offert à la conception (le sujet, dans Codex).';

-- ── 3. L'UNICITÉ DE LA LIGNE DE PLAN ────────────────────────────────────────
-- « Une ligne de plan ⇔ AU PLUS UNE instance. » L'insertion devient le claim.
create unique index if not exists uk_exercices_planifie
  on public.exercices (exercice_planifie_id)
  where exercice_planifie_id is not null;

comment on index public.uk_exercices_planifie is
  'Une ligne de plan ⇔ AU PLUS UNE instance (C4-L9). Patron de uk_exercices_quiz / '
  'uk_exercices_codex_session, sans leur découpe `supprime_at is null` : `exercices` ne porte '
  'ni soft-delete ni statut `retire`, il n''y a aucun tombstone à exclure. AUCUNE découpe par '
  'statut non plus — exclure `clos` rendrait vide la lecture INVERSE (de la ligne de plan vers '
  'son instance), que le « fait quand » de C4-L9 exige. C''est l''INSERTION qui claime : deux '
  'onglets qui conçoivent la même ligne, le second perd ici, AVANT d''avoir rien écrit.';

-- ── 4. LE MUR — LA GARDE DU CRAN, QUI JOINT LE TYPE ─────────────────────────
-- `exercices_cran_chk` ne pouvait pas lire `exercices_types.nature` : un CHECK
-- ne lit jamais une autre table. Le trigger le peut, et il tient LES DEUX SENS.
alter table public.exercices drop constraint if exists exercices_cran_chk;

create or replace function public.garde_cran_selon_le_type()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
  v_nature text;
begin
  select t.nature into v_nature
    from public.exercices_types t
   where t.id = new.type_id;

  -- La FK `exercices_type_id_fkey` garantit la ligne ; un NULL ici ne peut
  -- venir que d'un appelant à qui RLS cache `exercices_types`. On le dit.
  if v_nature is null then
    raise exception
      'type d''exercice illisible (%) : la garde du cran ne peut pas se prononcer', new.type_id
      using errcode = '23514',
            hint = 'Les écritures d''`exercices` passent par le serveur, avec la clé de '
                   'service. Une écriture faite sous un rôle soumis à RLS ne voit pas '
                   '`exercices_types` et tombe ici.';
  end if;

  if v_nature = 'complet' then
    -- « Un exercice complet n'a NI OBJET NI CRAN » : la troisième nature.
    if new.cran is not null then
      raise exception
        'un examen complet n''a NI OBJET NI CRAN : cette instance ne peut pas porter le cran « % »',
        new.cran
        using errcode = '23514',
              hint = 'Un cran faux ferait dériver `regime_v1vf` (02- §2.2), '
                     '`couverture_observables` et la durée. Un examen diagnostique est une '
                     'COPIE ENTIÈRE, macro par construction et hors routage (01- §10).';
    end if;
  else
    -- La règle d'avant, mot pour mot, pour les treize objets.
    if new.statut <> 'a_concevoir' and new.cran is null then
      raise exception
        'une instance conçue porte son cran : statut « % » sans cran', new.statut
        using errcode = '23514',
              hint = 'Le cran est élu à la conception parmi les `crans[]` du type (07- §1.1).';
    end if;
  end if;

  return new;
end;
$function$;

comment on function public.garde_cran_selon_le_type() is
  'Remplace `exercices_cran_chk` (C4-L1), qu''un CHECK ne pouvait pas rendre juste : le '
  'discriminant — `exercices_types.nature` — vit dans une AUTRE TABLE. Deux sens : un type '
  '`complet` (les deux examens diagnostiques) ne porte JAMAIS de cran ; tout autre type en '
  'porte un dès que le statut quitte `a_concevoir`. `security invoker` (le défaut) : les '
  'écritures passent par le serveur avec la clé de service, un `definer` ouvrirait une porte '
  'que personne n''a demandée. C4-L9, 07- §1 (« la forme physique appartient à la session Code »).';

drop trigger if exists trg_exercices_cran_selon_le_type on public.exercices;
create trigger trg_exercices_cran_selon_le_type
  before insert or update on public.exercices
  for each row execute function public.garde_cran_selon_le_type();

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. Quinze drapeaux, tous attendus `t`.
-- ⚠️ Ces deux lignes sont HORS de toute dérivation et de tout contrôle machine
--    (`derive-doctrine.py --verifie` compte `nature <> 'complet'`) : ce bloc est
--    LE SEUL qui les relise. Il les compte valeur par valeur.
-- ============================================================================
select
  -- (1) Le renommage : les deux codes neufs sont là, les deux anciens partis.
  (select count(*) = 2 from public.exercices_types
    where code in ('examen_diagnostique_essai', 'examen_diagnostique_explication_texte'))
                                                                as codes_renommes,
  not exists (select 1 from public.exercices_types
               where code in ('diagnostic_essai', 'diagnostic_explication_texte'))
                                                                as anciens_codes_partis,

  -- (2) `genres_admis` — la plage, exactement celle du `02-` §1.3.
  (select genres_admis = array['dissertation_tc', 'essai_hlp']
     from public.exercices_types where code = 'examen_diagnostique_essai')
                                                                as genres_essai,
  (select genres_admis = array['explication_texte_tc', 'interpretation_hlp']
     from public.exercices_types where code = 'examen_diagnostique_explication_texte')
                                                                as genres_explication,

  -- (3) `exclusions_parcours` VIDE sur les deux : les deux examens vont à tout
  --     le monde, dans les deux parcours (`01-` §10 ; `02-` §4).
  (select count(*) = 2 from public.exercices_types
    where nature = 'complet' and exclusions_parcours = '{}')     as aucune_exclusion,
  -- Et la SEULE exclusion du corpus reste celle de la problématisation.
  (select count(*) = 1 from public.exercices_types
    where coalesce(array_length(exclusions_parcours, 1), 0) > 0
      and code = 'problematisation')                             as seule_exclusion_intacte,

  -- (4) `mode_saisie` et `libelle` posés — le `06-` §1 déclare les deux canaux
  --     MANUSCRITS ; le libellé ne se dérivera jamais tout seul.
  (select count(*) = 2 from public.exercices_types
    where nature = 'complet' and mode_saisie = 'manuscrit'
      and libelle is not null and libelle <> '')                 as manuscrit_et_libelle,

  -- (5) RIEN N'A ÉTÉ REMPLI DE PLUS : ni grain, ni crans. La garde
  --     `types_complet_sans_objet_ni_cran_chk` le tient, ce drapeau le montre.
  (select count(*) = 0 from public.exercices_types
    where nature = 'complet'
      and (grain is not null or coalesce(array_length(crans_admis, 1), 0) <> 0))
                                                                as ni_grain_ni_cran,
  -- Et `competences` porte toujours LES SIX : c'est un PLAFOND, pas l'arrêté du
  -- `01-` §10 (qui va sur l'instance, en `modes_par_competence`).
  (select count(*) = 2 from public.exercices_types
    where nature = 'complet' and array_length(competences, 1) = 6)
                                                                as plafond_des_six,

  -- (6) LES TREIZE OBJETS SONT INTACTS — le renommage n'a touché personne
  --     d'autre, et la dérivation les régénère toujours à l'identique.
  (select count(*) = 13 from public.exercices_types
    where nature in ('moment', 'element'))                       as les_treize_intacts,

  -- (7) L'index unique : il existe, il est UNIQUE, il est PARTIEL.
  exists (select 1 from pg_indexes
           where schemaname = 'public' and tablename = 'exercices'
             and indexname = 'uk_exercices_planifie'
             and indexdef like 'CREATE UNIQUE INDEX%'
             and indexdef like '%WHERE (exercice_planifie_id IS NOT NULL)%')
                                                                as unicite_posee,

  -- (8) Le mur : l'ancienne contrainte est partie, le trigger la remplace.
  not exists (select 1 from pg_constraint where conname = 'exercices_cran_chk'
                and conrelid = 'public.exercices'::regclass)
  and exists (select 1 from pg_trigger
               where tgname = 'trg_exercices_cran_selon_le_type'
                 and tgrelid = 'public.exercices'::regclass
                 and not tgisinternal)                           as mur_remplace,
  -- `security invoker` (le défaut) et `search_path` épinglé.
  (select not p.prosecdef and p.proconfig @> array['search_path=public, pg_temp']
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'garde_cran_selon_le_type')
                                                                as garde_invoker_et_search_path,

  -- (9) ⭐ AUCUNE POLICY ÉLÈVE N'A ÉTÉ OUVERTE — ni par ce fichier, ni avant.
  (select count(*) = 0 from pg_policies
    where schemaname = 'public'
      and (tablename like 'exercices%' or tablename like 'competences%'
           or tablename like 'monitoring%' or tablename = 'routeur_decisions'
           or tablename = 'assiduite_hebdo' or tablename = 'demonstrations_formes')
      and policyname not like '%\_prof\_all')                    as zero_policy_eleve,

  -- (10) Les six interrupteurs n'ont pas bougé.
  (select not (exercices_actif or routeur_actif or competences_affichage_actif
               or fabrique_actif or chaine_actif or passation_classe_actif)
     from public.scriptorium_params where id = 1)                as les_six_toujours_a_off;

-- ============================================================================
-- L'ÉPREUVE DU MUR — le trigger se PROUVE en écrivant, pas en se lisant.
-- Tout se joue dans une transaction ROLLBACKÉE : rien n'en sort.
-- Quatre drapeaux, tous attendus `t`.
-- ============================================================================
begin;

create temp table epreuve_mur(quoi text primary key, verdict boolean) on commit drop;

-- (a) Un examen diagnostique `concu` SANS CRAN passe — c'est tout l'objet du lot.
do $$
declare v_type uuid; v_id uuid;
begin
  select id into v_type from public.exercices_types where code = 'examen_diagnostique_essai';
  insert into public.exercices (type_id, lieu, consigne_instanciee, statut)
       values (v_type, 'classe', to_jsonb('épreuve du mur'::text), 'concu')
    returning id into v_id;
  insert into epreuve_mur values ('examen_concu_sans_cran_passe', true);
  delete from public.exercices where id = v_id;
exception when others then
  insert into epreuve_mur values ('examen_concu_sans_cran_passe', false);
end $$;

-- (b) Un examen diagnostique AVEC un cran est REFUSÉ — le second sens, que le
--     CHECK d'origine ne pouvait pas exprimer.
do $$
declare v_type uuid;
begin
  select id into v_type from public.exercices_types where code = 'examen_diagnostique_essai';
  insert into public.exercices (type_id, lieu, consigne_instanciee, statut, cran)
       values (v_type, 'classe', to_jsonb('épreuve du mur'::text), 'concu', '3');
  insert into epreuve_mur values ('examen_avec_cran_refuse', false);
exception when others then
  insert into epreuve_mur values ('examen_avec_cran_refuse', true);
end $$;

-- (c) Un OBJET `concu` sans cran reste REFUSÉ — la règle d'avant, mot pour mot.
do $$
declare v_type uuid;
begin
  select id into v_type from public.exercices_types where code = 'argument';
  insert into public.exercices (type_id, lieu, consigne_instanciee, statut)
       values (v_type, 'maison', to_jsonb('épreuve du mur'::text), 'concu');
  insert into epreuve_mur values ('objet_concu_sans_cran_refuse', false);
exception when others then
  insert into epreuve_mur values ('objet_concu_sans_cran_refuse', true);
end $$;

-- (d) L'UNICITÉ : deux instances ne revendiquent pas la même ligne de plan.
do $$
declare v_type uuid; v_plan uuid; v_a uuid;
begin
  select id into v_type from public.exercices_types where code = 'examen_diagnostique_essai';
  select id into v_plan from public.scriptorium_exercices_planifies
   where id not in (select exercice_planifie_id from public.exercices
                     where exercice_planifie_id is not null)
   limit 1;
  if v_plan is null then
    insert into epreuve_mur values ('deux_instances_meme_plan_refuse', null);
    return;
  end if;
  insert into public.exercices (type_id, lieu, consigne_instanciee, statut, exercice_planifie_id)
       values (v_type, 'classe', to_jsonb('épreuve du mur'::text), 'concu', v_plan)
    returning id into v_a;
  begin
    insert into public.exercices (type_id, lieu, consigne_instanciee, statut, exercice_planifie_id)
         values (v_type, 'classe', to_jsonb('épreuve du mur — la seconde'::text), 'concu', v_plan);
    insert into epreuve_mur values ('deux_instances_meme_plan_refuse', false);
  exception when unique_violation then
    insert into epreuve_mur values ('deux_instances_meme_plan_refuse', true);
  end;
  delete from public.exercices where id = v_a;
end $$;

select quoi, verdict from epreuve_mur order by quoi;

rollback;  -- ⚠️ RIEN de l'épreuve ne reste : la transaction est annulée.

-- Et on le vérifie PAR REQUÊTE, jamais sur la foi du mot « ROLLBACK » affiché.
select count(*) = 0 as aucune_trace_de_l_epreuve
  from public.exercices
 where consigne_instanciee::text like '%épreuve du mur%';
