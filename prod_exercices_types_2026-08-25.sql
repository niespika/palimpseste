-- ============================================================================
-- PROD — `exercices_types` : les QUINZE objets, RELEVÉS SUR LA SANDBOX.
-- ----------------------------------------------------------------------------
-- ⛔ POURQUOI CE FICHIER EXISTE, ET PAS `c4_l1_seed.sql`.
--   Le seed d'origine date du **18/08**. Depuis, `c4_l9_bis_examen_produire_
--   macro.sql` a posé la contrainte `types_complet_macro_sans_cran_chk` — un
--   type de nature `complet` DOIT porter `grain = 'macro'` et aucun cran — et a
--   corrigé les deux examens diagnostiques en conséquence. **Le seed, lui, les
--   insère encore avec `grain = null`** : le rejouer contre le schéma d'aujourd'hui
--   échoue sur la contrainte (constaté en prod le 25/08).
--   ⭐ C'est exactement la règle 4 du `SUIVI_SQL.md` : « on ne rejoue jamais un
--   fichier de l'archive — LA BASE SANDBOX FAIT FOI ». Ce fichier est donc
--   RELEVÉ SUR LA SANDBOX, pas recopié d'une migration ancienne.
--
-- ⚠️ CE QU'IL PORTE, ET CE QU'IL NE PORTE PAS. Il pose l'IDENTITÉ des quinze
--   objets (code, nature, grain, supports, genres, compétences, mode de saisie).
--   Les trois colonnes DÉRIVÉES — `crans_admis`, `exclusions_parcours`,
--   `libelle` — sont posées ici à leur valeur de sandbox, mais **c'est le
--   dériveur qui en fait foi** : `doctrine_prod_*.sql` les réécrit par un
--   `update`, et c'est lui qui doit passer APRÈS.
--
-- ⭐ Les `id` sont ceux de la sandbox, à dessein : les deux bases restent
--   comparables, et rien en prod ne référence encore ces lignes.
-- ⭐ IDEMPOTENT : `on conflict (code) do nothing`. Aucun `delete`.
--
-- ORDRE : **CE FICHIER, PUIS `doctrine_prod_2026-08-25.sql`** — les cinq tables
--   de doctrine qui font un `join` sur `exercices_types` rendent ZÉRO ligne,
--   SANS ERREUR, tant que cette table est vide.
-- ============================================================================

begin;

select count(*) as types_avant_attendu_0 from public.exercices_types;

insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('4af41865-de43-4e07-b856-ab63671f4b19'::uuid, 'argument', 'moment', 'meso', '{extrait}'::text[], null, '{expression,argumentation,structure,questionnement,connaissance}'::text[], '{}'::text[], '{1,2,3,4,5,6,7,8,9}'::text[], null, null, true, 'L''argument') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('ed8a9913-613e-4577-ba16-1e7610bb73a0'::uuid, 'conclusion', 'moment', 'macro', '{texte}'::text[], '{dissertation_tc,explication_texte_tc,interpretation_hlp,essai_hlp}'::text[], '{expression,structure,questionnement,synthese}'::text[], '{}'::text[], '{1,2,3,4,5,6,7,8,9}'::text[], null, null, true, 'La conclusion') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('403b7256-9f1b-474b-80b9-9890a23feb15'::uuid, 'examen_diagnostique_essai', 'complet', 'macro', '{}'::text[], '{dissertation_tc,essai_hlp}'::text[], '{expression,argumentation,structure,connaissance,synthese,questionnement}'::text[], '{}'::text[], '{}'::text[], 'manuscrit', null, true, 'L''examen diagnostique — l''essai') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('5a0d0622-8851-441e-b818-4401b9bf155f'::uuid, 'examen_diagnostique_explication_texte', 'complet', 'macro', '{texte}'::text[], '{explication_texte_tc,interpretation_hlp}'::text[], '{expression,argumentation,structure,connaissance,synthese,questionnement}'::text[], '{}'::text[], '{}'::text[], 'manuscrit', null, true, 'L''examen diagnostique — l''explication de texte') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('9afd7c87-e443-43a2-a459-b5ffb25a55c7'::uuid, 'exemple', 'moment', 'meso', '{extrait}'::text[], null, '{expression,argumentation,structure}'::text[], '{}'::text[], '{1,2,3,4,5,6,7,8,9}'::text[], null, null, true, 'L''exemple') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('37a436c3-4368-43dc-91e3-c1898fc0e3ef'::uuid, 'introduction', 'moment', 'macro', '{texte}'::text[], '{dissertation_tc,explication_texte_tc,interpretation_hlp,essai_hlp}'::text[], '{expression,structure,questionnement}'::text[], '{}'::text[], '{1,2,3,4,5,6,7,8,9}'::text[], null, null, true, 'L''introduction') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('2d8a03a1-2071-457b-80a9-f47e02c820ec'::uuid, 'mot', 'element', 'micro', '{phrase,extrait,texte}'::text[], null, '{expression,argumentation,structure,questionnement,connaissance}'::text[], '{}'::text[], '{1,2,3,4,5,6,7,8,9}'::text[], null, null, true, 'Le mot') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('e310c8bf-b81d-47ae-93cd-fcc5a2c0e537'::uuid, 'objection', 'moment', 'meso', '{extrait}'::text[], null, '{expression,argumentation,structure,questionnement,connaissance}'::text[], '{}'::text[], '{1,2,3,4,5,6,7,8,9}'::text[], null, null, true, 'L''objection') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('a08dd7ee-ca73-40db-8ed4-dac9fed7e8b1'::uuid, 'paragraphe', 'element', 'meso', '{extrait}'::text[], null, '{expression,argumentation,structure,questionnement,synthese,connaissance}'::text[], '{}'::text[], '{1,2,3,4,5,6,7,8,9}'::text[], null, null, true, 'Le paragraphe') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('4763b3d2-bb06-4dee-9a9b-ace90026bff1'::uuid, 'partie', 'element', 'macro', '{texte}'::text[], '{generique,partie_synthese_tc,explication_texte_tc}'::text[], '{expression,argumentation,structure,questionnement,synthese,connaissance}'::text[], '{}'::text[], '{1,2,3,4,5,6,7,8,9}'::text[], null, null, true, 'La partie') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('22648dc5-f69e-4eee-9767-472e11d460c4'::uuid, 'phrase', 'element', 'micro', '{extrait,texte}'::text[], null, '{expression,argumentation,structure,questionnement,synthese}'::text[], '{}'::text[], '{1,2,3,4,5,6,7,8,9}'::text[], null, null, true, 'La phrase') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('85c60116-fb40-4d89-8381-9688d46be65d'::uuid, 'plan', 'moment', 'meso', '{extrait}'::text[], null, '{expression,structure,questionnement}'::text[], '{}'::text[], '{1,2,3,4,5,6,7,8,9}'::text[], null, null, true, 'Le plan') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('cbb5aeaf-ee0b-4f2e-b137-3f418d9a9f62'::uuid, 'problematisation', 'moment', 'micro', '{extrait}'::text[], null, '{expression,questionnement,structure}'::text[], '{hlp}'::text[], '{1,2,3,4,5,6,7,8,9}'::text[], null, null, true, 'La problématisation') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('cdd66e0a-f3cc-4133-8bea-e5ca26952871'::uuid, 'reference', 'moment', 'micro', '{extrait}'::text[], null, '{expression,argumentation,connaissance}'::text[], '{}'::text[], '{1,2,3,4,5,6,7,8,9}'::text[], null, null, true, 'La référence') on conflict (code) do nothing;
insert into public.exercices_types (id, code, nature, grain, supports_source, genres_admis, competences, exclusions_parcours, crans_admis, mode_saisie, consigne_gabarit, actif, libelle) values ('d5818666-9b0d-4846-9a0d-97a6b6eed365'::uuid, 'transition', 'moment', 'micro', '{extrait}'::text[], null, '{expression,structure,questionnement}'::text[], '{}'::text[], '{1,2,3,4,5,6,7,8,9}'::text[], null, null, true, 'La transition') on conflict (code) do nothing;

select count(*) as types_apres_attendu_15 from public.exercices_types;
select count(*) as complets_attendu_2, count(*) filter (where grain = 'macro') as en_macro_attendu_2
  from public.exercices_types where nature = 'complet';

commit;
