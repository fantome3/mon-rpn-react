import ManualReminderButton from '@/components/ManualReminderButton'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings } from 'lucide-react'

type TransactionPageSubmenuType = {
  setSettingModalVisibility: (param: boolean) => void
  setBilanModalVisibility: (param: boolean) => void
}
const TransactionPageSubmenu = ({
  setSettingModalVisibility,
  setBilanModalVisibility,
}: TransactionPageSubmenuType) => {
  return (
    <div className='flex items-center'>
      {/* Desktop view: visible only on medium and larger screens */}
      <div className='hidden md:flex gap-4'>
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

      {/* Mobile view: visible only on small screens */}
      <div className='md:hidden'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <Settings className='w-5 h-5' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => setSettingModalVisibility(true)}>
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBilanModalVisibility(true)}>
              Bilans
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ManualReminderButton isInDropdown />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default TransactionPageSubmenu
