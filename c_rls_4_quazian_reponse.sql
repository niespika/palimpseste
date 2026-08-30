-- ============================================================================
-- C-RLS-4 — la BONNE RÉPONSE d'un quizz cesse d'être lisible par l'élève.
-- Campagne C (revue RLS et exposition élève), constat 4. Écrit le 2026-08-29.
-- ----------------------------------------------------------------------------
-- ⛔ LE DÉFAUT. `quazian_questions.index_correct` porte la bonne réponse. Deux
--    policies de SELECT ouvraient la LIGNE ENTIÈRE à l'élève dès que le quizz
--    était `lance` — donc AVANT qu'il réponde —, et **une policy RLS ne
--    restreint pas les colonnes** : ouvrir la ligne, c'est ouvrir la réponse.
--    Éprouvé en bac à sable le 29/08, dans la peau d'un élève réel (clé anon +
--    JWT), par PostgREST : `select index_correct from quazian_questions` a
--    rendu **les 5 questions avec leur réponse**.
--
-- ⛔⛔ ET LA PIRE DES DEUX NE VÉRIFIE MÊME PAS LA CLASSE. `eleve_read_questions_
--     actifs` ne demande que « le quizz est lancé » ET « je suis un élève » :
--     n'importe quel élève de la plateforme lisait les réponses de n'importe
--     quel quizz. Les policies étant OR'ées, le contrôle de classe de sa
--     jumelle `quazian_questions_eleve_classe` ne servait à rien.
--
-- ⭐ CE QUE FAIT CETTE MIGRATION : elle retire les DEUX policies de lecture
--    élève. Elle ne touche NI la colonne NI ses droits — `prof_all_questions`
--    doit continuer de tout lire, et prof et élève partagent le même rôle
--    Postgres (`authenticated`) : un `revoke` de colonne aurait aveuglé le
--    diagnostic du professeur.
--
-- ⭐ CE QUI REMPLACE LA POLICY : le code, patron C1 déjà en place sur ce même
--    fichier pour les écritures — *« plus aucune policy d'écriture élève sur
--    quazian_sessions : l'insert passe par le client admin, gardé par la garde
--    de classe »*. Les trois lectures d'`app/eleve/modules/quazian/quizz/
--    [quizId]/actions.ts` passent au client admin, chacune derrière
--    `chargerQuizAccessible` — qui vérifie LA CLASSE, ce que la policy retirée
--    ne faisait pas. La garde devient donc PLUS stricte, pas moins.
--
-- ⚠️ ORDRE : **CODE D'ABORD, SQL ENSUITE** (règle R6). Le code déployé avant
--    cette migration lit encore `quazian_questions` avec le client de l'élève ;
--    jouer le SQL en premier casserait la passation le temps de l'écart.
--
-- ⚠️ INERTE EN PRODUCTION AU 29/08 : 0 quizz, 0 question en base. La fuite y
--    est réelle dans le code mais sans objet — elle deviendrait live au premier
--    quizz `lance` de l'année. En bac à sable : 1 quizz `ferme`, 5 questions.
--
-- Retour arrière : `c_rls_4_quazian_reponse_rollback.sql` (il ROUVRE la fuite).
-- ============================================================================

begin;

-- ── Constat de tête — ce que la table porte AVANT ──────────────────────────
do $$
declare
  v_policies text;
  v_questions bigint;
  v_quizz_ouverts bigint;
begin
  select string_agg(policyname || ' (' || cmd || ')', ', ' order by policyname)
    into v_policies from pg_policies where tablename = 'quazian_questions';
  select count(*) into v_questions from quazian_questions;
  select count(*) into v_quizz_ouverts from quazian_quizzes where statut in ('lance', 'ferme');
  raise notice 'AVANT — policies : %', coalesce(v_policies, '(aucune)');
  raise notice 'AVANT — % question(s), % quizz lance/ferme', v_questions, v_quizz_ouverts;
end $$;

-- ── Le geste ───────────────────────────────────────────────────────────────
-- ⛔ LES DEUX, ET PAS UNE. Les policies permissives s'ajoutent (OR) : en retirer
--    une seule ne ferme rien. *C'est le piège des doublons de socle déjà connu
--    du chantier — « dropper la policy lot1 seule ne ferme rien ».*
drop policy if exists eleve_read_questions_actifs   on quazian_questions;
drop policy if exists quazian_questions_eleve_classe on quazian_questions;

-- ── Contrôle de pied — il s'exécute AVANT le commit ───────────────────────
do $$
declare
  v_restantes text;
  v_select_eleve int;
  v_prof_intacte int;
  v_rls_active boolean;
begin
  select string_agg(policyname, ', ' order by policyname) into v_restantes
    from pg_policies where tablename = 'quazian_questions';

  -- ⭐ Le drapeau qui compte : plus AUCUNE policy ne rend la table lisible à
  --    un élève. On le mesure sur la DÉFINITION, pas sur les noms — une
  --    troisième policy oubliée compterait ici.
  select count(*) into v_select_eleve
    from pg_policies
   where tablename = 'quazian_questions'
     and cmd in ('SELECT', 'ALL')
     and qual not like '%''prof''%';

  select count(*) into v_prof_intacte
    from pg_policies where tablename = 'quazian_questions' and policyname = 'prof_all_questions';

  select relrowsecurity into v_rls_active from pg_class where relname = 'quazian_questions';

  raise notice 'APRÈS — policies restantes : %', coalesce(v_restantes, '(aucune)');
  raise notice 'APRÈS — lecture ouverte à un non-prof : % · prof intacte : % · RLS : %',
    v_select_eleve, v_prof_intacte, v_rls_active;

  if v_select_eleve <> 0 then
    raise exception 'ÉCHEC — % policy(ies) rendent encore la table lisible hors prof', v_select_eleve;
  end if;
  if v_prof_intacte <> 1 then
    raise exception 'ÉCHEC — `prof_all_questions` a disparu : le professeur ne lirait plus ses quizz';
  end if;
  if not v_rls_active then
    raise exception 'ÉCHEC — RLS désactivée sur quazian_questions';
  end if;
  raise notice '✅ les trois drapeaux sont bons.';
end $$;

commit;

-- ⭐ L'ÉPREUVE PAR PostgREST, elle, se joue APRÈS, hors transaction — un
--    contrôle en SQL ne prouve pas ce que l'API rend. Elle est au dépôt :
--      node scripts/recette/rls-quazian-c-rls-4.mjs
--    (elle sort ≠ 0 tant que la fuite existe, 0 quand elle est fermée.)
