import Link from 'next/link'
import { garderProf } from '@/utils/fabrique/acces'
import { portePilote, sujetsAdmissibles } from '@/utils/pilote-argument/serveur'
import { parcoursDeClasse } from '@/utils/pilote-argument/admissibilite'
import { FormulaireArgument } from './Formulaire'
import { lirePagine } from '@/utils/routeur/donnees'

export default async function PiloteArgument({ searchParams }: { searchParams: Promise<{ classe?: string }> }) {
  const { admin, actif } = await garderProf()
  if (!actif || !await portePilote(admin)) return <p className="p-6 font-corps text-encre">Le pilote argument est fermé.</p>
  const classes = (await lirePagine<{ id: string; nom: string; niveau: string; type_pedagogique: string | null }>(admin,'classes','id,nom,niveau,type_pedagogique',['id'],q => q.eq('statut','active'))).filter(c => parcoursDeClasse(c))
  const demandee = (await searchParams).classe
  const selection = classes.find(c => c.id === demandee) ?? classes[0]
  const offre = selection ? await sujetsAdmissibles(admin,selection.id) : null
  return <div className="space-y-6 pb-12 text-encre">
    <Link href="/prof/conception" className="font-ui text-sm underline">← La conception</Link>
    <h1 className="font-titre text-2xl">Écrire un argument</h1>
    <nav className="flex flex-wrap gap-3" aria-label="Classe">{classes.map(c => <Link key={c.id} href={`?classe=${c.id}`} aria-current={c.id===selection?.id ? 'page' : undefined} className="rounded-lg border border-bordure bg-surface px-4 py-3 font-ui">{c.nom}</Link>)}</nav>
    {selection && offre?.sujets.length ? <FormulaireArgument key={selection.id} classeId={selection.id} sujets={offre.sujets.map(s => s.sujet)} />
      : <p className="font-corps">Aucun sujet admissible : vérifie la banque de sujets et les cours vus ou en cours de cette classe.</p>}
  </div>
}
