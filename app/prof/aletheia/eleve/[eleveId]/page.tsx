import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Pastille from '@/components/Pastille'
import { MicroStepper, StepperNomme } from '@/components/aletheia/Steppers'
import { VueRetourV1, VueRetourVF } from '@/components/aletheia/VueRetours'
import { DetailDiagChapitre } from '@/components/aletheia/Diagnostic'
import { livresDeClasse, travauxEleve, progression, chargerDiagnostics, STATUT_LABEL, type LivreProf, type Progression } from '../../donnees'
import { couleurLivre } from '@/app/prof/aletheia/diagnostic'
import { chargerCapstoneLivre, dateIndicative } from '@/app/eleve/modules/aletheia/data'
import type { CapstoneRow, TravailAletheia, DiagnosticTravail, StatutAletheia } from '@/app/eleve/modules/aletheia/types'
import GrapheProgression, { type LivreGraphe } from './GrapheProgression'
import AvantApres from './AvantApres'

// ── Petits champs de saisie (réutilisés dans le panneau « saisie complète ») ──
function Champ({ label, valeur }: { label: string; valeur: string | null | undefined }) {
  if (!valeur) return null
  return (
    <div>
      <p className="text-xs font-medium text-muet mb-0.5">{label}</p>
      <p className="text-sm text-encre-douce whitespace-pre-wrap">{valeur}</p>
    </div>
  )
}

function ListeChamp({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null
  return (
    <div>
      <p className="text-xs font-medium text-muet mb-0.5">{label}</p>
      <ul className="list-disc list-inside space-y-0.5 text-sm text-encre-douce">
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  )
}

// Chip d'état : pigment si DONE, ocre si « à valider » (FEEDBACK2_READY), muet
// sinon. Jamais de vert sur la fiche prof.
function ChipEtat({ statut }: { statut: StatutAletheia }) {
  const cls = statut === 'DONE' ? 'bg-pigment-teinte text-pigment'
    : statut === 'FEEDBACK2_READY' ? 'bg-attention-teinte text-attention'
    : 'bg-parchemin-fonce text-muet'
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${cls}`}>{STATUT_LABEL[statut]}</span>
}

// État de la carte d'architecture (capstone) du livre, en pied de carte-livre.
function texteCapstone(cap: CapstoneRow | null | undefined, p: Progression): string {
  if (cap?.statut !== 'READY') {
    return cap?.statut === 'PENDING' ? 'Pas encore générée (génération en cours).'
      : cap?.statut === 'ERROR' ? 'Génération échouée — régénère-la depuis le Scriptorium.'
      : 'Pas encore générée — à générer depuis le Scriptorium.'
  }
  if (p.total === 0) return 'Livre pas encore découpé en semaines.'
  return p.done === p.total
    ? 'L’élève a terminé le livre : la carte lui est accessible.'
    : `L’élève y accèdera à la fin du livre (${p.done}/${p.total} semaines).`
}

// ── Liste maître : une ligne de semaine (sélecteur fin, pilote l'URL) ─────────
function LigneSemaine({ livre, semaine, titre, chapitres, statut, actif, basePath }: {
  livre: string; semaine: number; titre: string; chapitres: string | null; statut: StatutAletheia; actif: boolean; basePath: string
}) {
  return (
    <Link
      href={`${basePath}?l=${livre}&s=${semaine}`}
      scroll={false}
      aria-current={actif ? 'true' : undefined}
      className={`flex items-center gap-3 px-4 py-3 min-h-[44px] transition-colors ${actif ? 'bg-pigment-teinte border-l-2 border-l-liseret' : 'border-l-2 border-l-transparent hover:bg-parchemin-fonce/40'}`}
    >
      <span className="font-titre text-sm text-muet w-6 shrink-0 text-center">{semaine}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-encre truncate">
          {titre}{chapitres && <span className="text-pigment"> · {chapitres}</span>}
        </p>
        <div className="mt-1"><MicroStepper statut={statut} taille="petit" /></div>
      </div>
      <span className="text-[11px] text-muet whitespace-nowrap shrink-0 hidden sm:block">{STATUT_LABEL[statut]}</span>
    </Link>
  )
}

// Carte-livre repliée (le livre contenant la sélection s'ouvre via le rendu
// serveur). Liseré gauche = couleur du livre. Pied = capstone.
function CarteLivre({ livre, couleur, travaux, capstone, selL, selS, basePath }: {
  livre: LivreProf; couleur: string; travaux: Map<number, TravailAletheia>; capstone: CapstoneRow | null | undefined
  selL: string | null; selS: number | null; basePath: string
}) {
  const p = progression(livre.semaines, travaux)
  return (
    <details open={livre.id === selL} className="group bg-surface border border-bordure rounded-xl overflow-hidden" style={{ borderLeftWidth: 4, borderLeftColor: couleur }}>
      <summary className="px-4 py-3 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden flex items-center gap-3 min-h-[44px]">
        <Pastille module="aletheia" size={36} />
        <div className="min-w-0 flex-1">
          <p className="font-marque text-[11px] font-semibold tracking-[0.18em] text-pigment">ALETHEIA</p>
          <p className="font-titre text-base text-encre truncate leading-tight">{livre.titre}</p>
          <p className="text-xs text-muet">{p.done}/{p.total} terminées</p>
        </div>
        <span className="text-muet text-base shrink-0 transition-transform group-open:rotate-90" aria-hidden>›</span>
      </summary>
      <div className="border-t border-bordure divide-y divide-bordure">
        {livre.semaines.map(s => {
          const t = travaux.get(s.semaine) ?? null
          return (
            <LigneSemaine
              key={s.semaine}
              livre={livre.id}
              semaine={s.semaine}
              titre={s.titre}
              chapitres={s.chapitres}
              statut={t?.statut ?? 'DRAFT'}
              actif={livre.id === selL && s.semaine === selS}
              basePath={basePath}
            />
          )
        })}
      </div>
      <div className="border-t border-bordure px-4 py-3 bg-parchemin-fonce/20">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs font-medium text-encre">✦ Carte d’architecture du livre</p>
            <p className="text-xs text-muet mt-0.5">{texteCapstone(capstone, p)}</p>
          </div>
          <Link href="/prof/scriptorium" className="text-xs text-muet hover:text-encre underline whitespace-nowrap shrink-0">
            Voir dans le Scriptorium →
          </Link>
        </div>
      </div>
    </details>
  )
}

// ── Panneau de détail (maître-détail) : hiérarchisé, anti-clutter ─────────────
function PanneauDetail({ livre, semaine, travail, diag, basePath }: {
  livre: LivreProf; semaine: number; travail: TravailAletheia | null; diag: DiagnosticTravail | undefined; basePath: string
}) {
  const sem = livre.semaines.find(x => x.semaine === semaine)
  const statut = travail?.statut ?? 'DRAFT'
  const date = dateIndicative(livre.date_debut, semaine)
  const sousTitre = [sem?.chapitres, date].filter(Boolean).join(' · ')

  return (
    <div className="space-y-5">
      <Link href={`${basePath}?l=${livre.id}`} scroll={false} className="lg:hidden inline-flex items-center gap-1 text-sm text-muet hover:text-encre min-h-[44px]">
        ← Retour à la liste
      </Link>

      {/* 1. En-tête + stepper nommé */}
      <div className="bg-surface border border-bordure rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Pastille module="aletheia" size={56} />
          <div className="min-w-0 flex-1">
            <p className="font-marque text-[11px] font-semibold tracking-[0.18em] text-pigment truncate">ALETHEIA · {livre.titre}</p>
            <h4 className="font-titre text-lg text-encre leading-tight">Semaine {semaine} — {sem?.titre}</h4>
            {sousTitre && <p className="text-xs text-muet mt-0.5">{sousTitre}</p>}
          </div>
          <ChipEtat statut={statut} />
        </div>
        <StepperNomme statut={statut} wrap />
      </div>

      {!travail ? (
        <p className="text-sm text-muet bg-surface border border-bordure rounded-xl p-4">Rien soumis pour cette semaine.</p>
      ) : (
        <>
          {/* 2. ★ Diagnostic prof-only — le signal */}
          <section className="bg-pigment-teinte/40 border border-bordure border-l-4 border-l-liseret rounded-xl p-4 space-y-2">
            <p className="font-ui text-xs text-pigment">◆ Diagnostic de compréhension <span className="text-muet italic">— prof, jamais montré à l’élève</span></p>
            <DetailDiagChapitre d={diag} />
          </section>

          {/* 3. Avant / après (V1 → VF) — la preuve. Desktop = 2 colonnes ;
              mobile = bascule segmentée (pas d'empilement). */}
          <AvantApres travail={travail} />

          {/* 4 & 5. Retours de l'IA + saisie — tous repliés, espacement uniforme */}
          <div className="space-y-2">
            {travail.retour_v1 && (
              <details className="bg-surface border border-bordure rounded-xl">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-encre">Retour socratique (V1)</summary>
                <div className="px-4 pb-4 border-t border-bordure pt-3"><VueRetourV1 retour={travail.retour_v1} montrerRemarque /></div>
              </details>
            )}
            {travail.retour_vf && (
              <details className="bg-surface border border-bordure rounded-xl">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-encre">Retour final (VF)</summary>
                <div className="px-4 pb-4 border-t border-bordure pt-3"><VueRetourVF retour={travail.retour_vf} /></div>
              </details>
            )}
            <details className="bg-surface border border-bordure rounded-xl">
              <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-encre">Saisie complète de l’élève</summary>
              <div className="px-4 pb-4 border-t border-bordure pt-3 space-y-4">
                <section className="space-y-2">
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-muet">Version initiale (V1)</h5>
                  <Champ label="Idée principale" valeur={travail.these} />
                  <Champ label="Arguments" valeur={travail.arguments} />
                  <Champ label="Ton accord" valeur={travail.accord} />
                  <ListeChamp label="Questions" items={travail.questions ?? []} />
                  <ListeChamp label="Vocabulaire" items={travail.vocabulaire ?? []} />
                </section>
                {(travail.these_vf || travail.arguments_vf || travail.accord_vf) && (
                  <section className="space-y-2">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-muet">Version finale (VF)</h5>
                    <Champ label="Idée principale" valeur={travail.these_vf} />
                    <Champ label="Arguments" valeur={travail.arguments_vf} />
                    <Champ label="Ton accord" valeur={travail.accord_vf} />
                  </section>
                )}
              </div>
            </details>
          </div>
        </>
      )}
    </div>
  )
}

// Dernière semaine rendue (≠ DRAFT) au updated_at le plus récent, tous livres.
function dernierRendu(livres: LivreProf[], travauxParLivre: Map<string, Map<number, TravailAletheia>>): { l: string; s: number } | null {
  let best: { l: string; s: number; u: string } | null = null
  for (const l of livres) {
    const tm = travauxParLivre.get(l.id)
    if (!tm) continue
    for (const t of tm.values()) {
      if (t.statut === 'DRAFT') continue
      // Ignore un travail orphelin (semaine retirée du Scriptorium après soumission) :
      // sinon le défaut sélectionnerait une semaine absente de la liste (en-tête tronqué).
      if (!l.semaines.some(se => se.semaine === t.semaine_index)) continue
      if (!best || t.updated_at > best.u) best = { l: l.id, s: t.semaine_index, u: t.updated_at }
    }
  }
  return best ? { l: best.l, s: best.s } : null
}

export default async function DrillDownEleveAletheia({ params, searchParams }: {
  params: Promise<{ eleveId: string }>
  searchParams: Promise<{ l?: string; s?: string }>
}) {
  const { eleveId } = await params
  const { l: lParam, s: sParam } = await searchParams
  const basePath = `/prof/aletheia/eleve/${eleveId}`

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: moi } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (moi?.role !== 'prof') redirect('/eleve')

  const admin = createAdminClient()
  const { data: eleve } = await admin.from('profiles').select('display_name').eq('id', eleveId).maybeSingle()
  if (!eleve) notFound()

  // Classes actives de l'élève → livres par classe (groupés) + noms de classe.
  const { data: inscriptions } = await admin
    .from('inscriptions').select('classe_id').eq('eleve_id', eleveId).eq('statut', 'active')
  const classeIds = [...new Set((inscriptions ?? []).map(i => i.classe_id as string))]
  const [livresParClasse, { data: classesRows }] = await Promise.all([
    Promise.all(classeIds.map(c => livresDeClasse(admin, c))),
    classeIds.length ? admin.from('classes').select('id, nom').in('id', classeIds) : Promise.resolve({ data: [] as { id: string; nom: string }[] }),
  ])
  const nomParClasse = new Map((classesRows ?? []).map(c => [c.id as string, c.nom as string]))

  // Groupes par classe, livres dédupliqués (1er groupe gagnant pour un partage).
  const vus = new Set<string>()
  const groupes = classeIds.map((cid, i) => ({
    classeId: cid,
    nom: nomParClasse.get(cid) ?? 'Classe',
    livres: (livresParClasse[i] ?? []).filter(l => (vus.has(l.id) ? false : (vus.add(l.id), true))),
  })).filter(g => g.livres.length > 0)
  const livres = groupes.flatMap(g => g.livres)

  // Couleur par livre (ordre global, outremer d'abord) — partagée graphe + liseré.
  const couleurParLivre = new Map(livres.map((l, i) => [l.id, couleurLivre(i)]))

  // Chargements (inchangés) : travaux, capstones, diagnostics par livre.
  const [travauxParLivre, capstoneParLivre, diagParLivre] = await Promise.all([
    Promise.all(livres.map(async l => [l.id, await travauxEleve(admin, eleveId, l.id)] as const)).then(e => new Map(e)),
    Promise.all(livres.map(async l => [l.id, await chargerCapstoneLivre(admin, l.id)] as const)).then(e => new Map(e)),
    Promise.all(livres.map(async l => [l.id, (await chargerDiagnostics(admin, [eleveId], l.id)).get(eleveId) ?? new Map<number, DiagnosticTravail>()] as const)).then(e => new Map(e)),
  ])

  // Sélection (URL). Pas de paramètre → défaut = dernière semaine rendue.
  // `?l=` seul (retour mobile) → livre ouvert, pas de panneau.
  let selL: string | null = null
  let selS: number | null = null
  if (lParam === undefined && sParam === undefined) {
    const d = dernierRendu(livres, travauxParLivre)
    if (d) { selL = d.l; selS = d.s }
  } else {
    const livreParam = lParam ? livres.find(x => x.id === lParam) : undefined
    selL = livreParam?.id ?? null
    const sNum = sParam != null ? Number(sParam) : NaN
    if (livreParam && Number.isInteger(sNum) && livreParam.semaines.some(se => se.semaine === sNum)) selS = sNum
  }

  // Données sérialisées du graphe.
  const livresGraphe: LivreGraphe[] = livres.map(l => ({
    id: l.id, titre: l.titre, couleur: couleurParLivre.get(l.id)!, semaines: l.semaines.map(s => s.semaine),
  }))
  const diagSerialise: Record<string, Record<number, DiagnosticTravail>> = {}
  for (const l of livres) {
    const m = diagParLivre.get(l.id)
    if (!m) continue
    const obj: Record<number, DiagnosticTravail> = {}
    for (const [sem, dd] of m) obj[sem] = dd
    diagSerialise[l.id] = obj
  }

  const selLivre = selS != null && selL ? livres.find(l => l.id === selL) ?? null : null

  return (
    <div data-module="aletheia" className="space-y-6">
      <div>
        <Link href="/prof/aletheia" className="text-sm text-muet hover:text-encre-douce">← Classe</Link>
        <h3 className="font-titre text-2xl text-encre mt-2">{eleve.display_name as string}</h3>
        <p className="text-sm text-muet">Détail par livre et par semaine</p>
      </div>

      {livres.length === 0 ? (
        <p className="text-sm text-muet">Aucun livre assigné à cet élève.</p>
      ) : (
        <>
          <GrapheProgression livres={livresGraphe} diagParLivre={diagSerialise} basePath={basePath} />

          <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-6 lg:items-start">
            {/* Liste maître — masquée sur mobile quand une semaine est ouverte. */}
            <div className={`space-y-6 ${selS != null ? 'hidden lg:block' : 'block'}`}>
              {groupes.map(g => (
                <section key={g.classeId} className="space-y-3">
                  <h4 className="font-ui text-xs font-medium uppercase tracking-wide text-muet">{g.nom}</h4>
                  {g.livres.map(livre => (
                    // key inclut l'état de sélection : force un remount quand le livre
                    // (dé)sélectionné change, pour que <details open> ne reste pas figé
                    // après une navigation client (open n'est pas re-piloté autrement).
                    <CarteLivre
                      key={`${livre.id}:${livre.id === selL}`}
                      livre={livre}
                      couleur={couleurParLivre.get(livre.id)!}
                      travaux={travauxParLivre.get(livre.id) ?? new Map()}
                      capstone={capstoneParLivre.get(livre.id)}
                      selL={selL}
                      selS={selS}
                      basePath={basePath}
                    />
                  ))}
                </section>
              ))}
            </div>

            {/* Panneau de détail — plein écran mobile, colonne droite desktop. */}
            <div className={selS != null ? 'block mt-6 lg:mt-0' : 'hidden lg:block'}>
              {selLivre && selS != null ? (
                <PanneauDetail
                  livre={selLivre}
                  semaine={selS}
                  travail={travauxParLivre.get(selLivre.id)?.get(selS) ?? null}
                  diag={diagParLivre.get(selLivre.id)?.get(selS)}
                  basePath={basePath}
                />
              ) : (
                <div className="flex items-center justify-center text-center min-h-[280px] text-sm text-muet bg-surface border border-bordure border-dashed rounded-xl p-6">
                  Sélectionnez une semaine (liste ou graphe) pour afficher son détail.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
