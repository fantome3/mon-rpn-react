import { UserModel, User } from '../models/userModel'
import { TransactionModel } from '../models/transactionModel'
import { AccountModel } from '../models/accountModel'
import { SettingsModel } from '../models/settingsModel'
import { calculateTotalPersons } from '../utils'
import { DocumentType } from '@typegoose/typegoose'
import {
  sendAccountDeactivatedEmail,
  sendDeactivationWarningEmail,
  sendMembershipSuccessEmail,
  sendPrelevementFailedEmail,
} from '../mailer'
import labels from '../common/libelles.json'
import { handleFailedPrelevement } from './subscriptionService'

const getMembershipBalance = (account: any): number =>
  typeof account?.membership_balance === 'number'
    ? account.membership_balance
    : account?.solde || 0

const getRpnBalance = (account: any): number =>
  typeof account?.rpn_balance === 'number' ? account.rpn_balance : 0

const calculateMembershipAmount = (
  user: DocumentType<User>,
  workerAmount: number,
  studentAmount: number,
): number => {
  const currentYear = new Date().getFullYear()
  let total = 0

  const userAge = currentYear - new Date(user.origines.birthDate).getFullYear()
  if (userAge >= 18) {
    total +=
      user.register.occupation === 'student' ? studentAmount : workerAmount
  }

  for (const member of user.familyMembers || []) {
    const age = currentYear - new Date(member.birthDate).getFullYear()
    if (age >= 18 && member.status === 'active') {
      total +=
        member.residenceCountryStatus === 'student'
          ? studentAmount
          : workerAmount
    }
  }

  return total
}

export const processAnnualMembershipPayment = async () => {
  const users = await UserModel.find({ deletedAt: { $exists: false } })
  const settings = await SettingsModel.findOne()
  const MEMBERSHIP_WORKER_AMOUNT = settings?.membershipUnitAmount || 50
  const MEMBERSHIP_STUDENT_AMOUNT = 25
  const maxMissed = settings?.maxMissedReminders || 3
  const currentYear = new Date().getFullYear()

  for (const user of users) {
    if (
      user.subscription?.lastMembershipPaymentYear === currentYear &&
      user.subscription?.membershipPaidThisYear
    ) {
      continue
    }

    const totalPersons = calculateTotalPersons(user)
    const totalToDeduct = calculateMembershipAmount(
      user,
      MEMBERSHIP_WORKER_AMOUNT,
      MEMBERSHIP_STUDENT_AMOUNT,
    )

    const account = await AccountModel.findOne({ userId: user._id })
    if (!account) continue

    const membershipBalance = getMembershipBalance(account)
    const rpnBalance = getRpnBalance(account)

    if (membershipBalance >= totalToDeduct) {
      account.membership_balance = membershipBalance - totalToDeduct
      account.rpn_balance = rpnBalance
      account.solde = account.membership_balance + account.rpn_balance
      await account.save()

      await TransactionModel.create({
        userId: user._id,
        amount: totalToDeduct,
        fundType: 'membership',
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
      await TransactionModel.create({
        userId: user._id,
        amount: totalToDeduct,
        fundType: 'membership',
        reason: 'Cotisation annuelle',
        type: 'debit',
        status: 'failed',
      })

      await handleFailedPrelevement({
        user,
        type: 'membership',
        totalToDeduct,
        solde: membershipBalance,
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
  const MEMBERSHIP_WORKER_AMOUNT = settings?.membershipUnitAmount || 50
  const MEMBERSHIP_STUDENT_AMOUNT = 25
  const maxMissed = settings?.maxMissedReminders || 3
  const currentYear = new Date().getFullYear()

  if (
    user?.subscription.lastMembershipPaymentYear === currentYear &&
    user?.subscription.membershipPaidThisYear
  ) {
    return { status: 'ALREADY_PAID' }
  }

  const totalPersons = calculateTotalPersons(user)
  const totalToDeduct = calculateMembershipAmount(
    user,
    MEMBERSHIP_WORKER_AMOUNT,
    MEMBERSHIP_STUDENT_AMOUNT,
  )

  const account = await AccountModel.findOne({ userId })

  if (!account) return { status: 'NO_ACCOUNT' }

  const membershipBalance = getMembershipBalance(account)
  const rpnBalance = getRpnBalance(account)

  if (membershipBalance >= totalToDeduct) {
    account.membership_balance = membershipBalance - totalToDeduct
    account.rpn_balance = rpnBalance
    account.solde = account.membership_balance + account.rpn_balance
    await account.save()

    await TransactionModel.create({
      userId,
      amount: totalToDeduct,
      fundType: 'membership',
      reason: 'Cotisation annuelle',
      type: 'debit',
      status: 'completed',
    })

    user.subscription.lastMembershipPaymentYear = currentYear
    user.subscription.membershipPaidThisYear = true
    user.subscription.status = 'active'
    user.subscription.startDate = new Date()
    user.subscription.endDate = new Date(
      new Date().setFullYear(currentYear + 1)
    )
    user.subscription.missedRemindersCount = 0
    user.subscription.scheduledDeactivationDate = undefined
    await user.save()

    await sendMembershipSuccessEmail(user.register.email, totalToDeduct, currentYear)
    return { status: 'SUCCESS', amount: totalToDeduct }
  } else {
    await TransactionModel.create({
      userId,
      amount: totalToDeduct,
      fundType: 'membership',
      reason: 'Cotisation annuelle',
      type: 'debit',
      status: 'failed',
    })

    await handleFailedPrelevement({
      user,
      type: 'membership',
      totalToDeduct,
      solde: membershipBalance,
      maxMissed,
      totalPersons,
    })

    return {
      status: 'INSUFFICIENT_FUNDS',
      required: totalToDeduct,
      balance: membershipBalance,
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
    deletedAt: { $exists: false },
  })

  for (const user of usersToDeactivate) {
    user.subscription.status = 'inactive'
    user.subscription.scheduledDeactivationDate = undefined
    await user.save()

    await sendAccountDeactivatedEmail(user.register.email)
    console.log(`Compte desactive : ${user.register.email}`)
  }

  console.log(`${usersToDeactivate.length} comptes desactives automatiquement.`)
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
  console.log(`Compte desactive manuellement pour : ${user.register.email}`)

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

  console.log(`Compte reactive pour : ${user.register.email}`)

  return { status: 'SUCCESS', message: labels.compte.reactiveSucces }
}
