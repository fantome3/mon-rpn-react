import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import { emailContents } from './templates/LabelsSentEmails'

export const sendPrelevementFailedEmail = async (
  email: string,
  type: 'membership' | 'balance',
  expectedAmount: number,
  currentBalance: number
) => {
  const subject =
    type === 'membership'
      ? emailContents.prelevementEchecCotisation.sujet
      : emailContents.prelevementEchecDeces.sujet

  const text =
    type === 'membership'
      ? emailContents.prelevementEchecCotisation.texte({
          amount: expectedAmount,
          current: currentBalance
        })
      : emailContents.prelevementEchecDeces.texte({
          amount: expectedAmount,
          current: currentBalance
        })

  const html = emailTemplate({ content: text })

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
