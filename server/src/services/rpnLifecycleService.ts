/**
 * Service central du cycle de vie RPN.
 * Toute modification du statut rpnStatus, du compteur missedRpnRemindersCount
 * ou des interactions avec la plateforme externe passe par ce service.
 */

import { DocumentType } from '@typegoose/typegoose'
import { User, Subscription, UserModel } from '../models/userModel'
import { SettingsModel } from '../models/settingsModel'
import { TransactionModel } from '../models/transactionModel'
import { calculateTotalPersons } from '../utils'
import {
  sendPrelevementFailedDecesEmail,
  sendRpnUnsubscriptionEmail,
  sendRpnReactivationEmail,
  sendDeactivationWarningEmail,
} from '../mailer'
import {
  enrollOnExternalPlatform,
  deactivateOnExternalPlatform,
  reactivateOnExternalPlatform,
} from './rpnExternalPlatformService'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type RpnStatus = 'not_enrolled' | 'pending' | 'enrolled' | 'unsubscribed'

type RpnBalanceInsufficientInput = {
  user: DocumentType<User>
  balance: number
  totalToDeduct: number
  maxMissed: number
  totalPersons: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaire – résolution du statut effectif (rétrocompatibilité)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dérive le statut RPN effectif d'un membre.
 * Pour les documents existants sans rpnStatus persisté, le solde sert de
 * référence : un solde positif indique une inscription antérieure.
 */
export const resolveEffectiveRpnStatus = (
  subscription: Pick<Subscription, 'rpnStatus'>,
  rpnBalance: number
): RpnStatus => {
  if (subscription.rpnStatus) return subscription.rpnStatus
  return rpnBalance > 0 ? 'enrolled' : 'not_enrolled'
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycle de vie
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Appelé par transactionService.apply() après tout crédit RPN.
 * Gère l'enrôlement initial et la réactivation automatique.
 * Utilise des mises à jour atomiques pour éviter les doublons en cas d'appels concurrents.
 */
export const onRpnPaymentConfirmed = async (
  userId: string,
  newRpnBalance: number
): Promise<void> => {
  const user = await UserModel.findById(userId)
  if (!user) return

  const settings = await SettingsModel.findOne()
  const minUnit = settings?.minimumBalanceRPN ?? 5
  const minRequired = calculateTotalPersons(user) * minUnit

  if (newRpnBalance < minRequired) return

  const { rpnStatus } = user.subscription

  if (!rpnStatus || rpnStatus === 'not_enrolled') {
    await enrollRpnMember(user)
  } else if (rpnStatus === 'unsubscribed') {
    await reactivateRpnMember(user, newRpnBalance)
  }
  // rpnStatus === 'enrolled' ou 'pending' : compte déjà actif, aucune action requise
}

/**
 * Premier enrôlement RPN.
 * La mise à jour atomique garantit qu'un seul appel concurrent aboutit,
 * évitant toute double inscription sur la plateforme externe.
 */
const enrollRpnMember = async (user: DocumentType<User>): Promise<void> => {
  const result = await UserModel.updateOne(
    { _id: user._id, 'subscription.rpnStatus': { $in: [null, 'not_enrolled'] } },
    {
      $set: {
        'subscription.rpnStatus': 'enrolled',
        'subscription.rpnEnrollmentDate': new Date(),
        'subscription.missedRpnRemindersCount': 0,
      },
    }
  )

  if (result.modifiedCount === 0) return

  enrollOnExternalPlatform(user.register.email).catch((err) =>
    console.error('[rpnLifecycle] enrollOnExternalPlatform:', err)
  )
}

/**
 * Réactivation d'un membre désabonné du fonds RPN.
 * La mise à jour atomique garantit qu'un seul appel concurrent aboutit.
 */
const reactivateRpnMember = async (
  user: DocumentType<User>,
  newRpnBalance: number
): Promise<void> => {
  const result = await UserModel.updateOne(
    { _id: user._id, 'subscription.rpnStatus': 'unsubscribed' },
    {
      $set: {
        'subscription.rpnStatus': 'enrolled',
        'subscription.missedRpnRemindersCount': 0,
      },
    }
  )

  if (result.modifiedCount === 0) return

  reactivateOnExternalPlatform(user.register.email).catch((err) =>
    console.error('[rpnLifecycle] reactivateOnExternalPlatform:', err)
  )
  await sendRpnReactivationEmail(user.register.email, newRpnBalance)
}

/**
 * Appelé par subscriptionService.handleFailedPrelevement() pour type === 'rpn'.
 * Incrémente le compteur RPN indépendant et déclenche la désinscription si
 * le nombre maximum de rappels est atteint.
 * Le membership et son compteur ne sont pas touchés.
 */
export const onRpnBalanceInsufficient = async ({
  user,
  balance,
  totalToDeduct,
  maxMissed,
  totalPersons,
}: RpnBalanceInsufficientInput): Promise<void> => {

  user.subscription.missedRpnRemindersCount =
    (user.subscription.missedRpnRemindersCount || 0) + 1

    if (user.subscription.missedRpnRemindersCount == 1) {
      await TransactionModel.create({
        userId: user._id,
        amount: totalToDeduct,
        fundType: 'rpn',
        reason: `Prélèvement décès pour ${totalPersons} personnes`,
        type: 'debit',
        status: 'failed',
      })

      const deactivationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      user.subscription.scheduledDeactivationDate = deactivationDate
      await sendDeactivationWarningEmail(user.register.email, 'balance', deactivationDate)
      
      await user.save()
    }
  
  await sendPrelevementFailedDecesEmail(user.register.email, totalToDeduct, balance)

  if (user.subscription.missedRpnRemindersCount >= maxMissed) {
    await unsubscribeFromRpn(user, balance, totalToDeduct)
  }
}

/**
 * Désinscrit le membre du fonds RPN : met à jour le statut, notifie
 * la plateforme externe et informe le membre par courriel.
 * Le compte principal reste actif.
 */
export const unsubscribeFromRpn = async (
  user: DocumentType<User>,
  currentBalance: number,
  minimumRequired: number
): Promise<void> => {
  user.subscription.rpnStatus = 'unsubscribed'
  user.subscription.missedRpnRemindersCount = 0
  await user.save()

  deactivateOnExternalPlatform(user.register.email).catch((err) =>
    console.error('[rpnLifecycle] deactivateOnExternalPlatform:', err)
  )

  await sendRpnUnsubscriptionEmail(user.register.email, currentBalance, minimumRequired)
}
