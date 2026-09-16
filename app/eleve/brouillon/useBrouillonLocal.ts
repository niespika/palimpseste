'use client'

import { useEffect, useRef, useState } from 'react'
import { avecBase, ecrireBrouillon, estRestaurableSur, fusionnerBrouillon, lireBrouillon, purgerBrouillon, toutVideHorsBase, type ValeursBrouillon } from '@/utils/aletheia/brouillon'

/** Le délai avant d'écrire — assez lâche pour ne pas marteler, et le démontage écrit tout de suite. */
const DELAI_MS = 300

/**
 * `window.localStorage` peut LEVER à l'accès même (Safari « bloquer tous les cookies », profils
 * gérés) : on n'y touche que par ici, et sans stockage le brouillon n'existe pas — la page vit.
 */
function stockage(): Storage | null {
  try { return window.localStorage } catch { return null }
}

/**
 * ⭐ Brouillon LOCAL d'un écran de saisie, PAR CLÉ — le filet commun d'Aletheia (13/09) et du
 *    déroulé des exercices (15/09). La partie pure est dans `utils/aletheia/brouillon.ts` ; la clé
 *    est construite par l'appelant (`cleBrouillon` côté Aletheia, `cleBrouillonDeroule` côté
 *    déroulé) et porte toujours l'ÉLÈVE.
 *
 * - au montage, s'il existe un brouillon sous cette clé, il est fusionné aux valeurs initiales
 *   et rendu par `appliquer` — **sauf si le serveur a bougé depuis** : le brouillon porte
 *   (`CLE_BASE`) l'état serveur sur lequel il a été pris ; si l'état initial d'aujourd'hui n'est
 *   plus celui-là (écrit depuis un autre appareil), le brouillon est jeté, jamais restauré
 *   par-dessus un texte plus récent (revue adversariale du 15/09) ;
 * - ensuite, chaque changement de `valeurs` est écrit (après un court délai, ou tout de suite si
 *   le composant se démonte ou si la page se cache avant — l'élève parti valider ailleurs) ;
 * - `synchroniser()` quand le SERVEUR porte désormais ces valeurs : elles deviennent la référence
 *   et le brouillon est retiré — ce qui reste sur l'appareil est toujours ce que la base n'a pas ;
 * - `purger()` à la soumission acceptée ;
 * - `disponible` : le stockage répond — les écrans ne PROMETTENT « gardé sur cet appareil » que
 *   sur lui.
 *
 * `cle` à `null` : pas de brouillon du tout (lecture seule, élève inconnu) — les hooks restent
 * appelés, ils ne font rien.
 *
 * Rien n'est écrit avant la première frappe : ni au montage (les valeurs de la base ne sont pas
 * un brouillon), ni par la passe de restauration.
 */
export function useBrouillonLocalParCle<T extends ValeursBrouillon>(
  cle: string | null,
  valeurs: T,
  appliquer: (fusion: T) => void,
) {
  // Le contenu sérialisé sert de dépendance : l'objet `valeurs` change à chaque rendu.
  const serialise = JSON.stringify(valeurs)
  const lu = useRef(false)
  const initial = useRef<string | null>(null)
  const enAttente = useRef<(() => void) | null>(null)
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Un brouillon vient d'être appliqué et son rendu n'est pas encore passé par ici. */
  const restaurationEnCours = useRef(false)
  /** Le dernier état rendu — pour que `synchroniser` sache si l'élève a tapé pendant l'envoi. */
  const dernier = useRef(serialise)
  const [disponible, setDisponible] = useState(false)

  const annuler = () => {
    if (minuteur.current) { clearTimeout(minuteur.current); minuteur.current = null }
    enAttente.current = null
  }
  const ecrireMaintenant = (s: Storage, c: string, contenu: string, base: string | null) => {
    const v = JSON.parse(contenu) as ValeursBrouillon
    if (toutVideHorsBase(v)) { purgerBrouillon(s, c); return }
    ecrireBrouillon(s, c, avecBase(v, base))
  }

  useEffect(() => {
    dernier.current = serialise
    if (!cle) return
    const s = stockage()
    if (!s) return
    // Un état, pas une ref : le pied des écrans ne promet « gardé sur cet appareil » que sur lui.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisponible(true)
    if (!lu.current) {
      // Première passe : lire, jamais écrire. S'il y a un brouillon pris sur CET état serveur,
      // on l'applique et le rendu qui suit (valeurs restaurées) écrira ; s'il a été pris sur un
      // autre état, le serveur a bougé depuis : on le jette ; sinon on retient l'état initial
      // pour ne pas l'écrire tel quel.
      lu.current = true
      initial.current = serialise
      const brouillon = lireBrouillon(s, cle)
      if (!brouillon) return
      if (!estRestaurableSur(brouillon, serialise)) { purgerBrouillon(s, cle); return }
      const fusion = fusionnerBrouillon(JSON.parse(serialise) as T, brouillon)
      if (JSON.stringify(fusion) === serialise) return
      restaurationEnCours.current = true
      appliquer(fusion)
      return
    }
    if (serialise === initial.current) {
      // ⚠️ StrictMode (dev) rejoue l'effet AVANT le rendu restauré : ne pas purger ce qu'on
      //    vient d'appliquer. Sinon, revenu à l'état de référence (tout effacé, ou retapé à
      //    l'identique) : plus de brouillon.
      if (restaurationEnCours.current) return
      annuler(); purgerBrouillon(s, cle); return
    }
    restaurationEnCours.current = false
    const base = initial.current
    const ecrire = () => { minuteur.current = null; enAttente.current = null; ecrireMaintenant(s, cle, serialise, base) }
    annuler()
    enAttente.current = ecrire
    minuteur.current = setTimeout(ecrire, DELAI_MS)
    return () => { if (minuteur.current) { clearTimeout(minuteur.current); minuteur.current = null } }
    // `appliquer` est une fermeture du formulaire, recréée à chaque rendu : la dépendance
    // ferait relire à chaque frappe. Elle n'est appelée qu'à la première passe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, serialise])

  // Au démontage (l'élève part valider ailleurs) et quand la page se cache (onglet fermé,
  // iOS qui suspend), l'écriture en attente part tout de suite.
  useEffect(() => {
    const flush = () => { enAttente.current?.() }
    window.addEventListener('pagehide', flush)
    return () => { window.removeEventListener('pagehide', flush); flush() }
  }, [])

  return {
    disponible,
    purger: () => { annuler(); const s = stockage(); if (cle && s) purgerBrouillon(s, cle) },
    /** Le serveur porte ces valeurs : elles deviennent la référence, le brouillon s'en va. */
    synchroniser: (valeursServeur: T) => {
      annuler()
      initial.current = JSON.stringify(valeursServeur)
      restaurationEnCours.current = false
      const s = stockage()
      if (!cle || !s) return
      // Ce qui reste sur l'appareil est ce que la base n'a pas : rien si l'élève n'a pas tapé
      // pendant l'envoi, sinon l'état courant tel quel, pris sur la nouvelle base.
      if (dernier.current === initial.current) purgerBrouillon(s, cle)
      else ecrireMaintenant(s, cle, dernier.current, initial.current)
    },
  }
}
