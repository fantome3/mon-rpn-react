import { X } from 'lucide-react'
import { Button } from './ui/button'
import { useContext, useState } from 'react'
import { Store } from '@/lib/Store'

const Announcement = () => {
  const { state } = useContext(Store)
  const { userInfo } = state

  //Calculer dynamiquement si l'annonce doit être affichée ou non
  const [show, setShow] = useState(() => {
    return false
    //!(userInfo?.familyMembers && userInfo?.familyMembers.length > 0)
  })
/*
  useEffect(() => {
    const hasFamilyMembers =
      userInfo?.familyMembers && userInfo?.familyMembers.length > 0
    if (hasFamilyMembers) {
      setShow(!hasFamilyMembers) //Cache l'annonce si familyMembers n'est pas vide
    }
  }, [userInfo?.familyMembers])
*/
  if (!show) return null

  return (
    <div className='bg-destructive text-white p-4 flex items-center justify-between'>
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
