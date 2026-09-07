import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// ============================================================================
// ⛔⛔ L'INTERRUPTEUR DES TRAVAUX — mettre à `false` et POUSSER pour rouvrir.
//
// Levé le 2026-09-07 à la demande de Louis, le temps de réparer la chaîne des
// retours (72 dépôts rendus sans retour, 34 élèves). Tant qu'il est à `true`,
// toute page HUMAINE est réécrite vers `/travaux`.
//
// ⚠️ CE QUI CONTINUE DE TOURNER, ET C'EST VOULU :
//   · `/api/*` — le `matcher` ci-dessous l'exclut déjà. Les quatre crons de
//     `vercel.json` (`/api/chaine` à la minute, `/api/assiduite/hebdo`,
//     `/api/scriptorium/synthese-hebdo`) ne sont pas touchés : la file finit ce
//     qu'elle a commencé. Couper la chaîne ajouterait des dépôts muets aux 72.
//   · `/login` et `/auth/*` — laissés ouverts pour ne verrouiller personne
//     dehors, et pour que les liens magiques de recette continuent d'arriver.
//
// ⭐ LE LAISSEZ-PASSER, s'il en faut un : poser `TRAVAUX_LAISSEZ_PASSER` dans
//    les variables Vercel (n'importe quelle valeur), puis visiter
//    `https://palimpseste.ink/?atelier=<cette valeur>`. Un cookie de 12 h est
//    posé et le site s'ouvre normalement pour ce navigateur-là.
//    ⛔ AUCUNE valeur par défaut, et c'est exprès : le dépôt est PUBLIC.
//    Sans la variable, il n'y a pas de laissez-passer du tout.
// ============================================================================
const TRAVAUX = true

/** Le cookie que pose le laissez-passer. Sa valeur est comparée à l'env. */
const COOKIE_ATELIER = 'palimpseste_atelier'

/** Ce qui passe malgré les travaux : la page elle-même, et de quoi s'identifier. */
function laisseePasser(chemin: string): boolean {
  return chemin === '/travaux'
    || chemin === '/login'
    || chemin.startsWith('/auth/')
}

export async function proxy(request: NextRequest) {
  if (TRAVAUX) {
    const cle = process.env.TRAVAUX_LAISSEZ_PASSER
    const { pathname } = request.nextUrl

    // Le laissez-passer se présente une fois en query, puis vit en cookie —
    // sans quoi il faudrait le recoller à chaque navigation.
    if (cle && request.nextUrl.searchParams.get('atelier') === cle) {
      const propre = request.nextUrl.clone()
      propre.searchParams.delete('atelier')
      const reponse = NextResponse.redirect(propre)
      reponse.cookies.set(COOKIE_ATELIER, cle, {
        httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12,
      })
      return reponse
    }

    const ouvert = !!cle && request.cookies.get(COOKIE_ATELIER)?.value === cle
    if (!ouvert && !laisseePasser(pathname)) {
      // Réécriture, pas redirection : l'URL de l'élève ne bouge pas, donc son
      // lien reste bon quand les travaux se terminent.
      return NextResponse.rewrite(new URL('/travaux', request.url))
    }
  }

  return await updateSession(request)
}

export const config = {
  // Toutes les routes sauf API (auth propre, pas de Server Component à pré-rafraîchir)
  // et assets statiques / images.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
