import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import emailsLabels from '../common/emailsLibelles.json'
import StringExtension from '../common/stringExtension'

export const sendMembershipReminderEmail = async (
  email: string,
  expectedAmount: number,
  currentBalance: number
) => {
  const subject = emailsLabels.rappelCotisation.sujet
  const text = StringExtension.format(
    emailsLabels.rappelCotisation.texte,
    expectedAmount,
    currentBalance
  )
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
}

export const sendMembershipSuccessEmail = async (
  email: string,
  amountPaid: number,
  year: number
) => {
  const subject = emailsLabels.cotisationReussie.sujet
  const text = StringExtension.format(
    emailsLabels.cotisationReussie.texte,
    amountPaid,
    year
  )
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
}
