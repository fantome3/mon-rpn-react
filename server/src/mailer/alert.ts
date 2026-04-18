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

export const sendLowBalanceNotification = async (
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

export const sendRpnUnsubscriptionEmail = async (
  email: string,
  current: number,
  required: number
): Promise<void> => {
  const subject = emailContents.rpnDesinscription.sujet
  const text = emailContents.rpnDesinscription.texte({ current, required })
  const html = emailTemplate({ content: text })
  try {
    await sendEmail({ to: email, subject, text, html })
    console.log(`📭 Email de désinscription RPN envoyé à ${email}`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail désinscription RPN`, error)
  }
}

export const sendRpnReactivationEmail = async (
  email: string,
  current: number
): Promise<void> => {
  const subject = emailContents.rpnReactivation.sujet
  const text = emailContents.rpnReactivation.texte({ current })
  const html = emailTemplate({ content: text })
  try {
    await sendEmail({ to: email, subject, text, html })
    console.log(`✅ Email de réactivation RPN envoyé à ${email}`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail réactivation RPN`, error)
  }
}
