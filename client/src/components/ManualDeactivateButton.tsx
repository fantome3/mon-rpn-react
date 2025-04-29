import { useDesactivateUserMutation } from '@/hooks/userHooks'
import { toast } from './ui/use-toast'
import IconButtonWithTooltip from './IconButtonWithTooltip'
import { ShieldOff } from 'lucide-react'

const ManualDeactivateButton = ({
  userId,
  refetch,
}: {
  userId?: string
  refetch: () => void
}) => {
  const { mutateAsync: deactivateUser, isPending } =
    useDesactivateUserMutation()

  const handleClick = async () => {
    if (!userId) return null
    try {
      await deactivateUser(userId)
      toast({
        title: '🛑 Compte désactivé',
        description: 'Le compte a été désactivé avec succès.',
      })

      refetch()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Echec de la désactivation du compte',
      })
    }
  }
  return (
    <IconButtonWithTooltip
      icon={<ShieldOff size={20} className='ml-1 text-red-600' />}
      tooltip='Désactiver le compte'
      onClick={handleClick}
      variant='ghost'
      disabled={isPending ? true : false}
    />
  )
}

export default ManualDeactivateButton
