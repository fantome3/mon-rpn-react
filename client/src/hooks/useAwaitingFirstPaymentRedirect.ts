import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Account } from '@/types/Account'
import { toast } from '@/components/ui/use-toast'

/**
 * Redirects the user to the payment page if the account is awaiting its
 * first payment.
 * @param account Account associated with the current user
 */
const useAwaitingFirstPaymentRedirect = (account?: Account) => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (
      account?.isAwaitingFirstPayment &&
      location.pathname !== '/payment-method'
    ) {
      toast({
        variant: 'destructive',
        title: 'Paiement requis',
        description:
          'Veuillez vous acquitter du montant minimum pour être membre. sinon des pénalités vous seront appliquées',
      })
      navigate('/payment-method')
    }
  }, [account?.isAwaitingFirstPayment, location.pathname, navigate])
}

export default useAwaitingFirstPaymentRedirect
