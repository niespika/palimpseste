# PROMPT — Session de révision de `01-routeur.md` (section par section, sur plusieurs séances)

> **Usage** : ouvrir une session **Cowork fraîche** avec les deux dossiers connectés —
> `GitHub/palimpseste` (repo) et `GitTest/palimpseste-conception` (conception) — et coller ce
> prompt. La session travaille avec Louis, en français. **Le prompt est réutilisable** : on le
> recolle à chaque nouvelle séance, la table de progression du §0 dit où on en est.

---

## Ta première action, avant toute autre chose

**Affiche `01-routeur.md` dans le panneau latéral.** Charge-le depuis
`palimpseste-conception/01-routeur.md` et **envoie-le à Louis** (il s'affichera à droite en lecture)
— il doit pouvoir le lire pendant qu'il te commente, sans quitter la conversation. **Refais-le à
chaque fois que tu modifies le fichier**, pour qu'il ait toujours la version courante sous les yeux.

Puis lis, dans cet ordre, et rien de plus :

| Fichier | Ce qu'on y lit |
|---|---|
| `palimpseste-conception/CONTEXTE.md` | conventions du chantier, journal des décisions, **règle de circulation avec C3** |
| `palimpseste-conception/01-routeur.md` | le document à réviser |
| `palimpseste/SPEC_C3_exercices_competences.md` | **le Tableau de bord du socle** (journal des amendements + ce qui n'est pas décidé), puis §0, §4, §4bis, §4ter, §6 |
| `palimpseste-conception/00-referentiel.md` | **relu intégralement le 29/07** — c'est lui qui porte les amendements A1 à A6 |

Ne relis `02-exercices.md`, `03-`, `04-` et les fichiers de `competences/` que si Louis demande un
détail précis.

---

## §0 — Table de progression — **RÉVISION CLOSE LE 30/07 : les quatorze sections sont passées, le document est VALIDÉ.** Ce prompt est archivé ; il ne sert plus qu'à retrouver la méthode.

| Section de `01-routeur.md` | Statut | Séance |
|---|---|---|
| 1. Principes fondateurs | **PASSÉ** — vocabulaire « cycle » fixé, cadence 2-1 supprimée, §1.4 réécrit | 30/07 |
| 2. Périmètre modulaire et référentiels | **PASSÉ** — un seul routeur (Scriptorium prof), profil partagé, Quazian hors profil, surface élève unique | 30/07 |
| 3. État par élève × compétence | **PASSÉ** — evidence dérivé et non stocké, provenance A3, Monitoring en tables propres (A8), profil_provisoire | 30/07 |
| 4. Les cinq couches | **PASSÉ, rouvert et recorrigé pendant la passe §5** — 5 segments, proportions micro/méso/macro par (segment × lettre de la cible), plancher macro au segment 5, options iso-durée | 30/07 |
| 5. Règles de ciblage R1-R6 | **PASSÉ** — R0 + calibration écrites, R1/R5 en exercices, R6 réécrite (A5 tranché : drapeau par genre), seuil Questionnement acté ; « construction de la semaine » → session dédiée | 30/07 |
| 6. Stagnation et escalade | **PASSÉ** — règle d'espacement écrite (B1-2 refermée), N3 en double condition (mesures ET semaines), vf requise en escalade, « cible jamais volume » explicité | 30/07 |
| 7. Lettres : montée, descente, garde-fous | **PASSÉ** — plancher + fenêtre liés, cadence d'ancre + signal, asymétrie des sondes actée, profil_provisoire ; révision « certitude » reste en session dédiée | 30/07 |
| 8. Ancres : diagnostics et mesures en classe | **PASSÉ** — semaine 1 = essai + explication (batterie micro écartée), inventaire complet (DS, Fragments, ancre aveugle), formats déc./mars [à valider] | 30/07 |
| 9. Régimes de cycle v1→vf | **PASSÉ** — renommé « Régimes v1→vf », champ `regime_v1vf`, budget slot mort (duree_exercice_min), exception escalade | 30/07 |
| 10. Télémétrie et journalisation | **PASSÉ** — aligné sur C3 (A3, A8, M3), sondes + motifs au journal, alerte Monitoring refermée, boucle de calibration stratifiée par escalade | 30/07 |
| 11. Paramètres ouverts | **PASSÉ** — le §11 fait foi pour les paramètres du routeur ; valeurs importées de C3 B4 ; registre en 5 groupes, à jour de la journée | 30/07 |
| 12. Ordre de développement de la couche 3 | **PASSÉ** — deux ordres deux maisons (priorité au routeur, méthode au référentiel), Questionnement dernier mais réquisitionnable par la lecture, ordre lecture créé « à établir » | 30/07 |
| 13. L'aile lecture | **PASSÉ** — filet calendaire disparu (urgence B1-5 accrue), agenda de la session rafraîchi (6 points), proposition minimale v1 mise à jour | 30/07 |
| Annexe B — cas de comportement attendu | **PASSÉ** — 3 cas réécrits (dont « transfert par genre »), 3 cas nouveaux (fort au mauvais jour, calibration, sonde qui monte) | 30/07 |

---

## Le régime de travail

**Une section à la fois, dans l'ordre du document.** Pour chaque section, dans cet ordre :

1. **Tu la restitues en quelques lignes** — ce qu'elle dit, en clair. Louis n'a pas à relire son
   propre texte pour se souvenir de ce qu'il a écrit il y a douze jours.
2. **Tu poses ce que la séance de gel de C3 impose de changer dans cette section** (la liste est au
   §1 ci-dessous) — factuellement, sans plaider.
3. **Tu signales ce que tu y vois de fragile** : contradiction interne, règle qui présuppose une
   donnée qui n'existera pas, chiffre sans justification, silence sur un cas fréquent.
4. **Louis commente.** Tu écoutes, tu **reformules sa décision en spécification précise**, tu la
   **fais confirmer**.
5. **Tu écris dans le fichier immédiatement**, section par section — **pas à la fin de la séance**.
   Une séance interrompue ne doit rien perdre.

**Règle cardinale** : tu ne tranches rien à la place de Louis. Tu proposes, tu chiffres, tu vérifies
la cohérence avec les autres sections et avec C3 — et tu t'arrêtes. Si un point n'est pas tranché,
il se marque **[à valider]**, jamais « acté ».

**Statuts** : *acté* / *provisoire (réglage empirique)* / *[à valider]*. Ne jamais présenter une
proposition comme actée. Un « oui » de Louis acte un **principe**, jamais un résultat : les seuils
chiffrés restent provisoires sauf mention contraire de sa part.

**Convention d'écriture anti-écrasement** : relire le fichier sur disque **juste avant** de l'écrire,
modifier par **insertions ciblées**, jamais de régénération entière depuis ta mémoire.

**Style** : lisibilité avant densité ; expliciter chaque sigle à sa première occurrence ; rappeler le
contexte d'un point avant d'en discuter.

---

## §1 — Ce que les autres chantiers ont laissé à ce document

Cette liste n'est pas exhaustive : c'est la dette connue au 29/07. Elle se traite **dans la section
où elle tombe**, pas en bloc.

### Dette venue du gel de C3 (séance du 29/07)

| Section visée | Ce qui doit changer |
|---|---|
| **§1** (principes) | Le principe §1.4 « **mesurer large, retourner étroit** — chaque exercice évalue 2-3 compétences » est **remplacé** : la compétence mesurée en secondaire n'est **jamais** celle qu'on travaille dans la semaine ; 1 ou 2 secondaires par cycle, **une fois chacune**, en **répétition espacée**. |
| **§1** (principes) | Le budget §1.2 (~20 cycles/an) doit se relire à la lumière des **budgets par élève** de C3 §4 (plancher/plafond : HLP 60-90, TC 45-60, bi-classe 90-120 min, en **temps de cycle**). |
| **§3** (état par élève) | `evidence` porte « provenance (TC/HLP) » → devient **`classe_id` nullable** et un **parcours dérivé qui vaut `indetermine` par défaut** (amendement A3). Ajouter **`profil_provisoire`**. |
| **§3** | L'**état du Monitoring** ne se range pas dans une `lettre` : amplitude d'écart 0-3 + direction (amendement A2). |
| **§5** (R1-R6) | **R2** cite « le trio {Problématisation, Argumentation, Structure} » → **Questionnement** (amendement A1), et l'ordre de départage acté (Argumentation > Structure > Problématisation) doit être relu sous le nouveau nom. |
| **§5** | **R6 est à revoir** — c'est l'amendement **A5, en attente de décision** : ses cibles disjointes TC/HLP et son drapeau « transfert » **présupposent une provenance disponible sur le travail maison**, qui n'existera pas (A3). Que devient R6 si le parcours vaut `indetermine` pour la quasi-totalité des mesures ? |
| **§5** | **Règle nouvelle à écrire : le routeur ne cible que les compétences `evaluee`.** Et la **voie mixte** : quand peu de compétences le sont, il ne remplit qu'une partie du budget, le reste allant aux exercices communs du prof. |
| **§5 ou §4** | **Règle nouvelle à écrire : la construction de la semaine sous contrainte de budget** — comment composer des types de durées très inégales (de quelques minutes à 45) entre plancher et plafond, en servant les cibles. C'est l'ouverture n°3 du tableau de bord de C3, et elle bloque le *fait quand* de C4-L2. |
| **§6** (stagnation) | **Alignement de vocabulaire, décidé le 29/07** : *la stagnation change la **cible**, jamais le **volume***. C'est déjà ce que fait N3 ; c'est la paraphrase du §4 de C3 qui avait créé l'ambiguïté. Vérifier que le §6 le dit sans équivoque. |
| **§6** | **Règle nouvelle à écrire : l'espacement des mesures secondaires** — quelle compétence sonder, à quelle cadence. C'est l'ouverture n°2 du tableau de bord de C3 ; elle décide du nombre d'appels IA par cycle, donc de la facture. Entrées disponibles : `delai_jours` et `delai_mesures`. |
| **§7** (lettres) | **Plancher de mesure** : au moins une mesure toutes les 3 semaines sur toute compétence ciblée. **Fenêtre de montée temporelle** = 2 × la période du plancher, soit 6 semaines. Les deux paramètres sont **liés par construction**, pas fixés séparément. |
| **§7** | **Niveaux initiaux en `profil_provisoire`** : ni pause ni escalade sur la foi d'une seule ancre. |
| **§7 / §8** | **Cadence d'ancre** : une par compétence `evaluee` toutes les 6 semaines ; si le **plan d'évaluation** manque l'objectif, **signal non bloquant au prof** — et **la lettre continue de monter** (pas de gel). L'exigence de « fraîcheur d'ancre » pour le second cran est abandonnée. |
| **§8** (ancres) | **Ancre aveugle** : le bac blanc, corrigé à la main hors chaîne IA, est marqué comme telle au calendrier d'évaluation, et **mis en regard des lettres une fois par semestre**. C'est la mise en regard qui est le dispositif. |
| **§9** (régimes) | Le « budget slot ~40 min (v1 ~20 + vf ~20) » est à relire : C3 compte désormais en **`duree_cycle_min`**, et un exercice de 45 min de rédaction coûte 75 à 90 min de cycle. |
| **§10** (télémétrie) | « provenance (TC/HLP) » → **`classe_id` nullable + famille**. Ajouter les définitions arrêtées en C3 : `distance_contexte` (`meme_type`/`meme_famille`/`transfert`), **`delai_jours` et `delai_mesures`** (deux champs), `aide_consommee` (dépliages + relectures), `delta_v1_vf` = **comparaison des squelettes**, **NULL ≠ 0**. |
| **§11** (paramètres) | « Seuil d'entrée de Problématisation » → **Questionnement**. Ajouter les paramètres nouveaux de C3 §4 avec leur statut provisoire. |
| **§12** (ordre) | L'ordre de développement cite « Problématisation en dernier » → **Questionnement**, et la fusion change peut-être sa place : une compétence des deux familles n'a plus le même coût d'entrée. |
| **§13** (aile lecture) | Les **règles de ciblage lecture** n'existent pas (R1-R6 sont écrites pour l'écriture) — ouverture n°5 du tableau de bord de C3. À traiter ici ou en session dédiée, mais **avant l'allumage**. |
| **Annexe B** | Les trois cas de comportement attendu citent l'ancien vocabulaire (« Problématisation », « provenance HLP ») — à réécrire une fois les sections passées. |

### Dette venue de la relecture du `00-referentiel.md` (amendements du 29/07)

- **A1 — le Questionnement.** Les deux Problématisations n'en font plus qu'une : **dix compétences**
  (5 écriture, 4 lecture, le Questionnement des deux familles) **+ le Monitoring**. L'activation se
  lit **(compétence × famille × classe)**. Le Questionnement est **inactif en écriture pour HLP,
  actif en lecture**. Tout le vocabulaire « TC 6 / HLP 5 » de ce document est à reprendre.
- **A2 — le Monitoring hors échelle commune** : amplitude d'écart 0-3 + direction, jamais noté,
  **jamais cible du routeur**. À refléter au §3 et au §7.
- **A3 — le parcours n'est pas observable sur le maison** : `classe_id` nullable, parcours dérivé
  `indetermine` par défaut. À refléter aux §3, §5 (R6), §10.
- **A5 — R6 à revoir**, en attente de décision : c'est le point le plus lourd de cette révision.
- **A6 — jalon « voir un palier Acquis produit »** au critère de recette, en attente de décision :
  il touche C3 §1.7 plus que ce document, mais il concerne le routeur si les seuils d'escalade en
  dépendent.

---

## §2 — Fin de chaque séance (obligatoire, même si la séance est courte)

1. **Le fichier `01-routeur.md` est déjà à jour** (tu l'as écrit section par section) ; **renvoie-le
   à Louis** pour qu'il voie la version courante dans le panneau latéral.
2. **Mets à jour la table de progression du §0** de ce prompt, et redépose-le.
3. **Journalise au `CONTEXTE.md`** : une entrée datée avec les décisions de la séance — **les
   « non » et les solutions propres de Louis en détail**, les accords simples résumés par plage —
   la mention des sections validées, et les fichiers touchés.
4. **Termine par la ligne obligatoire** (convention du `CONTEXTE.md`, 29/07) :
   **« impact C3 : néant »** ou **« impact C3 : amendement X »**. Sans cette ligne, la séance n'est
   pas close.
5. Si la séance produit un **amendement à C3**, inscris-le au **Tableau de bord du socle** en tête de
   `SPEC_C3_exercices_competences.md` (date · origine · ce qui change · sections · régime a/b/c), et
   **vérifie si un prompt de lot Code en devient périmé** — si oui, dis-le explicitement.
6. **Quand une section devient stable, marque-la dans `01-routeur.md`** : le document porte encore
   « EN RELECTURE par Louis » en tête. Il ne pourra passer « validé » — et débloquer les lots dont le
   manifeste l'exige — que lorsque **toutes** les sections seront passées.

---

## Interdits

- **Ne rien trancher à la place de Louis.** En cas de doute ou de décision que ce prompt ne règle
  pas : note la question, pose-la, et arrête-toi.
- **Ne pas régénérer le fichier entier** depuis ta mémoire — insertions ciblées uniquement.
- **Ne pas ouvrir les revues adversariales de C3** ni les fichiers de `competences/` sans demande
  explicite : ils ne sont pas au périmètre.
- **Ne pas traiter plusieurs sections d'un coup** parce que « elles sont courtes ». Le rythme d'une
  section à la fois est un choix de Louis, pas une contrainte technique.
