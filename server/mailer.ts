import nodemailer from 'nodemailer'
import { UserModel } from './src/models/userModel'

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text?: string
  html?: string
}) => {
  const transporter = nodemailer.createTransport({
    service: process.env.NODEMAILER_SERVICE || 'gmail',
    host: process.env.NODEMAILER_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.NODEMAILER_AUTH_USER || 'paiement.rpn@gmail.com',
      pass: process.env.NODEMAILER_AUTH_PASS || 'jgmw puwg usqi mcxk',
    },
  })

  const mailOptions = {
    from: `"MON-RPN" <${process.env.NODEMAILER_AUTH_USER} || 'paiement.rpn@gmail.com'>`,
    to,
    subject,
    text,
    html: html || `<p>${text}</p>`,
  }

  return await transporter.sendMail(mailOptions)
}

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

  try {
    await sendEmail({
      to: email,
      subject,
      text,
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
  try {
    await sendEmail({
      to: 'djokojires@gmail.com',
      subject,
      text,
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
  try {
    await sendEmail({
      to: email,
      subject,
      text,
    })

    console.log(`📨 Mot de passe envoyé`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail`, error)
  }
}

export const notifyAllUsers = async ({
  firstName,
  deathPlace,
  deathDate,
}: {
  firstName: string
  deathPlace: string
  deathDate: Date
}) => {
  const users = await UserModel.find({ primaryMember: true })
  const subject = `🕊 Décès annoncé : ${firstName}`
  const text = `Nous vous informons du décès de ${firstName}, survenu à ${deathPlace} le ${deathDate.toLocaleDateString()}.
Veuillez consulter la plateforme MON-RPN pour plus d'informations.`

  for (const user of users) {
    try {
      await sendEmail({
        to: user.register.email,
        subject,
        text,
      })
      console.log(`📨 Notification envoyée à ${user.register.email}`)
    } catch (error) {
      console.error(`❌ Erreur envoi mail à ${user.register.email}`, error)
    }
  }
}

export const sendMembershipReminderEmail = async (
  email: string,
  expectedAmount: number,
  currentBalance: number
) => {
  const subject = 'Cotisation annuelle sur MONRPN'
  const text = `
  Cher utilisateur, votre prélèvement pour la côtisation annuelle à échoué. Votre solde actuelle est de ${currentBalance} CAD et est insuffisante pour régler votre côtisation qui est de ${expectedAmount} CAD.

  Veuillez renflouer votre compte afin que le prélèvement soit effectué.

  Cordialement
  `

  try {
    await sendEmail({
      to: email,
      subject,
      text,
    })
    console.log(`📨 Email de rappel envoyé`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail`, error)
  }
}

export const sendMembershipSuccessEmail = async (
  email: string,
  amountPaid: number,
  year: number
) => {
  const subject = '✅ Cotisation annuelle réglée avec succès'
  const text = `
  Bonjour,

  Nous vous informons que votre cotisation annuelle pour l'année ${year} a été réglée avec succès. Le montant de ${amountPaid} CAD a été prélevé de votre compte MON-RPN.

  Merci pour votre contribution. Votre statut de membre actif est désormais maintenu pour l'année ${year}.

  Vous pouvez consulter vos transactions sur la plateforme MON-RPN à tout moment.

  Bien cordialement,
  L'équipe MON-RPN.
  `

  try {
    await sendEmail({
      to: email,
      subject,
      text,
    })
    console.log(`📨 Email de confirmation envoyé à ${email}`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail de confirmation`, error)
  }
}

export const sendLowerBanlanceAlertEmail = async (
  email: string,
  balance: number,
  required: number
) => {
  const subject = '🚨 Solde insuffisant pour les prélèvements RPN'
  const text = `
  Bonjour,

  Votre solde actuel est de ${balance} CAD, alors que le minimum requis pour les prélèvements RPN est de ${required} CAD.

  Veuillez renflouer votre compte pour continuer à bénéficier du service.

  Cordialement,
  L’équipe MON-RPN.
  `

  try {
    await sendEmail({ to: email, subject, text })
    console.log(`📨 Email de rappel envoyé à ${email}`)
  } catch (error) {
    console.error(`❌ Erreur envoi mail de rappel`, error)
  }
}
