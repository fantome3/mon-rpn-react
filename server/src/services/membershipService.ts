import { UserModel } from '../models/userModel'
import { TransactionModel } from '../models/transactionModel'
import { AccountModel } from '../models/accountModel'
import { SettingsModel } from '../models/settingsModel'
import {
  sendMembershipReminderEmail,
  sendMembershipSuccessEmail,
} from '../../mailer'

export const processAnnualMembershipPayment = async () => {
  const users = await UserModel.find()
  const settings = await SettingsModel.findOne()
  const MEMBERSHIP_UNIT_AMOUNT = settings?.membershipUnitAmount || 10

  const currentYear = new Date().getFullYear()

  for (const user of users) {
    //Ignorer si paiement déjà effectué cette année
    if (
      user.lastMembershipPaymentYear === currentYear &&
      user.membershipPaidThisYear
    ) {
      continue
    }

    //Calcul du nombre de personnes à charge + user (18+)
    const dependents =
      user.familyMembers?.filter((member) => {
        const age =
          new Date().getFullYear() - new Date(member.birthDate).getFullYear()
        return age >= 18
      }) || []

    const userAge =
      new Date().getFullYear() - new Date(user.origines.birthDate).getFullYear()
    const totalPersons = (userAge >= 18 ? 1 : 0) + dependents.length
    const totalToDeduct = totalPersons * MEMBERSHIP_UNIT_AMOUNT

    //Chercher le compte lié à l'utilisateur
    const account = await AccountModel.findOne({ userId: user._id })
    if (!account) continue

    if (account.solde >= totalToDeduct) {
      //Prélèvement

      account.solde -= totalToDeduct
      await account.save()

      await TransactionModel.create({
        userId: user._id,
        amount: totalToDeduct,
        reason: 'Cotisation annuelle',
        type: 'debit',
        status: 'completed',
      })

      await sendMembershipSuccessEmail(
        user.register.email,
        totalToDeduct,
        currentYear
      )

      user.lastMembershipPaymentYear = currentYear
      user.membershipPaidThisYear = true
      await user.save()
    } else {
      await TransactionModel.create({
        userId: user._id,
        amount: totalToDeduct,
        reason: 'Cotisation annuelle',
        type: 'debit',
        status: 'failed',
      })
      //Envoyer un email de rappel
      await sendMembershipReminderEmail(
        user.register.email,
        totalToDeduct,
        account.solde
      )
    }
  }
}

export const processMembershipForUser = async (userId: string) => {
  const user = await UserModel.findById(userId)
  if (!user) {
    return { status: 'NOT_FOUND', message: 'Utilisateur introuvable' }
  }
  const settings = await SettingsModel.findOne()
  const MEMBERSHIP_UNIT_AMOUNT = settings?.membershipUnitAmount || 10
  const currentYear = new Date().getFullYear()

  if (
    user?.lastMembershipPaymentYear === currentYear &&
    user?.membershipPaidThisYear
  ) {
    return { status: 'ALREADY_PAID' }
  }

  const dependents =
    user?.familyMembers?.filter((member) => {
      const age = currentYear - new Date(member.birthDate).getFullYear()
      return age >= 18
    }) || []

  const userAge = currentYear - new Date(user!.origines.birthDate).getFullYear()
  const totalPersons = (userAge >= 18 ? 1 : 0) + dependents.length
  const totalToDeduct = totalPersons * MEMBERSHIP_UNIT_AMOUNT

  const account = await AccountModel.findOne({ userId })

  if (!account) return { status: 'NO_ACCOUNT' }

  if (account.solde >= totalToDeduct) {
    account.solde -= totalToDeduct
    await account.save()

    await TransactionModel.create({
      userId,
      amount: totalToDeduct,
      reason: 'Cotisation annuelle',
      type: 'debit',
      status: 'completed',
    })

    user!.lastMembershipPaymentYear = currentYear
    user!.membershipPaidThisYear = true
    await user!.save()
    try {
      await sendMembershipSuccessEmail(
        user!.register.email,
        totalToDeduct,
        currentYear
      )
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de confirmation:", error)
    }
    await sendMembershipSuccessEmail(
      user!.register.email,
      totalToDeduct,
      currentYear
    )
    return { status: 'SUCCESS', amount: totalToDeduct }
  } else {
    await TransactionModel.create({
      userId,
      amount: totalToDeduct,
      reason: 'Cotisation annuelle',
      type: 'debit',
      status: 'failed',
    })

    try {
      await sendMembershipReminderEmail(
        user!.register.email,
        totalToDeduct,
        account.solde
      )
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de confirmation:", error)
    }

    return {
      status: 'INSUFFICIENT_FUNDS',
      required: totalToDeduct,
      balance: account.solde,
    }
  }
}
