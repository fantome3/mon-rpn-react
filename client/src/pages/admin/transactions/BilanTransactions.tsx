/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatMonth } from '@/lib/utils'
import { useGetTransactionSummaryQuery } from '@/hooks/transactionHooks'
import TransactionsTotales from './TransactionsTotales'
import MontantTotal from './MontantTotal'
import Credit_Transaction from './Credit_Transaction'
import Debit_Transaction from './Debit_Transaction'
import MonthlyPreview from './MonthlyPreview'
import TransactionStatus from './TransactionStatus'
import MonthlyTransactionNber from './MonthlyTransactionNber'
import StatusTransactionDetail from './StatusTransactionDetail'

export default function BilanTransactions() {
  const { data: summary, isPending } = useGetTransactionSummaryQuery()

  // Préparer les données pour le graphique mensuel
  const monthlyChartData = summary.monthlySummary
    ? [...summary.monthlySummary]
        .sort((a, b) => {
          // Trier par date (année puis mois)
          if (a._id.year !== b._id.year) {
            return a._id.year - b._id.year
          }
          return a._id.month - b._id.month
        })
        .map((item) => ({
          name: formatMonth(item._id.month, item._id.year),
          montant: item.total,
          transactions: item.count,
        }))
    : []

  // Préparer les données pour le graphique de statut
  const statusChartData = summary.statusSummary
    ? summary.statusSummary.map((item: any) => ({
        name:
          item._id === 'pending'
            ? 'En attente approbation'
            : item._id === 'completed'
            ? 'Complété'
            : item._id === 'awaiting_payment'
            ? 'En attente paiement'
            : 'Échoué',
        value: item.count,
      }))
    : []

  const global = summary?.summary?.[0] ?? null
  const totalTransactions = summary?.summary?.[0]?.totalTransactions ?? null
  const totalAmount = summary?.summary?.[0]?.totalAmount ?? null

  return (
    <div className='flex-1 space-y-4 p-4 md:p-8 pt-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-3xl font-bold tracking-tight'>
          Tableau de bord financier
        </h2>
      </div>

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Vue d'ensemble</TabsTrigger>
          <TabsTrigger value='analytics'>Analytique</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {global ? (
              <>
                <TransactionsTotales
                  totalTransactions={global.totalTransactions}
                  isPending={isPending}
                />

                <MontantTotal
                  totalAmount={global.totalAmount}
                  isPending={isPending}
                />

                <Credit_Transaction
                  totalCredit={global.totalCredit}
                  isPending={isPending}
                />

                <Debit_Transaction
                  totalDebit={global.totalDebit}
                  isPending={isPending}
                />
              </>
            ) : (
              ''
            )}
          </div>

          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
            <MonthlyPreview
              monthlyChartData={monthlyChartData}
              isPending={isPending}
            />

            <TransactionStatus
              statusChartData={statusChartData}
              isPending={isPending}
            />
          </div>
        </TabsContent>

        <TabsContent value='analytics' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
            <MonthlyTransactionNber
              monthlyChartData={monthlyChartData}
              isPending={isPending}
            />

            <StatusTransactionDetail
              isPending={isPending}
              totalAmount={totalAmount}
              totalTransactions={totalTransactions}
              summary={summary}
              statusChartData={statusChartData}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
