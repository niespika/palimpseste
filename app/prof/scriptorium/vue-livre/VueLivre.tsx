import Link from 'next/link'
import type { CapstoneProf, LivreReferenceProf, ReferenceChapitre } from '@/app/eleve/modules/aletheia/types'
import type { Signet } from '../decoupe-utils'
import EditeurLivre from '../EditeurLivre'
import ArtefactsLivreProvider from './ArtefactsLivreProvider'
import EnteteLivre from './EnteteLivre'
import RailSemaines from './RailSemaines'
import PanneauFiche from './PanneauFiche'
import ColonneCarte from './ColonneCarte'
import { etatFiche, resoudreLiens, semaineParDefaut, semaineValide, sousStatutFiche, type SemaineVue } from './utils'

export interface DocSemaine {
  id: string
  semaine: number
  titre: string
  chapitres: string | null
  texte: string | null
}

// Page livre du Scriptorium (vue « Livres », unité de type livre) : entête +
// 3 colonnes (rail des semaines / fiche de la semaine / carte d'architecture).
// Orchestrateur SERVEUR : sélection lue dans l'URL (?semaine=N), états dérivés ici,
// toutes les données viennent de page.tsx (aucune requête).
export default function VueLivre({ livre, classes, classeIds, docs, nbDocsSansSemaine, capstone, reference, semaineParam, modeDecoupe, conflitClasses, gabarit }: {
  livre: { id: string; label: string; auteur: string | null; date_debut: string | null; nb_semaines: number | null; signets: Signet[] | null }
  /** (E3) Gabarit de lecture du livre, quand la porte de l'étayage est ouverte ; sinon absent. */
  gabarit?: 'argumentatif' | 'dialogue' | 'aphoristique' | 'analytique' | null
  classes: { id: string; nom: string }[]
  classeIds: string[]
  docs: DocSemaine[] // documents du livre AVEC numéro de semaine, triés (semaine, id)
  nbDocsSansSemaine: number
  capstone: CapstoneProf | null
  reference: LivreReferenceProf | null
  semaineParam?: string
  modeDecoupe: boolean
  conflitClasses?: string[] // (L5) classes ayant le livre en direct ET en entier via parcours
}) {
  const hrefBase = `/prof/scriptorium?vue=livres&unite=${livre.id}`

  // Une entrée par semaine (normalement 1 document/semaine — défensif : textes
  // fusionnés si plusieurs, première occurrence pour titre/chapitres).
  const parSemaine: SemaineVue[] = []
  const vueDe = new Map<number, SemaineVue>()
  for (const d of docs) {
    const existant = vueDe.get(d.semaine)
    if (!existant) {
      const s: SemaineVue = { semaine: d.semaine, titre: d.titre, chapitres: d.chapitres, texte: d.texte }
      vueDe.set(d.semaine, s)
      parSemaine.push(s)
    } else if (d.texte) {
      existant.texte = existant.texte ? `${existant.texte}\n\n${d.texte}` : d.texte
    }
  }

  const semaineSel = semaineValide(semaineParam, parSemaine) ?? semaineParDefaut(parSemaine)
  const hrefFiche = `${hrefBase}&semaine=${semaineSel}`

  // ── Mode re-découpe : l'éditeur remplace la grille, pleine largeur ──────────
  if (modeDecoupe) {
    return (
      <div className="space-y-4">
        <div>
          <Link href={hrefFiche} scroll={false} className="font-ui font-medium text-[13.5px] text-muet hover:text-pigment transition-colors">
            ← Retour à la fiche
          </Link>
          <h3 className="font-titre font-semibold text-2xl text-encre mt-1.5">{livre.label} — modifier la découpe</h3>
        </div>
        <EditeurLivre
          livreId={livre.id}
          titre={livre.label}
          auteur={livre.auteur}
          signets={livre.signets}
          semaines={docs.map(d => ({ id: d.id, semaine: d.semaine, titre: d.titre, chapitres: d.chapitres ?? '', texte: d.texte ?? '' }))}
          hrefRetour={hrefFiche}
          gabarit={gabarit}
        />
      </div>
    )
  }

  // ── États dérivés (fiches, carte, liens) ────────────────────────────────────
  const contenu = reference?.contenu ?? []
  const amendeGlobal = reference?.amende_par_prof ?? false
  // Doublon de semaine (données legacy) : garder la PREMIÈRE occurrence, comme
  // chargerReferenceChapitre (.find) côté diagnostic/retour VF.
  const chapitreDe = new Map<number, ReferenceChapitre>()
  for (const c of contenu) if (!chapitreDe.has(c.semaine)) chapitreDe.set(c.semaine, c)
  const chapitreSel = chapitreDe.get(semaineSel) ?? null
  const etatSel = etatFiche(chapitreSel ?? undefined, amendeGlobal)
  const docSel = vueDe.get(semaineSel) ?? null
  const contenuVide = contenu.every(c => !c.these_canonique.trim())
  const liensResolus = resoudreLiens(capstone?.contenu?.liens ?? [], parSemaine)
  const rail = parSemaine.map(s => ({ semaine: s.semaine, titre: s.titre, etat: etatFiche(chapitreDe.get(s.semaine), amendeGlobal) }))
  // Signal de génération PARTIELLE (C-b) : une référence READY dont certaines séances
  // restent sans fiche (un lot a échoué/omis une semaine) → on le RÉVÈLE au prof plutôt
  // que de laisser le partiel passer pour complet. Dérivé du rail : aucune colonne SQL.
  const semainesManquantes = reference?.statut === 'READY'
    ? rail.filter(r => r.etat === 'a_generer').map(r => r.semaine)
    : []

  return (
    <ArtefactsLivreProvider
      carteEnCours={capstone?.statut === 'PENDING'}
      refEnCours={reference?.statut === 'PENDING'}
      tsCarte={capstone?.updated_at ? new Date(capstone.updated_at).getTime() : 0}
      tsRef={reference?.updated_at ? new Date(reference.updated_at).getTime() : 0}
    >
      <div className="space-y-4">
        <EnteteLivre
          livre={livre}
          classes={classes}
          classeIds={classeIds}
          nbSemaines={livre.nb_semaines ?? parSemaine.length}
          nbFiches={parSemaine.length}
          contenuVide={contenuVide}
          hrefDecoupe={`${hrefFiche}&edition=decoupe`}
        />

        {nbDocsSansSemaine > 0 && (
          <div className="border border-attention bg-attention-teinte/40 rounded-lg p-3 text-xs text-attention">
            {nbDocsSansSemaine} document(s) sans numéro de séance dans ce livre — non éditable(s) ici ; corrige-les via la vue « Classes ».
          </div>
        )}

        {conflitClasses && conflitClasses.length > 0 && (
          <div className="border border-attention bg-attention-teinte/40 rounded-lg p-3 text-xs text-attention">
            ⚠ Ce livre est assigné en direct ET en entier via un parcours à : <b>{conflitClasses.join(', ')}</b>. Double planning possible — choisis une seule voie : garde l’assignation directe s’il n’y a rien de plus que le livre, ou passe par le parcours s’il ajoute des ressources (textes/cours).
          </div>
        )}

        {semainesManquantes.length > 0 && (
          <div className="border border-attention bg-attention-teinte/40 rounded-lg p-3 text-xs text-attention">
            ⚠ Référence incomplète — {semainesManquantes.length === 1 ? 'la séance' : 'les séances'} <b>{semainesManquantes.join(', ')}</b> {semainesManquantes.length === 1 ? 'n’a' : 'n’ont'} pas de fiche (génération partielle). Le diagnostic Aletheia et la synthèse montrée à l’élève s’appuient dessus : régénère les fiches, ou sélectionne {semainesManquantes.length === 1 ? 'la séance' : 'ces séances'} dans le rail pour {semainesManquantes.length === 1 ? 'la' : 'les'} rédiger à la main.
          </div>
        )}

        <div className="grid grid-cols-[238px_minmax(0,1fr)_300px] gap-4 items-start">
          <RailSemaines semaines={rail} semaineSel={semaineSel} hrefBase={hrefBase} />
          <PanneauFiche
            key={semaineSel}
            livreId={livre.id}
            semaine={semaineSel}
            titreDoc={docSel?.titre ?? `Séance ${semaineSel}`}
            chapitresDoc={docSel?.chapitres ?? null}
            texteDoc={docSel?.texte ?? null}
            chapitre={chapitreSel}
            etat={etatSel}
            sousStatut={sousStatutFiche(chapitreSel ?? undefined, etatSel, reference?.updated_at ?? null)}
            statutRef={reference?.statut ?? null}
            updatedAtRef={reference?.updated_at ?? null}
            nbFiches={parSemaine.length}
            gabaritLivre={gabarit}
            contenuVide={contenuVide}
          />
          <ColonneCarte livreId={livre.id} capstone={capstone} liens={liensResolus} semaineSel={semaineSel} hrefBase={hrefBase} />
        </div>
      </div>
    </ArtefactsLivreProvider>
  )
}
