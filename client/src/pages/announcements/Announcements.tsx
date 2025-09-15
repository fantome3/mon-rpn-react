import { DataTable } from '@/components/CustomTable'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import { useGetAnnouncementsQuery } from '@/hooks/deathAnnouncementHook'
import { functionReverse, toastAxiosError } from '@/lib/utils'
import { DeathAnnouncement } from '@/types/DeathAnnouncement'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'

const AllAnnouncements = () => {
  const { data: announcements, isPending, error } = useGetAnnouncementsQuery()

  const columns: ColumnDef<DeathAnnouncement>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date Annonce',
      cell: ({ row }) => {
        const created: string = row.getValue('createdAt')
        return <div> {functionReverse(created.substring(0, 10))} </div>
      },
    },
    {
      accessorKey: 'firstName',
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
      accessorKey: 'deathPlace',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Lieu du décès
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        )
      },
    },
    {
      accessorKey: 'deathDate',
      header: 'Date du décès',
      cell: ({ row }) => {
        const created: string = row.getValue('deathDate')
        return <div> {functionReverse(created.substring(0, 10))} </div>
      },
    },
  ]

  return (
    <>
      <div className='container mt-16 flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Historique des annonces</h1>
      </div>
      {isPending ? (
        <Loading />
      ) : error ? (
        toastAxiosError(error)
      ) : (
        <div className='mt-5 container'>
          <DataTable data={announcements} columns={columns} />
        </div>
      )}
    </>
  )
}

export default AllAnnouncements
