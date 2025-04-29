import { sendEmail } from './core'

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

L'équipe MON-RPN.
  `
  await sendEmail({ to: email, subject, text })
}

export const sendAccountDeactivatedEmail = async (email: string) => {
  const subject = '🚫 Votre compte a été désactivé'
  const text = `
Bonjour,

Votre compte a été désactivé faute de régularisation.

Contactez l'administration pour le réactiver.

L'équipe MON-RPN.
  `
  await sendEmail({ to: email, subject, text })
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
  L’équipe MON-RPN.
  `

  try {
    await sendEmail({ to: email, subject, text })
    console.log(`📨 Email de rappel envoyé à ${email}`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail de rappel`, error)
  }
}
