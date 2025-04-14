import { useSendManualRemindersMutation } from '@/hooks/transactionHooks'
import { Button } from './ui/button'
import { toast } from './ui/use-toast'

const ManualReminderButton = () => {
  const { mutateAsync: sendReminders, isPending } =
    useSendManualRemindersMutation()
  return (
    <Button
      variant='link'
      className='text-sm p-0 h-auto'
      disabled={isPending}
      onClick={async () => {
        await sendReminders()
        toast({
          variant: 'default',
          title: 'Rappel effectué',
          description: 'Les membres ont été notifiés par email.',
        })
      }}
    >
      {isPending ? 'Envoi en cours...' : 'Rappel des membres'}
    </Button>
  )
}

export default ManualReminderButton
