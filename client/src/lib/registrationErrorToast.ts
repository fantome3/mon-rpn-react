import type { AxiosErrorToastOverrideResolver } from './utils'

const registrationConflictCodes = {
  emailAlreadyUsed: 'EMAIL_ALREADY_USED',
} as const

const emailAlreadyUsedMessages = new Set([
  'Courriel déjà utilisé',
  "L'email existe déjà",
])

const forgotPasswordDescription =
  'Si vous avez oublié votre mot de passe allez dans connexion dans la section mot de passe oublié.'

export const resolveRegistrationErrorToast: AxiosErrorToastOverrideResolver = (
  details
) => {
  const isEmailAlreadyUsedError =
    details.code === registrationConflictCodes.emailAlreadyUsed ||
    emailAlreadyUsedMessages.has(details.message)

  if (!isEmailAlreadyUsedError) {
    return null
  }

  return {
    title: details.message,
    description: forgotPasswordDescription,
  }
}
