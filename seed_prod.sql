-- ============================================================================
-- seed_prod.sql — configuration minimale d'une production neuve
-- ============================================================================
-- À exécuter après l'import du schéma public.
--
-- Ce seed ne copie rien depuis la sandbox : aucun compte, élève, classe,
-- parcours, livre, document, rendu ni fichier Storage. Il crée seulement le
-- catalogue technique des modules et les lignes de paramètres attendues par
-- l'application.
--
-- Tous les modules et tous les gates fonctionnels restent fermés. L'intégrité
-- reste active : c'est un garde-fou, pas un gate de fonctionnalité.
--
-- Idempotent : une configuration déjà modifiée n'est jamais écrasée.
-- ============================================================================

begin;

-- Catalogue technique des cinq modules. Les devises viennent de la source de
-- vérité versionnée dans components/nav/configModules.ts.
insert into public.modules (slug, nom, description, actif)
values
  ('quazian', 'Quazian', 'Ars Memoriae — Contre l''oubli', false),
  ('aletheia', 'Aletheia', 'Ars Legendi — Dévoiler ce qui se cache', false),
  ('fragments-erudition', 'Fragments d''Érudition', 'Ars Quaerendi — Que rien ne se perde', false),
  ('codex', 'Codex', 'Ars Scribendi — Écrire pour penser', false),
  ('scriptorium', 'Scriptorium', 'Ars Docendi — D''une main à l''autre', false)
on conflict (slug) do nothing;

-- Fuseau d'affichage. Le schéma fournit America/Toronto par défaut.
insert into public.calendrier_params (id)
values (1)
on conflict (id) do nothing;

-- Réglages Codex et Aletheia. Les prompts NULL utilisent les valeurs du code ;
-- les gates Aletheia sont OFF par défaut dans le schéma.
insert into public.codex_params (id)
values (1)
on conflict (id) do nothing;

insert into public.aletheia_params (id)
values (1)
on conflict (id) do nothing;

-- Maison unique des gates Scriptorium/RAG/Fabrique/Chaîne/Exercices/Routeur :
-- toutes les colonnes concernées ont false pour valeur par défaut.
insert into public.scriptorium_params (id)
values (1)
on conflict (id) do nothing;

-- Garde-fou d'intégrité : actif avec le seuil par défaut du schéma.
insert into public.integrite_params (id)
values (1)
on conflict (id) do nothing;

-- Fragments exige une ligne pour que l'écran puisse enregistrer ses réglages.
-- Les chaînes vides déclenchent volontairement les valeurs de repli du code.
insert into public.fragments_config (id, prompt_evaluation, bareme)
values (1, '', '')
on conflict (id) do nothing;

-- Quazian sait fonctionner sans ligne grâce au repli du code, mais matérialiser
-- ici ses valeurs canoniques rend l'écran de réglages immédiatement opérant.
insert into public.quazian_parametres (cle, valeur)
values (
  'global',
  '{"a":10,"b":1,"centre":14,"pente":3,"w":0.5,"retention_cible":0.9}'::jsonb
)
on conflict (cle) do nothing;

commit;
