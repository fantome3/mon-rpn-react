import { DataTable } from '@/components/CustomTable'
import Loading from '@/components/Loading'
import ProfilLayout from '@/components/ProfilLayout'
import { Button } from '@/components/ui/button'
import { useGetUserByReferralId } from '@/hooks/userHooks'
import { Store } from '@/lib/Store'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { useContext } from 'react'
import { toastAxiosError } from '@/lib/utils'

type SponsorshipType = {
  firstName: string
  lastName: string
  residenceCountry: string
  nativeCountry: string
}

const columns: ColumnDef<SponsorshipType>[] = [
  {
    accessorKey: 'firstName',
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Prénom <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'lastName',
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Nom <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  { accessorKey: 'nativeCountry',    header: `Pays d'origine` },
  { accessorKey: 'residenceCountry', header: 'Pays de résidence' },
]

const Sponsorship = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const { data: referral, isPending, error } = useGetUserByReferralId(userInfo?._id)

  const userData: SponsorshipType[] = (referral ?? []).map((elt: any) => ({
    firstName:        elt.origines.firstName,
    lastName:         elt.origines.lastName,
    residenceCountry: elt.infos.residenceCountry,
    nativeCountry:    elt.origines.nativeCountry,
  }))

  return (
    <>
      {error ? toastAxiosError(error) : null}
      <ProfilLayout>
        <h2 className='text-base sm:text-xl font-medium mb-4'>
          Liste des personnes parrainées
        </h2>
        {isPending ? (
          <Loading />
        ) : (
          <DataTable columns={columns} data={userData} />
        )}
      </ProfilLayout>
    </>
  )
}

export default Sponsorship
