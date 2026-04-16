import {
  sendDeactivationWarningEmail,
  sendPrelevementFailedMembershipEmail,
} from '../mailer'
import { TransactionModel } from '../models/transactionModel'
import { User } from '../models/userModel'
import { DocumentType } from '@typegoose/typegoose'

export const handleFailedPrelevement = async ({
  user,
  totalToDeduct,
  solde,
}: {
  user: DocumentType<User>
  totalToDeduct: number
  solde: number
}) => {
  user.subscription.missedRemindersCount =
    (user.subscription.missedRemindersCount || 0) + 1;
  
  if (user.subscription.missedRemindersCount == 1) {
    await TransactionModel.create({
      userId: user._id,
      amount: totalToDeduct,
      fundType: 'membership',
      reason: 'Cotisation annuelle',
      type: 'debit',
      status: 'failed',
    })

    const deactivationDate = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
    user.subscription.scheduledDeactivationDate = deactivationDate
    await sendDeactivationWarningEmail(user.register.email, "membership", deactivationDate)
  }

  await user.save()

  await sendPrelevementFailedMembershipEmail(user.register.email, totalToDeduct, solde)
}
