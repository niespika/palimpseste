// Calibration courte explicite : --live requis. Textes et copies entièrement fictifs.
// Aucune base, aucune copie élève, aucune écriture des coûts en production.
const fs=require('node:fs');
if(!process.argv.includes('--live'))throw Error('Passer --live pour autoriser les appels Anthropic sur les seules fixtures synthétiques.');
const {load,remplacerIO}=require('./audit-prompts-aletheia-2026-09-08.cjs');
for(const line of fs.readFileSync('.env.local','utf8').split('\n')){
  const m=line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.*?)\s*$/);
  if(m){const v=m[1].replace(/^(['"])(.*)\1$/,'$2');process.env.ANTHROPIC_API_KEY??=v;}
}
const SDK=require('@anthropic-ai/sdk');const Anthropic=SDK.default||SDK;
const usage=[];
remplacerIO('@/utils/cout-api',{coutMessage:()=>0,normaliserUsage:u=>u,enregistrerCoutApi:async(_m,_c,detail)=>{usage.push(detail.tokens)}});
const gen=load('utils/aletheia-retours.ts'),g=load('utils/aletheia/gabarits.ts');
const prompts={inventaire:gen.PROMPT_DIAG_INVENTAIRE_DEFAUT,niveau:gen.PROMPT_DIAG_NIVEAU_DEFAUT};
const argument='Dans une cité imaginaire, Mara affirme qu’un vote permet de décider ensemble mais ne prouve pas qu’une proposition est vraie. Une foule peut partager la même erreur. La vérité demande des raisons contrôlables, même contre la majorité. Elle distingue donc la légitimité d’une décision et la vérité d’une affirmation.';
const argRef={these_canonique:'La majorité peut légitimer une décision sans établir la vérité, qui demande des raisons contrôlables.',arguments_cles:['Une foule peut partager une erreur.','Une vérité doit être étayée par des raisons contrôlables.','Légitimité de la décision et vérité de l’affirmation sont distinctes.']};
const dialogue='Dans un dialogue fictif, Lise dit : « Si tout le monde le croit, c’est vrai. » Noé répond : « Tous peuvent répéter la même erreur ; il faut vérifier les raisons. » Lise objecte : « Alors le vote ne sert à rien ? » Noé distingue : « Il décide de notre action commune, pas du vrai. » La narratrice conclut : « Noé dissipe ici la confusion qui guidait Lise. »';
const diaRef={these_canonique:'La narratrice soutient Noé : le vote décide d’une action commune sans établir la vérité.',arguments_cles:['Lise : une croyance partagée par tous serait vraie.','Noé : une erreur peut être partagée, il faut vérifier les raisons.','Objection de Lise : le vote serait inutile.','Noé réfute cette objection en distinguant décider et établir le vrai.']};
const fragments='17. Une foule peut partager la même erreur : le nombre de voix ne dispense pas de donner des raisons.\n18. Douter ne suffit pas : il faut soumettre son doute à une vérification.\n19. Une certitude refusant toute épreuve protège son confort, pas la vérité.';
const aphRef={these_canonique:'La recherche du vrai exige des raisons et des épreuves, plutôt que des garanties de confort.',arguments_cles:['17 : Le nombre ne remplace pas les raisons.','18 : Le doute doit déboucher sur une vérification.','19 : Une certitude doit accepter la mise à l’épreuve.']};
const analyse='Dans un manuel fictif, un argument testable réunit trois critères : une affirmation précise, une observation qui permettrait de la vérifier, et un résultat possible qui la réfuterait. Sans résultat réfutant possible, aucune observation ne peut départager ses défenseurs et ses opposants.';
const anaRef={these_canonique:'Un argument testable précise son affirmation, sa vérification et sa réfutation possible.',arguments_cles:['L’affirmation est précise.','Une observation permet de la vérifier.','Un résultat possible est reconnu comme réfutant.']};
const cases=[
 {id:'argumentatif-juste-langue-fragile',g:'argumentatif',texte:argument,ref:argRef,these:'Beaucoup de gens peut avoir tord. Leur vote sert décider ensemble, pas dire le vrai. Pour vrai faut raisons qu’on peut vérifier.',args:'La foule répète erreur. On vérifie raisons. Décider c’est pas prouver.',attendu:'Compréhension solide malgré la langue.'},
 {id:'argumentatif-contresens-fluide',g:'argumentatif',texte:argument,ref:argRef,these:'Mara démontre que l’unanimité constitue une garantie suffisante de vérité.',args:'Le nombre de voix remplace avantageusement les raisons individuelles.',attendu:'Contresens, malgré une rédaction fluide.'},
 {id:'dialogue-juste',g:'dialogue',texte:dialogue,ref:diaRef,these:'Lise croit que tous ne peuvent se tromper ; Noé demande des raisons vérifiées.',args:'Lise attaque l’utilité du vote ; Noé répond en distinguant action commune et vérité.',fixe:'La narratrice préfère Noé : elle dit qu’il dissipe la confusion de Lise.',attendu:'Attribution et mouvements solides.'},
 {id:'dialogue-inversion',g:'dialogue',texte:dialogue,ref:diaRef,these:'Noé affirme que le vote prouve la vérité ; Lise exige des raisons.',args:'Noé réfute la distinction entre décider et prouver.',fixe:'La narratrice soutient Lise car elle a le dernier mot.',attendu:'Attributions inversées, niveaux faibles.'},
 {id:'aphoristique-fil',g:'aphoristique',texte:fragments,ref:aphRef,these:'17. Une foule peut partager la même erreur : le nombre de voix ne dispense pas de donner des raisons.',args:'Beaucoup de partisans ne prouve rien : il faut des raisons.',cle:'fil',tournante:'Le 17 refuse le nombre comme garantie ; le 18 refuse le doute sans vérification. Les deux demandent un examen des raisons.',attendu:'Fragment 17 et fil mesurés.'},
 {id:'aphoristique-sans-fil',g:'aphoristique',texte:fragments,ref:aphRef,these:'18. Douter ne suffit pas : il faut soumettre son doute à une vérification.',args:'La remise en cause doit être suivie d’un examen pour savoir si elle est fondée.',cle:'accord',tournante:'Oui, sinon on peut tout contester sans avancer.',attendu:'Fragment 18 mesuré ; axe fil null.'},
 {id:'analytique-application-juste',g:'analytique',texte:analyse,ref:anaRef,these:'Il faut dire précisément ce qu’on affirme, comment le vérifier et quel résultat le démentirait.',args:'Je dis que toutes les billes du sac sont rouges. Je les sors une à une pour observer leur couleur. Une bille bleue suffirait à me donner tort.',attendu:'Notion et application solides.'},
 {id:'analytique-application-incomplete',g:'analytique',texte:analyse,ref:anaRef,these:'On donne une affirmation précise et une vérification, en acceptant un résultat qui la réfute.',args:'Je dis que ma théorie explique tout. Si on trouve un contre-exemple, je dirai qu’il confirme aussi ma théorie.',attendu:'Notion mieux comprise que l’application.'},
];
const subset=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
const selected=subset?cases.filter(c=>subset.includes(c.id)):cases;
(async()=>{
 const results=[];
 for(let i=0;i<selected.length;i+=2)await Promise.all(selected.slice(i,i+2).map(async c=>{
  const cle=c.cle||g.DEFINITIONS[c.g].tournantes[0].cle;
  const gab={gabarit:c.g,blocInventaire:g.blocGabarit(c.g,'diag_inventaire'),blocNiveau:g.blocGabarit(c.g,'diag_niveau'),champFixe:c.fixe||'',tournanteCle:cle,questionTournante:g.DEFINITIONS[c.g].tournantes.find(t=>t.cle===cle).question,reponseTournante:c.tournante||''};
  try{const r=await gen.__audit.diagnostiquerPhase(new Anthropic({maxRetries:0,timeout:90000}),c.texte,c.ref,c.these,c.args,prompts,'synthetique',gab);results.push({id:c.id,attendu:c.attendu,...r});console.log(c.id,JSON.stringify(r.niveaux));}
  catch(e){results.push({id:c.id,erreur:e.message});console.log(c.id,'ERREUR',e.message);}
 }));
 const output={subset:subset||null,date:new Date().toISOString(),modele:'claude-sonnet-4-6',temperature:0,corpus:'entièrement synthétique ; attentes de contrôle, pas étalon professeur',calls:usage.length,usage,results};
 fs.writeFileSync('aletheia_calibration/resultats/prompts_correctifs_2026-09-08'+(subset?'_reprise_'+Date.now():'')+'.json',JSON.stringify(output,null,2)+'\n');
 if(results.some(r=>r.erreur))process.exitCode=1;
})();
