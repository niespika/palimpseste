#!/bin/bash
# ============================================================
# C0 — finalisation (à lancer depuis le dossier palimpseste) :
#   bash c0_finalisation.sh
# Fait 3 choses, dans l'ordre, en s'arrêtant à la moindre erreur :
#   1. retire le verrou git laissé par la session Cowork distante
#   2. committe les fichiers précieux non suivis (tout sauf .claude/)
#   3. supprime les 30 branches LOCALES déjà mergées dans main
#      (git branch -d est sûr : il REFUSE tout ce qui n'est pas mergé)
# Ne pousse RIEN (aucun déploiement déclenché).
# ============================================================
set -e
cd "$(dirname "$0")"

echo "— 1/3 · verrou git —"
rm -f .git/index.lock
echo "   ok"

echo "— 2/3 · commit des fichiers non suivis (sauf .claude/) —"
git add -A -- ':!.claude'
git commit -m "chore(C0): journal SQL, plan de rentrée, specs, runbook, maquettes et calibration non suivis" \
  -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" \
  -m "Claude-Session: https://claude.ai/code/session_01RTmSWzjkU5HvCQqK3cCEo8"
git log --oneline -1
echo "   ok"

echo "— 3/3 · purge des branches locales mergées (staging et main conservées) —"
git branch -d \
  chore/nettoyage-code-mort \
  feat/aletheia-fiche-eleve-prof-multi-livres \
  feat/aletheia-fiches-lecture \
  feat/aletheia-mode-c \
  feat/aletheia-reuse-synthese \
  feat/aletheia-seances \
  feat/aletheia-vf-contexte \
  feat/calendrier-config-maitre-detail \
  feat/eleves-classe-csv \
  feat/parcours-builder \
  feat/parcours-decisions-po \
  feat/parcours-fondation \
  feat/parcours-migration-l7 \
  feat/parcours-onglet-livres \
  feat/plan-eval-integration \
  feat/plan-eval-lot0 \
  feat/plan-eval-lot1 \
  feat/plan-eval-lot3 \
  feat/plan-eval-modele \
  feat/refonte-entete \
  feat/scriptorium-decoupe-charte \
  feat/scriptorium-editeur-unifie \
  feat/scriptorium-import-pdf \
  feat/scriptorium-livre-auteur-editeur \
  feat/scriptorium-parcours-charte \
  feat/scriptorium-retrait-onglets-legacy \
  feat/scriptorium-suppression-unite \
  feat/scriptorium-vue-livre \
  fix/aletheia-reference-batch \
  fix/scriptorium-fiche-titre-autorite

echo ""
echo "✅ C0 terminé. Dis simplement « C0 fait » à Claude dans Cowork."
echo ""
echo "ℹ️  Pour mémoire : ta branche main est en avance de 4 commits sur origin/main"
echo "    (le travail RAG récent n'est pas déployé). « git push » quand TU décides —"
echo "    rappel : pousser main = déployer palimpseste.ink."

# ------------------------------------------------------------
# OPTIONNEL — branches DISTANTES mergées (à décider au check-in
# du mercredi ; décommenter pour exécuter) :
# git push origin --delete \
#   chore/nettoyage-code-mort \
#   feat/aletheia-fiche-eleve-prof-multi-livres \
#   feat/aletheia-fiches-lecture \
#   feat/eleves-classe-csv \
#   feat/refonte-entete \
#   feat/scriptorium-editeur-unifie \
#   feat/scriptorium-import-pdf \
#   feat/scriptorium-livre-auteur-editeur \
#   feat/scriptorium-retrait-onglets-legacy \
#   feat/scriptorium-suppression-unite \
#   fix/aletheia-reference-batch
# ------------------------------------------------------------
