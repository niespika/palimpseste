-- Phase 3 / T6 — bulles d'aide « comment remplir » éditables par le prof (Aletheia V1)
-- Les 5 champs de saisie V1 (idée principale, arguments, accord, questions,
-- vocabulaire) ont un placeholder d'aide. On les rend éditables par le prof
-- (null = on retombe sur le texte par défaut du code).

alter table aletheia_params
  add column if not exists aide_these text,
  add column if not exists aide_arguments text,
  add column if not exists aide_accord text,
  add column if not exists aide_questions text,
  add column if not exists aide_vocabulaire text;
