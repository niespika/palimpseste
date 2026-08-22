// ============================================================================
// RECETTE C4 · L4 — LA PASSATION EN CLASSE, ÉPROUVÉE PAR REQUÊTE ET SUR PIÈCE.
// ----------------------------------------------------------------------------
// « VÉRIFIÉ VEUT DIRE PAR REQUÊTE ET SUR PIÈCE, PAS SUPPOSÉ. »      — le fait quand
//
// Ce script appelle LE MÊME CODE QUE LES ÉCRANS — l'ouverture, le dépôt, la
// transcription, la file, la correction, la publication —, avec le client admin.
// Il ne rejoue pas les tests purs : il éprouve la MÉCANIQUE EN BASE.
//
//   A. le décor        — une classe, des élèves, une instance `lieu = classe`,
//                        et les dépôts CRÉÉS DÈS L'ASSIGNATION (`07-` §1.1)
//   B. l'ouverture     — geste MANUEL, horodaté ; les drapeaux ne se lèvent plus après
//   C. la transcription— deux passes, le désaccord, les doutes, LA LATENCE
//   D. le découpage    — de la photo à la transcription, de l'édition à la mesure
//   E. les deux gestes — « se juger » et la confiance : servis, ou POURQUOI non
//   F. le lot          — chaque dépôt en file, PAR LA MÊME FILE
//   G. la correction   — masqué → révélé → édité → commenté → validé → PUBLIÉ → LU
//   H. LE TEST DE CHARGE — cent quarante copies, `echec_definitif`, repli alphabétique
//   I. le nettoyage    — tout ce que la recette a semé est retiré
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/passation-c4l4.mjs [--sans-appel] [--charge=140]
//
// `--sans-appel`  saute TOUT ce qui dépense : la transcription réelle et le test
//                 de charge. Le reste — la file, les statuts, la correction, la
//                 publication, la lecture — s'éprouve entièrement.
// `--charge=N`    l'échelle du test de charge (défaut 140, « l'échelle réelle
//                 d'une journée de passations », `07-` §7, risque 1).
// `--sans-charge` joue le flux complet AVEC appels, mais saute les 140.
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = '/Users/louissagnieres/Documents/GitHub/palimpseste'
const { poserPassationClasse, lireLesPortes } = await import(`${RACINE}/utils/passation/acces.ts`)
const {
  ouvrirLesDepots, enregistrerLesPhotos, mettreLaTranscriptionEnFile, validerLaTranscription,
  declencherLeLot, ecrireLeCommentaireGeneral, poserLeMessageReporte, lireLeMessageReporte,
  lireDepot, lireDepotsDeLInstance, attenteDuDepot, ETAPE_TRANSCRIPTION,
} = await import(`${RACINE}/utils/passation/depots.ts`)
const { transcrireMaintenant, transcrireDepot } = await import(`${RACINE}/utils/passation/ouvrier.ts`)
const { leverLesDrapeaux, offreSeJuger, offreConfianceRemise, offreCredence, lirePerimetre } =
  await import(`${RACINE}/utils/passation/metacognition.ts`)
const {
  editerLeRetour, validerLesCorrections, publier, depublier, validerLaLecture, lireLesRetours,
  pointsAAfficher,
} = await import(`${RACINE}/utils/passation/retours.ts`)
const { auCran, sommaireDuRetour, CRAN_INITIAL } = await import(`${RACINE}/utils/passation/revelation.ts`)
const { photoDeposee, marqueurPageManquante } = await import(`${RACINE}/utils/passation/photos.ts`)
const { blocs, empreinteDuDecoupage } = await import(`${RACINE}/utils/passation/transcription-calcul.ts`)
const { cheminPage } = await import(`${RACINE}/utils/passation/chemins.ts`)
const { avertissementsDuPrompt, promptDeTranscription } =
  await import(`${RACINE}/utils/passation/transcription.ts`)
const { lireConfigPassation, configurationADeclarer } =
  await import(`${RACINE}/utils/passation/config.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const SANS_APPEL = process.argv.includes('--sans-appel')
const SANS_CHARGE = process.argv.includes('--sans-charge') || SANS_APPEL
const CHARGE = Number((process.argv.find((a) => a.startsWith('--charge=')) ?? '--charge=140').slice(9))
const MARQUE = 'RECETTE-C4L4'
/**
 * Ce que « quelques secondes par copie » veut dire, lu à la lettre.
 * `02-exercices.md` §6.D, « Exigence de latence » : « la transcription
 * d'environ trente-cinq copies doit revenir en QUELQUES SECONDES PAR COPIE,
 * pendant l'heure de cours ». Dix secondes est la lecture la plus généreuse de
 * « quelques » ; au-delà, la recette doit le dire, pas le déplacer.
 */
const SECONDES_CONTRAT = 10

let ok = 0
let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (texte) => console.log(`  · ${texte}`)
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 72 - t.length))}`)

/** L'état des interrupteurs AVANT la recette — pour les remettre exactement. */
let portesInitiales = null

// ─────────────────────────────────────────────────────────────────────────────
// A. LE DÉCOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ⚠️ LA RECETTE JOUE LE RÔLE DE L'ASSIGNATION, ET C'EST DÉLIBÉRÉ.
 *    « `exercices_depots` est créée DÈS L'ASSIGNATION, pas au dépôt » (§1.1 ;
 *    piège 7) — et c'est C4-L8 qui le fait, dans `assignerALaClasse`. Ici, on
 *    sème les dépôts À LA MAIN parce qu'on n'a pas d'écran de conception sous la
 *    main ; LE CODE DE C4-L4, LUI, N'EN CRÉE AUCUN.
 */
async function semer(nbEleves) {
  const { data: type } = await admin.from('exercices_types')
    .select('id, grain').eq('code', 'argument').maybeSingle()
  if (!type) throw new Error('type `argument` introuvable — le seed de C4-L1 manque.')

  const { data: classe } = await admin.from('classes')
    .insert({ nom: `${MARQUE}-classe`, annee_scolaire: '2026-2027' }).select('id').single()

  const { data: eleves } = await admin.from('profiles')
    .select('id').eq('role', 'eleve').limit(nbEleves)
  const eleveIds = (eleves ?? []).map((e) => e.id)
  if (eleveIds.length === 0) throw new Error('aucun élève en base.')

  const { data: ex, error: eEx } = await admin.from('exercices').insert({
    type_id: type.id,
    classe_id: classe.id,
    lieu: 'classe',                       // ⚠️ c'est le `lieu` qui commande tout
    consigne_instanciee: 'Peut-on douter de tout ? Rédigez un paragraphe argumenté.',
    statut: 'assigne',
    cran: 'production_autonome',
    modes_par_competence: { expression: ['composer'], structure: ['composer'] },
    optin_se_juger: false,
    optin_confiance_remise: false,
  }).select('id').single()
  if (eEx) throw new Error(`instance non créée : ${eEx.message}`)

  // Une ligne de dépôt par élève, `origine` `prof` — comme `assignerALaClasse`.
  const lignes = []
  for (let i = 0; i < nbEleves; i++) {
    lignes.push({
      eleve_id: eleveIds[i % eleveIds.length],
      exercice_id: ex.id,
      origine: 'prof',
      statut: 'assigne',
      assigne_at: new Date().toISOString(),
    })
  }
  // ⚠️ `uk_depots_eleve_exercice` : un élève, un dépôt par exercice. À l'échelle,
  //    on crée donc AUTANT D'INSTANCES qu'il faut de multiples de l'effectif.
  const parInstance = eleveIds.length
  const instances = [ex.id]
  const depots = []
  for (let debut = 0; debut < nbEleves; debut += parInstance) {
    let exId = instances[instances.length - 1]
    if (debut > 0) {
      const { data: autre } = await admin.from('exercices').insert({
        type_id: type.id, classe_id: classe.id, lieu: 'classe',
        consigne_instanciee: `${MARQUE} — lot ${instances.length + 1}`,
        statut: 'assigne', cran: 'production_autonome',
        modes_par_competence: { expression: ['composer'] },
      }).select('id').single()
      exId = autre.id
      instances.push(exId)
    }
    const lot = eleveIds.slice(0, Math.min(parInstance, nbEleves - debut)).map((eleveId) => ({
      eleve_id: eleveId, exercice_id: exId, origine: 'prof', statut: 'assigne',
      assigne_at: new Date().toISOString(),
    }))
    const { data: poses, error } = await admin.from('exercices_depots').insert(lot).select('id, eleve_id, exercice_id')
    if (error) throw new Error(`dépôts non créés : ${error.message}`)
    depots.push(...poses)
  }
  return { classeId: classe.id, exerciceId: ex.id, instances, depots, eleveIds }
}

/**
 * Une photo RÉELLE de copie manuscrite.
 *
 * ⚠️ « "En quelques secondes par copie" SE MESURE, SUR DES PHOTOS RÉELLES DE
 *    COPIES MANUSCRITES » (le « fait quand »). On va donc chercher, au
 *    stockage, une vraie copie d'élève — écriture cursive, ratures, en-tête.
 *
 * ⚠️ ET ELLE APPARTIENT AU COMPTE DE TEST. Vérifié le 22/08 : les quatorze
 *    fichiers de `essais`, `codex` et `fragments` appartiennent tous à
 *    `test@test.com`. Aucune copie d'élève réel n'est renvoyée au sous-traitant
 *    pour un test de charge — ce serait une finalité que la table de traitement
 *    ne déclare pas (`06-` §7).
 */
const COMPTE_DE_TEST = '89662514-ea26-4cc3-9708-c228eea6d136'

async function photoReelle() {
  const { data: eleves } = await admin.storage.from('essais').list('', { limit: 100 })
  for (const e of eleves ?? []) {
    if (e.name !== COMPTE_DE_TEST) continue          // ⚠️ le compte de test, et lui seul
    const { data: depots } = await admin.storage.from('essais').list(e.name, { limit: 100 })
    for (const d of depots ?? []) {
      const { data: fichiers } = await admin.storage.from('essais')
        .list(`${e.name}/${d.name}`, { limit: 100 })
      const f = (fichiers ?? []).find((x) => Number(x.metadata?.size ?? 0) > 80_000)
      if (!f) continue
      const chemin = `${e.name}/${d.name}/${f.name}`
      const { data: blob, error } = await admin.storage.from('essais').download(chemin)
      if (error || !blob) continue
      return {
        buffer: Buffer.from(await blob.arrayBuffer()),
        source: `essais/${chemin}`,
      }
    }
  }
  return null
}

async function deposerLaPhoto(depot, buffer) {
  const chemin = cheminPage(depot.eleve_id, depot.id, 1)
  const { error } = await admin.storage.from('codex')
    .upload(chemin, buffer, { contentType: 'image/jpeg', upsert: true })
  if (error) throw new Error(`upload impossible : ${error.message}`)
  return photoDeposee(1, chemin, `recette-${depot.id}`, 0)
}

// ─────────────────────────────────────────────────────────────────────────────

async function principal() {
  console.log(`\n══ RECETTE C4·L4 — la passation en classe ${SANS_APPEL ? '(SANS APPEL)' : ''}`)

  titre('Le contrôle d\'entrée de la recette')
  portesInitiales = await lireLesPortes(admin)
  note(`portes AVANT : passation=${portesInitiales.passationActive}, `
    + `exercices=${portesInitiales.exercicesActifs}`)
  const conf = lireConfigPassation()
  note(`modèle de transcription : ${conf.modeleTranscription} · ${conf.passes} passe(s)`)
  const aDeclarer = configurationADeclarer()
  if (aDeclarer.length) note(`⚠️ configuration NON POSÉE (défauts) : ${aDeclarer.join(', ')}`)
  for (const a of avertissementsDuPrompt()) note(`⚠️ ${a}`)
  dire(promptDeTranscription().includes('Tu es un scribe, pas un correcteur'),
    'le prompt de transcription est celui de la source, dérivé (« un scribe, pas un correcteur »)')

  // La recette OUVRE les deux portes, et les remettra exactement comme elles étaient.
  await poserPassationClasse(admin, true)
  await admin.from('scriptorium_params').update({ exercices_actif: true }).eq('id', 1)

  const decor = await semer(3)
  note(`décor : classe ${decor.classeId}, instance ${decor.exerciceId}, ${decor.depots.length} dépôts`)

  // ── B. L'OUVERTURE ────────────────────────────────────────────────────────
  titre('B. L\'ouverture du dépôt — un geste manuel, jamais une fenêtre')
  const drapAvant = await leverLesDrapeaux(admin, decor.exerciceId,
    { seJuger: true, confianceRemise: true })
  dire(drapAvant.ok && drapAvant.data.seJuger && drapAvant.data.confianceRemise,
    'les deux drapeaux se lèvent AVANT l\'ouverture, et ils sont indépendants')

  const d0 = decor.depots[0]
  const avant = await lireDepot(admin, d0.id)
  dire(avant?.statut === 'assigne' && avant?.ouvert_par_prof_at === null,
    'avant l\'ouverture : statut `assigne`, aucun horodatage d\'ouverture')

  const prep = await enregistrerLesPhotos(admin, d0.id, d0.eleve_id, [photoDeposee(1, 'x', 'y')])
  dire(!prep.ok && /pas encore ouvert/.test(prep.message),
    'AVANT l\'ouverture, le dépôt des photos est refusé — c\'est l\'ouverture qui commande')

  const ouverture = await ouvrirLesDepots(admin, decor.exerciceId)
  dire(ouverture.ok && ouverture.data.ouverts === decor.depots.length,
    `l'ouverture horodate ${ouverture.ok ? ouverture.data.ouverts : 0} dépôt(s)`)
  const apres = await lireDepot(admin, d0.id)
  dire(apres?.statut === 'ouvert' && apres?.ouvert_par_prof_at != null,
    'après l\'ouverture : statut `ouvert`, `ouvert_par_prof_at` posé')

  const drapApres = await leverLesDrapeaux(admin, decor.exerciceId, { seJuger: false })
  dire(!drapApres.ok && /déjà ouvert/.test(drapApres.message),
    'APRÈS l\'ouverture, les drapeaux ne se lèvent plus (`02-` §5)')

  // Une instance de MAISON refuse tout ce flux — le `lieu` commande.
  const { data: exMaison } = await admin.from('exercices').select('id').eq('lieu', 'maison').limit(1).maybeSingle()
  if (exMaison) {
    const r = await ouvrirLesDepots(admin, exMaison.id)
    dire(!r.ok && /classe/.test(r.message),
      'une instance de MAISON refuse l\'ouverture manuelle — c\'est le `lieu` qui commande')
  }

  // ── C et D. LA TRANSCRIPTION, ET LE DÉCOUPAGE ─────────────────────────────
  titre('C. La transcription — deux passes, et la latence')
  const photo = SANS_APPEL ? null : await photoReelle()
  let empreinteMachine = null
  if (SANS_APPEL) {
    note('sauté (--sans-appel). Le découpage se prouve alors sur un texte posé à la main.')
    const pose = 'Premier paragraphe.\nSur deux lignes.\n\nDeuxième paragraphe.\n\nTroisième.'
    await admin.from('exercices_depots').update({ transcription_v1: pose }).eq('id', d0.id)
    empreinteMachine = empreinteDuDecoupage(pose)
  } else if (!photo) {
    dire(false, 'aucune photo réelle de copie manuscrite au stockage — le test de latence '
      + 'ne peut pas se faire « sur des photos réelles » (le « fait quand »)')
  } else {
    note(`photo réelle : ${photo.source} (${(photo.buffer.length / 1024).toFixed(0)} Ko)`)
    const p = await deposerLaPhoto(d0, photo.buffer)
    const enr = await enregistrerLesPhotos(admin, d0.id, d0.eleve_id, [p])
    dire(enr.ok, 'les photos s\'enregistrent sous la forme que la garde exige')

    const file1 = await mettreLaTranscriptionEnFile(admin, d0.id)
    const file2 = await mettreLaTranscriptionEnFile(admin, d0.id)
    dire(file1.ok && file2.ok && file2.data.deja,
      'la mise en file est IDEMPOTENTE — un double-clic ne paie pas deux transcriptions')

    const t0 = Date.now()
    const { bilan, motif } = await transcrireMaintenant(admin, d0.id)
    const dureeS = (Date.now() - t0) / 1000
    dire(bilan != null, `la transcription revient (${dureeS.toFixed(1)} s)${motif ? ` — ${motif}` : ''}`)
    if (bilan) {
      note(`${bilan.appels} appel(s) — DEUX PASSES par copie, c'est le chiffre que la facture verra`)
      note(`confiance de transcription : ${bilan.confiance ?? 'n/a'} · ${bilan.doutes} endroit(s) difficile(s)`)
      note(`découpage rendu : ${bilan.nbBlocs} bloc(s)`)
      for (const a of bilan.alertes) note(`⚠️ ${a}`)
      // ⚠️ LE CONTRAT EST « QUELQUES SECONDES PAR COPIE, PENDANT L'HEURE DE
      //    COURS » (`02-` §6.D, « Exigence de latence »). On le lit à la lettre :
      //    au-delà de DIX SECONDES, ce ne sont plus « quelques secondes ». Une
      //    recette qui se donne trente secondes de marge ne mesure plus le
      //    contrat, elle le déplace.
      dire(dureeS <= SECONDES_CONTRAT,
        `LATENCE : ${dureeS.toFixed(1)} s pour une copie — le contrat est « quelques secondes » `
        + `(lu ici à ${SECONDES_CONTRAT} s)`)

      const { data: lignes } = await admin.from('api_couts')
        .select('cout, phase, tokens_entree, tokens_sortie, tokens_cache_lecture, tokens_cache_ecriture')
        .eq('depot_id', d0.id)
      const cout = (lignes ?? []).reduce((s, l) => s + Number(l.cout), 0)
      note(`FACTURE d'une copie : ${(lignes ?? []).length} ligne(s), ${cout.toFixed(4)} $ `
        + `→ projection à cent quarante copies : ${(cout * 140).toFixed(2)} $`)
      note(`jetons : ${(lignes ?? []).reduce((s, l) => s + (l.tokens_entree ?? 0), 0)} entrée · `
        + `${(lignes ?? []).reduce((s, l) => s + (l.tokens_sortie ?? 0), 0)} sortie · `
        + `${(lignes ?? []).reduce((s, l) => s + (l.tokens_cache_lecture ?? 0), 0)} cache lu · `
        + `${(lignes ?? []).reduce((s, l) => s + (l.tokens_cache_ecriture ?? 0), 0)} cache écrit`)
      dire((lignes ?? []).every((l) => l.phase === null),
        'les lignes de coût portent `phase` NULL avec leur `depot_id` (piège 19)')
    }
    const relu = await lireDepot(admin, d0.id)
    empreinteMachine = relu?.transcription_v1 ? empreinteDuDecoupage(relu.transcription_v1) : null
    dire((relu?.transcription_v1 ?? '').length > 0, 'la transcription est écrite en base')
    dire(relu?.transcription_v1_doutes === null || Array.isArray(relu?.transcription_v1_doutes),
      'les doutes sont écrits sous la forme que la garde exige (ou absents)')
  }

  titre('D. Le découpage — de la photo à la transcription, de l\'édition à la mesure')
  const avantEdition = await lireDepot(admin, d0.id)
  const texteMachine = avantEdition?.transcription_v1 ?? ''
  const texteEdite = texteMachine.replace(/e/, 'é')       // l'élève corrige UNE lettre
  const val = await validerLaTranscription(admin, d0.id, d0.eleve_id, texteEdite)
  dire(val.ok, 'l\'élève édite librement et valide')
  const apresEdition = await lireDepot(admin, d0.id)
  dire(apresEdition?.statut === 'v1_remis' && apresEdition?.v1_remis_at != null,
    'après validation : statut `v1_remis`, horodaté')
  dire(empreinteDuDecoupage(apresEdition?.transcription_v1 ?? '') === empreinteMachine,
    `LE DÉCOUPAGE A SURVÉCU à l'édition — empreinte ${empreinteMachine} des deux côtés`)
  dire(blocs(apresEdition?.transcription_v1 ?? '').length === blocs(texteMachine).length,
    `${blocs(texteMachine).length} bloc(s) à la photo, autant à la mesure`)

  // ⚠️ AUCUNE VERSION DOUBLE (piège 13) : rien ne conserve le texte machine.
  const { data: colonnes } = await admin.rpc('version')  // no-op si absent
  void colonnes
  dire(!('transcription_v1_brute' in (apresEdition ?? {})),
    'AUCUNE colonne de transcription brute : « aucune version double n\'est conservée »')

  // La garde de classe refuse la version finale.
  const { error: eVf } = await admin.from('exercices_depots')
    .update({ texte_vf: 'une version finale' }).eq('id', d0.id)
  dire(eVf != null, `la garde serveur refuse une version finale en classe — ${eVf?.code ?? 'aucune erreur !'}`)

  // ── E. LES DEUX GESTES ────────────────────────────────────────────────────
  titre('E. « Se juger » et la confiance de remise — servis, ou POURQUOI non')
  const perimetre = await lirePerimetre(admin, d0.id)
  note(`compétences déclarées : ${perimetre?.declarees.join(', ') || 'aucune'}`)
  note(`compétences \`evaluee\` : ${perimetre?.evaluees.join(', ') || 'AUCUNE'}`)
  if (perimetre?.replisAlphabetiques) note(`⚠️ ${perimetre.replisAlphabetiques}`)
  const sj = await offreSeJuger(admin, d0.id)
  dire(true, `« se juger » : ${sj.servie ? `SERVI (${sj.questions.length} questions)` : `non servi — ${sj.motif}`}`)
  const cr = await offreConfianceRemise(admin, d0.id)
  dire(cr.servie, `confiance de remise : ${cr.servie ? 'SERVIE' : `non servie — ${cr.motif}`}`
    + `${cr.motif && cr.servie ? ` (${cr.motif})` : ''}`)
  const cd = await offreCredence(admin, d0.id)
  // ⭐ « Il y en a une par diagnostic, donc DEUX sur une paire » (`07-` §1.2) :
  //    la recette dit le NOMBRE DE CAS servis, pas seulement la forme — c'est
  //    le compte qui a manqué jusqu'au 22/08.
  dire(true, `crédence : ${cd.servie
    ? `SERVIE (${cd.forme}, ${cd.cas.length} cas${cd.paire ? ', PAIRE' : ''})`
    : `non servie — ${cd.motif}`}`)

  // ── F. LE LOT ─────────────────────────────────────────────────────────────
  titre('F. Le traitement en lot — par la MÊME file')
  const lot = await declencherLeLot(admin, decor.exerciceId)
  dire(lot.ok, lot.ok
    ? `${lot.data.misEnFile} mise(s) en file, ${lot.data.dejaEnFile} déjà là, `
      + `${lot.data.sansCopie} sans copie remise`
    : lot.message)
  const jobs = await attenteDuDepot(admin, d0.id)
  const etapes = jobs.map((j) => j.etape)
  dire(etapes.includes('mesure_v1'),
    `la file porte l'étape de mesure — ${etapes.join(', ')} — et AUCUN second chemin n'existe`)
  const relance = await declencherLeLot(admin, decor.exerciceId)
  dire(relance.ok && relance.data.misEnFile === 0,
    'relancer le lot ne crée AUCUN doublon — la clé d\'idempotence tient')

  // ── G. LA CORRECTION ──────────────────────────────────────────────────────
  titre('G. La correction — masqué → révélé → édité → commenté → validé → publié → lu')
  // ⚠️ AUCUNE COMPÉTENCE N'EST OUVERTE À LA CHAÎNE (contrôle d'entrée, 22/08) :
  //    la chaîne n'engendrera AUCUN retour. On en POSE un, à la forme exacte que
  //    C4-L5 écrira, pour que l'écran de correction s'éprouve de bout en bout —
  //    et on le DIT : ce retour n'est pas mesuré, il est fabriqué.
  const retourFixture = [
    { id: 'r1', competence: 'structure', nature: 'point_de_travail',
      ancrage: { source: 'copie', citation: texteEdite.slice(0, 40) || 'un verbatim' },
      texte: 'Ton deuxième paragraphe ne reprend pas le fil du premier.' },
    { id: 'r2', competence: 'expression', nature: 'reussite',
      ancrage: { source: 'copie', citation: texteEdite.slice(0, 30) || 'un verbatim' },
      texte: 'La phrase d’ouverture est nette.' },
  ]
  const { data: retour, error: eRetour } = await admin.from('exercices_retours').insert({
    depot_id: d0.id, moment: 'chaud', texte: retourFixture,
    feed_forward: 'La prochaine fois, relis ton premier paragraphe avant d’écrire le second.',
  }).select('id').single()
  dire(!eRetour, `un retour SEGMENTÉ à identifiants stables passe la garde de forme${eRetour ? ` — ${eRetour.message}` : ''}`)
  note('⚠️ ce retour est une FIXTURE : aucune fiche n\'est *versée et bancée*, la chaîne '
    + 'n\'ouvre zéro compétence et n\'engendre donc aucun retour (le « fait quand »).')

  const points = pointsAAfficher((await lireLesRetours(admin, d0.id))[0])
  dire(auCran(points, CRAN_INITIAL).length === 0, 'MASQUÉ PAR DÉFAUT — le cran d\'ouverture ne montre rien')
  dire(auCran(points, 1).every((p) => p.texte === '' && p.ancrage.citation === ''),
    'cran 1 — le compte seul : ni texte, ni citation')
  dire(sommaireDuRetour(points).total === 2, 'le sommaire compte les deux points, par compétence')
  dire(auCran(points, 2).every((p) => p.texte !== '' && p.ancrage.citation === ''),
    'cran 2 — les points, sans citation')
  dire(auCran(points, 3).every((p) => p.ancrage.citation !== ''), 'cran 3 — le détail, citations comprises')

  // ÉTAPE 14 — il peut modifier le retour, SANS ancrage, et l'identifiant survit.
  const edite = [
    { ...retourFixture[0], texte: 'Ton plan tient, mais la transition manque.' },
    { id: 'prof:ajout-1', competence: 'structure', nature: 'point_de_travail',
      texte: 'Attention à ta conclusion.' },
  ]
  const ed = await editerLeRetour(admin, retour.id, edite)
  dire(ed.ok, `le professeur édite le retour — un point SANS ancrage passe${ed.ok ? '' : ` — ${ed.message}`}`)
  const inconnu = await editerLeRetour(admin, retour.id,
    [{ id: 'inventé', texte: 'x', competence: 'structure', nature: 'reussite' }])
  dire(!inconnu.ok && /Identifiant/.test(inconnu.message),
    'un identifiant INVENTÉ est refusé — l\'édition conserve, elle ne refabrique pas')
  const vide = await editerLeRetour(admin, retour.id,
    [{ id: 'r1', texte: '   ', competence: 'structure', nature: 'reussite' }])
  dire(!vide.ok, 'un texte fait d\'espaces est refusé — comme la garde en base')

  // ÉTAPE 15 — le commentaire général. AUCUNE NOTE.
  const com = await ecrireLeCommentaireGeneral(admin, d0.id, decor.eleveIds[0],
    'Copie sérieuse. On revoit la transition ensemble.')
  dire(com.ok, 'le commentaire général s\'enregistre, avec `corrige_par` et `corrige_at`')
  const { data: cols } = await admin.from('exercices_depots').select('*').eq('id', d0.id).maybeSingle()
  dire(!Object.keys(cols ?? {}).some((c) => /(^|_)note($|_)/.test(c)),
    'AUCUN champ `note` sur le dépôt — « elle reste sur la copie papier »')

  // ÉTAPE 16 puis 17.
  const validation = await validerLesCorrections(admin, [d0.id], decor.eleveIds[0])
  dire(validation.ok && validation.data.valides === 1, 'la correction se valide (en masse ou une à une)')

  const avantPub = await lireLesRetours(admin, d0.id)
  dire(avantPub[0].published_at === null, 'avant la case : le retour n\'est PAS publié')
  const pub = await publier(admin, [d0.id])
  dire(pub.ok && pub.data.publies === 1, 'la case de publication pose `published_at`')
  const depotPublie = await lireDepot(admin, d0.id)
  dire(depotPublie?.statut === 'retour_publie',
    'le dépôt passe à `retour_publie` — et la séquence de classe S\'ARRÊTE LÀ')

  const lecture = await validerLaLecture(admin, retour.id, d0.eleve_id)
  dire(lecture.ok, 'l\'élève valide sa lecture — `lu_at`, et rien de dupliqué côté dépôt')
  const apresLecture = await lireLesRetours(admin, d0.id)
  dire(apresLecture[0].lu_at != null, '`lu_at` est posé SUR LE RETOUR : un seul domicile')
  const relecture = await validerLaLecture(admin, retour.id, d0.eleve_id)
  dire(relecture.ok, 'valider sa lecture deux fois est sans effet — le geste est idempotent')

  const dep = await depublier(admin, [d0.id])
  const apresDep = await lireLesRetours(admin, d0.id)
  dire(dep.ok && apresDep[0].published_at === null && apresDep[0].lu_at != null,
    'dépublier retire la case MAIS PAS la lecture — un élève qui a lu a lu')
  await publier(admin, [d0.id])

  // Le message reporté de lisibilité.
  titre('Le message reporté — un seul domicile, et il est sur le dépôt')
  const msg = await poserLeMessageReporte(admin, d0.id, 'La prochaine fois, il faudra faire mieux.')
  dire(msg.ok, 'le message se pose sur le dépôt (`message_lisibilite_reporte`)')

  // LA PASSATION SUIVANTE du même élève — c'est là qu'il doit se lire.
  const { data: exSuivant } = await admin.from('exercices').insert({
    type_id: (await admin.from('exercices_types').select('id').eq('code', 'argument').maybeSingle()).data.id,
    classe_id: decor.classeId, lieu: 'classe', statut: 'assigne', cran: 'production_autonome',
    consigne_instanciee: `${MARQUE} — la passation SUIVANTE`,
    modes_par_competence: { expression: ['composer'] },
  }).select('id').single()
  const { data: depotSuivant } = await admin.from('exercices_depots').insert({
    eleve_id: d0.eleve_id, exercice_id: exSuivant.id, origine: 'prof', statut: 'assigne',
    assigne_at: new Date().toISOString(),
  }).select('id').single()
  const lu = await lireLeMessageReporte(admin, d0.eleve_id, depotSuivant.id)
  dire(lu === 'La prochaine fois, il faudra faire mieux.',
    'il se LIT à la passation SUIVANTE du même élève — aucun second domicile au profil')

  // Et il ne se lit PAS sur le dépôt qui le porte : ce serait le dire à
  // l'élève au moment où il ne peut plus rien y faire (`06-` §1, règle 3).
  const surLuiMeme = await lireLeMessageReporte(admin, d0.eleve_id, d0.id)
  dire(surLuiMeme === null,
    'il ne se lit PAS sur la copie qui l’a motivé — « la copie est écrite et l’heure est passée »')

  // ── H. LE TEST DE CHARGE ──────────────────────────────────────────────────
  if (!SANS_CHARGE) await testDeCharge(photo)
  else titre(`H. Le test de charge — SAUTÉ (${SANS_APPEL ? '--sans-appel' : '--sans-charge'})`)

  // ── I. LE NETTOYAGE ───────────────────────────────────────────────────────
  await nettoyer()

  console.log(`\n══ ${ok} vert(s), ${ko} rouge(s)`)
  process.exit(ko === 0 ? 0 : 1)
}

// ─────────────────────────────────────────────────────────────────────────────
// H. LE TEST DE CHARGE — « cent quarante copies traversent SANS INTERVENTION »
// ─────────────────────────────────────────────────────────────────────────────

async function testDeCharge(photo) {
  titre(`H. Le test de charge — ${CHARGE} copies, l'échelle réelle d'une journée`)
  if (!photo) { dire(false, 'aucune photo réelle : le test de charge ne se fait pas'); return }

  note('⚠️ la MÊME photo sert aux N copies : ce qui est éprouvé est la FILE et la LATENCE '
    + 'à l\'échelle, pas la variété des écritures.')
  const decor = await semer(CHARGE)
  await ouvrirLesDepots(admin, decor.exerciceId)
  for (const exId of decor.instances) await ouvrirLesDepots(admin, exId)

  // Le dépôt des photos et la mise en file — comme l'écran de l'élève le fait,
  // par paquets, parce qu'une salle dépose en même temps et non l'un après l'autre.
  const t0 = Date.now()
  for (let i = 0; i < decor.depots.length; i += 10) {
    await Promise.all(decor.depots.slice(i, i + 10).map(async (d) => {
      const p = await deposerLaPhoto(d, photo.buffer)
      await enregistrerLesPhotos(admin, d.id, d.eleve_id, [p])
      await mettreLaTranscriptionEnFile(admin, d.id)
    }))
  }
  note(`${decor.depots.length} copies déposées et mises en file en ${((Date.now() - t0) / 1000).toFixed(0)} s`)

  // ⚠️ TRENTE-CINQ COPIES DANS UNE SALLE, CENT QUARANTE DANS UNE JOURNÉE
  //    (`02-` §6.D ; `07-` §7). Le premier chiffre est la SIMULTANÉITÉ : on
  //    lance par vagues de 35, comme une salle réelle.
  const VAGUE = 35
  const durees = []
  const echecs = []
  const t1 = Date.now()
  for (let i = 0; i < decor.depots.length; i += VAGUE) {
    const vague = decor.depots.slice(i, i + VAGUE)
    const tv = Date.now()
    // ⚠️ PAR LE CHEMIN RÉEL — `transcrireMaintenant`, celui que l'écran de
    //    l'élève appelle : il RÉCLAME le job, le traite, et LE CLÔT. Le premier
    //    passage de cette recette appelait `transcrireDepot` en direct : les 140
    //    copies étaient bien transcrites, mais leurs jobs restaient `en_attente`
    //    — « 140 copies oubliées en file ». Le rouge était juste, et il a trouvé
    //    mieux qu'un défaut de recette (cf. `reclamerJobs({ depotId })`).
    const rendus = await Promise.allSettled(vague.map(async (d) => {
      const t = Date.now()
      const { bilan, motif } = await transcrireMaintenant(admin, d.id)
      if (!bilan) throw new Error(motif ?? 'aucun bilan')
      return Date.now() - t
    }))
    for (const r of rendus) {
      if (r.status === 'fulfilled') durees.push(r.value)
      else echecs.push(r.reason instanceof Error ? r.reason.message : String(r.reason))
    }
    note(`vague ${Math.floor(i / VAGUE) + 1} — ${vague.length} copies en `
      + `${((Date.now() - tv) / 1000).toFixed(1)} s`)
  }
  const totalS = (Date.now() - t1) / 1000

  durees.sort((a, b) => a - b)
  const median = durees.length ? durees[Math.floor(durees.length / 2)] / 1000 : NaN
  const p95 = durees.length ? durees[Math.floor(durees.length * 0.95)] / 1000 : NaN
  console.log('')
  note(`${durees.length} copies transcrites, ${echecs.length} en échec`)
  note(`LATENCE PAR COPIE — médiane ${median.toFixed(1)} s · p95 ${p95.toFixed(1)} s · `
    + `max ${(durees[durees.length - 1] / 1000).toFixed(1)} s`)
  note(`durée totale ${totalS.toFixed(0)} s pour ${decor.depots.length} copies`)
  for (const e of echecs.slice(0, 5)) note(`⚠️ échec : ${e}`)

  // ⚠️ « SANS INTERVENTION » VEUT DIRE : aucun job repris à la main, aucun
  //    `echec_definitif`, aucune copie oubliée en file. LE COMPTE SE FAIT PAR
  //    REQUÊTE, À LA FIN (le « fait quand »).
  const ids = decor.depots.map((d) => d.id)
  const { data: jobs } = await admin.from('exercices_jobs')
    .select('depot_id, statut, echec_definitif, tentatives')
    .in('depot_id', ids).eq('etape', ETAPE_TRANSCRIPTION)
  const definitifs = (jobs ?? []).filter((j) => j.echec_definitif)
  const enFile = (jobs ?? []).filter((j) => j.statut === 'en_attente' || j.statut === 'en_cours')
  dire(definitifs.length === 0,
    `\`echec_definitif\` : ${definitifs.length} — « aucun echec_definitif » est la condition`)
  dire(enFile.length === 0,
    `copies oubliées en file : ${enFile.length} — « aucune copie oubliée en file »`)
  const aboutis = (jobs ?? []).filter((j) => j.statut === 'abouti')
  dire(aboutis.length === decor.depots.length,
    `${aboutis.length}/${decor.depots.length} jobs CLOS \`abouti\` — « sans intervention » veut `
    + 'dire qu\'aucun n\'a été repris à la main')
  const reprises = (jobs ?? []).filter((j) => j.tentatives > 1)
  dire(reprises.length === 0,
    `jobs repris (plus d'une tentative) : ${reprises.length}`)

  const { count: transcrites } = await admin.from('exercices_depots')
    .select('id', { count: 'exact', head: true })
    .in('id', ids).not('transcription_v1', 'is', null)
  dire(transcrites === decor.depots.length,
    `${transcrites}/${decor.depots.length} copies portent une transcription en base`)

  // Les paragraphes, à l'échelle : le découpage tient-il sur 140 copies ?
  const { data: textes } = await admin.from('exercices_depots')
    .select('transcription_v1').in('id', ids).not('transcription_v1', 'is', null)
  const nbBlocs = (textes ?? []).map((t) => blocs(t.transcription_v1).length)
  const unSeulBloc = nbBlocs.filter((n) => n <= 1).length
  note(`découpage : ${Math.min(...nbBlocs)} à ${Math.max(...nbBlocs)} bloc(s) par copie ; `
    + `${unSeulBloc} copie(s) en UN SEUL bloc`)

  // La facture réellement vue.
  const { data: cout } = await admin.from('api_couts')
    .select('cout, phase, depot_id').in('depot_id', ids)
  const total = (cout ?? []).reduce((s, l) => s + Number(l.cout), 0)
  const phasesNulles = (cout ?? []).filter((l) => l.phase === null).length
  note(`FACTURE : ${(cout ?? []).length} ligne(s) d'\`api_couts\`, ${total.toFixed(4)} $ `
    + `— soit ${((cout ?? []).length / decor.depots.length).toFixed(1)} appel(s) par copie`)
  dire(phasesNulles === (cout ?? []).length,
    'toutes les lignes portent `phase` NULL avec leur `depot_id` — la transcription n\'est pas un étage')

  // Le repli alphabétique (piège 51) — on le COMPTE, on ne le fait pas taire.
  const perimetres = await Promise.all(decor.depots.slice(0, 10).map((d) => lirePerimetre(admin, d.id)))
  const replis = perimetres.filter((p) => p?.replisAlphabetiques).length
  note(`repli alphabétique de cible : ${replis} sur les 10 premiers dépôts sondés `
    + '(la colonne `cible_primaire` est reportée au lot de correctifs)')
}

// ─────────────────────────────────────────────────────────────────────────────

async function nettoyer() {
  titre('I. Le nettoyage — tout ce que la recette a semé est retiré')
  const { data: classes } = await admin.from('classes').select('id').like('nom', `${MARQUE}%`)
  const classeIds = (classes ?? []).map((c) => c.id)
  const { data: exs } = await admin.from('exercices').select('id').in('classe_id', classeIds)
  const exIds = (exs ?? []).map((e) => e.id)
  const { data: deps } = await admin.from('exercices_depots').select('id, eleve_id').in('exercice_id', exIds)
  const depIds = (deps ?? []).map((d) => d.id)

  // Les FICHIERS d'abord — « des photos qui survivent à la classe qui les
  // portait sont un manquement, pas un détail » (piège 41).
  for (const d of deps ?? []) {
    const prefixe = `passation/${d.eleve_id}/${d.id}`
    const { data: objets } = await admin.storage.from('codex').list(prefixe)
    if (objets?.length) {
      await admin.storage.from('codex').remove(objets.map((o) => `${prefixe}/${o.name}`))
    }
  }
  if (depIds.length) {
    await admin.from('exercices_jobs').delete().in('depot_id', depIds)
    await admin.from('exercices_retours').delete().in('depot_id', depIds)
    await admin.from('exercices_metacognition').delete().in('depot_id', depIds)
    await admin.from('api_couts').delete().in('depot_id', depIds)
    await admin.from('exercices_depots').delete().in('id', depIds)
  }
  if (exIds.length) await admin.from('exercices').delete().in('id', exIds)
  if (classeIds.length) await admin.from('classes').delete().in('id', classeIds)

  const { count: reste } = await admin.from('exercices_depots')
    .select('id', { count: 'exact', head: true }).in('exercice_id', exIds.length ? exIds : ['-'])
  dire((reste ?? 0) === 0, 'aucun dépôt de recette ne survit')

  // Les portes, remises EXACTEMENT comme elles étaient.
  if (portesInitiales) {
    await poserPassationClasse(admin, portesInitiales.passationActive)
    await admin.from('scriptorium_params')
      .update({ exercices_actif: portesInitiales.exercicesActifs }).eq('id', 1)
    const apres = await lireLesPortes(admin)
    dire(apres.passationActive === portesInitiales.passationActive
      && apres.exercicesActifs === portesInitiales.exercicesActifs,
      `les interrupteurs sont remis : passation=${apres.passationActive}, `
      + `exercices=${apres.exercicesActifs}`)
  }
}

principal().catch(async (e) => {
  console.error('\n✗ RECETTE INTERROMPUE —', e)
  try { await nettoyer() } catch { /* le nettoyage est best-effort */ }
  process.exit(1)
})
