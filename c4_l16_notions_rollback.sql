-- ============================================================================
-- C4 · L16 — ROLLBACK du quatrième état du rattachement.
-- ----------------------------------------------------------------------------
-- ⛔⛔ CE FICHIER RÉTRÉCIT DEUX `CHECK`, ET UN RÉTRÉCISSEMENT PEUT ÉCHOUER.
--   Remettre `cours_etat` à ses trois valeurs LÈVERA tant qu'il reste une ligne
--   à `'notions'` — et il y en aura : les quinze sujets de la banque portent
--   `"cours": "notions"` depuis le 24/08.
--
-- ⭐ CE QU'IL FAIT DE CES LIGNES, ET POURQUOI — LA DÉCISION EST ÉCRITE ICI,
--   PAS DEVINÉE À L'EXÉCUTION. **Il les ramène à `'aucun'`**, dans la même
--   transaction, AVANT de recréer les contraintes.
--   Le motif est le sens fort de l'absence : « elle ne dit pas "pas encore
--   rempli", elle dit JAMAIS SERVI » (`08-` §2). Sous un code qui ne connaît
--   plus le quatrième état, une ligne restée en `'notions'` serait lue par
--   `filtreDuCoursVu` comme une `'liste'` — « N cours déclaré(s), AUCUN
--   apparié » — et le motif d'écart MENTIRAIT. `'aucun'` ne peut pas servir à
--   tort : **c'est le seul repli qui ne fabrique pas de faux.**
--   ⛔ Ce n'est pas gratuit : le tri du professeur est PERDU pour ces lignes
--   (l'état, pas les notions — les colonnes `notions`, elles, ne partent pas).
--   Le `select` de tête les relève ; **recopier sa sortie AILLEURS avant de
--   continuer.** Le repli documenté du lot est de toute façon celui du `07-` §2 :
--   `"generique"` sur les quinze sujets, une ligne, et l'on sert.
--
-- ⛔⛔ ET IL DROPPE DEUX COLONNES, DONT UNE QUI PORTE DE LA SAISIE HUMAINE.
--   `scriptorium_contenus.notions` est **saisie à l'écran du cours** : elle ne
--   se dérive de rien — ni du titre, ni du corps, ni des `tags`. Une colonne
--   droppée emporte, pour chaque cours, ce que le professeur a déclaré, et
--   personne ne peut le réécrire à sa place. `exercices_textes.notions`, elle,
--   vient de l'import et se retrouve dans le fichier déposé.
--
-- QUAND LE JOUER : seulement si l'élargissement pose un problème que le CODE ne
--   peut pas régler. ⭐ **Dans presque tous les cas, revenir au code suffit** :
--   un `CHECK` plus large n'oblige personne à écrire la valeur, et deux colonnes
--   `not null default '{}'` que rien ne lit sont invisibles. ⚠️ **Revenir au
--   CODE D'ABORD**, sans quoi l'import et l'écran du rattachement écriront
--   `'notions'` dans une contrainte qui le refuse.
--
-- PROTOCOLE : **renforcé** — `scriptorium_contenus` est une table VIVANTE et
--   `/prof/scriptorium` n'est derrière aucun drapeau. Fenêtre calme, smoke prof
--   immédiat après (création + modification d'un cours).
-- ⚠️ RÈGLE 6 — RÉPÉTITION À BLANC : copier le CORPS de ce fichier, jamais le
--   fichier entier (son `commit;` validerait la transaction d'essai).
-- ============================================================================

begin;

-- ── LE CONSTAT AVANT — ET LE RELEVÉ DE CE QUI VA DISPARAÎTRE ────────────────
-- ⛔ Recopier ces trois sorties AILLEURS avant de continuer : après le `commit`,
--    elles n'existent plus nulle part.
select 'sujet' as banque, id, id_import, cours_etat, notions
  from public.exercices_sujets where cours_etat = 'notions'
union all
select 'texte', id, id_import, cours_etat, notions
  from public.exercices_textes where cours_etat = 'notions'
 order by 1, 3;

select id, titre, type, notions
  from public.scriptorium_contenus
 where notions <> '{}'
 order by titre;

select
  (select count(*) from public.exercices_sujets
    where cours_etat = 'notions')                          as sujets_qui_repassent_a_aucun,
  (select count(*) from public.exercices_textes
    where cours_etat = 'notions')                          as textes_qui_repassent_a_aucun,
  (select count(*) from public.scriptorium_contenus
    where notions <> '{}')                                 as cours_qui_perdent_leurs_notions,
  (select count(*) from public.exercices_textes
    where notions <> '{}')                                 as textes_qui_perdent_leurs_notions;

-- ── LE REPLI DES LIGNES — AVANT LES CONTRAINTES, SANS QUOI ELLES LÈVENT ─────
-- « Le sens fort, donc sans risque de servir à tort. »
update public.exercices_sujets set cours_etat = 'aucun', updated_at = now()
 where cours_etat = 'notions';
update public.exercices_textes set cours_etat = 'aucun'
 where cours_etat = 'notions';

-- ── LES DEUX `CHECK` REVIENNENT À TROIS VALEURS ─────────────────────────────
alter table public.exercices_sujets
  drop constraint if exists exercices_sujets_cours_etat_check;
alter table public.exercices_sujets
  add constraint exercices_sujets_cours_etat_check
  check (cours_etat in ('generique', 'liste', 'aucun'));

alter table public.exercices_textes
  drop constraint if exists exercices_textes_cours_etat_check;
alter table public.exercices_textes
  add constraint exercices_textes_cours_etat_check
  check (cours_etat in ('generique', 'liste', 'aucun'));

-- ── LES DEUX COLONNES REPARTENT ─────────────────────────────────────────────
alter table public.exercices_textes       drop column if exists notions;
alter table public.scriptorium_contenus   drop column if exists notions;

-- ⚠️ `exercices_sujets.notions` NE PART PAS : elle est de C4-L8, pas de ce lot.
--   Seul son COMMENTAIRE EN BASE est de C4-L16 → on le retire.
-- ⭐ ON LE RETIRE, ON N'EN REMET PAS UN AUTRE — et c'est un fait mesuré, pas une
--   supposition : `col_description` sur cette colonne rendait **NULL** avant la
--   migration. La phrase « une liste de mots qu'aucune règle ne lit » de
--   `c4_l8_fabrique.sql` est un commentaire SQL `--`, jamais un
--   `comment on column` : elle n'a **jamais** été en base. La remettre ici
--   fabriquerait un état qui n'a pas existé — ce qu'un rollback ne fait pas.
comment on column public.exercices_sujets.notions is null;

-- ── LE CONSTAT APRÈS ────────────────────────────────────────────────────────
select
  (select pg_get_constraintdef(oid) from pg_constraint
    where conrelid = 'public.exercices_sujets'::regclass
      and conname = 'exercices_sujets_cours_etat_check')   as check_sujets_attendu_3_valeurs,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conrelid = 'public.exercices_textes'::regclass
      and conname = 'exercices_textes_cours_etat_check')   as check_textes_attendu_3_valeurs,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_textes'
      and column_name = 'notions')                         as notions_textes_apres_attendu_0,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'scriptorium_contenus'
      and column_name = 'notions')                         as notions_cours_apres_attendu_0,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_sujets'
      and column_name = 'notions')                         as notions_sujets_intacte_attendu_1,
  -- Aucune ligne perdue, aucune ligne restée en `'notions'`.
  (select count(*) from public.exercices_sujets)           as sujets_en_base,
  (select count(*) from public.exercices_textes)           as textes_en_base,
  (select count(*) from public.scriptorium_contenus
    where type = 'cours' and supprime_at is null)          as cours_vivants,
  (select count(*) from pg_policies
    where schemaname = 'public'
      and tablename = 'scriptorium_contenus')              as policies_table_vivante_attendu_1;

commit;
