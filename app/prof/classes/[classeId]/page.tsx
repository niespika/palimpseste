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
import { chargerGrilleCompetences, type GrilleCompetencesClasse } from '@/utils/competences-classe'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { FUSEAU_DEFAUT, jourDansFuseau } from '@/utils/fuseau'
import {
  chargerLAttentionDeLaClasse, type AttentionDeLaClasse,
} from '@/utils/pilotage/attention-serveur'
import {
  chargerLaRetentionDeLaClasse, type RetentionDeLaClasse,
} from '@/utils/pilotage/retention-serveur'
import BlocAttention from '@/components/pilotage/BlocAttention'
import BlocRetention from '@/components/pilotage/BlocRetention'
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

  // ── C4-L11 — L'OPT-OUT ATTERRIT ICI, et l'onglet dit pourquoi il est vide ──
  // « Le profil de la classe, au tableau de pilotage, porte l'opt-out »
  // (`07-` §1.3). Les deux lectures ne se font QUE pour cet onglet : l'onglet
  // Activité n'en a aucun usage, et une requête de plus sur chaque affichage du
  // pilotage ne se paie pas pour rien.
  // ⚠️ supabase-js ne lève pas : il rend `{ error }`. Une lecture ratée laisse
  //    l'opt-out vide — donc TOUT ACTIF, qui est le défaut du `07-` §1.3 : « une
  //    compétence déclarée `evaluee` l'est pour toutes les classes ». Un défaut
  //    faux dans l'autre sens aurait retiré des compétences que personne
  //    n'a retirées.
  const optOut: Record<string, boolean> = {}
  let affichageActif = false
  if (vue === 'competences') {
    const [rActives, rParams] = await Promise.all([
      admin.from('competences_actives_par_classe')
        .select('competence, active').eq('classe_id', classeId),
      admin.from('scriptorium_params').select('competences_affichage_actif').limit(1).maybeSingle(),
    ])
    for (const a of (rActives.data ?? []) as Array<{ competence: string; active: boolean }>) {
      optOut[a.competence] = a.active
    }
    affichageActif = !!rParams.data?.competences_affichage_actif
  }
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

  // ── La grille des lettres — seulement pour l'onglet qui la montre ────────
  // Elle réutilise les inscrits de la matrice : aucune seconde lecture de
  // `inscriptions`. Et elle ne part pas du tout quand l'affichage est fermé —
  // un interrupteur à OFF ne doit pas coûter cinq requêtes par affichage.
  // ⚠️ `mesure_at` est un INSTANT : il se formate dans le fuseau de l'école, que
  //    le serveur lit UNE FOIS et passe en prop (`utils/fuseau` en-tête).
  let grille: GrilleCompetencesClasse | null = null
  let tz = FUSEAU_DEFAUT
  if (vue === 'competences' && affichageActif) {
    const [g, f] = await Promise.all([
      chargerGrilleCompetences(admin, classeId, matrice.lignes.map((l) => l.eleveId), optOut),
      lireFuseau(),
    ])
    grille = g
    tz = f
  }

  // ── C6-L1 — CE QUI DEMANDE L'ATTENTION, ET LE DIAGNOSTIC DE RÉTENTION ─────
  // ⭐ « La page de C6-L1 EST cet onglet-là » (arbitrage ① de Louis, 27/08) : on
  //    n'y refait pas la matrice, on y ajoute LES QUATRE DRAPEAUX, bornés à la
  //    classe regardée, et le diagnostic de rétention.
  // ⛔ Les deux lectures ne partent QUE pour cet onglet, et seulement quand
  //    l'interrupteur de CET écran est ouvert — le même patron que la grille :
  //    « un interrupteur à OFF ne doit pas coûter cinq requêtes par affichage ».
  //    ⛔ Et c'est bien LE SIEN : `competences_affichage_actif` (`07-` §5).
  //       Le canal d'intégrité, lui, a son propre interrupteur, qu'on ne touche pas.
  // ⚠️ `aujourd'hui` est un JOUR, lu dans le fuseau de l'école : les comptes en
  //    cycles se font sur des dates pures, jamais sur des instants.
  let attention: AttentionDeLaClasse | null = null
  let retention: RetentionDeLaClasse | null = null
  if (vue === 'competences' && affichageActif) {
    const nomDe = new Map(matrice.lignes.map((l) => [l.eleveId, l.nom]))
    const [a, r] = await Promise.all([
      chargerLAttentionDeLaClasse(
        admin, matrice.lignes.map((l) => l.eleveId), nomDe, tz,
        jourDansFuseau(new Date().toISOString(), tz),
        // ⚠️ L'OPT-OUT : un drapeau sur une compétence que ce cours ne travaille
        //    pas se SIGNALE — il ne se cache pas (voir l'en-tête du chargeur).
        optOut),
      chargerLaRetentionDeLaClasse(admin, classeId),
    ])
    attention = a
    retention = r
  }

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
        <div className="space-y-3">
          {/* ⭐ L'ATTENTION D'ABORD, L'ÉTAT ENSUITE : c'est « la page où le
              professeur voit ce qui demande son attention ». */}
          {attention && (
            <BlocAttention
              classeId={classeId}
              drapeaux={attention.drapeaux}
              distribution={attention.distribution}
              reglages={attention.reglages}
              cyclesConnus={attention.cyclesConnus}
              incidents={attention.incidents}
              regarde={attention.regarde}
            />
          )}

          <MatriceCompetences
            lignes={lignesTriees}
            classeId={classeId}
            classeNom={[classe.nom, classe.niveau, classe.filiere].filter(Boolean).join(' · ')}
            optOut={optOut}
            affichageActif={affichageActif}
            grille={grille}
            tz={tz}
          />

          {/* ⭐ Le diagnostic de rétention SE RANGE À CÔTÉ de la matrice —
              jamais dedans : Quazian n'écrit pas dans le profil (`01-` §6, R4). */}
          {retention && <BlocRetention r={retention} />}
        </div>
      )}

      <div className="sm:hidden">
        <Link href="/prof/classes" className="font-ui text-sm text-muet hover:text-encre">
          ← Toutes les classes
        </Link>
      </div>
    </div>
  )
}
