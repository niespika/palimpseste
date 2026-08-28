import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { chargerLesFichesDeCompetence } from '@/utils/eleve/fiche-serveur'
import { NOM_COMPETENCE } from '@/utils/competences-classe'
import { Balise } from '@/components/deroule/TexteBalise'
import MarqueDeService from './MarqueDeService'

// ============================================================================
// C6 · L2 — LA FICHE DE COMPÉTENCE DITE À L'ÉLÈVE. Six fiches, sur une page.
// ----------------------------------------------------------------------------
// `06-Palimpseste.md` §5 : « Chaque compétence a une FICHE D'UNE PAGE, écrite
// pour l'élève, SERVIE UNE FOIS — À LA RENTRÉE — ET CONSULTABLE TOUTE L'ANNÉE.
// Elle porte deux choses : CE QUE LA COMPÉTENCE REGARDE, en un paragraphe de
// langue courante, et LES DIMENSIONS SUR LESQUELLES ON LA LIT, dans les mots
// mêmes où le retour les nommera. Elle ne porte NI OBSERVABLE, NI SEUIL, NI
// DÉCOMPTE — c'est la coupure de RR4. »
//
// ⭐⭐ ELLE NE PARLE JAMAIS DE CET ÉLÈVE-LÀ. Aucun `eleveId` n'entre dans
//    `chargerLesFichesDeCompetence`, et c'est la garantie de la source :
//    « une fiche qui affiche "travaillé 4 fois" est un profil déguisé ».
//    Le profil, lui, est à côté — sous le même onglet, jamais dans la même page.
//
// ⛔ LE TEXTE EST PRÊT À SERVIR. Il vient du `### 1.1` de
//    `competences_fiches.contenu`, déposé par la fabrique (C4-L8). **On ne le
//    résume pas, on ne le reformule pas, on ne l'augmente pas.**
//    ⚠️ Il porte du markdown, et le dépôt a déjà tranché comment on le rend :
//       GRAS ET ITALIQUE SEULEMENT (`utils/deroule/balisage.ts` + `TexteBalise`,
//       décision de C4-L3). On réutilise ; on n'ajoute pas un second rendu.
//
// ⛔ CE N'EST PAS UN SEPTIÈME INTERRUPTEUR (`07-` §5) : « un onglet, une liste,
//    une porte ne sont pas des fonctionnalités à gater ». Cette page ne lit
//    aucune porte — la fiche est un CONTENU DE COURS, pas une mesure.
//
// ⛔ ET LE COMPTEUR `aide_consommee` N'EST PAS ROUVERT. Le `01-` §11 compte
//    pourtant « les dépliages de la fiche » ; C4-L3 a FERMÉ son domaine le 22/08
//    précisément parce que la fiche n'avait pas d'écran. Elle en a un désormais,
//    et elle se consulte HORS DÉPÔT — donc sans rien à quoi rattacher un compte.
//    Le constat est déposé au relevé ; le domaine reste fermé.
// ============================================================================

export default async function FichesDeCompetence() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { fiches, ecartees, incidents } = await chargerLesFichesDeCompetence(createAdminClient())

  // ⚠️ La trace, pour la revue — jamais pour l'élève. « Six fiches, pas sept » :
  //    `monitoring` est écarté avec son motif, il ne disparaît pas en silence.
  if (ecartees.length > 0 || incidents.length > 0) {
    console.info('[eleve/fiches] '
      + `rendues ${fiches.length} · écartées ${ecartees.map((e) => `${e.competence} (${e.motif})`).join(' · ') || 'aucune'}`
      + (incidents.length > 0 ? ` · incidents : ${incidents.join(' · ')}` : ''))
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* ⭐ « SERVIE UNE FOIS » est une POUSSÉE : la marque se pose au premier
          passage, et elle éteint la tuile de découverte du tableau de bord. */}
      <MarqueDeService />

      <header>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-titre text-2xl text-encre">Les six compétences</h2>
          <Link href="/eleve/moi"
            className="font-ui text-xs text-muet hover:text-encre transition-colors">
            ← Moi
          </Link>
        </div>
        <p className="text-muet text-sm mt-0.5">
          Ce qu’on regarde dans ton travail. À lire une fois — tu peux y revenir toute l’année.
        </p>
      </header>

      {fiches.length === 0 ? (
        <section className="bg-surface border border-bordure rounded-xl p-8 text-center">
          <p className="text-encre-douce text-sm">
            Les fiches ne sont pas encore disponibles.<br />
            Ton professeur les déposera bientôt.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {fiches.map((f) => (
            <section key={f.competence} id={f.competence}
              className="bg-surface border border-bordure rounded-xl p-5 space-y-4">
              <h3 className="font-titre text-lg text-encre">{NOM_COMPETENCE[f.competence]}</h3>

              {/* ⭐ « CE QUE LA COMPÉTENCE REGARDE », tel que la fiche l'écrit.
                  ⛔ Aucun `dangerouslySetInnerHTML` : `baliser()` rend des JETONS
                     que React met en <strong> / <em>. Aucune surface d'injection. */}
              {/* ⚠️ ENVELOPPÉ DANS UN <p> : `Balise` rend un <span>, donc un élément
                  INLINE — et `space-y-4` ne sépare que des blocs. Sans cette
                  enveloppe, « CE QU'ON Y REGARDE » se colle au dernier mot du
                  paragraphe. *Vu à l'écran au smoke du 28/08 ; aucun test ne
                  pouvait le poser.* */}
              <p><Balise source={f.texte} className="text-sm text-encre leading-relaxed" /></p>

              {/* ⭐ « LES DIMENSIONS SUR LESQUELLES ON LA LIT, DANS LES MOTS MÊMES
                  OÙ LE RETOUR LES NOMMERA » — dans l'ordre de la fiche.
                  ⛔ NI OBSERVABLE, NI SEUIL, NI DÉCOMPTE : ce sont les
                     `dimension_eleve`, et rien d'autre. */}
              {f.dimensions.length > 0 && (
                <div>
                  <p className="font-ui text-xs tracking-[0.1em] text-muet uppercase mb-1.5">
                    Ce qu’on y regarde
                  </p>
                  <ul className="space-y-1">
                    {f.dimensions.map((d) => (
                      <li key={d} className="text-sm text-encre-douce flex gap-2">
                        <span className="text-muet" aria-hidden>·</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
