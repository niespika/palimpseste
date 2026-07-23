# SPEC — Mode « Déposer 1 PDF et le découper en semaines » (Scriptorium / Aletheia)

## 1. Résumé & décisions verrouillées

**En une phrase :** ajouter au Scriptorium un second mode de création de livre Aletheia où le prof dépose **un seul PDF** et le découpe en plages de pages (par semaine), en extrayant le texte vers `texte_extrait` sans conserver le PDF — sans rien casser du mode actuel « un fichier par semaine ».

**Décisions produit verrouillées :**
1. Nouveau mode **EN PLUS** du mode actuel (un fichier/semaine), qui reste intact. Aucune régression.
2. PDF scanné (sans couche texte) : **détection + avertissement** au dépôt. **Pas d'OCR.**
3. **Texte seul** : on extrait le texte des plages → `texte_extrait` par semaine ; le PDF n'est **pas conservé durablement** (`fichier_ref = null`), seulement détenu transitoirement le temps du découpage, puis supprimé. Re-découper plus tard = re-déposer. Neutralise structurellement le bug de suppression partagée de `supprimerContenu`.
4. Décalage de pagination corrigé par une **question guidée** (pas le mot « offset » dans l'UI) ; le prof saisit les numéros **imprimés** lus au sommaire. Offset surchargeable **par ligne** (filet pagination non linéaire). Pré-remplissage par signets = **option différée, sans fusion**.
5. **Limite ~600 pages** : avertir/refuser au-delà.
6. **Pas d'IA de segmentation.** La génération IA existante (carte/capstone, référence, retours) reste branchée.

**Réglages d'environnement verrouillés (réponses Louis, 2026-06-28) :**
- **Q1 — Hébergement : plan Vercel Hobby.** `maxDuration` plafonné à **60 s**. L'extraction d'un PDF texte ≤ 15 Mo / ~600 p. tient largement dans 60 s (l'extraction de texte ne fait aucun rendu d'image).
- **Q1bis (vérifié par recherche) — Limite de corps de fonction Vercel = 4,5 Mo, TOUS plans (Hobby inclus), non contournable via `bodySizeLimit`** (sinon erreur 413 `FUNCTION_PAYLOAD_TOO_LARGE`). **Conséquence majeure : l'upload du PDF DOIT passer par URL signée directe → Supabase** (pattern déjà en place pour Codex/essais), **même à 15 Mo**. Le chemin « FormData » n'est valable qu'en local ou pour < 4,5 Mo → voir correction §4.
- **Q2 — Prompt caching : câblé dès le MVP** (Lot E intégré au périmètre, pas différé).
- **Q3 — Découpage FIGÉ dès la création/affectation.** Aucune re-segmentation après coup. L'affectation de classe se faisant *à la création* (modèle actuel), le découpage est définitif dès la création ; pour le changer → créer un nouveau livre. (Un état « brouillon » avant affectation serait un ajout ultérieur si besoin.)
- **Q4 — Poids max d'upload : ~15 Mo** (pas au-delà). Borne mémoire/temps confortable ; aucune gestion « centaines de Mo » nécessaire.

**Faits techniques vérifiés (cette session) :**
- Pattern d'upload du projet **confirmé** : `admin.storage.from(bucket).createSignedUploadUrl(path)` → `{path, token}` (codex/actions.ts:201, essai-actions.ts:191) ; client `supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {contentType})` (CaptureManuscrit.tsx:86) ; relecture serveur `admin.storage.from(bucket).download(path)` → blob (codex-analyse.ts:65, analyse-essai.ts:227). **Le plan suit ce pattern, PAS un `fetch PUT` manuel.**
- **Aucun `export const maxDuration`** nulle part dans `app/`. `vercel.json` = `{"framework":"nextjs"}` seulement (pas de réglage durée/mémoire). `bodySizeLimit: '50mb'` dans `next.config.ts`.
- `genererRetourVf.echec()` fait un **compare-and-set vers `FEEDBACK1_READY`** (aletheia-retours.ts:452, `.eq('statut','VF_SUBMITTED')`) → confirmer la critique : y ajouter un garde-fou ERROR créerait une **boucle de blocage élève**. `enregistrerCoutApi('aletheia', coutMessage(response.usage))` à chaque appel VF (L505), **sans prompt caching** sur ce chemin. `stop_reason === 'max_tokens'` lève déjà une erreur propre (L506).

---

## 2. Architecture du flux

Trois temps, deux découplés par un aller-retour serveur.

### Temps 0 — Dépôt (URL signée OBLIGATOIRE — limite Vercel 4,5 Mo)
**Vérifié :** une fonction Vercel (tout plan, Hobby inclus) rejette tout corps > **4,5 Mo** (`FUNCTION_PAYLOAD_TOO_LARGE`), et `serverActions.bodySizeLimit:'50mb'` ne lève PAS cette limite en production (elle ne vaut qu'en local). Un PDF de livre (souvent 5–15 Mo) **ne peut donc PAS** transiter par le FormData d'une server action. L'upload passe **obligatoirement** par URL signée directe navigateur → Supabase :
1. Client : `creerUploadImportPdf()` (server action) → `{importId, path, token}` où `path = imports/${userId}/${importId}.pdf`, bucket `scriptorium`.
2. Client : `supabase.storage.from('scriptorium').uploadToSignedUrl(path, token, file, {contentType:'application/pdf'})` — **upload direct navigateur → Supabase**, hors lambda, sans limite body Next.
3. Client transmet seulement `path` (string) au serveur ensuite.

### Temps 1 — Analyse (1 seule extraction, persistée transitoirement)
**Décision corrigée (critique bloquante timeout) :** on **persiste** le texte extrait par page une seule fois, on ne ré-extrait PAS à chaque aperçu.
- `analyserPdfImport(path)` : `verifierProf()` + garde préfixe `imports/${userId}/` (anti-IDOR) → `download(path)` → `extrairePagesPdf(buffer)` → `text[]` (un élément/page).
- **Où vit le texte transitoire :** table éphémère `scriptorium_imports {import_id uuid pk, user_id uuid, total_pages int, pages jsonb, created_at timestamptz default now()}`. On écrit `pages` (le `text[]`) **une fois**. `apercuPlage` et `ajouterLivre` **lisent cette table**, ne re-parsent jamais le PDF. Purge par TTL (voir Lot 1). C'est la seule entorse au « zéro SQL », justifiée : le re-parse d'un PDF de 600 p. à chaque frappe est intenable en serverless (timeout défaut Vercel 10-15 s, aucun `maxDuration` configuré).
- Retourne au client un objet **léger** : `{importId, totalPages, scanne, pagesVides, pagesVidesPct, tropLong}`. **Jamais le texte intégral.**

### Temps 2 — Découpage & aperçu (sans aller-retour lourd)
- `apercuPlage(importId, debutPdf, finPdf)` lit `pages` de la table (rapide, pas de parse PDF) et renvoie un extrait court (début + fin de plage + flag `vide`). Debounce client 500 ms.

### Temps 3 — Création (texte seul)
- `ajouterLivre(formData)` branche `mode='pdf_decoupe'` : lit `pages` depuis `scriptorium_imports` (pas de re-download/re-parse), slice par plages, INSERT N documents `texte_source` avec `texte_extrait` rempli et `fichier_ref = null`.
- **Nettoyage :** en succès comme en rollback, `admin.storage.from('scriptorium').remove([path])` + `delete from scriptorium_imports where import_id=...`. Le PDF et le texte transitoire disparaissent.
- `lancerGenerationArtefactsLivre(livre.id)` en `after()` — **inchangé**.

---

## 3. Résolution de la tension « gros livre vs IA »

**Verdict factuel :** `MODELE = 'claude-sonnet-4-6'` (aletheia-retours.ts:12) a une fenêtre **1M tokens**. Un livre de 400-600 p. ≈ **210k-320k tokens** = ~1/3 de la fenêtre. **Il n'y a PAS de débordement de contexte** pour la cible (Critique de la raison pure). Le commentaire L387-389 (« débordement ~200k ») est **factuellement obsolète**.

**Décision retenue :**
- **NE PAS implémenter de chunking maintenant.** Garder l'appel unique sur `assemblerAncrageLivre`. Corriger le commentaire L387-389.
- **Garde-fou tokens uniquement sur les artefacts PROF (capstone + référence)** — JAMAIS sur le retour VF. Raison (critique majeure confirmée par lecture L452) : `echec()` du VF re-arme `FEEDBACK1_READY`, donc un garde ERROR sur VF crée une **boucle de blocage élève** sans déblocage manuel possible (pas d'`amende_par_prof` côté VF). Le seuil ~700k n'est de toute façon jamais atteint à 320k → aucune régression pour la cible. **VF = hors périmètre du garde-fou, documenté comme reliquat.**
- **Le vrai risque d'échelle est le COÛT, pas le contexte.** Sans prompt caching, chaque retour VF d'un livre 320k ≈ **~0,96 $ d'input** (3 $/M), répété **par élève × par semaine** : une classe de 30 × 8 semaines ≈ **~230 $/livre** rien qu'en VF, + capstone/référence. **Mitigation recommandée : câbler le prompt caching** (`cache_control: {type:'ephemeral'}`) sur le bloc `{livre_entier}` en tête de prompt des 3 chemins (VF/capstone/référence) → le préfixe livre étant byte-identique entre élèves d'une même classe, cache_read ≈ 0,1× → coût VF divisé par ~10. **Lot E — câblé dès le MVP (décision Louis, Q2).**
- **Chunking map-reduce = différé (Lot 7 optionnel)**, à n'implémenter QUE si on vise réellement > 700k tokens (bien au-delà de 600 p.).

---

## 4. Lots d'implémentation (ordre = MVP utile d'abord)

> **Restructuration MVP (critique majeure « non-livrabilité incrémentale ») :** le Lot A livre un livre **créable de bout en bout** via FormData (≤ 45 Mo, couvre déjà beaucoup de cas réels). Les lots suivants enrichissent un flux déjà fonctionnel.

> **⚠️ Correction (vérifiée, prime sur le découpage A/B ci-dessous) — l'upload par URL signée est OBLIGATOIRE, pas un raffinement du Lot B.** La limite Vercel de **4,5 Mo** sur le corps des fonctions (tous plans, Hobby inclus) s'applique aux server actions : un PDF de 5–15 Mo en FormData échouerait en production (413 `FUNCTION_PAYLOAD_TOO_LARGE`). **Donc le premier lot réellement utilisable en production = le « cœur création texte-seul » du Lot A + l'upload URL signée + l'analyse du Lot B, FUSIONNÉS.** Le « Lot A FormData pur » ci-dessous ne reste valable qu'en *local* ou pour des PDF < 4,5 Mo (jalon de dev, pas MVP de prod). **Lis « Lot A + Lot B » comme le MVP de production** ; leurs efforts (§7) se cumulent en un seul livrable initial.

### Lot A — MVP : mode texte-seul de bout en bout (FormData, ≤ 45 Mo)
**Objectif.** Un prof peut, dès ce lot, déposer 1 PDF (≤ 45 Mo), saisir un décalage + des plages, et créer un livre. Pas encore d'upload direct, pas d'aperçu live.

**Fichiers & changements.**
- `app/prof/scriptorium/actions.ts` :
  - Ajouter `export const maxDuration = 60` en tête du fichier (filet timeout ; vérifier le plan Vercel — Hobby plafonne 60 s, Pro 300 s).
  - `extrairePagesPdf(buffer: Buffer): Promise<string[] | null>` — nouvelle fonction dédiée : `const { extractText } = await import('unpdf'); const { text } = await extractText(new Uint8Array(buffer), { mergePages:false }); return Array.isArray(text) ? text : null`. **Ne touche pas** `extraireTexte` (L47-79).
  - Constantes : `const MAX_PAGES = 600`, `const SEUIL_SCAN = 0.7`, `const SEUIL_CHARS = 3`, `const SEUIL_TOKENS = 700_000`.
  - `ajouterLivre` (L184-301) : `const mode = (formData.get('mode') as string) || 'par_semaine'`. Étapes communes (verifierProf, titre/nbSemaines/dateDebut/classeIds, ordre, INSERT unité, `annuler()`) inchangées.
    - `if (mode === 'par_semaine')` → **boucle actuelle L229-276 byte-identique.**
    - `else` (`pdf_decoupe`) : lire `livrePdf` (File, dans FormData pour ce lot), `decalage = Number(formData.get('decalage')) || 0` ; `buffer = Buffer.from(await livrePdf.arrayBuffer())` ; `pages = extrairePagesPdf(buffer)` ; `totalPages = pages.length` ; refus si `> MAX_PAGES` → `return annuler(...)`. Pour `i=1..nbSemaines` : lire `decoupe_${i}_titre/chapitres/debut/fin` + `decoupe_${i}_decalage` (optionnel, surcharge `decalage`) ; `off = decoupe_i_decalage ?? decalage` ; `debutPdf = debut + off`, `finPdf = fin + off` ; **valider `1 ≤ debutPdf ≤ finPdf ≤ totalPages`** sinon `return annuler('La semaine N a des bornes hors PDF…')` ; `texteExtrait = pages.slice(debutPdf-1, finPdf).join('\n').trim() || null` ; si null → push `semainesSansTexte` ; INSERT `scriptorium_documents {unite_id, type:'texte_source', titre, semaine:i, chapitres, texte_extrait:texteExtrait, fichier_ref:null, created_by}` — **PAS d'`uploaderBuffer`, PAS d'UPDATE fichier_ref.**
  - Réviser le message du blocage strict (L283-284) : retirer la mention OCR → « Une ou plusieurs plages n'ont pas de texte sélectionnable. Vérifie les bornes/le décalage, ou utilise un PDF au texte sélectionnable (pas un scan). »
- `app/prof/scriptorium/FormulaireLivre.tsx` :
  - `const [mode, setMode] = useState<'par_semaine'|'pdf_decoupe'>('par_semaine')` + segmented control « Un fichier par semaine » / « Un seul PDF découpé ».
  - **Rendu conditionnel** (pas `display:none`) : seuls les champs du mode actif sont dans le DOM → le FormData ne ramasse jamais les deux jeux de champs.
  - À chaque `setMode` : réinitialiser l'état de l'autre mode (refs file, lignes). Confirmation légère si saisie en cours (« Changer de mode effacera la saisie en cours. »).
  - Bloc `pdf_decoupe` : 1 `<input type="file" accept="application/pdf">` (refus client si `.docx/.txt` : « Ce mode n'accepte que les PDF ; utilise “Un fichier par semaine” pour Word/texte. ») ; champ guidé décalage (cf. §5) ; `nbSemaines` lignes `decoupe_${i}_titre/chapitres/debut/fin` (+ champ décalage par ligne, optionnel, replié). Garde 45 Mo réutilisée pour CE lot.
  - `handleSubmit` ajoute `fd.append('mode','pdf_decoupe')`. Mode `par_semaine` inchangé.

**SQL.** Aucun.

**Tests.**
- Mode `par_semaine` : créer un livre fonctionne **exactement comme avant** (non-régression critique).
- PDF natif 30 p., 3 plages, décalage +5 → 3 documents `texte_source`, `texte_extrait` rempli, `fichier_ref=null`, semaines 1/2/3.
- Côté prof (`page.tsx`) : aucun lien « Fichier d'origine », texte visible. Côté élève (`data.ts`) : livre/semaines normaux.
- Plage vide → rollback complet, message sans « OCR ».
- PDF > 600 p. → refus serveur.
- `.docx` glissé en mode pdf_decoupe → refus client.
- Génération IA : capstone + référence passent `READY` sur ce petit livre.

---

### Lot B — Upload direct (>45 Mo) + analyse persistée + aperçu live
**Objectif.** Lever la limite 45 Mo, afficher le compte de pages + avertissement scan **avant** la saisie, et l'aperçu de chaque borne. Enrichit le flux du Lot A.

**Fichiers & changements.**
- **SQL (le seul du projet)** — `scriptorium_imports.sql` :
  ```sql
  create table if not exists scriptorium_imports (
    import_id uuid primary key,
    user_id uuid not null,
    total_pages int not null,
    pages jsonb not null,
    created_at timestamptz not null default now()
  );
  -- RLS : accès admin/service-role uniquement (jamais exposé élève). Pas de policy public.
  alter table scriptorium_imports enable row level security;
  ```
- `app/prof/scriptorium/actions.ts` :
  - `creerUploadImportPdf()` : `verifierProf()` ; `importId = crypto.randomUUID()` ; `path = imports/${userId}/${importId}.pdf` ; `admin.storage.from('scriptorium').createSignedUploadUrl(path)` → renvoie `{importId, path, token}` (pattern codex/essais).
  - `analyserPdfImport(path)` : `verifierProf()` + **garde `path.startsWith('imports/'+userId+'/')`** ; `const { data:blob } = await admin.storage.from('scriptorium').download(path); const buffer = Buffer.from(await blob.arrayBuffer())` ; `pages = extrairePagesPdf(buffer)` ; `totalPages = pages.length` ; `pagesVides = pages.filter(p => p.trim().length < SEUIL_CHARS).length` ; `pagesVidesPct = pagesVides/totalPages` ; **INSERT/UPSERT `scriptorium_imports {import_id, user_id, total_pages, pages}`** ; renvoie `{importId, totalPages, scanne: pagesVidesPct > SEUIL_SCAN, pagesVides, pagesVidesPct, tropLong: totalPages > MAX_PAGES}`. **Pas le texte.**
  - `apercuPlage(importId, debutPdf, finPdf)` : `verifierProf()` ; SELECT `pages` WHERE `import_id` AND `user_id` ; valide bornes ; renvoie `{ debut: pages.slice(debutPdf-1, debutPdf).join('').slice(0,300), fin: pages.slice(finPdf-1, finPdf).join('').slice(-150), pagePremierePdf: debutPdf, pageDernierePdf: finPdf, vide: pages.slice(debutPdf-1, finPdf).join('').trim().length < SEUIL_CHARS }`. (Aperçu **par page de borne**, pas la plage entière — critique UX : détecte la coupure fine.)
  - `supprimerImportPdf(path)` : `verifierProf()` + garde préfixe + `remove([path])` + `delete from scriptorium_imports`. Idempotent.
  - **Purge orphelins** : dans `page.tsx` (chargement prof) OU dans `creerUploadImportPdf`, supprimer `scriptorium_imports` + objets storage `imports/${userId}/` de plus de **24 h** (best-effort). Filet contre les sessions abandonnées (onglet fermé).
  - `ajouterLivre` branche `pdf_decoupe` : si `importId` fourni → lire `pages` depuis `scriptorium_imports` (pas de re-download/re-parse) ; sinon fallback `livrePdf` du Lot A. Après succès/rollback : `remove([path])` + delete import.
- `app/prof/scriptorium/FormulaireLivre.tsx` :
  - Bloc `pdf_decoupe` : à la sélection du fichier → `creerUploadImportPdf()` → `uploadToSignedUrl(path, token, file, {contentType:'application/pdf'})` → `analyserPdfImport(path)`. State `{importId, totalPages, scanne, pagesVides, pagesVidesPct, tropLong}`.
  - Affichage « PDF de **N pages** détecté ». Si `tropLong` → erreur bloquante. Si `scanne` → bandeau ambré informatif (cf. §5).
  - Aperçu live par ligne (debounce 500 ms) via `apercuPlage` ; affiche aussi « Page imprimée X → page PDF Y ».
  - `reset()` / changement de mode / `beforeunload` → `supprimerImportPdf(path)` best-effort.

**Tests.**
- Upload PDF > 45 Mo réussit (preuve contournement FormData).
- `analyserPdfImport` : natif → `scanne:false` ; scan → `scanne:true`, pct élevé ; 600+ → `tropLong:true`.
- `apercuPlage` rapide (lecture table, pas de parse) ; bornes hors PDF → erreur ; page blanche → `vide:true`.
- Garde anti-IDOR : `path` d'un autre user → refus.
- Purge : un import de > 24 h disparaît au rechargement prof.
- `ajouterLivre` via `importId` ne re-parse pas le PDF (lit la table).

---

### Lot C — Validations de découpe (trous, chevauchements, couverture, semaines vides)
**Objectif.** Garde-fous client clairs avant submit. Évite que le rollback serveur soit la première info d'erreur.

**Fichiers & changements.**
- `FormulaireLivre.tsx`, bloc `pdf_decoupe` :
  - **Nombre de plages dérivé du nbSemaines en mode pdf_decoupe** : bouton « + Ajouter une semaine / – Retirer » qui pilote `nbSemaines` ; chaque semaine **doit** avoir une plage.
  - Validations **bloquantes** avant submit : chaque `debut ≤ fin` ; `debut+off ≥ 1` et `fin+off ≤ totalPages` ; **chevauchement** (`debut_{i+1} > fin_i`) → « Les semaines N et N+1 se chevauchent » ; **semaine sans plage** → « La semaine N n'a pas de plage — ajoute des pages ou réduis le nombre de semaines » ; titre vide.
  - Avertissements **non bloquants** : **trou** (`debut_{i+1} > fin_i + 1`) → « Pages M à P ne sont assignées à aucune semaine — est-ce voulu ? » ; **sous-couverture grossière** (somme des plages < ~40 % de `totalPages`) → « Tu n'as assigné que X des N pages du PDF — est-ce normal ? » (filet erreur de décalage massive) ; plage `vide:true` → pastille « ⚠ plage vide ».
- `ajouterLivre` (serveur) : re-valider bornes (déjà au Lot A) — ne jamais faire confiance au client.

**SQL.** Aucun.

**Tests.** Chevauchement → bloque ; trou → avertit ; 8 semaines mais 6 plages → bloque avec message clair ; 8 plages couvrant 50/600 p. → avertit sous-couverture.

---

### Lot D — Pré-remplissage par signets (OPTIONNEL, priorité basse, sans fusion)
**Objectif.** Pré-remplir les lignes depuis le sommaire du PDF. Pur pré-remplissage éditable, **aucune fusion** (décision #4).

**Fichiers & changements.**
- `actions.ts` : `suggererBornes(importId)` → `getDocumentProxy(uint8)` + `getOutline()` → mapper chaque entrée via `getDestination`/`getPageIndex` → `suggestions: {titre, debutPdf}[]` (fin = début suivant − 1).
- `FormulaireLivre.tsx` : bouton « Pré-remplir depuis le sommaire du PDF » → remplit `decoupe_${i}_*` (en pages imprimées si décalage saisi, sinon pages PDF brutes éditables). Désactivé si pas de signets.

**SQL.** Aucun. **Tests :** PDF avec sommaire → lignes pré-remplies ; sans signets → bouton désactivé.

---

### Lot E — Garde-fous IA & prompt caching (RECOMMANDÉ, non bloquant produit)
**Objectif.** Matérialiser la dégradation explicite (artefacts prof) + maîtriser le coût (cache). **Pas de chunking.**

**Fichiers & changements.**
- `utils/aletheia-retours.ts` :
  - **Corriger le commentaire L387-389** : « Sonnet 4.6 = fenêtre 1M tokens ; un livre ≤ ~600 p. (~320k tokens) passe en un seul appel. Garde-fou tokens (~700k) UNIQUEMENT sur capstone/référence → ERROR + édition manuelle. VF exclu (echec() re-arme FEEDBACK1_READY → boucle). Chunking map-reduce non nécessaire pour la cible. »
  - Helper `estimerTokensLivre(livreEntier: string): number` = `Math.ceil(livreEntier.length / 3.5)`. **`assemblerAncrageLivre` renvoie inchangé** (transparent pour les 3 appelants).
  - `genererCapstone` (L578-640) et `genererReferenceLivre` (L681-716) : avant l'appel Claude, si `estimerTokensLivre(livreEntier) > SEUIL_TOKENS` → `echec()` (statut `ERROR` + `erreur_at`) avec message « Livre trop volumineux pour la génération automatique (≈ N tokens). Rédige la carte/référence manuellement (l'édition est conservée). » `amende_par_prof` débloque l'édition.
  - **`genererRetourVf` : NE PAS ajouter de garde-fou tokens** (boucle de blocage). Documenté comme reliquat ; si jamais nécessaire au-delà de 700k, un état terminal distinct côté élève sera requis (hors périmètre).
  - **Prompt caching (mitigation coût)** : sur VF (L499-504), capstone (L604-608), référence (L699), passer le bloc `{livre_entier}` (en tête de prompt) en bloc `content` séparé avec `cache_control:{type:'ephemeral'}` (pattern `messagesAvecCache` déjà utilisé pour le diagnostic). Préfixe livre byte-identique entre élèves → cache_read ≈ 0,1×.
- `actions.ts` : `SEUIL_TOKENS` cohérent (réutilisé/dupliqué).

**SQL.** Aucun (statuts `ERROR`/`erreur_at`/`amende_par_prof` existent).

**Tests.** Livre ≤ 600 p. → génération nominale. Livre artificiel > 700k → capstone/référence en `ERROR` (pas d'appel Claude, pas de « tronqué »), VF **non** affecté. Édition manuelle post-ERROR non écrasée. 2e retour VF même classe → `cache_read` non nul (vérifier `usage`).

---

### Lot F — Chunking map-reduce (DIFFÉRÉ, > 700k tokens uniquement)
À n'implémenter que si on vise des livres bien au-delà de 600 p. Point d'insertion unique : `assemblerAncrageLivre`. Référence = par semaine (`assemblerAncrageSemaine` déjà borné) ; capstone = résumé/semaine + synthèse ; VF = semaine courante + `assemblerSynthesesPrecedentes`/`assemblerArchitecturesPrecedentes` (existants) + titres/jalons aval. Garder le nom de variable `{livre_entier}` (validation `sauvegarderPromptsScriptorium` L538-543 l'impose) en y injectant l'ancrage réduit. **SQL aucun.**

---

## 5. Garde-fous & messages

**Décalage de pagination (langage prof, pas « offset ») :**
- Champ guidé inversé : **« Sur quelle page de ton PDF se trouve la page 1 imprimée du livre ? »** → l'app calcule le décalage (`decalage = pagePdfDeLaPage1 − 1`). Le prof n'a aucune soustraction à faire.
- Aide explicite sur la non-linéarité : « Ce décalage doit être constant. Si ton livre a des pages en chiffres romains (préface) ou des planches d'images, il peut changer en cours de route — **vérifie l'aperçu de CHAQUE plage**, pas seulement la première. »
- **Filet :** décalage **surchargeable par ligne** (champ replié, hérite du global par défaut).

**Aperçu (aide à la vérification, pas garantie) :**
- Montrer le **n° de page PDF effectif** à côté de chaque borne (« Page imprimée 21 → page PDF 33 ») pour recoupement avec le lecteur du prof.
- Aperçu du **début de la page de début** isolée (pas la plage entière) → confirme que la coupure tombe sur un début de chapitre. Wording : « aide à la vérification », jamais « garantie ».

**Détection scan (info graduée, jamais bloquante) :**
- `SEUIL_SCAN = 0.7`, `SEUIL_CHARS = 3` (calibrage prudent, à ajuster après test réel). Message non binaire : « X pages sur N contiennent peu ou pas de texte. Vérifie qu'il ne s'agit pas de pages que tu veux inclure. »
- Le **vrai** garde-fou est le **blocage strict par plage vide** (Lot A) + la pastille `vide` par borne. Cohérence Lot B↔A assumée : un PDF scanné → toutes plages vides → rollback au message révisé (sans OCR). L'avertissement scan prévient simplement le prof en amont que la création échouera.

**Trous / chevauchements / couverture :** cf. Lot C (chevauchement & semaine vide = bloquant ; trou & sous-couverture = avertissement).

**Limites :** `MAX_PAGES = 600` (refus). **Upload : URL signée obligatoire** (limite fonction Vercel 4,5 Mo, vérifiée) ; plafond applicatif conseillé **~15–20 Mo** (au-delà du besoin réel annoncé). **Hobby : `maxDuration = 60` s** — l'extraction texte d'un PDF ≤ 15 Mo / ~600 p. tient largement (aucun rendu d'image). Mémoire fonction : `download` + `Uint8Array` + `text[]` d'un 600 p. à ~15 Mo en RAM — confortable, mais **tester sur le PDF cible réel** (Critique de la raison pure).

**Verrou re-découpage (Q3) :** aucun chemin UI ne permet de re-segmenter un livre existant — le mode « 1 PDF découpé » n'apparaît qu'à la **création**. Il n'y a donc rien à verrouiller activement : le découpage n'existe qu'au moment de la création, et changer le découpage = créer un nouveau livre. (La correction d'une coquille dans le `texte_extrait` d'une semaine via `modifierContenu` existant reste possible ; ce n'est pas un re-découpage.)

**État de génération côté prof :** après création d'un gros livre, afficher dans `page.tsx`/carte un état « Génération en cours… » et, si statut `ERROR` (garde-fou Lot E), un message « Carte non générée automatiquement — édite-la manuellement », pour que l'absence de carte ne passe pas pour un bug.

---

## 6. Questions résiduelles — RÉSOLUES (réponses Louis, 2026-06-28)

1. **Plan Vercel → Hobby.** `maxDuration = 60` (plafond Hobby) ; marge d'extraction OK pour la cible. Corollaire vérifié : **limite de corps 4,5 Mo → upload URL signée obligatoire** (cf. §2 / §4).
2. **Prompt caching → câblé dès le MVP** (Lot E dans le périmètre, plus différé).
3. **Re-découpage → interdit dès la création/affectation.** Pas de feature de re-segmentation post-création ; pour changer le découpage → nouveau livre. La correction fine d'un `texte_extrait` via `modifierContenu` existant reste possible (coquille), mais pas le re-découpage. Note : affectation = création aujourd'hui, donc « figé dès l'affectation » = « figé dès la création » ; un état brouillon pré-affectation serait un ajout futur optionnel.
4. **Poids max upload → ~15 Mo.** Plafond applicatif conseillé ~15–20 Mo ; aucune gestion « centaines de Mo ».

---

## 7. Estimation d'effort

| Lot | Contenu | Effort |
|---|---|---|
| **A** | MVP texte-seul FormData + branche serveur + bascule UI + `maxDuration` | **1,5–2 j** |
| **B** | Upload direct + `scriptorium_imports` + analyse/aperçu + purge orphelins | **2–2,5 j** |
| **C** | Validations découpe (trous/chevauchements/couverture/semaines) | **0,5–1 j** |
| **D** | Signets (optionnel, sans fusion) | **0,5–1 j** |
| **E** | Garde-fous IA (capstone/réf) + correction commentaire + prompt caching 3 chemins | **1–1,5 j** |
| **F** | Chunking map-reduce (différé, > 700k tokens) | **2–3 j** (si jamais) |

**Chemin MVP livrable :** Lots **A + B + C** ≈ **4–5,5 j**. Lot **E** fortement recommandé avant ouverture à de vrais gros livres (coût). Lots **D** et **F** optionnels/différés.

**SQL total :** une seule migration (`scriptorium_imports.sql`, Lot B). Lots A, C, D, E, F = aucun SQL.

**Fichiers concernés :** `app/prof/scriptorium/actions.ts`, `app/prof/scriptorium/FormulaireLivre.tsx`, `utils/aletheia-retours.ts`, `app/prof/scriptorium/page.tsx` (affichage état génération + purge), `scriptorium_imports.sql` (neuf). Lecture seule / inchangés : `LigneContenu.tsx`, `app/eleve/modules/aletheia/data.ts`.