#!/usr/bin/env node
// ============================================================================
// decor-fragments-eleve.mjs — LE DÉCOR D'ÉCRAN DE FRAGMENTS (élève), sur Élo.
// ----------------------------------------------------------------------------
// Pourquoi : au 03/09/2026 la PRODUCTION ne porte AUCUN dépôt, AUCUN retour,
// AUCUN oral, AUCUN essai, AUCUNE synthèse (40 inscrits, 2 thèmes) ; le bac à
// sable en porte 2 dépôts et 2 analyses. Le handoff `design_handoff_fragments_
// eleve` dessine une archive de quatre semaines, un oral, un essai noté et un
// bilan de semestre : pour MONTRER le rendu avec des données réelles, il faut
// les poser. ⛔ BAC À SABLE SEULEMENT (contrôle sur la référence du projet).
//
// ⭐ Les textes des RETOURS ÉCRITS et des PISTES sont copiés des deux analyses
//    et des six pistes réelles du bac à sable (640 et 868 car., pistes de 350
//    à 410 car.) — jamais des textes courts. Ceux de l'oral, de l'essai et de la
//    synthèse n'existent NULLE PART : ils sont écrits ici, à la taille que les
//    prompts réclament (`utils/analyse-orale.ts`, `analyse-essai.ts`,
//    `synthese-semestre.ts`).
//
// ⭐⭐ LA MARQUE VA EN BASE, jamais seulement sur disque :
//    · `fragments_depots.commentaire_eleve = MARQUE` (jamais montré à l'élève) ;
//    · `fragments_oraux.storage_path = 'decor://' + MARQUE` (audio_supprime) ;
//    · `fragments_essai_depot_analyses.note20_justification = MARQUE` ;
//    · `fragments_syntheses.note20_justification = MARQUE`.
//    Les analyses, pistes et présentations sont des ENFANTS de lignes marquées.
//    Ce que la marque ne rend pas — l'état d'AVANT de deux lignes EMPRUNTÉES
//    (`retour_lu_at` de l'analyse de la semaine 2 d'Élo, `essai_actif` de son
//    thème) — vit au registre.
//
// ⚠️ Les semaines 3 et 4 sont dans le FUTUR au 03/09 : le décor y pose des
//    dépôts datés d'AVANT celui de la semaine 2 (créé le 20/08), publiés avant
//    le 26/08, pour que le retour de la semaine 2 reste LE DERNIER partout
//    (page élève et pastilles des onglets lisent « le plus récent »).
//
//   node scripts/recette/decor-fragments-eleve.mjs [--seme|--etat|--retire|--lien]
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))

if (!/aoakpxxlyvthzueaywna/.test(env.NEXT_PUBLIC_SUPABASE_URL ?? '')) {
  throw new Error('⛔ Ce décor ne se sème QUE sur le bac à sable (aoakpxxlyvthzueaywna).')
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const MARQUE = 'DECOR-FRAGMENTS-ELEVE'
const REGISTRE = 'scripts/recette/.decor-fragments-eleve.json'
const EMAIL = 'test@test.com'
const ELO = '89662514-ea26-4cc3-9708-c228eea6d136'
const INSC_TEST = '49084ce4-331d-48eb-9ba0-bb427dbe6696'
const CLASSE_TEST = '05b39f0c-2d53-47ac-822d-623e17772edd'
const SEMAINES_ARCHIVE = [1, 3, 4]     // la 2 est la semaine ouverte, dépôt réel d'Élo
const TITRE_ESSAI = 'Essai de mi-semestre — le doute comme méthode'

const a = (n) => process.argv.includes(`--${n}`)
const dire = (s) => console.log(s)
function verifie(quoi, { data, error }) {
  if (error) throw new Error(`${quoi} — ${error.code ?? ''} ${error.message}`)
  return data
}

// ── Textes écrits ici (oral, essai, synthèse) — à la taille des prompts ──────
const ORAL = {
  transcription: `Alors, euh, je vais vous parler du doute chez Descartes, dans la première Méditation. Du coup l'idée c'est que Descartes veut reconstruire tout le savoir, et pour ça il commence par douter de tout ce qu'il croyait savoir. Il y a trois étapes. D'abord les sens : les sens nous trompent parfois, donc on ne peut pas leur faire confiance complètement. Ensuite le rêve : quand je rêve, je crois que je suis éveillé, donc rien ne me prouve que je ne rêve pas maintenant. Et enfin le malin génie, qui pourrait me tromper même sur les mathématiques. Du coup ce qui m'a frappé, c'est que le doute n'est pas un but, c'est un outil : il sert à trouver quelque chose qui résiste. Et ce qui résiste, c'est le fait que je pense. Voilà, j'ai lu ça dans l'édition Garnier-Flammarion, et aussi un article de Ferdinand Alquié. Merci.`,
  commentaire_general: `Présentation claire et bien rythmée : tu as tenu ton auditoire jusqu'à la conclusion, et la structure en trois étapes du doute (les sens, le rêve, le malin génie) était annoncée puis suivie. Le principal mérite est d'avoir dit ce qui t'avait frappé — le doute comme outil et non comme but — plutôt que de réciter. L'axe de progrès est le débit : 146 mots par minute, c'est un peu rapide pour un public qui découvre Descartes, et les « du coup » (× 4) trahissent la précipitation.`,
  retour_integration: `On voit que tu as cité tes sources cette fois — l'édition et l'article d'Alquié — c'était la piste de la semaine 2. Tu n'as en revanche pas repris la distinction entre douter et nier que ton retour écrit te proposait de creuser.`,
  retour_pistes: `La piste « partir d'une vraie question personnelle » est mobilisée : « ce qui m'a frappé » ouvre bien sur une réflexion. Celle sur la confrontation de deux thèses ne l'est pas encore.`,
  retour_completude: `Les trois étapes du doute sont là, et la conclusion sur le cogito aussi. Il manque le pourquoi : à quoi sert de reconstruire tout le savoir ? Une phrase sur le projet de Descartes aurait ancré l'ensemble.`,
  retour_oral: `Annonce, fil, conclusion : la structure tient. Les phrases sont courtes et claires. Le débit est élevé et les tics de langage (« du coup » × 4, « euh » × 2) sont concentrés dans la première minute : respire avant de commencer.`,
}

const ESSAI = {
  consignes: `Sujet : « Peut-on douter de tout ? ». Vous vous appuierez sur la première Méditation et sur au moins un auteur qui lui répond. Copie manuscrite, deux heures.`,
  lettres: { structure: 'B', expression: 'A', argumentation: 'C', connaissances: 'B' },
  retour_structure: `Ton essai suit un plan lisible : une introduction qui pose la question, deux parties qui répondent oui puis non, une conclusion. Les transitions existent (« Pourtant, ce doute a une limite »), ce qui est déjà beaucoup. Ce qui manque, c'est la troisième étape : après avoir montré que le doute est possible puis qu'il s'arrête au cogito, tu ne dis pas ce que cela change pour la question posée. La conclusion répète l'introduction au lieu de la dépasser.\n\nLa longueur des parties est déséquilibrée : la première fait deux pages, la seconde une demi-page. Le lecteur sent que tu as manqué de temps — c'est une question d'entraînement, pas de compréhension.`,
  retour_expression: `La langue est précise et les phrases sont maîtrisées ; on lit ton essai sans effort. « Douter n'est pas nier : c'est suspendre » est une formule exacte et bien à toi. Les citations sont introduites correctement, avec la référence. Quelques répétitions du mot « chose » (× 7 sur la première page) que tu peux remplacer par le terme juste : objet, croyance, connaissance.`,
  retour_argumentation: `Tes exemples sont justes mais juxtaposés : les sens qui trompent, le rêve, le malin génie sont bien exposés, mais il manque le fil qui les relie en une thèse. Tu montres que Descartes doute de tout, tu ne discutes pas s'il le peut vraiment — or c'est la question. La réponse de Pascal, que tu cites en seconde partie, arrive comme une opinion contraire et non comme une objection à laquelle tu réponds. Travaille les transitions argumentatives : « si … alors », « or », « donc ».\n\nUn conseil concret : avant d'écrire, formule en une phrase ta propre réponse à la question. Tout l'essai doit servir cette phrase.`,
  retour_connaissances: `La première Méditation est connue avec précision : les trois étapes du doute, leur ordre, leur portée croissante. La référence à Pascal (« Le cœur a ses raisons ») est pertinente mais rapide ; celle à Hume, en une ligne, aurait mérité d'être développée ou retirée. Tu ne confonds jamais doute méthodique et scepticisme, ce qui est la distinction essentielle.`,
  retour_parcours: `Cet essai vient après cinq fragments sur le même thème, et cela se voit : la connaissance du texte que tu montres ici est celle que tes fragments ont construite semaine après semaine — la semaine 1 confondait encore douter et nier, la semaine 4 posait déjà la distinction. Ce qui n'a pas encore franchi le pas, c'est le passage de la réflexion personnelle (que tes fragments font bien) à l'argumentation construite (qu'un essai exige) : tes fragments explorent, ton essai doit démontrer.`,
  synthese: `Un essai honnête et bien écrit, qui montre une connaissance précise du texte et une vraie capacité à formuler. Son principal mérite est la clarté de la langue ; son principal axe de progrès est l'argumentation, qui juxtapose au lieu de relier. La distance parcourue depuis le premier fragment est nette : tu sais maintenant ce que douter veut dire chez Descartes, il te reste à apprendre à le discuter.`,
  note: 13,
}

const SYNTHESE = {
  synthese: `Au fil du semestre, tu es passé d'intuitions justes mais isolées à une vraie capacité à confronter des thèses. Tes premiers fragments, sur le doute cartésien, restaient descriptifs : tu exposais les trois étapes du doute sans dire ce que tu en pensais, et tes sources se limitaient au manuel. À partir de la semaine 3, la section RÉFLEXIONS s'est mise à poser des questions — « douter, est-ce nier ? » — et à y répondre à partir de tes lectures.\n\nLa citation des sources, longtemps fragile, est devenue un réflexe : l'édition, l'auteur, la page. L'oral de la semaine 3 a confirmé cette progression, avec une présentation structurée et un vrai point de vue. Le travail a été régulier — cinq fragments sur cinq réclamés, un seul en retard — et c'est cette régularité qui a rendu la progression possible.`,
  points_forts: `Curiosité et finesse des intuitions ; progrès constant sur les sources ; une langue claire, à l'écrit comme à l'oral.`,
  axes_progres: `Structurer l'argument : une thèse, une objection, une réponse. Confronter deux auteurs plutôt que d'en illustrer un seul.`,
  note: 14,
}

// ── Contrôle d'entrée ────────────────────────────────────────────────────────
async function releve() {
  const depots = verifie('dépôts marqués', await admin.from('fragments_depots').select('id, semaine_id').eq('commentaire_eleve', MARQUE))
  const oraux = verifie('oraux marqués', await admin.from('fragments_oraux').select('id, presentation_id').eq('storage_path', `decor://${MARQUE}`))
  const essais = verifie('analyses d’essai marquées', await admin.from('fragments_essai_depot_analyses').select('id, depot_id').eq('note20_justification', MARQUE))
  const syntheses = verifie('synthèses marquées', await admin.from('fragments_syntheses').select('id').eq('note20_justification', MARQUE))
  return { depots, oraux, essais, syntheses }
}

async function etat() {
  const r = await releve()
  dire(`dépôts marqués : ${r.depots.length} · oraux : ${r.oraux.length} · analyses d'essai : ${r.essais.length} · synthèses : ${r.syntheses.length}`)
  dire(`registre : ${fs.existsSync(REGISTRE) ? 'présent' : 'absent'}`)
  return r
}

// ── Semis ────────────────────────────────────────────────────────────────────
async function seme() {
  const r = await releve()
  if (fs.existsSync(REGISTRE) || r.depots.length || r.oraux.length || r.essais.length || r.syntheses.length) {
    throw new Error('⛔ Un décor est déjà en place (registre ou lignes marquées). Condition de reprise : `--retire` d’abord.')
  }
  const sem = verifie('semestre actif', await admin.from('semesters').select('id').eq('is_active', true).maybeSingle())
  const semaines = verifie('semaines', await admin.from('fragments_semaines').select('id, numero')
    .eq('semestre_id', sem.id).in('numero', SEMAINES_ARCHIVE))
  if (semaines.length !== SEMAINES_ARCHIVE.length) throw new Error(`semaines ${SEMAINES_ARCHIVE} introuvables`)
  const parNumero = Object.fromEntries(semaines.map((s) => [s.numero, s.id]))

  // Les textes RÉELS du bac à sable (2 analyses, 6 pistes).
  const reelles = verifie('analyses réelles', await admin.from('fragments_analyses')
    .select('id, commentaire_general, retour_progres, retour_langue, retour_style, retour_contenu, transcription, note_decouvertes, note_sources, note_reflexions')
    .in('statut', ['publiee', 'generee']).order('created_at'))
  const pistesReelles = verifie('pistes réelles', await admin.from('fragments_pistes').select('contenu').order('created_at'))
  if (reelles.length < 2 || pistesReelles.length < 6) throw new Error('il faut 2 analyses et 6 pistes réelles à copier')

  const registre = { marque: MARQUE, seme_le: new Date().toISOString(), depots: [], analyses: [], pistes: [], presentation: null, oral: null, analyse_orale: null, essai: null, essai_classe: null, essai_depot: null, essai_analyse: null, synthese: null, emprunts: {} }
  const note = () => fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))

  // 1. Archive : dépôts + analyses publiées + pistes, tous ANTÉRIEURS au dépôt réel de la semaine 2.
  const notes = { 1: [1, 1, 2], 3: [2, 3, 3], 4: [3, 2, 4] }
  const jours = { 1: '2026-08-10', 3: '2026-08-14', 4: '2026-08-18' }
  for (const numero of SEMAINES_ARCHIVE) {
    const src = reelles[numero % 2]
    const depot = verifie(`dépôt S${numero}`, await admin.from('fragments_depots').insert({
      eleve_id: ELO, inscription_id: INSC_TEST, semaine_id: parNumero[numero],
      statut: numero === 4 ? 'en_retard' : 'depose', commentaire_eleve: MARQUE,
      created_at: `${jours[numero]}T14:00:00Z`, updated_at: `${jours[numero]}T14:00:00Z`,
    }).select('id').single())
    registre.depots.push(depot.id); note()
    const [d, s, rf] = notes[numero]
    const analyse = verifie(`analyse S${numero}`, await admin.from('fragments_analyses').insert({
      depot_id: depot.id, statut: 'publiee',
      transcription: src.transcription, commentaire_general: src.commentaire_general,
      retour_progres: numero === 1 ? null : src.retour_progres,
      retour_langue: src.retour_langue, retour_style: src.retour_style, retour_contenu: src.retour_contenu,
      note_decouvertes: d, note_sources: s, note_reflexions: rf,
      publiee_at: `${jours[numero]}T20:00:00Z`, retour_lu_at: `${jours[numero]}T21:00:00Z`,
      created_at: `${jours[numero]}T19:00:00Z`, updated_at: `${jours[numero]}T20:00:00Z`,
    }).select('id').single())
    registre.analyses.push(analyse.id); note()
    const lot = pistesReelles.slice(numero === 1 ? 0 : 3, numero === 1 ? 3 : 6)
    const pistes = verifie(`pistes S${numero}`, await admin.from('fragments_pistes').insert(lot.map((p, i) => ({
      analyse_id: analyse.id, eleve_id: ELO, contenu: p.contenu,
      statut: i === 0 ? 'suivie' : 'proposee', est_rappel: numero !== 1 && i === 2,
      created_at: `${jours[numero]}T20:0${i}:00Z`,
    }))).select('id'))
    registre.pistes.push(...pistes.map((p) => p.id)); note()
    dire(`✓ semaine ${numero} : dépôt, analyse (${src.commentaire_general.length} car.), ${pistes.length} pistes`)
  }

  // 2. Le retour de la semaine 2 (réel, déjà lu) redevient À LIRE : c'est le gate.
  const s2 = verifie('semaine 2', await admin.from('fragments_semaines').select('id').eq('semestre_id', sem.id).eq('numero', 2).single())
  const depot2 = verifie('dépôt réel S2', await admin.from('fragments_depots').select('id').eq('inscription_id', INSC_TEST).eq('semaine_id', s2.id).single())
  const an2 = verifie('analyse réelle S2', await admin.from('fragments_analyses').select('id, retour_lu_at').eq('depot_id', depot2.id).eq('statut', 'publiee').single())
  registre.emprunts.analyse_s2 = { id: an2.id, retour_lu_at: an2.retour_lu_at }; note()
  verifie('emprunt retour_lu_at', await admin.from('fragments_analyses').update({ retour_lu_at: null }).eq('id', an2.id))
  dire(`✓ semaine 2 : retour_lu_at emprunté (${an2.retour_lu_at}) → null (gate actif)`)

  // 3. Oral (semaine 1) : présentation, oral sans audio, analyse publiée.
  const pres = verifie('présentation', await admin.from('fragments_presentations').insert({
    eleve_id: ELO, inscription_id: INSC_TEST, semaine_id: parNumero[1], statut: 'presente', created_at: '2026-08-11T15:00:00Z',
  }).select('id').single())
  registre.presentation = pres.id; note()
  const oral = verifie('oral', await admin.from('fragments_oraux').insert({
    presentation_id: pres.id, eleve_id: ELO, inscription_id: INSC_TEST,
    storage_path: `decor://${MARQUE}`, audio_supprime: true, statut: 'publie',
    transcription: ORAL.transcription, duree_secondes: 252, nb_mots: 612, debit_mots_minute: 146,
  }).select('id').single())
  registre.oral = oral.id; note()
  const ao = verifie('analyse orale', await admin.from('fragments_analyses_orales').insert({
    oral_id: oral.id, commentaire_general: ORAL.commentaire_general, retour_integration: ORAL.retour_integration,
    retour_pistes: ORAL.retour_pistes, retour_completude: ORAL.retour_completude, retour_oral: ORAL.retour_oral,
    note_contenu: 3, note_structure: 3, note_expression: 4, publiee_at: '2026-08-12T18:00:00Z',
  }).select('id').single())
  registre.analyse_orale = ao.id; note()
  dire('✓ oral : présentation, oral (sans audio), analyse publiée')

  // 4. Essai : épreuve, liaison classe Test, dépôt d'Élo, analyse publiée NON LUE (gate), thème essai_actif.
  const theme = verifie('thème', await admin.from('fragments_themes').select('id, essai_actif').eq('inscription_id', INSC_TEST).eq('semestre_id', sem.id).single())
  registre.emprunts.theme = { id: theme.id, essai_actif: theme.essai_actif }; note()
  verifie('emprunt essai_actif', await admin.from('fragments_themes').update({ essai_actif: true }).eq('id', theme.id))
  const ep = verifie('épreuve', await admin.from('fragments_essais_epreuves').insert({
    titre: TITRE_ESSAI, date_essai: '2026-08-19', duree_minutes: 120, consignes: ESSAI.consignes, depots_ouverts: true, semestre_id: sem.id,
  }).select('id').single())
  registre.essai = ep.id; note()
  const ec = verifie('essai × classe', await admin.from('fragments_essais_classes').insert({
    essai_id: ep.id, classe_id: CLASSE_TEST, date_essai: '2026-08-19', depots_ouverts: true,
  }).select('id').single())
  registre.essai_classe = ec.id; note()
  const ed = verifie('dépôt d’essai', await admin.from('fragments_essai_depots').insert({
    essai_id: ep.id, eleve_id: ELO, inscription_id: INSC_TEST, depose_par: 'eleve',
  }).select('id').single())
  registre.essai_depot = ed.id; note()
  const ea = verifie('analyse d’essai', await admin.from('fragments_essai_depot_analyses').insert({
    depot_id: ed.id, eleve_id: ELO, statut: 'publiee',
    lettre_structure: ESSAI.lettres.structure, lettre_expression: ESSAI.lettres.expression,
    lettre_argumentation: ESSAI.lettres.argumentation, lettre_connaissances: ESSAI.lettres.connaissances,
    retour_structure: ESSAI.retour_structure, retour_expression: ESSAI.retour_expression,
    retour_argumentation: ESSAI.retour_argumentation, retour_connaissances: ESSAI.retour_connaissances,
    retour_parcours: ESSAI.retour_parcours, synthese: ESSAI.synthese,
    note20_suggeree: 12.5, note20_min: 11, note20_max: 14, note20_justification: MARQUE,
    note20_validee: ESSAI.note, note_visible_eleve: true, publiee_at: '2026-08-21T18:00:00Z', retour_lu_at: null,
  }).select('id').single())
  registre.essai_analyse = ea.id; note()
  dire('✓ essai : épreuve, liaison Test, dépôt, analyse publiée (13/20, non lue)')

  // 5. Synthèse de semestre publiée, note visible.
  const sy = verifie('synthèse', await admin.from('fragments_syntheses').insert({
    eleve_id: ELO, inscription_id: INSC_TEST, semestre_id: sem.id, statut: 'publiee',
    synthese: SYNTHESE.synthese, points_forts: SYNTHESE.points_forts, axes_progres: SYNTHESE.axes_progres,
    note20_suggeree: 13.5, note20_min: 12, note20_max: 15, note20_justification: MARQUE,
    note20_validee: SYNTHESE.note, note_visible_eleve: true, publiee_at: '2026-08-22T18:00:00Z',
  }).select('id').single())
  registre.synthese = sy.id; note()
  dire('✓ synthèse : publiée (14/20)')
  dire(`registre écrit : ${REGISTRE}`)
}

// ── Retrait ──────────────────────────────────────────────────────────────────
async function retire() {
  const r = await releve()
  const registre = fs.existsSync(REGISTRE) ? JSON.parse(fs.readFileSync(REGISTRE, 'utf-8')) : null
  // ⛔ L'ORDRE COMPTE : les enfants d'abord, jamais de confiance en une cascade.
  const analyseIds = [...new Set([...(registre?.analyses ?? [])])]
  const depotIds = [...new Set([...r.depots.map((d) => d.id), ...(registre?.depots ?? [])])]
  if (depotIds.length) {
    const ans = verifie('analyses des dépôts marqués', await admin.from('fragments_analyses').select('id').in('depot_id', depotIds))
    for (const x of ans) analyseIds.push(x.id)
  }
  if (analyseIds.length) {
    verifie('pistes', await admin.from('fragments_pistes').delete().in('analyse_id', analyseIds))
    verifie('analyses', await admin.from('fragments_analyses').delete().in('id', analyseIds))
  }
  if (depotIds.length) verifie('dépôts', await admin.from('fragments_depots').delete().in('id', depotIds))
  dire(`✓ archive retirée : ${depotIds.length} dépôts, ${analyseIds.length} analyses`)

  const oralIds = [...new Set([...r.oraux.map((o) => o.id), ...(registre?.oral ? [registre.oral] : [])])]
  const presIds = [...new Set([...r.oraux.map((o) => o.presentation_id), ...(registre?.presentation ? [registre.presentation] : [])])]
  if (oralIds.length) {
    verifie('analyses orales', await admin.from('fragments_analyses_orales').delete().in('oral_id', oralIds))
    verifie('oraux', await admin.from('fragments_oraux').delete().in('id', oralIds))
  }
  if (presIds.length) verifie('présentations', await admin.from('fragments_presentations').delete().in('id', presIds))
  dire(`✓ oral retiré : ${oralIds.length}`)

  const eaIds = [...new Set([...r.essais.map((e) => e.id), ...(registre?.essai_analyse ? [registre.essai_analyse] : [])])]
  const edIds = [...new Set([...r.essais.map((e) => e.depot_id), ...(registre?.essai_depot ? [registre.essai_depot] : [])])]
  let epIds = registre?.essai ? [registre.essai] : []
  if (edIds.length) {
    const eds = verifie('dépôts d’essai', await admin.from('fragments_essai_depots').select('essai_id').in('id', edIds))
    epIds = [...new Set([...epIds, ...eds.map((e) => e.essai_id)])]
  }
  if (eaIds.length) verifie('analyses d’essai', await admin.from('fragments_essai_depot_analyses').delete().in('id', eaIds))
  if (edIds.length) verifie('dépôts d’essai', await admin.from('fragments_essai_depots').delete().in('id', edIds))
  if (epIds.length) {
    verifie('essai × classes', await admin.from('fragments_essais_classes').delete().in('essai_id', epIds))
    verifie('épreuves', await admin.from('fragments_essais_epreuves').delete().in('id', epIds))
  }
  dire(`✓ essai retiré : ${epIds.length} épreuve(s)`)

  const syIds = [...new Set([...r.syntheses.map((s) => s.id), ...(registre?.synthese ? [registre.synthese] : [])])]
  if (syIds.length) verifie('synthèses', await admin.from('fragments_syntheses').delete().in('id', syIds))
  dire(`✓ synthèse retirée : ${syIds.length}`)

  // Les emprunts reviennent à leur valeur d'avant.
  if (registre?.emprunts?.analyse_s2) {
    const { id, retour_lu_at } = registre.emprunts.analyse_s2
    verifie('restitution retour_lu_at', await admin.from('fragments_analyses').update({ retour_lu_at }).eq('id', id))
    dire(`✓ semaine 2 : retour_lu_at restitué (${retour_lu_at})`)
  }
  if (registre?.emprunts?.theme) {
    const { id, essai_actif } = registre.emprunts.theme
    verifie('restitution essai_actif', await admin.from('fragments_themes').update({ essai_actif }).eq('id', id))
    dire(`✓ thème : essai_actif restitué (${essai_actif})`)
  }
  if (registre) fs.unlinkSync(REGISTRE)
  const apres = await releve()
  const reste = apres.depots.length + apres.oraux.length + apres.essais.length + apres.syntheses.length
  dire(reste === 0 ? '✓ plus aucune ligne marquée' : `⛔ il reste ${reste} ligne(s) marquée(s)`)
}

async function lien() {
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL })
  if (error) throw new Error(`lien — ${error.message}`)
  const next = encodeURIComponent(`/eleve/modules/fragments-erudition?inscription=${INSC_TEST}`)
  dire(`http://localhost:3000/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=${next}`)
}

if (a('etat')) await etat()
else if (a('retire')) await retire()
else if (a('lien')) await lien()
else await seme()
