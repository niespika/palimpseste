-- ============================================================================
-- Lot 5 — Phase 1 : modèle semestre (5.0)
-- ----------------------------------------------------------------------------
-- Tout Fragments se scope à un semestre. Le prof bascule le semestre « courant » ;
-- un sélecteur (contexte) au niveau du module, défaut = courant ; les semestres
-- passés restent consultables.
--
-- Additif et sûr : ajoute un marqueur + une FK, seede un semestre courant et
-- rattache les semaines existantes. (Le thème par semestre arrive en Phase 3,
-- avec la refonte de l'onglet Thèmes.)
-- ============================================================================

begin;

alter table fragments_semestres
  add column if not exists courant boolean not null default false;

-- Garantir exactement un semestre courant par défaut.
do $$
declare v_id uuid;
begin
  if not exists (select 1 from fragments_semestres) then
    insert into fragments_semestres (label, date_debut, date_fin)
    values ('Semestre 1',
            date_trunc('year', now())::date,
            (date_trunc('year', now()) + interval '6 months')::date)
    returning id into v_id;
    update fragments_semestres set courant = true where id = v_id;
  elsif not exists (select 1 from fragments_semestres where courant) then
    update fragments_semestres set courant = true
     where id = (select id from fragments_semestres order by date_debut desc limit 1);
  end if;
end $$;

-- Scope des semaines par semestre + backfill au semestre courant.
alter table fragments_semaines
  add column if not exists semestre_id uuid references fragments_semestres(id) on delete set null;

update fragments_semaines
   set semestre_id = (select id from fragments_semestres where courant limit 1)
 where semestre_id is null;

commit;
