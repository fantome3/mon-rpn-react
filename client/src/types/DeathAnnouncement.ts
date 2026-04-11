export type DeathAnnouncementProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'

export type DeathAnnouncementProcessingSummary = {
  totalUsers: number
  debitedCount: number
  expectedAmount: number
  collectedAmount: number
  insufficientFundsCount: number
  missingAccountCount: number
  systemErrorCount: number
}

export type DeathAnnouncementProcessingError = {
  userId?: string
  email?: string
  reason: string
  detail?: string
}

export type DeathAnnouncement = {
  _id?: string
  firstName: string
  deathPlace: string
  deathDate: Date
  processingStatus?: DeathAnnouncementProcessingStatus
  processingStartedAt?: string
  processingFinishedAt?: string
  processingSummary?: DeathAnnouncementProcessingSummary
  processingErrors?: DeathAnnouncementProcessingError[]
  processingFailureReason?: string
}
