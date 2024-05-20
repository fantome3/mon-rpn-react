import { Languages } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Store } from '@/lib/Store'

export function ModeToggle() {
  const { state } = useContext(Store)
  const { userInfo } = state
  const { i18n } = useTranslation()
  const [lang, setLang] = useState(localStorage.getItem('i18nextLng')!)

  useEffect(() => {
    localStorage.setItem('i18nextLng', lang)
    i18n.changeLanguage(lang)
  }, [lang])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          <Languages
            className={
              userInfo
                ? 'h-[1.2rem] w-[1.2rem] text-primary'
                : 'h-[1.2rem] w-[1.2rem] text-black'
            }
          />
          <span className='sr-only'>Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuRadioGroup value={lang} onValueChange={setLang}>
          <DropdownMenuRadioItem value='fr'>Français</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='en'>English</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
