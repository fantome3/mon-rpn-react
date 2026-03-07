import type { TransactionStatus } from '@/types'

export const normalizeTransactionStatus = (
  status?: TransactionStatus | string
): TransactionStatus | 'unknown' => {
  if (!status) return 'unknown'

  if (status === 'success') return 'completed'

  if (
    status === 'completed' ||
    status === 'failed' ||
    status === 'pending' ||
    status === 'awaiting_payment' ||
    status === 'rejected' ||
    status === 'refunded'
  ) {
    return status
  }

  return 'unknown'
}

export const getTransactionStatusLabel = (
  status?: TransactionStatus | string
): string => {
  const normalized = normalizeTransactionStatus(status)

  if (normalized === 'completed') return 'Réussie'
  if (normalized === 'failed') return 'Échouée'
  if (normalized === 'pending') return 'En approbation'
  if (normalized === 'awaiting_payment') return 'En attente paiement'
  if (normalized === 'rejected') return 'Rejetée'
  if (normalized === 'refunded') return 'Remboursée'

  return 'Inconnu'
}

export const getTransactionStatusBadgeClass = (
  status?: TransactionStatus | string
): string => {
  const normalized = normalizeTransactionStatus(status)

  if (normalized === 'completed') return 'bg-green-600 text-white'
  if (normalized === 'failed' || normalized === 'rejected') {
    return 'bg-red-600 text-white'
  }
  if (normalized === 'pending') return 'bg-yellow-500 text-yellow-950'
  if (normalized === 'awaiting_payment') return 'bg-blue-500 text-white'
  if (normalized === 'refunded') return 'bg-slate-600 text-white'

  return 'bg-slate-500 text-white'
}
