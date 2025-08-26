import { useDeleteUserMutation } from '@/hooks/userHooks'
import IconButtonWithTooltip from './IconButtonWithTooltip'
import { Trash2 } from 'lucide-react'
import { toast } from './ui/use-toast'
import { toastAxiosError } from '@/lib/utils'

const ManualDeleteUserButton = ({
  userId,
  refetch,
  disabled = false,
}: {
  userId: string
  refetch: () => void
  disabled?: boolean
}) => {
  const { mutateAsync: deleteUser, isPending } = useDeleteUserMutation()

  const handleClick = async () => {
    const message = `Cet utilisateur sera supprimé et ne pourra plus créer de compte une fois l'action terminée. Si vous voulez le désactiver cliquez sur désactiver à la place. Êtes vous sûr de vouloir le supprimer ?`
    if (!userId || !confirm(message)) return
    try {
      await deleteUser(userId)
      toast({
        title: '🗑️ Utilisateur supprimé',
        description: "Le compte a été supprimé avec succès.",
      })
      refetch()
    } catch (error) {
      toastAxiosError(error)
    }
  }

  return (
    <IconButtonWithTooltip
      icon={<Trash2 size={20} className='text-red-600' />}
      tooltip='Supprimer le compte'
      onClick={handleClick}
      variant='ghost'
      disabled={isPending || disabled}
    />
  )
}

export default ManualDeleteUserButton
