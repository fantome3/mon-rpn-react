import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'

export const sendForgotPasswordEmail = async ({
  token,
  userId,
  email,
}: {
  token: string
  userId: string
  email: string
}) => {
  const subject = 'Réinitialisation de votre mot de passe'
  const text = `Cliquez sur le lien suivant pour réinitialiser votre mot de passe: http://localhost:5173/reset-password/${userId}/${token}`
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
  const subject = 'Nouvelle inscription sur MON-RPN'
  const text = `
  Un nouvel utilisateur vient de s'inscrire sur votre plateforme MON-RPN. Voici ses informations:
        Nom et Prénoms: ${lastName} ${firstName},
        Courriel: ${email},
        Pays d'origine: ${nativeCountry},
        Pays de résidence: ${residenceCountry},
        Numéro: ${tel},
        Méthode de paiement: ${paymentMethod},
        Solde: ${solde} $
  `
  const html = emailTemplate({
    content: `<p>Un nouvel utilisateur vient de s'inscrire sur votre plateforme MON-RPN. Voici ses informations:</p><ul><li>Nom et Prénoms: ${lastName} ${firstName}</li><li>Courriel: ${email}</li><li>Pays d'origine: ${nativeCountry}</li><li>Pays de résidence: ${residenceCountry}</li><li>Numéro: ${tel}</li><li>Méthode de paiement: ${paymentMethod}</li><li>Solde: ${solde} $</li></ul>`,
  })
  try {
    await sendEmail({
      to: 'djokojires@gmail.com',
      subject,
      text,
      html,
    })
    console.log(`📨 Mot de passe envoyé`)
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
  const subject = 'MON-RPN - Mot de passe'
  const text = `
Votre inscription sur notre plateforme MON-RPN
      s'est déroulée avec succès.

      Voici le mot de passe actuel pour vous
      connectez à votre compte:
      ${password}

      Vous pouvez modifier votre mot de passe à la
      page profile de votre plateforme MON-RPN à
      tout moment.

      Bienvenue chez vous,
      
      L'équipe MON-RPN.
`
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
