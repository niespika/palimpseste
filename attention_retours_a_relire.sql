-- Chantier ①, 08/09/2026 : ouverture du signal des FUTURS retours non lus.
-- Configuration seulement : aucun état de contrôle recopié sur un retour.
-- NULL = OFF. Une date = ON pour les retours créés à partir de cette date.
-- Additif, sans défaut, sans réécriture des données des élèves ni des policies.
-- Sandbox d'abord ; la production et l'ouverture sont les gestes de Louis.
-- Ouvrir une seule fois après déploiement : poser l'instant courant sur id = 1.
-- Refermer : remettre ce paramètre à NULL. Aucun retour n'est effacé.
begin;
alter table public.scriptorium_params
  add column if not exists retours_a_relire_depuis timestamptz;
comment on column public.scriptorium_params.retours_a_relire_depuis is
  'NULL : signal fermé. Sinon : retours créés depuis cette ouverture, publiés et non lus seulement (Louis, 08/09/2026).';
commit;

select id, retours_a_relire_depuis from public.scriptorium_params where id = 1;
