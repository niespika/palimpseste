import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { deconnexion } from '../actions'
import { contexteClasseEleve, VALEUR_TOUTES } from '../contexte-classe'
import SelecteurClasseEleve from '../SelecteurClasseEleve'
import { chargerLeProfilDeLEleve } from '@/utils/eleve/profil-serveur'
import { lireLeChoixDesLettres } from '@/utils/eleve/fiche-serveur'
import { motDeLaProgression, motDuDecompte, phraseDuGeste } from '@/utils/eleve/profil'
import BasculeDesLettres from './BasculeDesLettres'

// ============================================================================
// Onglet « Moi » (barre tactile). Profil minimal : nom, classe(s), bascule de
// classe (élève multi-classes) et déconnexion.
//
// ⭐⭐ C6-L2 — ET LE PROFIL DE COMPÉTENCES, PAR ARBITRAGE ③ DE LOUIS (28/08) :
//    « le PROFIL — trajectoire, cible, "quoi travailler" — s'installe sous
//      l'onglet "Moi", ET LA FICHE DE COMPÉTENCE AVEC LUI. »
//    ⛔ **Aucun onglet neuf** : cette page existait, elle ne portait que le nom
//       et la déconnexion.
//
// ⭐ LA PREMIÈRE PHRASE DU LOT EST ICI, ET SES TROIS MOTS ONT TROIS SOURCES
//    DIFFÉRENTES : « travaillé quatre fois » (le décompte des mesures qui
//    comptent) · « en progrès » (deux fenêtres d'observables comparées à la
//    lecture) · « prochaine étape » (`exercices_retours.action_revision`, du
//    dernier retour PUBLIÉ).
//
// ⛔⛔ RR4 — CE QUE CET ÉCRAN NE MONTRE JAMAIS : le `code` d'un observable, son
//    `sens` (le seuil), son `taux`, son `tauxFenetre`, ses `reussies` /
//    `denominateur`, sa `serie`. Les six champs d'`ObservableEleve` que la
//    matrice du professeur affiche sont ABSENTS DU TYPE que ce lot lit
//    (`utils/eleve/profil-serveur.ts`) : la coupure est dans la structure, pas
//    dans le JSX.
// ============================================================================

export default async function MoiEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
  const { inscriptions, active, toutes } = await contexteClasseEleve(supabase, user.id)

  // ⛔ LE PROFIL EST UNIFIÉ PAR ÉLÈVE et n'a AUCUN `classe_id` (`07-` §1.3) : il
  //    se charge sans classe, contrairement à la liste d'exercices. « Trois
  //    objets, trois portées — ne les aligne pas par confort. »
  const choixDesLettres = await lireLeChoixDesLettres(admin, user.id)
  const profil = await chargerLeProfilDeLEleve(admin, user.id, choixDesLettres)
  // ⭐ La bascule ne s'offre QUE si les deux autres conditions sont déjà tenues :
  //    proposer un choix qui ne produit rien serait un faux choix.
  const laBasculeAUnSens = profil.lettres.visible || profil.lettres.raison === 'choix_de_l_eleve'
  // ⚠️ Les motifs DISTINCTS de ce qui se tait — jamais un par ligne (voir plus bas).
  const motifsDuSilence = [...new Set(
    profil.competences.filter((c) => !c.lettre && c.motDeLaLettre)
      .map((c) => c.motDeLaLettre as string),
  )]

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="font-titre text-2xl text-encre">Moi</h2>
        {profile?.display_name && <p className="text-sm text-muet mt-1">{profile.display_name}</p>}
      </div>

      {/* Classe(s) */}
      <section className="bg-surface border border-bordure rounded-xl p-5 space-y-3">
        <h3 className="font-ui text-xs tracking-[0.1em] text-muet uppercase">Ma classe</h3>
        {/* C7·L2 — trois états : `active` est aussi null en « Toutes », où l'élève
            est bel et bien inscrit. Le message « aucune classe » ne vaut que
            lorsqu'il n'a réellement aucune inscription. */}
        {inscriptions.length === 0 ? (
          <p className="text-sm text-muet">Tu n&apos;es inscrit dans aucune classe pour l&apos;instant.</p>
        ) : (
          <>
            <p className="text-sm text-encre">
              {toutes ? 'Toutes les classes' : active?.classe_nom}
            </p>
            {inscriptions.length > 1 && (
              <div>
                <p className="text-xs text-muet mb-1.5">Changer de classe</p>
                <SelecteurClasseEleve
                  inscriptions={inscriptions}
                  activeId={toutes ? VALEUR_TOUTES : active!.id}
                />
              </div>
            )}
          </>
        )}
      </section>

      {/* ── ⭐⭐ LE PROFIL — « travaillé N fois · en progrès · prochaine étape » ── */}
      {inscriptions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-ui text-xs tracking-[0.1em] text-muet uppercase">Où j’en suis</h3>
            {/* ⛔ « Un défaut à "affiché" n’est pas un choix » : la bascule ne
                s’offre que là où elle change quelque chose. */}
            {laBasculeAUnSens && <BasculeDesLettres initial={profil.lettres.visible} />}
          </div>

          {/* ⚠️ UNE LECTURE RATÉE SE DIT — jamais un profil vide affirmé. */}
          {profil.incidents.length > 0 && (
            <p className="text-sm text-encre bg-attention-teinte border border-attention rounded-xl p-3">
              Une partie de ton profil n’a pas pu être lue. Ce que tu vois ici est peut-être
              incomplet.
            </p>
          )}

          {/* ⭐ ARBITRAGE ① — SOUS `profil_provisoire`, SEULES LES LETTRES SE
              TAISENT. La trajectoire, la cible et « quoi travailler » s’affichent
              dès le premier jour. ⛔ Et l’élève n’apprend JAMAIS le nom d’un
              interrupteur : la phrase parle de son profil, pas d’une porte.

              ⚠️ LE MOTIF SE DIT UNE FOIS, PAS UNE FOIS PAR LIGNE. La garde est
              posée PAR COMPÉTENCE, et cinq des six étaient provisoires : l’écran
              répétait donc cinq fois « ton profil se stabilise encore ». *Vu à
              l’écran au smoke du 28/08 — la règle « un vide s’explique » ne dit
              pas « un vide s’explique six fois ».* On dédoublonne les motifs et on
              les rend une seule fois, sous le bloc. */}
          {motifsDuSilence.map((m) => (
            <p key={m} className="text-sm text-muet italic">{m}</p>
          ))}

          <div className="bg-surface border border-bordure rounded-xl divide-y divide-bordure">
            {profil.competences.map((c) => (
              <div key={c.competence} className="px-4 py-3 space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-titre text-base text-encre">{c.nom}</p>
                  {/* ⛔ LA LETTRE N’APPARAÎT QUE SI LES TROIS CONDITIONS SONT
                      RÉUNIES — la garde est dans le module partagé, pas ici. */}
                  {c.lettre && (
                    <span className="font-titre text-xl leading-none text-encre-douce">{c.lettre}</span>
                  )}
                </div>
                {/* ⭐ LES DEUX PREMIERS MOTS. Aucun taux, aucun seuil, aucun
                    pourcentage — « les seuls nombres autorisés : n, et le nombre
                    d’exercices de la semaine » (`06-` §5). */}
                {/* ⚠️ À ZÉRO MESURE, LES DEUX MOTS DISENT LA MÊME CHOSE — « jamais
                    travaillé · pas encore travaillé » se lisait comme un bégaiement.
                    *Vu à l’écran au smoke du 28/08.* On n’en garde qu’un : le
                    décompte, qui est le fait. */}
                <p className="text-sm text-encre-douce">
                  {c.n === 0
                    ? motDuDecompte(c.n)
                    : `${motDuDecompte(c.n)} · ${motDeLaProgression(c.progression)}`}
                </p>
                {/* ⭐ « SES FORCES » — des NOMS de dimensions, jamais un taux, et
                    jamais le `code` d’un observable (RR4). */}
                {c.forces.length > 0 && (
                  <p className="text-sm text-encre">
                    <span className="text-ok">Tu réussis déjà</span>{' '}
                    {c.forces.length <= 1
                      ? c.forces[0]
                      : `${c.forces.slice(0, -1).join(', ')} et ${c.forces[c.forces.length - 1]}`}.
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* ── ⭐ LE TROISIÈME MOT — « PROCHAINE ÉTAPE », ET LE GESTE CONCRET ── */}
          {/* ⛔⛔ `published_at` EST LA PORTE : un retour non publié ne se montre
              JAMAIS. ⚠️ Et la compétence n’est nommée que si un rattachement est
              ÉCRIT (`cible_retenue`, à défaut `cible_primaire`) — les deux sont
              vides aujourd’hui, alors la phrase dit « le dernier conseil que
              Calame t’a donné », qui est vrai. */}
          <div className="bg-surface border border-bordure rounded-xl p-4 space-y-2">
            <p className="font-ui text-xs tracking-[0.1em] text-muet uppercase">Ta prochaine étape</p>
            <p className="text-sm text-encre-douce">{phraseDuGeste(profil.geste)}</p>
            {profil.geste && (
              <>
                <p className="text-sm text-encre">{profil.geste.texte}</p>
                <Link href={profil.geste.href}
                  className="inline-block font-ui text-xs text-encre-douce border border-bordure
                             rounded-full px-3 py-1.5 hover:bg-parchemin-fonce transition-colors">
                  Revoir ce retour
                </Link>
              </>
            )}
          </div>

          {/* ⭐⭐ LA FICHE EST GÉNÉRIQUE, LE PROFIL EST PERSONNEL — et c’est la
              source qui les sépare, sous le même onglet (`06-` §5). « Une fiche
              qui affiche "travaillé 4 fois" est un profil déguisé. » */}
          <Link href="/eleve/moi/competences"
            className="block bg-surface border border-bordure rounded-xl px-4 py-3
                       hover:bg-parchemin-fonce transition-colors">
            <p className="text-sm text-encre">Les six compétences, expliquées</p>
            <p className="text-xs text-muet mt-0.5">
              Ce qu’on regarde dans ton travail — une page par compétence.
            </p>
          </Link>
        </section>
      )}

      {/* Déconnexion */}
      <form action={deconnexion}>
        <button
          type="submit"
          className="w-full font-ui text-sm text-encre-douce border border-bordure rounded-xl py-3 hover:bg-parchemin-fonce transition-colors"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  )
}
