import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Account } from '@/types'
import { toast } from '@/components/ui/use-toast'

const FIRST_PAYMENT_REDIRECT_PATH = '/dependents?onboarding=1'
const FIRST_PAYMENT_ALLOWED_PATHS = ['/dependents', '/billing', '/payment-method']

const hasSubmittedPaymentFlag = (pathname: string, search: string) => {
  if (pathname !== '/summary') return false
  return new URLSearchParams(search).get('payment') === 'submitted'
}

const isAllowedPathForAwaitingFirstPayment = (pathname: string, search: string) =>
  FIRST_PAYMENT_ALLOWED_PATHS.includes(pathname) ||
  hasSubmittedPaymentFlag(pathname, search)

/**
 * Redirige les utilisateurs dont le compte attend le premier paiement
 * vers l'étape d'onboarding des personnes à charge.
 */
const useAwaitingFirstPaymentRedirect = (account?: Account) => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (
      account?.isAwaitingFirstPayment &&
      !isAllowedPathForAwaitingFirstPayment(location.pathname, location.search)
    ) {
      toast({
        variant: 'info',
        title: 'Finalisez votre inscription',
        description:
          "Ajoutez d'abord vos personnes à charge, puis passez au paiement pour activer votre dossier.",
      })
      navigate(FIRST_PAYMENT_REDIRECT_PATH, { replace: true })
    }
  }, [account?.isAwaitingFirstPayment, location.pathname, location.search, navigate])
}

export default useAwaitingFirstPaymentRedirect
