"""Dérive le seul pilote accepté, sans modifier le dépôt de conception."""
import argparse
import hashlib
import json
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('--conception', type=Path, default=Path('/Users/louissagnieres/Documents/GitTest/palimpseste-conception'))
p.add_argument('--verifie', action='store_true')
a = p.parse_args()
source = a.conception / 'production-crans-6-8/banque-questions-production.json'
b = json.loads(source.read_text())
cles = ['fiches', 'questions_communes', 'relecture_reponses', 'relecture_invitation',
        'preuve_facultative', 'cran8_questions_avant_v1', 'contrat_argument', 'contrat_editorial']
empreinte = hashlib.sha256(json.dumps({k:b[k] for k in cles}, ensure_ascii=False,
                                    sort_keys=True, separators=(',', ':')).encode()).hexdigest()
assert empreinte == b['empreinte_pedagogique'], 'Empreinte pédagogique invalide'
for nom, attendu in b['sources_sha256'].items():
    assert hashlib.sha256((a.conception / nom).read_bytes()).hexdigest() == attendu, f'Source modifiée : {nom}'
fiche = next(f for f in b['fiches'] if f['id'] == 'argument')
livraison = {k:b[k] for k in ['version', 'empreinte_pedagogique', 'sources_sha256',
                             'contrat_argument', 'relecture_reponses', 'relecture_invitation']}
livraison.update(prescriptions=fiche['prescriptions_pilote'], questions=fiche['questions']+b['questions_communes'])
sortie = Path(__file__).resolve().parents[1] / 'utils/pilote-argument/banque.json'
texte = json.dumps(livraison, ensure_ascii=False, indent=2)+'\n'
if a.verifie:
    assert sortie.read_text() == texte, 'Livraison applicative à redériver'
else:
    sortie.parent.mkdir(parents=True, exist_ok=True)
    sortie.write_text(texte)
print(f'Pilote argument {b["version"]} : {empreinte}, {len(livraison["prescriptions"])} configurations ; sources vérifiées')
