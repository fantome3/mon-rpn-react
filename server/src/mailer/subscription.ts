import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import { emailContents } from './templates/LabelsSentEmails'

export const sendMembershipReminderEmail = async (
  email: string,
  expectedAmount: number,
  currentBalance: number
) => {
  const subject = emailContents.rappelCotisation.sujet
  const text = emailContents.rappelCotisation.texte({
    minimumRequiredBalance: expectedAmount,
    current: currentBalance
  })
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
}

export const sendMembershipSuccessEmail = async (
  email: string,
  amountPaid: number,
  year: number
) => {
  const subject = emailContents.cotisationReussie.sujet({ year: year.toString() })
  const text = emailContents.cotisationReussie.texte({
    amount: amountPaid,
    year: year.toString()
  })
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
}
