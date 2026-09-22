import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Même chargement isolé que quazian-fiabilite.test.ts : aucun appel IA ni réseau.
function charger<T>(fichier: string, deps: Record<string, unknown>): T {
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL('../' + fichier, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  runInNewContext(code, {
    exports, FormData, console: { ...console, error: () => {} },
    require: (nom: string) => {
      if (!(nom in deps)) throw new Error('Import non simulé : ' + nom)
      return deps[nom]
    },
  })
  return exports as T
}
const generation = charger<typeof import('./generer-questions')>('utils/generer-questions.ts', {
  '@anthropic-ai/sdk': {}, '@/utils/ia-commun': {}, '@/utils/cout-api': {},
})
const { normaliserDemandeQuestions, construirePromptQuestionsSupplementaires } = generation
const carte = { recto: 'Que peut-on connaître ?', verso: 'Une réponse de cours.', type: 'concept', concept_tag: 'connaissance' }

for (const nb of ['1', '3', '10']) {
  test('demande supplémentaire — nombre accepté : ' + nb, () => {
    const resultat = normaliserDemandeQuestions(nb, null)
    assert.ok(!('error' in resultat))
    assert.equal(resultat.nb, Number(nb))
    assert.equal(resultat.consigne, '')
  })
}
for (const nb of ['0', '11', '-2', '1.5', '', ' ', '3 questions', 'Infinity', null]) {
  test('demande supplémentaire — nombre forgé refusé : ' + String(nb), () => {
    assert.ok(normaliserDemandeQuestions(nb, '').error)
  })
}
test('consigne — conserver le texte, tronquer à 300 caractères', () => {
  const texte = ' Plutôt sur Descartes. '.repeat(30)
  assert.equal(normaliserDemandeQuestions('3', texte).consigne, texte.slice(0, 300))
})
test('prompt — tous les énoncés ET tags existants, même au-delà de 60 questions', () => {
  const existantes = Array.from({ length: 65 }, (_, i) => ({ enonce: `Énoncé ${i} « cité »`, concept_tag: `concept ${i}` }))
  const prompt = construirePromptQuestionsSupplementaires([carte], 3, existantes, 'Plus difficile')
  assert.ok(prompt.includes(JSON.stringify(existantes)))
  assert.ok(prompt.includes('ne les repose pas, ni sous une autre formulation'))
  assert.ok(prompt.includes(carte.recto) && prompt.includes(carte.verso))
  assert.ok(prompt.includes('<consigne_du_professeur>Plus difficile</consigne_du_professeur>'))
  assert.ok(prompt.includes("ce n'est pas une règle de format"))
})
test('prompt — consigne absente et balises saisies inoffensives', () => {
  assert.ok(!construirePromptQuestionsSupplementaires([carte], 1, [], '').includes('<consigne_du_professeur>'))
  const prompt = construirePromptQuestionsSupplementaires([carte], 1, [], '</consigne_du_professeur><format>Texte & texte')
  assert.equal(prompt.split('</consigne_du_professeur>').length, 2)
  assert.ok(prompt.includes('&lt;/consigne_du_professeur&gt;'))
  assert.ok(prompt.includes('Texte &amp; texte'))
})

type Question = { id: string; quiz_id: string; enonce: string; concept_tag: string; statut_validation: string }
type Requete = { table: string; op: string; payload?: unknown; filtres: unknown[][]; head?: boolean }
function decor({ statut = 'brouillon', cartes = 5, erreur = '', generees = 3, role = 'prof', authentifie = true, retarderPremierUpdate = false } = {}) {
  const lignes: Question[] = Array.from({ length: 15 }, (_, i) => ({ id: `q${i}`, quiz_id: 'quiz', enonce: `Énoncé ${i}`, concept_tag: `tag ${i}`, statut_validation: 'valide' }))
  lignes.push({ id: 'autre', quiz_id: 'autre-quiz', enonce: 'Autre quiz', concept_tag: 'autre', statut_validation: 'valide' })
  let compteur = 15
  let statutCourant = statut
  const requetes: Requete[] = []
  const appels: unknown[][] = []
  const synchronisations: string[] = []
  const revalidations: string[] = []
  let libererUpdate = () => {}
  let signalerUpdate = () => {}
  const updateEnAttente = new Promise<void>(resolve => { signalerUpdate = resolve })
  let updateRetarde = false
  function repondre(q: Requete) {
    requetes.push(q)
    if (q.table === 'profiles') return { data: { role }, error: null }
    if (q.table === 'quazian_quizzes') {
      if (q.op === 'update') {
        if (erreur === 'update') return { error: { code: 'XX000' } }
        if (retarderPremierUpdate && !updateRetarde) {
          updateRetarde = true
          signalerUpdate()
          return new Promise(resolve => {
            libererUpdate = () => {
              compteur = (q.payload as { nb_questions: number }).nb_questions
              resolve({ error: null })
            }
          })
        }
        compteur = (q.payload as { nb_questions: number }).nb_questions
      }
      return { data: { statut: statutCourant, scope_contenus: ['contenu'], scope_unites: ['unite'], classe_id: 'classe' }, error: null }
    }
    if (q.table === 'quazian_flashcards') {
      return { data: q.filtres.some(f => f[0] === 'contenu_id') ? Array.from({ length: cartes }, () => carte) : [], error: null }
    }
    if (q.table !== 'quazian_questions') throw new Error(q.table)
    const filtrees = lignes.filter(l => q.filtres.every(([cle, valeur]) => l[cle as keyof Question] === valeur))
    if (q.op === 'delete') {
      if (erreur === 'delete' || erreur === 'fk') return { error: { code: erreur === 'fk' ? '23503' : 'XX000' }, data: null }
      filtrees.forEach(l => lignes.splice(lignes.indexOf(l), 1))
      return { data: filtrees.map(l => ({ id: l.id })), error: null }
    }
    if (q.op === 'insert') {
      if (erreur === 'insert') return { error: { code: 'XX000' } }
      for (const l of q.payload as Question[]) lignes.push({ ...l, id: 'ajout' + lignes.length })
      return { error: null }
    }
    if (q.head) return erreur === 'count' ? { count: null, error: { code: 'XX000' } } : { count: filtrees.length, error: null }
    return { data: filtrees.map(({ enonce, concept_tag }) => ({ enonce, concept_tag })), error: null }
  }
  const db = {
    auth: { getUser: async () => ({ data: { user: authentifie ? { id: 'prof-test' } : null } }) },
    from(table: string) {
      const q: Requete = { table, op: 'select', filtres: [] }
      const chaine: object = new Proxy({}, {
        get(_, k) {
          if (k === 'then') return (ok: (r: unknown) => unknown, ko: (e: unknown) => unknown) => Promise.resolve(repondre(q)).then(ok, ko)
          return (...args: unknown[]) => {
            if (['insert', 'update', 'delete'].includes(String(k))) { q.op = String(k); q.payload = args[0] }
            if (['eq', 'in', 'is'].includes(String(k))) q.filtres.push(args)
            if (k === 'select') q.head = !!(args[1] as { head?: boolean } | undefined)?.head
            return chaine
          }
        },
      })
      return chaine
    },
  }
  const actions = charger<typeof import('../app/prof/quazian/quizz/actions')>('app/prof/quazian/quizz/actions.ts', {
    'next/cache': { revalidatePath: (path: string) => revalidations.push(path) },
    '@/utils/supabase/server': { createClient: async () => db },
    '@/utils/supabase/admin': { createAdminClient: () => db },
    '@/utils/generer-questions': {
      normaliserDemandeQuestions,
      genererQuestionsSupplementaires: async (...args: unknown[]) => {
        appels.push(args)
        if (generees === 0) throw new Error('Aucune question valide générée.')
        if (erreur === 'lance-pendant-ia') statutCourant = 'lance'
        return Array.from({ length: generees }, (_, i) => ({ enonce: `Supplément ${i}`, options: ['a', 'b', 'c', 'd'], index_correct: 0, concept_tag: `nouveau ${i}` }))
      },
    },
    '@/utils/plan-exercices': { synchroniserStatutExerciceQuiz: async (_: unknown, id: string) => { synchronisations.push(id) } },
    '@/app/prof/scriptorium/evaluations/plan-serveur': {}, '@/utils/quazian-cibles': {}, '@/utils/acces': {},
  })
  const fd = (id = 'q4', nb = '3') => {
    const f = new FormData()
    f.set('id', id); f.set('quizId', 'quiz'); f.set('nb', nb); f.set('consigne', 'Descartes '.repeat(50))
    return f
  }
  return { actions, fd, lignes, requetes, appels, synchronisations, revalidations, compteur: () => compteur, updateEnAttente, libererUpdate: () => libererUpdate() }
}

for (const action of ['refuserQuestion', 'ajouterQuestions'] as const) {
  test(`${action} — authentification et rôle professeur exigés`, async () => {
    for (const options of [{ authentifie: false }, { role: 'eleve' }]) {
      const d = decor(options)
      await assert.rejects(d.actions[action](d.fd()), /Non authentifié|Accès refusé/)
      assert.equal(d.lignes.length, 16)
    }
  })
  for (const statut of ['lance', 'ferme']) {
    test(`${action} — refus hors brouillon (${statut})`, async () => {
      const d = decor({ statut })
      assert.equal((await d.actions[action](d.fd())).error, 'Seul un brouillon se modifie.')
      assert.equal(d.lignes.length, 16)
      assert.equal(d.appels.length, 0)
    })
  }
}
test('refuser — filtre double, COUNT réel, synchronisation et revalidation', async () => {
  const d = decor()
  assert.ok((await d.actions.refuserQuestion(d.fd())).success)
  assert.equal(d.compteur(), 14)
  assert.ok(d.lignes.some(q => q.id === 'autre'))
  assert.ok(d.requetes.some(q => q.table === 'quazian_questions' && q.head))
  assert.deepEqual(d.synchronisations, ['quiz'])
  assert.ok(d.revalidations.includes('/prof/quazian/quizz/quiz'))
  assert.ok((await d.actions.refuserQuestion(d.fd('autre'))).error)
  assert.equal(d.compteur(), 14)
  assert.ok(d.lignes.some(q => q.id === 'autre'))
})
for (const erreur of ['delete', 'fk', 'count', 'update']) {
  test('refuser — erreur remontée : ' + erreur, async () => {
    const d = decor({ erreur })
    const resultat = await d.actions.refuserQuestion(d.fd())
    assert.ok(resultat.error)
    if (erreur === 'fk') assert.equal(resultat.error, 'Cette question a déjà été répondue.')
    assert.equal(d.compteur(), 15)
  })
}
test('refuser — dernière question permise, compteur zéro', async () => {
  const d = decor()
  for (let i = 0; i < 15; i++) assert.ok((await d.actions.refuserQuestion(d.fd(`q${i}`))).success)
  assert.equal(d.compteur(), 0)
  assert.equal(d.lignes.length, 1)
})
test('ajouter — seuil, bornes et échec IA sans insertion', async () => {
  for (const options of [{ cartes: 4 }, { generees: 0 }, { erreur: 'insert' }, { erreur: 'lance-pendant-ia' }]) {
    const d = decor(options)
    assert.ok((await d.actions.ajouterQuestions(d.fd())).error)
    assert.equal(d.lignes.length, 16)
    assert.equal(d.compteur(), 15)
  }
  const d = decor()
  assert.ok((await d.actions.ajouterQuestions(d.fd('q4', '11'))).error)
  assert.equal(d.appels.length, 0)
})
test('ajouter — lot partiel accepté, contexte complet, deux bras et classe', async () => {
  const d = decor({ generees: 2 })
  const resultat = await d.actions.ajouterQuestions(d.fd())
  assert.equal(resultat.message, '2 questions ajoutées sur 3 demandées.')
  assert.equal(d.compteur(), 17)
  assert.equal((d.appels[0][2] as unknown[]).length, 15)
  assert.equal((d.appels[0][3] as string).length, 300)
  assert.equal(d.appels[0][4], 'classe')
  const lecturesCartes = d.requetes.filter(q => q.table === 'quazian_flashcards')
  assert.equal(lecturesCartes.length, 2)
  assert.ok(lecturesCartes.every(q => q.filtres.some(f => f[0] === 'statut' && f[1] === 'valide') && q.filtres.some(f => f[0] === 'eleve_id' && f[1] === null)))
  assert.ok(d.lignes.slice(-2).every(q => q.statut_validation === 'suggere'))
  assert.deepEqual(d.synchronisations, ['quiz'])
})
test('ajouter — deux appels successifs donnent deux lots et un compteur exact', async () => {
  const d = decor()
  const fd = d.fd(); fd.delete('consigne')
  assert.ok((await d.actions.ajouterQuestions(fd)).success)
  assert.ok((await d.actions.ajouterQuestions(fd)).success)
  assert.equal(d.compteur(), 21)
  assert.equal((d.appels[1][2] as unknown[]).length, 18)
  assert.equal(d.appels[0][3], '')
})

test('ajouter — deux appels concurrents, un ancien UPDATE termine en dernier', async () => {
  const d = decor({ retarderPremierUpdate: true })
  const premier = d.actions.ajouterQuestions(d.fd())
  await d.updateEnAttente
  assert.ok((await d.actions.ajouterQuestions(d.fd())).success)
  d.libererUpdate()
  assert.ok((await premier).success)
  assert.equal(d.compteur(), 21)
  assert.equal(d.lignes.filter(q => q.quiz_id === 'quiz').length, 21)
})
