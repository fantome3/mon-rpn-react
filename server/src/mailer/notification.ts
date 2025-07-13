import { UserModel } from '../models/userModel'
import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import emailsLabels from '../common/emailsLibelles.json'
import StringExtension from '../common/stringExtension'

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
  const subject = StringExtension.format(
    emailsLabels.notificationDeces.sujet,
    firstName
  )
  const text = StringExtension.format(
    emailsLabels.notificationDeces.texte,
    firstName,
    deathPlace,
    deathDate.toLocaleDateString()
  )
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
