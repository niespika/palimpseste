#!/usr/bin/env bash
# ============================================================================
# dump_sandbox.sh — sauvegarde (schéma + données) de la base Supabase.
# ----------------------------------------------------------------------------
# Filet de sécurité AVANT une migration à risque (ex. c1_rls_eleve.sql) : capture
# l'état de la base dans backups/dump_AAAA-MM-JJ_HHMM.sql.gz (gitignoré).
#
#   ./scripts/dump_sandbox.sh                 # schéma + données, compressé
#   ./scripts/dump_sandbox.sh --schema-only   # (option) tout argument est passé
#   ./scripts/dump_sandbox.sh --data-only     #  tel quel à pg_dump, ex. pour
#   ./scripts/dump_sandbox.sh --exclude-schema=storage   #  affiner le périmètre
#
# ── Périmètre du dump ────────────────────────────────────────────────────────
# pg_dump exporte TOUS les schémas non système : `public` (toute l'app + ses
# policies RLS — c'est ce que touche/restaure C1), plus les schémas gérés
# `auth` (comptes élèves), `storage` (métadonnées fichiers), etc. On EXCLUT par
# défaut la plomberie de secrets `pgsodium`/`vault` : le rôle `postgres`
# (non superuser) ne peut pas lire ses tables → sans ça, pg_dump AVORTE en
# « permission denied » (et Supabase recrée ces schémas tout seul).
# ⚠️ Ce dump est un INSTANTANÉ de sécurité / référence de données. Ce n'est PAS
# un « restore clé en main » dans un NOUVEAU projet Supabase : un projet neuf
# n'est jamais vide (schémas auth/storage/extensions déjà provisionnés) → un
# `psql` brut s'y heurterait à des collisions « already exists ». Pour monter la
# prod propre (C11b), utiliser `supabase db dump` (officiel, cible les données
# utilisateur) ou la sauvegarde du dashboard, pas ce fichier tel quel.
#
# ── Chaîne de connexion (SUPABASE_DB_URL) ────────────────────────────────────
# Lue depuis .env.local (ou l'environnement). Dashboard Supabase → bouton
# « Connect » (barre du haut) → onglet « Session pooler » (recommandé : IPv4,
# marche partout) OU « Direct connection ». Copier l'URI, y remplacer
# [YOUR-PASSWORD] par le MOT DE PASSE DE LA BASE (Settings → Database → Reset
# database password — ce n'est PAS la service_role key), et la poser dans
# .env.local :
#   SUPABASE_DB_URL="postgresql://postgres.<ref>:MOT_DE_PASSE@aws-0-<region>.pooler.supabase.com:5432/postgres"
# ⚠️ NE PAS prendre le « Transaction pooler » (port 6543) : pg_dump ne marche
#    qu'en connexion session (port 5432).
# ✅ Colle le mot de passe TEL QUEL (brut) : le script découpe l'URL lui-même et
#    passe chaque morceau à libpq par variable d'environnement. Inutile donc de
#    %-encoder les caractères spéciaux (@ % ! …) — au contraire, ne les encode PAS.
# 🔒 Le mot de passe transite par PGPASSWORD (environnement), JAMAIS en argument
#    de pg_dump : il n'apparaît donc pas dans `ps`.
#
# ── Avoir pg_dump sur macOS (si « command not found: pg_dump ») ──────────────
# Option A — Postgres.app (déjà installé sur cette machine) : ajouter son bin au
#   PATH ('latest' suit les mises à jour de Postgres.app) :
#   echo 'export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"' >> ~/.zshrc
#   source ~/.zshrc && pg_dump --version
# Option B — Homebrew (si pas de Postgres.app) :
#   brew install libpq
#   echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc  # Mac Intel : /usr/local/opt/libpq/bin
#   source ~/.zshrc && pg_dump --version   # (libpq est « keg-only » → d'où le PATH)
# Règle de version : pg_dump doit être ≥ la version du serveur (Supabase = PG 15
# ou 17 ; Postgres.app 18 comme le libpq brew conviennent).
#
# ── Restaurer un dump (dans une base VIDE) ───────────────────────────────────
#   gunzip -c backups/dump_AAAA-MM-JJ_HHMM.sql.gz | psql "$SUPABASE_DB_URL"
# (Des avertissements de droits sont possibles sur les objets gérés et
#  n'invalident pas la sauvegarde. Cf. la note « Périmètre » ci-dessus pour le
#  cas d'un projet Supabase non vide.)
# ============================================================================
set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$RACINE/.env.local"
DEST_DIR="$RACINE/backups"

# ── 1. Résoudre SUPABASE_DB_URL (environnement prioritaire, sinon .env.local) ──
DB_URL="${SUPABASE_DB_URL:-}"
if [ -z "$DB_URL" ] && [ -f "$ENV_FILE" ]; then
  # Prend la dernière ligne SUPABASE_DB_URL=… ; retire la clé et le « = »,
  # sans découper sur d'éventuels « = » de la query string (?sslmode=…).
  DB_URL="$(awk '/^[[:space:]]*SUPABASE_DB_URL[[:space:]]*=/{
    sub(/^[[:space:]]*SUPABASE_DB_URL[[:space:]]*=[[:space:]]*/, ""); v=$0
  } END { print v }' "$ENV_FILE")"
  # Nettoyage : \r final (CRLF), espaces, guillemets entourants.
  DB_URL="${DB_URL%$'\r'}"
  DB_URL="${DB_URL#"${DB_URL%%[![:space:]]*}"}"
  DB_URL="${DB_URL%"${DB_URL##*[![:space:]]}"}"
  case "$DB_URL" in
    \"*\") DB_URL="${DB_URL#\"}"; DB_URL="${DB_URL%\"}" ;;
    \'*\') DB_URL="${DB_URL#\'}"; DB_URL="${DB_URL%\'}" ;;
  esac
fi

if [ -z "$DB_URL" ]; then
  echo "✗ SUPABASE_DB_URL introuvable (ni dans l'environnement, ni dans .env.local)." >&2
  echo "  Ajoute dans .env.local :" >&2
  echo '    SUPABASE_DB_URL="postgresql://postgres.<ref>:MOT_DE_PASSE@aws-0-<region>.pooler.supabase.com:5432/postgres"' >&2
  echo "  (Dashboard Supabase → Connect → Session pooler. Voir l'en-tête de ce script.)" >&2
  exit 1
fi

# ── 2. Vérifier pg_dump ──────────────────────────────────────────────────────
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "✗ pg_dump introuvable dans le PATH." >&2
  echo "  Si Postgres.app est installé (cas courant ici), ajoute son bin au PATH :" >&2
  echo "    echo 'export PATH=\"/Applications/Postgres.app/Contents/Versions/latest/bin:\$PATH\"' >> ~/.zshrc" >&2
  echo "    source ~/.zshrc && pg_dump --version" >&2
  echo "  Sinon : brew install libpq (voir l'en-tête de ce script)." >&2
  exit 1
fi

# ── 3. Cible horodatée ───────────────────────────────────────────────────────
mkdir -p "$DEST_DIR"
STAMP="$(date +%Y-%m-%d_%H%M)"
OUT="$DEST_DIR/dump_${STAMP}.sql.gz"
TMP="$OUT.partiel"
trap 'rm -f "$TMP"' EXIT

echo "▶ Dump de la base Supabase (schéma + données) → $OUT"
echo "  Cela peut prendre un moment selon la taille de la base…"

# ── 4. Découper l'URL en morceaux libpq (mot de passe hors de argv) ──────────
# On NE passe PAS l'URL à pg_dump (ni en argument — visible dans `ps` — ni via
# PGDATABASE — libpq n'y « expand » pas une URI, il la prend pour un nom de base).
# Parseur tolérant : coupe sur le DERNIER '@' (→ l'hôte) et le PREMIER ':' du
# userinfo (→ user/mot de passe). Un mot de passe brut avec '@', '%', '!'… passe
# donc sans %-encoding, et par PGPASSWORD (environnement), jamais en argv.
proto_removed="${DB_URL#*://}"
userinfo="${proto_removed%@*}"      # avant le DERNIER @  (= user:password)
hostpath="${proto_removed##*@}"     # après le DERNIER @  (= host:port/db?query)
PGUSER_V="${userinfo%%:*}"
PGPASS_V="${userinfo#*:}"
case "$hostpath" in
  */*) hostport="${hostpath%%/*}"; dbq="${hostpath#*/}" ;;
  *)   hostport="$hostpath";       dbq="postgres" ;;
esac
PGDB_V="${dbq%%\?*}"; [ -n "$PGDB_V" ] || PGDB_V="postgres"
query=""; case "$dbq" in *\?*) query="${dbq#*\?}" ;; esac
case "$hostport" in
  *:*) PGHOST_V="${hostport%:*}"; PGPORT_V="${hostport##*:}" ;;
  *)   PGHOST_V="$hostport";      PGPORT_V="5432" ;;
esac
# sslmode : honore ?sslmode=… de l'URL, sinon 'require' (Supabase impose le SSL).
case "$query" in *sslmode=*) SSLMODE_V="${query##*sslmode=}"; SSLMODE_V="${SSLMODE_V%%&*}" ;; *) SSLMODE_V="require" ;; esac

if [ -z "$PGHOST_V" ] || [ -z "$PGUSER_V" ] || [ "$PGUSER_V" = "$userinfo" ]; then
  echo "✗ SUPABASE_DB_URL illisible (attendu : postgresql://USER:MDP@HOTE:PORT/BASE)." >&2
  exit 1
fi

# ── 5. Dump → gzip, écrit d'abord en .partiel puis renommé si succès ─────────
# • --no-owner / --no-privileges : dépouille owners et GRANTs → restore plus
#   portable dans une base vide (ne « répare » pas un projet Supabase non vide,
#   cf. note « Périmètre »).
# • --exclude-schema pgsodium/vault : évite l'avortement « permission denied »
#   (tables de secrets illisibles par le rôle postgres). Absents ? no-op.
# Un `--exclude-schema=…` supplémentaire passé en argument est ajouté via "$@".
export PGHOST="$PGHOST_V" PGPORT="$PGPORT_V" PGUSER="$PGUSER_V" \
       PGPASSWORD="$PGPASS_V" PGDATABASE="$PGDB_V" PGSSLMODE="$SSLMODE_V"
if pg_dump \
     --no-owner --no-privileges \
     --exclude-schema='pgsodium' \
     --exclude-schema='pgsodium_masks' \
     --exclude-schema='vault' \
     --exclude-schema='supabase_vault' \
     "$@" \
   | gzip -9 > "$TMP"; then
  mv "$TMP" "$OUT"
  TAILLE="$(du -h "$OUT" | cut -f1)"
  echo "✔ Sauvegarde terminée : $OUT ($TAILLE)"
else
  echo "✗ Échec du dump — rien n'a été conservé." >&2
  echo "  Pistes : mot de passe SUPABASE_DB_URL correct (Settings → Database) ?" >&2
  echo "           bon hôte/port (Session pooler = port 5432, PAS 6543) ?" >&2
  echo "           « permission denied » sur un schéma géré → ajoute" >&2
  echo "           --exclude-schema=<schéma>, ou utilise \`supabase db dump\`." >&2
  exit 1
fi
