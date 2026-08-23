# -*- coding: utf-8 -*-
"""vecteurs-connaissance.py — ce que le module de calibration produit, en JSON.

    « Le branchement reproduit, sur les vecteurs embarqués du module —
      `TESTS_CODE1_PARFAIT` et `TESTS_P2_PARFAIT` —, EXACTEMENT ce que
      `python3 code.py --autotest` produit, et sans aucun appel de modèle. »
                                          — le « fait quand » de C4-L10

CE SCRIPT NE TOUCHE À RIEN. Il IMPORTE `copies-tests/connaissance/code.py` du
dépôt de conception, joue ses crochets, et écrit sur la sortie standard, en
JSON : LES ENTRÉES et LES SORTIES de chaque cas. Le test TypeScript rejoue les
MÊMES ENTRÉES sur le branchement et compare LES TROIS CLÉS — pas seulement
`verdicts` : « une trace qui diverge dit qu'un chemin de calcul a changé, même
quand le verdict tombe juste ».

⚠️ L'ÉTAT DE CE MODULE, ET CE QU'IL IMPOSE. `VERSION_GOLDS_TESTEE` vaut **None**
et `copies-tests/connaissance/` ne porte **ni gold, ni copie, ni critère, ni
run stocké** — la Connaissance part au Run 1. Ses 18 vecteurs `code2` et ses 4
vecteurs `code1` sont des cas CONSTRUITS, et l'autotest le déclare lui-même :
« ils prouvent l'arithmétique, jamais la validité ».

⭐ D'OÙ LE BALAYAGE, et il est ici plus nécessaire qu'ailleurs — la Structure
avait 112 couples réels à rejouer, la Connaissance n'a rien. Le balayage appelle
LA MÊME FONCTION DU MÊME MODULE sur plus d'entrées : il n'invente aucune règle,
il cesse simplement de ne la lui demander que 22 fois.

  · `balayage_cascade`      — toutes les distributions de 0 à 5 unités sur les
                              cinq natures déclarables : les quatre majorités de
                              la cascade, dans leur ordre d'écriture ;
  · `balayage_portes`       — les deux portes du haut, sur toutes les tailles de
                              copie de 1 à 20 unités × tous les comptes
                              d'invérifiables : LAQUELLE arrête, et à quel prix ;
  · `balayage_formatage`    — ⭐ LES ÉGALITÉS EXACTES DE `%.1f` ET `%.2f`, que
                              `toFixed` tranche dans l'autre sens (6,25 % = une
                              unité sur seize ; 31,25 % = cinq sur seize) ;
  · `balayage_diversite`    — registres × sources contre les trois paramètres ;
  · `balayage_croisement`   — les seize croisements, et les deux que le garde-fou
                              mord ;
  · `balayage_normalisation` — `_n` sur les blancs de PYTHON, les accents des
                              variantes, l'apostrophe typographique et les
                              conteneurs *(`str()` d'une liste)* ;
  · `balayage_code1`        — le garde-fou de citation, l'inclusion de sources,
                              le type hors catalogue, le marqueur `[posee_seule]`,
                              et les formes ITÉRABLES que Python lit autrement ;
  · `balayage_etendue`      — l'étendue dans et hors contexte, et hors liste ;
  · `pre_p1_cas`            — le découpage en phrases et le compte de mots ;
  · `pre_p2_cas`            — les trois métadonnées, et le `None` qui arrête ;
  · `conformite_cas`        — les quatre choses que `conformite` a à dire.

USAGE
    python3 scripts/vecteurs-connaissance.py [--racine <dépôt de conception>]

SORTIE : un objet JSON sur stdout. Code 0 si le module est chargé et son autotest
vert ; 1 sinon — un portage vérifié contre un module en échec ne prouve rien.
"""

from __future__ import annotations

import argparse
import importlib.util
import itertools
import json
import os
import sys

# ⚠️ Le chemin du dépôt de conception est ABSOLU, et c'est délibéré (le dépôt
# n'est pas un sous-dossier de celui-ci). Mais il ne peut pas être le SEUL :
# ailleurs que sur la machine du professeur, aucune commande ne trouvait la
# source, et le contrôle SAUTAIT au lieu de tourner (C4-L11). La variable
# d'environnement `PALIMPSESTE_RACINE_CONCEPTION` déclare la racine ;
# à défaut, le chemin du professeur tient lieu de défaut, comme avant.
RACINE_DEFAUT = (os.environ.get("PALIMPSESTE_RACINE_CONCEPTION")
                 or "/Users/louissagnieres/Documents/GitTest/palimpseste-conception")


def charge_module(racine):
    chemin = os.path.join(racine, "copies-tests", "connaissance", "code.py")
    if not os.path.exists(chemin):
        sys.exit("Module introuvable : %s" % chemin)
    spec = importlib.util.spec_from_file_location("code_connaissance", chemin)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, chemin


# ── Les fabriques de vecteurs, recopiées du module ──────────────────────────
# Le harnais NE LES IMPORTE PAS : chaque cas doit porter SON ENTRÉE en clair dans
# le JSON, pour que le côté TypeScript rejoue la même chose et non « ce que la
# fabrique aurait produit ».

def unite(j="juste", a="correcte", ap="sert_le_propos", r="cours", num=1):
    return {"u": num, "justesse": j, "attribution": a, "apropos": ap, "referent": r}


def lot(parfaites=0, inv=0, faux=0, plaque=0, approx=0):
    out, k = [], 0
    for _ in range(parfaites):
        k += 1
        out.append(unite(num=k))
    for _ in range(approx):
        k += 1
        out.append(unite(j="approximative", num=k))
    for _ in range(inv):
        k += 1
        out.append(unite(j="inverifiable", r="modele", num=k))
    for _ in range(faux):
        k += 1
        out.append(unite(j="contresens", num=k))
    for _ in range(plaque):
        k += 1
        out.append(unite(ap="plaque", num=k))
    return out


def code1_synthetique(registres=3, sources=3, resti=0, unites=None):
    """Le `_c1` du module : la sortie de `code1` que les vecteurs P2 fabriquent
    à la main, sans passer par `code1`. C'est ainsi que l'autotest les joue."""
    return {"mesures": {"registres": registres, "sources": sources,
                        "restitution_de_cours": resti,
                        "n_unites": len(unites or [])},
            "document_p2": {"unites_mobilisees": [{"u": u["u"]} for u in (unites or [])]}}


def cas_p2(m, nom, unites, reg=3, src=3, resti=0, etendue=None, params=None,
           releve=None, contexte=None):
    """Un cas de passage : ce qui entre, et ce que le module en fait."""
    c1 = code1_synthetique(reg, src, resti, unites)
    p2 = {"unites": unites}
    if etendue is not None:
        p2["etendue"] = etendue
    sortie = m.code2(p2, c1, params)
    return {
        "nom": nom,
        "sortie_code1": c1,
        "entree_p2": p2,
        "params": params,
        "releve": releve,
        "contexte": contexte,
        "attendu": {
            "code2": {"verdicts": sortie["verdicts"], "trace": sortie["trace"],
                      "alertes": sortie["alertes"]},
        },
    }


def cas_code1(m, nom, sortie_p1, params=None, contexte=""):
    r = m.code1(sortie_p1, contexte, params)
    return {
        "nom": nom,
        "sortie_p1": sortie_p1,
        "params": params,
        "contexte": contexte if isinstance(contexte, dict) else {},
        "attendu": {"mesures": r["mesures"], "document_p2": r["document_p2"],
                    "alertes": r["alertes"]},
    }


def cas_conformite(m, nom, sortie_p1, sortie_p2, sortie_code1, contexte=None):
    return {
        "nom": nom,
        "sortie_p1": sortie_p1,
        "entree_p2": sortie_p2,
        "sortie_code1": sortie_code1,
        "contexte": contexte or {},
        "attendu": m.conformite(sortie_p1, sortie_p2, sortie_code1, None, None),
    }


# ── LES BALAYAGES ───────────────────────────────────────────────────────────

def balayage_cascade(m):
    """Toutes les distributions de 0 à 5 unités sur les CINQ natures déclarables.

    ⭐ LES COMPTES SONT ASYMÉTRIQUES par construction — c'est la parade que le
    deuxième portage a trouvée : « le vecteur de test était SYMÉTRIQUE, un compte
    par test, et aucune unité écartée ». Ici toutes les répartitions passent, y
    compris celles qui portent des `inverifiable` — donc des unités ÉCARTÉES DU
    DÉCOMPTE QUI PORTENT QUAND MÊME LA PROPRIÉTÉ MESURÉE (une unité invérifiable
    peut être plaquée ou fausse ; elle sort quand même du dénominateur)."""
    cas = []
    for total in range(0, 6):
        for parts in itertools.product(range(total + 1), repeat=5):
            if sum(parts) != total:
                continue
            p, i, f, pl, ap = parts
            unites = lot(p, i, f, pl, ap)
            cas.append(cas_p2(m, "cascade %d/%d/%d/%d/%d" % parts, unites))
    return cas


def balayage_cascade_croisee(m):
    """⭐ LES UNITÉS À DEUX PROPRIÉTÉS, et celles que le décompte ÉCARTE.

    « Les deux champs sont ORTHOGONAUX : une unité peut être à la fois
    approximative et plaquée » (§4). Et une unité `inverifiable` peut porter une
    attribution `erronee` — elle est alors FAUSSE et hors du décompte à la fois :
    c'est exactement l'élément « écarté du décompte qui porte quand même la
    propriété » que l'épreuve négative réclame."""
    cas = []
    combos = [
        ("approximative+plaque", dict(j="approximative", ap="plaque")),
        ("inverifiable+erronee", dict(j="inverifiable", a="erronee", r="modele")),
        ("inverifiable+plaque", dict(j="inverifiable", ap="plaque", r="modele")),
        ("juste+erronee", dict(j="juste", a="erronee")),
        ("juste+absente", dict(j="juste", a="absente")),
        ("juste+n/a", dict(j="juste", a="n/a")),
        ("contresens+plaque", dict(j="contresens", ap="plaque")),
    ]
    for nom, extra in combos:
        for k in range(1, 5):
            for reste in range(0, 4):
                unites = ([unite(num=n, **extra) for n in range(1, k + 1)]
                          + [unite(num=n) for n in range(k + 1, k + reste + 1)])
                cas.append(cas_p2(m, "croisee %s ×%d + %d parfaites" % (nom, k, reste), unites))
    return cas


def balayage_portes(m):
    """LES DEUX PORTES DU HAUT, sur toutes les tailles de 1 à 20 unités.

    « Aucune des deux ne suffit seule, et elles n'attrapent pas la même chose »
    (§4). Le balayage dit, pour chaque (n, n_inv), LAQUELLE arrête — c'est ce qui
    rend la porte 1 éprouvable : sans lui, les deux vecteurs du module tombent
    aussi sous la seule porte 2."""
    cas = []
    for n in range(1, 21):
        for inv in range(0, n + 1):
            unites = lot(n - inv, inv)
            cas.append(cas_p2(m, "portes n=%d inv=%d" % (n, inv), unites))
    return cas


def balayage_formatage(m):
    """⭐⭐ LES ÉGALITÉS EXACTES DE `%.1f` ET `%.2f` — le SEPTIÈME écart de langage.

    `"%.1f" % 6.25` vaut `6.2` en Python et `6.3` par `toFixed(1)` ; `"%.2f" %
    0.625` vaut `0.62` contre `0.63`. Une part d'invérifiables vaut `100·k/n` :
    **une unité sur seize fait exactement 6,25 %**, cinq sur seize 31,25 %, et
    huit sur quarante ouvrent un rapport de 0,625 pile. Aucun des 18 vecteurs du
    module ne tombe sur une égalité : ils tombent sur des valeurs rondes."""
    cas = []
    # (n, inv) choisis pour que la ligne de trace porte une égalité EXACTE.
    for n, inv, ou in ((16, 1, "porte 2 franchie, part 6,25 %"),
                       (16, 5, "PORTE 1 fermée, part 31,25 %"),
                       (16, 3, "PORTE 1 fermée, part 18,75 %"),
                       (40, 8, "deux portes franchies, rapport 0,625"),
                       (8, 1, "part 12,5 %"),
                       (32, 1, "part 3,125 %"),
                       (16, 7, "part 43,75 %")):
        cas.append(cas_p2(m, "formatage n=%d inv=%d (%s)" % (n, inv, ou), lot(n - inv, inv)))
    return cas


def balayage_seuils_deplaces(m):
    """⭐⭐ LES SEUILS DÉPLACÉS — parce que la stricte inégalité de la PORTE 2 est
    INÉPROUVABLE aux paramètres par défaut.

    Vérifié par énumération jusqu'à n = 4000 : AUCUN couple (unités,
    invérifiables) ne met le rapport EXACTEMENT à 4,5 sans que la PORTE 1 ait
    déjà arrêté la copie. La règle « ne DÉPASSE pas » y contrôle donc un chemin
    mort — « cherche toujours si la règle que tu éprouves est ATTEIGNABLE par la
    chaîne ; sinon, tu contrôles un chemin mort ».

    Elle redevient atteignable dès que le seuil bouge, et il bougera : cinq des
    six paramètres sont *provisoire (réglage empirique)* et se balayent au banc.
    À `seuil_ratio_haut = 5.0`, une copie de cinq unités dont une est
    invérifiable a un rapport de 5,0 PILE — et le sens de la comparaison décide.
    """
    cas = []
    jeux = [
        # l'égalité EXACTE au rapport, où le sens de la comparaison décide
        {"seuil_ratio_haut": 5.0},
        {"seuil_ratio_haut": 5.0, "plafond_inverifiable_haut": 20},
        # l'égalité EXACTE au plafond, et ses deux bornes
        {"plafond_inverifiable_haut": 20},
        {"plafond_inverifiable_haut": 0},
        {"plafond_inverifiable_haut": 100, "seuil_ratio_haut": 100.0},
        # les bornes des trois seuils de diversité
        {"min_registres": 1}, {"min_registres": 4},
        {"haut_registres": 1, "haut_sources": 1},
        {"haut_registres": 4, "haut_sources": 20},
    ]
    for params in jeux:
        for n, inv in ((5, 1), (4, 1), (8, 2), (10, 2), (16, 1), (3, 0), (6, 1)):
            cas.append(cas_p2(m, "seuils %s n=%d inv=%d" % (params, n, inv),
                              lot(n - inv, inv), params=params))
        for reg, src in ((1, 1), (2, 2), (3, 3), (4, 4), (1, 4)):
            cas.append(cas_p2(m, "seuils %s reg=%d src=%d" % (params, reg, src),
                              lot(3, 0), reg=reg, src=src, params=params))
    return cas


def balayage_diversite(m):
    """Registres × sources contre les trois paramètres, défauts et déplacés.

    ⭐ LES DEUX POPULATIONS ONT DES TAILLES DIFFÉRENTES — 0 à 4 registres, 0 à 6
    sources — et le nombre d'unités ne suit ni l'un ni l'autre : une mutation qui
    échangerait `registres` et `sources`, ou qui lirait le compte d'unités à la
    place, tombe."""
    cas = []
    jeux = [None,
            {"min_registres": 1, "haut_registres": 2, "haut_sources": 2},
            {"min_registres": 3, "haut_registres": 4, "haut_sources": 5}]
    for params in jeux:
        for reg in range(0, 5):
            for src in range(0, 7):
                unites = lot(3, 0)          # trois unités parfaites, toujours
                cas.append(cas_p2(m, "diversite reg=%d src=%d params=%s" % (reg, src, params),
                                  unites, reg=reg, src=src, params=params))
        # et la copie vide, qui court-circuite les deux comptes
        cas.append(cas_p2(m, "diversite copie vide params=%s" % (params,), [],
                          reg=0, src=0, params=params))
    return cas


def balayage_croisement(m):
    """Les seize croisements, appelés dans la fonction du module elle-même."""
    sortie = []
    for d in m.GRADES:
        for j in m.GRADES:
            trace = []
            sortie.append({"diversite": d, "justesse": j,
                           "niveau": m.croisement(d, j, trace), "trace": list(trace)})
    return sortie


def balayage_normalisation(m):
    """`_n` — les blancs de PYTHON, les accents des variantes, les conteneurs.

    ⚠️ CE SONT LES ÉCARTS DE LANGAGE, ET AUCUN VECTEUR NE LES VOIT. Les entrées
    du module sont `juste`, `correcte`, `cours` : sans accent, sans espace, sans
    conteneur. Une transcription d'OCR, si."""
    entrees = [
        None, "", "juste", " juste ", "JUSTE", "Juste",
        "juste",          # NEL — un blanc pour Python, pas pour JS
        "juste",          # séparateur d'unité — idem
        " juste ",          # espace insécable — blanc des deux côtés
        "﻿juste",                # BOM — blanc pour JS, PAS pour Python
        "juste\t\njuste", "juste  juste", "justejuste",
        "erronée", "donnée", "invérifiable", "modèle", "référence", "posée_seule",
        "l’unité", "l'unité",
        "n/a", "N/A", "sert_le_propos", "plaque",
        ["juste"], {"juste": 1}, 3, 3.5, True, False, [], {},
        "[posee_seule]", "[[posee_seule]]", "posee_seule]", "[posee_seule",
    ]
    out = []
    for e in entrees:
        out.append({
            "entree": e,
            "n": m._n(e),
            "dans_justesses": m._dans(e, "justesses"),
            "dans_attributions": m._dans(e, "attributions"),
            "strip_crochets": m._n(e).strip("[]"),
        })
    return out


def balayage_code1(m):
    """`code1` — le garde-fou de citation, l'inclusion, le hors-catalogue, et les
    formes ITÉRABLES que Python lit autrement qu'un portage naïf."""
    def u1(**kw):
        base = {"u": 1, "type": "reference", "source": "Kant",
                "citation": "x", "emploi": "y"}
        base.update(kw)
        return base

    cas = []
    ajoute = lambda nom, p1, params=None: cas.append(cas_code1(m, nom, p1, params))

    ajoute("relevé vide", {"unites_mobilisees": []})
    ajoute("relevé absent", {})
    ajoute("une unité normale", {"unites_mobilisees": [u1()]})
    # LE GARDE-FOU DE CITATION — et les blancs de Python.
    ajoute("citation vide", {"unites_mobilisees": [u1(citation="")]})
    ajoute("citation d'espaces", {"unites_mobilisees": [u1(citation="   ")]})
    ajoute("citation d'un NEL seul (blanc POUR PYTHON)",
           {"unites_mobilisees": [u1(citation="")]})
    ajoute("citation d'un séparateur d'unité seul",
           {"unites_mobilisees": [u1(citation="")]})
    ajoute("citation d'une BOM seule (blanc pour JS, PAS pour Python)",
           {"unites_mobilisees": [u1(citation="﻿")]})
    ajoute("citation absente de l'unité", {"unites_mobilisees": [{"u": 1, "type": "reference"}]})
    # LE TYPE HORS CATALOGUE — et le `str()` d'un conteneur.
    ajoute("type hors catalogue", {"unites_mobilisees": [u1(type="anecdote")]})
    ajoute("type en LISTE (str() de Python : \"['reference']\")",
           {"unites_mobilisees": [u1(type=["reference"])]})
    ajoute("type en DICT", {"unites_mobilisees": [u1(type={"reference": 1})]})
    ajoute("type accentué « référence »", {"unites_mobilisees": [u1(type="référence")]})
    ajoute("type entouré de NEL", {"unites_mobilisees": [u1(type="reference")]})
    ajoute("type absent", {"unites_mobilisees": [{"u": 1, "citation": "x"}]})
    # ⭐⭐ LE CAS QUI DÉCIDE DU `.strip()` DE `_n`, ET IL A FALLU L'ÉPREUVE
    #    NÉGATIVE POUR LE TROUVER. Le `.strip()` initial est REDONDANT avec le
    #    `split()` final pour TOUS les blancs de Python — les deux les retirent,
    #    et une mutation en `trim()` survivait. Il ne cesse de l'être que sur LA
    #    BOM : `trim()` de JavaScript la mange, `strip()` de Python NON. Donc
    #    `\ufeffreference` n'est PAS un registre pour Python, et un portage qui
    #    aurait écrit `trim()` en aurait compté un — sans une alerte.
    ajoute("type préfixé d'une BOM (mangée par trim(), gardée par strip())",
           {"unites_mobilisees": [u1(type="\ufeffreference")]})
    ajoute("source préfixée d'une BOM", {"unites_mobilisees": [u1(source="\ufeffKant")]})
    # LES SOURCES — inclusion, casse, chaîne vide.
    ajoute("trois graphies du même auteur", {"unites_mobilisees": [
        u1(u=1, source="Kant"), u1(u=2, type="concept", source="Emmanuel Kant"),
        u1(u=3, type="exemple", source="E. Kant")]})
    ajoute("deux sources dont l'une contenue", {"unites_mobilisees": [
        u1(u=1, source="Marx"), u1(u=2, type="concept", source="marxisme")]})
    ajoute("sources de même casse différente", {"unites_mobilisees": [
        u1(u=1, source="Bergson"), u1(u=2, type="concept", source="bergson")]})
    ajoute("source vide exclue", {"unites_mobilisees": [
        u1(u=1, source=""), u1(u=2, type="concept", source="Hume")]})
    ajoute("source d'espaces", {"unites_mobilisees": [u1(source="   ")]})
    ajoute("trois auteurs distincts", {"unites_mobilisees": [
        u1(u=1, source="Kant"), u1(u=2, type="concept", source="Hume"),
        u1(u=3, type="exemple", source="Rousseau")]})
    # LE MARQUEUR D'EMPLOI.
    ajoute("emploi [posee_seule]", {"unites_mobilisees": [u1(emploi="[posee_seule]")]})
    ajoute("emploi posee_seule nu", {"unites_mobilisees": [u1(emploi="posee_seule")]})
    ajoute("emploi accentué [posée_seule]", {"unites_mobilisees": [u1(emploi="[posée_seule]")]})
    ajoute("emploi ordinaire", {"unites_mobilisees": [u1(emploi="appuie la thèse")]})
    # LES FORMES ITÉRABLES — « une chaîne rend ses CARACTÈRES » en Python.
    ajoute("unites_mobilisees en CHAÎNE", {"unites_mobilisees": "abc"})
    ajoute("unites_mobilisees en DICT", {"unites_mobilisees": {"a": 1, "b": 2}})
    ajoute("mentions_vides en CHAÎNE (len = 3)",
           {"unites_mobilisees": [u1()], "mentions_vides": "abc"})
    ajoute("mentions_vides en DICT", {"unites_mobilisees": [u1()], "mentions_vides": {"a": 1}})
    ajoute("mentions_vides en liste", {"unites_mobilisees": [u1()],
                                       "mentions_vides": [{"citation": "comme le dit Kant"}]})
    ajoute("une unité illisible parmi deux",
           {"unites_mobilisees": [u1(), "pas un objet"]})
    ajoute("relevé conservé tel quel autour du champ remplacé",
           {"avant": 1, "unites_mobilisees": [u1()], "apres": 2})
    # LE DRAPEAU DE RESTITUTION, qui vit dans les PARAMÈTRES.
    ajoute("restitution levée", {"unites_mobilisees": [u1()]}, {"restitution_de_cours": 1})
    ajoute("restitution baissée", {"unites_mobilisees": [u1()]}, {"restitution_de_cours": 0})
    # P1 ILLISIBLE.
    ajoute("P1 en chaîne", "pas un relevé")
    ajoute("P1 en liste", [1, 2])
    ajoute("P1 nul", None)
    return cas


def balayage_etendue(m):
    """L'étendue : dans le contexte, hors du contexte, hors de la liste."""
    cas = []
    for resti in (0, 1):
        for e in (None, "complet", "lacunaire", "fragmentaire", "nul",
                  "Lacunaire", " lacunaire ", "partielle", "", "n/a", 3, ["nul"]):
            cas.append(cas_p2(m, "etendue resti=%d e=%r" % (resti, e), lot(3, 0),
                              resti=resti, etendue=e))
    # et l'étendue sur une copie vide, où aucune unité n'est jugée
    for resti in (0, 1):
        cas.append(cas_p2(m, "etendue copie vide resti=%d" % resti, [],
                          reg=0, src=0, resti=resti, etendue="lacunaire"))
    return cas


def balayage_appariement(m):
    """L'appariement relevé ↔ jugement : le PASSAGE MANQUÉ, et ce qui l'ouvre.

    ⚠️ « Une omission devenait plus favorable qu'une sortie complète — Acquis
    contre Faible » (RM10). Le balayage éprouve les quatre formes : une unité non
    jugée, une jugée deux fois, une inconnue du relevé, et une valeur hors liste
    fermée — qui retire l'unité et fait donc, elle aussi, tomber la bijection."""
    cas = []
    trois = [{"u": 1}, {"u": 2}, {"u": 3}]
    c1 = {"mesures": {"registres": 3, "sources": 3, "restitution_de_cours": 0, "n_unites": 3},
          "document_p2": {"unites_mobilisees": trois}}

    def joue(nom, p2):
        r = m.code2(p2, c1, None)
        cas.append({"nom": nom, "sortie_code1": c1, "entree_p2": p2, "params": None,
                    "attendu": {"code2": {"verdicts": r["verdicts"], "trace": r["trace"],
                                          "alertes": r["alertes"]}}})

    joue("bijection complète", {"unites": [unite(num=1), unite(num=2), unite(num=3)]})
    joue("une unité non jugée", {"unites": [unite(num=1), unite(num=2)]})
    joue("deux unités non jugées", {"unites": [unite(num=1)]})
    joue("aucune unité jugée", {"unites": []})
    joue("une unité jugée deux fois",
         {"unites": [unite(num=1), unite(num=1), unite(num=2), unite(num=3)]})
    joue("une unité inconnue du relevé",
         {"unites": [unite(num=1), unite(num=2), unite(num=3), unite(num=9)]})
    joue("une valeur hors liste fermée retire l'unité",
         {"unites": [unite(num=1), unite(num=2), unite(j="peut-être", num=3)]})
    joue("une unité jugée illisible",
         {"unites": [unite(num=1), unite(num=2), "pas un objet"]})
    joue("unites en CHAÎNE", {"unites": "ab"})
    joue("unites absent", {})
    joue("P2 en liste", [1, 2])
    joue("P2 en chaîne", "rien")

    # Relevé VIDE mais transmis : l'appariement s'applique quand même (RM9).
    c1vide = {"mesures": {"registres": 0, "sources": 0, "restitution_de_cours": 0, "n_unites": 0},
              "document_p2": {"unites_mobilisees": []}}
    for nom, p2 in (("relevé vide, P2 vide", {"unites": []}),
                    ("relevé vide, P2 invente une unité", {"unites": [unite(num=1)]})):
        r = m.code2(p2, c1vide, None)
        cas.append({"nom": nom, "sortie_code1": c1vide, "entree_p2": p2, "params": None,
                    "attendu": {"code2": {"verdicts": r["verdicts"], "trace": r["trace"],
                                          "alertes": r["alertes"]}}})
    # AUCUN document transmis : `connues` vaut None, l'appariement ne s'applique pas.
    c1sans = {"mesures": {"registres": 3, "sources": 3, "restitution_de_cours": 0}}
    for nom, p2 in (("sans document, P2 rend deux unités",
                     {"unites": [unite(num=1), unite(num=2)]}),
                    ("sans document, P2 vide", {"unites": []})):
        r = m.code2(p2, c1sans, None)
        cas.append({"nom": nom, "sortie_code1": c1sans, "entree_p2": p2, "params": None,
                    "attendu": {"code2": {"verdicts": r["verdicts"], "trace": r["trace"],
                                          "alertes": r["alertes"]}}})
    return cas


def pre_p1_cas(m):
    """`pre_p1` — le découpage en phrases et le compte de mots.

    ⚠️⚠️ LE MODULE PREND LE TEXTE, LE CONTRAT PASSE LE CONTEXTE. C'est une dette
    de source, marquée et non corrigée : le harnais appelle donc le module AVEC
    LE TEXTE, et le portage lira la copie DANS LE CONTEXTE — « ce que le module
    veut dire »."""
    textes = [
        "", "   ",
        "Une phrase simple.",
        "Deux phrases. Et la seconde !",
        "Trois ? Oui. Vraiment…",
        "Sans ponctuation finale",
        "Une phrase. \n\n Une autre.",
        "Unsaut NEL. Deux.",              # blanc pour Python seulement
        "Un﻿BOM. Deux.",                   # blanc pour JS seulement
        "Espaces   multiples   ici.",
        "Un point... et trois.",
        "L’apostrophe typographique. Voilà.",
        "Ponctuation seule : . ! ?",
        "Fin sans texte après le point. ",
        "Élève : « citation » ; puis la suite.",
    ]
    return [{"texte": t, "attendu": m.pre_p1(t)} for t in textes]


def pre_p2_cas(m):
    """`pre_p2` — les trois métadonnées, et le `None` qui arrête la mesure."""
    contextes = [
        {}, None,
        {"consigne": "Expliquez.", "corpus_cours": "Le cours dit ceci."},
        {"consigne": "Expliquez."},
        {"corpus_cours": "Le cours dit ceci."},
        {"consigne": "", "corpus_cours": ""},
        {"consigne": "Expliquez.", "corpus_cours": "Le cours.", "copie": "une copie"},
    ]
    out = []
    for ctx in contextes:
        for params in (None, {"restitution_de_cours": 0}, {"restitution_de_cours": 1}):
            out.append({"contexte": ctx, "params": params,
                        "attendu": m.pre_p2(ctx, params)})
    return out


def conformite_cas_tous(m):
    """Les quatre choses que `conformite` a à dire — et les trois états du
    contrôle d'existence : exécuté et vert, exécuté et rouge, NON EXÉCUTÉ."""
    cas = []
    cas.append(cas_conformite(m, "P2 rend un palier", None, {"niveau": "A", "unites": []}, None))
    cas.append(cas_conformite(m, "P2 rend un décompte", None,
                              {"registres": 3, "unites": []}, None))
    cas.append(cas_conformite(m, "une unité jugée porte un niveau", None,
                              {"unites": [{"u": 1, "niveau": "B"}]}, None))
    cas.append(cas_conformite(m, "P2 propre", None,
                              {"unites": [unite(num=1)], "confiance": "élevée"}, None))
    cas.append(cas_conformite(m, "contrôle NON EXÉCUTÉ (une citation, pas de production)",
                              {"unites_mobilisees": [{"u": 1, "citation": "un fait cité"}]},
                              None, {}))
    cas.append(cas_conformite(m, "rien à vérifier : le contrôle se tait",
                              {"unites_mobilisees": [{"u": 1}]}, None, {}))
    cas.append(cas_conformite(m, "citation introuvable dans la production",
                              {"unites_mobilisees": [{"u": 1, "citation": "absente du texte"}],
                               "_production": "la production ne contient pas cette phrase"},
                              None, {}))
    cas.append(cas_conformite(m, "citation présente dans la production",
                              {"unites_mobilisees": [{"u": 1, "citation": "cette phrase"}],
                               "_production": "la production contient cette phrase"},
                              None, {}))
    cas.append(cas_conformite(m, "citation entre guillemets typographiques",
                              {"unites_mobilisees": [{"u": 1, "citation": "« cette phrase »"}],
                               "_production": "la production contient cette phrase"},
                              None, {}))
    cas.append(cas_conformite(m, "production servie par les mesures de code1",
                              {"unites_mobilisees": [{"u": 1, "citation": "absente"}]},
                              None, {"mesures": {"_production": "un texte sans le mot"}}))
    cas.append(cas_conformite(m, "trois citations à vérifier, aucune production",
                              {"unites_mobilisees": [{"u": 1, "citation": "a"},
                                                     {"u": 2, "citation": "b"},
                                                     {"u": 3, "citation": "c"}]},
                              None, {}))
    cas.append(cas_conformite(m, "citation d'espaces : rien à vérifier",
                              {"unites_mobilisees": [{"u": 1, "citation": "   "}]}, None, {}))
    cas.append(cas_conformite(m, "P1 illisible", "pas un relevé", None, {}))
    cas.append(cas_conformite(m, "code1 illisible",
                              {"unites_mobilisees": [{"u": 1, "citation": "a"}]}, None, None))
    return cas


# ── LE PAQUET ───────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--racine", default=RACINE_DEFAUT)
    args = ap.parse_args()

    m, chemin = charge_module(args.racine)
    echecs, annonces = m.autotest()

    paquet = {
        "module": {
            "chemin": chemin,
            "competence": m.COMPETENCE,
            "version_calcul": m.VERSION,
            "version_golds_testee": m.VERSION_GOLDS_TESTEE,
            "observables": list(m.OBSERVABLES),
            "slot_document_p2": m.SLOT_DOCUMENT_P2,
            "catalogue": {k: list(v) for k, v in m.CATALOGUE.items()},
            "params": {k: v["defaut"] for k, v in m.PARAMS.items()},
            "params_statuts": {k: v["statut"] for k, v in m.PARAMS.items()},
            # ⚠️ LE TYPE PYTHON de chaque défaut — `int` ou `float`. C'est lui qui
            #    décide si `str()` garde un point décimal, et le portage ne peut
            #    pas le deviner d'un JSON (`5.0` y devient `5`).
            "params_types": {k: type(v["defaut"]).__name__ for k, v in m.PARAMS.items()},
            "grades": list(m.GRADES),
            "niveaux": list(m.NIVEAUX),
            "en_defaut": list(m.EN_DEFAUT),
            "fin_phrase": m._FIN_PHRASE,
            "regle_agregation_citee": m.REGLE_AGREGATION_CITEE,
            "regle_agregation_source": m.REGLE_AGREGATION_SOURCE,
            # ⚠️ « Ne compte JAMAIS une constante sans vérifier son TYPE » : chez
            #    l'Expression, `TESTS_CODE1_PARFAIT` est une CHAÎNE, et un
            #    `len()` y a rendu « 52 vecteurs » qui étaient 52 caractères.
            "types": {n: type(getattr(m, n)).__name__
                      for n in ("TESTS_P2_PARFAIT", "TESTS_CODE1_PARFAIT",
                                "OBSERVABLES", "CATALOGUE", "PARAMS")},
            "tailles": {n: len(getattr(m, n))
                        for n in ("TESTS_P2_PARFAIT", "TESTS_CODE1_PARFAIT")},
        },
        "autotest": {"echecs": echecs, "annonces": annonces},
    }

    # LES VECTEURS EMBARQUÉS, joués comme l'autotest les joue.
    p2 = []
    for vec in m.TESTS_P2_PARFAIT:
        c = cas_p2(m, vec["nom"], vec["unites"], reg=vec["reg"], src=vec["src"],
                   resti=vec.get("resti", 0), etendue=vec.get("etendue"))
        c["attendu_autotest"] = vec["attendu"]
        p2.append(c)
    paquet["p2_parfait"] = p2

    c1 = []
    for vec in m.TESTS_CODE1_PARFAIT:
        c = cas_code1(m, vec["nom"], vec["p1"])
        c["attendu_autotest"] = vec["attendu"]
        c["alertes_min"] = vec.get("alertes_min", 0)
        c1.append(c)
    paquet["code1_parfait"] = c1

    paquet["balayage_cascade"] = balayage_cascade(m)
    paquet["balayage_cascade_croisee"] = balayage_cascade_croisee(m)
    paquet["balayage_portes"] = balayage_portes(m)
    paquet["balayage_formatage"] = balayage_formatage(m)
    paquet["balayage_diversite"] = balayage_diversite(m)
    paquet["balayage_seuils_deplaces"] = balayage_seuils_deplaces(m)
    paquet["balayage_croisement"] = balayage_croisement(m)
    paquet["balayage_normalisation"] = balayage_normalisation(m)
    paquet["balayage_code1"] = balayage_code1(m)
    paquet["balayage_etendue"] = balayage_etendue(m)
    paquet["balayage_appariement"] = balayage_appariement(m)
    paquet["pre_p1_cas"] = pre_p1_cas(m)
    paquet["pre_p2_cas"] = pre_p2_cas(m)
    paquet["conformite_cas"] = conformite_cas_tous(m)

    paquet["comptes"] = {k: len(v) for k, v in paquet.items() if isinstance(v, list)}

    json.dump(paquet, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")
    # Un portage vérifié contre un module EN ÉCHEC ne prouve rien.
    return 1 if echecs else 0


if __name__ == "__main__":
    sys.exit(main())
