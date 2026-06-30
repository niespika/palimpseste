import { Resend } from 'resend'

// Expéditeur : par défaut l'adresse de test Resend (n'envoie qu'à l'adresse du
// compte Resend). Renseigner RESEND_FROM avec un domaine vérifié pour la prod.
const FROM = process.env.RESEND_FROM || 'Palimpseste <onboarding@resend.dev>'

// Gabarit sobre à la charte (parchemin/encre), en HTML inliné pour les clients mail.
function gabaritInvitation(displayName: string, lien: string): string {
  const bonjour = displayName ? `Bonjour ${displayName},` : 'Bonjour,'
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f3ece0;padding:24px;font-family:Georgia,'Times New Roman',serif;color:#2b2520;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#fbf7ef;border:1px solid #e2d8c6;border-radius:14px;">
    <tr><td style="padding:28px 32px;">
      <p style="font-family:Georgia,serif;letter-spacing:0.12em;text-transform:uppercase;font-size:13px;color:#7a6f5d;margin:0 0 18px;">Palimpseste</p>
      <p style="font-size:17px;margin:0 0 12px;">${bonjour}</p>
      <p style="font-size:15px;line-height:1.55;margin:0 0 22px;color:#4a4036;">
        Ton compte a été créé. Pour finaliser ton inscription, choisis ton mot de passe en cliquant ci-dessous.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${lien}" style="display:inline-block;background:#5b4636;color:#fbf7ef;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;padding:12px 22px;border-radius:9px;">Finaliser mon inscription</a>
      </p>
      <p style="font-size:13px;line-height:1.5;color:#7a6f5d;margin:0;">
        Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br>
        <span style="word-break:break-all;color:#5b4636;">${lien}</span>
      </p>
    </td></tr>
  </table>
</body></html>`
}

// Envoie l'invitation. Lève en cas d'échec (compte créé mais email KO → l'appelant
// peut proposer un renvoi).
export async function envoyerInvitationEleve({
  email,
  displayName,
  lien,
}: {
  email: string
  displayName: string
  lien: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY manquante')
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Finalise ton inscription à Palimpseste',
    html: gabaritInvitation(displayName, lien),
  })
  if (error) throw new Error(error.message)
}
