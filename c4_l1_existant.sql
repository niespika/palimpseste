-- ============================================================================
-- C4 · L1 — LES TOUCHES À L'EXISTANT (additive, NON-CASSANTE).
-- Fichier : c4_l1_existant.sql — à jouer APRÈS `c4_l1_schema.sql`
-- (`api_couts.depot_id` référence `exercices_depots`, créée là-bas).
-- ----------------------------------------------------------------------------
-- ⚠️⚠️ PROTOCOLE RENFORCÉ (SUIVI_SQL règle 5) : UN ÉLÈVE RÉEL UTILISE LA BASE.
-- Ce fichier touche `profiles` (table du flux auth) et `api_couts` (journal
-- transverse écrit par 14 sites en production). Il est SÉPARÉ du schéma
-- précisément pour que son protocole le soit aussi.
--   • code mergé + poussé D'ABORD — **sans objet ici : C4-L1 ne livre aucun
--     code**. Les deux touches sont des colonnes NULLABLES qu'aucun code ne lit
--     ni n'écrit encore ; elles sont donc INERTES au sens strict. Ce point du
--     protocole est à arbitrer par Louis avant exécution, pas en séance ;
--   • fenêtre calme · retour arrière prêt (`c4_l1_existant_rollback.sql`) ·
--     smoke test élève immédiat (connexion élève test + une soumission Aletheia).
--
-- CE QU'IL FAIT — DEUX touches, pas trois
--   1. `profiles` : les TROIS CHAMPS D'AMÉNAGEMENT (07- §1.3), en migration
--      additive, comme ceux de l'intégrité avant eux.
--   2. `api_couts` : la `phase` et le RATTACHEMENT À L'EXERCICE (07- §1.2),
--      tous nullables, au mieux.
--   3. `classes` : **RIEN À FAIRE** — les deux champs voisins que le §1.3 exige
--      existent déjà. Vérifiés par requête, pas altérés (bloc en pied).
--
-- CE QU'IL NE FAIT PAS
--   • aucune policy touchée. LA POLICY SELF-SERVICE DE `profiles` RESTE MORTE :
--     `c1_rls_eleve.sql` a retiré « Mise à jour profil personnel » — aucun élève
--     n'écrit sa propre ligne, et les trois champs héritent de cette fermeture.
--     ILS N'EN DEMANDENT AUCUNE DE PLUS. NE PAS LA RÉINTRODUIRE (07- §1.3).
--   • aucun second canal d'intégrité : le drapeau passe par `signalerEnAttenteIA`
--     (`utils/integrite.ts` → `integrite_signalements`) — un lot le RÉUTILISE,
--     il n'en crée pas un second (07- §1.2).
--   • aucune agrégation de coûts en colonne : elle se fait EN REQUÊTE (07- §1.2).
--
-- Idempotence : `add column if not exists`, blocs DO/EXCEPTION pour les
-- contraintes sur tables préexistantes. Rejouable. AUCUNE donnée modifiée.
-- ⚠️ Répétition à blanc : copier le CORPS seul, jamais le fichier entier
-- (SUIVI_SQL règle 6 — le `commit;` du fichier validerait l'essai).
-- ============================================================================

begin;

-- ── 1. profiles — les trois champs d'aménagement (07- §1.3) ─────────────────
-- Ils sont RÉUNIS PARCE QU'ILS SONT DE MÊME NATURE : ils ne portent aucun
-- jugement, ne se calculent pas, et NE SONT ÉCRITS QUE PAR LE PROFESSEUR.
-- ⚠️ CE SONT DES MARQUES PÉDAGOGIQUES, JAMAIS UN DIAGNOSTIC MÉDICAL (06- §7).
-- La discipline vaut pour les trois : PAS DE MOTIF, PAS DE TEXTE LIBRE — et
-- c'est pourquoi aucune colonne de motif n'est créée ici.
-- « Aucune exception ne dispense de travailler l'Expression » : ce qui se règle
-- est plus étroit — une mesure qui compte contre l'élève ce qui n'est pas censé
-- être mesuré, et un canal qui ne se referme jamais.

-- `mode_saisie_force` → l'EXEMPTION DE LISIBILITÉ : bascule automatique de tous
-- les types manuscrits de cet élève. La règle vit au `06-` §1.
alter table profiles add column if not exists mode_saisie_force text;
do $$ begin
  alter table profiles add constraint profiles_mode_saisie_force_chk
    check (mode_saisie_force is null or mode_saisie_force = 'ecran');
exception when duplicate_object then null; end $$;

-- `exception_expression` → une BORNE AU CANAL DE L'EXPRESSION : au-delà de six
-- cycles sans progrès, sa part passe d'un exercice sur deux à un sur trois —
-- AU PALIER D SEULEMENT. La règle vit au `01-` §6.
alter table profiles add column if not exists exception_expression boolean not null default false;

-- `exception_orthographe` → un FILTRE EN AVAL, DANS LE CODE : le fait qui
-- brouille l'accord est retiré APRÈS L'EXTRACTION ET AVANT LE JUGEMENT — c'est
-- le seul endroit où la mécanique touche la lettre. Règles :
-- `competences/expression.md` §4 · `00-referentiel.md` §4.
-- ⚠️ LE PROMPT N'EST JAMAIS MODIFIÉ : l'extraction relève exactement les mêmes
-- faits pour tous les élèves. Un prompt modifié par élève ferait diverger
-- l'`instrument_version` et rendrait ses mesures incomparables.
alter table profiles add column if not exists exception_orthographe boolean not null default false;

comment on column profiles.mode_saisie_force is
  'Marque pédagogique (07- §1.3), jamais un diagnostic médical. Écrite par le professeur seul. '
  'Pas de motif, pas de texte libre.';
comment on column profiles.exception_expression is
  'Marque pédagogique (07- §1.3). Borne le canal de l''Expression au palier D (01- §6). '
  'Ne dispense JAMAIS de travailler l''Expression.';
comment on column profiles.exception_orthographe is
  'Marque pédagogique (07- §1.3). Filtre EN AVAL, dans le code, entre extraction et jugement. '
  'Le prompt n''est jamais modifié.';

-- ── 2. api_couts — la phase et le rattachement à l'exercice (07- §1.2) ──────
-- La table EXISTE (c11a_api_couts.sql) et porte déjà le modèle, ses quatre
-- compteurs de jetons et son attribution à l'élève et à la classe.
-- CE QU'IL LUI MANQUE, ET QUE LE DOCUMENT EXIGE : la `phase` et le
-- rattachement à l'exercice (dépôt, compétence, version).
-- ⚠️ TOUS NULLABLES, AU MIEUX : UN COÛT NON ATTRIBUABLE RESTE UNE LIGNE VALIDE.
-- Aucune contrainte NOT NULL, aucun défaut : les 14 sites d'écriture existants
-- continuent d'écrire sans rien changer.

-- LA `phase` DIT L'ÉTAGE, PAS LE NOMBRE D'APPELS : `p1` pour l'extraction, `p2`
-- pour le jugement, `retour` pour la génération chaude, **NULL hors exercices**.
-- L'extraction de la Synthèse compte DEUX APPELS EN `p1` ; le nombre d'appels
-- d'un étage se lit AU NOMBRE DE LIGNES, jamais à l'énuméré.
-- Les deux temps de CODE de la chaîne ne journalisent rien : ce ne sont pas des
-- appels.
alter table api_couts add column if not exists phase text;
do $$ begin
  alter table api_couts add constraint api_couts_phase_chk
    check (phase is null or phase in ('p1', 'p2', 'retour'));
exception when duplicate_object then null; end $$;

-- Le rattachement à l'exercice : dépôt, compétence, version.
alter table api_couts add column if not exists depot_id uuid;
do $$ begin
  alter table api_couts add constraint api_couts_depot_fk
    foreign key (depot_id) references exercices_depots(id) on delete set null;
exception when duplicate_object then null; end $$;

alter table api_couts add column if not exists competence text;
do $$ begin
  alter table api_couts add constraint api_couts_competence_chk
    check (competence is null or competence in
      ('expression','argumentation','structure','connaissance','synthese','questionnement'));
exception when duplicate_object then null; end $$;

alter table api_couts add column if not exists version text;
do $$ begin
  alter table api_couts add constraint api_couts_version_chk
    check (version is null or version in ('v1', 'vf'));
exception when duplicate_object then null; end $$;

-- Index partiel : l'agrégation par élève, par type et par cycle se fait EN
-- REQUÊTE — et jamais en colonne : deux copies d'un même chiffre finissent par
-- diverger.
create index if not exists idx_api_couts_depot on api_couts(depot_id) where depot_id is not null;

comment on column api_couts.phase is
  'L''ÉTAGE, pas le nombre d''appels (07- §1.2). p1 = extraction, p2 = jugement, retour = génération '
  'chaude, NULL hors exercices. Le nombre d''appels d''un étage se lit au NOMBRE DE LIGNES.';

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION — à jouer tel quel, hors transaction.
-- ============================================================================
select
  (select count(*) from information_schema.columns where table_schema='public'
     and table_name='profiles' and column_name in
     ('mode_saisie_force','exception_expression','exception_orthographe')) = 3
                                                              as profiles_trois_amenagements,
  (select count(*) from information_schema.columns where table_schema='public'
     and table_name='profiles' and column_name like '%motif%') = 0
                                                              as profiles_aucun_motif,
  (select count(*) from information_schema.columns where table_schema='public'
     and table_name='api_couts' and column_name in ('phase','depot_id','competence','version')) = 4
                                                              as api_couts_quatre_colonnes,
  (select bool_and(is_nullable = 'YES') from information_schema.columns where table_schema='public'
     and table_name='api_couts' and column_name in ('phase','depot_id','competence','version'))
                                                              as api_couts_tous_nullables,
  -- ⚠️ LA POLICY SELF-SERVICE DE `profiles` DOIT RESTER MORTE (07- §1.3).
  (select count(*) from pg_policies where schemaname='public' and tablename='profiles'
     and cmd = 'UPDATE' and policyname ilike '%personnel%') = 0
                                                              as policy_self_service_toujours_morte,
  -- `classes` : RIEN N'A ÉTÉ ALTÉRÉ — les deux champs voisins EXISTENT DÉJÀ.
  -- Le LIBELLÉ DE FILIÈRE, libre, qui sert l'affichage ; et le PARCOURS
  -- proprement dit, `type_pedagogique`, À VALEURS FERMÉES. Le filtre ne lit que
  -- le second et ne le dérive JAMAIS du premier : deux orthographes d'un même
  -- libellé, et l'éligibilité devient un jeu de saisie.
  (select count(*) from information_schema.columns where table_schema='public'
     and table_name='classes' and column_name in ('filiere','type_pedagogique')) = 2
                                                              as classes_deja_conformes,
  (select count(*) from pg_constraint where conrelid='public.classes'::regclass
     and conname='classes_type_pedagogique_check') = 1        as classes_parcours_a_valeurs_fermees,
  (select is_nullable='YES' from information_schema.columns where table_schema='public'
     and table_name='classes' and column_name='type_pedagogique')
                                                              as classes_parcours_nullable;

-- ⚠️ RAPPEL DE RECETTE, PAS UNE TÂCHE DE CE LOT : « une classe sans parcours ne
-- sert pas le filtre, et l'élève n'est pas servi à moitié » — un élève dont
-- AUCUNE inscription active ne porte de parcours ne reçoit AUCUN exercice routé,
-- et le professeur en est averti (07- §1.3). L'ensemble de parcours vide est le
-- piège : la règle d'exclusion du `02-` §4 est VRAIE PAR VACUITÉ sur un ensemble
-- vide et exclurait l'élève de tout. C'est une CONDITION DE RECETTE DE C4-L2.
-- Le parcours d'un élève NE SE STOCKE PAS : il se dérive de l'UNION de ses
-- inscriptions actives. Aucune colonne n'est créée pour lui, et c'est voulu.
select count(*) as classes_sans_parcours from classes where type_pedagogique is null and statut='active';
