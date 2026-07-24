-- ============================================================================
-- RAG L1 — SECTION F seule : matérialisation one-shot des assignations.
-- Fichier : scriptorium_rag_l1_sectionF.sql — extrait AUTONOME du §F de
-- scriptorium_rag_l1.sql (archivé), à jouer À L'ÉTAPE DE DÉPLOIEMENT RAG (push
-- du 23/07). Les sections A–E de L1 sont DÉJÀ en base (L1 exécuté) → on ne
-- rejoue QUE §F. Idempotent (not exists) : ne matérialise que les instances
-- VIDES, ne retouche jamais les assignations déjà matérialisées.
-- ----------------------------------------------------------------------------
-- Ordre : (1) jouer le DRY-RUN ci-dessous et NOTER les comptes ; (2) jouer la
-- transaction begin…commit ; (3) jouer la VÉRIFICATION et comparer au dry-run.
-- ============================================================================

-- ╔══ DRY-RUN OBLIGATOIRE (à jouer AVANT, résultats à noter) ═════════════════╗
-- (1) Assignations à matérialiser (toutes les actives vivantes à instance vide) :
--   select count(*) as assignations_a_materialiser
--   from scriptorium_parcours_classes pc
--   join scriptorium_parcours p on p.id = pc.parcours_id and p.supprime_at is null
--   where pc.statut = 'active'
--     and not exists (select 1 from scriptorium_parcours_classe_creneaux e
--                     where e.parcours_classe_id = pc.id);
--
-- (2) Créneaux à copier (attendu = Σ nb créneaux modèle × nb assignations) :
--   select count(*) as creneaux_a_copier
--   from scriptorium_parcours_classes pc
--   join scriptorium_parcours p on p.id = pc.parcours_id and p.supprime_at is null
--   join scriptorium_parcours_creneaux cr on cr.parcours_id = pc.parcours_id
--   where pc.statut = 'active'
--     and not exists (select 1 from scriptorium_parcours_classe_creneaux e
--                     where e.parcours_classe_id = pc.id);
-- ╚═══════════════════════════════════════════════════════════════════════════╝

begin;

-- F.1 — Copie 1:1 des créneaux du modèle (semaine/ordre/ref/tranche/titre/note,
-- provenance renseignée). livre_type est une colonne générée → non insérée.
insert into scriptorium_parcours_classe_creneaux
  (parcours_classe_id, semaine, ordre, ref_type, contenu_id, livre_id,
   livre_semaine_debut, livre_semaine_fin, titre_affiche, note, modele_creneau_id)
select pc.id, cr.semaine, cr.ordre, cr.ref_type, cr.contenu_id, cr.livre_id,
       cr.livre_semaine_debut, cr.livre_semaine_fin, cr.titre_affiche, cr.note, cr.id
from scriptorium_parcours_classes pc
join scriptorium_parcours p on p.id = pc.parcours_id and p.supprime_at is null
join scriptorium_parcours_creneaux cr on cr.parcours_id = pc.parcours_id
where pc.statut = 'active'
  and not exists (
    select 1 from scriptorium_parcours_classe_creneaux e
    where e.parcours_classe_id = pc.id
  );

-- F.2 — Éléments des créneaux-CONTENU : 1 élément 'contenu' par créneau (aucune
-- section n'existe encore — l'éclatement par sections arrivera au L2 via la
-- re-découpe consciente). semaine = celle du créneau, ordre = 1. Garde
-- d'idempotence au grain créneau (not exists élément).
insert into scriptorium_parcours_classe_elements
  (creneau_id, ref_type, semaine, ordre)
select icc.id, 'contenu', icc.semaine, 1
from scriptorium_parcours_classe_creneaux icc
where icc.ref_type = 'contenu'
  and not exists (
    select 1 from scriptorium_parcours_classe_elements el
    where el.creneau_id = icc.id
  );

-- F.3 — Éléments des créneaux-LIVRE : 1 élément 'livre_semaine' par séance
-- k ∈ [a,b] (bornes explicites, ou entier = [min,max] des séances-docs du
-- livre), étalés semaine = S + (k − a) où S = semaine du créneau, CLAMPÉS à
-- nb_semaines (les excédents s'empilent sur la dernière semaine — l'avis prof
-- viendra avec la grille du L3). ordre = rang dans la semaine d'arrivée.
-- Un livre sans séance-doc et sans bornes explicites → aucun élément (skip).
with docs as (
  select unite_id, min(semaine) as mn, max(semaine) as mx
  from scriptorium_documents where semaine is not null group by unite_id
),
bornes as (
  select icc.id as creneau_id, icc.semaine as sem_creneau, p.nb_semaines,
         coalesce(icc.livre_semaine_debut, d.mn) as deb,
         coalesce(icc.livre_semaine_fin,   d.mx) as fin
  from scriptorium_parcours_classe_creneaux icc
  join scriptorium_parcours_classes pc on pc.id = icc.parcours_classe_id
  join scriptorium_parcours p on p.id = pc.parcours_id
  left join docs d on d.unite_id = icc.livre_id
  where icc.ref_type = 'livre'
    and not exists (
      select 1 from scriptorium_parcours_classe_elements el
      where el.creneau_id = icc.id
    )
)
insert into scriptorium_parcours_classe_elements
  (creneau_id, ref_type, livre_semaine, semaine, ordre)
select b.creneau_id, 'livre_semaine', k.seance,
       least(b.sem_creneau + (k.seance - b.deb), b.nb_semaines) as semaine,
       row_number() over (
         partition by b.creneau_id, least(b.sem_creneau + (k.seance - b.deb), b.nb_semaines)
         order by k.seance
       ) as ordre
from bornes b
cross join lateral generate_series(b.deb, b.fin) as k(seance)
where b.deb is not null and b.fin is not null and b.deb <= b.fin;

commit;

-- ╔══ VÉRIFICATION POST-MIGRATION (à jouer APRÈS, comparer au dry-run) ═══════╗
-- (1) Créneaux d'instance par assignation = nb créneaux modèle :
--   select pc.id, cl.nom as classe, p.titre as parcours,
--          (select count(*) from scriptorium_parcours_creneaux m
--           where m.parcours_id = pc.parcours_id) as creneaux_modele,
--          (select count(*) from scriptorium_parcours_classe_creneaux i
--           where i.parcours_classe_id = pc.id) as creneaux_instance
--   from scriptorium_parcours_classes pc
--   join scriptorium_parcours p on p.id = pc.parcours_id and p.supprime_at is null
--   join classes cl on cl.id = pc.classe_id
--   where pc.statut = 'active'
--   order by p.titre, cl.nom;
--
-- (2) Aucun élément né « vu » (attendu : 0) :
--   select count(*) as elements_vus_attendu_zero
--   from scriptorium_parcours_classe_elements where vu_at is not null;
-- ╚═══════════════════════════════════════════════════════════════════════════╝
