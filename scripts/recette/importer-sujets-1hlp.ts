// --appliquer : import natif en sandbox, puis validation des seuls 20 sujets relus.
// Sans option : contrôle natif, sans écriture. Aucun accès à la production.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { deposerFichierImport, lireDejaEnBase } from '../../utils/fabrique/import-ecriture'
import { chargerDoctrineDepuisBase } from '../../utils/fabrique/doctrine'
import { controleImport } from '../../utils/fabrique/verifie-import'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
if (!url?.includes('aoakpxxlyvthzueaywna')) throw Error('Sandbox uniquement')
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const fichier = new URL('./pilote-argument/sujets-1hlp.json', import.meta.url)
const banque = JSON.parse(readFileSync(fichier,'utf8'))
const doctrine = await chargerDoctrineDepuisBase(db as never)
const deja = await lireDejaEnBase(db)
const controle = controleImport(banque, doctrine, deja)
if (controle.refus.length || controle.blocages.length) throw Error(JSON.stringify(controle))
if (process.argv.includes('--appliquer')) {
  const bilan = await deposerFichierImport(db, banque, 'sujets-1hlp-pilote-2026-09-10.json', null)
  if (bilan.incidents.length) throw Error(bilan.incidents.join('\n'))
  const { data, error } = await db.from('exercices_sujets').select('id_import,enonce,forme,notions,cours_etat,bloque')
    .in('id_import', banque.sujets.map((s: {id: string}) => s.id))
  if (error || data?.length !== 20) throw Error('Import incomplet')
  for (const s of banque.sujets) {
    const d = data.find(d => d.id_import === s.id)
    if (!d || d.enonce !== s.enonce || d.forme !== s.forme || d.cours_etat !== 'notions' || d.bloque
      || JSON.stringify(d.notions) !== JSON.stringify(s.notions)) throw Error('Sujet existant divergent : ' + s.id)
  }
  const {error: e} = await db.from('exercices_sujets').update({statut:'valide'})
    .in('id_import', banque.sujets.map((s: {id: string}) => s.id)).eq('statut','a_valider')
  if(e)throw e
  console.log('20 sujets 1HLP contrôlés et validés en sandbox ; aucune attribution.');
} else console.log('Contrôle natif réussi : 20 sujets importables, sans écriture.')
