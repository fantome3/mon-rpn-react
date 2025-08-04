import { useState, useEffect } from 'react'
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
  const [currentIsAdmin, setCurrentIsAdmin] = useState(isAdmin)

  useEffect(() => {
    setCurrentIsAdmin(isAdmin)
  }, [isAdmin])

  const handleClick = async () => {
    try {
      const { message } = await toggleAdmin(userId)
      setCurrentIsAdmin((prev) => !prev)
      refetch()
      toast({ title: message })
    } catch (error) {
      toastAxiosError(error)
    }
  }

  return (
    <IconButtonWithTooltip
      icon={
        currentIsAdmin ? (
          <UserMinus size={20} className='text-red-600' />
        ) : (
          <UserPlus size={20} className='text-blue-600' />
        )
      }
      tooltip={
        currentIsAdmin
          ? 'Retirer comme administrateur'
          : 'Ajouter comme administrateur'
      }
      onClick={handleClick}
      variant='ghost'
      disabled={isPending}
    />
  )
}

export default ManualToggleAdminButton
