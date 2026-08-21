# `utils/fabrique/` — ce que C4-L8 a posé, et ce qui ne s'édite pas

| Fichier | Ce que c'est |
|---|---|
| `doctrine.ts` | **assemble** la doctrine lue en base ; il ne dérive rien |
| `doctrine.fixture.json` | ⚠️ **une SORTIE**, jamais un fichier qu'on édite |
| `verifie-reference.ts` | le port de `copies-tests/_commun/verifie-reference.py` |
| `verifie-import.ts` | le port de `generateur/verifie-import.py` |
| `import-ecriture.ts` | ce que l'import écrit, une fois le contrôle rendu |
| `fiche-competence.ts` | la lecture d'une fiche déposée |
| `conception.ts` | ce que la doctrine borne à la conception, et l'aperçu |
| `acces.ts` | la garde prof et l'interrupteur propre du lot |

## La doctrine ne se tape jamais

Les treize objets, les neuf crans, les durées, les modes admis, les routes, les
consignes et les guides **vivent dans les sources** du dépôt
`palimpseste-conception`. `scripts/derive-doctrine.py` les lit — par
`generateur/noyau/doctrine.py` et son crible « cite ou refuse », qui **s'arrête**
si une déclaration a bougé mot pour mot — et les verse en base.

    python3 scripts/derive-doctrine.py --resume     # ce qui a été lu
    python3 scripts/derive-doctrine.py --sql        # le remplissage
    python3 scripts/derive-doctrine.py --verifie    # le contrôle de divergence
    python3 scripts/derive-doctrine.py --fixture > utils/fabrique/doctrine.fixture.json

`--verifie` **ne modifie rien** et rend un verdict par table : **IDENTIQUE**, ou
le compte des écarts **dans les deux sens**. Il vérifie aussi les empreintes des
sources et la fixture committée. **S'il dit DIVERGE, rejouer `--sql`** — jamais
corriger la base à la main.

## Les deux ports, et leur preuve

`npm test` rejoue **les vecteurs d'autotest des deux scripts qui font foi**,
recopiés sans adaptation. **Ne jamais « mettre à jour » un vecteur pour faire
passer un test** : si l'un tombe, ou bien le port a divergé, ou bien la source a
bougé — dans les deux cas, c'est le port qu'on recale.
