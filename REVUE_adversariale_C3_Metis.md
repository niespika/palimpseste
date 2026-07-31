# REVUE adversariale C3 — part Mètis (chiffrages + cohérence spec ↔ sources)

**Statut** : passe réduite du 28/07, faite **en aveugle** des deux revues externes (ChatGPT, Opus 5 — balayage large avec `PROMPT_Revue_adversariale_externe.md`). Constats numérotés **M1-M7**, même échelle de gravité que les G-lists externes (`BLOQUANT-GEL` / `AVANT-ALLUMAGE` / `À SURVEILLER`) — pour la fusion avant le gel du 29/07.

**Périmètre assumé** : ce que les externes ne peuvent pas faire — les chiffrages sur données réelles des bancs, et la cohérence de la spec avec les cinq sources de vérité (qu'ils n'ont pas). Le balayage large (calendrier, UX élève, triche, pannes, légal…) est chez eux.

---

## 1. Chiffrage — coût d'exploitation à l'échelle (70 élèves)

**Données réelles** (banc Expression, run 2 du 28/07, v1.2.1 « relevé par exception ») : une évaluation P1+P2 d'une copie sur UNE compétence = **0,073 $ (Sonnet)** / **0,019 $ (Haiku)** — 21 passages, zéro troncature. OCR estimé (à confirmer à l'étage OCR du banc) : **~0,017 $/page** en modèle Sonnet-class, ÷3-4 en Haiku-class.

| Poste | Hypothèses | Tout-Sonnet | Mix économe* |
|---|---|---|---|
| **Cycle formatif écriture** | v1 : cible + 1 secondaire (2 évals) ; vf : cible (1 éval) ; OCR 3 pages × 2 versions ; 2 retours générés | **~0,36 $** | **~0,13 $** |
| **Année de cycles** | 70 élèves × ~20 cycles | **~510 $/an** | **~175 $/an** |
| **Diagnostic semaine 1** | 70 essais × 6 comp. + 70 explications × 5 comp. = 770 évals + OCR | **~63 $** | **~21 $** |
| **Instanciations du routeur** | ~200/sem × 36 sem, sans mutualisation | ~110-160 $/an | idem (voir M5) |

*\*Mix économe = Haiku pour P1/P2 et l'OCR, Sonnet pour les retours (la voix Calame). Le choix réel = **D9, au run 3 du banc** — Haiku est en course (19/21, égal ou meilleur sur 5 copies)*.

**Verdict** : ordre de grandeur **200-700 $/an tout compris** selon le mix, soit **3-10 $/élève/an**. Pas bloquant — mais pas invisible : c'est le prix d'un cahier d'exercices par élève, payé par le prof. Trois garde-fous déjà en place : la tuile coûts C11a (télémétrie branchée sur chaque appel, `cout_api`), la décision de modèle D9 (levier ×3), la **projection de coût après la première copie** (règle du banc, à généraliser au dépouillement batch). Réserves d'estimation : prix Expression = le cas pathologique désormais réparé, les autres compétences varieront ; la lecture à réponses courtes (écran, pas d'OCR) coûte nettement moins ; le prix OCR/page se confirme au banc.

## 2. Chiffrage — surcoût de l'option B (routeur dès la semaine 2)

- **En argent** : quasi nul. Le routeur est un algorithme (zéro IA dans le routage — acté). Le surcoût API = les instanciations générées (~110-160 $/an sans mutualisation, cf. M5 pour le remède).
- **En temps prof** : la file de validation est LE poste. Arithmétique : ~200 instanciations/semaine × 8 s de lecture = **27 min/sem** — trois fois la promesse « < 10 min » du fait-quand de C4-L2, **si la file porte tout** (cf. M4).
- **En calendrier** : le cœur R1-R6 passe en S2-S3 = ~2-4 jours-sessions de plus avant le 25/08, algorithmique pure. Risque borné par la coupe de repli actée (démarrer en plan-du-prof, basculer à l'allumage) — le schéma supporte les deux.

## 3. Constats (M1-M7)

**M4 — La file de validation n'est pas définie → son critère d'acceptation est infalsifiable.** `BLOQUANT-GEL` *(une phrase à ajouter)*
Où : §4 + §9 C4-L2. L'attaque : « le prof valide la file en < 10 min » — mais la spec ne dit pas ce que la file contient. Si c'est chaque instanciation : 27 min/sem (calcul ci-dessus), promesse morte à la semaine 3, et le prof qui valide en rafale sans lire = une validation de théâtre (la règle absolue « une référence non validée n'entre jamais en P2 » devient une case cochée). Correctif minimal : écrire dans §4 que la file porte **les références décomposées nouvelles** (quelques-unes/sem, mutualisées par classe) **+ un échantillon d'instanciations** groupées par (type × matière) — le reste passe en visibilité simple, pas en validation.

**M7 — Le bruit OCR est traité comme signal de refaire, pas comme biais de mesure.** `AVANT-ALLUMAGE` *(gate à écrire au gel)*
Où : §2 (lisibilité) × §9 C4-L5. L'attaque : le banc l'a démontré le jour même — sur des copies **lisibles**, la transcription mange la ponctuation et écrase le haut de l'échelle (golds B+/A → C, les deux modèles d'accord entre eux donc erreur invisible en production). Le signal « > X % douteux → refaire » ne couvre pas ce cas : la copie passe le seuil, la mesure est fausse. Correctif minimal : conditionner l'allumage des **mesures** sur manuscrit à la validation de l'étage OCR du banc Expression (fidélité ponctuation + fautes) — une ligne de gate dans C4-L5.

**M3 — C5-L3 présuppose des ancres de lecture qui n'existent pas.** `AVANT-ALLUMAGE` *(une phrase au lot)*
Où : §9 C5-L3 ↔ `00-referentiel.md` §5 (« Ancres de lecture — À RÉDIGER »). L'attaque : le lot « mesures lecture » produit des `lettre_equivalente` alors que les ancres E→A de lecture ne sont pas rédigées ; une session Code inventera le mapping. L'ordre du chemin critique couvre le cas (banc de calibration lecture avant C5) mais la spec ne l'impose nulle part. Correctif : écrire la dépendance dans le lot (« préalable : ancres §5 du référentiel rédigées »).

**M6 — Le délai de dépouillement du diagnostic n'est pas borné.** `AVANT-ALLUMAGE`
Où : §9 C4-L4. L'attaque : 770 évaluations en file batch la semaine 1 ; le routeur de la semaine 2 (option B) attend ces profils. Le fait-quand valide le pipeline (« 30 copies → 30 squelettes sans intervention ») mais pas le **délai**. À 770 appels avec limites de débit API, un dépouillement qui prend 4 jours décale l'allumage. Correctif : ajouter un fait-quand de délai (ex. « dépouillement complet d'une classe < 48 h ») + la projection de coût du banc appliquée au batch.

**M5 — Instanciation par élève sans mutualisation : 100-150 $/an évitables.** `À SURVEILLER`
Où : §4 (remplissage) + §6 `exercices`. L'attaque : deux élèves, même cible, même type, même matière → deux appels de génération identiques. Correctif : cache par (type × matière × classe) au moment du remplissage — divise le poste par 5-10 ; à noter dans C4-L2, pas de changement de schéma.

**M1 — La spec renvoie encore à « l'annexe A » du routeur, devenue un pointeur.** `AVANT-GEL, mécanique`
Où : §5 (couche type) et §6 (`exercices_types`). Depuis la refonte, l'annexe A de `01-routeur.md` est déplacée vers `02-exercices.md`. Le renvoi fonctionne (pointeur) mais une session Code fera un saut de plus. Correctif : remplacer « annexe A + aile L » par « `02-exercices.md` §3-§4 ».

**M2 — Renvoi périmé dans le CONTEXTE (hors spec).** `Vrac`
La convention « Gabarit des fichiers compétences (01-routeur §12) » pointe vers l'ancien emplacement ; le gabarit vit désormais dans `03-competences-ecriture.md` §1 (le §12 du routeur = l'ordre de développement seul). À corriger au prochain commit du CONTEXTE.

## 4. Ce qui a été vérifié et qui TIENT (pour mémoire de fusion)

Renvois de la spec vers `01-routeur.md` §7 (lettres), §10 (journalisation/tie-breaking), §11 (paramètres), §12 (ordre) : **tous valides après la refonte** (la numérotation n'a pas bougé). Types cités L7/L9/L12 : **actés** dans `02-exercices.md` (L12 le 27/07, grain phrase → paragraphe). Types écriture « 1-14 » du seed : cohérent avec `02-exercices.md` §3. « Mouvement » utilisé partout (aucun « Structure » lecture résiduel). §9 aligné sur le plan (C4 S2-S3 · C5 S3 · C6 S3-S4 ; gel 29/07). `NOTE-CYCLE-PEDAGOGIQUE.md` §7 (chemin critique option A) : existe. M1/M3 : montée maison 2/3 et champs `aide_consommee`/`delai`/`distance_contexte` conformes au référentiel §6.

---

*Fusion à venir : G-lists ChatGPT + Opus 5 + cette liste → une table d'arbitrage unique par gravité, dédoublonnée, pour les décisions de Louis avant le gel.*
