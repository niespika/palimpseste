-- ============================================================================
-- ROLLBACK — retire `scriptorium_parcours_classes.decalages`.
-- N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ----------------------------------------------------------------------------
-- ⚠️ DESTRUCTIF POUR L'ALTERNANCE, ET SEULEMENT POUR ELLE. Dropper la colonne
--    efface les décalages posés : chaque parcours redevient CONSÉCUTIF à partir
--    de sa date de début, donc deux parcours d'une même classe se superposent de
--    nouveau. Rien d'autre n'est perdu — ni les créneaux, ni les éléments, ni les
--    « vus », ni les dates de début, ni les horaires publiés.
--    ⚠️ Un horaire PUBLIÉ avec décalages reste figé tel quel dans
--       `horaire_snapshot` : il continue de faire foi, et l'écran signalera
--       simplement un écart avec la frise recalculée (redevenue consécutive).
--
-- ⭐ LIRE LE CONSTAT D'ABORD — il compte ce qui va disparaître.
-- ============================================================================

-- ── Constat AVANT (à lire) : quelles assignations perdent leur alternance ───
select
  pc.id,
  p.titre        as parcours,
  c.nom          as classe,
  pc.date_debut,
  pc.decalages,
  (pc.horaire_snapshot is not null) as horaire_publie
from scriptorium_parcours_classes pc
join scriptorium_parcours p on p.id = pc.parcours_id
join classes c              on c.id = pc.classe_id
where pc.decalages <> '{}'::jsonb
order by c.nom, p.titre;

begin;

alter table scriptorium_parcours_classes
  drop constraint if exists spc_decalages_objet_chk;

alter table scriptorium_parcours_classes
  drop column if exists decalages;

commit;

-- ── Vérification (attendu : colonne_absente = t) ────────────────────────────
select count(*) = 0 as colonne_absente
from information_schema.columns
where table_name = 'scriptorium_parcours_classes' and column_name = 'decalages';
