import Link from 'next/link'
import EditeurClassesLivre from '../EditeurClassesLivre'
import BoutonSupprimerUnite from '../BoutonSupprimerUnite'
import BoutonRegenererFiches from './BoutonRegenererFiches'
import { BTN_DANGER, BTN_SECONDAIRE, INTITULE } from './ui'

// Entête de la page livre : fil de retour, surtitre, titre + auteur, sous-ligne
// (séances · classes) et les trois actions book-level à droite.
export default function EnteteLivre({ livre, classes, classeIds, nbSemaines, nbFiches, contenuVide, hrefDecoupe }: {
  livre: { id: string; label: string; auteur: string | null; date_debut: string | null }
  classes: { id: string; nom: string }[]
  classeIds: string[]
  nbSemaines: number
  nbFiches: number
  contenuVide: boolean
  hrefDecoupe: string
}) {
  return (
    <div>
      <div className="mb-1.5">
        <Link href="/prof/scriptorium?vue=livres" className="font-ui font-medium text-[13.5px] text-muet hover:text-pigment transition-colors">
          ← Tous les livres
        </Link>
      </div>
      <div className="flex items-end gap-[18px] flex-wrap">
        <div className="min-w-0">
          <div className={`${INTITULE} tracking-[.12em] mb-1`}>Livre · ancrage IA — non visible par l’élève</div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3 className="font-titre font-semibold text-[34px] leading-[1.05] text-encre">{livre.label}</h3>
            {livre.auteur && <span className="font-titre italic font-medium text-[19px] text-encre-douce">{livre.auteur}</span>}
          </div>
          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <span className="font-ui text-[13.5px] text-muet">
              {nbSemaines} séance{nbSemaines > 1 ? 's' : ''}
              {' · classes'}
            </span>
            <EditeurClassesLivre uniteId={livre.id} classes={classes} assignedClasseIds={classeIds} />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <BoutonRegenererFiches livreId={livre.id} nbFiches={nbFiches} contenuVide={contenuVide} />
          <Link href={hrefDecoupe} className={BTN_SECONDAIRE}>Modifier la découpe</Link>
          <BoutonSupprimerUnite uniteId={livre.id} label={livre.label} estLivre libelle="Supprimer l’unité…" classNameBouton={BTN_DANGER} />
        </div>
      </div>
    </div>
  )
}
