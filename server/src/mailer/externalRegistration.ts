import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import emailsLabels from '../common/emailsLibelles.json'
import StringExtension from '../common/stringExtension'

export const sendExternalRegistrationFailureEmail = async (
  memberEmail: string,
  error: string
) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'paiement.rpn@gmail.com'
  const subject = emailsLabels.inscriptionExterneEchec.sujet
  const text = StringExtension.format(
    emailsLabels.inscriptionExterneEchec.texte,
    memberEmail,
    error
  )
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })

  try {
    await sendEmail({ to: adminEmail, subject, text, html })
    console.log(`📨 Notification d'échec envoyée à l'administrateur`)
  } catch (err) {
    console.error('❌ Erreur envoi mail administrateur', err)
  }
}
