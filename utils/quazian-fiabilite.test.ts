// Exécute les vraies actions et les gestionnaires d'écran avec une base et des
// hooks simulés. Aucun réseau, aucune écriture en base, aucun appel IA.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import * as fsrs from 'ts-fsrs'
import * as ordreEleve from './quazian-ordre-eleve'

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
    // 22/09 — le retour remis dans l'ordre de la session : le vrai module, il est pur.
    '@/utils/quazian-ordre-eleve': ordreEleve,
    // 17/09 — hors rendu, `cache` ne mémoïse pas : ici, un simple passe-plat.
    'react': { cache: <F>(f: F) => f },
    // 17/09 — le départ groupé des lectures : ici, la vraie mécanique, sans le module.
    '@/utils/lancer': { lancer: <T>(l: PromiseLike<T>) => { const p = Promise.resolve(l); p.catch(() => {}); return p } },
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
    if (q.table === 'quazian_sessions') return { data: { quiz_id: 'quiz', submitted_at: null, ordre_options: { q: [2, 0, 3, 1] } } }
    return { error: { message: 'Panne simulée' } }
  })
  const res = await charger<QuizActions>(quizPath, dependances(db)).sauvegarderReponse('s', 'q', [100, 0, 0, 0])
  assert.equal(res.error, 'Ta réponse n’a pas été enregistrée. Réessaie.')
})

test('quiz — l’ordre des réponses vient de la SESSION, jamais du navigateur', async () => {
  const ecrit: Requete[] = []
  const db = base(q => {
    if (q.table === 'profiles') return { data: { role: 'eleve' } }
    if (q.table === 'quazian_quizzes') return { data: { statut: 'lance', classe_id: 'classe-test' } }
    if (q.table === 'quazian_sessions') return { data: { quiz_id: 'quiz', submitted_at: null, ordre_options: { q: [2, 0, 3, 1] } } }
    if (q.table === 'quazian_answers') { ecrit.push(q); return { data: null, error: null } }
    throw new Error(q.table)
  })
  const actions = charger<QuizActions>(quizPath, dependances(db))
  // 70 sur la réponse affichée en 1re position = la réponse d'origine n°2 ;
  // le 4e argument (un vieux mapping) est IGNORÉ.
  assert.equal((await actions.sauvegarderReponse('s', 'q', [70, 30, 0, 0], [0, 1, 2, 3])).error, undefined)
  const p = ecrit[0].payload as { p_a: number; p_b: number; p_c: number; p_d: number }
  assert.deepEqual([p.p_a, p.p_b, p.p_c, p.p_d], [0.3, 0, 0.7, 0])
  // Une question que la session ne connaît pas n'est pas la sienne : rien n'est écrit.
  const refus = await actions.sauvegarderReponse('s', 'autre', [100, 0, 0, 0])
  assert.equal(refus.error, 'Cette question ne fait pas partie de ton quiz.')
  assert.equal(ecrit.length, 1)
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
  // Le curseur vit dans son fichier (22/09) : le faux React ne rend pas les
  // sous-composants, un simple repère de type suffit à le retrouver.
  const composant = charger<T>(fichier, { react, 'react/jsx-runtime': { jsx, jsxs: jsx }, './actions': actions, './CurseurPoints': { CurseurPoints: function CurseurPoints() { return null } } })
  return { composant, debut: () => { curseur = 0 } }
}
function noeuds(n: unknown): Noeud[] {
  if (Array.isArray(n)) return n.flatMap(noeuds)
  if (!n || typeof n !== 'object' || !('props' in n)) return []
  const element = n as Noeud
  return [element, ...noeuds(element.props.children)]
}
// Les curseurs de réponse (22/09) : le faux React ne rend pas les sous-composants,
// on retrouve donc chaque `CurseurPoints` par sa lettre et on appelle SON
// `surValeur`, exactement ce que ferait un glissé au doigt.
function curseur(arbre: unknown, lettre: string) {
  const n = noeuds(arbre).find(n => typeof n.type === 'function' && n.props.lettre === lettre)
  assert.ok(n, 'Curseur absent : ' + lettre)
  return n.props as unknown as { valeur: number; plafond: number; surValeur: (v: number) => void }
}
// Le récapitulatif (22/09) est un sous-composant : on appelle ses rappels.
function recap(arbre: unknown) {
  const n = noeuds(arbre).find(n => typeof n.type === 'function' && typeof n.props.surEnvoi === 'function')
  assert.ok(n, 'Récapitulatif absent')
  return n.props as unknown as { surEnvoi: () => Promise<void>; surQuestion: (i: number) => Promise<void> }
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
    const props = { sessionId: 's', quizId: 'quiz', questions: [1, 2].map(i => ({ id: 'q' + i, enonce: 'Question ' + i, options: ['A', 'B', 'C', 'D'] })), reponsesInitiales: {}, fermeAt: null }
    const render = () => { e.debut(); return e.composant.PassationJetons(props) }
    curseur(render(), 'A').surValeur(70)
    curseur(render(), 'C').surValeur(30)
    await bouton(render(), 2)()
    assert.equal(appels[0][1], 'q1')
    assert.deepEqual(Array.from(appels[0][2] as number[]), [70, 0, 30, 0])
    // Plus aucun ordre de mélange ne part du navigateur (fuite du 22/09) : trois arguments.
    assert.equal(appels[0].length, 3)
    if (!panne) {
      // La question 2 est laissée INTACTE : on la quitte sans rien enregistrer…
      await bouton(render(), 1)()
      assert.equal(appels.length, 1)
      await bouton(render(), 2)()
      assert.equal(appels.length, 1) // …et quitter la 1, inchangée depuis sa sauvegarde, ne renvoie rien.
      curseur(render(), 'D').surValeur(100)
    }
    const arbre = render()
    assert.ok(noeuds(arbre).some(n => n.props.children === (panne ? 'Question 1' : 'Question 2')))
    if (panne) assert.ok(noeuds(arbre).some(n => n.props.role === 'alert'))
    else {
      await bouton(arbre, 'Revoir mes réponses →')()
      await recap(render()).surEnvoi()
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
    const props = { sessionId: 's', quizId: 'quiz', questions: [{ id: 'q', enonce: 'Question', options: ['A', 'B', 'C', 'D'] }], reponsesInitiales: {}, fermeAt: cas === 'temps ecoule' ? '2000-01-01T00:00:00Z' : null }
    const render = () => { e.debut(); return e.composant.PassationJetons(props) }
    if (cas === 'reponse incomplete') curseur(render(), 'B').surValeur(40)
    else if (cas !== 'temps ecoule') curseur(render(), 'A').surValeur(100)
    await bouton(render(), 'Revoir mes réponses →')()
    if (cas === 'temps ecoule') await recap(render()).surEnvoi()
    const arbre = render()
    assert.equal(soumissions, cas === 'temps ecoule' ? 1 : 0)
    assert.equal(sauvegardes, cas === 'temps ecoule' || cas === 'reponse incomplete' ? 0 : 1)
    if (cas === 'temps ecoule') assert.ok(noeuds(arbre).some(n => n.props.role === 'status'))
    else {
      assert.ok(noeuds(arbre).some(n => n.props.role === 'alert'))
      assert.equal(noeuds(arbre).find(n => n.type === 'button' && n.props.children === 'Revoir mes réponses →')?.props.disabled, cas === 'reponse incomplete')
    }
  })
}

test('quiz — la question part de zéro, et le curseur BUTE sur les points qui restent', async () => {
  const e = ecran<typeof import('../app/eleve/modules/quazian/quizz/[quizId]/PassationJetons')>('app/eleve/modules/quazian/quizz/[quizId]/PassationJetons.tsx', {
    sauvegarderReponse: async () => ({}), soumettreQuizz: async () => ({}),
  })
  const props = { sessionId: 's', quizId: 'quiz', questions: [{ id: 'q', enonce: 'Question', options: ['A', 'B', 'C', 'D'] }], reponsesInitiales: {}, fermeAt: null }
  const render = () => { e.debut(); return e.composant.PassationJetons(props) }
  assert.deepEqual(['A', 'B', 'C', 'D'].map(l => curseur(render(), l).valeur), [0, 0, 0, 0])
  curseur(render(), 'A').surValeur(70)
  assert.equal(curseur(render(), 'B').plafond, 30)
  curseur(render(), 'B').surValeur(50)
  assert.deepEqual(['A', 'B', 'C', 'D'].map(l => curseur(render(), l).valeur), [70, 30, 0, 0])
  await bouton(render(), 'Je ne sais pas (25 partout)')()
  assert.deepEqual(['A', 'B', 'C', 'D'].map(l => curseur(render(), l).valeur), [25, 25, 25, 25])
})

test('quiz — une question à moitié placée ne se quitte pas, et rien ne part', async () => {
  const appels: unknown[] = []
  const e = ecran<typeof import('../app/eleve/modules/quazian/quizz/[quizId]/PassationJetons')>('app/eleve/modules/quazian/quizz/[quizId]/PassationJetons.tsx', {
    sauvegarderReponse: async (...a: unknown[]) => { appels.push(a); return {} }, soumettreQuizz: async () => ({}),
  })
  const props = { sessionId: 's', quizId: 'quiz', questions: [1, 2].map(i => ({ id: 'q' + i, enonce: 'Question ' + i, options: ['A', 'B', 'C', 'D'] })), reponsesInitiales: {}, fermeAt: null }
  const render = () => { e.debut(); return e.composant.PassationJetons(props) }
  curseur(render(), 'B').surValeur(60)
  await bouton(render(), 2)()
  const arbre = render()
  assert.equal(appels.length, 0)
  assert.ok(noeuds(arbre).some(n => n.props.children === 'Question 1'))
  assert.ok(noeuds(arbre).some(n => n.props.role === 'alert'))
})

test('quiz — les cases disent répondue / vue sans réponse / pas encore vue', async () => {
  const e = ecran<typeof import('../app/eleve/modules/quazian/quizz/[quizId]/PassationJetons')>('app/eleve/modules/quazian/quizz/[quizId]/PassationJetons.tsx', {
    sauvegarderReponse: async () => ({}), soumettreQuizz: async () => ({}),
  })
  const props = { sessionId: 's', quizId: 'quiz', questions: [1, 2, 3].map(i => ({ id: 'q' + i, enonce: 'Question ' + i, options: ['A', 'B', 'C', 'D'] })), reponsesInitiales: {}, fermeAt: null }
  const render = () => { e.debut(); return e.composant.PassationJetons(props) }
  const cases = () => noeuds(render()).filter(n => n.type === 'button' && String(n.props['aria-label'] ?? '').startsWith('Question ')).map(n => n.props['aria-label'])
  assert.deepEqual(cases(), ['Question 1 — à l’écran', 'Question 2 — pas encore vue', 'Question 3 — pas encore vue'])
  curseur(render(), 'A').surValeur(100)
  await bouton(render(), 2)()          // q1 répondue, on ouvre q2…
  await bouton(render(), 1)()          // …et on la quitte sans y toucher
  assert.deepEqual(cases(), ['Question 1 — à l’écran', 'Question 2 — vue, sans réponse', 'Question 3 — pas encore vue'])
  await bouton(render(), 3)()          // la dernière, intacte…
  await bouton(render(), 'Revoir mes réponses →')()
  await recap(render()).surQuestion(1) // …et depuis le récapitulatif, retour à n'importe laquelle
  assert.ok(noeuds(render()).some(n => n.props.children === 'Question 2'))
  assert.deepEqual(cases(), ['Question 1 — répondue', 'Question 2 — à l’écran', 'Question 3 — vue, sans réponse'])
})

test('quiz — le serveur dit « temps écoulé » avant l’horloge de l’élève : le récapitulatif s’ouvre, l’envoi reste possible', async () => {
  let soumissions = 0
  const e = ecran<typeof import('../app/eleve/modules/quazian/quizz/[quizId]/PassationJetons')>('app/eleve/modules/quazian/quizz/[quizId]/PassationJetons.tsx', {
    sauvegarderReponse: async () => ({ error: 'Le temps est écoulé. Seules les réponses déjà enregistrées seront soumises.', ferme: true }),
    soumettreQuizz: async () => { soumissions++; return {} },
  })
  const props = { sessionId: 's', quizId: 'quiz', questions: [{ id: 'q', enonce: 'Question', options: ['A', 'B', 'C', 'D'] }], reponsesInitiales: {}, fermeAt: null }
  const render = () => { e.debut(); return e.composant.PassationJetons(props) }
  curseur(render(), 'A').surValeur(100)
  await bouton(render(), 'Revoir mes réponses →')()
  await recap(render()).surEnvoi()
  assert.equal(soumissions, 1)
  assert.ok(noeuds(render()).some(n => n.props.children === 'Quizz soumis !'))
})

test('quiz — une sauvegarde non confirmée interdit de laisser la question à zéro', async () => {
  const e = ecran<typeof import('../app/eleve/modules/quazian/quizz/[quizId]/PassationJetons')>('app/eleve/modules/quazian/quizz/[quizId]/PassationJetons.tsx', {
    sauvegarderReponse: async () => { throw new Error('Réseau') }, soumettreQuizz: async () => ({}),
  })
  const props = { sessionId: 's', quizId: 'quiz', questions: [1, 2].map(i => ({ id: 'q' + i, enonce: 'Question ' + i, options: ['A', 'B', 'C', 'D'] })), reponsesInitiales: {}, fermeAt: null }
  const render = () => { e.debut(); return e.composant.PassationJetons(props) }
  curseur(render(), 'A').surValeur(100)
  await bouton(render(), 2)()            // l'écriture a PEUT-ÊTRE eu lieu
  curseur(render(), 'A').surValeur(0)    // l'élève vide la question…
  await bouton(render(), 2)()            // …et ne peut plus la quitter vide
  assert.ok(noeuds(render()).some(n => n.props.children === 'Question 1'))
})

test('quiz — un refus de soumettreQuizz se dit, et le quiz n’est pas « soumis »', async () => {
  const e = ecran<typeof import('../app/eleve/modules/quazian/quizz/[quizId]/PassationJetons')>('app/eleve/modules/quazian/quizz/[quizId]/PassationJetons.tsx', {
    sauvegarderReponse: async () => ({}), soumettreQuizz: async () => ({ error: 'Refus simulé' }),
  })
  const props = { sessionId: 's', quizId: 'quiz', questions: [{ id: 'q', enonce: 'Question', options: ['A', 'B', 'C', 'D'] }], reponsesInitiales: {}, fermeAt: null }
  const render = () => { e.debut(); return e.composant.PassationJetons(props) }
  curseur(render(), 'B').surValeur(100)
  await bouton(render(), 'Revoir mes réponses →')()
  await recap(render()).surEnvoi()
  const arbre = render()
  assert.ok(noeuds(arbre).some(n => n.props.role === 'alert'))
  assert.equal(noeuds(arbre).some(n => n.props.children === 'Quizz soumis !'), false)
})
