// ============================================================================
// C4 · L8 — L'ÉDITION AVANT VALIDATION, ET L'APERÇU CÔTÉ ÉLÈVE.
// ----------------------------------------------------------------------------
// « Rien ne part sans que le professeur ait pu CORRIGER L'INSTANCE et LA VOIR
//   TELLE QUE L'ÉLÈVE LA VERRA. Une consigne juste au mauvais endroit de l'écran
//   est une consigne fausse, et c'est LE SEUL MOMENT OÙ CELA SE VOIT. »
//                                                       — `07-` §2, C4-L8
//
// ⚠️ « L'aperçu côté élève N'EST PAS L'ÉCRAN DE C4-L3 — il n'existe pas encore :
//    c'est L'INSTANCE, RENDUE SELON LES RÈGLES DE PLACEMENT. Quand C4-L3
//    existera, il n'y aura QU'UN rendu pour les deux — dis-le au relevé, ne le
//    construis pas deux fois » (piège 2 et 33). C'est écrit au relevé de séance.
// ============================================================================

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { garderProf } from '@/utils/fabrique/acces'
import { chargerDoctrineDepuisBase } from '@/utils/fabrique/doctrine'
import { composerApercu } from '@/utils/fabrique/conception'
import { lireLaBanque } from '@/utils/deroule/credence'
import { cranNumero } from '@/utils/cran'
import Edition from './Edition'
import Apercu from './Apercu'
import Assignation from './Assignation'

export const dynamic = 'force-dynamic'

/** Une ligne rendue par Supabase. Le client ne connaît pas le schéma : on la lit
 *  par accesseurs étroits plutôt qu'en la déréférençant à l'aveugle. */
type Ligne = Record<string, unknown>
const txt = (x: unknown): string => (typeof x === 'string' ? x : '')
const oui = (x: unknown): boolean => x === true
const tab = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
/** Une jointure Supabase rend tantôt un objet, tantôt un tableau d'un élément. */
const jointure = (x: unknown, k: string): Ligne => {
  const v = lig(x)[k]
  return lig(Array.isArray(v) ? v[0] : v)
}

/**
 * Le cran d'une instance, en NUMÉRO — ou `null` quand elle n'en a pas.
 *
 * ⛔ NE PAS REDÉFINIR ICI. `utils/cran.ts` est « le SEUL endroit où la forme se
 *    lit » (C4-L11), et il accepte LES DEUX formes — le numéro que la base porte
 *    depuis `c4_l11_cran_forme.sql`, et le code résiduel des scripts de recette.
 *
 * ⚠️ LA COPIE PRIVÉE QUI VIVAIT ICI FILTRAIT PAR `txt()`, donc n'acceptait QUE
 *    du texte — elle datait d'avant C4-L11, quand `exercices.cran` était du
 *    texte. Sur un `cran` entier, `txt(2)` rend `''` et le cran devenait `null` :
 *    TOUTE instance ayant un vrai cran s'affichait « sans cran », donc comme un
 *    examen diagnostique, et son formulaire de correction perdait le cas, le
 *    guide et les trois appuis. C'est très exactement le défaut que `utils/cran.ts`
 *    nomme — « cinq champs vides sur une instance parfaitement valide ».
 */
const cranDeLInstance = (x: unknown): number | null => cranNumero(x)


export default async function EditionEtApercu({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { admin } = await garderProf()
  const d = await chargerDoctrineDepuisBase(admin as never)

  const { data: ex } = await admin.from('exercices')
    .select('*, exercices_types(code, libelle, grain), exercices_cas(*, exercices_materiaux(contenu, defaut, famille, version_corrigee))')
    .eq('id', id).maybeSingle()
  if (!ex) notFound()
  const e = ex as unknown as Ligne

  const objet = txt(jointure(e, 'exercices_types').code)
  // ⭐ C4-L11 — UNE INSTANCE D'EXAMEN DIAGNOSTIQUE N'A PAS DE CRAN DU TOUT.
  //    Pas « un cran dans l'autre forme » : AUCUN — « le CRAN reste interdit »
  //    sur un type de nature `complet` (`07-` §1.1), et le trigger
  //    `trg_exercices_cran_selon_le_type` le tient. `Number(txt(e.cran))`
  //    rendait donc 0 sur un NULL, et NaN sur un cran écrit au code — puis
  //    `d.crans[…]` rendait `undefined` et l'en-tête affichait « cran NaN ».
  //    Unifier la forme du `cran` ne l'aurait pas réglé : il fallait un cas
  //    « sans cran » à l'affichage. Le reste de l'écran ne bouge pas — le bloc
  //    d'assignation, par où passe la suite du flux, fonctionnait déjà.
  const cran = cranDeLInstance(e.cran)
  const c = cran === null ? undefined : d.crans[cran]

  // Le matériau SOURCE, tel qu'il s'affichera dans les textes de support.
  let sourceTexte: string | null = null
  const srcTexteId = e.materiau_source_texte_id
  const srcSujetId = e.materiau_source_sujet_id
  if (srcTexteId) {
    const { data } = await admin.from('exercices_textes')
      .select('scriptorium_contenus(texte_extrait)').eq('id', srcTexteId).maybeSingle()
    const tout = txt(jointure(data, 'scriptorium_contenus').texte_extrait)
    const eng = tab(e.materiau_source_englobant).map(Number)
    // « Les textes s'affichent TELS QU'ILS SONT STOCKÉS » — les retours à la
    // ligne sont conservés (piège 33).
    sourceTexte = eng.length === 2 ? tout.slice(eng[0], eng[1]) : tout
  } else if (srcSujetId) {
    const { data } = await admin.from('exercices_sujets').select('enonce').eq('id', srcSujetId).maybeSingle()
    sourceTexte = txt(lig(data).enonce) || null
  }

  let cibleTexte: string | null = null
  const cibTexteId = e.materiau_cible_texte_id
  if (cibTexteId) {
    const { data } = await admin.from('exercices_textes')
      .select('scriptorium_contenus(texte_extrait)').eq('id', cibTexteId).maybeSingle()
    const tout = txt(jointure(data, 'scriptorium_contenus').texte_extrait)
    const eng = tab(e.materiau_cible_englobant).map(Number)
    cibleTexte = eng.length === 2 ? tout.slice(eng[0], eng[1]) : tout
  }

  const casTries = tab(e.exercices_cas).map(lig)
    .sort((a, b) => Number(a.ordre) - Number(b.ordre))
  const consignes = Array.isArray(e.consigne_instanciee)
    ? e.consigne_instanciee.map(txt)
    : [txt(e.consigne_instanciee)]

  // Sans cran, il n'y a rien à composer : l'aperçu se tait plutôt que de rendre
  // un placement tiré d'un cran inventé.
  const apercu = cran === null ? null : composerApercu(d, {
    objet, cran,
    materiauSourceTexte: sourceTexte,
    materiauCibleTexte: cibleTexte,
    guide: e.guide === null ? null : txt(e.guide),
    cas: casTries.map((cs, i) => ({
      consigne: consignes[i] ?? '',
      // ⭐⭐ C4-L15 / R2b — LES DEUX FORMES PHYSIQUES, ET C'EST `lireLaBanque` QUI
      //    LES TIENT. `exercices_cas.distracteurs` porte DEUX formes en base,
      //    aujourd'hui, côte à côte : des OBJETS `{texte, pourquoi_faux}` à
      //    l'import (`08-` §5.2 — c'est celle que la banque réelle produit) et
      //    des CHAÎNES sur une instance conçue à l'écran. ⛔ `txt()` ne rend une
      //    chaîne que si la valeur EST une chaîne : sur la forme d'objet, il
      //    rendait `''`, et l'aperçu servait `['', '', '', 'la réponse']` —
      //    trois candidats VIDES, trois lignes blanches à l'écran.
      // ⚠️ LE DÉFAUT ÉTAIT ANTÉRIEUR À C4-L15 ; ce lot l'a rendu VOYANT : depuis
      //    que l'aperçu marque le matériau, il SOUS-MARQUAIT — un seul mot en
      //    évidence côté professeur, quatre côté élève. *Or cet écran existe
      //    pour que « le professeur voie ce que l'élève verra ».*
      // ⭐ `lireLaBanque` est le lecteur de l'écran ÉLÈVE, déjà éprouvé : les
      //    deux voies lisent désormais par la MÊME fonction. ⛔ Et **on ne
      //    normalise toujours rien en base** — la normalisation reste à C4-L11.
      distracteurs: Array.isArray(cs.distracteurs) ? lireLaBanque(cs.distracteurs) : null,
      reponseAttendue: cs.reponse_attendue === null ? null : txt(cs.reponse_attendue),
      pourquoiJuste: cs.pourquoi_juste === null ? null : txt(cs.pourquoi_juste),
      materiauContenu: txt(jointure(cs, 'exercices_materiaux').contenu) || null,
      // ⭐ C4-L15 — le passage fautif des crans 3 et 5 se calcule ICI, sur le
      //    serveur, et **seules les positions descendent** : `composerApercu`
      //    ne rend que des tranches du `contenu`.
      materiauVersionCorrigee:
        txt(jointure(cs, 'exercices_materiaux').version_corrigee) || null,
    })),
  })

  const { data: classes } = await admin.from('classes')
    .select('id, nom, niveau, filiere').order('nom')

  return (
    <div className="space-y-6 pb-12">
      <header className="space-y-1">
        <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
          Pilotage · La fabrique ·{' '}
          <Link href="/prof/conception" className="underline">Conception</Link>
        </p>
        <h1 className="font-titre text-2xl text-encre">
          {txt(jointure(e, 'exercices_types').libelle) || objet}
          {cran === null
            ? <span className="text-encre-douce"> · sans cran</span>
            : <> · cran {cran} · <span className="text-encre-douce">{c?.code}</span></>}
        </h1>
        <p className="font-ui text-sm text-encre-douce">
          statut <strong>{txt(e.statut)}</strong>
          {txt(e.id_import) !== '' && <> · importée sous <code>{txt(e.id_import)}</code></>}
          {oui(e.bloque) && <span className="text-attention"> · bloquée</span>}
        </p>
      </header>

      {tab(e.blocages).map(txt).map((b, i) => (
        <p key={i} className="rounded-lg border border-attention bg-attention-teinte px-3 py-2
                              font-ui text-sm text-encre">{b}</p>
      ))}

      <Edition
        id={id}
        paire={oui(e.paire_diagnostic)}
        lieu={txt(e.lieu)}
        guide={e.guide === null ? null : txt(e.guide)}
        guideExige={c?.guide ?? 'null'}
        cranCommande={{
          defaut: c?.defaut === 'présent',
          distracteurs: c?.distracteurs === 'présent',
          reponseAttendue: c?.reponseAttendue === 'présent',
        }}
        optinSeJuger={oui(e.optin_se_juger)}
        optinConfiance={oui(e.optin_confiance_remise)}
        sansCran={cran === null}
        consigneSeule={consignes[0] ?? ''}
        cas={casTries.map((cs, i) => {
          const mat = jointure(cs, 'exercices_materiaux')
          return {
            ordre: Number(cs.ordre),
            consigne: consignes[i] ?? '',
            defaut: cs.defaut === null ? null : txt(cs.defaut),
            // ⭐⭐ LE MÊME DÉFAUT, UN SECOND SITE — ET CELUI-CI COÛTAIT DE LA DONNÉE.
            //    Ce champ alimente le FORMULAIRE D'ÉDITION, pas l'aperçu. Avec
            //    `txt()`, une instance dont les distracteurs sont des OBJETS
            //    (la forme d'import, `08-` §5.2) affichait un textarea **VIDE** —
            //    et `lireCas` (`../actions.ts`) écrit `null` quand le textarea
            //    est vide : **ouvrir l'instance et l'enregistrer DÉTRUISAIT les
            //    trois distracteurs**, sans un mot. Vu à l'écran le 24/08.
            // ⚠️ CE QUI RESTE, ET QUI N'EST PAS DE CE LOT : `lireCas` réécrit
            //    toujours des CHAÎNES. Enregistrer une instance importée garde
            //    donc les textes mais **perd les `pourquoi_faux`**. C'est une
            //    perte moindre — et surtout, la choisir, c'est trancher la FORME
            //    STOCKÉE, qui est la normalisation confiée à `C4-L11`. On ne la
            //    tranche pas ici ; elle est portée au registre.
            distracteurs: Array.isArray(cs.distracteurs) ? lireLaBanque(cs.distracteurs).join('\n') : '',
            reponseAttendue: cs.reponse_attendue === null ? null : txt(cs.reponse_attendue),
            pourquoiJuste: cs.pourquoi_juste === null ? null : txt(cs.pourquoi_juste),
            materiau: mat.defaut
              ? `${mat.famille ? `[${txt(mat.famille)}] ` : ''}${txt(mat.defaut)}`
              : null,
          }
        })}
      />

      {apercu && <Apercu apercu={apercu} />}

      <Assignation
        id={id}
        statut={txt(e.statut)}
        bloque={oui(e.bloque)}
        classeId={e.classe_id === null ? null : txt(e.classe_id)}
        classes={((classes ?? []) as unknown as Ligne[]).map((x) => ({
          id: txt(x.id), nom: [x.nom, x.niveau, x.filiere].filter(Boolean).map(txt).join(' · '),
        }))}
      />

      {/* C4-L4 — LA PORTE DE LA PASSATION EN CLASSE.
          « Tes écrans se posent dans Codex et Aletheia TELS QU'ILS SONT : ils ne
          réorganisent pas la navigation, qui est C4-L6 et C5-L4 » (piège 55).
          D'où un LIEN, ici, où le professeur vient déjà d'assigner — et aucun
          sous-onglet de plus. Le module se choisit sur le CANAL de l'instance :
          Codex pour l'écriture (`composer`), Aletheia pour la lecture.
          ⚠️ C'est le `lieu` qui commande l'existence de ce lien, jamais le module. */}
      {txt(e.lieu) === 'classe' && txt(e.statut) === 'assigne' && (
        <div className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
          <h2 className="font-titre text-lg text-encre">Le jour de la passation</h2>
          <p className="font-ui text-xs text-encre-douce max-w-3xl">
            Ouvrir le dépôt, lever les deux drapeaux de Monitoring, déclencher l&apos;analyse en
            lot, corriger et publier. <strong>L&apos;ouverture est un geste manuel</strong> — jamais
            une fenêtre calendaire.
          </p>
          <div className="flex flex-wrap gap-3 font-ui text-sm">
            <Link href={`/prof/codex/passation/${id}`}
              className="rounded-md bg-bouton px-3 py-1.5 text-parchemin">
              Passation — dans Codex
            </Link>
            <Link href={`/prof/aletheia/passation/${id}`}
              className="rounded-md border border-bordure-bouton px-3 py-1.5 text-encre-douce">
              Passation — dans Aletheia
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
