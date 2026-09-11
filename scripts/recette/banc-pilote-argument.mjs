// Banc diagnostique synthétique. Sandbox uniquement, décor retiré séparément.
// node --env-file=.env.local --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//   --import ./scripts/register-calibration-resolver.mjs scripts/recette/banc-pilote-argument.mjs --campagne=chemin --prive=/tmp/chemin --registre=/tmp/registre.json [--executer]
// Sans --executer : résolution des sujets, gel des références et contrôles déterministes ; aucun appel IA.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { AsyncLocalStorage } from 'node:async_hooks'
import { join } from 'node:path'
import { cheminsCampagne } from './chemins-banc-pilote-argument.mjs'
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { creerContrat, attentesPour, observablesPour } from '../../utils/pilote-argument/contrat.ts'
import { sujetsAdmissibles } from '../../utils/pilote-argument/serveur.ts'
import { comparerConstats, verifierPreuves } from '../../utils/pilote-argument/jugement.ts'
import { traiterDepot } from '../../utils/chaine/chaine.ts'

const { racine, prive, registre } = cheminsCampagne()
const sha = v => createHash('sha256').update(v).digest('hex')
const texteCas = readFileSync(join(racine, 'cas.json'), 'utf8')
const banque = JSON.parse(texteCas)
const cas = banque.cas.filter(c => c.lot === 'diagnostic')
const r = JSON.parse(readFileSync(registre, 'utf8'))
assert.ok(!r.termine, 'Décor actif requis')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
assert.equal(new URL(url).hostname, 'aoakpxxlyvthzueaywna.supabase.co', 'Sandbox uniquement')
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
mkdirSync(prive, { recursive: true, mode: 0o700 })
mkdirSync(join(racine, 'resultats'), { recursive: true })
const json = x => JSON.stringify(x, null, 2) + '\n'
// Les UUID et adresses du décor ne sont jamais nécessaires aux artefacts partageables.
const neutraliser = x => JSON.parse(json(x).replace(/[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}/gi, '[identifiant-retire]').replace(/recette-argument-[^\s"\\]+@example\.test/g, '[compte-synthetique]'))
const sauverPublic = (f, x) => writeFileSync(join(racine, f), json(neutraliser(x)))
const normaliser = s => s.normalize('NFC').replace(/[’‘]/g, "'")
const fichiersCode = [...new Set([...execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(f => /^(utils|app|components|scripts)\//.test(f) && /\.(ts|tsx|mjs|json|py)$/.test(f)), 'scripts/recette/chemins-banc-pilote-argument.mjs', 'package.json', 'package-lock.json'])].sort()
const empreintesCode = () => Object.fromEntries(fichiersCode.map(f => [f, sha(readFileSync(f))]))
const codeDebut = empreintesCode()
const criteresDebut = Object.fromEntries(['cas.json', 'protocole-avant-appels.json', 'attentes-exploratoires.json', 'retour-professeur-conserve.json'].filter(f => existsSync(join(racine, f))).map(f => [f, sha(readFileSync(join(racine, f)))]))
const contrats = new Map()
for (const parcours of ['TC', '1HLP', 'THLP']) {
  const origine = r.depots.find(d => d.parcours === parcours && d.cran === 6)
  const { data: d, error: e1 } = await db.from('exercices_depots').select('exercice_id').eq('id', origine.id).single()
  if (e1) throw e1
  const { data: s, error: e2 } = await db.from('exercices_pilote_argument').select('contrat').eq('exercice_id', d.exercice_id).single()
  if (e2) throw e2
  const offre = await sujetsAdmissibles(db, s.contrat.classe_id)
  for (const c of cas.filter(c => c.parcours === parcours)) {
    const candidats = offre.sujets.filter(x => normaliser(x.sujet.enonce) === normaliser(c.sujet))
    assert.equal(candidats.length, 1, 'Sujet admissible unique pour ' + c.id)
    const choix = candidats[0]
    const contrat = creerContrat({ cran: c.cran, parcours, principale: c.principale, secondaire: c.secondaire,
      classe_id: s.contrat.classe_id, sujet: { id: choix.sujet.id, enonce: choix.sujet.enonce, notions: choix.sujet.notions },
      contexte_fourni: c.contexte, admissibilite: choix.admissibilite })
    for (const phase of ['v1','vf']) {
      assert.ok(c[phase].trim())
      const attendues = attentesPour(contrat, phase).map(a => a.id)
      for (const ref of c.attentes.filter(a => a[phase])) assert.ok(attendues.includes(ref.id), c.id + ' ' + phase + ' ' + ref.id)
    }
    contrats.set(c.id, contrat)
  }
}

// Contrôle de l'assemblage avec un jugement oracle ; pas un étalonnage des scores natifs.
const controles = cas.map(c => {
  const contrat = contrats.get(c.id)
  const oracle = phase => Object.fromEntries(attentesPour(contrat, phase).map(a => [a.id, {
    etat: c.attentes.find(x => x.id === a.id)?.[phase]?.[0] ?? 'indeterminable', passages: [], motif: 'Oracle de contrôle', revision: null,
  }]))
  const comparaison = comparerConstats(contrat, oracle('v1'), oracle('vf'))
  const corriges = comparaison.principale.filter(x => x.changement === 'corrige').map(x => x.attente)
  const objetCorrige = comparaison.objet.filter(x => x.changement === 'corrige').map(x => x.attente)
  assert.equal(comparaison.delta_progression, null)
  assert.equal(comparaison.reussite_autonome, false)
  // Les scénarios de comparaison sont testés unitairement ; aucun nom de copie
  // ne doit imposer un jugement pédagogique lors du gel d'une nouvelle campagne.
  if (c.v1 === c.vf) assert.equal(corriges.length, 0)
  return { cas: c.id, principale_corrigee: corriges, objet_corrige: objetCorrige, reussite_autonome: false, delta: null }
})

for (const [id, contrat] of contrats) {
  const fichier = join(prive, id + '-contrat.json')
  if (existsSync(fichier)) {
    const gele = JSON.parse(readFileSync(fichier, 'utf8'))
    // La nouvelle lecture confirme l'admissibilité ; son heure ne redéfinit
    // pas le contrat déjà figé pour cette campagne.
    const verification = structuredClone(contrat)
    verification.admissibilite.verifie_le = gele.admissibilite.verifie_le
    assert.deepEqual(gele, verification, 'Contrat gelé différent')
    contrats.set(id, gele)
  } else writeFileSync(fichier, json(contrat), { mode: 0o600, flag: 'wx' })
}
const manifestPath = join(racine, 'manifeste.json')
const empreinteCas = sha(texteCas)
if (existsSync(manifestPath)) {
  const gele = JSON.parse(readFileSync(manifestPath, 'utf8'))
  assert.equal(gele.references_sha256, empreinteCas, 'Références gelées modifiées')
  assert.deepEqual(gele.code_sha256, codeDebut, 'Code modifié depuis le gel')
  assert.deepEqual(gele.criteres_sha256, criteresDebut, 'Critères modifiés depuis le gel')
} else {
  mkdirSync(join(racine, 'code-gele'), { recursive: true })
  for (const f of fichiersCode) {
    const cible = join(racine, 'code-gele', f + '.txt')
    mkdirSync(cible.slice(0, cible.lastIndexOf('/')), { recursive: true })
    writeFileSync(cible, readFileSync(f), { flag: 'wx' })
  }
}
if (!existsSync(manifestPath))
sauverPublic('manifeste.json', {
  version: banque.version, commit_local: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), gele_le: new Date().toISOString(), references_sha256: empreinteCas,
  statut_references: banque.statut, copies_reelles: false, modele_demande: 'gpt-5.6-luna',
  temperature_envoyee: null, temperature_note: "Champ omis par l'adaptateur applicatif ; valeur effective du fournisseur inconnue.",
  repetitions_par_couple: banque.repetitions, copies_diagnostic: cas.map(c => c.id), reserve_non_executee: banque.cas.filter(c => c.lot === 'reserve').map(c => c.id),
  protocole: { chaine: 'traiterDepot V1 puis VF, dépôt neuf par répétition', concurrence: 3, relances: 'Politique applicative inchangée ; échecs conservés, aucun remplacement.',
    decisions: 'Ne pas modifier les prompts ou les critères pendant la campagne. Les autres attentes sont exploratoires, sans vérité de référence inventée.',
    comparaisons: 'Accord conditionnel aux attentes proposées ; variabilité des états pour chaque couple copie/attente/version ; faux changements sur textes identiques.',
    limites: 'Pas de golds validés ni de plafond intracorrecteur humain ; pas de seuil permettant de déclarer une calibration réussie.' },
  code_sha256: codeDebut, criteres_sha256: criteresDebut, contrats_sha256: Object.fromEntries([...contrats].map(([id, c]) => [id, sha(JSON.stringify(neutraliser(c)))])), sujets_servis: cas.map(c => ({ cas: c.id, enonce: contrats.get(c.id).sujet.enonce })), controles_oracle: controles,
})
const md = ['# Banc diagnostique du pilote argument', '', banque.statut + '. ' + banque.provenance, '',
  `${cas.length} couples V1/VF sont soumis ${banque.repetitions} fois à la chaîne complète, avec un dépôt neuf à chaque fois. Trois couples historiques restent en réserve. Les attentes sont des hypothèses diagnostiques issues des clarifications acceptées, jamais des cases humaines complétées. Les autres attentes sont exploratoires.`, '',
  ...cas.flatMap(c => [`## ${c.id} — ${c.parcours}, cran ${c.cran}${c.lot === 'reserve' ? ' — réserve' : ''}`, '', `${c.principale} principale${c.secondaire ? ', ' + c.secondaire + ' secondaire' : ', seule'}.`, '', `**Sujet :** ${contrats.get(c.id).sujet.enonce}`, '', `**Contexte fourni :** ${c.contexte}`, '', `**V1 :** ${c.v1}`, '', `**VF :** ${c.vf}`, '', c.enjeu, '', '| Attente | V1 | VF | Motif proposé |','|---|---|---|---|',...c.attentes.map(a => `| ${a.id} | ${(a.v1 ?? []).join(' / ') || 'hors mesure'} | ${(a.vf ?? []).join(' / ') || 'hors mesure'} | ${a.raison}${a.incertitude ? ' **Incertitude déclarée.**' : ''} |`), '']),
  '## Limites', '', 'Les attentes ci-dessus ne sont pas des golds humains. Cette campagne mesure la variabilité et examine des désaccords. Elle ne permet ni un taux de justesse certifié ni une ouverture du pilote. Les contrôles oracle portent sur la comparaison déterministe des constats, pas sur un étalonnage des scores natifs.', '']
if (!existsSync(join(racine, 'REFERENCES.md'))) writeFileSync(join(racine, 'REFERENCES.md'), md.join('\n'), { flag: 'wx' })
console.log(`Préparation vérifiée : ${cas.length} cas admissibles, références gelées, ${controles.length} contrôles oracle réussis.`)
if (!process.argv.includes('--executer')) process.exit(0)
assert.deepEqual(JSON.parse(readFileSync(manifestPath, 'utf8')).code_sha256, codeDebut, 'Code inchangé depuis le gel')
writeFileSync(join(racine, 'EXECUTION_COMMENCEE.json'), json({ debut: new Date().toISOString(), cas: cas.map(c => c.id), repetitions: banque.repetitions }), { flag: 'wx' })
assert.equal(readdirSync(join(racine, 'resultats')).length, 0, 'Résultats existants : aucun remplacement silencieux')
assert.equal(readdirSync(prive).filter(f => /-appel-|depot\.json$/.test(f)).length, 0, 'Registre privé déjà utilisé')

// Capture passive des requêtes IA, sans changer le payload et sans stocker les en-têtes.
// Les messages exacts restent dans /tmp ; leurs empreintes et paramètres sont partageables.
const contexte = new AsyncLocalStorage()
const fetchOriginal = globalThis.fetch
globalThis.fetch = async function(input, init) {
  const ctx = contexte.getStore()
  const cible = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (!ctx || cible !== 'https://api.openai.com/v1/chat/completions') return fetchOriginal(input, init)
  const body = JSON.parse(init.body)
  const systeme = body.messages.filter(m => m.role === 'system').map(m => m.content).join('\n')
  const appel = { numero: ctx.appels.length + 1, version: ctx.phase, debut: new Date().toISOString(), requete_sha256: sha(init.body),
    etage: systeme.includes('Tu juges les attentes déclarées') ? 'p2_independant' : systeme.includes('Tu relèves uniquement des passages verbatim') ? 'p1_independant' : 'instrument_natif',
    systeme_sha256: sha(JSON.stringify(body.messages.filter(m => m.role === 'system'))), modele_demande: body.model,
    temperature: body.temperature ?? null, max_completion_tokens: body.max_completion_tokens }
  ctx.appels.push(appel)
  const fichierAppel = join(prive, `${ctx.id}-appel-${appel.numero}.json`)
  // Écriture durable du corps exact AVANT tout envoi ; aucun en-tête ni secret.
  writeFileSync(fichierAppel, json({ ...appel, requete: body, statut: 'avant_envoi' }), { mode: 0o600, flag: 'wx' })
  let reponse
  try {
    const response = await fetchOriginal(input, init)
    appel.http = response.status
    reponse = await response.clone().json()
    appel.modele_repondu = reponse.model ?? null
    appel.usage = reponse.usage ?? null
    appel.fin = new Date().toISOString()
    return response
  } catch(e) { appel.erreur = e.message; throw e }
  finally { writeFileSync(join(prive, `${ctx.id}-appel-${appel.numero}.json`), json({ ...appel, requete: body, reponse }), { mode: 0o600 }) }
}

async function lignes(table, colonnes, depot) {
  const { data, error, count } = await db.from(table).select(colonnes, { count: 'exact' }).eq('depot_id', depot)
  if (error) throw error
  assert.equal(data.length, count, 'Lecture complète de ' + table)
  return data
}
async function executer(c, repetition) {
  const id = c.id + '-' + repetition
  const ctx = { id, phase: 'v1', appels: [] }
  return contexte.run(ctx, async () => {
    const debut = Date.now(), contrat = contrats.get(c.id)
    const sortie = { cas: c.id, repetition, debut: new Date().toISOString(), bilans: {}, erreurs: [], appels: ctx.appels }
    let depot
    console.log(JSON.stringify({ debut: id }))
    try {
      const { data: ex, error } = await db.rpc('attribuer_pilote_argument', { p_requete: randomUUID(), p_contrat: contrat, p_eleves: [r.eleve], p_echeance: null })
      if (error) throw error
      const { data: d, error: ed } = await db.from('exercices_depots').select('id').eq('exercice_id', ex).eq('eleve_id', r.eleve).single()
      if (ed) throw ed
      depot = d.id
      writeFileSync(join(prive, id + '-depot.json'), json({ depot, exercice: ex, cas: c.id, repetition }), { mode: 0o600 })
      for (const phase of ['v1','vf']) {
        ctx.phase = phase
        const { error: e } = await db.from('exercices_depots').update({ ['texte_' + phase]: c[phase], [phase + '_remis_at']: new Date().toISOString(), statut: phase + '_remis' }).eq('id', depot)
        if (e) throw e
        sortie.bilans[phase] = await traiterDepot(db, depot, phase)
        console.log(JSON.stringify({ phase_finie: id, version: phase, retour: sortie.bilans[phase].retourEcrit }))
        assert.ok(sortie.bilans[phase].retourEcrit, 'Retour absent en ' + phase)
      }
    } catch(e) { sortie.erreurs.push(e instanceof Error ? e.message : JSON.stringify(e)) }
    if (depot) {
      try {
        const collections = await Promise.all([
          lignes('exercices_pilote_argument_jugements', 'version,extraction,jugement,empreinte_texte,empreinte_pedagogique,modele', depot),
          lignes('exercices_squelettes', 'competence,version,artefact_extraction,artefact_jugement', depot),
          lignes('competences_mesures', 'competence,observables,lettre_equivalente,delta_v1_vf', depot),
          lignes('exercices_retours', 'moment,texte,action_revision,feed_forward,registre_servi', depot),
          lignes('api_couts', 'cout,modele,phase,version,tokens_entree,tokens_sortie', depot),
        ])
        ;[sortie.jugements, sortie.squelettes, sortie.mesures, sortie.retours, sortie.couts] = collections
        for (const j of sortie.jugements) {
          verifierPreuves(contrat, j.version, c[j.version], j.extraction)
          verifierPreuves(contrat, j.version, c[j.version], j.jugement)
          assert.equal(j.modele, 'gpt-5.6-luna')
        }
        const v1 = sortie.jugements.find(j => j.version === 'v1'), vf = sortie.jugements.find(j => j.version === 'vf')
        if (v1 && vf) sortie.comparaison = comparerConstats(contrat, v1.jugement, vf.jugement)
        sortie.origines_jugements = Object.fromEntries(sortie.jugements.map(j => [j.version,
          j.version === 'vf' && c.v1 === c.vf ? 'repris_de_v1' : 'observation_independante']))
        if (v1 && vf && c.v1 === c.vf) {
          assert.deepEqual(vf.jugement, Object.fromEntries(attentesPour(contrat, 'vf').map(a => [a.id, v1.jugement[a.id]])))
          assert.deepEqual(vf.extraction, Object.fromEntries(attentesPour(contrat, 'vf').map(a => [a.id, v1.extraction[a.id]])))
          assert.equal(ctx.appels.filter(a => a.version === 'vf' && a.etage !== 'instrument_natif').length, 0, 'Reprise sans nouveau P1/P2 indépendant')
        }
        if (!sortie.erreurs.length) {
          assert.equal(sortie.jugements.length, 2)
          assert.deepEqual(sortie.mesures.map(m => m.competence).sort(), [c.principale, c.secondaire].filter(Boolean).sort())
          assert.ok(sortie.mesures.every(m => m.lettre_equivalente === null && m.delta_v1_vf === null))
          for (const m of sortie.mesures) {
            const autorises = observablesPour(contrat, 'v1', m.competence)
            assert.ok(Object.values(m.observables).some(v => typeof v === 'number'), 'Mesure numérique présente')
            assert.ok(Object.entries(m.observables).every(([k,v]) => autorises.includes(k) || v === 'n/a'), 'Périmètre des observables')
          }
          assert.equal(sortie.bilans.vf.mesuresEcrites, 0)
          assert.deepEqual(sortie.squelettes.filter(s => s.version === 'vf').map(s => s.competence), [c.principale])
          assert.equal(sortie.retours.length, 2)
          assert.equal(sortie.couts.length, ctx.appels.filter(a => a.http === 200).length, 'Tous les appels reçus sont journalisés')
          sortie.controles_techniques = 'reussis'
        }
      } catch(e) { sortie.erreurs.push(e instanceof Error ? e.message : JSON.stringify(e)) }
    }
    sortie.duree_ms = Date.now() - debut
    sortie.cout_usd = sortie.couts?.reduce((s,a) => s + Number(a.cout), 0) ?? null
    sauverPublic('resultats/' + id + '.json', sortie)
    console.log(JSON.stringify({ termine: id, erreurs: sortie.erreurs, duree_ms: sortie.duree_ms, cout_usd: sortie.cout_usd }))
    return sortie
  })
}
// Ordre entrelacé : chaque répétition visite les six cas, pour limiter l'effet de l'heure.
const travaux = Array.from({ length: banque.repetitions }, (_,i) => cas.map(c => ({ c, repetition: i + 1 }))).flat()
const resultats = []
async function travailleur() {
  while (travaux.length) { const { c, repetition } = travaux.shift(); resultats.push(await executer(c, repetition)) }
}
try { await Promise.all(Array.from({ length: 3 }, travailleur)) }
finally { globalThis.fetch = fetchOriginal }
assert.deepEqual(empreintesCode(), codeDebut, 'Code modifié pendant la campagne')
assert.equal(sha(readFileSync(join(racine, 'cas.json'))), empreinteCas, 'Références modifiées pendant la campagne')
for (const [f, hash] of Object.entries(criteresDebut)) assert.equal(sha(readFileSync(join(racine, f))), hash, 'Critère modifié pendant la campagne : ' + f)
sauverPublic('execution.json', { debut_le: JSON.parse(readFileSync(join(racine, 'EXECUTION_COMMENCEE.json'), 'utf8')).debut, termine_le: new Date().toISOString(), repetitions: resultats.length,
  completes: resultats.filter(r => r.controles_techniques === 'reussis').length, cout_usd: resultats.reduce((s,r) => s + (r.cout_usd ?? 0), 0),
  code_et_references_inchanges: true, reserve_executee: false, erreurs: resultats.filter(r => r.erreurs.length).map(r => ({ cas: r.cas, repetition: r.repetition, erreurs: r.erreurs })) })
console.log('Campagne terminée ; résultats conservés. Le décor doit maintenant être retiré.')
if (resultats.some(r => r.erreurs.length)) process.exitCode = 1
