# Relevé — la salve THLP « Les métamorphoses du moi » et la troisième voie du rattachement (10/09/2026)

Séance du jeudi 10/09/2026. Demande de Louis : une salve d'exercices du gabarit pour ses 15 THLP
(16 inscrits en prod, un élève hors classe qui n'utilise qu'Aletheia), crans 1·2·3·4·5·7·9, sur des
sujets de « La recherche de soi », **réduits aux « Métamorphoses du moi »**, servis par le routeur —
et **jamais aux 1HLP ni au tronc commun**, donc jamais en générique. Deux devoirs par clé.

## 1 · Ce qui a été mesuré avant d'écrire (prod, lecture seule)

| Quoi | Mesure |
|---|---|
| THLP, inscriptions actives | 16 |
| Sujets `essai_hlp` portant une notion de « La recherche de soi » | 46, tous `cours_etat = notions` (Métamorphoses du moi : 20) |
| Banque du gabarit servable | 526 exercices, 38 clés, 61 devoirs, 7 objets, 16 sujets génériques |
| Cycle du 07/09 chez les THLP | 16 élèves, 65 décisions, 20 clés, 31 devoirs distincts, le plus partagé par 5 élèves |
| Cours à notions vus par les THLP | 1 (« Avant la Naissance – Nietzsche philologue », 4 notions du semestre) |
| Cours à notions vus par les 1HLP | 2, tous des « Pouvoirs de la parole » ; par les T5 : 3 (science, vérité, raison…) |

⛔ **Le vivier écartait tout sujet rattaché par notions** (`cours_par_notions_non_lu`, la « troisième
voie » de C4-L12 jamais écrite). Sans ce filtre, aucun devoir sur ces sujets ne serait servi ; en
générique, il irait aux 1HLP et aux T5. Louis : « ok pour la troisième voie ».

## 2 · Le lot de code — la troisième voie, derrière `notions_actif` (OFF)

- `utils/moteur/vivier.ts` : `MateriauRattache.notions`, `ContexteDuVivier.notionsVues / notionsActif`,
  motif `notion_pas_encore_vue`, la branche `notions` de `filtreDuCoursVu` (intersection par
  `ensembleDeNotions`, « servable dès qu'un cours vu déclare L'UNE de ses notions », `01-` §4 couche 4).
  Porte fermée : le motif d'hier, à l'octet.
- `utils/moteur/vivier-serveur.ts` : `notions` lues sur `exercices_sujets` et `exercices_textes` ;
  `lireLesNotionsDesCours` (`scriptorium_contenus.notions`, une lecture par cycle), `notionsVuesDe`.
- `utils/moteur/porte-notions.ts` : `lireLaPorteNotions` (requête séparée et tolérante, absente ⇒ OFF).
- `utils/moteur/cycle-serveur.ts`, `bonus-serveur.ts` : la porte et les notions passées au vivier
  (semaine et pull lisent la même règle).
- Tests : 4 cas neufs dans `vivier.test.ts` ; `tsc` propre ; **2622 tests verts**.
- SQL : `notions_actif.sql` (+ rollback), ligne au `SUIVI_SQL.md`, **jouée en bac à sable le 10/09**
  (`porte_posee = t`, `porte_a_off = t`). ☐ Prod : geste de Louis. ☐ Ouverture : geste de Louis.
- Recettes lecture seule : `scripts/recette/notions-vues.mjs` (par classe : cours vus, notions, sujets
  que la porte retiendrait — prod : THLP 53, 1HLP 0, T5 15 sujets tc sans devoir) ;
  `scripts/recette/vivier-notions.mjs` (le vivier en mémoire, porte fermée puis ouverte simulée —
  prod aujourd'hui : 474 retenues dans les deux cas, 0 instance par notions).

⚠️ Ouvrir la porte ouvre aussi, pour les T5, les 15 sujets `dissertation_tc` rattachés par notions —
sans effet tant qu'aucun devoir ne les porte (0 aujourd'hui). ⚠️ Le cours des THLP déclare aussi
« Création, continuités et ruptures » : un futur sujet de cette notion leur serait servable.

## 3 · La fabrique — le mode « lots fournis » (dépôt de conception, `generateur/`)

- `noyau/gabarit.py` : `lot_depuis_rendu` (le même `_controle` qu'un appel, la même tolérance d'allure).
- `vague-gabarit.py` : `--commandes DIR` (dépose prompt + commande + places tirées, `plan.json`),
  `--lots-fournis DIR` (lit `<souche>.json`, contrôle, assemble ; un refus laisse `.refus.txt`),
  `--sujets` (sujets nommés, le moins servi d'abord), `--par-cle N` (avec `--encore`).
- `controle-lot.py` (un rendu, ses rappels) ; `controle-c2.py` (recollage mot pour mot, un trou, noms).
- `revue-gabarit.py` : ⛔ **défaut trouvé et corrigé** — le dossier se faisait par clé ; avec deux
  devoirs d'une clé dans le fichier, le 1(b) et le 3 du premier devoir étaient pris pour le second,
  et un seul était relu. Désormais par SOUCHE quand la clé a plusieurs devoirs. `rendre-vague-revue.py`
  aligné (nom d'entrée = le devoir, l'en-tête dit la clé).

## 4 · La salve — `banque/gabarit-thlp1.json` + `gabarit-thlp1-c2.json`

- **Qui a écrit** : moi, Fable 5.1, par onze agents en séance (brief `lots/thlp-metamorphoses-2026-09-10/
  BRIEF-redacteur.md`), aucun appel d'API. Crans 2 dérivés par sept agents (`BRIEF-cran2.md`).
- 38 clés × 2 devoirs = **76 devoirs, 608 matériaux, 608 exercices** aux crans 1a·1b·3·4a·4b·5·7·9 ;
  **63 crans 2** (7 devoirs écartés : le corrigé ne porte pas la pièce — exemple.attache.absente d3/d4,
  objection.maillon.hors_these d3/d4, paragraphe.idee.theme d2, paragraphe.rattachement.absent d4,
  transition.annonce.vide d3 ; le plan n'a pas de cran 2).
- Sujets : `suj-jouer-un-role-est-ce-trahir-son-identite` (26 devoirs), `suj-est-on-le-meme-a-tous-les-
  ages-de-la-vie` (25), `suj-ecrire-sur-soi-permet-il-de-se-connaitre` (25) — déjà en base des deux
  côtés, `cours_etat = notions`, notion « Les métamorphoses du moi ».
- Contrôles : `verifie-import.py` IMPORTABLE (0 refus, 330 signalements : comptes de candidats, comme
  toujours) ; `verifie-vocabulaire.py` aucune régression ; `import-a-blanc.mjs` (TS, bac à sable)
  IMPORTABLE sur les deux fichiers — 608 + 63 exercices neufs, 3 sujets déjà en base.
- Revues adversariales (les six épreuves de l'avocat) : Luna `revue-thlp1-luna.json` ; Claude Sonnet 5
  en quatre travailleurs `revue-thlp1-claude-part0..3.json` (fusion à faire). Page :
  `rendre-vague-revue.py`.
- ⛔ Le dépôt en bac à sable par `deposer-import.mjs` a été **refusé par le classificateur** : c'est
  une commande de Louis.

## 4 bis · Le circuit en trois moments (rejoué le 10/09 au soir, sur rappel de Louis)

Outils, cette fois DANS le dépôt de conception (`generateur/corr/`) : `dossier-corrections.py` (un dossier
par devoir, les constats sous chaque pièce), `BRIEF-corrections.md` (R0-R4 de Louis), `controle-ops.py`,
`dossier-relecture.py` + `BRIEF-relecture.md`, `recolle-c2.py`, `rendre-corrections.py` ;
`applique-corrections.py` accepte une SOUCHE et `--banque` (copie) ; `revue-corrections-tri.py` lit `lotNN`.
- **Moment 1 — correcteurs** (10 agents Fable, un lot de 8 devoirs) : 126 ops, 228 dispositions
  (94 corrige · 131 pas un défaut · 3 signal_louis · **0 jeter**). Appliquées sur une copie : 26
  matériaux, 65 exercices touchés ; IMPORTABLE. Trois constats « seul deux-points » de Luna étaient faux.
- **Moment 2 — relecteurs bornés** (Opus + Sonnet par paire de lots, 10 agents) : « corrige / ne
  corrige pas » par pièce.
- **Moment 3 — tri** (`revue-corrections-tri.py`) : **37 gardées · 4 à trancher · 11 sorties** à la
  lettre. ⭐ **Arbitrage (à Louis de le renverser)** : aucun des 11 n'est « trop mal foutu » — 8 fois la
  correction répare un défaut réel sans traiter un second constat classé « pas un défaut » (R3, règle
  11) → gardées ; 3 versions fautives jugées DÉFENDABLES par les deux relecteurs → RETIRÉES
  (attache-ainsi-d3 v5, maillon-general-d4 v4, derniere-manquante-d4 v6, cinq versions restent) ; 1
  correction qui AGGRAVE (idee-neuve-d3, corrigée A) → op retirée. **Les 4 désaccords SORTENT (décision de Louis, 10/09 : « s'il y a un doute, ça ne sert à rien de garder la clé »)** : argument.garant.vague d4, exemple.attache.absente d3, objection.maillon.hors_these d3, paragraphe.rattachement.absent d4 — `banque/gabarit-thlp1-SORTIS-2026-09-10.json`.
  `corr/thlp1/arbitrages.json`, page « Corrections de la salve THLP ».
- **Résultat** : `banque/gabarit-thlp1-final.json` (128 ops, `ops-finales-2026-09-10.json`), **72
  devoirs, 576 exercices**, IMPORTABLE, vocabulaire sans régression ; `gabarit-thlp1-c2.json` recollé
  sur la corrigée finale (**62 crans 2**). **Ce sont ces deux fichiers qui se versent**, pas
  `gabarit-thlp1.json`.

## 5 · Les commandes qui restent à Louis

```bash
cd /Users/louissagnieres/Documents/GitHub/palimpseste && node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/register-ts-resolver.mjs scripts/recette/deposer-import.mjs /Users/louissagnieres/Documents/GitTest/palimpseste-conception/generateur/banque/gabarit-thlp1-final.json
```
puis le même sur `gabarit-thlp1-c2.json`, puis `passer-concu` ; en prod avec `--prod` ; la migration
`notions_actif.sql` en prod (`PROD_DB_URL`, référence `ucmngachkxvvlegntuwh` à lire avant) ; l'ouverture
de `notions_actif` ; le push de `main` (le code peut partir avant le SQL, la porte tolère l'absence).
Avant lundi 14/09 18:00 UTC pour le cycle suivant.

## 6 · Hors périmètre, noté dans `IDEES_post_rentree.md`
- Frontière de classe et de niveau des sujets (rien ne borne un devoir à une classe).
- Préférence au tirage « devoir par notions avant générique » — proposée, sans réponse, non écrite.

## 7 · État à la clôture (10/09, soir)
Commit `4595827` sur `main` local, **non poussé** : trois commits du pilote argument (autre séance) sont dessous, jamais poussés. Louis : on ne fait rien avant la fin des crans 6 et 8. Pour déployer ce lot seul : branche depuis `origin/main`, cherry-pick de `4595827`, `git push origin <branche>:main`. L'interrupteur `notions_actif` a sa carte dans Paramètres de Scriptorium (`PorteNotions.tsx`). Le dépôt de conception n'est pas commité (règle : sur demande).
