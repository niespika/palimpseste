# PROMPT Code — Accès & classes · L1 : le module appartient à la classe, et la croix du Pilotage répare

*(⚙️ modèle standard · une session = ce lot (règle R4) · `/clear` avant de commencer · branche `feat/acces-classes` depuis un `main` à jour · prérequis : C7·L2 mergé ; si C7·L3 est déjà passé, reprendre son `main` — les deux lots touchent l'écran élève Quazian)*

## Contexte

L'entrée 🔴 du 14/08 d'`IDEES_post_rentree.md` (« Les modules donnés à une classe ne donnent ni ne
retirent réellement l'accès ») documente le trou — T5 n'a pas le module Codex, et pourtant une
synthèse Codex y a été créée, lancée, et l'élève la voit — et laissait la question de fond ouverte.
**Louis l'a tranchée le 14/08 : le module appartient à la CLASSE.** L'union du Lot 1 (« un élève en
deux classes voit l'UNION des accès », en-tête d'`utils/acces.ts`) devient un bug à réparer, et
l'écran « Quelle classe ? » — qui ne proposait que les classes ayant le module et « paraissait en
tort » (recette C7·L2, trouvaille du 14/08) — avait raison. La règle voulue, dans ses mots : si Test
a Codex et T5 a Quazian, chaque module ne se voit et ne s'ouvre que dans SA classe ; un élève qui
arrive sur un module fermé pour sa classe en contexte lit un message du type « ce module n'est pas
ouvert pour ta classe, il faut que tu changes de classe » ; et le prof ne peut pas concevoir
d'exercice pour une classe qui n'a pas le module.

Troisième volet, constaté le même jour : **la croix de retrait d'une classe, sur les jetons de
classe du Pilotage (`/prof/eleves`), ne retire rien.**

## Objectif du lot

1. **Prof — les sélecteurs de classe filtrent par module.** Le helper existe et Fragments l'emploie
   déjà sur quatre écrans : `classesAvecModule` (`utils/acces.ts:79`). À corriger (sites recensés
   dans l'entrée IDEES, plus un) : Codex `app/prof/codex/page.tsx:38` (formulaire de synthèse ET
   tuiles de classes), Quazian `app/prof/quazian/quizz/page.tsx:45` (création de quiz) et
   `app/prof/quazian/page.tsx:55` (le libellé « Au parcours de… » ne doit annoncer que des classes
   ayant Quazian), Aletheia `app/prof/aletheia/page.tsx:61`. Puis balayage : tout `from('classes')`
   dans un écran de module — corriger les surfaces de CONCEPTION, lister le reste en PR sans y
   toucher. Les lignes DÉJÀ créées pour une classe sans le module (la synthèse « Cognitif » × T5 du
   14/08 en est une) : **ne rien détruire** — les recenser en tête de PR (requête de contrôle),
   Louis tranche.
2. **Élève — l'accès se juge sur la classe en contexte.**
   - Grille « Mes mondes » (`app/eleve/page.tsx:229`, `moduleIdsAccessibles` = union) : en état
     classe, seuls les modules de CETTE classe ; en état « Toutes », l'union reste juste — chaque
     module demande ensuite sa classe via `ChoixClasseModule`, qui filtre déjà correctement.
   - Les drapeaux du tableau de bord (`accFragments`/`accQuazian`/…, `app/eleve/page.tsx:82-86`)
     passent au périmètre PAR INSCRIPTION : une tâche Quazian ne naît que d'une classe qui A Quazian.
   - Pages module (les cinq + la page générique `eleve/modules/[slug]`) : quand la classe en
     contexte n'a pas le module mais qu'une AUTRE inscription de l'élève l'a — le cas réel : entrer
     dans un module puis basculer le commutateur — afficher un écran-message : « Ce module n'est pas
     ouvert pour ta classe (T5). Passe sur Test avec le commutateur pour y accéder. » (formulation à
     ajuster au ton de l'app), au lieu de la page vide trompeuse d'aujourd'hui. Aucune classe de
     l'élève ne l'a → le message actuel (« Tu n'as pas encore accès à ce module ») reste.
     **Centraliser** : un helper d'accès par classe posé dans `utils/acces.ts` À CÔTÉ de l'union
     (ne pas redéfinir l'union à l'aveugle — le hub prof `/prof/eleves/[eleveId]` et
     `eleveIdsAvecAccesModule` parlent de l'ÉLÈVE, l'union y reste légitime) + UN composant
     d'écran-message (patron `ChoixClasseModule`), réutilisés partout — pas cinq copies.
   - Ne casser ni le mono-classe (test C7L2-7) ni l'état « Toutes » (C7L2-4).
3. **Pilotage — la croix de retrait ne fait rien** (constat Louis, 14/08). **Diagnostic d'abord,
   écrit en tête de PR.** La chaîne : jeton × de `LigneEleve.tsx` (`retirerClasse`, ~l.90) →
   `confirm()` natif → `retirerEleve` (`app/prof/classes/actions.ts:132`) → RPC `retirer_inscription`
   (`fix_retirer_inscription.sql`, archive, écrite en juin). Trois suspects à départager, dans cet
   ordre :
   - (a) le `confirm()` natif muet — quatre morsures déjà documentées (entrée dédiée d'IDEES) : dans
     l'aperçu embarqué ou un onglet ayant bloqué les dialogues, le handler abandonne sans une
     requête. Tester dans Chrome, Cmd-R avant de conclure (règle d'or du `SUIVI_tests_manuels.md`).
   - (b) la RPC de juin face au schéma d'août : les tables nées depuis (conversations/messages
     Scriptorium, séances Aletheia, plan d'évaluation, `api_couts`…) peuvent bloquer le delete (FK) —
     l'erreur s'affiche alors en petit sous les jetons, facile à rater — ou, pire, laisser du travail
     orphelin qui survit au retrait. Énumérer en base les FK réellement en jeu, ne pas deviner.
   - (c) `GestionEleves.tsx` (panneau d'une classe, bouton « Retirer ») partage la même action :
     vérifier les DEUX surfaces.
   Correctif selon diagnostic : confirmation in-app au patron `TableauLive` (commit `89625fc`) qui
   DIT ce qui va partir, `catch` + erreur affichée en clair ; si la RPC est en cause, **nouveau**
   fichier `create or replace` aligné sur le schéma actuel — protocole renforcé, rollback prêt — et
   ne JAMAIS rejouer le fichier archivé.

## Hors périmètre de ce lot

- Le sort du travail d'une classe à qui on RETIRE un module (séances, cartes, contenus restent en
  base) — la question de fond de l'entrée IDEES : la noter, elle se tranche au check-in (R7). La
  règle d'accès de ce lot suffit à le rendre inatteignable dans le contexte de cette classe.
- La visibilité Quazian au « vu » et les tuiles par cours → `PROMPT_Code_C7_L3.md`, autre session.
- « Bloquer un élève jamais signalé » (autre entrée IDEES) : non. Toute idée au-delà →
  `IDEES_post_rentree.md`.

## Règles du dépôt (AGENTS.md — rappel)

- **SQL** : lire `SUIVI_SQL.md` AVANT ; toute reprise de la RPC = nouveau `.sql` à la racine + ligne
  au journal ; **protocole renforcé** (flux existant). Ne jamais rejouer un fichier de l'Archive.
- Réparation + resserrement d'existant : aucun flag nouveau attendu. UI : jetons de `globals.css`.
- Question de conception → noter en fin de session, ne pas trancher (R7).

## Critère de sortie

Sandbox, Chrome (pas l'aperçu embarqué).
(a) **Prof** : le formulaire Codex ne propose plus T5 ; la création de quiz Quazian ne propose que
les classes ayant Quazian ; la synthèse T5 existante est recensée en PR, intacte.
(b) **Élève bi-classe (Sacha)** : en contexte Test, la grille ne montre que les modules de Test ;
depuis Quazian, basculer le commutateur sur T5 → l'écran-message avec l'invitation à changer de
classe ; en état « Toutes », comportement C7L2-4 inchangé.
(c) **Mono-classe (Elo)** : rien ne change (C7L2-7).
(d) **Pilotage** : créer un élève JETABLE, l'inscrire dans deux classes, y semer un peu de travail si
le diagnostic a montré des FK en jeu — la croix le retire réellement d'UNE classe (vérifier en
base : l'inscription part, le travail scopé de cette classe part, l'autre classe survit), et un échec
s'affiche en clair. **Ne pas jouer ce test sur Sacha** — les tests bi-classe vivent sur lui.
Reporter les tests au `SUIVI_tests_manuels.md` (section « Accès & classes · L1 »). Commit + merge si
vert.
