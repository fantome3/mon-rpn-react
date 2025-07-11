import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'

export const sendDeactivationWarningEmail = async (
  email: string,
  type: 'membership' | 'balance',
  deactivationDate: Date
) => {
  const reason =
    type === 'membership'
      ? 'le non-paiement de votre cotisation annuelle'
      : 'un solde insuffisant pour participer aux prélèvements décès'

  const subject = '⚠️ Risque de désactivation de votre compte'
  const text = `
Bonjour,

Suite à ${reason}, votre compte pourrait être désactivé le ${deactivationDate.toLocaleDateString()}.

Merci de régulariser votre situation.

L'équipe ACQ-RPN.
  `
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
}

export const sendAccountDeactivatedEmail = async (email: string) => {
  const subject = '🚫 Votre compte a été désactivé'
  const text = `
    <h2>Compte désactivé</h2>
    <p>Bonjour,</p>

    <p>Votre compte a été désactivé faute de régularisation.</p>

    <p>Contactez l'administration pour le réactiver.</p>

    <p>Cordialement,</p>
    <p>L'équipe ACQ-RPN.</p>
  `
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
}

export const sendLowerBanlanceAlertEmail = async (
  email: string,
  balance: number,
  required: number
) => {
  const subject = '🚨 Solde insuffisant pour les prélèvements RPN'
  const text = `
  Bonjour,

  Votre solde actuel est de ${balance} CAD, alors que le minimum requis pour les prélèvements RPN est de ${required} CAD.

  Veuillez renflouer votre compte pour continuer à bénéficier du service.

  Cordialement,
  L’équipe ACQ-RPN.
  `

  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })

  try {
    await sendEmail({ to: email, subject, text, html })
    console.log(`📨 Email de rappel envoyé à ${email}`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail de rappel`, error)
  }
}
