# IDEES_post_rentree — le parking à idées

> Règle du plan de rentrée : après le gel des specs (dim 26/07), **toute idée nouvelle atterrit ici**
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

- **Fragments — page élève n'honore pas `modules.actif`.** Contrairement à codex/quazian/aletheia (dont les pages de validation font `notFound()` sur `!modules.actif`), `app/eleve/modules/fragments-erudition/page.tsx` et `validerLectureRetour` ne gardent que sur l'assignation (`inscriptionsModuleEleve`), jamais sur `modules.actif`. Donc désactiver Fragments globalement tout en le laissant assigné laisse l'élève y accéder. Piste consistance : ajouter la garde `actif` à la page + `validerLectureRetour` (le gate C1-B1 est déjà correct dans les deux cas — il reflète cette garde réelle par module). *(repéré pendant la revue C1-B1)*
- **Aletheia/Codex — brouillon persistant des soumissions (localStorage).** C1-B2 rend l'échec de soumission visible et garde le texte dans le formulaire (state React), mais un rechargement / onglet fermé / redirection `/login` après expiration de session perd encore les 5 champs V1 (jusqu'à ~8000 car. chacun). Piste : autosave localStorage clé `(livreId, semaine, champ)` purgée à la soumission réussie. Le brouillon SERVEUR reste un non-but (SPEC B2). *(scope-out assumé pendant C1-B2)*
- **Codex — consignes prof jamais vues par l'élève.** `app/eleve/modules/codex/synthese/[sessionId]/page.tsx:60` lit `codex_params` (consigne_v1/consigne_vf) avec le client user-scoped, or `codex_params` est prof-only (RLS) → la lecture renvoie toujours `null` et l'élève voit TOUJOURS les consignes par défaut (`consignes.ts`), jamais celles éditées par le prof. Correctif : lire via client admin (comme les autres lectures Codex élève). *(repéré pendant l'inventaire C1-A, hors périmètre sécurité)*
- **Login — `?erreur=lien` posé mais jamais affiché.** `app/auth/confirm/route.ts` et `app/finaliser-inscription/page.tsx` redirigent vers `/login?erreur=lien` (lien d'invitation expiré/invalide, ou finalisation sans session), mais `app/login/page.tsx` ne lit jamais ce paramètre → l'élève retombe sur un formulaire propre sans savoir que son lien a expiré. Piste : afficher un bandeau « ton lien a expiré, redemande une invitation » quand `?erreur=lien`. *(repéré pendant la vérif du flux d'invitation C1-C-a)*
- **Fiche canonique — continuité inter-lots en fiches générées (option future).** C1-C-b donne à chaque lot le TEXTE BRUT des semaines antérieures (parallélisme conservé → timeout à 60 s inchangé). L'idéal SPEC (« les fiches déjà générées ») nécessiterait des lots SÉQUENTIELS (chaque lot attend la sortie du précédent) → coût input O(n) minuscule mais durée = Σ lots (~30 s × nb_lots) qui dépasse 60 s dès ~4 semaines. À rouvrir seulement si on relève `maxDuration` (Vercel Fluid/Pro ≥ 300 s) ou si on sort la génération de référence du chemin `after()` (worker/queue). *(arbitrage assumé pendant C1-C-b)*
- **Transversal — remplacer les `confirm()` natifs par une confirmation in-app.** ~30 occurrences dans une vingtaine de composants (BoutonRegenererFiches, BoutonSupprimerUnite, ColonneCarte, GestionEleves, GrilleParcours…) reposent sur le dialogue natif du navigateur. Or dans tout environnement qui ne l'affiche pas — aperçu navigateur embarqué (webview du panneau de Code : `confirm()` renvoie `false` silencieusement), onglet Chrome où « Empêcher cette page de créer d'autres boîtes de dialogue » a été coché — le bouton devient muet : le handler abandonne à la première ligne, sans aucun feedback. Vécu le 24/07 sur « Régénérer les fiches (IA) » (le code était sain, seul l'environnement bloquait le dialogue). Piste : petit composant de confirmation maison (charte), et au passage un `catch` autour des appels d'action serveur de ces boutons — aujourd'hui un échec de l'action passe inaperçu (`BoutonRegenererFiches.lancer` n'a qu'un `finally`). *(diagnostiqué avec Cowork pendant les tests manuels C1-C)*

## Bugs cosmétiques 🚩 acceptés pendant la passe UI (C10)

- …
