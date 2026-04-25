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

const STATUS_COLOR: Record<string, string> = {
  'En approbation': 'bg-blue-500',
  'En attente paiement': 'bg-amber-500',
  'Réussie': 'bg-emerald-500',
  'Échouée': 'bg-rose-500',
  'Rejetée': 'bg-red-600',
  'Remboursée': 'bg-slate-600',
}

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
  const statusSummary = Array.isArray(summary?.statusSummary)
    ? summary.statusSummary
    : []
  const safeTotalTransactions = totalTransactions > 0 ? totalTransactions : 1
  const successCount =
    (statusSummary.find((s: any) => s._id === 'completed')?.count || 0) +
    (statusSummary.find((s: any) => s._id === 'success')?.count || 0)

  return (
    <>
      {isPending ? (
        <Loading />
      ) : (
        <Card className='col-span-3'>
          <CardHeader>
            <CardTitle>Statut des transactions</CardTitle>
            <CardDescription>Details par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {statusChartData.map((status: any, i: number) => (
                <div key={i} className='flex items-center'>
                  <div
                    className={cn(
                      'mr-2 h-4 w-4 rounded-full',
                      STATUS_COLOR[status.name] ?? 'bg-slate-400'
                    )}
                  />
                  <div className='flex-1 flex justify-between items-center'>
                    <div className='font-medium'>{status.name}</div>
                    <div className='flex items-center gap-2'>
                      <span className='text-muted-foreground'>{status.value}</span>
                      <span className='text-xs text-muted-foreground'>
                        ({((status.value / safeTotalTransactions) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className='mt-6 pt-6 border-t'>
              <h4 className='font-semibold mb-4'>Informations supplementaires</h4>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Montant moyen</p>
                  <p className='text-xl font-bold'>
                    {formatCurrency(totalAmount / safeTotalTransactions)}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Taux de reussite</p>
                  <p className='text-xl font-bold'>
                    {((successCount / safeTotalTransactions) * 100).toFixed(1)}%
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
