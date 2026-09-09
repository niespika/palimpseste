// Recette PostgreSQL réelle, uniquement sur un cluster LOCAL JETABLE dédié.
// Ne jamais pointer vers Supabase : ce test crée ses propres tables de fixture.
// node scripts/recette/aletheia-concurrence-sql.mjs
import { execFileSync, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const socket = '/tmp/aletheia-pg-audit-20260908'
const database = `aletheia_${Date.now()}`
const clusterArgs = ['-h', socket, '-p', '55438', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At']
execFileSync('psql', [...clusterArgs, '-c', `create database ${database}`])
const args = ['-h', socket, '-p', '55438', '-d', database, '-v', 'ON_ERROR_STOP=1', '-At']
const sql = s => execFileSync('psql', [...args, '-c', s], { encoding: 'utf8' }).trim()
const body = name => readFileSync(name, 'utf8').replace(/^begin;\s*$/im, '').replace(/^commit;\s*$/im, '')
const travail = '10000000-0000-0000-0000-000000000001'
const setup = `
do $$ begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
end $$;
create table public.aletheia_travaux (
 id uuid primary key, eleve_id uuid, scriptorium_livre_id uuid, semaine_index integer,
 statut text, these text, arguments text, accord text, questions text[], vocabulaire text[],
 champ_fixe text, rappel text, tournante_cle text, forme text,
 these_vf text, arguments_vf text, accord_vf text, champ_fixe_vf text, reponses_relances jsonb,
 retour_v1 jsonb, retour_vf jsonb, updated_at timestamptz default now()
);
create table public.aletheia_diagnostic (
 travail_id uuid unique references public.aletheia_travaux, eleve_id uuid, scriptorium_livre_id uuid, semaine_index integer,
 inventaire_v1 jsonb, inventaire_vf jsonb, niveau_these_v1 smallint, niveau_these_vf smallint,
 niveau_arguments_v1 smallint, niveau_arguments_vf smallint, these_mal_definie_v1 boolean,
 these_mal_definie_vf boolean, erreur_at timestamptz, updated_at timestamptz default now()
);
insert into public.aletheia_travaux (id,eleve_id,scriptorium_livre_id,semaine_index,statut,these)
values ('${travail}','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',1,'V1_SUBMITTED','Première copie');
`
try {
assert.equal(sql("select count(*) from information_schema.tables where table_schema='public'"), '0', 'Le cluster doit être neuf : aucune table existante ne sera modifiée.')
sql(setup)
// Répétition annulée puis vérification après rollback (règle 6).
sql(`begin; ${body('aletheia_retours_coherents.sql')} rollback;`)
assert.equal(sql("select count(*) from information_schema.columns where table_name='aletheia_travaux' and column_name='v1_revision'"), '0')
sql(readFileSync('aletheia_retours_coherents.sql','utf8'))
console.log('SQL : répétition annulée vérifiée, puis migration appliquée au cluster jetable.')
const claim = `select public.aletheia_reclamer_retour('${travail}', 'v1')->>'retour_generation'`
const asyncExec = promisify(execFile)
const claims = await Promise.all(Array.from({length:4}, () => asyncExec('psql',[...args,'-c',claim],{encoding:'utf8'})))
const tokens = claims.map(r=>r.stdout.trim()).filter(Boolean)
assert.equal(tokens.length,1, 'Quatre réclamations concurrentes : un seul propriétaire.')
const ancien = tokens[0]
sql(`update public.aletheia_travaux set retour_generation_at=now()-interval '91 seconds' where id='${travail}'`)
const nouveau = sql(claim)
assert.ok(nouveau && nouveau!==ancien)
assert.equal(sql(`with u as (update public.aletheia_travaux set statut='DRAFT' where id='${travail}' and retour_generation='${ancien}' returning id) select count(*) from u`),'0')
sql(`update public.aletheia_travaux set statut='DRAFT' where id='${travail}' and retour_generation='${nouveau}'`)
const revAvant=sql(`select v1_revision from public.aletheia_travaux where id='${travail}'`)
sql(`update public.aletheia_travaux set these='Nouvelle copie',statut='V1_SUBMITTED' where id='${travail}'`)
assert.notEqual(sql(`select v1_revision from public.aletheia_travaux where id='${travail}'`),revAvant)
assert.equal(sql(`with u as (update public.aletheia_travaux set retour_v1='{"ancien":true}',statut='FEEDBACK1_READY' where id='${travail}' and retour_generation='${ancien}' returning id) select count(*) from u`),'0')
console.log('SQL F1 : un propriétaire, bail récupérable, ancien succès et ancien échec refusés.')
const result = JSON.stringify({inventaire:{these_eleve:'Nouvelle copie'},niveaux:{niveau_these:3,niveau_arguments:2,these_mal_definie:false}})
const revision=sql(`select v1_revision from public.aletheia_travaux where id='${travail}'`)
const save = (phase, rev, r=`'${result}'::jsonb`) => sql(`select public.aletheia_enregistrer_diagnostic('${travail}','${phase}','${rev}',${r})`)
assert.equal(save('v1',revision),'f','Copie non stabilisée refusée.')
sql(`update public.aletheia_travaux set statut='FEEDBACK1_READY' where id='${travail}'`)
assert.equal(save('v1',revAvant),'f','Ancienne version refusée.')
assert.equal(save('v1',revision),'t')
assert.equal(save('v1',revision,'null'),'f','Échec tardif ne doit pas écraser un diagnostic réussi.')
// Une réponse aux relances / nouvelle VF ne doit jamais effacer le diagnostic V1.
sql(`update public.aletheia_travaux set reponses_relances='[{"texte":"Réponse"}]',these_vf='Finale',statut='VF_SUBMITTED' where id='${travail}'`)
assert.equal(sql(`select inventaire_v1 is not null from public.aletheia_diagnostic where travail_id='${travail}'`),'t')
const vfRev=sql(`select vf_revision from public.aletheia_travaux where id='${travail}'`)
assert.equal(save('vf',vfRev),'f')
sql(`update public.aletheia_travaux set statut='FEEDBACK2_READY' where id='${travail}'`)
assert.equal(save('vf',vfRev),'t')
sql(`update public.aletheia_travaux set statut='FEEDBACK1_READY',these_vf='Finale corrigée' where id='${travail}'`)
assert.equal(sql(`select inventaire_v1 is not null and inventaire_vf is null from public.aletheia_diagnostic where travail_id='${travail}'`),'t')
assert.equal(save('vf',vfRev),'f')
sql(`update public.aletheia_travaux set statut='DRAFT',these='Encore une copie' where id='${travail}'`)
assert.equal(sql(`select inventaire_v1 is null and inventaire_vf is null from public.aletheia_diagnostic where travail_id='${travail}'`),'t')
assert.equal(save('v1',revision),'f')
// Course publication / réécriture : l'inventaire final doit rester invalidé,
// quel que soit l'ordre dans lequel les deux transactions prennent le verrou.
sql(`update public.aletheia_travaux set statut='FEEDBACK1_READY' where id='${travail}'`)
const revisionConcurrente=sql(`select v1_revision from public.aletheia_travaux where id='${travail}'`)
await Promise.all([
  asyncExec('psql',[...args,'-c',`begin; select public.aletheia_enregistrer_diagnostic('${travail}','v1','${revisionConcurrente}','${result}'); select pg_sleep(0.2); commit;`]),
  asyncExec('psql',[...args,'-c',`begin; update public.aletheia_travaux set these='Copie après course',statut='DRAFT' where id='${travail}'; select pg_sleep(0.2); commit;`]),
])
assert.equal(sql(`select inventaire_v1 is null from public.aletheia_diagnostic where travail_id='${travail}'`),'t')
console.log('SQL F2 : invalidation par phase, refus des versions anciennes et des textes modifiables.')
for (const role of ['anon','authenticated']) {
  assert.equal(sql(`select has_function_privilege('${role}','public.aletheia_reclamer_retour(uuid,text)','EXECUTE')`),'f')
  assert.equal(sql(`select has_function_privilege('${role}','public.aletheia_enregistrer_diagnostic(uuid,text,uuid,jsonb)','EXECUTE')`),'f')
}
assert.equal(sql("select has_function_privilege('service_role','public.aletheia_reclamer_retour(uuid,text)','EXECUTE')"),'t')
// La fonction s'exécute bien avec les privilèges de service_role, y compris
// le trigger qu'elle déclenche. Les élèves restent sans droit d'appel.
sql('grant select, update, insert on public.aletheia_travaux, public.aletheia_diagnostic to service_role')
sql(`update public.aletheia_travaux set statut='V1_SUBMITTED' where id='${travail}'`)
assert.equal(sql(`set role service_role; select public.aletheia_reclamer_retour('${travail}','v1') is not null`).split('\n').at(-1),'t')
// Retour arrière réellement joué sur le cluster jetable, puis état vérifié.
sql(readFileSync('aletheia_retours_coherents_rollback.sql','utf8'))
assert.equal(sql("select count(*) from information_schema.columns where table_name='aletheia_travaux' and column_name='v1_revision'"),'0')
assert.equal(sql(`select these from public.aletheia_travaux where id='${travail}'`),'Copie après course')
console.log('SQL : droits vérifiés ; retour arrière joué, copie conservée et colonnes retirées.')

} finally {
  execFileSync('psql', [...clusterArgs, '-c', `drop database ${database}`])
  if (process.argv.includes('--stop')) execFileSync('pg_ctl', ['-D', socket, 'stop'])
}
