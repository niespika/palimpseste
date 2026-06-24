-- Phase 3 / T6 — bulles « comment faire » de Codex éditables par le prof
-- Les consignes affichées à l'élève (V1 « écris de mémoire, livre fermé » et VF
-- « réécris en entier ») deviennent éditables. null = texte par défaut du code.

alter table codex_params
  add column if not exists consigne_v1 text,
  add column if not exists consigne_vf text;
