import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/admin'
import { sousTitreClasse } from '@/utils/classes'
import {
  chargerMatricePilotage,
  trierLignes,
  MODULES_PILOTAGE,
  type TriPilotage,
} from '@/utils/matrice-pilotage'
import EnTeteMobileProf from '@/components/EnTeteMobileProf'
import BasculeVue, { type Vue } from '@/components/pilotage/BasculeVue'
import MatricePilotage from '@/components/pilotage/MatricePilotage'
import MatriceCompetences from '@/components/pilotage/MatriceCompetences'
import AccesModules, { type ModuleAcces } from '@/components/pilotage/AccesModules'
import GestionEleves from '@/components/pilotage/GestionEleves'

export default async function PilotageClasse({
  params,
  searchParams,
}: {
  params: Promise<{ classeId: string }>
  searchParams: Promise<{ vue?: string; tri?: string }>
}) {
  const { classeId } = await params
  const { vue: vueParam, tri: triParam } = await searchParams
  const admin = createAdminClient()

  const { data: classe } = await admin
    .from('classes')
    .select('id, nom, niveau, filiere, annee_scolaire, statut')
    .eq('id', classeId)
    .maybeSingle()
  if (!classe) notFound()

  const vue: Vue = vueParam === 'competences' ? 'competences' : 'activite'
  const tri: TriPilotage = triParam === 'nom' ? 'nom' : 'risque'
  const base = `/prof/classes/${classeId}`

  const matrice = await chargerMatricePilotage(admin, classeId)
  const lignesTriees = trierLignes(matrice.lignes, tri)
  const nbEleves = matrice.lignes.length

  // Modules pour le panneau d'accès : id DB + description (déjà chargés par la
  // matrice), dans l'ordre de MODULES_PILOTAGE. Pas de 2ᵉ requête.
  const accessibleBySlug = new Map(matrice.colonnes.map((c) => [c.slug, c.accessible]))
  const modulesAcces: ModuleAcces[] = MODULES_PILOTAGE.flatMap((m) => {
    const db = matrice.modulesDb[m.slug]
    if (!db) return []
    return [{
      id: db.id,
      slug: m.slug,
      sceau: m.sceau,
      nom: m.nom,
      description: db.description,
      accessible: accessibleBySlug.get(m.slug) ?? false,
    }]
  })

  // Gestion des élèves : inscrits (depuis la matrice) + tous les élèves (pour l'ajout).
  const inscrits = matrice.lignes.map((l) => ({ id: l.eleveId, display_name: l.nom }))
  const { data: tousEleves } = await admin
    .from('profiles').select('id, display_name').eq('role', 'eleve').order('display_name')

  const sousTitre = sousTitreClasse(classe)
  const metaMobile = `${nbEleves} élève${nbEleves > 1 ? 's' : ''}${matrice.nbARisque > 0 ? ` · ${matrice.nbARisque} à risque` : ''}`

  return (
    <div className="space-y-5">
      <EnTeteMobileProf titre={classe.nom} sousTitre={metaMobile} retourHref="/prof/classes" />

      {/* En-tête desktop : fil d'ariane + titre + bascule */}
      <div className="hidden sm:block">
        <p className="font-ui text-xs text-muet">
          Pilotage · Classes <span className="text-encre">› {classe.nom}</span>
        </p>
        <div className="flex items-end justify-between gap-4 mt-1.5">
          <div>
            <h2 className="font-titre text-3xl text-encre leading-none">{classe.nom}</h2>
            <p className="font-ui text-sm text-muet mt-1.5">
              {sousTitre} · {nbEleves} élève{nbEleves > 1 ? 's' : ''}
              {matrice.nbARisque > 0 && <span className="text-retard"> · {matrice.nbARisque} à risque</span>}
            </p>
          </div>
          <BasculeVue vue={vue} base={base} />
        </div>
      </div>

      {/* Bascule pleine largeur (mobile) */}
      <div className="sm:hidden">
        <BasculeVue vue={vue} base={base} pleineLargeur />
      </div>

      {vue === 'activite' ? (
        <div className="space-y-3">
          <AccesModules classeId={classeId} modules={modulesAcces}>
            <GestionEleves
              classeId={classeId}
              classeNom={classe.nom}
              inscrits={inscrits}
              tousEleves={(tousEleves ?? []) as { id: string; display_name: string }[]}
            />
          </AccesModules>
          <MatricePilotage colonnes={matrice.colonnes} lignes={lignesTriees} tri={tri} base={base} />
        </div>
      ) : (
        <MatriceCompetences lignes={lignesTriees} />
      )}

      <div className="sm:hidden">
        <Link href="/prof/classes" className="font-ui text-sm text-muet hover:text-encre">
          ← Toutes les classes
        </Link>
      </div>
    </div>
  )
}
