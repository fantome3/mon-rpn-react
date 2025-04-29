import { sendEmail } from './core'

export const sendMembershipReminderEmail = async (
  email: string,
  expectedAmount: number,
  currentBalance: number
) => {
  const subject = '❌ Échec de cotisation annuelle sur MON-RPN'
  const text = `
Bonjour,

Votre prélèvement de ${expectedAmount} CAD pour la cotisation annuelle a échoué.
Votre solde actuel est de ${currentBalance} CAD.

Veuillez renflouer votre compte pour régulariser votre situation.

Cordialement,  
L'équipe MON-RPN.
  `
  await sendEmail({ to: email, subject, text })
}

export const sendMembershipSuccessEmail = async (
  email: string,
  amountPaid: number,
  year: number
) => {
  const subject = '✅ Cotisation annuelle réglée avec succès'
  const text = `
Bonjour,

Votre cotisation annuelle pour ${year} a bien été réglée : ${amountPaid} CAD.

Merci pour votre engagement.

L'équipe MON-RPN.
  `
  await sendEmail({ to: email, subject, text })
}
