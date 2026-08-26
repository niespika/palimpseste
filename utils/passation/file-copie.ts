// ============================================================================
// OÙ EN EST UNE COPIE DANS LA CHAÎNE — et où en est le LOT.
// ----------------------------------------------------------------------------
// ⭐⭐ POURQUOI CE MODULE EXISTE. Le 26/08, une copie sur onze est ressortie de
//    la chaîne MESURÉE MAIS SANS RETOUR. L'écran du professeur affichait
//    « En file. » — indéfiniment, parce qu'il ne regardait qu'une chose : « y
//    a-t-il un job ? ». Or il y en avait deux, tous deux ABOUTIS. Le professeur
//    attendait quelque chose qui ne viendrait jamais, et rien ne le lui disait.
//
//    « Un écran qui compte autre chose que ce qu'il dit est un écran qui ment »
//    — la leçon déjà payée au smoke du 22/08, à trois sections d'ici.
//
// ⛔ « En file » N'EST PAS LE CONTRAIRE DE « a un retour ». Il y a SIX états, et
//    trois d'entre eux se ressemblaient à l'écran :
//      · pas de copie remise    → la chaîne n'a rien à lire, et c'est normal ;
//      · copie remise, HORS FILE → il manque un déclenchement du lot ;
//      · en file                → il faut attendre, et seulement attendre ;
//      · abouti AVEC retour     → rien à faire ;
//      · abouti SANS retour     → le retour a été REFUSÉ ; il faut relancer ;
//      · échec définitif        → la chaîne a renoncé ; il faut relancer.
//    Les deux derniers appellent un GESTE. Les confondre avec « en file », c'est
//    transformer une action en attente.
//
// ⚠️ MODULE PUR — pas de `server-only`, pas de client Supabase : il se teste.
//    (`utils/passation/depots.ts` porte `import 'server-only'`, ce qui le rend
//    intestable sous `npm test` — la raison de cette séparation.)
// ============================================================================

/** L'étape de la chaîne qui mesure et engendre le retour de la v1. */
export const ETAPE_MESURE_V1 = 'mesure_v1'

/** Ce qu'une ligne de job dit d'elle-même — la forme servie par `etatDesJobs`. */
export interface JobLu {
  etape: string
  statut: string
  echec_definitif: boolean
  message: string | null
}

/** Ce qu'il faut savoir d'une copie pour situer son traitement. */
export interface CopiePourFile {
  /** Les jobs de CE dépôt, toutes étapes confondues. */
  attente: readonly JobLu[]
  /** Un retour a-t-il été engendré ? (publié ou non — la publication est un autre geste.) */
  aUnRetour: boolean
  /** L'élève a-t-il remis quelque chose que la chaîne puisse lire ? */
  aUneCopie: boolean
}

export type CleEtatChaine =
  | 'sans_copie' | 'hors_file' | 'en_file' | 'abouti' | 'sans_retour' | 'echec'

export interface EtatChaine {
  cle: CleEtatChaine
  /** Ce que l'écran affiche. Une phrase, pas un code. */
  phrase: string
  /** Le message du job — le motif quand il y en a un. */
  motif: string | null
  /** Le professeur peut-il agir d'un clic ? */
  relancable: boolean
}

/**
 * L'état de la chaîne pour UNE copie.
 *
 * ⚠️ L'ORDRE DES TESTS EST LA LOGIQUE. Un échec définitif prime sur tout — il ne
 *    doit jamais être masqué par un retour présent d'un tour précédent. Et
 *    « aboutie sans retour » ne se teste qu'APRÈS avoir écarté ce qui tourne
 *    encore : un job en file finira peut-être par en écrire un.
 */
export function etatChaineDeLaCopie(c: CopiePourFile): EtatChaine {
  const mesure = c.attente.filter((j) => j.etape === ETAPE_MESURE_V1)
  const tous = c.attente

  const echoue = tous.find((j) => j.echec_definitif)
  if (echoue) {
    return {
      cle: 'echec',
      phrase: `Traitement en échec définitif à l’étape « ${echoue.etape} ».`,
      motif: echoue.message,
      relancable: true,
    }
  }

  if (!c.aUneCopie) {
    return {
      cle: 'sans_copie',
      phrase: 'Aucune copie remise — la chaîne n’a rien à lire.',
      motif: null,
      relancable: false,
    }
  }

  const enCours = tous.some((j) => j.statut === 'en_attente' || j.statut === 'en_cours')
  if (enCours) {
    return { cle: 'en_file', phrase: 'En file — le traitement tourne au fil de la file.', motif: null, relancable: false }
  }

  if (mesure.length === 0) {
    return {
      cle: 'hors_file',
      phrase: 'Copie remise, mais pas encore mise en file : déclenchez l’analyse en lot.',
      motif: null,
      relancable: false,
    }
  }

  if (c.aUnRetour) {
    return { cle: 'abouti', phrase: 'Traitement terminé.', motif: null, relancable: false }
  }

  // ⭐ LE CAS QUI SE TAISAIT. La mesure a abouti, les mesures sont écrites et
  //    payées, et le retour a été refusé au contrôle (`controlerRetour`). Le job
  //    ne sera plus jamais réclamé : sans un geste, cette copie reste sans retour.
  return {
    cle: 'sans_retour',
    phrase: 'Mesuré, mais AUCUN RETOUR n’a été engendré — le retour a été refusé au contrôle.',
    motif: mesure[mesure.length - 1].message,
    relancable: true,
  }
}

export interface ResumeDeFile {
  /** Combien de copies l'élève a remises — le dénominateur de tout le reste. */
  remises: number
  /** Traitement terminé, retour engendré. */
  abouties: number
  /** En attente ou en cours. */
  enFile: number
  /** Remises, mais qu'aucun déclenchement n'a mises en file. */
  horsFile: number
  /** Mesurées sans retour — un geste les débloque. */
  sansRetour: number
  /** Échec définitif — un geste les débloque aussi. */
  enEchec: number
  /** Rien remis. */
  sansCopie: number
}

/**
 * L'état du LOT, en une ligne de comptes.
 *
 * ⚠️ Les six états sont DISJOINTS et couvrent tout : leur somme vaut le nombre
 *    de copies. Une catégorie qui manque, c'est une copie qu'on cesse de
 *    chercher.
 */
export function resumerLaFile(copies: readonly CopiePourFile[]): ResumeDeFile {
  const r: ResumeDeFile = {
    remises: 0, abouties: 0, enFile: 0, horsFile: 0, sansRetour: 0, enEchec: 0, sansCopie: 0,
  }
  for (const c of copies) {
    if (c.aUneCopie) r.remises += 1
    switch (etatChaineDeLaCopie(c).cle) {
      case 'abouti': r.abouties += 1; break
      case 'en_file': r.enFile += 1; break
      case 'hors_file': r.horsFile += 1; break
      case 'sans_retour': r.sansRetour += 1; break
      case 'echec': r.enEchec += 1; break
      case 'sans_copie': r.sansCopie += 1; break
    }
  }
  return r
}

/** Les copies qui attendent un GESTE du professeur, et lui seul. */
export function demandentUnGeste(r: ResumeDeFile): number {
  return r.sansRetour + r.enEchec + r.horsFile
}
