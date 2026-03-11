import labels from '../common/libelles.json'
import { UserModel } from '../models/userModel'

export const registrationConflictCodes = {
  emailAlreadyUsed: 'EMAIL_ALREADY_USED',
  accountAlreadyExistsWithOtherEmail:
    'ACCOUNT_ALREADY_EXISTS_WITH_OTHER_EMAIL',
} as const

export type RegistrationConflictCode =
  (typeof registrationConflictCodes)[keyof typeof registrationConflictCodes]

export type RegistrationConflict = {
  code: RegistrationConflictCode
  message: string
}

type RegistrationIdentity = {
  email: string
  lastName?: string
  phone?: string
}

type RegistrationIdentityWithNameAndPhone = RegistrationIdentity & {
  lastName: string
  phone: string
}

type MongoDuplicateKeyError = {
  code?: number
  keyPattern?: Record<string, number>
}

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const hasNameAndPhone = (
  identity: RegistrationIdentity
): identity is RegistrationIdentityWithNameAndPhone =>
  Boolean(identity.lastName && identity.phone)

const createConflict = (code: RegistrationConflictCode): RegistrationConflict => {
  if (code === registrationConflictCodes.emailAlreadyUsed) {
    return {
      code,
      message: labels.general.emailExiste,
    }
  }

  return {
    code,
    message: labels.general.compteAssocieAutreEmail,
  }
}

const findUserByEmail = async (email: string) =>
  UserModel.findOne({ 'register.email': email }).select('_id').lean()

const findUserByNameAndPhone = async ({
  email,
  lastName,
  phone,
}: RegistrationIdentityWithNameAndPhone) =>
  UserModel.findOne({
    'origines.lastName': new RegExp(`^${escapeRegex(lastName)}$`, 'i'),
    'infos.tel': phone,
    'register.email': { $ne: email },
  })
    .select('_id')
    .lean()

const isDuplicateEmailError = (error: unknown): error is MongoDuplicateKeyError => {
  if (!error || typeof error !== 'object') return false

  const mongoError = error as MongoDuplicateKeyError

  return (
    mongoError.code === 11000 &&
    Boolean(mongoError.keyPattern?.['register.email'])
  )
}

export const findRegistrationConflict = async (
  identity: RegistrationIdentity
): Promise<RegistrationConflict | null> => {
  const existingUserByEmail = await findUserByEmail(identity.email)
  
  if (existingUserByEmail) {
    return createConflict(registrationConflictCodes.emailAlreadyUsed)
  }

  if (!hasNameAndPhone(identity)) {
    return null
  }

  const existingUserByNameAndPhone = await findUserByNameAndPhone(identity)
  if (existingUserByNameAndPhone) {
    return createConflict(
      registrationConflictCodes.accountAlreadyExistsWithOtherEmail
    )
  }

  return null
}

export const mapRegistrationPersistenceErrorToConflict = (
  error: unknown
): RegistrationConflict | null => {
  if (isDuplicateEmailError(error)) {
    return createConflict(registrationConflictCodes.emailAlreadyUsed)
  }

  return null
}
