import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'

export const sendExternalRegistrationFailureEmail = async (
  memberEmail: string,
  error: string
) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'paiement.rpn@gmail.com'
  const subject = 'Erreur inscription plateforme externe'
  const text = `L\'inscription du membre ${memberEmail} sur l\'application externe a échoué.\nDétail: ${error}`
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })

  try {
    await sendEmail({ to: adminEmail, subject, text, html })
    console.log(`📨 Notification d'échec envoyée à l'administrateur`)
  } catch (err) {
    console.error('❌ Erreur envoi mail administrateur', err)
  }
}
