#!/usr/bin/env python3
"""Extraction du DOCX fourni par Louis ; aucune écriture en base."""
import argparse
import hashlib
import json
import re
import statistics
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

p = argparse.ArgumentParser()
p.add_argument('document', type=Path)
a = p.parse_args()
empreinte = hashlib.sha256(a.document.read_bytes()).hexdigest()
if empreinte != '8c5f70408b665d21a30db05bb2362a2a03f685d4bb2405fc3fbe1f56d72ab9da':
    raise SystemExit('Document différent de la source relue : reprendre la vérification.')
with ZipFile(a.document) as z:
    racine = ET.fromstring(z.read('word/document.xml'))
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
hors = {'G1SHLEH03009', 'G1SHLEH03014', 'G1SHLEH03016', 'G1SHLEH03695', 'G1SHLEH03696'}
sujets, provenance = [], []
identifiant, reference = '', ''
for para in racine.findall('.//w:body/w:p', ns):
    texte = ''.join(t.text or '' for t in para.findall('.//w:t', ns))
    m = re.match(r'^(G1SHLEH\d+) — (.+)$', texte)
    if m:
        identifiant, reference = m.groups()
    prefixe = 'Question de réflexion philosophique : '
    if not texte.startswith(prefixe):
        continue
    brut = texte[len(prefixe):]
    # Les trois résidus repérés sont APRÈS la question ; aucun mot de celle-ci ne change.
    question, sep, residu = brut.partition('?')
    assert sep and identifiant
    enonce = question.rstrip() + ' ?'
    retenu = identifiant not in hors
    provenance.append({'id_national': identifiant, 'reference': reference, 'enonce_source': brut,
                       'enonce': enonce, 'residu_retire': residu.strip(), 'retenu_pilote': retenu,
                       'theme_attribue': 'Les pouvoirs de la parole' if retenu else 'Les représentations du monde'})
    if retenu:
        sujets.append({'id': '1hlp-national-' + identifiant, 'enonce': enonce, 'forme': 'essai_hlp',
                       'notions': ['Les pouvoirs de la parole'], 'texte': None, 'cours': 'notions'})
assert len(provenance) == 25 and len(sujets) == 20
assert len({s['enonce'] for s in sujets}) == len(sujets)
sortie = Path(__file__).resolve().parent / 'recette' / 'pilote-argument'
sortie.mkdir(exist_ok=True)
for nom, contenu in {
    'sujets-1hlp.json': {'format': 'palimpseste/import-exercices', 'version': '1.5',
                       'genere_le': '2026-09-10', 'genere_par': 'Extraction du document fourni par Louis', 'sujets': sujets},
    'provenance-1hlp.json': {'document': a.document.name, 'sha256': empreinte,
                           'source': 'https://pedagogie.ac-toulouse.fr/philosophie/sujets-hlp-premiere',
                           'classement': 'Rattachement thématique effectué pour le pilote ; le DOCX ne porte pas de rubriques par thème.',
                           'sujets': provenance},
}.items():
    (sortie / nom).write_text(json.dumps(contenu, ensure_ascii=False, indent=2) + '\n')
longueurs = [len(s['enonce']) for s in sujets]
print(json.dumps({'document': len(provenance), 'retenus': len(sujets), 'hors_pilote': len(hors),
                  'longueurs': {'min': min(longueurs), 'mediane': statistics.median(longueurs), 'max': max(longueurs)},
                  'residus': [s['id_national'] for s in provenance if s['residu_retire']]}, ensure_ascii=False))
