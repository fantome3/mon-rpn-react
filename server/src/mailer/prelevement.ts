import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import emailsLabels from '../common/emailsLibelles.json'
import StringExtension from '../common/stringExtension'

export const sendPrelevementFailedEmail = async (
  email: string,
  type: 'membership' | 'balance',
  expectedAmount: number,
  currentBalance: number
) => {
  const subject =
    type === 'membership'
      ? emailsLabels.PRELEVEMENT_FAILED_SUBJECT_MEMBERSHIP
      : emailsLabels.PRELEVEMENT_FAILED_SUBJECT_BALANCE

  const text =
    type === 'membership'
      ? StringExtension.format(
          emailsLabels.PRELEVEMENT_FAILED_TEXT_MEMBERSHIP,
          expectedAmount,
          currentBalance
        )
      : StringExtension.format(
          emailsLabels.PRELEVEMENT_FAILED_TEXT_BALANCE,
          expectedAmount,
          currentBalance
        )

  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })

  try {
    await sendEmail({
      to: email,
      subject,
      text,
      html,
    })
    console.log(`📨 Email d’échec de prélèvement envoyé à ${email}`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail d’échec de prélèvement`, error)
  }
}
