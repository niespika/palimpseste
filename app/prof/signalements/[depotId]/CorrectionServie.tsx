'use client'
// ============================================================================
// « CORRIGER CE QUE L'ÉLÈVE A VU » — le formulaire dérivé du SERVI.
// ----------------------------------------------------------------------------
// ⭐⭐ Chaque bloc est une chose que l'élève a EUE SOUS LES YEUX, dans l'ordre où
//    il l'a lue : la consigne, les candidats, le matériau, les pièces, le
//    guide. Sous chaque bloc, soit un champ (la chose vit sur l'instance), soit
//    la source qui la porte (banque du gabarit, pilote, matériau partagé) et
//    rien à taper — corriger un champ que l'écran ne sert pas, c'est ce que
//    Louis a nommé « inutilisable ».
//
// ⚠️ Il écrit par `editerInstance`, le SEUL chemin (`07-` §1.1). Ce que le
//    formulaire ne montre pas (défaut, pourquoi_juste, lieu, opt-ins) part en
//    champs cachés, tel quel : `lireCas` écrit `null` sur un champ absent.
// ============================================================================

import { useActionState } from 'react'
import { editerInstance, type RetourConception } from '@/app/prof/conception/actions'
import type { ServiPourCorrection, Source } from './servi'

const CHAMP = 'w-full rounded-md border border-bordure-bouton bg-surface px-2.5 py-1.5 font-corps text-[15px] leading-[1.5] text-encre'
const LECTURE = 'rounded-md border border-bordure bg-parchemin px-3 py-2 font-corps text-[15px] leading-[1.5] text-encre whitespace-pre-wrap'

const NOM_SOURCE: Record<Source, string> = {
  instance: 'cette instance',
  gabarit: 'la banque du gabarit',
  pilote: 'le contrat du pilote argument',
  materiau: 'un matériau partagé entre plusieurs exercices',
  doctrine: 'la doctrine du cran',
}

export default function CorrectionServie({ servi }: { servi: ServiPourCorrection }) {
  const [retour, action, enCours] = useActionState<RetourConception | null, FormData>(
    editerInstance, null)
  const rienAEditer = servi.pilote || servi.gabaritActif && !servi.guideEditable

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={servi.id} />
      <input type="hidden" name="lieu" value={servi.lieu} />
      {servi.optinSeJuger && <input type="hidden" name="optin_se_juger" value="oui" />}
      {servi.optinConfiance && <input type="hidden" name="optin_confiance_remise" value="oui" />}

      {(servi.pilote || servi.gabaritActif) && (
        <p className="rounded-lg border border-attention/40 bg-attention-teinte px-3 py-2 font-ui text-sm text-encre">
          {servi.pilote
            ? <>Cet exercice est servi par le <strong>pilote argument</strong> : sa consigne et son déroulé viennent du contrat, pas de l’instance. Rien ne s’édite ici.</>
            : <>Cet exercice est <strong>au gabarit</strong> : l’énoncé, les candidats et les pièces que l’élève lit viennent de la banque
              {servi.clesDuGabarit.length > 0 && <> (<code>{servi.clesDuGabarit.join(', ')}</code>)</>}. Ils se corrigent dans les lots de la banque, puis se réimportent.</>}
        </p>
      )}

      {servi.sujet && (
        <Bloc titre="Le sujet" source="doctrine" note="le sujet de l’exercice, hors de l’instance">
          <p className={LECTURE}>{servi.sujet}</p>
        </Bloc>
      )}
      {servi.texteSupport && (
        <Bloc titre="Le texte de support" source="materiau">
          <p className={LECTURE}>{servi.texteSupport}</p>
        </Bloc>
      )}

      {servi.cas.filter((c) => c.consigneServie !== '' || c.materiau || c.pieces).map((c) => (
        <fieldset key={c.ordre} className="space-y-3 rounded-xl border border-bordure bg-surface p-4">
          <legend className="px-1 font-ui text-xs uppercase tracking-wide text-muet">
            {servi.paire ? `cas ${c.ordre}` : 'ce que l’élève a lu'}
          </legend>

          <Bloc titre="La consigne" source={c.consigneSource}>
            {c.consigneSource === 'instance'
              ? <textarea name={`cas_${c.ordre}_consigne`} rows={3} defaultValue={c.consigneStockee}
                  className={CHAMP} required />
              : <p className={LECTURE}>{c.consigneServie}</p>}
          </Bloc>

          {c.materiau && (
            <Bloc titre="Le matériau" source="materiau">
              <p className={LECTURE}>{c.materiau}</p>
            </Bloc>
          )}

          {c.pieces && (
            <Bloc titre="Les pièces du texte à trou" source="gabarit">
              <ol className="space-y-1">
                {c.pieces.map((p, i) => (
                  <li key={i} className={LECTURE}><span className="font-ui text-xs text-muet">{p.nom} — </span>{p.texte}</li>
                ))}
              </ol>
            </Bloc>
          )}

          {c.candidatsServis.length > 0 && (
            <Bloc titre="Les lectures proposées" source={c.candidatsSource ?? 'instance'}
              note={c.candidatsSource === 'instance'
                ? 'trois distracteurs tirés de la banque ci-dessous, plus la réponse attendue — dans l’ordre servi à cet élève'
                : undefined}>
              <ol className="space-y-1">
                {c.candidatsServis.map((x, i) => (
                  <li key={i} className={`${LECTURE} ${x === c.reponseAttendue ? 'border-liseret' : ''}`}>
                    {x}{x === c.reponseAttendue && <span className="ml-2 font-ui text-xs text-muet">← la réponse attendue</span>}
                  </li>
                ))}
              </ol>
              {c.candidatsSource === 'instance' && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="block space-y-0.5">
                    <span className="block font-ui text-xs text-muet">la banque de distracteurs — un par ligne, trois au minimum</span>
                    <textarea name={`cas_${c.ordre}_distracteurs`} rows={5} defaultValue={c.distracteursStockes} className={CHAMP} />
                  </label>
                  <label className="block space-y-0.5">
                    <span className="block font-ui text-xs text-muet">la réponse attendue</span>
                    <textarea name={`cas_${c.ordre}_reponse`} rows={5} defaultValue={c.reponseAttendue ?? ''} className={CHAMP} />
                  </label>
                </div>
              )}
            </Bloc>
          )}

          {/* Préservés sans être montrés — ou renvoyés tels quels quand la source n'est pas l'instance. */}
          {c.consigneSource !== 'instance' && <input type="hidden" name={`cas_${c.ordre}_consigne`} value={c.consigneStockee} />}
          {c.candidatsSource !== 'instance' && (
            <>
              <input type="hidden" name={`cas_${c.ordre}_distracteurs`} value={c.distracteursStockes} />
              <input type="hidden" name={`cas_${c.ordre}_reponse`} value={c.reponseAttendue ?? ''} />
            </>
          )}
          <input type="hidden" name={`cas_${c.ordre}_defaut`} value={c.defaut ?? ''} />
          <input type="hidden" name={`cas_${c.ordre}_pourquoi_juste`} value={c.pourquoiJuste ?? ''} />
        </fieldset>
      ))}
      {/* Les cas stockés que la vue ne sert pas (pilote) : renvoyés cachés, jamais effacés. */}
      {servi.cas.filter((c) => c.consigneServie === '' && !c.materiau && !c.pieces).map((c) => (
        <div key={c.ordre} hidden>
          <input type="hidden" name={`cas_${c.ordre}_consigne`} value={c.consigneStockee} />
          <input type="hidden" name={`cas_${c.ordre}_distracteurs`} value={c.distracteursStockes} />
          <input type="hidden" name={`cas_${c.ordre}_reponse`} value={c.reponseAttendue ?? ''} />
          <input type="hidden" name={`cas_${c.ordre}_defaut`} value={c.defaut ?? ''} />
          <input type="hidden" name={`cas_${c.ordre}_pourquoi_juste`} value={c.pourquoiJuste ?? ''} />
        </div>
      ))}
      {servi.sansCran && (
        <Bloc titre="La consigne" source="instance">
          <textarea name="consigne" rows={3} defaultValue={servi.cas[0]?.consigneStockee ?? ''} className={CHAMP} required />
        </Bloc>
      )}

      {(servi.guideServi || servi.guideEditable) && (
        <Bloc titre="De quoi t’aider (le guide)" source={servi.guideEditable ? 'instance' : servi.guideSource}
          note={servi.guideEditable && !servi.guideServi ? 'aucun guide n’est servi pour l’instant — en écrire un ici le fera apparaître' : undefined}>
          {servi.guideEditable
            ? <textarea name="guide" rows={3} defaultValue={servi.guideStocke ?? ''} className={CHAMP} />
            : <p className={LECTURE}>{servi.guideServi}</p>}
        </Bloc>
      )}
      {!servi.guideEditable && <input type="hidden" name="guide" value={servi.guideStocke ?? ''} />}

      {!rienAEditer && (
        <button type="submit" disabled={enCours}
          className="min-h-11 rounded-[10px] bg-bouton px-4 py-2 font-ui text-sm font-semibold text-bouton-texte disabled:opacity-50">
          {enCours ? 'Écriture…' : 'Corriger — l’élève lira ceci'}
        </button>
      )}
      {retour && (
        <p className={`font-ui text-sm ${retour.ok ? 'text-ok' : 'text-retard'}`} role="status">
          {retour.message}
          {retour.empechements?.map((e, i) => <span key={i} className="block text-encre-douce">{e}</span>)}
        </p>
      )}
    </form>
  )
}

function Bloc({ titre, source, note, children }: {
  titre: string; source: Source; note?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-ui text-xs uppercase tracking-wide text-encre-douce">{titre}</span>
        <span className={`font-ui text-[11px] ${source === 'instance' ? 'text-ok' : 'text-muet'}`}>
          {source === 'instance' ? 'se corrige ici' : `vient de ${NOM_SOURCE[source]} — lecture seule`}
        </span>
      </div>
      {note && <p className="font-ui text-xs text-muet">{note}</p>}
      {children}
    </div>
  )
}
