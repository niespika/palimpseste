import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { chargerHistoriqueEleve } from '@/utils/integrite-historique'
import HistoriqueEleve from '@/components/integrite/HistoriqueEleve'

// Page « Intégrité » côté élève : il y consulte SES avis retenus (avec
// l'explication) et la chronologie de ses mises en pause / déblocages. Lecture
// seule, avis CONFIRMÉS uniquement (cf. chargerHistoriqueEleve).
export default async function EleveIntegritePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const vue = await chargerHistoriqueEleve(admin, user.id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-titre text-2xl text-encre leading-tight">Intégrité</h2>
        <p className="font-ui text-sm text-muet mt-0.5">
          Le suivi de tes rendus pris au sérieux — et l’explication des avis qui te concernent.
        </p>
      </div>

      <HistoriqueEleve
        bloque={vue.bloque}
        strikes={vue.strikes}
        seuil={vue.seuil}
        message={vue.message}
        avis={vue.avis}
        evenements={vue.evenements}
      />
    </div>
  )
}
