import {
  sendLowBalanceNotification,
} from '../mailer'
import { AccountModel } from '../models/accountModel'
import { SettingsModel } from '../models/settingsModel'
import { UserModel } from '../models/userModel'
import { calculateTotalPersons } from '../utils'
import { handleFailedPrelevement } from './subscriptionService'

export const checkMinimumBalanceAndSendReminder = async () => {
  const settings = await SettingsModel.findOne()
  const MINIMUM_UNIT = settings?.minimumBalanceRPN || 50

  const users = await UserModel.find({ deletedAt: { $exists: false } })
  for (const user of users) {
    const totalPersons = calculateTotalPersons(user)

    const account = await AccountModel.findOne({ userId: user._id })
    if (!account) continue

    const minRequired = totalPersons * MINIMUM_UNIT
    const rpnBalance =
      typeof account.rpn_balance === 'number'
        ? account.rpn_balance
        : account.solde

    if (rpnBalance < minRequired) {
      await sendLowBalanceNotification(
        user.register.email,
        rpnBalance,
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
  const MAX_MISSED = settings?.maxMissedReminders || 3

  const totalPersons = calculateTotalPersons(user)
  const minimumRequired = totalPersons * MIN_UNIT

  const account = await AccountModel.findOne({ userId })
  if (!account) return { status: 'NO_ACCOUNT' }
  const rpnBalance =
    typeof account.rpn_balance === 'number' ? account.rpn_balance : account.solde

  if (rpnBalance < minimumRequired) {
    await handleFailedPrelevement({
      user,
      type: 'balance',
      totalToDeduct: minimumRequired,
      solde: rpnBalance,
      maxMissed: MAX_MISSED,
      totalPersons,
    })

    await sendLowBalanceNotification(
      user.register.email,
      rpnBalance,
      minimumRequired
    )

    return {
      status: 'REMINDER_SENT',
      required: minimumRequired,
      balance: rpnBalance,
    }
  } else {
    return {
      status: 'ENOUGH_BALANCE',
      balance: rpnBalance,
    }
  }
}
