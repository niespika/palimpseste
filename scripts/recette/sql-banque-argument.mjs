// node --env-file=.env.local scripts/recette/sql-banque-argument.mjs --inspect|--migrer
// Aucun secret dans les arguments de psql ; sandbox strictement bornée.
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
const url = new URL(process.env.SUPABASE_DB_URL)
assert.ok((url.hostname + url.username).includes('aoakpxxlyvthzueaywna'), 'Connexion sandbox obligatoire')
const env = { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432',
  PGDATABASE: url.pathname.slice(1), PGUSER: decodeURIComponent(url.username),
  PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: 'require' }
function sql(texte) {
  const r = spawnSync('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-At'], { env, input: texte, encoding: 'utf8' })
  if (r.status !== 0) throw new Error(r.stderr)
  return r.stdout.trim()
}
const etat = `select json_build_object('porte',exists(select 1 from information_schema.columns where table_schema='public' and table_name='scriptorium_params' and column_name='pilote_argument_banque_actif'), 'table',to_regclass('public.pilote_argument_services') is not null,'rpc',to_regprocedure('public.servir_banque_argument(uuid,date,integer,jsonb,jsonb,timestamp with time zone)') is not null);`
if (process.argv.includes('--inspect')) {
  console.log(sql(etat))
  console.log(sql(`select json_build_object('params',(select row_to_json(p) from (select routeur_actif,gabarit_actif,juge_mesure_actif,pilote_argument_actif,notions_actif from scriptorium_params where id=1)p),'exercices',(select count(*) from exercices),'sujets',(select count(*) from exercices_sujets));`))
} else if (process.argv.includes('--migrer')) {
  const avant = sql(etat)
  assert.equal(JSON.parse(avant).porte, false, 'Migration déjà présente : ne pas rejouer')
  const migration = readFileSync('pilote_argument_banque.sql','utf8')
  const corps = migration.replace(/^begin;\s*$/m,'').replace(/^commit;\s*$/m,'')
  sql(`begin;\n${corps}\n${etat}\nrollback;`)
  assert.equal(sql(etat), avant, 'La répétition doit être entièrement annulée')
  console.log('Répétition annulée ; absence de la porte, de la table et de la RPC revérifiée.')
  sql(migration)
  assert.deepEqual(JSON.parse(sql(etat)), { porte:true, table:true, rpc:true })
  assert.equal(sql('select pilote_argument_banque_actif from scriptorium_params where id=1;'),'f')
  assert.equal(sql("select has_function_privilege('authenticated','public.servir_banque_argument(uuid,date,integer,jsonb,jsonb,timestamptz)','execute');"),'f')
  console.log('Migration sandbox appliquée ; porte OFF et RPC interdite à authenticated vérifiées.')
} else if (process.argv.includes('--retour-arriere')) {
  assert.equal(sql('select pilote_argument_banque_actif from scriptorium_params where id=1;'),'f','Attendre la fin de la recette')
  const autres="select (to_jsonb(p)-'pilote_argument_banque_actif'-'updated_at')::text from scriptorium_params p where id=1;"
  const avant=sql(autres)
  try {
    sql('update scriptorium_params set pilote_argument_banque_actif=true where id=1;')
    sql(readFileSync('pilote_argument_banque_rollback.sql','utf8'))
    assert.equal(sql('select pilote_argument_banque_actif from scriptorium_params where id=1;'),'f')
    assert.equal(sql(autres),avant)
    console.log('Retour arrière sandbox éprouvé : seule la nouvelle porte est refermée.')
  } finally { sql('update scriptorium_params set pilote_argument_banque_actif=false where id=1;') }
} else throw new Error('--inspect, --migrer ou --retour-arriere requis')
