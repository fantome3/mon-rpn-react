export interface ResetPwdParams       { userId: string; token: string }
export interface NewUserParams        { firstName: string; lastName: string; email: string; nativeCountry: string; residenceCountry: string; contactNumber: string; paymentMethod: string; accountBalance: number }
export interface PassTempParams       { password: string }
export interface AlerteParams         { raison: string; dateLimite: string }
export interface AccountStatusParams  { minimumRequiredBalance: number; current: number }
export interface DeceasedParams       { name: string; place: string; date: string }
export interface FailMemberRegistrationParams { member: string; detail: string }
export interface PaymentFailedParams  { amount: number; current: number }
export interface FuneralCostParams    { amount: number; current: number }
export interface ContributionConfirmationParams   { amount: number; year: string }