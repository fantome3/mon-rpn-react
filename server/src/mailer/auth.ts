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
  const subject = 'Nouvelle inscription sur ACQ-RPN'
  const text = `
  <h1 style="font-size: 18px; margin-top: 0;">Nouvel utilisateur inscrit</h1>
  <p style="line-height: 1.6;">Bonjour,</p>
  <p style="line-height: 1.6;">Un nouvel utilisateur vient de s'inscrire sur votre plateforme ACQ-RPN. Voici ses informations :</p>
  <ul style="line-height: 1.6; padding-left: 20px;">
    <li>Prénom(s) : ${firstName}</li>
    <li>Nom : ${lastName}</li>
    <li>Courriel : ${email}</li>
    <li>Pays d'origine : ${nativeCountry}</li>
    <li>Pays de résidence : ${residenceCountry}</li>
    <li>Numéro : ${tel}</li>
    <li>Méthode de paiement : ${paymentMethod}</li>
    <li>Solde de départ : ${solde} $</li>
  </ul>
  `
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
  const subject = 'ACQ-RPN - Mot de passe'
  const text = `
Votre inscription sur notre plateforme ACQ-RPN
      s'est déroulée avec succès.

      Voici le mot de passe actuel pour vous
      connectez à votre compte:
      <strong>${password}</strong>

      Vous pouvez modifier votre mot de passe à la
      page profile de votre plateforme ACQ-RPN à
      tout moment.

      Bienvenue chez vous,
      
      L'équipe ACQ-RPN.
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
