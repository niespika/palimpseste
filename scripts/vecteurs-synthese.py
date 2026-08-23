# -*- coding: utf-8 -*-
"""vecteurs-synthese.py — ce que le module de calibration produit, en JSON.

    « Le branchement reproduit, sur les vecteurs embarqués du module —
      `TESTS_CODE1_PARFAIT` et `TESTS_P2_PARFAIT` —, EXACTEMENT ce que
      `python3 code.py --autotest` produit, et sans aucun appel de modèle. »
                                          — le « fait quand » de C4-L10

CE SCRIPT NE TOUCHE À RIEN. Il IMPORTE `copies-tests/synthese/code.py` du dépôt
de conception, joue ses crochets, et écrit sur la sortie standard, en JSON : LES
ENTRÉES et LES SORTIES de chaque cas. Le test TypeScript rejoue les MÊMES
ENTRÉES sur le branchement et compare LES TROIS CLÉS — pas seulement
`verdicts` : « une trace qui diverge dit qu'un chemin de calcul a changé, même
quand le verdict tombe juste ».

⚠️ L'ÉTAT DE CE MODULE. `VERSION_GOLDS_TESTEE` vaut **None**, `TESTS_P2_PARFAIT`
est **VIDE**, et `copies-tests/synthese/` ne porte **ni gold, ni copie, ni
critère, ni run stocké** — « la Synthèse part au Run 1, golds d'abord » (fiche
§9). Ses 5 vecteurs de Code1 et ses 15 de composition sont des cas CONSTRUITS.
⚠️ Et le type se vérifie, il ne se suppose pas : chez l'Expression,
`TESTS_CODE1_PARFAIT` est une CHAÎNE, et un `len()` y a rendu « 52 vecteurs »
qui étaient 52 caractères. `meta` l'écrit ci-dessous.

⭐ D'OÙ LE BALAYAGE. Il appelle LA MÊME FONCTION DU MÊME MODULE sur plus
d'entrées : il n'invente aucune règle, il cesse de ne la lui demander que vingt
fois.

  · `balayage_cours`        — la branche SANS RÉFÉRENCE en entier : rapports ×
                              natures × unités, donc les quatre paliers ;
  · `balayage_texte`        — la branche AVEC RÉFÉRENCE : opérations × cardinalités
                              × fidélités, sur des populations À TAILLES
                              DIFFÉRENTES et avec des unités ÉCARTÉES DU DÉCOMPTE
                              QUI PORTENT QUAND MÊME LA PROPRIÉTÉ ;
  · `balayage_seuils`       — ⭐ LES PARAMÈTRES, pas seulement les entrées : les
                              trois seuils *provisoires (réglage empirique)* se
                              balayeront au banc, et une règle inéprouvable au
                              défaut le redevient dès qu'ils bougent ;
  · `balayage_crible`       — les quatre verdicts, l'appariement des termes, le
                              garde-fou `apport_apparie`, et le crible sur un
                              relevé sans apport ;
  · `balayage_borne_basse`  — ⭐ LES ÉCARTS DE LANGAGE là où ils mordent : la note
                              se lit EN FRANÇAIS (accents), le `\\b` de Python est
                              UNICODE (« infidèle » ne contient pas « fidele »),
                              les blancs de Python (`\\x85`, `\\x1c`-`\\x1f`) et la
                              BOM que `trim()` mange et que `strip()` garde ;
  · `balayage_cardinalites` — les cinq opérations × 0 à 3 correspondances, plus les
                              correspondances inexistantes ;
  · `balayage_statuts`      — les fonctions de la référence : plusieurs, inconnue,
                              aucune, et la plus haute du tableau ;
  · `balayage_rapports`     — l'appariement moment par moment : fonction, cible,
                              `pose`, moments absents, moments vides ;
  · `balayage_formes`       — ce que P1 et P2 peuvent rendre et que le module
                              n'attend pas. ⭐ `entre` EN CHAÎNE : Python itère ses
                              CARACTÈRES, donc `"12"` ne relie PAS 1 et 2 ;
  · `balayage_flottants`    — ⭐⭐ LES TROIS PIÈGES DE TEXTE : `%.2f` tranche AU
                              PAIR côté Python, `str()` d'un flottant garde son
                              point (`1.0` contre `1`), et `str()` d'une liste
                              garde le `repr()` de ses éléments (`[1, 3]`) ;
  · `balayage_pre_releve`   — `_mots` (le `\\w` UNICODE), `_phrases`, et les
                              recouvrements verbatim au seuil qui bouge ;
  · `balayage_document`     — ⭐ `document_p2` sur SES DEUX FORMES, et le canal
                              privé `_corr` qui ne doit jamais partir au juge ;
  · `balayage_conformite`   — les six choses que `conformite` a à dire, dont le
                              nombre dans la justification : ⭐ « la 3ème partie »
                              N'EN CONTIENT AUCUN pour Python.

USAGE
    python3 scripts/vecteurs-synthese.py [--racine <dépôt de conception>]

SORTIE : un objet JSON sur stdout. Code 0 si le module est chargé et son autotest
vert ; 1 sinon — un portage vérifié contre un module en échec ne prouve rien.
"""

import argparse
import importlib.util
import itertools
import json
import sys
from pathlib import Path

RACINE_DEFAUT = "/Users/louissagnieres/Documents/GitTest/palimpseste-conception"


def charge(racine):
    chemin = Path(racine) / "copies-tests" / "synthese" / "code.py"
    if not chemin.is_file():
        print(json.dumps({"absent": str(chemin)}), file=sys.stdout)
        sys.exit(0)
    spec = importlib.util.spec_from_file_location("synthese_code", chemin)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod, chemin


# ── Les matériaux de référence, réutilisés par tous les balayages ───────────

def ref(unites, moments=None):
    """Une référence décomposée : des unités à fonctions, et des moments."""
    r = {"unites": [{"u": u, "fonctions": list(f)} for u, f in unites]}
    if moments is not None:
        r["moments"] = moments
    return r


REF_QUATRE = ref(
    [(1, ["defend_these"]), (2, ["illustre"]), (3, ["defend_these"]), (4, ["explique"])],
    [{"m": "M1", "unites": [1, 2], "fonction": "pose", "cible": []},
     {"m": "M2", "unites": [3], "fonction": "refute", "cible": ["M1"]},
     {"m": "M3", "unites": [4], "fonction": "precise", "cible": ["M2"]}],
)


def cas(nom, p1, p2, contexte=None, params=None, groupe="vecteur"):
    """Un cas : ses ENTRÉES, telles que le test TypeScript les rejouera."""
    return {"nom": nom, "groupe": groupe, "p1": p1, "p2": p2,
            "contexte": contexte if contexte is not None else {},
            "params": params if params is not None else {}}


def joue(m, c):
    """Les DEUX crochets de calcul, plus `conformite`, sur les mêmes entrées."""
    P = {k: v["defaut"] for k, v in m.PARAMS.items()}
    P.update(c["params"])
    ctx = dict(c["contexte"])
    c1 = m.code1(c["p1"], ctx, P)
    c2 = m.code2(c["p2"], c1, P)
    conf = m.conformite(c["p1"], c["p2"], c1, c2, P)
    return {
        "nom": c["nom"], "groupe": c["groupe"], "p1": c["p1"], "p2": c["p2"],
        "contexte": c["contexte"], "params": c["params"],
        # Le référent que le MODULE dérive : le test le sert à `ctx.referent`
        # pour que le garde-fou du portage — qui n'existe pas au module — ne
        # fasse pas diverger la troisième clé sur un désaccord fabriqué.
        "referent_derive": (c1.get("mesures") or {}).get("referent"),
        "code1": {"mesures": c1.get("mesures"), "document_p2": c1.get("document_p2"),
                  "alertes": list(c1.get("alertes") or [])},
        "code2": {"verdicts": c2.get("verdicts"), "trace": list(c2.get("trace") or []),
                  "alertes": list(c2.get("alertes") or [])},
        "conformite": list(conf or []),
    }


# ── Les vecteurs EMBARQUÉS du module ───────────────────────────────────────

def p2_prose(crible=None, fidelite=None, **extra):
    """Un jugement complet — la prose comprise, pour que `conformite` se taise."""
    d = {"crible": list(crible or []), "fidelite": list(fidelite or []),
         "justification_ancree": "L'élève relie deux idées et coiffe le tout.",
         "ce_qui_plafonne": "les rapports du texte", "levier": "fondre deux idées",
         "confiance": "élevée"}
    d.update(extra)
    return d


def vecteurs_embarques(m):
    """`TESTS_CODE1_PARFAIT` (5), `_cas_code2()` (15), `TESTS_P2_PARFAIT` (vide)."""
    cas_ = []
    for t in m.TESTS_CODE1_PARFAIT:
        cas_.append(cas(f"CODE1 · {t['nom']}", t["p1"], p2_prose(), groupe="embarque_code1"))
    for nom, p1, p2, prm, _attendu in m._cas_code2():
        cas_.append(cas(f"CODE2 · {nom}", p1, p2, params=prm, groupe="embarque_code2"))
    for t in (getattr(m, "TESTS_P2_PARFAIT", None) or []):
        cas_.append(cas(f"P2 PARFAIT · {t['nom']}", t["p1"], t["p2"],
                        params=t.get("params", {}), groupe="embarque_p2"))
    return cas_


# ── LES BALAYAGES ──────────────────────────────────────────────────────────

def balayage_cours():
    """La branche SANS RÉFÉRENCE : les quatre paliers, et le seuil par-dessus."""
    out = []
    natures = ["additive", "nuance", "refute", "illustre", "conclut", "precise", "inconnue"]
    for n_unites in (0, 1, 2, 3, 5, 8):
        unites = [{"u": i} for i in range(1, n_unites + 1)]
        for nat in natures:
            for n_rap in (0, 1, 2):
                rapports = []
                for k in range(n_rap):
                    a, b = 1 + k, 2 + k
                    if a <= n_unites and b <= n_unites:
                        rapports.append({"entre": [a, b], "nature": nat})
                for verdict in (None, "organisateur", "vide", "decoratif", "non_couvrant"):
                    apports = ([{"terme_cite": "économie", "unites_recouvertes": [1, 2]}]
                               if verdict else [])
                    crible = ([{"terme_cite": "économie", "verdict": verdict, "raison": "r"}]
                              if verdict else [])
                    out.append(cas(
                        f"cours u{n_unites} {nat} r{n_rap} {verdict}",
                        {"unites": unites, "rapports": rapports, "apports": apports,
                         "these_forme": "affirmation_complete"},
                        p2_prose(crible=crible), groupe="balayage_cours"))
    return out


def balayage_texte():
    """La branche AVEC RÉFÉRENCE — populations à TAILLES DIFFÉRENTES.

    ⭐ La parade des items 11, 20 et 27 de la boîte aux lettres, appliquée
    d'emblée : les quatre populations n'ont pas la même taille, et AU MOINS UNE
    UNITÉ ÉCARTÉE DU DÉCOMPTE PORTE QUAND MÊME LA PROPRIÉTÉ MESURÉE — l'unité 4
    est une `fusion` à UNE seule correspondance, donc écartée par la cardinalité,
    et elle porte pourtant une opération intégrative ; l'unité 5 est un `apport`,
    donc hors des couvrantes, et le juge la juge quand même.
    """
    out = []
    ops = ["copie", "paraphrase", "fusion", "generalisation", "apport"]
    etats = ["fidele", "contresens_partiel", "contresens_majeur", "limite"]
    for op1, op2 in itertools.product(ops, repeat=2):
        align = [
            {"u": 1, "correspond_a": [1, 3], "operation": op1},
            {"u": 2, "correspond_a": [4], "operation": op2},
            {"u": 3, "correspond_a": [2], "operation": "paraphrase"},
            # écartée par la cardinalité, et pourtant intégrative :
            {"u": 4, "correspond_a": [3], "operation": "fusion"},
            # hors des couvrantes, et jugée quand même :
            {"u": 5, "correspond_a": [], "operation": "apport"},
        ]
        p1 = {"unites": [{"u": i} for i in range(1, 6)],
              "rapports": [{"entre": [1, 2], "nature": "refute"},
                           {"entre": [2, 3], "nature": "precise"}],
              "apports": [{"terme_cite": "économie", "unites_recouvertes": [1, 2]}],
              "these_forme": "affirmation_complete",
              "alignement": align, "reference": REF_QUATRE}
        for e in etats:
            fid = [{"u": 1, "etat": e, "note": "entre fidele et contresens_partiel"},
                   {"u": 2, "etat": "fidele"}, {"u": 3, "etat": "fidele"}]
            out.append(cas(f"texte {op1}/{op2} fid={e}", p1,
                           p2_prose(crible=[{"terme_cite": "économie", "verdict": "organisateur"}],
                                    fidelite=fid),
                           groupe="balayage_texte"))
    # Les fidélités TRONQUÉES, DOUBLÉES, au `u` inventé et SANS `u`.
    base = {"unites": [{"u": i} for i in (1, 2, 3)],
            "rapports": [{"entre": [1, 2], "nature": "refute"}], "apports": [],
            "these_forme": "absente",
            "alignement": [{"u": 1, "correspond_a": [1, 3], "operation": "fusion"},
                           {"u": 2, "correspond_a": [4], "operation": "paraphrase"},
                           {"u": 3, "correspond_a": [2], "operation": "copie"}],
            "reference": REF_QUATRE}
    for nom, fid in (
            ("complète", [{"u": 1, "etat": "fidele"}, {"u": 2, "etat": "fidele"},
                          {"u": 3, "etat": "fidele"}]),
            ("tronquée", [{"u": 1, "etat": "fidele"}]),
            ("vide", []),
            ("doublée", [{"u": 1, "etat": "fidele"}, {"u": 1, "etat": "fidele"},
                         {"u": 2, "etat": "fidele"}, {"u": 3, "etat": "fidele"}]),
            ("sans u", [{"etat": "contresens_majeur"}, {"etat": "fidele"},
                        {"etat": "fidele"}]),
            ("u inventé", [{"u": 99, "etat": "contresens_majeur"}]),
            ("u en texte", [{"u": "1", "etat": "fidele"}, {"u": "2", "etat": "fidele"},
                            {"u": "3", "etat": "fidele"}]),
            ("hors catalogue", [{"u": 1, "etat": "douteux"}, {"u": 2, "etat": "fidele"},
                                {"u": 3, "etat": "fidele"}]),
    ):
        out.append(cas(f"fidélité {nom}", base, p2_prose(fidelite=fid),
                       groupe="balayage_texte"))
    return out


def balayage_seuils():
    """⭐ LES PARAMÈTRES, pas seulement les entrées (item 28 de la boîte).

    Les trois seuils qui décident du palier sont *provisoires (réglage
    empirique)* : ils se balayeront au banc, et une comparaison inéprouvable au
    défaut le redevient dès qu'ils bougent.
    """
    out = []
    align = [{"u": 1, "correspond_a": [1, 3], "operation": "fusion"},
             {"u": 2, "correspond_a": [4], "operation": "paraphrase"},
             {"u": 3, "correspond_a": [2], "operation": "paraphrase"}]
    p1 = {"unites": [{"u": i} for i in (1, 2, 3)],
          "rapports": [{"entre": [1, 2], "nature": "refute"},
                       {"entre": [2, 3], "nature": "precise"}],
          "apports": [], "these_forme": "affirmation_complete",
          "alignement": align, "reference": REF_QUATRE}
    fid = [{"u": 1, "etat": "fidele"}, {"u": 2, "etat": "contresens_partiel"},
           {"u": 3, "etat": "fidele"}]
    for pe, pr, cp in itertools.product((0.0, 0.34, 0.5, 0.8, 1.0), (0.0, 0.5, 0.8, 1.0), (0, 1, 2, 3)):
        out.append(cas(f"seuils pe={pe} pr={pr} cp={cp}", p1, p2_prose(fidelite=fid),
                       params={"part_essentielles_bon": pe, "part_rapports_rendus_bon": pr,
                               "contresens_partiels_plafond_moyen": cp},
                       groupe="balayage_seuils"))
    # Le signal de compression : il ne s'émet qu'avec une cible réglée.
    for cible in (None, 0.0, 0.2, 0.5):
        for tol in (0.0, 0.5, 2.0):
            for taux in (0.1, 0.2, 0.5):
                out.append(cas(
                    f"compression cible={cible} tol={tol} taux={taux}",
                    {"unites": [{"u": 1}, {"u": 2}],
                     "rapports": [{"entre": [1, 2], "nature": "refute"}], "apports": []},
                    p2_prose(),
                    contexte={"_mesures": {"taux_compression": taux}},
                    params={"compression_cible": cible, "tolerance_compression": tol},
                    groupe="balayage_seuils"))
    return out


def balayage_crible():
    """Les quatre verdicts, l'appariement des termes, et `apport_apparie`."""
    out = []
    verdicts = ["organisateur", "vide", "decoratif", "non_couvrant", "inconnu"]
    p1_base = {"unites": [{"u": 1}, {"u": 2}, {"u": 3}],
               "rapports": [{"entre": [1, 2], "nature": "refute"},
                            {"entre": [2, 3], "nature": "nuance"}],
               "these_forme": "affirmation_complete"}
    for termes in ([], ["économie du passé"], ["économie du passé", "Économie  du   Passé"]):
        apports = [{"terme_cite": t, "unites_recouvertes": [1, 2]} for t in termes]
        for v in verdicts:
            for cite in ("économie du passé", "ÉCONOMIE DU PASSÉ", "autre chose", "", None):
                crible = [{"terme_cite": cite, "verdict": v, "raison": "r"}]
                out.append(cas(
                    f"crible {len(termes)} apport(s) {v} cité={cite!r}",
                    dict(p1_base, apports=apports), p2_prose(crible=crible),
                    groupe="balayage_crible"))
    # Le crible non-objet, et le crible en CHAÎNE — Python itère ses caractères.
    for crible in ([], ["texte"], [42], "vide", {"a": 1}):
        out.append(cas(f"crible forme {crible!r}",
                       dict(p1_base, apports=[{"terme_cite": "x", "unites_recouvertes": [1]}]),
                       p2_prose(crible=crible), groupe="balayage_crible"))
    # ⚠️ `termes_reference` n'est écrit par AUCUN chemin de `code1` : le garde-fou
    #    `apport_apparie` est INERTE des deux côtés, et ce cas le PROUVE.
    out.append(cas("apport_apparie (garde-fou inerte)",
                   dict(p1_base, apports=[{"terme_cite": "économie", "unites_recouvertes": [1, 2]}]),
                   p2_prose(crible=[{"terme_cite": "économie", "verdict": "organisateur"}]),
                   groupe="balayage_crible"))
    return out


def balayage_borne_basse():
    """⭐ LA NOTE SE LIT EN FRANÇAIS, ET LE `\\b` DE PYTHON EST UNICODE."""
    notes = [
        "entre fidele et contresens_partiel",
        "entre fidèle et contresens partiel",
        "Entre FIDÈLE et Contresens-Majeur",
        "entre contresens partiel et contresens majeur",
        "entre contresens_majeur et fidele",
        "je ne sais pas",
        "unité 2 visée, statut concédé, écart léger",
        "l'élève est infidèle au texte",
        "infidele et contresens partiel",
        "fidele",
        "",
        None,
        42,
        ["fidele", "contresens_partiel"],
        # Les blancs que Python tient pour tels et JavaScript non :
        "entre\x85fidele\x85et\x1fcontresens_partiel",
        "\x1cfidele contresens majeur\x1d",
        # La BOM : `trim()` la mange, `strip()` la garde.
        "﻿fidele et contresens majeur",
        "fidele et contresens majeur﻿",
        # Le repliement de casse complet :
        "FIDELE ET CONTRESENS MAJEUR",
        "fidele et contresens majeur",
    ]
    base = {"unites": [{"u": 1}, {"u": 2}],
            "rapports": [{"entre": [1, 2], "nature": "refute"}], "apports": [],
            "these_forme": "absente",
            "alignement": [{"u": 1, "correspond_a": [1, 3], "operation": "fusion"},
                           {"u": 2, "correspond_a": [4], "operation": "paraphrase"}],
            "reference": REF_QUATRE}
    out = []
    for i, n in enumerate(notes):
        out.append(cas(f"borne basse #{i} {n!r}", base,
                       p2_prose(fidelite=[{"u": 1, "etat": "limite", "note": n},
                                          {"u": 2, "etat": "fidele"}]),
                       groupe="balayage_borne_basse"))
    return out


def balayage_cardinalites():
    """Les cinq opérations × 0 à 3 correspondances, et les inexistantes."""
    out = []
    for op in ["copie", "paraphrase", "fusion", "generalisation", "apport", "inconnue", None]:
        for corr in ([], [1], [1, 3], [1, 2, 3], [99], [1, 99], "12", 12, None):
            p1 = {"unites": [{"u": 1}], "rapports": [], "apports": [],
                  "these_forme": "absente",
                  "alignement": [{"u": 1, "correspond_a": corr, "operation": op}],
                  "reference": REF_QUATRE}
            out.append(cas(f"cardinalité {op} × {corr!r}", p1,
                           p2_prose(fidelite=[{"u": 1, "etat": "fidele"}]),
                           groupe="balayage_cardinalites"))
    # Une unité absente de l'alignement, et un alignement absent tout court.
    for align in ([], [{"u": 2, "correspond_a": [1], "operation": "copie"}], "rien", None):
        out.append(cas(f"alignement {align!r}",
                       {"unites": [{"u": 1}], "rapports": [], "apports": [],
                        "these_forme": "absente", "alignement": align,
                        "reference": REF_QUATRE},
                       p2_prose(), groupe="balayage_cardinalites"))
    return out


def balayage_statuts():
    """Les fonctions de la référence : plusieurs, inconnue, aucune, la plus haute."""
    out = []
    jeux = [
        ["defend_these"], ["explique"], ["illustre"],
        ["illustre", "defend_these"], ["defend_these", "illustre"],
        ["explique", "illustre"], ["inconnue"], ["inconnue", "explique"],
        [], None, "defend_these", 42, {"defend_these": True},
    ]
    for f in jeux:
        r = {"unites": [{"u": 1, "fonctions": f}, {"u": 2, "fonctions": ["illustre"]}],
             "moments": [{"m": "M1", "unites": [1, 2], "fonction": "pose", "cible": []}]}
        out.append(cas(f"statuts {f!r}",
                       {"unites": [{"u": 1}], "rapports": [], "apports": [],
                        "these_forme": "absente",
                        "alignement": [{"u": 1, "correspond_a": [2], "operation": "paraphrase"}],
                        "reference": r},
                       p2_prose(fidelite=[{"u": 1, "etat": "fidele"}]),
                       groupe="balayage_statuts"))
    return out


def balayage_rapports():
    """L'appariement moment par moment, et les inversions hiérarchiques."""
    out = []
    unites_ref = [(1, ["defend_these"]), (2, ["illustre"]), (3, ["defend_these"]),
                  (4, ["explique"])]
    jeux_moments = [
        None, [],
        [{"m": "M1", "unites": [1, 2], "fonction": "pose", "cible": []}],
        [{"m": "M1", "unites": [1, 2], "fonction": "pose", "cible": []},
         {"m": "M2", "unites": [3], "fonction": "refute", "cible": ["M1"]}],
        [{"m": "M1", "unites": [1, 2], "fonction": "pose", "cible": []},
         {"m": "M2", "unites": [3], "fonction": "refute", "cible": ["M0"]}],
        [{"m": "M1", "unites": [1], "fonction": "refute", "cible": []},
         {"m": "M2", "unites": [3], "fonction": "nuance", "cible": ["M1"]}],
        [{"m": "M1", "unites": [1, 2], "fonction": "illustre", "cible": ["M2"]},
         {"m": "M2", "unites": [3, 4], "fonction": "conclut", "cible": ["M1"]}],
    ]
    natures = ["refute", "nuance", "additive", "illustre", "conclut", "precise"]
    for moments in jeux_moments:
        for nat in natures:
            align = [{"u": 1, "correspond_a": [1], "operation": "paraphrase"},
                     {"u": 2, "correspond_a": [3], "operation": "paraphrase"},
                     {"u": 3, "correspond_a": [2], "operation": "copie"}]
            out.append(cas(
                f"rapports moments={moments and len(moments)} {nat}",
                {"unites": [{"u": 1}, {"u": 2}, {"u": 3}],
                 "rapports": [{"entre": [1, 2], "nature": nat}],
                 "apports": [], "these_forme": "absente", "alignement": align,
                 "reference": ref(unites_ref, moments)},
                p2_prose(fidelite=[{"u": 1, "etat": "fidele"}, {"u": 2, "etat": "fidele"},
                                   {"u": 3, "etat": "fidele"}]),
                groupe="balayage_rapports"))
    # L'inversion : l'illustration gardée, sa thèse perdue.
    for couvre in ([1], [2], [1, 2], []):
        align = [{"u": i + 1, "correspond_a": [c], "operation": "paraphrase"}
                 for i, c in enumerate(couvre)]
        out.append(cas(
            f"inversion couvre={couvre}",
            {"unites": [{"u": i + 1} for i in range(len(couvre))], "rapports": [],
             "apports": [], "these_forme": "absente", "alignement": align,
             "reference": ref([(1, ["defend_these"]), (2, ["illustre"])],
                              [{"m": "M1", "unites": [1, 2], "fonction": "pose", "cible": []}])},
            p2_prose(fidelite=[{"u": i + 1, "etat": "fidele"} for i in range(len(couvre))]),
            groupe="balayage_rapports"))
    return out


def balayage_formes():
    """Ce que P1 et P2 peuvent rendre et que le module n'attend pas.

    ⭐ `entre` EN CHAÎNE : Python itère ses CARACTÈRES, donc `"12"` porte deux
    unités inexistantes — il ne relie PAS les unités 1 et 2. On le PORTE, on ne
    le « répare » surtout pas.
    """
    out = []
    for entre in ([1, 2], [1], [], "12", ["1", "2"], [1, 99], None, {"a": 1}):
        out.append(cas(f"entre={entre!r}",
                       {"unites": [{"u": 1}, {"u": 2}],
                        "rapports": [{"entre": entre, "nature": "refute"}],
                        "apports": [], "these_forme": "absente"},
                       p2_prose(), groupe="balayage_formes"))
    for forme in ("affirmation_complete", "mot_ou_syntagme", "question", "absente",
                  "inconnue", None, "", 42, ["absente"]):
        out.append(cas(f"these_forme={forme!r}",
                       {"unites": [{"u": 1}], "rapports": [], "apports": [],
                        "these_forme": forme},
                       p2_prose(), groupe="balayage_formes"))
    for apports in ([], [{"terme_cite": "x"}], [{"terme_cite": "  X  "}],
                    [{"terme_cite": ""}], [{"terme_cite": None}], [{}],
                    [{"terme_cite": "a"}, {"terme_cite": "a"}]):
        out.append(cas(f"apports={apports!r}",
                       {"unites": [{"u": 1}], "rapports": [], "apports": apports,
                        "these_forme": "absente"},
                       p2_prose(), groupe="balayage_formes"))
    for p1 in ({}, {"unites": None}, {"unites": []},
               {"unites": [{"u": 1}], "rapports": None, "apports": None}):
        out.append(cas(f"p1={p1!r}", p1, p2_prose(), groupe="balayage_formes"))
    for p2 in ({}, {"crible": None, "fidelite": None}, p2_prose(),
               p2_prose(niveau="Bon"), p2_prose(palier_base="Moyen"),
               p2_prose(seuil_franchi="oui")):
        out.append(cas(f"p2={sorted(p2)!r}",
                       {"unites": [{"u": 1}], "rapports": [], "apports": [],
                        "these_forme": "absente"},
                       p2, groupe="balayage_formes"))
    return out


def balayage_flottants():
    """⭐⭐ LES TROIS PIÈGES DE TEXTE, éprouvés là où ils entrent dans LA TRACE.

    · `%.2f` tranche les égalités exactes AU PAIR côté Python — une mobilisation
      de 0,125 s'écrit `0.12` et `toFixed(2)` rendrait `0.13` ;
    · `str()` d'un flottant garde son point — `relation_rendue` à 1.0 s'écrit
      « 1.0 », et `String(1)` rendrait « 1 » ;
    · `str()` d'une liste garde le `repr()` de ses éléments — `[1, 3]`, pas `1,3`.
    """
    out = []
    # Des mobilisations qui tombent EXACTEMENT sur une égalité de mi-chemin.
    for n_unites, n_reliees in ((8, 1), (16, 1), (8, 5), (16, 5), (4, 1), (40, 1),
                                (8, 3), (16, 3), (32, 1), (2, 1), (3, 1)):
        unites = [{"u": i} for i in range(1, n_unites + 1)]
        rapports = []
        for k in range(0, max(0, n_reliees - 1)):
            rapports.append({"entre": [1 + k, 2 + k], "nature": "refute"})
        if n_reliees == 1:
            rapports = []
        out.append(cas(f"flottant cours {n_reliees}/{n_unites}",
                       {"unites": unites, "rapports": rapports, "apports": [],
                        "these_forme": "absente"},
                       p2_prose(), groupe="balayage_flottants"))
    # `relation_rendue` et `couverture_essentielles` EXACTEMENT à 1.0 et 0.5 :
    # c'est là que `str(1.0)` diverge de `String(1)`.
    for n_ess, n_couv in ((1, 1), (2, 1), (2, 2), (4, 2), (4, 1)):
        unites_ref = [(i, ["defend_these"]) for i in range(1, n_ess + 1)]
        moments = [{"m": "M1", "unites": [1], "fonction": "pose", "cible": []},
                   {"m": "M2", "unites": list(range(2, n_ess + 1)) or [1],
                    "fonction": "refute", "cible": ["M1"]}]
        align = [{"u": i, "correspond_a": [i], "operation": "paraphrase"}
                 for i in range(1, n_couv + 1)]
        out.append(cas(
            f"flottant texte ess={n_couv}/{n_ess}",
            {"unites": [{"u": i} for i in range(1, n_couv + 1)],
             "rapports": [{"entre": [1, 2], "nature": "refute"}] if n_couv >= 2 else [],
             "apports": [], "these_forme": "absente", "alignement": align,
             "reference": ref(unites_ref, moments)},
            p2_prose(fidelite=[{"u": i, "etat": "fidele"} for i in range(1, n_couv + 1)]),
            groupe="balayage_flottants"))
    # `str()` d'une LISTE dans une alerte et dans la trace du plafond.
    for corr in ([99], [98, 99], [1, 99]):
        out.append(cas(f"str(liste) corr={corr}",
                       {"unites": [{"u": 1}], "rapports": [], "apports": [],
                        "these_forme": "absente",
                        "alignement": [{"u": 1, "correspond_a": corr, "operation": "paraphrase"}],
                        "reference": REF_QUATRE},
                       p2_prose(fidelite=[{"u": 1, "etat": "fidele"}]),
                       groupe="balayage_flottants"))
    # Le plafond du contresens majeur : `sorted(ess_majeur)` part à la trace.
    align3 = [{"u": 1, "correspond_a": [1, 3], "operation": "fusion"},
              {"u": 2, "correspond_a": [4], "operation": "paraphrase"},
              {"u": 3, "correspond_a": [2], "operation": "copie"}]
    for e1, e2, e3 in itertools.product(["fidele", "contresens_partiel", "contresens_majeur"],
                                        repeat=3):
        out.append(cas(
            f"plafond {e1[:4]}/{e2[:4]}/{e3[:4]}",
            {"unites": [{"u": 1}, {"u": 2}, {"u": 3}],
             "rapports": [{"entre": [1, 2], "nature": "refute"}], "apports": [],
             "these_forme": "absente", "alignement": align3, "reference": REF_QUATRE},
            p2_prose(fidelite=[{"u": 1, "etat": e1}, {"u": 2, "etat": e2},
                               {"u": 3, "etat": e3}]),
            groupe="balayage_flottants"))
    return out


def balayage_document():
    """⭐ `document_p2` sur SES DEUX FORMES, et le canal privé qui ne fuit pas."""
    out = []
    p1_cours = {"unites": [{"u": 1, "citation": "la mémoire garde", "segments": [1]}],
                "rapports": [{"entre": [1, 2], "nature": "refute", "citation": "alors que"}],
                "apports": [{"terme_cite": "économie", "unites_recouvertes": [1],
                             "deploiement": ["[pose_seul]"]}],
                "these_forme": "affirmation_complete",
                "these_citee": "la mémoire trie"}
    out.append(cas("document cours", p1_cours, p2_prose(), groupe="balayage_document"))
    p1_texte = dict(p1_cours,
                    alignement=[{"u": 1, "correspond_a": [1], "operation": "paraphrase"}],
                    reference=REF_QUATRE)
    out.append(cas("document texte", p1_texte,
                   p2_prose(fidelite=[{"u": 1, "etat": "fidele"}]),
                   groupe="balayage_document"))
    # La référence par le CONTEXTE, et non par `sortie_p1` — le jour où la chaîne
    # la sert, c'est ce chemin-là qui vaut.
    out.append(cas("document texte (référence au contexte)",
                   dict(p1_cours, alignement=[{"u": 1, "correspond_a": [1],
                                               "operation": "paraphrase"}]),
                   p2_prose(fidelite=[{"u": 1, "etat": "fidele"}]),
                   contexte={"reference": REF_QUATRE}, groupe="balayage_document"))
    # Un relevé vide, et un alignement qui porte déjà une clé à tiret bas.
    out.append(cas("document relevé vide", {}, p2_prose(), groupe="balayage_document"))
    out.append(cas("document alignement pollué",
                   dict(p1_cours,
                        alignement=[{"u": 1, "correspond_a": [1], "operation": "paraphrase",
                                     "_note": "privée"}],
                        reference=REF_QUATRE),
                   p2_prose(fidelite=[{"u": 1, "etat": "fidele"}]),
                   groupe="balayage_document"))
    return out


# ⭐⭐ LA RÉFÉRENCE DES FRONTIÈRES — celle qui isole chaque seuil.
#
# L'épreuve négative a montré que quatre comparaisons survivaient : `partInt <=
# 0.5`, `rendus < pr`, `couvEss < pe` et `partiels > plafond`. ⛔ Elles ne
# survivaient pas parce qu'elles étaient fausses, mais parce que LA DISJONCTION
# LES MASQUAIT : sur les cas du balayage, un autre terme du `ou` faisait déjà
# tomber le palier à Moyen, et déplacer une inégalité ne changeait rien.
#
# Le remède est celui de l'item 28 de la boîte aux lettres — BALAYER LES SEUILS,
# pas seulement les entrées — mais il ne suffit pas seul : il faut aussi que
# TOUS LES AUTRES TERMES SOIENT CONFORTABLEMENT AU-DESSUS, pour que la frontière
# éprouvée soit la seule à décider. C'est ce que cette référence construit.
#
#   · quatre essentielles → `couvEss` ∈ {0, ¼, ½, ¾, 1} ;
#   · quatre moments déclarés → `rendus` ∈ {0, ¼, ½, ¾} ;
#   · aucune fonction `illustre` → aucune illustration, donc AUCUNE inversion :
#     le terme `inversions > 0` ne masque jamais rien. ⭐ Et `m["elagage"]` y vaut
#     `None` quand `inversions` vaut 0 — c'est ce qui sépare les DEUX NOMBRES de
#     l'observable `elagage`.
REF_FRONT = {
    "unites": [{"u": 1, "fonctions": ["defend_these"]},
               {"u": 2, "fonctions": ["defend_these"]},
               {"u": 3, "fonctions": ["defend_these"]},
               {"u": 4, "fonctions": ["defend_these"]},
               {"u": 5, "fonctions": ["explique"]},
               {"u": 6, "fonctions": ["explique"]}],
    "moments": [{"m": "M1", "unites": [1, 2], "fonction": "pose", "cible": []},
                {"m": "M2", "unites": [3], "fonction": "refute", "cible": ["M1"]},
                {"m": "M3", "unites": [4], "fonction": "precise", "cible": ["M2"]},
                {"m": "M4", "unites": [5], "fonction": "conclut", "cible": ["M3"]},
                {"m": "M5", "unites": [6], "fonction": "illustre", "cible": ["M4"]}],
}

RAPPORTS_FRONT = [
    {"entre": [1, 2], "nature": "refute"},     # rend M2
    {"entre": [1, 2], "nature": "precise"},    # rend M3
    {"entre": [2, 3], "nature": "conclut"},    # rend M4
]


def balayage_frontieres():
    """⭐⭐ CHAQUE SEUIL, ISOLÉ, ET LA FRONTIÈRE ATTEINTE EXACTEMENT."""
    out = []
    # Deux familles d'alignement : `partInt` à ⅔ (au large) et à ½ PILE.
    familles = {
        "partInt=2/3": [{"u": 1, "correspond_a": [1, 2], "operation": "fusion"},
                        {"u": 2, "correspond_a": None, "operation": "fusion"},
                        {"u": 3, "correspond_a": [5], "operation": "paraphrase"}],
        "partInt=1/2": [{"u": 1, "correspond_a": [1, 2], "operation": "fusion"},
                        {"u": 2, "correspond_a": None, "operation": "fusion"},
                        {"u": 3, "correspond_a": [5], "operation": "paraphrase"},
                        {"u": 4, "correspond_a": [6], "operation": "paraphrase"}],
    }
    couvertures = {"ess=1": [3, 4], "ess=1/2": [5, 6]}
    for nom_f, gabarit in familles.items():
        for nom_c, corr2 in couvertures.items():
            for n_rap in range(len(RAPPORTS_FRONT) + 1):
                align = [dict(a) for a in gabarit]
                align[1]["correspond_a"] = corr2
                unites = [{"u": a["u"]} for a in align]
                for n_partiels in (0, 1, 2, 3):
                    fid = []
                    for i, a in enumerate(align):
                        etat = "contresens_partiel" if i < n_partiels else "fidele"
                        fid.append({"u": a["u"], "etat": etat})
                    p1 = {"unites": unites, "rapports": RAPPORTS_FRONT[:n_rap],
                          "apports": [], "these_forme": "affirmation_complete",
                          "alignement": align, "reference": REF_FRONT}
                    for pe in (0.0, 0.25, 0.5, 0.75, 1.0):
                        for pr in (0.0, 0.25, 0.5, 0.75, 1.0):
                            for cp in (1, 2, 3):
                                out.append(cas(
                                    f"frontière {nom_f} {nom_c} r{n_rap} p{n_partiels} "
                                    f"pe={pe} pr={pr} cp={cp}",
                                    p1, p2_prose(fidelite=fid),
                                    params={"part_essentielles_bon": pe,
                                            "part_rapports_rendus_bon": pr,
                                            "contresens_partiels_plafond_moyen": cp},
                                    groupe="balayage_frontieres"))
    return out


def balayage_langage():
    """⭐ LES ÉCARTS DE LANGAGE, éprouvés LÀ OÙ ILS DÉCIDENT VRAIMENT.

    Quatre survivantes de l'épreuve négative venaient d'ici : les balayages
    faisaient bien passer des blancs et des ligatures, mais jamais dans le champ
    QUI EN DÉPEND. Ces cas-là les y mettent.

    · `casefold()` contre `toLowerCase()` : la LIGATURE `ﬁ`, qu'une OCR produit,
      se replie en `fi` pour Python et reste `ﬁ` pour JavaScript — une note de
      « limite » y perd un état, donc un palier ;
    · les BLANCS de Python dans un `terme_cite` : `_norm` y remplace une suite de
      blancs par UNE espace, et `\x85` en est un pour Python seul — l'appariement
      du crible en dépend, donc le seuil, donc Acquis ;
    · la BOM dans un `terme_cite` : `trim()` la mange, `strip()` la garde ;
    · `sorted()` sur des identifiants à DEUX CHIFFRES : le tri par défaut de
      JavaScript est LEXICAL, et `[10, 2]` y reste `[10, 2]`.
    """
    out = []
    p1_base = {"unites": [{"u": 1}, {"u": 2}, {"u": 3}],
               "rapports": [{"entre": [1, 2], "nature": "refute"},
                            {"entre": [2, 3], "nature": "nuance"}],
               "these_forme": "affirmation_complete"}
    # Le crible et son appariement, sur des termes que la normalisation décide.
    for terme in ("économie du passé", "économie\x85du passé", "économie\u00a0du passé",
                  "\ufefféconomie du passé", "économie du passé\ufeff",
                  "économie\x1fdu passé", "ﬁnitude", "finitude", "Straße", "STRASSE"):
        for cite in (terme, terme.replace("\x85", " ").replace("\x1f", " "),
                     "économie du passé", "ﬁnitude", "finitude"):
            out.append(cas(
                f"langage crible {terme!r} vs {cite!r}",
                dict(p1_base, apports=[{"terme_cite": terme, "unites_recouvertes": [1, 2]}]),
                p2_prose(crible=[{"terme_cite": cite, "verdict": "organisateur"}]),
                groupe="balayage_langage"))
    # ⭐ La LIGATURE dans une note de « limite » : elle décide d'un palier.
    ref_deux = ref([(1, ["defend_these"]), (2, ["defend_these"])],
                   [{"m": "M1", "unites": [1, 2], "fonction": "pose", "cible": []}])
    p1_lim = {"unites": [{"u": 1}], "rapports": [], "apports": [],
              "these_forme": "absente",
              "alignement": [{"u": 1, "correspond_a": [1, 2], "operation": "fusion"}],
              "reference": ref_deux}
    for note in ("entre ﬁdele et contresens majeur", "entre fidele et contresens majeur",
                 "entre ﬁdèle et contresens_majeur", "Straße fidele contresens majeur",
                 "\ufefffidele et contresens majeur", "fidele\x85et\x85contresens majeur",
                 "fidele\u00a0et\u00a0contresens majeur", "ﬂ fidele contresens partiel"):
        out.append(cas(f"langage note {note!r}", p1_lim,
                       p2_prose(fidelite=[{"u": 1, "etat": "limite", "note": note}]),
                       groupe="balayage_langage"))
    # ⭐ `sorted()` sur des identifiants à DEUX CHIFFRES — le tri lexical de
    #    JavaScript rendrait `[10, 2]` là où Python rend `[2, 10]`.
    grands = ref([(2, ["defend_these"]), (10, ["defend_these"]), (3, ["defend_these"]),
                  (20, ["illustre"]), (1, ["explique"])],
                 [{"m": "M1", "unites": [2, 10, 20], "fonction": "pose", "cible": []},
                  {"m": "M2", "unites": [3], "fonction": "refute", "cible": ["M1"]}])
    align_grands = [{"u": 1, "correspond_a": [2, 10], "operation": "fusion"},
                    {"u": 2, "correspond_a": [3], "operation": "paraphrase"},
                    {"u": 11, "correspond_a": [20], "operation": "copie"}]
    for fid in ([{"u": 1, "etat": "contresens_majeur"}, {"u": 2, "etat": "fidele"},
                 {"u": 11, "etat": "fidele"}],
                [{"u": 1, "etat": "fidele"}, {"u": 2, "etat": "contresens_majeur"},
                 {"u": 11, "etat": "contresens_majeur"}],
                [{"u": 1, "etat": "fidele"}, {"u": 2, "etat": "fidele"},
                 {"u": 11, "etat": "fidele"}]):
        out.append(cas(
            f"langage tri {[f['etat'][:4] for f in fid]}",
            {"unites": [{"u": 1}, {"u": 2}, {"u": 11}],
             "rapports": [{"entre": [1, 2], "nature": "refute"}], "apports": [],
             "these_forme": "absente", "alignement": align_grands, "reference": grands},
            p2_prose(fidelite=fid), groupe="balayage_langage"))
    # Une unité du relevé qui n'est PAS un objet : le module LÈVE, le portage doit
    # nommer ce qu'il écarte.
    for unites in ([42], ["texte"], [{"u": 1}, 42], [None]):
        out.append(cas(f"langage unités {unites!r}",
                       {"unites": unites, "rapports": [], "apports": [],
                        "these_forme": "absente"},
                       p2_prose(), groupe="balayage_langage"))
    return out


def balayage_conformite():
    """Les six choses que `conformite` a à dire — dont le nombre en français."""
    out = []
    justifications = [
        "L'élève relie deux idées.",
        "il y a 3 unités",
        "la 3ème partie est plus fine",       # ⭐ AUCUN nombre pour Python
        "café3 et rien d'autre",              # ⭐ AUCUN nombre non plus
        "le paragraphe 12 est net",
        "٣ unités",                            # ⭐ un chiffre arabe : \d unicode
        "2/3 des idées",
        "",
        None,
    ]
    for j in justifications:
        out.append(cas(f"conformité justification={j!r}",
                       {"unites": [{"u": 1}], "rapports": [], "apports": [],
                        "these_forme": "absente"},
                       p2_prose(justification_ancree=j), groupe="balayage_conformite"))
    for champ in ("ce_qui_plafonne", "levier", "confiance"):
        p2 = p2_prose()
        p2[champ] = "   "
        out.append(cas(f"conformité {champ} vide",
                       {"unites": [{"u": 1}], "rapports": [], "apports": [],
                        "these_forme": "absente"}, p2, groupe="balayage_conformite"))
    # Le crible sans raison, et le crible d'un terme absent du relevé.
    for verdict, raison in (("organisateur", ""), ("vide", ""), ("vide", "r"),
                            ("decoratif", None)):
        out.append(cas(f"conformité crible {verdict} raison={raison!r}",
                       {"unites": [{"u": 1}],
                        "apports": [{"terme_cite": "économie"}], "rapports": [],
                        "these_forme": "absente"},
                       p2_prose(crible=[{"terme_cite": "économie", "verdict": verdict,
                                         "raison": raison}]),
                       groupe="balayage_conformite"))
    # Fidélités là où il n'y a pas de référence, et l'inverse.
    out.append(cas("conformité fidélité sans référence",
                   {"unites": [{"u": 1}], "rapports": [], "apports": [],
                    "these_forme": "absente"},
                   p2_prose(fidelite=[{"u": 1, "etat": "fidele"}]),
                   groupe="balayage_conformite"))
    out.append(cas("conformité référence sans fidélité",
                   {"unites": [{"u": 1}], "rapports": [], "apports": [],
                    "these_forme": "absente",
                    "alignement": [{"u": 1, "correspond_a": [1], "operation": "paraphrase"}],
                    "reference": REF_QUATRE},
                   p2_prose(), groupe="balayage_conformite"))
    return out


# ── Les crochets pré-phase, joués à part ───────────────────────────────────

def cas_pre_phases(m):
    """`pre_p1a` et `pre_p1b` — les slots, et le canal privé.

    ⭐ `_mots` emploie le `\\w` UNICODE de Python : « la 3ème partie » et « café3 »
    n'y contiennent pas les mots qu'un `\\w` de JavaScript y verrait, et le
    découpage des phrases emploie les BLANCS de Python.
    """
    P = {k: v["defaut"] for k, v in m.PARAMS.items()}
    entrees = [
        {"copie": "La mémoire conserve tout le passé. De plus, l'oubli trie.",
         "source": "On dit que la mémoire conserve tout le passé, mais l'oubli trie."},
        {"copie": "", "source": ""},
        {"copie": "Une seule phrase sans point final", "source": ""},
        {"copie": "A. B! C? D… E.", "source": "A. B! C? D… E."},
        {"copie": "la 3ème partie ; café3 ; l'élève ; aujourd'hui ; l’apostrophe",
         "source": "la 3ème partie ; café3 ; l'élève ; aujourd'hui ; l’apostrophe"},
        {"copie": "un\x85deux\x1ftrois", "source": "un deux trois"},
        {"copie": "﻿avec une BOM", "source": "avec une BOM"},
        {"copie": "mot " * 30, "source": "mot " * 60},
        {"copie": "Phrase une. Phrase deux.", "source": "Phrase une. Phrase deux."},
        {"copie": "sans source du tout"},
        {"copie": "Ⅷ et ² sont des nombres pour Python", "source": "Ⅷ et ²"},
    ]
    out = []
    for i, ctx in enumerate(entrees):
        for seuil in (3, 5, 8, 30, 0):
            params = dict(P, seuil_ngrammes_copie=seuil)
            rendu = m.pre_p1a(ctx, params)
            out.append({"nom": f"pre_p1a #{i} seuil={seuil}", "contexte": ctx,
                        "params": {"seuil_ngrammes_copie": seuil}, "rendu": rendu})
    return out


def cas_pre_p1b(m):
    """`pre_p1b` — ce que l'aligneur reçoit, et le slot servi à `None`."""
    P = {k: v["defaut"] for k, v in m.PARAMS.items()}
    entrees = [
        {"sorties": {"p1a": {"unites": [{"u": 1, "citation": "x"}]}},
         "_mesures": {"recouvrements": ["la mémoire conserve"]},
         "reference": REF_QUATRE},
        {"sorties": {"p1a": {"unites": []}}, "_mesures": {"recouvrements": []},
         "reference": REF_QUATRE},
        {"sorties": {}, "_mesures": {}},
        {"sorties": {"p1a": {}}, "_mesures": {"recouvrements": ["a b c", "d e f"]},
         "reference": None},
        {"reference": REF_QUATRE},
    ]
    return [{"nom": f"pre_p1b #{i}", "contexte": ctx, "rendu": m.pre_p1b(ctx, P)}
            for i, ctx in enumerate(entrees)]


def cas_borne_basse(m):
    """`_borne_basse` appelé DIRECTEMENT — la lecture, isolée de la cascade."""
    notes = [
        "entre fidele et contresens_partiel", "entre fidèle et contresens partiel",
        "Entre FIDÈLE et Contresens-Majeur",
        "entre contresens partiel et contresens majeur", "je ne sais pas",
        "unité 2 visée, statut concédé, écart léger", "l'élève est infidèle au texte",
        "infidele", "fidele fidele", "contresens_majeur seul",
        "\x85fidele\x1fcontresens majeur", "﻿fidele et contresens partiel",
        "FIDELE CONTRESENS MAJEUR", "", None,
    ]
    out = []
    for n in notes:
        alertes = []
        etat = m._borne_basse(n, alertes, 1)
        out.append({"note": n, "etat": etat, "alertes": alertes})
    return out


def cas_recouvrements(m):
    """`recouvrements` — le `\\w` de Python, et le seuil qui bouge."""
    paires = [
        ("la mémoire conserve tout le passé", "la mémoire conserve tout le passé", 3),
        ("la mémoire conserve tout le passé", "la mémoire conserve tout le passé", 8),
        ("LA MÉMOIRE CONSERVE", "la mémoire conserve", 3),
        ("l'élève écrit aujourd'hui", "l'élève écrit aujourd'hui", 2),
        ("l’élève écrit", "l'élève écrit", 2),
        ("la 3ème partie du texte", "la 3ème partie du texte", 3),
        ("", "abc", 3), ("abc", "", 3), ("a b", "a b", 0), ("a b", "a b", 5),
        ("un\x85deux\x85trois", "un deux trois", 3),
        ("mot " * 12, "mot " * 12, 4),
    ]
    return [{"production": p, "source": s, "n": n, "rendu": m.recouvrements(p, s, n)}
            for p, s, n in paires]


# ── Le programme ───────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--racine", default=RACINE_DEFAUT)
    args = ap.parse_args()

    m, chemin = charge(args.racine)

    echecs, annonces = m.autotest()
    if echecs:
        print("AUTOTEST DU MODULE EN ÉCHEC — un portage vérifié contre un module "
              "en échec ne prouve rien :", file=sys.stderr)
        for e in echecs:
            print("  ✗ " + e, file=sys.stderr)
        sys.exit(1)

    tous = (vecteurs_embarques(m) + balayage_cours() + balayage_texte()
            + balayage_seuils() + balayage_frontieres() + balayage_crible()
            + balayage_borne_basse() + balayage_cardinalites() + balayage_statuts()
            + balayage_rapports() + balayage_formes() + balayage_flottants()
            + balayage_langage() + balayage_document() + balayage_conformite())

    joues = []
    for c in tous:
        try:
            joues.append(joue(m, c))
        except Exception as exc:               # noqa: BLE001
            # ⛔ Le contrat §3 : « le module ne lève JAMAIS d'exception ». Quand il
            #    le fait quand même, on le CONSIGNE — le test TypeScript assère
            #    alors que le portage, lui, rend une alerte nommée.
            joues.append({"nom": c["nom"], "groupe": c["groupe"], "p1": c["p1"],
                          "p2": c["p2"], "contexte": c["contexte"], "params": c["params"],
                          "leve": f"{type(exc).__name__}: {exc}"})

    sortie = {
        "meta": {
            "module": str(chemin),
            "competence": getattr(m, "COMPETENCE", None),
            "version": getattr(m, "VERSION", None),
            "version_golds_testee": getattr(m, "VERSION_GOLDS_TESTEE", None),
            "observables": list(getattr(m, "OBSERVABLES", [])),
            "params": {k: v["defaut"] for k, v in m.PARAMS.items()},
            "bornes": {k: v["bornes"] for k, v in m.PARAMS.items()},
            # ⚠️ Le TYPE, pas seulement le compte : chez l'Expression,
            #    `TESTS_CODE1_PARFAIT` est une CHAÎNE et `len()` y a rendu 52.
            "types_constantes": {
                nom: type(getattr(m, nom, None)).__name__
                for nom in ("TESTS_CODE1_PARFAIT", "TESTS_P2_PARFAIT", "CATALOGUE",
                            "PARAMS", "OBSERVABLES")
            },
            "n_tests_code1": len(m.TESTS_CODE1_PARFAIT),
            "n_tests_p2": len(getattr(m, "TESTS_P2_PARFAIT", []) or []),
            "n_cas_code2": len(m._cas_code2()),
            "annonces_autotest": annonces,
            "catalogue": m.CATALOGUE,
            "regle_agregation": m.REGLE_AGREGATION_CITEE,
            "crochets": sorted(n for n in ("prepare_copie", "pre_p1", "pre_p1a", "pre_p1b",
                                           "pre_p2", "code1", "code2", "conformite")
                               if callable(getattr(m, n, None))),
        },
        "cas": joues,
        "pre_p1a": cas_pre_phases(m),
        "pre_p1b": cas_pre_p1b(m),
        "borne_basse": cas_borne_basse(m),
        "recouvrements": cas_recouvrements(m),
    }
    json.dump(sortie, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
