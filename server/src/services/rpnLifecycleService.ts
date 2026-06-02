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
  enrollFamilyMemberOnExternalPlatform,
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

export const resolveEffectiveRpnStatus = (
  subscription: Pick<Subscription, 'rpnStatus'>,
  rpnBalance: number
): RpnStatus => {
  if (subscription.rpnStatus) return subscription.rpnStatus
  return rpnBalance > 0 ? 'enrolled' : 'not_enrolled'
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internes – membres de la famille
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inscrit sur notrerpn.org tous les membres de la famille actifs
 * qui n'ont pas encore de référence externe.
 * Les références obtenues sont persistées immédiatement via updateOne atomique.
 */
async function enrollPendingFamilyMembers(
  user: DocumentType<User>,
  primaryReference: string
): Promise<void> {
  const pending = user.familyMembers.filter(
    (m) => m.status === 'active' && !m.rpnExternalReference
  )
  if (pending.length === 0) return

  for (let idx = 0; idx < user.familyMembers.length; idx++) {
    const member = user.familyMembers[idx]
    if (member.status !== 'active' || member.rpnExternalReference) continue

    const result = await enrollFamilyMemberOnExternalPlatform(user, member, primaryReference)
    if (result) {
      await UserModel.updateOne(
        { _id: user._id },
        {
          $set: {
            [`familyMembers.${idx}.rpnExternalReference`]: result.reference,
            [`familyMembers.${idx}.rpnMatricule`]:         result.matricule,
          },
        }
      )
    }
  }
}

/**
 * Réactive sur notrerpn.org tous les membres de la famille
 * qui possèdent une référence externe (déjà inscrits).
 */
async function reactivateFamilyMembers(user: DocumentType<User>): Promise<void> {
  const enrolled = user.familyMembers.filter(
    (m) => m.status === 'active' && m.rpnExternalReference
  )
  await Promise.allSettled(
    enrolled.map((m) => reactivateOnExternalPlatform(m.rpnExternalReference!))
  )
}

/**
 * Désactive sur notrerpn.org tous les membres de la famille
 * qui possèdent une référence externe.
 */
async function deactivateFamilyMembers(user: DocumentType<User>): Promise<void> {
  const enrolled = user.familyMembers.filter(
    (m) => m.status === 'active' && m.rpnExternalReference
  )
  await Promise.allSettled(
    enrolled.map((m) => deactivateOnExternalPlatform(m.rpnExternalReference!))
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycle de vie – principal
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
  // rpnStatus === 'enrolled' : compte déjà actif
  // On vérifie quand même s'il y a des membres de la famille en attente d'inscription
  else if (rpnStatus === 'enrolled' && user.subscription.rpnExternalReference) {
    enrollPendingFamilyMembers(user, user.subscription.rpnExternalReference).catch((err) =>
      console.error('[rpnLifecycle] enrollPendingFamilyMembers (payment):', err)
    )
  }
}

/**
 * Premier enrôlement RPN du membre principal.
 * La mise à jour atomique garantit qu'un seul appel concurrent aboutit.
 * Une fois le principal inscrit, les membres de la famille sont inscrits à leur tour.
 */
const enrollRpnMember = async (user: DocumentType<User>): Promise<void> => {
  const dbResult = await UserModel.updateOne(
    { _id: user._id, 'subscription.rpnStatus': { $in: [null, 'not_enrolled'] } },
    {
      $set: {
        'subscription.rpnStatus':              'enrolled',
        'subscription.rpnEnrollmentDate':      new Date(),
        'subscription.missedRpnRemindersCount': 0,
      },
    }
  )

  if (dbResult.modifiedCount === 0) return

  enrollOnExternalPlatform(user)
    .then(async (result) => {
      if (!result) return

      await UserModel.updateOne(
        { _id: user._id },
        {
          $set: {
            'subscription.rpnExternalReference': result.reference,
            'subscription.rpnMatricule':         result.matricule,
          },
        }
      )

      // Inscrire les membres de la famille avec la référence du principal
      const fresh = await UserModel.findById(user._id)
      if (fresh) {
        await enrollPendingFamilyMembers(fresh, result.reference)
      }
    })
    .catch((err) => console.error('[rpnLifecycle] enrollRpnMember:', err))
}

/**
 * Réactivation d'un membre désabonné du fonds RPN.
 * Réactive le principal puis tous les membres de la famille déjà inscrits,
 * et inscrit ceux qui auraient été ajoutés pendant la période de désinscription.
 */
const reactivateRpnMember = async (
  user: DocumentType<User>,
  newRpnBalance: number
): Promise<void> => {
  const dbResult = await UserModel.updateOne(
    { _id: user._id, 'subscription.rpnStatus': 'unsubscribed' },
    {
      $set: {
        'subscription.rpnStatus': 'enrolled',
        'subscription.missedRpnRemindersCount': 0,
      },
    }
  )

  if (dbResult.modifiedCount === 0) return

  const primaryRef = user.subscription.rpnExternalReference

  reactivateOnExternalPlatform(primaryRef ?? '').catch((err) =>
    console.error('[rpnLifecycle] reactivateOnExternalPlatform:', err)
  )

  if (primaryRef) {
    reactivateFamilyMembers(user).catch((err) =>
      console.error('[rpnLifecycle] reactivateFamilyMembers:', err)
    )
    enrollPendingFamilyMembers(user, primaryRef).catch((err) =>
      console.error('[rpnLifecycle] enrollPendingFamilyMembers (réactivation):', err)
    )
  }

  await sendRpnReactivationEmail(user.register.email, newRpnBalance)
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycle de vie – solde insuffisant et désinscription
// ─────────────────────────────────────────────────────────────────────────────
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

  if (user.subscription.missedRpnRemindersCount === 1) {
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
    await sendDeactivationWarningEmail(user.register.email, 'rpn', deactivationDate)
    await user.save()
  }

  await sendPrelevementFailedDecesEmail(user.register.email, totalToDeduct, balance)

  if (user.subscription.missedRpnRemindersCount >= maxMissed) {
    await unsubscribeFromRpn(user, balance, totalToDeduct)
  }
}

/**
 * Désinscrit le membre du fonds RPN : met à jour le statut, désactive
 * le principal et tous les membres de la famille sur la plateforme externe,
 * puis notifie le membre par courriel.
 */
export const unsubscribeFromRpn = async (
  user: DocumentType<User>,
  currentBalance: number,
  minimumRequired: number
): Promise<void> => {
  user.subscription.rpnStatus = 'unsubscribed'
  user.subscription.missedRpnRemindersCount = 0
  await user.save()

  deactivateOnExternalPlatform(user.subscription.rpnExternalReference ?? '').catch((err) =>
    console.error('[rpnLifecycle] deactivateOnExternalPlatform:', err)
  )

  deactivateFamilyMembers(user).catch((err) =>
    console.error('[rpnLifecycle] deactivateFamilyMembers:', err)
  )

  await sendRpnUnsubscriptionEmail(user.register.email, currentBalance, minimumRequired)
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycle de vie – ajout de membres de la famille
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Appelé par le router après toute mise à jour de familyMembers.
 * Si le membre principal est déjà inscrit sur notrerpn.org, inscrit
 * immédiatement les membres de la famille qui n'ont pas encore de référence.
 */
export const onFamilyMembersUpdated = async (user: DocumentType<User>): Promise<void> => {
  const { rpnStatus, rpnExternalReference } = user.subscription
  if (rpnStatus !== 'enrolled' || !rpnExternalReference) return

  enrollPendingFamilyMembers(user, rpnExternalReference).catch((err) =>
    console.error('[rpnLifecycle] onFamilyMembersUpdated:', err)
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycle de vie – changement de statut d'un membre de la famille
// ─────────────────────────────────────────────────────────────────────────────

type MemberSnapshot = {
  _id: string
  status: string
  rpnExternalReference?: string
}

const REASON_SUSPENSION_VOLONTAIRE =
  'Suspension volontaire — le membre suspend temporairement la couverture RPN de cette personne à charge'
const REASON_REINTEGRATION_VOLONTAIRE =
  'Réintégration volontaire — couverture RPN rétablie pour cette personne à charge'

/**
 * Appelé par le router après toute mise à jour de familyMembers.
 * Compare les statuts avant/après et synchronise les changements sur notrerpn.org.
 */
export const onFamilyMemberStatusChanged = async (
  previousMembers: MemberSnapshot[],
  updatedUser: DocumentType<User>
): Promise<void> => {
  for (const updatedMember of updatedUser.familyMembers) {
    const ref = updatedMember.rpnExternalReference
    if (!ref) continue

    const prev = previousMembers.find(
      (m) => m._id === (updatedMember as any)._id?.toString()
    )
    if (!prev || prev.status === updatedMember.status) continue

    if (updatedMember.status === 'inactive' || updatedMember.status === 'deleted') {
      deactivateOnExternalPlatform(ref, REASON_SUSPENSION_VOLONTAIRE).catch((err) =>
        console.error('[rpnLifecycle] deactivateOnExternalPlatform (status change):', err)
      )
    } else if (updatedMember.status === 'active') {
      reactivateOnExternalPlatform(ref, REASON_REINTEGRATION_VOLONTAIRE).catch((err) =>
        console.error('[rpnLifecycle] reactivateOnExternalPlatform (status change):', err)
      )
    }
  }
}
