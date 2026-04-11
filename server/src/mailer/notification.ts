import { UserModel } from '../models/userModel'
import { sendEmail } from './core'
import { emailTemplate } from './templates/emailTemplate'
import { emailContents } from './templates/LabelsSentEmails'

type DeathAnnouncementRecipient = {
  register?: {
    email?: string
  }
}

type DeathAnnouncementNotificationInput = {
  firstName: string
  deathPlace: string
  deathDate: Date
}

type DeathAnnouncementNotificationPayload = {
  subject: string
  text: string
  html: string
}

const MAX_EMAIL_CONCURRENCY = 10

const runWithConcurrency = async <T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
) => {
  if (items.length === 0) return
  const concurrency = Math.max(1, Math.min(limit, items.length))
  let index = 0

  const runners = Array.from({ length: concurrency }, async () => {
    while (true) {
      const current = index
      index += 1
      if (current >= items.length) return
      await worker(items[current])
    }
  })

  await Promise.all(runners)
}

const buildDeathAnnouncementNotificationPayload = ({
  firstName,
  deathPlace,
  deathDate,
}: DeathAnnouncementNotificationInput): DeathAnnouncementNotificationPayload => {
  const subject = emailContents.notificationDeces.sujet({ name: firstName })
  const text = emailContents.notificationDeces.texte({
    name: firstName,
    place: deathPlace,
    date: deathDate.toLocaleDateString(),
  })
  const html = emailTemplate({ content: text })
  return { subject, text, html }
}

const sendDeathAnnouncementNotificationsToUsers = async (
  users: DeathAnnouncementRecipient[],
  payload: DeathAnnouncementNotificationPayload
) => {
  const recipients = users
    .map((user) => user.register?.email)
    .filter((email): email is string => Boolean(email))

  await runWithConcurrency(recipients, MAX_EMAIL_CONCURRENCY, async (email) => {
    try {
      await sendEmail({
        to: email,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      })
      console.log(`📨 Notification envoyée à ${email}`)
    } catch (error) {
      console.error(`❌ Erreur envoi mail à ${email}`, error)
    }
  })
}

export const notifyUsersForDeathAnnouncement = async ({
  users,
  firstName,
  deathPlace,
  deathDate,
}: DeathAnnouncementNotificationInput & {
  users: DeathAnnouncementRecipient[]
}) => {
  const payload = buildDeathAnnouncementNotificationPayload({
    firstName,
    deathPlace,
    deathDate,
  })
  await sendDeathAnnouncementNotificationsToUsers(users, payload)
}

export const notifyAllUsers = async ({
  firstName,
  deathPlace,
  deathDate,
}: DeathAnnouncementNotificationInput) => {
  const users = await UserModel.find({
    primaryMember: true,
    deletedAt: { $exists: false },
  }).lean()

  await notifyUsersForDeathAnnouncement({
    users,
    firstName,
    deathPlace,
    deathDate,
  })
}
