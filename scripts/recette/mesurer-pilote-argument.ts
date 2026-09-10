// Lecture seule. Aucun nom ni identifiant d’élève dans le rapport.
// node --env-file=.env.local --import ./scripts/register-calibration-resolver.mjs scripts/recette/mesurer-pilote-argument.ts [--prod]
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { lirePagine } from '../../utils/routeur/donnees'
import { sujetsAdmissibles, type SujetPilote } from '../../utils/pilote-argument/serveur'
import { parcoursDeClasse } from '../../utils/pilote-argument/admissibilite'

const prod = process.argv.includes('--prod')
const url = prod ? process.env.PROD_SUPABASE_URL : process.env.NEXT_PUBLIC_SUPABASE_URL
const key = prod ? process.env.PROD_SUPABASE_SECRET_KEY : process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Configuration absente')
const db = createClient(url,key,{ auth: { persistSession:false, autoRefreshToken:false } })
const stats = (valeurs: number[]) => {
  const a=valeurs.sort((a,b)=>a-b), n=a.length
  return { n, min:a[0] ?? null, mediane:n ? n%2 ? a[(n-1)/2] : (a[n/2-1]+a[n/2])/2 : null, max:a.at(-1) ?? null }
}
const sujets = await lirePagine<SujetPilote>(db,'exercices_sujets','id,enonce,forme,notions,cours_etat,statut,bloque',['id'],q=>q)
const classes = await lirePagine<{id:string;niveau:string;type_pedagogique:string|null}>(db,'classes','id,niveau,type_pedagogique',['id'],q=>q.eq('statut','active'))
const offres = []
for (const c of classes.filter(c=>parcoursDeClasse(c))) {
  const r=await sujetsAdmissibles(db,c.id)
  offres.push({ classe:offres.length+1, parcours:r.parcours, sujets_admissibles:r.sujets.length,
    longueurs:stats(r.sujets.map(s=>s.sujet.enonce.length)),
    notions_ouvertes:[...new Set(r.sujets.flatMap(s=>s.admissibilite.notions_ouvertes))] })
}
const rapport={date:new Date().toISOString(),base:prod?'production':'sandbox',sujets:stats(sujets.map(s=>s.enonce.length)),
  formes:Object.fromEntries(['dissertation_tc','essai_hlp'].map(f=>[f,sujets.filter(s=>s.forme===f).length])),classes:offres}
console.log(JSON.stringify(rapport,null,2))
const sortie=process.argv.find(a=>a.startsWith('--sortie='))?.slice(9)
if(sortie)writeFileSync(sortie,JSON.stringify(rapport,null,2)+'\n')
