import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'

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
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
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
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
}
