import { useReactivateUserMutation } from '@/hooks/userHooks'
import { toast } from './ui/use-toast'
import { ShieldCheck } from 'lucide-react'
import IconButtonWithTooltip from './IconButtonWithTooltip'

const ManualReactivateButton = ({
  userId,
  refetch,
}: {
  userId: string
  refetch: () => void
}) => {
  const { mutateAsync: reactivateUser, isPending } = useReactivateUserMutation()

  const handleClick = async () => {
    if (!userId) return null
    try {
      await reactivateUser(userId)
      refetch()
      toast({
        title: '✅ Compte réactivé',
        description: 'Le compte a été réactivé avec succès.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Echec de la réactivation du compte',
      })
    }
  }
  return (
    <IconButtonWithTooltip
      icon={<ShieldCheck size={20} className='ml-1 text-green-600' />}
      tooltip='Réactiver le compte'
      onClick={handleClick}
      variant='ghost'
      disabled={isPending ? true : false}
    />
  )
}

export default ManualReactivateButton
