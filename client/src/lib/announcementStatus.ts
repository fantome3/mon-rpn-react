import type { DeathAnnouncementProcessingStatus } from '@/types'

export const normalizeAnnouncementStatus = (
  status?: DeathAnnouncementProcessingStatus | string
): DeathAnnouncementProcessingStatus | 'unknown' => {
  if (!status) return 'completed'

  if (
    status === 'pending' ||
    status === 'processing' ||
    status === 'completed' ||
    status === 'failed'
  ) {
    return status
  }

  return 'unknown'
}

export const getAnnouncementStatusLabel = (
  status?: DeathAnnouncementProcessingStatus | string
): string => {
  const normalized = normalizeAnnouncementStatus(status)

  if (normalized === 'pending') return 'En attente'
  if (normalized === 'processing') return 'En traitement'
  if (normalized === 'completed') return 'Terminé'
  if (normalized === 'failed') return 'Échec'

  return 'Inconnu'
}

export const getAnnouncementStatusBadgeClass = (
  status?: DeathAnnouncementProcessingStatus | string
): string => {
  const normalized = normalizeAnnouncementStatus(status)

  if (normalized === 'completed') return 'bg-green-600 text-white'
  if (normalized === 'failed') return 'bg-red-600 text-white'
  if (normalized === 'processing' || normalized === 'pending') {
    return 'bg-blue-600 text-white'
  }

  return 'bg-slate-500 text-white'
}
