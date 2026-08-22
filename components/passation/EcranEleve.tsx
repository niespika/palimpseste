'use client'

// ============================================================================
// C4 · L4 — L'ÉCRAN DE L'ÉLÈVE : photographier, relire, corriger, valider.
// ----------------------------------------------------------------------------
// Étapes 5 à 10 du `02-exercices.md` §6.D. UN SEUL composant pour les DEUX
// modules : « c'est le même flux dans deux modules, et ce qui commande le
// comportement est le `lieu`, jamais le module ».
//
// ⚠️ LE CHAMP D'ÉDITION PRÉSERVE LE DÉCOUPAGE (piège 14 ; `07-` §3 ; `06-` §4).
//    C'est un `<textarea>`, et RIEN d'autre : pas de contenteditable, pas de
//    normalisation à la frappe, pas de `trim` sur les lignes. « La Structure se
//    mesure sur le découpage en blocs tel qu'il est écrit sur la page », et
//    « une transcription qui fusionne deux paragraphes fabrique une copie sans
//    architecture ». Le compteur de blocs est là pour que l'élève VOIE son
//    découpage — il ne le corrige pas.
//
// ⚠️ LE COLLAGE N'EST PAS BLOQUÉ SUR CE CHAMP, et c'est une décision de séance
//    (piège 37, qui demande de trancher et de le dire). L'élève y recopie SA
//    PROPRE COPIE, sous les yeux du professeur, et la copie papier est ramassée :
//    un refus de collage l'empêcherait de remettre en ordre un paragraphe qu'il
//    a mal replacé, sans rien protéger que le terrain ne protège déjà. Le refus
//    du collage EST posé, lui, sur le champ de RÉDACTION AU CLAVIER de l'élève
//    exempté — là où l'enjeu de validité est réel, puisque sa copie est une ancre.
//
// ⚠️ AUCUN CHIFFRE DE CONFIANCE À L'ÉCRAN (piège 56 ; `06-` §5) : « un écran
//    n'affiche un nombre que si ce nombre compte quelque chose ». `confiance_ocr`
//    sert à ATTIRER L'ŒIL SUR UN PASSAGE, pas à afficher un score — d'où la
//    liste des endroits, et jamais le nombre.
//
// ⚠️ AUCUNE QUESTION SUR CE QUE L'ÉLÈVE N'A PAS COMPRIS (piège 26 ; `02-` §5) :
//    rien ici ne l'invite à signaler une incompréhension.
// ============================================================================

import { useState, useRef, useTransition, useActionState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { traiterImage, libererPreview, type ImageTraitee } from '@/utils/imageProcessing'
import {
  actionPreparerLesPhotos, actionEnvoyerLesPhotos, actionEnregistrerLaTranscription,
  actionValiderLaTranscription, actionValiderLaSaisieClavier, actionCollageBloque,
  actionSeJuger, actionConfianceRemise, actionCredence, actionValiderLaLecture,
  type Reponse,
} from '@/app/passation/actions'
import { auQuartDeTour, marqueurPageManquante, photoDeposee, type Photo, type Rotation }
  from '@/utils/passation/photos'
import { blocs } from '@/utils/passation/transcription-calcul'
import type { Doute } from '@/utils/passation/transcription-calcul'
import type { OffreSeJuger, OffreConfiance, OffreCredence } from '@/utils/passation/metacognition'

export interface VueEleve {
  depotId: string
  consigne: string
  ouvert: boolean
  /** L'élève rédige-t-il au clavier ? — `profiles.mode_saisie_force`, jamais le motif. */
  auClavier: boolean
  photos: Photo[] | null
  transcription: string | null
  doutes: Doute[] | null
  valide: boolean
  /** Le message reporté de la passation PRÉCÉDENTE (`06-` §1, règle 3). */
  messageReporte: string | null
  /** Le rappel de lisibilité — UNE LIGNE, du ton de Calame (`06-` §1, règle 1). */
  rappelLisibilite: string
  seJuger: OffreSeJuger
  confiance: OffreConfiance
  libellesConfiance: Record<string, string>
  credence: OffreCredence
  pagesMax: number
  /**
   * Le retour PUBLIÉ, quand il l'est. « L'élève DOIT valider sa lecture — `lu_at`.
   * La validation de lecture ne vit pas [sur le dépôt] mais SUR LE RETOUR : un
   * seul domicile pour un seul geste » (`07-` §1.1 ; piège 32).
   */
  retourPublie: {
    id: string
    points: Array<{ id: string; texte: string; competence: string; nature: string
      ancrage?: { source: string; citation: string } }>
    feedForward: string | null
    commentaireGeneral: string | null
    luLe: string | null
  } | null
  /** L'état de la file, quand la transcription se fait attendre. */
  attente: Array<{ etape: string; statut: string; echec_definitif: boolean; message: string | null }>
}

export function EcranEleve({ vue }: { vue: VueEleve }) {
  if (!vue.ouvert) {
    return (
      <Encart>
        <p className="text-encre">
          La rédaction est en cours. <strong>Le professeur ouvrira le dépôt</strong> quand le temps
          sera écoulé — c’est son geste, pas une minuterie.
        </p>
      </Encart>
    )
  }
  return (
    <div className="space-y-6">
      {vue.messageReporte && (
        <Encart ton="attention">
          <p className="text-sm text-encre">
            <strong>De la dernière fois :</strong> {vue.messageReporte}
          </p>
        </Encart>
      )}
      <Consigne texte={vue.consigne} rappel={vue.rappelLisibilite} auClavier={vue.auClavier} />
      {vue.auClavier
        ? <RedactionClavier vue={vue} />
        : <DepotEtRelecture vue={vue} />}
      {vue.valide && <ApresValidation vue={vue} />}
      {vue.retourPublie && <RetourPublie vue={vue} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// L'OBLIGATION DE LECTURE — `lu_at`, et rien de dupliqué côté dépôt
// ─────────────────────────────────────────────────────────────────────────────

function RetourPublie({ vue }: { vue: VueEleve }) {
  const [etat, action, enCours] = useActionState(actionValiderLaLecture, null as Reponse | null)
  const r = vue.retourPublie!
  return (
    <section className="rounded-lg border border-liseret bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Ton retour
      </h2>
      {r.commentaireGeneral && (
        <p className="mt-2 whitespace-pre-wrap text-encre">{r.commentaireGeneral}</p>
      )}
      <ul className="mt-3 space-y-2 text-sm text-encre">
        {r.points.map((p) => (
          <li key={p.id} className="border-l-2 border-liseret pl-2">
            <p>{p.texte}</p>
            {p.ancrage?.citation && (
              <p className="text-xs italic text-encre-douce">« {p.ancrage.citation} »</p>
            )}
          </li>
        ))}
        {r.points.length === 0 && (
          <li className="italic text-muet">Ton professeur a relu ce retour et l’a laissé vide.</li>
        )}
      </ul>
      {r.feedForward && (
        <p className="mt-3 text-sm text-encre-douce"><strong>Pour la suite :</strong> {r.feedForward}</p>
      )}
      {r.luLe ? (
        <p className="mt-3 text-sm text-ok">
          Lecture validée le {new Date(r.luLe).toLocaleString('fr-CA')}.
        </p>
      ) : (
        <form action={action} className="mt-3">
          <input type="hidden" name="retour_id" value={r.id} />
          <p className="text-sm text-encre-douce">
            <strong>Tu dois valider ta lecture</strong> pour pouvoir rendre autre chose.
          </p>
          <button type="submit" disabled={enCours}
            className="mt-2 rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
            {enCours ? '…' : 'J’ai lu mon retour'}
          </button>
          {etat && <p className={`mt-2 text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</p>}
        </form>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function Consigne({ texte, rappel, auClavier }: { texte: string; rappel: string; auClavier: boolean }) {
  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">Le sujet</h2>
      <p className="mt-2 whitespace-pre-wrap text-encre">{texte}</p>
      {/* Règle 1 du `06-` §1 : UNE LIGNE, du ton de Calame — jamais un encart.
          Et elle ne se livre pas sans l'exemption (règle 4) : l'élève exempté
          ne la voit pas, puisqu'il n'écrit pas à la main. */}
      {!auClavier && <p className="mt-3 text-sm italic text-encre-douce">{rappel}</p>}
    </section>
  )
}

function Encart({ children, ton = 'info' }: { children: React.ReactNode; ton?: 'info' | 'attention' }) {
  const cls = ton === 'attention'
    ? 'border-attention bg-attention-teinte'
    : 'border-bordure bg-surface'
  return <div className={`rounded-lg border p-4 ${cls}`}>{children}</div>
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 5 — PHOTOGRAPHIER ; ÉTAPES 6 À 8 — RELIRE, CORRIGER, VALIDER
// ─────────────────────────────────────────────────────────────────────────────

interface Page { image: ImageTraitee | null; rotation: Rotation; manquante: boolean }

function DepotEtRelecture({ vue }: { vue: VueEleve }) {
  const [pages, setPages] = useState<Page[]>([])
  const [envoi, setEnvoi] = useState(false)
  const [progression, setProgression] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [transcription, setTranscription] = useState(vue.transcription ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  const dejaTranscrit = (vue.transcription ?? '').trim() !== ''

  async function ajouter(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(e.target.files ?? [])
    if (fichiers.length === 0) return
    if (pages.length + fichiers.length > vue.pagesMax) {
      setErreur(`Maximum ${vue.pagesMax} pages.`)
      return
    }
    setErreur(null)
    try {
      const neuves: Page[] = []
      for (let i = 0; i < fichiers.length; i++) {
        setProgression(`Traitement de la page ${pages.length + i + 1}…`)
        // `traiterImage` lit l'EXIF sur l'original PUIS le supprime à la
        // compression (`06-` §7, point 4). ⚠️ On n'en tire AUCUN signal : le
        // seuil « photo suspecte » de Fragments ne se recopie pas ici (piège 11).
        neuves.push({ image: await traiterImage(fichiers[i]), rotation: 0, manquante: false })
      }
      setPages((p) => [...p, ...neuves])
    } catch {
      setErreur('Erreur au traitement des photos. Réessaie.')
    } finally {
      setProgression('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  /** « Ton écran doit pouvoir dire qu'une page manque, VRAIMENT » (piège 12). */
  function declarerPageManquante() {
    setPages((p) => [...p, { image: null, rotation: 0, manquante: true }])
  }

  function retirer(i: number) {
    setPages((p) => {
      const img = p[i].image
      if (img) libererPreview(img.previewUrl)
      return p.filter((_, k) => k !== i)
    })
  }

  function deplacer(i: number, delta: number) {
    setPages((p) => {
      const j = i + delta
      if (j < 0 || j >= p.length) return p
      const n = [...p]
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })
  }

  function tourner(i: number) {
    setPages((p) => p.map((x, k) => (k === i ? { ...x, rotation: auQuartDeTour(x.rotation + 90) } : x)))
  }

  async function envoyer() {
    if (pages.length === 0) { setErreur('Ajoute au moins une page.'); return }
    if (pages.every((p) => p.manquante)) {
      setErreur('Toutes les pages sont déclarées manquantes : il n’y a rien à transcrire.')
      return
    }
    setEnvoi(true)
    setErreur(null)
    try {
      const aDeposer = pages.filter((p) => !p.manquante)
      setProgression('Préparation…')
      const prep = await actionPreparerLesPhotos(vue.depotId, aDeposer.length)
      if (!prep.ok) { setErreur(prep.message); setEnvoi(false); return }

      const supabase = createClient()
      const chemins: string[] = []
      for (let i = 0; i < aDeposer.length; i++) {
        setProgression(`Envoi de la page ${i + 1}/${aDeposer.length}…`)
        const { path, token } = prep.uploads[i]
        const { error } = await supabase.storage.from('codex')
          .uploadToSignedUrl(path, token, aDeposer[i].image!.file, { contentType: 'image/jpeg' })
        if (error) { setErreur(error.message); setEnvoi(false); return }
        chemins.push(path)
      }

      // La forme que la garde exige — fabriquée en UN SEUL endroit
      // (`utils/passation/photos.ts`), jamais à la main dans un écran.
      let k = 0
      const photos: Photo[] = pages.map((p, i) => {
        if (p.manquante) return marqueurPageManquante(i + 1)
        const photo = photoDeposee(i + 1, chemins[k], sommeDe(p.image!), p.rotation)
        k++
        return photo
      })

      setProgression('Transcription en cours…')
      const r = await actionEnvoyerLesPhotos(vue.depotId, photos)
      if (!r.ok) { setErreur(r.message); setEnvoi(false); return }
      setProgression(r.message)
      // Le rechargement va chercher la transcription écrite en base : l'écran
      // n'invente pas le texte, il le lit là où la mesure le lira.
      window.location.reload()
    } finally {
      setEnvoi(false)
    }
  }

  if (dejaTranscrit || vue.valide) {
    return <Relecture vue={vue} texte={transcription} setTexte={setTranscription} />
  }

  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Photographie ta copie
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        Une photo par page, dans l’ordre. Si une page est illisible ou absente, dis-le : la copie
        gardera son compte de pages.
      </p>

      <ol className="mt-4 space-y-2">
        {pages.map((p, i) => (
          <li key={i} className="flex items-center gap-3 rounded border border-bordure-bouton p-2">
            <span className="w-6 text-center font-cinzel text-muet">{i + 1}</span>
            {p.manquante ? (
              <span className="flex-1 text-sm italic text-attention">Page déclarée manquante</span>
            ) : (
              <>
                <img
                  src={p.image!.previewUrl} alt={`Page ${i + 1}`}
                  style={{ transform: `rotate(${p.rotation}deg)` }}
                  className="h-16 w-16 object-cover"
                />
                <button type="button" onClick={() => tourner(i)}
                  className="text-sm text-encre-douce underline">Tourner</button>
              </>
            )}
            <button type="button" onClick={() => deplacer(i, -1)} disabled={i === 0}
              className="text-sm text-encre-douce disabled:opacity-30">↑</button>
            <button type="button" onClick={() => deplacer(i, 1)} disabled={i === pages.length - 1}
              className="text-sm text-encre-douce disabled:opacity-30">↓</button>
            <button type="button" onClick={() => retirer(i)}
              className="text-sm text-retard underline">Retirer</button>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" accept="image/*" multiple capture="environment"
          onChange={ajouter} disabled={envoi} className="text-sm" />
        <button type="button" onClick={declarerPageManquante} disabled={envoi}
          className="rounded border border-bordure-bouton px-3 py-1 text-sm text-encre-douce">
          Une page manque
        </button>
        <button type="button" onClick={envoyer} disabled={envoi || pages.length === 0}
          className="rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
          {envoi ? 'Envoi…' : 'Envoyer'}
        </button>
      </div>
      {progression && <p className="mt-2 text-sm text-muet">{progression}</p>}
      {erreur && <p className="mt-2 text-sm text-retard">{erreur}</p>}
      {vue.attente.some((a) => a.echec_definitif) && (
        <Encart ton="attention">
          <p className="text-sm text-encre">
            La transcription n’a pas abouti. <strong>Préviens ton professeur</strong> : ta copie
            papier reste la preuve, rien n’est perdu.
          </p>
        </Encart>
      )}
    </section>
  )
}

/** Une somme de contrôle stable, calculée sur ce que l'élève envoie vraiment. */
function sommeDe(img: ImageTraitee): string {
  return `${img.file.size}-${img.file.lastModified}-${img.nom}`
}

// ─────────────────────────────────────────────────────────────────────────────

function Relecture({
  vue, texte, setTexte,
}: { vue: VueEleve; texte: string; setTexte: (t: string) => void }) {
  const [etat, action, enCours] = useActionState(actionValiderLaTranscription, null as Reponse | null)
  const [, demarrer] = useTransition()
  const [sauve, setSauve] = useState<string | null>(null)
  const nbBlocs = blocs(texte).length

  function enregistrer() {
    demarrer(async () => {
      const r = await actionEnregistrerLaTranscription(vue.depotId, texte)
      setSauve(r.ok ? 'Enregistré.' : r.message)
    })
  }

  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Relis et corrige
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        La machine a lu ta copie. <strong>Corrige ce qu’elle a mal lu</strong> — c’est ce texte-là
        qui sera lu ensuite. Garde tes paragraphes tels que tu les as écrits.
      </p>

      {/* `confiance_ocr` sert à ATTIRER L'ŒIL, jamais à afficher un score. */}
      {vue.doutes && vue.doutes.length > 0 && (
        <div className="mt-3 rounded border border-attention bg-attention-teinte p-3">
          <p className="text-sm font-semibold text-encre">Ce que la machine a eu du mal à lire :</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-encre">
            {vue.doutes.map((d, i) => (
              <li key={i}>
                « {d.extrait} »
                {d.alternative ? <span className="text-encre-douce"> — ou peut-être « {d.alternative} »</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={action} className="mt-3">
        <input type="hidden" name="depot_id" value={vue.depotId} />
        {/* ⚠️ UN `<textarea>`, et rien d'autre : il préserve les retours à la
            ligne et les lignes vides tels quels, de bout en bout. */}
        <textarea
          name="texte" value={texte} onChange={(e) => setTexte(e.target.value)}
          readOnly={vue.valide} rows={20} spellCheck
          className="w-full rounded border border-bordure-bouton bg-parchemin p-3 font-mono text-sm
                     leading-relaxed text-encre"
        />
        <p className="mt-1 text-xs text-muet">
          {nbBlocs} paragraphe{nbBlocs > 1 ? 's' : ''} — une ligne vide sépare deux paragraphes.
        </p>
        {!vue.valide && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={enregistrer}
              className="rounded border border-bordure-bouton px-3 py-1 text-sm text-encre-douce">
              Enregistrer sans valider
            </button>
            <button type="submit" disabled={enCours}
              className="rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
              {enCours ? 'Validation…' : 'Valider ma copie'}
            </button>
            {sauve && <span className="text-sm text-muet">{sauve}</span>}
            {etat && <span className={`text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</span>}
          </div>
        )}
        {vue.valide && <p className="mt-2 text-sm text-ok">Copie validée. Tout est sauvegardé.</p>}
      </form>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ÉLÈVE EXEMPTÉ — au clavier, et le clavier a sa contrepartie
// ─────────────────────────────────────────────────────────────────────────────

function RedactionClavier({ vue }: { vue: VueEleve }) {
  const [etat, action, enCours] = useActionState(actionValiderLaSaisieClavier, null as Reponse | null)
  const [texte, setTexte] = useState(vue.transcription ?? '')
  const nbBlocs = blocs(texte).length

  /**
   * « Les champs de rédaction REFUSENT LE COLLAGE — raccourci clavier,
   * glisser-déposer, menu contextuel », et « chaque tentative bloquée est
   * journalisée » (`06-` §1 ; piège 37). ⚠️ Réserve écrite noir sur blanc dans
   * la source : le blocage n'est QUE côté navigateur.
   * ⚠️ En classe, la trace n'alimente PAS le faisceau, « qui ne regarde que la
   *    maison » (`06-` §6) : elle reste une trace serveur.
   */
  function refuserLeCollage(moyen: string) {
    return (e: React.SyntheticEvent) => {
      e.preventDefault()
      void actionCollageBloque(vue.depotId, moyen)
    }
  }

  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Rédige ta copie
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        Tu écris au clavier. <strong>Le collage est désactivé</strong> : ce texte doit être le tien.
      </p>
      <form action={action} className="mt-3">
        <input type="hidden" name="depot_id" value={vue.depotId} />
        <textarea
          name="texte" value={texte} onChange={(e) => setTexte(e.target.value)}
          readOnly={vue.valide} rows={22}
          // ⚠️ EXPLICITE, et pas laissé au défaut du navigateur : « le correcteur
          //    orthographique du navigateur RESTE ACTIF — il n'est pas désactivé »
          //    (`06-` §1) est une règle de source, et une règle nommée ne se confie
          //    pas à un défaut d'implémentation qui peut changer.
          spellCheck
          onPaste={refuserLeCollage('raccourci')}
          onDrop={refuserLeCollage('glisser-deposer')}
          onContextMenu={refuserLeCollage('menu-contextuel')}
          className="w-full rounded border border-bordure-bouton bg-parchemin p-3 font-mono text-sm
                     leading-relaxed text-encre"
        />
        <p className="mt-1 text-xs text-muet">
          {nbBlocs} paragraphe{nbBlocs > 1 ? 's' : ''} — une ligne vide sépare deux paragraphes.
        </p>
        {!vue.valide && (
          <button type="submit" disabled={enCours}
            className="mt-3 rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
            {enCours ? 'Validation…' : 'Valider ma copie'}
          </button>
        )}
        {etat && <p className={`mt-2 text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</p>}
      </form>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPES 9 ET 10 — LES DEUX DRAPEAUX, ET CE QU'ILS OUVRENT
// ─────────────────────────────────────────────────────────────────────────────

function ApresValidation({ vue }: { vue: VueEleve }) {
  return (
    <>
      {vue.credence.servie && <Credence vue={vue} />}
      {vue.seJuger.servie && <SeJuger vue={vue} />}
      {vue.confiance.servie && <ConfianceRemise vue={vue} />}
    </>
  )
}

function SeJuger({ vue }: { vue: VueEleve }) {
  const [etat, action, enCours] = useActionState(actionSeJuger, null as Reponse | null)
  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">Te juger</h2>
      <form action={action} className="mt-3 space-y-4">
        <input type="hidden" name="depot_id" value={vue.depotId} />
        {vue.seJuger.questions.map((q) => (
          <fieldset key={q.observable_code}>
            <legend className="text-sm text-encre">{q.question}</legend>
            <div className="mt-1 flex flex-wrap gap-3">
              {q.reponses.map((r) => (
                <label key={r} className="flex items-center gap-1 text-sm text-encre-douce">
                  <input type="radio" name={`q:${q.observable_code}`} value={r} required />
                  {r}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="submit" disabled={enCours}
          className="rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
          {enCours ? '…' : 'Enregistrer'}
        </button>
        {etat && <p className={`text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</p>}
      </form>
    </section>
  )
}

function ConfianceRemise({ vue }: { vue: VueEleve }) {
  const [etat, action, enCours] = useActionState(actionConfianceRemise, null as Reponse | null)
  if (vue.confiance.competences.length === 0) return null
  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Comment te sens-tu ?
      </h2>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="depot_id" value={vue.depotId} />
        {/* UNE VALEUR PAR COMPÉTENCE, JAMAIS UN SCALAIRE — « parce qu'une
            passation en classe en mesure trois ou quatre » (`07-` §1.1). */}
        {vue.confiance.competences.map((c) => (
          <fieldset key={c}>
            <legend className="text-sm capitalize text-encre">{c}</legend>
            <div className="mt-1 flex flex-wrap gap-3">
              {Object.entries(vue.libellesConfiance).map(([valeur, libelle]) => (
                <label key={valeur} className="flex items-center gap-1 text-sm text-encre-douce">
                  {/* Le libellé est LIBRE ; la valeur stockée est celle de l'enum. */}
                  <input type="radio" name={`c:${c}`} value={valeur} required />
                  {libelle}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="submit" disabled={enCours}
          className="rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
          {enCours ? '…' : 'Enregistrer'}
        </button>
        {etat && <p className={`text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</p>}
      </form>
    </section>
  )
}

function Credence({ vue }: { vue: VueEleve }) {
  const [etat, action, enCours] = useActionState(actionCredence, null as Reponse | null)
  const jetons = vue.credence.forme === 'jetons_sur_100'
  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Quelle chance donnes-tu à ta réponse ?
      </h2>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="depot_id" value={vue.depotId} />
        {jetons ? (
          <>
            <p className="text-sm text-encre-douce">Répartis 100 jetons entre ces quatre réponses.</p>
            {vue.credence.candidats.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm text-encre">
                <input type="number" name={`j:${c}`} min={0} max={100} defaultValue={25}
                  className="w-20 rounded border border-bordure-bouton bg-parchemin p-1" />
                {c}
              </label>
            ))}
          </>
        ) : (
          <label className="flex items-center gap-2 text-sm text-encre">
            <input type="number" name="pourcentage" min={0} max={100} defaultValue={50}
              className="w-20 rounded border border-bordure-bouton bg-parchemin p-1" />
            % de chances que ta réponse soit juste
          </label>
        )}
        <button type="submit" disabled={enCours}
          className="rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
          {enCours ? '…' : 'Enregistrer'}
        </button>
        {etat && <p className={`text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</p>}
      </form>
    </section>
  )
}
