-- ============================================================================
-- LES DÉCALAGES D'UNE ASSIGNATION — pour que DEUX PARCOURS d'une classe
-- s'ALTERNENT au lieu de se superposer.
-- ----------------------------------------------------------------------------
-- ⭐ POURQUOI. « Aujourd'hui les parcours sont indépendants les uns des autres,
--    et je ne peux pas les lier pour que 2 parcours alternent » (Louis, 01/09).
--    L'exemple, mot pour mot : un parcours A de 5 semaines et un parcours B de
--    3 semaines, à poser sur 8 semaines d'enseignement dans cet ordre —
--      1: A1 · 2: A2 · 3: A3 · 4: B1 · 5: A4 · 6: B2 · 7: B3 · 8: A5
--
-- ⭐ CE QUI L'EMPÊCHAIT, ET C'EST UNE SEULE LIGNE DE CODE. `mapperParcours`
--    (utils/frise-enseignement.ts) traduisait la semaine k d'un parcours par
--        indexContinu = ancreIdx + (k − 1)
--    — CONSÉCUTIF par construction. Deux parcours datés dans la même fenêtre
--    occupaient donc fatalement les mêmes semaines d'enseignement. Cette colonne
--    ajoute un troisième terme : + d(k).
--
-- ⭐ LA FORME, ET POURQUOI ELLE EST CUMULATIVE. `decalages` est un objet jsonb
--    CLAIRSEMÉ : clé = numéro de semaine DU PARCOURS (texte), valeur = décalage
--    CUMULÉ à partir de cette semaine — pas un pas. Le A de l'exemple s'écrit
--        {"4": 1, "5": 3}
--    (sa semaine 4 saute 1 semaine, sa semaine 5 en saute 3 en tout) et le B
--        {"2": 1}
--    avec une date de début calée sur la 4ᵉ semaine d'enseignement.
--    ⚠️ Le cumul plutôt que le pas est délibéré : décaler une semaine décale
--       TOUTES LES SUIVANTES, et une représentation par pas obligerait à réécrire
--       chaque entrée à chaque geste. `{}` = consécutif, c'est-à-dire EXACTEMENT
--       le comportement d'avant ce champ.
--
-- ⛔ CE QUE CETTE COLONNE N'EST PAS. Ce n'est pas la durée du parcours
--    (`scriptorium_parcours.nb_semaines`, qui vit sur le MODÈLE et vaut pour
--    toutes ses classes), ni la date de début (`date_debut`, déjà par classe),
--    ni l'horaire figé (`horaire_snapshot`). Elle est le TROISIÈME terme du
--    calcul, et le seul qui rompt la consécutivité.
--    ⚠️ Elle ne déplace RIEN dans l'instance : les créneaux et les éléments
--       gardent leur numéro de semaine de parcours. C'est la traduction en DATE
--       qui change. Un horaire déjà publié ne bouge donc pas tant qu'on ne le
--       re-publie pas — l'écran signale l'écart.
--
-- ⚠️ ORDRE DE DÉPLOIEMENT INDIFFÉRENT, et c'est voulu. Le code lit `decalages`
--    par des requêtes SÉPARÉES et TOLÉRANTES (frise-serveur, instance-serveur,
--    scriptorium-corpus, aletheia-dates, plan-synthese, panoptique-serveur,
--    calendrier-a-faire) : colonne absente ⇒ repli sur `{}` ⇒ mapping consécutif,
--    exactement l'existant. Seul le bouton « décaler » répond alors « migration
--    pas encore jouée ». On peut donc pousser le code avant ou après ce fichier.
--
-- ⚠️ MIGRATION ADDITIVE : une colonne, `not null default '{}'`, aucune policy
--    touchée, aucune ligne réécrite (le DEFAULT d'une colonne ajoutée ne réécrit
--    pas la table depuis PG 11). Protocole NORMAL (`SUIVI_SQL.md` R6).
--
-- ⚠️ RÉPÉTITION À BLANC : copier le CORPS entre le `begin;` et le `commit;`,
--    JAMAIS le fichier entier — son `commit;` validerait la transaction d'essai
--    (`SUIVI_SQL.md`, point 6, vécu le 14/08).
--
-- Idempotent, rejouable : `add column if not exists`, contrainte gardée.
-- Retour arrière : `parcours_decalages_rollback.sql`.
-- Prérequis : `parcours_phase_a.sql` (table `scriptorium_parcours_classes`).
-- ============================================================================

begin;

alter table scriptorium_parcours_classes
  add column if not exists decalages jsonb not null default '{}'::jsonb;

comment on column scriptorium_parcours_classes.decalages is
  'Décalages de CETTE assignation : { "<semaine du parcours>": <décalage CUMULÉ en semaines d''enseignement> }. '
  '{} = semaines consécutives. Permet à deux parcours d''une même classe de s''alterner. '
  'Lu par utils/frise-enseignement.ts (mapperParcours), écrit par decalerSemaineInstance.';

-- Garde de FORME (pas de contenu) : un objet, jamais un tableau ni un scalaire.
-- Les valeurs sont validées applicativement (densifierDecalages est tolérant :
-- il ignore les clés < 2 ou hors bornes et force la monotonie) — une contrainte
-- SQL sur le contenu figerait ici une règle qui appartient au code.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'spc_decalages_objet_chk'
      and conrelid = 'scriptorium_parcours_classes'::regclass
  ) then
    alter table scriptorium_parcours_classes
      add constraint spc_decalages_objet_chk check (jsonb_typeof(decalages) = 'object');
  end if;
end $$;

commit;

-- ── Vérification (à lire APRÈS exécution) ───────────────────────────────────
-- Attendu : colonne_posee = t, contrainte_posee = t, non_objets = 0,
--           et decalages = {} sur TOUTES les assignations existantes
--           (aucune n'était décalée avant ce fichier).
select
  (select count(*) = 1 from information_schema.columns
     where table_name = 'scriptorium_parcours_classes' and column_name = 'decalages') as colonne_posee,
  (select count(*) = 1 from pg_constraint
     where conname = 'spc_decalages_objet_chk'
       and conrelid = 'scriptorium_parcours_classes'::regclass)                        as contrainte_posee,
  (select count(*) from scriptorium_parcours_classes
     where jsonb_typeof(decalages) is distinct from 'object')                          as non_objets,
  (select count(*) from scriptorium_parcours_classes)                                  as assignations,
  (select count(*) from scriptorium_parcours_classes where decalages <> '{}'::jsonb)   as deja_decalees;
