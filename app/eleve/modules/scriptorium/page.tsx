import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { seuilModule } from '@/app/eleve/seuil-module'
import { lireReglagesRag } from '@/utils/scriptorium-rag'
import { chargerMatiereClasse } from '@/utils/scriptorium-corpus'
import { jourDansFuseau, formatJour } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import ChatScriptorium from './ChatScriptorium'
import PlanCours, { type PlanEleve } from './PlanCours'

// Face ÉLÈVE de Scriptorium (RAG L5, SPEC §7.1) : espace de dialogue ancré sur
// le parcours de SA classe (contexte cookie existant). GATÉ rag_actif : OFF →
// notFound (aucune surface).
//
// C2.2 — la page charge TOUT comme avant et répartit l'affichage entre les deux
// sous-onglets du module (bande « seuil » de l'en-tête, cf. configModules) :
//   ?vue=plan       → <PlanCours>        (le plan du cours, écran à part)
//   ?vue=discussion → <ChatScriptorium>  (échange + historique) — DÉFAUT
// `?conv=` continue de coexister ; il ne vaut que sous `discussion`.

export const maxDuration = 30

// Datation de lettre — « Ce vendredi 24 juillet » (rituel épistolaire : remplace
// l'horodatage technique). Entrée : jour PUR déjà résolu dans le fuseau du prof.
function datationLettre(jour: string): string {
  return `Ce ${formatJour(jour, { weekday: 'long', day: 'numeric', month: 'long' })}`
}

// Méta du rail : « aujourd'hui » · « hier » · le jour de la semaine · « 22 sept. ».
function libelleRecence(jour: string, aujourdHui: string): string {
  const ecart = Math.round(
    (Date.parse(aujourdHui + 'T00:00:00Z') - Date.parse(jour + 'T00:00:00Z')) / 86_400_000,
  )
  if (ecart <= 0) return 'aujourd’hui'
  if (ecart === 1) return 'hier'
  if (ecart < 7) return formatJour(jour, { weekday: 'long' })
  return formatJour(jour, { day: 'numeric', month: 'short' })
}

export default async function ScriptoriumElevePage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string; vue?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profil?.role !== 'eleve') notFound()

  const admin = createAdminClient()
  const reglages = await lireReglagesRag(admin)
  if (!reglages.actif) notFound()

  const { data: moduleData } = await admin
    .from('modules').select('id').eq('slug', 'scriptorium').maybeSingle()
  if (!moduleData) notFound()

  // Seuil du module (C7·L2 pour l'état « Toutes » ; Accès & classes · L1 pour la
  // classe qui n'a pas Scriptorium — la garde en union ouvrait la page et
  // l'ancrait sur une classe sans corpus). Le gate `rag_actif` reste au-dessus.
  const seuil = await seuilModule(supabase, user.id, moduleData.id as string, 'Le Scriptorium')
  if (seuil.type === 'ecran') return seuil.noeud
  const classe = seuil.inscription

  const { conv: convSel, vue = 'discussion' } = await searchParams

  // Fuseau du prof : gouverne le jour courant (quota) ET la datation des lettres.
  const fuseau = await lireFuseau()
  const aujourdHui = jourDansFuseau(new Date().toISOString(), fuseau)

  // Conversations vivantes de l'élève pour SA classe (RLS eleve_own).
  const { data: convs } = await supabase
    .from('scriptorium_conversations')
    .select('id, titre, updated_at')
    .eq('classe_id', classe.classe_id)
    .is('supprime_at', null)
    .order('updated_at', { ascending: false })
  const conversations = (convs ?? []).map(c => ({
    id: c.id as string,
    titre: (c.titre as string | null) ?? 'Conversation',
    updatedAt: c.updated_at as string,
    // Méta du rail (rendu seul — la donnée existait déjà).
    recence: libelleRecence(jourDansFuseau(c.updated_at as string, fuseau), aujourdHui),
  }))

  // Fil de la conversation sélectionnée (l'intégralité est affichée — la
  // fenêtre glissante ne concerne que ce qui part au modèle). `created_at` sert
  // au SÉPARATEUR DE JOUR de la correspondance (une datation par journée) :
  // rendu seul, il ne franchit la frontière que sous forme de jour + libellé.
  let convActive: {
    id: string
    titre: string
    messages: { role: 'eleve' | 'assistant'; contenu: string; jour: string; datation: string }[]
  } | null = null
  if (convSel && conversations.some(c => c.id === convSel)) {
    const { data: msgs } = await supabase
      .from('scriptorium_messages')
      .select('role, contenu, created_at')
      .eq('conversation_id', convSel)
      .order('created_at', { ascending: true })
    convActive = {
      id: convSel,
      titre: conversations.find(c => c.id === convSel)?.titre ?? 'Conversation',
      messages: (msgs ?? []).map(m => {
        const jour = jourDansFuseau(m.created_at as string, fuseau)
        return {
          role: m.role === 'eleve' ? ('eleve' as const) : ('assistant' as const),
          contenu: m.contenu as string,
          jour,
          datation: datationLettre(jour),
        }
      }),
    }
  }

  // Quota restant du jour (fuseau prof, toutes conversations confondues).
  const { data: toutesConvs } = await admin
    .from('scriptorium_conversations').select('id').eq('eleve_id', user.id)
  const convIds = (toutesConvs ?? []).map(c => c.id as string)
  let envoyes = 0
  if (convIds.length) {
    // Borne large (J-2 UTC) : couvre toute journée locale, filtrée ensuite au jour exact.
    const depuis = toISODate(addDaysUTC(new Date(aujourdHui + 'T00:00:00Z'), -2))
    const { data: msgs } = await admin
      .from('scriptorium_messages').select('created_at')
      .in('conversation_id', convIds).eq('role', 'eleve').gte('created_at', depuis)
    envoyes = (msgs ?? []).filter(m => jourDansFuseau(m.created_at as string, fuseau) === aujourdHui).length
  }
  const quotaRestant = Math.max(0, reglages.quotaJour - envoyes)

  // ── Plan du cours (L6) : la même donnée que le squelette du corpus, rendue à
  // l'élève — TITRES ET STATUTS SEULS (aucun texte ne franchit ce DTO, c'est la
  // règle anti-spoiler ; le contenu des semaines à venir n'existe que côté IA).
  const matiere = await chargerMatiereClasse(admin, classe.classe_id, aujourdHui)
  const plan: PlanEleve = {
    parcours: (matiere?.instances ?? []).map(inst => {
      const parSemaine = new Map<number, { libelle: string; statut: 'vu' | 'en_cours' | 'a_venir' }[]>()
      for (const e of inst.elements) {
        const statut = e.vu ? ('vu' as const) : e.semaine <= inst.semaineCourante ? ('en_cours' as const) : ('a_venir' as const)
        const arr = parSemaine.get(e.semaine) ?? []
        arr.push({ libelle: e.libelleMatiere, statut })
        parSemaine.set(e.semaine, arr)
      }
      return {
        titre: inst.parcoursTitre,
        semaineCourante: inst.semaineCourante,
        nbSemaines: inst.nbSemaines,
        semaines: Array.from({ length: inst.nbSemaines }, (_, i) => i + 1)
          .filter(k => (parSemaine.get(k) ?? []).length > 0)
          .map(k => ({
            k,
            lundi: inst.lundis[k] ?? null,
            courante: k === inst.semaineCourante,
            elements: parSemaine.get(k) ?? [],
          })),
      }
    }),
  }

  // Amorces de la semaine courante (déterministes, côté serveur — §7.1).
  const enCours = plan.parcours.flatMap(p => p.semaines.filter(s => s.courante).flatMap(s => s.elements))
  const premier = enCours.find(e => e.statut !== 'vu') ?? enCours[0]
  const suggestions = [
    premier
      ? `Explique-moi « ${premier.libelle} » qu'on découvre cette semaine.`
      : 'Par où commencer pour réviser le cours ?',
    'Qu’est-ce qui est le plus important à retenir cette semaine ?',
    'Aide-moi à faire le lien entre ce qu’on voit cette semaine et ce qu’on a déjà vu.',
  ]

  // Wrapper partagé par les deux vues. C2.2-ter (Z1) : le `pb-8` d'ici doublait
  // celui du <main> élève ; il est retiré. Les marges négatives `lg:` neutralisent
  // LOCALEMENT (sans toucher au layout) le `pt-8`/`pb-8` du <main> pour ramener la
  // bande au-dessus du cadre à 16px et la respiration basse à 24px. Sous lg :
  // aucun décalage (le `pb-24` du <main> couvre toujours la barre d'onglets).
  return (
    <div className="lg:-mt-4 lg:-mb-2" data-module="scriptorium">
      {vue === 'plan' ? (
        <PlanCours plan={plan} />
      ) : (
        <ChatScriptorium
          key={convActive?.id ?? 'nouvelle'}
          classeId={classe.classe_id}
          conversations={conversations}
          convActive={convActive}
          quotaRestant={quotaRestant}
          suggestions={suggestions}
          premierUsage={conversations.length === 0}
          datationAujourdhui={datationLettre(aujourdHui)}
          jourAujourdhui={aujourdHui}
        />
      )}
    </div>
  )
}
