import Loading from '@/components/Loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { ArrowDownIcon } from 'lucide-react'

const Debit_Transaction = ({
  totalDebit,
  isPending,
}: {
  totalDebit: number
  isPending: boolean
}) => {
  return (
    <>
      {isPending ? (
        <Loading />
      ) : (
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Débit total</CardTitle>
            <ArrowDownIcon className='h-4 w-4 text-rose-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-rose-500'>
              {formatCurrency(totalDebit)}
            </div>
            <p className='text-xs text-muted-foreground'>Sorties de fonds</p>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default Debit_Transaction
