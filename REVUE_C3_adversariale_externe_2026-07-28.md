# Revue adversariale externe — SPEC C3 (Exercices & Compétences), v3.1 du 28/07

> Périmètre de lecture : `SPEC_C3_exercices_competences.md` **seule**. Aucun document de
> `palimpseste-conception/`, aucun autre fichier du dépôt, aucun code n'a été ouvert.
> Hypothèses de chiffrage : ~70 élèves, ~20 cycles formatifs/élève/an, copie ≈ 500 mots,
> 3 photos par version, 3 compétences par exercice formatif (1 primaire + 2 silencieuses).

---

## G1 — La vf au manuscrit oblige à recopier, et la recopie détruit les temps 5 et 6

**Où** · §2 (formats verrouillés, « manuscrit → photos → OCR, **v1 ET vf** ») croisé avec §3.5,
§3.6 et §6 (`delta_v1_vf`, `exercices_squelettes` par version).

**L'attaque** · Le temps 5 est « la vf, guidée par **LE** geste de révision (un seul) », et §5
règle 5 impose « UN geste concret et faisable **en 10 minutes** ». Sur écran, retravailler un
paragraphe coûte 10 minutes. Sur papier, produire une *vf photographiable* impose de **recopier
toute la copie** : pour 500 mots, 20 à 25 minutes de transcription mécanique à valeur pédagogique
nulle — soit deux à trois fois le coût du geste lui-même. Semaine 4, un élève rationnel arrête de
faire les vf, ou photographie seulement la feuille annotée. Les deux issues cassent le système :
(a) sans vf, le temps 6 — le « retour final », celui que l'auteur juge le plus puissant — ne se
déclenche jamais ; (b) avec une feuille annotée, le squelette de la vf n'est plus comparable à
celui de la v1, donc `delta_v1_vf` et « **ce qui n'a pas bougé, cité** » deviennent faux. Pire, si
l'élève recopie : la recopie change *tout* le texte de surface (ponctuation, coupures, fautes
recopiées ou corrigées au passage), donc le diff des deux squelettes est dominé par le bruit de
recopie et d'OCR — le retour final félicitera des « autocorrections spontanées » qui sont des
artefacts de transcription. La justification de §2 (le bac s'écrit à la main ; anti-copier-coller)
porte sur la **v1** ; elle ne porte pas sur la vf. Et la spec se contredit elle-même :
**M1 dit que les observables ne viennent que de la v1** — la vf ne mesure rien, donc son mode de
saisie n'a aucun enjeu de validité de mesure.

**Gravité** · `BLOQUANT-GEL` (§2 est déclaré verrouillé et le schéma §6 en dépend).

**Correctif minimal** · Une ligne dans §2 : **la vf se saisit au clavier** (l'élève recopie dans
un champ le passage retravaillé, ou tout le texte s'il le souhaite), la v1 reste manuscrite. Le
diff v1/vf se fait alors transcription-OCR ↔ texte propre, avec une seule source de bruit au lieu
de deux. Si le manuscrit de la vf est jugé non négociable, alors supprimer `delta_v1_vf` du calcul
et retirer de §3.6 « ce qui n'a pas bougé, cité » — on ne peut pas garder les deux.

---

## G2 — Expression mesurée sur une transcription : le biais porte précisément sur ce qu'on mesure

**Où** · §2 + §10.4 + §10.8 (« prompt de transcription strictement littéral ») + §1.1 (Expression
au référentiel).

**L'attaque** · §10.8 a identifié le risque mais pas sa forme la plus grave, et le correctif qu'il
propose (« transcris exactement, fautes comprises ») ne peut pas fonctionner. En cursive
d'adolescent, les traits **structurellement ambigus** sont exactement ceux que mesure Expression :
`-é / -er / -ez`, `-ai / -ais / -ait`, accents absents ou flottants, `s` final d'accord, pluriels
en `-nt`, virgules confondues avec des amorces de lettre. Face à une ambiguïté graphique, un modèle
de vision tranche par modélisation du langage — c'est-à-dire **vers la forme grammaticalement
correcte**. Aucune instruction ne le corrige, parce que le modèle ne « choisit » pas de corriger :
il lit. Conséquence mécanique et *orientée* : les fautes d'accord et d'accentuation disparaissent
au taux le plus élevé chez les élèves les plus faibles (écriture la moins nette, fautes les plus
nombreuses), donc Expression est **surestimée, et surestimée davantage en bas d'échelle** — ce qui
comprime l'échelle et détruit le pouvoir discriminant de la compétence. Scénario : deux élèves,
l'un fait 4 fautes d'accord, l'autre 18 ; après transcription il en reste 2 et 5 ; le routeur ne
cible plus Expression chez le second. Le banc proposé (« copies à fautes connues → transcription
fidèle ? ») **mesurera ce biais mais ne le corrigera pas** — et il le mesurera sur des copies dont
Louis connaît déjà le contenu, donc au mieux sur 10-20 copies non représentatives.

**Gravité** · `BLOQUANT-GEL` (le statut de recette d'Expression et les sources de mesure du
référentiel se décident à partir de là ; §2 rend le biais universel).

**Correctif minimal** · Écrire dans C3 : **Expression n'est jamais mesurée sur une production
transcrite**. Ses observables se prennent (a) sur les types `ecran`, (b) sur les ancres en classe
relues par le prof. Sur les productions manuscrites, ne conserver que les observables qui
survivent à la transcription (longueur et variété de phrase, connecteurs, lexique, reprises
anaphoriques) et déclarer les autres non mesurés — pas « mesurés avec bruit ».

---

## G3 — P1 : un squelette par copie ou un squelette par compétence ? Les deux sont écrits

**Où** · §0 (« l'IA extrait les faits de la copie… », singulier) et §3.3 (« comparaison avec **le**
squelette ») et §3.6 (« comparaison des **deux** squelettes v1 vs vf ») **contre** §6
(`exercices_squelettes` — par dépôt × version × **compétence** : `p1`, `p2`) et §10.2
(« 70 × 2 × (6+5) compétences × **2 phases** »).

**L'attaque** · Ce n'est pas une coquette : les deux lectures produisent des systèmes différents.
(a) **Coût et latence** : au diagnostic, P1 par compétence = 70 × (11 P1 + 11 P2) = **1 540 appels**
+ 140 transcriptions ; P1 mutualisé = **1 050 appels**, et surtout la copie n'est envoyée qu'une
fois au lieu de six (essai) et cinq (explication) — c'est un facteur ~5 sur les jetons d'entrée de
la phase d'extraction. (b) **Anti-halo** : un P1 « par compétence » reçoit forcément la grille de
la compétence, donc il extrait *en sachant ce qu'on cherche* — la propriété d'aveuglement
revendiquée en §0 est perdue, et deux extractions concurrentes peuvent citer le même passage de
façon incompatible. (c) **Temps 3** : « comparaison en code avec le squelette » suppose un objet
unique ; avec six squelettes, contre lequel compare-t-on ? (d) **Temps 6** : le diff « des deux
squelettes » devient un diff de six paires. Une session d'implémentation tranchera seule, et
tranchera probablement dans le sens du schéma (par compétence), c'est-à-dire dans le sens le plus
coûteux et le moins anti-halo.

**Gravité** · `BLOQUANT-GEL` (schéma figé demain, modèle de coût, propriété centrale de la mesure).

**Correctif minimal** · Trancher pour **un squelette par dépôt × version** (P1 unique, aveugle,
schéma de sortie unifié couvrant tous les observables), et **un P2 par compétence** lisant ce
squelette. Renommer la table `exercices_squelettes` (clé : dépôt × version) et sortir `p2` dans
`exercices_verdicts` (dépôt × version × compétence). Corriger §10.2 en conséquence.

---

## G4 — Une compétence non `evaluee` produit un cycle sans aucun retour

**Où** · §1.7 (statuts de recette) × §3.3 (« se juger **ne s'active que si** la compétence est
`evaluee` ») × §5 (le gabarit reçoit « **le verdict par observable** ») × §4 (le routeur cible des
compétences).

**L'attaque** · `mesuree_silencieusement` = « P1 stocké, **pas de verdict** ». Or le retour chaud
est construit *depuis* le verdict : règle 4 du gabarit exige « VOILÀ L'ERREUR… VOILÀ COMMENT FAIRE
MIEUX ({{LEVIER}} **fourni par le verdict**) ». Sans P2, pas de verdict, donc pas de {{LEVIER}},
donc **pas de retour**. Le cycle se réduit à : préparer → écrire → déposer → rien. Le temps 3 est
éteint (règle explicite), le temps 4 est vide, les temps 5 et 6 n'ont plus d'objet. Scénario du
9 septembre : les bancs du 24/08 ont validé 4 compétences sur 11 (plausible : les 5 de lecture sont
neuves et leurs ancres « restent à rédiger ») ; le routeur, qui ne filtre nulle part sur
`statut_recette` — aucune ligne de §4 ni de §9 ne le dit — continue à cibler les 7 autres ; un
élève sur deux rend un devoir manuscrit et reçoit un écran blanc. C'est le scénario le plus probable
de l'allumage, et il n'est traité nulle part.

**Gravité** · `BLOQUANT-GEL`.

**Correctif minimal** · Deux phrases dans §4 et §6 : (1) **le routeur ne cible que des compétences
`evaluee`** (les autres restent mesurées en arrière-plan sur les exercices choisis pour d'autres
cibles) ; (2) si aucune compétence de la famille n'est `evaluee`, le routeur bascule sur les
**exercices communs du prof** (coupe de repli §4) plutôt que de servir un cycle muet. Ajouter le
critère de recette correspondant en C4-L5 : « aucun dépôt ne peut atteindre l'état *retour attendu*
sur une compétence non `evaluee` ».

---

## G5 — Le statut de recette n'a pas de règle de décision : le 24/08, tout sera déclaré `evaluee`

**Où** · §1.7 (« l'état effectif se décide selon les bancs au 24/08 ») et §8 (« les bancs… hors
quota code »).

**L'attaque** · La spec construit un interrupteur à trois positions et ne dit ni **qui** le tourne,
ni **sur quoi**. Il manque : le nombre de copies du banc, la source du gold standard, le critère
chiffré de passage, et le défaut en cas de banc non tourné. Or le contexte rend le résultat
prévisible : le 24 août, un homme seul, à un jour de la rentrée, ayant passé trois semaines à coder
C4/C5/C6, doit décider si onze instruments sont valides. Sans seuil écrit à l'avance, la décision
se prendra « au ressenti », et le ressenti d'un auteur sur son propre instrument, sous pression de
date, dit toujours oui. Le chiffrage du banc lui-même n'est nulle part : pour un accord exploitable
il faut ~25 copies notées à la main par compétence ; 11 × 25 = **275 notations** à ~8-10 min =
**35-45 h**, en août, en plus de l'implémentation. Personne n'a écrit que c'était infaisable, donc
personne ne le coupera — on coupera silencieusement l'échantillon (5 copies) et le seuil
disparaîtra avec lui.

**Gravité** · `BLOQUANT-GEL` (c'est le seul garde-fou entre un instrument non validé et un verdict
affiché à un mineur ; il tient en un paragraphe).

**Correctif minimal** · Ajouter à §1.7 : « `evaluee` exige ≥ N copies bancées (N ≥ 20), accord à
±1 niveau sur ≥ 80 % **et** aucun biais systématique de sens ; à défaut de banc tourné, le statut
par défaut est `mesuree_silencieusement` ». Et : le prof note les copies du banc **avant** de voir
la sortie IA (sinon l'accord mesuré est un accord de complaisance).

---

## G6 — Aucune infrastructure de file dans le schéma, aucune idempotence : des lettres montent toutes seules

**Où** · §6 (liste des tables — aucune table de travaux), §9 C4-L4 (« 30 copies → 30 squelettes en
file **sans intervention** »), §10.1-10.2.

**L'attaque** · Le mot « file » apparaît trois fois (dépouillement, validation) et n'a **aucun
support en §6**. Sur Vercel + Supabase, la conséquence est connue d'avance : le dépouillement sera
écrit comme une route déclenchée à la remise ou par cron, elle dépassera la limite de durée
d'exécution après une poignée de copies, et sera relancée. Il n'y a ni table de jobs, ni compteur
de tentatives, ni clé d'idempotence, ni statut de traitement sur `exercices_squelettes`, ni
contrainte d'unicité sur `competences_mesures`. Le mode de panne est précis et silencieux : un
appel P2 expire côté client mais aboutit côté fournisseur, le retry écrit **une deuxième ligne de
mesure pour la même copie**. Or la montée de lettre est « 2 mesures sur 3 » : **un seul dépôt
dupliqué suffit à satisfaire la règle et à faire monter une lettre sans qu'aucun progrès n'ait eu
lieu**. Le bug n'est pas détectable dans l'écran C6-L1 (qui affiche « n / confiance » — n aura
simplement augmenté). Et il frappera le jour 1 : 70 copies × ~22 appels le même après-midi, c'est
exactement la charge qui déclenche les 429 et les retries.

**Gravité** · `BLOQUANT-GEL` (migrations additives possibles plus tard, mais C4-L1 est le premier
lot, et le garde-fou d'unicité doit exister **avant** la première mesure écrite).

**Correctif minimal** · Ajouter à §6 : (1) `exercices_jobs` (dépôt, version, étape, statut,
tentatives, `derniere_erreur`, `cle_idempotence`) avec réservation atomique et reprise ; (2)
**index unique** `(depot_id, competence, version)` sur `competences_mesures` et
`(depot_id, version)` sur les squelettes ; (3) un plafond de tentatives par dépôt et un état
`echec_definitif` visible du prof. Et corriger le critère C4-L4 : la cible réelle est **70 copies
× 2 exercices**, pas 30.

---

## G7 — `competences_niveaux` n'a pas de dimension cours : un élève TC+HLP n'a qu'une lettre

**Où** · §6 (`competences_niveaux` : `eleve_id`, `competence`, `lettre`…) contre §6
(`competences_mesures.provenance` = `tc`|`hlp`), §1.1 (« HLP : sans Problématisation d'écriture,
5 actives ») et §9 C6-L1 (« matrice **classe** × compétence »).

**L'attaque** · Les mesures sont taguées par cours, l'état affiché ne l'est pas. Un élève de HLP
suit aussi le tronc commun : ses mesures d'Argumentation viennent de deux cours aux exigences,
aux consignes et aux volumes différents, et s'agrègent en **une seule lettre**. Trois échecs
concrets : (a) la matrice C6-L1 est annoncée « classe × compétence » alors que la table sous-jacente
n'a pas de classe — le prof ouvrira la matrice HLP et lira des lettres partiellement produites par
du travail de TC ; (b) rien dans le schéma ne dit **quelles compétences sont actives pour un élève
donné** — la règle « HLP sans Problématisation » n'a aucun support (pas de table élève × cours ×
référentiel), donc soit l'écran affichera Problématisation à des élèves de HLP, soit la règle sera
codée en dur ; (c) `provenance` est un enum à deux valeurs figé sur l'organisation 2026-27 : ajouter
un troisième cours devient une migration d'enum au lieu d'une ligne.

**Gravité** · `BLOQUANT-GEL`.

**Correctif minimal** · Ajouter `classe_id` (ou `cours_id`) à la clé de `competences_niveaux`
(`eleve_id, classe_id, competence`), remplacer `provenance` par ce même `classe_id`, et poser une
table (ou une colonne JSONB sur la classe) déclarant **les compétences actives du référentiel pour
cette classe**. Trois colonnes, aujourd'hui ; sinon c'est une reprise de données en cours d'année.

---

## G8 — `duree_attendue_min` : la durée de rédaction ou celle du cycle ? Le budget hebdo en dépend d'un facteur 2

**Où** · §3 (« chaque type déclare sa `duree_attendue_min`, affichée à l'élève »), §4 (budget
hebdo « ex. 45 min », « le routeur remplit »), §4 « en faire plus » (« quota ~30 min/semaine
**décompté sur les durées attendues** »), §7 (T2 : « durée très inférieure à la durée attendue »).

**L'attaque** · Un seul champ sert trois fonctions incompatibles. Décompte du temps réel d'un cycle
complet, avec les hypothèses de la spec : préparer 5 + écrire 30 + photographier/déposer 5 +
se juger 5 + lire le retour 5 + geste de révision 10 + **recopie de la vf 20** (cf. G1) +
photographier 5 + retour final 5 = **~90 min**. Si `duree_attendue_min` désigne la rédaction (30),
le routeur loge « 45 min » de budget = 1,5 exercice → charge réelle **~135 min**, soit trois fois
le budget annoncé au prof et à l'élève. Le prof croit demander 45 min/semaine, l'élève en vit 135,
et l'écart apparaît en semaine 3 sous forme de non-remises que le routeur interprétera comme de la
stagnation (cf. G17). Le même champ sert de référence au signal anti-triche « durée très
inférieure » : selon la lecture retenue, tout le monde est suspect ou personne.

**Gravité** · `BLOQUANT-GEL` (champ de schéma + sémantique des budgets, tous deux figés demain).

**Correctif minimal** · Deux champs : `duree_redaction_min` (affichée à l'élève au temps 2, et
seule référence du signal T2) et `duree_cycle_min` (**la seule sur laquelle le routeur et le quota
bonus décomptent**). Écrire la règle explicitement en §4.

---

## G9 — Un seul gate pour trois choses : impossible de faire le diagnostic sans allumer le reste

**Où** · §6 (« **Gate** : `exercices_actif`… OFF jusqu'à la recette ») × §1.4 (diagnostic semaine 1)
× §4bis (« rien d'affiché avant l'allumage ») × §9 C4-L1.

**L'attaque** · Trois choses très différentes sont derrière le même interrupteur : la **passation**
(un élève peut déposer une copie), le **routage** (le routeur assigne), l'**affichage** (l'élève
voit des lettres et des verdicts). Le diagnostic de la semaine 1 exige la première allumée, la
deuxième éteinte (les profils n'existent pas encore) et la troisième absolument éteinte (les
instruments ne sont pas jugés). Avec un gate unique, le prof a deux options le jour du diagnostic :
laisser OFF et ne pas pouvoir faire passer le diagnostic, ou passer ON et exposer d'un coup le
routage et les lettres à 70 élèves. Il choisira ON un lundi matin de rentrée, et découvrira l'effet
de bord en classe.

**Gravité** · `BLOQUANT-GEL` (une ligne de §6, impossible à rattraper proprement après).

**Correctif minimal** · Trois gates : `exercices_actif` (passation + chaîne de mesure),
`routeur_actif`, `competences_affichage_actif`. Même patron `rag_actif`, même emplacement.

---

## G10 — `mode` de `exercices` mélange deux axes : le diagnostic de lecture n'est pas représentable

**Où** · §6 (`exercices.mode` = `formatif_maison`|`diagnostique_classe`|`lecture`) contre le tableau
des quatre formats de §2 et `exercices_types.famille` (`ecriture`|`lecture`).

**L'attaque** · §2 définit **quatre** formats sur deux axes orthogonaux (famille × contexte).
L'enum en mélange deux : `lecture` est une famille, pas un mode, et elle est déjà portée par le
type. Résultat : « **Lecture diagnostique classe** » — c'est-à-dire l'un des deux exercices de la
semaine 1, le socle de tous les profils du routeur — **n'a pas de valeur**. La session
d'implémentation choisira `lecture`, et alors le diagnostic de lecture n'est plus reconnaissable
comme diagnostic : il ne remplira pas `competences_mesures.contexte = 'diagnostic'`, donc il ne
comptera pas comme **ancre**, donc la règle « descente par les ancres seules » et le plafond
« ancre+2 » n'auront aucun point d'appui côté lecture pendant toute l'année.

**Gravité** · `BLOQUANT-GEL`.

**Correctif minimal** · `mode` = `formatif_maison`|`diagnostique_classe` seulement ; la famille se
lit sur `type_id`. Et écrire la règle de dérivation : `mode = diagnostique_classe`
→ `competences_mesures.contexte = 'diagnostic'`.

---

## G11 — Le routeur assigne par élève, mais rien dans le schéma ne porte une assignation

**Où** · §4 (« le routeur remplit », par élève) × §6 (`exercices` : `classe_id`, pas d'`eleve_id`,
`statut` `a_concevoir`→`concu`→`assigne`→`clos` ; `exercices_depots` sans état ni date
d'assignation).

**L'attaque** · En variante B, deux élèves de la même classe reçoivent des types et des matières
différents. L'objet « exercice assigné à Léa, fenêtre du 8 au 12 septembre » n'existe dans aucune
table : `exercices` est un objet de classe, `exercices_depots` est censé porter la remise mais on
ne dit jamais qu'une ligne y est créée à l'assignation, et ses `statut` ne sont pas énumérés. Deux
implémentations possibles, toutes deux mauvaises si elles ne sont pas choisies maintenant : une
ligne `exercices` par élève (alors `classe_id` ment, `statut='assigne'` est ambigu, et le compte
d'instances explose sans clé de regroupement pour la file de validation) ; ou des dépôts
pré-créés (alors il faut un état `assigne`/`non_commence`, une `du_at`, et il n'y en a pas). Effet
concret : le calendrier élève n'a rien à afficher tant que l'élève n'a pas ouvert l'exercice, donc
le premier écran de la semaine est vide, donc l'élève ne sait pas qu'il a du travail.

**Gravité** · `BLOQUANT-GEL`.

**Correctif minimal** · Énumérer `exercices_depots.statut`
(`assigne`|`ouvert`|`v1_remis`|`retour_publie`|`vf_remis`|`clos`|`abandonne`), ajouter `assigne_at`,
`du_at`, `origine` (`routeur`|`prof`) et `routeur_decision_id`, et écrire noir sur blanc :
**une ligne de dépôt est créée à l'assignation**, `exercices` reste l'instance partagée
(type × matière × fenêtre).

---

## G12 — La file de validation prof : « < 10 min » est faux, et la semaine 2 démarre avec zéro référence validée

**Où** · §4 (« file de validation… au minimum les références décomposées ; une référence non
validée n'entre jamais en Phase 2, **règle absolue** ») × §9 C4-L2 (« *Fait quand* : le routeur
remplit une semaine entière et le prof **valide la file en < 10 min** »).

**L'attaque** · Deux problèmes composés. (1) **Régime de croisière** : 70 élèves × ~2 exercices =
~140 instances/semaine. Le nombre de **références décomposées nouvelles** dépend entièrement d'un
paramètre que la spec ne fixe nulle part — la diversité des extraits que le routeur a le droit de
tirer. Rien ne lui demande de préférer une référence déjà validée. S'il tire 12 extraits distincts,
le prof doit valider 12 corrigés structurés (problème, thèse, garants, moments, concepts) sur des
textes philosophiques : **10-15 min chacun** s'il les lit vraiment, soit **2 à 3 h/semaine** — 15
à 20 fois le critère écrit. S'il ne les lit pas vraiment, la « règle absolue » devient un clic, et
c'est pire : une référence fausse contamine le P2 de tous les élèves qui l'ont reçue, sans laisser
de trace. (2) **Démarrage à froid** : le routeur prend la main en **semaine 2**, et au premier tour
le stock de références validées est **vide**. Le prof doit donc constituer ce stock pendant la
semaine 1 — la semaine où il fait passer deux diagnostics, dépouille 140 copies et rencontre ses
classes.

**Gravité** · `BLOQUANT-GEL` (le critère de recette de C4-L2 est dans ce document et il est faux ;
la règle de réemploi est une règle de routeur qui doit être au contrat avant le gel).

**Correctif minimal** · (a) Règle de routeur : **priorité absolue aux références déjà validées** ;
plafond de **≤ 3 références nouvelles par classe et par semaine**, sinon le routeur se rabat sur un
type qui n'en exige pas. (b) Unicité sur `exercices_references` (source + localisation) pour
empêcher les doublons. (c) Réécrire le critère : « le prof valide ≤ 3 références nouvelles et la
file d'instanciation en < 20 min ». (d) Pré-charger un stock initial de références validées **avant
le 25/08**, et le mettre au chemin critique d'août au même titre que les bancs.

---

## G13 — §8 contredit §4 et §9 sur le périmètre du routeur

**Où** · §8 : « Ce que C3 ne couvre PAS : … le **routage individuel effectif** (allumage
post-diagnostic — le code du routeur peut s'écrire **en C6 ou post-rentrée**) » contre §4
(« variante B, le routeur en charge dès la semaine 2 », « le cœur algorithmique R1-R6 passe de
post-rentrée à **avant le 25/08** ») et §9 C4-L2 (le critère de recette exige un routeur qui
remplit une semaine).

**L'attaque** · §8 n'a pas été repris lors de la bascule en variante B. Une session
d'implémentation qui ouvre C3 + la section de son lot (règle R4 : « rien de plus ») et tombe sur
§8 conclura légitimement que le routeur est hors périmètre et livrera C4-L2 en mode « Concevoir »
— c'est-à-dire la coupe de repli — sans que personne ne l'ait décidé. La coupe se prendra par
inadvertance, et se découvrira au 25/08.

**Gravité** · `BLOQUANT-GEL` (correction de trois lignes, effet de bord majeur si oubliée).

**Correctif minimal** · Réécrire l'item de §8 : « le routage individuel effectif — **le cœur R1-R6
entre au périmètre d'août (C4-L2)** ; restent hors C3 : les couches 2-3 et l'escalade ». Et faire
passer un `grep` sur le document à chaque bascule de variante.

---

## G14 — M3 est déclaré « non négociable » et ses trois champs ne sont définis nulle part

**Où** · §0 (M3 : aide consommée, délai depuis le dernier travail de l'observable, distance de
contexte), §6 (`aide_consommee`, `delai_depuis_dernier_travail`, `distance_contexte`), §8
(« la télémétrie §6 est le prérequis, elle, **non négociable** »).

**L'attaque** · Aucune unité, aucune règle de calcul, aucune source. Pire pour `aide_consommee` :
**la spec ne décrit aucune aide que l'élève pourrait consommer**. Le cycle à six temps n'a ni
indice, ni coup de pouce, ni chat d'assistance ; la « fiche stratégique » du temps 1 est *dosée par
le système*, pas demandée par l'élève. Le champ mesure donc une fonctionnalité inexistante. Une
session d'implémentation écrira ce qu'elle veut (peut-être le fait d'avoir déplié la fiche), et
dans six mois les règles du routeur seront écrites contre une colonne dont personne ne saura plus
ce qu'elle contient — avec un an de données déjà accumulées et non rétro-corrigibles, alors même
que la valeur de cette table est *précisément* d'être le carburant historique du routeur.
`distance_contexte` a le même défaut, en pire : ni échelle, ni référentiel de distance.

**Gravité** · `BLOQUANT-GEL` (une colonne mal remplie dès septembre est irrécupérable ; la
définition tient en cinq lignes).

**Correctif minimal** · Définir les trois en §0, avec unité et source : `aide_consommee` = entier,
nombre de dépliages de la fiche + nombre de relectures du retour v1 avant remise de la vf (et si
aucune aide n'existe : **supprimer la colonne** plutôt que la laisser NULL) ;
`delai_depuis_dernier_travail` = jours depuis la dernière mesure sur la même compétence ;
`distance_contexte` = enum ordonné (`meme_type` / `meme_famille` / `transfert`), pas un nombre.

---

## G15 — Le diagnostic de la semaine 1 suppose 70 téléphones en main, en classe, au Québec

**Où** · §1.4 (« deux exercices en classe, manuscrits + **photo** »), §2, §9 C4-L4, §10.1.

**L'attaque** · Depuis le 18 septembre 2025, l'interdiction québécoise des appareils mobiles
personnels couvre **tout le terrain de l'école** — classes, couloirs et cour — et non plus la seule
salle de classe ; une exception existe pour un usage pédagogique autorisé par l'enseignant, mais
la **modalité d'application appartient à l'école** : quand l'établissement a choisi les pochettes
verrouillées ou le dépôt au casier pour la journée, l'autorisation pédagogique ne rend pas les
appareils disponibles pour autant, et il faut une procédure de récupération/restitution pour
25 élèves à la fin d'une période. À quoi s'ajoute, indépendamment du règlement : les élèves sans
téléphone ou sans appareil photo utilisable (il y en a, y compris pour raisons économiques), et
la charge réseau — 25 élèves × 3 photos × ~3 Mo = **225 Mo simultanés** sur un point d'accès
scolaire, dans les 5 dernières minutes d'un cours. Le mode de panne n'est pas « c'est plus lent » :
c'est la moitié de la classe qui sort sans avoir déposé, donc **la moitié des profils manquants au
démarrage du routeur en semaine 2** (cf. G16).

**Gravité** · `AVANT-ALLUMAGE` (le format manuscrit ne change pas ; c'est la voie de dépôt qui doit
changer).

**Correctif minimal** · Pour les passations **en classe**, inverser le porteur : le prof ramasse
les copies et les numérise **lui-même**, en un lot, avec une appli de scan documentaire
(70 copies × 2-3 pages ≈ 15-20 min, un seul appareil, une seule session de téléversement,
qualité homogène, aucun problème de règlement). Le dépôt par l'élève reste la voie normale pour le
**formatif maison** (hors école). Et imposer partout un **redimensionnement côté client**
(bord long 1600 px, JPEG q75 → ~400 Ko) : facteur ~7 sur le réseau, le stockage et les jetons
d'image. Source du règlement :
https://educaloi.qc.ca/actualites-juridiques/fin-des-cellulaires-a-lecole-ce-que-vous-devez-savoir/

---

## G16 — Aucun profil par défaut pour l'élève sans diagnostic, et aucun repli à l'exécution

**Où** · §4 (« le routeur en charge dès la semaine 2, **sur les profils du diagnostic** »), §4
(coupe de repli datée « si le cœur R1-R6 n'est pas prêt **au 25/08** »).

**L'attaque** · Deux trous jumeaux. (1) **Élèves sans profil** : absents le jour du diagnostic
(sur 70 élèves de lycée en première semaine, compter 5-10 %), copie illisible renvoyée à refaire,
OCR échoué, dépôt raté (cf. G15). La spec ne dit pas ce que le routeur fait pour eux : pas de
profil par défaut, pas d'état `profil_provisoire`, pas de fenêtre de rattrapage. L'implémentation
livrera soit un plantage, soit — plus vicieux — un profil « tout à E » par défaut (valeur nulle de
l'enum), et ces élèves recevront pendant un mois les exercices les plus élémentaires du catalogue.
(2) **Repli non disponible à l'exécution** : la coupe de repli est une décision *datée au 25/08*.
Si le routeur est prêt le 25/08 (donc variante B retenue) mais que le **dépouillement** de la
semaine 1 échoue ou déborde, il n'existe aucun mécanisme pour repasser en variante A en semaine 2 —
le prof découvre le lundi qu'il n'a rien à donner à ses classes.

**Gravité** · `AVANT-ALLUMAGE`.

**Correctif minimal** · (a) Profil par défaut explicite : toutes les compétences à la **médiane de
la classe** (pas au plancher), drapeau `profil_provisoire` sur `competences_niveaux`, exclusion des
règles de montée/descente tant qu'il est levé, fenêtre de rattrapage en semaine 2-3. (b) Faire du
repli un **interrupteur d'exécution** (`routeur_actif` de G9) et non une décision de calendrier :
OFF → le prof revient à la boucle `a_concevoir`, sans redéploiement.

---

## G17 — Connaissance et Synthèse « mesurées » en semaine 1 sur un sujet d'actualité, avant tout enseignement

**Où** · §1.4 (« un essai sur un **sujet d'actualité simple** — porte **les 6** compétences
d'écriture ») × §1.1 (Connaissance, Synthèse au référentiel) × §4 (le routeur cible sur ces
profils).

**L'attaque** · Connaissance mesure la mobilisation de savoir philosophique ; en semaine 1, aucun
savoir n'a été enseigné, et le sujet est explicitement choisi pour ne pas en exiger. La mesure ne
capte donc pas la compétence mais **le capital culturel préalable** — c'est-à-dire, très
directement, l'origine sociale de l'élève. Deux conséquences en cascade : (a) tout le monde ou
presque sort à D-E sur Connaissance, le routeur voit une faiblesse générale et cible Connaissance
pour toute la classe en septembre — des exercices de mobilisation de connaissances qu'aucun élève
ne possède encore ; (b) la « note d'étalonnage » de fin d'année (§4) croisera un plancher artificiel
de septembre avec un niveau réel de juin et conclura à un progrès spectaculaire sur Connaissance,
qui servira ensuite à régler les attentes du routeur. Même argument, plus faible, pour Synthèse sur
une copie unique et courte. Et le temps 1 aggrave : « fiche stratégique **complète** si l'élève est
D-E » — donc la classe entière reçoit la version longue à chaque exercice.

**Gravité** · `AVANT-ALLUMAGE`.

**Correctif minimal** · Écrire en §1.4 la liste des compétences **effectivement portées** par
l'essai diagnostique (proposition : Expression hors OCR exclue — cf. G2 —, Argumentation,
Structure, Problématisation), et déclarer Connaissance (et Synthèse) **sans mesure valide avant la
première production adossée au contenu du cours** : le routeur ne les cible pas, aucune lettre
n'est calculée, `competences_niveaux.statut_recette` = `differee` jusque-là.

---

## G18 — L'ajustement dynamique récompense la stagnation et punit le progrès

**Où** · §1.3 et §4 : « là où l'élève **stagne** malgré les exercices, le routeur **lève le pied**
sur cette cible… là où il **progresse**, il **pousse** ».

**L'attaque** · Lu du point de vue d'un élève de 17 ans, c'est un contrat limpide : *progresser
coûte du travail supplémentaire, stagner en fait économiser*. La stratégie dominante d'un élève
qui optimise sa charge est donc de produire des v1 juste assez plates pour ne pas déclencher de
drapeau et juste assez stables pour être classé « stagnant ». Le coût de cette stratégie est nul —
il n'y a **pas de note** (§7 : « l'anti-triche protège le retour élève, pas la note, il n'y en a
pas »), donc rien ne sanctionne le sur-place. La découverte prendra trois à cinq semaines et se
transmettra en une récréation ; elle est d'autant plus probable que la règle est *visible* dans
l'expérience (le volume d'exercices baisse). Et le mécanisme est indétectable dans les données :
un élève qui stagne volontairement est, dans `competences_mesures`, identique à un élève qui bute.

**Gravité** · `AVANT-ALLUMAGE`.

**Correctif minimal** · Découpler **volume** et **cible**. La stagnation change la *cible* (on
change de compétence, on descend d'un grain, on repasse par un type de préparation) sans réduire
le volume ; le progrès change la *difficulté*, pas la quantité. Le volume reste piloté par le seul
budget prof et par la préférence élève. Si l'allègement est conservé, le plafonner (≤ 2 semaines
consécutives) et le remonter au prof comme un drapeau, pas comme un réglage silencieux.

---

## G19 — La règle « 2 sur 3 » et l'allègement forment une boucle qui verrouille les élèves faibles

**Où** · §4bis (« montée par le maison **2 mesures sur 3** ») × §4 (allègement en cas de stagnation)
× §1.3.

**L'attaque** · Indépendamment de toute intention de l'élève, les deux règles composent une boucle
de rétroaction positive vers le bas. Élève D sur Structure : il fait 3 exercices en 3 semaines,
aucune montée (il en faut 2 améliorées sur 3) ; le routeur détecte la stagnation et allège à
1 exercice toutes les 2-3 semaines ; il faut désormais **6 à 9 semaines** pour réunir la fenêtre de
3 mesures, donc la montée devient quasi impossible, donc la stagnation est confirmée, donc
l'allègement se maintient. La lettre de septembre est gelée jusqu'à Noël pour exactement les élèves
que le dispositif vise. Symétriquement, l'élève qui progresse reçoit plus d'exercices, donc remplit
la fenêtre de 3 plus vite, donc monte plus vite : **l'écart d'accumulation de preuves s'ouvre
mécaniquement**, indépendamment de l'écart de compétence.

**Gravité** · `AVANT-ALLUMAGE`.

**Correctif minimal** · Rendre la fenêtre de montée **temporelle** et non cardinale : « 2 mesures
améliorées sur les 3 dernières **ou** sur les 6 dernières semaines », et garantir un **plancher de
mesure** par compétence ciblée (au moins 1 mesure par 3 semaines tant que la compétence est ciblée),
que l'allègement ne peut pas franchir.

---

## G20 — Le verdict de calibration impute à l'élève les oublis de l'extraction

**Où** · §3.3 (comparaison en code avec le squelette → `bien_calibre`|`surconfiant`|`sous_confiant`),
§3.4 (« elle a relevé Y que tu n'avais pas vu »), §6 (`exercices_metacognition.calibration`,
enum à trois valeurs), §3.4 (« la contestation… **n'altère rien automatiquement** »).

**L'attaque** · Le squelette est une sortie de modèle, pas une vérité. Ses **faux négatifs sont
structurellement invisibles** : un garant implicite, une articulation portée par la syntaxe, une
reformulation du problème dans la conclusion — P1 les rate régulièrement, et rien dans le dispositif
ne peut le détecter, puisque P2 ne lit que le squelette. Scénario : l'élève, au temps 3, répond
« oui, j'ai justifié ma thèse » — c'est vrai, et P1 ne l'a pas extrait. Le code conclut à un écart,
étiquette **`surconfiant`**, et le temps 4 lui annonce que l'IA a vu ce qu'il n'avait pas vu.
L'élève sait qu'il a raison. Il clique « je ne suis pas d'accord » — ce qui « n'altère rien » et ne
remonte au prof que « si répété ». Répété trois fois, l'élève cesse de prendre le dispositif au
sérieux, et il a raison de le faire. Le mécanisme est d'autant plus corrosif que le temps 3 vise
précisément le **Monitoring**, c'est-à-dire la confiance de l'élève dans son propre jugement : le
système est conçu pour entraîner la métacognition, et il entraîne en pratique la soumission à la
machine.

**Gravité** · `AVANT-ALLUMAGE`.

**Correctif minimal** · (a) Ajouter la valeur **`indetermine`** à l'enum et l'appliquer par défaut
quand l'écart porte sur une **non-détection** de P1 (l'élève affirme un observable absent du
squelette) — n'étiqueter `surconfiant` que dans le cas inverse (l'élève nie un observable que le
squelette *cite*). (b) Reformuler le message du temps 4 en « **nous n'avons pas vu la même chose** »
plutôt qu'en verdict. (c) Router **toute** contestation portant sur une citation absente vers la
file du prof (pas seulement les répétées) : c'est le meilleur corpus de banc disponible, et il est
gratuit.

---

## G21 — L'élève est jugé sur un texte qu'il ne verra jamais

**Où** · En-tête v3.1 (« idée « validation OCR par l'élève » **parquée** dans
`IDEES_post_rentree.md` ») × §2 (confiance de transcription) × §3.4 (contestation) × §6
(`transcription`).

**L'attaque** · *Je conteste ici une décision actée (le parcage).* La transcription est
l'intégralité de la matière du jugement : P1, P2, la chasse aux fautes, Expression, le diff v1/vf
en dépendent tous. La parquer revient à dire que l'élève peut contester un verdict sans avoir accès
à la pièce sur laquelle il porte. Scénario ordinaire : « tu écris : "la liberté est une illusion
nécessaire" » — l'élève avait écrit « une illusion **tenace** » ; le retour est aberrant, l'élève
ne peut pas nommer pourquoi (il ne voit pas la transcription), il coche « je ne suis pas d'accord »
avec un commentaire vague, le prof reçoit un drapeau incompréhensible. En droit québécois, la
transcription est un **renseignement personnel inexact** sur lequel l'élève a un droit de
rectification ; l'absence de tout canal de correction n'est pas seulement un défaut de conception.
Et pour le projet lui-même, c'est la perte du signal le plus précieux et le moins cher : chaque
correction d'élève est une donnée de banc OCR gratuite.

**Gravité** · `AVANT-ALLUMAGE`.

**Correctif minimal** · Pas de « validation OCR » (qui suppose une interface d'édition et une file) :
un simple **affichage en lecture seule** de la transcription à côté du retour, avec un bouton « la
transcription ne correspond pas à ma copie » qui (1) journalise, (2) marque le dépôt
`transcription_contestee`, (3) l'exclut d'Expression, (4) le remonte au prof avec les photos. Un
écran, aucun nouveau pipeline.

---

## G22 — La chasse aux fautes transforme les erreurs d'OCR en fautes imputées à l'élève, avec correction imposée

**Où** · §3.3 (« relevé mécanique calculé en code… il reste N fautes probables ») et §3.4 (« section
langue séparée… ancrées ligne à ligne… leur correction est **attendue dans la vf** (correction
imposée) »).

**L'attaque** · Le relevé mécanique s'exécute sur la **transcription**, pas sur la copie. Trois
sources de faux positifs se cumulent : (1) les erreurs de lecture de l'OCR, indiscernables des
fautes de l'élève — d'autant plus nombreuses que §2 tolère jusqu'à ~15-20 % de texte douteux avant
de déclencher un refait, soit **jusqu'à ~75 mots incertains sur une copie de 500 mots** ; (2) le
lexique philosophique et les noms propres (aletheia, eudémonisme, Épictète, kantien) que tout
correcteur générique signale ; (3) les ruptures de ligne du manuscrit, reconstituées arbitrairement.
L'élève reçoit donc une liste ancrée « ligne à ligne » de fautes dont une partie **n'existe pas sur
sa feuille** — et on lui *impose* de les corriger dans la vf. Il ne peut ni les trouver, ni les
contester (cf. G21). C'est le point du dispositif où la crédibilité de Calame se joue, et il est
conçu pour échouer d'abord chez les élèves à l'écriture la moins nette.

**Gravité** · `AVANT-ALLUMAGE` (la fonctionnalité est `[à valider]` ; l'interdiction, elle, doit
être écrite avant qu'une session ne l'implémente).

**Correctif minimal** · **La chasse aux fautes et la section langue ne s'exécutent que sur des
productions `mode_saisie = ecran`.** Sur les productions transcrites : aucun relevé mécanique,
aucune correction imposée. (Si on y tient absolument : exiger de la transcription un marquage par
segment incertain et n'accepter que les fautes situées hors segments marqués — mais c'est une
dépendance forte à une capacité non vérifiée du modèle de vision.)

---

## G23 — `confiance_ocr` : une décision lourde adossée à un nombre dont la provenance n'est pas définie

**Où** · §2 (« si la part de texte douteux dépasse un seuil X % — provisoire ~15-20 % — l'exercice
est à refaire lisiblement »), §6 (`confiance_ocr`, `refaire_lisibilite` + compteur).

**L'attaque** · Trois trous distincts. (1) **Provenance** : un modèle de vision ne renvoie pas de
confiance calibrée ; lui demander « quel pourcentage du texte es-tu incertain de lire ? » produit
une auto-évaluation notoirement peu fiable et non stable d'un appel à l'autre. Le seuil « 15-20 % »
sera donc appliqué à un nombre dont personne ne connaît la distribution — et il sera réglé sur les
premières copies vues, en septembre, en urgence. (2) **Ordre du cycle** : rien ne dit que le contrôle
de lisibilité précède le temps 3. Écrit tel quel, l'élève dépose ses photos, répond aux questions
d'auto-jugement, puis apprend que la copie est à refaire — et le voilà à recopier une copie sur
laquelle il s'est déjà auto-évalué. (3) **Pas de plafond** : un compteur de refaits existe, mais
aucune règle ne dit ce qui se passe au deuxième, au troisième. Un élève dont l'écriture est
simplement rapide entre dans une boucle de recopie de 25 minutes par tour, sans que quiconque soit
prévenu — l'exemption (§2, §10.9) suppose que le prof **sache déjà** qu'il faut l'accorder.

**Gravité** · `AVANT-ALLUMAGE`.

**Correctif minimal** · (a) Définir `confiance_ocr` comme une grandeur **calculée en code**, pas
déclarée par le modèle : part de tokens marqués `[?]` par une transcription à double passe (deux
appels, taux de désaccord mot à mot) — et poser le seuil au banc, pas en septembre. (b) Le contrôle
de lisibilité s'exécute **avant** l'ouverture du temps 3, et l'échec prolonge automatiquement
`fenetre_fin`. (c) **Un seul refait**, puis acceptation avec drapeau `transcription_douteuse`
(exclusion d'Expression) et **alerte automatique au prof en candidature d'exemption** dès le
2e déclenchement pour un même élève.

---

## G24 — Le faisceau T2 se réduit à un seul signal exploitable sur le manuscrit, et le manuscrit récompense la triche soignée

**Où** · §7 (quatre signaux : durée, incohérence auto-jugement, delta nul, style) × §3 (« pour les
exercices manuscrits, la durée mesurée = ouverture → dépôt des photos ») × §3.3 (le temps 3 n'existe
que si la compétence est `evaluee`).

**L'attaque** · Signal par signal, sur le formatif maison manuscrit — c'est-à-dire sur la totalité
du volume : **durée** — elle mesure l'intervalle entre l'ouverture de la fiche et le dépôt des
photos, un intervalle que l'élève contrôle entièrement et qui sera de plusieurs heures ou jours
pour tout le monde ; « durée très inférieure à la durée attendue » est structurellement mort sur
le format où la triche se joue. **Incohérence auto-jugement** — c'est le seul signal réel, et il
est éteint pour toute compétence non `evaluee` (cf. G4). **Delta v1→vf nul** — désamorcé par
n'importe quelle modification cosmétique, et il ne distingue pas « 0 » de « pas de vf » (le champ
est NULL dans les deux cas), donc il transformera les décrocheurs en suspects. **Style discordant**
— la spec le qualifie elle-même de faible, et il est en pratique inexploitable : l'historique de
style est une transcription OCR, dont le style est en partie celui du transcripteur. Reste **un**
signal, conditionnel. Et l'économie penche du mauvais côté : recopier 450 mots d'une sortie d'IA
prend 12-15 minutes contre 30-40 pour les écrire, **et** produit une écriture posée et régulière,
donc une **meilleure confiance OCR** et **zéro refait**. Le dispositif récompense la copie soignée.

**Gravité** · `AVANT-ALLUMAGE`.

**Correctif minimal** · Retirer « durée » du faisceau pour les types `manuscrit` (le laisser pour
`ecran`), distinguer `delta_v1_vf` NULL de 0 dans la règle, et **remplacer le signal perdu** par
le seul mesurable sur papier : une **question de restitution à chaud** au dépôt (« en une phrase,
quelle était ta thèse et pourquoi tu as choisi cet exemple ? », clavier, 30 s) — incohérence avec
le squelette = signal, et le geste a une valeur pédagogique propre même sans triche.

---

## G25 — Loi 25 : la chaîne est décrite, la conformité est renvoyée à une « piste parallèle » sans être bloquante

**Où** · §10.6 (« le quota bonus et les timestamps créent des données personnelles fines : couvrir
dans la **lettre Loi 25** — piste parallèle »), §7 (Pangram : « ajouter à la liste des
sous-traitants »), §6 (photos, transcriptions, drapeaux d'intégrité, contestations).

**L'attaque** · La conformité est traitée comme un document à écrire, jamais comme une **condition
de démarrage** — alors que le premier traitement a lieu en **semaine 1** (140 copies manuscrites de
mineurs, transcrites par un fournisseur hors Québec). Quatre points concrets, aucun couvert :
(1) **communication hors Québec** de renseignements personnels de mineurs → évaluation des facteurs
relatifs à la vie privée requise **avant** le transfert, pas après ; (2) **décision fondée sur un
traitement automatisé** — les lettres de compétence et le routage produisent des effets sur l'élève ;
la spec prévoit une contestation qui « n'altère rien automatiquement » et ne remonte à un humain
que « si répétée », donc **une contestation isolée n'atteint jamais une personne** ; (3) **aucune
durée de conservation ni procédure de purge** nulle part dans §6 — ni pour les photos, ni pour les
transcriptions, ni pour les drapeaux d'intégrité, qui sont les données les plus dommageables et les
moins fiables du système ; (4) **qui est responsable du traitement ?** Le document décrit un
dispositif tenu sur les comptes personnels d'un enseignant ; la spec ne nomme aucun mandat de
l'établissement (cf. Angle mort 3).

**Gravité** · `AVANT-ALLUMAGE` (mais la **séquence** est à écrire avant le gel : c'est une
dépendance du calendrier d'août, pas une tâche de septembre).

**Correctif minimal** · Inscrire dans §9 un **jalon bloquant daté avant le 25/08** : EFVP faite,
liste des sous-traitants arrêtée, information aux élèves et aux parents, **durées de conservation
écrites dans §6 table par table** (proposition : photos purgées à 90 j après la clôture du cycle,
transcriptions conservées à l'année, drapeaux T2 purgés à 12 mois), et **toute contestation
individuelle** routée vers le prof (cf. G20c) — ce qui satisfait l'exigence d'un examen humain.

---

## G26 — La couche 3 s'écrit en août, mais C4-L5 doit livrer des retours « conformes au contrat » en S2-S3

**Où** · §5 (« la couche type… **s'écrit au fil de la spécification des types** (annexe A + aile L,
**en août**) — pas dans C3 ») × §9 C4-L5 (S2-S3 : « *Fait quand* : un dépôt produit squelettes +
mesures + **retours conformes au contrat** »).

**L'attaque** · Inversion de dépendance : le lot qui doit produire les retours est planifié **avant**
que la matière de ces retours existe. En S3, `exercices_types.fiche.attendus_retour` sera vide pour
la quasi-totalité des types ; le retour se réduira aux couches 1 et 2, c'est-à-dire au contrat
générique plus le vocabulaire de la grille — soit exactement ce que le contrat interdit (« jamais
de généralités »). Deux effets : la recette de L5 sera prononcée sur des retours dont personne ne
saura s'ils sont bons *par construction* ou *par accident*, et rien n'empêchera un type à fiche vide
d'être routé en septembre.

**Gravité** · `AVANT-ALLUMAGE`.

**Correctif minimal** · Une précondition d'activation dans §6 : **`exercices_types.actif = true`
exige `fiche.attendus_retour` non vide** — le routeur ne peut instancier qu'un type activé.
Et un état de télémétrie `retour_degrade` (couches 1-2 seules) pour que la recette de L5 puisse se
prononcer honnêtement pendant la période transitoire.

---

## G27 — Aucune cadence minimale d'ancres : le plafond « ancre+2 » est exploitable pendant des mois

**Où** · §0 et §4bis (« descente par les **ancres seules**, plafond **ancre+2** »), §2 (« les DS
s'ingèrent plus tard par les mêmes canaux diagnostiques »).

**L'attaque** · Toute la validité du dispositif repose sur les ancres, et **aucun endroit de la spec
ne fixe leur fréquence**. Si les seules ancres de l'automne sont les deux diagnostics de la
semaine 1, alors pendant trois à quatre mois : (a) aucune lettre ne peut redescendre, quoi que
fasse l'élève ; (b) une lettre peut monter jusqu'à **ancre+2** uniquement sur du travail maison,
c'est-à-dire sur le canal non surveillé (cf. G24) ; (c) l'élève voit cette lettre (C6-L2). Un élève
parti de C se retrouve affiché en A sur du travail maison, sans qu'aucune mesure de haute validité
n'ait eu lieu depuis septembre, et sans possibilité de correction avant le premier DS ingéré.
Le plafond « ancre+2 » n'est un garde-fou que si les ancres sont fréquentes ; sans cadence écrite,
c'est une autorisation de dérive de deux niveaux.

**Gravité** · `AVANT-ALLUMAGE`.

**Correctif minimal** · Écrire une **cadence plancher** : au moins une ancre par compétence
`evaluee` toutes les 6 semaines, sinon la lettre **gèle** (elle ne peut plus monter, et l'écran
affiche « en attente d'une mesure en classe »). Le gel est plus honnête que la dérive, et il crée
la pression calendaire nécessaire pour que les ancres existent.

---

## G28 — Les budgets sont par classe ; un élève TC+HLP en reçoit deux, et personne ne somme

**Où** · §4 (« il fixe **par classe** un budget de temps hebdomadaire »), §4 (bonus ~30 min/sem),
contexte (deux cours, TC et HLP).

**L'attaque** · La charge est plafonnée du côté de l'émetteur (la classe) et pas du côté du
récepteur (l'élève). Un élève de HLP suit aussi le tronc commun : deux routeurs, deux budgets,
plus le quota bonus, plus Quazian, plus les Fragments hebdomadaires, plus la lecture des livres
Aletheia. Avec G8 non corrigé (durée = rédaction seule), on obtient facilement 2 × 135 min + 30 =
**~5 h par semaine de philosophie**, pour un élève qui a six autres matières. La conséquence n'est
pas seulement le décrochage : c'est que **les élèves les plus engagés** — ceux qui font tout — sont
les premiers à saturer, et leur saturation se lira comme de la stagnation (cf. G19).

**Gravité** · `AVANT-ALLUMAGE`.

**Correctif minimal** · Un **plafond hebdomadaire par élève**, paramètre global, que les routeurs
des deux classes se partagent (le premier servi prend, l'autre s'ajuste) ; et rendre le total
hebdomadaire visible à l'élève et au prof. Une colonne sur le profil élève, une règle dans le
routeur.

---

## G29 — Rien ne décrit l'abandon d'un cycle, ni la latence, ni la relance

**Où** · §3 (six temps répartis sur plusieurs sessions), §6 (`exercices_depots.statut` non énuméré),
§9 C4-L3.

**L'attaque** · Le cycle impose au minimum **trois connexions distinctes** : déposer la v1 (+ se
juger), lire le retour et réviser, lire le retour final. Entre chacune, il faut que l'élève
**revienne de lui-même** : la spec ne prévoit aucune notification, aucun contrat de latence (le
retour est-il prêt en 2 minutes ou le lendemain matin ?), aucune relance, aucun délai maximal,
aucun état d'abandon. Scénario massif et prévisible : l'élève dépose dimanche 22 h 40, la chaîne
tourne, le retour est publié à 22 h 44 — l'application est fermée depuis 22 h 41. Il revient jeudi,
trouve un retour de dimanche sur un texte qu'il ne se rappelle plus, ne fait pas la vf. Le temps 6,
présenté comme le plus puissant du dispositif, est **le troisième point d'abandon consécutif** : il
ne sera atteint que par une minorité. Et sans état `abandonne`, le routeur ne peut pas distinguer
« n'a pas progressé » de « n'a jamais lu le retour » — il appliquera l'allègement de G18 à un élève
qui n'a simplement jamais vu le dispositif.

**Gravité** · `AVANT-ALLUMAGE`.

**Correctif minimal** · (a) Énumérer `statut` avec `abandonne` (v1 remise, vf non remise à
`fenetre_fin`) et l'exclure des règles de stagnation. (b) Écrire le contrat de latence dans §3
(« le retour v1 est publié en < 10 min ; au-delà, l'élève voit un état d'attente explicite »).
(c) Une relance minimale (badge sur le tableau de bord + un rappel par le canal existant du
calendrier) — pas de notification push à construire.

---

## G30 — Pas de plafond de coût, pas de coupe-circuit, alors que la facture est privée

**Où** · §6 (`cout_api` branché sur `api_couts`, C11a), contexte (le coût API est payé par le
professeur).

**L'attaque** · Le coût nominal est tenable — avec les hypothèses affichées en tête de document et
un modèle de milieu de gamme (3 $/M en entrée, 15 $/M en sortie) : **~0,28 $ par cycle complet**
(2 transcriptions + 6 P1 + 6 P2 + 2 retours ≈ 44 100 jetons d'entrée / 9 700 de sortie), soit
**~390 $/an** pour 70 élèves × 20 cycles, plus **~29 $** pour le diagnostic. Avec un modèle haut de
gamme (15/75), les mêmes volumes donnent **~1 950 $/an**. Le problème n'est donc pas le nominal,
c'est l'**absence de garde-corps** : la spec mesure le coût *a posteriori* et ne prévoit ni plafond,
ni alerte, ni coupure. Or les modes de dérapage sont exactement ceux que G6 rend probables — une
boucle de retry sur une file sans idempotence, une re-transcription à chaque affichage, un test de
charge lancé sur la prod. Multiplié par des photos non redimensionnées (facteur ~7 sur les jetons
d'image, cf. G15) et par un P1 par compétence (facteur ~5 sur l'entrée d'extraction, cf. G3), le
même système passe de 390 $ à plusieurs milliers sans que rien ne s'allume.

**Gravité** · `AVANT-ALLUMAGE`.

**Correctif minimal** · Trois paramètres dans la config C11a : **plafond mensuel**, **alerte à
70 %**, **coupure automatique à 100 %** (le gate `exercices_actif` bascule, le prof est prévenu, les
dépôts restent acceptés et sont mis en file). Plus un plafond par dépôt (nombre max d'appels), qui
attrape les boucles avant la facture.

---

## G31 — Lecture : rien ne relie l'extrait choisi à l'avancement réel de l'élève

**Où** · §4 (« instanciation depuis la matière Scriptorium, **non-spoiler pour la lecture** »),
§9 C5-L1 (« extrait/tranche — non-spoiler : **amont exposé seul** »), §6 (`exercices` a `classe_id`,
pas de lien à l'avancement de lecture de l'élève).

**L'attaque** · « Amont exposé seul » définit une borne **de classe** (ce que la classe a couvert),
pas une borne **d'élève**. Or la lecture des livres est individuelle. L'élève en retard de trois
chapitres reçoit un exercice sur un extrait situé au-delà de sa position réelle : il est *spoilé*
et il ne peut pas faire l'exercice — ce qui produit une non-remise, que le routeur lira comme de la
stagnation (G18/G19). Le cas est structurellement fréquent en septembre-octobre, où les écarts
d'avancement sont maximaux. Aucun champ ne permet même de détecter le problème après coup.

**Gravité** · `À SURVEILLER` (avec une réserve : si le routeur pousse des exercices de lecture dès
la semaine 2, ça devient `AVANT-ALLUMAGE`).

**Correctif minimal** · Poser sur l'exercice une `borne_amont` (localisation maximale exposée) et
une règle de routeur : ne pas assigner si la borne dépasse la position de lecture connue de l'élève
— à défaut de position connue, se rabattre sur un texte court hors livre.

---

## G32 — P2 sur la vf est spécifié et n'est utilisé nulle part

**Où** · §6 (`exercices_squelettes` par version **v1 et vf**, avec `p1` **et** `p2`) × §3.6 (le
retour final se génère « depuis la **comparaison des deux squelettes** croisée avec le retour
donné ») × §0 (M1 : « la vf n'alimente que le delta »).

**L'attaque** · Si les mesures ne viennent que de la v1 et si le retour final part des squelettes,
alors le **jugement (P2) de la vf n'a aucun consommateur déclaré**. C'est un tiers des appels de
jugement du système — pour 70 élèves × 20 cycles × 3 compétences, ~4 200 appels par an — dont
personne ne dit à quoi ils servent. Soit ils sont inutiles, soit `delta_v1_vf` est en réalité une
différence de **verdicts** (et non de squelettes), auquel cas §3.6 est faux. La spec ne permet pas
de trancher.

**Gravité** · `À SURVEILLER`.

**Correctif minimal** · Écrire en §0 la définition de `delta_v1_vf` (différence de squelettes ou de
verdicts). Si squelettes : supprimer `p2` pour la version `vf`.

---

## G33 — L'étalonnage de fin d'année mesurera surtout de la régression vers la moyenne

**Où** · §4, « Note d'étalonnage (Louis, 28/07) » : croiser les progrès réels (lettres de septembre
vs juin) avec l'assiduité, pour régler les attentes du routeur et les seuils « stagne / progresse ».

**L'attaque** · Les lettres de septembre proviennent d'**une seule copie**, mesurée sur des
instruments non encore bancés, avec un plancher artificiel sur Connaissance (G17) et un biais
d'inflation sur Expression (G2). Une mesure unique et bruitée, comparée dix mois plus tard à une
mesure agrégée sur des dizaines d'observations, produit **mécaniquement** une remontée des élèves
classés bas en septembre et une descente des élèves classés haut — indépendamment de tout
apprentissage. Croiser ce faux gradient avec l'assiduité fabriquera la conclusion « les élèves
faibles qui travaillent progressent beaucoup », et cette conclusion servira ensuite à **régler les
seuils du routeur**. L'artefact s'installe alors dans le mécanisme, où plus personne ne le verra.

**Gravité** · `À SURVEILLER`.

**Correctif minimal** · Écrire dans la note que la comparaison septembre/juin doit se faire sur
**des mesures de même nature** (le diagnostic de septembre contre une passation de même format en
juin, pas contre la lettre agrégée), et qu'un groupe d'élèves à faible assiduité sert de
**contrefactuel** — sans lui, le croisement n'est pas interprétable.

---

## G34 — « Jamais de note » d'un côté, une échelle A-E affichée de l'autre

**Où** · §5 règle 6 (« Jamais de note, de lettre ou de moyenne dans le texte du retour »),
§3.3 (« jamais noté »), §7 (« l'anti-triche protège le retour élève, pas la note, il n'y en a pas »)
× §1.1 (échelle E-A ↔ 0-4) × §9 C6-L2 (« Retour élève : **niveaux en lettres** »).

**L'attaque** · *Je conteste ici une décision actée.* L'interdiction porte sur le **texte** du
retour ; l'écran d'à côté affiche une lettre par compétence. Pour un élève de 17 ans, une lettre
sur une échelle à cinq niveaux **est** une note — c'est même précisément la forme du bulletin
québécois. Trois effets : (a) la comparaison sociale s'installe en une semaine (« t'as quoi en
Argumentation ? ») et la promesse « ce n'est pas noté » sera lue comme une naïveté d'adulte ;
(b) un E affiché toute l'année sur une compétence est un stigmate permanent, là où une note ponctuelle
s'oublie ; (c) la lettre devient consequential par le routeur (elle détermine le volume et le
contenu du travail — G18), donc l'élève a un intérêt tangible à la manipuler. Rien dans la spec ne
décide non plus si ces lettres sont visibles des parents, ni comment elles coexistent avec le
bulletin officiel.

**Gravité** · `À SURVEILLER` (décision d'auteur — mais à trancher explicitement avant C6-L2, pas
à découvrir en classe).

**Correctif minimal** · Découpler ce que voit l'élève de ce que calcule le système : côté élève,
afficher **la trajectoire et la cible** (« travaillé 4 fois · en progrès · prochaine étape : … »)
et non le niveau absolu ; garder l'échelle A-E côté prof (C6-L1). Si les lettres restent affichées :
décider et écrire leur statut vis-à-vis du bulletin et des parents.

---

## Vrac

- §1.5 dit « **provenance** `essai_fragments` » ; §6 place `essai_fragments` dans **`contexte`** et
  réserve `provenance` à `tc`|`hlp`. Une session codera l'un ou l'autre.
- Trois couples A/B différents dans le même document : « Option B » (en-tête, routeur),
  « variante A/B » (§4, routeur), « **option A** » (§1.4, bancs). Renommer le troisième.
- §0 : « ancres (celles de lecture restent à rédiger, **§5**) » — §5 de C3 traite des retours. Le
  renvoi vise sans doute le Référentiel ; il est illisible tel quel.
- `regime_cycle` = `plein`|`optionnel`|**`paires`** — `paires` n'est expliqué nulle part.
- `grain` n'a pas de valeurs énumérées, et « **segment** » (§4, table des proportions
  micro/méso/macro par segment × niveau) n'est défini nulle part.
- `lu_at` existe à la fois sur `exercices_depots` et sur `exercices_retours` ; et le « lu » de
  clôture du temps 6 (§3.6) n'a pas de timestamp dédié.
- `refaire_lisibilite` est un booléen unique pour un dépôt qui porte **deux** versions.
- `exercices_squelettes.lettre_equivalente` : une lettre par exercice et par compétence, c'est
  exactement la « fausse précision » que C6-L1 dit vouloir éviter.
- Aucune trace de l'**override prof** dans le schéma (pas d'`origine` sur `exercices`, pas de
  journal) alors que §4 en fait un principe.
- Convention « **écritures serveur** » (§6) contre le dépôt de photos, qui est nécessairement une
  écriture client : préciser la voie (URL signée émise par le serveur).
- `exercices_references` n'a pas de contrainte d'unicité (source + localisation) : le même texte
  sera décomposé et validé deux fois.
- Le **Monitoring** est au référentiel (§1.1) mais sa source est `exercices_metacognition`, pas un
  squelette : la règle M1 (« `competences_mesures` alimentée par les squelettes v1 uniquement »)
  ne permet pas de l'y écrire. Aucun chemin d'écriture n'existe pour lui.
- L'élève rencontre **deux voix d'IA dans Aletheia** (Calame pour les exercices, Aletheia pour les
  séances) : rien ne dit comment l'interface les distingue.
- §9 C4-L4 vise « 30 copies » là où la passation réelle en fait ~140 (70 élèves × 2 exercices).
- Le seuil de « contestations répétées » qui déclenche le drapeau prof (§3.4, §9 C6-L1) n'est pas
  chiffré.
- Le bonus « pull » est plafonné à 30 min/semaine mais rien ne dit ce qui arrive quand l'élève
  demande au-delà, ni si le quota se reporte.

---

## Angles morts

**AM1 — La mesure fabrique son propre progrès (boucle lexicale auto-confirmante).**
La couche contrat impose le « vocabulaire de la grille (garant, articulation, attache…) — **le même
que dans les exercices** ». Les fiches stratégiques l'enseignent, les retours l'emploient, les
questions d'auto-jugement le reprennent, et P1 extrait des observables que ce vocabulaire nomme.
Un élève de 17 ans, exposé vingt fois par an à ce circuit, apprendra très vite ce qu'il faut
**écrire pour être vu** : placer un connecteur, annoncer « mon garant est… », nommer son problème
en ouverture. Ces marqueurs de surface sont précisément ce qu'une extraction repère le mieux. La
compétence *mesurée* montera donc sans que la compétence *réelle* bouge, et rien dans le dispositif
ne peut faire la différence — parce que l'instrument qui mesure est l'instrument qui enseigne, et
qu'il n'existe aucun canal de contrôle indépendant. Pire, la boucle se referme : l'étalonnage de fin
d'année (G33) lira cette montée comme un progrès et **recalibrera le routeur dessus**. Personne ne
verra jamais l'artefact, parce qu'il s'installe dans les données de référence.
*Correctif* : garder **une ancre aveugle par semestre** — une production dans un format que le
système n'a jamais enseigné ni récompensé, notée à la main par Louis, jamais soumise à la chaîne
IA, comparée aux lettres du système. Deux copies par élève dans l'année ; c'est le seul point
d'appui extérieur du dispositif.

**AM2 — L'effort n'existe nulle part dans le modèle, et le canal haute fréquence est le canal que
personne ne regarde.**
Toute la trajectoire — donc toute la montée des lettres, donc tout le pilotage du routeur — repose
sur des productions faites à la maison, non notées, non lues par un humain, et l'élève le sait. Les
adolescents calibrent leur effort sur qui regarde ; en semaine 6, une partie substantielle des v1
sera écrite à 40 % d'effort, non par triche mais par arbitrage rationnel entre sept matières. Or la
télémétrie M3 mesure l'aide, le délai et la distance de contexte — **jamais l'engagement**. Un élève
capable et désinvesti est donc, dans `competences_mesures`, **indiscernable** d'un élève en
difficulté : même lettre basse, mêmes observables manquants. Le routeur répond ce qu'il est conçu à
répondre — des exercices plus élémentaires, une fiche stratégique complète à chaque ouverture — ce
qui est reçu comme une insulte et fait baisser l'effort d'un cran. Le faisceau T2 attrape la triche,
qui sera rare ; rien n'attrape le sous-effort, qui sera massif, et qui corrompt la mesure de la
même façon.
*Correctif* : au dépôt, à côté de la `confiance_declaree` qui existe déjà, **un geste unique sur
les conditions** (« j'y ai mis le temps qu'il fallait / j'ai fait au plus vite / je n'ai pas pu
m'y mettre »), stocké, **jamais noté, jamais montré à l'élève comme un jugement** — et deux règles :
une mesure déclarée bâclée ne fait **jamais monter** une lettre, et trois déclarations « pas pu »
d'affilée sont un drapeau prof, pas un allègement automatique.

**AM3 — Le dispositif n'a pas de propriétaire institutionnel, pas de mode sans Louis, et pas de
sortie.**
Le document décrit avec précision qui valide (le prof), qui arbitre (le prof), qui règle les seuils
(le prof) — et ne dit nulle part ce qui se passe **quand ce point unique s'absente**. Deux semaines
d'arrêt maladie en octobre : la file de validation s'arrête, donc les références nouvelles
s'arrêtent, donc le routeur ne peut plus instancier de lecture, donc le cycle s'arrête pour
70 élèves — et le remplaçant n'a ni les accès, ni le mandat, ni la moindre chance de comprendre le
dispositif. Au-delà de l'absence : le système constitue, sur des comptes personnels (Vercel,
Supabase, une clé d'API payée personnellement), un **dossier longitudinal intime sur 70 mineurs** —
photos d'écriture manuscrite, horaires de travail nocturne, durées, drapeaux d'intégrité,
contestations, stagnations. La spec ne nomme aucune autorisation de l'établissement, aucun
responsable du traitement autre que l'auteur, aucune procédure si un parent demande l'accès ou
l'effacement, et aucun scénario de sortie (changement d'école, arrêt du projet, demande du centre
de services). Le risque n'est pas technique : c'est qu'une seule plainte de parent, en novembre,
suffise à faire éteindre l'ensemble — après que 70 élèves aient investi trois mois dedans.
*Correctif* : avant septembre, **une page**, pas un chantier — mandat écrit de la direction,
responsable du traitement nommé, durées de conservation, procédure d'accès et d'effacement, et un
**mode dégradé sans prof** (le routeur continue à assigner depuis le stock de références déjà
validées pendant N semaines, sans rien instancier de neuf).
