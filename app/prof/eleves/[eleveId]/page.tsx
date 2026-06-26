import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { moduleIdsAccessibles } from '@/utils/acces'
import { calculerSante, motifsSante, COULEUR_SIGNAL, SEUILS_SANTE, type SanteInscription } from '@/utils/sante'
import { noteVersLettre } from '@/utils/notation'
import Tuile from '@/components/Tuile'
import Pastille, { type ModuleSceau } from '@/components/Pastille'
import EnTeteMobileProf from '@/components/EnTeteMobileProf'

// Hub transverse d'un élève (Pilotage › Élèves › nom). Point d'entrée vers les
// vues détaillées de chaque module. En arrivant depuis « à risque », l'encart
// Signaux explique le décrochage dans le contexte de chaque classe.
export default async function PageEleveHub({
  params,
}: {
  params: Promise<{ eleveId: string }>
}) {
  const { eleveId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: moi } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (moi?.role !== 'prof') notFound()

  const admin = createAdminClient()

  const { data: profil } = await admin
    .from('profiles')
    .select('display_name, role')
    .eq('id', eleveId)
    .maybeSingle()
  if (!profil || profil.role !== 'eleve') notFound()

  const [{ data: authUser }, { data: inscrits }, { data: modules }, modulesAcces, sante] = await Promise.all([
    admin.auth.admin.getUserById(eleveId),
    admin
      .from('inscriptions')
      .select('classe_id, statut, classes(id, nom)')
      .eq('eleve_id', eleveId)
      .eq('statut', 'active'),
    admin.from('modules').select('id, slug').eq('actif', true),
    moduleIdsAccessibles(admin, eleveId),
    calculerSante(admin),
  ])

  const email = authUser?.user?.email ?? '—'
  const classes = (inscrits ?? [])
    .map(i => {
      const c = i.classes as { id: string; nom: string } | { id: string; nom: string }[] | null
      return Array.isArray(c) ? c[0] : c
    })
    .filter((c): c is { id: string; nom: string } => !!c)
  const premiereClasse = classes[0]?.id ?? null
  const qsClasse = premiereClasse ? `?classe=${premiereClasse}` : ''

  // Santé de cet élève par inscription (signaux dans le contexte de chaque classe).
  const santeParClasse = new Map<string, SanteInscription>()
  for (const s of sante.values()) if (s.eleveId === eleveId) santeParClasse.set(s.classeId, s)
  const signaux = classes
    .map(c => ({ classe: c, s: santeParClasse.get(c.id) }))
    .filter((x): x is { classe: { id: string; nom: string }; s: SanteInscription } => !!x.s?.enDifficulte)
  const aRisque = signaux.length > 0

  const idParSlug = new Map((modules ?? []).map(m => [m.slug as string, m.id as string]))
  const aAcces = (slug: string) => {
    const id = idParSlug.get(slug)
    return id ? modulesAcces.has(id) : false
  }

  // Vues détaillées par module. Codex n'a pas de vue par élève → on pointe vers
  // le module (navigation par synthèse).
  const cartes: { slug: string; module: ModuleSceau; nom: string; href: string; note: string }[] = [
    { slug: 'fragments-erudition', module: 'fragments', nom: 'Fragments', href: `/prof/fragments-erudition/eleve/${eleveId}${qsClasse}`, note: 'Parcours, dépôts, analyses' },
    { slug: 'quazian', module: 'quazian', nom: 'Quazian', href: `/prof/quazian/diagnostic/${eleveId}`, note: 'Diagnostic FSRS + quizz' },
    { slug: 'codex', module: 'codex', nom: 'Codex', href: `/prof/codex`, note: 'Synthèses (vue par synthèse)' },
    { slug: 'aletheia', module: 'aletheia', nom: 'Aletheia', href: `/prof/aletheia/eleve/${eleveId}`, note: 'Lectures, retours, diagnostic' },
  ]

  return (
    <div className="space-y-6">
      <EnTeteMobileProf titre={profil.display_name} sousTitre={email} retourHref="/prof/eleves" />

      {/* En-tête desktop */}
      <div className="hidden sm:block">
        <Link href="/prof/eleves" className="font-ui text-sm text-muet hover:text-encre-douce">← Élèves</Link>
        <div className="flex items-start justify-between gap-4 mt-2">
          <div>
            <h2 className="font-titre text-2xl text-encre leading-tight">{profil.display_name}</h2>
            <p className="font-ui text-sm text-muet mt-0.5">{email}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {classes.length > 0 ? classes.map(c => (
                <span key={c.id} className="font-ui text-xs bg-info-teinte text-info px-2 py-0.5 rounded-full">{c.nom}</span>
              )) : (
                <span className="font-ui text-xs bg-parchemin-fonce text-muet px-2 py-0.5 rounded-full">Aucune classe active</span>
              )}
            </div>
          </div>
          {aRisque && (
            <span className="font-ui text-xs bg-retard-teinte text-retard px-2.5 py-1 rounded-full whitespace-nowrap">à risque</span>
          )}
        </div>
      </div>

      {/* Encart Signaux — un par inscription en difficulté (contexte de classe). */}
      {signaux.map(({ classe, s }) => {
        const moyenneBasse = s.moyenne != null && s.moyenne < SEUILS_SANTE.moyenneSous
        const revisionEnRetard = s.backlogRevision > SEUILS_SANTE.revisionEnRetard
        return (
          <div key={classe.id} className="bg-surface border border-bordure border-l-4 border-l-retard rounded-xl px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-retard">
                Signaux{classes.length > 1 ? ` · ${classe.nom}` : ''}
              </span>
              <span className="font-ui text-xs text-muet">par contexte de classe</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {motifsSante(s).map((m, i) => (
                <span key={i} className={`font-ui text-xs px-2 py-0.5 rounded-full ${COULEUR_SIGNAL[m.type]}`}>{m.label}</span>
              ))}
            </div>
            <div className="flex mt-3 pt-3 border-t border-dashed border-bordure">
              <div className="flex-1 text-center">
                <div className={`font-titre text-xl leading-none ${s.nbManquants >= SEUILS_SANTE.depotsManquants ? 'text-retard' : 'text-encre-douce'}`}>
                  {s.nbSemainesPassees > 0 ? `${s.nbDeposes}/${s.nbSemainesPassees}` : '—'}
                </div>
                <div className="font-ui text-[10px] text-muet mt-1">dépôts fragments</div>
              </div>
              <div className="w-px bg-bordure" />
              <div className="flex-1 text-center">
                <div className={`font-titre text-xl leading-none ${moyenneBasse ? 'text-attention' : 'text-encre-douce'}`}>
                  {noteVersLettre(s.moyenne) ?? '—'}
                </div>
                <div className="font-ui text-[10px] text-muet mt-1">moyenne</div>
              </div>
              <div className="w-px bg-bordure" />
              <div className="flex-1 text-center">
                <div className={`font-titre text-xl leading-none ${revisionEnRetard ? 'text-info' : 'text-ok'}`}>
                  {revisionEnRetard ? s.backlogRevision : 'à jour'}
                </div>
                <div className="font-ui text-[10px] text-muet mt-1">révision Quazian</div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Accès par module */}
      <div>
        <h3 className="font-ui text-[11px] font-medium text-muet uppercase tracking-[0.12em] mb-3">Par module</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cartes.map(c => (
            aAcces(c.slug) ? (
              <Tuile key={c.slug} nom={c.nom} module={c.module} avecSceau sousTitre={c.note} href={c.href} />
            ) : (
              <div
                key={c.slug}
                className="bg-surface/60 border border-dashed border-bordure rounded-xl px-4 py-3 flex items-center gap-3 opacity-70"
              >
                <Pastille module={c.module} size={36} />
                <div className="min-w-0">
                  <p className="font-marque font-semibold tracking-wide text-muet truncate">{c.nom.toUpperCase()}</p>
                  <p className="font-ui text-xs text-muet mt-0.5">Non assigné à sa classe</p>
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
