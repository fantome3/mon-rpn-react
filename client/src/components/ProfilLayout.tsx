import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Store } from '@/lib/Store'
import clsx from 'clsx'
import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AddMemberSection from './AddMemberSection'

const TABS = [
  { label: 'Mon profil',          path: '/profil' },
  { label: 'Ma couverture',       path: '/couverture' },
  { label: 'Personnes à charge',  path: '/dependents' },
  { label: 'Parrainage',          path: '/sponsorship' },
] as const

type Props = {
  children: React.ReactNode
  beforeAddMember?: React.ReactNode
}

const ProfilLayout = ({ children, beforeAddMember }: Props) => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const { pathname } = useLocation()

  return (
    <div className='container px-4 mb-10'>
      <h1 className='text-center pt-6 sm:pt-10 mb-2 text-xl sm:text-3xl font-semibold'>
        Bienvenue {userInfo?.origines?.firstName}
      </h1>
      <p className='text-center text-sm sm:text-xl font-light mb-6 sm:mb-10'>
        Ensemble, nous sommes plus forts.
      </p>

      {beforeAddMember}
      <AddMemberSection />

      <div className='mt-6 sm:mt-10'>
        <nav className='flex overflow-x-auto gap-5 pb-1 scrollbar-none'>
          {TABS.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              className={clsx(
                'text-[.80rem] sm:text-sm whitespace-nowrap shrink-0 pb-0.5 transition-colors',
                pathname === path
                  ? 'text-primary font-semibold border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Separator className='mt-0 mb-3 bg-border' />
        <Card className='bg-[#e9f5eb] min-h-[70vh]'>
          <CardContent className='p-3 sm:p-5'>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfilLayout
