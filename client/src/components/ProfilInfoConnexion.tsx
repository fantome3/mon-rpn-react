import { useContext } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { Store } from '@/lib/Store'
import { Button } from './ui/button'

const ProfilInfoConnexion = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const { register, infos } = userInfo!

  return (
    <div className='flex flex-col w-full gap-y-3'>
      <Card className=' border-primary'>
        <CardHeader className='text-xl font-medium'>Inscription</CardHeader>
        <CardContent>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Courriel</p>
              <p className='text-sm text-muted-foreground'>{register.email}</p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Mot de passe</p>
              <p className='text-sm text-muted-foreground'>*********</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className='flex justify-end'>
          <Button variant='outline' className='border-primary text-primary'>
            Modifier
          </Button>
        </CardFooter>
      </Card>
      <Card className=' border-primary'>
        <CardHeader className='text-xl font-medium'>Votre adresse</CardHeader>
        <CardContent>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Téléphonne</p>
              <p className='text-sm text-muted-foreground'>{infos.tel}</p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Adresse</p>
              <p className='text-sm text-muted-foreground'>{infos.address}</p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>
                Pays de résidence
              </p>
              <p className='text-sm text-muted-foreground'>
                {infos.residenceCountry}
              </p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Code postal</p>
              <p className='text-sm text-muted-foreground'>
                {infos.postalCode}
              </p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>
                Êtes-vous assurés?
              </p>
              <p className='text-sm text-muted-foreground'>
                {infos.hasInsurance ? 'Oui' : 'Non'}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className='flex justify-end'>
          <Button variant='outline' className='border-primary text-primary'>
            Modifier
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ProfilInfoConnexion
