import Loading from '@/components/Loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { ArrowUpIcon } from 'lucide-react'

const Credit_Transaction = ({
  totalCredit,
  isPending,
}: {
  totalCredit: number
  isPending: boolean
}) => {
  return (
    <>
      {isPending ? (
        <Loading />
      ) : (
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Crédit total</CardTitle>
            <ArrowUpIcon className='h-4 w-4 text-emerald-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-emerald-500'>
              {formatCurrency(totalCredit)}
            </div>
            <p className='text-xs text-muted-foreground'>Entrées de fonds</p>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default Credit_Transaction
