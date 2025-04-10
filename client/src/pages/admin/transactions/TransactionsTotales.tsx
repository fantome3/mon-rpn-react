/* eslint-disable @typescript-eslint/no-explicit-any */
import Loading from '@/components/Loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'

const TransactionsTotales = ({
  totalTransactions,
  isPending,
}: {
  totalTransactions: number
  isPending: boolean
}) => {
  return (
    <>
      {isPending ? (
        <Loading />
      ) : (
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Transactions totales
            </CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalTransactions}</div>
            <p className='text-xs text-muted-foreground'>
              Toutes les transactions
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default TransactionsTotales
