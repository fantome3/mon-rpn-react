import { sendEmail } from './core'

export const sendExternalRegistrationFailureEmail = async (
  memberEmail: string,
  error: string
) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const subject = 'Erreur inscription plateforme externe'
  const text = `L\'inscription du membre ${memberEmail} sur l\'application externe a échoué.\nDétail: ${error}`

  try {
    await sendEmail({ to: adminEmail, subject, text })
    console.log(`📨 Notification d'échec envoyée à l'administrateur`)
  } catch (err) {
    console.error('❌ Erreur envoi mail administrateur', err)
  }
}
