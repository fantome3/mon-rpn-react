import { UserModel } from '../models/userModel'
import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'

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
  const html = emailTemplate({ content: text.replace(/\n/g, '<br/>') })

  for (const user of users) {
    try {
      await sendEmail({
        to: user.register.email,
        subject,
        text,
        html,
      })
      console.log(`📨 Notification envoyée à ${user.register.email}`)
    } catch (error) {
      console.error(`❌ Erreur envoi mail à ${user.register.email}`, error)
    }
  }
}
