import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import emailsLabels from '../common/emailsLibelles.json'
import StringExtension from '../common/stringExtension'

export const sendForgotPasswordEmail = async ({
  token,
  userId,
  email,
}: {
  token: string
  userId: string
  email: string
}) => {
  const subject = emailsLabels.FORGOT_PASSWORD_SUBJECT
  const text = StringExtension.format(
    emailsLabels.FORGOT_PASSWORD_TEXT,
    userId,
    token
  )
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
  tel,
  paymentMethod,
  solde,
}: {
  lastName: string
  firstName: string
  nativeCountry: string
  email: string
  residenceCountry: string
  tel: string
  paymentMethod: string
  solde: number
}) => {
  const subject = emailsLabels.NEW_USER_SUBJECT
  const text = StringExtension.format(
    emailsLabels.NEW_USER_TEXT,
    firstName,
    lastName,
    email,
    nativeCountry,
    residenceCountry,
    tel,
    paymentMethod,
    solde.toString()
  )
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
  email,
}: {
  password: string
  email: string
}) => {
  const subject = emailsLabels.PASSWORD_SUBJECT
  const text = StringExtension.format(emailsLabels.PASSWORD_TEXT, password)
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })
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
