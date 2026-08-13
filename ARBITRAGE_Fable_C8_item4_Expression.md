# Arbitrage 🎻 Fable — C8, item 4 : « Expression comptée deux fois »

*(Note préparée à la clôture de C8·L3, le 13/08/2026. Le diagnostic complet est dans
`RAPPORT_Diagnostic_C8_expression.md` ; cette note en est l'extrait décisionnel. **Aucune ligne de
code n'a été modifiée au titre de l'item 4** : la correction dépend de ce qu'on décide de mesurer,
et c'est un arbitrage pédagogique, pas technique.)*

## 1. L'item, tel qu'il était écrit

`SPEC_Lot5_Fragments.md:154` : « *l'écrit liste aujourd'hui Expression comme section **et** l'inclut
dans Découverte → Expression comptée deux fois* », adossé à `SPEC_Lot5_Fragments.md:47` qui décrit
l'écrit comme noté sur « Découverte, Sources, **Expression** ».

## 2. Ce que le diagnostic a établi

**La prémisse est fausse.** Le fragment hebdomadaire écrit n'a jamais eu de section Expression. Ses
trois sections notées sont **Découvertes, Sources, Réflexions** — vérifié dans les types, dans les
20 colonnes de `fragments_analyses` (aucune « expression »), et dans le prompt réellement en base,
qui ne contient pas une seule fois le mot. Expression n'est notée qu'à deux endroits, disjoints :
l'**oral** (`note_expression`, 0-4) et l'**essai** (`lettre_expression`, A-E). Aucun agrégat de
l'application ne mélange ces types de travaux.

**Mais un défaut réel de la même famille existe — dans l'essai.** Les quatre lettres de l'essai
(`utils/analyse-essai.ts`) se recouvrent sur un point :

- **b) EXPRESSION** (l. 32) : « qualité de la langue (syntaxe, vocabulaire, **précision
  conceptuelle**) » ;
- **d) CONNAISSANCES** (l. 36) : les savoirs sont-ils « exacts, **précis**, et au service de
  l'argument ? ».

La même chose — la précision conceptuelle — est pesée dans **deux lettres toutes deux notées**. Que
ce soit un défaut et non une sur-lecture est prouvé par le prompt lui-même : il pose une garde
explicite sur la paire voisine (« *Distingue bien argumentation et récitation de connaissances* »,
l. 34) et **aucune** sur celle-ci.

**Et à l'écrit, le déséquilibre est l'inverse de celui qu'annonce la spec.** La matière
« Expression » y est demandée **deux fois** — `b) LANGUE` et `c) STYLE` — mais en **texte libre**
(`retour_langue`, `retour_style`) : elle n'y est **notée zéro fois**. À l'écrit, Expression est
sous-comptée, pas sur-comptée.

## 3. Ce qu'il faut trancher (les trois options, toutes défendables)

1. **Corriger la spec.** `SPEC_Lot5_Fragments.md:47` dit la réalité (Découvertes, Sources,
   Réflexions) et l'item 4, tel qu'il est formulé, se dissout. Coût : une ligne. Effet sur les
   élèves : aucun.
2. **Tenir la spec pour la cible** : l'écrit gagne une **section Expression notée**. Cela change ce
   que l'élève voit, ce qui entre dans toutes les moyennes, et ce que le module déclare évaluer —
   donc une migration, une reprise du prompt hebdo, et une rupture de comparabilité avec les
   fragments déjà notés cette année.
3. **Requalifier l'item 4 sur l'essai** : réécrire les descripteurs de EXPRESSION et de
   CONNAISSANCES pour séparer la précision **conceptuelle** (savoir juste) de la précision de
   **langue** (mot juste), sur le modèle de la garde qui existe déjà entre argumentation et
   connaissances. Coût : deux paragraphes de prompt. Effet : un élève cesse d'être pénalisé deux
   fois pour un même défaut.

Les options 1 et 3 ne s'excluent pas — c'est même la combinaison la plus probable.

## 4. La question de fond, si elle vaut d'être ouverte

Une lecture de la contre-épreuve mérite d'être retenue : une fois la ligne 47 corrigée,
l'avertissement de la ligne 154 **reste valide sur le fond**, parce que **Réflexions charge sur
Expression tout autant que Découvertes**. Autrement dit, le vrai objet n'est pas « quelle section
ajouter » mais **le mapping section → axes de compétences** — celui que C6 doit écrire. Si tu
préfères, l'item 4 peut se refermer par 1 + 3 maintenant, et la question du mapping partir avec C6
plutôt que de rester attachée à Fragments.

## 5. Ce dont une session Code aura besoin en sortie

- La ligne 47 de `SPEC_Lot5_Fragments.md` telle qu'elle doit se lire.
- Si option 3 : les deux descripteurs réécrits, mot pour mot (ils partent tels quels dans le prompt).
- Si option 2 : le nom de la section, son descripteur, sa place dans l'ordre des sections, et ce
  qu'on fait des fragments déjà notés sans elle.
