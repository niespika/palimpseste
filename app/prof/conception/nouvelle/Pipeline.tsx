'use client'

// ============================================================================
// C4 · L8 — LE PIPELINE, DANS L'ORDRE DE LA SOURCE.
// ----------------------------------------------------------------------------
// ALETHEIA (`02-` §6 B.1 ; piège 27), dans CET ordre :
//   1. le TEXTE — déjà déposé, déjà pourvu de sa référence validée
//   2. la SÉLECTION — mot · phrase · extrait · texte complet → donne le
//      `support` et la LOCALISATION
//   3. l'ENGLOBANT — la portion affichée autour ; obligatoire et non vide sur
//      l'objet `phrase` ; c'est LUI que la règle de non-emboîtement lit
//   4. l'OBJET — parmi les treize, FILTRÉS PAR LA PLAGE ADMISE DE
//      `support_source`, QUI BORNE L'ENGLOBANT et non la sélection
//   5. le MODE, puis le CRAN
//   6. LE CRAN décide si la sélection est `materiau_cible` ou `materiau_source` —
//      LE PROFESSEUR NE L'ASSIGNE PAS
//   7. la CONSIGNE — la banque du couple objet × mode × cran s'affiche, il en
//      choisit une PUIS PEUT EN RÉÉCRIRE LA FORMULATION
//      ⚠️ « La réécriture porte sur la FORMULATION, JAMAIS SUR L'OBSERVABLE :
//         il est celui de la consigne choisie, il vient DE LA ROUTE, pas de la
//         saisie » (`04-` §0)
//
// CODEX (`02-` §6 B.2 ; piège 28) : le mode est TOUJOURS `composer` ; le
// professeur choisit si l'élève S'APPUIE SUR un matériau (`materiau_source`) ou
// TRAVAILLE À PARTIR d'un matériau (`materiau_cible`) ; les provenances ouvertes
// sont `genere` et `sujet`.
//
// ⚠️ CE QUI SE DÉRIVE NE SE SAISIT PAS (piège 31) : la DURÉE, le `regime_v1vf`,
//    la COUVERTURE, la SÉRIE, le JUGEMENT, la PRÉSENCE de l'appui. L'écran les
//    AFFICHE, il ne les demande jamais.
// ============================================================================

import { useActionState, useMemo, useState } from 'react'
import { concevoirInstance, type RetourConception } from '../actions'
import { ciblePrimaireDeLInstance } from '@/utils/fabrique/conception'

export interface CarteDoctrine {
  objets: Record<string, {
    code: string; libelle: string; grain: string; nature: string
    supportSource: string[]; genres: string[]; competences: string[]
    modes: string[]; crans: number[]
    sourceParMode: Record<string, { provenances: string[]; supports: string[] }>
  }>
  crans: Record<number, {
    n: number; code: string; geste: string; appui: string; fait: string
    palierVise: string; materiauCible: string; defaut: string; distracteurs: string
    reponseAttendue: string; guide: string; jugement: string; couverture: string
    regimeV1vf: string
  }>
  modesAdmis: Record<string, string[]>
  durees: Record<string, number>
  routes: Record<string, Array<{
    competence: string; code: string; nom: string; section: number; fichier: string
    crans: number[]
    consignes: Record<string, { appui: string; consigne: string }>
    defautInjecte: string
  }>>
  consignesProduction: Record<string, string>
  guidesProduction: Record<string, { figure: string | null; cran2: string | null; cran6: string | null }>
}

const SUPPORTS = ['mot', 'phrase', 'extrait', 'texte'] as const
const ETAGE = 'rounded-xl border border-bordure bg-surface p-4 space-y-3'
const CHAMP = 'rounded-md border border-bordure-bouton bg-parchemin px-2 py-1 font-ui text-sm text-encre'

export default function Pipeline({ porte, carte, textes, sujets, materiaux }: {
  porte: 'aletheia' | 'codex'
  carte: CarteDoctrine
  textes: Array<{ id: string; libelle: string; contenu: string }>
  sujets: Array<{ id: string; libelle: string }>
  materiaux: Array<{
    id: string; objet: string; mode: string; support: string; famille: string | null
    defaut: string; contenu: string; observableCode: string; observableCompetence: string
  }>
}) {
  const [retour, action, enCours] = useActionState<RetourConception | null, FormData>(
    concevoirInstance, null)

  // ── 1-3. Le texte, la sélection, l'englobant ──────────────────────────────
  const [texteId, setTexteId] = useState('')
  const [locDebut, setLocDebut] = useState('')
  const [locFin, setLocFin] = useState('')
  const [engDebut, setEngDebut] = useState('')
  const [engFin, setEngFin] = useState('')
  const [supportEnglobant, setSupportEnglobant] = useState('extrait')

  // ── 4-5. L'objet, le mode, le cran ────────────────────────────────────────
  const [objet, setObjet] = useState('')
  const [mode, setMode] = useState(porte === 'codex' ? 'composer' : '')
  const [cran, setCran] = useState<number | ''>('')
  const [genre, setGenre] = useState('')
  const [lieu, setLieu] = useState('maison')

  // ── Codex : le matériau ───────────────────────────────────────────────────
  const [roleMateriau, setRoleMateriau] = useState<'source' | 'cible'>('cible')
  const [provenanceCodex, setProvenanceCodex] = useState('genere')
  const [sujetId, setSujetId] = useState('')

  // ── 7. La consigne, l'observable, l'appui ─────────────────────────────────
  const [routeChoisie, setRouteChoisie] = useState('')     // `competence|section`
  const [consignes, setConsignes] = useState<string[]>(['', ''])
  const [competences, setCompetences] = useState<string[]>([])
  const [ciblePrimaire, setCiblePrimaire] = useState('')
  const [materiauxCas, setMateriauxCas] = useState<string[]>(['', ''])

  const texte = textes.find((t) => t.id === texteId)
  const objetsPourEnglobant = useMemo(() => Object.values(carte.objets)
    .filter((o) => porte === 'codex' || o.supportSource.includes(supportEnglobant))
    .filter((o) => o.modes.some((m) => porte === 'codex' ? m === 'composer' : m !== 'composer'))
    .sort((a, b) => a.code.localeCompare(b.code)), [carte, supportEnglobant, porte])

  const o = objet ? carte.objets[objet] : null
  const modesDeclarables = useMemo(() => {
    if (!o) return []
    return o.modes
      .filter((m) => porte === 'codex' ? m === 'composer' : m !== 'composer')
      // « Le couple (objet, mode) n'est pas déclarable si AUCUNE compétence de
      // l'objet n'admet le mode » (02- §6 B).
      .filter((m) => o.competences.some((c) => (carte.modesAdmis[c] ?? []).includes(m)))
  }, [o, carte, porte])

  const c = cran === '' ? null : carte.crans[cran]
  const nCas = c?.geste === 'diagnostiquer' ? 2 : 1
  const dureeMin = o && c ? carte.durees[`${c.geste}|${o.grain}`] : null

  // LE CRAN décide du rôle de la sélection — le professeur ne l'assigne pas.
  const cibleExigee = c?.materiauCible === 'présent'
  const cibleInterdite = c?.materiauCible === 'null'
  const selectionEstCible = porte === 'aletheia' && cibleExigee

  const routesDuCouple = useMemo(() => {
    if (!objet || !mode || !c || c.couverture !== 'isole') return []
    return (carte.routes[`${objet}|${mode}`] ?? []).filter((r) => r.crans.includes(c.n))
  }, [carte, objet, mode, c])

  const route = routesDuCouple.find((r) => `${r.competence}|${r.section}` === routeChoisie)

  // ⭐ LA RÈGLE DE LA CIBLE PRIMAIRE — la MÊME fonction que le serveur re-dérive
  //    (`utils/fabrique/conception.ts`). Un écran n'est pas une garde, mais les
  //    deux doivent lire la même règle : sinon le champ s'affiche là où le
  //    serveur l'impose, ou l'inverse.
  const regleCible = ciblePrimaireDeLInstance({
    geste: c?.geste ?? null,
    observableCompetence: route?.competence ?? null,
    competences,
  })
  const consigneDeLaBanque = route && c ? route.consignes[String(c.n)]?.consigne ?? '' : ''

  // La consigne des CRANS DE PRODUCTION — le patron du 04- §14.1, l'objet en case.
  const patronProduction = useMemo(() => {
    if (!o || !c || c.couverture !== 'exerce' || !mode) return ''
    const patron = carte.consignesProduction[`${mode}|${c.n}`] ?? ''
    const g = carte.guidesProduction[genre ? `${objet}|${genre}` : objet]
      ?? carte.guidesProduction[objet]
    return patron
      .replace('<objet>', o.libelle.replace(/^(L'|Le |La |Les )/, (m) => m.toLowerCase()))
      .replace('<ce qui est servi>', c.n === 2 ? (carte.guidesProduction[objet]?.cran2 ?? '') : '')
      .replace('<les appuis nommés>', c.n === 6 ? (g?.cran6 ?? '') : '')
  }, [o, c, mode, carte, objet, genre])

  const competencesOuvertes = useMemo(() => {
    if (!o || !mode) return []
    const auteurSource = porte === 'aletheia' && !selectionEstCible
    const auteurCible = porte === 'aletheia' && selectionEstCible
    return o.competences.map((comp) => {
      const admis = carte.modesAdmis[comp] ?? []
      if (!admis.includes(mode)) return { comp, ouverte: false, motif: '02- §3 : mode non admis' }
      const mono = admis.length === 1
      if (mode !== 'composer' && !auteurSource && !auteurCible && !mono) {
        return { comp, ouverte: false, motif: 'règle 3 : aucun texte d’auteur servi' }
      }
      if (auteurSource && mode === 'composer') {
        if (comp === 'argumentation' || comp === 'questionnement') {
          return { comp, ouverte: false, motif: 'règle 4 : texte d’auteur en source' }
        }
      }
      return { comp, ouverte: true, motif: '' }
    })
  }, [o, mode, carte, porte, selectionEstCible])

  const materiauxUtiles = materiaux.filter((m) => m.objet === objet && m.mode === mode)

  return (
    <form action={action} className="space-y-4">
      {/* ── ALETHEIA 1-3 : le texte, la sélection, l'englobant ─────────────── */}
      {porte === 'aletheia' && (
        <section className={ETAGE}>
          <h2 className="font-titre text-lg text-encre">1 · Le texte, la sélection, l&apos;englobant</h2>
          <p className="font-ui text-xs text-encre-douce">
            Seuls les textes <strong>dont la référence est validée</strong> entrent ici : une
            référence non validée n&apos;entre jamais en Phase 2.
          </p>
          <select name="texte" value={texteId} onChange={(e) => setTexteId(e.target.value)}
            className={`${CHAMP} w-full`} required>
            <option value="">— choisir un texte déposé —</option>
            {textes.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
          </select>
          {texte && (
            <>
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md border
                            border-bordure bg-parchemin p-2 font-serif text-sm text-encre">
                {texte.contenu}
              </p>
              <div className="flex flex-wrap items-end gap-3 font-ui text-sm">
                <label className="space-y-0.5">
                  <span className="block text-xs text-muet">sélection — début</span>
                  <input type="number" min={0} value={locDebut}
                    onChange={(e) => setLocDebut(e.target.value)} className={`${CHAMP} w-24`} />
                </label>
                <label className="space-y-0.5">
                  <span className="block text-xs text-muet">fin (exclue)</span>
                  <input type="number" min={0} value={locFin}
                    onChange={(e) => setLocFin(e.target.value)} className={`${CHAMP} w-24`} />
                </label>
                <label className="space-y-0.5">
                  <span className="block text-xs text-muet">englobant — début</span>
                  <input type="number" min={0} value={engDebut}
                    onChange={(e) => setEngDebut(e.target.value)} className={`${CHAMP} w-24`} />
                </label>
                <label className="space-y-0.5">
                  <span className="block text-xs text-muet">fin (exclue)</span>
                  <input type="number" min={0} value={engFin}
                    onChange={(e) => setEngFin(e.target.value)} className={`${CHAMP} w-24`} />
                </label>
                <label className="space-y-0.5">
                  <span className="block text-xs text-muet">étendue de l&apos;englobant</span>
                  <select value={supportEnglobant} onChange={(e) => { setSupportEnglobant(e.target.value); setObjet('') }}
                    className={CHAMP}>
                    {SUPPORTS.filter((s) => s !== 'mot').map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <p className="font-ui text-xs text-muet">
                C&apos;est l&apos;<strong>englobant</strong> que la règle de non-emboîtement lit —
                l&apos;étendue réellement lue — et c&apos;est lui, jamais la sélection, que la plage
                admise de <code>support_source</code> borne. Il est
                {' '}<strong>obligatoire et non vide sur l&apos;objet « la phrase »</strong>.
              </p>
            </>
          )}
        </section>
      )}

      {/* ── CODEX 2-4 : le matériau ─────────────────────────────────────────── */}
      {porte === 'codex' && (
        <section className={ETAGE}>
          <h2 className="font-titre text-lg text-encre">1 · Le matériau</h2>
          <div className="flex flex-wrap items-center gap-3 font-ui text-sm">
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={roleMateriau === 'source'}
                onChange={() => setRoleMateriau('source')} />
              l&apos;élève <strong>s&apos;appuie sur</strong> un matériau — <code>materiau_source</code>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={roleMateriau === 'cible'}
                onChange={() => setRoleMateriau('cible')} />
              l&apos;élève <strong>travaille à partir</strong> d&apos;un matériau — <code>materiau_cible</code>
            </label>
          </div>
          <div className="flex flex-wrap items-end gap-3 font-ui text-sm">
            <label className="space-y-0.5">
              <span className="block text-xs text-muet">provenance</span>
              <select value={provenanceCodex} onChange={(e) => setProvenanceCodex(e.target.value)}
                className={CHAMP}>
                <option value="genere">genere — un matériau fabriqué</option>
                <option value="sujet">sujet — un énoncé de la banque</option>
              </select>
            </label>
            {provenanceCodex === 'sujet' && (
              <label className="min-w-64 flex-1 space-y-0.5">
                <span className="block text-xs text-muet">le sujet</span>
                <select name={roleMateriau === 'source' ? 'sujet_source' : 'sujet_cible'}
                  value={sujetId} onChange={(e) => setSujetId(e.target.value)}
                  className={`${CHAMP} w-full`}>
                  <option value="">— choisir —</option>
                  {sujets.map((s) => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                </select>
              </label>
            )}
          </div>
          <p className="font-ui text-xs text-muet">
            <code>texte_auteur</code> n&apos;est pas ouvert ici — la règle 4 le rend incompatible
            avec <code>composer</code> pour l&apos;Argumentation, la Structure et le Questionnement ;
            un exercice bâti sur un texte d&apos;auteur se conçoit dans Aletheia.
            {' '}<code>production_eleve</code> reste une provenance qu&apos;aucun module n&apos;ouvre.
          </p>
        </section>
      )}

      {/* ── L'objet, le mode, le cran ────────────────────────────────────────── */}
      <section className={ETAGE}>
        <h2 className="font-titre text-lg text-encre">2 · L&apos;objet, le mode, le cran</h2>
        <div className="flex flex-wrap items-end gap-3 font-ui text-sm">
          <label className="space-y-0.5">
            <span className="block text-xs text-muet">objet</span>
            <select name="objet" value={objet} required
              onChange={(e) => { setObjet(e.target.value); setMode(porte === 'codex' ? 'composer' : ''); setCran(''); setRouteChoisie('') }}
              className={CHAMP}>
              <option value="">— choisir —</option>
              {objetsPourEnglobant.map((x) => (
                <option key={x.code} value={x.code}>{x.libelle} · {x.grain}</option>
              ))}
            </select>
          </label>
          <label className="space-y-0.5">
            <span className="block text-xs text-muet">mode</span>
            <select name="mode" value={mode} required
              onChange={(e) => { setMode(e.target.value); setRouteChoisie('') }}
              className={CHAMP} disabled={!objet}>
              <option value="">— choisir —</option>
              {modesDeclarables.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="space-y-0.5">
            <span className="block text-xs text-muet">cran</span>
            <select name="cran" value={cran} required
              onChange={(e) => { setCran(Number(e.target.value)); setRouteChoisie('') }}
              className={CHAMP} disabled={!mode}>
              <option value="">— choisir —</option>
              {(o?.crans ?? []).map((n) => (
                <option key={n} value={n}>{n} · {carte.crans[n].code}</option>
              ))}
            </select>
          </label>
          {(o?.genres.length ?? 0) > 0 && (
            <label className="space-y-0.5">
              <span className="block text-xs text-muet">genre <em>(sur l&apos;instance)</em></span>
              <select name="genre" value={genre} onChange={(e) => setGenre(e.target.value)}
                className={CHAMP} required>
                <option value="">— choisir —</option>
                {o!.genres.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
          )}
          <label className="space-y-0.5">
            <span className="block text-xs text-muet">lieu de la passation</span>
            <select name="lieu" value={lieu} onChange={(e) => setLieu(e.target.value)} className={CHAMP}>
              <option value="maison">maison</option>
              <option value="classe">classe</option>
            </select>
          </label>
        </div>

        {/* CE QUI SE DÉRIVE — affiché, jamais demandé. */}
        {c && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border border-bordure
                         bg-parchemin p-3 font-ui text-xs text-encre-douce sm:grid-cols-3">
            <div><dt className="text-muet">geste</dt><dd>{c.geste} · appui {c.appui}</dd></div>
            <div><dt className="text-muet">durée décomptée</dt>
              <dd>{dureeMin ?? '—'} min <em>(dérivée du geste et du grain)</em></dd></div>
            <div><dt className="text-muet">régime v1 → vf</dt><dd>{c.regimeV1vf}</dd></div>
            <div><dt className="text-muet">couverture</dt><dd>{c.couverture}</dd></div>
            <div><dt className="text-muet">jugement</dt><dd>{c.jugement}</dd></div>
            <div><dt className="text-muet">materiau_cible</dt><dd>{c.materiauCible}</dd></div>
            <div><dt className="text-muet">appui à fournir</dt>
              <dd>{[c.defaut === 'présent' && 'defaut', c.distracteurs === 'présent' && 'distracteurs',
                c.reponseAttendue === 'présent' && 'reponse_attendue',
                c.guide !== 'null' && `guide ${c.guide}`].filter(Boolean).join(' · ') || 'rien'}</dd></div>
            <div><dt className="text-muet">cas</dt>
              <dd>{nCas === 2 ? 'la PAIRE — un exercice, deux cas' : 'un cas'}</dd></div>
            <div><dt className="text-muet">palier visé</dt><dd>{c.palierVise}</dd></div>
          </dl>
        )}
        {porte === 'aletheia' && c && (
          <p className="font-ui text-xs text-attention">
            C&apos;est <strong>le cran</strong> qui décide : la sélection est
            {' '}<strong>{selectionEstCible ? 'le materiau_cible' : 'le materiau_source'}</strong>
            {cibleInterdite && <> — la cible est <code>null</code> dès que l&apos;élève produit du neuf</>}.
            {' '}Vous ne l&apos;assignez pas.
          </p>
        )}
      </section>

      {/* ── Les compétences mesurables ───────────────────────────────────────── */}
      {o && mode && (
        <section className={ETAGE}>
          <h2 className="font-titre text-lg text-encre">3 · Ce que l&apos;instance peut mesurer</h2>
          <p className="font-ui text-xs text-encre-douce">
            <strong>L&apos;exercice est générique</strong> : vous ne désignez aucune cible.
            {' '}C&apos;est le routeur qui l&apos;élit. Le mode s&apos;élit
            {' '}<strong>par compétence mesurée</strong>.
          </p>
          <ul className="flex flex-wrap gap-3 font-ui text-sm">
            {competencesOuvertes.map(({ comp, ouverte, motif }) => (
              <li key={comp}>
                <label className={`flex items-center gap-1.5 ${ouverte ? 'text-encre' : 'text-muet'}`}>
                  <input type="checkbox" name="competence" value={comp} disabled={!ouverte}
                    checked={competences.includes(comp)}
                    onChange={(e) => setCompetences((s) => e.target.checked
                      ? [...s, comp] : s.filter((x) => x !== comp))} />
                  {comp}{!ouverte && <span className="text-xs"> — {motif}</span>}
                </label>
              </li>
            ))}
          </ul>

          {/* ── LA CIBLE PRIMAIRE — et le cas où elle NE SE DEMANDE PAS ──────
              « L'écran de conception la lui demande — parmi les compétences que
                son exercice mesure, ET UNE SEULE ; quand il n'y en a QU'UNE
                POSSIBLE […] L'ÉCRAN LA POSE SANS LA DEMANDER. » (`07-` §1.1)
              ⭐ Un champ toujours affiché serait un écart à la source. */}
          {regleCible.demande ? (
            <div className="space-y-1.5 border-t border-bordure pt-3">
              <p className="font-ui text-xs text-encre-douce">
                <strong>La cible du retour</strong> — une seule, parmi celles que vous venez de
                cocher. C&apos;est elle qui commande le retour, et c&apos;est sur elle
                {' '}<strong>seule</strong> que la version finale rejoue ses appels.
              </p>
              <div className="flex flex-wrap gap-3 font-ui text-sm">
                {regleCible.candidates.map((comp) => (
                  <label key={comp} className="flex items-center gap-1.5 text-encre">
                    <input type="radio" name="cible_primaire" value={comp}
                      checked={ciblePrimaire === comp}
                      onChange={() => setCiblePrimaire(comp)} />
                    {comp}
                  </label>
                ))}
              </div>
            </div>
          ) : regleCible.imposee && (
            <p className="border-t border-bordure pt-3 font-ui text-xs text-encre-douce">
              <strong>Cible du retour : {regleCible.imposee}</strong> — posée sans être demandée,
              {' '}{regleCible.motif}.
            </p>
          )}
        </section>
      )}

      {/* ── La consigne, depuis la banque ────────────────────────────────────── */}
      {o && mode && c && (
        <section className={ETAGE}>
          <h2 className="font-titre text-lg text-encre">4 · La consigne</h2>
          {c.couverture === 'isole' ? (
            <>
              <p className="font-ui text-xs text-encre-douce">
                La banque du couple <code>{objet}</code> × <code>{mode}</code> × cran {c.n}.
                {' '}<strong>La consigne porte l&apos;observable que le cran isole</strong> — c&apos;est
                ce qui remplit la couverture sans une saisie de plus. Vous pouvez
                {' '}<strong>réécrire la formulation</strong> ; l&apos;observable, lui, vient de la
                route et ne se saisit pas.
              </p>
              <select value={routeChoisie} required
                onChange={(e) => {
                  setRouteChoisie(e.target.value)
                  const r = routesDuCouple.find((x) => `${x.competence}|${x.section}` === e.target.value)
                  const texteConsigne = r?.consignes[String(c.n)]?.consigne ?? ''
                  setConsignes([texteConsigne, texteConsigne])
                }}
                className={`${CHAMP} w-full`}>
                <option value="">— choisir une consigne de la banque ({routesDuCouple.length}) —</option>
                {routesDuCouple.map((r) => (
                  <option key={`${r.competence}|${r.section}`} value={`${r.competence}|${r.section}`}>
                    {r.nom} · {r.competence} · {r.code}
                  </option>
                ))}
              </select>
              {route && (
                <>
                  <input type="hidden" name="observable_code" value={route.code} />
                  <input type="hidden" name="observable_competence" value={route.competence} />
                  <p className="font-ui text-xs text-muet">
                    observable isolé : <code>{route.code}</code> · {route.competence} ·
                    {' '}écrit à <code>{route.fichier}</code> §{route.section} ·
                    {' '}<em>défaut injecté attendu : {route.defautInjecte}</em>
                  </p>
                </>
              )}
            </>
          ) : (
            <p className="font-ui text-xs text-encre-douce">
              Ce cran est un <strong>cran de production</strong> : <code>exerce</code>, aucun
              observable n&apos;y est isolé. Le patron vient du <code>04-</code> §14.1, et
              {' '}<strong>une consigne de cran de production ne nomme aucun observable</strong> —
              elle en ferait une cible, et <code>exerce</code> deviendrait <code>isole</code>.
            </p>
          )}

          {Array.from({ length: nCas }, (_, i) => (
            <fieldset key={i} className="space-y-2 rounded-md border border-bordure p-3">
              <legend className="px-1 font-ui text-xs uppercase tracking-wide text-muet-clair">
                {nCas === 2 ? `cas ${i + 1} — ${i === 0 ? 'traité sur indication' : 'un cas neuf de la même famille, traité seul'}` : 'le cas'}
              </legend>
              <textarea
                name={`cas_${i + 1}_consigne`} required rows={2}
                value={consignes[i] || (c.couverture === 'exerce' ? patronProduction : consigneDeLaBanque)}
                onChange={(e) => setConsignes((s) => s.map((x, k) => k === i ? e.target.value : x))}
                className={`${CHAMP} w-full`}
                placeholder="le texte que l’élève lit"
              />
              {c.materiauCible !== 'null' && porte === 'codex' && provenanceCodex === 'genere' && (
                <label className="block space-y-0.5">
                  <span className="block font-ui text-xs text-muet">le matériau de ce cas</span>
                  <select name={`cas_${i + 1}_materiau`} value={materiauxCas[i] ?? ''}
                    onChange={(e) => setMateriauxCas((s) => s.map((x, k) => k === i ? e.target.value : x))}
                    className={`${CHAMP} w-full`}>
                    <option value="">— choisir dans la banque —</option>
                    {materiauxUtiles.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.famille ? `[${m.famille}] ` : ''}{m.defaut} — {m.contenu.slice(0, 60)}…
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {c.defaut === 'présent' && (
                <label className="block space-y-0.5">
                  <span className="block font-ui text-xs text-muet">
                    le <code>defaut</code> injecté — <em>le matériau calibré : défaut OU réussite</em>
                  </span>
                  <input name={`cas_${i + 1}_defaut`} required className={`${CHAMP} w-full`} />
                </label>
              )}
              {c.distracteurs === 'présent' && (
                <label className="block space-y-0.5">
                  <span className="block font-ui text-xs text-muet">
                    la <strong>banque</strong> de distracteurs — un par ligne.
                    {' '}<strong>Trois au minimum</strong> (l&apos;instance en tire trois),
                    {' '}<strong>dix à quinze en cible</strong> ; l&apos;écran en sert quatre, jamais quinze.
                  </span>
                  <textarea name={`cas_${i + 1}_distracteurs`} rows={4} className={`${CHAMP} w-full`} />
                </label>
              )}
              {c.reponseAttendue === 'présent' && (
                <label className="block space-y-0.5">
                  <span className="block font-ui text-xs text-muet">
                    la <code>reponse_attendue</code> — <em>elle ne se dérive pas du défaut :
                    nommer ce qui cloche ne donne pas la version réparée</em>
                  </span>
                  <input name={`cas_${i + 1}_reponse`} required className={`${CHAMP} w-full`} />
                </label>
              )}
            </fieldset>
          ))}

          {c.guide !== 'null' && (
            <label className="block space-y-0.5">
              <span className="block font-ui text-xs text-muet">
                le <code>guide</code> <strong>{c.guide}</strong>, servi <strong>avant</strong> la v1 —
                {' '}<em>le guide n&apos;est pas le retour</em>.
                {carte.guidesProduction[objet] && (
                  <> Ce que le <code>04-</code> §14.2 en dit pour cet objet :
                    {' '}<em>{c.n === 2 ? carte.guidesProduction[objet].cran2
                      : (carte.guidesProduction[genre ? `${objet}|${genre}` : objet]
                        ?? carte.guidesProduction[objet]).cran6}</em></>
                )}
              </span>
              <textarea name="guide" rows={2} required className={`${CHAMP} w-full`} />
            </label>
          )}
        </section>
      )}

      {/* ── Les deux drapeaux d'opt-in ───────────────────────────────────────── */}
      <section className={ETAGE}>
        <h2 className="font-titre text-lg text-encre">5 · Les deux drapeaux d&apos;opt-in de classe</h2>
        <p className="font-ui text-xs text-encre-douce">
          <strong>Faux par défaut</strong>, lus sur le <code>lieu</code> seul, et
          {' '}<strong>sans effet quand <code>lieu</code> vaut <code>maison</code></strong>, où les deux
          gestes sont de droit. Ils se lèvent à la conception, ou jusqu&apos;à l&apos;ouverture du dépôt.
          {' '}<em>Le format d&apos;import ne les porte pas.</em>
        </p>
        <div className="flex flex-wrap gap-4 font-ui text-sm">
          <label className={`flex items-center gap-1.5 ${lieu === 'maison' ? 'text-muet' : 'text-encre'}`}>
            <input type="checkbox" name="optin_se_juger" value="oui" disabled={lieu === 'maison'} />
            « se juger » — deux questions en classe, jamais trois
          </label>
          <label className={`flex items-center gap-1.5 ${lieu === 'maison' ? 'text-muet' : 'text-encre'}`}>
            <input type="checkbox" name="optin_confiance_remise" value="oui" disabled={lieu === 'maison'} />
            la confiance de remise — une valeur par compétence <code>evaluee</code>
          </label>
        </div>
      </section>

      {/* Les renvois que le pipeline a posés, portés au formulaire. */}
      {porte === 'aletheia' && (
        <>
          <input type="hidden" name={selectionEstCible ? 'texte_cible' : 'texte_source'} value={texteId} />
          <input type="hidden" name="provenance_source" value={selectionEstCible ? '' : 'texte_auteur'} />
          <input type="hidden" name="support_source" value={selectionEstCible ? '' : supportEnglobant} />
          <input type="hidden" name="provenance_cible" value={selectionEstCible ? 'texte_auteur' : ''} />
          <input type="hidden" name="support_cible" value={selectionEstCible ? supportEnglobant : ''} />
          <input type="hidden" name={selectionEstCible ? 'localisation_cible_debut' : 'localisation_debut'} value={locDebut} />
          <input type="hidden" name={selectionEstCible ? 'localisation_cible_fin' : 'localisation_fin'} value={locFin} />
          <input type="hidden" name={selectionEstCible ? 'englobant_cible_debut' : 'englobant_debut'} value={engDebut} />
          <input type="hidden" name={selectionEstCible ? 'englobant_cible_fin' : 'englobant_fin'} value={engFin} />
        </>
      )}
      {porte === 'codex' && (
        <>
          <input type="hidden" name={roleMateriau === 'source' ? 'provenance_source' : 'provenance_cible'}
            value={provenanceCodex} />
          <input type="hidden" name={roleMateriau === 'source' ? 'support_source' : 'support_cible'}
            value={provenanceCodex === 'sujet' ? '' : 'extrait'} />
        </>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={enCours || !objet || !mode || cran === ''}
          className="rounded-md bg-bouton px-4 py-2 font-ui text-sm text-surface disabled:opacity-50">
          {enCours ? 'Écriture…' : 'Concevoir l’instance'}
        </button>
        <span className="font-ui text-xs text-muet">
          Rien ne part avant que vous l&apos;ayez corrigée et vue côté élève.
        </span>
      </div>

      {retour && (
        <div role="status" className={`rounded-lg border px-3 py-2 space-y-1 ${
          retour.ok ? 'border-ok bg-ok-teinte' : 'border-retard bg-retard-teinte'}`}>
          <p className="font-ui text-sm text-encre">{retour.message}</p>
          {(retour.empechements ?? []).map((e, i) => (
            <p key={i} className="font-ui text-xs text-encre-douce">· {e}</p>
          ))}
          {retour.exerciceId && (
            <a href={`/prof/conception/${retour.exerciceId}`}
              className="font-ui text-sm text-encre underline">
              corriger l’instance et la voir côté élève →
            </a>
          )}
        </div>
      )}
    </form>
  )
}
