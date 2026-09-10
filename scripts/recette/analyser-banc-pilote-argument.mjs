// Analyse locale des sorties enregistrées ; aucun accès réseau ni appel IA.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
const racine = 'scripts/recette/pilote-argument/banc'
const banque = JSON.parse(readFileSync(join(racine, 'cas.json'), 'utf8'))
const cas = banque.cas.filter(c => c.lot === 'diagnostic')
const runs = readdirSync(join(racine, 'resultats')).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(racine, 'resultats', f), 'utf8')))
const compter = valeurs => valeurs.reduce((o, v) => ({ ...o, [v]: (o[v] ?? 0) + 1 }), {})
const stable = x => JSON.stringify(x, Object.keys(x).sort())
const empreinte = x => createHash('sha256').update(JSON.stringify(x)).digest('hex')
const mediane = xs => { const a = [...xs].sort((a,b) => a-b); return a.length ? (a[Math.floor((a.length-1)/2)] + a[Math.ceil((a.length-1)/2)]) / 2 : null }
const details = cas.map(c => {
  const rr = runs.filter(r => r.cas === c.id).sort((a,b) => a.repetition - b.repetition)
  const cellules = []
  for (const version of ['v1','vf']) {
    const jj = rr.flatMap(r => r.jugements?.filter(j => j.version === version).map(j => ({ ...j, repetition: r.repetition })) ?? [])
    const ids = [...new Set(jj.flatMap(j => Object.keys(j.jugement)))]
    for (const id of ids) {
      const observations = jj.filter(j => j.jugement[id]).map(j => ({ repetition: j.repetition, ...j.jugement[id] }))
      const comptes = compter(observations.map(o => o.etat))
      const ref = c.attentes.find(a => a.id === id && a[version])
      cellules.push({ version, attente: id, etats: comptes, observations, variable: Object.keys(comptes).length > 1,
        attendu: ref?.[version] ?? null, reference_incertaine: ref?.incertitude ?? false,
        accord: ref ? observations.filter(o => ref[version].includes(o.etat)).length : null,
        desaccords: ref ? observations.filter(o => !ref[version].includes(o.etat)) : [],
        releves_distincts: new Set(jj.map(j => JSON.stringify(j.extraction[id]))).size })
    }
  }
  const cibles = cellules.filter(x => x.attendu && !x.reference_incertaine)
  const identiques = c.v1 === c.vf ? rr.filter(r => r.comparaison).map(r => ({ repetition: r.repetition,
    faux_progres_principale: r.comparaison.principale.filter(x => x.changement === 'corrige').map(x => x.attente),
    faux_recul_principale: r.comparaison.principale.filter(x => x.changement === 'a_reprendre').map(x => x.attente),
    changements_objet: r.comparaison.objet.filter(x => ['corrige','a_reprendre'].includes(x.changement)),
    retour_comparaison: r.retours?.find(x => x.moment === 'final')?.texte?.find(p => p.id.endsWith('-vf-comparaison'))?.texte ?? null,
  })) : []
  const vecteurs = [...new Set(rr.flatMap(r => r.mesures?.map(m => m.competence) ?? []))].map(competence => ({ competence,
    vecteurs_distincts: new Set(rr.flatMap(r => r.mesures?.filter(m => m.competence === competence).map(m => stable(m.observables)) ?? [])).size,
    observables: rr.flatMap(r => r.mesures?.filter(m => m.competence === competence).map(m => ({ repetition: r.repetition, valeurs: m.observables })) ?? []) }))
  const alertesNatives = rr.flatMap(r => Object.entries(r.bilans).flatMap(([version,b]) => (b.alertes ?? [])
    .filter(a => /FIDÉLITÉ P1|citations : \d+ infidèle|COPIE_SANS_COUTURE|RELEVÉ VIDE/.test(a))
    .map(alerte => ({ repetition: r.repetition, version, alerte }))))
  return { cas: c.id, parcours: c.parcours, cran: c.cran, principale: c.principale, secondaire: c.secondaire,
    repetitions: rr.length, completes: rr.filter(r => r.controles_techniques === 'reussis').length,
    erreurs: rr.filter(r => r.erreurs.length).map(r => ({ repetition: r.repetition, erreurs: r.erreurs })),
    cellules_observees: cellules.length, cellules_variables: cellules.filter(x => x.variable).length,
    accord_propose: cibles.reduce((s,x) => s+x.accord, 0), jugements_cibles: cibles.reduce((s,x) => s+x.observations.length, 0),
    cellules_cibles_variables: cibles.filter(x => x.variable).length,
    cout_usd: rr.reduce((s,r) => s+(r.cout_usd ?? 0), 0), duree_mediane_ms: mediane(rr.map(r => r.duree_ms)),
    cellules, controle_textes_identiques: identiques, mesures_natives: vecteurs, alertes_instruments_natifs: alertesNatives }
})

// Lorsque des requêtes P2 sont rigoureusement identiques, une différence d'état
// ne peut pas être attribuée à une variation de P1 ou des prompts entre ces appels.
const prive = '/tmp/pilote-argument-banc'
const groupes = new Map(), inventaire = [], paquets = []
if (existsSync(prive)) for (const f of readdirSync(prive).filter(f => /-appel-\d+\.json$/.test(f))) {
  const a = JSON.parse(readFileSync(join(prive,f), 'utf8'))
  const systeme = a.requete.messages.filter(m => m.role === 'system').map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).join('\n')
  const etage = systeme.includes('Tu juges les attentes déclarées') ? 'p2_independant' : systeme.includes('Tu relèves uniquement des passages verbatim') ? 'p1_independant' : 'instrument_natif'
  const id = f.replace(/-appel-\d+\.json$/, '')
  if (etage !== 'instrument_natif') {
    try {
      const document = JSON.parse(a.requete.messages.find(m => m.role === 'user').content)
      const c = cas.find(c => id.startsWith(c.id + '-'))
      const autorisees = ['sujet_exact','contexte_fourni','consigne','texte_eleve','phase','objet','parcours','empreinte_pedagogique','competences_mesurees','attentes','regles','passages_citables', ...(etage === 'p2_independant' ? ['releve'] : [])]
      paquets.push({ execution: id, numero: a.numero, etage,
        cles_conformes: Object.keys(document).every(k => autorisees.includes(k)),
        copie_exacte: document.texte_eleve === c?.[a.version], contexte_exact: document.contexte_fourni === c?.contexte,
        competences_conformes: JSON.stringify(document.competences_mesurees) === JSON.stringify(a.version === 'vf' ? [c?.principale] : [c?.principale,c?.secondaire].filter(Boolean)) })
    } catch { paquets.push({ execution: id, numero: a.numero, etage, relance_ou_document_non_json: true }) }
  }
  const texte = a.reponse?.choices?.[0]?.message?.content ?? ''
  let sortie = null
  try { sortie = JSON.parse(texte.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'')) } catch { /* Sortie refusée conservée dans le journal. */ }
  const etats = etage === 'p2_independant' && sortie && !Array.isArray(sortie) ? Object.fromEntries(Object.entries(sortie).filter(([,v]) => v?.etat).map(([k,v]) => [k,v.etat]).sort(([a],[b]) => a.localeCompare(b))) : null
  const execute = runs.find(r => r.cas + '-' + r.repetition === id)
  const persiste = execute?.jugements?.find(j => j.version === a.version)?.jugement
  const conserve = !!etats && !!persiste && Object.keys(etats).length === Object.keys(persiste).length
    && Object.keys(etats).every(k => sortie[k].etat === persiste[k].etat && sortie[k].motif === persiste[k].motif && sortie[k].revision === persiste[k].revision)
  const entree = { execution: id, numero: a.numero, version: a.version, etage, requete_sha256: a.requete_sha256,
    systeme_sha256: a.systeme_sha256, modele_repondu: a.modele_repondu ?? null, http: a.http ?? null,
    temperature: a.temperature, usage: a.usage ?? null, etats, jugement_conserve: conserve }
  inventaire.push(entree)
  if (conserve) {
    const groupe = groupes.get(a.requete_sha256) ?? []
    groupe.push(entree); groupes.set(a.requete_sha256, groupe)
  }
}
const identiques = [...groupes.entries()].filter(([,g]) => g.length > 1).map(([requete_sha256,g]) => ({ requete_sha256, appels: g,
  vecteurs_etats_distincts: new Set(g.map(a => empreinte(a.etats))).size,
  attentes_variables: [...new Set(g.flatMap(a => Object.keys(a.etats)))].filter(k => new Set(g.map(a => a.etats[k])).size > 1) }))
const stats = {
  analyse_le: new Date().toISOString(), statut: 'diagnostic sur références proposées, non calibration validée',
  repetitions: runs.length, completes: runs.filter(r => r.controles_techniques === 'reussis').length,
  etats_juges: details.reduce((s,d) => s+d.cellules.reduce((s,c) => s+c.observations.length, 0), 0),
  cellules_copie_attente_version: details.reduce((s,d) => s+d.cellules_observees, 0), cellules_variables: details.reduce((s,d) => s+d.cellules_variables, 0),
  accord_propose: details.reduce((s,d) => s+d.accord_propose, 0), jugements_cibles: details.reduce((s,d) => s+d.jugements_cibles, 0),
  cout_usd: runs.reduce((s,r) => s+(r.cout_usd ?? 0), 0), appels_http: inventaire.length,
  modeles_repondus: compter(inventaire.map(a => a.modele_repondu ?? 'inconnu')),
  groupes_p2_entree_identique: identiques.length, groupes_p2_entree_identique_et_etats_differents: identiques.filter(g => g.vecteurs_etats_distincts > 1).length,
  controle_paquets: { controles: paquets.filter(p => !p.relance_ou_document_non_json).length,
    anomalies: paquets.filter(p => !p.relance_ou_document_non_json && (!p.cles_conformes || !p.copie_exacte || !p.contexte_exact || !p.competences_conformes)),
    relances_ou_documents_non_json: paquets.filter(p => p.relance_ou_document_non_json) },
  faux_progres_sur_texte_identique: details.flatMap(d => d.controle_textes_identiques.map(c => ({ cas: d.cas, ...c }))).filter(c => c.faux_progres_principale.length),
  cas: details,
}
writeFileSync(join(racine, 'analyse.json'), JSON.stringify(stats, null, 2)+'\n')
writeFileSync(join(racine, 'appels.json'), JSON.stringify({ appels: inventaire, p2_entrees_identiques: identiques, controle_paquets: paquets }, null, 2)+'\n')
console.log(JSON.stringify({ ...stats, cas: details.map(d => Object.fromEntries(Object.entries(d).filter(([k]) => !['cellules','controle_textes_identiques','mesures_natives','alertes_instruments_natifs'].includes(k)))) }, null, 2))
