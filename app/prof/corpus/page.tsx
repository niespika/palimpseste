// ============================================================================
// C4 · L8 — LE DÉPÔT DU CORPUS, et sa FILE DE VALIDATION.
// ----------------------------------------------------------------------------
// « Le fichier d'import et sa file de validation (`08-FORMAT_IMPORT.md`). Le
//   professeur fabrique son corpus HORS DE LA PLATEFORME ; ce lot ne lui fournit
//   qu'un endroit où le déposer et de quoi le valider. C'est ici aussi que le
//   RATTACHEMENT AU COURS se déclare. » — `07-` §2, C4-L8
//
// « LES TROIS VERDICTS ARRIVENT AU MÊME ENDROIT : le rapport d'import, à l'écran
//   du dépôt du corpus. AUCUN CANAL NEUF » (`08-` §7 ; piège 21).
//   « Un signalement qui ne s'affiche nulle part est un contrôle qui se tait. »
//
// ⚠️ Le DÉPÔT DES DÉMONSTRATIONS est un ONGLET de cet écran, et non un écran
//    propre : « onglet du dépôt du corpus ou écran propre, T'APPARTIENT ; ce qui
//    est requis : le dépôt PAR COMPÉTENCE ET PAR GRAIN, et l'avertissement
//    d'absence » (piège 20). Les démonstrations entrent par le MÊME FICHIER, en
//    cinquième banque, et n'ont donc pas de dépôt qui leur soit propre.
// ============================================================================

import Link from 'next/link'
import { lire, incidentsDe } from '@/utils/fabrique/lecture'
import { garderProf } from '@/utils/fabrique/acces'
import { formatJour } from '@/utils/fuseau'
import DepotCorpus from './DepotCorpus'
import FileDeValidation from './FileDeValidation'
import Rattachement from './Rattachement'
import Demonstrations from './Demonstrations'
import { cranNumero } from '@/utils/cran'

export const dynamic = 'force-dynamic'

/** Une ligne rendue par Supabase. Le client ne connaît pas le schéma : on la lit
 *  par accesseurs étroits plutôt qu'en la déréférençant à l'aveugle. */
type Ligne = Record<string, unknown>
const txt = (x: unknown): string => (typeof x === 'string' ? x : '')
const num = (x: unknown): number | null => (typeof x === 'number' ? x : null)
const oui = (x: unknown): boolean => x === true
const tab = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
/** Une jointure Supabase rend tantôt un objet, tantôt un tableau d'un élément. */
const jointure = (x: unknown, k: string): Ligne => {
  const v = lig(x)[k]
  return lig(Array.isArray(v) ? v[0] : v)
}


const ONGLETS = [
  ['depot', 'Déposer'],
  ['file', 'La file de validation'],
  ['rattachement', 'Le rattachement au cours'],
  ['demonstrations', 'Les démonstrations'],
] as const

export default async function DepotDuCorpus({
  searchParams,
}: { searchParams: Promise<{ onglet?: string }> }) {
  const { onglet: brut } = await searchParams
  const onglet = ONGLETS.some(([v]) => v === brut) ? brut! : 'depot'
  const { admin, actif } = await garderProf()

  // ⚠️ UNE LECTURE RATÉE N'EST PAS UNE BASE VIDE : « Aucune entrée » et « je n'ai
  //   pas pu lire » ne se disent pas de la même façon, et c'est de cette
  //   confusion que partent les gestes qui abîment.
  const [lImports, lTextes, lSujets, lMateriaux, lExercices, lDemos,
    lCours, lLivres] = await Promise.all([
    lire<Ligne>('les dépôts précédents',
      admin.from('exercices_imports').select('*').order('depose_at', { ascending: false }).limit(10)),
    lire<Ligne>('les textes',
      admin.from('exercices_textes').select('*, exercices_textes_cours(cours_declare, cours_id)')
        .neq('statut', 'retire').order('created_at')),
    lire<Ligne>('les sujets',
      admin.from('exercices_sujets').select('*, exercices_sujets_cours(cours_declare, cours_id)')
        .neq('statut', 'retire').order('created_at')),
    lire<Ligne>('les matériaux',
      admin.from('exercices_materiaux').select('id, id_import, import_id, objet_code, mode, famille, defaut, statut')
        .neq('statut', 'retire').order('created_at')),
    // ⭐ `consigne_instanciee` est ici POUR L'ÉCRAN, et pour rien d'autre : sans
    //    elle, la file affiche « argument · cran 2 · maison » et le professeur
    //    valide un exercice dont il ignore le contenu.
    lire<Ligne>('les exercices importés',
      // ⚠️ LE `select` RESTE UN LITTÉRAL D'UN SEUL TENANT. Coupé en deux avec un
      //    `+`, il cesse d'être une constante de type : le typeur de supabase-js
      //    ne sait plus le lire et rend `GenericStringError[]` — la ligne
      //    devient inassignable, et rien ne dit que c'est la MISE EN FORME qui
      //    l'a cassée. Même piège que celui déjà noté à `utils/routeur/donnees.ts`.
      admin.from('exercices').select('id, id_import, import_id, cran, lieu, statut, bloque, blocages, signalements, consigne_instanciee, exercices_types(code)')
        .not('id_import', 'is', null).order('created_at')),
    lire<Ligne>('les démonstrations',
      admin.from('exercices_demonstrations').select('*').order('competence')),
    lire<Ligne>('les cours du Scriptorium',
      admin.from('scriptorium_contenus').select('id, titre').eq('type', 'cours').order('titre')),
    // Les LIVRES de la plateforme — `aletheia_livre_reference` pointe une UNITÉ
    // du Scriptorium de type `livre`, et c'est son `label` qui se lit.
    lire<Ligne>('les livres',
      admin.from('aletheia_livre_reference')
        .select('id, scriptorium_unites:scriptorium_livre_id(label, supprime_at)').limit(50)),
  ])
  const incidents = incidentsDe(lImports, lTextes, lSujets, lMateriaux, lExercices,
    lDemos, lCours, lLivres)

  // ⭐ D'OÙ VIENT CHAQUE ENTRÉE. La file affichait son `id_import` — l'étiquette
  //    de la LIGNE — mais jamais le FICHIER qui l'a déposée. Or c'est lui qui
  //    dit la nature : `import_bloque.json` se lit tout seul, et une entrée
  //    bloquée à dessein cesse alors de ressembler à un geste qui attend.
  // ⚠️ On lit la table ENTIÈRE, pas les dix derniers dépôts : une entrée peut
  //    venir d'un import plus ancien, et son nom manquerait sans qu'on le voie.
  const lTousImports = await lire<Ligne>('les dépôts d’import',
    admin.from('exercices_imports').select('id, nom_fichier'))
  const fichierDe = new Map((lTousImports.lignes as unknown as Ligne[])
    .map((i) => [txt(i.id), txt(i.nom_fichier)]))
  const imports = lImports.lignes
  const textes = lTextes.lignes
  const sujets = lSujets.lignes
  const materiaux = lMateriaux.lignes
  const exercices = lExercices.lignes
  const demos = lDemos.lignes
  const cours = lCours.lignes
  const livres = lLivres.lignes

  return (
    <div className="space-y-6 pb-12">
      <header className="space-y-1">
        <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
          Pilotage · La fabrique
        </p>
        <h1 className="font-titre text-2xl text-encre">Le dépôt du corpus</h1>
        <p className="font-ui text-sm text-encre-douce max-w-3xl">
          Le corpus se fabrique <strong>hors de la plateforme</strong> ; cet écran est l&apos;endroit
          où le déposer et de quoi le valider. <strong>Toute entrée importée entre inactive</strong> :
          ni assignée ni servie, elle attend sa validation en file.
        </p>
      </header>

      {!actif && (
        <p className="rounded-lg border border-attention bg-attention-teinte px-3 py-2 font-ui text-sm text-encre">
          <code>fabrique_actif</code>{' '}est à OFF : rien de ce qui est déposé ici n&apos;est encore servi.
        </p>
      )}

      {incidents.length > 0 && (
        <div className="rounded-lg border border-retard bg-retard-teinte px-3 py-2 space-y-1">
          <p className="font-ui text-sm text-encre">
            <strong>Des lectures ont échoué.</strong> Ce que cet écran ne montre pas n’est
            peut-être pas absent : il n’a pas pu être lu.
          </p>
          {incidents.map((x, i) => (
            <p key={i} className="font-ui text-xs text-encre-douce">· {x}</p>
          ))}
        </div>
      )}

      <nav className="inline-flex flex-wrap rounded-lg border border-bordure bg-surface p-0.5 font-ui text-sm">
        {ONGLETS.map(([v, libelle]) => (
          <Link
            key={v} href={`/prof/corpus?onglet=${v}`}
            aria-current={onglet === v ? 'true' : undefined}
            className={`rounded-md px-3.5 py-1.5 transition-colors ${
              onglet === v ? 'bg-bouton text-surface' : 'text-encre-douce hover:bg-parchemin-fonce'}`}
          >
            {libelle}
          </Link>
        ))}
      </nav>

      {onglet === 'depot' && (
        <section className="space-y-4">
          <DepotCorpus />
          <div className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
            <h2 className="font-titre text-lg text-encre">Les dépôts précédents</h2>
            {imports.length === 0
              ? <p className="font-ui text-sm text-muet">Aucun dépôt.</p>
              : (
                <ul className="divide-y divide-bordure font-ui text-sm">
                  {(imports as unknown as Ligne[]).map((i) => {
                    const r = lig(i.rapport)
                    return (
                      <li key={txt(i.id)} className="py-2 space-y-1">
                        <p className="text-encre">
                          <code>{txt(i.nom_fichier)}</code> · {formatJour(txt(i.depose_at),
                            { day: 'numeric', month: 'short' })} · format {txt(i.version) || '?'} ·{' '}
                          <span className={i.verdict === 'refuse' ? 'text-retard' : 'text-ok'}>
                            {txt(i.verdict)}
                          </span>
                        </p>
                        <p className="text-xs text-muet">
                          {tab(r.refus).length} refus · {tab(r.blocages).length} blocage(s) ·{' '}
                          {tab(r.signalements).length} signalement(s)
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
          </div>
        </section>
      )}

      {onglet === 'file' && (
        <FileDeValidation
          textes={(textes as unknown as Ligne[]).map((t) => ({
            id: txt(t.id), idImport: txt(t.id_import),
            fichier: fichierDe.get(txt(t.import_id)) ?? null, libelle: `${txt(t.auteur)} — ${txt(t.titre)}`,
            statut: txt(t.statut), bloque: oui(t.bloque), blocages: tab(t.blocages).map(txt),
          }))}
          sujets={(sujets as unknown as Ligne[]).map((s) => ({
            id: txt(s.id), idImport: txt(s.id_import),
            fichier: fichierDe.get(txt(s.import_id)) ?? null, libelle: txt(s.enonce),
            statut: txt(s.statut), bloque: oui(s.bloque), blocages: tab(s.blocages).map(txt),
          }))}
          materiaux={(materiaux as unknown as Ligne[]).map((m) => ({
            id: txt(m.id), idImport: txt(m.id_import),
            fichier: fichierDe.get(txt(m.import_id)) ?? null,
            libelle: `${txt(m.objet_code)} · ${txt(m.mode)} — ${txt(m.defaut)}`,
            statut: txt(m.statut), bloque: false, blocages: [],
          }))}
          exercices={(exercices as unknown as Ligne[]).map((e) => ({
            id: txt(e.id), idImport: txt(e.id_import),
            fichier: fichierDe.get(txt(e.import_id)) ?? null,
            // ⛔ JAMAIS `txt(e.cran)` : la base porte le NUMÉRO depuis C4-L11, et `txt()`
            //    d'un entier rend `''`. `utils/cran.ts` lit la forme, seul.
            libelle: `${txt(jointure(e, 'exercices_types').code) || '?'} · ${
              cranNumero(e.cran) === null ? 'sans cran' : `cran ${cranNumero(e.cran)}`
            } · ${txt(e.lieu)}`,
            statut: txt(e.statut), bloque: oui(e.bloque), blocages: tab(e.blocages).map(txt),
            signalements: tab(e.signalements).map(txt),
            // Ce que l'entrée EST, en clair — la consigne est le seul texte qui le dise.
            detail: Array.isArray(e.consigne_instanciee)
              ? e.consigne_instanciee.map(txt).join(' · ')
              : txt(e.consigne_instanciee),
            // Et de quoi aller voir le détail plutôt que de valider à l'aveugle.
            lien: `/prof/conception/${txt(e.id)}`,
          }))}
          demonstrations={(demos as unknown as Ligne[]).filter((d) => d.id_import).map((d) => ({
            id: txt(d.id), idImport: txt(d.id_import),
            fichier: fichierDe.get(txt(d.import_id)) ?? null,
            libelle: `${txt(d.competence)} · ${txt(d.grain)} · ${txt(d.forme)} — ${txt(d.theme)}`,
            statut: txt(d.statut), bloque: false, blocages: [],
            signalements: tab(d.signalements).map(txt),
          }))}
        />
      )}

      {onglet === 'rattachement' && (
        <Rattachement
          textes={(textes as unknown as Ligne[]).map((t) => ({
            id: txt(t.id), idImport: txt(t.id_import), libelle: `${txt(t.auteur)} — ${txt(t.titre)}`,
            coursEtat: txt(t.cours_etat),
            declares: tab(t.exercices_textes_cours).map((c) => ({
              nom: txt(lig(c).cours_declare), coursId: lig(c).cours_id === null ? null : txt(lig(c).cours_id) })),
            planLivre: t.plan_livre_declare === null ? null : txt(t.plan_livre_declare),
            planLivreId: t.plan_livre_id === null ? null : txt(t.plan_livre_id),
            planSemaine: num(t.plan_semaine),
          }))}
          sujets={(sujets as unknown as Ligne[]).map((s) => ({
            id: txt(s.id), idImport: txt(s.id_import), libelle: txt(s.enonce),
            coursEtat: txt(s.cours_etat),
            declares: tab(s.exercices_sujets_cours).map((c) => ({
              nom: txt(lig(c).cours_declare), coursId: lig(c).cours_id === null ? null : txt(lig(c).cours_id) })),
          }))}
          cours={(cours as unknown as Ligne[]).map((c) => ({ id: txt(c.id), titre: txt(c.titre) }))}
          livres={(livres as unknown as Ligne[])
            .filter((l) => !jointure(l, 'scriptorium_unites').supprime_at)
            .map((l) => ({
              id: txt(l.id), titre: txt(jointure(l, 'scriptorium_unites').label) || txt(l.id) }))}
        />
      )}

      {onglet === 'demonstrations' && (
        <Demonstrations
          demonstrations={(demos as unknown as Ligne[]).map((d) => ({
            id: txt(d.id), competence: txt(d.competence), grain: txt(d.grain),
            forme: txt(d.forme), theme: txt(d.theme), statut: txt(d.statut),
            signalements: tab(d.signalements).map(txt),
          }))}
        />
      )}
    </div>
  )
}
