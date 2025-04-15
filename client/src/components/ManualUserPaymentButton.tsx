import { useManualUserPaymentMutation } from '@/hooks/transactionHooks'
import { toast } from './ui/use-toast'
import { DollarSign } from 'lucide-react'
import IconButtonWithTooltip from './IconButtonWithTooltip'

const ManualUserPaymentButton = ({ userId }: { userId?: string }) => {
  const { mutateAsync: manualPayment, isPending } =
    useManualUserPaymentMutation()

  const handleManualPayment = async () => {
    if (!userId) return null
    try {
      const result = await manualPayment(userId)

      switch (result.status) {
        case 'SUCCESS':
          toast({
            title: '✅ Prélèvement réussi',
            description: `Cotisation de ${result.amount} CAD prélevée avec succès.`,
          })
          break
        case 'INSUFFICIENT_FUNDS':
          toast({
            variant: 'destructive',
            title: '❌ Solde insuffisant',
            description: `Solde actuel : ${result.balance} / Requis : ${result.required}`,
          })
          break
        case 'ALREADY_PAID':
          toast({
            title: 'ℹ️ Déjà payé',
            description: `Cette personne a déjà réglé sa cotisation.`,
          })
          break
        default:
          toast({
            variant: 'destructive',
            title: 'Erreur inconnue',
          })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur de prélèvement',
      })
    }
  }
  return (
    <IconButtonWithTooltip
      icon={<DollarSign size={20} className='ml-1 text-blue-900' />}
      tooltip='Prélèvement pour cotisation annuelle.'
      onClick={handleManualPayment}
      variant='ghost'
      disabled={isPending ? true : false}
    />
  )
}

export default ManualUserPaymentButton
