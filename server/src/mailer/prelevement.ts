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
      ? '❌ Échec de cotisation annuelle sur ACQ-RPN'
      : '❌ Échec de prélèvement décès sur ACQ-RPN'

  const text =
    type === 'membership'
      ? `
<p>Bonjour,</p>

<p>Votre prélèvement pour la cotisation annuelle a échoué.</p>
<p>Votre solde actuel est de ${currentBalance} CAD alors que le montant requis est de ${expectedAmount} CAD.</p>

<p>Merci de renflouer votre compte dès que possible pour régulariser votre situation.</p>

<p>Cordialement,</p>
`
      : `
<p>Bonjour,</p>

<p>Le prélèvement décès de ${expectedAmount} CAD n’a pas pu être effectué car votre solde est de ${currentBalance} CAD.</p>

<p>Merci de recharger votre solde afin de permettre la participation au fonds de solidarité communautaire.</p>

<p>Cordialement,</p>
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
