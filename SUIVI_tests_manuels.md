# SUIVI_tests_manuels — validation humaine avant merge

> **Protocole.** Chaque spec/session ajoute sa section ici au moment où elle est écrite ou close
> (Cowork s'en charge, à partir du rapport de clôture de Code). Un test coché `[x]` = soldé
> (joué et validé, ou explicitement couvert autrement — la note de fin de ligne fait foi).
> Coche toi-même au fil de tes tests, ou dis-le en session (« coche C1C-3 ») et c'est fait.
>
> **Règle d'or (apprise le 24/07) :** toujours tester dans un vrai navigateur (Chrome), jamais
> dans l'aperçu embarqué de Code — les dialogues natifs (`confirm()`) y sont muets et tous les
> boutons à confirmation semblent morts. Et Cmd-R avant de conclure à un bug : un onglet resté
> ouvert pendant les hot-reloads du dev server finit par mentir.

## C1 — Robustesse · Session C (commit `c205e7b`, sur `feat/c2-l8-calibration`)

_Sessions A et B closes avant la création de ce fichier (tests faits à leur clôture) — le suivi
démarre ici._

**✅ Chantier C1 clos le 24/07.** 2·3·5·6·7 joués et validés ; 1 et 4 soldés par revue de code
et tests unitaires ; 8 et 9 non joués, risque accepté (dégradation propre couverte par la revue).

### C-a — Redirection sûre `/auth/confirm` + flux d'invitation

- [x] **C1C-1 · Lien piégé.** Visiter `/auth/confirm?token_hash=<token valide>&type=recovery&next=//evil.com`, puis la variante `next=/.//evil.com` → après vérification, atterrissage sur `/finaliser-inscription`, jamais sur evil.com. _(Soldé hors E2E le 24/07 : le wiring est vérifié dans la route — `cibleInterneSure` calcule la cible sûre AVANT `verifyOtp`, un `next` piégé ne peut donc atterrir que sur un chemin interne, token valide ou pas — et les 12 tests unitaires couvrent `//evil` et `/.//evil`. L'essai E2E butait sur un token déjà consommé → `/login?erreur=lien` avant toute redirection : chemin sûr attendu. Recette si on veut le jouer un jour : nouvelle invitation, NE PAS cliquer le lien de l'email, y remplacer la valeur de `next` par `//evil.com`, visiter.)_
- [x] **C1C-2 · Flux normal.** Inviter un élève test (`/prof/eleves`) → email reçu → clic sur le lien → « finaliser l'inscription » → mot de passe → arrivée sur `/eleve` → déconnexion → reconnexion via `/login`. Rien ne casse. _(Validé le 24/07.)_

### C-b — Fiche canonique (continuité inter-chapitres + génération partielle)

- [x] **C1C-3 · Continuité.** Régénérer les fiches d'un livre test multi-chapitres (« ↻ Régénérer les fiches (IA) » en vue-livre) → comparer avant/après : concepts nommés de façon cohérente d'un chapitre à l'autre, thèses qui se répondent. _(Validé le 24/07 — sur Chrome, après l'épisode du bouton muet dans l'aperçu de Code.)_
- [x] **C1C-4 · Partiel.** Si une génération échoue sur une séance : (a) les autres séances gardent leurs fiches, (b) bandeau « ⚠ Référence incomplète — séance X » en vue-livre, (c) séance « à générer » dans le rail, (d) régénérer comble le trou. _(Difficile à provoquer volontairement — soldé par la revue de code, décision du 24/07.)_
- [x] **C1C-5 · Non-régression.** Sur une référence complète : fiche prête, diagnostic, synthèse élève — rien ne régresse. _(Validé le 24/07.)_

### C-c — Retour V1 nourri par la fiche canonique

- [x] **C1C-6 · Qualité.** Séance test avec fiche prête → soumission d'un V1 par un élève → relances mieux ciblées/ancrées qu'avant, mais toujours socratiques : aucune réponse donnée, la fiche n'est jamais citée ni révélée. _(Validé le 24/07.)_
- [x] **C1C-7 · Anti-spoiler.** Le retour V1 de la séance N ne dit rien de la suite du livre. _(Validé le 24/07.)_
- [x] **C1C-8 · Repli sans fiche.** Référence pas encore générée (ou séance sans fiche) → le V1 fonctionne quand même (texte seul), sans erreur. _(Non joué — risque accepté le 24/07 ; le repli est couvert par la revue de code.)_
- [x] **C1C-9 · Override prof.** Prof ayant édité `prompt_feedback_1` en base → le V1 fonctionne toujours (fiche simplement non injectée — dégradation propre). _(Non joué — risque accepté le 24/07 ; couvert par la revue de code.)_

_Clos → prochaine étape : merge de `feat/c2-l8-calibration` dans `main` (elle embarque aussi Session B et le banc de calibration L8)._

## C2 — (à venir)

_Les tests seront ajoutés à l'écriture des specs / à la clôture des sessions (écran élève, calibration L8…). S'y ajoutera le test reporté C11a-6 (synthèse hebdo → ligne `scriptorium` classe seule)._

## C11a — Coûts API + attribution (commits `8d96c85` + `25e1884`, sur `feat/c11a-couts`)

_Section consolidée des deux rapports de clôture (C11a et C11a-bis, 25/07) par Cowork.
**L'ordre comptait** : le test 1 n'était observable qu'AVANT d'exécuter le SQL._

**✅ Chantier C11a clos le 26/07 (décision PO).** 1-5 joués et validés par la requête de
contrôle — la logique du journal est prouvée de bout en bout (écriture, attribution
élève + classe, tokens, tuile). 10 soldé par la manière dont 4-5 ont été joués (note).
6-9 reportés : ils testent les **modules porteurs** plus que le journal → repris dans les
sections **C2 · C7 · C4/C8 · C13** à l'écriture de leurs specs.
**Reliquat immédiat : merge `feat/c11a-couts` → `main` + push, sans attendre** — depuis
l'exécution du SQL, palimpseste.ink tourne sur le code d'AVANT C11a : il journalise des
lignes valides mais **non attribuées**, sans vérification d'`error`. La fenêtre se ferme
au déploiement.

- [x] **C11a-1 · État dégradé (joué AVANT le SQL).** `npm run dev` sur `feat/c11a-couts`, ouvrir `/prof` en prof → la ligne « Coût API » porte une pastille rouge et « Total partiel — source illisible : journal api_couts » ; le terminal crache `[cout-api] lecture illisible — api_couts … PGRST205`. _(Validé le 26/07. C'était le test du chantier : avant, cet écran affichait sereinement un total faux.)_
- [x] **C11a-2 · Migration.** SQL Editor de la sandbox → `c11a_api_couts.sql` (v2), puis le bloc de vérification → `table_ok = t, rls_ok = t, policies = 1, index_created_ok = t, index_eleve_ok = t, colonnes_attribution = 7`. _(Validé le 26/07 ; case **Sandbox** de la ligne du 25/07 cochée dans `SUIVI_SQL.md` (26/07).)_
- [x] **C11a-3 · Tuile réparée.** Recharger `/prof` → pastille bleue, plus de mention « total partiel ». _(Validé le 26/07.)_
- [x] **C11a-4 · Aletheia (le module le plus coûteux — test le plus important).** Retour V1 produit (soumission élève test) → ligne `aletheia` avec `eleve_id` renseigné. _(Validé le 26/07 — requête de contrôle.)_
- [x] **C11a-5 · Scriptorium chat.** `rag_actif` ON temporairement, 2-3 messages élève, OFF → lignes `scriptorium` avec élève ET classe ; montants cohérents avec `scriptorium_messages`. _(Validé le 26/07 — requête de contrôle.)_
- [ ] **C11a-6 · Synthèse hebdo.** « (Re)générer » sur une semaine ayant des messages → ligne `scriptorium` **classe seule** + `scriptorium_rag_syntheses.cout` renseigné ; semaine sans messages : `VIDE`, aucune ligne. _(**Reporté le 26/07 → recette C2** (fin du RAG, S2) — trop tôt ici.)_
- [ ] **C11a-7 · Quazian.** Création d'un quiz → ligne `quazian` avec `classe_id`, jamais d'`eleve_id`. _(**Reporté le 26/07 → C7** — la création de flashcards/quiz est cassée en sandbox depuis le 24/07 ; C7 commence par la remise en marche.)_
- [ ] **C11a-8 · Fragments / Codex (l'autre source).** Un dépôt analysé, une séance Codex → la tuile voit monter « Fragments » / « Codex » sans passer par `api_couts`. _(**Reporté le 26/07 → C8 pour Fragments** (création de semaines bloquée) **· C4 ou C13 pour Codex** (création de séance bloquée, reliquat C1).)_
- [ ] **C11a-9 · Tuile complète.** Total = somme des modules affichés ; les 5 modules présents dès qu'ils ont un coût dans le mois _(critère « fait » du plan)_ ; format `$0.0421` / `$12.34`. _(**Reporté le 26/07 → C13** — le scénario de recette générale se termine déjà par « → coûts » : c'est là que les 5 modules seront visibles ensemble.)_
- [x] **C11a-10 · Non-régression.** _(Aucune manipulation nouvelle : ce test dit seulement « le flux élève marche toujours pendant que le journal écrit » — la journalisation est best-effort et ne doit jamais coûter son retour à un élève. Or 4 et 5 ont été joués avec un élève réel au bout du flux : le retour V1 est arrivé, le chat a répondu, et `avec_tokens = appels` à la requête de contrôle. **Soldé par 4-5 le 26/07** — à décocher si quelque chose avait cloché côté élève pendant ces tests.)_

**Requête de contrôle (à réutiliser pour 6-9 dans leurs chantiers porteurs) :**

```sql
select module, count(*) as appels, count(eleve_id) as attribues_eleve,
       count(classe_id) as attribues_classe, count(tokens_entree) as avec_tokens,
       round(sum(cout)::numeric, 4) as total_usd, max(created_at) as dernier
  from api_couts group by module order by total_usd desc;
```

_Vides d'attribution **attendus** (pas des bugs) : capstone et fiche de référence Aletheia (coûts
de livre), flashcards et régénération de question Quazian (contenu partagé), diagnostic Quazian
(toutes classes), synthèse hebdo (classe seule). C'est la future ligne « Coûts de classe / non
attribués » de `SPEC_C11c_ecran_couts.md`. Trou de comptage connu, accepté : un tour de chat dont
l'usage fournisseur est indisponible n'écrit rien au journal (compté 0, loggé `usage indisponible`
— recoupable via `scriptorium_messages`)._
