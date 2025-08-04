export const isEnAttentePaiement = (
  account?: { enAttentePaiement: boolean; solde: number } | null,
) => {
  return !!account && account.enAttentePaiement && account.solde === 0
}
