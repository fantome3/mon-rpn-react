import { UserModel } from '../models/userModel'
import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import { emailContents } from './templates/LabelsSentEmails'

export const notifyAllUsers = async ({
  firstName,
  deathPlace,
  deathDate,
}: {
  firstName: string
  deathPlace: string
  deathDate: Date
}) => {
  const users = await UserModel.find({
    primaryMember: true,
    deletedAt: { $exists: false },
  })
  const subject = emailContents.notificationDeces.sujet({ name: firstName })
  const text = emailContents.notificationDeces.texte({
    name: firstName,
    place: deathPlace,
    date: deathDate.toLocaleDateString()
  })
  const html = emailTemplate({ content: text })

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
