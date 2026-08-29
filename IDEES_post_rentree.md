# IDEES_post_rentree — le parking à idées

> Règle du plan de rentrée : après le gel des specs (mer 29/07), **toute idée nouvelle atterrit ici**
> au lieu d'entrer dans le périmètre. On rouvre ce fichier en septembre, à tête reposée.

## Déjà différé par le plan (repris de PLAN_CHANTIERS_RENTREE.md §6)

- Mode C Aletheia (C2.x, carte-de-parcours Scriptorium)
- Import PDF lots D/E/F (signets, garde-fous IA, chunking)
- « Modèle vivant » du plan d'évaluation (propagation modèle→instances)
- Moteur adaptatif / Profil élève complet (spec à ouvrir avant les modules analyse/écriture)
- Recâblage Fragments par classe (D12)
- Refonte visuelle profonde / design system v2
- Unification fine des conventions de coûts API
- Dossier RGPD/Loi 25 complet (au-delà de la lettre d'information)
- Tests automatisés / CI généralisés (chantier de septembre-octobre)
- Crochet `niveaux` de la synthèse RAG → branché au système de compétences

## Idées nouvelles (au fil de l'eau)

- **Fabrique du professeur (C4-L8) — la génération EN LIGNE des matériaux, des appuis et des références.** Tranché avant le lot : la conception en ligne n'appelle aucun modèle, l'instance s'assemble depuis les choix du professeur et ce qui s'engendre s'engendre au générateur hors plateforme, puis arrive par l'import *(`07-Implementation.md` §2 et §5)*. Louis le veut **à terme en ligne**. Ce que ça suppose, à poser avant de coder : un domicile qui fasse foi pour les prompts du générateur *(matériau, appui, guide, sujets — aujourd'hui dans `generateur/prompts/`, « pas de la doctrine »)*, sur le patron du `05-` pour G1-G3 *(marqueurs + dérivation)* ; une `phase` pour ces appels au journal `api_couts` *(le `07-` §1.2 n'en prévoit que trois, hors exercices = NULL)* ; et la même file de validation à la sortie que pour l'import. *Ligne posée le 21/08, à la fabrication du prompt C4-L8.*

- **Monitoring — localiser l'aveu d'incompréhension sur l'observable qui a échoué.** Le taux de « lucidité sur l'incompris » compte un exercice comme réussi dès qu'il porte **au moins un** aveu et **au moins un** observable en échec. Un élève qui avoue ne pas être sûr d'une date, puis affirme un contresens central sur le cogito, compte donc comme lucide — c'est le constat **`RF12`** de la revue adversariale de fond, vérifié exact. **Décision du 17/08 : on ne fait rien tout de suite** ; la limite est écrite et pré-enregistrée au §3 de `palimpseste-conception/competences/monitoring.md`. **Mais la voie n'est pas fermée, et Mètis avait tort de l'écrire** : le dispositif a déjà des cas où une phase de jugement voit **une partie** de la prose — les **citations verbatim** que le relevé P1 porte au squelette, sur les six compétences ; la fiche Monitoring §4 disait « aucune phase de jugement ne voit la prose », c'était trop fort, et la phrase a été corrigée le même jour. **Ce que la localisation demanderait** : que le relevé de lucidité porte lui aussi sa citation et son ancrage, une règle d'appariement citation ↔ observable, un schéma de collecte et des golds. ⚠️ **Vigilance à ne jamais perdre si l'idée revient** : deux règles protègent la mesure et l'appariement doit se faire **après** l'extraction, jamais dedans — *aucun exercice n'est construit pour susciter ces marques* (fiche §4), et le prompt d'extraction dit *« tu ne dis jamais si son incertitude tombe au bon endroit »*. Solliciter le geste le rendrait vrai pour tout le monde. *(idée Louis, 17/08 : « on a déjà des cas où le jugement voit la prose. Là tout de suite on ne fera rien, mais je me réserve le droit de développer cette possibilité. »)*

- **Aletheia (livres) — variante du cycle à cinq temps.** Le cycle standard des exercices (préparer → v1 → se juger → retour → vf, acté le 25/07 côté conception, cf. `palimpseste-conception/NOTE-CYCLE-PEDAGOGIQUE.md`) pourrait avoir une déclinaison propre aux séances de lecture guidée des livres : préparation = stratégie de lecture du passage, phase métacognitive = auto-jugement de sa lecture contre le squelette. À instruire post-rentrée. *(idée Louis, 25/07)*

- **Exercices manuscrits — faire valider la transcription OCR par l'élève.** L'élève relirait la transcription de sa copie avant qu'elle parte dans la chaîne : il verrait ce que sa graphie produit réellement (l'effet pédagogique visé : apprendre à écrire lisiblement) et corrigerait les mots mal lus. **Parqué : le budget temps explose** (une relecture par dépôt × v1 et vf × ~70 élèves). **Vigilance Expression à ne jamais perdre si l'idée revient** : si l'élève peut *éditer* la transcription, il peut lisser silencieusement ses propres fautes — or les fautes sont la matière d'Expression et de la chasse aux fautes (SPEC C3 §2-§3) ; toute version de cette idée doit rester **sans édition libre du texte** (désigner un mot mal lu, oui ; retaper la phrase, jamais). **Piste à coût quasi nul (Mètis)** : afficher au dépôt la transcription en *lecture seule*, mots douteux surlignés — l'élève voit l'effet de sa graphie sans rien pouvoir corriger ; le signal de confiance (> X % douteux → à refaire) reste le seul mécanisme contraignant. À instruire post-rentrée, sur le taux de refaits observé. *(idée Louis, 28/07 — parquée par lui : « le budget temps explose. À voir… »)*

- **Fragments — page élève n'honore pas `modules.actif`.** Contrairement à codex/quazian/aletheia (dont les pages de validation font `notFound()` sur `!modules.actif`), `app/eleve/modules/fragments-erudition/page.tsx` et `validerLectureRetour` ne gardent que sur l'assignation (`inscriptionsModuleEleve`), jamais sur `modules.actif`. Donc désactiver Fragments globalement tout en le laissant assigné laisse l'élève y accéder. Piste consistance : ajouter la garde `actif` à la page + `validerLectureRetour` (le gate C1-B1 est déjà correct dans les deux cas — il reflète cette garde réelle par module). *(repéré pendant la revue C1-B1)*
- **Aletheia/Codex — brouillon persistant des soumissions (localStorage).** C1-B2 rend l'échec de soumission visible et garde le texte dans le formulaire (state React), mais un rechargement / onglet fermé / redirection `/login` après expiration de session perd encore les 5 champs V1 (jusqu'à ~8000 car. chacun). Piste : autosave localStorage clé `(livreId, semaine, champ)` purgée à la soumission réussie. Le brouillon SERVEUR reste un non-but (SPEC B2). *(scope-out assumé pendant C1-B2)*
- **Codex — consignes prof jamais vues par l'élève.** `app/eleve/modules/codex/synthese/[sessionId]/page.tsx:60` lit `codex_params` (consigne_v1/consigne_vf) avec le client user-scoped, or `codex_params` est prof-only (RLS) → la lecture renvoie toujours `null` et l'élève voit TOUJOURS les consignes par défaut (`consignes.ts`), jamais celles éditées par le prof. Correctif : lire via client admin (comme les autres lectures Codex élève). *(repéré pendant l'inventaire C1-A, hors périmètre sécurité)*
- **Login — `?erreur=lien` posé mais jamais affiché.** `app/auth/confirm/route.ts` et `app/finaliser-inscription/page.tsx` redirigent vers `/login?erreur=lien` (lien d'invitation expiré/invalide, ou finalisation sans session), mais `app/login/page.tsx` ne lit jamais ce paramètre → l'élève retombe sur un formulaire propre sans savoir que son lien a expiré. Piste : afficher un bandeau « ton lien a expiré, redemande une invitation » quand `?erreur=lien`. *(repéré pendant la vérif du flux d'invitation C1-C-a)*
- **Fiche canonique — continuité inter-lots en fiches générées (option future).** C1-C-b donne à chaque lot le TEXTE BRUT des semaines antérieures (parallélisme conservé → timeout à 60 s inchangé). L'idéal SPEC (« les fiches déjà générées ») nécessiterait des lots SÉQUENTIELS (chaque lot attend la sortie du précédent) → coût input O(n) minuscule mais durée = Σ lots (~30 s × nb_lots) qui dépasse 60 s dès ~4 semaines. À rouvrir seulement si on relève `maxDuration` (Vercel Fluid/Pro ≥ 300 s) ou si on sort la génération de référence du chemin `after()` (worker/queue). *(arbitrage assumé pendant C1-C-b)*
- **Transversal — remplacer les `confirm()` natifs par une confirmation in-app.** ~30 occurrences dans une vingtaine de composants (BoutonRegenererFiches, BoutonSupprimerUnite, ColonneCarte, GestionEleves, GrilleParcours…) reposent sur le dialogue natif du navigateur. Or dans tout environnement qui ne l'affiche pas — aperçu navigateur embarqué (webview du panneau de Code : `confirm()` renvoie `false` silencieusement), onglet Chrome où « Empêcher cette page de créer d'autres boîtes de dialogue » a été coché — le bouton devient muet : le handler abandonne à la première ligne, sans aucun feedback. Vécu le 24/07 sur « Régénérer les fiches (IA) » (le code était sain, seul l'environnement bloquait le dialogue). Piste : petit composant de confirmation maison (charte), et au passage un `catch` autour des appels d'action serveur de ces boutons — aujourd'hui un échec de l'action passe inaperçu (`BoutonRegenererFiches.lancer` n'a qu'un `finally`). *(diagnostiqué avec Cowork pendant les tests manuels C1-C)* ➜ **Quatrième morsure le 13/08 (C7·L1)**, sur « Fermer le quizz » : clic → aucune requête, et une demi-recette perdue avant qu'on rattache le symptôme à cette entrée. **Le remède est désormais joué sur un bouton** (`TableauLive.tsx`, commit `89625fc`) : confirmation dans la page au patron `BoutonSupprimerUnite`, à un cran, avec le `catch`/`finally` et l'erreur affichée que cette entrée réclamait — plus un gain que le dialogue natif ne permettait pas, **dire ce qui va se passer** (« 5 élèves seront auto-soumis en 25/25/25/25 »). Reste à généraliser : `LigneEleve`, `EcranVacances`, `FileValidation`, `BibliothequeContenus`, `LigneContenu(Biblio)`, `GrilleParcours`, `GrilleInstance`, `EditeurSections`, `ColonneCarte`, `BoutonRegenererFiches`/`Synthese`, `TableauSynthese`, `EditeurRetour`, `GestionEleves`, et trois côté élève (`EcranV1`, `EssaiDepot`, `ChatScriptorium`). ➜ **`EcranSemestres` est sorti de la liste le 20/08** : le lot Calendrier · Année l'a remplacé par `EcranAnnee`, qui naît avec la confirmation en page (archiver / supprimer une année, et l'avertissement « dépôts existants » avant de renuméroter). `EcranVacances` reste, lui, sur le dialogue natif — touché par le même lot mais hors de son périmètre. Le jour où il n'en reste aucun, la « règle d'or » du `SUIVI_tests_manuels.md` perd sa raison d'être.

- **Le piège `{ error }` de supabase-js est probablement transverse, pas limité aux coûts.** La cause racine de C11a n'était pas un `catch` trop large mais le fait que supabase-js **ne lève pas** sur erreur de requête : il retourne `{ error }`. Tout `await admin.from(X).insert(...)` / `.update(...)` dont on ignore le retour est donc un échec **totalement invisible**, même enveloppé d'un `try/catch` qui log. Deux cas repérés au passage, hors périmètre coûts : (1) `app/api/scriptorium/chat/route.ts` — les inserts de `scriptorium_messages` (message élève ET réponse tuteur) et l'update de `scriptorium_conversations` ne vérifient pas `error` ; le `catch` du `after()` qui log « persistance échouée » ne se déclenchera jamais pour une erreur SQL → un message d'élève peut disparaître sans une ligne de log ; (2) `utils/analyse.ts:103` et voisins. Piste : un grep systématique de `await admin.from(`/`await supabase.from(` sans déstructuration de `error`, puis un petit helper maison (`ecrire()` qui log et renvoie un booléen) pour les écritures best-effort. *(cause racine identifiée pendant C11a)*
- **Fragments — l'analyse orale n'est suivie nulle part côté coût.** `utils/analyse-orale.ts` appelle Sonnet (dossier de fragments complet en entrée, 4096 max out) sans aucun enregistrement : ni colonne `cout_api` sur `fragments_analyses_orales` (vérifié en base le 25/07 — la table n'a pas cette colonne), ni ligne `api_couts`. La transcription Groq Whisper (`utils/transcription.ts`) non plus (~0,04 $/h d'audio, négligeable mais zéro trace). Reste un angle mort de la tuile « Coût API » même après C11a : quelques dollars par semestre au volume actuel (1 oral/élève). Piste : soit une colonne `cout_api` sur la table d'analyses orales (convention Fragments), soit un `enregistrerCoutApi('fragments-oral', …)` — au choix de l'unification différée. *(constaté pendant C11a, hors périmètre « deux sources »)*
- **Journaliser les tokens et pas seulement le montant dans `api_couts`.** La table ne porte qu'un `cout` agrégé. Sans les 4 compteurs (entrée, sortie, cache_read, cache_creation), impossible de mesurer le **hit-rate réel du prompt caching** — donc impossible de trancher le TTL 1 h vs 5 min d'Aletheia autrement qu'à l'aveugle (recommandation de l'audit du 02/07, toujours ouverte). Migration additive triviale (4 colonnes nullables), mais elle touche la signature de `enregistrerCoutApi` et ses 14 sites d'appel → laissée dehors pour tenir le périmètre C11a (« juste le total lisible »). *(différé assumé pendant C11a)*
- **`utils/aletheia-retours.ts` est invisible à `grep` (4 octets NUL).** Le fichier (71 ko, le plus gros du répertoire `utils/`) contient `const CACHE_BREAK = '\0\0ALETHEIA_CACHE_BREAK\0\0'` avec de **vrais octets NUL** — intentionnel côté produit (sentinelle de coupure de cache), mais `file` classe le fichier en « data » et `grep` le traite comme binaire : il **n'affiche aucune correspondance** (juste « Binary file … matches »), sauf avec `-a`. Seul fichier du repo dans ce cas. Conséquence : tout audit ou revue par grep passe silencieusement à côté de tout ce fichier — j'ai moi-même conclu à tort « Aletheia ne suit aucun coût » avant de refaire le grep avec `-a` (les 6 appels sont bien journalisés). Piste : remplacer les NUL littéraux par une sentinelle imprimable improbable (ex. `␀`) ou par `String.fromCharCode(0)` construit à l'exécution — le comportement produit serait identique et le fichier redeviendrait greppable. *(découvert pendant C11a)*

- **Les semaines « hors calendrier » sont comptées, jamais montrées.** `synchroniserSemaines()` ne supprime rien (à raison : des dépôts peuvent y être rattachés) et renvoie un compteur `horsCalendrier` — les semaines stockées qui ne s'alignent plus sur aucune semaine calendaire du semestre, typiquement après un recul de `start_date`. Ce compteur n'apparaît que dans le message fugace du bouton « Générer les semaines » ; nulle part le prof ne peut *voir lesquelles*, ni décider de les rattacher ou de les détacher. Piste : une ligne dépliable sous la carte de semestre (« 2 semaines hors calendrier — 3 dépôts »), avec au choix « détacher du semestre » ou « supprimer si vide ». *(constaté pendant C8·L1, hors périmètre réparation)* ➜ **Moitié faite le 20/08 (Calendrier · Année)** : le COMPTEUR s'affiche désormais en permanence sur la carte du semestre concerné (« n semaines hors calendrier — conservées, d'éventuels dépôts y restent rattachés »). Reste à faire : dire **lesquelles**, et offrir de les détacher ou de les supprimer si elles sont vides. **Le mal exact, constaté en recette le 20/08** : une orpheline peut porter le MÊME LUNDI qu'une semaine vivante de l'AUTRE semestre (après un déplacement de frontière, la sandbox en a montré quatre : 2026-12-21, 12-28, 2027-01-04, 01-11). Aucun écran ne les confond — tous filtrent par semestre — mais toute requête SQL qui grouperait par `date_debut` seul les compte en double, et c'est ce qui a fait rougir à tort la requête de contrôle de la recette. Corollaire : le contrôle « aucune semaine à cheval » doit se restreindre aux lignes ALIGNÉES sur la grille de leur semestre (requête corrigée dans `SUIVI_tests_manuels.md`, section Calendrier · Année).
- **Décaler un semestre renumérote les semaines sous les dépôts déjà faits.** Ajouter une période de vacances au milieu d'un semestre resserre la numérotation : la ligne qui portait `numero = 7` devient `numero = 6`. Les dépôts suivent par `semaine_id` (rien n'est perdu), mais un élève qui avait lu « Semaine 7 » dans son historique lira « Semaine 6 » le lendemain, et les retours IA déjà publiés parlent de l'ancien numéro. Aujourd'hui c'est sans conséquence (les vacances se saisissent avant la rentrée) ; ça mordra le jour où une tempête ajoutera une semaine de congé en cours de semestre. Piste : geler le `numero` d'une semaine dès qu'elle porte un dépôt, et ne renuméroter que les semaines vierges. *(constaté pendant C8·L1)* ➜ **Le 20/08 (Calendrier · Année), l'écran AVERTIT avant d'enregistrer** dès que l'année porte au moins un dépôt (« un élève qui avait lu Semaine 7 pourra lire Semaine 6 ») — l'écran Année rend le déplacement plus facile, donc plus probable. Le gel du `numero`, lui, reste entier.
- **`fragments_semaines` est globale, mais l'échéancier est vécu par classe.** La table n'a pas de `classe_id` : les semaines sont communes à toutes les classes du semestre, alors que le critère de sortie du chantier parle de « créer une semaine dans une classe de test » et que `teaching_patterns` définit déjà des jours de cours **par classe**. Deux classes qui ne se voient pas les mêmes jours partagent donc la même date limite du dimanche. C'est cohérent avec le recâblage Fragments par classe déjà différé (D12) — la note est ici pour que les deux se rejoignent. *(constaté pendant C8·L1)*
- **La date limite d'une semaine ne s'édite nulle part.** `date_limite` n'est écrite que par la génération (dimanche, fin de journée). Aucun écran ne permet de la déplacer — décaler l'échéance d'une seule semaine (jour férié, sortie scolaire) est aujourd'hui impossible sans SQL. Corollaire assumé du correctif C8·L1 : la génération **réécrit** `date_limite`, donc une valeur posée à la main serait de toute façon écrasée au prochain « Régénérer ». Piste : un champ « repousser l'échéance » sur la vue Semaine, avec un marqueur qui protège la valeur de la régénération. *(arbitrage assumé pendant C8·L1)*
- **Le taux de dépôt de la synthèse de semestre compte les semaines de vacances.** `utils/synthese-semestre.ts` (l. 117-122) prend TOUTES les semaines du semestre (`.eq('semestre_id', …)`, sans `.eq('is_vacation', false)`) pour calculer `nbSemainesAttendues`, donc le dénominateur du taux de dépôt et de `tauxDepot`. Or une semaine passée en vacances **reste stockée** (on ne la supprime jamais, des dépôts peuvent y être rattachés) : elle gonfle le dénominateur et fait baisser le taux de tous les élèves. Bug préexistant, mais **plus probable depuis C8·L1** : la synchronisation automatique sur ajout de vacances crée désormais ces lignes `is_vacation = true` dès qu'une période est saisie APRÈS la génération (constaté en sandbox le 13/08 : semaine du 02/11 passée en vacances). Correctif : ajouter le filtre, comme le font déjà `vue-ensemble`, `panoptique-serveur` et l'écran prof. *(constaté pendant C8·L1, hors périmètre réparation)*
- **Une semaine passée en vacances garde son ancien `numero` → doublon dans la table.** La branche « vacances » de `synchroniserSemaines()` ne remet que `is_vacation = true` et `pedagogical_number = null` ; `numero` reste à sa valeur d'avant. Résultat en base : deux lignes du même semestre peuvent porter `numero = 11` (celle en vacances, figée, et la vraie semaine 11 renumérotée). Invisible dans l'app — tous les écrans filtrent `is_vacation = false` — mais c'est un piège pour toute requête SQL ou tout futur écran qui joindrait sur le numéro. Piste : passer `numero` à `null` aussi, ou le laisser mais documenter que seul `pedagogical_number` fait foi. *(constaté pendant C8·L1)*
- **Fragments n'alimente PAS `api_couts` — la tuile « Coût API » ne le verra jamais.** Constaté en jouant enfin le test C11a-8 le 13/08 (il était bloqué depuis juillet par l'impossibilité de créer des semaines) : un dépôt analysé écrit bien son coût dans **`fragments_analyses.cout_api`** (`utils/analyse.ts:268`, $0,028 mesurés), mais **aucun appel à `enregistrerCoutApi()`** n'existe dans toute la chaîne Fragments — ni `analyse.ts`, ni `analyse-orale.ts`, ni `analyse-essai.ts`, ni `synthese-semestre.ts`, ni `transcription.ts`. Les seuls contributeurs de `api_couts` sont Scriptorium/RAG, Quazian et Aletheia. Le critère « fait » de C11a (« chaque module apparaît dans la tuile ») est donc **hors d'atteinte pour Fragments**, indépendamment de C8. Correctif : un `enregistrerCoutApi('fragments', …)` aux côtés de l'écriture de `cout_api` (attribution élève + classe disponibles sur place), ou faire lire à la tuile les colonnes `cout_api` propres à Fragments. À noter que **Codex est probablement dans le même cas** — à vérifier au même moment. *(constaté pendant C8·L1, périmètre C11)*
- **Deux lectures de `is_active` sont FAIL-OPEN : sans semestre actif, elles dé-scopent au lieu de refuser.** `utils/sante.ts` (« semaines passées ») et `app/eleve/page.tsx` (« semaine ouverte ») font toutes deux `if (semestreCourant) req = req.eq('semestre_id', …)` : quand AUCUNE ligne ne porte le drapeau — état désormais atteignable, l'archivage portant sur l'année entière — le filtre saute et la requête ramène les semaines de TOUS les semestres, archivés compris. Effet : la santé compte les semaines archivées comme dépôts manquants, et le tableau de bord élève affiche la semaine ouverte de `numero` le plus haut tous semestres confondus. Cosmétique (aucune écriture), contrairement au troisième site — la garde du dépôt élève — qui a été passé en fail-closed dans le lot Calendrier · Année parce que lui, il écrivait. Piste : même traitement, refuser plutôt que dé-scoper. *(constaté par la revue adversariale du 20/08, hors périmètre du lot)*\n- **Préparer l'année scolaire suivante pendant l'année en cours.** L'écran Année travaille sur l'année scolaire DU JOUR (`anneeScolaireDe(aujourd'hui)`, frontière du 1er août) : il adopte les semestres vivants de cette année-là, et **refuse** des dates appartenant à une autre année plutôt que de réécrire en silence les bornes de l'année en cours sous les dépôts déjà faits. Conséquence : impossible de saisir 2027-2028 en juin 2027 — il faut attendre le 1er août. Piste : un sélecteur d'année sur l'écran (l'action `enregistrerAnnee` prendrait l'AY cible en argument au lieu de la déduire du jour), et une règle claire pour « deux années vivantes » dans le calcul du semestre actif. *(hors périmètre décidé du lot Calendrier · Année, 20/08)*
- **Une année enregistrée ne peut plus être supprimée, seulement archivée.** `supprimerAnnee` garde les vérifications de rattachement de l'ancien `supprimerSemestre` (refus si `fragments_semaines`, `fragments_themes`, `fragments_syntheses`, `fragments_essais_epreuves`, `quazian_quizzes` ou `quazian_semester` pointent le semestre) — or l'enregistrement d'une année **génère aussitôt ses semaines**. En pratique, le bouton « Supprimer » refusera donc toujours après le premier enregistrement, et « Archiver » est la seule sortie. Ce n'est pas un bug (rien ne doit partir en CASCADE sous un dépôt d'élève), mais le geste est offert alors qu'il n'aboutira jamais. Piste : proposer « supprimer l'année ET ses semaines vierges » quand aucun dépôt n'y est rattaché, ou n'afficher « Supprimer » que dans ce cas. *(constaté pendant le lot Calendrier · Année, 20/08)*
- **Le semestre actif se matérialise à un rendu de retard le jour de la bascule.** `materialiserSemestreActif()` est appelée depuis les deux layouts, qui se rendent EN PARALLÈLE des pages : le jour où le S1 passe la main au S2, la toute première navigation peut encore lire l'ancien drapeau, la suivante est juste. Sans conséquence à l'usage (la règle 2 rend le prochain semestre actif des semaines à l'avance), mais c'est la seule fenêtre où `is_active` ment. Piste, le jour où ça compte : matérialiser dans le `proxy.ts` (middleware) plutôt que dans les layouts, ou faire lire aux écrans la fonction pure `semestreActifAttendu` plutôt que la colonne. *(constaté pendant le lot Calendrier · Année, 20/08)*
- **`titre` de semaine : colonne morte.** `fragments_semaines.titre` est lue et affichée par quatre écrans (« Semaine 3 — *titre* ») mais **aucun code ne l'écrit** depuis le retrait de la création manuelle au cutover C1b/C2 : elle est `null` partout en base. Soit on rouvre un champ de saisie (utile : « Semaine de la rentrée », « Semaine d'examens »), soit on retire l'affichage. *(constaté pendant C8·L1)*

- **`RUBRIQUE_DEFAUT` et `BAREME_DEFAUT` sont le même texte, à l'étiquette près.** `utils/rubrique.ts` porte les deux : l'échelle E→A et le barème 0-4 alignent les **mêmes cinq prédicats, mot pour mot** (« richesse, précision, initiative personnelle ; rare » / « effort visible, contenu substantiel, soin réel » / « le contrat est rempli honnêtement, sans plus » / « la section existe mais reste superficielle, expédiée, ou hors sujet » / « section absente ou vide de contenu réel ») ; seule change l'étiquette (A-E vs 0-4). Vérifié aussi en base (`rubrique` 891 o, `bareme` 567 o). La « rubrique partagée » du Lot 5 Phase 2 n'apporte donc **aucune information** par-dessus le barème legacy : c'est le barème relettré. Corollaire : un prompt qui porte les deux jetons reçoit deux fois la même échelle dans un seul appel. Piste : soit la rubrique gagne ce qu'elle devait porter (les **axes** et leurs descripteurs par mode, cf. `SPEC_Lot5_Fragments.md` note finale), soit le barème disparaît. *(constaté pendant C8·L2)*
- **La même consigne d'exigence est injectée deux fois dans un même appel hebdomadaire.** L'échelle injectée se termine par « Évalue avec exigence mais sans sévérité gratuite (C = le contrat est rempli ; B = un vrai travail ; A = exceptionnel, rare) », et le prompt répète la même phrase en chiffres douze lignes plus bas (« 2 = le contrat est rempli ; 3 = il y a un vrai travail ; 4 = exceptionnel, rare »). Vrai du prompt réellement en base comme du défaut versionné. Deux notations concurrentes de la même règle dans un seul prompt. Piste : la phrase ne vit qu'à un endroit — dans l'échelle. *(constaté pendant C8·L2)*
- **`{{echelle_lettres}}` est du code mort — le champ prof « Échelle de lettres » n'atteint aucun prompt.** `utils/analyse-essai.ts` fait bien `.replace('{{echelle_lettres}}', echelle)`, mais le jeton est **absent** de `PROMPT_ESSAI_DEFAUT` et `prompt_evaluation_essai` est `NULL` en base : ni `ECHELLE_LETTRES_DEFAUT` ni la valeur éditée par le prof n'arrivent jamais au modèle. C'est de surcroît une **seconde** échelle A-E, aux descripteurs différents de `RUBRIQUE_DEFAUT`, éditable dans l'écran Paramètres sans le moindre effet. Déjà relevé par l'audit du 02/07 (§ ligne 72), toujours ouvert. Piste : retirer le champ, ou poser le jeton dans le prompt par défaut — mais pas les deux échelles à la fois (cf. entrée précédente). *(reconfirmé pendant C8·L2)*
- **`{{rubrique}}` n'atteint pas le prompt hebdo en production.** Le prompt personnalisé en base (10 064 signes) porte `{{bareme}}` et **pas** `{{rubrique}}` : pour l'écrit, la rubrique partagée est sans effet aujourd'hui. Depuis C8·L2, le **défaut versionné** l'utilise bien — donc un prof qui presse « Restaurer la version par défaut » bascule l'écrit sur la rubrique. À trancher : aligner le prompt de production, ou laisser l'écrit sur le barème 0-4. *(constaté pendant C8·L2)*
- **Le prompt hebdo en base ne réclame pas le signal d'intégrité.** `lancerAnalyse` lit `parsed.signal_integrite` et alimente l'alerte prof (passe 2 de T3), mais le prompt personnalisé actuellement en base ne demande **pas** ce champ — la détection anti-triche par l'IA est donc muette en production, sans que rien ne le signale. Le défaut versionné dans le code, lui, la réclame (section 6). Se répare d'un « Restaurer la version par défaut » dans Paramètres, ce qui perdrait la personnalisation du prof. Piste : reporter la section 6 dans le prompt de production. *(constaté pendant C8·L2)*
- **La moyenne de classe de la vue d'ensemble est poolée, pas moyennée par section.** `app/prof/fragments-erudition/vue-ensemble/page.tsx` calcule la moyenne hebdomadaire par `moyenne([...e.d, ...e.s, ...e.r])` : quand une section a moins de valeurs non-nulles que les autres, elle pèse moins dans la moyenne affichée. Aucune dimension n'est comptée deux fois — les poids sont seulement inégaux. Choix de mesure à assumer ou à corriger en moyenne des trois moyennes. *(constaté pendant C8·L2)*
- **`modifie_par_prof` est une colonne écrite et jamais lue.** Sept sites l'écrivent à `true` (dont la publication d'un retour, qui ne modifie pourtant rien), deux à `false` ; **aucun code ne la lit**, ni prof ni élève. La validation par lot introduite en C8·L2 ne l'écrit délibérément pas — une publication en lot est précisément une publication sans retouche, ce qui redonnerait un sens au drapeau si on décidait de s'en servir. Piste : soit l'afficher (« retour retouché par le professeur »), soit la retirer. *(constaté pendant C8·L2)*
- **Le calendrier prof n'affiche pas l'échéance hebdomadaire de Fragments.** `utils/calendrier-evenements.ts` (`assemblerEvenements`) ne lit jamais `fragments_semaines`, alors que le calendrier **élève** l'ajoute à part (`app/eleve/calendrier/page.tsx`). Asymétrie à confirmer ou à combler. *(constaté pendant C8·L2)*
- **Changer le fuseau déplace l'affichage des échéances, pas les instants stockés.** `definirFuseau` (`app/prof/calendrier/config/actions.ts`) ne resynchronise rien : après une bascule vers `Europe/Paris`, l'échéance du dimanche s'afficherait un lundi pendant que la coupure `depose`/`en_retard` resterait à l'ancienne heure. Sans conséquence tant que le fuseau ne bouge pas. Piste : resynchroniser les semestres non archivés à la bascule, ou avertir le prof. Rouvre la Q2 de C8·L1 (fuseau réglable vs Toronto en dur) sous un angle neuf. *(constaté pendant C8·L2)*

- **Le graphique « Ton parcours » de l'élève n'est pas scopé au semestre.** `app/eleve/modules/fragments-erudition/page.tsx` charge `toutesLessemaines` par `admin.from('fragments_semaines').select('id, numero').order('numero')` — **sans filtre de semestre ni de vacances**. En sandbox, où deux semestres coexistent, l'axe affiche « S1 S1 S2 S2 S3 S3 S4 S4 S5 S5 S6 S7… » : les semaines des deux semestres se superposent, et le « taux de dépôt » du bloc de stats prend le même dénominateur (20 semaines au lieu de 5 → 5 % au lieu de 20 % pour un dépôt). Antérieur à C8·L3 ; ce sera visible en vrai dès le deuxième semestre de l'année. Piste : filtrer sur le semestre actif et `is_vacation = false`, comme le font déjà la vue prof et la synthèse. *(constaté pendant C8·L3, sur la face élève)*
- **Page élève de Fragments : deux requêtes mortes à chaque chargement.** `pistesEnAttente` (pistes proposées / partiellement suivies) et `mesPresen` (présentations « presente ») sont interrogées puis **jamais lues** dans `app/eleve/modules/fragments-erudition/page.tsx` — deux allers-retours base par affichage, pour rien. Antérieur à C8·L3 (les deux avertissements eslint existent tels quels sur `main`), simplement rendu visible en passant. Piste : les retirer, ou rebrancher les pistes en attente qui avaient sans doute un usage prévu. *(constaté pendant C8·L3)*

- **Codex prof est cassé exactement comme Quazian l'était : il demande des unités qui n'existent plus.** `app/prof/codex/actions.ts:20-28` (`lireUnitesScriptorium`) filtre `scriptorium_unites` sur `type='unite'` → zéro ligne depuis la réorganisation du Scriptorium, donc **la création d'une synthèse depuis l'écran Codex ne peut plus aboutir** (le formulaire n'a rien à proposer, et `creerSynthese` refuse sur « Choisis une unité »). Seul survit le bras `contenu_id`, auto-créé par le plan d'évaluation quand le gate est ON — c'est-à-dire un chemin gaté, pas le chemin nominal. Le schéma est pourtant déjà prêt (arc bi-source `codex_sessions_source_chk`, joué par `plan_evaluation_phase_a.sql`) : il ne manque que le recâblage de l'écran, exactement ce que C7·L1 vient de faire pour Quazian — `utils/quazian-cibles.ts` est réutilisable tel quel. Corollaire déjà documenté dans le code : `app/prof/codex/validation/actions.ts:135-140` (« garde D13 ») refuse de créer une carte FSRS pour une session ancrée `contenu_id` ; ce refus tombera quand Codex saura ancrer ses sessions sur un contenu, la FK côté cartes existant désormais. *(constaté pendant C7·L1, hors périmètre du lot)* ➜ ✅ **FAIT le 14/08**, hors périmètre de C7·L2 et sur demande explicite : le bandeau « Aucune unité » bloquait la recette Codex du lot. `lireUnitesScriptorium` devient `lireCiblesCodex` (sur `chargerCiblesQuazian`, réutilisé tel quel comme prévu), `creerSynthese` écrit le bras résolu par `refCible`, le formulaire liste les contenus avec leur genre. **La garde D13 est levée** au passage — sans quoi le recâblage aurait eu un coût caché : toute synthèse neuve étant ancrée contenu, plus aucune erreur validée ne serait devenue une carte FSRS. **Et `titresCoursParSession` est DÉGATÉE** (`utils/codex-titre.ts`) : elle sautait sur `lireGatePlanActif` au motif que « gate OFF ⇒ aucune session ancrée contenu n'existe », prémisse devenue fausse dès que l'écran en crée nominalement — gate OFF, toute synthèse neuve se serait affichée **sans titre** partout (liste prof, écran élève, calendrier). Aucune migration : l'arc était déjà en base.
- ~~**Le diagnostic Quazian (écran « fragilités ») est doublement muet — à reprendre en C6.**~~ ➜ ✅ **FAIT PAR C6-L1 LE 28/08 — les DEUX fils réparés dans le même geste.** *(a)* la lecture ne demande plus `type='unite'` : elle appelle **`chargerCiblesQuazian`, réutilisée telle quelle** — exactement le geste que Codex a reçu le 14/08 — et rend l'**arc bi-source** ; *(b)* elle agrège sur l'**UNION de `scope_contenus` et `scope_unites`**. ⭐ **Éprouvé par exécution** (`scripts/recette/couture-c6l1.mjs` §D) : **8 cibles** là où il en rendait **0**, et **1 cible couverte, 5 concepts — par `scope_contenus`**, le bras qu'il ignorait. ⭐ **Et l'écran a enfin une porte** : depuis l'onglet Compétences du profil de classe, qui porte aussi un résumé des fragilités de la classe. ⛔ **Il ne produit aucune lettre** — Quazian n'écrit pas dans le profil. ⚠️ **Ce qui reste** : la base ne porte encore **aucune fragilité réelle** (5 réponses, 5 concepts distincts, une question chacun → `insuffisant`) — case `C6L1-C` du `SUIVI_tests_manuels.md`.
- **Intégrité — un prof ne peut PAS bloquer un élève qui n'a jamais été signalé.** « Bloquer l'élève » n'existe qu'à l'intérieur de `PanneauPreuve` (`components/integrite/PanneauPreuve.tsx:265`), c'est-à-dire dans le panneau d'UN signalement, et la vue « atelier » de `/prof/integrite` ne charge que les signalements **non acquittés** (`page.tsx:76`). Aucun signalement en attente → aucun panneau → aucun bouton, pour aucun élève. L'asymétrie est nette : « Débloquer » est offert à **trois** endroits (`GestionIntegrite`, `DossierIntegriteEleve`, `PanneauPreuve`), « Bloquer » à un seul, et seulement en s'accrochant à un signal de l'IA. Or `utils/integrite.ts` décrit `bloquerEleve` comme « **action explicite** depuis la page Intégrité » et prend soin de ne PAS incrémenter les strikes — la fonction a été écrite pour un geste souverain du prof, mais l'écran ne le lui donne jamais. Cas réel manquant : le prof qui constate une triche en classe, sans que rien n'ait été signalé algorithmiquement. Piste : le bouton « Mettre en pause » sur la fiche élève (`DossierIntegriteEleve`, qui importe déjà `actionDebloquerEleve` — la symétrie coûte quelques lignes), ou dans la liste des élèves. **Constaté en butant dessus pendant la recette C7·L1** (C7L1-7 : impossible de bloquer l'élève de test pour vérifier le gel des flashcards ; contourné par SQL). *(constaté pendant C7·L1, périmètre Intégrité)*
- **🔴 Les modules donnés à une classe ne donnent ni ne retirent réellement l'accès — séance dédiée décidée le 14/08.** Constat en clair : **T5 n'a pas le module Codex, et pourtant on a pu y créer ET y lancer une synthèse Codex**, que l'élève voit. Le trou a deux moitiés, et la seconde est un choix ancien qu'il faudra rouvrir explicitement.
  - **Côté prof — les sélecteurs de classe ne filtrent pas.** Le helper existe pourtant et fait exactement ça : `classesAvecModule(admin, moduleId)` (`utils/acces.ts:79`). **Fragments est le seul module qui s'en sert** — quatre écrans : `semaine/[id]`, `evaluations`, `suivi`, `eleve/[eleveId]`. Les autres listent toutes les classes sans condition : **Codex** `app/prof/codex/page.tsx:38`, **Quazian** `app/prof/quazian/quizz/page.tsx:45` (le formulaire de création de quizz) et `app/prof/quazian/page.tsx:55`. Le correctif est donc mécanique et déjà éprouvé — remplacer la requête par le helper — mais il faut décider ce qu'on fait des lignes DÉJÀ créées pour une classe sans le module (la synthèse Cognitif × T5 du 14/08 en est une).
  - **Côté élève — l'accès est l'UNION des classes, par conception.** `aAccesModule` / `moduleIdsAccessibles` (`utils/acces.ts`) répondent « oui » dès qu'UNE classe de l'élève a le module, et le commentaire en tête l'assume : « Un élève en deux classes voit l'UNION des accès des deux » (Lot 1). Conséquence : un bi-classe atteint un module même dans le contexte d'une classe qui ne l'a pas. **C'est ce qui rend le trou visible plutôt que théorique**, et c'est la vraie question de la séance : le module appartient-il à la CLASSE (auquel cas l'union est un bug) ou à l'ÉLÈVE (auquel cas ce sont les écrans prof qui mentent) ?
  - **Le retrait n'est pas traité non plus.** Rien aujourd'hui ne dit ce que deviennent les contenus, séances et cartes d'une classe à qui l'on RETIRE un module : ils restent en base et restent atteignables. À trancher dans la même séance.
  - Corollaire déjà consigné dans la recette C7·L2 : l'écran « Quelle classe ? » de Codex n'offre que Test, parce qu'il se fie à `classe_modules` — il est le seul endroit qui applique la règle, et il paraît donc en tort alors qu'il est le seul à avoir raison. *(constaté le 14/08 en closant la recette C7·L2 ; Louis : « si T5 n'a pas Codex, je n'aurais même pas dû pouvoir lui créer une synthèse »)*
  - ➜ **Reconfirmé le 14/08 sur QUAZIAN, pendant la recette C7·L3** (test C7L3-6) : T5 n'a pas le module Quazian, et Sacha atteint pourtant l'écran Quazian en contexte T5 — il y trouve un écran vide et honnête (« Elles apparaîtront au fil des cours vus en classe ») là où il aurait dû rester bloqué au choix de classe. Le symptôme n'est donc **pas propre à Codex** : c'est bien `aAccesModule` qui décide, et il décide en union. Le prompt de C7·L3 rangeait explicitement ce point hors périmètre (« ne pas l'entamer ici, même si les deux se frôlent sur l'écran élève Quazian ») — **rien n'a été touché**, la séance dédiée reste à faire. *(constaté par Louis pendant C7·L3)*

- **Une carte ajoutée À LA MAIN sur un cours découpé reste au grain « cours entier ».** Depuis C7·L3, la génération IA ancre chaque carte sur sa sous-section (`quazian_flashcards.section_id`), mais `ajouterCarteManuellement` (`app/prof/quazian/actions.ts`) n'offre pas de choisir laquelle : sa carte est donc visible dès que le cours est *entamé*, pas au « vu » d'une sous-section précise. Cohérent avec la règle (le grain contenu est le défaut assumé), mais un prof qui ajoute une carte « pour la partie II » sera surpris de la voir arriver avec la partie I. Piste : un simple `<select>` des sous-sections dans le formulaire d'ajout. *(constaté pendant C7·L3, hors périmètre du lot)*
- **Re-découper un cours DÉ-GRANULE ses cartes, et rien ne le dit au prof.** `remplacerDecoupe` supprime et recrée les sections avec des uuid neufs ; la FK `on delete set null` fait alors retomber toutes les cartes au grain « cours entier » (choix délibéré de C7·L3 : ni `restrict`, qui bloquerait la re-découpe, ni `cascade`, qui détruirait l'historique FSRS des élèves). Aucune carte n'est perdue, mais la précision l'est — et la confirmation de « re-découpe consciente » parle des instances de parcours, pas des cartes. ⚠️ Et « régénérer » ne rend pas la précision : `genererCartes` INSÈRE sans rien remplacer — on obtiendrait les anciennes cartes au grain contenu PLUS un jeu neuf ancré aux sous-sections, soit des doublons (constaté à la recette du 14/08 ; le bouton dit « ✦ Régénérer », ce qui laisse croire l'inverse). Piste : compter les cartes concernées dans la confirmation de re-découpe, et faire de « Régénérer » un vrai remplacement (archiver les anciennes du même ancrage) plutôt qu'un ajout. *(constaté pendant C7·L3)*
- **La consultation « toutes mes cartes » (pot commun) a disparu côté élève.** C7·L3 remplace le bouton unique par des **tuiles par cours** — c'est l'objet du lot — mais l'élève n'a plus de vue transverse de ses cartes, alors qu'il l'avait. Piste, si le manque se fait sentir en usage : une tuile « Toutes » en tête de la grille, qui rouvre le pot d'avant. *(scope-out assumé pendant C7·L3)*
- **`quazian_flashcards.section_id` ne garantit pas structurellement que la section appartient AU contenu de la carte.** Le CHECK posé dit « section ⇒ contenu », pas « cette section-là est dans ce contenu-là ». La garantie est applicative : `genererCartes` écrit toujours les deux depuis la même cible, et c'est le seul écrivain. Le repo a pourtant le patron structurel sous la main (FK composite, cf. `pcc_livre_type_fk` sur `scriptorium_unites(id, type)`) : un index unique sur `scriptorium_contenu_sections(id, contenu_id)` + `foreign key (section_id, contenu_id) … on delete set null (section_id)` (PG 15+, la sandbox est en 17.6) fermerait la porte pour de bon. À rouvrir le jour où un second écrivain apparaît — un import, une reprise de données, un second écran. *(non tranché pendant C7·L3, R7)*

- **Une synthèse Codex LANCÉE ne peut jamais être retirée, même vide.** Le bouton « Supprimer ce brouillon » n'existe que pour `statut = 'brouillon'` (`app/prof/codex/synthese/[sessionId]/page.tsx:95`), et `supprimerSynthese` est doublement verrouillée dessus (`.eq('statut','brouillon')`, `app/prof/codex/actions.ts:77`). Une fois lancée, une synthèse se ferme mais ne se retire plus — protection du travail élève, juste dans le cas général, **mais elle mord aussi quand il n'y a AUCUN travail à protéger**. Constaté en voulant effacer la synthèse « Cognitif » × T5 : 0 travail, 0 erreur, aucun lien au plan, et pourtant impossible depuis l'écran — retirée en base. Piste : offrir la suppression d'une synthèse `fermee` **dont aucun élève n'a rendu quoi que ce soit** (le compte est déjà calculé par l'écran), au patron `BoutonSupprimerUnite`. ⚠️ Deux pièges à traiter si on le fait : une séance **en direct** (`phase_1`/`phase_2`) ne doit pas pouvoir disparaître sous les élèves qui la voient au tableau de bord ; et une séance **liée à un exercice du plan** laisserait, en partant, un exercice « conçu » avec plus rien derrière (`codex_session_id` en `on delete set null`) qui ne pourrait plus être re-préparé, `preparerSynthese` exigeant `statut = 'a_concevoir'` — il faudrait rendre l'exercice à « à concevoir » dans le même geste. *(constaté le 14/08 en closant Accès & classes · L1 ; noté sur demande de Louis, R7)*

## Bugs cosmétiques 🚩 acceptés pendant la passe UI (C10)

- **Le résumé d'une tuile sélectionnée devient illisible.** `components/Tuile.tsx` peint la carte active en aplat de pigment (`plein`) et éclaircit le titre et le sous-titre — mais le `resume`, fourni par l'appelant, garde ses classes de fond clair (`text-muet`, badges `COULEUR_LETTRE`) : sur l'aplat sombre, la ligne devient un texte sombre sur fond sombre. Visible sur **Suivi** et sur **Évaluations · Synthèse** (C8·L3), déjà vrai avant le lot sur « Vue d'ensemble » et « Thèmes ». Piste : que `Tuile` impose une variante claire à son `resume` quand `selectionnee`, plutôt que de laisser chaque appelant deviner. *(constaté pendant C8·L3)*

## C4-L8 — deux points hors périmètre, relevés le 20/08/2026

- **`generateur/verifie-import.py` : le blocage n° 2 n'appelle pas le n° 1.**
  Une décomposition bloquée force `validee` à `false` « quoi que le fichier
  déclare », mais le blocage n° 1 lit le `validee` DU FICHIER : une instance
  bâtie sur ce texte-là passe sans blocage au contrôle hors ligne. La plateforme
  referme la porte à l'écriture (`utils/fabrique/import-ecriture.ts`) ; le
  contrôle hors ligne, lui, garde l'écart. À recaler un jour, pour que les deux
  verdicts se ressemblent. *(Détail au `RELEVE_C4_L8_2026-08-20.md` §4.)*

- **`c4_l1_schema.sql` — le commentaire de `exercices_references.empreinte`
  disait « du texte source NORMALISÉ ».** Rectifié par `c4_l8_fabrique.sql` :
  l'empreinte est celle du contenu exact, octet pour octet. Le fichier de C4-L1
  garde son ancienne rédaction ; un dépôt neuf la rejouerait, et le correctif de
  C4-L8 la rattraperait aussitôt après. À corriger à la source si C4-L1 est
  réécrit.

## C4-L8 — ce que la revue adversariale a renvoyé au générateur (21/08/2026)

- **`generateur/verifie-import.py` : `"cran": 4.0` est refusé, et il ne devrait
  pas l'être.** Le `08-` §5 dit « un entier de 1 à 9 », et `4.0` *est* l'entier 4 ;
  le refus vient du typage de Python (`isinstance(4.0, int)` est faux), pas de la
  règle. La plateforme l'accepte, et c'est elle qui a raison — un JSON ne
  distingue pas les deux après lecture. À assouplir côté script :
  `isinstance(x, (int, float)) and float(x).is_integer()`. Idem pour la semaine
  du plan de lecture et les bornes d'intervalle. *(Arbitré par Louis le 21/08 :
  aligner dans le sens du port.)*

- **`generateur/verifie-import.py` : `"cran": true` passe.** Le miroir du
  précédent — en Python `bool` est un `int`, et `True == 1` : l'exercice est jugé
  au cran 1 et passe sans un refus. La plateforme le refuse. Même correctif.

- **Les deux scripts s'ARRÊTENT sur une entrée mal formée** (`AttributeError`,
  `TypeError`) là où le format demande un refus : un `materiau_cible` écrit en
  chaîne, un `null` glissé dans `moments[]`, un cas qui n'est pas un objet. Le
  port les REFUSE proprement. À reprendre côté script, pour que l'outil hors
  ligne ne tombe pas sur un fichier qu'un professeur pourrait déposer.

## C4-L8-bis — une découverte hors périmètre (21/08/2026) — ✅ REFERMÉE le jour même

- ~~**Les dérivés de la chaîne (`utils/chaine/derive/`) portent `07-` 2.20 quand la
  source est à 2.21.**~~ `derive-instruments.py --verifie` disait **DIVERGE** sur
  `MANIFESTE.ts` et `calame-retour.ts` — seul rouge de `npm test` (427/428).
  ⭐ **TRANCHÉ par Louis le 21/08 : rejouer `--ecris`**, malgré le piège 4 du prompt
  (« ne touche pas la chaîne »). Fait. `--verifie` dit **IDENTIQUE**, `npm test`
  passe à **428/428**. ⚠️ **Ce qui a changé est de la métadonnée seule** —
  `empreinte_source`, `statut_source`, `version_source` (`2.20` / « VALIDÉ ET GELÉ »
  → `2.23` / « RELU ET VALIDÉ ») ; `monitoring.ts` inchangé, et **le texte du gabarit
  Calame est identique octet pour octet**. Aucun comportement n'a bougé.
  *(La dette de la racine absolue dans la fixture, elle, reste ouverte.)*

- ⭐ **Suite du même : `utils/chaine/instruments.test.ts` garde une SYNCHRONISATION,
  pas un invariant.** Il compare des dérivés à une source **vivante** : le `07-` a
  bougé **deux fois pendant la seule séance C4-L8-bis** (2.21 → 2.22 → 2.23), et
  `--ecris` a dû être rejoué deux fois pour ramener `npm test` au vert. **Tant que
  le `07-` est en cours d'écriture, tout lot Code héritera de ce rouge sans l'avoir
  causé.** À noter : en deux versions, **le texte du gabarit Calame n'a pas bougé
  d'un octet** — seule l'empreinte du fichier entier change. Pistes, non tranchées :
  comparer l'empreinte du **gabarit** plutôt que celle du fichier, ou sortir ce
  contrôle de `npm test`.

## C4-L8-bis — `composer` sur un `texte_auteur` n'a aucune porte (21/08/2026)

*Trouvé en répondant à une question de Louis sur `introduction` × `explication_texte_tc`.
**Non tranché, et volontairement pas marqué `[faux]`** : au moins quatre issues
sont possibles et ce sont des décisions de doctrine, pas d'implémentation.*

- ⭐ **La règle 4 garde `composer` ouvert pour l'Expression et la Connaissance quand
  un `texte_auteur` est en source — et aucun écran ne permet de concevoir cet
  exercice.** Le `02-` §2.3.3 règle 4 écrit : *« Il le reste pour l'Expression et la
  Connaissance — ces deux-là seraient sinon **immesurables** dès qu'un texte
  d'auteur est présent. »* Or le `02-` §6 B.2 ferme `texte_auteur` dans **Codex** en
  invoquant la règle 4 *« qui le rend incompatible avec `composer` pour
  l'Argumentation, la Structure et le Questionnement »* — **la justification laisse
  dehors les deux compétences que la règle 4 protège**. Et **Aletheia** ne sert que
  les modes réceptifs. Résultat : `composer` + `texte_auteur` n'a **aucune porte**,
  ce qui produit exactement l'« immesurable » que la règle 4 voulait éviter.

- ⛔ **Conséquence totale sur `introduction` × `explication_texte_tc` : l'instance est
  IMPORTABLE et INCONCEVABLE en ligne.** `explication_texte_tc` **exige** un
  `texte_auteur` en `materiau_source` (`02-` §1.3) ; `introduction` est **le seul
  objet terminal sans aucun mode réceptif** (`exercices_types_modes_source` :
  `composer` seul ; 132 routes, toutes en `composer`) — donc Aletheia ne la liste
  pas, et Codex n'ouvre pas `texte_auteur`. **Vérifié le 21/08** : la garde serveur
  l'accepte (`empechementsDeConception` → liste vide sur `composer` +
  `texte_auteur`), le contrôle d'import l'accepte (**0 refus** sur l'entrée), et le
  `04-` §14.2 lui **écrit même un guide de cran 6** — *« situer le texte · la thèse
  qu'il défend · l'annonce des mouvements »*. Seul l'écran manque.
  ⚠️ `conclusion` et `partie` s'en tirent **par la bande seulement** : elles
  déclarent des modes réceptifs, donc Aletheia les liste — mais ce qu'on y conçoit
  est **un autre exercice** (« dis ce que la conclusion du texte dit »). **La version
  `composer` — écrire l'introduction d'une explication — n'est concevable pour aucun
  des trois.**

- **Les issues possibles, à trancher par Louis** : ouvrir `texte_auteur` dans Codex
  pour l'Expression et la Connaissance · donner des modes réceptifs à
  `introduction` · retirer `explication_texte_tc` de ses genres · ou **assumer** que
  ces instances passent uniquement par l'import. *Ce n'est pas un défaut de
  C4-L8-bis : la pagination n'y change rien, et `introduction` offre bien sa banque
  (22 consignes au cran 3, porte Codex).*

---

## C4-L4 · La passation en classe — trouvée le 22/08, hors périmètre

- **La transcription surestime l'Expression, et on a maintenant de quoi le MESURER.**
  Le `07-` §6 déclare le biais comme *connu et assumé* — « un modèle de vision
  tranche les graphies ambiguës vers la forme correcte », « et davantage chez les
  élèves faibles » —, mais il n'existait aucun chiffre. **La colonne
  `transcription_v1_doutes`, posée par C4-L4, en fabrique un sans rien coûter de
  plus** : chaque endroit où **les deux passes ont divergé** est un endroit où la
  graphie était ambiguë, et où l'une des deux lectures a tranché. Sur la copie
  réelle du test de charge, **13 puis 23 endroits** sur une seule page.
  *L'idée : à la première passation réelle, croiser le nombre de désaccords par
  copie avec la lettre d'Expression obtenue. Si le biais est bien orienté, les
  copies les plus faibles porteront le plus de désaccords — et l'écart entre la
  passe retenue et l'autre en donnerait l'ordre de grandeur.* **Ce n'est pas une
  parade, c'est un instrument de mesure du décalage** que l'arbitrage du §6 assume
  aujourd'hui à l'aveugle. ⚠️ **Hors périmètre de C4-L4**, qui n'a pas à ouvrir un
  chantier de validité ; et hors périmètre de C4-L5, qui ne voit pas les passes.


---

## C4-L9 · « Examen sur le livre » et « Bac Blanc » sont des ancres par la lettre (22/08/2026)

**Le constat, trouvé en écrivant l'entrée C4-L9 au `07-Implementation.md` §2.** Une ancre est
*« une mesure dont le `lieu` vaut `classe` **et** la `forme` vaut `sommatif` »* (`01-routeur.md`
§10), et la `forme` se lit à la ligne du plan d'évaluation — où `evaluatif` **est** le `sommatif`
du `07-` §1.2. Or la typologie verrouillée de `scriptorium_exercices_planifies` admet **quatre
autres couples `classe` × `evaluatif`** que les deux examens diagnostiques :

- `quiz` × quazian ;
- `examen_livre` × aletheia — « Examen sur le livre » ;
- `fragment` × fragments — *réservé, 0 ligne en v1* ;
- `essai` × fragments — *réservé, 0 ligne en v1*.

Plus **`bac_blanc`**, qui vit dans les libellés de l'écran du plan
(`app/prof/scriptorium/evaluations/GrillePlan.tsx`) et dans le type de `utils/plan-cadence.ts`.

**Par la lettre de la définition, ce sont des ancres. En fait, aucun n'en produit** : aucun ne
fabrique **une copie que la chaîne de mesure lit**. Le quiz est de la rétention Quazian ; l'examen
sur le livre et le bac blanc n'ont **aucun type derrière eux dans `exercices_types`**, donc aucune
instance, donc aucun squelette et aucune mesure.

**C4-L9 est donc borné aux deux types qui produisent une copie**, et la source ne dit rien de
ces quatre-là — un document de référence ne porte pas la trace de ce qu'on a écarté.

**Ce qu'il faudrait avant d'en faire des ancres réelles** — c'est un chantier, pas un branchement :

1. **dire ce que chacun mesure**, compétence par compétence et mode par mode, comme le `01-` §10 le
   fait déjà pour l'essai et l'explication de texte ;
2. leur donner **un type dans `exercices_types`** avec ses `genres_admis` — un bac blanc porte un
   genre terminal entier, exactement comme un examen diagnostique ;
3. décider si le **quiz** entre : il ne produit pas de prose, et toute la chaîne de mesure lit de la
   prose.

⚠️ **Le risque si on oublie ce constat** : quelqu'un lira la définition du §10, verra que
`examen_livre` est `classe` × `evaluatif`, et en conclura que **la descente des lettres et le
plafond d'inflation** devraient s'y appliquer. **Ils ne le peuvent pas** — il n'y a rien à mesurer.

*(constat Mètis en séance de conception, retenu par Louis le 22/08 : « oui, super c'est noté, mets
ça à idées post rentrée ».)*


---

## C4-L3 · Quatre défauts de code TROUVÉS EN PASSANT, hors périmètre du lot (22/08/2026)

*Le déroulé de l'élève les a rencontrés en s'y branchant. Aucun n'appartient à C4-L3, aucun ne l'a
empêché de se construire, et **aucun n'a été « réparé en passant »** — la règle du dépôt est qu'une
découverte hors périmètre se pose ici, pas dans le code d'un autre lot.*

**1. ⚠️ `exercices_cas.distracteurs` porte DEUX FORMES PHYSIQUES INCOMPATIBLES, et la seconde
détruit la première.** L'**import** écrit des objets `{texte, pourquoi_faux}` *(`08-` §5.2 ;
`utils/fabrique/import-ecriture.ts:419`)* ; l'**écran de conception** écrit des **chaînes**
*(`app/prof/conception/actions.ts:61-67`)*. **Tous les lecteurs supposent la seconde** :
`app/prof/conception/[id]/page.tsx:96` mappe par une fonction qui rend `''` sur un objet — l'aperçu
d'une instance **importée** affiche donc **trois boutons radio VIDES** ; et le textarea d'édition
affiche `"\n\n"`, si bien que **sauver l'édition remplace définitivement la banque importée par
trois chaînes vides**. `utils/passation/metacognition.ts:586` sert `"[object Object]"` à l'élève.
⚠️ **Ni la recette ni les tests ne le voient** — les tests d'import rejouent le contrôle, jamais
l'écriture *puis la relecture*. C4-L3 lit les deux formes défensivement
*(`utils/deroule/credence.ts:texteDuCandidat`)*, **mais la destruction à l'édition reste entière**.
*Le geste juste est côté C4-L8 : normaliser à l'écriture, ou lire l'objet partout.*

**2. `regimeV1Vf` (C4-L2, `utils/routeur/escalade.ts`) promeut N'IMPORTE QUEL régime en `plein`.**
Sa docstring dit *« le régime "pas de version finale" **des crans de transformation** »*, **son code
ne le vérifie pas** : appelée avec `par paires`, elle rend `plein`. Une paire de diagnostic
promue perdrait le signal que N2 lit — *« au régime par paires, c'est LA PAIRE que N2 lit »*
*(`01-` §8.4)*. Elle **n'avait aucun appelant** ; C4-L3 est le premier, et **il garde à son site
d'appel** *(`utils/deroule/regime.ts`)* plutôt que de réécrire le lot voisin. *Un test le tient
(`regime.test.ts` : « une PAIRE reste une paire sous escalade »).*

**3. `utils/retours-lus.ts` ignore `exercices_retours`.** Le blocage transverse — *« un retour non
lu bloque tous les rendus »* — ne connaît que **cinq sources** *(Fragments écrit, Fragments essai,
Codex, Aletheia, Quazian)*. Un retour d'exercice non lu **ne bloque donc rien ailleurs**, et la
phrase que l'écran de C4-L4 affiche à l'élève *(« tu dois valider ta lecture pour pouvoir rendre
autre chose »)* est **une promesse que le garde-fou serveur ne tient pas**. C4-L3 *appelle* la garde
— un retour Aletheia non lu bloque bien son déroulé — mais **n'ajoute pas sa propre source** : ce
serait une décision transverse qui touche cinq modules.

**4. `journaliserCollageBloque` ne vérifie pas que le dépôt est à l'élève.** *(C4-L4,
`utils/passation/depots.ts:581`)* — `eleveId` n'y sert **qu'au message d'erreur** ; il ne voyage pas
jusqu'à la RPC. C'est le seul chemin d'écriture élève de C4-L4 sans contrôle de propriété *(comparer
`enregistrerLesPhotos`, `depots.ts:279`)*. La conséquence est mince — on ne peut que **gonfler le
journal de collage d'un autre**, jamais lire ni altérer sa copie —, mais elle est réelle. **L'action
de C4-L3 relit le dépôt par `lireDepotMaison` avant d'appeler**, donc son chemin est fermé ; celui
de C4-L4 reste ouvert.

## C4-L6 · Les onglets de l'écriture — trois renvois de périmètre (22/08/2026)

**Ce lot était une réorganisation de navigation, et rien d'autre.** Les trois points ci-dessous ont
été **vus, nommés, et laissés là** — chacun avec son destinataire.

**1. Le déménagement de `app/prof/conception/` dans l'atelier de son mode.** L'onglet Exercices de
Codex **y renvoie par un lien** ; l'écran n'a pas bougé. *Le motif du déménagement à terme* : **le
`01-routeur.md` §2 veut que l'exercice se conçoive dans l'atelier de son mode** — *« les exercices
formatifs se conçoivent dans l'atelier de leur mode : Codex pour `composer`, Aletheia pour
`restituer`, `expliquer`, `évaluer` et `interroger` »* *(repris au `02-exercices.md` §6 B)*.
⚠️ **Ce qui l'a empêché ici** : l'écran est **partagé entre Codex et Aletheia**, et **C5-L4 n'est
pas joué** — le déplacer avant qu'Aletheia ait ses onglets casserait celui qui n'en a pas.
**Décision de Louis, 22/08** : *« on va simplement y renvoyer pour le moment, mais il faudra à terme
qu'il déménage. »* **Destinataire : C5-L4**, où il est déjà déposé en boîte
*(`PLAN_DE_CHANTIER.md` §5)*.

**2. Aletheia porte exactement les mêmes écrans orphelins que Codex, et C4-L6 les a laissés là
délibérément.** *« Les onglets de la lecture sont C5-L4 »* *(`07-` §2)*, et la symétrie est
tentante — elle est hors périmètre. Les trois routes, vérifiées le 22/08 :
`app/prof/aletheia/passation/[exerciceId]` ne s'atteint que depuis `app/prof/conception/[id]` ·
`app/prof/aletheia/examen-diagnostique/[planifieId]` que par `EncartAConcevoir` ·
`app/eleve/modules/aletheia/passation/[depotId]` que par `SignalDeLancement`. **Aletheia n'a que
deux onglets prof — Classe · Paramètres — et AUCUN côté élève.** *Le critère qui a rangé Codex vaut
ici : « un écran sans porte n'existe pas ».* **Destinataire : C5-L4**, déjà en boîte.

**3. Les deux défauts de la Synthèse ne se corrigent pas ici, et ils sont déjà consignés.** La
mission parle d'une *« revue complète d'une synthèse rendue »* : **ce n'est pas un travail à faire**
— c'est le nom de ce que le professeur fait quand les copies sont rendues, et l'onglet Exercices se
borne à l'héberger. Les deux défauts restent où ils sont, dans ce fichier :
**(a)** *les consignes que le professeur écrit à ses Paramètres ne parviennent jamais à l'élève* —
`codex_params` lue par un client au périmètre de l'élève sur une table prof-only *(entrée « Codex —
consignes prof jamais vues par l'élève »)* ; **(b)** *une synthèse lancée ne se retire plus, même
vide* *(entrée « Une synthèse Codex LANCÉE ne peut jamais être retirée »)*. **Aucun des deux n'a été
touché.**

---

## Trouvé par C4-L11 (23/08), hors périmètre — un composant devenu orphelin

**`components/pilotage/PastilleNiveau.tsx` n'a plus aucun lecteur.** C4-L11 a retiré la grille de
faux niveaux de l'onglet Compétences du profil de classe — cinq colonnes inventées, une pastille
vide par élève, « aucune donnée réelle » —, et ce composant en était le seul usage. Le `grep` est net :
`PastilleNiveau` et son type `NiveauLettre` ne sont plus nommés que dans leur propre fichier.

⛔ **Il n'a PAS été supprimé, et c'est délibéré** : la suppression n'était aucun des douze chantiers
du lot, et « la réussite se mesure en diff minimal ». *Rappel de méthode : ne jamais supprimer sur la
foi d'un outil seul — c'est la leçon du lot « audit du code mort ».*

⚠️ **Et il ne se réutilisera pas tel quel.** Son échelle est **A → D**, quatre lettres ; celle de la
plateforme est **E → A**, cinq (`utils/notation.ts`). Le jour où la grille des niveaux se construira
pour de bon — `competences_niveaux`, derrière `competences_affichage_actif` —, il faudra **choisir**
entre l'aligner sur l'échelle réelle et le remplacer. **Ce n'est pas un correctif : c'est l'écran des
niveaux, qui reste à faire.**

- **Déposer une fiche n'est pas archiver un document : c'est mettre un instrument en production.**
La page Compétences (C4-L8) a l'air d'un classeur — on y dépose un `.md`, il affiche une version et
un statut. Ce n'en est pas un. Le fichier déposé n'est pas rangé : **il est relu à l'exécution, tel
quel, et ce qu'il déclare fait autorité sur la conduite de l'élève.** C'est une pièce vive du moteur,
au même titre que le code — sauf qu'elle s'installe par un bouton, sans revue, sans test, et sans que
rien ne vérifie qu'elle s'accorde avec ce qui mesure vraiment.

**Ce que le dépôt commande DÉJÀ, aujourd'hui, en production :**

  1. **La banque des questions « se juger »** — `competences_correspondance`, remplacée à chaque
     dépôt, lue par `utils/passation/metacognition.ts`, `utils/chaine/contexte.ts`,
     `utils/deroule/vue.ts`, `utils/deroule/rappel.ts` et `utils/chaine/retour.ts`. Ce sont les mots
     que l'élève lit sur lui-même.
  2. **Le statut de recette par défaut** — `lireStatutsRecette()` (`utils/chaine/contexte.ts`) : une
     compétence dont la fiche n'est pas déposée est `differee` et *ne peut pas être autre chose* ;
     déposée, elle naît `mesuree_silencieusement`.
  3. **La version citée** par `exercices_metacognition.questions_version`, et le statut affiché.

⭐ **Et ce qui vient, et qui est le vrai sujet de cette entrée.** `utils/routeur/fiche-observables.ts`
(C4-L2) lit `competences_fiches.contenu` — *le texte déposé par le bouton* — et en parse la
sous-section « ### Les observables pour la télémétrie du routeur » pour produire la liste des
observables **requis**, celle qu'exigent `preconditionHaute()` et `stabiliteAcquise()`
(`utils/routeur/observables.ts`), donc l'escalade. Le module est écrit, commenté, testé — et
**personne ne l'appelle** : `lireLesFiches()` (`utils/routeur/donnees.ts:301`) a zéro appelant, et
les trois sites qui invoquent `etatDesObservables()` passent leur argument `requis` en dur
(`[code]` à `escalade.ts:75`, `[]` à `deroule/rappel.ts` et `deroule/juger.ts`). **Le jour où ce fil
se branche — et il est fait pour se brancher, le `01-` §8.3 le prescrit : « le routeur lit, il ne
décide pas » —, le `.md` que Louis dépose depuis son navigateur devient une entrée exécutable du
routeur, par élève, à chaque passage.**

⛔ **Les deux gardes qui manqueront ce jour-là, et qui manquent déjà :**

  - **L'écran ne dit pas si la chaîne est branchée.** Ses deux planchers mécaniques ne vérifient que
    « fiche déposée » et « correspondance non vide » ; ni l'un ni l'autre ne regarde
    `etatCompetence()`. On peut donc poser `evaluee` sur une compétence dont le branchement n'existe
    pas : l'écran accepte, et la compétence mesure zéro. Le motif existe déjà, servi
    (`instruments.ts`), et le bilan d'un dépôt l'affiche — il suffirait de le montrer aussi ici.
  - ⚠️ **Rien ne croise la fiche déposée avec la fiche qui mesure.** Ce qui est mesuré vient de
    `utils/chaine/derive/competences/<nom>.ts`, dérivé par `derive-instruments.py` depuis le dépôt de
    **conception** ; ce qui est déposé vit en base. Aucun code ne compare les deux versions —
    `fiche-observables.ts` ne voit jamais l'instrument. On peut afficher v4.4 sur l'écran pendant que
    la chaîne mesure avec v4.3, sans une ligne de log. Piste : le manifeste dérivé porte déjà
    `version` et `empreinte` par source ; il suffirait de les confronter au dépôt et de le dire.

⚠️ **L'asymétrie à ne jamais perdre de vue quand ce fil se branchera.** `etatDesObservables()` boucle
sur les codes de **l'instrument dérivé** et n'utilise la liste de la fiche que comme filtre
(`requis.includes(code)`). Donc un observable **ajouté** à la fiche déposée sera invisible — jamais
mesuré, absent de la liste des états, pas même en `n/a` —, tandis qu'un observable **retiré du
requis, renommé, ou touché par une clause « … sauf `x` »** changera l'escalade immédiatement.
L'ajout ne fera rien, le retrait fera tout, et aucune alerte ne distinguera les deux.

*(constaté avec Cowork le 23/08, en fabriquant les prompts C4-L10 — Louis : « l'import importe
réellement quelque chose et cet import a des conséquences réelles ». Oui, et il en aura davantage.)*

---

## Vocabulaire élève — « autre chose » ne dira rien à un élève (23/08/2026)

**Le constat est de Louis**, à la relecture du premier lot d'exercices fabriqué par le générateur :
*« le "autre chose" va faire tiquer les élèves »*.

**Où ça vit.** `palimpseste-conception/competences/questionnement.md`, section « La correspondance
observable → formulation ». Pour `question_propre` :

| | |
|---|---|
| la dimension, dite à l'élève | ta problématique, ou celle du sujet ? |
| la question « se juger » | Ta problématique dit-elle **autre chose** que le sujet remis au point d'interrogation ? |
| réponses possibles | oui, **autre chose** · non, c'est le sujet retourné · j'ai plutôt donné mon avis |

**Ce qui cloche.** « Autre chose » ne dit pas *autre chose que quoi, et en quoi*. Un élève de première
ou de terminale peut le lire comme « n'importe quoi d'autre », donc comme une invitation à s'écarter du
sujet — **l'inverse exact de ce que l'observable mesure**.

**⚠️ La portée a doublé le 23/08.** Le générateur d'exercices lit désormais cette table et **écrit ses
consignes dans ses mots** (`generateur/noyau/doctrine.py`, `_formulations` ; `noyau/materiau.py`,
`commande_appui`). La formule paraîtra donc **deux fois** devant le même élève : dans la **consigne
d'un exercice**, puis dans la **question qu'il se pose** au temps 3. Le remplaçant devra tenir sur les
deux surfaces, faute de quoi le chantier enseignera deux mots pour une seule mesure.

**⛔ Ce n'est pas une dette.** La source n'est pas fausse, elle est **inéprouvée** — et ce qui manque
n'est pas un chiffre mais **de voir ce qu'un élève en fait**. D'où le parking : la donnée arrive en
classe, après la rentrée.

**⛔ Et le remplaçant n'est pas trouvé.** *« Ajoute quelque chose d'important au texte »*, avancé en
séance, **a été écarté sur pièces** : c'est la formulation d'`enjeu` — *« ce que la solution
changerait »* — et une consigne qui la reprendrait pousserait l'élève à **ajouter un enjeu** quand
l'exercice mesure s'il a **reformulé**. *Le précédent est au `CONTEXTE.md` du 17/08 : quatre consignes
de cran sur six « devenaient plus strictes que la mesure ».*

**⭐ Même famille que l'item 62 du registre des ouverts** (*le nom de l'unité, dit à l'élève, n'existe
nulle part* — le retour engendré écrivait « unité », mot de grille). Les deux disent la même chose :
**le chantier a un vocabulaire de grille outillé, et un vocabulaire élève qui ne l'est qu'à moitié.**
À instruire ensemble.

*(idée Louis, 23/08 — séance « la fabrique sur papier », à la relecture du lot de calibration.)*

---

## Crédence — servir la réfutation À LA MESURE de la confiance (23/08/2026)

**L'effet d'hypercorrection** *(Butterfield & Metcalfe, 2001, et répliqué depuis par plusieurs
équipes)* : **une erreur commise avec forte confiance est mieux corrigée qu'une erreur commise dans le
doute** — l'écart entre ce que l'élève croyait et ce qu'il lit capte son attention. La conséquence
pratique est que **toutes les erreurs ne méritent pas la même quantité d'explication**.

**⭐ Palimpseste a le signal, et il est déjà en base.** Aux deux crans guidés, l'élève **répartit
cent jetons** sur quatre candidats *(`02-` §5)*, et `saisieARegistrer` *(`utils/deroule/credence.ts`)*
journalise **`jetons`, `choix`, `index_correct` et `candidats`**. On sait donc, cas par cas :
combien de jetons ont été posés sur la mauvaise réponse, et comment le reste s'est étalé. **Rien n'est
à collecter — seule la règle d'affichage est à écrire.**

**Ce que la règle pourrait faire.** Servir davantage de réfutation quand la charge sur l'erreur est
forte ; en servir moins quand l'élève avait déjà réparti son doute. Et traiter les deux cas que la
règle simple ne couvre pas :

- **l'égalité** — `choix: j.indexOf(Math.max(...j))` rend **0** sur un 25/25/25/25 : « le candidat le
  plus chargé » n'existe pas, et on montrerait la réfutation d'un candidat que l'élève n'a pas choisi ;
- **l'étalement** — sur un 40/30/20/10, l'élève a mis du poids réel sur **trois** mauvais candidats, et
  n'en verrait réfuter qu'un.

**⚠️ Le contrepoids à ne pas perdre.** L'effet de **renversement d'expertise** dit que la rétroaction
élaborée **surcharge** les élèves à faible bagage et devient **redondante** pour les avancés. Une règle
qui servirait les trois réfutations à tout le monde irait contre. *C'est pourquoi le premier geste,
tranché le 23/08, est volontairement minimal : `pourquoi_juste` toujours, `pourquoi_faux` sur la seule
réponse choisie.*

**⛔ Ce que ce n'est PAS.** Une mesure de plus : la crédence est déjà collectée, déjà notée au score de
Brier de la porte 2. C'est **une règle d'affichage** qui lit ce qui existe.

*(idée Louis, 23/08 — « la question de l'affichage en fonction de la crédence demande un peu plus de
travail ». Littérature réunie dans la même séance ; l'archéologie du champ `pourquoi_faux` est à
l'entrée du CONTEXTE.md du chantier de conception, même date.)*

⭐ **MISE À JOUR DU 24/08 — L'ÉGALITÉ EST TRANCHÉE, ET LA RÈGLE PARQUÉE HÉRITE D'UN POINT DE DÉPART.**
C4-L14 a dû écrire la règle de l'égalité pour servir la correction, et il l'a écrite **au minimum** :
**sur une égalité, aucun candidat n'est le plus chargé** — la correction ne sert **aucun**
`pourquoi_faux`, elle sert le `pourquoi_juste` **seul**, et **elle le dit à l'élève**. Elle vit à
`utils/deroule/correction.ts:leCandidatLePlusCharge`, avec un test discriminant. ⛔ **`choix` n'a pas
bougé** — il part en base et la chaîne le relit : l'égalité est une règle **de l'écran de correction**.
**Le premier des deux cas non couverts est donc fermé ; l'ÉTALEMENT reste entier**, et c'est lui, avec
le dosage à la mesure de la confiance, que cette entrée garde.

---

## `02-` §2.3.4 et `08-` §8 énumèrent QUATRE champs d'appui, le cas en porte CINQ (24/08/2026)

Depuis le **format 1.2**, un cas porte `defaut`, `distracteurs`, `reponse_attendue`, `guide` **et
`pourquoi_juste`**. Le `07-Implementation.md` §1.1 a été amendé par C4-L14 et en nomme **cinq**. Mais
le `02-exercices.md` §2.3.4 écrit toujours *« l'appui […] se compose de **quatre** champs »*, et le
renvoi du `08-` §8 les liste de même.

⚠️ **Aucun des deux n'est FAUX** — ils décrivent l'appui tel que le `02-` le définit, et le `08-` §0 dit
lui-même que « ce qu'un exercice EST fait foi au `02-` ». **Aucun `[faux]` n'a donc été posé.** Le
risque est ailleurs : **une session qui lirait le `02-` §2.3.4 seul manquerait le champ**. Les deux
documents sont **GELÉS** ; les rouvrir demande l'accord explicite de Louis.

*(constat C4-L14, 24/08 — il ne bloque rien : le `07-` §1.1 fait foi sur ce que la conception élit par cas.)*

---

## Au cran 3 sous escalade, une version finale est requise et rien ne l'engendre (24/08/2026)

Le cran **3** (`transformation_guidee`) est au régime *« pas de vf, sauf escalade »*. Sous **escalade
active** sur l'observable qu'il isole, `regimeDuDeroule` le passe à **`plein`** — une version finale
devient requise, parce que c'est elle qui fournit le `delta_v1_vf` dont N2 a besoin *(`01-` §8.5)*.

⛔ **Or à ce cran le jugement est ALGORITHMIQUE** *(`02-` §2.3.4)* : il n'y a ni extraction, ni
squelette, donc **aucun retour ne s'engendre** pour guider la révision *(`06-` §2, temps 4)*. L'élève
se voit demander une version finale **sans retour**, et le delta se calculerait sur un geste que rien
n'a orienté. **La tension préexiste à C4-L14** — elle naît du croisement du §8.5 et de la table des
crans — et elle vaut aussi pour le cran **1**, que `regimeDuDeroule` protège déjà *(une paire reste une
paire sous escalade)* : c'est **le cran 3 seul** qui bascule.

*(constat C4-L14, 24/08 — le lot a servi la correction au cran 3 comme son « fait quand » l'exige ; il
n'a pas touché à l'escalade, qui n'est pas de son périmètre.)*

---

## Le bonus de vacances est FERMÉ, et son code reste dormant (24/08/2026)

**Décision de Louis, 24/08, en clôture de C4-L13.** Le `06-Palimpseste.md` §5 accorde au travail fait
pendant les vacances **« au plus une semaine »** ajoutée au numérateur d'assiduité, sur tout le
semestre. **Le bonus ne sera pas construit.**

**Pourquoi il ne coûtait rien de le fermer, et pourquoi il coûtait de l'ouvrir.** L'assiduité se
calcule sur les lignes d'`assiduite_hebdo`, et le dénominateur est *le nombre de lignes qu'on passe,
moins celles marquées « en vacances »*. Or **la table n'a aucune colonne pour ce marquage**, et
`enVacances` est câblé en dur à `false` aux trois sites de lecture *(constat de C4-L13, piège 20)*.
Sans colonne, on ne pouvait avoir qu'**une seule** des deux propriétés :

| | Le dénominateur | Le bonus |
|---|---|---|
| poser les semaines de vacances | ⛔ **faux pour tout élève** *(elles y entreraient)* | ✅ possible |
| ne pas les poser — **ce que C4-L13 a fait** | ✅ **juste** | ⛔ impossible |

Le bonus vaut **au plus +1 semaine par semestre**, et seulement pour qui travaille pendant les
vacances ; le dénominateur est dans le pourcentage de **chaque élève, chaque semaine**. ⭐ **Et le
bonus n'a jamais été vivant** : avant C4-L13, rien n'écrivait `assiduite_hebdo`.

**Ce que « fermé » veut dire, concrètement.**

- ⛔ **Aucune colonne `en_vacances`, aucune migration.** C'était le prix de la réouverture.
- ✅ **Le code du bonus n'est PAS supprimé.** `assiduiteDeLEleve()` porte toujours `bonusVacances`,
  et ses tests *(`assiduite.test.ts` 47-80)* passent. Il est **dormant, pas faux** : il rend `0`
  parce qu'aucune semaine de vacances ne lui est passée. Le supprimer serait toucher un fichier de
  C4-L2 sans mandat, et rendrait la réouverture plus chère que la fermeture ne rapporte.
- ⚠️ **`06-Palimpseste.md` §5 porte toujours la règle, et il est VALIDÉ ET GELÉ.** Ce fichier ne se
  corrige pas depuis une session Code : sa modification demande l'accord explicite de Louis **et
  remonte à `CONTEXTE.md`**. ⛔ **Aucun `[faux]` n'a été posé** — la règle n'est pas fausse, elle est
  **retirée par décision**, ce qui n'est pas la même chose. **Reste dû : une passe de conception qui
  retire la phrase du `06-` §5, ou l'y marque comme abandonnée.**

*(Le `07-Implementation.md` §1.5, lui, est OUVERT À L'IMPLÉMENTATION : C4-L13 y a écrit la fermeture
et sa raison — v2.46.)*


---

## C4-L15 — ⛔ `banqueDeConsignes` sert au CONCEPTEUR ce qui est écrit POUR LE CONCEPTEUR

*Trouvé le 24/08 par la séance C4-L15, **hors de son périmètre**, en jouant la re-dérivation : porté
ici parce que la règle du dépôt est « toute découverte hors périmètre → une ligne, pas dans le
code ». **Candidat pour `C4-L11`**, qui est le domicile des défauts trouvés hors périmètre.*

**LE CONSTAT.** `banqueDeConsignes` *(`utils/fabrique/doctrine.ts`)* compose la consigne des trois
crans de production en collant le patron du `04-` §14.1 et la cellule du §14.2 — **telle qu'elle est
stockée**. Le générateur, lui, la passe d'abord par `noyau/materiau._pour_leleve` et `_denude`. Les
deux voies ne rendent donc **pas le même texte**, et c'est mesuré :

| | La voie du générateur *(banque réelle)* | La voie de conception en ligne *(`banqueDeConsignes`)* |
|---|---|---|
| cran 2 · `argument` | « Voici **la conclusion et la preuve.** Écris l'argument en t'appuyant dessus. » | « **«** Voici la conclusion et la preuve**, fournies — le garant reste entier**. Écris l'argument en t'appuyant dessus. **»** » |
| cran 6 · `argument` | « Écris l'argument. Conclusion ? Preuve ? Quelle raison… ? » | « **«** Écris l'argument. **«** Conclusion ? Preuve ? Quelle raison… ? **»** **»** » |

**QUATRE ÉCARTS, ET LE PREMIER EST LE SEUL QUI COMPTE VRAIMENT.**

1. ⛔⛔ **« — le garant reste entier » EST SERVI À L'ÉLÈVE.** La queue après le tiret cadratin est une
   **didascalie du concepteur** : elle dit ce qu'on ne sert PAS. `verifie-vocabulaire.py` le sait —
   son en-tête l'écrit en toutes lettres — et **c'est pourquoi il ne crie pas** : il lit la cellule
   *après* `_pour_leleve`. **Le contrôle ne peut donc pas voir ce défaut-ci : il est dans le port
   TS, pas dans la source.** ⚠️ C'est **exactement le défaut des items 63, 70 et 71** — un mot de
   grille servi à un élève de première —, trouvé une quatrième fois, et par un chemin neuf.
2. **« , fournies » / « , fournie » restent** — le générateur les retire aussi.
3. **Les guillemets du patron restent**, et **ceux du guide du cran 6 s'y emboîtent** : « … « … » ».
4. Conséquence des trois : la consigne composée en ligne **n'est pas celle que la banque produit**,
   pour le même objet, le même mode et le même cran.

**CE QUE ÇA COÛTE AUJOURD'HUI, ET DEMAIN.** Aujourd'hui : **rien en base** — toutes les instances de
production viennent de l'import, et aucun professeur n'a encore conçu de cran 2 ou 6 en ligne.
Demain : dès qu'il le fait, la consigne part en `exercices.consigne_instanciee`, **qui est figée à
l'import et qu'aucune dérivation ne réécrit** — l'élève lira la didascalie, et le vocabulaire servi
ne sera plus celui de la fiche.

**LA RÉPARATION, ET POURQUOI ELLE N'A PAS ÉTÉ FAITE ICI.** Elle est petite — porter l'équivalent de
`_pour_leleve` / `_denude` dans la dérivation ou dans `banqueDeConsignes` — mais elle touche la
composition des consignes, qui est le périmètre de `C4-L8`/`C4-L11`, pas celui de C4-L15 *(le repli
du guide de C4-L15 retire un BLOC de l'écran ; il ne touche pas un mot de la consigne)*. ⚠️ **Et il y
a une vraie question de domicile derrière** : faut-il que le **dériveur** verse deux formes de la
cellule *(la stockée et la servie)*, ou que le **lecteur** la nettoie ? La première a l'avantage de
mettre le nettoyage là où le générateur l'a déjà — **un seul endroit, une seule règle**.

---

## C4-L15 — ⛔ L'aperçu du professeur ne lit pas les distracteurs en forme d'OBJET

*Trouvé le 24/08 à l'écran, en jouant la recette R2 de C4-L15. **Ce n'est pas une idée neuve** :
c'est l'item que le prompt de C4-L15 retire nommément de son périmètre — « la normalisation des deux
formes physiques de `exercices_cas.distracteurs` — objets à l'import, chaînes à l'écran de conception
— est à **`C4-L11`** ». **Cette ligne ne le crée pas, elle le DATE et le mesure.***

**LE CONSTAT, DIAGNOSTIQUÉ.** `app/prof/conception/[id]/page.tsx` lit
`cs.distracteurs.map(txt)`, et `txt = (x) => typeof x === 'string' ? x : ''`. Or le `08-` §5.2
déclare qu'un distracteur est un **objet** `{texte, pourquoi_faux}`. Sur cette forme, l'aperçu sert
**`['', '', '', 'donc']`** — trois candidats vides.

⭐ **LES DEUX FORMES COHABITENT EN BASE AUJOURD'HUI, ET C'EST MESURÉ.**
`jsonb_typeof(distracteurs->0)` sur toutes les instances qui en portent : **`object` × 2**
*(le décor de C4-L15, qui suit le format d'import)* · **`string` × 8** *(les instances conçues à
l'écran)*. **La forme d'objet est celle que la banque réelle produira** — c'est celle du `08-`.

⭐⭐ **CE QUE C4-L15 A CHANGÉ : LE DÉFAUT EST DEVENU VOYANT.** Avant ce lot, trois candidats vides
s'affichaient comme **trois lignes blanches** dans une liste — facile à ne pas voir. Depuis que
l'aperçu marque le matériau, **il SOUS-MARQUE** : au cran 1, **un seul gras côté professeur, quatre
côté élève**. *Or l'aperçu existe précisément pour que « le professeur voie ce que l'élève verra » —
et c'est le seul écran où le placement se vérifie.*

⛔ **L'écran ÉLÈVE n'est PAS touché** : `utils/deroule/credence.ts` normalise déjà les deux formes
*(`texteDuCandidat`, `lireLaBanque`)*, et le smoke élève du 24/08 rend bien quatre gras. **Le défaut
est dans l'aperçu seul.**

**LA RÉPARATION EST D'UNE LIGNE, ET ELLE EXISTE DÉJÀ.** Passer par `texteDuCandidat`
*(`utils/deroule/credence.ts`)* au lieu de `txt` — la fonction est écrite, éprouvée, et elle traite
exactement ce cas. ⚠️ **Et elle doit venir avec sa question de fond** : faut-il **normaliser à
l'écriture** *(une seule forme en base, celle du `08-`)* plutôt que de faire normaliser chaque
lecteur ? Deux formes physiques pour la même donnée, c'est deux lecteurs à tenir d'accord pour
toujours.


---

## ✅ ~~UN DÉFAUT, PAS UNE IDÉE — le CRLF des `<textarea>` fait mentir la garde de la découpe~~ — **CORRIGÉ LE 29/08**

> ⭐⭐ **FERMÉ AU CHANTIER LE 29/08, SUR ONZE SITES ET SIX FICHIERS.** Un balayage du dépôt entier —
> **92 `<textarea>` recensés, 53 sites instruits** — a rendu **17 sites exposés** et **36 propres
> avec leur raison écrite**.
>
> ⭐ **LE DISCRIMINANT, mesuré et non supposé** : ce n'est pas « un `<form action={…}>` », c'est
> **« la valeur traverse-t-elle un FormData construit DEPUIS le formulaire »**. Un `<textarea>`
> contrôlé dont la valeur part par **argument de fonction** vers une action serveur n'est **PAS**
> exposé — elle reste en LF. C'est ce qui innocente les sept éditeurs de prompts d'IA de
> `components/BlocPrompt.tsx`, les formulaires élève d'Aletheia, le chat du Scriptorium et les
> paramètres du Codex : **des dizaines de lignes qui auraient toutes porté leur `\r`.**
>
> ⛔⛔ **ET LE BALAYAGE A TROUVÉ QUE LA CORRECTION D'UNE LIGNE ANNONCÉE CI-DESSOUS AURAIT FABRIQUÉ UN
> BUG.** `creerContenu` écrit `texte_extrait` sans normaliser, tout comme `modifierContenuBiblio`.
> Aujourd'hui les deux côtés dérivent ENSEMBLE. **Ne corriger que la garde aurait rendu tout cours
> collé au clavier « différent de lui-même » à sa première ré-ouverture** — et un « oui » du
> professeur détruit la découpe ET rabat les `vu_at` des élèves. **Les deux sites sont partis dans le
> même commit.**
>
> ⭐ **ÉPROUVÉ PAR L'ÉCHEC AVANT DE L'ÊTRE PAR LE SUCCÈS, SUR LA DONNÉE RÉELLE** — script laissé au
> dépôt, `scripts/recette/crlf-textarea.mjs --epreuve`. Sur les **6 corps multi-lignes réels** des
> deux bases *(5 sandbox, 1 prod)*, la garde se déclenchait **à tort 6 fois sur 6** ; après, **0 sur
> 6**. Dont « NAture humaine », **110 lignes** — le compte exact du relevé du 25/08 ci-dessous.
>
> ⭐ **ET LA DONNÉE A ÉTÉ LUE AVANT D'ÊTRE RÉPARÉE** : **0 `\r`** dans les deux bases, sur toutes les
> colonnes mesurées. Les corps multi-lignes existent bien *(33/33 documents en prod)* mais viennent
> tous d'une extraction de fichier ou du chemin élève, jamais d'une édition au formulaire. **Le
> défaut était armé et n'avait pas encore tiré : c'est de la prévention, pas de la réparation.**
>
> ⚠️ **Deux sites exposés par câblage sont laissés en l'état, sciemment** : `ajouterContenu`
> (`actions.ts:143`) et `modifierContenu` (`actions.ts:629`) — leurs composants
> `FormulaireContenu.tsx` et `LigneContenu.tsx` **ne sont montés nulle part** *(seul le type
> `ImageItem` est importé)*. Le geste, si on les remonte un jour :
> `normaliserRetours(String(formData.get('texte') ?? ''))`. ⛔ *On ne supprime rien sur ce seul
> constat — la règle du dépôt.*
>
> **Énoncé d'origine :**


*Trouvé le **25/08** par la session Code **C4-L16**, en éprouvant la garde que son piège 14 lui
demandait de vérifier. **Hors périmètre du lot — non corrigé.** Il est ici faute d'un meilleur
registre : ce n'est pas une idée, c'est un défaut qui détruit du travail.*

**CE QUI SE PASSE.** `app/prof/scriptorium/actions.ts` → `modifierContenuBiblio`, garde L2 :

```ts
if (actuel.type === 'cours' && (actuel.texte_extrait ?? '').trim() !== (texte ?? '')) { … }
```

**La soumission d'un formulaire HTML normalise les sauts de ligne d'un `<textarea>` en CRLF.** Le
texte stocké porte des `\n` ; celui qui arrive porte des `\r\n`. **Les deux ne sont donc JAMAIS
égaux dès que le corps compte une seule ligne**, et la garde se déclenche **à chaque
enregistrement**, même si le professeur n'a touché qu'au titre.

**MESURÉ SUR PIÈCE**, en instrumentant l'action *(sonde retirée depuis)*, sur le cours réel
« NAture humaine » :

```
egaux: false · lenStocke: 9460 · lenSoumis: 9570 · premiereDivergence: 28
  stocké : "t-ce que la nature ?\nEn gros, la nature "
  soumis : "t-ce que la nature ?\r\nEn gros, la nature"
```

**9570 − 9460 = 110** — exactement un `\r` par saut de ligne.

**CE QUE ÇA COÛTE, ET C'EST DE DEUX ORDRES.**

1. ⛔ **Sur un cours DÉCOUPÉ** : le professeur reçoit *« sa découpe en N sections sera effacée »* à
   chaque sauvegarde, **pour rien**. S'il confirme — et il finira par confirmer —, **la découpe est
   réellement détruite** et les instances de parcours re-matérialisées en « cours entier ».
   *Aujourd'hui, c'est aussi ce qui empêche de déclarer les notions de C4-L16 sur un cours découpé
   sans passer par cette fausse alerte.*
2. ⚠️ **Sur TOUT cours ou texte** : `texte_extrait` est réécrit **avec les CRLF** à chaque
   enregistrement. Le corps stocké dérive donc dès la première édition — et c'est ce corps que le
   **RAG** sert et que `scriptorium_contenu_sections` partitionne. *Vérifié en séance : « Cognitif »
   est passé de **0** à **34** `\r` sur une simple sauvegarde. (Remis en état ensuite.)*

⚠️⚠️ **ET VOICI POURQUOI IL NE SE VOIT PAS.** `new FormData(formulaire)` en JavaScript **ne fait PAS**
la normalisation — la sonde côté navigateur rendait donc « identiques : true ». **Seule la
soumission réelle** *(action serveur)* la fait. Aucun test unitaire, aucun `tsc`, aucun lint ne peut
l'attraper : *il faut instrumenter le serveur pendant un vrai clic.*

⭐ **LA CORRECTION EST D'UNE LIGNE, et elle a un précédent** : normaliser des deux côtés avant de
comparer *(et avant d'écrire)*. Le dépôt connaît déjà ce piège — **C4-L4** l'a rencontré sur
`blocs()`, où un `<textarea>` normalisé en CRLF faisait lire **UN SEUL BLOC**.

```ts
const norm = (s: string) => (s ?? '').replace(/\r\n/g, '\n').trim()
if (actuel.type === 'cours' && norm(actuel.texte_extrait as string) !== norm(texte)) { … }
```

⚠️ **Et il faut aussi normaliser CE QUI S'ÉCRIT** (`texte_extrait: texte`), sans quoi le corps
continue de dériver. ⛔ **Vérifier les autres écrivains de `<textarea>` du dépôt au passage** : la
même normalisation s'applique partout où un corps collé est comparé ou haché.

---

## ✅ ~~Le CRLF, TROISIÈME morsure — MESURÉ des deux côtés (smoke C5-L1, 26/08)~~ — **CORRIGÉ LE 29/08**

> ⭐ **Le fait mesuré ici — « la normalisation vaut AUSSI pour les server actions React » — a servi
> de discriminant à tout le balayage du 29/08.** Il reste vrai et il est la clé du tri.
>
> ✅ **Les sites nommés ci-dessous sont corrigés**, tous par `normaliserRetours` : `lireCas()` pour
> la `consigne_instanciee` et le `pourquoi_juste` (`actions.ts:76` et `:84`), la consigne d'examen
> (`:329`), le `guide` **aux deux voies** (`:131` et `:339`).
>
> ⚠️ **UNE CORRECTION DE FAIT À CETTE NOTE** : *« `distracteurs: brut.split('\n')` laisse un `\r` en
> queue de chaque distracteur »* — **ce n'est plus vrai**, et vérifié en exécutant : la ligne porte
> aujourd'hui `.map((x) => x.trim())`, qui mange la queue. Même chose pour `notions_libres`
> (`actions.ts:713`), dont le `split(/[\n,;]+/)` laisserait un `\r` si le `trim()` de la ligne 718 ne
> le retirait pas. ⭐ **Ces deux-là tiennent par leur `trim()` : le déplacer rouvrirait le défaut.**
>
> ⭐ **Un site nommé était DÉJÀ propre** : `utils/examens/conception.ts` passe par `consigneANoter`,
> qui normalise. Les trois écrivains de `consigne_instanciee` sont maintenant alignés.
>
> **Énoncé d'origine :**


**Le doute que l'entrée ci-dessus laissait est levé, et dans le mauvais sens : la normalisation en
CRLF a bien lieu sur le chemin des SERVER ACTIONS React.** Mesuré en séance, en tapant vraiment dans
un `<textarea>` puis en lisant la base :

| Où | CR |
|---|---|
| `textarea.value` *(l'« API value »)* | **0** |
| `new FormData(formulaire).get(...)` *(côté navigateur, avant envoi)* | **0** |
| **ce qui arrive en base**, sur un champ qu'aucun code ne normalise — `exercices.consigne_instanciee` | **1** ⚠️ |

⭐ **C'est la confirmation exacte de l'avertissement ci-dessus** — *« `new FormData()` ne le montre
pas, seule la soumission réelle la fait »* — **et elle vaut donc AUSSI pour une action serveur
React**, ce qu'on pouvait espérer différent puisque React sérialise en JavaScript. **Ce n'est pas
différent.**

⛔ **CONSÉQUENCE CONCRÈTE, HORS PÉRIMÈTRE DE C5-L1, ET NON CORRIGÉE** : `concevoirInstance`
*(`app/prof/conception/actions.ts`, C4-L8)* et `editerInstance` écrivent la **`consigne_instanciee`**
et les champs de l'appui *(`defaut`, `reponse_attendue`, `pourquoi_juste`, la banque de
`distracteurs`)* **sans normaliser**. Or *« c'est le texte qu'il arrête que l'élève lit »* : toute
consigne saisie sur plusieurs lignes est stockée avec des `\r` invisibles.
⚠️ **Le rendu HTML n'en souffre pas** — c'est pourquoi personne ne l'a vu — **mais toute comparaison,
tout comptage de lignes et toute empreinte sur ces chaînes dérivent.** ⚠️ Et
`distracteurs: brut.split('\n')` laisse un `\r` **en queue de chaque distracteur**, qui part ensuite
à l'écran de l'élève et dans la crédence.

⭐ **La correction est la même qu'ici, et elle est d'une ligne par site** : normaliser à l'entrée de
`lireCas()` et de l'écriture de la consigne. **C5-L1 l'a fait chez lui** — `deposerTexte` et
`corrigerReference` normalisent, et leurs champs sont **mesurés à 0 CR** dans la même séance, face
aux 1 CR de la consigne : *les deux régimes cohabitent aujourd'hui dans la même base.*


## C5-L4 · Les onglets de la lecture — deux renvois de périmètre (27/08/2026)

**Ce lot était une réorganisation de navigation, l'ouverture des portes qu'elle rend possible, et une
phrase d'écran qui manquait.** Les deux points ci-dessous ont été **vus, nommés, et laissés là**.

**1. Le déménagement de `app/prof/conception/` dans l'atelier de son mode — REPORTÉ UNE SECONDE FOIS,
et cette fois par une décision, pas par une dépendance.** C4-L6 l'avait déposé à C5-L4 *(entrée
ci-dessus, point 1)* parce qu'Aletheia n'avait pas d'onglets. **Aletheia les a maintenant, et le
déménagement ne se fait toujours pas** — **décision de Louis, 27/08** : *« ça va me demander un peu
plus de réflexion, donc pour le moment on fait juste un renvoi. Je verrai plus tard comment je veux
vraiment organiser tout ça. »* **L'onglet Exercices d'Aletheia y renvoie par trois liens**
*(`/prof/conception/nouvelle?porte=aletheia`, `/prof/conception/textes`, `/prof/conception`)*,
exactement comme celui de Codex.

⭐ *Le motif du déménagement à terme n'a pas changé* : le `01-routeur.md` §2 veut que l'exercice se
conçoive **dans l'atelier de son mode** — Codex pour `composer`, Aletheia pour `restituer`,
`expliquer`, `évaluer` et `interroger` *(repris au `02-exercices.md` §6 B)*.

⚠️⚠️ **CE QU'IL COÛTERA, MESURÉ LE 27/08 — la liste existe pour que personne ne le retente en
passant :**

- **DIX `revalidatePath` sur des chemins Aletheia, dans SIX fichiers** — `app/passation/actions.ts:47`
  et `:49` *(en `'layout'`)* · `app/deroule/actions.ts:48` *(`'layout'`)* ·
  `app/eleve/modules/aletheia/actions.ts:49` et `:50` · `app/prof/aletheia/actions.ts:123` et `:203` ·
  `app/prof/examens-diagnostiques/actions.ts:297` · `app/prof/scriptorium/actions.ts:1200` et `:1452`.
- **Quatre autres sites qui fabriquent une adresse à la main** — `utils/integrite-preuve.ts:154`
  *(`lienAnalyse` : **si cette route bouge, l'écran d'intégrité ment sans le dire**)* ·
  `app/prof/corpus/page.tsx:237` · `components/examens/EcranConceptionExamen.tsx:102` et `:114`.
- **L'entrée « Conception » du Pilotage** — `components/nav/configNavigation.ts:37`.

⛔ **Un `revalidatePath` sur un chemin mort NE LÈVE AUCUNE ERREUR** : l'écran reste périmé, et
personne ne sait pourquoi. ⭐ **C5-L4 a laissé les dix justes en gardant les racines aux onglets
Livres** *(aucune route n'a été déplacée ; les trois `'layout'` couvrent le sous-arbre entier)* —
**toute route qu'un déménagement déplacera devra être suivie là aussi.**

**2. Les trois `<main>` imbriqués de CODEX restent à corriger.** C5-L4 a corrigé **les trois
d'Aletheia** — `app/eleve/modules/aletheia/passation/[depotId]`,
`app/prof/aletheia/passation/[exerciceId]`, `app/prof/aletheia/examen-diagnostique/[planifieId]` :
`<main>` → `<div>`, **classes inchangées**, seule la balise change. **Les trois jumelles de Codex
portent le même défaut, et C4-L6 est clos** : `app/eleve/modules/codex/passation/[depotId]`,
`app/prof/codex/passation/[exerciceId]`, `app/prof/codex/examen-diagnostique/[planifieId]`.
⚠️ *La coquille du rôle (`app/eleve/layout.tsx`, `app/prof/layout.tsx`) rend déjà un `<main>` autour
de tout le sous-arbre : deux repères « principal » dans une page qui n'en a qu'un **s'entendent** au
lecteur d'écran, et les deux largeurs de colonne se concurrencent.* **La correction est d'un
caractère par balise, et elle est la même que celle qui vient d'être jouée à côté.**

---

## 28/08 — deux restes laissés par la réparation de la porte du retour d'examen

**1. La règle « atelier d'une instance de classe » existe en TROIS exemplaires.** La version PURE et
testée est désormais `atelierDUneInstanceDeClasse` (`utils/codex-onglets/regles.ts`) — *la ligne de
plan d'abord, le mode ensuite*. Les deux autres n'ont pas été repris, délibérément :
`moduleDeLInstance` (`utils/examens/signal.ts`, cœur testé de C4-L9) et le filtre en ligne de
`passationsDeClasse` (`utils/codex-onglets/liste.ts`, autre côté). ⚠️ *« Un second exemplaire
divergerait au premier correctif »* — et cette règle-ci est précisément celle qu'il ne faut pas
laisser diverger : l'inverser range l'explication de texte dans Codex.

**2. ⛔ `etatDeLExercice` dit encore « retour à lire » sur un retour DÉJÀ LU — côté MAISON.** Son
`case 'retour_publie'` rend `a_lire` **sans regarder `lu`** ; la première clause
(`retour?.publie && !retour.lu`) ne le rattrape pas. Un exercice formatif dont l'élève a validé sa
lecture garde donc son étiquette « retour à lire » sous l'onglet Exercices **jusqu'à la remise de la
version finale** — un dépôt maison reste à `retour_publie` jusqu'à `vf_remis`.
⭐ *Le défaut a été trouvé au smoke du 27/08 sur le versant CLASSE, où il a été fermé par une règle
propre (`etatDExamenDeClasse`) : la séquence de classe s'arrête à `retour_publie`, lire est le
dernier geste, donc `clos`.* ⚠️ **Côté maison la réponse n'est pas la même et c'est une décision :**
après lecture, il reste une version finale à écrire — l'étiquette juste est sans doute
« version finale à écrire » (ton `a_faire`), pas « terminé ». La corriger demande de faire entrer le
`lieu` dans la fonction, ou de lui donner sa jumelle. **Non fait : hors du geste demandé.**

- **Le septième signal du faisceau d'intégrité — le « style discordant » — n'a AUCUN producteur.** Le `06-Palimpseste.md` §6 le nomme *(« un style discordant avec l'historique — signal faible »)* et rien dans le dépôt ne compare le style d'une copie à l'historique de l'élève *(vérifié le 28/08)*. `utils/integrite-faisceau.ts:signalStyle()` rend donc **`null` — « non mesuré »**, et surtout **jamais `false`** : un `false` dirait « le style concorde », ce que personne n'a regardé. Le faisceau tourne à **six signaux sur sept**, et son motif le dit à chaque drapeau. Piste : décider ce qu'est un « style discordant » mesurable *(et par quel producteur)*, ou acter qu'il reste hors dispositif. ⚠️ **Ce n'est pas une extension de liste à faire en passant** : le `06-` §6 est GELÉ. *(constaté pendant C6·L1, hors périmètre du lot)*
- **Trois drapeaux professeur sont nommés par les sources et n'ont toujours pas d'écran** — C6-L1 en posait quatre, et son entrée n'en nommait que quatre. *(a)* **trois `pas_pu` d'affilée** *(`06-` §3 — la donnée est là, `exercices_depots.conditions_declarees`)* ; *(b)* **l'incohérence répétée entre la restitution à chaud et le squelette** *(`06-` §3, `01-` §9 — `ContexteLettre.incoherenceRepetee` existe et **n'est passé par aucun des deux appelants du moteur**, `utils/routeur/lettres.ts:145`)* ; *(c)* **la discordance de deux paliers entre la trajectoire et l'ancre** *(`utils/routeur/lettres.ts:203`)*. ⭐ **Le canal d'affichage de C6-L1 accueille (a) et (b) SANS UNE LIGNE DE CODE NEUVE** : une valeur de plus dans `NATURES_DRAPEAU`, une phrase écrite par celui qui lève. ⛔ **(c) est différent : il est TRANSITOIRE** — il ne se lève qu'au moment où une ancre ARRIVE, donc **à l'écriture**, chez `utils/moteur/etat-serveur.ts:215` ; à la lecture d'un écran, il est déjà passé. Il demande donc une **persistance**, qui est une décision de forme. *(constaté pendant C6·L1, hors périmètre du lot)*
- **Le calendrier de la rentrée rend structurellement muets les deux drapeaux comptés en cycles.** Au 28/08/2026, la sandbox ne porte **qu'une seule semaine d'enseignement commencée** *(Semestre 1, 24/08 → 10/01 ; les deux semestres de test antérieurs sont archivés)*. Ni la **cadence d'ancre** *(6 cycles)* ni le **re-signalement N3** *(3 cycles)* ne peuvent donc se lever avant la mi-octobre. **Ce n'est pas une panne** — l'écran le dit —, mais **toute recette de septembre doit le savoir avant de conclure qu'un drapeau ne marche pas**. `scripts/recette/couture-c6l1.mjs` contourne en **empruntant un semestre archivé passé**, qu'il repose archivé. *(constaté pendant C6·L1)*

- **`handoff_en_tete/` ne suit pas la convention des artefacts de design, et c'était la seule source des deux erreurs permanentes du lint.** Treize dossiers s'appellent `design_handoff_*` et sont exclus du lint depuis toujours ; celui-ci, **antérieur à la convention** *(07/07/2026)*, ne l'était pas — si bien que les 56 Ko de `support.js` d'une **maquette livrée** étaient lintés comme du code applicatif, avec deux erreurs qui ne pouvaient pas disparaître *(`ReactDOM.render` déprécié · assignation à `module`)*. ⭐ **L'exclusion a été élargie le 28/08** *(C6-L1 : `"**/handoff_*/**"`)*, et le dépôt passe le lint **sans une seule erreur**. ⛔ **Le dossier n'a PAS été renommé, délibérément** : son chemin est cité dans des relevés de séance **déjà clos** *(`RELEVE_C4_L4_2026-08-22.md`, `SUIVI_tests_manuels.md`)*, dans `PROMPT_Design_C2_ecran_eleve.md` et dans **deux autres handoffs** — réécrire un compte rendu passé pour qu'il colle à un chemin neuf, c'est falsifier une trace. Piste, si on veut une convention unique : renommer en `design_handoff_en_tete/` **et** mettre à jour les huit renvois dans le même geste, en assumant que les relevés cités décrivent alors un chemin qui n'existait pas au moment où ils ont été écrits. *(constaté pendant C6·L1, sur signalement de Louis)*

## ⭐ Décisions de Louis du 28/08, en clôture de C6-L1

- **LE SEUIL DE CONVERGENCE DU FAISCEAU — on ne le règle PAS maintenant, et le motif est chiffré.** `faisceau_convergence_seuil` reste `NULL`. ⚠️ **Le flux maison n'a jamais tourné une seule fois en production** — 247 instances `maison` conçues, **0 remise** ; les 65 remises sont **toutes** des passations `classe`. **Six des sept signaux sont donc structurellement non mesurables**, et le seul qui l'est est le comptage des collages bloqués : un seuil posé aujourd'hui dirait *« un collage bloqué = un drapeau d'intégrité »*, ce qui est une machine à faux positifs. **Condition de reprise : deux à trois semaines d'exercices maison réellement remis**, puis lire la distribution que l'écran affiche déjà *(répartition par nombre de signaux levés, et ce que chaque seuil attraperait)*. Le geste est alors `update scriptorium_params set faisceau_convergence_seuil = <n> where id = 1`.
- **LE STYLE DISCORDANT — à construire PAR DÉRIVATION, et pas avant qu'un historique existe.** ⭐ Ce qui change son coût : **l'instrument d'Expression mesure déjà neuf observables stylistiques** sur chaque mesure — `densite_friction`, `densite_generique`, `mot_impropre`, `orthographe`, `repetition_pauvre`, `savant_plaque`, `taux_sens_passe`, `attache_presente`, `reussites` —, stockés dans `competences_mesures.observables`. **Le septième signal se dérive donc de données existantes : aucun NLP à écrire, aucune colonne à poser.** ⚠️⚠️ **Mais c'est le signal au pire profil de faux positifs, et le `06-` §6 l'appelle lui-même « signal faible »** : *un élève dont l'Expression bondit, c'est exactement à quoi ressemble le progrès* — accuser l'élève qui progresse est la faute la plus coûteuse que ce dispositif puisse commettre. **Condition de reprise : un historique de mesures maison par élève.** *(Décision de Louis, 28/08 : suivre cette recommandation.)*
- **LES TROIS DRAPEAUX NON POSÉS — un seul est mûr, et c'est la DISCORDANCE.** *(a)* trois `pas_pu` d'affilée et *(b)* l'incohérence répétée de la restitution à chaud portent **zéro ligne en base des deux côtés** *(l'écrivain de (a) existe — `utils/deroule/gestes.ts` —, celui du constat de (b) n'existe pas)* : les deux attendent les exercices maison. ⭐ *(c)* **La discordance de deux paliers est INDÉPENDANTE de la maison** — elle se lève quand une **ANCRE** arrive, et les ancres sont les examens en classe, qui ont lieu. ⚠️ **Et elle est TRANSITOIRE** : `jugerLaLettre` ne la calcule qu'au moment où l'ancre arrive *(`utils/routeur/lettres.ts:203`)*, donc **à l'écriture**, chez `utils/moteur/etat-serveur.ts:215` — à la lecture d'un écran, elle est déjà passée. Elle demande donc une **persistance**, qui est une décision de forme. **Condition de reprise : un petit lot, AVANT le prochain examen en classe** — sinon elle se lèvera dans le vide et personne ne la verra. *(Décision de Louis, 28/08 : suivre cette recommandation.)*
- **`C5-L2` — ON CONTINUE DE REFUSER, et la question se rouvre quand la file aura vécu.** `C5-L2` refuse, avant publication, un retour dont une citation étiquetée « copie » vient en réalité du **texte support**. ⭐ **La file d'examen humain de C6-L1 ne le remplace pas, elle le double** : elle arrive **après** que l'élève a lu, rien ne garantit sa latence, et **elle n'a encore jamais été regardée par personne** *(vue à l'écran le 28/08 sur un décor semé, jamais sur un cas réel)*. ⚠️ **Condition de reprise : quelques semaines de file réellement consultée**, quand Louis saura à quel rythme il la traite. ⛔ **Et il faut le lui RAPPELER** — sa demande explicite du 28/08 : *« il faut me prévenir régulièrement de regarder, et me prévenir aussi que c'est peut-être pas le bon moment »*.

- **⭐ LE RAPPEL DE LA FILE D'EXAMEN HUMAIN — les DEUX moitiés sont en place, et elles ne vivent pas au même endroit** *(demande de Louis, 28/08 : « il faut me prévenir régulièrement de regarder, et me prévenir aussi que c'est peut-être pas le bon moment »)*.
  - **La DONNÉE est au tableau de bord** *(`/prof`)*, parce que c'est le seul endroit qui lit la production : *« N contestations attendent un examen humain · la plus ancienne depuis X jours · <classes> »*, **en tête de la cascade du héros**. ⭐ **Elle passe devant les fragments à valider, et c'est délibéré** : c'est le seul item de cette liste qui soit une **obligation légale**, et le coût de l'oubli n'est pas symétrique — un fragment attend sans dommage, une contestation non examinée laisse un élève devant un « Tu écris : … » sous une phrase qu'il n'a pas écrite. ⛔ **Si ce rang doit changer, c'est une décision de Louis.** Elle reste dans « À préparer » quand un item plus urgent la précède : **elle ne quitte jamais l'écran tant qu'elle n'est pas vide**.
  - **Le RAPPEL est une routine hebdomadaire** — `trig_01Di9EKYTAdbGQTjHPK42VF1`, **lundi 8h (Toronto)**, https://claude.ai/code/routines/trig_01Di9EKYTAdbGQTjHPK42VF1 . ⚠️⚠️ **Elle n'a NI base NI dépôt, et c'est structurel** : `.env.local` est gitignored et non suivi, donc **un agent cloud n'aura jamais les identifiants de la production** — une routine qui interrogerait la base échouerait en silence toutes les semaines. Son prompt lui **interdit donc explicitement d'inventer un chiffre** : elle fait REGARDER, elle ne compte pas. ⚠️ **Et GitHub n'est pas connecté au compte** : la version riche — celle qui lirait les conditions de reprise de ce fichier et dirait chaque semaine *ce qui est mûr* — a été **refusée par l'API** (`401`, « Connect your GitHub account »). **Piste : connecter GitHub** *(`/web-setup`, ou l'app GitHub sur le dépôt)*, puis rendre à la routine sa source et son prompt long — il est au relevé de la séance.
  - ⚠️ **Le serveur a élargi ses outils au préréglage par défaut** *(Write, Edit, WebFetch…)* malgré une liste vide à la création. Sans dépôt ni base elle n'a rien à écrire, mais **c'est à savoir** : ce n'est pas ce qui a été demandé.


## Constats de la vague `vgen1` — peuplement générique de la banque, 28/08

- **Les vieux plans de `generateur/papier/` visent la banque RACINE, pas une copie.** `plan-batch1-tc.json`, `plan-batch3-argument.json` et `plan-batch4-paragraphe.json` portent tous `"banque": "generateur/banque/banque.json"`. Ils sont antérieurs à `prepare-vague.py`, qui donne à chaque lot **sa copie** pour que N lots parallèles ne s'écrasent pas, et ils n'ont jamais été recalés. **Ce n'est pas un défaut tant qu'on les joue seuls** — c'est ainsi que les vagues d'avant ont été versées —, mais un plan de `papier/` lancé **pendant** une vague écrirait dans la banque qu'une autre séance est en train de lire. Piste : leur faire pointer une copie, ou les déplacer sous `papier/archives/`. *(relevé pendant `vgen1`, 28/08)*

- **Deux patrons de consigne de l'objet `objection` présupposent un matériau que l'observable ne produit pas toujours.** Au cran 4 (`diagnostic_nomme`), le patron dit *« Cette objection est un **homme de paille** »* — or l'observable `objection_traitee` couvre **deux** défauts : l'objection évoquée et jamais traitée, ET celle qui vise un point que personne ne soutenait. Sur un matériau qui porte le premier, réciter le patron **nomme à l'élève un défaut qui n'y est pas**. Au cran 9 (`diagnostic_fin`), le patron dit *« Ces **deux** objections tiennent »*, quand la règle d'instance du même objet exige un paragraphe argumentativement **CLOS**, qui n'en porte qu'une. Le lot a gardé le geste et abandonné la lettre — seul choix juste, mais la règle de rédaction dit *« elle instancie le patron, elle ne le remplace pas »*. Piste : dédoubler le patron par défaut injecté, ou le généraliser. *(constaté pendant `vgen1`)*

- **Le prompt `generateur/prompts/appui.txt` laisse croire que la réponse attendue se réinvente.** Il dit qu'elle *« ne se déduit pas du défaut »*, et rien n'y dit qu'elle **reprend la `version_corrigee` du matériau**, que la commande lui sert pourtant sous l'intitulé « LA VERSION CORRIGÉE (pour la réponse attendue) ». Conséquence mesurée le 28/08 : **deux lots ont tranché en sens contraire la même question de doctrine sur le même observable** (`densite_friction`) — l'un tenant l'incise entre tirets pour une construction acceptable et l'écartant de ses distracteurs, l'autre la tenant pour fautive et l'écartant de sa réponse attendue. Un élève qui rencontre les deux apprend une règle et son contraire. ⭐ **Réparé dans la banque** en retirant de `ex-exemple-composer-04-densite-friction-1` la prescription typographique (*« il fallait l'isoler entre deux tirets »* → *« il fallait la sortir d'entre le sujet et son verbe »*), ce qui rend les deux crans compatibles sans toucher à aucune longueur. **Le prompt, lui, n'a pas été amendé** : c'est une source, et elle n'est pas à moi. *(constaté pendant `vgen1`)*

- **La Synthèse reste hors d'atteinte de la fabrique, et ce n'est pas un oubli de la vague.** Elle ne se mesure que par le mode `restituer` (204 routes, toutes `restituer`) ; la fabrique ne produit que du `composer`. Les 89 exercices génériques de `vgen1` couvrent donc Structure, Questionnement, Expression et Argumentation, et **zéro Synthèse**. Voir la mémoire `project_banque_dimensionnement` : six `paragraphe` méso en `restituer` suffiraient à clore sa calibration.

- **Les crans de production (2, 6, 8) n'ont aucun exercice générique.** Ils ne portent pas d'observable, ne se fabriquent qu'une fois par objet **et par genre**, et se demandent à part. Les 16 qui existent sont tous accrochés à des sujets `cours: notions`, donc écartés du vivier comme les autres. Une vague `v-prod-gen` les rouvrirait — `prepare-vague.py v-prod-gen --objets … --crans 2 6 8`, en pensant au `genre` que les trois objets terminaux exigent.

- ⭐ **L'ÉCHÉANCE D'UN EXERCICE ASSIGNÉ EST INVISIBLE À L'AGENDA DE L'ÉLÈVE, et le lot qui la lui montrerait n'existe pas.** `utils/calendrier-evenements.ts` ne lit **jamais** `exercices_depots` : ses sources sont les Fragments, Quazian, Codex, Aletheia et les événements partagés. Or `exercices_depots.echeance` est **non nulle et réelle**, et l'écran de la semaine *(`/eleve/semaine`, C6-L2)* l'affiche désormais par exercice. **Un élève qui ouvre son Agenda ne voit donc pas la seule échéance hebdomadaire que le routeur lui pose.** ⚠️ *Constaté par C6-L2, qui n'y a pas touché : le calendrier n'est dans son périmètre à aucun titre.* ⛔ **Ce n'est ni `C6-L3` ni `C4-L12` : c'est le module Calendrier, et aucun lot de la rentrée ne le rouvre.**

- ⚠️ **Deux routes élève jettent un `TypeError` à chaque requête anonyme, et la redirection part quand même.** `app/eleve/page.tsx` et `app/eleve/calendrier/page.tsx` écrivent `user!.id` : sur une requête sans session — un robot, un lien froid, un préchargement —, l'assertion jette **avant** que le layout n'ait redirigé. Le visiteur reçoit bien son **307**, donc *rien n'est cassé* ; ce qui se remplit est le **journal du serveur**, qui devient bruyant là où il devrait être lisible. ⭐ **Le bon patron est à deux pas** — `app/eleve/moi/page.tsx` fait `if (!user) redirect('/login')` —, et `app/eleve/semaine/page.tsx` (C6-L2) le reprend. *Deux lignes, deux fichiers ; hors périmètre de C6-L2, qui n'a corrigé que le sien.*

- ⚠️ **Le domaine du compteur `aide_consommee` refuse `fiche_de_competence`, et la fiche a désormais un écran.** `C4-L3` a fermé le domaine le 22/08 **précisément parce que la fiche n'avait pas d'écran** *(`utils/deroule/depot.ts`, éprouvé par `scripts/recette/deroule-c4l3.mjs`)*, alors que le `01-routeur.md` §11 compte pourtant *« les dépliages de **la fiche** et les relectures »*. ⭐ **C6-L2 lui en a donné un** — `/eleve/moi/competences` —, **mais elle s'y consulte HORS DÉPÔT** : il n'y a rien à quoi rattacher un compte, et le §11 déclare lui-même sa définition *« provisoire »*. ⛔ **C6-L2 a constaté sans rouvrir.** *La question est de source, pas de code : le §11 veut-il compter une consultation qui n'appartient à aucun exercice ?*

## ⭐ Décisions de Louis du 28/08, en clôture de la relecture des crans de production

- **`mot` AUX CRANS 6 ET 8 — FERMÉ PAR EXCEPTION, ET À ROUVRIR.** *« Ce sera un chantier à rouvrir un jour. Pas aujourd'hui. »* Le partage co-texte/fonction donnerait mécaniquement *« Voici une phrase où un mot manque. Écris-le »*, et **ce n'est pas l'exercice voulu** : ce que le cran 8 devrait demander, c'est **le concept qui se tient derrière quelque chose**. ⛔ **L'objet lui-même est à redéfinir avant qu'on écrive son geste** — Louis dit n'être pas au clair sur ce qu'est « le mot » à ce cran. **Condition de reprise : une séance de conception sur l'objet `mot`**, qui dira ce qu'il est quand rien n'est servi. *(relevé pendant `vgen1`, 28/08)*

- **`reference` AUX CRANS 6 ET 8 — FERMÉ PAR EXCEPTION, ET LE NŒUD EST RÉEL.** *« Je ne vois pas de sortie pour le moment. »* ⚠️ **Les deux branches sont mauvaises, et c'est ce qui rend la question intéressante** : servir l'auteur et sa thèse en co-texte, c'est **servir la Connaissance que l'objet mesure** ; ne rien servir, c'est l'exercice vide d'aujourd'hui *(« Écris la référence pour le sujet posé plus haut »)*. Une troisième voie a été esquissée et non retenue — **servir l'argument auquel la référence doit s'attacher**, l'élève apportant l'auteur : la Connaissance resterait mesurée, mais le cran 8 deviendrait très dur. **Condition de reprise : qu'une troisième branche apparaisse, ou qu'on accepte l'une des deux.** *(relevé pendant `vgen1`, 28/08)*

- ⛔ **OÙ S'ÉCRIT UNE EXCEPTION DE CRAN — PAS TRANCHÉ.** Le `02-` §6 B dit que le professeur élit le cran *« sans aucune restriction »*. Fermer deux couples `objet × cran` demande donc soit d'inscrire les exceptions au `02-` §6 B, soit de les porter à `exclusions_parcours[]` déclaré par le type. **C'est une décision de forme, et elle conditionne les deux fermetures ci-dessus.** *(relevé pendant `vgen1`, 28/08)*

- ⭐⭐ **L'INVERSION QUE LA RELECTURE DU 28/08 A RENDUE VISIBLE.** Les trois points de Louis ne frappent pas les mêmes exercices, et **ce n'est pas celui qu'il a le plus travaillé qui compte le plus** : les **48 exercices de production** qu'il a relus un par un sont **tous non servables** *(sujets `cours: notions`)* et n'atteindront aucun élève ; en revanche **30 des 89 exercices servables** de la vague `vgen1` sont aux crans aveugles 7 et 9, **sans aucune réponse attendue** *(son point 1)*, et **28 de leurs cas font localiser un passage sans jamais dire quoi écrire** *(son point 2)*. **Ce sont ces deux points-là qui touchent la rentrée**, et aucun des deux n'est encore tranché. *(mesuré le 28/08)*

- ⭐ **PERSONNE NE PEUT CHANGER SON MOT DE PASSE — ni le professeur, ni les élèves.** *(Demandé par Louis le 28/08.)* Le dépôt porte la connexion *(`app/login/`)*, l'invitation par lien *(`app/auth/confirm/route.ts` + Resend)* et la finalisation d'inscription *(`/finaliser-inscription`)* — **mais aucun écran ne permet de CHANGER un mot de passe une fois le compte ouvert**, et aucun ne permet d'en demander un nouveau quand il est oublié. ⚠️ **Deux besoins distincts, et ils n'ont pas la même urgence** : *(a)* **le changer quand on le connaît** — un écran sous « Moi » côté élève et dans l'en-tête côté professeur, `supabase.auth.updateUser({ password })`, qui exige une session valide ; *(b)* **le récupérer quand on l'a perdu** — `resetPasswordForEmail`, un courriel Resend, et une cible qui peut réutiliser `/auth/confirm` *(le type `recovery` est déjà accepté par la route, qui prend un `EmailOtpType`)*. ⛔ **Sans (b), un élève qui oublie son mot de passe n'a d'autre recours que le professeur** — et à quatorze comptes en production, cela arrivera. ⭐ *La brique existe côté Supabase ; ce qui manque est l'écran, le courriel et la cible.* ⚠️ **Et la policy self-service de `profiles` reste morte** *(`07-` §1.3)* : changer un mot de passe passe par `auth.users`, jamais par `profiles` — les deux ne se confondent pas.

## ⭐⭐ CANDIDAT DE LOT — « ce que le routeur a laissé derrière lui » (relevé le 28/08 par C6-L2)

> **Un lot complet, pas la réouverture d'un ancien** *(décision de Louis, 28/08)*. Les cinq items
> ci-dessous ne sont pas cinq oublis épars : **ils sont tous du même côté du même mur** — le moteur
> a été écrit et branché, et ce qui manque est **ce qui le rend PRODUCTIF et ce qui rend son état
> LISIBLE**. ⚠️ **Le premier est daté : il tombe le lundi 2026-09-14.**

1. ⛔⛔ **LA BASCULE DE `profil_provisoire` N'A AUCUN ÉCRIVAIN DE PRODUCTION, ET AUCUN LOT NE LA PORTE.**
   `cloturerLaCalibrationDesEleves` *(`utils/moteur/etat-serveur.ts`)* existe — `C4-L12` a écrit la
   fonction — mais **son seul appelant est `scripts/recette/routeur-c4l12.mjs`**. ⚠️⚠️ **Et « clôture
   de la calibration » n'apparaît NULLE PART dans le `07-Implementation.md`** *(vérifié le 28/08 :
   le mot vit au `01-routeur.md` §4 et §9, à l'`Annexe-routeur`, au `CONTEXTE` et à deux prompts de
   session — **jamais dans le document qui distribue le travail**)*. **La règle est écrite en
   entier, personne n'est chargé de l'exécuter.**
   ⛔ **Conséquence, et elle est totale** : `profil_provisoire` est **VRAI sur les 149 lignes de
   production**, et le `01-` §9 lie deux choses à ce drapeau — *« tant qu'il est vrai, **aucune
   lettre ne s'affiche ET aucune escalade ne se déclenche** »*. Sans écrivain, **aucun élève ne
   verra jamais de lettre, et l'escalade ne partira jamais**, quels que soient les interrupteurs.
   ⚠️ **L'ÉCHÉANCE EST CALCULABLE** : `SEMAINES_SEGMENT_1 = 1` + `SEMAINES_SEGMENT_2 = 2`, semestre
   ouvert le 24/08 → **la clôture tombe le lundi 2026-09-14**.
   ⭐ **Et le §9 dit tout ce qu'il faut faire ce jour-là** : chaque lettre jugée UNE fois, elle
   reste par défaut, 2 confirmations sous → −1 palier, 2 au-dessus → +1, jamais plus d'un palier,
   l'asymétrie des sondes tient, la compétence sans ancre garde son régime, la compétence sans
   lettre n'en reçoit pas ici. **Rien n'est à décider : tout est à brancher.**
   ⭐ *Piste de forme* : **se greffer sur le cron du lundi** *(`/api/assiduite/hebdo`, 9 h 30)*,
   comme `C4-L12` l'a fait — le `07-` §2 interdit déjà un second déclencheur sur la clé
   (élève × cycle), et celui-là tourne déjà le bon jour.

2. ⛔⛔ **LE FILTRE DES NOTIONS N'EST PAS ÉCRIT, ET C'EST LUI QUI TIENT TOUT LE ROUTEUR FERMÉ.**
   `utils/moteur/vivier.ts` le dit en toutes lettres : un matériau `cours_etat = 'notions'` est
   **écarté** avec le motif `cours_par_notions_non_lu` — *« la couche 4 ne le lit pas encore […]
   l'intersection est **le premier geste de C4-L12** »*. **`C4-L12` a été joué et n'a pas écrit ce
   geste.** ⚠️ **Mesuré en PRODUCTION le 28/08** : `exercices_sujets` porte **91 lignes — 89 en
   `notions`, 2 en `aucun`** —, `exercices_textes` **2 lignes en `aucun`**, et
   `exercices_sujets_cours` / `exercices_textes_cours` **0 rattachement**.
   ⛔ **Donc le cron du lundi tournera et ne posera RIEN** : le vivier rejette 89 sujets sur 91, et
   les deux autres ne sont servables à aucune condition. ⭐ **La brique existe déjà** —
   `notionsPartagees()` *(`utils/fabrique/notions.ts`)*, écrite et éprouvée ; il manque
   l'intersection avec les notions des **cours VUS**.
   ⭐ **Et il y a une voie rapide qui ne demande pas ce filtre** : la vague `vgen1` porte
   **17 sujets `cours: generique`** dans `generateur/banque/banque.json` *(dépôt de conception,
   438 exercices)*, et `generique` **passe le vivier sans condition**
   *(`if (m.coursEtat === 'generique') continue`)*. ⛔ **Ils ne sont pas importés en base.**
   *Les importer rendrait le routeur productif immédiatement, sans écrire une ligne de filtre.*

3. ⛔ **`ilYAStagnation` N'A TOUJOURS AUCUN APPELANT** *(`utils/routeur/observables.ts`)*, et le
   motif est structurel : sa **seconde** condition est la **valeur de ciblage NON PLAFONNÉE
   immobile**, qui *« ne se stocke jamais »* *(`07-` §1.3)* et **se recalcule au cycle**. Tant que
   le moteur ne l'écrit pas quelque part, aucun lecteur ne peut la comparer d'un cycle à l'autre.
   *`C6-L2` lui passe `false` en dur, ce qui la rend toujours fausse : son écran ne dira jamais
   « stagnation » à tort, il dira « en cours de travail ».*

4. ⚠️ **`aProgresse: false` RESTE UN REFUS D'AFFIRMER, ET IL EST BIEN DÉPOSÉ** *(`C4L12-23`,
   décoché)*. ⛔ **Ne pas le redéposer.** ⭐ Mais sa condition de reprise est **la même que celle du
   point 2** : une fenêtre d'évidence remplie suppose que le routeur ait posé quatre exercices
   d'une même compétence chez un même élève. **Il tombe avec le filtre, pas avant.**

5. ⚠️ **UN COMMENTAIRE PÉRIMÉ, D'UNE LIGNE** : `utils/moteur/cycle-serveur.ts` accompagne
   `aProgresse: false` de *« Sans instrument branché, on ne l'affirme pas »* — **faux depuis que
   `C4-L10` a ouvert les six compétences le 23/08**. Le blocage n'est pas l'instrument, **c'est la
   mesure**. *(`C6-L2` ne l'a pas corrigé : le fichier était sous la main d'une autre séance.)*

> ⭐ **CE QUI LIE LES CINQ, ET POURQUOI ILS FONT UN LOT** : le point 2 débloque les points 3 et 4
> *(il faut des mesures pour qu'une fenêtre se remplisse)*, et le point 1 débloque l'affichage de
> tout ce que les autres produisent. **Joué dans l'ordre 2 → 1 → 3, le lot rend le dispositif
> visible d'un coup.** ⚠️ Et il lève **trois restes de recette de `C6-L2`** au passage —
> `C6L2-24`, `-27` et `-28` —, qui attendent tous que le routeur pose sa première semaine.

- ⭐ **LES DIMENSIONS DITES À L'ÉLÈVE SONT « CLUNKY », ET LE DÉFAUT EST DE FORME, PAS DE FOND** *(constaté par Louis le 28/08, en regardant les écrans de `C6-L2` — c'est un défaut que seul l'œil pose, sur une liste servie d'un coup)*. Les **51** `competences_correspondance.dimension_eleve` sont justes une par une ; **c'est LUES EN LISTE qu'elles se cassent** — et `C6-L2` les sert désormais en liste à trois endroits *(le récapitulatif de la semaine, le bilan, la fiche de compétence)*, là où le retour n'en citait qu'une à la fois. ⚠️ **Trois patrons se mélangent, et c'est le mélange qui accroche l'œil, pas la longueur :** ⭐ *(a)* **des GROUPES NOMINAUX**, qui sont la bonne forme — « la clarté de tes phrases », « le cap du devoir », « les mots savants » ; ⛔ *(b)* **des QUESTIONS ou des ALTERNATIVES**, qui sont en réalité **la colonne d'à côté** — « ta problématique, ou celle du sujet ? », « rassembler, ou ajouter », « recopier, ou reformuler », « fondre, plutôt qu'aligner », « tes concepts : au travail, ou posés là », « tes références : au travail, ou posées là » : *le §5 des fiches porte TROIS colonnes — la dimension, **la question**, les réponses fermées — et dans ces six cas c'est la QUESTION qui a été recopiée dans la case de la dimension* ; ⛔ *(c)* **des VERBES À L'INFINITIF** — « interroger ta problématique », « tenir ta nouvelle problématique », « dire ce que le texte dit » —, qui cassent le parallélisme dès qu'une puce les suit. ⚠️ **Et six dépassent 45 caractères**, dont une à **66** — « les liens entre justification et conclusion, écrits noir sur blanc » —, dans une puce qui en attend une ligne. ⭐⭐ **OÙ ÇA SE CORRIGE, ET CE N'EST NI LA BASE NI LE DÉRIVEUR** *(vérifié : `dimension_eleve` n'apparaît **zéro fois** dans `derive-instruments.py` et `derive-doctrine.py`)* : la source est la **colonne « la dimension, dite à l'élève » du §5 de `competences/<nom>.md`**, lue par `utils/fabrique/fiche-competence.ts` et versée en base **par la fabrique** *(C4-L8)*. **On corrige la fiche, on redépose ; on ne touche jamais la table.** ⚠️ **Trois conséquences à peser avant de le faire.** *(1)* **Redéposer MONTE la version de la fiche**, et les versions de prod sont déjà en avance sur celles du bac à sable *(expression 3.2/3.1, argumentation 4.3/4.1…)* : la correction doit se jouer **des deux côtés**, ou l'écart se creuse. *(2)* **QUATRE écrans lisent cette colonne** — « se juger », le rappel du temps 1, le retour du temps 4, et les trois écrans de `C6-L2` : *une seule source, donc une seule correction, mais elle se voit partout à la fois.* *(3)* ⛔ **RR4 ne bouge pas** : ce sont des dimensions **en langue élève**, jamais un code d'observable, jamais un seuil — *« la coupure passe entre le barème et ce qui doit se trouver dans une copie »* *(`01-` §12)*. ⭐ *Une règle de rédaction en une ligne suffirait à tenir les trois patrons ensemble : **un groupe nominal, commençant par un déterminant, sous quarante-cinq caractères, sans virgule** — et la question va dans la colonne de la question.*

- ⚠️ **LE BILAN DE LA SEMAINE REND UN TITRE DE COMPÉTENCE **NU** QUAND RIEN N'A ÉTÉ MESURÉ**
  *(vu à l'œil au smoke élève de `C6-L3`, 28/08)*. Sur l'écran `/eleve/semaine`, au second temps,
  la carte du bilan affichait **« Argumentation »** seul, sans une ligne dessous : les quatre listes
  de `bilanDeLaCompetence` — `bonneSurprise`, `angleMort`, `confirme`, `connu` — étaient vides,
  et `app/eleve/semaine/page.tsx` rend le nom de la compétence **avant** ses conditionnelles.
  ⭐ **Le bandeau du dessus dit bien ce qui manque** *(« 3 de tes copies n'ont pas encore été
  corrigées »)*, donc l'écran ne ment pas — **mais un titre suivi de rien est un moignon**, et il se
  lit comme une phrase qu'on aurait coupée. ⛔ **Ce n'est pas de `C6-L3`** : le bilan est de
  `C6-L2`, clos, et le prompt de `C6-L3` interdit d'y toucher *(« tu ne touches pas au
  récapitulatif ni au bilan »)*. ⭐ **La réparation tient en une condition** : ne rendre le bloc
  d'une compétence que si l'une des quatre listes porte quelque chose — ou lui donner sa phrase,
  comme `C6-L2` l'a fait partout ailleurs. **Condition de reprise : n'importe quel passage sur
  l'écran de la semaine ; le cas se reproduit dès qu'une copie du cycle n'est pas encore mesurée.**

- ⚠️ **`exercices.bonus` N'A PLUS AUCUN LECTEUR, ET C'EST UNE DÉCISION DE CONCEPTION QUI RESTE À
  PRENDRE** *(depuis `C6-L3`, 28/08)*. La marque du `01-` §5 vit désormais au **journal**
  *(`routeur_decisions.bonus`)* — le grain du fait est (élève × exercice), et `exercices` est la
  banque, qui se ressert entre élèves. La colonne de l'instance reste : le **format d'import** la
  connaît et la **signale** *(`08-` §7.3)*, mais **plus rien ne la lit** — la chaîne lit la
  décision. ⛔ **Ni le retrait de la colonne ni celui de son contrôle d'import ne sont un geste de
  lot** : le `07-` §1.1 la déclare, et son sort se tranche à la conception. *La phrase qui dit ce
  qu'elle ne peut pas porter est écrite au `07-` §1.1 depuis le 28/08.*

- ⚠️ **LE `type_pedagogique` D'UNE CLASSE NE SE MODIFIE PAS APRÈS SA CRÉATION** *(constat de Louis,
  29/08)*. Or c'est lui, et lui seul, qui donne son **parcours** à l'élève — `lireLesInscriptions`
  le lit sur `classes.type_pedagogique`, « à valeurs fermées, JAMAIS sur `classes.filiere` »
  (`utils/routeur/donnees.ts`). ⛔ **Une classe créée sans son type est donc définitivement muette
  pour le routeur** : ses élèves n'ont aucun parcours, `budgetDeLEleve` les refuse en amont avec
  `ParcoursVide`, et **rien ne leur est jamais servi**. Le seul recours aujourd'hui est de créer une
  seconde classe et d'y ré-inscrire tout le monde — ce que Louis a dû faire en bac à sable
  (`THLP` type nul → `THLP2` type `hlp`). ⭐ **Deux réparations possibles, et elles ne s'excluent
  pas** : rendre le champ modifiable à l'écran de la classe *(le changer rétroactivement change
  l'éligibilité aux exercices déjà servis — c'est ce qu'il faut arbitrer)*, et **refuser la création
  d'une classe sans `type_pedagogique`**, qui est le vrai défaut : rien à l'écran ne dit
  aujourd'hui que ce champ décide de tout.


## ⭐ La PORTÉE d'un exercice commun à une classe — la rendre CHOISIE, plutôt que devinée (28/08/2026)

*Déposé à la clôture du correctif `C6L3-30`, sur décision de Louis : « fais (a) tout de suite, pose
(c) dans les idées ».*

**Ce qui est fait aujourd'hui, et qui est un arbitrage, pas une règle de source.** Depuis le 28/08,
`constituerLeVivier` écarte une instance dont le `classe_id` désigne une classe où l'élève n'est pas
inscrit — motif `classe_autre`, `utils/moteur/vivier.ts`. Cela ferme le défaut que la couture de
`C6-L3` avait trouvé *(le dépôt existait, l'élève ne le voyait sur aucun écran, et l'assiduité le
comptait au dénominateur)*, **et cela tranche à la place de la source** : ⚠️ **le `07-` §1.1 déclare
`classe_id` « NULLABLE » et ne dit nulle part ce qu'il VEUT DIRE.** Le filtre pose donc une lecture —
*l'instance qu'un professeur a donnée à une classe reste à cette classe* — qui est défendable et qui
n'est écrite nulle part.

**L'idée : la portée devient une DÉCISION, prise au moment où le professeur a l'information.**
À l'assignation *(`app/prof/conception/[id]/Assignation.tsx`, aujourd'hui trois champs : la classe,
la fenêtre début, la fin)*, une case de plus — **« cet exercice reste à cette classe »** contre
**« il peut resservir ailleurs »**. Le vivier lit la case au lieu de deviner.

⭐ **Rien de ce qui est écrit aujourd'hui n'est à défaire** : le filtre posé le 28/08 **est** cette
idée avec le réglage câblé sur *« reste à cette classe »*. Le jour où la case existe, c'est la même
ligne de `constituerLeVivier` qui lira la colonne au lieu de la constante — le commentaire du filtre
le dit sur place.

**Ce que ça coûte** : une colonne *(ou une convention sur `classe_id`)*, une case à l'écran, et la
ligne du filtre. **Ce que ça rapporte** : la question cesse d'être tranchée par le code, et un
exercice conçu pour une classe peut resservir à une autre quand c'est ce qu'on veut — mesuré au
moment du dépôt de l'idée, le vivier de bac à sable y perdait **37 couples (élève × instance) sur
7 531**, soit **0,49 %**, et la production **zéro** *(ses 247 instances de maison servables portent
toutes un `classe_id` NULL)*.

⛔ **Ce que l'idée ne touche pas, et il faut le savoir avant de la rouvrir** : le `classe_id` vit sur
l'**instance**, jamais sur le matériau — `exercices_sujets`, `exercices_textes`,
`exercices_materiaux` et `exercices_demonstrations` n'en portent aucun. Donner un sujet à une classe
ne réserve donc rien : en production, **31 sujets portent 251 instances, dont 23 sur le même sujet**.
Et une passation `lieu = 'classe'` est déjà hors du vivier par le motif `lieu_classe`, avant toute
question de portée.

---

## ⛔⛔ UN DÉFAUT, PAS UNE IDÉE — `ecrireLEtatApresMesure` perd TOUT un lot de lettres, EN SILENCE (29/08/2026)

**Relevé au peuplement du profil d'Élo (décor d'écran, sandbox), et le défaut est EN PRODUCTION.**

`utils/moteur/etat-serveur.ts:310-323` construit **UN SEUL tableau** `lignesNiveau` pour **toutes**
les compétences qu'un dépôt vient de toucher, puis l'envoie en **un `upsert` en lot**. Or
`ligneDeNiveau` (`utils/moteur/etat.ts:259-282`) produit des **jeux de clés différents** :

- compétence **sans** lettre → ajoute `lettre_initiale` + `lettre_initiale_at` → **9 clés** ;
- compétence **avec** lettre → ne les ajoute pas → **7 clés**.

Et `verifierLesLignesDeNiveau` (`etat.ts:224-249`) **LÈVE** sur des clés hétérogènes — à raison :
*« un `upsert` en lot les unifie, et les manquantes partiraient à NULL »*. Le `catch` de
`etat-serveur.ts:322` range l'incident dans `bilan.erreurs` et met `lettresEcrites = 0`.

⛔ **Conséquence : dès qu'un même dépôt touche une compétence DÉJÀ LETTRÉE et une compétence NEUVE,
le lot entier est perdu — les deux écritures, pas seulement la neuve.**

⛔⛔ **ET C'EST SILENCIEUX.** `resumeBilan` (`chaine.ts:1550-1557`) n'incorpore les alertes que via
`motifDuRetourManquant`, qui ne s'exécute **que si `!b.retourEcrit`** et ne retient que les alertes
contenant le mot « retour ». L'alerte `« état après mesure : charge de niveaux refusée : … »` ne
remplit ni l'une ni l'autre condition : le message de job affiche *« … retour écrit, 6 appel(s),
64 s, 2 écartée(s) … »* et **pas un mot de la perte**.

### La preuve, en PRODUCTION — 13 élèves sur 13

Le 26/08, l'essai diagnostique (3 compétences toutes neuves, clés homogènes) a écrit ses lettres. Le
27/08, l'explication a mesuré `expression` (**déjà lettrée**) **+** `synthese` (**sans lettre**) :

```sql
select competence, count(*) from competences_mesures group by 1;
--  argumentation 53 | expression 66 | structure 52 | synthese 13
select competence, count(*), count(lettre) from competences_niveaux group by 1;
--  argumentation 52|52 | expression 52|52 | structure 51|51   ← AUCUNE ligne synthese
```

**13 mesures de synthèse, 0 ligne de niveau `synthese`** — et le niveau `expression` n'a pas bougé
non plus : les deux écritures sont parties ensemble, exactement comme la garde le prédit.

### Ce qui le corrigerait

`poserLeColdStart` (`etat-serveur.ts:456-466`) **groupe déjà** ses lignes `parForme` précisément pour
éviter ça. **`ecrireLEtatApresMesure` ne le fait pas.** Le correctif est le même geste : grouper par
jeu de clés avant d'envoyer, un `upsert` par groupe.

⚠️ **Et le second défaut est celui qui coûte le plus** : même corrigé, le bilan doit **dire** qu'une
charge de niveaux a été refusée. Une perte de lettres qui ne remonte nulle part est une perte qu'on
ne découvre qu'en comptant les lignes, des semaines plus tard.

⛔ **Le décor d'Élo contourne le défaut, il ne le corrige pas** : `scripts/recette/decor-eleve-elo.mjs`
écrit `competences_niveaux` **une compétence à la fois** et vérifie par requête. Le correctif
applicatif reste entier.

---

## ⭐ RENTRÉE 2027 — séparer `vers` de la MARQUE, dans le crible de l'Argumentation

*Variante écartée sciemment le **29/08/2026**, au moment de payer la dette D2. Elle est meilleure ;
elle n'était simplement pas payable dans la fenêtre qui restait. **Décision de Louis : rentrée 2027.***

**CE QUI A ÉTÉ FAIT À LA PLACE (option A, jouée)** — la fiche `competences/argumentation.md` passe en
**4.4** et son bloc `# SORTIE` de P2 déclare enfin les quatre tests :

```diff
-        "test": "distinction | source",
-        "vers": "implicite | cosmetique",
+        "test": "distinction | source | sens | contour",
+        "vers": "implicite | cosmetique | ambigu | vague",
```

**CE QUE ÇA LAISSE DE BANCAL, ET C'EST L'IDÉE.** Le champ `vers` veut désormais dire **deux choses
différentes** selon le test :

| test | ce que `vers` signifie | le statut de l'unité |
|---|---|---|
| `distinction`, `source` | **vers quel statut** l'unité descend | il **change** |
| `sens`, `contour` | **quelle marque** l'unité reçoit | il **ne change pas** |

Le prompt le dit lui-même — *« explicite marquée "ambigu" (test 3 — le statut ne change pas) »* — et
le code le sait : `TESTS_TERMES` d'un côté, `TESTS_CRIBLE` de l'autre, et `cible.marques.push(vers)`
au lieu de `cible.statut = vers`. **Un nom de champ qui ment sur la moitié de ses valeurs.**

**LA FORME PROPRE (option B)** — un champ à part, et `vers` retrouve son seul sens :

```diff
         "test": "distinction | source | sens | contour",
         "vers": "implicite | cosmetique",
+        "marque": "ambigu | vague",
```

⛔ **CE QUE ÇA COÛTE, ET POURQUOI CE N'ÉTAIT PAS POUR AOÛT 2026.** Trois fichiers, pas un :
`competences/argumentation.md` · `copies-tests/argumentation/code.py` *(la table `TOUS_TESTS`, le
repli `TEST_PAR_VERS`, le garde-fou de contradiction `vers` ↔ `test`, et **trois autotests** qui
écrivent aujourd'hui `{"test": "sens", "vers": "ambigu"}`)* · et
`utils/chaine/branchements/argumentation.ts`, **qui doit rester identique au module** — c'est son
« fait quand ». **Donc une modification du CALCUL, donc un acte de calibration**, quand l'option A
n'était qu'une omission de schéma que le code savait déjà lire.

⚠️ **ET LA FENÊTRE ÉTAIT DE DEUX JOURS.** Le 29/08, la mesure a montré le défaut **déjà tiré en
production** — `garant_ambigu` et `garant_vague` à **0 sur 53 mesures / 53**, 52 élèves, zéro
variance — et le segment 2 de calibration ouvrait le **lundi 31/08**. Avec une fenêtre d'évidence de
**4** et une seule mesure par élève, corriger avant lundi suffisait à ce que les mesures fautives
**sortent d'elles-mêmes** de la fenêtre. Une refonte à trois fichiers ne tenait pas dans ce délai.

⭐ **CONDITION DE REPRISE : hors année scolaire**, quand aucune calibration ne court — donc **été
2027**. Le geste est mécanique et entièrement écrit ci-dessus ; ce qu'il faut, c'est le droit de
bouger `version_calcul` sans invalider un corpus.

⚠️ **Et si la même question se pose ailleurs** : c'est un patron, pas un cas isolé. Tout crible qui
mélange « requalifier » et « marquer » dans un seul champ de sortie aura le même défaut de nom.
