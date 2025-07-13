import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import emailsLabels from '../common/emailsLibelles.json'
import StringExtension from '../common/stringExtension'

export const sendMembershipReminderEmail = async (
  email: string,
  expectedAmount: number,
  currentBalance: number
) => {
  const subject = emailsLabels.MEMBERSHIP_REMINDER_SUBJECT
  const text = StringExtension.format(
    emailsLabels.MEMBERSHIP_REMINDER_TEXT,
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
  const subject = emailsLabels.MEMBERSHIP_SUCCESS_SUBJECT
  const text = StringExtension.format(
    emailsLabels.MEMBERSHIP_SUCCESS_TEXT,
    amountPaid,
    year
  )
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  await sendEmail({ to: email, subject, text, html })
}
