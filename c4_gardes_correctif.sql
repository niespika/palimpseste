-- ============================================================================
-- C4 — CORRECTIF DE TROIS GARDES. Trouvées en fabriquant `PROMPT_Code_C4_L4.md`
-- le 21/08 : aucune ne fausse une donnée aujourd'hui — les tables concernées
-- sont vides —, et les trois se refermeraient à un coût bien plus élevé une fois
-- la première passation jouée.
-- ----------------------------------------------------------------------------
-- ADDITIVE ET GATÉE → PROTOCOLE NORMAL (`SUIVI_SQL.md` règle 5) : les deux
-- tables touchées sont des tables NEUVES de C4-L1, gatées à OFF ; aucune table
-- ni policy d'un flux existant n'est touchée ; AUCUNE POLICY ÉLÈVE n'est
-- ajoutée (C4-L1 a choisi « aucune policy élève » sur les vingt tables, et ce
-- fichier ne rouvre rien). Il ne crée aucune table, aucune colonne, aucun
-- interrupteur, et ne touche à aucun des cinq interrupteurs existants.
--
-- LES TROIS POINTS :
--
--   1. `garde_depot_lieu` OUBLIAIT `confiance_ocr_vf`. Elle refuse en classe le
--      statut `vf_remis` et QUATRE des CINQ champs de version finale —
--      `texte_vf`, `photos_vf`, `transcription_vf`, `vf_remis_at` — mais pas la
--      confiance de transcription de la version finale. « En classe, la séquence
--      s'arrête à `retour_publie` : IL N'Y A PAS DE VERSION FINALE » (07- §1.1).
--      Une garde qui couvre quatre champs sur cinq laisse croire qu'elle les
--      couvre tous : c'est le trou qu'on ne cherche plus.
--
--   2. `photos_bien_formees` NE CONTRÔLAIT QUE LA PRÉSENCE DES QUATRE CLÉS, pas
--      leur valeur : `{"ordre": null, "rotation": null, "somme_controle": null,
--      "page_manquante": null}` passait. Or le 07- §1.1 demande que `photos[]`
--      « porte l'ORDRE, la ROTATION, une SOMME DE CONTRÔLE, et SACHE DIRE QU'UNE
--      PAGE MANQUE » — une clé nulle ne porte rien et ne dit rien. La garde
--      contrôle désormais LE TYPE de chacune, et refuse le null.
--      ⚠️ ELLE NE BORNE PAS LE DOMAINE DES VALEURS — `rotation` reste « un
--      nombre », et non « un quart de tour ». « La forme physique appartient à
--      la session Code » (07- §1) : c'est C4-L4 qui écrit cette colonne, c'est
--      à lui de dire si une rotation est un quart de tour ou un angle libre.
--      Le défaut corrigé ici est le NULL, pas le domaine.
--
--   3. `retour_segmente_bien_forme` EXISTAIT EN DEUX EXEMPLAIRES.
--      `c4_l5_chaine.sql` a posé la version à UN paramètre (ancrage exigé
--      partout) ; `c4_l5_chaine_complement.sql` a posé celle à DEUX (ancrage
--      exigé du seul texte engendré) SANS retirer la première. Postgres résout
--      un appel à un argument sur la version à un argument — il n'y a donc
--      aucune ambiguïté, et RIEN NE CASSE AUJOURD'HUI : la contrainte
--      `retours_texte_segmente_chk` appelle explicitement celle à deux.
--      Mais LA MÊME RÈGLE A DEUX DOMICILES EN BASE, et le plus ancien porte
--      l'état d'AVANT l'arbitrage du 21/08. Un futur appel à un argument
--      recevrait la règle périmée en silence, et refuserait la remarque sans
--      verbatim que `02-` §6.D, étape 14, autorise. On retire le second domicile.
--      ⚠️ Le fichier REFUSE de partir si quoi que ce soit dépend encore de la
--      version à un paramètre.
--
-- ⚠️ Répétition à blanc : `SUIVI_SQL.md` règle 6 — copier LE CORPS de ce fichier,
--    entre son `begin;` et son `commit;`, dans sa propre transaction d'essai,
--    JAMAIS le fichier entier ; puis `rollback;` et VÉRIFIER PAR REQUÊTE que le
--    schéma est revenu à l'état d'avant.
--
-- Retour arrière : `c4_gardes_correctif_rollback.sql`.
-- ============================================================================

-- ── Constat, AVANT toute chose ─────────────────────────────────────────────
select
  (select count(*) from public.exercices_depots
     where photos_v1 is not null or photos_vf is not null)   as depots_portant_des_photos,
  (select count(*) from public.exercices_depots
     where confiance_ocr_vf is not null)                     as depots_portant_une_confiance_vf,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'retour_segmente_bien_forme')
                                                             as exemplaires_de_la_garde_de_retour,
  (select count(*) from pg_depend d
     join pg_proc p on p.oid = d.refobjid
     join pg_namespace n on n.oid = p.pronamespace
    where d.refclassid = 'pg_proc'::regclass
      and n.nspname = 'public' and p.proname = 'retour_segmente_bien_forme'
      and p.pronargs = 1)                                    as objets_dependant_de_la_version_a_un_arg;

begin;

-- ── 0. Deux refus, avant de toucher quoi que ce soit ───────────────────────
do $$
declare n bigint;
begin
  -- Remplacer une fonction de CHECK ne revalide PAS les lignes existantes :
  -- resserrer la garde sur une table qui porte déjà des photos laisserait des
  -- lignes non conformes, invisibles et légales. La table doit être vide.
  select count(*) into n from public.exercices_depots
   where photos_v1 is not null or photos_vf is not null;
  if n > 0 then
    raise exception 'REFUS : % dépôt(s) portent déjà des photos. Le resserrement de '
      '`photos_bien_formees` ne revalide pas l''existant — écrire la revalidation '
      'avant de jouer ce fichier.', n;
  end if;

  select count(*) into n from public.exercices_depots where confiance_ocr_vf is not null;
  if n > 0 then
    raise exception 'REFUS : % dépôt(s) portent une `confiance_ocr_vf`. La garde de lieu '
      'refuserait leur prochaine écriture — les nettoyer avant de jouer ce fichier.', n;
  end if;

  select count(*) into n from pg_depend d
     join pg_proc p on p.oid = d.refobjid
     join pg_namespace nn on nn.oid = p.pronamespace
    where d.refclassid = 'pg_proc'::regclass
      and nn.nspname = 'public' and p.proname = 'retour_segmente_bien_forme'
      and p.pronargs = 1;
  if n > 0 then
    raise exception 'REFUS : % objet(s) dépendent encore de `retour_segmente_bien_forme(jsonb)` '
      'à UN paramètre. Le point 3 la retirerait sous eux.', n;
  end if;
end $$;

-- ── 1. La garde de lieu couvre les CINQ champs de version finale ───────────
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
    -- CINQ champs, et non quatre : `confiance_ocr_vf` en fait partie — elle est
    -- le désaccord entre deux passes de transcription DE LA VERSION FINALE
    -- (06- §4), et une passation en classe n'en a pas.
    if new.texte_vf is not null or new.photos_vf is not null
       or new.transcription_vf is not null or new.confiance_ocr_vf is not null
       or new.vf_remis_at is not null then
      raise exception 'Garde 07- §1.1 : aucune version finale sur une passation en classe.'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $fn$;

-- ── 2. Les photos : le TYPE de chaque clé, et jamais un null ───────────────
create or replace function public.photos_bien_formees(p jsonb)
returns boolean language sql immutable as $fn$
  -- ⚠️ `coalesce(jsonb_typeof(...), 'absent')` : sur une clé ABSENTE,
  --    `jsonb_typeof` rend SQL NULL, et `NULL <> 'number'` vaut NULL — la
  --    condition ne se déclenche pas et l'élément PASSE. C'est exactement le
  --    mode de panne d'une garde qui ne contrôlait que la présence.
  select p is null
      or (jsonb_typeof(p) = 'array'
          and not exists (
            select 1 from jsonb_array_elements(p) e
             where jsonb_typeof(e.value) <> 'object'
                -- L'ORDRE remet les pages dans l'ordre de la copie.
                or coalesce(jsonb_typeof(e.value->'ordre'), 'absent') <> 'number'
                -- LA ROTATION. Le DOMAINE de ses valeurs appartient à C4-L4, qui
                -- écrit la colonne — « la forme physique appartient à la session
                -- Code » (07- §1). Ici, seul le null est refusé.
                or coalesce(jsonb_typeof(e.value->'rotation'), 'absent') <> 'number'
                -- LA SOMME DE CONTRÔLE : une chaîne, et non vide.
                or coalesce(jsonb_typeof(e.value->'somme_controle'), 'absent') <> 'string'
                or coalesce(btrim(e.value->>'somme_controle'), '') = ''
                -- « SAIT DIRE QU'UNE PAGE MANQUE » (07- §1.1) : un booléen. Un
                -- null ne dit rien, et c'est précisément ce qu'on veut savoir.
                or coalesce(jsonb_typeof(e.value->'page_manquante'), 'absent') <> 'boolean'
          ));
$fn$;

comment on function public.photos_bien_formees(jsonb) is
  '07- §1.1 — « photos[] porte l''ORDRE, la ROTATION, une SOMME DE CONTRÔLE, et SAIT DIRE '
  'QU''UNE PAGE MANQUE ». C4-L1 ne contrôlait que la PRÉSENCE des quatre clés : une clé nulle '
  'passait, et ne porte rien. Le TYPE est contrôlé ici ; le DOMAINE des valeurs — un quart de '
  'tour ou un angle libre — appartient à C4-L4, qui écrit la colonne (07- §1).';

-- ── 3. Le second domicile de la garde de retour ────────────────────────────
-- Sans `cascade` : si quelque chose en dépendait malgré le refus ci-dessus,
-- Postgres refuse et la transaction s'annule — ce qui est le comportement voulu.
drop function if exists public.retour_segmente_bien_forme(jsonb);

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. Sept drapeaux, tous attendus à `t`.
-- ============================================================================
select
  -- 1. La garde de lieu nomme bien les cinq champs.
  pg_get_functiondef('public.garde_depot_lieu()'::regprocedure)
    like '%confiance_ocr_vf%'                                    as garde_lieu_couvre_la_confiance_vf,
  -- 2. Les photos : le cas légitime passe.
  public.photos_bien_formees(
    '[{"ordre":1,"rotation":0,"somme_controle":"ab12","page_manquante":false}]'::jsonb)
                                                                 as photo_legitime_acceptee,
  -- 3. …et les quatre nulls, qui passaient hier, sont refusés.
  not public.photos_bien_formees(
    '[{"ordre":null,"rotation":null,"somme_controle":null,"page_manquante":null}]'::jsonb)
                                                                 as photo_a_clefs_nulles_refusee,
  -- 4. Une clé ABSENTE est refusée elle aussi (le mode de panne du coalesce).
  not public.photos_bien_formees('[{"ordre":1,"rotation":0,"somme_controle":"ab12"}]'::jsonb)
                                                                 as photo_a_clef_absente_refusee,
  -- 5. Une somme de contrôle faite d'espaces ne compte pas.
  not public.photos_bien_formees(
    '[{"ordre":1,"rotation":0,"somme_controle":"   ","page_manquante":false}]'::jsonb)
                                                                 as somme_de_controle_vide_refusee,
  -- 6. `null` et le tableau vide restent légitimes : un dépôt sans photo existe.
  public.photos_bien_formees(null) and public.photos_bien_formees('[]'::jsonb)
                                                                 as absence_de_photo_toujours_legitime,
  -- 7. La garde de retour n'a plus qu'UN exemplaire, celui à deux paramètres.
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'retour_segmente_bien_forme') = 1
  and public.retour_segmente_bien_forme('[{"id":"a","texte":"attention à ta conclusion"}]'::jsonb, false)
                                                                 as garde_de_retour_a_un_seul_domicile;

-- ============================================================================
-- ÉPREUVE PAR L'ÉCHEC — la garde de lieu, éprouvée sur une VRAIE écriture.
-- ----------------------------------------------------------------------------
-- ⚠️ À JOUER DANS SA PROPRE TRANSACTION. RIEN NE PERSISTE, quel que soit le
--    verdict — c'est la convention de la campagne de sondages du 21/08
--    (`SUIVI_SQL.md`). Un drapeau qui lit le SOURCE d'une fonction dit qu'elle a
--    été écrite ; il ne dit pas qu'elle refuse. Seule une écriture refusée le dit.
--
-- ⚠️ LE SUCCÈS S'ANNONCE PAR UNE ERREUR, ET C'EST VOULU. Le bloc se termine par
--    un `raise exception` : c'est LUI qui annule la transaction — donc rien ne
--    peut persister, même si on oublie le `rollback;` — et c'est lui qui rend le
--    verdict VISIBLE dans un éditeur SQL qui n'affiche que le dernier résultat.
--    Lire le TEXTE du message : « ÉPREUVE PASSÉE » ou « ÉPREUVE ÉCHOUÉE ».
-- ============================================================================
begin;
do $$
declare v_ex uuid; v_eleve uuid; v_type uuid; v_refuse boolean := false;
begin
  select id into v_eleve from public.profiles limit 1;
  select id into v_type  from public.exercices_types limit 1;
  if v_eleve is null or v_type is null then
    raise exception 'ÉPREUVE IMPOSSIBLE : il faut au moins un profil et un type seedé.';
  end if;

  insert into public.exercices (type_id, lieu, consigne_instanciee)
    values (v_type, 'classe', '{"epreuve":"garde de lieu"}'::jsonb)
    returning id into v_ex;

  begin
    insert into public.exercices_depots (eleve_id, exercice_id, origine, confiance_ocr_vf)
      values (v_eleve, v_ex, 'prof', 0.5);
  exception when check_violation then
    v_refuse := true;
  end;

  if not v_refuse then
    raise exception 'ÉPREUVE ÉCHOUÉE : `confiance_ocr_vf` a été ACCEPTÉE sur un dépôt de classe.';
  end if;

  -- Et le cas légitime passe toujours : à la maison, la version finale existe.
  insert into public.exercices (type_id, lieu, consigne_instanciee)
    values (v_type, 'maison', '{"epreuve":"cas legitime"}'::jsonb)
    returning id into v_ex;
  insert into public.exercices_depots (eleve_id, exercice_id, origine, confiance_ocr_vf)
    values (v_eleve, v_ex, 'prof', 0.5);

  raise exception 'ÉPREUVE PASSÉE — TRANSACTION ANNULÉE, RIEN N''EST ÉCRIT : `confiance_ocr_vf` '
    'est REFUSÉE sur un dépôt de classe, et ACCEPTÉE sur un dépôt de maison.';
end $$;
rollback;
