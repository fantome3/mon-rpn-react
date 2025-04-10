import Loading from '@/components/Loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { CreditCard } from 'lucide-react'

const MontantTotal = ({
  totalAmount,
  isPending,
}: {
  totalAmount: number
  isPending: boolean
}) => {
  return (
    <>
      {isPending ? (
        <Loading />
      ) : (
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Montant total</CardTitle>
            <CreditCard className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(totalAmount)}
            </div>
            <p className='text-xs text-muted-foreground'>
              Volume total des transactions
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default MontantTotal
