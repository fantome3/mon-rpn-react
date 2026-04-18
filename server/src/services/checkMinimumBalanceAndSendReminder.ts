import {
  sendLowBalanceNotification,
} from '../mailer'
import { AccountModel } from '../models/accountModel'
import { SettingsModel } from '../models/settingsModel'
import { UserModel } from '../models/userModel'
import { calculateTotalPersons } from '../utils'
import { onRpnBalanceInsufficient } from './rpnLifecycleService'

export const checkMinimumBalanceAndSendReminder = async () => {
  const settings = await SettingsModel.findOne()
  const MINIMUM_UNIT = settings?.minimumBalanceRPN || 50

  const users = await UserModel.find({ deletedAt: { $exists: false } })
  for (const user of users) {

    const account = await AccountModel.findOne({ userId: user._id })
    if (!account) continue

    const totalPersons = calculateTotalPersons(user)
    const minRequired = totalPersons * MINIMUM_UNIT
    const rpnBalance = account.rpn_balance ?? 0
    
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
  const MIN_UNIT = settings?.minimumBalanceRPN || 5
  const MAX_MISSED = settings?.maxMissedReminders || 3

  const totalPersons = calculateTotalPersons(user)
  const minimumRequired = totalPersons * MIN_UNIT

  const account = await AccountModel.findOne({ userId })
  if (!account) return { status: 'NO_ACCOUNT' }
  const rpnBalance = account.rpn_balance ?? 0

  if (rpnBalance < minimumRequired) {
    await onRpnBalanceInsufficient({
      user,
      balance: rpnBalance,
      totalToDeduct: minimumRequired,
      maxMissed: MAX_MISSED,
      totalPersons,
    })
/* désaactivé courriel rpn pour éviter les spams, à réactiver si on veut remettre les rappels
    await sendLowBalanceNotification(
      user.register.email,
      rpnBalance,
      minimumRequired
    )*/

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
