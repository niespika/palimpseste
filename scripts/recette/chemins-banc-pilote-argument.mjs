// Chaque campagne impose ses trois chemins ; le banc historique est en lecture seule.
import { resolve, relative, isAbsolute } from 'node:path'
import assert from 'node:assert/strict'

export function cheminsCampagne(args = process.argv.slice(2)) {
  const option = nom => {
    const valeurs = args.filter(a => a.startsWith(`--${nom}=`))
    assert.equal(valeurs.length, 1, `Fournir une seule option --${nom}=chemin`)
    const valeur = valeurs[0].slice(nom.length + 3)
    assert.ok(valeur.trim(), `Chemin ${nom} vide`)
    return resolve(valeur)
  }
  const racine = option('campagne'), prive = option('prive'), registre = option('registre')
  const historique = resolve('scripts/recette/pilote-argument/banc')
  assert.notEqual(racine, historique, 'Le banc initial est figé')
  const dans = (parent, enfant) => {
    const r = relative(parent, enfant)
    return r !== '' && r !== '..' && !r.startsWith('../') && !isAbsolute(r)
  }
  assert.ok(dans(resolve('scripts/recette/pilote-argument/campagnes'), racine), 'Résultats sous pilote-argument/campagnes/<nom>')
  assert.ok(dans('/tmp', prive) || dans('/private/tmp', prive), 'Requêtes privées sous /tmp')
  assert.ok(dans('/tmp', registre) || dans('/private/tmp', registre), 'Registre privé sous /tmp')
  assert.notEqual(prive, resolve('/tmp/pilote-argument-banc'), 'Registre initial figé')
  assert.notEqual(registre, resolve('/tmp/pilote-argument-banc-decor.json'), 'Décor initial figé')
  assert.notEqual(prive, registre)
  return { racine, prive, registre }
}
