# Revue adversariale — Palimpseste (2026‑06‑21)

Revue en profondeur, multi‑aspects, du projet (≈ 25 k lignes TS/TSX, Next 16.2.9 + Supabase).
Méthode : revue statique multi‑agents (12 finders × vérification adversariale double‑lentille,
≈ 150 agents) **+** tests live sur le serveur local (parcours prof/élève réels) **+** sondes
directes de la base distante (schéma déployé, posture RLS, valeurs réelles).

> Sortie demandée : **rapport priorisé, sans modification de code.** Rien n'a été modifié
> (hormis l'ajout de `.claude/launch.json` et de ce fichier de rapport).

---

## 0. Synthèse de posture

**Bonne nouvelle d'ensemble : la sécurité multi‑tenant tient.** RLS est activé et bloque
les lectures anonymes sur toutes les tables sensibles (vérifié live), la séparation des rôles
prof/élève est appliquée (layout + la plupart des actions), le commutateur de classe (cookie
`eleve_classe`) est revalidé contre les inscriptions réelles, et le gate de lecture Fragments
est appliqué **côté serveur**. Le schéma déployé correspond au code (aucun drift : 50 tables +
colonnes de migration présentes). Les buckets de stockage sont privés.

**Là où ça fait mal**, ce n'est pas l'auth mais :
1. **L'intégrité des données à l'effacement** (Lot 2) — plusieurs tables de travail élève ne
   sont jamais nettoyées → orphelins + photos de manuscrits Codex jamais purgées (privacy).
2. **Quelques bugs fonctionnels** qui cassent un parcours pour de bon — dépôt d'essai
   impossible, éditeurs prof qui écrasent l'analyse IA, noms « ? » au tableau de bord.
3. **Un vrai IDOR exploitable** : écriture Codex inter‑classe (client admin, sans contrôle
   d'appartenance) → coût API payant déclenchable par n'importe quel élève.
4. **Triche au quizz** : le timer et l'état « déjà soumis » ne sont enforced que côté client.

Compteurs (après consolidation des doublons et de mes confirmations live) :

| Sévérité | Nb |
|---|---|
| 🔴 Élevé | 11 |
| 🟠 Moyen | 15 |
| 🟡 Faible | 17 |
| ⚪ Info / defense‑in‑depth | 5 |

---

## 1. 🔴 ÉLEVÉ

### H1 — Dépôt d'essai élève **toujours rejeté** (mauvaise colonne lue par le gate serveur)
- **Fichier** : `app/prof/fragments-erudition/essai-actions.ts:577‑582` (gate) vs `:114‑119` (toggle)
- **Quoi** : Le bouton prof « Ouvrir les dépôts » écrit le flag **par classe**
  `fragments_epreuves_classes.depots_ouverts`, et la page élève lit ce flag par classe. Mais le
  gate d'upload élève (`creerUrlUploadEssaiPhotoEleve`) lit le flag **global/legacy**
  `fragments_essais_epreuves.depots_ouverts`, qui n'est jamais mis à `true` nulle part (créé à
  `false` lignes 43/56, jamais updaté). Donc upload toujours bloqué « Les dépôts sont fermés. »
- **Confirmé live** : DB distante → `fragments_essais_epreuves.depots_ouverts=true` : **0**
  lignes ; `fragments_epreuves_classes.depots_ouverts=true` : **1** ligne. Une épreuve est
  « ouverte » pour une classe mais aucun élève ne peut déposer.
- **Repro** : Prof ouvre les dépôts d'une épreuve pour une classe → élève voit le bouton
  → tente de déposer une photo d'essai → « Les dépôts sont fermés. »
- **Fix** : Dans `creerUrlUploadEssaiPhotoEleve`, lire `fragments_epreuves_classes`
  `(epreuve_id, classe_id = inscription.classe_id)` et exiger `depots_ouverts = true` là —
  comme la page élève. (Corrige aussi l'angle sécurité : la validation devient bien par classe.)

### H2 — IDOR Codex : un élève peut soumettre des manuscrits à **n'importe quelle** séance
- **Fichier** : `app/eleve/modules/codex/actions.ts:118‑151` (`getTravail`)
- **Quoi** : `getTravail` (porte de `creerUploadsPhotos`/`confirmerEnvoiPhotos`/`reinitialiserPhotos`)
  charge `codex_sessions` par `sessionId` avec le **client admin** (bypass RLS) et ne vérifie
  que `statut`. **Aucun contrôle** que l'élève appartient à la classe de la séance (le chemin de
  *lecture* `chargerSeanceActive`, lui, filtre par classe). Tout élève authentifié connaissant
  un `sessionId` en phase_1/phase_2 peut créer un `codex_travaux` et déclencher `analyserV1/VF`
  (**appel Claude payant**).
- **Repro** : Élève classe A récupère un `sessionId` de classe B en phase_1 → appelle
  `confirmerEnvoiPhotos(sessionB, 'v1', paths)` → une ligne Codex est créée pour lui + analyse IA.
- **Fix** : Dans `getTravail`, charger `classe_id` de la séance et exiger qu'il soit `null` ou
  ∈ `classeIdsActives(supabase, userId)` (même filtre que `chargerSeanceActive`) avant insertion.
- *(Consolide 3 findings du même `getTravail` : H, M, F.)*

### H3 — Le score d'un quizz peut être rejoué/amélioré après coup (deadline only client‑side)
- **Fichier** : `app/eleve/modules/quazian/quizz/[quizId]/actions.ts:137‑162` (`sauvegarderReponse`)
  et `:165‑254` (`soumettreQuizz`)
- **Quoi** : Aucune vérif serveur du statut du quizz / de `ferme_at` / de `submitted_at`. Le
  compte à rebours et l'auto‑submit vivent dans `PassationJetons.tsx`. Un quizz reste `lance`
  jusqu'à ce que le prof clique manuellement « fermer ». Entre l'expiration du timer de l'élève
  et la fermeture prof, l'élève peut ré‑éditer ses réponses (`sauvegarderReponse`) et
  re‑soumettre (`soumettreQuizz` non idempotent) pour recalculer un meilleur score.
- **Repro** : Laisser le timer atteindre 0 (auto‑submit). Avant fermeture prof, appeler
  `sauvegarderReponse` puis `soumettreQuizz` depuis la console → score réécrit.
- **Fix** : Charger le quizz dans les deux actions ; rejeter si `statut !== 'lance'` ou
  `now() > ferme_at` ou session déjà `submitted_at`. Rendre la soumission idempotente
  (compare‑and‑set `submitted_at IS NULL`).

### H4 — Photos de manuscrits Codex **jamais purgées** à l'effacement (privacy)
- **Fichier** : `utils/effacement.ts:47‑49` ; `app/eleve/modules/codex/actions.ts:143`
- **Quoi** : Lot 2 promet de purger le stockage (dont manuscrits Codex). `collecterCheminsInscriptions`
  collecte ces chemins via `codex_travaux` filtré sur `inscription_id` — mais `inscription_id`
  n'est **jamais écrit** (l'insert ne pose que `{session_id, eleve_id}`). À la suppression d'une
  classe / retrait d'élève, la ligne reste orpheline et **les photos restent dans le bucket à vie**.
- **Repro** : Élève soumet V1/VF → effacer la classe → ligne `codex_travaux` orpheline, photos
  toujours présentes dans le bucket `codex`.
- **Fix** : Peupler `codex_travaux.inscription_id` à la création (depuis `session.classe_id`
  + `eleve_id`), **ou** collecter les chemins Codex via `codex_travaux→codex_sessions.classe_id`.

### H5 — Travaux Quazian orphelins à l'effacement (`inscription_id` jamais peuplé)
- **Fichier** : `app/eleve/modules/quazian/quizz/[quizId]/actions.ts:82‑89, 245‑251` ;
  `app/eleve/modules/quazian/actions.ts` (insert `quazian_card_states`)
- **Quoi** : Lot 1 a ajouté `inscription_id` (ON DELETE CASCADE) sur `quazian_card_states`,
  `quazian_sessions`, `quazian_quiz_scores` pour que l'effacement passe par la cascade. Mais
  **aucune** écriture ne pose `inscription_id`. Résultat : FSRS card states, review logs, sessions,
  réponses et scores **survivent** à la suppression de classe / au retrait d'élève.
- **Fix** : Poser `inscription_id` sur chaque insert/upsert de travail Quazian (résolu depuis
  `eleve_id` + classe), ou ajouter un nettoyage par `eleve_id`+classe à `effacer_classe`. Backfill.

### H6 — Éditeur d'analyse **essai** : écrase l'analyse IA par des champs vides
- **Fichier** : `app/prof/fragments-erudition/essai/[essaiId]/EditorAnalyseEssai.tsx:65‑99`
- **Quoi** : Tous les champs sont initialisés une seule fois via `useState(analyse?.x)`. Aucun
  `useEffect` ne resynchronise quand la prop `analyse` change. Au dépôt, la page rend d'abord
  `statut='en_cours'` (éditeur masqué) ; le composant persiste ; quand l'analyse passe à `generee`
  via `router.refresh()`, l'instance garde son état **vide**. Le prof voit l'éditeur « À valider »
  avec lettres non sélectionnées / transcription vide, et **publier enregistre les blancs**.
- **Repro** : Déposer un essai (prof) en restant sur la page ; quand l'éditeur apparaît, tout est vide.
- **Fix** : Ajouter `useEffect(... , [analyse])` qui resynchronise (cf. `EditorAnalyse.tsx`), ou
  `key={analyse?.statut + analyse?.id}`.

### H7 — Éditeur d'analyse **orale** : même défaut (écrase l'analyse par des zéros/vides)
- **Fichier** : `app/prof/fragments-erudition/presentation/[presentationId]/EditorAnalyseOrale.tsx:56‑86`
- **Quoi** : Identique à H6 — pas de resync sur `analyseOrale`/`oral`. Après transcription+analyse,
  les 3 notes affichent E (0) et les retours sont vides ; publier sauve les blancs.
- **Fix** : `useEffect(..., [analyseOrale])` ou `key` sur l'id+statut.

### H8 — Compteurs de flashcards ignorent le filtre de visibilité par semaine
- **Fichier** : `app/eleve/modules/quazian/actions.ts:376‑421` (`chargerStatsRevision`)
- **Quoi** : `chargerStatsRevision` compte total/connues/dues/nouvelles/àFaire sur **toutes** les
  cartes des unités publiées, **sans** la dérivation de visibilité par `(unité, semaine)` que
  `chargerFileRevision` et `chargerToutesLesCartes` appliquent (via `scriptorium_document_classes`).
  → Le tableau de bord annonce des cartes « à faire » que l'élève ne verra jamais dans la file.
- **Fix** : Factoriser la dérivation de visibilité (publications + tuples visibles + filtre semaine)
  dans un helper unique partagé par les trois fonctions.

### H9 — Noms des « élèves à risque » affichés « ? » au tableau de bord prof
- **Fichier** : `app/prof/page.tsx:61‑65` (construction) / `:211‑217` (usage)
- **Quoi** : La map `nomEleve` n'est peuplée que depuis `profilsAValider` (élèves ayant un fragment
  *à valider*). Elle est réutilisée pour la liste « Élèves à risque ». Quand il n'y a rien à valider
  (état stable courant), `nomEleve` est vide → **tous** les noms à risque s'affichent « ? ».
- **Confirmé live** : observé directement (dashboard « Rien à valider » + 4 lignes « ? · classe »,
  alors que les noms sont corrects ailleurs).
- **Fix** : Construire la map sur l'union de `eleveIdsAValider` et `santeValues.map(s=>s.eleveId)`
  (ou une seule requête `profiles` couvrant tous les `eleve_id` de la page).

### H10 — Aletheia : un job `after()` mort bloque l'élève à vie en V1/VF_SUBMITTED
- **Fichier** : `app/eleve/modules/aletheia/[livreId]/[semaine]/page.tsx:114‑121, 160‑189`
- **Quoi** : Les retours 1/2 sont générés dans un `after()`. Le seul retour d'erreur est le
  `catch/echec()` *à l'intérieur* de ce `after()`. Si l'instance meurt avant (redeploy, OOM,
  timeout, recyclage), la ligne reste en `V1_SUBMITTED`/`VF_SUBMITTED` pour toujours ; la page
  poll toutes les 4 s indéfiniment, sans bouton « relancer ».
- **Fix** : Détecter un `*_SUBMITTED` périmé (statut inchangé > N min via `updated_at`) → auto‑revert
  ou bouton « Relancer le retour » (gardé par compare‑and‑set), comme la récupération du capstone.

### H11 — Aletheia : une semaine dont le PDF n'a pas pu être extrait devient un cul‑de‑sac
- **Fichier** : `utils/aletheia-retours.ts:119‑121` ; `app/prof/scriptorium/actions.ts:252‑258`
- **Quoi** : À la création du livre, l'échec d'extraction est avalé (console.error) et
  `texte_extrait=null` (PDF scanné/image). `assemblerAncrageSemaine` filtre les `null` → renvoie
  `''` → `genererRetour1` fait `echec()` et repasse en DRAFT avec un message « ressoumets ». L'élève
  ressoumet → échoue encore → boucle infinie, sans signal au prof.
- **Fix** : Remonter l'échec d'extraction au prof à l'upload (avertir : pas de texte d'ancrage →
  feedback IA impossible) ; distinguer côté élève un échec permanent d'un échec transitoire.

---

## 2. 🟠 MOYEN

### M1 — Backlog de révision « santé cohorte » toujours 0 (`quazian_card_states.inscription_id` jamais peuplé)
- `utils/sante.ts:90‑99` — la requête filtre sur `inscription_id` (toujours NULL) → aucun élève
  n'est jamais signalé « N cartes en retard ». **Fix** : compter par `eleve_id`.

### M2 — `calculerSante` compte les semaines de **tous** les semestres
- `utils/sante.ts:60‑64, 105` — `fragments_semaines` chargé sans filtre `semestre_id` → dès le
  semestre 2, toutes les semaines du S1 comptent comme « dépôts manquants », faux‑positifs « à risque ».
  **Fix** : filtrer par le semestre courant.

### M3 — Aletheia : travaux/capstone non supprimés à l'effacement de classe
- `aletheia_lot2.sql:65‑94` — `aletheia_travaux`/`aletheia_capstone` n'ont ni `inscription_id` ni
  `classe_id` ; `effacer_classe` (antérieur à Aletheia) ne les touche pas. Travail élève orphelin
  (et peut **resurgir** si l'élève revient sur le livre). **Fix** : nettoyage explicite via
  `scriptorium_unite_classes`.

### M4 — `quazian_semester` : UUID stocké mais effacement par **nom** de classe
- `app/prof/quazian/semestre/actions.ts:27, 66, 75` vs `lot2_cycle_de_vie.sql:58` — les notes de
  semestre sont écrites avec un UUID de classe, mais `effacer_classe` supprime
  `where classe_id = v_nom` → notes jamais nettoyées **et** l'UI prof affiche des UUID bruts.
  **Fix** : clé canonique unique (UUID partout + suppression par UUID + jointure pour l'affichage).

### M5 — Aletheia : pas de plafond de taille sur le texte élève → coût API non borné (DoS authentifié)
- `app/eleve/modules/aletheia/actions.ts:27‑78, 82‑115` — `soumettreV1/Vf` n'acceptent que
  `.trim()` non vide, aucune limite de longueur ; le texte (résumé/VF/questions) est injecté
  verbatim dans le prompt (retour 2 = + le **livre entier**). **Fix** : plafonner côté serveur
  (cf. cap 12000 chars de `extraire-flashcards.ts`) + `maxLength` sur les textareas.

### M6 — Génération IA Quazian : throw sur sortie modèle malformée → bouton bloqué « en cours » à vie
- `utils/generer-questions.ts:66‑69, 96‑99` — `creerQuizz`/`lancerExtractionIA`/`genererCartesSemaine`
  n'enveloppent pas l'appel IA dans try/catch ; le client ne gère que `{error}`. Une réponse non
  parseable (troncature `max_tokens`, prose) rejette → spinner infini. **Fix** : try/catch dans les
  3 actions + `finally` côté client.

### M7 — Oral : pas de note finale /20 (contredit la spec)
- `EditorAnalyseOrale.tsx:234‑246` + `types/fragments.ts:118‑134` — l'oral n'a que les 3 lettres,
  aucun /20, alors que `SPEC_Lot5_Fragments.md` exige un /20 pour oral/essai/synthèse. **Fix** :
  ajouter `note20_*` à l'oral, **ou** mettre la spec à jour si décision « lettres seules ».

### M8 — Vue détail « Déposé » exclut les retards → désaccord avec la tuile et la spec
- `app/prof/fragments-erudition/semaine/[id]/VueSemaine.tsx:78` — `nbDeposes` ne compte que
  `statut==='depose'` (exclut `en_retard`), alors que la tuile compte tous les dépôts. **Fix** :
  `eleves.filter(e => e.depot).length`.

### M9 — Détail par élève mélange tous les semestres
- `app/prof/fragments-erudition/eleve/[eleveId]/page.tsx:67‑91` — semaines/dépôts non filtrés par
  semestre → taux de dépôt et moyennes incohérents avec la vue d'ensemble (scopée au semestre).
  **Fix** : filtrer par `semestre_id`.

### M10 — Navigation essai préc/suiv traverse les classes (épreuve multi‑classes)
- `app/prof/fragments-erudition/essai/[essaiId]/page.tsx:42‑53` — la liste préc/suivant est
  construite sur **tous** les essais de l'épreuve, sans scope classe ; `?classe=` reste collé →
  le prof sort silencieusement de la classe. **Fix** : `.in('inscription_id', inscriptionIds)`.

### M11 — FSRS : re‑révision d'une carte « nouvelle » ratée utilise un `card_state_id` bidon `'pending'`
- `app/eleve/modules/quazian/SessionRevision.tsx:97‑101` — au re‑enfilage d'une carte neuve ratée,
  `card_state_id` devient la string `'pending'` ; au 2ᵉ passage, `soumettreNote` interroge
  `.eq('id','pending')` (uuid invalide) → mise à jour FSRS perdue + insert `review_log` en erreur.
  **Fix** : faire retourner le vrai id par `soumettreNote`, ou résoudre par `(eleve_id, flashcard_id)`.

### M12 — `calculerNotesSemestre` sans classe → `classe_id=null` + upsert cassé
- `app/prof/quazian/semestre/actions.ts:59‑75` — option « Toutes les classes » → `classe_id:null`
  et agrégation inter‑classes ; `onConflict:'classe_id,eleve_id'` ne matche pas (NULL distinct en
  Postgres) → doublons. **Fix** : exiger une classe, ou écrire une ligne par (classe, élève).

### M13 — `validerTravail` Codex : garde d'idempotence non atomique → cartes/trace en double
- `app/prof/codex/validation/actions.ts:49‑70` — read‑modify‑write sans précondition ; double‑clic
  / 2 onglets → double création de cartes FSRS + lignes trace. **Fix** : UPDATE conditionnel
  `.eq('statut_validation','en_attente').select()` et n'agir que si 1 ligne touchée.

### M14 — Photos déposées orphelines / chemins non validés (dépôt Fragments)
- `app/eleve/modules/fragments-erudition/actions.ts:23, 71‑117` — `chemins` (client) inséré dans
  `fragments_photos.storage_path` **sans** vérifier le préfixe `${userId}/` (contrairement à Codex
  et `getSignedUrls`) ; et le pattern delete‑avant‑insert (71‑88) supprime l'ancien dépôt **avant**
  l'insert du nouveau → un échec en cours laisse l'élève sans dépôt. **Fix** : valider le préfixe
  des chemins ; insérer le nouveau dépôt avant de supprimer l'ancien (ou transaction/rollback).

### M15 — Aletheia : cul‑de‑sac PDF (voir H11) — *classé Moyen si l'on considère le cas rare du PDF scanné.*
*(Listé en H11 ; doublon volontairement signalé pour la priorisation.)*

---

## 3. 🟡 FAIBLE (résumé — détail complet par finding disponible sur demande)

- **F1** `app/eleve/modules/quazian/actions.ts:273‑347` — `soumettreNote` crée un card_state pour
  n'importe quel `flashcardId` sans vérifier la visibilité (scopé `eleve_id`, impact limité).
- **F2** `codex_schema.sql:137‑140` — RLS `codex_sessions_eleve_read USING (auth.uid() is not null)`
  → tout élève peut **lire** l'existence/état de toute séance (pas d'écriture). Resserrer par classe.
- **F3** `utils/analyse.ts:236` (+ analyse‑essai/orale, synthese‑semestre, codex‑analyse) —
  `response.content[0].type` sans garde tableau vide (≠ aletheia qui utilise `?.`). Optional chaining.
- **F4** `utils/analyse-essai.ts:375‑403` (+ synthese‑semestre) — `note20_suggeree` du modèle écrit
  en base (dont `note20_validee`) **sans** validation numérique/plage. Clamp [0,20].
- **F5** `utils/analyse-orale.ts:211` (+ analyse/essai) — texte élève (transcription/OCR) injecté dans
  les prompts de notation **sans délimiteurs** (≠ Aletheia qui encadre `<<< >>>`). Encadrer.
- **F6** `app/eleve/modules/fragments-erudition/actions.ts:99` — anti‑triche EXIF `photos_suspectes`
  calculé/asserté côté client, **jamais affiché au prof** → sans effet et trivialement contournable.
- **F7** `app/eleve/modules/fragments-erudition/actions.ts:10‑15` — `verifierEleve` (Fragments) ne
  vérifie **pas** `role='eleve'` (≠ Codex:17 / Quazian:11 qui le font). Defense‑in‑depth (atténué par
  les contrôles d'ownership en aval).
- **F8** `app/api/codex/live/[sessionId]/route.ts` + quazian live — routes role‑gated mais pas
  owner‑gated (latent : multi‑prof inexistant aujourd'hui).
- **F9** `app/prof/page.tsx:23` — ratio de dépôts impossible affichable (« 4/3 dépôts ») : numérateur
  compte la semaine ouverte, dénominateur non. Clamp/affichage.
- **F10** `app/eleve/page.tsx:78‑83` — compteur « cartes dues » global par élève, pas scopé à la classe
  active (incohérent pour un élève bi‑classe).
- **F11** `utils/synthese-semestre.ts:120‑135` — synthèse scopée par fenêtre de dates au lieu de
  `semestre_id`.
- **F12** `app/prof/fragments-erudition/essai-actions.ts:283‑293, 504‑513` — `note20_validee` écrite
  sans clamp [0,20] côté serveur (prof peut saisir 99/20).
- **F13** `utils/generer-questions.ts:66‑70` — JSON IA parsé sans validation de schéma
  (`options.length===4`, `index_correct ∈ 0..3`).
- **F14** `app/eleve/modules/codex/actions.ts:209‑229` — `reinitialiserPhotos('v1')` laisse
  `suggestions_v1`/`texte_v1_ocr` périmés (réinjectés en VF).
- **F15** `utils/codex-analyse.ts:149‑156` — `ocr_confiance` du modèle stocké sans clamp [0,1] →
  priorité de validation faussée.
- **F16** `utils/aletheia-retours.ts:47‑53` — `injecter()` fait des `replace` séquentiels : un
  `{placeholder}` écrit par l'élève est substitué par une variable ultérieure. Single‑pass.
- **F17** `utils/aletheia-retours.ts:145‑149` — items du retour 1 non filtrés en strings (≠ retour 2
  via `enListe()`) → un élément objet du modèle crashe le rendu de la page semaine.

---

## 4. ⚪ INFO / defense‑in‑depth

- **I1** Toute l'isolation du flux quizz repose **100 %** sur les policies RLS Quazian (aucun garde
  applicatif). Vérifié OK live (anon bloqué + cross‑classe « Quizz introuvable »). Garde explicite
  optionnel en défense.
- **I2** RLS des tables `fragments_*` / certaines `quazian_*` non déclarée dans les `.sql` du repo
  (schéma de base antérieur). **Résolu live** : anon (sans session) renvoie 0 ligne sur toutes ces
  tables peuplées → **RLS bien actif**. À garder versionné dans un `.sql` pour la traçabilité.
- **I3** `app/prof/fragments-erudition/analyse/[depotId]/page.tsx` — pas de garde de rôle propre
  (s'appuie sur le layout `/prof`). Aligner avec les pages sœurs.
- **I4** `…/epreuves/[epreuveId]/TableauEpreuve.tsx:49‑67` — export CSV ne neutralise pas
  `=,+,-,@` en tête de cellule (injection de formule tableur). Faible (audience prof unique).
- **I5** Aletheia : **aucune vue prof** sur le travail élève (`aletheia_travaux`/`capstone` jamais
  lus côté prof). Aggrave H10/H11 (élève bloqué = invisible). Ajouter une vue de suivi minimale.

---

## 5. Thèmes transverses (causes racines)

1. **`inscription_id` jamais peuplé** sur les tables de travail Codex & Quazian → casse à la fois
   l'effacement (H4, H5, M3) et la santé cohorte (M1). *Une* correction (peupler + backfill, ou
   nettoyer par `eleve_id`+classe) résout 4 findings.
2. **Mauvais flag / mauvaise clé** (essai global vs par classe H1 ; semestre UUID vs nom M4) →
   héritage des migrations additives ; auditer chaque colonne « legacy » dupliquée.
3. **Éditeurs prof sans resync de props** (H6, H7) → même patch (`useEffect([analyse])` / `key`).
4. **Gates enforced côté client uniquement** (deadline quizz H3, EXIF F6) → re‑checker serveur.
5. **Scope semestre oublié** (M2, M9, F11) → factoriser un helper « semestre courant + ses semaines ».

## 6. Vérifié SAIN (résultats négatifs rassurants)

- Séparation des rôles : toutes les routes `/prof/*` redirigent un élève (live).
- IDOR quizz inter‑classe : bloqué (« Quizz introuvable », live).
- Gate de lecture Fragments : enforced **serveur** (`actions.ts:54`).
- Commutateur de classe : revalidé contre les inscriptions actives.
- RLS actif et bloquant l'anonyme sur toutes les tables sensibles (live).
- Schéma déployé conforme (50 tables + colonnes de migration présentes), buckets privés.
- Aletheia globalement bien durci (délimiteurs prompt, compare‑and‑set, détection de troncature).
- `tsc --noEmit` propre ; aucune erreur console/réseau sur les pages testées.

## 7. Ordre de remédiation suggéré

1. **H1** (dépôt essai cassé) + **H9** (noms « ? ») — bugs visibles immédiats, fix local.
2. **H2** (IDOR Codex) + **H3** (triche quizz) — sécurité/intégrité exploitables.
3. **Thème `inscription_id`** : H4, H5, M3, M1 d'un coup.
4. **H6/H7** (éditeurs qui écrasent l'IA) — risque de perte de notes prof.
5. **H8, H10, H11** (visibilité cartes, blocages Aletheia).
6. Moyens restants, puis faibles par lot thématique.

---

*Détail intégral (description, evidence, double‑verdict adversarial) de chaque finding disponible :
`tasks/wfzgtk8l5.output`. Findings confirmés par ≥1 vérificateur adversarial indépendant ; les
findings « élevés » et la moitié des « moyens » ont été reconfirmés par lecture directe et/ou test live.*
