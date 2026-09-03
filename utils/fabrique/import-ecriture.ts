/* eslint-disable @typescript-eslint/no-explicit-any --
 * Ce fichier écrit CE QUE LE CONTRÔLE A LAISSÉ PASSER, en relisant le JSON
 * déposé — une entrée non fiable, dont le typage n'ajouterait aucune garantie :
 * la garantie est le contrôle, qui a déjà tourné (`verifie-import.ts`). S'y
 * ajoutent les lignes rendues par Supabase, dont le client ne connaît pas le
 * schéma. La dérogation s'arrête à ce fichier. */
// ============================================================================
// C4 · L8 — CE QUE L'IMPORT ÉCRIT, une fois le contrôle rendu.
// ----------------------------------------------------------------------------
// « TOUTE ENTRÉE IMPORTÉE — bloquée ou non — ENTRE INACTIVE : ni assignée ni
//   servie, elle attend sa validation EN FILE, en masse ou une à une ; l'entrée
//   bloquée y attend EN PLUS la levée de son blocage » (`08-` §7 ; piège 21).
//
// « Sur le fil du statut, ça tombe juste : un exercice importé NAÎT
//   `a_concevoir` et PASSE `concu` À SA VALIDATION EN FILE — la validation EST
//   le geste de conception, pour lui » (`07-` §5 ; piège 24).
//
// ⚠️ LE TEXTE ENTRE AU CORPUS DU SCRIPTORIUM, et il n'a qu'un domicile :
//    `scriptorium_contenus.texte_extrait`. « Ce que tu stockes et ce que tu sers
//    est EXACTEMENT ce que le fichier porte », et l'empreinte se calcule sur le
//    contenu exact, OCTET POUR OCTET, sans aucune normalisation (piège 13).
//    ⚠️ C'est une table que le RAG et les élèves lisent : l'écriture y est un
//    ajout de ligne, jamais une migration — mais elle est à connaître.
//
// ⚠️ NI CLASSE, NI FENÊTRE, NI ASSIGNATION : « un exercice importé n'est assigné
//    à personne » (`08-` §6 ; piège 12). Elles se posent à l'écran, à la
//    conception ou à l'édition.
// ============================================================================

import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { controleImport, type DejaEnBase, type VerdictImport } from './verifie-import'
import { chargerDoctrineDepuisBase } from './doctrine'

/** L'empreinte du CONTENU EXACT, octet pour octet. AUCUNE normalisation —
 *  « deux textes qui ne diffèrent que d'une espace sont DEUX TEXTES, et leurs
 *  coordonnées restent justes » (piège 13). */
export function empreinteContenu(contenu: string): string {
  return createHash('sha256').update(Buffer.from(contenu, 'utf-8')).digest('hex')
}

/**
 * ⭐⭐ C4-L16 — CE QUE LE CHAMP `cours` DU FICHIER DEVIENT EN BASE : les
 * **QUATRE** états de `cours_etat` (`08-` §2, format 1.3 ; `01-` §4 couche 4).
 *
 * ⚠️⚠️ C'ÉTAIT LA MOITIÉ INVISIBLE DU LOT, ET ELLE ÉTAIT ÉCRITE DEUX FOIS.
 *   Avant ce lot, les deux sites d'écriture — les textes et les sujets —
 *   portaient chacun leur copie de la règle : `cours === 'generique' ?
 *   'generique' : (Array.isArray(cours) && cours.length > 0) ? 'liste' :
 *   'aucun'`. **Une chaîne `"notions"` n'est ni `'generique'` ni un tableau :
 *   elle sortait en `'aucun'` — « JAMAIS SERVABLE » —, en silence.** Le contrôle
 *   d'import aurait dit `IMPORTABLE`, l'écran aurait affiché quinze sujets, et
 *   les quinze auraient été morts. ⛔ **Le `CHECK` élargi ne rattrape rien ici**
 *   : une contrainte ne se déclenche que sur une valeur écrite, et le code
 *   n'écrivait jamais celle-là.
 *
 * ⭐ D'où **UNE SEULE fonction, appelée aux deux sites** : deux copies d'une
 *   règle à quatre branches divergeraient au premier amendement, et le défaut
 *   qu'on répare ici est exactement celui-là, à trois branches.
 *
 * ⚠️ La forme, elle, a déjà été contrôlée (refus n° 5) : ce qui arrive ici est
 *   bien formé. Le repli `'aucun'` couvre l'absence, le `null` et la liste vide
 *   — « l'absence a un sens FORT : elle ne dit pas "pas encore rempli", elle dit
 *   JAMAIS SERVI ».
 */
export function etatDuRattachement(cours: unknown): 'generique' | 'liste' | 'aucun' | 'notions' {
  if (cours === 'generique') return 'generique'
  if (cours === 'notions') return 'notions'
  if (Array.isArray(cours) && cours.length > 0) return 'liste'
  return 'aucun'
}

export interface ResultatImport {
  importId: string | null
  verdict: VerdictImport
  /** Ce qui est ENTRÉ, banque par banque. */
  entres: Record<string, number>
  /** Ce qui n'est pas entré parce qu'il était REFUSÉ, banque par banque. */
  refuses: Record<string, number>
  /** Ce qui est entré BLOQUÉ, banque par banque. */
  bloques: Record<string, number>
  /** Ce que l'écriture elle-même a empêché — collision d'empreinte, erreur SQL. */
  incidents: string[]
}

const BANQUES = ['textes', 'sujets', 'materiaux', 'exercices', 'demonstrations'] as const

/** Ce que la base porte déjà : les ids, les références validées, les longueurs. */
export async function lireDejaEnBase(admin: SupabaseClient): Promise<DejaEnBase> {
  const [t, s, m, e, dm] = await Promise.all([
    admin.from('exercices_textes')
      .select('id_import, contenu_id, reference_id, exercices_references(validee_at), scriptorium_contenus(texte_extrait)'),
    admin.from('exercices_sujets').select('id_import').not('id_import', 'is', null),
    admin.from('exercices_materiaux').select('id_import').not('id_import', 'is', null),
    admin.from('exercices').select('id_import').not('id_import', 'is', null),
    admin.from('exercices_demonstrations').select('id_import').not('id_import', 'is', null),
  ])
  const textes = new Set<string>()
  const textesValides = new Set<string>()
  const longueurTexte: Record<string, number> = {}
  for (const r of (t.data ?? []) as Array<Record<string, any>>) {
    const id = r.id_import as string
    textes.add(id)
    if (r.exercices_references?.validee_at) textesValides.add(id)
    longueurTexte[id] = String(r.scriptorium_contenus?.texte_extrait ?? '').length
  }
  return {
    textes, textesValides, longueurTexte,
    sujets: new Set((s.data ?? []).map((x: any) => x.id_import as string)),
    materiaux: new Set((m.data ?? []).map((x: any) => x.id_import as string)),
    exercices: new Set((e.data ?? []).map((x: any) => x.id_import as string)),
    demonstrations: new Set((dm.data ?? []).map((x: any) => x.id_import as string)),
  }
}

/**
 * Le dépôt : contrôler, puis écrire ce qui entre.
 *
 * « Le REFUS est PAR ENTRÉE, et le rapport les nomme » — l'entrée refusée
 * n'entre pas, les autres entrent. « Deux exceptions portent sur le fichier
 * entier : le refus n° 1, et le n° 2 à la racine » (`08-` §7).
 */
export async function deposerFichierImport(
  admin: SupabaseClient, brut: unknown, nomFichier: string, deposePar: string | null,
): Promise<ResultatImport> {
  const doctrine = await chargerDoctrineDepuisBase(admin as never)
  const deja = await lireDejaEnBase(admin)
  const verdict = controleImport(brut, doctrine, deja)

  const entres: Record<string, number> = {}
  const refuses: Record<string, number> = {}
  const bloques: Record<string, number> = {}
  for (const b of BANQUES) { entres[b] = 0; refuses[b] = 0; bloques[b] = 0 }
  const incidents: string[] = []

  const b: Record<string, any> = (typeof brut === 'object' && brut !== null) ? brut as any : {}

  // La trace du dépôt. `genere_le` et `genere_par` « ne servent qu'à la trace —
  // AUCUNE TABLE NE LES REÇOIT » (`08-` §1) : ils vivent ici, et nulle part
  // ailleurs — c'est la trace même.
  const { data: ligneImport, error: eImport } = await admin.from('exercices_imports').insert({
    nom_fichier: nomFichier,
    format: typeof b.format === 'string' ? b.format : null,
    version: typeof b.version === 'string' ? b.version : null,
    genere_le: typeof b.genere_le === 'string' ? b.genere_le : null,
    genere_par: typeof b.genere_par === 'string' ? b.genere_par : null,
    verdict: verdict.fichierRefuse ? 'refuse' : 'importable',
    rapport: {
      refus: verdict.refus, blocages: verdict.blocages,
      signalements: verdict.signalements, annonces: verdict.annonces,
      ignores: verdict.ignores,
    },
    depose_par: deposePar,
  }).select('id').single()
  if (eImport) {
    return { importId: null, verdict, entres, refuses, bloques,
      incidents: [`Le dépôt n'a pas pu être journalisé : ${eImport.message}`] }
  }
  const importId = ligneImport.id as string

  // Le fichier entier ne passe pas : rien n'entre, et le rapport le dit.
  if (verdict.fichierRefuse) return { importId, verdict, entres, refuses, bloques, incidents }

  // ⚠️ UN BLOCAGE QUI EN APPELLE UN AUTRE, et le contrôle hors ligne ne peut pas
  // le voir. Le blocage n° 2 fait entrer le texte avec « `validee` FORCÉE À
  // `false`, QUOI QUE LE FICHIER DÉCLARE » (`08-` §7.2 ; piège 14). Or le
  // contrôle lit le `validee` DU FICHIER pour le blocage n° 1 : une instance
  // bâtie sur ce texte-là passerait sans blocage, et la file la laisserait
  // valider sur une référence non relue — ce que le `02-` §6 A interdit.
  // Le contrôle porté reste FIDÈLE au script qui fait foi (piège 22) ; c'est
  // l'ÉCRITURE, qui connaît l'état écrit, qui referme la porte. Même motif que
  // le piège 10 : « le contrôle hors ligne ne voit que le fichier, le tien voit
  // les deux ».
  const textesForcesNonValides = new Set<string>()
  for (const t of (Array.isArray(b.textes) ? b.textes : [])) {
    if (!t || typeof t !== 'object') continue
    const id = String(t.id ?? '')
    const v = verdict.entrees[`textes|${id}`]
    if ((v?.blocages.length ?? 0) > 0 || !t.validee) textesForcesNonValides.add(id)
  }
  const blocagesHerites = new Map<string, string[]>()
  for (const e of (Array.isArray(b.exercices) ? b.exercices : [])) {
    if (!e || typeof e !== 'object') continue
    const vus = new Set<string>()
    for (const [mat, role] of [[e.materiau_source, 'source'], [e.materiau_cible, 'cible']] as Array<[any, string]>) {
      if (!(mat && mat.provenance === 'texte_auteur')) continue
      const cible = String(mat.texte ?? '')
      if (!textesForcesNonValides.has(cible) || vus.has(cible)) continue
      vus.add(cible)
      const cle = `exercices|${String(e.id ?? '')}`
      const deja0 = verdict.entrees[cle]?.blocages ?? []
      const message = `[B1] exercice ${e.id} : le matériau ${role} renvoie à la référence `
        + `non validée « ${cible} » — sa décomposition est bloquée, donc \`validee\` est `
        + 'forcée à `false` : aucune instance ne tourne dessus'
      if (!deja0.some((x) => x.includes(cible))) {
        blocagesHerites.set(cle, [...(blocagesHerites.get(cle) ?? []), message])
      }
    }
  }
  for (const [cle, msgs] of blocagesHerites) {
    const v = (verdict.entrees[cle] ??= { refus: [], blocages: [], signalements: [] })
    v.blocages.push(...msgs)
    verdict.blocages.push(...msgs)
  }

  const etat = (banque: string, id: unknown) => {
    const v = verdict.entrees[`${banque}|${String(id)}`]
    return {
      refuse: (v?.refus.length ?? 0) > 0,
      bloque: (v?.blocages.length ?? 0) > 0,
      blocages: v?.blocages ?? [],
      signalements: v?.signalements ?? [],
    }
  }
  const ignore = (banque: string, id: unknown) =>
    (verdict.ignores[banque] ?? []).includes(String(id))

  // ── 1. Les textes ─────────────────────────────────────────────────────────
  // Le texte entre au CORPUS DU SCRIPTORIUM ; sa décomposition entre en
  // `exercices_references` ; l'identité d'import et le rattachement entrent en
  // `exercices_textes`.
  const idTexte = new Map<string, string>()   // id d'import → id de plateforme
  for (const t of (Array.isArray(b.textes) ? b.textes : [])) {
    if (!t || typeof t !== 'object') continue
    const id = String(t.id ?? '')
    if (ignore('textes', id)) continue
    const st = etat('textes', id)
    if (st.refuse) { refuses.textes += 1; continue }

    const contenu = String(t.contenu ?? '')
    const empreinte = empreinteContenu(contenu)

    // « Unicité : un texte ne se décompose jamais deux fois » (§1.1). Une
    // collision d'empreinte dit que le texte est déjà là, sous un autre `id` —
    // on ne duplique pas, et on le dit.
    const { data: deja0 } = await admin.from('exercices_textes')
      .select('id, id_import').eq('empreinte', empreinte).maybeSingle()
    if (deja0) {
      incidents.push(`texte ${id} : ce contenu est déjà décomposé sous l'identité `
        + `« ${deja0.id_import} » — un texte ne se décompose jamais deux fois.`)
      continue
    }

    const { data: contenuRow, error: eC } = await admin.from('scriptorium_contenus').insert({
      type: 'texte', titre: String(t.titre ?? ''), auteur: String(t.auteur ?? ''),
      texte_extrait: contenu, tags: [], created_by: deposePar,
    }).select('id').single()
    if (eC) { incidents.push(`texte ${id} : ${eC.message}`); continue }

    // « `validee: true` au fichier est une validation faite AU GÉNÉRATEUR, dans
    // son écran de lecture annotée : la plateforme la reçoit telle quelle APRÈS
    // LE CONTRÔLE » — et le blocage n° 2 la force à `false`, quoi que le fichier
    // déclare (`08-` §2 ; piège 14).
    const valide = !!t.validee && !st.bloque
    // ⚠️ CE QUI SUIT PEUT ÉCHOUER, et le texte est DÉJÀ au corpus du Scriptorium
    //   — la table que le RAG et les écrans du Scriptorium lisent. On défait ce
    //   qu'on a créé avant de passer au suivant : il ne doit rester AUCUNE trace
    //   d'un texte qui n'est pas entré.
    const defaire = async (motif: string) => {
      await admin.from('scriptorium_contenus').delete().eq('id', contenuRow.id)
      incidents.push(`texte ${id} : ${motif} — rien n'est resté au corpus.`)
    }

    const { data: refRow, error: eR } = await admin.from('exercices_references').insert({
      source_contenu_id: contenuRow.id,
      localisation: String(t.reference ?? ''),
      contenu: t.decomposition ?? {},
      empreinte,
      // « `validee_par` / `validee_at` se remplissent AU DÉPÔT — celui qui
      // dépose, le moment du dépôt » (piège 14).
      validee_par: valide ? deposePar : null,
      validee_at: valide ? new Date().toISOString() : null,
    }).select('id').single()
    if (eR) { await defaire(eR.message); continue }

    const coursEtat = etatDuRattachement(t.cours)
    const plan = (t.plan_de_lecture && typeof t.plan_de_lecture === 'object')
      ? t.plan_de_lecture as Record<string, unknown> : null

    const { data: texteRow, error: eT } = await admin.from('exercices_textes').insert({
      id_import: id, import_id: importId,
      contenu_id: contenuRow.id, reference_id: refRow.id,
      auteur: String(t.auteur ?? ''), titre: String(t.titre ?? ''),
      reference: String(t.reference ?? ''), empreinte,
      cours_etat: coursEtat,
      // ⭐ C4-L16 — `notions` sur un TEXTE : « même champ, même forme et même
      //   rôle qu'au §3 » (`08-` §2). Il n'a d'effet que si `cours_etat` vaut
      //   `'notions'`, mais il s'écrit toujours : c'est la donnée du fichier.
      notions: Array.isArray(t.notions) ? t.notions : [],
      plan_livre_declare: plan ? String(plan.livre) : null,
      plan_semaine: plan ? Number(plan.semaine) : null,
      statut: 'a_valider', bloque: st.bloque, blocages: st.blocages,
    }).select('id').single()
    if (eT) {
      await admin.from('exercices_references').delete().eq('id', refRow.id)
      await defaire(eT.message)
      continue
    }
    idTexte.set(id, texteRow.id as string)
    if (coursEtat === 'liste') {
      // Les cours DÉCLARÉS par le fichier : sans eux, l'onglet du rattachement
      // n'a rien à apparier, et le texte reste « jamais servable » en silence.
      const { error: eC2 } = await admin.from('exercices_textes_cours').insert(
        (t.cours as string[]).map((c) => ({ texte_id: texteRow.id, cours_declare: c })))
      if (eC2) {
        incidents.push(`texte ${id} : les cours déclarés n'ont pas été enregistrés `
          + `(${eC2.message}) — le rattachement est à refaire à la main.`)
      }
    }
    entres.textes += 1
    if (st.bloque) bloques.textes += 1
  }
  // Les textes d'un dépôt antérieur restent visables.
  {
    const { data } = await admin.from('exercices_textes').select('id, id_import')
    for (const r of (data ?? []) as Array<Record<string, any>>) {
      if (!idTexte.has(r.id_import)) idTexte.set(r.id_import, r.id)
    }
  }

  // ── 2. Les sujets ─────────────────────────────────────────────────────────
  const idSujet = new Map<string, string>()
  for (const s of (Array.isArray(b.sujets) ? b.sujets : [])) {
    if (!s || typeof s !== 'object') continue
    const id = String(s.id ?? '')
    if (ignore('sujets', id)) continue
    const st = etat('sujets', id)
    if (st.refuse) { refuses.sujets += 1; continue }
    const coursEtat = etatDuRattachement(s.cours)
    const { data, error } = await admin.from('exercices_sujets').insert({
      id_import: id, import_id: importId,
      enonce: String(s.enonce ?? ''), forme: String(s.forme ?? ''),
      notions: Array.isArray(s.notions) ? s.notions : [],
      texte_id: s.texte ? (idTexte.get(String(s.texte)) ?? null) : null,
      cours_etat: coursEtat, statut: 'a_valider',
      bloque: st.bloque, blocages: st.blocages,
    }).select('id').single()
    if (error) { incidents.push(`sujet ${id} : ${error.message}`); continue }
    idSujet.set(id, data.id as string)
    if (coursEtat === 'liste') {
      const { error: eC2 } = await admin.from('exercices_sujets_cours').insert(
        (s.cours as string[]).map((c) => ({ sujet_id: data.id, cours_declare: c })))
      if (eC2) {
        incidents.push(`sujet ${id} : les cours déclarés n'ont pas été enregistrés `
          + `(${eC2.message}) — le rattachement est à refaire à la main.`)
      }
    }
    entres.sujets += 1
    if (st.bloque) bloques.sujets += 1
  }
  {
    const { data } = await admin.from('exercices_sujets').select('id, id_import').not('id_import', 'is', null)
    for (const r of (data ?? []) as Array<Record<string, any>>) {
      if (!idSujet.has(r.id_import)) idSujet.set(r.id_import, r.id)
    }
  }

  // ── 3. Les matériaux ──────────────────────────────────────────────────────
  const idMateriau = new Map<string, string>()
  /**
   * ⭐⭐ LES CO-TEXTES, PAR `id_import`. « La matière des crans de production » —
   * l'argument à illustrer, les deux paragraphes à coudre, la thèse à
   * contredire. Le rôle sert deux fois plus bas : c'est lui qui envoie le
   * matériau sur `exercices.cotexte_materiau_id` PLUTÔT QUE sur
   * `exercices_cas.materiau_id`, qui est le slot de la CIBLE.
   */
  const coTextes = new Set<string>()
  const { data: types } = await admin.from('exercices_types').select('id, code')
  const idType = new Map((types ?? []).map((t: any) => [t.code as string, t.id as string]))
  for (const m of (Array.isArray(b.materiaux) ? b.materiaux : [])) {
    if (!m || typeof m !== 'object') continue
    const id = String(m.id ?? '')
    if (ignore('materiaux', id)) continue
    const st = etat('materiaux', id)
    if (st.refuse) { refuses.materiaux += 1; continue }
    // ⭐⭐ LE RÔLE SE DÉRIVE, IL NE SE DÉCLARE PAS. Un matériau sans observable
    //    et sans défaut ne peut pas être un matériau CALIBRÉ : le `08-` §4 dit
    //    de celui-ci que « c'est LUI qui porte le défaut calibré ». C'est donc
    //    un co-texte — la matière sur laquelle l'élève s'appuie pour écrire du
    //    neuf, aux crans où la doctrine ne déclare aucune cible.
    // ⛔ ET LES CHAMPS PARTENT À `null`, JAMAIS À `''`. C'est `''` que la base a
    //    refusé le 31/08 — sept co-textes perdus, et vingt et une instances
    //    entrées avec un cas vide sans que rien ne le dise. La contrainte de
    //    rôle refuse toujours la chaîne vide, et elle a raison de le faire.
    const rempli = (x: unknown) => typeof x === 'string' && x.trim() !== ''
    const coTexte = !rempli(m.observable?.code) && !rempli(m.observable?.competence)
      && !rempli(m.defaut)
    const { data, error } = await admin.from('exercices_materiaux').insert({
      id_import: id, import_id: importId,
      type_id: idType.get(String(m.objet)), objet_code: String(m.objet ?? ''),
      support: String(m.support ?? ''), contenu: String(m.contenu ?? ''),
      role: coTexte ? 'co_texte' : 'cible',
      observable_code: coTexte ? null : String(m.observable?.code ?? ''),
      observable_competence: coTexte ? null : String(m.observable?.competence ?? ''),
      defaut: coTexte ? null : String(m.defaut ?? ''),
      // « Le même matériau SANS le défaut » : sans défaut, elle n'a pas d'objet.
      version_corrigee: coTexte ? null : (m.version_corrigee ?? null),
      mode: String(m.mode ?? ''), famille: m.famille ?? null,
      statut: 'a_valider',
    }).select('id').single()
    if (error) { incidents.push(`matériau ${id} : ${error.message}`); continue }
    if (coTexte) coTextes.add(id)
    idMateriau.set(id, data.id as string)
    entres.materiaux += 1
  }
  // Les matériaux d'un dépôt antérieur restent visables — et leur RÔLE compte
  // autant que leur id : c'est lui qui décide, plus bas, de quelle colonne le
  // renvoi remplit.
  // ⚠️⚠️ PAGINÉ, ET CONFRONTÉ AU DÉCOMPTE. PostgREST plafonne une lecture à
  //    1000 lignes SANS LE DIRE (piège 45). La banque en porte 516 aujourd'hui
  //    et en vise 1 000 à 1 600 : au-delà du plafond, un co-texte d'un dépôt
  //    antérieur serait absent de `coTextes`, donc pris pour une cible, donc
  //    écrit dans le slot du cas — **exactement le défaut que ce lot répare**.
  {
    const PAGE = 1000
    for (let debut = 0; ; debut += PAGE) {
      const { data, error } = await admin.from('exercices_materiaux')
        .select('id, id_import, role').not('id_import', 'is', null)
        .order('id_import', { ascending: true }).range(debut, debut + PAGE - 1)
      if (error) {
        // supabase-js NE LÈVE PAS : sans ce test, une lecture morte passerait
        // pour « aucun matériau antérieur », et les renvois tomberaient tous.
        incidents.push('les matériaux déjà en base n\'ont pas pu être relus '
          + `(${error.message}) — les renvois d'un dépôt antérieur sont à vérifier.`)
        break
      }
      const page = (data ?? []) as Array<Record<string, any>>
      for (const r of page) {
        if (!idMateriau.has(r.id_import)) idMateriau.set(r.id_import, r.id)
        if (r.role === 'co_texte') coTextes.add(r.id_import)
      }
      if (page.length < PAGE) break
    }
  }

  // ── 4. Les exercices ──────────────────────────────────────────────────────
  // ⭐ C7-L2 — FORMAT 1.5 : la variante, la clé du problème, le constituant et
  //    les pièces entrent en base ; l'observable isolé SE DÉRIVE de la clé quand
  //    le fichier ne le déclare pas. La grille se lit ici même, avec tolérance —
  //    absente, on écrit ce que le fichier dit, et le contrôle a déjà refusé.
  // ⚠️ Un fichier d'avant le 1.5 n'écrit AUCUNE de ces colonnes : sur une base
  //    qui n'a pas reçu `c7_l2_gabarit_base.sql`, il entre comme hier.
  const gabarit = Number(String(b.version ?? '').split('.')[1] ?? 0) >= 5
  const grille = new Map<string, { code: string | null; competence: string | null }>()
  if (gabarit) {
    const { data: pb } = await admin.from('exercices_problemes')
      .select('cle, observable_code, observable_competence')
    for (const r of (pb ?? []) as Array<Record<string, any>>) {
      grille.set(String(r.cle), { code: r.observable_code ?? null, competence: r.observable_competence ?? null })
    }
  }
  const observableDerive = (e: any): { code: string | null; competence: string | null } => {
    const cle = Array.isArray(e.cas) ? e.cas[0]?.probleme : undefined
    return (gabarit && typeof cle === 'string' && grille.get(cle)) || { code: null, competence: null }
  }

  for (const e of (Array.isArray(b.exercices) ? b.exercices : [])) {
    if (!e || typeof e !== 'object') continue
    const id = String(e.id ?? '')
    if (ignore('exercices', id)) continue
    const st = etat('exercices', id)
    if (st.refuse) { refuses.exercices += 1; continue }

    const cas: any[] = Array.isArray(e.cas) ? e.cas : []
    const paire = cas.length === 2
    const ms = e.materiau_source ?? null
    const mc = e.materiau_cible ?? null
    const renvoi = (m: any, champ: 'texte' | 'sujet') =>
      m && m.provenance === (champ === 'texte' ? 'texte_auteur' : 'sujet')
        ? (champ === 'texte' ? idTexte : idSujet).get(String(m[champ])) ?? null
        : null

    // ── ⭐⭐ LE CO-TEXTE — DÉSIGNÉ PAR L'INSTANCE, JAMAIS PAR LE CAS ──────────
    // `exercices_cas.materiau_id` est le slot de la CIBLE : le `08-` §5.2 ne le
    // renseigne « QUE quand le `materiau_cible` est `genere` ». Aux crans de
    // production la doctrine ne déclare aucune cible — le co-texte y a donc son
    // domicile sur l'instance, et la clé étrangère de la base porte le rôle
    // avec elle : elle refuse physiquement un matériau calibré.
    //
    // ⭐ DEUX ENTRÉES, ET LES DEUX SONT LÉGITIMES. `cotexte` nomme le co-texte
    //    explicitement ; à défaut, il SE DÉRIVE — « un matériau nommé par le cas
    //    d'un exercice dont le `materiau_cible` vaut `null` est servi en
    //    source », règle que `verifie-import.ts` porte déjà et que ses deux
    //    refus symétriques tiennent. ⛔ On ne signale donc RIEN ici : le format
    //    n'a pas à changer pour que le co-texte trouve son domicile.
    const nommeUnCoTexte = (c: any) => c?.materiau && coTextes.has(String(c.materiau))
    const herite = cas.find(nommeUnCoTexte)
    const cotexteNomme = e.cotexte ? String(e.cotexte) : (herite ? String(herite.materiau) : null)
    const cotexteId = cotexteNomme ? (idMateriau.get(cotexteNomme) ?? null) : null

    // ⛔⛔ UN RENVOI MORT NE S'AVALE PLUS. `materiau_id: … ?? null` a laissé
    //    entrer, le 31/08, vingt et une instances dont le cas nommait un
    //    matériau que la base avait refusé : elles se sont écrites, le compteur
    //    s'est incrémenté, elles sont passées à `concu` — donc SERVABLES —, et
    //    rien n'a dit que l'appui manquait. Le refus n° 4 du contrôle attrape
    //    le cas où le fichier ne porte pas le matériau ; celui-ci attrape le
    //    cas où LA BASE N'EN A PAS VOULU, et c'est un autre chemin.
    const mort = [...cas.map((c) => c?.materiau), cotexteNomme]
      .filter((x): x is string => typeof x === 'string' && x !== '')
      .find((x) => !idMateriau.has(x))
    if (mort) {
      incidents.push(`exercice ${id} : le matériau « ${mort} » n'est pas en base `
        + '— l\'instance n\'est PAS entrée, elle aurait servi une consigne sans son appui.')
      continue
    }

    const { data, error } = await admin.from('exercices').insert({
      id_import: id, import_id: importId,
      type_id: idType.get(String(e.objet)),
      lieu: String(e.lieu ?? 'maison'),
      // La `consigne_instanciee` DÉCLARE LES DEUX CAS, DANS L'ORDRE : « la paire
      // de diagnostic est UNE ligne, et elle porte deux cas » (§1.1).
      consigne_instanciee: paire ? cas.map((c) => c?.consigne ?? '') : (cas[0]?.consigne ?? ''),
      paire_diagnostic: paire,
      // ⚠️ NI CLASSE, NI FENÊTRE, NI ASSIGNATION (`08-` §6).
      statut: 'a_concevoir',
      bonus: !!e.bonus,
      cran: String(e.cran),
      genre: e.genre ?? null,
      modes_par_competence: Object.fromEntries(
        Object.entries(e.modes ?? {}).map(([c, m]) => [c, [m]])),   // ⚠️ l'import ENVELOPPE
      materiau_source_provenance: ms?.provenance ?? null,
      materiau_source_support: ms?.support ?? null,
      materiau_cible_provenance: mc?.provenance ?? null,
      materiau_cible_support: mc?.support ?? null,
      materiau_source_texte_id: renvoi(ms, 'texte'),
      materiau_source_sujet_id: renvoi(ms, 'sujet'),
      materiau_source_localisation: ms?.localisation ?? null,
      materiau_source_englobant: ms?.englobant ?? null,
      materiau_cible_texte_id: renvoi(mc, 'texte'),
      materiau_cible_sujet_id: renvoi(mc, 'sujet'),
      materiau_cible_localisation: mc?.localisation ?? null,
      materiau_cible_englobant: mc?.englobant ?? null,
      cotexte_materiau_id: cotexteId,
      observable_isole_code: e.observable_isole?.code ?? observableDerive(e).code,
      observable_isole_competence: e.observable_isole?.competence ?? observableDerive(e).competence,
      ...(gabarit ? { variante: e.variante === 'a' || e.variante === 'b' ? e.variante : null } : {}),
      guide: e.guide ?? null,
      reference_id: null,
      bloque: st.bloque, blocages: st.blocages, signalements: st.signalements,
    }).select('id').single()
    if (error) { incidents.push(`exercice ${id} : ${error.message}`); continue }

    // L'APPUI, PAR CAS — « il vit EN CLAIR sur l'instance, jamais noyé dans la
    // consigne » (§1.1).
    const { data: casEcrits, error: eCas } = await admin.from('exercices_cas')
      .insert(cas.map((c, i) => ({
        exercice_id: data.id, ordre: i + 1,
        // ⛔ UN CO-TEXTE N'ENTRE PAS ICI : ce slot est celui de la CIBLE, et la
        //    contrainte de base le refuserait. Il est parti sur l'instance.
        materiau_id: nommeUnCoTexte(c) ? null
          : (c?.materiau ? (idMateriau.get(String(c.materiau)) ?? null) : null),
        defaut: c?.defaut ?? null,
        distracteurs: c?.distracteurs ?? null,
        reponse_attendue: c?.reponse_attendue ?? null,
        // ⭐ C4-L14 — LE FORMAT 1.2. « Pourquoi ce candidat-là est le bon »
        //    (`08-` §5.2) : sans lui, la correction servie à l'élève n'aurait
        //    aucune source, puisqu'à ces crans le jugement est algorithmique et
        //    qu'aucun retour IA ne vient derrière. Le contrôle l'a déjà borné au
        //    cran (refus n° 12) ; ici on ne fait que l'écrire.
        pourquoi_juste: c?.pourquoi_juste ?? null,
        // ⭐ C7-L2 — la clé, le constituant et les pièces (format 1.5 seulement).
        ...(gabarit ? {
          probleme: typeof c?.probleme === 'string' ? c.probleme : null,
          constituant: typeof c?.constituant === 'string' ? c.constituant : null,
          pieces: Array.isArray(c?.pieces) ? c.pieces : null,
        } : {}),
      }))).select('ordre')
    // ⚠️ UNE INSTANCE SANS SON APPUI N'EST PAS « ENTRÉE ». Comptée comme telle,
    //   elle passait en file, se validait, et son écran d'édition — qui rend un
    //   champ par cas — n'en affichait aucun : la première correction effaçait
    //   la consigne que l'élève lit. On la retire.
    if (eCas || (casEcrits ?? []).length !== cas.length) {
      await admin.from('exercices').delete().eq('id', data.id)
      incidents.push(`exercice ${id} : l'appui n'a pas pu être écrit `
        + `(${eCas?.message ?? 'écriture partielle'}) — l'instance a été retirée.`)
      continue
    }
    entres.exercices += 1
    if (st.bloque) bloques.exercices += 1
  }

  // ── 5. Les démonstrations ─────────────────────────────────────────────────
  for (const dm of (Array.isArray(b.demonstrations) ? b.demonstrations : [])) {
    if (!dm || typeof dm !== 'object') continue
    const id = String(dm.id ?? '')
    if (ignore('demonstrations', id)) continue
    const st = etat('demonstrations', id)
    if (st.refuse) { refuses.demonstrations += 1; continue }
    const { error } = await admin.from('exercices_demonstrations').insert({
      id_import: id, import_id: importId,
      competence: String(dm.competence ?? ''), grain: String(dm.grain ?? ''),
      forme: String(dm.forme ?? ''), theme: String(dm.theme ?? ''),
      contenu: dm.corps ?? {}, statut: 'a_valider',
      signalements: st.signalements, deposee_par: deposePar,
    })
    if (error) { incidents.push(`démonstration ${id} : ${error.message}`); continue }
    entres.demonstrations += 1
  }

  return { importId, verdict, entres, refuses, bloques, incidents }
}
