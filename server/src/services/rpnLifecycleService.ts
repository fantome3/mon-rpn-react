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
  solde: number
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
 */
export const onRpnPaymentConfirmed = async (
  userId: string,
  newRpnBalance: number
): Promise<void> => {
  const user = await UserModel.findById(userId)
  if (!user) return

  const { rpnStatus } = user.subscription
  const isFirstEnrollment = !rpnStatus || rpnStatus === 'not_enrolled'
  const isReactivation = rpnStatus === 'unsubscribed'

  if (!isFirstEnrollment && !isReactivation) return

  const settings = await SettingsModel.findOne()
  const minUnit = settings?.minimumBalanceRPN || 10
  const totalPersons = calculateTotalPersons(user)
  const minRequired = totalPersons * minUnit

  if (newRpnBalance < minRequired) return

  user.subscription.rpnStatus = 'enrolled'
  user.subscription.missedRpnRemindersCount = 0

  if (isFirstEnrollment) {
    user.subscription.rpnEnrollmentDate = new Date()
    await user.save()
    enrollOnExternalPlatform(user)
      .then((result) => {
        if (result) {
          return UserModel.updateOne(
            { _id: user._id },
            {
              $set: {
                'subscription.rpnExternalReference': result.reference,
                'subscription.rpnMatricule':         result.matricule,
              },
            }
          )
        }
      })
      .catch((err) => console.error('[rpnLifecycle] enrollOnExternalPlatform:', err))
  } else {
    await user.save()
    reactivateOnExternalPlatform(user.subscription.rpnExternalReference ?? '').catch((err) =>
      console.error('[rpnLifecycle] reactivateOnExternalPlatform:', err)
    )
    await sendRpnReactivationEmail(user.register.email, newRpnBalance)
  }
}

/**
 * Appelé par subscriptionService.handleFailedPrelevement() pour type === 'rpn'.
 * Incrémente le compteur RPN indépendant et déclenche la désinscription si
 * le nombre maximum de rappels est atteint.
 * Le membership et son compteur ne sont pas touchés.
 */
export const onRpnBalanceInsufficient = async ({
  user,
  solde,
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
      await sendDeactivationWarningEmail(user.register.email, "rpn", deactivationDate)
      
      await user.save()
    }
  
  await sendPrelevementFailedDecesEmail(user.register.email, totalToDeduct, solde)

  if (user.subscription.missedRpnRemindersCount >= maxMissed) {
    await unsubscribeFromRpn(user, solde, totalToDeduct)
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

  deactivateOnExternalPlatform(user.subscription.rpnExternalReference!).catch((err) =>
    console.error('[rpnLifecycle] deactivateOnExternalPlatform:', err)
  )

  await sendRpnUnsubscriptionEmail(user.register.email, currentBalance, minimumRequired)
}
