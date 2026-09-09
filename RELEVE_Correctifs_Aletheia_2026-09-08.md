# Correctifs Aletheia — 8 septembre 2026

Les six défauts de `AUDIT_ALETHEIA_2026-09-08.md` sont corrigés dans le code local et les tests de non-régression. **Le code n’a pas été poussé ni déployé et la migration n’a pas été appliquée aux bases Supabase.** Aucun contenu d’élève réel n’a été modifié.

## Comportements corrigés

- **F1 — Retours concurrents.** Une fonction PostgreSQL réserve atomiquement la copie et renvoie son snapshot avec un jeton. Une seconde tâche est refusée pendant le bail de 90 secondes. Une tâche qui termine ou échoue après reprise du bail ne peut plus modifier la copie : toutes les écritures vérifient son jeton. La création de cartes de vocabulaire ne commence qu’après un enregistrement réussi du retour.
- **F2 — Diagnostics périmés.** Deux versions UUID distinguent les soumissions V1 et VF. Un trigger renouvelle la version et invalide les diagnostics concernés dans la transaction qui change la copie. L’enregistrement d’un diagnostic prend le verrou du travail et refuse une ancienne version ou une phase encore modifiable. Les phases sont enregistrées séparément : l’échec de la VF ne perd plus la V1 réussie. Le diagnostic automatique suit uniquement un retour enregistré ; une relance réussie le reprend aussi.
- **F3 — Livres de parcours.** Le suivi professeur, son compteur et la sélection du diagnostic manuel utilisent désormais le lecteur de livres commun avec l’élève : affectations directes et parcours actifs, livres supprimés exclus et séances exposées respectées.
- **F4 — Reprise du surlignage.** Le serveur reconstitue la bonne phrase lorsqu’elle a déjà été révélée. Le composant restaure cette phrase et abandonne la mauvaise sélection antérieure. Avant un succès ou le deuxième essai, aucune bonne réponse supplémentaire n’est envoyée au navigateur.
- **F5 — Graphe.** Une VF dont la thèse est déclarée non définie produit une absence de point, sans reprendre le niveau V1. Le niveau zéro reste une valeur valide.
- **F6 — Synthèse de repli.** L’interaction de comparaison n’est proposée que si la couverture correspond à toutes les phrases affichées. Sinon, la lecture simple et son bouton de clôture restent disponibles. Le texte de la synthèse canonique est figé pendant la génération pour qu’une modification de la fiche ne décale pas les identifiants évalués.

Ces corrections ne créent pas de nouvelle fonctionnalité à activer : les portes existantes restent inchangées.

## Validations terminées

| Vérification | Résultat |
|---|---|
| Suite complète `npm test` | **2 593 tests réussis, 0 échec** |
| `npx tsc --noEmit` | Réussi |
| ESLint ciblé sur les fichiers applicatifs et tests modifiés | Réussi, sans avertissement |
| `npm run build` | Réussi ; accès réseau autorisé pour télécharger les polices Google |
| Reproductions de l’audit transformées en tests | F1 à F6 validés ; harnais intégré à `npm test` |
| PostgreSQL local réel | Migration, concurrence, privilèges et retour arrière validés |

La recette SQL a vérifié une répétition annulée et le retour au schéma initial, puis l’application réelle dans une base jetable. Quatre appels concurrents de réservation ont produit un seul propriétaire. Un bail expiré a été repris ; les succès et échecs de l’ancien propriétaire ont été refusés. La course entre publication d’un diagnostic et réécriture de sa copie laisse bien l’ancien inventaire invalidé. Les RPC sont interdites à `anon` et `authenticated`, et la réservation fonctionne sous `service_role`. Le rollback a retiré les colonnes ajoutées en conservant la copie.

Le cluster PostgreSQL temporaire a été arrêté après la recette. Les connexions à ce cluster et le téléchargement des polices ont demandé une sortie du bac d’exécution ; aucune connexion Supabase n’a été effectuée par les recettes de correction.

**Limites :** pas de recette navigateur ni de mesure de l’incidence des défauts sur les anciens travaux réels. Les tests de composant utilisent des hooks simulés et vérifient les props rendues. Les diagnostics historiques ne sont pas recalculés globalement ; toute nouvelle soumission invalide désormais les données de diagnostic qu’elle remplace.

## Mise en service restante

La migration et son rollback sont inscrits au journal `SUIVI_SQL.md` avec les deux environnements encore décochés :

- `aletheia_retours_coherents.sql` ;
- `aletheia_retours_coherents_rollback.sql`.

Suivre le protocole renforcé du journal : code mergé/poussé d’abord, migration sur sandbox puis production dans une fenêtre calme, avec smoke élève immédiat. **La migration est nécessaire aux nouveaux générateurs** : tant qu’elle manque, ils refusent de lancer l’IA sans réservation et le travail reste en attente. Il faut donc coordonner ces étapes et éviter des générations en cours pendant la bascule. La génération d’un retour et le diagnostic d’une nouvelle copie doivent être éprouvés dans le smoke.

Le rollback retire les nouveaux verrous et versions ; il doit accompagner un retour au code précédent. Il ne restaure pas les diagnostics invalidés depuis la migration, qui devront être recalculés au besoin.

## Rejouer les tests

Depuis la racine du dépôt :

```sh
npm test
node scripts/recette/audit-aletheia-2026-09-08.cjs
npx tsc --noEmit
npm run build
```

Pour la recette SQL, utiliser exclusivement le cluster local jetable attendu par le script, jamais Supabase. Initialiser le répertoire avec `initdb` seulement s’il n’existe pas, puis démarrer le cluster et lancer la recette :

```sh
initdb -D /tmp/aletheia-pg-audit-20260908 -A trust --no-locale
pg_ctl -D /tmp/aletheia-pg-audit-20260908 -l /tmp/aletheia-pg-audit.log -o "-k /tmp/aletheia-pg-audit-20260908 -p 55438 -c listen_addresses=''" start
node scripts/recette/aletheia-concurrence-sql.mjs --stop
```

Le script crée une base de test distincte à chaque exécution, la supprime à la fin et, avec `--stop`, arrête le cluster. Les erreurs IA simulées dans le harnais applicatif sont volontaires ; leur journalisation n’indique pas un échec de la recette.
