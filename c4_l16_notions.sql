-- ============================================================================
-- C4 · L16 — LE QUATRIÈME ÉTAT DU RATTACHEMENT, ET LE CHAMP QUI LE RÉCLAME.
-- ----------------------------------------------------------------------------
-- CE QUE CE FICHIER FAIT, ET RIEN D'AUTRE — quatre gestes, tous ÉLARGISSANTS :
--   (1) `exercices_sujets.cours_etat`  : le `CHECK` gagne la valeur `'notions'` ;
--   (2) `exercices_textes.cours_etat`  : le même `CHECK`, la même valeur ;
--   (3) `exercices_textes.notions`     : la colonne manquante, à l'identique de
--                                        celle des sujets ;
--   (4) `scriptorium_contenus.notions` : LE CHAMP NEUF — ce que le COURS déclare
--                                        traiter, et sur quoi le matériau
--                                        s'apparie tout seul.
-- Plus trois `comment on column`, dont un qui REMPLACE une phrase devenue fausse.
--
-- POURQUOI IL EXISTE.
--   Le `08-FORMAT_IMPORT.md` est passé au **format 1.3** le 24/08 : le
--   rattachement au cours a désormais **quatre** états, et le quatrième
--   RETOURNE LE SENS DU TRI. Aux trois premiers, c'est le MATÉRIAU qui désigne
--   ses cours — « quinze sujets, quinze appariements, et deux cents demain ».
--   Au quatrième, c'est le COURS qui déclare ce qu'il traite, et le matériau s'y
--   rattache seul : « servable dès qu'un cours vu déclare l'une de ses notions »
--   (`01-routeur.md` §4, couche 4 ; `08-` §2 et §3 ; `07-` §2, C4-L16).
--   ⚠️ Les **quinze sujets en banque portent DÉJÀ `"cours": "notions"`** depuis
--   le 24/08 : sans cette migration, l'import les fait tomber dans `'aucun'` —
--   « JAMAIS SERVABLE » — et la banque entière est muette.
--
-- ⚠️⚠️ « UNE LIGNE ADDITIVE » EST FAUX DEUX FOIS, et le fichier le montre.
--   (a) **Un `CHECK` inline ne s'ÉTEND pas : il se DROPPE et se recrée.**
--       `c4_l8_fabrique.sql` a posé ces deux contraintes en ligne
--       (`check (cours_etat in (…))`), donc auto-nommées par Postgres
--       — `<table>_<colonne>_check`. Le patron du dépôt est celui de
--       `plan_evaluation_modele.sql` §143-147 : `drop constraint if exists`,
--       puis `add constraint` sous LE MÊME NOM. ⭐ Le geste ÉLARGIT et ne
--       rétrécit jamais : aucune ligne existante ne peut violer la nouvelle
--       forme, et la validation du `add constraint` ne peut donc pas échouer.
--   (b) **Il y a DEUX tables, pas une.** Le `07-` §2 n'écrit `exercices_sujets`
--       que par raccourci ; le `08-` §2 donne les quatre états au **même champ
--       sur `textes[]`**, et `exercices_textes.cours_etat` porte le même `CHECK`
--       à trois valeurs (`c4_l8_fabrique.sql`). N'élargir qu'un seul côté ferait
--       échouer l'import d'un texte en `"notions"` sur une contrainte — donc
--       bruyamment, ce qui est la seule bonne nouvelle de l'affaire.
--
-- ⭐ LA FORME DES DEUX COLONNES `notions` : `text[] not null default '{}'`,
--   celle que `exercices_sujets.notions` porte déjà. ⛔ **Et surtout PAS celle
--   d'`exercices_demonstrations.notions`, qui est NULLABLE À DESSEIN** : C4-L3 y
--   a fait une règle — « `NULL` = ne déclare rien ; `{}` = déclare n'avoir
--   aucune notion » —, la démonstration qui ne déclare rien étant SERVIE, avec
--   avertissement au professeur (`c4_l3_deroule.sql` §3). Ici, l'inverse : un
--   cours sans notions déclarées ne réclame rien, et c'est un FAIT, pas une
--   absence de saisie. **Deux régimes, deux tables, deux raisons : ils ne
--   s'alignent pas.**
--
-- ⛔ `scriptorium_contenus.tags` N'EST PAS CE CHAMP. Il existe, il est vide, et
--   `parcours_phase_a.sql:45` le déclare « optionnel (recherche/filtre) ». S'en
--   servir ferait d'un champ libre et facultatif une CONDITION DE SERVICE. D'où
--   une colonne propre, **symétrique de `exercices_sujets.notions`** : « même
--   nom, même forme, l'appariement est une intersection » (`07-` §2).
--
-- ⛔ CE QUE CE FICHIER NE FAIT PAS : aucune donnée n'est écrite, aucune notion
--   n'est semée, aucune liste fermée n'entre en base. « Le champ reste libre ;
--   c'est l'écran qui guide, pas une contrainte » — et les dix-sept notions du
--   programme « ne sont PAS une donnée de doctrine » (`generateur/verifie-
--   import.py`, qui le dit de lui-même). ⛔ Aucun filtre non plus : la couche 4
--   en `notions` est le premier geste de `C4-L12`.
--
-- PROTOCOLE : **RENFORCÉ sur (4), normal sur (1)–(3)** — et le fichier est un
--   seul geste, donc c'est le renforcé qui gouverne (`SUIVI_SQL.md`, règle 5).
--   `exercices_sujets` et `exercices_textes` sont des tables de C4, dont les six
--   interrupteurs restent à OFF (le fichier le vérifie en pied) ;
--   **`scriptorium_contenus` est une table VIVANTE** — des cours réels y vivent,
--   et `/prof/scriptorium` n'est derrière AUCUN drapeau. ⭐ Le geste y est
--   pourtant le plus doux possible : `add column` d'un `text[]` avec un
--   **défaut CONSTANT**, que Postgres ≥ 11 stocke en `attmissingval` — **aucune
--   réécriture de table, aucun verrou long**, aucune contrainte touchée, aucune
--   policy touchée, RLS inchangée. Pour ce lot additif, **migration d'abord**
--   (elle est invisible au code ancien), puis code ; fenêtre calme, rollback
--   prêt, smoke prof immédiat (création + modification d'un cours).
-- ⚠️ RÈGLE 6 — RÉPÉTITION À BLANC : copier le CORPS de ce fichier (entre son
--   `begin;` et son `commit;`) dans sa propre transaction d'essai, **jamais le
--   fichier entier** : son `commit;` validerait la transaction englobante. Puis
--   VÉRIFIER PAR REQUÊTE que le schéma est revenu — jamais sur le seul
--   « ROLLBACK » affiché.
--
-- Rollback : `c4_l16_notions_rollback.sql`.
-- ⛔ Le rollback RÉTRÉCIT deux `CHECK`, et un rétrécissement peut échouer — lire
--    son en-tête avant : il dit ce qu'il fait des lignes restées en `'notions'`.
-- ============================================================================

begin;

-- ── LE CONSTAT AVANT ────────────────────────────────────────────────────────
select
  (select count(*) from pg_constraint
    where conrelid = 'public.exercices_sujets'::regclass
      and conname = 'exercices_sujets_cours_etat_check'
      and pg_get_constraintdef(oid) like '%notions%')      as check_sujets_deja_large_attendu_0,
  (select count(*) from pg_constraint
    where conrelid = 'public.exercices_textes'::regclass
      and conname = 'exercices_textes_cours_etat_check'
      and pg_get_constraintdef(oid) like '%notions%')      as check_textes_deja_large_attendu_0,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_textes'
      and column_name = 'notions')                         as notions_textes_avant_attendu_0,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'scriptorium_contenus'
      and column_name = 'notions')                         as notions_cours_avant_attendu_0,
  -- La population réelle, pour que le rollback sache ce qu'il détruirait.
  (select count(*) from public.exercices_sujets)           as sujets_en_base,
  (select count(*) from public.exercices_textes)           as textes_en_base,
  (select count(*) from public.scriptorium_contenus
    where type = 'cours' and supprime_at is null)          as cours_vivants;

-- ── (1) `exercices_sujets.cours_etat` — LE QUATRIÈME ÉTAT ───────────────────
-- Contrainte INLINE, auto-nommée par Postgres : elle ne s'étend pas, elle se
-- droppe et se recrée SOUS LE MÊME NOM (patron `plan_evaluation_modele.sql`).
alter table public.exercices_sujets
  drop constraint if exists exercices_sujets_cours_etat_check;
alter table public.exercices_sujets
  add constraint exercices_sujets_cours_etat_check
  check (cours_etat in ('generique', 'liste', 'aucun', 'notions'));

-- ── (2) `exercices_textes.cours_etat` — LE MÊME, ET IL N'EST PAS FACULTATIF ──
-- « Le même champ sur `textes[]` et sur `sujets[]` » (`08-` §2). Élargir un seul
-- côté ferait échouer l'import d'un texte en `"notions"` sur une contrainte.
alter table public.exercices_textes
  drop constraint if exists exercices_textes_cours_etat_check;
alter table public.exercices_textes
  add constraint exercices_textes_cours_etat_check
  check (cours_etat in ('generique', 'liste', 'aucun', 'notions'));

-- ── (3) `exercices_textes.notions` — LA COLONNE QUI MANQUAIT ────────────────
-- `exercices_sujets.notions` existe depuis C4-L8 ; son jumeau côté textes,
-- non — alors que le `08-` §2 déclare `notions` sur `textes[]`, « même champ,
-- même forme et même rôle qu'au §3 ». Sans elle, l'état `"notions"` d'un texte
-- n'aurait rien à réclamer.
alter table public.exercices_textes
  add column if not exists notions text[] not null default '{}';

-- ── (4) `scriptorium_contenus.notions` — LE CHAMP POUR LEQUEL LE LOT EXISTE ──
-- Il ne s'importe pas : il se SAISIT à l'écran du cours. Pour le tronc commun,
-- les NOTIONS du programme ; pour HLP, les THÈMES ou CHAPITRES du semestre —
-- UN SEUL champ, « parce que deux champs feraient deux domiciles pour la même
-- relation » (`07-` §2 ; `08-` §3 ; `01-` §4 couche 4).
alter table public.scriptorium_contenus
  add column if not exists notions text[] not null default '{}';

-- ── LES COMMENTAIRES — dont un qui REMPLACE une phrase devenue fausse ───────
-- ⚠️ `c4_l8_fabrique.sql` écrit de `exercices_sujets.notions` : « une liste de
--   mots QU'AUCUNE RÈGLE NE LIT — elle sert au professeur qui cherche ». **Ce
--   lot rend cette phrase fausse**, et le `08-` §3 la corrige déjà. ⛔ On
--   n'ÉDITE PAS une migration jouée — cela la ferait mentir sur ce qui a
--   tourné : on pose le commentaire neuf ICI, et c'est celui en base qui fait
--   foi pour qui lit le schéma.
comment on column public.exercices_sujets.notions is
  'Les notions du programme que l''énoncé met en jeu — une liste de mots libres (08- §3). '
  'Elle sert au professeur qui cherche, ET LE ROUTEUR LA LIT QUAND cours_etat vaut ''notions'' '
  '(C4-L16, format 1.3) : le cours déclare ce qu''il traite, le sujet s''y rattache seul, et '
  'l''appariement est une INTERSECTION sur forme normalisée (minuscules, sans accents, article '
  'initial retiré — utils/fabrique/notions.ts). ⛔ Le commentaire de c4_l8_fabrique.sql, qui '
  'disait « qu''aucune règle ne lit », est périmé : la migration jouée ne s''édite pas, celui-ci '
  'la remplace. ⛔ Ce n''est PAS une liste fermée : le champ reste libre, c''est l''écran qui guide. '
  '⚠️ not null default ''{}'' — il n''y a pas de « non déclaré » ici, contrairement à '
  'exercices_demonstrations.notions qui est NULLABLE À DESSEIN (C4-L3 : NULL = ne déclare rien, '
  '{} = déclare n''avoir aucune notion). Deux régimes, deux tables, deux raisons.';

comment on column public.exercices_textes.notions is
  'Le jumeau de exercices_sujets.notions, côté textes d''auteur — « même champ, même forme et '
  'même rôle qu''au §3 » (08- §2 ; C4-L16, format 1.3). Il n''a d''effet que si cours_etat vaut '
  '''notions''. ⛔ Il n''ouvre AUCUNE voie neuve au rattachement des textes : celle-ci passe par '
  'plan_de_lecture, et le champ leur est ouvert, rien de plus (07- §2). ⚠️ utils/deroule/vue.ts '
  '(notionsDeLExercice, parade de C4-L3) ne lit que les notions des SUJETS et reste tel quel : '
  'l''élargir écarterait des démonstrations qu''il servait hier. C''est une conséquence relevée, '
  'pas une réparation faite en passant.';

comment on column public.scriptorium_contenus.notions is
  'CE QUE LE COURS DÉCLARE TRAITER — notions du programme au tronc commun, thèmes ou chapitres du '
  'semestre en HLP ; UN SEUL champ, une liste de mots libres (07- §2 C4-L16 ; 08- §3 ; 01- §4 '
  'couche 4). C''est le pivot du quatrième état du rattachement : un sujet en cours_etat = '
  '''notions'' devient servable dès qu''un cours VU déclare l''une des siennes — sans re-import et '
  'sans qu''on touche au sujet. L''appariement est une INTERSECTION sur forme normalisée '
  '(utils/fabrique/notions.ts), jamais une égalité brute : « la vérité », « Vérité » et « La '
  'Vérité » ne se rencontreraient jamais. ⛔ NE PAS confondre avec tags, qui reste « optionnel '
  '(recherche/filtre) » : s''en servir aurait fait d''un champ libre et facultatif une CONDITION '
  'DE SERVICE. ⛔ Ce n''est pas une liste fermée, et rien ici n''est dérivé : c''est une SAISIE. '
  '⚠️ Le FILTRE qui lit cette colonne n''existe pas encore — il est le premier geste de C4-L12.';

-- ── LE CONSTAT APRÈS ────────────────────────────────────────────────────────
select
  (select pg_get_constraintdef(oid) from pg_constraint
    where conrelid = 'public.exercices_sujets'::regclass
      and conname = 'exercices_sujets_cours_etat_check')   as check_sujets_attendu_4_valeurs,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conrelid = 'public.exercices_textes'::regclass
      and conname = 'exercices_textes_cours_etat_check')   as check_textes_attendu_4_valeurs,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_textes'
      and column_name = 'notions')                         as notions_textes_apres_attendu_1,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'scriptorium_contenus'
      and column_name = 'notions')                         as notions_cours_apres_attendu_1;

select
  -- Les deux colonnes neuves ont bien la forme de leur modèle.
  (select string_agg(table_name || '.' || column_name || ' = ' || data_type
                     || ' / null:' || is_nullable || ' / def:' || coalesce(column_default, '—'),
                     ' · ' order by table_name)
     from information_schema.columns
    where table_schema = 'public' and column_name = 'notions'
      and table_name in ('exercices_sujets', 'exercices_textes',
                         'scriptorium_contenus'))          as les_trois_notions,
  -- ⚠️ AUCUNE LIGNE N'EST TOMBÉE, ET AUCUNE N'A CHANGÉ D'ÉTAT : le geste
  --    élargit, il ne touche à aucune donnée.
  (select count(*) from public.scriptorium_contenus
    where notions <> '{}')                                 as cours_deja_declares_attendu_0,
  (select count(*) from public.exercices_textes
    where notions <> '{}')                                 as textes_deja_declares_attendu_0,
  (select count(*) from pg_policies
    where schemaname = 'public'
      and tablename = 'scriptorium_contenus')              as policies_table_vivante_attendu_1,
  (select count(*) from pg_constraint
    where conrelid = 'public.scriptorium_contenus'::regclass) as contraintes_table_vivante,
  -- ⚠️ LES SIX INTERRUPTEURS N'ONT PAS BOUGÉ — ce lot n'en allume aucun.
  (select not (exercices_actif or routeur_actif or competences_affichage_actif
               or fabrique_actif or chaine_actif or passation_classe_actif)
     from public.scriptorium_params where id = 1)          as les_six_toujours_a_off;

commit;
