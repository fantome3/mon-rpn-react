import AddMemberSection from '@/components/AddMemberSection'
import { DataTable } from '@/components/CustomTable'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { useGetUserByReferralId } from '@/hooks/userHooks'
import { Store } from '@/lib/Store'
import { ColumnDef } from '@tanstack/react-table'
import clsx from 'clsx'
import { ArrowUpDown } from 'lucide-react'
import { useContext } from 'react'
import { toastAxiosError } from '@/lib/utils'
import { Link } from 'react-router-dom'
const Sponsorship = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const {
    data: referral,
    isPending,
    error,
  } = useGetUserByReferralId(userInfo?._id)
  const userData = referral?.map((elt: any) => {
    return {
      firstName: elt.origines.firstName,
      lastName: elt.origines.lastName,
      residenceCountry: elt.infos.residenceCountry,
      nativeCountry: elt.origines.nativeCountry,
    }
  })

  type SponsorshipType = {
    firstName: string
    lastName: string
    residenceCountry: string
  }
  const pathname = location.pathname

  const columns: ColumnDef<SponsorshipType>[] = [
    {
      accessorKey: 'firstName',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Prénom
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        )
      },
    },
    {
      accessorKey: 'lastName',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nom
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        )
      },
    },
    {
      accessorKey: 'nativeCountry',
      header: `Pays d'origine`,
    },
    {
      accessorKey: 'residenceCountry',
      header: 'Pays de résidence',
    },
  ]
  return (
    <>
      {error ? toastAxiosError(error) : ''}
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
              className={clsx('lg:text-sm text-[.80rem]', {
                'text-primary font-semibold': pathname === '/profil',
              })}
              to='/profil'
            >
              Mon profile
            </Link>
            <Link
              className={clsx('lg:text-sm text-[.80rem]', {
                'text-primary font-semibold': pathname === '/dependents',
              })}
              to='/dependents'
            >
              Personnes à charge
            </Link>
            <Link
              className={clsx('lg:text-sm text-[.80rem]', {
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
                <h2 className='text-xl font-medium'>
                  Liste des personnes parrainées
                </h2>
              </div>
              {isPending ? (
                <Loading />
              ) : (
                <DataTable columns={columns} data={userData ? userData : []} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default Sponsorship
