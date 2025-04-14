import ManualReminderButton from '@/components/ManualReminderButton'
import { Button } from '@/components/ui/button'

type TransactionPageSubmenuType = {
  setSettingModalVisibility: (param: boolean) => void
  setBilanModalVisibility: (param: boolean) => void
}
const TransactionPageSubmenu = ({
  setSettingModalVisibility,
  setBilanModalVisibility,
}: TransactionPageSubmenuType) => {
  return (
    <div className='flex gap-4'>
      <ManualReminderButton />
      <Button
        variant='link'
        className='text-sm p-0 h-auto'
        onClick={() => setSettingModalVisibility(true)}
      >
        Settings
      </Button>
      <Button
        variant='link'
        className='text-sm p-0 h-auto'
        onClick={() => setBilanModalVisibility(true)}
      >
        Bilans
      </Button>
    </div>
  )
}

export default TransactionPageSubmenu
