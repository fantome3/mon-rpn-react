import { DataTable } from '@/components/CustomTable'
import Loading from '@/components/Loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { useGetTransactionsByUserIdQuery } from '@/hooks/transactionHooks'
import { Store } from '@/lib/Store'
import { formatCurrency, functionReverse } from '@/lib/utils'
import { Transaction } from '@/types/Transaction'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { useContext } from 'react'

const TransactionsByUserId = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const {
    data: transactions,
    isPending,
    error,
  } = useGetTransactionsByUserIdQuery(userInfo?._id)

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => {
        const date: string = row.getValue('createdAt')
        return <div>{functionReverse(date.substring(0, 10))}</div>
      },
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Type
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => (
        <span className='capitalize'>{row.getValue('type')}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Montant',
      cell: ({ row }) => {
        const type = row.original.type
        const amount: number = row.getValue('amount')
        const color = type === 'credit' ? 'text-green-600' : 'text-red-600'
        return (
          <span className={color}>
            {type === 'credit' ? '+' : '-'}
            {formatCurrency(amount)}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const status: string = row.getValue('status')
        return (
          <Badge
            className={`text-xs ${
              status === 'completed' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {status === 'completed' ? 'Réussie' : 'Échouée'}
          </Badge>
        )
      },
    },
  ]
  return (
    <>
      <div className='container mt-16'>
        <h1 className='text-2xl font-semibold'>
          Historique de mes transactions
        </h1>
      </div>
      {isPending ? (
        <Loading />
      ) : error ? (
        toast({
          variant: 'destructive',
          title: 'Oops!',
          description: 'Quelque chose ne va pas.',
        })
      ) : (
        <>
          <div className='container'>
            <DataTable columns={columns} data={transactions} />
          </div>
        </>
      )}
    </>
  )
}

export default TransactionsByUserId
