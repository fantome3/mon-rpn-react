import AddMemberSection from '@/components/AddMemberSection'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Store } from '@/lib/Store'
import clsx from 'clsx'
import { useContext } from 'react'
import { Link } from 'react-router-dom'
const Sponsorship = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const pathname = location.pathname
  return (
    <>
      <div className='container mb-10'>
        <h1 className='text-center pt-10 mb-2 text-3xl font-semibold'>
          Bienvenue {userInfo?.origines.firstName}
        </h1>
        <p className='text-center text-xl font-light mb-10'>
          Ensemble, nous sommes plus forts.
        </p>
        <AddMemberSection />
        <div className='mt-10'>
          <div className='flex justify-between'>
            <Link
              className={clsx('text-sm', {
                'text-primary font-semibold': pathname === '/profil',
              })}
              to='/profil'
            >
              Mon profile
            </Link>
            <Link
              className={clsx('text-sm', {
                'text-primary font-semibold': pathname === '/dependents',
              })}
              to='/dependents'
            >
              Personnes à charge
            </Link>
            <Link
              className={clsx('text-sm', {
                'text-primary font-semibold': pathname === '/sponsorship',
              })}
              to='/sponsorship'
            >
              Parrainage
            </Link>
          </div>
          <Separator className=' mt-3 mb-1 bg-primary' />
          <Card className='bg-[#e9f5eb] min-h-[70vh]'>
            <CardContent className='p-5'>
              <div className='flex justify-between gap-4 md:flex-row flex-col'>
                Sponsorship
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default Sponsorship
