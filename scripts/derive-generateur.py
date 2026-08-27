# -*- coding: utf-8 -*-
"""derive-generateur.py — les TROIS PROMPTS du générateur, dérivés de leur source.

    « Les prompts vivent ICI, entre leurs marqueurs ; les fichiers de
      `copies-tests/generateur/prompts/` en sont DÉRIVÉS […] et ne s'éditent
      jamais à la main — LE GEL PORTE DONC SUR LES PROMPTS EUX-MÊMES. »
                          — `05-GENERATEUR_Reference_Decomposee.md`, en-tête

La plateforme n'en avait AUCUNE copie, et elle en a besoin : C5-L1 engendre la
référence décomposée en ligne. Ce qu'il lui fallait est donc une DÉRIVATION,
avec son `--verifie` qui sait dire DIVERGE — jamais un `const PROMPT_G1 = \\`…\\``
tapé dans un fichier (PROMPT_Code_C5_L1.md, piège 12).

DEUX DÉRIVÉS, UNE SEULE SOURCE, ET CE N'EST PAS UN SECOND DOMICILE.
`copies-tests/_commun/derive-prompts.py` verse les trois prompts en `.txt` pour
le BANC, dans le dépôt de conception ; ce script-ci les verse en module TypeScript
pour la PLATEFORME. Les deux lisent le MÊME bloc de la MÊME source, et chacun a
son `--verifie`. Le domicile du texte reste le `05-` §3, seul.

CITE OU REFUSE — le même régime que `derive-instruments.py`. Un marqueur absent,
un bloc sans clôture, un statut sous le seuil : le script S'ARRÊTE au lieu de
deviner. Une source qui bouge fait tomber le contrôle, jamais mentir le dérivé.

LE SEUIL EST *RELU ET VALIDÉ*, et il vient du manifeste de C5-L1 (`07-` §2) :
« `05-GENERATEUR_Reference_Decomposee.md` — relu et validé ». « VALIDÉ ET GELÉ »
vaut *relu et validé* (`07-` §2) ; la lecture du statut est celle de
`derive-instruments.py`, à l'identique — le premier segment EN GRAS de la ligne.

⛔ CE SCRIPT NE PORTE PAS LE FORMAT DE LA RÉFÉRENCE. Le format fait foi au
`02-exercices.md` §6 A, et son contrôle machine à `verifie-reference.py`, porté
en plateforme à `utils/fabrique/verifie-reference.ts`. Ici : le TEXTE des trois
prompts, et rien d'autre.

USAGE
    python3 scripts/derive-generateur.py --resume    # ce qui a été lu, sans écrire
    python3 scripts/derive-generateur.py --ecris     # écrit le dérivé
    python3 scripts/derive-generateur.py --verifie   # n'écrit rien, dit IDENTIQUE/DIVERGE

    --racine  le dépôt de conception (défaut : $PALIMPSESTE_RACINE_CONCEPTION)
    --sortie  où écrire (défaut : utils/generateur/derive du dépôt de code)

CODES DE SORTIE : 0 = lu (et, en --verifie, identique) · 1 = source mouvante,
absente, statut insuffisant, ou dérivé divergent · 2 = erreur d'usage.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import re
import sys

# ⚠️ Même convention que `derive-instruments.py` : la racine du dépôt de
# conception est déclarée par `PALIMPSESTE_RACINE_CONCEPTION`, et le chemin du
# professeur tient lieu de défaut. Les deux bouts — ce script et le test qui
# l'appelle — lisent la MÊME racine, jamais deux.
RACINE_CONCEPTION = (os.environ.get("PALIMPSESTE_RACINE_CONCEPTION")
                     or "/Users/louissagnieres/Documents/GitTest/palimpseste-conception")
RACINE_CODE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE_CODE, "utils", "generateur", "derive")
OUTIL = "scripts/derive-generateur.py 1.0"

SOURCE = "05-GENERATEUR_Reference_Decomposee.md"

# `05-` §2 — trois passages, DANS CET ORDRE, et l'ordre est le remède.
PASSAGES = ("G1", "G2", "G3")

# `07-` §2 — les trois degrés cumulatifs. Le manifeste de C5-L1 exige le second.
DEPOSE, RELU, BANCE = 1, 2, 3
SEUIL = RELU


class SourceMouvante(Exception):
    """Une source a bougé, ou n'est pas là : on s'arrête, on ne devine pas."""


# ---------------------------------------------------------------------------
# L'en-tête — version et statut, lus comme `derive-instruments.py` les lit
# ---------------------------------------------------------------------------

def _sans_accents(s):
    remplace = {"é": "e", "è": "e", "ê": "e", "ë": "e", "à": "a", "â": "a",
                "î": "i", "ï": "i", "ô": "o", "ö": "o", "û": "u", "ù": "u",
                "ü": "u", "ç": "c", "É": "e", "È": "e"}
    return "".join(remplace.get(c, c) for c in s)


def degre_du_statut(statut):
    """Le degré d'un statut d'en-tête. 0 = inconnu, on ne présume rien.

    ⚠️ LA NÉGATION SE LIT EN PREMIER — « pas encore versée et bancée » contient
    « versée et bancée ». La règle est celle de `derive-instruments.py`.
    """
    s = _sans_accents((statut or "").lower())
    if re.search(r"\b(pas|non|jamais|sans|avant|attente|encore)\b", s):
        return 0
    if re.search(r"vers\w* et banc\w*", s):
        return BANCE
    if re.search(r"relu\w* et valid\w*", s) or re.search(r"valid\w* et gel\w*", s):
        return RELU
    if re.search(r"depos\w*", s):
        return DEPOSE
    return 0


def entete(texte, chemin):
    """(version, statut) lus À L'EN-TÊTE. Le statut est le premier gras de sa ligne."""
    mv = re.search(r"^\s*\*\*VERSION\s+([0-9]+(?:\.[0-9]+)*)\.?\*\*", texte, re.M)
    if not mv:
        raise SourceMouvante("%s : pas de ligne VERSION en tête." % chemin)
    ms = re.search(r"^\s*\*\*Statut\*\*\s*:\s*(.+)$", texte, re.M)
    if not ms:
        raise SourceMouvante("%s : pas de ligne Statut en tête (`07-` §2)." % chemin)
    gras = re.search(r"\*\*(.+?)\*\*", ms.group(1))
    if not gras:
        raise SourceMouvante(
            "%s : la ligne Statut ne porte pas son statut EN GRAS — on ne le devine pas."
            % chemin)
    statut = re.sub(r"\s+", " ", gras.group(1).replace("*", "").replace("`", "")).strip()
    return mv.group(1), statut


# ---------------------------------------------------------------------------
# Les blocs — marqueurs, clôtures, empreintes
# ---------------------------------------------------------------------------

def lire(chemin):
    if not os.path.exists(chemin):
        raise SourceMouvante("%s : introuvable." % chemin)
    return io.open(chemin, encoding="utf-8").read()


def empreinte(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def entre_marqueurs(texte, debut, fin, chemin):
    if texte.count(debut) == 0 or texte.count(fin) == 0:
        raise SourceMouvante("%s : marqueurs %s / %s absents." % (chemin, debut, fin))
    if texte.count(debut) > 1 or texte.count(fin) > 1:
        raise SourceMouvante(
            "%s : marqueurs %s dépareillés ou multiples — on n'en choisit pas un en silence."
            % (chemin, debut))
    i = texte.index(debut) + len(debut)
    j = texte.index(fin, i)
    if j < i:
        raise SourceMouvante("%s : %s vient AVANT %s." % (chemin, fin, debut))
    return texte[i:j]


def bloc_clos(brut, chemin):
    """Le contenu d'UN bloc ``` … ``` — refusé s'il n'est pas clos, ou s'il y en
    a deux. On compte les clôtures D'ABORD : sans ce compte, un second bloc était
    ignoré SANS UN MOT (patron de `derive-instruments.py`)."""
    fences = brut.count("```")
    if fences == 0:
        raise SourceMouvante("%s : aucun bloc ``` entre les marqueurs." % chemin)
    if fences % 2:
        raise SourceMouvante("%s : bloc sans clôture ```." % chemin)
    if fences > 2:
        raise SourceMouvante(
            "%s : %d blocs entre les marqueurs — on n'en choisit pas un en silence."
            % (chemin, fences // 2))
    m = re.search(r"```[a-z]*[ \t]*\n(.*?)\n```", brut, re.S)
    if not m:
        raise SourceMouvante("%s : bloc sans clôture ```." % chemin)
    return m.group(1)


# ---------------------------------------------------------------------------
# La lecture de la source
# ---------------------------------------------------------------------------

def assemble(racine):
    chemin = os.path.join(racine, SOURCE)
    texte = lire(chemin)
    version, statut = entete(texte, SOURCE)
    degre = degre_du_statut(statut)
    if degre < SEUIL:
        # ⛔ « Un fichier au statut insuffisant BLOQUE le lot, explicitement »
        #    (`07-` §2). Le contrôle s'arrête ; il ne dérive pas un texte que
        #    personne n'a arrêté.
        raise SourceMouvante(
            "%s : statut « %s » — le manifeste de C5-L1 exige *relu et validé* "
            "(`07-` §2). Rien n'est dérivé." % (SOURCE, statut))

    prompts = {}
    for p in PASSAGES:
        brut = entre_marqueurs(texte, "<!-- DEBUT-PROMPT-%s -->" % p,
                               "<!-- FIN-PROMPT-%s -->" % p, SOURCE)
        # ⚠️ LE « \n » FINAL EST CELUI DE `derive-prompts.py`, ET IL EN VIENT :
        #    ce script-ci et celui du banc doivent rendre le MÊME octet, sans
        #    quoi « octet pour octet » ne veut plus rien dire d'un dérivé à
        #    l'autre. Cf. `copies-tests/_commun/derive-prompts.py`, `extrait()`.
        prompts[p] = bloc_clos(brut, "%s (%s)" % (SOURCE, p)) + "\n"

    return {
        "outil": OUTIL,
        "source": SOURCE,
        "version": version,
        "statut": statut,
        "empreinte_source": empreinte(texte),
        "passages": list(PASSAGES),
        "prompts": {p: prompts[p] for p in PASSAGES},
    }


# ---------------------------------------------------------------------------
# L'écriture du dérivé — un module TypeScript, jamais édité à la main
# ---------------------------------------------------------------------------

BANDEAU = (
    "// ⚠️ FICHIER DÉRIVÉ — NE S'ÉDITE JAMAIS À LA MAIN.\n"
    "// Sortie de `python3 scripts/derive-generateur.py --ecris`.\n"
    "// La source fait foi — `05-GENERATEUR_Reference_Decomposee.md` §3, entre ses\n"
    "// marqueurs — et `--verifie` dit si ce fichier en a divergé (piège 12).\n")


def module_ts(nom_export, valeur):
    return "%s\nexport const %s = %s as const\n" % (
        BANDEAU, nom_export, json.dumps(valeur, ensure_ascii=False, indent=2, sort_keys=True))


def fichiers_attendus(paquet):
    """chemin relatif → contenu, pour les deux sens (écriture et contrôle).

    ⚠️ AUCUN CHEMIN ABSOLU dans la donnée dérivée : `derive-instruments.py` l'a
    payé une fois — le contrôle disait DIVERGE sur toute machine autre que celle
    du professeur, et `npm test` ne pouvait passer nulle part ailleurs. Ici la
    racine n'entre NI dans la donnée, NI au bandeau : le paquet ne porte que la
    source, sa version, son statut et son empreinte.
    """
    return {"prompts.ts": module_ts("PROMPTS_GENERATEUR", paquet)}


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def resume(paquet):
    print("✓ %s %s (%s) — empreinte %s…"
          % (paquet["source"], paquet["version"], paquet["statut"],
             paquet["empreinte_source"][:12]))
    for p in paquet["passages"]:
        t = paquet["prompts"][p]
        print("  · %s : %d caractères, %d lignes" % (p, len(t), t.count("\n")))


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0],
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--racine", default=RACINE_CONCEPTION,
                   help="le dépôt de conception (défaut : %(default)s)")
    p.add_argument("--sortie", default=None,
                   help="où écrire le dérivé (défaut : utils/generateur/derive)")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--resume", action="store_true", help="ce qui a été lu, sans rien écrire")
    g.add_argument("--ecris", action="store_true", help="écrit le dérivé")
    g.add_argument("--verifie", action="store_true", help="n'écrit rien ; dit IDENTIQUE ou DIVERGE")
    a = p.parse_args(argv)

    if not os.path.isdir(a.racine):
        print("✗ racine introuvable : %s" % a.racine, file=sys.stderr)
        return 2

    global SORTIE
    if a.sortie:
        SORTIE = os.path.abspath(a.sortie)
    elif a.ecris and os.path.abspath(a.racine) != os.path.abspath(RACINE_CONCEPTION):
        # ⚠️ `SORTIE` se calcule depuis l'emplacement DU SCRIPT, jamais depuis
        #    `--racine` : une seule commande d'essai réécrirait le dérivé DE
        #    PRODUCTION. On refuse plutôt que d'écrire au mauvais endroit
        #    (le défaut a déjà été payé à `derive-instruments.py`).
        print("✗ `--ecris` sur une racine d'essai (%s) écrirait dans le dérivé de PRODUCTION.\n"
              "  Donne `--sortie <dossier>` si c'est ce que tu veux." % a.racine, file=sys.stderr)
        return 2

    try:
        paquet = assemble(a.racine)
    except SourceMouvante as e:
        print("✗ SOURCE MOUVANTE — %s" % e, file=sys.stderr)
        return 1

    attendus = fichiers_attendus(paquet)

    if a.resume:
        resume(paquet)
        return 0

    if a.ecris:
        os.makedirs(SORTIE, exist_ok=True)
        for rel, contenu in sorted(attendus.items()):
            chemin = os.path.join(SORTIE, rel)
            io.open(chemin, "w", encoding="utf-8").write(contenu)
            print("  → utils/generateur/derive/%s (%d octets)"
                  % (rel, len(contenu.encode("utf-8"))))
        resume(paquet)
        return 0

    # --verifie : LES DEUX SENS, comme `derive-doctrine.py --verifie`.
    ecarts = []
    for rel, contenu in sorted(attendus.items()):
        chemin = os.path.join(SORTIE, rel)
        if not os.path.exists(chemin):
            ecarts.append("MANQUANT : %s" % rel)
        elif io.open(chemin, encoding="utf-8").read() != contenu:
            ecarts.append("DIVERGE : %s" % rel)
    # Le second sens : un dérivé que plus rien ne justifie reste importable, et
    # le contrôle jurerait que tout va bien.
    if os.path.isdir(SORTIE):
        for existant in sorted(os.listdir(SORTIE)):
            if existant.endswith(".ts") and existant not in attendus:
                ecarts.append("EN TROP : %s — rien ne le justifie" % existant)
    resume(paquet)
    if ecarts:
        print("\nGÉNÉRATEUR : DIVERGE")
        for e in ecarts:
            print("  · %s" % e)
        print("  → rejouer `python3 scripts/derive-generateur.py --ecris`")
        return 1
    print("\nGÉNÉRATEUR : IDENTIQUE (%d fichier(s) dérivé(s))" % len(attendus))
    return 0


if __name__ == "__main__":
    sys.exit(main())
