/* eslint-disable @typescript-eslint/no-explicit-any */
import Loading from '@/components/Loading'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'

const StatusTransactionDetail = ({
  isPending,
  statusChartData,
  totalTransactions,
  totalAmount,
  summary,
}: {
  isPending: boolean
  statusChartData: any
  totalTransactions: number
  totalAmount: number
  summary: any
}) => {
  return (
    <>
      {isPending ? (
        <Loading />
      ) : (
        <Card className='col-span-3'>
          <CardHeader>
            <CardTitle>Statut des transactions</CardTitle>
            <CardDescription>Détails par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {statusChartData.map((status: any, i: any) => (
                <div key={i} className='flex items-center'>
                  <div
                    className={cn(
                      'mr-2 h-4 w-4 rounded-full',
                      status.name === 'En attente' && 'bg-blue-500',
                      status.name === 'En attente paiement' && 'bg-amber-500',
                      status.name === 'Complété' && 'bg-emerald-500',
                      status.name === 'Échoué' && 'bg-rose-500'
                    )}
                  />
                  <div className='flex-1 flex justify-between items-center'>
                    <div className='font-medium'>{status.name}</div>
                    <div className='flex items-center gap-2'>
                      <span className='text-muted-foreground'>
                        {status.value}
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        ({((status.value / totalTransactions) * 100).toFixed(1)}
                        %)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className='mt-6 pt-6 border-t'>
              <h4 className='font-semibold mb-4'>
                Informations supplémentaires
              </h4>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Montant moyen</p>
                  <p className='text-xl font-bold'>
                    {formatCurrency(totalAmount / totalTransactions)}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Taux de réussite</p>
                  <p className='text-xl font-bold'>
                    {(
                      ((summary.statusSummary.find(
                        (s: any) => s._id === 'completed'
                      )?.count || 0) /
                        totalTransactions) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default StatusTransactionDetail
