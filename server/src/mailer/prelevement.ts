import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'

export const sendPrelevementFailedEmail = async (
  email: string,
  type: 'membership' | 'balance',
  expectedAmount: number,
  currentBalance: number
) => {
  const subject =
    type === 'membership'
      ? '❌ Échec de cotisation annuelle sur MON-RPN'
      : '❌ Échec de prélèvement décès sur MON-RPN'

  const text =
    type === 'membership'
      ? `
Bonjour,

Votre prélèvement pour la cotisation annuelle a échoué. Votre solde actuel est de ${currentBalance} CAD alors que le montant requis est de ${expectedAmount} CAD.

Merci de renflouer votre compte dès que possible pour régulariser votre situation.

Cordialement,  
L’équipe MON-RPN.
`
      : `
Bonjour,

Le prélèvement décès de ${expectedAmount} CAD n’a pas pu être effectué car votre solde est de ${currentBalance} CAD.

Merci de recharger votre solde afin de permettre la participation au fonds de solidarité communautaire.

Cordialement,  
L’équipe MON-RPN.
`

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
