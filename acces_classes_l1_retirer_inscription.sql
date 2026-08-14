-- acces_classes_l1_retirer_inscription.sql
-- ----------------------------------------------------------------------------
-- Accès & classes · L1 (14/08) — `retirer_inscription` alignée sur le schéma
-- d'AOÛT. Reprise de la version de juin (`fix_retirer_inscription.sql`, ARCHIVE :
-- ne jamais la rejouer) ; ce fichier est la SEULE version à exécuter désormais.
--
-- ── Ce que le diagnostic a établi (14/08, en base sandbox) ──────────────────
-- La croix de retrait du Pilotage « ne retirait rien » : la cause est le
-- `confirm()` natif côté code (le handler s'arrêtait avant toute requête), PAS
-- cette fonction. Vérifié : les **12 FK qui pointent `inscriptions` sont toutes
-- `on delete cascade`** — aucune ne bloque le delete ; les FK élève-scopées
-- pointent `profiles`, qu'un retrait ne touche pas. Une répétition à blanc du
-- retrait (Sacha × T5, transaction annulée) est passée sans erreur.
--
-- MAIS la fonction laisse du travail ORPHELIN, et c'est ce que ce fichier
-- corrige : `scriptorium_conversations` est née en juillet (RAG L5,
-- `scriptorium_rag_l5_chat.sql`), APRÈS la version de juin. Elle est scopée
-- (élève × CLASSE) sans `inscription_id` : aucune cascade ne l'atteint, et la
-- fonction ne la nommait pas. Constaté par répétition à blanc le 14/08 — une
-- conversation semée sur Sacha × Test, retrait joué, `rollback` : **la
-- conversation ET son message survivaient au retrait**. Conséquence réelle :
-- un élève retiré puis ré-inscrit retrouvait ses conversations d'avant, et le
-- prof croyait le travail parti.
--
-- Ce qui n'est VOLONTAIREMENT pas touché, et pourquoi :
--   • `api_couts` (élève × classe, `on delete set null`) — journal de coûts, pas
--     du travail d'élève : il doit survivre au départ de l'élève.
--   • `aletheia_capstone` — partagé par LIVRE, jamais par élève (déjà le cas).
--   • `integrite_signalements` / `integrite_evenements` — scopés par ÉLÈVE et non
--     par classe : le dossier d'intégrité suit le compte, pas l'inscription.
--   • `quazian_card_states` porte désormais un `inscription_id` (cascade), mais
--     il est NULL sur les 35 lignes existantes : la branche « dernière
--     inscription » ci-dessous reste donc la seule à les effacer, comme voulu.
--
-- ⚠️ PROTOCOLE RENFORCÉ (règle 5 de SUIVI_SQL.md) : fonction d'un flux existant
-- (retrait d'élève, destructif) → code mergé+poussé D'ABORD, SQL ensuite,
-- fenêtre calme, rollback prêt (`acces_classes_l1_retirer_inscription_rollback.sql`),
-- smoke test élève immédiat.
-- ⚠️ Répétition à blanc : copier le CORPS entre `begin;` et `commit;`, jamais le
-- fichier entier (règle 6 — le `commit;` du fichier validerait la transaction
-- d'essai, comme le 14/08 sur `c7_quazian_sections.sql`).
-- ----------------------------------------------------------------------------

-- ── Constat AVANT (à lire) ───────────────────────────────────────────────────
-- Combien de conversations survivraient aujourd'hui à un retrait ?
select c.nom as classe, p.display_name as eleve, count(*) as conversations_qui_survivraient
  from scriptorium_conversations sc
  join inscriptions i on i.eleve_id = sc.eleve_id and i.classe_id = sc.classe_id
  join classes c on c.id = sc.classe_id
  join profiles p on p.id = sc.eleve_id
 group by 1, 2
 order by 1, 2;

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

  -- ⚠️ AJOUT du 14/08 (Accès & classes · L1) — Scriptorium : les conversations du
  -- tuteur sont scopées (élève × CLASSE) SANS `inscription_id`, donc aucune
  -- cascade ne les atteint. Sans cette ligne, elles survivaient au retrait et
  -- revenaient telles quelles à une ré-inscription. Les messages suivent par la
  -- FK `scriptorium_messages.conversation_id on delete cascade`.
  delete from scriptorium_conversations
   where eleve_id = v_eleve and classe_id = v_classe;

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

-- ── Vérification APRÈS exécution ─────────────────────────────────────────────
-- Un seul drapeau : la fonction nomme-t-elle bien le Scriptorium ?
select
  pg_get_functiondef(p.oid) like '%scriptorium_conversations%' as scriptorium_couvert,
  p.prosecdef                                                  as security_definer_intact
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'retirer_inscription';
