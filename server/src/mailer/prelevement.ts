import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import { emailContents } from './templates/LabelsSentEmails'

export const sendPrelevementFailedMembershipEmail = async (
  email: string,
  expectedAmount: number,
  currentBalance: number
) => {
  const subject = emailContents.prelevementEchecCotisation.sujet

  const text = emailContents.prelevementEchecCotisation.texte({
    amount: expectedAmount,
    current: currentBalance,
  })

  return sendPrelevementEmail({ email, subject, text })
}

export const sendPrelevementFailedDecesEmail = async (
  email: string,
  expectedAmount: number,
  currentBalance: number
) => {
  const subject = emailContents.prelevementEchecDeces.sujet

  const text = emailContents.prelevementEchecDeces.texte({
    amount: expectedAmount,
    current: currentBalance,
  })

  return sendPrelevementEmail({ email, subject, text })
}

// Fonction interne réutilisable
const sendPrelevementEmail = async ({
  email,
  subject,
  text,
}: {
  email: string
  subject: string
  text: string
}) => {
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