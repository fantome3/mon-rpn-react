import {
  sendDeactivationWarningEmail,
  sendPrelevementFailedEmail,
} from '../mailer'
import { TransactionModel } from '../models/transactionModel'
import { User } from '../models/userModel'
import { DocumentType } from '@typegoose/typegoose'

export const handleFailedPrelevement = async ({
  user,
  type,
  totalToDeduct,
  solde,
  maxMissed,
  totalPersons,
}: {
  user: DocumentType<User>
  type: 'membership' | 'balance'
  totalToDeduct: number
  solde: number
  maxMissed: number
  totalPersons: number
}) => {
  // Transaction échouée
  await TransactionModel.create({
    userId: user._id,
    amount: totalToDeduct,
    reason:
      type === 'membership'
        ? 'Cotisation annuelle'
        : `Prélèvement décès pour ${totalPersons} personnes`,
    type: 'debit',
    status: 'failed',
  })

  //Compteur de rappels
  user.subscription.missedRemindersCount =
    (user.subscription.missedRemindersCount || 0) + 1

  //Préavis si max atteint
  if (
    user.subscription.missedRemindersCount === maxMissed &&
    !user.subscription.scheduledDeactivationDate
  ) {
    const deactivationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    user.subscription.scheduledDeactivationDate = deactivationDate
    await sendDeactivationWarningEmail(
      user.register.email,
      type,
      deactivationDate
    )
  }

  await user.save()

  //Email spécifique
  if (type === 'membership') {
    await sendPrelevementFailedEmail(
      user.register.email,
      'membership',
      totalToDeduct,
      solde
    )
  } else {
    await sendPrelevementFailedEmail(
      user.register.email,
      'balance',
      totalToDeduct,
      solde
    )
  }
}
