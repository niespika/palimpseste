-- fix_effacer_classe.sql
-- ----------------------------------------------------------------------------
-- Corrige « Effacer une classe » (action effacerClasse → RPC effacer_classe).
-- Symptôme : la confirmation renvoyait 400 avec « column ac.eleve_id does not
-- exist » ; la fonction levait donc une erreur → rollback complet du bloc
-- plpgsql (la classe N'A PAS été effacée, aucune donnée perdue).
--
-- Cause : la version de review_fixes_2026-06-21.sql supprimait le capstone via
-- `aletheia_capstone.eleve_id`. Cette colonne a été SUPPRIMÉE depuis
-- (aletheia_affinages.sql) : le capstone est désormais UNIQUE et PARTAGÉ par
-- livre (clé scriptorium_livre_id), plus par élève. C'est exactement le même
-- décalage de schéma déjà corrigé pour `retirer_inscription`
-- (fix_retirer_inscription.sql).
--
-- Principe : le livre survit à l'effacement d'une classe (on ne fait que
-- détacher la réf classe, cf. `update scriptorium_unites`). Le capstone étant
-- partagé par livre, on n'y touche jamais ici — aligné sur retirer_inscription.
-- Cette version remplace celle de review_fixes_2026-06-21.sql.
-- Idempotent (create or replace). Une seule transaction.
-- ----------------------------------------------------------------------------

begin;

create or replace function effacer_classe(p_classe_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_nom text;
begin
  select nom into v_nom from classes where id = p_classe_id;
  if v_nom is null then return; end if;

  -- Quazian — passation : scopée via quiz.classe_id (les quizz eux-mêmes sont DÉTACHÉS).
  delete from quazian_answers a
   using quazian_sessions s, quazian_quizzes q
   where a.session_id = s.id and s.quiz_id = q.id and q.classe_id = p_classe_id;
  delete from quazian_sessions s
   using quazian_quizzes q
   where s.quiz_id = q.id and q.classe_id = p_classe_id;
  delete from quazian_quiz_scores sc
   using quazian_quizzes q
   where sc.quiz_id = q.id and q.classe_id = p_classe_id;

  -- États FSRS + journal : per-élève (aucune classe). On ne supprime QUE pour les élèves
  -- dont c'était la seule inscription (compte sans autre classe) afin de ne pas effacer la
  -- mémoire de révision d'un élève encore inscrit ailleurs.
  delete from quazian_review_log rl
   using quazian_card_states cs
   where rl.card_state_id = cs.id
     and cs.eleve_id in (
       select i.eleve_id from inscriptions i
        where i.classe_id = p_classe_id
          and not exists (select 1 from inscriptions j
                           where j.eleve_id = i.eleve_id and j.classe_id <> p_classe_id));
  delete from quazian_card_states cs
   where cs.eleve_id in (
       select i.eleve_id from inscriptions i
        where i.classe_id = p_classe_id
          and not exists (select 1 from inscriptions j
                           where j.eleve_id = i.eleve_id and j.classe_id <> p_classe_id));

  -- Codex — supprimer les séances de la classe (cascade vers codex_travaux + erreurs).
  -- Les FICHIERS du bucket sont purgés côté action (collecterCheminsInscriptions).
  delete from codex_sessions where classe_id = p_classe_id;

  -- Aletheia — travail des élèves de la classe sur les livres ASSIGNÉS à cette classe,
  -- sauf si le même livre est aussi assigné à une AUTRE classe de l'élève (travail partagé).
  delete from aletheia_travaux at
   where at.scriptorium_livre_id in (select unite_id from scriptorium_unite_classes where classe_id = p_classe_id)
     and at.eleve_id in (select eleve_id from inscriptions where classe_id = p_classe_id)
     and not exists (
       select 1 from scriptorium_unite_classes uc
         join inscriptions i2 on i2.classe_id = uc.classe_id
        where uc.unite_id = at.scriptorium_livre_id
          and i2.eleve_id = at.eleve_id
          and uc.classe_id <> p_classe_id);

  -- Capstone : PARTAGÉ par livre (plus de colonne eleve_id). Le livre survit à
  -- l'effacement de la classe → on ne touche PAS au capstone (cf. retirer_inscription).

  -- Notes /20 de semestre — la colonne stocke l'UUID de classe EN TEXTE (M4 : l'ancien
  -- code supprimait par NOM → les notes survivaient).
  delete from quazian_semester where classe_id = p_classe_id::text;

  -- DÉTACHER le contenu prof (vider la réf classe, garder le contenu).
  update scriptorium_unites    set classe_id = null, classe = null where classe_id = p_classe_id;
  update quazian_publications  set classe_id = null where classe_id = v_nom; -- publications = NOM (legacy)

  -- Supprimer la classe → cascade inscriptions + classe_modules ;
  -- quazian_quizzes.classe_id passe à NULL (définitions de quizz détachées).
  delete from classes where id = p_classe_id;
end;
$$;

commit;
