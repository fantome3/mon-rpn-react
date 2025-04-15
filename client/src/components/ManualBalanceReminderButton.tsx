import { useManualBalanceReminderMutation } from '@/hooks/transactionHooks'
import { toast } from './ui/use-toast'
import { Bell } from 'lucide-react'
import IconButtonWithTooltip from './IconButtonWithTooltip'

const ManualBalanceReminderButton = ({ userId }: { userId?: string }) => {
  const { mutateAsync: balanceReminder, isPending } =
    useManualBalanceReminderMutation()

  const handleClick = async () => {
    if (!userId) return null
    try {
      const res = await balanceReminder(userId)
      if (res.status === 'REMINDER_SENT') {
        toast({
          title: '📩 Rappel envoyé',
          description: `Solde : ${res.balance} / Requis : ${res.required}`,
        })
      } else if (res.status === 'ENOUGH_BALANCE') {
        toast({
          title: '✅ Solde suffisant',
          description: `L’utilisateur n’a pas besoin de rappel.`,
        })
      } else if (res.status === 'NO_ACCOUNT') {
        toast({
          variant: 'destructive',
          title: '❌ Compte introuvable',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d’envoyer le rappel',
      })
    }
  }
  return (
    <IconButtonWithTooltip
      icon={<Bell size={20} className='ml-1 text-yellow-600' />}
      tooltip=' Rappel pour solde insuffisant.'
      onClick={handleClick}
      variant='ghost'
      disabled={isPending ? true : false}
    />
  )
}

export default ManualBalanceReminderButton
