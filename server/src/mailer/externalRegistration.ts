import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import { emailContents } from './templates/LabelsSentEmails'

export const sendExternalRegistrationFailureEmail = async (
  memberEmail: string,
  error: string
) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'paiement.rpn@gmail.com'
  const subject = emailContents.inscriptionExterneEchec.sujet
  const text = emailContents.inscriptionExterneEchec.texte({
    member: memberEmail,
    detail: error
  })
  const html = emailTemplate({ content: text })

  try {
    await sendEmail({ to: adminEmail, subject, text, html })
    console.log(`📨 Notification d'échec envoyée à l'administrateur`)
  } catch (err) {
    console.error('❌ Erreur envoi mail administrateur', err)
  }
}
