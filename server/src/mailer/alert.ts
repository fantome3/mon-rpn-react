import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import emailsLabels from '../common/emailsLibelles.json'
import StringExtension from '../common/stringExtension'

export const sendDeactivationWarningEmail = async (
  email: string,
  type: 'membership' | 'balance',
  deactivationDate: Date
) => {
  const reason =
    type === 'membership'
      ? 'le non-paiement de votre cotisation annuelle'
      : 'un solde insuffisant pour participer aux prélèvements décès'

  const subject = emailsLabels.alerteDesactivation.sujet
  const text = StringExtension.format(
    emailsLabels.alerteDesactivation.texte,
    reason,
    deactivationDate.toLocaleDateString()
  )
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
}

export const sendAccountDeactivatedEmail = async (email: string) => {
  const subject = emailsLabels.compteDesactive.sujet
  const text = emailsLabels.compteDesactive.texte
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
}

export const sendLowerBanlanceAlertEmail = async (
  email: string,
  balance: number,
  required: number
) => {
  const subject = emailsLabels.soldeInsuffisant.sujet
  const text = StringExtension.format(
    emailsLabels.soldeInsuffisant.texte,
    balance,
    required
  )

  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })

  try {
    await sendEmail({ to: email, subject, text, html })
    console.log(`📨 Email de rappel envoyé à ${email}`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail de rappel`, error)
  }
}
