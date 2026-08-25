'use client'

// ============================================================================
// C4 · L16 — CE QUE LE COURS DÉCLARE TRAITER, et comment on le lui fait dire.
// ----------------------------------------------------------------------------
// LE GESTE POUR LEQUEL LE LOT EXISTE. Aux trois premiers états du rattachement,
// c'est le MATÉRIAU qui désigne ses cours — « quinze sujets, quinze
// appariements, et deux cents demain ». Au quatrième, c'est le COURS qui déclare
// ce qu'il traite, et le matériau s'y rattache TOUT SEUL (`07-` §2, C4-L16 ;
// `08-` §3 ; `01-` §4 couche 4).
//
// ⭐⭐ ET LE VRAI RISQUE N'EST PAS LA STRUCTURE, C'EST L'APPARIEMENT : « la
//   vérité », « Vérité », « La Vérité » — deux chaînes libres de part et
//   d'autre, et rien ne se rattache jamais ; le sujet reste muet, et rien à
//   l'écran ne dit pourquoi. **Deux gardes, et il les faut toutes les deux** :
//   la forme normalisée (`utils/fabrique/notions.ts`), et CET ÉCRAN, qui
//   **propose ce que la banque déclare déjà** — « on ne rattache pas en tapant,
//   on rattache en choisissant ».
//
// ⛔ MAIS CE N'EST PAS UNE LISTE FERMÉE. Le `07-` §2 retire explicitement à ce
//   lot « la liste fermée des notions du programme », qui serait une donnée de
//   référentiel et n'existe nulle part. D'où la seconde zone : **le champ reste
//   libre**, et un cours peut déclarer une notion — ou, en HLP, un thème de
//   semestre — que la banque ne connaît pas encore. *C'est l'écran qui guide,
//   pas une contrainte.*
//
// ⚠️ UN SEUL CHAMP, pour les notions du tronc commun ET les thèmes ou chapitres
//   de HLP : « deux champs feraient deux domiciles pour la même relation ».
// ============================================================================

import { useMemo, useState } from 'react'
import { cleDAppariement } from '@/utils/fabrique/notions'

export default function ChoixDesNotions({ connues, deja }: {
  /** Les notions que la BANQUE déclare déjà — sujets et textes confondus. */
  connues: string[]
  /** Celles que ce cours déclare aujourd'hui. */
  deja: string[]
}) {
  // ⭐ L'état est celui des CASES, pas celui des chaînes : le dédoublonnage se
  //   fait sur la clé d'appariement, sinon cocher « la vérité » quand le cours
  //   porte déjà « La Vérité » afficherait deux lignes pour une seule notion.
  const clesDeja = useMemo(
    () => new Set(deja.map(cleDAppariement).filter((c) => c !== '')), [deja])

  // Les notions du cours que la banque NE CONNAÎT PAS : elles ne sont dans
  // aucune case, et sans cette zone une modification les effacerait en silence.
  const horsBanque = useMemo(() => {
    const clesConnues = new Set(connues.map(cleDAppariement))
    return deja.filter((n) => {
      const c = cleDAppariement(n)
      return c !== '' && !clesConnues.has(c)
    })
  }, [connues, deja])

  const [libres, setLibres] = useState(horsBanque.join('\n'))

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muet">
        Notions traitées{' '}
        <span className="font-normal">
          (tronc commun) ou thèmes / chapitres du semestre (HLP)
        </span>
      </label>
      <p className="text-[11px] text-muet leading-snug">
        Un sujet de la banque déposé en <code>notions</code> devient servable dès qu&apos;un cours
        déclare l&apos;une des siennes — sans re-import, et sans qu&apos;on touche au sujet.
        {' '}<strong>La casse, les accents et l&apos;article initial n&apos;ont pas d&apos;importance</strong>{' '}
        : « la Vérité » et « la vérité » se rattachent au même cours.
      </p>

      {connues.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {connues.map((n) => {
            const coche = clesDeja.has(cleDAppariement(n))
            return (
              <label
                key={n}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs cursor-pointer ${
                  coche
                    ? 'border-pigment bg-pigment-teinte text-encre'
                    : 'border-bordure bg-parchemin text-encre-douce hover:bg-parchemin-fonce'
                }`}
              >
                <input
                  type="checkbox" name="notion" value={n} defaultChecked={coche}
                  className="h-3 w-3 accent-pigment"
                />
                {n}
              </label>
            )
          })}
        </div>
      ) : (
        // ⚠️ CE CAS N'EST PAS UNE ERREUR, et il faut qu'il se lise : tant
        //   qu'aucun sujet n'est déposé, la banque ne connaît aucune notion et
        //   il n'y a rien à proposer. Une zone vide sans un mot laisserait
        //   croire à une panne.
        <p className="text-xs text-muet italic">
          La banque ne déclare encore aucune notion — rien à proposer. Écris-les ci-dessous ;
          elles seront proposées dès qu&apos;un sujet les déclarera.
        </p>
      )}

      <textarea
        name="notions_libres"
        value={libres}
        onChange={(e) => setLibres(e.target.value)}
        rows={2}
        placeholder="Une notion par ligne (ou séparées par des virgules) — pour ce que la banque ne connaît pas encore"
        className="w-full px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment resize-y"
      />
    </div>
  )
}
