import { X } from 'lucide-react'
import { Button } from './ui/button'
import { useContext, useEffect, useState } from 'react'
import clsx from 'clsx'
import { Store } from '@/lib/Store'

const Announcement = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (userInfo?.familyMembers && userInfo?.familyMembers.length > 0) {
      setShow(false)
    }
  }, [userInfo?.familyMembers])

  return (
    <div
      className={clsx(
        'bg-destructive text-white p-4 flex items-center justify-between',
        { hidden: show === false }
      )}
    >
      <p>
        Ajouter les membres de votre famille, en cliquant le bouton "Ajouter une
        personne"
      </p>
      <Button
        className='hover:text-destructive hover:bg-white'
        variant='ghost'
        size='icon'
        onClick={() => setShow(false)}
      >
        <X />
      </Button>
    </div>
  )
}

export default Announcement
