import { useState } from 'react'
import { useDeleteUserMutation } from '@/hooks/userHooks'
import IconButtonWithTooltip from './IconButtonWithTooltip'
import { Trash2 } from 'lucide-react'
import { toast } from './ui/use-toast'
import { toastAxiosError } from '@/lib/utils'
import * as AlertDialog from '@radix-ui/react-alert-dialog'

type Props = {
  userId: string
  refetch: () => void
  disabled?: boolean
}

const ManualDeleteUserButton = ({ userId, refetch, disabled = false }: Props) => {
  const { mutateAsync: deleteUser, isPending } = useDeleteUserMutation()
  const [open, setOpen] = useState(false)

  const onConfirmDelete = async () => {
    if (!userId) return
    try {
      await deleteUser(userId)
      toast({
        title: '🗑️ Utilisateur supprimé',
        description: 'Le compte a été supprimé avec succès.',
      })
      setOpen(false)
      refetch()
    } catch (error) {
      toastAxiosError(error)
    }
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>
        <span>
          <IconButtonWithTooltip
            icon={<Trash2 size={20} className='text-red-600' />}
            tooltip='Supprimer le compte'
            onClick={() => setOpen(true)}
            variant='ghost'
            disabled={isPending || disabled}
            aria-label='Supprimer cet utilisateur'
          />
        </span>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className='fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out' />
        <AlertDialog.Content
          className='fixed left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-5 shadow-xl focus:outline-none dark:bg-neutral-900'
          aria-describedby='delete-user-desc'
        >
          <AlertDialog.Title className='text-lg font-semibold'>
            Supprimer l’utilisateur&nbsp;?
          </AlertDialog.Title>

          <AlertDialog.Description id='delete-user-desc' className='mt-3 space-y-3 text-sm text-neutral-700 dark:text-neutral-300'>
            <p>
              Cet utilisateur sera <strong>définitivement supprimé</strong>. Cette action est
              <strong> irréversible</strong> et il ne pourra plus créer de compte.
            </p>
            <p>
              Pour une suspension temporaire, cliquez plutôt sur <strong>Désactiver</strong>.
            </p>
            <p><strong>Confirmez-vous la suppression&nbsp;?</strong></p>
          </AlertDialog.Description>

          <div className='mt-5 flex justify-end gap-2'>
            <AlertDialog.Cancel asChild>
              <button
                className='rounded-md border px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800'
                disabled={isPending}
              >
                Annuler
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirmDelete}
                className='rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60'
                disabled={isPending}
              >
                {isPending ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export default ManualDeleteUserButton
