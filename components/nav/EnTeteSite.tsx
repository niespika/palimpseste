'use client'

// =========================================================================
// components/nav/EnTeteSite.tsx
// En-tête desktop partagé prof/élève — deux barres compactes (handoff_en_tete).
//   Barre 1 : navigation générale (onglets centrés + zone d'actions à droite).
//   Barre 2 : « seuil du module » (marque à gauche, devise + sous-onglets au
//             centre, sceau du module à droite ; hors module : bande plate,
//             marque + devise de la maison, sans sceau).
// Composant CLIENT : lit usePathname() pour résoudre le module courant (un
// layout serveur ne peut pas lire le pathname). Données serveur en props.
// Valeurs visuelles transcrites au pixel de la maquette (blocs 4A–4L).
// Desktop uniquement (hidden sm:block) ; mobile = barres existantes inchangées.
// =========================================================================

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import BarreNavigation from './BarreNavigation'
import SceauModule from './SceauModule'
import {
  moduleDepuisPathname,
  DEVISE_MAISON,
  type ModuleConfig,
  type DeviseMonde,
} from './configModules'
import type { NavTab } from './configNavigation'
import SelecteurClasseEleve from '@/app/eleve/SelecteurClasseEleve'
import SelecteurSemestre from '@/app/prof/fragments-erudition/SelecteurSemestre'
import type { InscriptionEleve } from '@/app/eleve/contexte-classe'

export interface EnTeteSiteProps {
  role: 'prof' | 'eleve'
  tabs: NavTab[]
  deconnexionAction: (formData: FormData) => void | Promise<void>
  classe?: { inscriptions: InscriptionEleve[]; activeId: string | null }
}

const FILET_STYLE = {
  background: 'linear-gradient(rgba(0,0,0,0),rgba(60,50,40,.16),rgba(0,0,0,0))',
}

function Marque({ href }: { href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-[7px] flex-shrink-0">
      <span
        className="relative inline-flex overflow-hidden"
        style={{ width: 64, height: 64, borderRadius: '50%', background: '#EDE6D6', border: '1px solid #E4DBC9' }}
      >
        <Image
          src="/sceaux/palimpseste_medaillon.png"
          alt=""
          fill
          sizes="64px"
          style={{ objectFit: 'cover', filter: 'brightness(1.05) contrast(1.05)', mixBlendMode: 'multiply' }}
        />
      </span>
      <span className="font-marque" style={{ fontWeight: 600, fontSize: 23, letterSpacing: '.05em', color: '#221C16' }}>
        Palimpseste
      </span>
    </Link>
  )
}

function Devise({ devise, couleur, maison }: { devise: DeviseMonde; couleur: string; maison?: boolean }) {
  if (maison) {
    return (
      <div className="font-titre text-center" style={{ fontSize: 18, color: couleur, fontVariant: 'small-caps', letterSpacing: '.07em' }}>
        {devise.latin}
      </div>
    )
  }
  return (
    <div className="font-titre text-center" style={{ fontSize: 18, color: couleur }}>
      <span style={{ fontVariant: 'small-caps', letterSpacing: '.05em' }}>{devise.latin}</span>
      {devise.francais && <span style={{ fontStyle: 'italic' }}> — {devise.francais}</span>}
    </div>
  )
}

// Rendu pur des sous-onglets ; `actif` décide de l'onglet en surbrillance.
// `overflow-x-auto` + le `min-w-0` du parent gardent le sceau à l'écran quand
// c'est serré (640–900px) sans changer le rendu à pleine largeur.
function SousOngletsListe({
  mod, compact, actif,
}: { mod: ModuleConfig; compact: boolean; actif: (o: { href: string; vue?: string }) => boolean }) {
  const c = mod.couleurs
  return (
    <div className="flex justify-center max-w-full overflow-x-auto py-1 -my-1" style={{ gap: compact ? 4 : 6 }}>
      {mod.sousOngletsProf.map((o) => {
        const est = actif(o)
        return (
          <Link
            key={o.href}
            href={o.href}
            aria-current={est ? 'page' : undefined}
            className="font-ui rounded-[8px] whitespace-nowrap transition-colors"
            style={{
              fontSize: compact ? 13.5 : 14,
              fontWeight: est ? 500 : 400,
              padding: compact ? '6px 12px' : '7px 15px',
              background: est ? c.ongletActifFond : 'transparent',
              color: est ? c.ongletActifTexte : c.ongletInactif,
            }}
          >
            {o.label}
          </Link>
        )
      })}
    </div>
  )
}

// Onglets pilotés par la ROUTE : actif = plus long préfixe (comme SousNavModule).
function SousOngletsRoute({ mod, pathname, compact }: { mod: ModuleConfig; pathname: string; compact: boolean }) {
  const actifHref = mod.sousOngletsProf.reduce<string | null>((best, o) => {
    const match = pathname === o.href || pathname.startsWith(o.href + '/')
    return match && o.href.length > (best?.length ?? -1) ? o.href : best
  }, null)
  return <SousOngletsListe mod={mod} compact={compact} actif={(o) => o.href === actifHref} />
}

// Onglets pilotés par `?vue=` (Scriptorium). Isolé pour n'exiger la frontière
// Suspense de useSearchParams QUE sur ce sous-arbre.
function SousOngletsParam({ mod, compact }: { mod: ModuleConfig; compact: boolean }) {
  const vueDefaut = mod.sousOngletsProf[0]?.vue
  const vue = useSearchParams().get('vue') ?? vueDefaut
  return <SousOngletsListe mod={mod} compact={compact} actif={(o) => o.vue === vue} />
}

export default function EnTeteSite({ role, tabs, deconnexionAction, classe }: EnTeteSiteProps) {
  const pathname = usePathname()
  const mod = moduleDepuisPathname(pathname)
  const dashHref = role === 'prof' ? '/prof' : '/eleve'
  const montreSousOnglets = role === 'prof' && !!mod && mod.sousOngletsProf.length > 0
  const estFragments = mod?.cle === 'fragments'
  const sousOngletsCompacts = !!mod && mod.sousOngletsProf.length >= 6
  const sousOngletsParParam = !!mod && mod.sousOngletsProf.some((o) => !!o.vue)

  return (
    <header className="hidden sm:block sticky top-0 z-10 print:hidden">
      {/* ─── Barre 1 — navigation générale ─── */}
      <div className="border-b border-[#E4DBC9] bg-[#FBF8F1]">
        <div className="relative max-w-[1040px] mx-auto px-[28px] py-[11px] flex justify-center">
          <BarreNavigation tabs={tabs} />
          {/* Zone d'actions ancrée à la colonne 1040px (alignée au sceau), pas au bord de l'écran. */}
          <div className="absolute right-[28px] top-0 bottom-0 flex items-center gap-[12px]">
            {role === 'eleve' && classe && (
              <SelecteurClasseEleve variant="chip" inscriptions={classe.inscriptions} activeId={classe.activeId ?? ''} />
            )}
            <span className="w-px h-[20px]" style={{ background: '#E4DBC9' }} />
            <form action={deconnexionAction}>
              <button type="submit" className="font-ui text-[13px] transition-colors text-[#7A6650] hover:text-encre">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── Barre 2 — seuil du module ─── */}
      {mod ? (
        <div
          className="relative border-b border-[#E4DBC9]"
          style={{ backgroundImage: `linear-gradient(90deg,#FBF8F1 26%,${mod.couleurs.degradeMi} 62%,${mod.couleurs.degradeFin} 100%)` }}
        >
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{ height: 2, background: 'linear-gradient(90deg,rgba(184,137,59,0),rgba(184,137,59,.55),#B8893B)' }}
          />
          <div className="max-w-[1040px] mx-auto" style={{ padding: '14px 28px 16px' }}>
            <div className="flex items-center" style={{ gap: 22 }}>
              <Marque href={dashHref} />
              <span className="w-px self-stretch" style={FILET_STYLE} />
              {montreSousOnglets ? (
                <div className="flex-1 min-w-0 flex flex-col items-center" style={{ gap: 10 }}>
                  {estFragments ? (
                    <div className="flex items-center justify-center flex-wrap" style={{ gap: 14 }}>
                      <Devise devise={mod.devise} couleur="#6E5A3E" />
                      <SelecteurSemestre />
                    </div>
                  ) : (
                    <Devise devise={mod.devise} couleur="#6E5A3E" />
                  )}
                  {sousOngletsParParam ? (
                    <Suspense
                      fallback={
                        <SousOngletsListe
                          mod={mod}
                          compact={sousOngletsCompacts}
                          actif={(o) => o.vue === mod.sousOngletsProf[0]?.vue}
                        />
                      }
                    >
                      <SousOngletsParam mod={mod} compact={sousOngletsCompacts} />
                    </Suspense>
                  ) : (
                    <SousOngletsRoute mod={mod} pathname={pathname} compact={sousOngletsCompacts} />
                  )}
                </div>
              ) : (
                <div className="flex-1 min-w-0 flex justify-center">
                  <Devise devise={mod.devise} couleur="#6E5A3E" />
                </div>
              )}
              <span className="w-px self-stretch" style={FILET_STYLE} />
              <div className="flex flex-col items-center gap-[7px] flex-shrink-0">
                <SceauModule cle={mod.cle} size={64} />
                <span className="font-marque" style={{ fontWeight: 600, fontSize: 23, letterSpacing: '.05em', color: mod.couleurs.encre }}>
                  {mod.nomCourt ?? mod.nom}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative border-b border-[#E4DBC9]" style={{ background: '#F8F4EA' }}>
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{ height: 2, background: 'rgba(184,137,59,.32)' }}
          />
          <div className="max-w-[1040px] mx-auto flex items-center" style={{ padding: '14px 28px 16px' }}>
            <Marque href={dashHref} />
            <span className="w-px self-stretch" style={{ ...FILET_STYLE, marginLeft: 22 }} />
            <div className="flex-1 flex justify-center" style={{ padding: '0 22px' }}>
              <Devise devise={DEVISE_MAISON} couleur="#8A6F4E" maison />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
