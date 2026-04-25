import { useState } from 'react'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DollarSign,
  Scale,
} from 'lucide-react'
import { useGetTransactionSummaryQuery, TransactionPeriod } from '@/hooks/transactionHooks'
import {
  buildMonthlyChartData,
  buildStatusChartData,
  fillYearlyMonthlyData,
} from '@/lib/transactionChartData'
import { formatCurrency } from '@/lib/utils'
import KpiCard from './KpiCard'
import MembershipCard from './MembershipCard'
import MonthlyPreview from './MonthlyPreview'
import TransactionStatus from './TransactionStatus'
import StatusTransactionDetail from './StatusTransactionDetail'

const PERIOD_OPTIONS: { value: TransactionPeriod; label: string }[] = [
  { value: 'month', label: 'Ce mois' },
  { value: 'year', label: 'Cette annee' },
]

export default function BilanTransactions() {
  const [period, setPeriod] = useState<TransactionPeriod>('year')
  const { data: summary, isPending } = useGetTransactionSummaryQuery(period)

  const currentYear = new Date().getFullYear()

  const rpn = summary?.rpn?.summary ?? {
    totalTransactions: 0,
    totalCredit: 0,
    totalDebit: 0,
    netBalance: 0,
  }

  const monthlyChartData = fillYearlyMonthlyData(
    buildMonthlyChartData(summary?.rpn?.monthlySummary),
    currentYear
  )
  const statusChartData = buildStatusChartData(summary?.rpn?.statusSummary)

  const membershipPeriodLabel =
    period === 'year' ? `Annee ${currentYear}` : 'Mois en cours'

  const netBalanceClass =
    rpn.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'

  return (
    <div className='flex-1 space-y-6 p-4 md:p-8 pt-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <h2 className='text-3xl font-bold tracking-tight'>
          Tableau de bord financier
        </h2>

        <div className='flex rounded-lg border overflow-hidden'>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                period === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <section className='space-y-4'>
        <h3 className='text-lg font-semibold text-muted-foreground'>RPN</h3>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <KpiCard
            title='Transactions'
            value={rpn.totalTransactions}
            subtitle='Nombre total de transactions'
            icon={DollarSign}
            isPending={isPending}
          />
          <KpiCard
            title='Credit total'
            value={formatCurrency(rpn.totalCredit)}
            subtitle='Entrees de fonds'
            icon={ArrowUpIcon}
            isPending={isPending}
            iconClass='text-emerald-500'
            valueClass='text-emerald-600'
          />
          <KpiCard
            title='Debit total'
            value={formatCurrency(rpn.totalDebit)}
            subtitle='Sorties de fonds'
            icon={ArrowDownIcon}
            isPending={isPending}
            iconClass='text-rose-500'
            valueClass='text-rose-600'
          />
          <KpiCard
            title='Solde net'
            value={formatCurrency(rpn.netBalance)}
            subtitle='Credit - Debit'
            icon={Scale}
            isPending={isPending}
            valueClass={netBalanceClass}
          />
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

        <StatusTransactionDetail
          isPending={isPending}
          totalAmount={rpn.totalCredit}
          totalTransactions={rpn.totalTransactions}
          summary={{ statusSummary: summary?.rpn?.statusSummary }}
          statusChartData={statusChartData}
        />
      </section>

      <section className='space-y-4'>
        <h3 className='text-lg font-semibold text-muted-foreground'>
          Membership
        </h3>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <MembershipCard
            totalCredit={summary?.membership?.totalCredit ?? 0}
            deltaPercent={summary?.membership?.deltaPercent ?? null}
            isPending={isPending}
            periodLabel={membershipPeriodLabel}
          />
        </div>
      </section>
    </div>
  )
}
