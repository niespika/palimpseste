-- ============================================================================
-- Revue adversariale 2026-06-21 — corrections d'intégrité de l'effacement + RLS Codex.
-- À EXÉCUTER manuellement (process habituel), puis TESTER (effacer une classe de test
-- avec du travail Quazian/Codex/Aletheia et vérifier qu'il ne reste pas d'orphelins).
-- Idempotent (create or replace / drop policy if exists). Tout en une transaction.
--
-- Couvre : H4 (manuscrits Codex purgés à l'effacement — côté SQL, suppression des
-- lignes ; la purge des FICHIERS est faite par utils/effacement.ts), H5 (travail
-- Quazian orphelin), M3 (travail Aletheia orphelin), M4 (notes /20 supprimées par
-- UUID et non par nom), F2 (RLS codex_sessions resserrée à la classe de l'élève).
--
-- Principe : inscription_id n'étant JAMAIS peuplé sur le travail Quazian/Codex,
-- l'ancienne cascade inscriptions→inscription_id ne supprimait rien. On supprime
-- désormais via les liens de CLASSE réels (quiz.classe_id, session.classe_id,
-- scriptorium_unite_classes), indépendants de inscription_id.
-- ============================================================================

begin;

-- ── Effacement d'une classe ─────────────────────────────────────────────────
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
  delete from aletheia_capstone ac
   where ac.scriptorium_livre_id in (select unite_id from scriptorium_unite_classes where classe_id = p_classe_id)
     and ac.eleve_id in (select eleve_id from inscriptions where classe_id = p_classe_id)
     and not exists (
       select 1 from scriptorium_unite_classes uc
         join inscriptions i2 on i2.classe_id = uc.classe_id
        where uc.unite_id = ac.scriptorium_livre_id
          and i2.eleve_id = ac.eleve_id
          and uc.classe_id <> p_classe_id);

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

-- ── Retrait dur d'une inscription (élève × classe) ──────────────────────────
create or replace function retirer_inscription(p_inscription_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_eleve uuid; v_classe uuid;
begin
  select i.eleve_id, i.classe_id into v_eleve, v_classe
    from inscriptions i where i.id = p_inscription_id;
  if v_eleve is null then return; end if;

  -- Quazian — passation de CET élève sur les quizz de CETTE classe.
  delete from quazian_answers a
   using quazian_sessions s, quazian_quizzes q
   where a.session_id = s.id and s.quiz_id = q.id and q.classe_id = v_classe and s.eleve_id = v_eleve;
  delete from quazian_sessions s using quazian_quizzes q
   where s.quiz_id = q.id and q.classe_id = v_classe and s.eleve_id = v_eleve;
  delete from quazian_quiz_scores sc using quazian_quizzes q
   where sc.quiz_id = q.id and q.classe_id = v_classe and sc.eleve_id = v_eleve;

  -- Codex — travaux de cet élève sur les séances de cette classe (fichiers purgés côté action).
  delete from codex_travaux t using codex_sessions s
   where t.session_id = s.id and s.classe_id = v_classe and t.eleve_id = v_eleve;

  -- États FSRS / journal : seulement si l'élève n'a plus AUCUNE autre inscription.
  if not exists (select 1 from inscriptions where eleve_id = v_eleve and id <> p_inscription_id) then
    delete from quazian_review_log rl using quazian_card_states cs
      where rl.card_state_id = cs.id and cs.eleve_id = v_eleve;
    delete from quazian_card_states where eleve_id = v_eleve;
  end if;

  -- Aletheia — livres de cette classe, sauf partagés avec une autre classe de l'élève.
  delete from aletheia_travaux at
   where at.eleve_id = v_eleve
     and at.scriptorium_livre_id in (select unite_id from scriptorium_unite_classes where classe_id = v_classe)
     and not exists (select 1 from scriptorium_unite_classes uc
        join inscriptions i2 on i2.classe_id = uc.classe_id
       where uc.unite_id = at.scriptorium_livre_id and i2.eleve_id = v_eleve and uc.classe_id <> v_classe);
  delete from aletheia_capstone ac
   where ac.eleve_id = v_eleve
     and ac.scriptorium_livre_id in (select unite_id from scriptorium_unite_classes where classe_id = v_classe)
     and not exists (select 1 from scriptorium_unite_classes uc
        join inscriptions i2 on i2.classe_id = uc.classe_id
       where uc.unite_id = ac.scriptorium_livre_id and i2.eleve_id = v_eleve and uc.classe_id <> v_classe);

  delete from quazian_semester where classe_id = v_classe::text and eleve_id = v_eleve;

  delete from inscriptions where id = p_inscription_id; -- cascade le travail scopé restant
end;
$$;

-- ── F2 : RLS lecture élève des séances Codex restreinte à SES classes ────────
-- (auparavant : toute personne authentifiée pouvait lire toutes les séances.)
drop policy if exists codex_sessions_eleve_read on codex_sessions;
create policy codex_sessions_eleve_read on codex_sessions
  for select using (
    classe_id is null
    or exists (
      select 1 from inscriptions i
       where i.eleve_id = auth.uid()
         and i.statut = 'active'
         and i.classe_id = codex_sessions.classe_id
    )
  );

commit;
