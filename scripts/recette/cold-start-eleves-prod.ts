// ============================================================================
// cold-start-eleves-prod.ts — POSER LA MÉDIANE DE CLASSE À DES ÉLÈVES INSCRITS
// EN COURS DE SEMAINE, EN PRODUCTION, SANS ATTENDRE LE LUNDI.
// ----------------------------------------------------------------------------
// ⛔ POURQUOI. Le cold start (`01-` §10) ne tourne que dans le passage du lundi
//    (`/api/assiduite/hebdo`). Un élève inscrit le mardi n'a donc AUCUNE lettre
//    jusqu'au lundi suivant — et sans lettre, R0 ne cible rien. Écrit le 02/09
//    pour Audrey Lauriston (1HLP, inscrite le 01/09) et Maelie Willmé (T5,
//    inscrite le 31/08 après le passage), sur décision de Louis.
// ⭐ IL APPELLE LE MÊME CODE QUE LE CRON — `poserLeColdStart` — avec la classe
//    ENTIÈRE de chaque élève visé, parce que la médiane se calcule sur les
//    mesures diagnostiques de la classe. Il est idempotent : « il POSE la
//    première lettre, il n'écrase jamais » — les camarades qui ont déjà la leur
//    ne bougent pas, et le rejouer ne coûte rien.
// ⛔⛔ PRODUCTION. Il lit `PROD_SUPABASE_URL` / `PROD_SUPABASE_SECRET_KEY`, l'affiche,
//    et n'écrit qu'avec `--pose`. `--constat` (défaut) ne fait que lire.
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/cold-start-eleves-prod.ts --eleves <uuid>,<uuid> [--pose]
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { poserLeColdStart } from '@/utils/moteur/etat-serveur'

const PROD = 'ucmngachkxvvlegntuwh'
for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (process.env[m[1]] === undefined) process.env[m[1]] = v
}
const URL = process.env.PROD_SUPABASE_URL!
const KEY = process.env.PROD_SUPABASE_SECRET_KEY!
if (!URL || !URL.includes(PROD) || !KEY) { console.error(`⛔ REFUS — PROD_SUPABASE_URL/SECRET_KEY absents ou inattendus. Vu : ${URL}`); process.exit(2) }
const admin = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } })

function lu<T>(quoi: string, r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(`${quoi} — ${r.error.message}`)
  return r.data as T
}
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : null }
const vises = (arg('eleves') ?? '').split(',').map((x) => x.trim()).filter(Boolean)
if (vises.length === 0) { console.error('⛔ --eleves <uuid>,<uuid> attendu'); process.exit(2) }
const POSE = process.argv.includes('--pose')

type Niveau = { eleve_id: string; competence: string; lettre: string | null; lettre_initiale: string | null; profil_provisoire: boolean }

async function etat(ids: string[]) {
  const profils = lu('profils', await admin.from('profiles').select('id, display_name').in('id', ids)) as { id: string; display_name: string }[]
  const niveaux = lu('niveaux', await admin.from('competences_niveaux').select('eleve_id, competence, lettre, lettre_initiale, profil_provisoire').in('eleve_id', ids)) as Niveau[]
  for (const id of ids) {
    const nom = profils.find((p) => p.id === id)?.display_name ?? '(profil introuvable)'
    const siens = niveaux.filter((n) => n.eleve_id === id).map((n) => `${n.competence}=${n.lettre ?? '∅'}`)
    console.log(`  ${id.slice(0, 8)} ${nom} : ${siens.length ? siens.join(' ') : 'AUCUNE ligne'}`)
  }
}

console.log(`Base : ${URL} (PRODUCTION)`)
// Les classes ACTIVES des élèves visés, et leur population ENTIÈRE.
const insc = lu('inscriptions', await admin.from('inscriptions').select('eleve_id, classe_id').eq('statut', 'active').in('eleve_id', vises)) as { eleve_id: string; classe_id: string }[]
const classes = [...new Set(insc.map((i) => i.classe_id))]
if (classes.length === 0) { console.error('⛔ aucun des élèves visés n\'a d\'inscription active'); process.exit(2) }
const membres = lu('membres', await admin.from('inscriptions').select('eleve_id, classe_id').eq('statut', 'active').in('classe_id', classes)) as { eleve_id: string; classe_id: string }[]
const elevesParClasse = new Map<string, string[]>()
for (const m of membres) elevesParClasse.set(m.classe_id, [...(elevesParClasse.get(m.classe_id) ?? []), m.eleve_id])
const noms = lu('classes', await admin.from('classes').select('id, nom').in('id', classes)) as { id: string; nom: string }[]
for (const [c, e] of elevesParClasse) console.log(`  classe ${noms.find((n) => n.id === c)?.nom ?? c} : ${e.length} élèves actifs (la médiane se calcule sur eux)`)

console.log('\nAVANT :'); await etat(vises)
if (!POSE) { console.log('\n⭐ `--pose` appellerait `poserLeColdStart` sur ces classes — idempotent, il ne pose que les lettres NULLES.'); process.exit(0) }

const fuseau = 'America/Toronto'
const bilan = await poserLeColdStart(admin as never, elevesParClasse, fuseau)
console.log('\nBILAN DU COLD START :', JSON.stringify(bilan))
console.log('\nAPRÈS (vérifié par requête) :'); await etat(vises)
