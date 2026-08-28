// ============================================================================
// C4 · L6 — L'ONGLET EXERCICES DU PROFESSEUR : tout l'écrit sous un seul toit.
// ----------------------------------------------------------------------------
// « Côté professeur : Exercices et Paramètres — TOUS LES EXERCICES VIVENT SOUS
//   UN SEUL ONGLET, c'est de là que se crée une SYNTHÈSE EN CLASSE comme un
//   EXAMEN DIAGNOSTIQUE, et la REVUE COMPLÈTE D'UNE SYNTHÈSE RENDUE s'y fait. »
//                                                            — `07-` §2, C4-L6
//
// ⭐ CE QUE CET ONGLET RÉUNIT — CINQ CHOSES, ET ON N'EN FABRIQUE AUCUNE : la
//    création d'une synthèse en classe (`FormulaireSynthese`), les examens
//    diagnostiques à concevoir (l'encart de C4-L9), la liste des synthèses avec
//    leurs états, la FILE DE VALIDATION, et l'ACCÈS AUX PASSATIONS EN CLASSE.
//    Les deux dernières n'avaient pas de porte ici : « Validation » était un
//    onglet — il ne l'est plus —, et la passation ne s'atteignait que depuis
//    `app/prof/conception/[id]`.
//
// ⭐ LA « REVUE COMPLÈTE D'UNE SYNTHÈSE RENDUE » N'EST PAS UN CHANTIER : c'est
//    le parcours liste → `synthese/[sessionId]` → `travail/[id]/v1` →
//    `validation/[id]`, qui existe déjà et qui doit tenir bout à bout SANS
//    JAMAIS QUITTER L'ONGLET — au sens de l'onglet ALLUMÉ, pas de la page. Ce
//    sont les `prefixes` de `components/nav/configModules.ts` qui le tiennent.
//
// ⛔ CE LOT NE DÉMÉNAGE PAS `app/prof/conception/` : le `02-` §6 B dit dans quel
//    MODULE un exercice se conçoit, pas à quelle ADRESSE ; l'écran est partagé
//    avec Aletheia, et C5-L4 n'est pas joué. On y RENVOIE PAR UN LIEN.
// ============================================================================

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { classesAvecModule } from '@/utils/acces'
import { lireCiblesCodex } from './actions'
import { preparerSynthese } from '../scriptorium/evaluations/actions'
import { chargerSynthesesAPreparer } from './synthese-a-preparer'
import { createAdminClient } from '@/utils/supabase/admin'
import { examensAConcevoir } from '@/utils/examens/plan'
import EncartAConcevoir from '@/components/examens/EncartAConcevoir'
import { FormulaireSynthese } from './FormulaireSynthese'
import { libelleSession } from '@/utils/codex-libelle'
import { titresCoursParSession } from '@/utils/codex-titre'
import { formatJour, formatInstant } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import Tuile from '@/components/Tuile'
import { nombreAValiderCodex, passationsDeClasse } from '@/utils/codex-onglets/liste'

// Accès & classes · L1 — l'échec ne peut plus être MUET. Cette action jetait le
// `error` de `preparerSynthese` : le prof pressait « Préparer → » et il ne se
// passait rien, sans un mot. Depuis que la garde de module refuse une classe sans
// Codex, ce silence serait devenu la règle plutôt que l'exception — et un bouton
// qui refuse sans le dire est le même défaut que la croix du Pilotage.
async function actionPreparer(formData: FormData): Promise<void> {
  'use server'
  const res = await preparerSynthese(formData.get('exercice_id') as string)
  if (res.sessionId) redirect(`/prof/codex/synthese/${res.sessionId}`)
  if (res.error) redirect(`/prof/codex?echec=${encodeURIComponent(res.error)}`)
}

const STATUT_BADGE: Record<string, { label: string; classe: string }> = {
  brouillon: { label: 'Brouillon', classe: 'bg-parchemin-fonce text-muet' },
  phase_1: { label: 'Phase 1 — V1', classe: 'bg-info-teinte text-info' },
  phase_2: { label: 'Phase 2 — V-finale', classe: 'bg-info-teinte text-info' },
  fermee: { label: 'Fermée', classe: 'bg-parchemin-fonce text-muet' },
}

const SANS_CLASSE = 'aucune'

export default async function CodexProfPage({ searchParams }: { searchParams: Promise<{ classe?: string; echec?: string }> }) {
  const supabase = await createClient()
  const { classe: classeSel, echec } = await searchParams

  // Accès & classes · L1 — le module appartient à la classe : ce sélecteur ne
  // propose plus que les classes AYANT Codex. Il gouverne à la fois le formulaire
  // de synthèse (le prof ne peut plus concevoir pour une classe sans le module)
  // et les tuiles de classes. `classesAvecModule` est le helper que Fragments
  // emploie déjà sur ses quatre écrans.
  const [cibles, { data: syntheses }, { data: moduleData }] = await Promise.all([
    lireCiblesCodex(),
    supabase
      .from('codex_sessions')
      .select('id, statut, classe_id, scriptorium_unite_id, created_at, scriptorium_unites(label), classes(nom)')
      .order('created_at', { ascending: false }),
    supabase.from('modules').select('id').eq('slug', 'codex').maybeSingle(),
  ])
  // Accès & classes · L1 — `classesAvecModule` est le SEUL écran de Codex qui
  // applique la règle « le module appartient à la classe » ; la réorganisation
  // ne le remplace pas par une lecture de toutes les classes.
  const classes = moduleData ? await classesAvecModule(supabase, moduleData.id as string) : []
  // Titres des cours (bras contenu bi-source) résolus à part.
  const titresCours = await titresCoursParSession(supabase, (syntheses ?? []).map((s) => s.id as string))

  const labelUnite = (s: { id: string; scriptorium_unites: unknown }) =>
    libelleSession(s.scriptorium_unites, null) || titresCours.get(s.id) || ''

  const classesList = classes
  const toutes = syntheses ?? []
  // Synthèses de fin de cours planifiées (plan d'évaluation, gate). Vide gate OFF.
  const aPreparer = await chargerSynthesesAPreparer()
  // C4-L9 — « le professeur voit ce qu'il a à concevoir, DANS SON MODULE ».
  // Lecture admin : les tables du plan sont en RLS prof-only. Gate du plan
  // OFF/absent → liste vide → encart absent, page inchangée.
  // ⚠️ `EncartAConcevoir` REND `null` SUR LISTE VIDE, et la liste est vide quand
  //    la porte du plan est fermée : une page nue n'est pas la preuve qu'il est
  //    cassé.
  const admin = createAdminClient()
  const [examens, aValider, passations, fuseau] = await Promise.all([
    examensAConcevoir(admin, 'codex'),
    // C4-L6 — « Validation » n'est plus un onglet : sans ce compte à côté du
    // lien, le professeur perdrait le seul signe qu'il a des retours en attente.
    nombreAValiderCodex(admin),
    // C4-L6 — la seconde porte vers la passation en classe. La première, posée
    // par C4-L4 depuis `app/prof/conception/[id]`, RESTE : deux portes vers le
    // même écran ne sont pas un doublon, ce sont deux moments du professeur.
    // ⭐ C5-L4 a fait de l'atelier un PARAMÈTRE (il valait `codex` en dur) : la
    //    même lecture sert l'onglet Exercices d'Aletheia. Rien du prédicat n'a
    //    changé — un second exemplaire aurait divergé au premier correctif.
    passationsDeClasse(admin, 'codex'),
    // ⚠️ `fenetre_debut` est un INSTANT (`timestamptz`), pas une date pure : il
    //    se formate DANS LE FUSEAU (`formatJour` est réservé aux colonnes
    //    `date`, qu'il rend en UTC — la règle du module Calendrier).
    lireFuseau(),
  ])

  // Nombre de synthèses par classe (clé SANS_CLASSE pour les synthèses non rattachées)
  const nbParClasse = new Map<string, number>()
  for (const s of toutes) {
    const k = (s.classe_id as string | null) ?? SANS_CLASSE
    nbParClasse.set(k, (nbParClasse.get(k) ?? 0) + 1)
  }
  const aSansClasse = (nbParClasse.get(SANS_CLASSE) ?? 0) > 0

  function ligneSynthese(s: (typeof toutes)[number]) {
    const badge = STATUT_BADGE[s.statut] ?? STATUT_BADGE.brouillon
    return (
      <Link
        key={s.id}
        href={`/prof/codex/synthese/${s.id}`}
        className="flex items-center justify-between gap-3 bg-surface border border-bordure rounded-xl px-4 py-3 hover:border-pigment transition-colors"
      >
        <p className="text-sm font-medium text-encre truncate min-w-0">{labelUnite(s)}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${badge.classe}`}>{badge.label}</span>
      </Link>
    )
  }

  // Synthèses de la classe sélectionnée
  const synthesesClasse = classeSel
    ? toutes.filter(s => ((s.classe_id as string | null) ?? SANS_CLASSE) === classeSel)
    : []
  const enCours = synthesesClasse.filter(s => s.statut === 'phase_1' || s.statut === 'phase_2')
  const brouillons = synthesesClasse.filter(s => s.statut === 'brouillon')
  const fermees = synthesesClasse.filter(s => s.statut === 'fermee')
  const nomClasseSel = classeSel === SANS_CLASSE ? 'Sans classe' : classesList.find(c => c.id === classeSel)?.nom

  return (
    <div className="space-y-8">
      {/* ⚠️ LE MESSAGE D'ÉCHEC SORT DE SA CONDITION. `actionPreparer` redirige
          vers `/prof/codex?echec=…` ; il ne s'affichait que DANS le bloc
          « Synthèses à préparer », donc seulement tant que cette liste était non
          vide. Un bouton qui refuse sans le dire est le défaut que ce chemin
          avait déjà eu une fois — la réorganisation ne le rouvre pas. */}
      {echec && (
        <p className="text-sm text-retard bg-retard-teinte rounded-lg px-3 py-2">{echec}</p>
      )}

      {/* Les portes de l'onglet : ce qui n'est plus (ou n'a jamais été) un onglet. */}
      <nav className="flex flex-wrap items-center gap-2">
        <Link
          href="/prof/codex/validation"
          className="font-ui text-xs inline-flex items-center gap-2 rounded-lg border border-bordure bg-surface px-3 py-2 text-encre hover:border-pigment transition-colors"
        >
          File de validation
          {aValider > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-attention-teinte text-attention">{aValider}</span>
          )}
        </Link>
        {/* ⛔ On RENVOIE à la conception, on ne la déménage pas : l'écran est
            partagé avec Aletheia, et C5-L4 n'est pas joué (`IDEES_post_rentree.md`). */}
        <Link
          href="/prof/conception"
          className="font-ui text-xs inline-flex items-center gap-2 rounded-lg border border-bordure bg-surface px-3 py-2 text-encre hover:border-pigment transition-colors"
        >
          Concevoir un exercice →
        </Link>
      </nav>

      <FormulaireSynthese cibles={cibles} classes={classesList} />

      <EncartAConcevoir module="codex" examens={examens} />

      {/* C4-L6 — les passations en classe, la seconde porte vers l'écran de
          C4-L4. ⚠️ Une liste vide ne se déguise pas en « rien à faire » : ce
          bloc ne s'affiche que s'il y a des passations, et l'interrupteur
          `passation_classe_actif` garde l'ÉCRAN, jamais cet inventaire. */}
      {passations.length > 0 && (
        <div className="bg-surface border border-bordure rounded-xl p-4">
          <h3 className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-muet mb-2">
            Passations en classe · {passations.length}
          </h3>
          <div className="space-y-2">
            {passations.map((p) => (
              <div key={p.exerciceId}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-bordure px-3 py-2">
                <span className="font-corps text-sm text-encre flex-1 min-w-0 truncate">
                  {p.titre}
                  {p.classeNom && <span className="text-muet"> — {p.classeNom}</span>}
                </span>
                {p.quand && (
                  <span className="font-ui text-xs text-muet shrink-0">
                    {formatInstant(p.quand, fuseau, { day: 'numeric', month: 'short' })}
                  </span>
                )}
                <Link href={p.href} className="font-ui text-xs text-pigment hover:underline shrink-0">
                  Ouvrir →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Synthèses de fin de cours planifiées (plan d'évaluation). Gate OFF → aPreparer
          vide → rien ne s'affiche (page Codex inchangée). */}
      {aPreparer.length > 0 && (
        <div className="bg-surface border border-bordure rounded-xl p-4">
          <h3 className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-muet mb-2">
            Synthèses à préparer · {aPreparer.length}
          </h3>
          <div className="space-y-2">
            {aPreparer.map((s) => (
              <form key={s.exerciceId} action={actionPreparer} className="flex items-center gap-3 rounded-lg border border-bordure px-3 py-2">
                <input type="hidden" name="exercice_id" value={s.exerciceId} />
                <span className="font-corps text-sm text-encre flex-1 min-w-0 truncate">
                  {s.contenuTitre}
                  {s.classeNom && <span className="text-muet"> — {s.classeNom}</span>}
                </span>
                <span className="font-ui text-xs text-muet shrink-0">
                  {s.echeance ? formatJour(s.echeance, { day: 'numeric', month: 'short' }) : 'date à définir'}
                </span>
                <button type="submit" className="font-ui text-xs text-pigment hover:underline shrink-0">Préparer →</button>
              </form>
            ))}
          </div>
        </div>
      )}

      {toutes.length === 0 ? (
        <p className="text-center text-muet text-sm py-8">
          Aucune synthèse pour le moment. Crée-en une à partir d&apos;une unité du Scriptorium.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classesList.map(c => {
            const n = nbParClasse.get(c.id) ?? 0
            return (
              <Tuile
                key={c.id}
                nom={c.nom}
                sousTitre={`${n} synthèse${n > 1 ? 's' : ''}`}
                href={`/prof/codex?classe=${c.id}`}
                selectionnee={classeSel === c.id}
                couleur={n > 0 ? 'vert' : 'neutre'}
              />
            )
          })}
          {aSansClasse && (
            <Tuile
              nom="Sans classe"
              sousTitre={`${nbParClasse.get(SANS_CLASSE)} synthèse${(nbParClasse.get(SANS_CLASSE) ?? 0) > 1 ? 's' : ''}`}
              href={`/prof/codex?classe=${SANS_CLASSE}`}
              selectionnee={classeSel === SANS_CLASSE}
            />
          )}
        </div>
      )}

      {classeSel && (
        <div className="space-y-6">
          <h3 className="text-base font-medium text-encre">{nomClasseSel ?? 'Classe'} — synthèses en classe</h3>
          {synthesesClasse.length === 0 && <p className="text-sm text-muet">Aucune synthèse pour cette classe.</p>}
          {enCours.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-muet mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ok animate-pulse" /> En cours
              </h4>
              <div className="space-y-2">{enCours.map(ligneSynthese)}</div>
            </section>
          )}
          {brouillons.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-muet mb-2">Brouillons</h4>
              <div className="space-y-2">{brouillons.map(ligneSynthese)}</div>
            </section>
          )}
          {fermees.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-muet mb-2">Passées</h4>
              <div className="space-y-2">{fermees.map(ligneSynthese)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
