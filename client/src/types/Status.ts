export const OCCUPATIONS = ['student', 'worker'] as const
export type Occupation = (typeof OCCUPATIONS)[number]

export const STUDENT_STATUSES = ['part-time', 'full-time'] as const
export type StudentStatus = (typeof STUDENT_STATUSES)[number]

export const RESIDENCE_COUNTRY_STATUSES = [
  'student',
  'worker',
  'canadian_citizen',
  'permanent_resident',
  'visitor',
] as const
export type ResidenceCountryStatus =
  (typeof RESIDENCE_COUNTRY_STATUSES)[number]

export const FAMILY_MEMBER_STATUSES = [
  'active',
  'inactive',
  'deleted',
] as const
export type FamilyMemberStatus = (typeof FAMILY_MEMBER_STATUSES)[number]

export const SUBSCRIPTION_STATUSES = [
  'registered',
  'active',
  'inactive',
  'expired',
] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export const TOP_UP_TARGETS = ['membership', 'rpn'] as const
export type TopUpTarget = (typeof TOP_UP_TARGETS)[number]

export const TOP_UP_TARGETS_WITH_BOTH = [
  ...TOP_UP_TARGETS,
  'both',
] as const
export type TopUpTargetWithBoth = (typeof TOP_UP_TARGETS_WITH_BOTH)[number]

export const BILLING_SECTIONS = ['payment', 'history'] as const
export type BillingSection = (typeof BILLING_SECTIONS)[number]

export const MEMBERSHIP_PAYMENT_UI_STATES = [
  'initial',
  'rejected',
  'pending',
  'success',
] as const
export type MembershipPaymentUiState =
  (typeof MEMBERSHIP_PAYMENT_UI_STATES)[number]

export const TRANSACTION_TYPES = ['debit', 'credit'] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export const TRANSACTION_FUND_TYPES = ['membership', 'rpn', 'both'] as const
export type TransactionFundType = (typeof TRANSACTION_FUND_TYPES)[number]

export const TRANSACTION_STATUSES = [
  'completed',
  'success',
  'failed',
  'pending',
  'awaiting_payment',
  'rejected',
  'refunded',
] as const
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number]

export const PAYMENT_METHODS = ['credit_card', 'interac'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const RESERVATION_STATUSES = ['pending', 'confirmed', 'refunded'] as const
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number]
