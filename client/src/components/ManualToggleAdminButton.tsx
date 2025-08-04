import { useToggleAdminMutation } from '@/hooks/userHooks'
import IconButtonWithTooltip from './IconButtonWithTooltip'
import { UserPlus, UserMinus } from 'lucide-react'
import { toast } from './ui/use-toast'
import { toastAxiosError } from '@/lib/utils'

const ManualToggleAdminButton = ({
  userId,
  isAdmin,
  refetch,
}: {
  userId: string
  isAdmin: boolean
  refetch: () => void
}) => {
  const { mutateAsync: toggleAdmin, isPending } = useToggleAdminMutation()

  const handleClick = async () => {
    try {
      await toggleAdmin(userId)
      refetch()
      toast({
        title: isAdmin
          ? '❎ Administrateur retiré'
          : '✅ Administrateur ajouté',
        description: isAdmin
          ? "L'utilisateur n'est plus administrateur."
          : "L'utilisateur est désormais administrateur.",
      })
    } catch (error) {
      toastAxiosError(error)
    }
  }

  return (
    <IconButtonWithTooltip
      icon={
        isAdmin ? (
          <UserMinus size={20} className='text-red-600' />
        ) : (
          <UserPlus size={20} className='text-blue-600' />
        )
      }
      tooltip={isAdmin ? 'Retirer comme administrateur' : 'Ajouter comme administrateur'}
      onClick={handleClick}
      variant='ghost'
      disabled={isPending}
    />
  )
}

export default ManualToggleAdminButton
