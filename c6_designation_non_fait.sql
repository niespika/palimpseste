-- ============================================================================
-- ITEM 77 — LE STATUT `non_fait` : un dépôt qui a eu lieu et qui ne compte pas.
-- ----------------------------------------------------------------------------
-- ⭐ POURQUOI. Aux crans 4, 7 et 9, l'élève DÉSIGNE le passage dans le matériau
--    (`02-exercices.md` §5, v5.9). Quand sa zone COUVRE — au moins 70 % du
--    matériau ET au moins 4 fois la cible —, ce n'est pas une mauvaise réponse :
--    c'est une ABSENCE de réponse. « Surligner tout ne se fait pas juger, ça se
--    constate » (décision de Louis, 28/08). L'exercice est alors considéré comme
--    NON FAIT, rien ne part au modèle, et le professeur reçoit son signal.
--
-- ⛔⛔ POURQUOI PAS `abandonne`. Celui-là dit « NON-GESTE DE L'ÉLÈVE » — il
--    s'affiche « abandonné » sur les écrans (`utils/codex-onglets/regles.ts`) et
--    il désigne un exercice jamais ouvert. **Or l'élève a déposé.** Réemployer
--    `abandonne` ferait mentir trois écrans pour économiser une valeur.
--
-- ⭐ LE STATUT PORTE L'ÉTAT, LE SIGNALEMENT PORTE LA CAUSE. `non_fait` ne dit
--    pas POURQUOI — un jour, autre chose pourra y mener. Le ratissage, lui, vit
--    à `integrite_signalements`, avec `compte_strike = false` : c'est le
--    professeur qui confirme. *Un statut qui nommerait le ratissage serait une
--    trace déguisée en état.*
--
-- ⚠️ CE QUE `non_fait` FAIT À L'ASSIDUITÉ, ET C'EST LE POINT (`07-` §1.1) :
--    il n'est PAS dans `STATUTS_RENDUS` — donc il ne compte pas comme rendu —,
--    et il n'est pas `retire` — donc il RESTE AU DÉNOMINATEUR. C'est exactement
--    « l'exercice est considéré comme non fait ».
--
-- ⚠️ MIGRATION ADDITIVE ET SANS DONNÉE À REPRENDRE : elle élargit un CHECK, elle
--    ne réécrit aucune ligne, et elle N'ÉCRIT RIEN — son contrôle lui-même lit
--    le catalogue et ne touche aucune table. Protocole normal (`SUIVI_SQL.md`
--    R6, § « additives et gatées »).
--
-- ⚠️ RÉPÉTITION À BLANC : copier le CORPS entre le `begin;` et le `commit;` de
--    la fin, JAMAIS le fichier entier — son `commit;` validerait la transaction
--    d'essai (`SUIVI_SQL.md`, point 6, vécu le 14/08).
--
-- Retour arrière : `c6_designation_non_fait_rollback.sql`.
-- ============================================================================

begin;

-- ── 1. Le CHECK de `exercices_depots.statut` accueille `non_fait` ───────────
-- Le nom de la contrainte est celui que Postgres a donné à la création
-- (`c4_l1_schema.sql` §7, contrainte de colonne anonyme) : on le retrouve
-- plutôt que de le supposer.
do $$
declare
  nom text;
begin
  select con.conname into nom
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'exercices_depots'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%statut%'
    and pg_get_constraintdef(con.oid) like '%v1_remis%';

  if nom is null then
    raise exception 'CHECK du statut introuvable sur exercices_depots — ne pas continuer à l''aveugle';
  end if;

  execute format('alter table public.exercices_depots drop constraint %I', nom);
  execute format($f$
    alter table public.exercices_depots add constraint %I check (statut in (
      'assigne', 'ouvert', 'v1_remis', 'retour_publie', 'vf_remis', 'clos',
      'abandonne', 'retire', 'non_fait'))
  $f$, nom);
end $$;

comment on column public.exercices_depots.statut is
  'Le fil du dépôt (07- §1.1). `non_fait` : le dépôt a EU LIEU et ne compte pas — '
  'la désignation couvrait le matériau (02- §5, v5.9). Il n''est pas rendu, et il '
  'reste au dénominateur de l''assiduité. La CAUSE vit à integrite_signalements, '
  'jamais ici. Ne pas confondre avec `abandonne` (non-geste de l''élève).';

-- ── 2. Le contrôle — il doit passer AVANT le commit ─────────────────────────
-- ⛔⛔ IL NE TOUCHE AUCUNE DONNÉE, ET C'EST UNE CORRECTION. Une première version
--    insérait un dépôt d'essai pour éprouver le CHECK. Deux défauts : elle
--    ÉCRIVAIT dans une table de production, et surtout `uk_depots_eleve_exercice`
--    pouvait la faire échouer sur une COLLISION — le gestionnaire d'exception
--    aurait alors diagnostiqué « le CHECK refuse `non_fait` », ce qui est faux.
--    **Un contrôle qui peut mentir sur la cause est pire que pas de contrôle.**
--    On lit donc la DÉFINITION de la contrainte : elle dit tout, et ne risque
--    rien.
do $$
declare
  def text;
  manquante text;
begin
  select pg_get_constraintdef(con.oid) into def
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'exercices_depots'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%statut%'
    and pg_get_constraintdef(con.oid) like '%v1_remis%';

  if def is null then
    raise exception 'CHECK du statut introuvable APRÈS le remplacement — il a disparu';
  end if;
  if def not like '%non_fait%' then
    raise exception 'le CHECK ne porte pas `non_fait` : %', def;
  end if;

  -- ⚠️ Les HUIT anciennes valeurs doivent avoir survécu au remplacement : on
  --    a droppé une contrainte pour en reposer une, et en perdre une en
  --    chemin bloquerait des dépôts existants au prochain `update`.
  select v into manquante
  from unnest(array['assigne', 'ouvert', 'v1_remis', 'retour_publie', 'vf_remis',
                    'clos', 'abandonne', 'retire']) as v
  where def not like '%' || v || '%'
  limit 1;
  if manquante is not null then
    raise exception 'le remplacement a PERDU la valeur « % » : %', manquante, def;
  end if;

  raise notice 'CHECK reposé, neuf valeurs — %', def;
end $$;

commit;
