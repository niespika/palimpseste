# La bascule vers le gabarit — à jouer DIMANCHE 6 septembre 2026, en production, sur le « go » de Louis

> Le routeur passe lundi 7 à 18:00 UTC (`/api/assiduite/hebdo`). Tout ce qui suit s'exécute depuis
> la racine de `palimpseste`, avec `.env.local` en place. **Rien de ceci ne se joue sans le « go »
> explicite de Louis** ; chaque étape a son relevé (lecture seule) AVANT son geste.
> Préfixe commun : `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/register-calibration-resolver.mjs`.

## Mesuré le 05/09 (nuit), avant tout geste
- Production : `gabarit_actif` OFF, `juge_documents_actif` OFF, aucun exercice 1.5 en base.
  Statut de recette : Synthèse `differee` (posée par Louis le 04/09 à 19:36 UTC), Connaissance `differee`.
- Bac à sable : `gabarit_actif` ON, juge OFF, 312 exercices 1.5 en `a_concevoir` (v1 + v2 d'avant la reprise).
- Les deux vagues, après la relecture de Louis : `gabarit-v1.json` (6 clés) et `gabarit-v2.json`
  (33 clés) dans `palimpseste-conception/generateur/banque/`.

## L'ordre, et la commande de chaque pas

0. **La veille** : `git fetch` puis `git merge --ff-only origin/main` (la séance Aletheia pousse) ;
   `npx tsc --noEmit` et `npx vitest run` verts.

1. **Le contrôle TS à blanc, contre la doctrine de production** (lecture seule) :
   ```
   … scripts/recette/import-a-blanc.mjs <conception>/generateur/banque/gabarit-v1.json prod
   … scripts/recette/import-a-blanc.mjs <conception>/generateur/banque/gabarit-v2.json prod
   ```
   Attendu : `IMPORTABLE`, 0 refus, tout « neuf ». Sinon on s'arrête là.

2. **Le dépôt des deux vagues en production** (écrit) :
   ```
   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/recette/deposer-import.mjs --prod <…>/gabarit-v1.json
   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/recette/deposer-import.mjs --prod <…>/gabarit-v2.json
   ```
   ⚠️ Le script lit les clés `PROD_*` du `.env.local` sur `--prod` — on n'échange rien dans le fichier.
   ⚠️ L'import REFUSE un `id_import` déjà en base : un second dépôt du même fichier ne fait rien.
   Attendu : 312 exercices, 312 matériaux entrés, tous `a_concevoir`.

3. **Les instances passent `concu`** (elles n'entrent au vivier qu'en `concu`) :
   ```
   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/recette/passer-concu.mjs --prod            # relevé
   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/recette/passer-concu.mjs --prod --applique
   ```
   C'est le geste de la validation en file (`validerEnFile`), jamais une entrée bloquée.

4. **L'ancienne banque 1.4 sort du routage** (réversible par `--retablis`) :
   ```
   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/recette/retirer-banque-14.mjs --prod            # relevé
   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/recette/retirer-banque-14.mjs --prod --applique
   ```
   ⛔ AVANT : vérifier par requête que la Synthèse est `differee` (`competences_statut_recette`),
   sinon ses élèves ne recevraient plus rien. Mesuré `differee` le 05/09 — re-mesurer dimanche.

5. **Les portes, dans cet ordre** — Scriptorium › Paramètres, en production :
   d'abord `juge_documents_actif` ON, puis `gabarit_actif` ON. Sans le juge, la porte des crans ne
   s'ouvre jamais au-dessus du 3 (mesuré en prod le 04/09 : 241 dépôts sur 480 fermés).

6. **Le smoke en production** : un dépôt de l'élève de test sur un exercice 1.5 (route
   `/eleve/modules/codex/exercice/<depot>`), la fiche de l'objet ouverte en semaine de méthode,
   le second cas en (b) ; puis `… scripts/recette/banc-porte-registre.mjs --prod` en lecture pour
   voir ce que le routeur fera lundi.

7. Lundi 18:00 UTC : le routeur. Tous les objets sont en semaine de méthode (crans 1·3·4), la
   porte ferme le reste. Mardi : `banc-porte-registre.mjs --prod --jours 1`.

## Retour arrière
- Portes : les deux interrupteurs à OFF (l'écran redevient celui d'hier à l'octet).
- Banque 1.4 : `retirer-banque-14.mjs --prod --retablis`.
- Les exercices 1.5 importés : ils restent en base ; à OFF ils ne sont pas servis. Pas de purge
  tant qu'un dépôt d'élève y pend (`exercices_depots → exercices` est en cascade).
