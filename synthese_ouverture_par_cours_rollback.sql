-- ============================================================================
-- ROLLBACK — retire `scriptorium_syntheses_reglages`.
-- N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ----------------------------------------------------------------------------
-- ⚠️ CE QUE LE DROP FAIT VRAIMENT, ET C'EST L'INVERSE DE L'INTUITION. Il
--    n'efface AUCUNE synthèse : les lignes `scriptorium_exercices_planifies`
--    sont intactes, avec leur statut et leurs séances Codex. Il efface les
--    INTENTIONS — donc, code encore en place, la lecture retombe sur son repli
--    « tout ouvert » : toutes les synthèses redeviennent visibles, ET la
--    création automatique à la fin d'un cours REPREND. Un rollback ne « met pas
--    en pause » : il RALLUME.
--
-- ⭐ SI L'INTENTION EST DE REVENIR EN ARRIÈRE PROPREMENT, l'ordre compte :
--    retirer d'abord le code (ou le laisser, il est tolérant), puis ce fichier.
--    Si l'intention est seulement de tout rouvrir sans perdre les réglages,
--    NE PAS jouer ce fichier : passer `ouverte = true` sur les lignes voulues
--    depuis l'écran d'instance, cours par cours.
--
-- ⭐ LIRE LE CONSTAT D'ABORD — il dit ce qui va être perdu, et ce qui va
--    réapparaître.
-- ============================================================================

-- ── Constat AVANT (à lire) : les intentions qui vont disparaître ────────────
select
  c.nom            as classe,
  p.titre          as parcours,
  ct.titre         as cours,
  r.ouverte,
  r.updated_at
from scriptorium_syntheses_reglages r
join scriptorium_parcours_classes pc on pc.id = r.parcours_classe_id
join scriptorium_parcours p          on p.id  = pc.parcours_id
join classes c                       on c.id  = pc.classe_id
join scriptorium_contenus ct         on ct.id = r.contenu_id
order by c.nom, p.titre, ct.titre;

-- ── Constat AVANT (à lire) : les synthèses qui redeviendront visibles ───────
select
  c.nom     as classe,
  ct.titre  as cours,
  e.statut,
  (e.codex_session_id is not null) as a_une_seance
from scriptorium_exercices_planifies e
join scriptorium_plans_evaluation pl on pl.id = e.plan_id
join classes c                       on c.id  = pl.classe_id
left join scriptorium_contenus ct    on ct.id = e.contenu_id
where e.type_exercice = 'synthese' and e.supprime_at is null and e.statut <> 'annule'
order by c.nom, ct.titre;

begin;

drop policy if exists syntheses_reglages_prof_all on scriptorium_syntheses_reglages;
drop table if exists scriptorium_syntheses_reglages;

commit;

-- ── Vérification (attendu : table_absente = t) ──────────────────────────────
select count(*) = 0 as table_absente
from information_schema.tables
where table_name = 'scriptorium_syntheses_reglages';
