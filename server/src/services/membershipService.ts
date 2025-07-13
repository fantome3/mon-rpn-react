import { UserModel } from '../models/userModel'
import { TransactionModel } from '../models/transactionModel'
import { AccountModel } from '../models/accountModel'
import { SettingsModel } from '../models/settingsModel'
import { calculateTotalPersons } from '../utils'
import {
  sendAccountDeactivatedEmail,
  sendDeactivationWarningEmail,
  sendMembershipSuccessEmail,
  sendPrelevementFailedEmail,
} from '../mailer'
import labels from '../common/libelles.json'
import { handleFailedPrelevement } from './subscriptionService'

export const processAnnualMembershipPayment = async () => {
  const users = await UserModel.find()
  const settings = await SettingsModel.findOne()
  const MEMBERSHIP_UNIT_AMOUNT = settings?.membershipUnitAmount || 10
  const maxMissed = settings?.maxMissedReminders || 3
  const currentYear = new Date().getFullYear()

  for (const user of users) {
    //Ignorer si paiement déjà effectué cette année
    if (
      user.subscription?.lastMembershipPaymentYear === currentYear &&
      user.subscription?.membershipPaidThisYear
    ) {
      continue
    }

    //Calcul du nombre de personnes à charge + user (18+)
    const totalPersons = calculateTotalPersons(user)
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

      user.subscription.status = 'active'
      user.subscription.lastMembershipPaymentYear = currentYear
      user.subscription.membershipPaidThisYear = true
      user.subscription.startDate = new Date()
      user.subscription.endDate = new Date(
        new Date().setFullYear(currentYear + 1)
      )
      user.subscription.missedRemindersCount = 0
      user.subscription.scheduledDeactivationDate = undefined
      await user.save()
    } else {
      //Paiement échoué
      await TransactionModel.create({
        userId: user._id,
        amount: totalToDeduct,
        reason: 'Cotisation annuelle',
        type: 'debit',
        status: 'failed',
      })

      await handleFailedPrelevement({
        user,
        type: 'membership',
        totalToDeduct,
        solde: account.solde,
        maxMissed,
        totalPersons,
      })
    }
  }
}

export const processMembershipForUser = async (userId: string) => {
  const user = await UserModel.findById(userId)
  if (!user) {
    return { status: 'NOT_FOUND', message: labels.utilisateur.introuvableFr }
  }
  const settings = await SettingsModel.findOne()
  const MEMBERSHIP_UNIT_AMOUNT = settings?.membershipUnitAmount || 10
  const maxMissed = settings?.maxMissedReminders || 3
  const currentYear = new Date().getFullYear()

  if (
    user?.subscription.lastMembershipPaymentYear === currentYear &&
    user?.subscription.membershipPaidThisYear
  ) {
    return { status: 'ALREADY_PAID' }
  }

  const totalPersons = calculateTotalPersons(user)
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

    user!.subscription.lastMembershipPaymentYear = currentYear
    user!.subscription.membershipPaidThisYear = true
    user!.subscription.status = 'active'
    user!.subscription.startDate = new Date()
    user!.subscription.endDate = new Date(
      new Date().setFullYear(currentYear + 1)
    )
    user!.subscription.missedRemindersCount = 0
    user!.subscription.scheduledDeactivationDate = undefined
    await user!.save()

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

    await handleFailedPrelevement({
      user,
      type: 'membership',
      totalToDeduct,
      solde: account.solde,
      maxMissed,
      totalPersons,
    })

    return {
      status: 'INSUFFICIENT_FUNDS',
      required: totalToDeduct,
      balance: account.solde,
    }
  }
}

export const processInactiveUsers = async () => {
  const today = new Date()
  const usersToDeactivate = await UserModel.find({
    'subscription.status': { $in: ['active', 'registered'] },
    'subscription.scheduledDeactivationDate': {
      $lte: today,
    },
  })

  for (const user of usersToDeactivate) {
    user.subscription.status = 'inactive'
    user.subscription.scheduledDeactivationDate = undefined
    await user.save()

    await sendAccountDeactivatedEmail(user.register.email)
    console.log(`🛑 Compte désactivé : ${user.register.email}`)
  }

  console.log(
    `✅ ${usersToDeactivate.length} comptes désactivés automatiquement.`
  )
}

export const desactivateUserAccount = async (userId: string) => {
  const user = await UserModel.findById(userId)

  if (!user) {
    return { status: 'NOT_FOUND', message: labels.utilisateur.introuvableFr }
  }

  user.subscription.status = 'inactive'
  user.subscription.scheduledDeactivationDate = undefined
  await user.save()
  await sendAccountDeactivatedEmail(user.register.email)
  console.log(`🛑 Compte désactivé manuellement pour : ${user.register.email}`)

  return { status: 'SUCCESS', message: labels.compte.desactiveSucces }
}

export const reactivateUserAccount = async (userId: string) => {
  const user = await UserModel.findById(userId)

  if (!user) {
    return { status: 'NOT_FOUND', message: labels.utilisateur.introuvableFr }
  }

  user.subscription.status = 'active'
  user.subscription.missedRemindersCount = 0
  user.subscription.membershipPaidThisYear = true
  user.subscription.lastMembershipPaymentYear = new Date().getFullYear()
  user.subscription.startDate = new Date()
  user.subscription.endDate = new Date(
    new Date().setFullYear(new Date().getFullYear() + 1)
  )
  user.subscription.scheduledDeactivationDate = undefined
  await user.save()

  console.log(`✅ Compte réactivé pour : ${user.register.email}`)

  return { status: 'SUCCESS', message: labels.compte.reactiveSucces }
}
