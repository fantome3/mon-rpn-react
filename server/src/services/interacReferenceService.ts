import { AccountModel } from '../models/accountModel'
import { TransactionModel } from '../models/transactionModel'

export const normalizeInteracRef = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim().toUpperCase()
}

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type InteracRefCheckOptions = {
  excludeAccountId?: string
  checkAccounts?: boolean
  checkTransactions?: boolean
}

export const interacRefExists = async (
  refs: string[],
  options: InteracRefCheckOptions = {}
): Promise<boolean> => {
  const normalized = refs.map(normalizeInteracRef).filter((v) => v.length > 0)
  if (normalized.length === 0) {
    return false
  }

  const {
    excludeAccountId,
    checkAccounts = true,
    checkTransactions = true,
  } = options

  const regexes = normalized.map(
    (ref) => new RegExp(`^${escapeRegExp(ref)}$`, 'i')
  )

  if (checkAccounts) {
    const accountQuery: Record<string, unknown> = {
      'interac.refInterac': { $in: regexes },
    }
    if (excludeAccountId) {
      accountQuery._id = { $ne: excludeAccountId }
    }

    const existingAccount = await AccountModel.findOne(accountQuery)
      .select('_id')
      .lean()
    if (existingAccount) {
      return true
    }
  }

  if (checkTransactions) {
    const existingTransaction = await TransactionModel.findOne({
      refInterac: { $in: regexes },
    })
      .select('_id')
      .lean()

    return !!existingTransaction
  }

  return false
}
