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
      ? emailsLabels.prelevementEchecCotisation.sujet
      : emailsLabels.prelevementEchecDeces.sujet

  const text =
    type === 'membership'
      ? StringExtension.format(
          emailsLabels.prelevementEchecCotisation.texte,
          expectedAmount,
          currentBalance
        )
      : StringExtension.format(
          emailsLabels.prelevementEchecDeces.texte,
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
