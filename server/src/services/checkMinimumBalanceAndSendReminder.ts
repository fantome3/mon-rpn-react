import { sendLowerBanlanceAlertEmail } from '../../mailer'
import { AccountModel } from '../models/accountModel'
import { SettingsModel } from '../models/settingsModel'
import { UserModel } from '../models/userModel'

export const checkMinimumBalanceAndSendReminder = async () => {
  const settings = await SettingsModel.findOne()
  const MINIMUM_UNIT = settings?.minimumBalanceRPN || 50

  const users = await UserModel.find()
  for (const user of users) {
    const dependents =
      user.familyMembers?.filter((member) => {
        const age =
          new Date().getFullYear() - new Date(member.birthDate).getFullYear()
        return age >= 18
      }) || []

    const userAge =
      new Date().getFullYear() - new Date(user.origines.birthDate).getFullYear()
    const totalPersons = (userAge >= 18 ? 1 : 0) + dependents.length

    const account = await AccountModel.findOne({ userId: user._id })
    if (!account) continue

    const minRequired = totalPersons * MINIMUM_UNIT
    if (account.solde < minRequired) {
      await sendLowerBanlanceAlertEmail(
        user.register.email,
        account.solde,
        minRequired
      )
    }
  }
}

export const sendBalanceReminderIfNeeded = async (userId: string) => {
  const user = await UserModel.findById(userId)
  if (!user) return { status: 'NOT_FOUND' }

  const settings = await SettingsModel.findOne()
  const MIN_UNIT = settings?.minimumBalanceRPN || 10

  const currentYear = new Date().getFullYear()
  const dependents =
    user.familyMembers?.filter((member) => {
      const age = currentYear - new Date(member.birthDate).getFullYear()
      return age >= 18
    }) || []

  const userAge = currentYear - new Date(user.origines.birthDate).getFullYear()
  const totalPersons = (userAge >= 18 ? 1 : 0) + dependents.length
  const minimumRequired = totalPersons * MIN_UNIT

  const account = await AccountModel.findOne({ userId })
  if (!account) return { status: 'NO_ACCOUNT' }

  if (account.solde < minimumRequired) {
    await sendLowerBanlanceAlertEmail(
      user.register.email,
      account.solde,
      minimumRequired
    )

    return {
      status: 'REMINDER_SENT',
      required: minimumRequired,
      balance: account.solde,
    }
  } else {
    return {
      status: 'ENOUGH_BALANCE',
      balance: account.solde,
    }
  }
}
