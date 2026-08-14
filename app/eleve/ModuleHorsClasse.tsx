// ----------------------------------------------------------------------------
// Accès & classes · L1 — écran d'entrée d'un module quand la classe EN CONTEXTE
// ne l'a pas. Le module appartient à la classe (décision du 14/08) : l'élève
// bi-classe qui entre dans Codex depuis Test puis bascule le commutateur sur T5
// tombait jusqu'ici sur une page vide et trompeuse (la garde disait « oui » sur
// l'UNION de ses classes, l'écran ne trouvait rien dans celle affichée).
//
// UN seul composant pour les DEUX moitiés du refus — c'est ce qui évite cinq
// copies divergentes, une par module :
//   • une autre classe de l'élève a le module → on nomme la classe et on renvoie
//     au commutateur (l'accès existe, il est juste ailleurs) ;
//   • aucune ne l'a → le message d'avant, qui restait juste.
// Patron visuel : `ChoixClasseModule`, l'autre écran-seuil du même genre.
// ----------------------------------------------------------------------------
export default function ModuleHorsClasse({
  nomModule,
  classeContexte,
  ailleurs,
}: {
  /** Nom affiché du module, pour que la phrase dise de quoi on parle. */
  nomModule: string
  /** Classe actuellement au commutateur — celle qui n'a pas le module. */
  classeContexte: string
  /** Autres classes de l'élève qui ONT le module. Vide → aucune. */
  ailleurs: string[]
}) {
  if (ailleurs.length === 0) {
    return (
      <div className="text-center py-16 text-muet text-sm">
        Tu n&apos;as pas encore accès à ce module.
      </div>
    )
  }

  // « Test », « Test ou THLP », « Test, THLP ou 2nde 4 ».
  const liste =
    ailleurs.length === 1
      ? ailleurs[0]
      : `${ailleurs.slice(0, -1).join(', ')} ou ${ailleurs[ailleurs.length - 1]}`

  return (
    <div className="max-w-lg">
      <h3 className="font-titre text-xl text-encre">Pas dans cette classe</h3>
      <p className="text-sm text-encre-douce mt-1">
        {nomModule} n&apos;est pas ouvert pour {classeContexte}.
      </p>
      <div className="bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl px-4 py-3 mt-5">
        <p className="font-ui text-sm text-encre">
          Passe sur {liste} avec le commutateur, en haut, pour y accéder.
        </p>
      </div>
    </div>
  )
}
