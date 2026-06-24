import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { classesAvecRappel } from '@/utils/rappels'
import { calculerSante, type SanteInscription } from '@/utils/sante'
import { tachesDeriveesDuCalendrier } from '@/utils/calendrier-a-faire'
import Tuile, { type CouleurTuile } from '@/components/Tuile'
import DetailClasse, { type LigneEleve } from '@/components/classes/DetailClasse'
import RappelsClasses from './RappelsClasses'
import BoutonRetirerEleve from './BoutonRetirerEleve'
import ConfirmationEffacement from './classes/ConfirmationEffacement'
import BandeCalendrier from './calendrier/BandeCalendrier'
import TuilesJourSemaine from './calendrier/TuilesJourSemaine'
import CoutApi from './CoutApi'

const NIVEAU_LABEL: Record<string, string> = { '1ere': 'Première', terminale: 'Terminale' }

function sousTitreClasse(c: { niveau: string | null; filiere: string | null; annee_scolaire: string }) {
  return [c.niveau ? NIVEAU_LABEL[c.niveau] ?? c.niveau : null, c.filiere, c.annee_scolaire].filter(Boolean).join(' · ')
}

// Badges « où en est l'élève » dérivés de la santé (fragments + révision).
function StatutEleve({ s }: { s: SanteInscription | undefined }) {
  if (!s) return <span className="text-xs text-muet">—</span>
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muet">{s.nbDeposes}/{s.nbSemainesPassees} dépôts</span>
      {s.nbManquants > 0 && <span className="text-attention">{s.nbManquants} manquant{s.nbManquants > 1 ? 's' : ''}</span>}
      {s.moyenne != null && <span className="text-muet">moy. {s.moyenne.toFixed(1)}/4</span>}
      {s.backlogRevision > 0 && <span className="text-muet">{s.backlogRevision} à réviser</span>}
      {s.enDifficulte && (
        <span className="bg-retard-teinte text-retard px-1.5 py-0.5 rounded-full">à risque</span>
      )}
    </div>
  )
}

export default async function ProfAccueil({ searchParams }: { searchParams: Promise<{ classe?: string }> }) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { classe: classeSel } = await searchParams

  const [{ data: classes }, { data: inscriptionsActives }, rappels, sante, tachesCal] = await Promise.all([
    admin.from('classes').select('id, nom, niveau, filiere, annee_scolaire').order('nom'),
    admin.from('inscriptions').select('id, eleve_id, classe_id').eq('statut', 'active'),
    classesAvecRappel(supabase),
    calculerSante(admin),
    tachesDeriveesDuCalendrier(),
  ])

  const toutesClasses = classes ?? []
  const inscrits = inscriptionsActives ?? []

  // ── Zone 1 : fragments à valider (analyses générées, toutes classes) ────────
  const { data: analysesAValider } = await admin
    .from('fragments_analyses').select('depot_id').eq('statut', 'generee')
  const depotIdsAValider = (analysesAValider ?? []).map((a) => a.depot_id as string)
  const { data: depotsAValider } = depotIdsAValider.length > 0
    ? await admin.from('fragments_depots').select('id, inscription_id, semaine_id').in('id', depotIdsAValider)
    : { data: [] }
  const inscIdsAValider = [...new Set((depotsAValider ?? []).map((d) => d.inscription_id as string))]
  const { data: inscAValider } = inscIdsAValider.length > 0
    ? await admin.from('inscriptions').select('id, eleve_id, classe_id').in('id', inscIdsAValider)
    : { data: [] }
  const inscMap = new Map((inscAValider ?? []).map((i) => [i.id as string, i]))
  const eleveIdsAValider = [...new Set((inscAValider ?? []).map((i) => i.eleve_id as string))]
  // Noms pour TOUTES les lignes affichées : à valider + inscriptions actives (couvre les
  // « élèves à risque », sinon ils s'affichaient « ? » dès qu'il n'y avait rien à valider).
  const eleveIdsAffichage = [...new Set([
    ...inscrits.map((i) => i.eleve_id as string),
    ...eleveIdsAValider,
  ])]
  const { data: profilsAffichage } = eleveIdsAffichage.length > 0
    ? await admin.from('profiles').select('id, display_name').in('id', eleveIdsAffichage)
    : { data: [] }
  const nomEleve = new Map((profilsAffichage ?? []).map((p) => [p.id as string, p.display_name as string]))
  const { data: semainesV } = await admin.from('fragments_semaines').select('id, numero')
  const numSemaine = new Map((semainesV ?? []).map((s) => [s.id as string, s.numero as number]))
  const nomClasse = new Map(toutesClasses.map((c) => [c.id, c.nom]))

  const aValider = (depotsAValider ?? []).map((d) => {
    const insc = inscMap.get(d.inscription_id as string)
    return {
      depotId: d.id as string,
      classeId: insc?.classe_id as string | undefined,
      eleveNom: insc ? nomEleve.get(insc.eleve_id as string) ?? '?' : '?',
      classeNom: insc ? nomClasse.get(insc.classe_id as string) ?? '' : '',
      semaineNum: numSemaine.get(d.semaine_id as string) ?? '?',
    }
  })
  const aValiderParClasse = new Map<string, number>()
  for (const v of aValider) if (v.classeId) aValiderParClasse.set(v.classeId, (aValiderParClasse.get(v.classeId) ?? 0) + 1)

  // ── Zone 2 : santé de la cohorte (par inscription) ──────────────────────────
  const santeValues = [...sante.values()]
  const totalSuivi = santeValues.length
  const enDifficulte = santeValues.filter((s) => s.enDifficulte)
  const nbAJour = totalSuivi - enDifficulte.length
  const pctAJour = totalSuivi > 0 ? Math.round((nbAJour / totalSuivi) * 100) : null

  // ── Zone 3 : agrégats par classe (santé) ────────────────────────────────────
  const inscritsParClasse = new Map<string, string[]>() // classeId → eleveIds
  for (const i of inscrits) {
    const arr = inscritsParClasse.get(i.classe_id as string) ?? []
    arr.push(i.eleve_id as string)
    inscritsParClasse.set(i.classe_id as string, arr)
  }
  const santeParClasse = new Map<string, SanteInscription[]>()
  for (const s of santeValues) {
    const arr = santeParClasse.get(s.classeId) ?? []
    arr.push(s)
    santeParClasse.set(s.classeId, arr)
  }

  // ── Détail de la classe sélectionnée ────────────────────────────────────────
  let detail: { classe: typeof toutesClasses[number]; lignes: LigneEleve[] } | null = null
  const classeChoisie = toutesClasses.find((c) => c.id === classeSel)
  if (classeChoisie) {
    const insClasse = inscrits.filter((i) => i.classe_id === classeChoisie.id)
    const eleveIds = insClasse.map((i) => i.eleve_id as string)
    const inscIds = insClasse.map((i) => i.id as string)
    const { data: profils } = eleveIds.length > 0
      ? await admin.from('profiles').select('id, display_name').in('id', eleveIds).order('display_name')
      : { data: [] }
    const santeParEleve = new Map(santeValues.filter((s) => s.classeId === classeChoisie.id).map((s) => [s.eleveId, s]))

    // Indicateurs légers essai + Codex (scopés à la classe)
    const { data: essais } = inscIds.length > 0
      ? await admin.from('fragments_essai_depots').select('id, inscription_id').in('inscription_id', inscIds)
      : { data: [] }
    const essaiIds = (essais ?? []).map((e) => e.id as string)
    const { data: essaiAnalyses } = essaiIds.length > 0
      ? await admin.from('fragments_essai_depot_analyses').select('depot_id, statut').in('depot_id', essaiIds)
      : { data: [] }
    const statutEssaiParEssai = new Map((essaiAnalyses ?? []).map((a) => [a.depot_id as string, a.statut as string]))
    const essaiParInsc = new Map<string, string>() // inscription → statut affiché
    for (const e of essais ?? []) {
      const st = statutEssaiParEssai.get(e.id as string)
      essaiParInsc.set(e.inscription_id as string, st === 'publiee' ? 'publié' : st ? 'analysé' : 'déposé')
    }
    const { data: codexT } = inscIds.length > 0
      ? await admin.from('codex_travaux').select('inscription_id').in('inscription_id', inscIds)
      : { data: [] }
    const codexParInsc = new Map<string, number>()
    for (const t of codexT ?? []) codexParInsc.set(t.inscription_id as string, (codexParInsc.get(t.inscription_id as string) ?? 0) + 1)
    const inscParEleve = new Map(insClasse.map((i) => [i.eleve_id as string, i.id as string]))

    const lignes: LigneEleve[] = (profils ?? []).map((p) => {
      const inscId = inscParEleve.get(p.id as string)
      const essai = inscId ? essaiParInsc.get(inscId) : undefined
      const nbCodex = inscId ? codexParInsc.get(inscId) ?? 0 : 0
      return {
        id: p.id as string,
        display_name: p.display_name as string,
        statut: (
          <div className="flex flex-wrap items-center gap-1.5">
            <StatutEleve s={santeParEleve.get(p.id as string)} />
            {essai && <span className="text-xs text-muet">essai {essai}</span>}
            {nbCodex > 0 && <span className="text-xs text-muet">Codex ×{nbCodex}</span>}
          </div>
        ),
        actions: <BoutonRetirerEleve classeId={classeChoisie.id} eleveId={p.id as string} nom={p.display_name as string} />,
      }
    })
    detail = { classe: classeChoisie, lignes }
  }

  return (
    <div className="space-y-10 pb-10">
      <h2 className="text-xl font-serif text-encre">Tableau de bord</h2>

      {/* ── Calendrier : aujourd'hui / cette semaine + bande des semaines ───── */}
      <TuilesJourSemaine />
      <BandeCalendrier />

      {/* ── Zone 1 : À faire ───────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muet uppercase tracking-wide">À faire</h3>
        <RappelsClasses classes={rappels} />
        {tachesCal.length > 0 && (
          <div className="bg-surface border border-bordure rounded-xl px-5 py-4">
            <p className="text-sm font-medium text-encre mb-2">À préparer (échéances proches)</p>
            <ul className="space-y-1.5">
              {tachesCal.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-encre-douce">
                    {t.label}
                    {t.classeNom && <span className="text-muet"> · {t.classeNom}</span>}
                    <span className="text-muet"> · {new Date(t.echeance + 'T00:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</span>
                  </span>
                  <Link href={t.href} className="text-xs text-muet hover:text-encre underline flex-shrink-0">
                    Ouvrir →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="bg-surface border border-bordure rounded-xl px-5 py-4">
          {aValider.length === 0 ? (
            <p className="text-sm text-muet">Rien à valider pour le moment.</p>
          ) : (
            <>
              <p className="text-sm font-medium text-encre mb-2">
                {aValider.length} fragment{aValider.length > 1 ? 's' : ''} à valider
              </p>
              <ul className="space-y-1.5">
                {aValider.slice(0, 8).map((v) => (
                  <li key={v.depotId} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-encre-douce">
                      {v.eleveNom}
                      {v.classeNom && <span className="text-muet"> · {v.classeNom}</span>}
                      <span className="text-muet"> · semaine {v.semaineNum}</span>
                    </span>
                    <Link href={`/prof/fragments-erudition/analyse/${v.depotId}`} className="text-xs text-muet hover:text-encre underline flex-shrink-0">
                      Valider →
                    </Link>
                  </li>
                ))}
              </ul>
              {aValider.length > 8 && <p className="text-xs text-muet mt-2">+ {aValider.length - 8} autres…</p>}
            </>
          )}
        </div>
      </section>

      {/* ── Zone 2 : Santé de la cohorte ───────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muet uppercase tracking-wide">Santé de la cohorte</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-surface border border-bordure rounded-xl p-5">
            <p className="text-3xl font-serif text-encre">{pctAJour != null ? `${pctAJour}%` : '—'}</p>
            <p className="text-sm text-muet mt-0.5">à jour ({nbAJour}/{totalSuivi} inscriptions)</p>
          </div>
          <Link href="/prof/a-risque" className="bg-surface border border-bordure rounded-xl p-5 block hover:border-muet hover:shadow-sm transition-all">
            <p className="text-3xl font-serif text-retard">{enDifficulte.length}</p>
            <p className="text-sm text-muet mt-0.5">en difficulté <span className="text-muet">· voir le détail →</span></p>
          </Link>
          <div className="bg-surface border border-bordure rounded-xl p-5 sm:col-span-1">
            <p className="text-sm text-muet mb-1">Élèves à risque</p>
            {enDifficulte.length === 0 ? (
              <p className="text-sm text-ok">Aucun 🎉</p>
            ) : (
              <>
                <ul className="space-y-1">
                  {enDifficulte.slice(0, 4).map((s) => (
                    <li key={s.inscriptionId} className="text-sm">
                      <Link href={`/prof/eleves/${s.eleveId}`} className="text-encre-douce hover:text-retard hover:underline">
                        {nomEleve.get(s.eleveId) ?? '?'}
                      </Link>
                      <span className="text-xs text-muet"> · {nomClasse.get(s.classeId)}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/prof/a-risque" className="text-xs text-muet hover:text-retard underline mt-2 inline-block">
                  Voir les {enDifficulte.length} à risque et pourquoi →
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Coût API (synthèse du mois) ────────────────────────────────────── */}
      <CoutApi />

      {/* ── Zone 3 : Tuiles de classe ──────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muet uppercase tracking-wide">Classes</h3>
        {toutesClasses.length === 0 ? (
          <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-muet text-sm">
            Aucune classe. <Link href="/prof/classes" className="underline">Créer une classe →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {toutesClasses.map((c) => {
              const nbInscrits = (inscritsParClasse.get(c.id) ?? []).length
              const santeClasse = santeParClasse.get(c.id) ?? []
              const aDesFragments = santeClasse.length > 0
              const nbDiff = santeClasse.filter((s) => s.enDifficulte).length
              const nbValider = aValiderParClasse.get(c.id) ?? 0
              const couleur: CouleurTuile = !aDesFragments ? 'neutre' : nbDiff > 0 ? 'rouge' : 'vert'
              return (
                <Tuile
                  key={c.id}
                  nom={c.nom}
                  sousTitre={sousTitreClasse(c)}
                  couleur={couleur}
                  href={`/prof?classe=${c.id}`}
                  selectionnee={classeSel === c.id}
                  resume={
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-muet">{nbInscrits} élève{nbInscrits > 1 ? 's' : ''}</span>
                      {nbDiff > 0 && <span className="bg-retard-teinte text-retard px-1.5 py-0.5 rounded-full">{nbDiff} à risque</span>}
                      {nbValider > 0 && <span className="bg-attention-teinte text-attention px-1.5 py-0.5 rounded-full">{nbValider} à valider</span>}
                      {aDesFragments && nbDiff === 0 && <span className="text-ok">à jour</span>}
                    </div>
                  }
                />
              )
            })}
          </div>
        )}

        {detail && (
          <div className="pt-2">
            <DetailClasse
              nom={detail.classe.nom}
              sousTitre={sousTitreClasse(detail.classe)}
              eleves={detail.lignes}
              action={<ConfirmationEffacement classeId={detail.classe.id} classeNom={detail.classe.nom} nbEleves={detail.lignes.length} />}
            />
          </div>
        )}
      </section>
    </div>
  )
}
