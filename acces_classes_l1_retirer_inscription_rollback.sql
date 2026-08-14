-- acces_classes_l1_retirer_inscription_rollback.sql
-- ----------------------------------------------------------------------------
-- ROLLBACK de `acces_classes_l1_retirer_inscription.sql` — n'exécuter qu'en cas
-- de problème. Restaure la définition de `retirer_inscription` telle qu'elle
-- était en base AVANT ce lot (relevée par `pg_get_functiondef` le 14/08, donc
-- l'état réel de la sandbox, pas une reconstitution de mémoire).
--
-- ⚠️ Ce fichier n'est PAS `fix_retirer_inscription.sql` (archive — ne jamais la
-- rejouer). Il en porte le même corps parce que la sandbox l'avait, mot pour
-- mot ; c'est une restauration d'état vérifiée, pas une reprise d'archive.
--
-- NON destructif : il ne supprime aucune donnée, il ne fait que rendre à la
-- fonction son périmètre d'avant. ⚠️ Ce faisant, il REMET le trou : les
-- conversations Scriptorium d'un élève retiré survivront de nouveau à son
-- retrait (élève × classe, aucune cascade ne les atteint). N'y revenir que si
-- la version d'août pose un problème mesuré — et le noter au journal.
-- ----------------------------------------------------------------------------

-- ── Constat AVANT (à lire) ───────────────────────────────────────────────────
select pg_get_functiondef(p.oid) like '%scriptorium_conversations%' as version_aout_en_place
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'retirer_inscription';

begin;

create or replace function retirer_inscription(p_inscription_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_eleve uuid; v_classe uuid; v_classe_nom text;
begin
  select i.eleve_id, i.classe_id, c.nom into v_eleve, v_classe, v_classe_nom
    from inscriptions i join classes c on c.id = i.classe_id
   where i.id = p_inscription_id;
  if v_eleve is null then return; end if;

  -- Quazian — passation de CET élève sur les quizz de CETTE classe.
  delete from quazian_answers a
   using quazian_sessions s, quazian_quizzes q
   where a.session_id = s.id and s.quiz_id = q.id and q.classe_id = v_classe and s.eleve_id = v_eleve;
  delete from quazian_sessions s using quazian_quizzes q
   where s.quiz_id = q.id and q.classe_id = v_classe and s.eleve_id = v_eleve;
  delete from quazian_quiz_scores sc using quazian_quizzes q
   where sc.quiz_id = q.id and q.classe_id = v_classe and sc.eleve_id = v_eleve;

  -- Codex — travaux de cet élève sur les séances de cette classe
  -- (les fichiers du stockage sont purgés côté action AVANT l'appel).
  delete from codex_travaux t using codex_sessions s
   where t.session_id = s.id and s.classe_id = v_classe and t.eleve_id = v_eleve;

  -- Aletheia — travaux sur les livres de cette classe, SAUF un livre partagé avec
  -- une autre classe de l'élève. Le capstone est partagé par livre → on n'y touche pas.
  delete from aletheia_travaux at
   where at.eleve_id = v_eleve
     and at.scriptorium_livre_id in (select unite_id from scriptorium_unite_classes where classe_id = v_classe)
     and not exists (
       select 1 from scriptorium_unite_classes uc
        join inscriptions i2 on i2.classe_id = uc.classe_id
       where uc.unite_id = at.scriptorium_livre_id and i2.eleve_id = v_eleve and uc.classe_id <> v_classe
     );

  -- États FSRS / journal : scopés par élève (partagés entre classes) → effacés
  -- seulement si l'élève n'a plus AUCUNE autre inscription.
  if not exists (select 1 from inscriptions where eleve_id = v_eleve and id <> p_inscription_id) then
    delete from quazian_review_log rl using quazian_card_states cs
      where rl.card_state_id = cs.id and cs.eleve_id = v_eleve;
    delete from quazian_card_states where eleve_id = v_eleve;
  end if;

  -- Notes de semestre Quazian : colonne classe_id en TEXTE legacy, mais elle stocke
  -- l'UUID de la classe (cast en texte) — pas le nom (cf. quazian_quizzes.classe_id
  -- converti en uuid au Lot 1, source des écritures de quazian_semester). On matche
  -- donc l'UUID ; on tolère aussi d'anciennes lignes au nom (pré-Lot 1) par sécurité.
  delete from quazian_semester
   where classe_id in (v_classe::text, v_classe_nom) and eleve_id = v_eleve;

  delete from inscriptions where id = p_inscription_id; -- cascade le travail scopé restant
end;
$$;

commit;

-- ── Vérification APRÈS ───────────────────────────────────────────────────────
select pg_get_functiondef(p.oid) like '%scriptorium_conversations%' as scriptorium_couvert -- attendu : f
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'retirer_inscription';
