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
export async function enrollPendingFamilyMembers(
  user: DocumentType<User>,
  primaryReference: string
): Promise<void> {
  const allActive = user.familyMembers.filter((m) => m.status === 'active')
  const pending = allActive.filter(
    (m) => !m.rpnExternalReference && m.rpnStatus === 'pending'
  )

  console.log(`[rpnLifecycle] enrollPendingFamilyMembers — ${allActive.length} membres actifs, ${pending.length} en attente d'inscription`)
  if (allActive.length > 0) {
    allActive.forEach((m) => {
      console.log(`  · ${m.firstName} ${m.lastName} : rpnStatus=${m.rpnStatus ?? 'null'} rpnRef=${m.rpnExternalReference ?? 'ABSENT'}`)
    })
  }

  if (pending.length === 0) return

  for (let idx = 0; idx < user.familyMembers.length; idx++) {
    const member = user.familyMembers[idx]
    if (member.status !== 'active' || member.rpnExternalReference || member.rpnStatus !== 'pending') continue

    const result = await enrollFamilyMemberOnExternalPlatform(user, member, primaryReference)
    if (result) {
      await UserModel.updateOne(
        { _id: user._id },
        {
          $set: {
            [`familyMembers.${idx}.rpnExternalReference`]: result.reference,
            [`familyMembers.${idx}.rpnMatricule`]:         result.matricule,
            [`familyMembers.${idx}.rpnStatus`]:            'enrolled',
          },
        }
      )
    }
  }
}

async function deactivateFamilyMembers(user: DocumentType<User>): Promise<void> {
  const toDeactivate = user.familyMembers.filter(
    (m) => m.status === 'active' && m.rpnExternalReference && m.rpnStatus !== 'unsubscribed'
  )
  await Promise.allSettled(
    toDeactivate.map(async (m) => {
      await deactivateOnExternalPlatform(m.rpnExternalReference!)
      await UserModel.updateOne(
        { _id: user._id, 'familyMembers._id': (m as any)._id },
        { $set: { 'familyMembers.$.rpnStatus': 'unsubscribed' } }
      )
    })
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
  const totalPersons = calculateTotalPersons(user)
  const minRequired = totalPersons * minUnit

  console.log(`[rpnLifecycle] onRpnPaymentConfirmed — userId=${userId} solde=${newRpnBalance} minRequis=${minRequired} (${totalPersons} personnes × ${minUnit}$) rpnStatus=${user.subscription.rpnStatus} rpnRef=${user.subscription.rpnExternalReference ?? 'ABSENT'}`)

  if (newRpnBalance < minRequired) {
    console.warn(`[rpnLifecycle] Solde insuffisant (${newRpnBalance} < ${minRequired}) — aucune inscription déclenchée`)
    return
  }

  const { rpnStatus } = user.subscription

  if (!rpnStatus || rpnStatus === 'not_enrolled') {
    console.log('[rpnLifecycle] → INSCRIPTION du membre principal')
    await enrollRpnMember(user)
  } else if (rpnStatus === 'unsubscribed') {
    console.log('[rpnLifecycle] → RÉACTIVATION du membre principal')
    await reactivateRpnMember(user, newRpnBalance)
  } else if (rpnStatus === 'enrolled' && user.subscription.rpnExternalReference) {
    console.log('[rpnLifecycle] → Membre principal déjà inscrit, vérification des membres famille en attente')
    enrollPendingFamilyMembers(user, user.subscription.rpnExternalReference).catch((err) =>
      console.error('[rpnLifecycle] enrollPendingFamilyMembers (payment):', err)
    )
  } else if (rpnStatus === 'enrolled' && !user.subscription.rpnExternalReference) {
    console.warn('[rpnLifecycle] Membre principal enrolled MAIS rpnExternalReference ABSENT — impossible d\'inscrire les membres famille')
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

  // Pré-marquer tous les membres actifs sans référence externe comme 'pending'
  // pour qu'enrollPendingFamilyMembers les prenne en compte (filtre rpnStatus === 'pending')
  await UserModel.updateOne(
    { _id: user._id },
    { $set: { 'familyMembers.$[elem].rpnStatus': 'pending' } },
    {
      arrayFilters: [
        {
          'elem.status': 'active',
          'elem.rpnExternalReference': { $exists: false },
          'elem.rpnStatus': { $ne: 'unsubscribed' },
        },
      ],
    },
  )

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
 * Les membres de la famille ne sont pas touchés : leur inscription RPN
 * est indépendante et n'a pas été désactivée lors de la désinscription du principal.
 * Seuls les membres famille encore en statut 'pending' sont inscrits sur notrerpn.org.
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
  }

  await user.save()

  await sendPrelevementFailedDecesEmail(user.register.email, totalToDeduct, balance)

  if (user.subscription.missedRpnRemindersCount >= maxMissed) {
    await unsubscribeFromRpn(user, balance, totalToDeduct)
  }
}

/**
 * Désinscrit le membre PRINCIPAL du fonds RPN uniquement.
 * L'inscription RPN de chaque personne à charge est indépendante
 * et n'est pas affectée par la désinscription du principal.
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

  await sendRpnUnsubscriptionEmail(user.register.email, currentBalance, minimumRequired)
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycle de vie – ajout de membres de la famille
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Appelé par le router après toute mise à jour de familyMembers.
 * Détecte les changements explicites de rpnStatus (opt-out ou réinscription)
 * indépendamment du changement de status membership.
 */
export const onFamilyMemberRpnStatusChanged = async (
  previousMembers: MemberSnapshot[],
  updatedUser: DocumentType<User>
): Promise<void> => {
  for (const updatedMember of updatedUser.familyMembers) {
    if (updatedMember.status !== 'active') continue // géré par onFamilyMemberStatusChanged

    const memberId = (updatedMember as any)._id?.toString()
    const prev = previousMembers.find((m) => m._id === memberId)
    if (!prev || prev.rpnStatus === updatedMember.rpnStatus) continue

    const ref = updatedMember.rpnExternalReference

    // Désinscription volontaire du RPN (reste dans le membership)
    if (updatedMember.rpnStatus === 'unsubscribed' && ref) {
      deactivateOnExternalPlatform(ref, REASON_DESINSCRIPTION_RPN_VOLONTAIRE).catch((err) =>
        console.error('[rpnLifecycle] deactivateOnExternalPlatform (rpn opt-out):', err)
      )
    }

    // Réinscription volontaire : membre déjà connu de notrerpn.org → réactiver
    if (updatedMember.rpnStatus === 'pending' && ref) {
      reactivateOnExternalPlatform(ref, REASON_REINSCRIPTION_RPN_VOLONTAIRE)
        .then(() =>
          UserModel.updateOne(
            { _id: updatedUser._id, 'familyMembers._id': (updatedMember as any)._id },
            { $set: { 'familyMembers.$.rpnStatus': 'enrolled' } }
          )
        )
        .catch((err) =>
          console.error('[rpnLifecycle] reactivateOnExternalPlatform (rpn re-enroll):', err)
        )
    }
    // Si pending et sans rpnExternalReference → onFamilyMembersUpdated → enrollPendingFamilyMembers
  }
}

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
  rpnStatus?: string
  rpnExternalReference?: string
}

const REASON_SUSPENSION_VOLONTAIRE =
  'Suspension volontaire — le membre suspend temporairement la couverture RPN de cette personne à charge'
const REASON_REINTEGRATION_VOLONTAIRE =
  'Réintégration volontaire — couverture RPN rétablie pour cette personne à charge'
const REASON_DESINSCRIPTION_RPN_VOLONTAIRE =
  'Désinscription RPN volontaire — le membre retire cette personne du fonds décès'
const REASON_REINSCRIPTION_RPN_VOLONTAIRE =
  'Réinscription RPN volontaire — le membre réintègre cette personne au fonds décès'

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
      UserModel.updateOne(
        { _id: updatedUser._id, 'familyMembers._id': (updatedMember as any)._id },
        { $set: { 'familyMembers.$.rpnStatus': 'unsubscribed' } }
      ).catch((err) => console.error('[rpnLifecycle] rpnStatus unsubscribed (status change):', err))
    } else if (updatedMember.status === 'active') {
      reactivateOnExternalPlatform(ref, REASON_REINTEGRATION_VOLONTAIRE).catch((err) =>
        console.error('[rpnLifecycle] reactivateOnExternalPlatform (status change):', err)
      )
      UserModel.updateOne(
        { _id: updatedUser._id, 'familyMembers._id': (updatedMember as any)._id },
        { $set: { 'familyMembers.$.rpnStatus': 'enrolled' } }
      ).catch((err) => console.error('[rpnLifecycle] rpnStatus enrolled (status change):', err))
    }
  }
}
