# Six chantiers — relevé du 08/09/2026

Spec : PROMPT_six_chantiers.md, lu intégralement. Ordre : ①, ③, ④, ⑤, ⑥, puis proposition ② soumise à Louis.

## Décisions complémentaires de Louis

- Aucun rattrapage des anciens retours : corriger le futur.
- Pour les futurs retours aussi, la lecture par l’élève ferme le signal, même si le professeur ne l’a pas encore relu.

## État d’entrée

Après git fetch : HEAD = origin/main = 2c6f3e0, zéro commit de différence. Messages des six réparations du matin lus.
Les modifications de .gitignore, PROMPT_six_chantiers.md et les deux scripts de production préexistants restent hors des commits de cette session.

Portes remesurées le 08/09 à 13:02 UTC :

| Porte | Sandbox | Production |
|---|---|---|
| juge_mesure_actif | false | true |
| chaine_cle_actif | false | true |
| juge_documents_actif | true | true |
| gabarit_actif | true | true |

## ① — Le retour à relire

### Mesures

Production, 14:19 UTC, PostgREST en lecture seule, pagination par id unique, pages de 500 confrontées aux comptes exacts, toutes les erreurs contrôlées : **151 retours, dont 150 publiés**. La vraie fonction partagée retrouve **7 défauts de forme** : aucun point de réussite, tous sans verdict de cran enregistré. Six retours sont marqués lus ; un ne l’est pas. Zéro dépassement du plafond et zéro action de révision/pont manquant parmi les retours publiés. **Une ouverture maintenant lèverait zéro drapeau sur ces anciens retours.** Aucun dépôt, retour ou job de production modifié ni rejoué.

### Réparation

- Les règles 2 et 5 ont un seul domicile, `utils/chaine/forme-retour.ts`. Le contrôle avant publication et le lecteur du panneau l’appellent. Les ancrages éventuellement élagués ne font plus obstacle à la relecture de la forme persistée.
- Nouvelle nature `retour_a_relire`, avec phrase et motifs dans le panneau existant. Le lecteur reprend le périmètre réel de C7-L9 via `regimeJugeMesure`, pas la seule porte : sans réussite est admis uniquement avec ce régime et un verdict explicitement raté pour la version considérée.
- Le signal exige un retour publié, encore non lu, non édité par le professeur et créé depuis l’ouverture. Il disparaît à la lecture suivante du panneau quand `lu_at` est posé. Le panneau n’ajoute pas de rafraîchissement automatique entre deux visites.
- `scriptorium_params.retours_a_relire_depuis` est la configuration d’ouverture : **NULL = OFF**, une date ouvre le signal pour les nouveaux retours. Aucun état de contrôle ni marque de rattrapage n’est stocké sur les retours. La migration ne l’ouvre pas.
- Le drapeau `citation_composee` reste inchangé ; le nouveau signal ferme les règles 2 et 5.

### Preuves exécutées

Migration `attention_retours_a_relire.sql` : répétition annulée, colonne **0 → 1 → 0** ; puis application sandbox, paramètre NULL. Pas de migration en production.

Décor isolé de sandbox : nouveau dépôt et copie d’un exercice existant, deux points de travail réels de **560 et 368 caractères** repris du retour `042c3b93-af1a-4514-803f-190d58c5744d`. Leur omission de réussite est fabriquée pour l’épreuve ; leur prose ne l’est pas. Nom de l’élève de test : **3 caractères**. Aucun retour existant modifié.

Ancien assemblage du panneau (branchement retiré temporairement) : signal absent malgré le défaut. Branchement rétabli : signal présent avec son motif. Donnée du décor passée à `lu_at` non NULL : signal absent au rechargement. Donnée redevenue non lue : le vrai lecteur rend de nouveau le signal. Décor ensuite retiré et absence vérifiée ; configuration restaurée à NULL.

Captures avant, après, et après lecture aux **1280 / 768 / 375** : dossier local
`/Users/louissagnieres/.codex/visualizations/2026/09/08/01a08117-dbdc-7863-a15e-592ec291de25/chantier-1/`.

**Limite visuelle préexistante :** à 375 px en émulation mobile, la page entière s’élargit à 759 px et se réduit automatiquement, avant comme après le correctif. Les captures le montrent ; ce n’est pas un rendu mobile validé de toute la page. Consigné dans IDEES_post_rentree.md, hors périmètre.

TypeScript propre ; **2575 tests réussis**, dont 10 nouveaux tests purs du signal (72 tests ciblés avec ceux du retour). Aucun build lancé pendant le serveur de développement.

### Mise en service restant à Louis

Code non poussé, donc non déployé. Migration de production non jouée. Après déploiement et migration, l’ouverture consiste à poser l’instant courant dans `retours_a_relire_depuis` pour id 1 ; NULL ferme le signal. Cette date exclut les anciens retours, même encore non lus. Aucun SQL de rattrapage.

Les scripts de mesure et de recette sont hors dépôt, dans `/private/tmp/palimpseste-six-chantiers/`.
