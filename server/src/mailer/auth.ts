import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import { emailContents } from './templates/LabelsSentEmails'

export const sendForgotPasswordEmail = async ({
  token,
  userId,
  email,
}: {
  token: string
  userId: string
  email: string
}) => {
  const subject = emailContents.motDePasseOublie.sujet
  const text = emailContents.motDePasseOublie.texte({
    userId,
    token
  })
  const html = emailTemplate({ content: `<p>${text}</p>` })

  try {
    await sendEmail({
      to: email,
      subject,
      text,
      html,
    })
    console.log(`📨 Mot de passe envoyé`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail`, error)
  }
}

export const sendNewUserNotification = async ({
  lastName,
  firstName,
  nativeCountry,
  email,
  residenceCountry,
  contactNumber,
  paymentMethod,
  balanceAmount,
}: {
  lastName: string
  firstName: string
  nativeCountry: string
  email: string
  residenceCountry: string
  contactNumber: string
  paymentMethod: string
  balanceAmount: number
}) => {
  const subject = emailContents.nouvelUtilisateur.sujet
  const text = emailContents.nouvelUtilisateur.texte({
    firstName,
    lastName,
    email,
    nativeCountry,
    residenceCountry,
    contactNumber,
    paymentMethod,
    accountBalance: balanceAmount
  })
  const html = emailTemplate({
    content: text.replace(/\n/g, '<br/>'),
  })
  
  try {
    await sendEmail({
      to: 'djokojires@gmail.com',
      subject,
      text,
      html,
    })
    console.log(`📨 info sur l'abonnée envoyé à jires djoko`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail`, error)
  }
}

export const sendPassword = async ({
  password,
  emailAddress,
}: {
  password: string
  emailAddress: string
}) => {
  const subject = emailContents.envoiMotDePasse.sujet
  const text = emailContents.envoiMotDePasse.texte({ password})
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
  try {
    await sendEmail({
      to: emailAddress,
      subject,
      text,
      html,
    })
    console.log(`📨 Mot de passe envoyé`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail`, error)
  }
}
