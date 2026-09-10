// Décor isolé de sandbox ; son registre privé doit rester hors du dépôt.
// --creer / --retirer ; --registre=/tmp/pilote-argument-decor.json
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { creerContrat } from '../../utils/pilote-argument/contrat'
import { sujetsAdmissibles } from '../../utils/pilote-argument/serveur'

const registre=process.argv.find(a=>a.startsWith('--registre='))?.slice(11) ?? '/tmp/pilote-argument-decor.json'
const url=process.env.NEXT_PUBLIC_SUPABASE_URL!
if (!url?.includes('aoakpxxlyvthzueaywna')) throw new Error('Sandbox uniquement')
const db=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})
type Registre={ eleve:string; email:string; motDePasse:string; professeur?:string; emailProf?:string; motDePasseProf?:string; lignes:Array<{table:string;id:string}>; depots:Array<{id:string;cran:number;parcours:string}>; params:Record<string,unknown>; termine?:boolean }
const r:Registre=existsSync(registre)?JSON.parse(readFileSync(registre,'utf8')):{eleve:'',email:'',motDePasse:randomUUID(),lignes:[],depots:[],params:{}}
const sauver=()=>writeFileSync(registre,JSON.stringify(r,null,2),{mode:0o600})
async function creer(table:string,valeur:Record<string,unknown>) {
  const {data,error}=await db.from(table).insert(valeur).select('id').single()
  if(error)throw Error(table+': '+error.message)
  r.lignes.push({table,id:data.id});sauver();return data.id as string
}
if(process.argv.includes('--retirer')) {
  // Une recette peut s'être arrêtée après l'attribution mais avant son inscription
  // au registre. Ces classes appartiennent exclusivement à ce décor synthétique.
  const classes=r.lignes.filter(l=>l.table==='classes').map(l=>l.id)
  if(classes.length) {
    const {data,error}=await db.from('exercices').select('id').in('classe_id',classes).like('id_import','pilote-argument-%')
    if(error)throw error
    for(const {id} of data) {
      const {error}=await db.from('exercices').delete().eq('id',id);if(error)throw error
    }
  }
  for(const {table,id} of [...r.lignes].reverse()) {
    const {error}=await db.from(table).delete().eq('id',id);if(error)throw Error(table+': '+error.message)
  }
  for(const id of [r.eleve,r.professeur].filter(Boolean) as string[]) {
    const {error}=await db.auth.admin.deleteUser(id);if(error)throw error
  }
  const {error}=await db.from('scriptorium_params').update(r.params).eq('id',1);if(error)throw error
  r.termine=true;sauver();console.log('Décor retiré ; paramètres restaurés.');
} else if(process.argv.includes('--creer')) {
  if(r.eleve)throw Error('Décor déjà présent : retirer avant de recréer')
  const {data:params,error:ep}=await db.from('scriptorium_params').select('pilote_argument_actif,exercices_actif,chaine_actif').eq('id',1).single()
  if(ep)throw ep;r.params=params;sauver()
  const {error:ea}=await db.from('scriptorium_params').update({pilote_argument_actif:true,exercices_actif:true,chaine_actif:true}).eq('id',1);if(ea)throw ea
  r.email=`recette-argument-${randomUUID()}@example.test`
  const {data:u,error:eu}=await db.auth.admin.createUser({email:r.email,password:r.motDePasse,email_confirm:true})
  if(eu||!u.user)throw eu;r.eleve=u.user.id;sauver()
  await creer('profiles',{id:r.eleve,role:'eleve',display_name:'Élève recette argument'})
  const {data:module,error:em}=await db.from('modules').select('id').eq('slug','codex').single();if(em)throw em
  // Les sujets TC/THLP viennent de la banque réelle ; 1HLP est un sujet de démonstration de conception.
  for(const [parcours,niveau,notions] of [
    ['TC','terminale',['la raison','la science','la vérité','le langage','la technique']],
    ['THLP','terminale',['Les expressions de la sensibilité']],
    ['1HLP','1ere',['Les pouvoirs de la parole']],
  ] as const) {
    const classe=await creer('classes',{nom:`Recette argument ${parcours}`,niveau,type_pedagogique:parcours==='TC'?'tc':'hlp',annee_scolaire:'2026-2027'})
    await creer('inscriptions',{eleve_id:r.eleve,classe_id:classe})
    const {error:ecm}=await db.from('classe_modules').insert({classe_id:classe,module_id:module.id});if(ecm)throw ecm
    const cours=await creer('scriptorium_contenus',{type:'cours',titre:`Cours de recette ${parcours}`,notions:[...notions],texte_extrait:'Support de recette technique.'})
    const p=await creer('scriptorium_parcours',{titre:`Recette argument ${parcours}`,nb_semaines:2})
    const pc=await creer('scriptorium_parcours_classes',{parcours_id:p,classe_id:classe,date_debut:'2026-09-07',horaire_snapshot:[
      {semaine:1,dateReelle:'2026-09-07',statut:'definie',semestreNom:'Recette',pedaDansSemestre:1},
      {semaine:2,dateReelle:'2026-09-14',statut:'definie',semestreNom:'Recette',pedaDansSemestre:2},
    ]})
    const cr=await creer('scriptorium_parcours_classe_creneaux',{parcours_classe_id:pc,semaine:1,ordre:0,ref_type:'contenu',contenu_id:cours})
    await creer('scriptorium_parcours_classe_elements',{creneau_id:cr,ref_type:'contenu',semaine:1,ordre:0})
    if(parcours==='1HLP') await creer('exercices_sujets',{id_import:`recette-pilote-${randomUUID()}`,enonce:'La parole peut-elle nous donner du pouvoir sur autrui ?',forme:'essai_hlp',notions:[...notions],cours_etat:'notions',statut:'valide'})
    const offre=await sujetsAdmissibles(db,classe)
    const choix=[...offre.sujets].sort((a,b)=>b.sujet.enonce.length-a.sujet.enonce.length)[0]
    if(!choix)throw Error('Aucun sujet ouvert dans le décor '+parcours)
    for(const cran of [6,8] as const) {
      const contrat=creerContrat({cran,parcours,principale:'expression',secondaire:'argumentation',classe_id:classe,
        sujet:{id:choix.sujet.id,enonce:choix.sujet.enonce,notions:choix.sujet.notions},contexte_fourni:'',admissibilite:choix.admissibilite})
      const {data:ex,error:ee}=await db.rpc('attribuer_pilote_argument',{p_requete:randomUUID(),p_contrat:contrat,p_eleves:[r.eleve],p_echeance:null})
      if(ee)throw ee;r.lignes.push({table:'exercices',id:ex});sauver()
      const {data:d,error:ed}=await db.from('exercices_depots').select('id').eq('exercice_id',ex).eq('eleve_id',r.eleve).single();if(ed)throw ed
      r.depots.push({id:d.id,cran,parcours});sauver()
    }
    console.log(`${parcours} : ${offre.sujets.length} sujets admissibles, crans 6 et 8 attribués dans le décor.`)
  }
  console.log('Décor créé. Registre privé enregistré hors du dépôt.')
} else throw Error('--creer ou --retirer requis')
