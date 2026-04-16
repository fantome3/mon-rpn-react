import { Types } from 'mongoose'
import { DocumentType } from '@typegoose/typegoose'
import {
  DeathAnnouncement,
  DeathAnnouncementModel,
  DeathAnnouncementProcessingError,
  DeathAnnouncementProcessingSummary,
  DeathAnnouncementProcessingStatus,
} from '../models/deathAnnouncement'
import { SettingsModel } from '../models/settingsModel'
import { UserModel } from '../models/userModel'
import { AccountModel } from '../models/accountModel'
import { TransactionModel } from '../models/transactionModel'
import { notifyUsersForDeathAnnouncement } from '../mailer'
import labels from '../common/libelles.json'
import { onRpnBalanceInsufficient } from './rpnLifecycleService'

type CreateDeathAnnouncementInput = {
  firstName: string
  deathPlace: string
  deathDate: Date
}

type LeanUser = {
  _id: Types.ObjectId | string
  register?: { email?: string }
  familyMembers?: Array<{ status?: string }>
  subscription?: { rpnStatus?: string }
}

type DebitCandidate = {
  userId: Types.ObjectId
  totalToDeduct: number
  totalPersons: number
}

type InsufficientFundsCandidate = {
  userId: Types.ObjectId
  email?: string
  totalToDeduct: number
  totalPersons: number
  currentRpnBalance: number
}

const MAX_ERROR_SAMPLES = 20
const MAX_FAILED_PRELEVEMENT_CONCURRENCY = 5

export class DeathAnnouncementServiceError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
    this.name = 'DeathAnnouncementServiceError'
  }
}

const normalizeObjectId = (value: Types.ObjectId | string): Types.ObjectId =>
  typeof value === 'string' ? new Types.ObjectId(value) : value

const calculateTotalPersons = (user: LeanUser): number => {
  const activeDependents =
    user.familyMembers?.filter((member) => member.status === 'active').length || 0
  return activeDependents + 1
}

const resolveAccountUserId = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value instanceof Types.ObjectId) return value.toHexString()
  if (typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
    return String((value as { _id?: unknown })._id)
  }
  return null
}

const resolveAmountPerPerson = (
  settings: { amountPerDependent?: number } | null
): number | null => {
  const amount = Number(settings?.amountPerDependent)

  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }
  
  return amount
}

const buildPrelevementReason = (totalPersons: number) =>
  `Prélèvement décès pour ${totalPersons} personnes`

const createEmptySummary = (
  totalUsers: number
): DeathAnnouncementProcessingSummary => ({
  totalUsers,
  debitedCount: 0,
  expectedAmount: 0,
  collectedAmount: 0,
  insufficientFundsCount: 0,
  missingAccountCount: 0,
  systemErrorCount: 0,
})

const fetchPrimaryMembersForDeathAnnouncement = async (): Promise<LeanUser[]> =>
  (await UserModel.find({
    primaryMember: true,
    deletedAt: { $exists: false },
  })
    .select('_id register.email familyMembers.status subscription.rpnStatus')
    .lean()) as LeanUser[]

const pushErrorSample = (
  errors: DeathAnnouncementProcessingError[],
  error: DeathAnnouncementProcessingError
) => {
  if (errors.length < MAX_ERROR_SAMPLES) {
    errors.push(error)
  }
}

const recordMissingAccount = (
  summary: DeathAnnouncementProcessingSummary,
  errors: DeathAnnouncementProcessingError[],
  userKey: string,
  email?: string
) => {
  summary.missingAccountCount += 1
  pushErrorSample(errors, {
    userId: userKey,
    email,
    reason: 'Aucun compte trouvé',
  })
}

const recordInsufficientFunds = (
  summary: DeathAnnouncementProcessingSummary,
  errors: DeathAnnouncementProcessingError[],
  userKey: string,
  email: string | undefined,
  currentRpnBalance: number,
  totalToDeduct: number
) => {
  summary.insufficientFundsCount += 1
  pushErrorSample(errors, {
    userId: userKey,
    email,
    reason: 'Solde insuffisant',
    detail: `Solde ${currentRpnBalance} / Requis ${totalToDeduct}`,
  })
}

const recordSystemError = (
  summary: DeathAnnouncementProcessingSummary,
  errors: DeathAnnouncementProcessingError[],
  userKey: string,
  email: string | undefined,
  error: unknown
) => {
  summary.systemErrorCount += 1
  pushErrorSample(errors, {
    userId: userKey,
    email,
    reason: 'Erreur système',
    detail: error instanceof Error ? error.message : String(error),
  })
}

const runWithConcurrency = async <T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
) => {
  if (items.length === 0) return
  const concurrency = Math.max(1, Math.min(limit, items.length))
  let index = 0

  const runners = Array.from({ length: concurrency }, async () => {
    while (true) {
      const current = index
      index += 1
      if (current >= items.length) return
      await worker(items[current])
    }
  })

  await Promise.all(runners)
}

const collectProcessingCandidates = ({
  users,
  accountMap,
  amountPerPerson,
  summary,
  errors,
}: {
  users: LeanUser[]
  accountMap: Map<
    string,
    { rpn_balance: number; solde?: number }
  >
  amountPerPerson: number
  summary: DeathAnnouncementProcessingSummary
  errors: DeathAnnouncementProcessingError[]
}) => {
  const debitCandidates: DebitCandidate[] = []
  const insufficientCandidates: InsufficientFundsCandidate[] = []

  for (const user of users) {
    const userId = normalizeObjectId(user._id)
    const userKey = String(userId)
    try {
      // Exclure les membres non-inscrits, ou désinscrit du fonds RPN.
      // Les documents legacy sans rpnStatus (undefined) sont inclus : la vérification
      // du solde plus bas les écartera s'ils n'ont jamais contribué.
      const rpnStatus = user.subscription?.rpnStatus
      if (
        rpnStatus === 'not_enrolled' ||
        rpnStatus === 'unsubscribed'
      ) {
        continue
      }

      const totalPersons = calculateTotalPersons(user)
      const totalToDeduct = totalPersons * amountPerPerson
      const account = accountMap.get(userKey)

      if (!account) {
        recordMissingAccount(summary, errors, userKey, user.register?.email)
        continue
      }

      summary.expectedAmount += totalToDeduct

      const currentRpnBalance = account.rpn_balance;
      if (currentRpnBalance < totalToDeduct) {
        recordInsufficientFunds(
          summary,
          errors,
          userKey,
          user.register?.email,
          currentRpnBalance,
          totalToDeduct
        )
        insufficientCandidates.push({
          userId,
          email: user.register?.email,
          totalPersons,
          totalToDeduct,
          currentRpnBalance,
        })
        continue
      }

      debitCandidates.push({ userId, totalPersons, totalToDeduct })
    } catch (error) {
      recordSystemError(
        summary,
        errors,
        userKey,
        user.register?.email,
        error
      )
    }
  }

  return { debitCandidates, insufficientCandidates }
}

const applyDebitCandidates = async (candidates: DebitCandidate[]) => {
  if (candidates.length === 0) return

  await AccountModel.bulkWrite(
    candidates.map((candidate) => ({
      updateOne: {
        filter: { userId: candidate.userId },
        update: {
          $inc: {
            rpn_balance: -candidate.totalToDeduct,
            solde: -candidate.totalToDeduct,
          },
        },
      },
    })),
    { ordered: false }
  )

  await TransactionModel.insertMany(
    candidates.map((candidate) => ({
      userId: candidate.userId,
      amount: candidate.totalToDeduct,
      type: 'debit',
      fundType: 'rpn',
      reason: buildPrelevementReason(candidate.totalPersons),
    })),
    { ordered: false }
  )
}

const processInsufficientFundsCandidates = async ({
  candidates,
  maxMissedReminders,
  summary,
  errors,
}: {
  candidates: InsufficientFundsCandidate[]
  maxMissedReminders: number
  summary: DeathAnnouncementProcessingSummary
  errors: DeathAnnouncementProcessingError[]
}) => {
  if (candidates.length === 0) return

  const userDocs = await UserModel.find({
    _id: { $in: candidates.map((candidate) => candidate.userId) },
  })
  const userMap = new Map(userDocs.map((user) => [String(user._id), user]))

  await runWithConcurrency(
    candidates,
    MAX_FAILED_PRELEVEMENT_CONCURRENCY,
    async (candidate) => {
      const userDoc = userMap.get(String(candidate.userId))
      if (!userDoc) {
        return
      }

      try {
        await onRpnBalanceInsufficient({
          user: userDoc,
          solde: candidate.currentRpnBalance,
          totalToDeduct: candidate.totalToDeduct,
          maxMissed: maxMissedReminders,
          totalPersons: candidate.totalPersons,
        })
      } catch (error) {
        recordSystemError(
          summary,
          errors,
          String(candidate.userId),
          candidate.email,
          error
        )
      }
    }
  )
}

const updateAnnouncementStatus = async (
  announcementId: Types.ObjectId | string,
  status: DeathAnnouncementProcessingStatus,
  data: Partial<{
    processingStartedAt: Date
    processingFinishedAt: Date
    processingSummary: DeathAnnouncementProcessingSummary
    processingErrors: DeathAnnouncementProcessingError[]
    processingFailureReason: string
  }> = {}
) => {
  await DeathAnnouncementModel.updateOne(
    { _id: announcementId },
    {
      $set: {
        processingStatus: status,
        ...data,
      },
    }
  )
}

export const createDeathAnnouncement = async (
  input: CreateDeathAnnouncementInput
): Promise<{
  announcement: DocumentType<DeathAnnouncement>
  shouldProcess: boolean
}> => {
  const settings = await SettingsModel.findOne().lean()
  const amountPerPerson = resolveAmountPerPerson(settings)
  const hasAmount = Boolean(amountPerPerson)

  const announcement = new DeathAnnouncementModel({
    ...input,
    processingStatus: hasAmount ? 'pending' : 'failed',
    processingFinishedAt: hasAmount ? undefined : new Date(),
    processingFailureReason: hasAmount
      ? undefined
      : labels.prelevement.montantNonDefini,
  })

  await announcement.save()

  return { announcement, shouldProcess: hasAmount }
}

export const queueDeathAnnouncementProcessing = (
  announcementId: Types.ObjectId | string
) => {
  setImmediate(() => {
    processDeathAnnouncement(String(announcementId)).catch((error) => {
      console.error('Erreur traitement annonce décès:', error)
    })
  })
}

export const processDeathAnnouncement = async (announcementId: string) => {
  const announcement = await DeathAnnouncementModel.findById(announcementId)
  if (!announcement) return

  if (announcement.processingStatus === 'completed') {
    return
  }

  await updateAnnouncementStatus(announcement._id, 'processing', {
    processingStartedAt: new Date(),
    processingFinishedAt: undefined,
    processingFailureReason: undefined,
    processingSummary: undefined,
    processingErrors: [],
  })

  const settings = await SettingsModel.findOne().lean()
  const amountPerPerson = resolveAmountPerPerson(settings)
  if (!amountPerPerson) {
    await updateAnnouncementStatus(announcement._id, 'failed', {
      processingFinishedAt: new Date(),
      processingFailureReason: labels.prelevement.montantNonDefini,
    })
    return
  }

  const users = await fetchPrimaryMembersForDeathAnnouncement()

  const summary = createEmptySummary(users.length)
  const errors: DeathAnnouncementProcessingError[] = []

  const userIds = users.map((user) => normalizeObjectId(user._id))
  const accounts = await AccountModel.find({ userId: { $in: userIds } })
    .select('userId rpn_balance solde')
    .lean()

  const accountMap = new Map<string, { rpn_balance: number; solde?: number }>()
  for (const account of accounts as Array<{
    userId?: unknown
    rpn_balance: number
    solde?: number
  }>) {
    const userKey = resolveAccountUserId(account.userId)
    if (!userKey) continue
    accountMap.set(userKey, {
      rpn_balance: account.rpn_balance,
      solde: account.solde,
    })
  }

  try {
    const { debitCandidates, insufficientCandidates } =
      collectProcessingCandidates({
        users,
        accountMap,
        amountPerPerson,
        summary,
        errors,
      })

    await applyDebitCandidates(debitCandidates)
    summary.debitedCount += debitCandidates.length
    summary.collectedAmount += debitCandidates.reduce(
      (total, candidate) => total + candidate.totalToDeduct,
      0
    )

    
    const maxMissedReminders = settings?.maxMissedReminders ?? 3
    await processInsufficientFundsCandidates({
      candidates: insufficientCandidates,
      maxMissedReminders,
      summary,
      errors,
    })

    await notifyUsersForDeathAnnouncement({
      users,
      firstName: announcement.firstName,
      deathPlace: announcement.deathPlace,
      deathDate: announcement.deathDate,
    })

    await updateAnnouncementStatus(announcement._id, 'completed', {
      processingFinishedAt: new Date(),
      processingSummary: summary,
      processingErrors: errors,
    })
  } catch (error: any) {
    console.error('Erreur traitement annonce décès:', error)
    await updateAnnouncementStatus(announcement._id, 'failed', {
      processingFinishedAt: new Date(),
      processingSummary: summary,
      processingErrors: errors,
      processingFailureReason: error?.message ?? 'Erreur système inattendue',
    })
  }
}
