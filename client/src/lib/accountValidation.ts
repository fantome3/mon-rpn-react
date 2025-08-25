export const isAccountPendingPayment = (
  account?: { isAwaitingFirstPayment: boolean; solde: number } | null,
) => {
  return !!account && account.isAwaitingFirstPayment && account.solde === 0
}
