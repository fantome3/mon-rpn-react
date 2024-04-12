import { X } from 'lucide-react'
import { Button } from './ui/button'
import { useState } from 'react'
import clsx from 'clsx'

const Announcement = () => {
  const [show, setShow] = useState(true)
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
