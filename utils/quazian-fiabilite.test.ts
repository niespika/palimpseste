// Exécute les vraies actions et les gestionnaires d'écran avec une base et des
// hooks simulés. Aucun réseau, aucune écriture en base, aucun appel IA.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import * as fsrs from 'ts-fsrs'

type Requete = { table: string; op: string; payload?: unknown; filtres: unknown[][] }
function base(repondre: (q: Requete) => unknown) {
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'eleve-test' } } }) },
    from(table: string) {
      const q: Requete = { table, op: 'select', filtres: [] }
      const chaine: object = new Proxy({}, {
        get(_, k) {
          if (k === 'then') return (ok: (r: unknown) => unknown, ko: (e: unknown) => unknown) => Promise.resolve(repondre(q)).then(ok, ko)
          return (...args: unknown[]) => {
            if (['insert', 'update', 'upsert', 'delete'].includes(String(k))) { q.op = String(k); q.payload = args[0] }
            if (['eq', 'is'].includes(String(k))) q.filtres.push(args)
            return chaine
          }
        },
      })
      return chaine
    },
  }
}

function charger<T>(fichier: string, deps: Record<string, unknown>): T {
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL('../' + fichier, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  runInNewContext(code, {
    exports, console: { ...console, error: () => {} },
    require: (nom: string) => {
      if (!(nom in deps)) throw new Error('Import non simulé : ' + nom)
      return deps[nom]
    },
  })
  return exports as T
}
const flashPath = 'app/eleve/modules/quazian/actions.ts'
const quizPath = 'app/eleve/modules/quazian/quizz/[quizId]/actions.ts'
type FlashActions = typeof import('../app/eleve/modules/quazian/actions')
type QuizActions = typeof import('../app/eleve/modules/quazian/quizz/[quizId]/actions')
function dependances(db: ReturnType<typeof base>) {
  return {
    '@/utils/supabase/server': { createClient: async () => db },
    '@/utils/supabase/admin': { createAdminClient: () => db },
    '@/utils/integrite': { messageSiBloque: async () => null },
    '@/app/eleve/contexte-classe': {}, '@/utils/quazian-cibles': {},
    '@/utils/quazian-visibilite': {}, 'ts-fsrs': fsrs,
    '@/utils/fuseau-serveur': {}, '@/utils/quazian-echeance': {},
    'next/cache': { revalidatePath: () => {} },
    '@/utils/acces': { classeIdsActives: async () => ['classe-test'] },
    '@/utils/brier': {},
  }
}
const etat = { id: '11111111-1111-1111-1111-111111111111', difficulty: 5, stability: 3, state: 2, due: '2026-09-01T12:00:00Z', last_review: '2026-08-29T12:00:00Z', reps: 2, lapses: 0 }
for (const cas of ['insert refuse', 'update refuse', 'update vide', 'lecture refusee', 'succes', 'journal refuse']) {
  test('révision — ' + cas, async () => {
    const ecritures: Requete[] = []
    const db = base(q => {
      if (q.table === 'profiles') return { data: { role: 'eleve' } }
      if (q.table === 'quazian_flashcards') return { data: { eleve_id: null, statut: 'valide' } }
      if (q.op !== 'select') {
        ecritures.push(q)
        if (cas === q.op + ' refuse' || (cas === 'journal refuse' && q.table === 'quazian_review_log')) return { data: null, error: { message: 'Panne simulée' } }
        return { data: cas === 'update vide' ? null : { id: etat.id }, error: null }
      }
      if (cas === 'lecture refusee') return { data: null, error: { message: 'Panne simulée' } }
      return { data: cas.startsWith('update') ? etat : null, error: null }
    })
    const res = await charger<FlashActions>(flashPath, dependances(db)).soumettreNote('carte-test', null, 3)
    if (cas === 'succes' || cas === 'journal refuse') {
      assert.ok(!('error' in res))
      assert.equal(res.cardStateId, etat.id)
      assert.equal(!!res.avertissement, cas === 'journal refuse')
      assert.equal(ecritures.length, 2)
    } else {
      assert.ok('error' in res)
      assert.equal(ecritures.filter(q => q.table === 'quazian_review_log').length, 0)
    }
  })
}

test('quiz — les jetons repris suivent le même mélange que les options', async () => {
  const db = base(q => {
    if (q.table === 'profiles') return { data: { role: 'eleve' } }
    if (q.table === 'quazian_quizzes') return { data: { statut: 'lance', classe_id: 'classe-test' } }
    if (q.table === 'quazian_sessions') return { data: { id: 's', ordre_questions: ['q'], ordre_options: { q: [2, 0, 3, 1] }, submitted_at: null } }
    if (q.table === 'quazian_questions') return { data: [{ id: 'q', enonce: 'Exemple', options: ['A', 'B', 'C', 'D'] }] }
    if (q.table === 'quazian_answers') return { data: [{ question_id: 'q', p_a: 0, p_b: 0, p_c: 1, p_d: 0 }] }
    throw new Error(q.table)
  })
  const res = await charger<QuizActions>(quizPath, dependances(db)).initialiserSession('quiz')
  assert.ok(!('error' in res))
  assert.equal(res.questions[0].options[0], 'C')
  assert.deepEqual(Array.from(res.reponsesExistantes.q), [100, 0, 0, 0])
})

test('quiz — une écriture refusée est signalée au client', async () => {
  const db = base(q => {
    if (q.table === 'profiles') return { data: { role: 'eleve' } }
    if (q.table === 'quazian_quizzes') return { data: { statut: 'lance', classe_id: 'classe-test' } }
    if (q.table === 'quazian_sessions') return { data: { quiz_id: 'quiz', submitted_at: null } }
    return { error: { message: 'Panne simulée' } }
  })
  const res = await charger<QuizActions>(quizPath, dependances(db)).sauvegarderReponse('s', 'q', [100, 0, 0, 0], [2, 0, 3, 1])
  assert.ok(res.error)
})

// Les hooks conservent l'état entre deux rendus ; les événements exécutés sont
// ceux du composant réel. Les effets DOM ne sont pas nécessaires à ces scénarios.
type Noeud = { type: unknown; props: { children?: unknown; onClick?: () => Promise<void> | void; [key: string]: unknown } }
function ecran<T>(fichier: string, actions: Record<string, unknown>) {
  const valeurs: unknown[] = []
  let curseur = 0
  const react = {
    useState(init: unknown) {
      const i = curseur++
      if (!(i in valeurs)) valeurs[i] = init
      return [valeurs[i], (v: unknown) => { valeurs[i] = typeof v === 'function' ? v(valeurs[i]) : v }]
    },
    useRef(init: unknown) {
      const i = curseur++
      if (!(i in valeurs)) valeurs[i] = { current: init }
      return valeurs[i]
    },
    useEffect: () => {}, useMemo: (f: () => unknown) => f(), useCallback: (f: unknown) => f,
  }
  const jsx = (type: unknown, props: Noeud['props']) => ({ type, props })
  const composant = charger<T>(fichier, { react, 'react/jsx-runtime': { jsx, jsxs: jsx }, './actions': actions })
  return { composant, debut: () => { curseur = 0 } }
}
function noeuds(n: unknown): Noeud[] {
  if (Array.isArray(n)) return n.flatMap(noeuds)
  if (!n || typeof n !== 'object' || !('props' in n)) return []
  const element = n as Noeud
  return [element, ...noeuds(element.props.children)]
}
function bouton(arbre: unknown, label: string | number) {
  const n = noeuds(arbre).find(n => n.type === 'button' && (n.props.children === label || n.props['aria-label'] === label))
  assert.ok(n, 'Bouton absent : ' + label)
  return n.props.onClick!
}

for (const panne of [false, true]) {
  test('quiz — navigation par numéro, sauvegarde ' + (panne ? 'refusée' : 'confirmée'), async () => {
    const appels: unknown[][] = []
    const e = ecran<typeof import('../app/eleve/modules/quazian/quizz/[quizId]/PassationJetons')>('app/eleve/modules/quazian/quizz/[quizId]/PassationJetons.tsx', {
      sauvegarderReponse: async (...args: unknown[]) => { appels.push(args); return panne ? { error: 'Panne simulée' } : {} },
      soumettreQuizz: async () => ({}),
    })
    const props = { sessionId: 's', quizId: 'quiz', questions: [1, 2].map(i => ({ id: 'q' + i, enonce: 'Question ' + i, options: ['A', 'B', 'C', 'D'], optionMapping: [0, 1, 2, 3] })), reponsesInitiales: {}, fermeAt: null }
    const render = () => { e.debut(); return e.composant.PassationJetons(props) }
    await bouton(render(), 'Retirer 5 points à la réponse B')()
    await bouton(render(), 'Ajouter 5 points à la réponse A')()
    await bouton(render(), 2)()
    assert.equal(appels[0][1], 'q1')
    assert.deepEqual(Array.from(appels[0][2] as number[]), [30, 20, 25, 25])
    const arbre = render()
    assert.ok(noeuds(arbre).some(n => n.props.children === (panne ? 'Question 1' : 'Question 2')))
    if (panne) assert.ok(noeuds(arbre).some(n => n.props.role === 'alert'))
    else {
      await bouton(arbre, 'Soumettre le quizz')()
      assert.deepEqual(appels.map(a => a[1]), ['q1', 'q2'])
      assert.ok(noeuds(render()).some(n => n.props.children === 'Quizz soumis !'))
    }
  })
}

for (const rejet of [false, true]) {
  test('flashcard — refus ' + (rejet ? 'réseau' : 'serveur') + ' : reste affichée, boutons réactivés', async () => {
    const e = ecran<typeof import('../app/eleve/modules/quazian/SessionRevision')>('app/eleve/modules/quazian/SessionRevision.tsx', {
      soumettreNote: async () => { if (rejet) throw new Error('Réseau'); return { error: 'Panne simulée' } },
    })
    const props = { cartes: [{ flashcard_id: 'f', card_state_id: null, recto: 'Question', verso: 'Réponse', format: 'recto_verso', type: 'concept', concept_tag: '', label_unite: '', state: 0, due: '2026-09-01' }], onTermine: () => {} }
    const render = () => { e.debut(); return e.composant.SessionRevision(props) }
    await bouton(render(), 'Révéler la réponse')()
    const noter = noeuds(render()).find(n => n.type === 'button' && noeuds(n.props.children).some(c => c.props.children === 'Bien'))!
    await noter.props.onClick!()
    const arbre = render()
    assert.ok(noeuds(arbre).some(n => n.props.role === 'alert'))
    assert.ok(noeuds(arbre).some(n => n.props.children === 'Question'))
    assert.equal(noeuds(arbre).some(n => n.type === 'button' && n.props.disabled === true), false)
    assert.equal(noeuds(arbre).some(n => n.props.children === 'Session terminée !'), false)
  })
}

for (const cas of ['envoi refuse', 'connexion coupee', 'temps ecoule', 'reponse incomplete']) {
  test('quiz — soumission : ' + cas, async () => {
    let sauvegardes = 0
    let soumissions = 0
    const e = ecran<typeof import('../app/eleve/modules/quazian/quizz/[quizId]/PassationJetons')>('app/eleve/modules/quazian/quizz/[quizId]/PassationJetons.tsx', {
      sauvegarderReponse: async () => {
        sauvegardes++
        if (cas === 'connexion coupee') throw new Error('Réseau')
        return { error: 'Sauvegarde refusée' }
      },
      soumettreQuizz: async () => { soumissions++; return {} },
    })
    const props = { sessionId: 's', quizId: 'quiz', questions: [{ id: 'q', enonce: 'Question', options: ['A', 'B', 'C', 'D'], optionMapping: [0, 1, 2, 3] }], reponsesInitiales: {}, fermeAt: cas === 'temps ecoule' ? '2000-01-01T00:00:00Z' : null }
    const render = () => { e.debut(); return e.composant.PassationJetons(props) }
    if (cas === 'reponse incomplete') await bouton(render(), 'Retirer 5 points à la réponse B')()
    await bouton(render(), 'Soumettre le quizz')()
    const arbre = render()
    assert.equal(soumissions, cas === 'temps ecoule' ? 1 : 0)
    assert.equal(sauvegardes, cas === 'temps ecoule' || cas === 'reponse incomplete' ? 0 : 1)
    if (cas === 'temps ecoule') assert.ok(noeuds(arbre).some(n => n.props.role === 'status'))
    else {
      assert.ok(noeuds(arbre).some(n => n.props.role === 'alert'))
      assert.equal(noeuds(arbre).find(n => n.type === 'button' && n.props.children === 'Soumettre le quizz')?.props.disabled, false)
    }
  })
}
