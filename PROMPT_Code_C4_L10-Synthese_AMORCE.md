# AMORCE — à coller AVANT d'ouvrir `PROMPT_Code_C4_L10-Synthese.md`

**Ouvre `PROMPT_Code_C4_L10-Synthese.md`, à la racine du dépôt, et exécute-le.** Cette amorce ne le remplace pas : elle lève **une** de ses interdictions, et une seule.

## Le blocage en tête de ce prompt est réel — et TU AS MANDAT DE LE LEVER

Il te dit d'**arrêter** si `synthese.code1` ne rend pas `document_p2`, et son piège A-2 t'interdit d'éditer un module de calibration. ⭐ **Pour cette clé, et pour elle seule, l'interdiction est levée** : Louis l'a décidé le 22/08. Tu répares d'abord, tu portes ensuite.

**Ce qui est à réparer**, dans `copies-tests/synthese/code.py` *(dépôt de conception)* :

- `code1` ne rend pas `document_p2`, sur ses **deux** chemins de sortie — lignes **312** *(référent `cours`)* et **418** *(référent `texte`)* ;
- le commentaire de la ligne **264** affirme que *« `document_p2` n'est pas une clé du contrat »* : **c'est faux**, le `CONTRAT-MODULES.md` §2 l'exige **dès que le module définit `code1`**. Il part avec la correction.

⚠️ **Ce défaut dépasse le portage** : `_commun/banc.py` ligne **580** fait `sys.exit("REFUS : code1 ne rend pas la clé « document_p2 »…")`. **Le banc n'a donc jamais pu tourner sur la Synthèse.** Son autotest passe ses 57 vecteurs parce qu'il ne vérifie pas le contrat — le défaut est latent depuis l'écriture du module.

## ⛔ CE N'EST PAS UN AJOUT DE CLÉ — et c'est toute la subtilité

`document_p2` est *« l'objet que le juge lit **à la place de la production** »*. Or le prompt P2 de la Synthèse porte **un seul slot — `{squelette}`**. Donc **`document_p2` est tout ce que son juge verra**, et rien d'autre.

Aujourd'hui `code1` calcule ses `mesures` et s'arrête là. **Ce que le juge doit recevoir n'a jamais été décidé**, puisque le banc s'arrête avant d'y arriver.

⛔ **Ça se lit au §4 de `competences/synthese.md`** — *« Règles de notation P2 : ce que le modèle **juge**, ce que le code **calcule** »* —, et **nulle part ailleurs**. *« Le détail de chaque chaîne vit dans la fiche de sa compétence »* *(`01-` §11, qui renvoie au `03-` §1).*

**Ne compose pas un objet plausible.** Un juge qui reçoit un document plausible mais faux rend des verdicts propres sur rien : c'est *« le seul défaut de ce contrat dont rien ne témoigne »* — et une fois la clé présente, il serait **invisible ET vert au banc**. ⚠️ **Si le §4 ne le dit pas, ARRÊTE-TOI et dis-le à Louis** : c'est une décision de source, pas un choix d'implémentation.

⚠️ **DEUX chemins, peut-être DEUX formes.** Le référent **`texte`** a fait tourner l'aligneur *(P1B)* ; le référent **`cours`** ne l'a pas fait, et pose `couvrantes = None`. **Ne présume pas qu'un même objet convient aux deux** — regarde ce que le §4 attend dans chaque cas.

**Et c'est une réparation, pas une régénération** *(`CONTRAT-MODULES.md` §7)* : le module encode ce qui a été mesuré. **Tu ajoutes ce qui manque, tu ne réécris rien d'autre** — ni `mesures`, ni les garde-fous, ni la conformité.

## Les contrôles de la réparation, avant de reprendre le prompt

- `python3 copies-tests/synthese/code.py --autotest` — **reste vert**, ses 57 vecteurs compris ;
- `python3 copies-tests/_commun/verifie-module.py --module … --config … --fiche …` — **accepte** ;
- le **pilote du banc passe le chargement** : c'est lui qui refusait. ⛔ **Aucun run payé ne part sans l'accord explicite de Louis** — le pilote fait un appel de chaque phase, projette le coût et **s'arrête** ; cette confirmation lui appartient, et `--oui` ne s'emploie qu'après son feu vert dans la conversation. **Le chargement seul suffit à prouver la réparation.**
- ⛔ **Ne contourne jamais un refus** par `--sans-criteres` ou `--sans-tests` sans son accord.

## Puis reprends le prompt là où tu l'as laissé

La réparation faite et prouvée, **le blocage en tête de `PROMPT_Code_C4_L10-Synthese.md` est levé** : continue son exécution normalement, contrôle d'entrée compris.

⚠️ **Dis les deux choses à ton relevé**, séparément : **ce que tu as réparé au module** *(avec ce que le §4 t'a fait écrire, et pourquoi)*, et **ce que tu as porté**. Ce sont deux gestes, dans deux dépôts, et un seul relevé les rassemble.
