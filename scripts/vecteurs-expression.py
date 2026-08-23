# -*- coding: utf-8 -*-
"""vecteurs-expression.py — ce que le module de calibration produit, en JSON.

    « Le branchement reproduit, sur les vecteurs embarqués du module —
      `TESTS_CODE1_PARFAIT` et `TESTS_P2_PARFAIT` —, EXACTEMENT ce que
      `python3 code.py --autotest` produit, et sans aucun appel de modèle. »
                                          — le « fait quand » de C4-L10

CE SCRIPT NE TOUCHE À RIEN. Il IMPORTE `copies-tests/expression/code.py` du dépôt
de conception, joue ses vecteurs, et écrit sur la sortie standard, en JSON : LES
ENTRÉES et LES SORTIES de chaque cas. Le test TypeScript rejoue les MÊMES ENTRÉES
sur le branchement et compare les sorties.

⭐ POURQUOI ÉMETTRE LES ENTRÉES, ET NON SEULEMENT LES ATTENDUS. Le module fabrique
son contexte de vecteur par `_doc_vide()` — un document P2 minimal. Si le côté
TypeScript le refabriquait, les deux côtés compareraient DEUX FABRICATIONS, et un
écart dans la fabrication masquerait un écart dans le calcul. En passant la
sortie de `_doc_vide()` telle quelle, on compare bien ce qu'on croit comparer.

⚠️ DEUX FORMES, À NE PAS CONFONDRE. `TESTS_P2_PARFAIT` est une vraie liste : SEPT
vecteurs gold, un par copie. `TESTS_CODE1_PARFAIT`, lui, n'est PAS une liste de
vecteurs — c'est la chaîne « construits dans autotest() avec les vraies
fonctions » : les contrôles de `code1` sont ÉCRITS EN DUR dans `autotest()`, sur
un texte construit. Ce script les rejoue à l'identique, depuis ce texte-là.

USAGE
    python3 scripts/vecteurs-expression.py [--racine <dépôt de conception>]

SORTIE : un objet JSON sur stdout. Code 0 si le module est chargé et son autotest
vert ; 1 sinon — un portage vérifié contre un module en échec ne prouve rien.
"""

from __future__ import annotations

import argparse
import importlib.util
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
    chemin = os.path.join(racine, "copies-tests", "expression", "code.py")
    if not os.path.exists(chemin):
        sys.exit("Module introuvable : %s" % chemin)
    spec = importlib.util.spec_from_file_location("code_expression", chemin)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, chemin


def cas_p2_parfait(m):
    """Les SEPT vecteurs gold — l'arithmétique du croisement, copie par copie."""
    cas = []
    for t in m.TESTS_P2_PARFAIT:
        f, p = t["grades"]
        c1 = m._doc_vide()
        p2 = {"niveau": None, "grades": {"fluidite": f, "precision": p},
              "profil": None, "etiquettes_rejetees": []}
        cas.append({
            "nom": t["nom"],
            "entree_p2": p2,
            "sortie_code1": c1,
            "params": {},
            "attendu": m.code2(p2, c1, {}),
            # Ce que le gold implique, et la bande d'incertitude quand il en
            # déclare une. Le conflit gold ↔ règle de Copie8 se lit ici.
            "gold": {"niveau": t["attendu_niveau"], "bande": t.get("bande")},
        })
    return cas


def cas_garde_fou_zero(m):
    """« Un grade à 0 → plafond Faible » — acté, fiche §4 point 4."""
    c1 = m._doc_vide()
    p2 = {"grades": {"fluidite": 0, "precision": 4}, "etiquettes_rejetees": []}
    return [{"nom": "garde_fou_grade_zero", "entree_p2": p2, "sortie_code1": c1,
             "params": {}, "attendu": m.code2(p2, c1, {})}]


RELEVE_CRIBLE = {
    "faits": [], "phrases_a_reconstruire": [], "phrases_perdues": [],
    "phrases_sans_attache": [],
    "reussites": [
        {"phrase": 3, "type": "formule",
         "citation": "La liberté permet de faire des choix."},
        {"phrase": 7, "type": "mot_juste", "citation": "importante"},
    ],
}

REJETS_CRIBLE = [
    {"type": "formule", "phrase": 3,
     "citation": "La liberté permet de faire des choix.",
     "test": "procede", "raison": "aucun procédé nommable"},
    {"type": "mot_juste", "phrase": 7, "citation": "importante",
     "test": "mot_remplace", "raison": "ne remplace rien de plus précis"},
]


def cas_crible(m):
    """Le crible de la réussite — les trois cas que l'autotest éprouve."""
    jeux = [
        ("sans_rejet", REJETS_CRIBLE[:0], {"fluidite": 4, "precision": 4}),
        ("deux_rejets_apparies", REJETS_CRIBLE, {"fluidite": 4, "precision": 4}),
        ("rejet_non_apparie",
         [{"type": "formule", "phrase": 99,
           "citation": "une phrase qui n'est pas au relevé"}],
         {"fluidite": 3, "precision": 3}),
    ]
    cas = []
    for nom, rejets, grades in jeux:
        crible, alertes = m.crible_reussites(RELEVE_CRIBLE, rejets, grades)
        cas.append({"nom": nom, "releve": RELEVE_CRIBLE, "rejets": rejets,
                    "grades": grades,
                    "attendu": {"crible": crible, "alertes": alertes}})
    return cas


# Le texte et le relevé construits dans `autotest()`, à l'identique — l'étage
# `code1` : auto-retrait, `faits_total`, partition précision/fluidité, `taux_rx`,
# filtre D2, puis l'audit.
TEXTE_CODE1 = ("Premier paragraphe. Deuxième phrase du premier.\n\n"
               "Donc voilà. On va donc voir la suite. Cinquième phrase ici même. "
               "Sixième phrase pour finir le compte.")

RELEVE_CODE1 = {
    "faits": [
        {"type": "mot_generique", "citations": [
            {"phrase": 5, "citation": "phrase ici"},
            {"phrase": 6, "citation": "pour finir"}]},
        {"type": "registre_oral", "citations": [
            {"phrase": 3, "citation": "Donc"},
            {"phrase": 4, "citation": "On va donc voir"}]},
    ],
    "phrases_a_reconstruire": [{"n": 2}], "phrases_perdues": [],
    "phrases_sans_attache": [3], "reussites": [],
}

P2_CODE1 = {"grades": {"fluidite": 2, "precision": 2}, "etiquettes_rejetees": [
    {"type": "mot_generique", "phrase": 5, "citation": "phrase ici"},
    {"type": "mot_impropre", "phrase": 9, "citation": "inexistant"}]}


def cas_chaine_complete(m, nom, texte, releve, p2, params):
    """Un passage entier : code1 → code2 → conformite, sur les mêmes entrées."""
    import copy
    c1 = m.code1(copy.deepcopy(releve), texte, params)
    c2 = m.code2(p2, c1, params)
    conf = m.conformite(copy.deepcopy(releve), p2, c1, c2, params)
    return {
        "nom": nom, "texte": texte, "releve": releve, "entree_p2": p2,
        "params": params,
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


# ⭐ VECTEUR DU PORTAGE, ET NON DU MODULE. `exception_orthographe` est *acté*, il
#    a un chemin d'exécution depuis la v1.7 — et AUCUN VECTEUR ne le couvre dans
#    le module : son autotest ne l'éprouve nulle part (relevé de C4-L10).
#    Il est joué ici DES DEUX CÔTÉS, sur la même fonction du même module : ce
#    n'est donc pas une règle inventée, c'est une entrée de plus.
RELEVE_ORTHO = {
    "faits": [
        {"type": "accord_brouillant", "citations": [
            {"phrase": 1, "citation": "Premier paragraphe"}]},
        {"type": "mot_generique", "citations": [
            {"phrase": 5, "citation": "phrase ici"}]},
    ],
    "phrases_a_reconstruire": [], "phrases_perdues": [],
    "phrases_sans_attache": [], "reussites": [],
    "orthographe": {"total": 3, "citations": [
        {"phrase": 1, "citation": "paragraphe"},
        {"phrase": 5, "citation": "ici"},
        {"phrase": 6, "citation": "compte"}]},
}

P2_ORTHO = {"grades": {"fluidite": 3, "precision": 3}, "etiquettes_rejetees": []}


# ── LE BALAYAGE — ce qu'aucun vecteur du module ne couvre ───────────────────
#
# ⚠️ L'autotest du module l'annonce lui-même : « `profil` : AUCUN VECTEUR, la
#    question "observable ou dérivé" est ouverte chez Louis ». Les sept vecteurs
#    gold portent tous un écart de grades ≤ 1, donc tous le profil `diagonale` :
#    un portage qui inverserait la règle du profil dissocié passerait les sept.
#    Vérifié, et c'est ainsi qu'on l'a su.
#
# ⭐ Le balayage n'invente AUCUNE règle : il appelle LA MÊME FONCTION DU MÊME
#    MODULE sur plus d'entrées. Ce que les deux côtés comparent reste ce que le
#    module produit — simplement, on cesse de ne le lui demander que sept fois.


def cas_balayage_grades(m):
    """Les VINGT-CINQ couples de grades — le croisement, le garde-fou du grade
    nul, et le profil dissocié dans les deux sens."""
    cas = []
    for f in range(5):
        for p in range(5):
            c1 = m._doc_vide()
            p2 = {"niveau": None, "grades": {"fluidite": f, "precision": p},
                  "profil": None, "etiquettes_rejetees": []}
            cas.append({"nom": "grades_%d_%d" % (f, p), "entree_p2": p2,
                        "sortie_code1": c1, "params": {},
                        "attendu": m.code2(p2, c1, {})})
    return cas


# Dix phrases de dix mots, deux paragraphes : nb_mots = 100, donc une densité
# qui se lit directement en nombre de faits. Chaque phrase s'ouvre sur un mot
# UNIQUE — c'est lui qu'on cite, pour que l'appariement soit sans ambiguïté.
OUVREURS = ["Alpha", "Bravo", "Charlie", "Delta", "Echo",
            "Foxtrot", "Golf", "Hotel", "India", "Juliett"]
QUEUE = "un deux trois quatre cinq six sept huit neuf."


def texte_de_balayage():
    phrases = ["%s %s" % (o, QUEUE) for o in OUVREURS]
    return " ".join(phrases[:5]) + "\n\n" + " ".join(phrases[5:])


def cas_garde_fou_bas(m):
    """LA ZONE GRISE (v1.7, entrée 10), ses trois bandes et son second signal.

    « Au-delà du seuil haut, plafond Faible ; dans la zone grise, plafond
    SEULEMENT si un second signal confirme la casse ; sous la zone grise, pas de
    plafond. » Le couperet net d'avant faisait un palier entier pour un rejet
    d'audit d'écart — c'est la règle que ce balayage tient."""
    texte = texte_de_balayage()
    cas = []
    for nb_faits in (4, 5, 6):
        for nb_rx in (0, 1):
            faits = [{"type": "registre_oral",
                      "citations": [{"phrase": i + 1, "citation": OUVREURS[i]}
                                    for i in range(nb_faits)]}]
            releve = {"faits": faits,
                      "phrases_a_reconstruire": [{"n": 10}] if nb_rx else [],
                      "phrases_perdues": [], "phrases_sans_attache": [],
                      "reussites": []}
            p2 = {"grades": {"fluidite": 3, "precision": 3},
                  "etiquettes_rejetees": []}
            cas.append(cas_chaine_complete(
                m, "garde_fou_%dfaits_%drx" % (nb_faits, nb_rx),
                texte, releve, p2, {}))
    return cas


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
        },
        "autotest": {"echecs": echecs, "annonces": annonces},
        "p2_parfait": cas_p2_parfait(m),
        "balayage_grades": cas_balayage_grades(m),
        "garde_fou_zero": cas_garde_fou_zero(m),
        "crible": cas_crible(m),
        "chaines": [
            cas_chaine_complete(m, "code1_parfait", TEXTE_CODE1, RELEVE_CODE1,
                                P2_CODE1, {}),
            cas_chaine_complete(m, "exception_orthographe_off", TEXTE_CODE1,
                                RELEVE_ORTHO, P2_ORTHO,
                                {"exception_orthographe": False}),
            cas_chaine_complete(m, "exception_orthographe_on", TEXTE_CODE1,
                                RELEVE_ORTHO, P2_ORTHO,
                                {"exception_orthographe": True}),
        ] + cas_garde_fou_bas(m),
    }
    json.dump(paquet, sys.stdout, ensure_ascii=False, indent=None)
    sys.stdout.write("\n")
    return 1 if echecs else 0


if __name__ == "__main__":
    sys.exit(main())
