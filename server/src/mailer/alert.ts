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

  const subject = emailsLabels.DEACTIVATION_WARNING_SUBJECT
  const text = StringExtension.format(
    emailsLabels.DEACTIVATION_WARNING_TEXT,
    reason,
    deactivationDate.toLocaleDateString()
  )
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
}

export const sendAccountDeactivatedEmail = async (email: string) => {
  const subject = emailsLabels.ACCOUNT_DEACTIVATED_SUBJECT
  const text = emailsLabels.ACCOUNT_DEACTIVATED_TEXT
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
}

export const sendLowerBanlanceAlertEmail = async (
  email: string,
  balance: number,
  required: number
) => {
  const subject = emailsLabels.LOWER_BALANCE_SUBJECT
  const text = StringExtension.format(
    emailsLabels.LOWER_BALANCE_TEXT,
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
