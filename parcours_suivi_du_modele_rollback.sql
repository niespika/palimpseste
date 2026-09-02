-- ============================================================================
-- ROLLBACK — retire `suit_modele` (assignations) et `modele_retire_at` (créneaux
-- d'instance). N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ----------------------------------------------------------------------------
-- ⚠️ IL RATTACHE. Dropper `suit_modele` remet TOUTES les classes à suivre le
--    modèle (le code retombe sur « toutes suivent ») : les prochains ajouts,
--    retraits, déplacements du modèle redescendront aussi dans les classes qui
--    s'en étaient détachées. Dropper `modele_retire_at` efface les jetons
--    « plus au modèle » — les copies elles-mêmes restent, servies et pilotées.
--    Rien d'autre n'est perdu : ni créneau, ni élément, ni « vu ».
--
-- ⭐ LIRE LES DEUX CONSTATS D'ABORD — ils comptent ce qui va changer.
-- ============================================================================

-- ── Constat 1 : les classes qui ne suivent plus le modèle (elles vont le suivre) ─
select pc.id, p.titre as parcours, c.nom as classe, pc.date_debut
from scriptorium_parcours_classes pc
join scriptorium_parcours p on p.id = pc.parcours_id
join classes c              on c.id = pc.classe_id
where not pc.suit_modele
order by c.nom, p.titre;

-- ── Constat 2 : les copies marquées « plus au modèle » (le jeton va disparaître) ─
select cr.id, cr.titre_affiche, cr.semaine, cr.modele_retire_at, c.nom as classe
from scriptorium_parcours_classe_creneaux cr
join scriptorium_parcours_classes pc on pc.id = cr.parcours_classe_id
join classes c                        on c.id = pc.classe_id
where cr.modele_retire_at is not null
order by c.nom, cr.semaine, cr.ordre;

begin;

alter table scriptorium_parcours_classes
  drop column if exists suit_modele;

alter table scriptorium_parcours_classe_creneaux
  drop column if exists modele_retire_at;

commit;

-- ── Vérification (attendu : colonnes_absentes = t) ──────────────────────────
select count(*) = 0 as colonnes_absentes
from information_schema.columns
where (table_name = 'scriptorium_parcours_classes' and column_name = 'suit_modele')
   or (table_name = 'scriptorium_parcours_classe_creneaux' and column_name = 'modele_retire_at');
