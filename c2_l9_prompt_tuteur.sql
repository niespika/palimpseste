-- ============================================================================
-- C2 · L9 — Prompt du tuteur de « Discussion » éditable PAR SECTIONS.
-- Fichier : c2_l9_prompt_tuteur.sql — cf. PLAN_CHANTIERS_RENTREE.md §C2 (L9),
-- SPEC_scriptorium_rag.md §9.1/§9.3, PROMPT_Code_C2_L9_prompt_tuteur.md.
-- ----------------------------------------------------------------------------
-- CE QUE ÇA FAIT : trois colonnes d'override pour les trois SEULES sections que
-- le professeur peut retravailler depuis Scriptorium → Paramètres (ton,
-- relances, longueur), plus l'horodatage de la dernière modification. `NULL` =
-- défaut du code (et ses évolutions futures) — patron des prompts Fragments
-- (`fragments_config`) et Aletheia : on n'épingle jamais une copie du défaut.
--
-- CE QUE ÇA NE FAIT PAS — et c'est le point de sécurité du lot : les sections
-- VERROUILLÉES (anti-spoiler du cours, anti-spoiler par élève, périmètre de la
-- matière, citation des sources, refus nets) n'ont PAS de colonne. Elles vivent
-- dans utils/scriptorium-prompt-tuteur.ts et nulle part ailleurs ; ce sont elles
-- que le banc de calibration L8 valide. Aucun chemin d'écriture ne permet donc à
-- une édition prof de les écraser : le stockage lui-même n'existe pas.
--
-- ⚠️ `scriptorium_params.rag_prompt` (ancien override du prompt INTÉGRAL, L5)
-- n'est PLUS LU par le code depuis ce lot — le laisser vivant rouvrirait
-- exactement le chemin qu'on ferme. La colonne est CONSERVÉE telle quelle
-- (migration additive, rien de cassant, aucune donnée détruite) ; l'écran de
-- Paramètres signale son contenu s'il y en a un. Le bloc de constat en pied de
-- fichier dit s'il y en avait un au moment de l'exécution.
--
-- ── Protocole (règle R6) ─────────────────────────────────────────────────────
-- Additive et sans effet sur les flux existants : 4 colonnes NULLABLES, aucune
-- valeur par défaut (donc aucune réécriture de table, aucun verrou long), aucune
-- policy touchée, RLS de `scriptorium_params` inchangée (table prof-only).
-- → protocole NORMAL, pas de protocole renforcé.
-- Le gate `rag_actif` n'est pas touché : il reste dans l'état où il est (OFF).
-- Idempotent, rejouable (`add column if not exists`).
--
-- ── Ordre code / SQL ─────────────────────────────────────────────────────────
-- Le code de L9 tolère l'absence de ces colonnes : `lireReglagesRag` et l'écran
-- de Paramètres lisent `scriptorium_params` en `select('*')` — une colonne
-- absente n'y fait donc PAS échouer la lecture (sinon le gate et les modèles
-- tomberaient avec elle). Tant que ce fichier n'est pas joué : les trois
-- sections restent au défaut du code, l'enregistrement depuis l'écran prof,
-- lui, échoue proprement avec le message d'erreur de Postgres (colonne absente).
-- ============================================================================

begin;

alter table scriptorium_params
  add column if not exists rag_prompt_ton          text,        -- override « ton et persona »
  add column if not exists rag_prompt_relances     text,        -- override « relances »
  add column if not exists rag_prompt_longueur     text,        -- override « forme et longueur »
  add column if not exists rag_prompt_sections_maj timestamptz; -- dernière modif (bandeau « rejouer L8 »)

comment on column scriptorium_params.rag_prompt_ton is
  'C2·L9 — override prof de la section ÉDITABLE « ton et persona ». NULL = défaut du code (utils/scriptorium-prompt-tuteur.ts).';
comment on column scriptorium_params.rag_prompt_relances is
  'C2·L9 — override prof de la section ÉDITABLE « relances ». NULL = défaut du code.';
comment on column scriptorium_params.rag_prompt_longueur is
  'C2·L9 — override prof de la section ÉDITABLE « forme et longueur ». NULL = défaut du code.';
comment on column scriptorium_params.rag_prompt_sections_maj is
  'C2·L9 — horodatage de la dernière modification de section (NULL = tout au défaut). Alimente le bandeau « recommandé : rejouer le banc de calibration L8 ».';
comment on column scriptorium_params.rag_prompt is
  'L5 — ANCIEN override du prompt INTÉGRAL du tuteur. PLUS LU depuis C2·L9 (il permettrait d''écraser les sections verrouillées anti-spoiler). Conservé pour ne rien détruire ; le prompt s''édite désormais par sections (rag_prompt_ton / _relances / _longueur).';

commit;

-- ── Vérification (à exécuter après ; doit renvoyer colonnes_l9 = 4,
--    et sections_definies = 0 sur une base qui n'a jamais servi l'écran) ──────
-- select
--   (select count(*) from information_schema.columns
--      where table_schema = 'public' and table_name = 'scriptorium_params'
--        and column_name in ('rag_prompt_ton', 'rag_prompt_relances',
--                            'rag_prompt_longueur', 'rag_prompt_sections_maj'))
--                                                              as colonnes_l9,
--   (select (rag_prompt_ton is not null)::int
--         + (rag_prompt_relances is not null)::int
--         + (rag_prompt_longueur is not null)::int
--      from scriptorium_params where id = 1)                    as sections_definies,
--   (select rag_prompt_sections_maj from scriptorium_params where id = 1)
--                                                               as derniere_modif;
--
-- ── Constat sur l'ANCIEN prompt intégral (colonne devenue dormante) ──────────
-- Attendu d'après le rapport de calibration L8 du 25/07 (« ce que renvoie la
-- fonction quand rag_prompt est vide — état actuel ») : ancien_prompt = f.
-- Si t : le prompt du tuteur tournait avec un texte prof et ce lot le fait
-- revenir aux sections (verrouillées du code + éditables) — à lire avant de
-- conclure quoi que ce soit d'un run de calibration antérieur.
-- select rag_prompt is not null as ancien_prompt,
--        length(rag_prompt)     as longueur_ancien_prompt
--   from scriptorium_params where id = 1;
