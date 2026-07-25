# Banc de calibration anti-spoiler du RAG de cours

Lot **L8** de `SPEC_scriptorium_rag.md` (§11, recette §14 critère 8). Outillage **hors-app** :
aucune base de données, aucun SQL, aucun gate touché, effet prod nul.

Le banc teste l'étage **au-dessus** de l'assembleur — le comportement du **modèle**. La non-fuite
structurelle de l'assembleur (`utils/scriptorium-corpus.ts`) est déjà couverte par les tests du lot
L4 (`utils/scriptorium-corpus.test.ts`, verts).

## Contenu

| Fichier | Rôle |
|---|---|
| `corpus-test/parametres.json` | constantes figées : date « du jour » (`2026-10-15`), semaine courante (5/8), progression livre par défaut |
| `corpus-test/instances.json` | le mini-parcours — 8 semaines, 2 cours découpés en sections, 3 textes, 1 livre ; se désérialise **directement** en `InstanceCorpus[]` |
| `corpus-test/livres.json` | le livre : 5 séances, fiches + carte ; `LivreCorpus[]` |
| `corpus-test/sentinelles.json` | manifeste des sentinelles (famille, chaîne, portée, seuil) — le script n'en écrit aucune en dur |
| `scenarios.json` | 27 scénarios (compréhension 6 · approfondissement 4 · en-cours 2 · hors-corpus 3 · livre 3 · adversarial 9) |
| `scripts/calibration-rag.ts` | le script de run |
| `resultats/run-{modele}-{date}.json` | trace **brute** d'un run : réponses intégrales + usage, aucun verdict |
| `rapport-{modele}-{date}.md` | le rapport lisible (synthèse + scénario par scénario) |

## Lancer un run

```bash
npm run calibration:rag -- --modele=claude-haiku-4-5
```

Options : `--modele=<id>` (défaut `gemini-3.5-flash-lite`) · `--dry` (imprime système + préfixe
assemblé + premier suffixe, **aucun appel API**) · `--rescore=<fichier>` (régénère un rapport depuis
une trace brute, **hors ligne, sans dépense** — sert quand l'outil évolue, jamais à « refaire » un run).

Clés lues dans `.env.local` (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`), jamais journalisées. Le script
échoue immédiatement si la clé du fournisseur demandé manque.

Le run est **rejouable à l'identique** : les fixtures sont figées et la date présentée au modèle est
une constante (`Date.now()` n'intervient que dans le nom et l'en-tête du rapport).

### Pourquoi un résolveur dédié

Le script importe le code applicatif (`assemblerCorpus`, `PROMPT_RAG_DEFAUT`, `fournisseurPour`,
`TARIFS`). Le hook des tests (`scripts/ts-extension-resolver.mjs`) ne couvre que les imports relatifs
sans extension ; il manquait l'alias `@/…` et le marqueur `server-only` (absent du premier niveau de
`node_modules`, et dont l'entrée par défaut lève une erreur). `scripts/calibration-resolver.mjs` comble
ces deux manques. **Aucune dépendance ajoutée** — `tsx` n'a pas été nécessaire.

## Vérifications automatiques

Au démarrage, **fail-fast** sur l'intégrité du banc : aucune sentinelle `S_FUTUR_*` dans le préfixe
assemblé, et chaque `S_LIVRE_*` présente ou absente conformément au statut de la classe. Un banc dont
le préfixe ment ne prouve rien.

Par scénario : sentinelle future · sentinelle livre (scopée par la progression de l'élève) · longueur
≤ borne (`MAX_TOKENS_CHAT × 4` caractères) · heuristique de refus sur les catégories devoirs/injection.

> Les vérifications automatiques sont nécessaires mais non suffisantes : l'absence de sentinelle ne
> prouve pas l'absence de spoiler (paraphrase, connaissance du modèle). **Le verdict final est celui
> du PO.** Le banc ne juge pas la qualité pédagogique et ne corrige rien : une fuite détectée est un
> résultat, pas un correctif à faire ici (règle R7 — les décisions se prennent hors session).

## État des runs (protocole §11 : Flash-Lite puis référence)

| Run | Lot | Modèle | État |
|---|---|---|---|
| Défaut de prod | L8 (prompt v1) | `gemini-3.5-flash-lite` | **fait** — 2026-07-24, 27/27 scénarios, 0 erreur, 0,0550 $, `rapport-gemini-3.5-flash-lite-2026-07-24.md` |
| Référence | L8 (prompt v1) | `claude-haiku-4-5` | **fait** — 2026-07-24, 27/27 scénarios, 0 erreur, 0,0734 $, `rapport-claude-haiku-4-5-2026-07-24.md` |
| Défaut de prod | L8-bis (prompt amendé A1/A2/A3) | `gemini-3.5-flash-lite` | **fait** — 2026-07-25, 27/27 scénarios, 0 erreur, 0,0560 $, `rapport-gemini-3.5-flash-lite-2026-07-25.md` |
| Référence | L8-bis (prompt amendé A1/A2/A3) | `claude-haiku-4-5` | **fait** — 2026-07-25, 27/27 scénarios, 0 erreur, 0,0849 $ (dont 0,0125 $ d'écriture de cache 1 h : le prompt amendé a invalidé le cache du 24/07), `rapport-claude-haiku-4-5-2026-07-25.md` |

Banc **inchangé** entre L8 et L8-bis (fixtures, scénarios, sentinelles, heuristique, script) : seule la
constante `PROMPT_RAG_DEFAUT` a bougé (3 732 → 4 790 caractères de prompt système). Les quatre rapports
restent en place — c'est la comparaison avant/après.

Pas de 3ᵉ run : `claude-sonnet-4-6` seulement si le PO le demande.

⚠︎ **Les deux coûts ne se comparent pas directement** : côté Anthropic le préfixe a été servi depuis
le cache 1 h (0 écriture facturée sur ce run, la précédente ayant chauffé le cache) ; côté Gemini le
cache implicite n'a **pas** pris (0 token lu du cache, préfixe de fixture ~3,5k tokens, sans doute
sous le seuil). Les ordres de grandeur de la SPEC §8.3 sont à revérifier sur un corpus de classe réel.

**Incident d'exécution à connaître** : l'API Gemini a d'abord répondu
`429 RESOURCE_EXHAUSTED — Your prepayment credits are depleted` sur **tous** les modèles du compte,
puis a redonné la main quelques minutes plus tard. La clé et l'id `gemini-3.5-flash-lite` sont
valides (un id inexistant renvoie `404`, celui-ci renvoyait `429`). Si le cas se reproduit, le script
abandonne net après 3 appels consécutifs en échec plutôt que d'écrire un rapport intégralement en
`ERREUR`.
