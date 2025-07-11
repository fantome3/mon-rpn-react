import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'

export const sendMembershipReminderEmail = async (
  email: string,
  expectedAmount: number,
  currentBalance: number
) => {
  const subject = '❌ Échec de cotisation annuelle sur ACQ-RPN'
  const text = `
Bonjour,

Votre prélèvement de ${expectedAmount} CAD pour la cotisation annuelle a échoué.
Votre solde actuel est de ${currentBalance} CAD.

Veuillez renflouer votre compte pour régulariser votre situation.

Cordialement,
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
<p>Bonjour,</p>

<p>Votre cotisation annuelle pour ${year} a bien été réglée : ${amountPaid} CAD.</p>

<p>Merci pour votre engagement.</p>

<p>Cordialement,</p>
  `
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
}
