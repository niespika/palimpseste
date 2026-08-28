-- ============================================================================
-- RETOUR ARRIÈRE de `c6_designation_non_fait.sql` — le CHECK reperd `non_fait`.
-- ----------------------------------------------------------------------------
-- ⛔⛔ IL REFUSE DE TOURNER S'IL RESTE DES DÉPÔTS `non_fait`. Le CHECK ne peut
--    pas se resserrer sur des lignes qui le violent, et Postgres le dirait de
--    lui-même — mais avec une erreur de contrainte, pas avec la raison. On
--    préfère nommer la raison, et surtout NE PAS décider à la place de Louis ce
--    que devient un dépôt refusé : le remettre à `v1_remis` le ferait compter
--    comme rendu, le passer à `abandonne` ferait mentir trois écrans.
--    **Ces dépôts se traitent à la main, avant de rejouer ceci.**
--
-- ⚠️ La ligne d'`integrite_signalements` qui porte la CAUSE n'est pas touchée :
--    elle est la trace d'un fait, et un retour arrière de schéma n'efface pas
--    un fait. Si elle doit partir, elle part par le geste du professeur.
-- ============================================================================

begin;

do $$
declare
  n int;
  nom text;
begin
  select count(*) into n from public.exercices_depots where statut = 'non_fait';
  if n > 0 then
    raise exception
      '% dépôt(s) portent `non_fait` : les traiter À LA MAIN avant de resserrer le CHECK. '
      'Ni `v1_remis` (il compterait comme rendu) ni `abandonne` (il mentirait) ne conviennent '
      'd''office — c''est une décision, pas une conversion.', n;
  end if;

  select con.conname into nom
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'exercices_depots'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%statut%'
    and pg_get_constraintdef(con.oid) like '%v1_remis%';

  if nom is null then
    raise exception 'CHECK du statut introuvable sur exercices_depots';
  end if;

  execute format('alter table public.exercices_depots drop constraint %I', nom);
  execute format($f$
    alter table public.exercices_depots add constraint %I check (statut in (
      'assigne', 'ouvert', 'v1_remis', 'retour_publie', 'vf_remis', 'clos',
      'abandonne', 'retire'))
  $f$, nom);
end $$;

comment on column public.exercices_depots.statut is
  'Le fil du dépôt (07- §1.1).';

commit;
