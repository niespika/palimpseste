# -*- coding: utf-8 -*-
"""vecteurs-argumentation.py — ce que le module de calibration produit, en JSON.

    « Le branchement reproduit, sur les vecteurs embarqués du module —
      `TESTS_CODE1_PARFAIT` et `TESTS_P2_PARFAIT` —, EXACTEMENT ce que
      `python3 code.py --autotest` produit, et sans aucun appel de modèle. »
                                          — le « fait quand » de C4-L10

CE SCRIPT NE TOUCHE À RIEN. Il IMPORTE `copies-tests/argumentation/code.py` du
dépôt de conception, joue ses vecteurs, et écrit sur la sortie standard, en
JSON : LES ENTRÉES et LES SORTIES de chaque cas. Le test TypeScript rejoue les
MÊMES ENTRÉES sur le branchement et compare LES TROIS CLÉS — pas seulement
`verdicts` : « une trace qui diverge dit qu'un chemin de calcul a changé, même
quand le verdict tombe juste ».

⚠️ L'ÉTAT DE CE MODULE, ET CE QU'IL IMPOSE. `TESTS_P2_PARFAIT` est **VIDE** et
`VERSION_GOLDS_TESTEE` vaut **None** : l'Argumentation n'a AUCUN gold et AUCUN
run stocké — elle part au Run 1. Les vecteurs embarqués sont donc 2 vecteurs
`code1` et 27 vecteurs de composition, et rien d'autre.

⭐ D'OÙ LE BALAYAGE, et il est plus nécessaire ici que partout ailleurs. « Un
vecteur gold ne prouve que ce qu'il couvre » : sur l'Expression, inverser la
règle du profil dissocié passait les sept golds. Ici il n'y a même pas de gold.
Le balayage appelle **LA MÊME FONCTION DU MÊME MODULE** sur plus d'entrées — il
n'invente aucune règle, il cesse simplement de ne la lui demander que 29 fois :

  · `balayage_agregation` — les 680 distributions de 1 à 4 unités sur les quatre
    statuts déclarables, avec et sans objection traitée : la majorité PAR PALIER,
    l'égalité tranchée par le plus faible, et « le seuil ouvre Acquis, il n'élève
    jamais la base » ;
  · `balayage_crible` — les 4 tests × les 4 statuts déclarables : sur quoi chaque
    test mord, et que les deux tests de termes NE CHANGENT PAS le statut ;
  · `balayage_limites` — les 6 paires de statuts, dans LES DEUX ORDRES D'ÉCRITURE
    de la note : la borne basse suit l'ordre de la fiche, jamais celui de la
    phrase ;
  · `balayage_seuil` — les 4 traitements légaux + 1 illégal × les 3 états de
    marque : ce qui ouvre le seuil, et ce qui le ferme ;
  · `balayage_normalisation` — l'appariement d'une thèse, qui passe par
    `casefold` et non par `lower` : accents, casse, espaces, ligatures d'OCR ;
  · `balayage_frontieres_de_mot` — la lecture d'une note de « limite », dont le
    `\b` est UNICODE : « écirculaire » ne contient pas « circulaire » ;
  · `conformite_cas` — les cinq formes que `conformite` a à dire.

USAGE
    python3 scripts/vecteurs-argumentation.py [--racine <dépôt de conception>]

SORTIE : un objet JSON sur stdout. Code 0 si le module est chargé et son autotest
vert ; 1 sinon — un portage vérifié contre un module en échec ne prouve rien.
"""

from __future__ import annotations

import argparse
import copy
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

# Les quatre statuts que P1 peut DÉCLARER hors « limite ». `cosmetique` n'y est
# pas : « il ne se déclare pas, il naît du crible de P2 » (fiche §3).
STATUTS_DECLARABLES = ["absent", "circulaire", "implicite", "explicite"]


def charge_module(racine):
    chemin = os.path.join(racine, "copies-tests", "argumentation", "code.py")
    if not os.path.exists(chemin):
        sys.exit("Module introuvable : %s" % chemin)
    spec = importlib.util.spec_from_file_location("code_argumentation", chemin)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, chemin


def unite(these, statut, garant="", note=""):
    """Le `_u` du module, recopié — le harnais ne l'importe pas pour que le
    vecteur porte SON ENTRÉE en clair dans le JSON."""
    return {"these": these, "preuve_offerte": "p", "liaison_citee": "[aucune]",
            "garant_cite": garant, "statut_du_lien": statut, "note": note}


def passage(m, nom, releve, p2, params=None):
    """Un passage entier : code1 → code2 → conformite, sur les mêmes entrées."""
    params = params or {}
    c1 = m.code1(copy.deepcopy(releve), "", params)
    c2 = m.code2(p2, c1, params)
    conf = m.conformite(copy.deepcopy(releve), p2, c1, c2, params)
    return {
        "nom": nom, "releve": releve, "entree_p2": p2, "params": params,
        "attendu": {
            # `injection_p2` n'est pas comparé : aucun module ne l'utilise, et la
            # chaîne ne construit pas ce canal-là. Le reste l'est, clé pour clé.
            "code1": {"mesures": c1["mesures"], "document_p2": c1["document_p2"],
                      "alertes": c1["alertes"]},
            "code2": {"verdicts": c2["verdicts"], "trace": c2["trace"],
                      "alertes": c2["alertes"]},
            "conformite": conf,
        },
    }


def cas_code1(m):
    """`TESTS_CODE1_PARFAIT` — deux vecteurs, et ils sont une VRAIE LISTE.

    ⚠️ « Ne compte jamais une constante sans vérifier son TYPE » : chez
    l'Expression, `TESTS_CODE1_PARFAIT` est une CHAÎNE, et un `len()` y a rendu
    « 52 vecteurs » qui étaient 52 caractères. Ici c'est bien une liste de deux
    dictionnaires — le type part avec le paquet, et le test l'assert."""
    cas = []
    for t in m.TESTS_CODE1_PARFAIT:
        r = m.code1(copy.deepcopy(t["sortie_p1"]), "", {})
        cas.append({"nom": t["nom"], "sortie_p1": t["sortie_p1"],
                    "attendu_autotest": t["attendu"],
                    "attendu": {"mesures": r["mesures"],
                                "document_p2": r["document_p2"],
                                "alertes": r["alertes"]}})
    return cas


def cas_composition(m):
    """Les 27 vecteurs de composition, rejoués de bout en bout."""
    return [passage(m, t["nom"], t["p1"], t["p2"]) for t in m.TESTS_COMPOSITION]


# ── LE BALAYAGE — la même fonction du même module, sur plus d'entrées ───────

def balayage_agregation(m):
    """Les 680 distributions de 1 à 4 unités sur les quatre statuts déclarables,
    avec et sans objection traitée.

    Ce que ça éprouve, et qu'aucun vecteur ne couvre en entier : la majorité se
    compte SUR LE PALIER (deux statuts à Moyen ne se divisent pas les voix),
    l'égalité en tête est tranchée par LE PLUS FAIBLE des ex æquo, et le seuil
    « ouvre Acquis, il n'élève jamais la base »."""
    cas = []
    for n in (1, 2, 3, 4):
        for combo in itertools.product(STATUTS_DECLARABLES, repeat=n):
            for traitement in ("aucune", "réfutée"):
                unites = [unite("t%d" % (i + 1), s,
                                garant="car g%d" % (i + 1) if s == "explicite" else "")
                          for i, s in enumerate(combo)]
                releve = {"these_generale": "T", "unites": unites,
                          "objections": [{"objection": "o", "traitement": traitement}]}
                p2 = {"crible": {"requalifications": []}}
                cas.append(passage(
                    m, "agregation_%s_%s" % ("-".join(combo), traitement), releve, p2))
    return cas


def balayage_crible(m):
    """Les quatre tests × les quatre statuts déclarables, sur l'unité 1.

    Ce que ça éprouve : `distinction` ne mord que sur `explicite`, `source` mord
    sur `explicite` ET `implicite`, `sens` et `contour` ne mordent que sur
    `explicite` — et surtout ILS NE CHANGENT PAS LE STATUT : « le libellé Bon ne
    demande que garant écrit et non circulaire, et c'est le libellé Acquis qui
    exige explicites ET VALIDES » (fiche §4, acté). Hors de ces statuts, la
    requalification est consignée, jamais appliquée."""
    cas = []
    for statut in STATUTS_DECLARABLES:
        for test in ("distinction", "source", "sens", "contour"):
            unites = [unite("t1", statut,
                            garant="car g1" if statut == "explicite" else ""),
                      unite("t2", "implicite"),
                      unite("t3", "implicite")]
            releve = {"unites": unites,
                      "objections": [{"objection": "o", "traitement": "réfutée"}]}
            p2 = {"crible": {"requalifications": [
                {"unite": 1, "these": "t1", "test": test, "raison": "r"}]}}
            cas.append(passage(m, "crible_%s_sur_%s" % (test, statut), releve, p2))
    return cas


def balayage_limites(m):
    """Les six paires de statuts, DANS LES DEUX ORDRES D'ÉCRITURE de la note.

    Ce que ça éprouve, et qu'aucun vecteur ne distingue : la borne basse suit
    l'ordre de la fiche — `absent < circulaire < implicite < explicite` —, jamais
    l'ordre dans lequel l'extracteur a écrit sa note. Écrire « entre explicite et
    circulaire » doit compter `circulaire`."""
    cas = []
    for a, b in itertools.combinations(STATUTS_DECLARABLES, 2):
        for gauche, droite in ((a, b), (b, a)):
            releve = {"unites": [
                unite("t1", "limite", note="entre %s et %s" % (gauche, droite))],
                "objections": []}
            p2 = {"crible": {"requalifications": []}}
            cas.append(passage(m, "limite_%s_puis_%s" % (gauche, droite), releve, p2))
    return cas


def balayage_seuil(m):
    """Les quatre traitements légaux, plus un illégal, × les trois états de marque.

    Ce que ça éprouve : `réfutée` et `portée nuancée` ouvrent le seuil, « évoquée
    sans réponse » et « aucune » ne l'ouvrent pas, un traitement hors liste rend
    une alerte et ne compte pas — et TOUTE unité marquée `ambigu` ou `vague`
    ferme le seuil, même quand une objection est traitée."""
    cas = []
    traitements = ["réfutée", "portée nuancée", "évoquée sans réponse", "aucune",
                   "réfutée partiellement"]
    for traitement in traitements:
        for marque in (None, "sens", "contour"):
            unites = [unite("t1", "explicite", garant="car g1"),
                      unite("t2", "explicite", garant="car g2"),
                      unite("t3", "explicite", garant="car g3")]
            requals = ([] if marque is None
                       else [{"unite": 1, "these": "t1", "test": marque,
                              "raison": "r"}])
            releve = {"unites": unites,
                      "objections": [{"objection": "o", "traitement": traitement}]}
            p2 = {"crible": {"requalifications": requals}}
            cas.append(passage(
                m, "seuil_%s_%s" % (traitement.replace(" ", "-"), marque or "sans-marque"),
                releve, p2))
    return cas


def balayage_normalisation(m):
    """L'APPARIEMENT D'UNE THÈSE, et il passe par `casefold`, pas par `lower`.

    ⚠️ AUCUN VECTEUR NE LE VOIT : les thèses des vecteurs sont `t1`, `t2`, `t3`.
    Sur une copie réelle, une thèse porte des accents, des majuscules, des
    espaces doubles — et une OCR produit des ligatures typographiques. Python
    replie la casse ; `toLowerCase()` de JavaScript, non : `ß` y reste `ß`, `ﬁ`
    reste `ﬁ`, le sigma final reste `ς`. Un repliement raté ne fait pas un
    appariement FAUX — il fait un appariement MANQUÉ, donc une requalification
    perdue et une copie qui garde un palier de trop.

    Le harnais joue les deux côtés sur les mêmes paires : la thèse au relevé, et
    la thèse telle que P2 la recopie."""
    paires = [
        ("t1", "t1", "identique"),
        ("La liberté", "la liberté", "casse-initiale"),
        ("La Liberté Suppose La Contrainte", "la liberté suppose la contrainte", "casse-mots"),
        ("  la   liberté \n suppose  ", "la liberté suppose", "espaces"),
        ("la ﬁn justiﬁe les moyens", "la fin justifie les moyens", "ligatures"),
        ("die Straße", "die strasse", "eszett"),
        ("le λόγος", "le λόγοσ", "sigma-final"),
        ("la liberté", "la liberte", "accent-perdu"),
    ]
    cas = []
    for au_releve, recopiee, nom in paires:
        releve = {"unites": [unite(au_releve, "explicite", garant="car g1"),
                             unite("autre", "explicite", garant="car g2"),
                             unite("encore", "implicite")],
                  "objections": []}
        # ⚠️ Le rang est FAUX exprès : seul l'appariement par thèse peut sauver la
        #    requalification, donc seul le repliement de casse décide.
        p2 = {"crible": {"requalifications": [
            {"unite": 9, "these": recopiee, "test": "distinction", "raison": "r"}]}}
        cas.append(passage(m, "these_%s" % nom, releve, p2))
    return cas


def balayage_frontieres_de_mot(m):
    """LA LECTURE D'UNE NOTE DE « limite », et son `\\b` est UNICODE.

    ⚠️ AUCUN VECTEUR NE LE VOIT : les notes des vecteurs s'écrivent « entre
    circulaire et implicite ». Le `\\b` de Python compte `é` comme un caractère
    de mot ; celui de JavaScript, hors drapeau `u`, ne connaît que l'ASCII —
    « écirculaire » y contiendrait donc « circulaire » comme mot isolé, la note
    donnerait DEUX statuts au lieu d'un, et une unité écartée du décompte y
    rentrerait avec un statut fabriqué. C'est exactement ce que le garde-fou
    `limite_illisible` interdit : « le doute ne fabrique pas un statut »."""
    notes = [
        ("deux-nets", "entre circulaire et implicite"),
        ("casse", "entre CIRCULAIRE et IMPLICITE"),
        ("guillemets", "entre «circulaire» et «implicite»"),
        ("trait-union", "circulaire-implicite, je ne tranche pas"),
        ("virgule", "circulaire, implicite"),
        ("apostrophe", "entre l'implicite et l'explicite"),
        ("accent-colle", "entre écirculaire et implicite"),
        ("chiffre-colle", "entre circulaire2 et implicite"),
        ("lettre-collee", "entre circulaireX et implicite"),
        ("un-seul", "plutôt circulaire"),
        ("trois", "entre absent, circulaire et implicite"),
    ]
    cas = []
    for nom, note in notes:
        releve = {"unites": [unite("t1", "limite", note=note),
                             unite("t2", "explicite", garant="car g2")],
                  "objections": []}
        p2 = {"crible": {"requalifications": []}}
        cas.append(passage(m, "note_%s" % nom, releve, p2))
    return cas


def conformite_cas(m):
    """Les cinq formes que `conformite` a à dire — « l'erreur stable : P2 qui
    déborde de sa sortie déclarée » (fiche §4)."""
    unites = [unite("t1", "explicite", garant="car g1"), unite("t2", "implicite")]
    releve = {"unites": unites, "objections": []}
    jeux = [
        ("p2_conforme",
         {"crible": {"requalifications": []}, "justification_ancree": "…",
          "ce_qui_plafonne": "…", "levier": "…", "confiance": "moyenne"}),
        ("p2_champ_en_trop",
         {"crible": {"requalifications": []}, "niveau": "Bon", "confiance": "élevée"}),
        ("p2_confiance_hors_enum",
         {"crible": {"requalifications": []}, "confiance": "haute"}),
        ("p2_sans_requalifications", {"crible": {}}),
        ("p2_test_illisible_vers_lisible",
         {"crible": {"requalifications": [
             {"unite": 1, "these": "t1", "test": "source citée",
              "vers": "cosmetique", "raison": "r"}]}}),
        ("p2_test_et_vers_illisibles",
         {"crible": {"requalifications": [
             {"unite": 1, "these": "t1", "test": "autorite", "vers": "circulaire",
              "raison": "r"}]}}),
    ]
    return [passage(m, nom, releve, p2) for nom, p2 in jeux]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--racine", default=RACINE_DEFAUT)
    args = ap.parse_args()

    m, chemin = charge_module(args.racine)

    # « Le banc refuse de lancer un run si l'autotest du module échoue » — et un
    # portage vérifié contre un module en échec ne prouve rien.
    echecs, annonces = m.autotest()

    paquet = {
        "module": {
            "chemin": chemin,
            "competence": m.COMPETENCE,
            "version_calcul": m.VERSION,
            "version_golds_testee": m.VERSION_GOLDS_TESTEE,
            "observables": list(m.OBSERVABLES),
            "params": sorted(m.PARAMS),
            "catalogue": m.CATALOGUE,
            "regle_agregation_citee": m.REGLE_AGREGATION_CITEE,
            "regle_agregation_source": m.REGLE_AGREGATION_SOURCE,
            # Le TYPE des trois constantes de vecteurs, pas seulement leur taille.
            "types": {
                "TESTS_P2_PARFAIT": type(m.TESTS_P2_PARFAIT).__name__,
                "TESTS_CODE1_PARFAIT": type(m.TESTS_CODE1_PARFAIT).__name__,
                "TESTS_COMPOSITION": type(m.TESTS_COMPOSITION).__name__,
            },
            "tailles": {
                "TESTS_P2_PARFAIT": len(m.TESTS_P2_PARFAIT),
                "TESTS_CODE1_PARFAIT": len(m.TESTS_CODE1_PARFAIT),
                "TESTS_COMPOSITION": len(m.TESTS_COMPOSITION),
            },
        },
        "autotest": {"echecs": echecs, "annonces": annonces},
        "p2_parfait": list(m.TESTS_P2_PARFAIT),
        "code1": cas_code1(m),
        "composition": cas_composition(m),
        "balayage_agregation": balayage_agregation(m),
        "balayage_crible": balayage_crible(m),
        "balayage_limites": balayage_limites(m),
        "balayage_seuil": balayage_seuil(m),
        "balayage_normalisation": balayage_normalisation(m),
        "balayage_frontieres_de_mot": balayage_frontieres_de_mot(m),
        "conformite_cas": conformite_cas(m),
    }
    json.dump(paquet, sys.stdout, ensure_ascii=False, indent=None)
    sys.stdout.write("\n")
    return 1 if echecs else 0


if __name__ == "__main__":
    sys.exit(main())
