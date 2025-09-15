import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import { emailContents } from './templates/LabelsSentEmails'

export const sendDeactivationWarningEmail = async (
  email: string,
  type: 'membership' | 'balance',
  deactivationDate: Date
) => {
  const reason =
    type === 'membership'
      ? 'le non-paiement de votre cotisation annuelle'
      : 'un solde insuffisant pour participer aux prélèvements décès'

  const subject = emailContents.alerteDesactivation.sujet
  const disactivationReasonText = emailContents.alerteDesactivation.texte({ raison : reason, dateLimite : deactivationDate.toLocaleDateString()})
  const html = emailTemplate({ content: disactivationReasonText })

  await sendEmail({ to: email, subject, text: disactivationReasonText, html })
}

export const sendAccountDeactivatedEmail = async (email: string) => {
  const subject = emailContents.compteDesactive.sujet
  const accountDeactivationMessage = emailContents.compteDesactive.texte()
  const html = emailTemplate({ content: accountDeactivationMessage })

  await sendEmail({ to: email, subject, text: accountDeactivationMessage, html })
}

export const sendLowerBanlanceAlertEmail = async (
  email: string,
  balance: number,
  required: number
) => {
  const subject = emailContents.soldeInsuffisant.sujet
  const hmtlBody = emailContents.soldeInsuffisant.texte({ current: balance, minimumRequiredBalance: required})
  const html = emailTemplate({ content: hmtlBody })

  try {
    await sendEmail({ to: email, subject, text: hmtlBody, html })
    console.log(`📨 Email de rappel envoyé à ${email}`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail de rappel`, error)
  }
}
