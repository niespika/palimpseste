# Revue adversariale externe du dispositif RÉFÉRENTIEL + ROUTEUR

Documents audités, dans cet ordre :

1. `00-referentiel.md`
2. `01-routeur.md`

## Constats

1. **G1 — La lettre unique du Questionnement n’a aucune règle de résolution entre ses deux familles.**  
   **Où** — `00-referentiel.md` §1 et §6 · `01-routeur.md` §2, §3, §4, §5-R2, §7 et §8.  
   **L’attaque** — En semaine 1, un élève TC obtient **B** en Questionnement sur l’essai et **D** sur l’explication de texte. Les deux mesures sont des ancres simultanées ; pourtant le profil ne possède qu’« une lettre par élève × compétence » et « l’ancre fait foi ». Aucun texte ne dit laquelle fait foi, ni comment elles s’agrègent. Le plafond d’inflation et la cible R2 sont donc indéterminables. Même après agrégation, un élève B en questionnement de lecture mais D en questionnement d’écriture peut apparaître C : R2, côté écriture, ne voit plus la faiblesse qu’il devrait traiter. Le même trou réapparaît pour un bi-classe absent : « la médiane de sa classe » est ambiguë lorsqu’il appartient à deux classes. C’est une contestation de la **suffisance** de la fusion actée, pas nécessairement de la fusion elle-même.  
   **Gravité** — `BLOQUANT`.  
   **Correctif minimal** — Faire trancher une règle déterministe pour les collisions d’ancres et conserver, derrière la lettre commune affichée, un signal de routage dérivé par famille. Ne pas choisir l’agrégateur en implémentation.

2. **G2 — Le statut de recette est au mauvais grain : la compétence est filtrée, alors que c’est l’instrument qui est bancé.**  
   **Où** — `00-referentiel.md` §2, §5 et §6 · `01-routeur.md` §3, §5-R0, §10 et §12 · annexe A du prompt.  
   **L’attaque** — Argumentation passe la recette sur un paragraphe micro avec l’instrument v1 ; elle devient `evaluee`. Le routeur peut ensuite sélectionner une dissertation macro, un autre genre, ou l’instrument v2 après modification du prompt. Ces mesures non bancées alimentent pourtant lettres et escalade. Le Questionnement aggrave le défaut : un banc réussi côté écriture peut rendre la compétence ciblable côté lecture alors que ce versant n’a pas passé sa recette. Journaliser `instrument_version`, `modele` et `prompt_version` permet seulement de constater l’erreur après coup ; R0 ne filtre aucun de ces axes. Le régime envisagé « modèle économique au maison / modèle fort aux ancres » peut en outre fabriquer un offset de contexte que la règle de discordance interprétera comme aide extérieure ou stress.  
   **Gravité** — `BLOQUANT`.  
   **Correctif minimal** — Porter l’autorisation de recette sur `(compétence, famille, type, instrument_version, régime de modèle)` ; toute nouvelle version revient au moins en mesure silencieuse jusqu’à recette.

3. **G3 — `mesuree_silencieusement` fuit dans le profil qu’elle devait protéger.**  
   **Où** — `00-referentiel.md` §5-§6 · `01-routeur.md` §3, §6 et §7.  
   **L’attaque** — Une compétence de lecture non prête bascule en `mesuree_silencieusement`, conformément au repli du référentiel. Le §6 l’autorise dans le pool des sondes. Deux sondes réussies peuvent alors faire monter sa lettre ; des sondes échouées alimentent son escalade. Lorsqu’elle devient ensuite `evaluee`, elle hérite d’un état produit par l’instrument précisément écarté du profil faute de recette. Cela contredit la règle du référentiel : seules les mesures issues d’instruments bancés alimentent le profil.  
   **Gravité** — `BLOQUANT`.  
   **Correctif minimal** — Stocker ces mesures dans une voie « shadow » : aucune lettre, escalade, calibration du Monitoring ni fenêtre d’évidence opérationnelle avant validation explicite de l’instrument.

4. **G4 — L’annexe A ne permet pas d’exécuter l’escalade ni la sélection de la meilleure sonde.**  
   **Où** — `01-routeur.md` §6 et §12 · annexe A du prompt.  
   **L’attaque** — N1 détecte l’échec de `garant_cité` et doit choisir « un type qui l’isole ». Le contrat ne déclare que la compétence primaire, les secondaires, le grain, le geste et une complexité globale : aucun attribut ne dit quel observable un type travaille ou isole. De même, la règle de sondage veut retenir l’exercice offrant « le substrat le plus riche » à Structure, mais `competences_secondaires[]` n’exprime qu’une éligibilité binaire. Deux types également éligibles sont donc indiscernables pour les règles actées.  
   **Gravité** — `BLOQUANT`.  
   **Correctif minimal** — Ajouter une couverture d’observables par type, distinguant au minimum « exercé », « isolé » et « seulement observable », ainsi qu’un rang de richesse de sonde par compétence secondaire.

5. **G5 — Le passage forcé `optionnel → plein` casse le budget par construction.**  
   **Où** — `01-routeur.md` §4, §6 et §9 · annexe A du prompt.  
   **L’attaque** — Un type transformatif ne déclare qu’une `duree_exercice_min`. En régime normal, sa vf est optionnelle ; en N1, elle devient obligatoire. Si la durée déclarée exclut la vf, une semaine remplie jusqu’au plafond déborde dès l’escalade. Si elle inclut toujours la vf, les semaines normales réservent du temps fictif et ne remplissent pas réellement le budget. Le chantier « construction de la semaine » ne peut pas résoudre ce dilemme avec l’interface fournie. La promesse de propositions iso-durée devient également fausse dès que le régime effectif diffère.  
   **Gravité** — `BLOQUANT`.  
   **Correctif minimal** — Déclarer la durée par régime effectif — ou ses composantes — et faire calculer le budget après application de l’escalade.

6. **G6 — Le Monitoring acté au schéma n’est ni représentable conformément au référentiel, ni calculable.**  
   **Où** — `00-referentiel.md` §1-§3 · `01-routeur.md` §2, §3 et §10.  
   **L’attaque** — Le référentiel impose deux formes incompatibles : lucidité en présent/absent ; calibration en amplitude 0-3 plus direction. Le routeur décrit pourtant chaque ligne « élève × sous-dimension » avec `amplitude_courante` et `direction_courante`, y compris `lucidite_incompris`. Il n’existe par ailleurs aucune table de calcul reliant « sûr / pas sûr », 2-3 réponses métacognitives et un niveau E-A à une amplitude 0-3. Exemple : l’élève se dit sûr, obtient C et répond correctement à deux questions sur trois — aucune règle ne permet au code de produire 1, 2 ou `indetermine`. Des sous-dimensions toujours `[à valider]` sont ainsi présupposées résolues par des tables déclarées actées.  
   **Gravité** — `BLOQUANT`.  
   **Correctif minimal** — Conserver d’abord les événements bruts ; séparer strictement l’état booléen de lucidité de l’état amplitude/direction ; faire trancher une table de calcul déterministe avant de produire `calibration`.

7. **G7 — Le contrat des types ne porte ni l’éligibilité de parcours ni ses invariants internes.**  
   **Où** — `00-referentiel.md` §6 · `01-routeur.md` §2 et §9 · annexe A du prompt.  
   **L’attaque** — Le référentiel exclut certains types en HLP ou exige une variante. Or un type générique a `genre = null` et le contrat ne possède aucun `parcours_eligibles[]` : le routeur ne peut pas distinguer un type commun d’un type TC seulement sans coder des identifiants en dur. Le contrat autorise aussi formellement `geste=diagnostic` avec `regime_v1vf=plein`, alors que le §9 impose « diagnostic → paires », ou `production → optionnel`, alors que le tableau impose « production → plein ».  
   **Gravité** — `BLOQUANT`.  
   **Correctif minimal** — Ajouter l’éligibilité TC/HLP et une matrice de validation croisée entre famille, genre, geste et régime v1→vf.

8. **G8 — Un élève absent peut sortir du provisoire sans aucune preuve individuelle.**  
   **Où** — `01-routeur.md` §4, §5, §7 et annexe B.  
   **L’attaque** — L’élève manque le diagnostic et reçoit la médiane de classe, par exemple Expression D. R1 lui impose alors la moitié des exercices sur Expression sur la foi d’une valeur empruntée. S’il manque aussi une partie du segment 2 ou si le budget ne couvre pas toutes les compétences, le booléen bascule néanmoins à date fixe en fin de semaine 4 : les lettres s’affichent et l’escalade devient possible sans que le seuil de couverture ait été atteint pour cet élève.  
   **Gravité** — `AVANT-ALLUMAGE`.  
   **Correctif minimal** — Clore le segment globalement, mais ne lever `profil_provisoire` qu’élève par élève après une condition minimale d’évidence ; garder les lettres masquées sinon.

9. **G9 — Un élève stabilisé au niveau cible satisfait littéralement la définition de la stagnation.**  
   **Où** — `01-routeur.md` §6.  
   **L’attaque** — Un élève à A a tous ses observables acquis. Trois nouvelles mesures réussies ne changent aucun statut et sa lettre reste nécessairement immobile. Il est donc « stagnant » selon la définition actée. N1 demande ensuite de sélectionner « l’observable non acquis au taux le plus bas » ; cet observable n’existe pas. Même absurdité pour un élève à B bloqué par le plafond d’ancre mais dont tous les observables mesurables sont acquis.  
   **Gravité** — `AVANT-ALLUMAGE`.  
   **Correctif minimal** — Ajouter comme précondition d’escalade l’existence d’au moins un observable requis non acquis. La stabilité acquise doit produire entretien ou absence d’action, jamais N1.

10. **G10 — La sonde échouée est déclarée trop ambiguë pour la lettre, mais assez forte pour envoyer l’élève jusqu’en N3.**  
    **Où** — `01-routeur.md` §6-§7.  
    **L’attaque** — Structure est secondaire sur trois exercices centrés ailleurs. L’élève échoue les sondes parce que « l’attention était ailleurs » — raison explicitement donnée au §7 pour ne pas pénaliser sa lettre. Les mêmes mesures comptent néanmoins comme tentatives plates au §6. Elles peuvent déclencher N1, N2 puis, avec le temps, N3 et un dossier professeur. Une mesure réputée insuffisante pour une conséquence faible produit donc une conséquence opérationnelle beaucoup plus forte.  
    **Gravité** — `AVANT-ALLUMAGE`.  
    **Correctif minimal** — Faire trancher quelles sondes peuvent incrémenter les compteurs d’escalade. À défaut, réserver le déclenchement aux mesures où la compétence était cible ; les sondes peuvent confirmer ou désescalader.

11. **G11 — R2 donne deux priorités opposées au même élève B.**  
    **Où** — `01-routeur.md` §5-R2.  
    **L’attaque** — Argumentation, Structure et Questionnement sont toutes à B et aussi récentes. Le départage acté choisit `Argumentation > Structure > Questionnement`. La phrase suivante dit qu’« chez les B visant A, le Questionnement remonte en priorité ». Le pipeline ne contient aucun branchement qui renverse le départage : deux implémentations conformes produiront des cibles opposées.  
    **Gravité** — `AVANT-ALLUMAGE`.  
    **Correctif minimal** — Écrire une seule précédence exécutable pour le cas B/A, en indiquant explicitement si elle remplace ou non le départage général.

12. **G12 — L’override post-hoc ne permet pas réellement au professeur de “disposer”.**  
    **Où** — `01-routeur.md` §1.8.  
    **L’attaque** — Un élève bénéficie d’un aménagement ou un contenu proposé est inapproprié pour sa situation. Le routeur assigne l’exercice et l’élève le voit ; le professeur découvre ensuite l’affectation sur un écran en lecture seule. L’override peut corriger la suite, mais il ne peut retirer ce qui a déjà été montré ni empêcher une première mesure erronée. C’est une contestation explicite de la décision actée de suppression de la validation préalable.  
    **Gravité** — `AVANT-ALLUMAGE`.  
    **Correctif minimal** — Sans rétablir une file hebdomadaire générale, permettre des contraintes préalables persistantes par élève/type/contenu et une mise en attente des cas signalés.

13. **G13 — La facture est théorisée, mais la télémétrie ne permet pas de la mesurer.**  
    **Où** — `01-routeur.md` §4, §6, §8, §10 et §11.  
    **L’attaque** — Avec seulement un exercice routé par élève et par cycle :  
    `70 × 28 × (2N+4)` = **11 760 appels** pour N=1, **15 680** pour N=2, **19 600** pour N=3.  
    Un diagnostic complet coûte `(2×6+4) + (2×5+4) = 30` appels par passage et par élève ; trois diagnostics coûtent donc `70 × 3 × 30 × X = 6 300X` appels. Avec X=3, le total atteint déjà **30 660 à 38 500 appels**, avant retries ; à deux exercices hebdomadaires, **42 420 à 58 100**. Or le §10 journalise modèle et versions, mais pas le nombre réel d’appels, les retries, les tokens entrants/sortants/cachés ni le coût imputable aux sondes et multi-appels. La télémétrie prévue ne verra donc pas ce que le dispositif déclare vouloir arbitrer.  
    **Gravité** — `AVANT-ALLUMAGE`.  
    **Correctif minimal** — Journaliser l’usage et le coût par appel, phase, exercice et motif de sonde ; agréger par élève, type et cycle avec une alerte budgétaire.

14. **G14 — La montée maison peut récompenser pendant six semaines un travail externalisé.**  
    **Où** — `01-routeur.md` §7 et §10.  
    **L’attaque** — Après une ancre D, un élève fait produire ses versions maison par une IA externe ou un tiers. Des séries réussies le font monter D→C puis C→B, exactement jusqu’au plafond acté `ancre + 2`. Le routeur lui donne alors du méso/macro et cesse de traiter ses vraies faiblesses. Le prochain DS le ramènera à D avec drapeau, mais après plusieurs cycles mal routés. `aide_consommee` ne suit que l’aide interne à la plateforme. C’est une contestation explicite du plafond acté à +2 dans un contexte de travail maison non supervisé.  
    **Gravité** — `À SURVEILLER`.  
    **Correctif minimal** — Faire trancher une confirmation supervisée avant le second cran gagné exclusivement à domicile, ou distinguer provisoirement cette montée dans l’état de routage.

## Vrac

- `00-referentiel.md` §2 affirme encore que le §10 du routeur ne journalise pas le Monitoring ; `01-routeur.md` §10 a depuis refermé cette alerte.
- Le statut initial de `00-referentiel.md` dit encore que `01-routeur.md` reste en relecture ; celui-ci se déclare validé le 30 juillet.
- `00-referentiel.md` §6 décrit encore l’ancienne R6 fondée sur la provenance TC/HLP ; `01-routeur.md` §5 l’a dissoute et remplacée par le genre.
- `00-referentiel.md` §1 autorise un retour sur « une ou deux » compétences ; `01-routeur.md` §1 impose que seule la cible reçoive le retour, tandis que sa couche 3 conserve le pluriel « compétences retournées ».
- `01-routeur.md` §13 porte deux renvois incompatibles pour l’indexation lecture : `02-exercices.md` §8 et `competences-lecture/types-lecture.md` §6.
- Une rentrée le 25 août suivie de trois semaines de calibration conduit vers le 18-20 septembre, pas naturellement « fin septembre ».
- Les mentions « ni pause » sous `profil_provisoire` sont des reliquats : le §4 acte désormais que la stagnation ne réduit jamais le volume.
- L’attribut `complexité` de l’annexe A n’a ni nom technique stable ni domaine de valeurs, alors qu’il pilote directement 0, 1 ou 2 sondes.
- Le §10 dit que `distance_contexte` permet à N2 de distinguer réception et transfert ; l’algorithme de N2 au §6 prend sa décision depuis `delta_v1_vf`, sans consommer ce champ.

## Angles morts

- **Loi 25 et mineurs.** Le dispositif conserve des copies, citations verbatim, niveaux, confiance déclarée, métacognition, choix comportementaux, tirages aléatoires et historiques d’aide. Aucun des deux documents ne fixe minimisation, durée de conservation, accès, suppression, dépersonnalisation des analyses, séparation professeur/fournisseur IA ou procédure d’incident.

- **Capacité du professeur à absorber N3.** Si seulement 20 % des 70 élèves stagnent sur deux observables, cela représente déjà **28 dossiers** potentiels. Le système sait transférer la charge mais ne possède ni file priorisée, ni plafond hebdomadaire, ni délai d’intervention, ni comportement de repli ; les élèves restent entre-temps en entretien sans échéance.

- **Aménagements et biais de canal.** R1 impose la moitié des exercices d’Expression à tout élève coté D, sans distinguer faiblesse du construct, dyslexie, trouble moteur, français langue seconde ou transcription/OCR dégradée. Avec l’override uniquement post-hoc, une caractéristique d’accès peut devenir automatiquement le centre du parcours.
